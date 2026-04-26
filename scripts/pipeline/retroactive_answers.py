#!/usr/bin/env python3
"""
Steg 1.3 — Retroaktiv Q-svar-pass (LLM)

För varje finding (46 stycken): skicka ett Claude-anrop med
findingens titel + tolkningstext + lista av öppna Q-claims.
Claude identifierar vilka Q-IDn som besvaras av findingen.

Uppdaterar:
- Q-fact YAML-filer med status: answered + answered_by
- docs/findings/Q_RETROACTIVE_ANSWERS_2026-04-26.md (rapport)

Kör med:
  ANTHROPIC_API_KEY=... python3.11 scripts/pipeline/retroactive_answers.py
"""

import json
import os
import re
import sys
import time
from pathlib import Path

import yaml
import anthropic

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
Q_FACTS_DIR = REPO_ROOT / "docs" / "findings" / "facts" / "questions"
FINDINGS_DIR = REPO_ROOT / "bandy-brain" / "src" / "pages" / "findings"
REPORT_PATH = REPO_ROOT / "docs" / "findings" / "Q_RETROACTIVE_ANSWERS_2026-04-26.md"

# Model to use for matching
MODEL = "claude-haiku-4-5-20251001"
MAX_Q_PER_BATCH = 30


def load_q_facts() -> dict[str, dict]:
    """Load all open Q-facts."""
    q_facts = {}
    for f in sorted(Q_FACTS_DIR.glob("Q*.yaml")):
        data = yaml.safe_load(f.read_text(encoding="utf-8"))
        if data and data.get("status") == "open":
            q_facts[data["fact_id"]] = data
    return q_facts


def extract_finding_content(astro_path: Path) -> tuple[str, str]:
    """Extract title and tolkning section from a finding's index.astro."""
    content = astro_path.read_text(encoding="utf-8")

    # Extract title from meta
    title_m = re.search(r'Finding \d+ — ([^"]+)"', content)
    title = title_m.group(0) if title_m else astro_path.parent.name

    # Try to extract tolkning section
    # Look for finding-section-label containing "Tolkning"
    tolk_m = re.search(
        r'finding-section-label[^>]*>Tolkning</p>(.*?)</div>',
        content,
        re.DOTALL
    )
    if tolk_m:
        text = re.sub(r'<[^>]+>', ' ', tolk_m.group(1))
        text = re.sub(r'\s+', ' ', text).strip()
    else:
        # Fall back to description meta
        desc_m = re.search(r'description="([^"]+)"', content)
        text = desc_m.group(1) if desc_m else ""

    return title, text


def ask_claude_matching(
    client: anthropic.Anthropic,
    finding_num: str,
    finding_title: str,
    finding_text: str,
    open_qs: list[tuple[str, str]],  # list of (q_id, claim)
) -> list[str]:
    """
    Ask Claude which Q-IDs are answered by this finding.
    Returns list of matched Q-IDs.
    """
    q_list = "\n".join(f"- {qid}: {claim}" for qid, claim in open_qs)

    prompt = f"""Du är en expert på bandy-statistik. En ny finding har analyserats.

Finding {finding_num}: {finding_title}
Tolkning: {finding_text[:600]}

Nedan följer öppna forskningsfrågor (Q-facts). Identifiera vilka av dessa frågor
som besvaras direkt eller indirekt av denna finding.

En fråga räknas som besvarad om finding:en tillhandahåller konkret data eller slutsatser
som svarar på frågan, även om svaret är "det finns ingen data" eller "resultaten pekar mot X".

Öppna frågor:
{q_list}

Returnera ENBART ett JSON-objekt med formatet:
{{"answered": ["Q012", "Q045"], "reasoning": "kort motivering"}}

Returnera bara JSON, ingen annan text."""

    try:
        msg = client.messages.create(
            model=MODEL,
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}],
        )
        text = msg.content[0].text.strip()
        # Extract JSON
        json_m = re.search(r'\{.*\}', text, re.DOTALL)
        if json_m:
            result = json.loads(json_m.group(0))
            answered = result.get("answered", [])
            # Filter to only valid Q-IDs
            valid_ids = {qid for qid, _ in open_qs}
            return [qid for qid in answered if qid in valid_ids]
    except Exception as e:
        print(f"  [ERR] Finding {finding_num}: {e}", file=sys.stderr)
    return []


