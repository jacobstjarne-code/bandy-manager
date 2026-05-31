"""
analyze-referees.py

Aggregerar domarstatistik från bandygrytan_detailed.json (schemaVersion 3).

Output:
  docs/data/INTERNAL_referee_per_match.json   — en rad per match
  docs/data/INTERNAL_referee_aggregates.json  — en post per domare (n >= 30)

INTERN. Domarnamn publiceras INTE i Bandy Brain eller publik kanal.

Statistisk metod:
  - Binomialtest (scipy.stats.binomtest) för andelar (hemmavinst%, draw%, etc.)
  - Welchs t-test för snitt (goals/match, fouls/match, etc.)
  - Bonferroni-korrigering: multiplika med antal domare per test (rapporteras separat)
  - Konfidensintervall: Wilson score interval för andelar, bootstrap för snitt
"""

import json
import math
import sys
from collections import defaultdict
from pathlib import Path

try:
    from scipy import stats
    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False
    print("VARNING: scipy ej installerat — statistiska tester ej tillgängliga. Installera: pip3 install scipy", file=sys.stderr)

# ── Baselines per serie ──────────────────────────────────────────────────────
BASELINES = {
    'herr': {
        'home_win_pct': 0.502,
        'draw_pct': 0.116,
        'away_win_pct': 0.382,
        'goals_per_match': 9.12,
        'fouls_per_match': None,   # beräknas från data
        'penalties_per_match': None,
    },
    'dam': {
        'home_win_pct': 0.476,     # separat baseline per spec
        'draw_pct': None,
        'away_win_pct': None,
        'goals_per_match': None,
        'fouls_per_match': None,
        'penalties_per_match': None,
    },
}

MIN_MATCHES = 30  # tröskel för aggregat

# ── Hjälpfunktioner ──────────────────────────────────────────────────────────

def wilson_ci(p, n, z=1.96):
    """Wilson score interval för andel p med n observationer."""
    if n == 0:
        return (0.0, 1.0)
    denom = 1 + z*z/n
    center = (p + z*z/(2*n)) / denom
    margin = (z * math.sqrt(p*(1-p)/n + z*z/(4*n*n))) / denom
    return (max(0, center - margin), min(1, center + margin))

def bootstrap_mean_ci(values, n_bootstrap=1000, ci=0.95):
    """Bootstrap konfidensintervall för medelvärde."""
    if not values:
        return (None, None)
    import random
    rng = random.Random(42)
    means = []
    for _ in range(n_bootstrap):
        sample = [rng.choice(values) for _ in range(len(values))]
        means.append(sum(sample) / len(sample))
    means.sort()
    lo_idx = int((1 - ci) / 2 * n_bootstrap)
    hi_idx = int((1 - (1 - ci) / 2) * n_bootstrap)
    return (means[lo_idx], means[min(hi_idx, len(means)-1)])

def z_score(value, mean, std):
    if std == 0:
        return None
    return (value - mean) / std

def binomtest_p(k, n, p):
    """Tvåsidigt binomialtest. Returnerar p-värde."""
    if not HAS_SCIPY or n == 0:
        return None
    result = stats.binomtest(k, n, p, alternative='two-sided')
    return result.pvalue

def welch_t_p(sample, pop_values):
    """Welchs t-test: sample vs population. Returnerar p-värde."""
    if not HAS_SCIPY or len(sample) < 2 or len(pop_values) < 2:
        return None
    _, p = stats.ttest_ind(sample, pop_values, equal_var=False)
    return p

# ── Läs data ─────────────────────────────────────────────────────────────────

DATA_PATH = Path(__file__).parent.parent / 'docs/data/bandygrytan_detailed.json'
with open(DATA_PATH) as f:
    raw = json.load(f)

herr_matches = raw['herr']['matches']
dam_matches = raw['dam']['matches']
all_matches = herr_matches + dam_matches

print(f"Läst: {len(herr_matches)} herr + {len(dam_matches)} dam = {len(all_matches)} totalt")

