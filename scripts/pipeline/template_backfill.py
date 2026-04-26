"""
template_backfill.py — Analyserar findings 001-046 och identifierar
hårdkodade siffror som matchar fact-värden.

Producerar docs/findings/TEMPLATE_BACKFILL_2026-04-26.md med:
- Per finding: hittade siffra+fact-kopplingar
- Inkonsistenser: siffran stämmer INTE med fact-värdet
- Siffror lämnade hårdkodade (derived/beräknade)
- Totalt antal templatings möjliga

VIKTIGT: Scriptet ändrar INGA finding-filer. Analys och rapport enbart.
"""

import os
import re
import glob
import yaml
from pathlib import Path
from datetime import date

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
FACTS_DIR = REPO_ROOT / "docs" / "findings" / "facts"
FINDINGS_DIR = REPO_ROOT / "bandy-brain" / "src" / "pages" / "findings"
REPORT_PATH = REPO_ROOT / "docs" / "findings" / "TEMPLATE_BACKFILL_2026-04-26.md"

CATEGORY_DIRS = ["stats", "rules", "design_principles", "world_canon"]


def load_all_facts() -> dict:
    """Load all YAML facts as a dict: fact_id -> {value, unit, claim, ...}"""
    facts = {}
    for cat in CATEGORY_DIRS:
        cat_dir = FACTS_DIR / cat
        if not cat_dir.exists():
            continue
        for yaml_path in sorted(cat_dir.glob("*.yaml")):
            try:
                with open(yaml_path, "r", encoding="utf-8") as f:
                    data = yaml.safe_load(f)
                if data and data.get("fact_id") and data.get("status") != "deprecated":
                    facts[data["fact_id"]] = data
            except Exception as e:
                print(f"  WARN: kunde inte parsa {yaml_path.name}: {e}")
    return facts


def numeric_variants(value) -> list[str]:
    """
    Producera alla sökbara strängvarianter av ett faktavärde.
    9.12 -> ["9.12", "9,12", "9,12 %", "9.12 %"]
    78.1 -> ["78.1", "78,1", "78,1 %", "78.1 %"]
    54.2 -> ["54.2", "54,2", "54,2 %", "54.2 %"]
    Heltal: 20 -> ["20"]
    Lista: [2.1, 3.5] -> ["2.1", "2,1", "3.5", "3,5"]
    """
    if value is None:
        return []
    variants = []
    if isinstance(value, list):
        for v in value:
            if isinstance(v, (int, float)):
                s = str(v)
                variants.append(s)
                if "." in s:
                    variants.append(s.replace(".", ","))
        return variants
    if isinstance(value, (int, float)):
        s = str(value)
        variants.append(s)
        if "." in s:
            sv = s.replace(".", ",")
            variants.append(sv)
            # med %-enhet
            variants.append(sv + " %")
            variants.append(s + " %")
        return variants
    return []


def extract_fact_refs_from_astro(html: str) -> list[str]:
    """
    Hitta alla fact-ref-IDs nämnda i filen som class="fact-ref".
    Matchar: factHref("S013") och >S013<
    """
    # Matchar: factHref("S013") eller factHref('S013')
    ids = re.findall(r'factHref\(["\']([A-Z]\d{3})["\']', html)
    # Matchar: class="fact-ref">S013</a>
    ids2 = re.findall(r'class="fact-ref">([A-Z]\d{3})</a>', html)
    return list(set(ids + ids2))


def find_hardcoded_values_near_refs(html: str, fact_id: str, variants: list[str]) -> list[dict]:
    """
    Sök efter hårdkodade värden (variants) nära faktareferenser (fact_id).
    Returnerar lista av: {variant, position, context, near_ref}
    """
    results = []
    # Hitta alla positioner där fact_id nämns
    ref_positions = [m.start() for m in re.finditer(re.escape(fact_id), html)]

    for variant in variants:
        # Sök alla förekomster av varianten i hela HTML-texten
        for m in re.finditer(re.escape(variant), html):
            pos = m.start()
            # Kolla om det finns en fact-ref nära (inom 300 tecken)
            near = any(abs(pos - rp) < 300 for rp in ref_positions)
            # Kontextextrakt
            ctx_start = max(0, pos - 40)
            ctx_end = min(len(html), pos + len(variant) + 40)
            context = html[ctx_start:ctx_end].replace("\n", " ").strip()
            results.append({
                "variant": variant,
                "position": pos,
                "context": context,
                "near_ref": near,
            })
    return results


