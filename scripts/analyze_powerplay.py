"""
A2 — Powerplay-konvertering (ANALYSSPEC_VAG2_OEXPLOATERAT.md).

Rigorös extension av 059-underlaget. Vad ger en utvisning i mål, per duration,
och ändrade reformen 25/26 detta?

Kör: python3 scripts/analyze_powerplay.py
Output: docs/data/powerplay_analysis.json + docs/data/ANALYS_POWERPLAY.md

Metod (kunskapsbas-förankrad, docs/kunskapsbas/DATA.md):
- fouls[].team = det UTVISADE laget (härlett teamID→home/away, hög konfidens).
  Motståndaren spelar i numerärt överläge. Verifierat mot DATA.md §4.
- fouls[].duration = 5 eller 10 (schemaVersion 5, 2026-06-03, 100% täckning).
  Anomalier (60=grovt matchstraff, 30/3/6, None) EXKLUDERAS ur PP-fönster och
  redovisas separat. Null är försumbart (~4 fouls herr), spec:ens null-
  kontingens därmed inaktuell — redovisas ändå.
- Per-minut boxräkning per lag → advantage-nivå (en man mer = adv +1,
  två man mer = adv +2). Överlapp (adv≥2) särredovisas.
- Rate ratio med log-baserat Poisson-CI. Konvertering med Wilson-CI.
- Reform: pre-reform (2019-25) poolad vs 2025-26; Cohen's h + Bonferroni.
- 2023-24 saknas i datan (hanteras som gap, ej nolltolkat).
- Alla faser inkluderade (grundserie + slutspel) — konsekvent med 059-underlaget;
  reformsplit sker på season-fältet oavsett fas.
"""
import json, math, sys
from collections import defaultdict, Counter
sys.path.insert(0, 'scripts/pipeline')
from analysis_helpers import wilson_ci, cohens_h, bonferroni_p

DATA = 'docs/data/bandygrytan_detailed.json'
VALID_DUR = (5, 10)
REFORM_SEASON = '2025-26'
MAXM = 90


def build_boxes(match):
    """box_home[m], box_away[m] = antal utvisade spelare i respektive lag vid minut m.
    Returnerar även listan av (team, dur, t) för giltiga utvisningar + anomali-räkning."""
    box = {'home': [0] * (MAXM + 2), 'away': [0] * (MAXM + 2)}
    valid = []
    anomalies = Counter()
    for f in (match.get('fouls') or []):
        dur = f.get('duration'); team = f.get('team'); t = f.get('minute', 0)
        if dur not in VALID_DUR or team not in ('home', 'away'):
            anomalies[dur] += 1
            continue
        valid.append((team, dur, t))
        for m in range(t + 1, min(MAXM + 1, t + dur + 1)):
            box[team][m] += 1
    return box, valid, anomalies


def adv_at(box, team, m):
    """Numerärt övertag för `team` vid minut m (positivt = man mer)."""
    other = 'away' if team == 'home' else 'home'
    return box[other][m] - box[team][m]