# ── Bygg per-match-lista (Output A) ──────────────────────────────────────────

per_match = []
skipped_no_ref = 0

for m in all_matches:
    refs = m.get('referees')
    if not refs or not refs.get('main'):
        skipped_no_ref += 1
        continue

    # Bestäm serie
    series = m.get('gender', 'herr')
    if series not in ('herr', 'dam'):
        series = 'herr' if m in herr_matches else 'dam'

    # Utfall
    hs = m.get('homeScore', 0) or 0
    as_ = m.get('awayScore', 0) or 0
    home_win = hs > as_
    draw = hs == as_
    away_win = hs < as_

    # Halftid
    ht_home = m.get('halfTimeHome')
    ht_away = m.get('halfTimeAway')

    # Fouls/utvisningar — ordinarie tid
    fouls = m.get('fouls', []) or []
    fouls_count = len(fouls)

    # Penalties — antal tilldelade (ej mål)
    penalties_awarded = m.get('penaltiesAwarded', 0) or 0
    # Alternativt: penalty goals som proxy
    penalty_goals = m.get('penaltyGoals', 0) or 0

    # Hörn (lagrat som { home: N, away: N })
    corners_raw = m.get('corners', {}) or {}
    corners = (corners_raw.get('home', 0) or 0) + (corners_raw.get('away', 0) or 0)

    # Total mål
    total_goals = hs + as_

    per_match.append({
        'matchId': str(m.get('matchId', '')),
        'season': m.get('season', ''),
        'phase': m.get('phase', 'regular'),
        'series': series,
        'main_referee': refs['main'],
        'assistants': refs.get('assistants', []),
        'homeTeam': m.get('homeTeam', ''),
        'awayTeam': m.get('awayTeam', ''),
        'homeGoals': hs,
        'awayGoals': as_,
        'homeWin': home_win,
        'draw': draw,
        'awayWin': away_win,
        'halfTimeHome': ht_home,
        'halfTimeAway': ht_away,
        'fouls_count': fouls_count,
        'penalties_awarded': penalties_awarded,
        'penalty_goals': penalty_goals,
        'total_goals': total_goals,
        'corners_total': corners,
    })

print(f"Per-match: {len(per_match)} rader ({skipped_no_ref} matchade hoppad — ingen domare)")

# ── Beräkna ligamedel (för z-scores) ─────────────────────────────────────────

def league_stats(rows, series_filter=None):
    subset = rows if series_filter is None else [r for r in rows if r['series'] == series_filter]
    if not subset:
        return {}
    n = len(subset)
    hw = sum(1 for r in subset if r['homeWin'])
    dr = sum(1 for r in subset if r['draw'])
    aw = sum(1 for r in subset if r['awayWin'])
    goals = [r['total_goals'] for r in subset]
    fouls = [r['fouls_count'] for r in subset]
    penalties = [r['penalty_goals'] for r in subset]
    corners = [r['corners_total'] for r in subset]

    def safe_std(vals):
        if len(vals) < 2:
            return 0
        mean = sum(vals) / len(vals)
        var = sum((x - mean)**2 for x in vals) / (len(vals) - 1)
        return math.sqrt(var)

    return {
        'n': n,
        'home_win_pct': hw / n,
        'draw_pct': dr / n,
        'away_win_pct': aw / n,
        'avg_goals': sum(goals) / n,
        'std_goals': safe_std(goals),
        'avg_fouls': sum(fouls) / n,
        'std_fouls': safe_std(fouls),
        'avg_penalties': sum(penalties) / n,
        'std_penalties': safe_std(penalties),
        'avg_corners': sum(corners) / n,
        'std_corners': safe_std(corners),
        'all_goals': goals,
        'all_fouls': fouls,
        'all_penalties': penalties,
    }

league_herr = league_stats(per_match, 'herr')
league_dam = league_stats(per_match, 'dam')
league_all = league_stats(per_match)

