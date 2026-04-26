"""
Calls Claude API to turn analysis results into a finding.
Returns structured dict that the pipeline renders to Astro.
"""

import json
import os
import anthropic

SYSTEM_PROMPT = """Du är Bandy-Brain, ett analysverktyg för bandystatistik.
Du skriver findings — korta analytiska rapporter om specifika fenomen i bandy.

En finding har alltid dessa sektioner:
- fragan: Vad vi undrade (1 stycke)
- datan: Vilken data vi använde (1-2 stycken + ev. lista)
- fynd: Vad vi fann (fakta, siffror — saklig)
- tolkning: Vad det betyder (analytisk prosa, 2-4 stycken)
- begransningar: Vad vi inte vet / felkällor (punktlista)
- vidare_fragor: Nästa naturliga frågor (punktlista, 3-5 st)

Stil: Swedish. Saklig. Erkänner begränsningar. Inga adjektiv som "fascinerande" eller "anmärkningsvärd" —
låt siffrorna tala. Max en mening per punkt i listor. Prosa i stycken, inte bullets, när det är tolkning.

VIKTIGT — sifferdata i findings:
Använd INTE hårdkodade siffror som kan hämtas från facts. Istället för att skriva
"78,1 %" direkt, skriv {factPct("S013")} i Astro-JSX-koden. Alla tal som
direkt motsvarar ett S-fact, R-fact eller D-fact-värde ska templateras.
Undantag: härledda tal (beräknade ur flera facts) — dessa kommenteras med
<!-- derived from S012 + S014 --> istället.

Svara ALLTID med ett JSON-objekt och ingenting annat. Inga förklaringar utanför JSON."""

USER_TEMPLATE = """Fråga som ska besvaras: {question}

Käll-finding: Finding {source_finding}

Analysresultat:
{analysis_json}

Skriv en finding baserat på dessa data. Svara med JSON:
{{
  "title": "Kort, faktapåstående (max 8 ord)",
  "title_line2": "Valfri andra rad (null om onödig)",
  "description": "En mening för meta-description, max 160 tecken",
  "fragan": "Frågans text (prosa, 1 stycke)",
  "datan": "Beskrivning av datakällan (prosa + ev. HTML-lista med <ul><li>)",
  "fynd": "Vad vi fann — prosa + ev. tabell som HTML (<table><thead><tr><th>...</th></tr></thead><tbody><tr><td>...</td></tr></tbody></table>), aldrig markdown-tabeller",
  "tolkning": "Tolkande prosa (2-4 stycken separerade med \\n\\n)",
  "begransningar": ["punkt 1", "punkt 2", "punkt 3"],
  "vidare_fragor": ["fråga 1", "fråga 2", "fråga 3"],
  "key_numbers": [
    {{"label": "etikett", "value": "9,12", "note": "kontextuell not"}}
  ],
  "source_facts": ["S001", "S013"]
}}"""


def generate_finding(question: str, source_finding: str, analysis_result: dict) -> dict:
    """Call Claude and return structured finding dict."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY saknas i miljön")

    client = anthropic.Anthropic(api_key=api_key)
    user_msg = USER_TEMPLATE.format(
        question=question,
        source_finding=source_finding,
        analysis_json=json.dumps(analysis_result, ensure_ascii=False, indent=2),
    )

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_msg}],
    )

    raw = message.content[0].text.strip()
    # Strip markdown code fence if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw)
