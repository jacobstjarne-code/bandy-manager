#!/usr/bin/env python3
"""
Steg 2.1-2.2 — Embeddings-baserad dedup av Q-facts

Delar 208 Q-facts i batchar om 30 och ber Claude identifiera
semantiska duplikat och relaterade par inom/mellan batcharna.

Output: docs/findings/DEDUP_2026-04-26.md

Kör med:
  ANTHROPIC_API_KEY=... python3.11 scripts/pipeline/dedup_existing.py
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
REPORT_PATH = REPO_ROOT / "docs" / "findings" / "DEDUP_2026-04-26.md"

MODEL = "claude-haiku-4-5-20251001"
BATCH_SIZE = 30


def load_open_q_facts() -> list[tuple[str, str]]:
    """Load all open Q-facts as list of (q_id, claim)."""
    results = []
    for f in sorted(Q_FACTS_DIR.glob("Q*.yaml")):
        data = yaml.safe_load(f.read_text(encoding="utf-8"))
        if data and data.get("status") in ("open", "answered"):
            results.append((data["fact_id"], data.get("claim", "")))
    return results


def find_duplicates_in_batch(
    client: anthropic.Anthropic,
    batch: list[tuple[str, str]],
    batch_label: str,
) -> list[dict]:
    """Ask Claude to identify duplicates within a batch."""
    q_list = "\n".join(f"- {qid}: {claim}" for qid, claim in batch)

    prompt = f"""Nedan följer en lista med forskningsfrågor om bandy-statistik ({batch_label}).

{q_list}

Identifiera par av frågor som är semantiska duplikat (samma fråga formulerad på olika sätt)
eller nära relaterade (handlar om nästan samma sak men med olika vinkel).

Returnera ENBART JSON med formatet:
{{
  "duplicates": [
    {{"q1": "Q001", "q2": "Q002", "reason": "kort förklaring"}}
  ],
  "related": [
    {{"q1": "Q003", "q2": "Q004", "reason": "kort förklaring"}}
  ]
}}

Var konservativ: markera bara par som verkligen är duplikat eller nära relaterade.
Returnera bara JSON, ingen annan text."""

    try:
        msg = client.messages.create(
            model=MODEL,
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )
        text = msg.content[0].text.strip()
        json_m = re.search(r'\{.*\}', text, re.DOTALL)
        if json_m:
            return json.loads(json_m.group(0))
    except Exception as e:
        print(f"  [ERR] {batch_label}: {e}", file=sys.stderr)
    return {"duplicates": [], "related": []}


def find_duplicates_cross_batch(
    client: anthropic.Anthropic,
    batch_a: list[tuple[str, str]],
    batch_b: list[tuple[str, str]],
    label: str,
) -> dict:
    """Find duplicates between two different batches."""
    list_a = "\n".join(f"- {qid}: {claim}" for qid, claim in batch_a)
    list_b = "\n".join(f"- {qid}: {claim}" for qid, claim in batch_b)

    prompt = f"""Nedan följer två listor med forskningsfrågor om bandy-statistik.

Lista A:
{list_a}

Lista B:
{list_b}

Identifiera par (ett från Lista A, ett från Lista B) som är semantiska duplikat
eller nära relaterade.

Returnera ENBART JSON:
{{
  "duplicates": [
    {{"q1": "Q001", "q2": "Q045", "reason": "kort förklaring"}}
  ],
  "related": [
    {{"q1": "Q003", "q2": "Q067", "reason": "kort förklaring"}}
  ]
}}