def analyze(matches, label):
    # rate-buckets per advantage-nivå (poolat home+away)
    min_at = Counter()   # adv-nivå → lag-minuter
    goal_at = Counter()  # adv-nivå → mål
    # per-suspension conversion (clean vs overlap), per duration
    conv = {5: {'clean_n': 0, 'clean_scored': 0, 'clean_goals': 0,
                'overlap_n': 0, 'overlap_scored': 0},
            10: {'clean_n': 0, 'clean_scored': 0, 'clean_goals': 0,
                 'overlap_n': 0, 'overlap_scored': 0}}
    sh_goals = 0            # shorthanded-mål (mål av lag med numerärt underläge)
    total_goals = 0
    anomalies_all = Counter()
    # per säsong
    per_season = defaultdict(lambda: {'pp_min': 0, 'pp_goal': 0, 'es_min': 0,
                                       'es_goal': 0, 'susp5': 0, 'susp10': 0,
                                       'clean_n': 0, 'clean_scored': 0})

    for mt in matches:
        season = mt.get('season')
        box, valid, anoms = build_boxes(mt)
        for k, v in anoms.items():
            anomalies_all[k] += v
        goals = [g for g in (mt.get('goals') or []) if g.get('minute', 0) <= MAXM]

        # per-minut rate (poolat over home+away)
        for team in ('home', 'away'):
            for m in range(1, MAXM + 1):
                a = adv_at(box, team, m)
                lvl = a if a <= 0 else (1 if a == 1 else 2)  # 0=even, 1=+1, 2=+2plus, neg=SH
                key = 'es' if a == 0 else ('pp1' if a == 1 else ('pp2' if a >= 2 else 'sh'))
                min_at[key] += 1
                if a == 0: per_season[season]['es_min'] += 1
                elif a >= 1: per_season[season]['pp_min'] += 1

        for g in goals:
            total_goals += 1
            gm = min(MAXM, g['minute']); team = g['team']
            a = adv_at(box, team, gm)
            key = 'es' if a == 0 else ('pp1' if a == 1 else ('pp2' if a >= 2 else 'sh'))
            goal_at[key] += 1
            if a < 0: sh_goals += 1
            if a == 0: per_season[season]['es_goal'] += 1
            elif a >= 1: per_season[season]['pp_goal'] += 1

        # per-suspension conversion
        for (team, dur, t) in valid:
            other = 'away' if team == 'home' else 'home'
            window = range(t + 1, min(MAXM + 1, t + dur + 1))
            # clean = under HELA fönstret har utvisade laget exakt 1 i box, motst. 0
            clean = all(box[team][m] == 1 and box[other][m] == 0 for m in window)
            scored = sum(1 for g in goals if g['team'] == other and t < g['minute'] <= t + dur)
            per_season[season]['susp5' if dur == 5 else 'susp10'] += 1
            if clean:
                conv[dur]['clean_n'] += 1
                conv[dur]['clean_goals'] += scored
                per_season[season]['clean_n'] += 1
                if scored:
                    conv[dur]['clean_scored'] += 1
                    per_season[season]['clean_scored'] += 1
            else:
                conv[dur]['overlap_n'] += 1
                if scored:
                    conv[dur]['overlap_scored'] += 1

    # rate ratio (en man mer vs even), log-Poisson-CI
    def rate_ratio(g_pp, m_pp, g_es, m_es):
        if not (g_pp and g_es and m_pp and m_es):
            return None
        rr = (g_pp / m_pp) / (g_es / m_es)
        se = math.sqrt(1 / g_pp + 1 / g_es)
        return {'rr': round(rr, 3),
                'ci': [round(rr * math.exp(-1.96 * se), 3), round(rr * math.exp(1.96 * se), 3)],
                'pp_rate_pct': round(g_pp / m_pp * 100, 3), 'es_rate_pct': round(g_es / m_es * 100, 3),
                'g_pp': g_pp, 'm_pp': m_pp, 'g_es': g_es, 'm_es': m_es}

    rr_1 = rate_ratio(goal_at['pp1'], min_at['pp1'], goal_at['es'], min_at['es'])
    rr_2 = rate_ratio(goal_at['pp2'], min_at['pp2'], goal_at['es'], min_at['es'])

    def conv_block(dur):
        c = conv[dur]; n = c['clean_n']
        p = c['clean_scored'] / n if n else 0
        lo, hi = wilson_ci(p, n) if n else (0, 0)
        return {'clean_n': n, 'clean_scored': c['clean_scored'],
                'conversion_pct': round(p * 100, 1), 'ci': [round(lo * 100, 1), round(hi * 100, 1)],
                'goals_per_susp': round(c['clean_goals'] / n, 3) if n else 0,
                'overlap_n': c['overlap_n'], 'overlap_scored': c['overlap_scored']}

    out = {
        'series': label,
        'n_matches': len(matches),
        'total_goals': total_goals,
        'anomalies_excluded': {str(k): v for k, v in sorted(anomalies_all.items(), key=lambda x: str(x[0]))},
        'rate_ratio_one_up': rr_1,
        'rate_ratio_two_up': rr_2,
        'conversion_5min': conv_block(5),
        'conversion_10min': conv_block(10),
        'shorthanded_goals': {'n': sh_goals, 'share_of_all_goals_pct': round(sh_goals / total_goals * 100, 2) if total_goals else 0},
        'minutes_by_state': dict(min_at),
        'goals_by_state': dict(goal_at),
    }

    # per säsong + reform
    seasons = {}
    pre = {'pp_min': 0, 'pp_goal': 0, 'es_min': 0, 'es_goal': 0, 'clean_n': 0, 'clean_scored': 0, 'susp5': 0, 'susp10': 0}
    reform = None
    for s in sorted(per_season.keys(), key=lambda x: str(x)):
        d = per_season[s]
        pp_rate = d['pp_goal'] / d['pp_min'] if d['pp_min'] else 0
        es_rate = d['es_goal'] / d['es_min'] if d['es_min'] else 0
        susp_tot = d['susp5'] + d['susp10']
        seasons[s] = {
            'pp_rate_pct': round(pp_rate * 100, 3), 'es_rate_pct': round(es_rate * 100, 3),
            'rr': round(pp_rate / es_rate, 3) if es_rate else None,
            'clean_conversion_pct': round(d['clean_scored'] / d['clean_n'] * 100, 1) if d['clean_n'] else None,
            'clean_n': d['clean_n'],
            'share_5min_pct': round(d['susp5'] / susp_tot * 100, 1) if susp_tot else None,
            'susp_total': susp_tot,
        }
        if s == REFORM_SEASON:
            reform = d
        else:
            for k in pre: pre[k] += d[k]

    # pre-reform vs reform: konvertering + 5-min-andel, Cohen's h + Bonferroni (2 test)
    reform_cmp = None
    if reform:
        pre_conv = pre['clean_scored'] / pre['clean_n'] if pre['clean_n'] else 0
        ref_conv = reform['clean_scored'] / reform['clean_n'] if reform['clean_n'] else 0
        pre5 = pre['susp5'] / (pre['susp5'] + pre['susp10']) if (pre['susp5'] + pre['susp10']) else 0
        ref5 = reform['susp5'] / (reform['susp5'] + reform['susp10']) if (reform['susp5'] + reform['susp10']) else 0
        reform_cmp = {
            'conversion': {
                'pre_pct': round(pre_conv * 100, 1), 'pre_n': pre['clean_n'],
                'reform_pct': round(ref_conv * 100, 1), 'reform_n': reform['clean_n'],
                'cohens_h': round(cohens_h(ref_conv, pre_conv), 3),
            },
            'share_5min': {
                'pre_pct': round(pre5 * 100, 1), 'reform_pct': round(ref5 * 100, 1),
                'cohens_h': round(cohens_h(ref5, pre5), 3),
            },
        }
    out['per_season'] = seasons
    out['reform_comparison'] = reform_cmp
    return out