print(f"\nLigamedel herr: {league_herr['avg_goals']:.2f} mål/match, {league_herr['home_win_pct']:.3f} hemmavinst, n={league_herr['n']}")
print(f"Ligamedel dam:  {league_dam['avg_goals']:.2f} mål/match, {league_dam['home_win_pct']:.3f} hemmavinst, n={league_dam['n']}")

# ── Aggregera per domare (Output B) ──────────────────────────────────────────

# Gruppera per domare
by_referee = defaultdict(list)
for r in per_match:
    by_referee[r['main_referee']].append(r)

print(f"\nUnika huvuddomare: {len(by_referee)}")
print(f"Domare med n >= {MIN_MATCHES}: {sum(1 for v in by_referee.values() if len(v) >= MIN_MATCHES)}")

aggregates = []

for name, rows in sorted(by_referee.items()):
    total_n = len(rows)
    if total_n < MIN_MATCHES:
        continue

    # Per fas och serie
    phases = defaultdict(list)
    series_groups = defaultdict(list)
    for r in rows:
        phases[r['phase']].append(r)
        series_groups[r['series']].append(r)

    seasons_active = sorted(set(r['season'] for r in rows))

    # Grundläggande snitt
    home_wins = sum(1 for r in rows if r['homeWin'])
    draws = sum(1 for r in rows if r['draw'])
    away_wins = sum(1 for r in rows if r['awayWin'])

    goals_list = [r['total_goals'] for r in rows]
    fouls_list = [r['fouls_count'] for r in rows]
    pen_list = [r['penalty_goals'] for r in rows]
    corners_list = [r['corners_total'] for r in rows]

    avg_goals = sum(goals_list) / total_n
    avg_fouls = sum(fouls_list) / total_n
    avg_penalties = sum(pen_list) / total_n
    avg_corners = sum(corners_list) / total_n

    hw_pct = home_wins / total_n
    draw_pct = draws / total_n
    aw_pct = away_wins / total_n

    # Konfidensintervall
    hw_ci = wilson_ci(hw_pct, total_n)
    goals_ci = bootstrap_mean_ci(goals_list)
    fouls_ci = bootstrap_mean_ci(fouls_list)

    # HT-lead win pct
    ht_lead_rows = [r for r in rows if r['halfTimeHome'] is not None and r['halfTimeAway'] is not None
                    and r['halfTimeHome'] != r['halfTimeAway']]
    if ht_lead_rows:
        ht_lead_wins = sum(1 for r in ht_lead_rows if
            (r['halfTimeHome'] > r['halfTimeAway'] and r['homeWin']) or
            (r['halfTimeHome'] < r['halfTimeAway'] and r['awayWin']))
        ht_lead_win_pct = ht_lead_wins / len(ht_lead_rows)
    else:
        ht_lead_win_pct = None

    # First goal win pct
    goals_data = [r for r in rows if isinstance(r.get('total_goals'), int) and r['total_goals'] > 0]
    # (Vi har inte first_goal per match i per-match — hoppa över eller approximera)
    # Approximation: lagrat ej per match. Lämnas som None.
    first_goal_win_pct = None

    # Utvisningsfördelning per period (0-29, 30-59, 60-89, 90+)
    period_fouls = [0, 0, 0, 0]
    total_timed_fouls = 0
    for m_ref in rows:
        # Vi har fouls_count men inte per-minut i aggregatet
        # per-match har vi fouls[].minute från källdatan — vi måste gå tillbaka till raw data
        pass
    # Notera: detaljerad minutfördelning kräver att vi läser fouls från raw-datan
    # (per_match har bara count). Genomförs i nästa fas om data behövs.
    foul_period_dist = None  # kräver raw match data

    # Z-scores och p-värden vs ligamedel (samma serie)
    dominant_series = max(series_groups, key=lambda s: len(series_groups[s]))
    league = league_herr if dominant_series == 'herr' else league_dam

    hw_baseline = BASELINES[dominant_series]['home_win_pct']
    hw_p = binomtest_p(home_wins, total_n, hw_baseline)
    hw_z = z_score(hw_pct, league['home_win_pct'], math.sqrt(league['home_win_pct'] * (1 - league['home_win_pct']) / total_n))

    goals_p = welch_t_p(goals_list, league['all_goals'])
    goals_z = z_score(avg_goals, league['avg_goals'], league['std_goals'] / math.sqrt(total_n) if league['std_goals'] > 0 else 1)

    fouls_p = welch_t_p(fouls_list, league['all_fouls'])
    fouls_z = z_score(avg_fouls, league['avg_fouls'], league['std_fouls'] / math.sqrt(total_n) if league['std_fouls'] > 0 else 1)

    pen_p = welch_t_p(pen_list, league['all_penalties'])
    pen_z = z_score(avg_penalties, league['avg_penalties'], league['std_penalties'] / math.sqrt(total_n) if league['std_penalties'] > 0 else 1)

    aggregates.append({
        'main_referee': name,
        'match_count_total': total_n,
        'match_count_per_phase': {p: len(v) for p, v in phases.items()},
        'match_count_per_series': {s: len(v) for s, v in series_groups.items()},
        'seasons_active': seasons_active,
        'dominant_series': dominant_series,

        # Snitt + CI
        'avg_goals_per_match': round(avg_goals, 3),
        'avg_goals_ci_95': [round(x, 3) if x is not None else None for x in goals_ci],
        'avg_fouls_per_match': round(avg_fouls, 3),
        'avg_fouls_ci_95': [round(x, 3) if x is not None else None for x in fouls_ci],
        'avg_penalties_per_match': round(avg_penalties, 3),
        'avg_corners_per_match': round(avg_corners, 3),

        # Utfall
        'home_win_pct': round(hw_pct, 4),
        'home_win_ci_95': [round(x, 4) for x in hw_ci],
        'draw_pct': round(draw_pct, 4),
        'away_win_pct': round(aw_pct, 4),
        'ht_lead_win_pct': round(ht_lead_win_pct, 4) if ht_lead_win_pct is not None else None,
        'first_goal_win_pct': first_goal_win_pct,

        # Skevhet vs ligamedel
        'home_win_skew': {
            'referee_pct': round(hw_pct, 4),
            'baseline_pct': hw_baseline,
            'league_avg_pct': round(league['home_win_pct'], 4),
            'z_score': round(hw_z, 3) if hw_z is not None else None,
            'binomial_p_uncorrected': round(hw_p, 4) if hw_p is not None else None,
            'n': total_n,
        },
        'goals_skew': {
            'referee_avg': round(avg_goals, 3),
            'league_avg': round(league['avg_goals'], 3),
            'z_score': round(goals_z, 3) if goals_z is not None else None,
            'welch_p_uncorrected': round(goals_p, 4) if goals_p is not None else None,
        },
        'fouls_skew': {
            'referee_avg': round(avg_fouls, 3),
            'league_avg': round(league['avg_fouls'], 3),
            'z_score': round(fouls_z, 3) if fouls_z is not None else None,
            'welch_p_uncorrected': round(fouls_p, 4) if fouls_p is not None else None,
        },
        'penalties_skew': {
            'referee_avg': round(avg_penalties, 3),
            'league_avg': round(league['avg_penalties'], 3),
            'z_score': round(pen_z, 3) if pen_z is not None else None,
            'welch_p_uncorrected': round(pen_p, 4) if pen_p is not None else None,
        },
    })

