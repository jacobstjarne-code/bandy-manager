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


def load_questions() -> list[dict]:
    return yaml.safe_load(QUESTIONS_PATH.read_text(encoding="utf-8")) or []


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

    # Import new questions from GitHub Issues
    if not args.dry_run and not args.id:
        questions, n_imported = import_new_questions(questions)
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

        # Mark answered
        idx = q_id_to_idx.get(qid)
        if idx is not None:
            questions[idx]["status"] = "answered"
            questions[idx]["answered_by"] = str(num).zfill(3)

        # Extract vidare_fragor → add to questions
        for vf in finding.get("vidare_fragor", []):
            new_q = {
                "id": f"Q{len(questions)+1:03d}",
                "source_finding": str(num).zfill(3),
                "question": vf,
                "status": "open",
                "analysis_type": _infer_type(vf),
                "params": {"series": "herr"},
            }
            questions.append(new_q)
            print(f"    + Ny fråga tillagd: {new_q['id']}")

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
    return "unknown"


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