def format_value_display(v) -> str:
    if isinstance(v, list):
        return str(v)
    return str(v)


def analyze_finding(finding_num: str, facts: dict) -> dict:
    """
    Analysera en finding och returnera:
    {
        "num": "004",
        "title": "...",
        "refs_found": [fact_id, ...],
        "matches": [{fact_id, variant, near_ref, context}, ...],
        "inconsistencies": [{fact_id, found_val, expected_val, context}, ...],
        "hardcoded_no_ref": [{variant, context}, ...],
    }
    """
    astro_path = FINDINGS_DIR / finding_num / "index.astro"
    if not astro_path.exists():
        return None

    html = astro_path.read_text(encoding="utf-8")

    # Tittel
    title_m = re.search(r'title="Finding \d+ — ([^"]+)"', html)
    title = title_m.group(1) if title_m else "(utan titel)"

    # Vilka fact-refs nämns?
    refs_in_file = extract_fact_refs_from_refs_section(html)

    result = {
        "num": finding_num,
        "title": title,
        "refs_found": refs_in_file,
        "matches": [],
        "inconsistencies": [],
        "hardcoded_no_ref": [],
    }

    # För varje fact med numeriskt värde: sök hårdkodade varianter
    for fact_id, fact_data in facts.items():
        value = fact_data.get("value")
        if value is None:
            continue
        variants = numeric_variants(value)
        if not variants:
            continue

        hits = find_hardcoded_values_near_refs(html, fact_id, variants)
        for hit in hits:
            if hit["near_ref"]:
                # Nära en ref — kandidat för templating
                # Kolla om värdet stämmer med fakta-värdet
                expected = format_value_display(value)
                found_sv = hit["variant"]
                # Normalisera: ta bort % och whitespace för jämförelse
                found_norm = found_sv.replace(" %", "").replace(",", ".").strip()
                expected_norm = str(value).replace(",", ".").strip()

                if found_norm == expected_norm or found_norm == str(value):
                    result["matches"].append({
                        "fact_id": fact_id,
                        "variant": hit["variant"],
                        "context": hit["context"],
                    })
                else:
                    result["inconsistencies"].append({
                        "fact_id": fact_id,
                        "found_val": hit["variant"],
                        "expected_val": format_value_display(value),
                        "context": hit["context"],
                    })

    # Sök efter alla svenska/engelska tal nära fact-refs som inte matchades
    # (möjligen derived/beräknade siffror)
    all_matched_variants = set(m["variant"] for m in result["matches"])
    # Sök efter tal generellt nära fact-refs
    # Siffermönster: "X,XX" eller "XX,X" eller "XX.X" eller heltal >=2
    number_pattern = re.compile(r'\b\d+[,\.]\d+\b|\b\d{2,4}\b')
    ref_positions_all = [m.start() for m in re.finditer(
        r'class="fact-ref">([A-Z]\d{3})</a>', html
    )]
    for m in number_pattern.finditer(html):
        num_str = m.group()
        # Hoppa över om den redan matchades
        if num_str in all_matched_variants:
            continue
        # Kolla om nära en ref
        near = any(abs(m.start() - rp) < 200 for rp in ref_positions_all)
        if near:
            ctx_start = max(0, m.start() - 40)
            ctx_end = min(len(html), m.end() + 40)
            context = html[ctx_start:ctx_end].replace("\n", " ").strip()
            result["hardcoded_no_ref"].append({
                "value": num_str,
                "context": context,
            })

    return result


def extract_fact_refs_from_refs_section(html: str) -> list[str]:
    """Extrahera alla fact-IDs som refereras i filen."""
    ids = re.findall(r'factHref\(["\']([A-Z]\d{3})["\']', html)
    ids2 = re.findall(r'class="fact-ref">([A-Z]\d{3})</a>', html)
    return sorted(set(ids + ids2))


