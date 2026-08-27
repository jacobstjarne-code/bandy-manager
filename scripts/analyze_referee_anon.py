"""
A4 — Domaranalys, ANONYMISERAD (ANALYSSPEC_VAG2_OEXPLOATERAT.md).

Bygger pseudonym-mappning (verkligt namn → "Domare A/B/..." sorterat på antal
dömda matcher) och återuttrycker fyra analyser med ENBART pseudonymer.

Kör: python3 scripts/analyze_referee_anon.py
Output (ALLA gitignore:ade via docs/data/INTERNAL_* — domarnamn aldrig publikt):
- docs/data/INTERNAL_referee_pseudonym_map.json   (namn→pseudonym — KÄNSLIG)
- docs/data/INTERNAL_referee_reform_analysis_anon.json  (bara pseudonymer)
- docs/data/INTERNAL_ANALYS_REFEREE_A4.md         (rapport, INTERNAL tills Jacob beslutar)

SÄKERHET: main_referee/name-värden skrivs ALDRIG till anon-output eller stdout-
sammanfattning. Endast pseudonymer lämnar mappningsfilen.

Analyser (spec A4):
(a) Reformens spridning: utvisningar/match per domare 2025-26 vs eget pre-snitt.
(b) Timing-profiler: dömer vissa domare systematiskt tidigare/senare?
(c) Dam/herr: skiljer sig samma domares dömning mellan serierna?
(d) Klubbmix-screening: deskriptiv täckning, INGA bias-slutsatser utan Bonferroni.
"""
import json, sys, math
from collections import defaultdict, Counter
sys.path.insert(0, 'scripts/pipeline')
from analysis_helpers import wilson_ci, bonferroni_p, cohens_h

REFORM = '2025-26'


def col_name(i):
    """0->A, 25->Z, 26->AA (excel-stil, tål >26 domare)."""
    s = ''; i += 1
    while i > 0:
        i, r = divmod(i - 1, 26)
        s = chr(65 + r) + s
    return s


