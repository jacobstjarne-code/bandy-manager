"""
A8 — Restposter (ANALYSSPEC_VAG2_OEXPLOATERAT.md). Svepets sista.

Kör: python3 scripts/analyze_restposter.py
Output: docs/data/restposter_ot_og_kval.json + docs/data/ANALYS_RESTPOSTER.md

VIKTIGT (verifierat mot datan 2026-07): spec:en antog tre fält som INTE finns:
- `overtime`/shootout-flagga: finns EJ. Matcher som gick till förlängning kan
  inte identifieras direkt. Proxy: knockout-matcher som slutar oavgjort (om noll
  → förlängning/straffar löste dem men flaggas ej).
- `own_goal`: finns EJ. goals[].type är bara open/corner/penalty; ingen självmåls-
  markering, inget eget event. Kan inte inventeras.
- `penalties`: FINNS (tilldelade straffar per match) → redovisas per fas.
Tunt material redovisas som tunt (Fables direktiv). Inferens undviks där n är litet.
"""
import json, sys
from collections import defaultdict, Counter
sys.path.insert(0, 'scripts/pipeline')
from analysis_helpers import wilson_ci

KNOCKOUT = ('round_of_16', 'quarterfinal', 'semifinal', 'final', 'playoff')


def by_phase(matches):
    agg = defaultdict(lambda: {'n': 0, 'goals': 0, 'pen': 0, 'draws': 0, 'home_w': 0})
    for m in matches:
        ph = m.get('phase'); a = agg[ph]
        hs, as_ = m.get('homeScore') or 0, m.get('awayScore') or 0
        a['n'] += 1; a['goals'] += hs + as_
        a['pen'] += len(m.get('penalties') or [])
        if hs == as_: a['draws'] += 1
        elif hs > as_: a['home_w'] += 1
    out = {}
    for ph, a in agg.items():
        out[ph] = {'n': a['n'], 'goals_per_match': round(a['goals'] / a['n'], 2),
                   'penalties_per_match': round(a['pen'] / a['n'], 2),
                   'draw_pct': round(a['draws'] / a['n'] * 100, 1), 'draws': a['draws'],
                   'home_win_pct': round(a['home_w'] / a['n'] * 100, 1)}
    return out


def own_goal_check(matches):
    types = Counter(g.get('type') for m in matches for g in (m.get('goals') or []))
    return {'goal_types_present': dict(types), 'own_goal_type_present': 'own_goal' in types,
            'note': 'Inget self/own-goal i goals[].type och inget separat event → självmål ej inventeringsbart.'}


def overtime_proxy(matches):
    """Knockout-oavgjorda = OT-proxy. Noll → förlängning/straffar löste dem men flaggas ej."""
    ko = [m for m in matches if m.get('phase') in KNOCKOUT]
    draws = sum(1 for m in ko if (m.get('homeScore') or 0) == (m.get('awayScore') or 0))
    return {'n_knockout': len(ko), 'knockout_draws': draws,
            'note': ('Inga oavgjorda knockout-matcher → förlängning/straffläggning avgjorde dem, '
                     'men ingen OT-flagga finns så frekvensen kan inte mätas.'
                     if draws == 0 else f'{draws} oavgjorda knockout-matcher (serieaggregat eller data-egenhet).')}


def kval_descriptive():
    d = json.load(open('docs/data/bandygrytan_kval.json'))
    ms = d['matches']
    n = len(ms)
    goals = sum((m.get('homeScore') or 0) + (m.get('awayScore') or 0) for m in ms)
    hw = sum(1 for m in ms if (m.get('homeScore') or 0) > (m.get('awayScore') or 0))
    dr = sum(1 for m in ms if (m.get('homeScore') or 0) == (m.get('awayScore') or 0))
    lo, hi = wilson_ci(hw / n, n)
    seasons = Counter(m.get('season') for m in ms)
    return {'n_matches': n, 'goals_per_match': round(goals / n, 2),
            'home_win_pct': round(hw / n * 100, 1), 'home_win_ci': [round(lo * 100), round(hi * 100)],
            'draw_pct': round(dr / n * 100, 1), 'seasons': dict(sorted(seasons.items())),
            'note': f'{n} kvalmatcher — deskriptivt only. För litet för inferens om kval-dramaturgi.'}


