#!/usr/bin/env python3
"""
Backfill Q-facts from existing findings (001–046).

For each finding in bandy-brain/src/pages/findings/:
  1. Parse the "Vidare frågor" <li> elements from the HTML.
  2. Filter out questions that are too short (<20 chars) or too generic.
  3. Deduplicate against already-created Q-facts (>80% bigram similarity).
  4. Create Q-fact YAML files in docs/findings/facts/questions/.
  5. Write docs/findings/BACKFILL_2026-04-26.md with a report.

Usage:
  python3 scripts/pipeline/backfill_questions.py
"""

import re
import sys
from datetime import date
from pathlib import Path
from typing import Optional, Dict, List, Tuple

import yaml

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
FINDINGS_DIR = REPO_ROOT / "bandy-brain" / "src" / "pages" / "findings"
Q_FACTS_DIR = REPO_ROOT / "docs" / "findings" / "facts" / "questions"
REPORT_PATH = REPO_ROOT / "docs" / "findings" / "BACKFILL_2026-04-26.md"


# ── Helpers ───────────────────────────────────────────────────────────────────

def _bigrams(s: str) -> list[str]:
    return [s[i:i+2] for i in range(len(s) - 1)]


def _similarity(a: str, b: str) -> float:
    a, b = a.lower().strip(), b.lower().strip()
    if not a or not b:
        return 0.0
    shorter, longer = (a, b) if len(a) <= len(b) else (b, a)
    bg_short = _bigrams(shorter)
    bg_long  = _bigrams(longer)
    if not bg_short:
        return 1.0 if shorter in longer else 0.0
    matches = sum(1 for bg in bg_short if bg in bg_long)
    return matches / max(len(bg_short), len(bg_long))


def _load_existing_q_facts() -> dict[str, dict]:
    """Return {fact_id: data} for all Q-facts already on disk."""
    q_facts: dict[str, dict] = {}
    if not Q_FACTS_DIR.exists():
        return q_facts
    for f in sorted(Q_FACTS_DIR.glob("Q*.yaml")):
        data = yaml.safe_load(f.read_text(encoding="utf-8"))
        if data and "fact_id" in data:
            q_facts[data["fact_id"]] = data
    return q_facts


def _next_q_id(q_facts: dict) -> str:
    existing = {int(k[1:]) for k in q_facts if re.match(r"^Q\d{3}$", k)}
    n = 1
    while n in existing:
        n += 1
    return f"Q{n:03d}"


def _find_duplicate(claim: str, q_facts: dict, threshold: float = 0.80) -> Optional[str]:
    """Return fact_id of an existing Q-fact that is >threshold similar."""
    for fid, data in q_facts.items():
        if _similarity(claim, data.get("claim", "")) > threshold:
            return fid
    return None


# ── Parsing ───────────────────────────────────────────────────────────────────

# Months in Swedish → ISO month number
_SV_MONTHS = {
    "januari": "01", "februari": "02", "mars": "03", "april": "04",
    "maj": "05", "juni": "06", "juli": "07", "augusti": "08",
    "september": "09", "oktober": "10", "november": "11", "december": "12",
}


def _parse_finding_date(content: str, finding_num: str) -> Optional[date]:
    """
    Parse the date from <p class="finding-meta">Finding NNN · 25 april 2026</p>.
    """
    m = re.search(r'<p class="finding-meta">Finding \d+ · (\d+) (\w+) (\d{4})</p>', content)
    if not m:
        return None
    day, month_sv, year = m.group(1), m.group(2).lower(), m.group(3)
    month = _SV_MONTHS.get(month_sv)
    if not month:
        return None
    try:
        return date(int(year), int(month), int(day))
    except ValueError:
        return None


def _parse_vidare_fragor(content: str) -> list[str]:
    """
    Extract <li> text from the "Vidare frågor" section.
    Returns a list of question strings.
    """
    # Find the Vidare frågor section
    vf_match = re.search(
        r'Vidare frågor.*?<ul>(.*?)</ul>',
        content,
        re.DOTALL | re.IGNORECASE,
    )
    if not vf_match:
        return []

    ul_content = vf_match.group(1)
    # Extract all <li>...</li> items
    items = re.findall(r'<li>(.*?)</li>', ul_content, re.DOTALL)
    # Strip HTML tags and whitespace
    cleaned = []
    for item in items:
        text = re.sub(r'<[^>]+>', '', item).strip()
        text = re.sub(r'\s+', ' ', text)
        if text:
            cleaned.append(text)
    return cleaned