def main():
    pm = json.load(open('docs/data/INTERNAL_referee_per_match.json'))['matches']
    agg = {e['main_referee']: e for e in json.load(open('docs/data/INTERNAL_referee_aggregates.json'))['referees']}
    timing = json.load(open('docs/data/INTERNAL_referee_timing_profiles.json'))
    clubmix = json.load(open('docs/data/INTERNAL_referee_clubmix.json'))['referees']
    league = json.load(open('docs/data/INTERNAL_referee_season_trends.json'))['league_by_season']

    # ── pseudonym-mappning: antal matcher per domare (ur per_match), fallande ──
    counts = Counter(m['main_referee'] for m in pm)
    ordered = sorted(counts, key=lambda r: (-counts[r], r))
    pseud = {r: f"Domare {col_name(i)}" for i, r in enumerate(ordered)}
    pmap = {'_meta': {'note': 'KÄNSLIG — namn→pseudonym. Aldrig publik. Sorterat på antal dömda matcher, fallande.',
                      'n_referees': len(ordered)},
            'map': {r: {'pseudonym': pseud[r], 'match_count': counts[r]} for r in ordered}}
    json.dump(pmap, open('docs/data/INTERNAL_referee_pseudonym_map.json', 'w'), ensure_ascii=False, indent=2)

    out = {'_meta': {
        'analysis': 'A4 domaranalys (anonymiserad)',
        'spec': 'ANALYSSPEC_VAG2_OEXPLOATERAT.md A4',
        'status': 'INTERNAL — pseudonymiserad, ej publik utan Jacobs beslut',
        'n_referees_total': len(ordered),
        'reform_season': REFORM,
    }}

    # ── (a) reformens spridning ──
    ref_season = defaultdict(lambda: defaultdict(lambda: {'m': 0, 'f': 0}))
    for m in pm:
        if m['series'] != 'herr':
            continue
        bucket = REFORM if m['season'] == REFORM else 'pre'
        d = ref_season[m['main_referee']][bucket]
        d['m'] += 1; d['f'] += m.get('fouls_count', 0)
    reform_rows = []
    for r in ordered:
        pre, rf = ref_season[r]['pre'], ref_season[r][REFORM]
        if pre['m'] >= 8 and rf['m'] >= 5:
            pre_rate = pre['f'] / pre['m']; rf_rate = rf['f'] / rf['m']
            reform_rows.append({'ref': pseud[r], 'pre_rate': round(pre_rate, 2), 'pre_n': pre['m'],
                                'reform_rate': round(rf_rate, 2), 'reform_n': rf['m'],
                                'delta': round(rf_rate - pre_rate, 2)})
    reform_rows.sort(key=lambda x: -x['delta'])
    up = sum(1 for x in reform_rows if x['delta'] > 0)
    # liga pre vs reform (viktat)
    lh = league['herr']
    pre_seasons = [s for s in lh if s != REFORM]
    pre_n = sum(lh[s]['n'] for s in pre_seasons)
    pre_f = sum(lh[s]['n'] * lh[s]['avg_fouls'] for s in pre_seasons) / pre_n
    reform_f = lh[REFORM]['avg_fouls']
    out['a_reform_spread'] = {
        'league_pre_fouls_per_match': round(pre_f, 2),
        'league_reform_fouls_per_match': round(reform_f, 2),
        'league_lift_pct': round((reform_f / pre_f - 1) * 100, 1),
        'referees_with_both': len(reform_rows),
        'referees_increased': up, 'referees_decreased': len(reform_rows) - up,
        'per_referee': reform_rows,
        'interpretation': f'{up}/{len(reform_rows)} domare med tillräcklig data ökade sitt utvisningssnitt '
                          f'2025-26 mot eget pre-snitt — reformen är {"bred" if up >= 0.7*len(reform_rows) else "koncentrerad"}, '
                          'inte driven av enstaka domare.' if reform_rows else 'otillräcklig data',
    }

    # ── (b) timing-profiler (förberäknade, Bonferroni-korrigerade) ──
    EARLY = ('p00_29', 'p30_44'); LATE = ('p75_89', 'p90plus')
    def direction(period):
        return 'tidigare' if period in EARLY else ('senare' if period in LATE else 'mitten')
    timing_rows = []; sig_refs = 0
    for e in timing.get('profiles', []):
        nm = e.get('ref')
        if nm not in pseud:
            continue
        sigs = [s for s in e.get('sig', []) if s.get('p_bonf', 1) < 0.05]
        if sigs:
            sig_refs += 1
            timing_rows.append({'ref': pseud[nm], 'series': e.get('series'), 'n': e.get('n'),
                                'deviations': [{'period': s['period'], 'delta_pp': s['delta_pp'],
                                                'direction': direction(s['period']), 'p_bonf': s['p_bonf']}
                                               for s in sigs]})
    out['b_timing'] = {
        'n_referees_profiled': len(timing.get('profiles', [])),
        'referees_with_significant_timing': sig_refs,
        'league_baseline_herr': timing.get('league_herr'),
        'per_referee_significant': sorted(timing_rows, key=lambda x: -max(abs(d['delta_pp']) for d in x['deviations'])),
        'note': 'delta_pp = avvikelse i procentenheter från ligans timing-baslinje för perioden. '
                'Endast Bonferroni-korrigerat signifikanta avvikelser (p_bonf<0.05) listas. '
                'Timing är en domartrait bara för de domare som listas — övriga följer ligan.',
    }

    # ── (c) dam/herr per domare ──
    ref_series = defaultdict(lambda: {'herr': {'m': 0, 'f': 0}, 'dam': {'m': 0, 'f': 0}})
    for m in pm:
        s = m['series']
        if s in ('herr', 'dam'):
            ref_series[m['main_referee']][s]['m'] += 1
            ref_series[m['main_referee']][s]['f'] += m.get('fouls_count', 0)
    dh_rows = []
    for r in ordered:
        h, dd = ref_series[r]['herr'], ref_series[r]['dam']
        if h['m'] >= 5 and dd['m'] >= 5:
            hr, dr = h['f'] / h['m'], dd['f'] / dd['m']
            dh_rows.append({'ref': pseud[r], 'herr_rate': round(hr, 2), 'herr_n': h['m'],
                            'dam_rate': round(dr, 2), 'dam_n': dd['m'], 'diff': round(hr - dr, 2)})
    out['c_dam_herr'] = {
        'n_referees_both': len(dh_rows),
        'per_referee': sorted(dh_rows, key=lambda x: -abs(x['diff'])),
        'note': 'Domare som dömer båda serierna med n>=10 i var. Diff = herr-snitt minus dam-snitt.',
    }

    # ── (d) klubbmix-screening (deskriptiv, Bonferroni-medveten) ──
    n_cm = len(clubmix)
    cm_rows = []
    for e in clubmix:
        nm = e.get('name') or e.get('main_referee')
        if nm not in pseud:
            continue
        cm_rows.append({'ref': pseud[nm], 'n': e.get('n'),
                        'raw_deviation': e.get('raw_deviation'),
                        'adjusted_deviation': e.get('adjusted_deviation'),
                        'explanation_pct': e.get('explanation_pct')})
    cm_rows.sort(key=lambda x: -abs(x.get('adjusted_deviation') or 0))
    out['d_clubmix'] = {
        'n_referees': len(cm_rows),
        'bonferroni_note': f'Screening över {n_cm} domare → varje enskild avvikelse ska Bonferroni-korrigeras '
                           f'(alpha/{n_cm}) innan den tolkas. Ingen enskild pseudonym flaggas som bias här — '
                           'detta är en TÄCKNINGSredovisning, inte en anklagelse.',
        'per_referee': cm_rows,
    }

    json.dump(out, open('docs/data/INTERNAL_referee_reform_analysis_anon.json', 'w'), ensure_ascii=False, indent=2)
    write_report(out)

    # stdout-sammanfattning (pseudonymer only)
    a = out['a_reform_spread']
    print(f"Pseudonym-mappning: {len(ordered)} domare → docs/data/INTERNAL_referee_pseudonym_map.json (KÄNSLIG, gitignore:ad)")
    print(f"\n(a) Reform liga: {a['league_pre_fouls_per_match']} → {a['league_reform_fouls_per_match']} utv/match (+{a['league_lift_pct']}%)")
    print(f"    {a['referees_increased']}/{a['referees_with_both']} domare ökade → {a['interpretation']}")
    print(f"(b) Timing: {out['b_timing']['referees_with_significant_timing']}/{out['b_timing']['n_referees_profiled']} domare med signifikant (Bonferroni) timing-avvikelse")
    print(f"(c) Dam/herr: {out['c_dam_herr']['n_referees_both']} domare i båda serier")
    print(f"(d) Klubbmix: {out['d_clubmix']['n_referees']} domare screenade (Bonferroni-medveten, inga bias-flaggor)")
    print("→ docs/data/INTERNAL_referee_reform_analysis_anon.json")
    print("→ docs/data/INTERNAL_ANALYS_REFEREE_A4.md (INTERNAL)")


