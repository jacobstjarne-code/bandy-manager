"""
A7 — Publik × hemmafördel, dam-gåtan (ANALYSSPEC_VAG2_OEXPLOATERAT.md).

GRIND (spec): Steg 1 är en täckningsrapport för `attendance`. Om dam-täckning
< 50% → stanna, rapportera, gå ej vidare till kvartilanalysen. Utfall: dam
20,3% < 50% → STOPP. Steg 2 (hemmavinst% per publikkvartil, dam vs herr) körs INTE.

Kör: python3 scripts/analyze_attendance.py
Output: docs/data/attendance_home_advantage.json + docs/data/ANALYS_ATTENDANCE.md

Varför gåtan inte kan mekanismtestas: Finding 056 visar att damserien nästan
saknar hemmafördel. A7 skulle testa om det förklaras av publik (liten/ingen
publik → ingen hemmafördel). Men bara 87 dammatcher (20%) har publikdata, och
0% för de två senaste säsongerna — för glest för kvartiler per serie.
"""
import json, sys
from collections import defaultdict
sys.path.insert(0, 'scripts/pipeline')
from analysis_helpers import wilson_ci

DAM_GATE = 0.50


def has_att(m):
    a = m.get('attendance')
    return a is not None and a > 0


def coverage(matches):
    tot = len(matches); cov = sum(1 for m in matches if has_att(m))
    by_season = defaultdict(lambda: [0, 0])
    for m in matches:
        by_season[m.get('season')][1] += 1
        if has_att(m): by_season[m.get('season')][0] += 1
    vals = sorted(m['attendance'] for m in matches if has_att(m))
    return {
        'n_matches': tot, 'n_with_attendance': cov, 'coverage_pct': round(cov / tot * 100, 1),
        'per_season': {s: {'covered': c, 'total': t, 'pct': round(c / t * 100)} for s, (c, t) in sorted(by_season.items())},
        'attendance_min': vals[0] if vals else None,
        'attendance_median': vals[len(vals) // 2] if vals else None,
        'attendance_max': vals[-1] if vals else None,
        'attendance_mean': round(sum(vals) / len(vals)) if vals else None,
    }


def main():
    d = json.load(open('docs/data/bandygrytan_detailed.json'))
    herr = coverage(d['herr']['matches'])
    dam = coverage(d['dam']['matches'])

    dam_pass = dam['coverage_pct'] / 100 >= DAM_GATE
    out = {
        '_meta': {
            'analysis': 'A7 publik × hemmafördel (dam-gåtan)',
            'spec': 'ANALYSSPEC_VAG2_OEXPLOATERAT.md A7',
            'gate': f'dam-täckning ≥ {int(DAM_GATE*100)}% krävs för steg 2',
            'gate_result': 'PASSERAD — kör steg 2' if dam_pass else 'EJ PASSERAD — stannar vid täckningsrapport',
        },
        'coverage': {'herr': herr, 'dam': dam},
        'step2_quartile_analysis': None if not dam_pass else 'skulle köras',
        'dam_gata_context': {
            'note': 'Finding 056: damserien saknar nästan hemmafördel. A7 skulle testa publik som mekanism.',
            'dam_median_attendance': dam['attendance_median'],
            'herr_median_attendance': herr['attendance_median'],
            'observation': 'Deskriptivt: dam-publik ~1/5 av herr — förenligt med publik-mekanismen, '
                           'men EJ ett test (87 dammatcher, 20% täckning, 0% senaste två säsonger).',
        },
    }
    json.dump(out, open('docs/data/attendance_home_advantage.json', 'w'), ensure_ascii=False, indent=2)
    print("→ docs/data/attendance_home_advantage.json")
    print(f"\nGRIND: dam-täckning {dam['coverage_pct']}% (krav ≥{int(DAM_GATE*100)}%) → "
          f"{'PASSERAD' if dam_pass else 'EJ PASSERAD, stannar'}")
    print(f"  herr {herr['coverage_pct']}% ({herr['n_with_attendance']}/{herr['n_matches']}), "
          f"dam {dam['coverage_pct']}% ({dam['n_with_attendance']}/{dam['n_matches']})")
    print(f"  publik-median: herr {herr['attendance_median']}, dam {dam['attendance_median']}")
    write_report(out)


def write_report(o):
    h, dm = o['coverage']['herr'], o['coverage']['dam']
    L = ["# A7 — Publik × hemmafördel (dam-gåtan)\n"]
    L.append("**Analys:** ANALYSSPEC A7. **Utförare:** Code. Fable skriver finding.\n")
    L.append(f"## Grind-utfall: {o['_meta']['gate_result']}\n")
    L.append(f"Spec-grinden kräver dam-täckning ≥ 50% för att köra kvartilanalysen (steg 2). "
             f"**Dam-täckningen är {dm['coverage_pct']}%** → steg 2 körs **inte**. Denna rapport är "
             "steg-1-täckningsredovisningen, som spec:en föreskriver som stopppunkt.\n")

    L.append("## Täckning per serie\n")
    L.append("| Serie | Täckning | Publik median | Publik spann |")
    L.append("|---|---|---|---|")
    for lbl, c in (('Herr', h), ('Dam', dm)):
        L.append(f"| {lbl} | {c['n_with_attendance']}/{c['n_matches']} = {c['coverage_pct']}% | "
                 f"{c['attendance_median']} | {c['attendance_min']}–{c['attendance_max']} |")

    L.append("\n## Täckning per säsong\n")
    L.append("| Säsong | Herr | Dam |")
    L.append("|---|---|---|")
    seasons = sorted(set(h['per_season']) | set(dm['per_season']))
    for s in seasons:
        hp = h['per_season'].get(s); dp = dm['per_season'].get(s)
        L.append(f"| {s} | {hp['pct']}% ({hp['covered']}/{hp['total']}) | {dp['pct']}% ({dp['covered']}/{dp['total']}) |" if hp and dp else f"| {s} | — | — |")
    L.append("\nHuvudsakliga hål: COVID-säsongen 2020-21 (tomma arenor) och de två senaste säsongerna "
             "(2024-25, 2025-26) där scrapern inte fångade publiksiffror.\n")

    L.append("## Varför dam-gåtan inte kan mekanismtestas här\n")
    ctx = o['dam_gata_context']
    L.append(f"{ctx['note']} Men dam har bara {dm['n_with_attendance']} matcher med publikdata "
             f"({dm['coverage_pct']}%), och 0% för de två senaste säsongerna — för glest för en "
             "kvartilbaserad hemmavinst-jämförelse dam vs herr.\n")
    L.append(f"**Deskriptiv observation (ej test):** dam-medianpublik **{ctx['dam_median_attendance']}** "
             f"mot herr **{ctx['herr_median_attendance']}** — dampublik är ungefär en femtedel av herr. "
             "Det är *förenligt* med hypotesen att liten publik ger svag hemmafördel (Finding 056), men "
             "det är en samvariation på gruppnivå, inte ett mekanismtest. Att göra det till ett test kräver "
             "publikdata på matchnivå för fler dammatcher än datan har.\n")

    L.append("## Vad som skulle krävas för steg 2\n")
    L.append("- Dam-publik på matchnivå med ≥50% täckning (helst jämnt över säsonger).")
    L.append("- Då: hemmavinst% per publikkvartil, dam vs herr, som direkt mekanismtest av Finding 056:s hemmafördels-gap.\n")

    L.append("## Begränsningar\n")
    L.append("- Herr-täckning (34,5%) skulle räcka för en herr-INTERN publik→hemmafördel-titt, men A7:s "
             "fråga är dam-gåtan (jämförelsen), som grinden stoppar. En herr-only-körning är en separat "
             "fråga — kan beställas, men är inte A7.")
    L.append("- 2023-24 saknas helt i datan (utöver publik-hålen ovan).\n")
    open('docs/data/ANALYS_ATTENDANCE.md', 'w').write('\n'.join(L))
    print("→ docs/data/ANALYS_ATTENDANCE.md")


if __name__ == '__main__':
    main()
