"""
A6 — Kalendereffekter (ANALYSSPEC_VAG2_OEXPLOATERAT.md).

Vilodagar, juluppehåll och säsongsfas mot resultat/mål/utvisningar/hemmafördel.

Kör: python3 scripts/analyze_calendar.py
Output: docs/data/calendar_effects.json + docs/data/ANALYS_CALENDAR.md

Metod:
- Per-lag-schema byggs ur `date` (finns på 100% av matcherna, format YYYY-MM-DD).
- Vilodagar: dagar sedan lagets föregående match samma säsong.
- Juluppehåll: detekteras per lag som gapet där en dec-match följs av en jan-match
  (årsskiftet). Sista före vs första efter.
- Säsongsfas: DATUM-terciler per säsong (round är None för äldre säsonger, så
  round-terciler går inte för hela datasetet — datum-terciler är ekvivalent + täcker allt).
- CI: Wilson på andelar. 2023-24 saknas i datan.
- Berör Q004 (höst vs vinter), Q167 (tidpunkt i seriespelet), Q174 (säsongsperiod).
"""
import json, sys
from collections import defaultdict
from datetime import date
sys.path.insert(0, 'scripts/pipeline')
from analysis_helpers import wilson_ci


def parse(dstr):
    y, m, d = (int(x) for x in dstr.split('-'))
    return date(y, m, d)


def team_matches(matches):
    """Per (säsong, lag): kronologisk lista av (datum, är_hemma, mål_för, mål_mot, resultat, fouls, match)."""
    by = defaultdict(list)
    for mt in matches:
        if not mt.get('date'):
            continue
        dt = parse(mt['date']); s = mt.get('season')
        hs, as_ = mt.get('homeScore') or 0, mt.get('awayScore') or 0
        nf = len(mt.get('fouls') or [])
        for is_home in (True, False):
            gf, ga = (hs, as_) if is_home else (as_, hs)
            res = 'W' if gf > ga else ('D' if gf == ga else 'L')
            tid = mt.get('homeTeamId') if is_home else mt.get('awayTeamId')
            by[(s, tid)].append({'date': dt, 'is_home': is_home, 'gf': gf, 'ga': ga,
                                 'res': res, 'fouls': nf})
    for k in by:
        by[k].sort(key=lambda x: x['date'])
    return by


def rate(k, n):
    p = k / n if n else 0; lo, hi = wilson_ci(p, n) if n else (0, 0)
    return {'pct': round(p * 100, 1), 'ci': [round(lo * 100, 1), round(hi * 100, 1)], 'n': n}


def rest_analysis(by):
    """Vilodagar → poäng/mål (per-lag-match)."""
    buckets = [('≤3', 0, 3), ('4-6', 4, 6), ('7-13', 7, 13), ('14+', 14, 999)]
    agg = {b[0]: {'w': 0, 'd': 0, 'n': 0, 'gf': 0, 'ga': 0} for b in buckets}
    for k, games in by.items():
        for i in range(1, len(games)):
            rest = (games[i]['date'] - games[i - 1]['date']).days
            for name, lo, hi in buckets:
                if lo <= rest <= hi:
                    a = agg[name]; g = games[i]
                    a['n'] += 1; a['gf'] += g['gf']; a['ga'] += g['ga']
                    if g['res'] == 'W': a['w'] += 1
                    elif g['res'] == 'D': a['d'] += 1
                    break
    out = {}
    for name, *_ in buckets:
        a = agg[name]
        if a['n']:
            pts = (a['w'] * 2 + a['d']) / a['n']
            out[name] = {'n': a['n'], 'win_pct': rate(a['w'], a['n'])['pct'],
                         'points_per_match': round(pts, 2),
                         'goals_for_per_match': round(a['gf'] / a['n'], 2),
                         'goals_against_per_match': round(a['ga'] / a['n'], 2)}
    return out