def write_report(o):
    a, b, c, dd = o['a_reform_spread'], o['b_timing'], o['c_dam_herr'], o['d_clubmix']
    L = ["# A4 — Domaranalys (ANONYMISERAD)\n"]
    L.append("> ⚠️ **INTERNAL — pseudonymiserad. Ej för publik kanal utan Jacobs uttryckliga beslut.** "
             "Namn→pseudonym-mappningen ligger i `INTERNAL_referee_pseudonym_map.json` (gitignore:ad). "
             "Denna rapport innehåller enbart pseudonymer.\n")
    L.append(f"**Analys:** ANALYSSPEC A4. **Domare totalt:** {o['_meta']['n_referees_total']}. **Utförare:** Code.\n")

    L.append("## (a) Reformens spridning\n")
    L.append(f"Liga-nivå herr: **{a['league_pre_fouls_per_match']} → {a['league_reform_fouls_per_match']}** "
             f"utvisningar/match (+{a['league_lift_pct']}%) från pre-reform till {o['_meta']['reform_season']}.\n")
    L.append(f"Av {a['referees_with_both']} domare med tillräcklig data (≥8 pre + ≥5 reform herr) "
             f"ökade **{a['referees_increased']}** sitt eget snitt. {a['interpretation']}\n")
    L.append("| Domare | Pre (utv/match) | Reform | Delta |")
    L.append("|---|---|---|---|")
    for r in a['per_referee']:
        L.append(f"| {r['ref']} | {r['pre_rate']} (n={r['pre_n']}) | {r['reform_rate']} (n={r['reform_n']}) | {r['delta']:+} |")

    L.append("\n## (b) Timing-profiler\n")
    L.append(f"{b['referees_with_significant_timing']} av {b['n_referees_profiled']} profilerade domare "
             "avviker signifikant (Bonferroni-korrigerat) från ligans timing-baslinje. Övriga följer ligan — "
             "timing är alltså en domartrait bara för ett fåtal.\n")
    if b['per_referee_significant']:
        L.append("| Domare | Serie | n | Signifikant avvikelse |")
        L.append("|---|---|---|---|")
        for r in b['per_referee_significant']:
            devs = "; ".join(f"{d['period']} {d['delta_pp']:+} pp ({d['direction']})" for d in r['deviations'])
            L.append(f"| {r['ref']} | {r['series']} | {r['n']} | {devs} |")
    L.append("")

    L.append("## (c) Dam/herr\n")
    L.append(f"{c['n_referees_both']} domare dömer båda serierna med n≥10 i var.\n")
    L.append("| Domare | Herr | Dam | Diff |")
    L.append("|---|---|---|---|")
    for r in c['per_referee']:
        L.append(f"| {r['ref']} | {r['herr_rate']} (n={r['herr_n']}) | {r['dam_rate']} (n={r['dam_n']}) | {r['diff']:+} |")

    L.append("\n## (d) Klubbmix-screening\n")
    L.append(f"{dd['bonferroni_note']}\n")
    L.append("| Domare | n | Rå avvikelse | Justerad avvikelse | Förklaringsgrad |")
    L.append("|---|---|---|---|---|")
    for r in dd['per_referee']:
        L.append(f"| {r['ref']} | {r['n']} | {r['raw_deviation']} | {r['adjusted_deviation']} | {r['explanation_pct']} |")

    L.append("\n## Begränsningar\n")
    L.append("- Pseudonymer sorterade på total matchvolym; mappningen är intern och reversibel.")
    L.append("- Reformanalysen kräver ≥8 pre + ≥5 reform herr-matcher per domare — få domare kvalar, tolka deltan försiktigt.")
    L.append("- Klubbmix är en TÄCKNINGSredovisning. Ingen enskild pseudonym ska tolkas som partisk utan Bonferroni-korrigerad signifikansprövning.")
    L.append("- 2023-24 saknas i datan.\n")
    open('docs/data/INTERNAL_ANALYS_REFEREE_A4.md', 'w').write('\n'.join(L))


if __name__ == '__main__':
    main()