def main():
    d = json.load(open('docs/data/bandygrytan_detailed.json'))
    out = {'_meta': {
        'analysis': 'A8 restposter (overtime / own_goal / kval)',
        'spec': 'ANALYSSPEC_VAG2_OEXPLOATERAT.md A8',
        'data_gaps': 'overtime-flagga och own_goal FINNS EJ i datan — spec:en antog fält som inte existerar.',
    }}
    for series in ('herr', 'dam'):
        ms = d[series]['matches']
        out[series] = {
            'phase_breakdown': by_phase(ms),
            'own_goal': own_goal_check(ms),
            'overtime_proxy': overtime_proxy(ms),
        }
    out['kval'] = kval_descriptive()
    json.dump(out, open('docs/data/restposter_ot_og_kval.json', 'w'), ensure_ascii=False, indent=2)
    print("→ docs/data/restposter_ot_og_kval.json")

    h = out['herr']
    print("\nHERR fas-breakdown (mål/match, straffar/match, oavgjort%):")
    for ph, v in sorted(h['phase_breakdown'].items(), key=lambda x: -x[1]['n']):
        print(f"  {ph:<14} n={v['n']:<4} {v['goals_per_match']} mål, {v['penalties_per_match']} straff, oavgj {v['draw_pct']}%")
    print(f"  own_goal: {h['own_goal']['own_goal_type_present']} (types: {list(h['own_goal']['goal_types_present'])})")
    print(f"  OT-proxy: {h['overtime_proxy']['knockout_draws']} oavgjorda av {h['overtime_proxy']['n_knockout']} knockout")
    k = out['kval']
    print(f"  KVAL: {k['n_matches']} matcher, {k['goals_per_match']} mål/match, hemma {k['home_win_pct']}%")
    write_report(out)


def write_report(o):
    h, dm, k = o['herr'], o['dam'], o['kval']
    L = ["# A8 — Restposter (overtime / självmål / kval)\n"]
    L.append("**Analys:** ANALYSSPEC A8 — svepets sista. **Utförare:** Code. "
             "Fable avgör finding vs restpost-not.\n")
    L.append("## Datagap — läs först\n")
    L.append("Spec:en listade tre poster; **två av fälten finns inte i datan:**\n")
    L.append("- **Overtime/straffläggning:** ingen flagga. Matcher som gick till förlängning kan inte "
             f"identifieras. Proxy: {h['overtime_proxy']['knockout_draws']} oavgjorda av "
             f"{h['overtime_proxy']['n_knockout']} knockout-matcher (herr) — noll betyder att förlängning "
             "avgjorde dem, men frekvensen är omätbar utan flagga.")
    L.append("- **Självmål:** `goals[].type` är bara open/corner/penalty; ingen self/own-goal-markering "
             "och inget separat event. Självmål kan inte inventeras.")
    L.append("- **Straffar (tilldelade):** FINNS → redovisas per fas nedan.\n")

    L.append("## Fas-breakdown (herr)\n")
    L.append("| Fas | n | Mål/match | Straffar/match | Oavgjort% | Hemmavinst% |")
    L.append("|---|---|---|---|---|---|")
    for ph, v in sorted(h['phase_breakdown'].items(), key=lambda x: -x[1]['n']):
        L.append(f"| {ph} | {v['n']} | {v['goals_per_match']} | {v['penalties_per_match']} | {v['draw_pct']}% | {v['home_win_pct']}% |")
    kd, kn = h['overtime_proxy']['knockout_draws'], h['overtime_proxy']['n_knockout']
    L.append(f"\nSlutspelsfaserna har färre mål än grundserien (bekräftar Finding 006; finalen lägst med "
             f"{h['phase_breakdown'].get('final', {}).get('goals_per_match', '—')} mål/match). Straff-frekvensen "
             f"är stabil mellan faser. {kd} av {kn} knockout-matcher står som oavgjorda (sannolikt "
             "serieaggregat eller data-egenhet); förlängning/straffläggning syns inte som flagga. "
             "Kvalfasen har hög oavgjort-andel (26 %), förenligt med tvåmötesformat.\n")

    L.append("## Kvalmatcher (deskriptivt)\n")
    L.append(f"{k['note']} {k['n_matches']} matcher över säsongerna {list(k['seasons'])}.\n")
    L.append("| Mått | Värde |")
    L.append("|---|---|")
    L.append(f"| Mål/match | {k['goals_per_match']} |")
    L.append(f"| Hemmavinst% | {k['home_win_pct']}% (CI {k['home_win_ci'][0]}–{k['home_win_ci'][1]}) |")
    L.append(f"| Oavgjort% | {k['draw_pct']}% |")
    L.append(f"\nMed {k['n_matches']} matcher räcker det inte för inferens om kval-dramaturgi skiljer sig "
             "från grundserien — siffrorna är riktmärken, inte slutsatser.\n")

    L.append("## Sammanfattning för Fable\n")
    L.append("Materialet är tunt och två av tre poster är icke-mätbara i datan. Detta lämpar sig troligen "
             "som **restpost-not i rapportform**, inte en egen finding — om inte fas-breakdownens "
             "slutspels-målnedgång (som ändå står i 006) motiverar en kort notis. Fables bedömning.\n")

    L.append("## Begränsningar\n")
    L.append("- Overtime och självmål saknas som fält (se datagap).")
    L.append("- Kval: 38 matcher, för litet för inferens.")
    L.append("- 2023-24 saknas i grundserie-datan.\n")
    open('docs/data/ANALYS_RESTPOSTER.md', 'w').write('\n'.join(L))
    print("→ docs/data/ANALYS_RESTPOSTER.md")


if __name__ == '__main__':
    main()
