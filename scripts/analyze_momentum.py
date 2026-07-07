"""
A5 — Momentum och svarsmål (ANALYSSPEC_VAG2_OEXPLOATERAT.md).

Hur svarar lag på insläppta mål i verkligheten, och stämmer motorns
equalizeMomentumTeam-mekanik (attack-boost ×1,30 avtagande över ~6 min till
laget som just kvitterat) med det?

Kör: python3 scripts/analyze_momentum.py
  (kräver docs/data/sim_goal_sequences.json — genereras av scripts/sim_goal_sequences.ts)
Output: docs/data/momentum_response_goals.json + docs/data/ANALYS_MOMENTUM.md

Metod:
- För varje mål: nästa måls tid (dt) och lag (samma = utökning, andra = svar).
- Villkorat på matchläge (målskillnad ur målskyttens perspektiv efter målet).
- KVITTERINGSMOMENTUM: mål som gör ställningen jämn (skytt låg under 1 → jämnt).
  Testar P(kvitterande lag gör nästa mål = tar ledningen) mot baslinje.
- Halvlek: verklig data via halvleksflagga; sim via rå minut (ren motorklocka).
- Jämförelse verklig (herr) vs sim, sida vid sida.
- 2023-24 saknas i verklig data.
"""
import json, sys, math
from collections import defaultdict
sys.path.insert(0, 'scripts/pipeline')
from analysis_helpers import wilson_ci

BOOST_WINDOW = 6  # motorns EQUALIZE_MOMENTUM_STEPS≈6 min
QUICK = 5


def load_real(series):
    d = json.load(open('docs/data/bandygrytan_detailed.json'))[series]['matches']
    seqs = []
    for m in d:
        goals = [g for g in (m.get('goals') or []) if (g.get('minute') or 0) <= 90 and g.get('team') in ('home', 'away')]
        # goals[] är kronologisk; sortera stabilt på minut för säkerhets skull
        goals = sorted(goals, key=lambda g: g['minute'])
        seqs.append([(g['minute'], g['team'], g.get('half')) for g in goals])
    return seqs


def load_sim():
    d = json.load(open('docs/data/sim_goal_sequences.json'))['matches']
    # sim saknar halvleksflagga men har ren motorklocka → härled halvlek ur minut
    return [[(g['minute'], g['team'], 1 if g['minute'] <= 45 else 2) for g in m['goals']] for m in d]


