"""
h_backfill.py — Identifierar konkurrerande hypoteser i findings 001-046.

Skickar "Tolkning"-sektionen för varje finding till Claude API och ber den
identifiera hypoteser. Producerar docs/findings/H_BACKFILL_2026-04-26.md
för Opus-granskning.

VIKTIGT: Scriptet skriver INGA H-facts till hypotheses/. Det är en
analys-/rapportscript. Opus granskar rapporten och beslutar vilka H-facts
som ska skrivas.

Kör mot findings 001-010 som proof-of-concept (via --limit 10).

Användning:
    python3 h_backfill.py              # kör alla 46
    python3 h_backfill.py --limit 10   # kör findings 001-010

Kräver: ANTHROPIC_API_KEY i miljön.
"""

import os
import re
import sys
import json
import time
from pathlib import Path
from datetime import date

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
FINDINGS_DIR = REPO_ROOT / "bandy-brain" / "src" / "pages" / "findings"
REPORT_PATH = REPO_ROOT / "docs" / "findings" / "H_BACKFILL_2026-04-26.md"

SYSTEM_PROMPT = """Du är en analytiker som granskar bandyanalys-texter.
Din uppgift är att identifiera konkurrerande hypoteser — alltså fall där texten
presenterar mer än en möjlig förklaring till ett observerat fenomen, eller
där ett påstående är testbart och det finns en tänkbar alternativ förklaring.

Returnera ENBART ett JSON-objekt. Inga förklaringar utanför JSON."""

USER_TEMPLATE = """Identifiera konkurrerande hypoteser i denna bandyanalystext.

Text från Finding {finding_id} ("Tolkning"-sektion):
{text}

Svara med JSON-array. För varje identifierad hypotes:
{{
  "claim": "hypotesens påstående i en mening",
  "competing_hypothesis": "alternativ förklaring (om någon presenteras, annars null)",
  "predicted_value": "vad hypotesen förutsäger om vi testar den (konkret siffra/riktning eller null)",
  "test_method": "hur man skulle testa hypotesen (eller null)",
  "finding_id": "{finding_id}"
}}

Returnera tom array [] om ingen genuin hypotes identifieras (bara observationer/slutsatser).
Returnera max 3 hypoteser.
Svar: JSON-array och inget annat."""


def extract_tolkning_section(html: str) -> str:
    """
    Extrahera innehållet i Tolkning-sektionen från en finding.
    Letar efter <p class="finding-section-label">Tolkning</p> och
    plockar upp allt tills nästa section-label eller hr.
    """
    # Hitta Tolkning-sektionen
    match = re.search(
        r'<p class="finding-section-label">Tolkning</p>(.*?)(?:<p class="finding-section-label">|<hr class="finding-divider"|</div>)',
        html,
        re.DOTALL
    )
    if not match:
        return ""

    raw = match.group(1)
    # Strippa HTML-taggar och normalisera whitespace
    text = re.sub(r'<[^>]+>', ' ', raw)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def get_finding_title(html: str) -> str:
    """Extrahera finding-titeln."""
    m = re.search(r'title="Finding \d+ — ([^"]+)"', html)
    return m.group(1) if m else "(utan titel)"


def call_claude_api(finding_id: str, tolkning_text: str, client) -> list[dict]:
    """
    Skicka tolkningstexten till Claude och returnera lista av hypotes-dicts.
    """
    user_msg = USER_TEMPLATE.format(
        finding_id=finding_id,
        text=tolkning_text[:3000],  # Begränsa för API-kostnad
    )

    try:
        message = client.messages.create(
            model="claude-haiku-4-5",  # Haiku räcker för extraktion
            max_tokens=1000,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_msg}],
        )
        raw = message.content[0].text.strip()
        # Strippa markdown-block om det finns
        if raw.startswith("```"):
            raw = re.sub(r'^```\w*\n?', '', raw)
            raw = re.sub(r'\n?```$', '', raw)
        return json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"  WARN: JSON-parse-fel för finding {finding_id}: {e}")
        return []
    except Exception as e:
        print(f"  ERROR: API-anrop misslyckades för finding {finding_id}: {e}")
        return []


def format_hypothesis(h: dict, idx: int) -> list[str]:
    """Formatera ett hypotes-dict till rapport-rader."""
    lines = []
    lines.append(f"**H-förslag {idx}:**")
    lines.append(f"- Claim: {h.get('claim', '(saknas)')}")
    competing = h.get('competing_hypothesis')
    if competing:
        lines.append(f"- Competing: {competing}")
    predicted = h.get('predicted_value')
    if predicted:
        lines.append(f"- Predicted: {predicted}")
    test = h.get('test_method')
    if test:
        lines.append(f"- Test: {test}")
    return lines