# Sortera på match_count_total desc
aggregates.sort(key=lambda x: -x['match_count_total'])

# Bonferroni-korrektion: antal domare (n_referees) × antal mått per test
n_referees = len(aggregates)
for agg in aggregates:
    for skew_key in ('home_win_skew', 'goals_skew', 'fouls_skew', 'penalties_skew'):
        skew = agg[skew_key]
        p_raw = skew.get('binomial_p_uncorrected') or skew.get('welch_p_uncorrected')
        if p_raw is not None:
            skew['bonferroni_p'] = round(min(1.0, p_raw * n_referees), 4)

print(f"Aggregat: {len(aggregates)} domare med n >= {MIN_MATCHES}")

# ── Spara Output A ────────────────────────────────────────────────────────────

out_a = Path(__file__).parent.parent / 'docs/data/INTERNAL_referee_per_match.json'
with open(out_a, 'w') as f:
    json.dump({
        '_meta': {
            'description': 'INTERN — en rad per match med domarinfo. EJ för publik kanal.',
            'generatedAt': __import__('datetime').datetime.now().isoformat(),
            'matchCount': len(per_match),
            'skippedNoReferee': skipped_no_ref,
        },
        'matches': per_match,
    }, f, ensure_ascii=False, indent=2)
print(f"\n✓ Output A: {out_a} ({len(per_match)} rader)")

