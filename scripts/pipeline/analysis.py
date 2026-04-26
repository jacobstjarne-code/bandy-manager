"""
Analysis functions for findings pipeline.
Each function takes the bandygrytan data dict + params and returns
a structured result dict that Claude can write a finding from.
"""

from collections import defaultdict
from typing import Any


def _load_series(data: dict, series: str) -> list[dict]:
    """Return regular-season matches for herr or dam."""
    src = data.get(series, {})
    matches = src.get('matches', [])
    return [m for m in matches if m.get('phase') == 'regular']


def _pearson(xs: list[float], ys: list[float]) -> float:
    n = len(xs)
    if n < 2:
        return 0.0
    mx, my = sum(xs)/n, sum(ys)/n
    st = (sum((x-mx)**2 for x in xs)/n)**0.5
    sy = (sum((y-my)**2 for y in ys)/n)**0.5
    if st == 0 or sy == 0:
        return 0.0
    return sum((x-mx)*(y-my) for x,y in zip(xs,ys))/(n*st*sy)


def time_split(data: dict, params: dict) -> dict:
    """Split goal frequency around a boundary within a 10-min bucket."""
    matches = _load_series(data, params.get('series', 'herr'))
    split = params['split_at']
    b_start, b_end = params['bucket_start'], params['bucket_end']

    before = after = total = 0
    for m in matches:
        for g in m.get('goals', []):
            mn = g.get('minute', 0)
            if b_start <= mn <= b_end:
                total += 1
                if mn <= split:
                    before += 1
                else:
                    after += 1

    all_goals = sum(len(m.get('goals', [])) for m in matches)
    return {
        'type': 'time_split',
        'question': f'Minuter {b_start}–{split} vs {split+1}–{b_end}',
        'before_label': f'{b_start}–{split} min',
        'after_label': f'{split+1}–{b_end} min',
        'before_count': before,
        'after_count': after,
        'before_pct_of_bucket': round(before/(total or 1)*100, 1),
        'after_pct_of_bucket': round(after/(total or 1)*100, 1),
        'before_pct_of_all': round(before/(all_goals or 1)*100, 1),
        'after_pct_of_all': round(after/(all_goals or 1)*100, 1),
        'total_in_bucket': total,
        'total_goals': all_goals,
        'match_count': len(matches),
        'series': params.get('series', 'herr'),
    }