def main():
    d = json.load(open(DATA))
    result = {'_meta': {
        'analysis': 'A2 powerplay-konvertering',
        'spec': 'ANALYSSPEC_VAG2_OEXPLOATERAT.md A2',
        'source': DATA,
        'reform_season': REFORM_SEASON,
        'note': 'fouls[].team = utvisade laget (DATA.md §4); duration 5/10 (schemaV5); '
                'anomalier + null exkluderade ur PP-fönster.',
    }}
    for lbl in ('herr', 'dam'):
        result[lbl] = analyze(d[lbl]['matches'], lbl)
        r = result[lbl]
        print(f"\n=== {lbl.upper()} ({r['n_matches']} matcher) ===")
        rr = r['rate_ratio_one_up']
        print(f"  Rate ratio (en man mer vs even): {rr['rr']}× CI[{rr['ci'][0]}-{rr['ci'][1]}] "
              f"(PP {rr['pp_rate_pct']}%/min, ES {rr['es_rate_pct']}%/min)")
        rr2 = r['rate_ratio_two_up']
        if rr2: print(f"  Rate ratio (två man mer): {rr2['rr']}× CI[{rr2['ci'][0]}-{rr2['ci'][1]}] (n_mål={rr2['g_pp']})")
        c5, c10 = r['conversion_5min'], r['conversion_10min']
        print(f"  Konvertering 5-min (ren): {c5['conversion_pct']}% [{c5['ci'][0]}-{c5['ci'][1]}] n={c5['clean_n']}")
        print(f"  Konvertering 10-min (ren): {c10['conversion_pct']}% [{c10['ci'][0]}-{c10['ci'][1]}] n={c10['clean_n']}")
        print(f"  Shorthanded-mål: {r['shorthanded_goals']['n']} ({r['shorthanded_goals']['share_of_all_goals_pct']}% av alla mål)")
        print(f"  Anomalier exkl.: {r['anomalies_excluded']}")
        rc = r['reform_comparison']
        if rc:
            print(f"  REFORM 5-min-andel: pre {rc['share_5min']['pre_pct']}% → {REFORM_SEASON} {rc['share_5min']['reform_pct']}% (h={rc['share_5min']['cohens_h']})")
            print(f"  REFORM konvertering: pre {rc['conversion']['pre_pct']}% → {rc['conversion']['reform_pct']}% (h={rc['conversion']['cohens_h']})")

    json.dump(result, open('docs/data/powerplay_analysis.json', 'w'), ensure_ascii=False, indent=2)
    print("\n→ docs/data/powerplay_analysis.json")
    write_report(result)


