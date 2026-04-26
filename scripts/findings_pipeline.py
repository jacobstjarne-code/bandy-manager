#!/usr/bin/env python3
"""
Bandy-Brain Findings Pipeline

Läser öppna frågor från scripts/pipeline/questions.yaml,
kör analys mot bandygrytan_detailed.json, anropar Claude API,
och skriver nya findings till bandy-brain/src/pages/findings/.

Användning:
  python3 scripts/findings_pipeline.py              # kör alla öppna frågor
  python3 scripts/findings_pipeline.py --dry-run    # analysera utan att skriva
  python3 scripts/findings_pipeline.py --id Q001    # kör specifik fråga
  python3 scripts/findings_pipeline.py --limit 3    # max N findings

Exit-kod 0 = lyckades (även om inga nya findings skapades)
Exit-kod 1 = fel (API-nyckel saknas, parse-fel, etc.)
"""

import argparse
import json
import os
import sys
import re
from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).parent))

from pipeline.analysis import REGISTRY
from pipeline.feedback import load_feedback, get_type_weights, import_new_questions
from pipeline.generate import generate_finding
from pipeline.render import next_finding_number, write_finding, update_findings_index, _sv_date
from datetime import date


QUESTIONS_PATH = REPO_ROOT / "scripts" / "pipeline" / "questions.yaml"
BANDYGRYTAN_PATH = REPO_ROOT / "docs" / "data" / "bandygrytan_detailed.json"
FINDINGS_DIR = REPO_ROOT / "bandy-brain" / "src" / "pages" / "findings"
Q_FACTS_DIR = REPO_ROOT / "docs" / "findings" / "facts" / "questions"


def load_questions() -> list[dict]:
    return yaml.safe_load(QUESTIONS_PATH.read_text(encoding="utf-8")) or []


# ── Q-fact helpers ────────────────────────────────────────────────────────────

def _load_q_facts() -> dict[str, dict]:
    """Return {fact_id: data} for all Q-facts on disk."""
    q_facts = {}
    if not Q_FACTS_DIR.exists():
        return q_facts
    for f in sorted(Q_FACTS_DIR.glob("Q*.yaml")):
        data = yaml.safe_load(f.read_text(encoding="utf-8"))
        if data and "fact_id" in data:
            q_facts[data["fact_id"]] = data
    return q_facts


def _next_q_id(q_facts: dict) -> str:
    """Return next available Q-fact ID (Q001, Q002, ...)."""
    existing = {int(k[1:]) for k in q_facts if re.match(r"^Q\d{3}$", k)}
    n = 1
    while n in existing:
        n += 1
    return f"Q{n:03d}"


def _similarity(a: str, b: str) -> float:
    """Simple character-level similarity between two strings (0-1)."""
    a, b = a.lower().strip(), b.lower().strip()
    if not a or not b:
        return 0.0
    shorter, longer = (a, b) if len(a) <= len(b) else (b, a)
    # Count matching bigrams
    def bigrams(s):
        return [s[i:i+2] for i in range(len(s) - 1)]
    bg_short = bigrams(shorter)
    bg_long  = bigrams(longer)
    if not bg_short:
        return 1.0 if shorter in longer else 0.0
    matches = sum(1 for bg in bg_short if bg in bg_long)
    return matches / max(len(bg_short), len(bg_long))


def _find_duplicate_q(claim: str, q_facts: dict, threshold: float = 0.80,
                       api_key: str | None = None) -> str | None:
    """
    Return the fact_id of an existing Q-fact that is >threshold similar
    to the given claim. Returns None if no match found.

    Step 1: String-based bigram similarity (fast).
    Step 2: Claude semantic matching fallback (if api_key provided and no string match).
    """
    # 1. String match
    for fid, data in q_facts.items():
        if data.get("status") in ("answered", "closed"):
            continue
        existing_claim = data.get("claim", "")
        if _similarity(claim, existing_claim) > threshold:
            return fid

    # 2. Claude semantic matching fallback
    if api_key:
        return _claude_semantic_match(claim, q_facts, api_key)

    return None