# ── Filtering ─────────────────────────────────────────────────────────────────

# Patterns for "too generic" questions to exclude
_GENERIC_PATTERNS = [
    re.compile(r'^hur fungerar \w+\??$', re.IGNORECASE),
    re.compile(r'^vad är \w+\??$', re.IGNORECASE),
    re.compile(r'^varför \w+\??$', re.IGNORECASE),
]

# Keywords that indicate bandy-specific context (at least one required)
_BANDY_KEYWORDS = [
    "bandy", "halvtid", "hörn", "straff", "mål", "match", "lag", "serie",
    "elitserien", "allsvenskan", "slutspel", "semifinal", "kvartsfinal", "final",
    "säsong", "period", "minut", "ledning", "comeback", "vändning", "utvisning",
    "tempo", "spelsystem", "offensiv", "defensiv", "hemma", "borta", "dam", "herr",
    "målvakt", "back", "forward", "half", "winrate", "konvertering", "frekvens",
    "statistik", "data", "analys", "mönster", "trend", "korrelation",
]


def _is_too_short(question: str) -> bool:
    return len(question.strip()) < 20


def _is_generic(question: str) -> bool:
    q = question.strip()
    for pattern in _GENERIC_PATTERNS:
        if pattern.match(q):
            return True
    return False


def _has_bandy_context(question: str) -> bool:
    q = question.lower()
    return any(kw in q for kw in _BANDY_KEYWORDS)


def _should_include(question: str) -> tuple[bool, str]:
    """Returns (include, reason_if_excluded)."""
    if _is_too_short(question):
        return False, "för kort (<20 tecken)"
    if _is_generic(question):
        return False, "för generisk (Hur fungerar X? / Vad är X?)"
    if not _has_bandy_context(question):
        return False, "saknar bandyspecifik kontext"
    return True, ""


# ── Main ──────────────────────────────────────────────────────────────────────

def backfill() -> None:
    Q_FACTS_DIR.mkdir(parents=True, exist_ok=True)
    q_facts = _load_existing_q_facts()

    # Collect all finding dirs in order
    finding_dirs = sorted(
        [d for d in FINDINGS_DIR.iterdir() if d.is_dir() and d.name.isdigit()],
        key=lambda d: int(d.name),
    )

    # Per-finding results
    created: list[dict] = []        # {q_id, claim, spawned_by, spawned_at}
    duplicates: list[dict] = []     # {claim, spawned_by, matched_q_id}
    excluded: list[dict] = []       # {claim, spawned_by, reason}
    # Intra-run deduplication (before writing)
    seen_this_run: dict[str, str] = {}  # claim_lower → q_id

    for finding_dir in finding_dirs:
        num = finding_dir.name  # "001", "002", ...
        astro_path = finding_dir / "index.astro"
        if not astro_path.exists():
            continue

        content = astro_path.read_text(encoding="utf-8")
        finding_date = _parse_finding_date(content, num) or date(2026, 4, 25)
        questions = _parse_vidare_fragor(content)

        for q_text in questions:
            include, reason = _should_include(q_text)
            if not include:
                excluded.append({"claim": q_text, "spawned_by": f"finding:{num}", "reason": reason})
                continue

            # Check intra-run deduplication first
            intra_dup = next(
                (existing_q_id for existing_claim, existing_q_id in seen_this_run.items()
                 if _similarity(q_text, existing_claim) > 0.80),
                None,
            )
            if intra_dup:
                duplicates.append({
                    "claim": q_text,
                    "spawned_by": f"finding:{num}",
                    "matched_q_id": intra_dup,
                    "reason": "intra-run duplicate",
                })
                continue

            # Check against existing Q-facts on disk
            dup_id = _find_duplicate(q_text, q_facts)
            if dup_id:
                duplicates.append({
                    "claim": q_text,
                    "spawned_by": f"finding:{num}",
                    "matched_q_id": dup_id,
                    "reason": "already exists on disk",
                })
                continue

            # Create new Q-fact
            q_id = _next_q_id(q_facts)
            slug = re.sub(r"[^a-z0-9]+", "_", q_text.lower())[:40].strip("_")
            filename = f"{q_id}_{slug}.yaml"

            data = {
                "fact_id": q_id,
                "category": "questions",
                "claim": q_text,
                "spawned_by": f"finding:{num}",
                "spawned_at": finding_date.isoformat(),
                "status": "open",
                "verified_at": finding_date.isoformat(),
                "verified_by": "code",
                "domain": "bandy",
            }
            (Q_FACTS_DIR / filename).write_text(
                yaml.dump(data, allow_unicode=True, default_flow_style=False, sort_keys=False),
                encoding="utf-8",
            )
            q_facts[q_id] = data
            seen_this_run[q_text.lower()] = q_id
            created.append({
                "q_id": q_id,
                "claim": q_text,
                "spawned_by": f"finding:{num}",
                "spawned_at": finding_date.isoformat(),
            })

    # ── Rapport ───────────────────────────────────────────────────────────────
    _write_report(created, duplicates, excluded)
    print(f"Backfill klar.")
    print(f"  Skapade:    {len(created)} Q-facts")
    print(f"  Dublikater: {len(duplicates)}")
    print(f"  Exkluderade:{len(excluded)}")
    print(f"  Rapport:    {REPORT_PATH.relative_to(REPO_ROOT)}")