# ── Spara Output B ────────────────────────────────────────────────────────────

out_b = Path(__file__).parent.parent / 'docs/data/INTERNAL_referee_aggregates.json'
with open(out_b, 'w') as f:
    json.dump({
        '_meta': {
            'description': f'INTERN — aggregat per huvuddomare (n >= {MIN_MATCHES}). EJ för publik kanal.',
            'generatedAt': __import__('datetime').datetime.now().isoformat(),
            'refereeCount': len(aggregates),
            'minMatchThreshold': MIN_MATCHES,
            'statisticalMethod': 'Binomialtest för andelar (scipy.stats.binomtest, tvåsidigt). Welchs t-test för snitt. Bonferroni-korrektion: p * antal_domare.',
            'note_bonferroni': f'Bonferroni multiplicerar med {n_referees} (antal domare i aggregat). Konservativ överkorrektion om tester inte är oberoende.',
            'note_fouls': 'fouls[].team är null i Bandygrytan — vi vet inte vilket lag som fick utvisningen.',
            'note_penalties': 'avg_penalties_per_match är penaltyGoals (mål på straff) som proxy för tilldelade straffar — underskattning.',
        },
        'referees': aggregates,
    }, f, ensure_ascii=False, indent=2)
print(f"✓ Output B: {out_b} ({len(aggregates)} domare)")

# ── Snabb sammanfattning till stdout ──────────────────────────────────────────

print(f"\n── Top 10 domare per antal matcher ──────────────────────────────────────")
for a in aggregates[:10]:
    hw = a['home_win_skew']
    print(f"  {a['main_referee']:<25} n={a['match_count_total']:3d}  hemmavinst={a['home_win_pct']:.1%}  mål/match={a['avg_goals_per_match']:.2f}  z_hw={hw['z_score']}")

print(f"\n── Hemmavinst z-score >2 (okorrigerat) ─────────────────────────────────")
flagged = [a for a in aggregates if a['home_win_skew']['z_score'] is not None and abs(a['home_win_skew']['z_score']) > 2]
for a in sorted(flagged, key=lambda x: abs(x['home_win_skew']['z_score']), reverse=True):
    hw = a['home_win_skew']
    print(f"  {a['main_referee']:<25} n={a['match_count_total']:3d}  hemmavinst={a['home_win_pct']:.1%}  z={hw['z_score']:.2f}  p_raw={hw['binomial_p_uncorrected']}  p_bonf={hw['bonferroni_p']}")

print(f"\n── Mål/match z-score >2 (okorrigerat) ──────────────────────────────────")
flagged_goals = [a for a in aggregates if a['goals_skew']['z_score'] is not None and abs(a['goals_skew']['z_score']) > 2]
for a in sorted(flagged_goals, key=lambda x: abs(x['goals_skew']['z_score']), reverse=True):
    gs = a['goals_skew']
    print(f"  {a['main_referee']:<25} n={a['match_count_total']:3d}  mål/match={a['avg_goals_per_match']:.2f}  z={gs['z_score']:.2f}  p={gs['welch_p_uncorrected']}")