def _claude_semantic_match(claim: str, q_facts: dict, api_key: str) -> str | None:
    """
    Ask Claude if claim semantically matches any open Q-fact.
    Returns matching fact_id or None.
    Uses claude-haiku for cost efficiency.
    """
    try:
        import anthropic
        import json as _json

        open_qs = [
            (fid, data["claim"])
            for fid, data in q_facts.items()
            if data.get("status") == "open"
        ][:50]  # max 50 to keep token count reasonable

        if not open_qs:
            return None

        q_list = "\n".join(f"- {fid}: {c}" for fid, c in open_qs)
        prompt = (
            f'Ny fråga: "{claim}"\n\n'
            f"Existerande öppna frågor:\n{q_list}\n\n"
            f"Returnera JSON: {{\"match\": \"Q012\"}} om en fråga är semantiskt ekvivalent "
            f"(samma fråga, annat ordval).\n"
            f"Returnera {{\"match\": null}} om ingen matchning finns.\n"
            f"Returnera BARA JSON."
        )

        client = anthropic.Anthropic(api_key=api_key)
        msg = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=100,
            messages=[{"role": "user", "content": prompt}],
        )
        import re as _re
        text = msg.content[0].text.strip()
        json_m = _re.search(r'\{.*\}', text, _re.DOTALL)
        if json_m:
            result = _json.loads(json_m.group(0))
            match = result.get("match")
            # Validate that the returned ID exists in our Q-facts
            if match and match in q_facts:
                return match
    except Exception as e:
        print(f"[WARN] Claude semantic match failed: {e}", file=sys.stderr)

    return None


def create_q_fact(
    claim: str,
    spawned_by_num: str,
    spawned_at_date,
    q_facts: dict,
    api_key: str | None = None,
) -> str | None:
    """
    Create a new Q-fact YAML file for `claim` spawned by finding `spawned_by_num`.
    Returns the new Q-fact ID, or the existing ID if a near-duplicate was found.
    Mutates `q_facts` in place.

    api_key: if provided, uses Claude semantic matching as fallback for dedup.
    """
    # Deduplicate (string match + optional Claude fallback)
    dup = _find_duplicate_q(claim, q_facts, api_key=api_key)
    if dup:
        return dup  # link to existing, don't create new

    q_id = _next_q_id(q_facts)
    slug = re.sub(r"[^a-z0-9]+", "_", claim.lower())[:40].strip("_")
    filename = f"{q_id}_{slug}.yaml"

    spawned_at_str = (
        spawned_at_date.isoformat()
        if hasattr(spawned_at_date, "isoformat")
        else str(spawned_at_date)
    )

    data = {
        "fact_id": q_id,
        "category": "questions",
        "claim": claim,
        "spawned_by": f"finding:{spawned_by_num}",
        "spawned_at": spawned_at_str,
        "status": "open",
        "verified_at": spawned_at_str,
        "verified_by": "code",
    }
    Q_FACTS_DIR.mkdir(parents=True, exist_ok=True)
    (Q_FACTS_DIR / filename).write_text(
        yaml.dump(data, allow_unicode=True, default_flow_style=False, sort_keys=False),
        encoding="utf-8",
    )
    q_facts[q_id] = data
    return q_id


def mark_q_answered(q_id: str, answered_by_num: str, q_facts: dict) -> None:
    """
    Set status=answered + answered_by on an existing Q-fact file.
    Mutates `q_facts` in place.
    """
    data = q_facts.get(q_id)
    if not data:
        return
    data["status"] = "answered"
    data["answered_by"] = f"finding:{answered_by_num}"
    # Find the file
    for f in sorted(Q_FACTS_DIR.glob(f"{q_id}_*.yaml")):
        f.write_text(
            yaml.dump(data, allow_unicode=True, default_flow_style=False, sort_keys=False),
            encoding="utf-8",
        )
        break


def append_answers_comment(finding_num: str, q_ids: list[str]) -> None:
    """
    Append <!-- answers: Q001 Q002 --> comment to a finding's index.astro.
    """
    if not q_ids:
        return
    astro_path = FINDINGS_DIR / finding_num.zfill(3) / "index.astro"
    if not astro_path.exists():
        return
    content = astro_path.read_text(encoding="utf-8")
    comment = f"<!-- answers: {' '.join(q_ids)} -->\n"
    if comment.strip() not in content:
        content += comment
        astro_path.write_text(content, encoding="utf-8")


def find_open_q_matching(claim: str, q_facts: dict, threshold: float = 0.80) -> str | None:
    """Find an open Q-fact whose claim matches the given claim above threshold."""
    for fid, data in q_facts.items():
        if data.get("status") != "open":
            continue
        if _similarity(claim, data.get("claim", "")) > threshold:
            return fid
    return None