def update_q_fact_yaml(q_id: str, finding_num: str) -> None:
    """Update Q-fact YAML to mark as answered."""
    # Find the file
    matching = list(Q_FACTS_DIR.glob(f"{q_id}_*.yaml"))
    if not matching:
        matching = list(Q_FACTS_DIR.glob(f"{q_id}.yaml"))
    if not matching:
        print(f"  [WARN] Could not find YAML file for {q_id}", file=sys.stderr)
        return

    yaml_path = matching[0]
    data = yaml.safe_load(yaml_path.read_text(encoding="utf-8"))
    if not data:
        return

    data["status"] = "answered"
    data["answered_by"] = f"finding:{finding_num}"
    data["answered_at"] = "2026-04-26"

    yaml_path.write_text(
        yaml.dump(data, allow_unicode=True, default_flow_style=False, sort_keys=False),
        encoding="utf-8"
    )


def main():
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY inte satt", file=sys.stderr)
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    # Load Q-facts
    print("Laddar Q-facts...", file=sys.stderr)
    q_facts = load_q_facts()
    print(f"  {len(q_facts)} öppna Q-facts laddade.", file=sys.stderr)

    # Build list of (q_id, claim) for batching
    all_open = [(qid, data["claim"]) for qid, data in sorted(q_facts.items())]

    # Load all findings
    finding_dirs = sorted(FINDINGS_DIR.iterdir())
    print(f"  {len(finding_dirs)} findings hittade.", file=sys.stderr)

    # Results tracking
    finding_matches: dict[str, list[str]] = {}  # finding_num -> [q_ids]
    answered_q: dict[str, str] = {}  # q_id -> finding_num

    # Process each finding
    for finding_dir in finding_dirs:
        astro_path = finding_dir / "index.astro"
        if not astro_path.exists():
            continue

        finding_num = finding_dir.name  # e.g., "001"
        title, text = extract_finding_content(astro_path)

        if not text:
            print(f"  [SKIP] Finding {finding_num}: ingen tolkningstext", file=sys.stderr)
            continue

        print(f"Processing Finding {finding_num}...", file=sys.stderr, end=" ")

        # Skip Q-facts already answered by this finding
        remaining_open = [(qid, claim) for qid, claim in all_open
                          if qid not in answered_q]

        if not remaining_open:
            print("inga öppna Qn kvar", file=sys.stderr)
            break

        # Batch in groups of MAX_Q_PER_BATCH
        matched_ids = []
        for batch_start in range(0, len(remaining_open), MAX_Q_PER_BATCH):
            batch = remaining_open[batch_start:batch_start + MAX_Q_PER_BATCH]
            batch_matches = ask_claude_matching(
                client, finding_num, title, text, batch
            )
            matched_ids.extend(batch_matches)
            if len(remaining_open) > MAX_Q_PER_BATCH:
                time.sleep(0.5)  # rate limit

        finding_matches[finding_num] = matched_ids
        print(f"{len(matched_ids)} matchningar", file=sys.stderr)

        # Record answers
        for q_id in matched_ids:
            if q_id not in answered_q:
                answered_q[q_id] = finding_num

        time.sleep(0.3)  # be gentle on rate limits

    # Update YAML files
    print(f"\nUppdaterar {len(answered_q)} Q-fact YAML-filer...", file=sys.stderr)
    for q_id, finding_num in answered_q.items():
        update_q_fact_yaml(q_id, finding_num)
        print(f"  {q_id} → finding:{finding_num}", file=sys.stderr)

    # Still-open Q-IDs
    still_open = [qid for qid in sorted(q_facts.keys()) if qid not in answered_q]

    # Write report
    lines = [
        "# Q — Retroaktiva svar — 2026-04-26",
        "",
        f"Totalt {len(q_facts)} öppna Q-facts analyserade mot {len(finding_dirs)} findings.",
        f"**{len(answered_q)} Qn besvarade retroaktivt.**",
        f"**{len(still_open)} Qn förblir öppna.**",
        "",
        "---",
        "",
        "## Per finding — matchade Q-IDn",
        "",
    ]

    for finding_num in sorted(finding_matches.keys()):
        matched = finding_matches[finding_num]
        if matched:
            lines.append(f"### Finding {finding_num}")
            lines.append(f"Matchade: {', '.join(sorted(matched))}")
            lines.append("")

    lines += [
        "---",
        "",
        "## Besvarade Q-IDn (totalt)",
        "",
        "| Q-ID | Besvarad av |",
        "|------|------------|",
    ]
    for q_id in sorted(answered_q.keys()):
        lines.append(f"| {q_id} | finding:{answered_q[q_id]} |")

    lines += [
        "",
        "---",
        "",
        "## Fortfarande öppna Q-IDn",
        "",
        f"*{len(still_open)} Qn utan matchande finding.*",
        "",
    ]
    for q_id in still_open:
        claim = q_facts[q_id].get("claim", "")[:80]
        lines.append(f"- **{q_id}**: {claim}")

    REPORT_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"\nRapport skriven: {REPORT_PATH}", file=sys.stderr)
    print(f"\nSammanfattning: {len(answered_q)} besvarade, {len(still_open)} öppna")


if __name__ == "__main__":
    main()