def analyze(seqs, label):
    home_goals = away_goals = 0
    pairs = extensions = 0
    eq_total = eq_next_same = eq_next_same_fast = 0
    eq_dt = []; resp_dt = []; ext_dt = []
    quick_resp = resp_total = 0
    by_lead = defaultdict(lambda: [0, 0])   # post-mål-diff (skytt) → [svar, totalt]
    resp_by_half = defaultdict(lambda: [0, 0])

    for seq in seqs:
        h = a = 0
        for i, (mn, team, half) in enumerate(seq):
            prev_diff = (h - a) if team == 'home' else (a - h)   # skyttens diff FÖRE målet
            if team == 'home': h += 1; home_goals += 1
            else: a += 1; away_goals += 1
            post_diff = (h - a) if team == 'home' else (a - h)   # skyttens diff EFTER
            is_equalizer = (prev_diff == -1 and post_diff == 0)

            if i + 1 < len(seq):
                nmn, nteam, _ = seq[i + 1]
                dt = nmn - mn
                same = (nteam == team)
                pairs += 1
                by_lead[post_diff][1] += 1
                if half in (1, 2):
                    resp_by_half[half][1] += 1
                if same:
                    extensions += 1; ext_dt.append(dt)
                else:
                    resp_dt.append(dt); resp_total += 1
                    by_lead[post_diff][0] += 1
                    if half in (1, 2): resp_by_half[half][0] += 1
                    if dt <= QUICK: quick_resp += 1
                if is_equalizer:
                    eq_total += 1; eq_dt.append(dt)
                    if same:
                        eq_next_same += 1
                        if dt <= BOOST_WINDOW: eq_next_same_fast += 1

    tot_goals = home_goals + away_goals
    def rate(k, n):
        p = k / n if n else 0; lo, hi = wilson_ci(p, n) if n else (0, 0)
        return {'pct': round(p * 100, 1), 'ci': [round(lo * 100, 1), round(hi * 100, 1)], 'n': n}
    def med(xs): return round(sorted(xs)[len(xs) // 2], 1) if xs else None

    return {
        'label': label,
        'n_matches': len(seqs), 'n_goals': tot_goals,
        'home_goal_share_pct': round(home_goals / tot_goals * 100, 1) if tot_goals else 0,
        'goal_pairs': pairs,
        'extension_rate': rate(extensions, pairs),          # nästa mål = samma lag
        'response_rate': rate(pairs - extensions, pairs),   # nästa mål = motståndaren (svar)
        'equalizer_momentum': {
            'n_equalizers_with_next': eq_total,
            'takes_lead_next': rate(eq_next_same, eq_total),          # kvitterande lag gör nästa mål
            'takes_lead_within_6min': rate(eq_next_same_fast, eq_total),
            'mean_dt_after_equalizer': round(sum(eq_dt) / len(eq_dt), 1) if eq_dt else None,
            'median_dt_after_equalizer': med(eq_dt),
        },
        'response_timing': {
            'quick_response_5min_pct': rate(quick_resp, resp_total),
            'mean_response_dt': round(sum(resp_dt) / len(resp_dt), 1) if resp_dt else None,
            'median_response_dt': med(resp_dt),
            'mean_extension_dt': round(sum(ext_dt) / len(ext_dt), 1) if ext_dt else None,
            'median_extension_dt': med(ext_dt),
        },
        'response_by_lead_after_goal': {str(k): rate(v[0], v[1]) for k, v in sorted(by_lead.items()) if v[1] >= 20},
        'response_by_half': {str(k): rate(v[0], v[1]) for k, v in sorted(resp_by_half.items())},
    }


def main():
    real = analyze(load_real('herr'), 'Verklig (herr)')
    sim = analyze(load_sim(), 'Sim (motor)')
    real_dam = analyze(load_real('dam'), 'Verklig (dam)')

    out = {'_meta': {
        'analysis': 'A5 momentum och svarsmål',
        'spec': 'ANALYSSPEC_VAG2_OEXPLOATERAT.md A5',
        'engine_mechanic': 'equalizeMomentumTeam: ×1.30 attack-boost avtagande över ~6 min till kvitterande lag',
        'note': 'Baslinje för kvitteringsmomentum ~= hemmamålsandel (~50%). Styrkeheterogenitet '
                'konfunderar bägge dataset likartat; primärjämförelsen är verklig vs sim, inte mot 50%.',
    }, 'real_herr': real, 'sim': sim, 'real_dam': real_dam}

    json.dump(out, open('docs/data/momentum_response_goals.json', 'w'), ensure_ascii=False, indent=2)
    print("→ docs/data/momentum_response_goals.json")

    for r in (real, sim, real_dam):
        em = r['equalizer_momentum']
        print(f"\n{r['label']}: {r['n_matches']} matcher, {r['n_goals']} mål")
        print(f"  utökningsgrad (nästa mål samma lag): {r['extension_rate']['pct']}% [{r['extension_rate']['ci'][0]}-{r['extension_rate']['ci'][1]}]")
        print(f"  KVITTERINGSMOMENTUM (kvitterare tar ledn. med nästa mål): {em['takes_lead_next']['pct']}% "
              f"[{em['takes_lead_next']['ci'][0]}-{em['takes_lead_next']['ci'][1]}] (n={em['n_equalizers_with_next']})")
        print(f"    inom 6 min (motorns boost-fönster): {em['takes_lead_within_6min']['pct']}%")
        print(f"  snabbt svar ≤5 min: {r['response_timing']['quick_response_5min_pct']['pct']}%, median svar-dt {r['response_timing']['median_response_dt']} min")
    write_report(out)


def write_report(o):
    real, sim, dam = o['real_herr'], o['sim'], o['real_dam']
    L = ["# A5 — Momentum och svarsmål\n"]
    L.append("**Analys:** ANALYSSPEC A5. **Utförare:** Code. Fable skriver finding.\n")
    L.append(f"**Motorns mekanik:** `{o['_meta']['engine_mechanic']}`.\n")
    L.append("## Metod\n")
    L.append("För varje mål: nästa måls tid och lag (samma lag = utökning, motståndaren = svar). "
             "Kvitteringsmomentum = mål som gör ställningen jämn; testar om det kvitterande laget gör "
             "nästa mål (tar ledningen) oftare än baslinjen. Verklig data (herr/dam) via halvleksflagga; "
             "sim-mål ur motorn (`matchCore` via `roundProcessor`), rå motorklocka. Primärjämförelse: "
             "verklig herr vs sim. Wilson-CI på andelar.\n")
    L.append(f"{o['_meta']['note']}\n")

    L.append("## Huvudjämförelse (herr vs motor)\n")
    L.append("| Mått | Verklig (herr) | Sim (motor) |")
    L.append("|---|---|---|")
    def cell(r, path):
        d = r
        for p in path: d = d[p]
        return f"{d['pct']}% [{d['ci'][0]}–{d['ci'][1]}] (n={d['n']})"
    L.append(f"| Utökningsgrad (nästa mål samma lag) | {cell(real, ['extension_rate'])} | {cell(sim, ['extension_rate'])} |")
    L.append(f"| **Kvitteringsmomentum** (kvitterare tar ledn.) | {cell(real, ['equalizer_momentum','takes_lead_next'])} | {cell(sim, ['equalizer_momentum','takes_lead_next'])} |")
    L.append(f"| — därav inom 6 min (boost-fönstret) | {cell(real, ['equalizer_momentum','takes_lead_within_6min'])} | {cell(sim, ['equalizer_momentum','takes_lead_within_6min'])} |")
    L.append(f"| Snabbt svar ≤5 min | {cell(real, ['response_timing','quick_response_5min_pct'])} | {cell(sim, ['response_timing','quick_response_5min_pct'])} |")
    L.append("")
    L.append(f"Median tid till svarsmål: verklig {real['response_timing']['median_response_dt']} min, "
             f"sim {sim['response_timing']['median_response_dt']} min. "
             f"Median efter kvittering: verklig {real['equalizer_momentum']['median_dt_after_equalizer']} min, "
             f"sim {sim['equalizer_momentum']['median_dt_after_equalizer']} min.\n")

    L.append("## Tolkning — stämmer motorn?\n")
    rm = real['equalizer_momentum']['takes_lead_next']['pct']
    sm = sim['equalizer_momentum']['takes_lead_next']['pct']
    verdict = ("motorn överdriver momentum" if sm - rm > 3 else
               "motorn underdriver momentum" if rm - sm > 3 else
               "motorn ligger nära verkligheten")
    L.append(f"Kvitteringsmomentum: verklig **{rm}%** vs sim **{sm}%** → **{verdict}**. "
             "(Baslinje utan momentum ≈ hemmamålsandel, "
             f"verklig {real['home_goal_share_pct']}% / sim {sim['home_goal_share_pct']}%.)\n")

    L.append("## Svarsfrekvens per ledning efter målet (herr vs sim)\n")
    L.append("Andel där motståndaren gör nästa mål (svar), villkorat på målskyttens ledning direkt efter målet.\n")
    L.append("| Ledning efter mål | Verklig svar% | Sim svar% |")
    L.append("|---|---|---|")
    keys = sorted(set(real['response_by_lead_after_goal']) | set(sim['response_by_lead_after_goal']), key=lambda x: int(x))
    for k in keys:
        rv = real['response_by_lead_after_goal'].get(k); sv = sim['response_by_lead_after_goal'].get(k)
        rvs = f"{rv['pct']}% (n={rv['n']})" if rv else '—'
        svs = f"{sv['pct']}% (n={sv['n']})" if sv else '—'
        L.append(f"| {int(k):+d} | {rvs} | {svs} |")

    L.append("\n## Verklig dam (referens)\n")
    L.append(f"Kvitteringsmomentum dam: {cell(dam, ['equalizer_momentum','takes_lead_next'])}. "
             f"Utökningsgrad {cell(dam, ['extension_rate'])}.\n")

    L.append("## Begränsningar\n")
    L.append("- Styrkeheterogenitet konfunderar utöknings-/momentum-måtten (starkare lag gör fler mål i rad "
             "oavsett momentum). Verklig-vs-sim-jämförelsen är robust mot detta eftersom bägge har heterogenitet.")
    L.append("- Sim-mål saknar halvleksflagga; halvlek härledd ur rå motorminut (motorklockan är ren).")
    L.append("- Sim: 1490 matcher (3 seeds × 3 säsonger), managed + AI-matcher blandat.")
    L.append("- 2023-24 saknas i verklig data.\n")
    L.append("## Öppna Q-nummer som berörs\n")
    L.append("Momentum-/svarsmåls-frågorna i `docs/findings/facts/questions/` samt motorkalibrering av "
             "`EQUALIZE_MOMENTUM` (D-fact om värdet justeras).\n")
    open('docs/data/ANALYS_MOMENTUM.md', 'w').write('\n'.join(L))
    print("→ docs/data/ANALYS_MOMENTUM.md")


if __name__ == '__main__':
    main()