def save_questions(questions: list[dict]) -> None:
    QUESTIONS_PATH.write_text(
        yaml.dump(questions, allow_unicode=True, default_flow_style=False, sort_keys=False),
        encoding="utf-8",
    )


def load_bandygrytan() -> dict:
    return json.loads(BANDYGRYTAN_PATH.read_text(encoding="utf-8"))


def get_existing_findings_meta() -> list[dict]:
    """Read title + date from existing findings for index rebuild."""
    meta = []
    for d in sorted(FINDINGS_DIR.iterdir(), reverse=True):
        if not (d.is_dir() and d.name.isdigit()):
            continue
        astro = d / "index.astro"
        if not astro.exists():
            continue
        content = astro.read_text(encoding="utf-8")
        title_m = re.search(r'title="Finding \d+ — (.+?)"', content)
        meta_m = re.search(r'<p class="finding-meta">Finding (\d+) · (.+?)</p>', content)
        excerpt_m = re.search(r'<p class="finding-card__excerpt">(.+?)</p>', content, re.DOTALL)
        if title_m and meta_m:
            meta.append({
                "num": d.name,
                "title": title_m.group(1),
                "date": meta_m.group(2).strip(),
                "excerpt": excerpt_m.group(1).strip()[:180].replace("\n", " ") if excerpt_m else "",
            })
    return meta


def run_pipeline(args: argparse.Namespace) -> int:
    questions = load_questions()
    data = load_bandygrytan()
    q_facts = _load_q_facts()

    # Steg D: Hantera review-flagged issues (körs alltid om token finns)
    github_token = os.environ.get("GITHUB_TOKEN", "")
    github_repo = os.environ.get("GITHUB_REPOSITORY", "")
    if github_token and github_repo and not args.dry_run:
        try:
            from pipeline.review_flags import handle_review_flags
            n_flags = handle_review_flags(github_token, github_repo)
            if n_flags:
                print(f"{n_flags} ny(a) review-flagged issue(s) loggade i REVIEW_FLAGS.md.")
        except Exception as e:
            print(f"  review_flags: oväntat fel: {e}")

    # Import new questions from GitHub Issues
    if not args.dry_run and not args.id:
        questions, n_imported = import_new_questions(questions, q_facts=q_facts)
        if n_imported:
            print(f"{n_imported} ny(a) fråga(or) importerade från GitHub Issues.")
            save_questions(questions)

    # Filter
    open_qs = [q for q in questions if q.get("status") == "open"]
    if args.id:
        open_qs = [q for q in open_qs if q["id"] == args.id]
        if not open_qs:
            print(f"Fråga {args.id} hittades inte eller är inte öppen.", file=sys.stderr)
            return 1

    if not open_qs:
        print("Inga öppna frågor att besvara.")
        return 0

    # Weight by feedback
    feedback = load_feedback(use_cache=not args.no_cache)
    weights = get_type_weights(feedback, questions)

    # Sort by weight (higher = first)
    open_qs.sort(key=lambda q: weights.get(q.get("analysis_type", ""), 1.0), reverse=True)

    if args.limit:
        open_qs = open_qs[:args.limit]

    print(f"Kör {len(open_qs)} fråga(or)...\n")

    new_findings = 0
    q_id_to_idx = {q["id"]: i for i, q in enumerate(questions)}

    for q in open_qs:
        qid = q["id"]
        atype = q.get("analysis_type")
        fn = REGISTRY.get(atype)

        if not fn:
            print(f"  {qid}: okänd analysis_type '{atype}' — hoppar över")
            continue

        print(f"  {qid}: {q['question'][:70]}")

        # Analysis
        try:
            result = fn(data, q.get("params", {}))
        except Exception as e:
            print(f"    ✗ Analysen kraschade: {e}")
            continue

        if args.dry_run:
            print(f"    → [dry-run] analys OK: {list(result.keys())}")
            continue

        # Generate
        try:
            finding = generate_finding(q["question"], q.get("source_finding", "?"), result)
        except Exception as e:
            print(f"    ✗ Claude-anrop misslyckades: {e}")
            continue

        # Write
        num = next_finding_number()
        out_path = write_finding(finding, num)
        print(f"    ✓ Finding {str(num).zfill(3)} skriven: {out_path.relative_to(REPO_ROOT)}")

        num_str = str(num).zfill(3)

        # Mark answered in questions.yaml
        idx = q_id_to_idx.get(qid)
        if idx is not None:
            questions[idx]["status"] = "answered"
            questions[idx]["answered_by"] = num_str

        # Step B: If there's an open Q-fact matching the question being answered, close it
        answered_q_ids: list[str] = []
        matching_q_id = find_open_q_matching(q.get("question", ""), q_facts)
        if matching_q_id:
            mark_q_answered(matching_q_id, num_str, q_facts)
            answered_q_ids.append(matching_q_id)
            print(f"    → Q-fact {matching_q_id} stängd (answered)")

        # Step A: Extract vidare_fragor → create Q-facts + add to questions.yaml
        for vf in finding.get("vidare_fragor", []):
            # Add to questions.yaml (existing behaviour)
            new_q = {
                "id": f"Q{len(questions)+1:03d}",
                "source_finding": num_str,
                "question": vf,
                "status": "open",
                "analysis_type": _infer_type(vf),
                "params": {"series": "herr"},
            }
            questions.append(new_q)
            print(f"    + Ny fråga tillagd: {new_q['id']}")

            # Create/link Q-fact
            q_id = create_q_fact(
                claim=vf,
                spawned_by_num=num_str,
                spawned_at_date=date.today(),
                q_facts=q_facts,
                api_key=os.environ.get("ANTHROPIC_API_KEY"),
            )
            if q_id and q_id not in answered_q_ids:
                # Check if this was a dedup link (already existed)
                existing = q_facts.get(q_id, {})
                if existing.get("spawned_by") != f"finding:{num_str}":
                    print(f"    ~ Dublikat mot befintlig Q-fact: {q_id}")
                else:
                    print(f"    + Q-fact skapad: {q_id}")

        # Step B cont.: Append <!-- answers: ... --> to finding's index.astro
        if answered_q_ids:
            append_answers_comment(num_str, answered_q_ids)

        new_findings += 1

    if not args.dry_run:
        save_questions(questions)
        # Rebuild findings index
        meta = get_existing_findings_meta()
        update_findings_index(meta)
        print(f"\n{new_findings} finding(s) skapade. Index uppdaterat.")

    return 0


