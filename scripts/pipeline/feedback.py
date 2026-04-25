"""
Reads thumbs-up/thumbs-down feedback from GitHub Issues.
Issues are tagged: "finding-feedback" label, title "Finding NNN: 👍" or "Finding NNN: 👎"

Pipeline uses feedback to weight which analysis types to prioritise.
"""

import json
import os
import re
import urllib.request
from collections import defaultdict
from pathlib import Path

REPO = "jacobstjarne-code/bandy-manager"
CACHE_PATH = Path(__file__).parent / "feedback_cache.json"


def _fetch_issues() -> list[dict]:
    """Fetch issues labelled 'finding-feedback' via GitHub API."""
    token = os.environ.get("GITHUB_TOKEN", "")
    url = f"https://api.github.com/repos/{REPO}/issues?labels=finding-feedback&state=open&per_page=100"
    req = urllib.request.Request(url, headers={
        "Accept": "application/vnd.github+json",
        "User-Agent": "bandy-brain-pipeline",
        **({"Authorization": f"Bearer {token}"} if token else {}),
    })
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read())
    except Exception:
        return []


def load_feedback(use_cache: bool = True) -> dict:
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

    issues = _fetch_issues()
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