def main():
    print("Laddar facts...")
    facts = load_all_facts()
    print(f"  {len(facts)} facts laddade")

    # Hitta alla findings 001-046
    finding_dirs = []
    for i in range(1, 47):
        num = f"{i:03d}"
        p = FINDINGS_DIR / num
        if p.exists():
            finding_dirs.append(num)

    print(f"  {len(finding_dirs)} findings hittade")

    all_results = []
    total_matches = 0
    total_inconsistencies = 0
    total_hardcoded = 0

    for num in finding_dirs:
        r = analyze_finding(num, facts)
        if r:
            all_results.append(r)
            total_matches += len(r["matches"])
            total_inconsistencies += len(r["inconsistencies"])
            total_hardcoded += len(r["hardcoded_no_ref"])

    # Deduplika hardcoded_no_ref (samma siffra kan dyka upp flera ggr per finding)
    for r in all_results:
        seen = set()
        deduped = []
        for h in r["hardcoded_no_ref"]:
            key = (h["value"], h["context"][:50])
            if key not in seen:
                seen.add(key)
                deduped.append(h)
        r["hardcoded_no_ref"] = deduped
        total_hardcoded += len(deduped) - len(r["hardcoded_no_ref"])  # korrigering

    # Producera rapport
    lines = []
    lines.append(f"# Template Backfill — {date.today().isoformat()}\n")
    lines.append("## Sammanfattning\n")
    lines.append(f"- Findings processade: {len(all_results)}")
    lines.append(f"- Templatings möjliga (siffra nära ref, stämmer med fact): {total_matches}")
    lines.append(f"- Inkonsistenser (siffra nära ref, stämmer INTE med fact): {total_inconsistencies}")
    lines.append(f"- Siffror nära ref utan direkt fact-match (derived/okänd): {total_hardcoded}")
    lines.append("")

    if total_inconsistencies > 0:
        lines.append("## INKONSISTENSER — kräver Opus-granskning\n")
        lines.append("Dessa siffror finns nära en fact-referens men matchar INTE fact-värdet.")
        lines.append("Antingen är finding-texten gammal, eller är fact-värdet ändrat sedan finding skrevs.\n")
        for r in all_results:
            if r["inconsistencies"]:
                lines.append(f"### Finding {r['num']} — {r['title']}\n")
                for inc in r["inconsistencies"]:
                    lines.append(f"- **{inc['fact_id']}** — funnen: `{inc['found_val']}`, förväntat: `{inc['expected_val']}`")
                    lines.append(f"  Kontext: `{inc['context'][:120]}`")
                    lines.append("")
        lines.append("")

    lines.append("## Per finding\n")
    for r in all_results:
        has_anything = r["matches"] or r["inconsistencies"] or r["hardcoded_no_ref"]
        lines.append(f"### Finding {r['num']} — {r['title']}\n")
        lines.append(f"Fact-refs i filen: {', '.join(r['refs_found']) if r['refs_found'] else '(inga)'}\n")

        if r["matches"]:
            lines.append("**Templatings möjliga:**\n")
            seen_matches = set()
            for m in r["matches"]:
                key = (m["fact_id"], m["variant"])
                if key in seen_matches:
                    continue
                seen_matches.add(key)
                lines.append(f"- `{m['variant']}` → `{{factGoals(\"{m['fact_id']}\")}}` eller `{{factPct(\"{m['fact_id']}\")}}` (beroende på enhet)")
                lines.append(f"  Kontext: `{m['context'][:120]}`")
                lines.append("")

        if r["inconsistencies"]:
            lines.append("**Inkonsistenser:**\n")
            for inc in r["inconsistencies"]:
                lines.append(f"- `{inc['fact_id']}`: funnen `{inc['found_val']}`, fact-värde `{inc['expected_val']}`")
                lines.append(f"  Kontext: `{inc['context'][:120]}`")
                lines.append("")

        if r["hardcoded_no_ref"]:
            lines.append("**Siffror nära ref utan fact-match (derived/beräknade):**\n")
            seen_hardcoded = set()
            for h in r["hardcoded_no_ref"][:10]:  # max 10 per finding
                key = h["value"]
                if key in seen_hardcoded:
                    continue
                seen_hardcoded.add(key)
                lines.append(f"- `{h['value']}` — `{h['context'][:100]}`")
            lines.append("")

        if not has_anything:
            lines.append("_(Inga hårdkodade siffror identifierade nära fact-refs)_\n")

        lines.append("---\n")

    report = "\n".join(lines)
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(report, encoding="utf-8")
    print(f"\nRapport skriven: {REPORT_PATH}")
    print(f"\nSammanfattning:")
    print(f"  Findings processade:    {len(all_results)}")
    print(f"  Templatings möjliga:    {total_matches}")
    print(f"  Inkonsistenser:         {total_inconsistencies}")
    print(f"  Derived/okänt nära ref: {total_hardcoded}")


if __name__ == "__main__":
    main()
