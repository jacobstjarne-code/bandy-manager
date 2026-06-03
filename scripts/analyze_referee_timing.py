"""
Analys E — Domare tidsprofiler (INTERN)
Per domare (n≥30): klubbmix-justerad utvisningsfrekvens per period.
Använder half-flagga — ingen råminuts-gräns vid halvtid.

Perioder (half-flagga-baserade):
  early_1h  : half=1, minute  0-29
  late_1h   : half=1, minute 30+   (inkl. 1H tilläggstid)
  early_2h  : half=2, minute 46-59
  mid_2h    : half=2, minute 60-74
  late_2h   : half=2, minute 75-89
  ot        : half=2, minute 90+

Output: docs/data/INTERNAL_referee_timing_profiles.json (gitignorerad)
"""

import json, math, sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, 'scripts/pipeline')
from analysis_helpers import bootstrap_ci, wilson_ci, cohens_d, bonferroni_p, binom_p

try:
    from scipy import stats
    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False

DATA  = Path('docs/data/bandygrytan_detailed.json')
OUT   = Path('docs/data/INTERNAL_referee_timing_profiles.json')
CM_J  = Path('docs/data/INTERNAL_referee_clubmix.json')
MIN_MATCHES = 30

with open(DATA) as f: d = json.load(f)
herr = d['herr']['matches']
dam  = d['dam']['matches']
all_m = herr + dam

# ── helper: assign period ──────────────────────────────────────────────────

def foul_period(f):
    h  = f.get('half', 2 if f.get('minute',0) >= 46 else 1)
    mn = f.get('minute', 0)
    if h == 1:
        return 'late_1h' if mn >= 30 else 'early_1h'
    # h == 2
    if mn >= 90: return 'ot'
    if mn >= 75: return 'late_2h'
    if mn >= 60: return 'mid_2h'
    return 'early_2h'

PERIODS = ['early_1h','late_1h','early_2h','mid_2h','late_2h','ot']

# ── per-match record ──────────────────────────────────────────────────────

records = []
for m in all_m:
    ref = (m.get('referees') or {}).get('main')
    if not ref: continue
    fouls = m.get('fouls') or []
    period_counts = {p: 0 for p in PERIODS}
    for f in fouls:
        period_counts[foul_period(f)] += 1
    series = 'dam' if m in dam else 'herr'
    records.append({
        'matchId': m['matchId'],
        'season':  m['season'],
        'series':  series,
        'homeTeam': m['homeTeam'],
        'awayTeam': m['awayTeam'],
        'ref':     ref,
        'fouls_total': len(fouls),
        'periods': period_counts,
    })

print(f'Records med domarinfo: {len(records)}')

# ── ligamedel per period (andel av matchens utvisningar) ──────────────────

def league_period_stats(recs):
    totals = {p: 0 for p in PERIODS}
    grand = 0
    for r in recs:
        for p in PERIODS: totals[p] += r['periods'][p]
        grand += r['fouls_total']
    if grand == 0: return {p: 0 for p in PERIODS}
    return {p: totals[p]/grand for p in PERIODS}

herr_recs = [r for r in records if r['series']=='herr']
dam_recs  = [r for r in records if r['series']=='dam']
league_herr = league_period_stats(herr_recs)
league_dam  = league_period_stats(dam_recs)
print('Ligamedel herr period-andelar:')
for p in PERIODS: print(f'  {p}: {league_herr[p]*100:.1f}%')

# ── grupera per domare ─────────────────────────────────────────────────────

by_ref = defaultdict(list)
for r in records: by_ref[r['ref']].append(r)

# ── klubbmix-justerat fouls/match ──────────────────────────────────────────
# Läs befintlig klubbmix-justering om tillgänglig; annars räkna råsiffra

clubmix_by_ref = {}
if CM_J.exists():
    with open(CM_J) as f: cm = json.load(f)
    for entry in cm.get('referees', []):
        clubmix_by_ref[entry['name']] = entry.get('adjusted_fouls_per_match')

# ── per domare-aggregat ───────────────────────────────────────────────────

profiles = []
N_REFS = sum(1 for v in by_ref.values() if len(v) >= MIN_MATCHES)