def rest_differential(matches):
    """Mer utvilat lag (≥3 dagars övertag) — vinner det oftare? Neutraliserar hemmafördel genom
    att bara räkna matcher där rest-diff och hemmafördel pekar åt olika håll redovisas separat."""
    # bygg senaste matchdatum per (säsong,lag) i kronologi
    last = {}
    seq = sorted([m for m in matches if m.get('date')], key=lambda m: m['date'])
    rested_wins = rested_n = 0
    for m in seq:
        s = m.get('season'); dt = parse(m['date'])
        ht, at = m.get('homeTeamId'), m.get('awayTeamId')
        hr = (dt - last[(s, ht)]).days if (s, ht) in last else None
        ar = (dt - last[(s, at)]).days if (s, at) in last else None
        if hr is not None and ar is not None and abs(hr - ar) >= 3:
            hs, as_ = m.get('homeScore') or 0, m.get('awayScore') or 0
            rested_home = hr > ar  # hemmalaget mer utvilat?
            if hs != as_:
                rested_n += 1
                winner_home = hs > as_
                if winner_home == rested_home:
                    rested_wins += 1
        last[(s, ht)] = dt; last[(s, at)] = dt
    return {'more_rested_team_win_pct': rate(rested_wins, rested_n), 'n_decisive_with_rest_gap': rested_n}


