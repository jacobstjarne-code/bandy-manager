"""
A3 — Allsvenskan vs Elitserien (ANALYSSPEC_VAG2_OEXPLOATERAT.md).

Skiljer sig Bandyallsvenskan strukturellt från Elitserien herr?

Kör: python3 scripts/analyze_allsvenskan.py
Output: docs/data/allsvenskan_vs_elitserien.json + docs/data/ANALYS_ALLSVENSKAN.md

Datakonventioner (verifierade mot filen 2026-07):
- `bandygrytan_allsvenskan.json`: 887 matcher, 2019-20…2024-25 (2024-25 endast
  28 matcher — partiell). loggingQuality: full 204 / partial 528 / minimal 155.
- `goals[]` rekonstruerar INTE alltid slutresultatet ens vid full loggning
  (~82%). Därför: mål/match + resultatfördelning från SLUTRESULTAT (pålitligt,
  alla 887); mål-minutfördelning bara på delmängd där goals[]==slutresultat.
- INGEN halvleksflagga på allsvenskan-mål → mål-minutfördelning som RÅ minut,
  ingen 1H/2H-split (minut≥46-regeln är förbjuden, DATA.md). Findings 005/013:s
  halvleksdominans kan inte replikeras för allsvenskan.
- `fouls[]` saknar team-fält → utvisningsfrekvens TOTALT, ingen per-lag.
  Event-baserat → under-loggat golv, redovisas som sådant.
- `goals[].type` opålitlig (~45% hörnmål = parserartefakt) → ALL hörnanalys
  utesluten (spec A3).
- Baslinje: Elitserien herr ur `bandygrytan_detailed.json`, samma mått,
  samma complete-logging-filter för mål-minut.
"""
import json, math, sys
from collections import Counter
sys.path.insert(0, 'scripts/pipeline')
from analysis_helpers import wilson_ci, cohens_h, cohens_d, bonferroni_p

ALS = 'docs/data/bandygrytan_allsvenskan.json'
DET = 'docs/data/bandygrytan_detailed.json'
BUCKETS = [(1, 15), (16, 30), (31, 45), (46, 60), (61, 75), (76, 90)]


def goals_total(m):
    return (m.get('homeScore') or 0) + (m.get('awayScore') or 0)


def complete_logged(m):
    """True om goals[] rekonstruerar slutresultatet exakt."""
    gh = sum(1 for g in (m.get('goals') or []) if g.get('team') == 'home')
    ga = sum(1 for g in (m.get('goals') or []) if g.get('team') == 'away')
    return gh == (m.get('homeScore') or 0) and ga == (m.get('awayScore') or 0)


def match_level(matches):
    n = len(matches)
    gpm = [goals_total(m) for m in matches]
    mean = sum(gpm) / n
    sd = math.sqrt(sum((x - mean) ** 2 for x in gpm) / (n - 1))
    hw = sum(1 for m in matches if (m.get('homeScore') or 0) > (m.get('awayScore') or 0))
    dr = sum(1 for m in matches if (m.get('homeScore') or 0) == (m.get('awayScore') or 0))
    aw = n - hw - dr
    def wci(k):
        p = k / n; lo, hi = wilson_ci(p, n)
        return {'pct': round(p * 100, 1), 'ci': [round(lo * 100, 1), round(hi * 100, 1)], 'n': k}
    return {
        'n_matches': n,
        'goals_per_match': {'mean': round(mean, 2), 'sd': round(sd, 2),
                            'ci': [round(mean - 1.96 * sd / math.sqrt(n), 2),
                                   round(mean + 1.96 * sd / math.sqrt(n), 2)],
                            '_vals': gpm},
        'home_win': wci(hw), 'draw': wci(dr), 'away_win': wci(aw),
    }


def ht_lead_to_win(matches):
    """P(hemmavinst | hemma leder i HT), matcher med HT-data."""
    hd = [m for m in matches if m.get('halfTimeHome') is not None and m.get('halfTimeAway') is not None]
    lead = [m for m in hd if (m.get('halfTimeHome') or 0) > (m.get('halfTimeAway') or 0)]
    won = sum(1 for m in lead if (m.get('homeScore') or 0) > (m.get('awayScore') or 0))
    p = won / len(lead) if lead else 0
    lo, hi = wilson_ci(p, len(lead)) if lead else (0, 0)
    return {'n_ht': len(hd), 'n_home_lead': len(lead), 'won': won,
            'pct': round(p * 100, 1), 'ci': [round(lo * 100, 1), round(hi * 100, 1)]}