for ref, recs in sorted(by_ref.items()):
    if len(recs) < MIN_MATCHES: continue
    series = max(set(r['series'] for r in recs), key=lambda s: sum(1 for r in recs if r['series']==s))
    league = league_herr if series == 'herr' else league_dam

    # Raw fouls/match
    raw_avg = sum(r['fouls_total'] for r in recs) / len(recs)
    adjusted = clubmix_by_ref.get(ref, raw_avg)
    adj_dev = adjusted - (sum(r['fouls_total'] for r in herr_recs if r['fouls_total']>0)/len(herr_recs) if series=='herr' else sum(r['fouls_total'] for r in dam_recs)/len(dam_recs))

    # Period distribution (andel av matchens utvisningar)
    period_andelar = {}
    for p in PERIODS:
        vals = [r['periods'][p] / r['fouls_total'] if r['fouls_total'] > 0 else 0 for r in recs]
        avg_p = sum(vals) / len(vals)
        ci_p  = bootstrap_ci(vals)
        league_p = league[p]
        diff  = avg_p - league_p
        # z approximation: (mean - pop_mean) / se
        se = (sum((v - avg_p)**2 for v in vals) / max(1, len(vals)-1))**0.5 / len(vals)**0.5
        z  = diff / se if se > 0 else 0
        period_andelar[p] = {
            'ref_pct':    round(avg_p*100, 2),
            'league_pct': round(league_p*100, 2),
            'diff_pp':    round(diff*100, 2),
            'z':          round(z, 3),
            'ci':         [round(ci_p[0]*100,2), round(ci_p[1]*100,2)],
        }

    # Säsongsstabilitet: per-säsong period-andelar om n≥10
    by_season = defaultdict(list)
    for r in recs: by_season[r['season']].append(r)
    season_profiles = {}
    for s, srecs in by_season.items():
        if len(srecs) < 10: continue
        sp = {}
        for p in PERIODS:
            vals = [r['periods'][p] / r['fouls_total'] if r['fouls_total'] > 0 else 0 for r in srecs]
            sp[p] = round(sum(vals)/len(vals)*100, 1)
        season_profiles[s] = {'n': len(srecs), 'periods': sp}

    # Korrelation: är z-score för period i korrelerat med total utvisningsfrekvens?
    # (enkelt: noter om deras most-deviant period är i linje med deras total-avvikelse)
    total_z_direction = 1 if raw_avg > sum(r['fouls_total'] for r in herr_recs)/len(herr_recs) else -1
    most_deviant_period = max(PERIODS, key=lambda p: abs(period_andelar[p]['z']))
    most_deviant_z     = period_andelar[most_deviant_period]['z']

    # Klubbmix-justerad periodprofil: om vi antar att klubbmix påverkar totalt men inte fördelningen
    # (simplifiering — perioder kan vara matchup-specifika men vi har inte data att dekomponera det)
    # Rapport om avvikelser som överlever |z|>2 efter Bonferroni

    sig_periods = []
    for p in PERIODS:
        z = period_andelar[p]['z']
        if abs(z) > 2:
            p_raw = 2*(1 - min(0.9999, abs(z)/4))  # approximation, HAS_SCIPY better
            if HAS_SCIPY:
                p_raw = 2*(1 - stats.norm.cdf(abs(z)))
            p_bonf = min(1.0, p_raw * N_REFS)
            sig_periods.append({'period': p, 'z': round(z,3),
                                 'p_raw': round(p_raw,4), 'p_bonf': round(p_bonf,4)})

    profiles.append({
        'ref': ref,
        'n': len(recs),
        'series': series,
        'seasons': sorted(by_season.keys()),
        'raw_fouls_per_match': round(raw_avg, 3),
        'adjusted_fouls_per_match': round(adjusted, 3) if adjusted else None,
        'period_profiles': period_andelar,
        'season_profiles': season_profiles,
        'significant_periods_bonf': sig_periods,
        'most_deviant_period': most_deviant_period,
        'most_deviant_z': round(most_deviant_z, 3),
    })

profiles.sort(key=lambda x: -x['n'])

# ── sammanfattning ─────────────────────────────────────────────────────────

print(f'\n{len(profiles)} domare med n≥{MIN_MATCHES}')
any_sig = sum(1 for p in profiles if p['significant_periods_bonf'])
print(f'Domare med minst en signifikant period (Bonferroni p<0.05): {any_sig}')

print('\nTop 5 mest periodavvikande (|z| på mest avvikande period):')
sorted_p = sorted(profiles, key=lambda x: -abs(x['most_deviant_z']))
for p in sorted_p[:5]:
    sig_mark = '* SIGNIFIKANT' if p['significant_periods_bonf'] else ''
    print(f'  {p["ref"]}: period={p["most_deviant_period"]} z={p["most_deviant_z"]} {sig_mark}')

print('\nPeriodmönster per domare (diff från liga, pp):')
for p in profiles[:8]:
    row = ' | '.join(f'{pp}: {p["period_profiles"][pp]["diff_pp"]:+.1f}pp (z={p["period_profiles"][pp]["z"]:+.2f})' for pp in PERIODS)
    print(f'  {p["ref"]}: {row}')

# ── spara ─────────────────────────────────────────────────────────────────

out = {
    '_meta': {
        'description': 'INTERN — Domare tidsprofiler per matchperiod. Ej för publik kanal.',
        'n_referees': len(profiles),
        'min_matches': MIN_MATCHES,
        'period_definition': {
            'early_1h':  'half=1, minute 0-29',
            'late_1h':   'half=1, minute 30+  (inkl 1H tilläggstid)',
            'early_2h':  'half=2, minute 46-59',
            'mid_2h':    'half=2, minute 60-74',
            'late_2h':   'half=2, minute 75-89',
            'ot':        'half=2, minute 90+',
        },
        'note_clubmix': 'Periodfördelning är ej klubbmix-justerad (data för per-period matchup-baseline saknas). Totalvolymjustering är hämtad från INTERNAL_referee_clubmix.json.',
        'bonferroni_n': N_REFS,
    },
    'league_herr': {p: round(v*100,2) for p,v in league_herr.items()},
    'league_dam':  {p: round(v*100,2) for p,v in league_dam.items()},
    'profiles': profiles,
}
with open(OUT,'w') as f: json.dump(out, f, ensure_ascii=False, indent=2)
print(f'\n✓ Sparad: {OUT}')