def christmas_break(by):
    """Sista match före årsskiftesgapet (dec→jan) vs första efter, stratifierat på uppehållslängd.
    Elitseriens årsskiftesgap är oftast kort (~6 dgr); rost-effekt väntas främst efter längre uppehåll."""
    strata = {'kort (3-6 dgr)': (3, 6), 'långt (≥7 dgr)': (7, 999), 'alla (≥3 dgr)': (3, 999)}
    acc = {s: {'pre': {'w': 0, 'd': 0, 'n': 0, 'gf': 0}, 'post': {'w': 0, 'd': 0, 'n': 0, 'gf': 0}, 'gaps': []}
           for s in strata}
    for k, games in by.items():
        for i in range(1, len(games)):
            prev, cur = games[i - 1], games[i]
            if prev['date'].month == 12 and cur['date'].month == 1:
                gap = (cur['date'] - prev['date']).days
                for s, (lo, hi) in strata.items():
                    if lo <= gap <= hi:
                        a = acc[s]; a['gaps'].append(gap)
                        a['pre']['n'] += 1; a['pre']['gf'] += prev['gf']
                        if prev['res'] == 'W': a['pre']['w'] += 1
                        elif prev['res'] == 'D': a['pre']['d'] += 1
                        a['post']['n'] += 1; a['post']['gf'] += cur['gf']
                        if cur['res'] == 'W': a['post']['w'] += 1
                        elif cur['res'] == 'D': a['post']['d'] += 1
                break  # ett årsskiftesgap per lag/säsong
    def blk(x):
        return {'n': x['n'], 'win_pct': rate(x['w'], x['n'])['pct'],
                'points_per_match': round((x['w'] * 2 + x['d']) / x['n'], 2) if x['n'] else None,
                'goals_for_per_match': round(x['gf'] / x['n'], 2) if x['n'] else None}
    out = {}
    for s, a in strata.items():
        g = acc[s]['gaps']
        out[s] = {'n_breaks': len(g), 'median_break_days': sorted(g)[len(g) // 2] if g else None,
                  'last_before': blk(acc[s]['pre']), 'first_after': blk(acc[s]['post'])}
    return out


def season_phase(matches):
    """Datum-terciler per säsong → mål/match, utvisningar/match, hemmavinst%."""
    by_season = defaultdict(list)
    for m in matches:
        if m.get('date'):
            by_season[m.get('season')].append(m)
    terciles = {'tidig': [], 'mitt': [], 'sen': []}
    for s, ms in by_season.items():
        ms.sort(key=lambda m: m['date'])
        n = len(ms); t = n // 3
        terciles['tidig'] += ms[:t]; terciles['mitt'] += ms[t:2 * t]; terciles['sen'] += ms[2 * t:]
    out = {}
    for name, ms in terciles.items():
        n = len(ms)
        goals = sum((m.get('homeScore') or 0) + (m.get('awayScore') or 0) for m in ms)
        fouls = sum(len(m.get('fouls') or []) for m in ms)
        hw = sum(1 for m in ms if (m.get('homeScore') or 0) > (m.get('awayScore') or 0))
        out[name] = {'n': n, 'goals_per_match': round(goals / n, 2), 'fouls_per_match': round(fouls / n, 2),
                     'home_win': rate(hw, n)}
    return out


def by_month(matches):
    """Q004 höst vs vinter: mål/match + hemmavinst per månad."""
    mm = defaultdict(lambda: {'g': 0, 'n': 0, 'hw': 0})
    for m in matches:
        if not m.get('date'):
            continue
        mo = int(m['date'][5:7]); d = mm[mo]
        d['g'] += (m.get('homeScore') or 0) + (m.get('awayScore') or 0); d['n'] += 1
        if (m.get('homeScore') or 0) > (m.get('awayScore') or 0): d['hw'] += 1
    return {str(mo): {'goals_per_match': round(d['g'] / d['n'], 2), 'home_win_pct': rate(d['hw'], d['n'])['pct'], 'n': d['n']}
            for mo, d in sorted(mm.items())}


def analyze(matches, label):
    by = team_matches(matches)
    return {'label': label, 'n_matches': len(matches),
            'rest_days': rest_analysis(by),
            'rest_differential': rest_differential(matches),
            'christmas_break': christmas_break(by),
            'season_phase_terciles': season_phase(matches),
            'by_month': by_month(matches)}


def main():
    d = json.load(open('docs/data/bandygrytan_detailed.json'))
    out = {'_meta': {'analysis': 'A6 kalendereffekter', 'spec': 'ANALYSSPEC_VAG2_OEXPLOATERAT.md A6',
                     'questions': 'Q004 (höst/vinter), Q167 (tidpunkt i serien), Q174 (säsongsperiod)',
                     'note': 'Säsongsfas via datum-terciler (round sparsam). 2023-24 saknas.'},
           'herr': analyze(d['herr']['matches'], 'herr'),
           'dam': analyze(d['dam']['matches'], 'dam')}
    json.dump(out, open('docs/data/calendar_effects.json', 'w'), ensure_ascii=False, indent=2)
    print("→ docs/data/calendar_effects.json")

    h = out['herr']
    print(f"\nHERR ({h['n_matches']} matcher):")
    print("  Vilodagar → poäng/match:")
    for b, v in h['rest_days'].items():
        print(f"    {b:<5} {v['points_per_match']} p, {v['goals_for_per_match']} mål-för, vinst {v['win_pct']}% (n={v['n']})")
    print(f"  Mer utvilat lag vinner: {h['rest_differential']['more_rested_team_win_pct']['pct']}% "
          f"(n={h['rest_differential']['n_decisive_with_rest_gap']})")
    print("  Juluppehåll (sista före → första efter):")
    for s, cb in h['christmas_break'].items():
        if cb['n_breaks']:
            print(f"    {s:<16} n={cb['n_breaks']}: {cb['last_before']['goals_for_per_match']} → "
                  f"{cb['first_after']['goals_for_per_match']} mål, {cb['last_before']['points_per_match']} → "
                  f"{cb['first_after']['points_per_match']} p")
    print("  Säsongsfas (mål/match, utv/match, hemmavinst%):")
    for ph, v in h['season_phase_terciles'].items():
        print(f"    {ph:<6} {v['goals_per_match']} mål, {v['fouls_per_match']} utv, hemma {v['home_win']['pct']}%")
    write_report(out)


def write_report(o):
    h, dm = o['herr'], o['dam']
    L = ["# A6 — Kalendereffekter\n"]
    L.append("**Analys:** ANALYSSPEC A6. **Utförare:** Code. Fable skriver finding.\n")
    L.append("## Metod\n")
    L.append("Per-lag-schema ur `date` (100% täckning). Vilodagar = dagar sedan lagets förra match "
             "samma säsong. Juluppehåll = årsskiftesgapet (dec→jan, ≥7 dgr). Säsongsfas = datum-terciler "
             "per säsong (round är None för äldre säsonger). Wilson-CI på andelar. 2023-24 saknas.\n")

    L.append("## Vilodagar → resultat (herr, per-lag-match)\n")
    L.append("| Vilodagar | Poäng/match | Mål för | Mål mot | Vinst% | n |")
    L.append("|---|---|---|---|---|---|")
    for b, v in h['rest_days'].items():
        L.append(f"| {b} | {v['points_per_match']} | {v['goals_for_per_match']} | {v['goals_against_per_match']} | {v['win_pct']}% | {v['n']} |")
    rd = h['rest_differential']
    L.append(f"\nNär ett lag har ≥3 dagars vilo-övertag vinner det mer utvilade laget "
             f"**{rd['more_rested_team_win_pct']['pct']}%** av de avgjorda matcherna "
             f"(CI {rd['more_rested_team_win_pct']['ci'][0]}–{rd['more_rested_team_win_pct']['ci'][1]}, "
             f"n={rd['n_decisive_with_rest_gap']}). 50% = ingen vilofördel.\n")

    L.append("## Juluppehåll (herr) — sista match före årsskiftet vs första efter\n")
    L.append("Elitseriens årsskiftesgap är oftast kort. Stratifierat på uppehållslängd; rost-effekt "
             "väntas främst efter längre uppehåll.\n")
    L.append("| Uppehåll | Mål/match före → efter | Poäng/match före → efter | n |")
    L.append("|---|---|---|---|")
    for s, cb in h['christmas_break'].items():
        if cb['n_breaks']:
            lb, fa = cb['last_before'], cb['first_after']
            L.append(f"| {s} (median {cb['median_break_days']} dgr) | {lb['goals_for_per_match']} → {fa['goals_for_per_match']} | "
                     f"{lb['points_per_match']} → {fa['points_per_match']} | {cb['n_breaks']} |")

    L.append("\n## Säsongsfas — datum-terciler (herr)\n")
    L.append("| Fas | Mål/match | Utvisningar/match | Hemmavinst% | n |")
    L.append("|---|---|---|---|---|")
    for ph, v in h['season_phase_terciles'].items():
        L.append(f"| {ph} | {v['goals_per_match']} | {v['fouls_per_match']} | {v['home_win']['pct']}% (CI {v['home_win']['ci'][0]}–{v['home_win']['ci'][1]}) | {v['n']} |")

    L.append("\n## Månad — höst vs vinter (herr, Q004)\n")
    L.append("| Månad | Mål/match | Hemmavinst% | n |")
    L.append("|---|---|---|---|")
    monthname = {'10': 'okt', '11': 'nov', '12': 'dec', '1': 'jan', '2': 'feb', '3': 'mar'}
    for mo, v in h['by_month'].items():
        L.append(f"| {monthname.get(mo, mo)} | {v['goals_per_match']} | {v['home_win_pct']}% | {v['n']} |")

    L.append("\n## Frågor i questions-trädet\n")
    L.append("- **Q004** (höst vs vinter-variation): besvaras av månadstabellen + säsongsfas-terciler ovan.")
    L.append("- **Q167** (matchens tidpunkt i seriespelet): besvaras av säsongsfas-terciler (mål/utvisningar/hemmafördel per fas).")
    L.append("- **Q174** (säsongsperiod tidig/mitt/sen): besvaras direkt av datum-tercilerna.")
    L.append("Fable: bedöm om de kan stängas eller markeras delvis besvarade utifrån effektstorlekarna.\n")

    L.append("## Begränsningar\n")
    L.append("- Vilodagar samvarierar med schemaläggning (topplag kan ha annat schema); observationellt, ej kausalt.")
    L.append("- Långa viloperioder (14+) domineras av juluppehållet — överlappar den analysen.")
    L.append("- Säsongsfas via datum-terciler, inte round (round None för äldre säsonger).")
    L.append("- 2023-24 saknas i datan.\n")
    open('docs/data/ANALYS_CALENDAR.md', 'w').write('\n'.join(L))
    print("→ docs/data/ANALYS_CALENDAR.md")


if __name__ == '__main__':
    main()
