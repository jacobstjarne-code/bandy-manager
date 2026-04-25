"""
Reads thumbs-up/thumbs-down feedback and new questions from GitHub Issues.

Labels:
  finding-feedback  — title "Finding NNN: 👍" or "Finding NNN: 👎"
  new-question      — title is the question text, body (optional) is analysis_type hint

Pipeline uses feedback to weight which analysis types to prioritise,
and imports new-question issues into questions.yaml automatically.
"""

import json
import os
import re
import urllib.request
import urllib.request as _ur
from collections import defaultdict
from pathlib import Path

REPO = "jacobstjarne-code/bandy-manager"
CACHE_PATH = Path(__file__).parent / "feedback_cache.json"


def _gh_headers() -> dict:
    token = os.environ.get("GITHUB_TOKEN", "")
    return {
        "Accept": "application/vnd.github+json",
        "User-Agent": "bandy-brain-pipeline",
        **({"Authorization": f"Bearer {token}"} if token else {}),
    }


def _fetch_issues(label: str) -> list[dict]:
    url = f"https://api.github.com/repos/{REPO}/issues?labels={label}&state=open&per_page=100"
    req = urllib.request.Request(url, headers=_gh_headers())
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read())
    except Exception:
        return []


def _close_issue_with_comment(issue_number: int, comment: str) -> None:
    """Add a comment and close the issue."""
    token = os.environ.get("GITHUB_TOKEN", "")
    if not token:
        return
    headers = {**_gh_headers(), "Content-Type": "application/json"}

    # Post comment
    comment_url = f"https://api.github.com/repos/{REPO}/issues/{issue_number}/comments"
    comment_req = urllib.request.Request(
        comment_url,
        data=json.dumps({"body": comment}).encode(),
        headers=headers,
        method="POST",
    )
    try:
        urllib.request.urlopen(comment_req, timeout=10)
    except Exception:
        pass

    # Close issue
    close_url = f"https://api.github.com/repos/{REPO}/issues/{issue_number}"
    close_req = urllib.request.Request(
        close_url,
        data=json.dumps({"state": "closed"}).encode(),
        headers=headers,
        method="PATCH",
    )
    try:
        urllib.request.urlopen(close_req, timeout=10)
    except Exception:
        pass


def import_new_questions(questions: list[dict]) -> tuple[list[dict], int]:
    """
    Fetch open issues with label 'new-question', add them to questions list.
    Closes each issue after import with a confirmation comment.
    Returns (updated_questions, count_added).
    """
    issues = _fetch_issues("new-question")
    existing_texts = {q["question"].strip().lower() for q in questions}
    added = 0

    for issue in issues:
        title = issue.get("title", "").strip()
        if not title or title.lower() in existing_texts:
            _close_issue_with_comment(
                issue["number"],
                "Frågan finns redan i pipelinen — ingen ny rad skapad."
            )
            continue

        new_q = {
            "id": f"Q{len(questions) + 1:03d}",
            "source_finding": "?",
            "question": title,
            "status": "open",
            "analysis_type": _infer_type_from_text(title),
            "params": {"series": "herr"},
        }
        questions.append(new_q)
        existing_texts.add(title.lower())
        added += 1

        _close_issue_with_comment(
            issue["number"],
            f"Tillagd som {new_q['id']} i pipelinen. Besvaras vid nästa körning."
        )

    return questions, added


def _infer_type_from_text(question: str) -> str:
    q = question.lower()
    if "halvtid" in q and ("storlek" in q or "1-0" in q or "2-0" in q):
        return "ht_lead_by_size"
    if "halvtid" in q and ("hemma" in q or "borta" in q):
        return "ht_lead_home_away"
    if "comeback" in q or "vändning" in q:
        return "comeback_timing"
    if "hörn" in q and ("hemma" in q or "borta" in q):
        return "corner_home_away"
    if "hörn" in q and ("lag" in q or "bättre" in q or any(team in q for team in ["vsk", "nässjö", "villa", "edsbyn", "bollnäs", "broberg", "hammarby", "sandviken", "edsbyns", "ljusdal"])):
        return "corner_by_team"
    if "hörn" in q and ("dam" in q or "herr" in q):
        return "corner_efficiency_comparison"
    if ("dam" in q or "herr" in q) and ("minut" in q or "fördeln" in q):
        return "time_distribution_comparison"
    if "minut" in q and ("kluster" in q or "period" in q):
        return "time_split"
    if "slutspel" in q or "kvartsfinal" in q or "semifinal" in q:
        return "goals_by_phase_detail"
    if "jämn" in q or "marginal" in q or "ledning" in q:
        return "goals_by_margin"
    return "corner_by_team" if "hörn" in q else "unknown"


def load_feedback(use_cache: bool = True, label: str = "finding-feedback") -> dict:
    """
    Returns:
      {
        "by_finding": {"007": {"up": 2, "down": 0}, ...},
        "by_analysis_type": {"ht_lead_by_size": {"up": 3, "down": 1}, ...},
        "finding_types": {"007": "ht_lead_by_size", ...}  # from questions.yaml
      }
    """
    if use_cache and CACHE_PATH.exists():
        return json.loads(CACHE_PATH.read_text())

    issues = _fetch_issues(label)
    by_finding: dict[str, dict] = defaultdict(lambda: {"up": 0, "down": 0})

    for issue in issues:
        title = issue.get("title", "")
        m = re.match(r"Finding\s+(\d+):\s*(👍|👎|thumbs.?up|thumbs.?down)", title, re.IGNORECASE)
        if not m:
            continue
        num = m.group(1).zfill(3)
        vote = "up" if "👍" in m.group(2) or "up" in m.group(2).lower() else "down"
        by_finding[num][vote] += 1

    result = {"by_finding": dict(by_finding)}
    _cache(result)
    return result


def get_type_weights(feedback: dict, questions: list[dict]) -> dict[str, float]:
    """
    Map analysis_type → weight (higher = pipeline prioritises more).
    Base weight 1.0. Each thumbs-up on a finding of that type adds 0.3.
    Each thumbs-down subtracts 0.2 (floor 0.1).
    """
    # Build finding → analysis_type from questions
    finding_to_type: dict[str, str] = {}
    for q in questions:
        if q.get("status") == "answered" and q.get("answered_by"):
            finding_to_type[q["answered_by"]] = q.get("analysis_type", "")

    weights: dict[str, float] = defaultdict(lambda: 1.0)
    by_finding = feedback.get("by_finding", {})

    for finding_num, votes in by_finding.items():
        atype = finding_to_type.get(finding_num)
        if not atype:
            continue
        weights[atype] += votes.get("up", 0) * 0.3
        weights[atype] -= votes.get("down", 0) * 0.2
        weights[atype] = max(0.1, weights[atype])

    return dict(weights)


def _cache(data: dict) -> None:
    CACHE_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False))