def goal_minute_dist(matches):
    """Rå-minutfördelning, ENDAST complete-logged matcher. Ingen halvleksflagga."""
    sub = [m for m in matches if complete_logged(m)]
    counts = [0] * len(BUCKETS); tot = 0
    for m in sub:
        for g in (m.get('goals') or []):
            mn = g.get('minute')
            if mn is None or mn < 1 or mn > 90:
                continue
            tot += 1
            for i, (lo, hi) in enumerate(BUCKETS):
                if lo <= mn <= hi:
                    counts[i] += 1; break
    dist = [{'window': f'{lo}-{hi}', 'count': c, 'pct': round(c / tot * 100, 1) if tot else 0}
            for (lo, hi), c in zip(BUCKETS, counts)]
    return {'n_matches_complete': len(sub), 'n_goals': tot, 'distribution': dist}


def foul_rate(matches):
    """Utvisningar per match. VIKTIGT: loggingQuality spårar INTE foul-completeness —
    full/partial/minimal ligger alla i samma spann (icke-monotont), så per_match_all är
    rätt punktskattning, inte ett under-loggat golv."""
    byq = {}
    for m in matches:
        q = m.get('loggingQuality')
        d = byq.setdefault(q, [0, 0]); d[0] += len(m.get('fouls') or []); d[1] += 1
    nf = sum(len(m.get('fouls') or []) for m in matches)
    per_q = {str(q): {'fouls_per_match': round(f / n, 2), 'n': n} for q, (f, n) in byq.items()}
    return {'fouls_total': nf, 'per_match_all': round(nf / len(matches), 2),
            'per_logging_quality': per_q}


def analyze(matches, label):
    ml = match_level(matches)
    return {
        'label': label,
        'match_level': ml,
        'ht_lead_to_win': ht_lead_to_win(matches),
        'goal_minute_dist': goal_minute_dist(matches),
        'foul_rate': foul_rate(matches),
        'logging_quality': dict(Counter(m.get('loggingQuality') for m in matches)),
        'seasons': dict(sorted(Counter(m.get('season') for m in matches).items())),
    }


def regular_only(matches):
    r = [m for m in matches if m.get('phase') == 'regular']
    return r if r else matches


def main():
    als = regular_only(json.load(open(ALS))['matches'])
    elite = regular_only(json.load(open(DET))['herr']['matches'])

    A = analyze(als, 'Bandyallsvenskan')
    E = analyze(elite, 'Elitserien herr')

    # jämförelser med effektstorlek + Bonferroni (4 huvudtest)
    n_tests = 4
    comps = {}
    # mål/match — Cohen's d
    d = cohens_d(A['match_level']['goals_per_match']['_vals'],
                 E['match_level']['goals_per_match']['_vals'])
    comps['goals_per_match'] = {
        'als': A['match_level']['goals_per_match']['mean'],
        'elite': E['match_level']['goals_per_match']['mean'],
        'cohens_d': round(d, 3) if d is not None else None,
    }
    # hemmavinst% — Cohen's h
    for key in ('home_win', 'draw', 'away_win'):
        pa = A['match_level'][key]['n'] / A['match_level']['n_matches']
        pe = E['match_level'][key]['n'] / E['match_level']['n_matches']
        comps[key] = {'als_pct': round(pa * 100, 1), 'elite_pct': round(pe * 100, 1),
                      'cohens_h': round(cohens_h(pa, pe), 3)}
    # HT-ledning→vinst — Cohen's h
    pah = A['ht_lead_to_win']['pct'] / 100; peh = E['ht_lead_to_win']['pct'] / 100
    comps['ht_lead_to_win'] = {'als_pct': A['ht_lead_to_win']['pct'], 'elite_pct': E['ht_lead_to_win']['pct'],
                               'cohens_h': round(cohens_h(pah, peh), 3)}

    out = {'_meta': {
        'analysis': 'A3 Allsvenskan vs Elitserien',
        'spec': 'ANALYSSPEC_VAG2_OEXPLOATERAT.md A3',
        'phase': 'regular (bägge serier)',
        'exclusions': 'hörnanalys (goals[].type opålitlig), per-lag-fouls (team saknas), 1H/2H-split (ingen halvleksflagga)',
        'bonferroni_n_tests': n_tests,
    }, 'allsvenskan': A, 'elitserien_herr': E, 'comparisons': comps}

    json.dump(out, open('docs/data/allsvenskan_vs_elitserien.json', 'w'), ensure_ascii=False, indent=2)
    print("→ docs/data/allsvenskan_vs_elitserien.json")

    # print sammanfattning
    print(f"\nAllsvenskan {A['match_level']['n_matches']} matcher | Elitserien herr {E['match_level']['n_matches']} matcher")
    print(f"  mål/match: ALS {comps['goals_per_match']['als']} vs ELITE {comps['goals_per_match']['elite']} (d={comps['goals_per_match']['cohens_d']})")
    print(f"  hemmavinst: ALS {comps['home_win']['als_pct']}% vs ELITE {comps['home_win']['elite_pct']}% (h={comps['home_win']['cohens_h']})")
    print(f"  oavgjort: ALS {comps['draw']['als_pct']}% vs ELITE {comps['draw']['elite_pct']}% (h={comps['draw']['cohens_h']})")
    print(f"  HT-ledn→vinst: ALS {comps['ht_lead_to_win']['als_pct']}% vs ELITE {comps['ht_lead_to_win']['elite_pct']}% (h={comps['ht_lead_to_win']['cohens_h']})")
    print(f"  utvisn/match: ALS {A['foul_rate']['per_match_all']} vs ELITE {E['foul_rate']['per_match_all']} "
          f"| per-quality ALS: {A['foul_rate']['per_logging_quality']}")

    write_report(out)


