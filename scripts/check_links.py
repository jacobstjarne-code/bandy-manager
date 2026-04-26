#!/usr/bin/env python3
"""Verifierar att fact-refs i findings pekar på existerande facts."""
import re, sys, os
from pathlib import Path

ROOT = Path(__file__).parent.parent
FACTS_DIR = ROOT / "docs/findings/facts"
FINDINGS_DIR = ROOT / "bandy-brain/src/pages/findings"

def load_fact_ids():
    ids = set()
    for yaml_file in FACTS_DIR.rglob("*.yaml"):
        content = yaml_file.read_text()
        m = re.search(r'fact_id:\s*(\w+)', content)
        if m:
            ids.add(m.group(1))
    return ids

def check_findings(fact_ids):
    broken = []
    # Pattern: factHref("S013") or class="fact-ref">S013 or [S013]
    pattern = re.compile(r'factHref\("([A-Z]\d{3,4})"\)|class="fact-ref">([A-Z]\d{3,4})|(?<!\w)\[([A-Z]\d{3,4})\]')

    for finding_dir in sorted(FINDINGS_DIR.iterdir()):
        astro_file = finding_dir / "index.astro"
        if not astro_file.exists():
            continue
        content = astro_file.read_text()
        for m in pattern.finditer(content):
            ref = m.group(1) or m.group(2) or m.group(3)
            if not ref:
                continue
            # F-refs are finding cross-references (F002 = Finding 002), not fact IDs
            if ref.startswith('F') and ref[1:].isdigit():
                continue
            if ref not in fact_ids:
                broken.append(f"{astro_file.relative_to(ROOT)}: ref {ref} saknas")
    return broken

def main():
    fact_ids = load_fact_ids()
    print(f"Laddade {len(fact_ids)} fact-IDs")
    broken = check_findings(fact_ids)

    if broken:
        print(f"\n{len(broken)} brutna refs:")
        for b in broken:
            print(f"  {b}")
        sys.exit(1)
    else:
        print(f"Alla refs valida.")
        sys.exit(0)

if __name__ == "__main__":
    main()