def _infer_type(question: str) -> str:
    """Naively guess analysis_type from question text."""
    q = question.lower()
    if "halvtid" in q and ("ledning" in q or "lead" in q) and ("storlek" in q or "1-0" in q or "2-0" in q):
        return "ht_lead_by_size"
    if "halvtid" in q and ("hemma" in q or "borta" in q):
        return "ht_lead_home_away"
    if "comeback" in q or "vändning" in q:
        return "comeback_timing"
    if "hörn" in q and ("hemma" in q or "borta" in q):
        return "corner_home_away"
    if "hörn" in q and ("lag" in q or "bättre" in q or any(t in q for t in ["vsk", "nässjö", "villa", "edsbyn", "bollnäs", "broberg", "hammarby", "sandviken", "ljusdal"])):
        return "corner_by_team"
    if "hörn" in q and ("dam" in q or "herr" in q or "serie" in q):
        return "corner_efficiency_comparison"
    if ("dam" in q or "herr" in q) and ("minut" in q or "fördeln" in q):
        return "time_distribution_comparison"
    if "minut" in q and ("kluster" in q or "konsentr" in q or "period" in q):
        return "time_split"
    if "slutspel" in q or "kvartsfinal" in q or "semifinal" in q:
        return "goals_by_phase_detail"
    if "jämn" in q or "marginal" in q or "ledning" in q:
        return "goals_by_margin"
    return "corner_by_team" if "hörn" in q else "unknown"


def main() -> None:
    parser = argparse.ArgumentParser(description="Bandy-Brain Findings Pipeline")
    parser.add_argument("--dry-run", action="store_true", help="Analysera utan att skriva filer")
    parser.add_argument("--id", help="Kör specifik fråga (t.ex. Q001)")
    parser.add_argument("--limit", type=int, help="Max antal findings att skapa")
    parser.add_argument("--no-cache", action="store_true", help="Hämta feedback live från GitHub")
    args = parser.parse_args()
    sys.exit(run_pipeline(args))


if __name__ == "__main__":
    main()