Var konservativ. Returnera bara JSON."""

    try:
        msg = client.messages.create(
            model=MODEL,
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )
        text = msg.content[0].text.strip()
        json_m = re.search(r'\{.*\}', text, re.DOTALL)
        if json_m:
            return json.loads(json_m.group(0))
    except Exception as e:
        print(f"  [ERR] Cross-batch {label}: {e}", file=sys.stderr)
    return {"duplicates": [], "related": []}


def main():
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY inte satt", file=sys.stderr)
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    print("Laddar Q-facts...", file=sys.stderr)
    all_qs = load_open_q_facts()
    print(f"  {len(all_qs)} Q-facts laddade.", file=sys.stderr)

    # Split into batches
    batches = []
    for i in range(0, len(all_qs), BATCH_SIZE):
        batches.append(all_qs[i:i + BATCH_SIZE])

    print(f"  {len(batches)} batchar skapade.", file=sys.stderr)

    all_duplicates = []
    all_related = []

    # Intra-batch analysis
    print("\nIntra-batch analys...", file=sys.stderr)
    for i, batch in enumerate(batches):
        label = f"Batch {i+1}/{len(batches)}"
        print(f"  {label} ({len(batch)} Qn)...", file=sys.stderr)
        result = find_duplicates_in_batch(client, batch, label)
        all_duplicates.extend(result.get("duplicates", []))
        all_related.extend(result.get("related", []))
        time.sleep(0.5)

    # Cross-batch analysis (only adjacent batches to limit API calls)
    print("\nCross-batch analys (angränsande batchar)...", file=sys.stderr)
    for i in range(len(batches) - 1):
        label = f"Batch {i+1} × Batch {i+2}"
        print(f"  {label}...", file=sys.stderr)
        result = find_duplicates_cross_batch(client, batches[i], batches[i+1], label)
        all_duplicates.extend(result.get("duplicates", []))
        all_related.extend(result.get("related", []))
        time.sleep(0.5)

    # Deduplicate pairs (same pair may appear in both directions)
    def normalize_pair(pair):
        q1, q2 = pair["q1"], pair["q2"]
        return (min(q1, q2), max(q1, q2))

    seen_dups = set()
    unique_dups = []
    for d in all_duplicates:
        key = normalize_pair(d)
        if key not in seen_dups:
            seen_dups.add(key)
            unique_dups.append(d)

    seen_rel = set()
    unique_rel = []
    for r in all_related:
        key = normalize_pair(r)
        if key not in seen_rel and key not in seen_dups:
            seen_rel.add(key)
            unique_rel.append(r)

    # Build claim lookup for report
    claim_lookup = {qid: claim for qid, claim in all_qs}

    # Write report
    lines = [
        "# Dedup-rapport — 2026-04-26",
        "",
        f"Totalt {len(all_qs)} Q-facts analyserade i {len(batches)} batchar.",
        "",
        "---",
        "",
        "## Auto-merge-kandidater (troliga duplikat)",
        "",
        "| Q-id 1 | Q-id 2 | Orsak | Claims |",
        "|--------|--------|-------|--------|",
    ]

    for d in sorted(unique_dups, key=lambda x: x["q1"]):
        q1, q2 = d["q1"], d["q2"]
        reason = d.get("reason", "")[:60]
        c1 = claim_lookup.get(q1, "")[:50]
        c2 = claim_lookup.get(q2, "")[:50]
        lines.append(f"| {q1} | {q2} | {reason} | \"{c1}\" / \"{c2}\" |")

    lines += [
        "",
        "## Relaterade (behåll båda, länka)",
        "",
        "| Q-id 1 | Q-id 2 | Orsak |",
        "|--------|--------|-------|",
    ]

    for r in sorted(unique_rel, key=lambda x: x["q1"]):
        q1, q2 = r["q1"], r["q2"]
        reason = r.get("reason", "")[:80]
        lines.append(f"| {q1} | {q2} | {reason} |")

    lines += [
        "",
        "---",
        "",
        "## Statistik",
        "",
        f"- Totalt Qn analyserade: {len(all_qs)}",
        f"- Duplikater hittade: {len(unique_dups)}",
        f"- Relaterade par: {len(unique_rel)}",
        "",
        "## Nästa steg",
        "",
        "Granska tabellen ovan. För varje duplikat:",
        "- Stäng den nyare med `status: closed, closed_reason: superseded, superseded_by: <äldre-Q-id>`",
        "- Uppdatera den äldre med `related_questions: [den stängda]`",
        "",
        "För relaterade par:",
        "- Lägg till `related_questions` i båda YAML-filerna",
    ]

    REPORT_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"\nRapport skriven: {REPORT_PATH}", file=sys.stderr)
    print(f"Duplikat: {len(unique_dups)}, Relaterade: {len(unique_rel)}")


if __name__ == "__main__":
    main()