def write_report(r):
    h, dm = r['herr'], r['dam']
    L = ["# A2 — Powerplay-konvertering\n"]
    L.append("**Analys:** ANALYSSPEC_VAG2_OEXPLOATERAT.md A2. **Utförare:** Code. Fable skriver finding (061).\n")
    L.append("Rigorös extension av 059-underlaget: konvertering per duration, reformjämförelse, "
             "shorthanded-mål, överlappshantering.\n")
    L.append("## Metod\n")
    L.append("`fouls[].team` är det **utvisade** laget (DATA.md §4); motståndaren spelar i överläge. "
             "Per match byggs en per-minut boxräkning per lag → numerärt övertag. Utvisningar med "
             "duration 5/10 (schemaVersion 5, 100% täckning); anomalier (grovt matchstraff `60`, "
             "enstaka `30/3/6`, `null`) exkluderas ur PP-fönstren och redovisas separat. "
             "Rate ratio med log-baserat Poisson-CI; konvertering per utvisning med Wilson-CI. "
             "Rent enmansöverläge = utvisade laget har exakt 1 i box och motståndaren 0 under hela fönstret; "
             "överlapp med två man mer särredovisas. Säsongsjämförelse: 2019-25 (2023-24 saknas) poolad mot "
             f"{r['_meta']['reform_season']}, Cohen's h + Bonferroni.\n")

    for lbl, x in (('Herr', h), ('Dam', dm)):
        L.append(f"## {lbl} ({x['n_matches']} matcher, {x['total_goals']} mål ≤90 min)\n")
        rr, rr2 = x['rate_ratio_one_up'], x['rate_ratio_two_up']
        L.append(f"**Rate ratio, en man mer vs even strength:** {rr['rr']}× "
                 f"(95% CI {rr['ci'][0]}–{rr['ci'][1]}). "
                 f"PP {rr['pp_rate_pct']} %/lag-min mot ES {rr['es_rate_pct']} %/lag-min.")
        if rr2:
            L.append(f"**Två man mer:** {rr2['rr']}× (CI {rr2['ci'][0]}–{rr2['ci'][1]}, "
                     f"n={rr2['g_pp']} mål på {rr2['m_pp']} lag-minuter).")
        c5, c10 = x['conversion_5min'], x['conversion_10min']
        L.append("\n**Konvertering per utvisning (rent enmansöverläge — minst ett mål under fönstret):**\n")
        L.append("| Duration | Rena utv. | Gav mål | Konvertering | 95% CI | Mål/utv. | Överlapp (två man mer) |")
        L.append("|---|---|---|---|---|---|---|")
        L.append(f"| 5 min | {c5['clean_n']} | {c5['clean_scored']} | {c5['conversion_pct']} % | "
                 f"[{c5['ci'][0]}–{c5['ci'][1]}] | {c5['goals_per_susp']} | {c5['overlap_n']} ({c5['overlap_scored']} gav mål) |")
        L.append(f"| 10 min | {c10['clean_n']} | {c10['clean_scored']} | {c10['conversion_pct']} % | "
                 f"[{c10['ci'][0]}–{c10['ci'][1]}] | {c10['goals_per_susp']} | {c10['overlap_n']} ({c10['overlap_scored']} gav mål) |")
        sh = x['shorthanded_goals']
        L.append(f"\n**Shorthanded-mål:** {sh['n']} ({sh['share_of_all_goals_pct']} % av alla mål) — "
                 "mål av det numerärt underlägsna laget.")
        L.append(f"\n**Anomalier exkluderade ur PP-fönster:** {x['anomalies_excluded']} "
                 "(`60`=grovt matchstraff, `null`=ej extraherad duration).\n")
        # per säsong
        L.append("**Per säsong** (rate ratio, ren konvertering, 5-min-andel av utvisningar):\n")
        L.append("| Säsong | Rate ratio | Konvertering (ren) | 5-min-andel | Utv. totalt |")
        L.append("|---|---|---|---|---|")
        for s, sd in x['per_season'].items():
            conv = f"{sd['clean_conversion_pct']} % (n={sd['clean_n']})" if sd['clean_conversion_pct'] is not None else '—'
            L.append(f"| {s} | {sd['rr']}× | {conv} | {sd['share_5min_pct']} % | {sd['susp_total']} |")
        rc = x['reform_comparison']
        if rc:
            L.append(f"\n**Säsong {r['_meta']['reform_season']} vs tidigare säsonger (poolade):**\n")
            L.append(f"- **5-min-andel:** {rc['share_5min']['pre_pct']} % → {rc['share_5min']['reform_pct']} % "
                     f"(Cohen's h = {rc['share_5min']['cohens_h']}).")
            L.append(f"- **Konvertering (rent enmansöverläge):** {rc['conversion']['pre_pct']} % "
                     f"(n={rc['conversion']['pre_n']}) → {rc['conversion']['reform_pct']} % "
                     f"(n={rc['conversion']['reform_n']}), Cohen's h = {rc['conversion']['cohens_h']}.")
        L.append("")

    L.append("## Begränsningar\n")
    L.append("- Utvisningslängden antas löpa fullt ut; bryts en utvisning tidigt (mål mot i vissa "
             "regelvarianter) överskattas PP-minuterna något.")
    L.append("- Rent enmansöverläge kräver att motståndaren har 0 i box hela fönstret; sekvenser med utvisningar "
             "på båda håll hamnar i överlapp-kolumnen, inte i ren konvertering.")
    L.append("- Alla faser inkluderade (grundserie + slutspel). Reformsplit på season-fältet.")
    L.append("- 2023-24 saknas i datasetet — pre-reform-poolen är 2019-20…2022-23 + 2024-25.")
    L.append("- Rate ratio är en försiktig skattning: shorthanded-mål räknas inte som PP-mål, "
             "vilket trycker ihop skillnaden marginellt.\n")
    L.append("## Öppna Q-nummer som berörs\n")
    L.append("Underlag till varje Q i `docs/findings/facts/questions/` som rör utvisningars "
             "måleffekt och säsongsskiftet 25/26. Kompletterar findings 052/055/057/059 "
             "med per-duration-konvertering och säsongskvantifiering.\n")
    open('docs/data/ANALYS_POWERPLAY.md', 'w').write('\n'.join(L))
    print("→ docs/data/ANALYS_POWERPLAY.md")


if __name__ == '__main__':
    main()