def goals_by_margin(data: dict, params: dict) -> dict:
    """Distribution of goal minutes split by match margin at time of goal."""
    matches = _load_series(data, params.get('series', 'herr'))

    buckets = {'tight': defaultdict(int), 'open': defaultdict(int)}
    for m in matches:
        goals = sorted(m.get('goals', []), key=lambda g: g.get('minute', 0))
        home = away = 0
        for g in goals:
            mn = g.get('minute', 0)
            if not (1 <= mn <= 90):
                continue
            margin = abs(home - away)
            cat = 'tight' if margin <= 1 else 'open'
            buckets[cat][mn // 10 * 10] += 1
            if g['team'] == 'home':
                home += 1
            else:
                away += 1

    # Normalise to pct
    result = {}
    for cat in ('tight', 'open'):
        total = sum(buckets[cat].values()) or 1
        result[cat] = {
            f'{k}-{k+9}': round(v/total*100, 1)
            for k, v in sorted(buckets[cat].items())
        }

    return {
        'type': 'goals_by_margin',
        'tight_match_distribution': result['tight'],
        'open_match_distribution': result['open'],
        'match_count': len(matches),
        'series': params.get('series', 'herr'),
    }


def goals_by_type_over_time(data: dict, params: dict) -> dict:
    """Corner vs open-play goals across 10-min buckets."""
    matches = _load_series(data, params.get('series', 'herr'))

    by_type: dict[str, dict[int, int]] = {'corner': defaultdict(int), 'open': defaultdict(int), 'penalty': defaultdict(int)}
    for m in matches:
        for g in m.get('goals', []):
            mn = g.get('minute', 0)
            if not (1 <= mn <= 90):
                continue
            gtype = g.get('type', 'open')
            cat = gtype if gtype in by_type else 'open'
            by_type[cat][mn // 10 * 10] += 1

    totals = {t: sum(v.values()) or 1 for t, v in by_type.items()}
    result = {}
    for t, counts in by_type.items():
        result[t] = {
            f'{k}-{k+9}': round(v/totals[t]*100, 1)
            for k, v in sorted(counts.items())
        }

    return {
        'type': 'goals_by_type_over_time',
        'by_type': result,
        'totals': {t: sum(v.values()) for t, v in by_type.items()},
        'match_count': len(matches),
        'series': params.get('series', 'herr'),
    }


def goals_by_phase_detail(data: dict, params: dict) -> dict:
    """Goals per match and htLeadWinPct per playoff phase."""
    all_matches = data.get('herr', {}).get('matches', [])
    phases = params.get('phases', ['quarterfinal', 'semifinal', 'final'])
    result = []
    for phase in phases:
        ms = [m for m in all_matches if m.get('phase') == phase]
        if not ms:
            continue
        total_goals = sum(m['homeScore']+m['awayScore'] for m in ms)
        avg = total_goals / len(ms)
        ht_wins = ht_total = 0
        for m in ms:
            hh, ha = m.get('halfTimeHome'), m.get('halfTimeAway')
            if hh is None or ha is None or hh == ha:
                continue
            ht_total += 1
            if (hh > ha and m['homeScore'] > m['awayScore']) or (ha > hh and m['awayScore'] > m['homeScore']):
                ht_wins += 1
        corner_goals = sum(m.get('cornerGoalsHome', 0) + m.get('cornerGoalsAway', 0) for m in ms)
        total_goals = sum(m['homeScore'] + m['awayScore'] for m in ms)
        result.append({
            'phase': phase,
            'match_count': len(ms),
            'avg_goals': round(avg, 2),
            'ht_lead_win_pct': round(ht_wins/ht_total*100, 1) if ht_total else None,
            'ht_total': ht_total,
            'corner_goal_pct': round(corner_goals / (total_goals or 1) * 100, 1),
            'corner_goals': corner_goals,
            'total_goals': total_goals,
        })
    return {'type': 'goals_by_phase_detail', 'phases': result}


def corner_efficiency_comparison(data: dict, params: dict) -> dict:
    """Corner goal% and corners per match for herr vs dam."""
    result = []
    for series in params.get('series', ['herr', 'dam']):
        matches = _load_series(data, series)
        if not matches:
            continue
        total_goals = sum(m['homeScore']+m['awayScore'] for m in matches)
        corner_goals = sum(m.get('cornerGoalsHome',0)+m.get('cornerGoalsAway',0) for m in matches)
        corners = sum((m.get('corners') or {}).get('home', 0) + (m.get('corners') or {}).get('away', 0) for m in matches)
        result.append({
            'series': series,
            'match_count': len(matches),
            'avg_goals': round(total_goals/len(matches), 2),
            'avg_corners': round(corners/len(matches), 2),
            'corner_goal_pct': round(corner_goals/(total_goals or 1)*100, 1),
            'corner_conversion': round(corner_goals/(corners or 1)*100, 1),
        })
    return {'type': 'corner_efficiency_comparison', 'series': result}


def time_distribution_comparison(data: dict, params: dict) -> dict:
    """Side-by-side 10-min goal distribution for multiple series."""
    result = []
    for series in params.get('series', ['herr', 'dam']):
        matches = _load_series(data, series)
        if not matches:
            continue
        buckets: dict[int, int] = defaultdict(int)
        total = 0
        for m in matches:
            for g in m.get('goals', []):
                mn = g.get('minute', 0)
                if 1 <= mn <= 90:
                    buckets[mn // 10 * 10] += 1
                    total += 1
        result.append({
            'series': series,
            'match_count': len(matches),
            'total_goals': total,
            'distribution': {f'{k}-{k+9}': round(v/(total or 1)*100, 1) for k, v in sorted(buckets.items())},
        })
    return {'type': 'time_distribution_comparison', 'series': result}


def corner_home_away(data: dict, params: dict) -> dict:
    """Corner goals scored at home vs away for each team."""
    matches = _load_series(data, params.get('series', 'herr'))
    home_cg = sum(m.get('cornerGoalsHome', 0) for m in matches)
    away_cg = sum(m.get('cornerGoalsAway', 0) for m in matches)
    home_g = sum(m['homeScore'] for m in matches)
    away_g = sum(m['awayScore'] for m in matches)
    home_c = sum((m.get('corners') or {}).get('home', 0) for m in matches)
    away_c = sum((m.get('corners') or {}).get('away', 0) for m in matches)
    return {
        'type': 'corner_home_away',
        'home': {
            'corner_goal_pct': round(home_cg/(home_g or 1)*100, 1),
            'corner_conversion': round(home_cg/(home_c or 1)*100, 1),
            'goals': home_g,
            'corner_goals': home_cg,
            'corners': home_c,
        },
        'away': {
            'corner_goal_pct': round(away_cg/(away_g or 1)*100, 1),
            'corner_conversion': round(away_cg/(away_c or 1)*100, 1),
            'goals': away_g,
            'corner_goals': away_cg,
            'corners': away_c,
        },
        'match_count': len(matches),
        'series': params.get('series', 'herr'),
    }


def ht_lead_by_size(data: dict, params: dict) -> dict:
    """Win% when leading at HT by 1, 2, 3+ goals."""
    matches = _load_series(data, params.get('series', 'herr'))
    buckets: dict[str, dict] = {'1': {'wins':0,'total':0}, '2': {'wins':0,'total':0}, '3+': {'wins':0,'total':0}}
    for m in matches:
        hh, ha = m.get('halfTimeHome'), m.get('halfTimeAway')
        if hh is None or ha is None or hh == ha:
            continue
        diff = abs(hh - ha)
        cat = '1' if diff == 1 else ('2' if diff == 2 else '3+')
        buckets[cat]['total'] += 1
        leader_home = hh > ha
        if (leader_home and m['homeScore'] > m['awayScore']) or (not leader_home and m['awayScore'] > m['homeScore']):
            buckets[cat]['wins'] += 1
    result = []
    for cat, v in buckets.items():
        result.append({
            'lead_size': cat,
            'match_count': v['total'],
            'win_pct': round(v['wins']/(v['total'] or 1)*100, 1),
        })
    return {'type': 'ht_lead_by_size', 'by_lead_size': result, 'series': params.get('series', 'herr')}


def ht_lead_home_away(data: dict, params: dict) -> dict:
    """Win% when home team leads at HT vs when away team leads."""
    matches = _load_series(data, params.get('series', 'herr'))
    cats = {'home_leads': {'wins':0,'total':0}, 'away_leads': {'wins':0,'total':0}}
    for m in matches:
        hh, ha = m.get('halfTimeHome'), m.get('halfTimeAway')
        if hh is None or ha is None or hh == ha:
            continue
        if hh > ha:
            cats['home_leads']['total'] += 1
            if m['homeScore'] > m['awayScore']:
                cats['home_leads']['wins'] += 1
        else:
            cats['away_leads']['total'] += 1
            if m['awayScore'] > m['homeScore']:
                cats['away_leads']['wins'] += 1
    return {
        'type': 'ht_lead_home_away',
        'home_leads': {**cats['home_leads'], 'win_pct': round(cats['home_leads']['wins']/(cats['home_leads']['total'] or 1)*100, 1)},
        'away_leads': {**cats['away_leads'], 'win_pct': round(cats['away_leads']['wins']/(cats['away_leads']['total'] or 1)*100, 1)},
        'series': params.get('series', 'herr'),
    }


def comeback_timing(data: dict, params: dict) -> dict:
    """Among comebacks, when did the first 2H goal come?"""
    matches = _load_series(data, params.get('series', 'herr'))
    comeback_minutes: list[int] = []
    non_comeback_minutes: list[int] = []

    for m in matches:
        hh, ha = m.get('halfTimeHome'), m.get('halfTimeAway')
        if hh is None or ha is None or hh == ha:
            continue
        # Who's behind at HT?
        trailer = 'home' if ha > hh else 'away'
        final_winner = 'home' if m['homeScore'] > m['awayScore'] else ('away' if m['awayScore'] > m['homeScore'] else 'draw')

        goals_2h = sorted([g for g in m.get('goals', []) if g.get('minute', 0) > 45], key=lambda g: g['minute'])
        if not goals_2h:
            continue

        first_trailer_goal = next((g['minute'] for g in goals_2h if g['team'] == trailer), None)
        if first_trailer_goal is None:
            continue

        if final_winner == trailer:
            comeback_minutes.append(first_trailer_goal)
        else:
            non_comeback_minutes.append(first_trailer_goal)

    def avg(lst):
        return round(sum(lst)/len(lst), 1) if lst else None

    def bucket(lst):
        b: dict[str, int] = {}
        for mn in lst:
            k = f'{(mn-1)//5*5+46}-{(mn-1)//5*5+50}'
            b[k] = b.get(k, 0) + 1
        return dict(sorted(b.items()))

    return {
        'type': 'comeback_timing',
        'comeback_count': len(comeback_minutes),
        'non_comeback_count': len(non_comeback_minutes),
        'avg_first_goal_comeback': avg(comeback_minutes),
        'avg_first_goal_non_comeback': avg(non_comeback_minutes),
        'comeback_distribution': bucket(comeback_minutes),
        'non_comeback_distribution': bucket(non_comeback_minutes),
        'series': params.get('series', 'herr'),
    }


def corner_by_team(data: dict, params: dict) -> dict:
    """Corner stats per team — goals, conversion, home vs away."""
    matches = _load_series(data, params.get('series', 'herr'))
    teams: dict[str, dict] = defaultdict(lambda: {
        'corners_home': 0, 'corners_away': 0,
        'corner_goals_home': 0, 'corner_goals_away': 0,
        'goals_home': 0, 'goals_away': 0,
        'matches_home': 0, 'matches_away': 0,
    })
    for m in matches:
        ht = m['homeTeam']
        at = m['awayTeam']
        c = m.get('corners') or {}
        teams[ht]['corners_home'] += c.get('home', 0)
        teams[at]['corners_away'] += c.get('away', 0)
        teams[ht]['corner_goals_home'] += m.get('cornerGoalsHome', 0)
        teams[at]['corner_goals_away'] += m.get('cornerGoalsAway', 0)
        teams[ht]['goals_home'] += m['homeScore']
        teams[at]['goals_away'] += m['awayScore']
        teams[ht]['matches_home'] += 1
        teams[at]['matches_away'] += 1

    result = []
    for team, v in sorted(teams.items()):
        total_cg = v['corner_goals_home'] + v['corner_goals_away']
        total_g = v['goals_home'] + v['goals_away']
        total_c = v['corners_home'] + v['corners_away']
        result.append({
            'team': team,
            'matches': v['matches_home'] + v['matches_away'],
            'corner_goals': total_cg,
            'corners': total_c,
            'corner_goal_pct': round(total_cg / (total_g or 1) * 100, 1),
            'corner_conversion': round(total_cg / (total_c or 1) * 100, 1),
            'avg_corners_per_match': round(total_c / ((v['matches_home'] + v['matches_away']) or 1), 1),
        })

    return {
        'type': 'corner_by_team',
        'teams': result,
        'match_count': len(matches),
        'series': params.get('series', 'herr'),
    }


REGISTRY: dict[str, Any] = {
    'time_split': time_split,
    'corner_by_team': corner_by_team,
    'goals_by_margin': goals_by_margin,
    'goals_by_type_over_time': goals_by_type_over_time,
    'goals_by_phase_detail': goals_by_phase_detail,
    'corner_efficiency_comparison': corner_efficiency_comparison,
    'time_distribution_comparison': time_distribution_comparison,
    'corner_home_away': corner_home_away,
    'ht_lead_by_size': ht_lead_by_size,
    'ht_lead_home_away': ht_lead_home_away,
    'comeback_timing': comeback_timing,
}