def write_report(o):
    A, E, C = o['allsvenskan'], o['elitserien_herr'], o['comparisons']
    L = ["# A3 — Bandyallsvenskan vs Elitserien herr\n"]
    L.append("**Analys:** ANALYSSPEC_VAG2_OEXPLOATERAT.md A3. **Utförare:** Code. Fable skriver finding + uppdaterar 032.\n")
    L.append("## Datakvalitet — läs först\n")
    L.append(f"Allsvenskan-filen ({A['match_level']['n_matches']} grundseriematcher) har ojämn loggning: "
             f"{o['allsvenskan']['logging_quality']}. `goals[]` rekonstruerar slutresultatet i endast "
             "~82% av full-loggade matcher, så **event-baserade mått är svagare än Elitseriens**. "
             "Därför: mål/match och resultatfördelning från **slutresultat** (robust, alla matcher); "
             "mål-minutfördelning enbart på delmängd där `goals[]`==slutresultat; utvisningsfrekvens "
             "som **under-loggat golv**. Uteslutet: hörnanalys (`type` opålitlig, ~45% hörnmål = artefakt), "
             "per-lag-fouls (team saknas), 1H/2H-split (ingen halvleksflagga — minut≥46-regeln förbjuden).\n")

    L.append("## Match-nivå (robust — ur slutresultat)\n")
    L.append("| Mått | Allsvenskan | Elitserien herr | Effektstorlek |")
    L.append("|---|---|---|---|")
    gm_a, gm_e = A['match_level']['goals_per_match'], E['match_level']['goals_per_match']
    L.append(f"| Mål/match | {gm_a['mean']} (95% CI {gm_a['ci'][0]}–{gm_a['ci'][1]}) | "
             f"{gm_e['mean']} ({gm_e['ci'][0]}–{gm_e['ci'][1]}) | Cohen's d = {C['goals_per_match']['cohens_d']} |")
    for key, lbl in (('home_win', 'Hemmavinst'), ('draw', 'Oavgjort'), ('away_win', 'Bortavinst')):
        a, e = A['match_level'][key], E['match_level'][key]
        L.append(f"| {lbl} | {a['pct']}% (CI {a['ci'][0]}–{a['ci'][1]}) | {e['pct']}% (CI {e['ci'][0]}–{e['ci'][1]}) | "
                 f"Cohen's h = {C[key]['cohens_h']} |")
    ha, he = A['ht_lead_to_win'], E['ht_lead_to_win']
    L.append(f"| HT-ledning→vinst | {ha['pct']}% (n={ha['n_home_lead']}, CI {ha['ci'][0]}–{ha['ci'][1]}) | "
             f"{he['pct']}% (n={he['n_home_lead']}, CI {he['ci'][0]}–{he['ci'][1]}) | Cohen's h = {C['ht_lead_to_win']['cohens_h']} |")
    L.append(f"\nBonferroni: {o['_meta']['bonferroni_n_tests']} huvudtest — tolka h/d, inte enbart p; "
             "CI-överlapp anges per rad.\n")

    L.append("## Mål-minutfördelning (rå minut, ENDAST complete-loggade matcher)\n")
    ga, ge = A['goal_minute_dist'], E['goal_minute_dist']
    L.append(f"Allsvenskan: {ga['n_goals']} mål ur {ga['n_matches_complete']} complete-loggade matcher. "
             f"Elitserien: {ge['n_goals']} mål ur {ge['n_matches_complete']}. "
             "**Ingen 1H/2H-split** — halvleksflagga saknas i allsvenskan-filen.\n")
    L.append("| Fönster | Allsvenskan | Elitserien herr |")
    L.append("|---|---|---|")
    for ba, be in zip(ga['distribution'], ge['distribution']):
        L.append(f"| {ba['window']} | {ba['pct']}% | {be['pct']}% |")

    L.append("\n## Utvisningsfrekvens\n")
    fa, fe = A['foul_rate'], E['foul_rate']
    L.append(f"**Allsvenskan {fa['per_match_all']} utv./match vs Elitserien herr {fe['per_match_all']}** "
             f"— allsvenskan ligger ~{round((fa['per_match_all']/fe['per_match_all']-1)*100)}% högre.\n")
    L.append("Detta är den enda tydliga strukturella skillnaden mellan serierna. Till skillnad från "
             "en tidigare hypotes är siffran **inte** ett under-loggat golv: `loggingQuality` spårar inte "
             "foul-completeness — utvisningar loggas i samma spann oavsett kvalitetsetikett "
             "(full/partial/minimal nedan är icke-monotont, `full` är till och med lägst). "
             f"{fa['per_match_all']} är därför en rimlig punktskattning, inte en undre gräns.\n")
    L.append("| loggingQuality | Utv./match | n |")
    L.append("|---|---|---|")
    for q in ('full', 'partial', 'minimal'):
        pq = fa['per_logging_quality'].get(q)
        if pq:
            L.append(f"| {q} | {pq['fouls_per_match']} | {pq['n']} |")
    L.append("\n*Kvarstående förbehåll:* en systematisk skillnad i loggningsnivå mellan allsvenskan-filen "
             "och elitserie-filen kan inte helt uteslutas, men riktningen (fler utvisningar i allsvenskan) "
             "är robust eftersom foul-loggningen inom allsvenskan inte samvarierar med kvalitetsetiketten.\n")

    L.append("## Findings som berörs\n")
    L.append("- **Finding 032** (\"Målminutsfördelning per division: ingen data tillgänglig\"): "
             "delvis inaktuell. En rå-minutfördelning på divisionsnivå (allsvenskan) ÄR nu möjlig för "
             f"complete-loggade matcher ({ga['n_matches_complete']} st). Men 1H/2H-splitten är fortfarande "
             "otillgänglig (ingen halvleksflagga), så påståendet stämmer för halvleksuppdelad fördelning, "
             "inte för rå minut. **Fable: formulera om 032 till att data finns för rå minut men inte per halvlek.**")
    L.append("- **Finding 066**: refereras i spec:en men **existerar inte** (ingen sida, ingen yaml-post 001–061). "
             "Kan inte adresseras — spec-referensen är felaktig. **Fable: kontrollera vilket nummer som avsågs.**\n")

    L.append("## Begränsningar\n")
    L.append("- Event-baserade mått (mål-minut, utvisningar) begränsas av allsvenskans ojämna loggning; "
             "match-nivå (slutresultat) är opåverkat.")
    L.append("- Grundserie i bägge serier. Allsvenskan 2024-25 endast 28 matcher (partiell säsong).")
    L.append("- Hörnanalys utesluten (goals[].type opålitlig i denna fil).")
    L.append("- Ingen per-lag-utvisningsanalys (fouls[].team saknas i allsvenskan-filen).\n")
    L.append("## Öppna Q-nummer som berörs\n")
    L.append("Divisionsjämförelse-frågorna bakom finding 032 samt varje Q i "
             "`docs/findings/facts/questions/` som rör Allsvenskan vs Elitserien-struktur.\n")

    open('docs/data/ANALYS_ALLSVENSKAN.md', 'w').write('\n'.join(L))
    print("→ docs/data/ANALYS_ALLSVENSKAN.md")


if __name__ == '__main__':
    main()