def main():
    # Kolla om limit är satt
    limit = None
    if "--limit" in sys.argv:
        try:
            idx = sys.argv.index("--limit")
            limit = int(sys.argv[idx + 1])
        except (IndexError, ValueError):
            print("Fel: --limit kräver ett heltal som argument")
            sys.exit(1)

    # Kontrollera API-nyckel
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ANTHROPIC_API_KEY saknas i miljön.")
        print("Scriptet kräver API-nyckeln för att köra.")
        print("Sätt den med: export ANTHROPIC_API_KEY=sk-...")
        sys.exit(1)

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
    except ImportError:
        print("anthropic-paketet saknas. Installera med: pip install anthropic")
        sys.exit(1)

    # Hitta findings
    finding_dirs = []
    for i in range(1, 47):
        num = f"{i:03d}"
        p = FINDINGS_DIR / num
        if p.exists():
            finding_dirs.append(num)

    if limit:
        finding_dirs = finding_dirs[:limit]

    print(f"Processar {len(finding_dirs)} findings...")

    all_proposals = []
    findings_without_hypotheses = []
    findings_no_tolkning = []

    for num in finding_dirs:
        astro_path = FINDINGS_DIR / num / "index.astro"
        html = astro_path.read_text(encoding="utf-8")
        title = get_finding_title(html)
        tolkning = extract_tolkning_section(html)

        print(f"  Finding {num}: {title[:50]}", end="")

        if not tolkning:
            print(" — ingen Tolkning-sektion")
            findings_no_tolkning.append(num)
            continue

        print(f" ({len(tolkning)} tecken)", end="", flush=True)

        # Anropa Claude
        hypotheses = call_claude_api(num, tolkning, client)

        if hypotheses:
            print(f" → {len(hypotheses)} hypotes(er)")
            all_proposals.append({
                "num": num,
                "title": title,
                "tolkning": tolkning,
                "hypotheses": hypotheses,
            })
        else:
            print(" → inga hypoteser")
            findings_without_hypotheses.append(num)

        # Kort paus för att undvika rate-limiting
        time.sleep(0.5)

    # Producera rapport
    today = date.today().isoformat()
    lines = []
    lines.append(f"# H-fact Backfill — {today}\n")
    lines.append("## Sammanfattning\n")
    lines.append(f"- Findings processade: {len(finding_dirs)}")
    lines.append(f"- Hypotesförslag: {sum(len(p['hypotheses']) for p in all_proposals)}")
    lines.append(f"- Findings utan identifierade hypoteser: {len(findings_without_hypotheses)}")
    if findings_no_tolkning:
        lines.append(f"- Findings utan Tolkning-sektion: {len(findings_no_tolkning)} ({', '.join(findings_no_tolkning)})")
    lines.append("")
    lines.append("## Opus-instruktioner\n")
    lines.append("För varje H-förslag nedan:")
    lines.append("- **Behåll** om det är en genuin hypotes som finding presenterar")
    lines.append("- **Förkasta** om det är en överöversättning (observation → hypotes)")
    lines.append("- **Kombinera** om två förslag är samma hypotes formulerad olika")
    lines.append("")
    lines.append("Kuraterade H-facts skrivs sedan till `docs/findings/hypotheses/` av Code.")
    lines.append("")

    if findings_without_hypotheses:
        lines.append(f"## Findings utan hypoteser\n")
        lines.append(f"Dessa findings innehöll inga identifierade hypoteser: {', '.join(findings_without_hypotheses)}\n")

    lines.append("## Förslag per finding\n")

    for p in all_proposals:
        lines.append(f"### Finding {p['num']} — {p['title']}\n")
        for i, h in enumerate(p["hypotheses"], 1):
            hyp_lines = format_hypothesis(h, i)
            lines.extend(hyp_lines)
            lines.append("")
        lines.append("---\n")

    report = "\n".join(lines)
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(report, encoding="utf-8")

    print(f"\nRapport skriven: {REPORT_PATH}")
    print(f"\nSammanfattning:")
    print(f"  Findings processade:  {len(finding_dirs)}")
    print(f"  H-förslag totalt:     {sum(len(p['hypotheses']) for p in all_proposals)}")
    print(f"  Findings utan hyp.:   {len(findings_without_hypotheses)}")


if __name__ == "__main__":
    main()