def _write_report(created: list, duplicates: list, excluded: list) -> None:
    today = date.today().isoformat()
    lines = [
        f"# Backfill Q-facts — {today}",
        "",
        "Kördes mot alla befintliga findings (001–046).",
        "Extraherade 'Vidare frågor' och skapade Q-facts i `docs/findings/facts/questions/`.",
        "",
        "---",
        "",
        "## Sammanfattning",
        "",
        f"| | Antal |",
        f"|---|---|",
        f"| Skapade Q-facts | {len(created)} |",
        f"| Dublikater (länkade) | {len(duplicates)} |",
        f"| Exkluderade | {len(excluded)} |",
        f"| Totalt extraherade frågor | {len(created) + len(duplicates) + len(excluded)} |",
        "",
    ]

    # Domain breakdown (all bandy for now since we set domain: bandy by default)
    lines += [
        "## Per domän",
        "",
        "Alla backfill-Q-facts har `domain: bandy` (standardvärde).",
        "Manuell granskning kan uppdatera till `game` för frågor om Bandy Manager-motorn.",
        "",
        "---",
        "",
        "## Skapade Q-facts",
        "",
    ]

    # Group by spawned_by
    from collections import defaultdict
    by_finding: dict[str, list] = defaultdict(list)
    for c in created:
        by_finding[c["spawned_by"]].append(c)

    for spawned_by in sorted(by_finding.keys()):
        lines.append(f"### {spawned_by}")
        lines.append("")
        for c in by_finding[spawned_by]:
            lines.append(f"- **{c['q_id']}** — {c['claim']}")
        lines.append("")

    if not created:
        lines.append("*(inga skapade)*")
        lines.append("")

    lines += [
        "---",
        "",
        "## Dublikater (länkade, ej nya Q-facts)",
        "",
    ]
    if duplicates:
        for d in duplicates:
            lines.append(f"- `{d['spawned_by']}`: \"{d['claim']}\" → länkad till **{d['matched_q_id']}** ({d['reason']})")
        lines.append("")
    else:
        lines.append("*(inga dublikater)*")
        lines.append("")

    lines += [
        "---",
        "",
        "## Exkluderade frågor",
        "",
    ]
    if excluded:
        for e in excluded:
            lines.append(f"- `{e['spawned_by']}`: \"{e['claim']}\" — *{e['reason']}*")
        lines.append("")
    else:
        lines.append("*(inga exkluderade)*")
        lines.append("")

    lines += [
        "---",
        "",
        "## Alla Q-IDs skapade i denna backfill",
        "",
    ]
    if created:
        lines.append(", ".join(c["q_id"] for c in created))
    else:
        lines.append("*(inga)*")
    lines.append("")

    REPORT_PATH.write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    backfill()
