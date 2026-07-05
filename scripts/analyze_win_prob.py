"""
A1 — Win probability-modell (ANALYSSPEC_VAG2_OEXPLOATERAT.md).

P(hemmavinst/oavgjort/bortavinst) som funktion av (matchminut, målskillnad
hemma−borta). Tre-utfallsmodell. Herr grundserie som bas; dam separat.

Kör: python3 scripts/analyze_win_prob.py
Output: docs/data/win_prob_herr.json, win_prob_dam.json, docs/data/ANALYS_WIN_PROB.md

Metodnoter:
- Tillstånd: målskillnad som gäller UNDER minut m = mål med minut < m (ett mål
  i minut m får effekt från minut m+1, enligt spec). Samma minut, flera mål:
  alla resolveras, resultatet gäller från nästa minut.
- Målskillnad trunkeras till [-3, +3] med ±3 som kantklasser (≤-3, ≥+3).
- Minutkonvention: analysen är per RÅ matchminut (1–90) — tillståndet vid en
  given speltidsminut. Halvleksflaggan gäller halvleks-BUCKETING (den fälla som
  drabbade 008/017/041/042/043); här indexeras på rå minut, vilket är korrekt
  för en win-prob-tidslinje. Minut 45–50 blandar 1H-tilläggstid och tidig 2H i
  speltidsbemärkelse — noteras som begränsning, påverkar inte tillståndslogiken.
- n≥30 per cell för "reliable"; celler under flaggas reliable=false (behålls i
  griden med markering, ej utelämnade).
"""
import json
from collections import defaultdict
from pathlib import Path

DATA = Path('docs/data/bandygrytan_detailed.json')
MIN_N = 30
DIFF_LO, DIFF_HI = -3, 3
MAX_MIN = 90

def clamp_diff(diff):
    if diff <= DIFF_LO: return DIFF_LO
    if diff >= DIFF_HI: return DIFF_HI
    return diff

def outcome(m):
    hs, as_ = m.get('homeScore', 0) or 0, m.get('awayScore', 0) or 0
    if hs > as_: return 'home'
    if hs < as_: return 'away'
    return 'draw'

def build_grid(matches):
    """grid[minute][diff] = Counter över utfall."""
    grid = defaultdict(lambda: defaultdict(lambda: {'home': 0, 'draw': 0, 'away': 0}))
    used = 0
    for m in matches:
        goals = sorted((m.get('goals') or []), key=lambda g: g.get('minute', 0))
        res = outcome(m)
        used += 1
        # cumulativ diff per minut: mål i minut k påverkar från minut k+1
        # bygg lista av (minut, diff_efter_det_målet)
        cum = 0
        # events: minut -> diff efter alla mål i den minuten
        diff_after_minute = {}
        for g in goals:
            gm = g.get('minute', 0)
            cum += 1 if g.get('team') == 'home' else -1
            diff_after_minute[gm] = cum  # sista skrivningen = efter minutens sista mål
        # tillstånd som gäller UNDER minut m = diff efter senaste mål med minut < m
        state = 0
        # sortera minutnycklar
        goal_minutes = sorted(diff_after_minute.keys())
        gi = 0
        for minute in range(1, MAX_MIN + 1):
            # applicera alla mål med minut < minute som ännu ej applicerats
            while gi < len(goal_minutes) and goal_minutes[gi] < minute:
                state = diff_after_minute[goal_minutes[gi]]
                gi += 1
            dc = clamp_diff(state)
            grid[minute][dc][res] += 1
    return grid, used

def grid_to_json(grid):
    out = {}
    for minute in sorted(grid.keys()):
        out[str(minute)] = {}
        for dc in sorted(grid[minute].keys()):
            c = grid[minute][dc]
            n = c['home'] + c['draw'] + c['away']
            if n == 0: continue
            out[str(minute)][str(dc)] = {
                'P_home': round(c['home'] / n, 4),
                'P_draw': round(c['draw'] / n, 4),
                'P_away': round(c['away'] / n, 4),
                'n': n,
                'reliable': n >= MIN_N,
            }
    return out

def dead_thresholds(gridjson):
    """Första minut där P_home>0.95 (per diff≥+1) resp P_away>0.95 (diff≤-1), med reliable=True."""
    res = {}
    for diff in ['1', '2', '3', '-1', '-2', '-3']:
        target = 'P_home' if int(diff) > 0 else 'P_away'
        first = None
        for minute in range(1, MAX_MIN + 1):
            cell = gridjson.get(str(minute), {}).get(diff)
            if cell and cell['reliable'] and cell[target] > 0.95:
                first = minute; break
        res[diff] = first
    return res

def ht_snapshot(gridjson):
    """Tillstånd vid minut 45 (halvtid) per diff — jämförelse mot findings 001/011/038."""
    snap = {}
    for diff, cell in gridjson.get('45', {}).items():
        snap[diff] = {'P_home': cell['P_home'], 'P_draw': cell['P_draw'],
                      'P_away': cell['P_away'], 'n': cell['n'], 'reliable': cell['reliable']}
    return snap

def main():
    d = json.load(open(DATA))
    herr = [m for m in d['herr']['matches'] if m.get('phase') == 'regular']
    dam = [m for m in d['dam']['matches'] if m.get('phase') == 'regular']

    reports = {}
    for label, matches, fname in [('herr', herr, 'win_prob_herr.json'),
                                   ('dam', dam, 'win_prob_dam.json')]:
        grid, used = build_grid(matches)
        gj = grid_to_json(grid)
        n_cells = sum(len(v) for v in gj.values())
        n_reliable = sum(1 for v in gj.values() for c in v.values() if c['reliable'])
        out = {
            '_meta': {
                'analysis': 'A1 win probability',
                'series': label,
                'phase': 'grundserie (regular)',
                'n_matches': used,
                'min_n_reliable': MIN_N,
                'diff_range': f'[{DIFF_LO},{DIFF_HI}] med kantklasser',
                'cells_total': n_cells,
                'cells_reliable': n_reliable,
            },
            'grid': gj,
            'dead_thresholds': dead_thresholds(gj),
            'ht_minute45': ht_snapshot(gj),
        }
        json.dump(out, open(f'docs/data/{fname}', 'w'), ensure_ascii=False, indent=2)
        reports[label] = out
        print(f"{label}: {used} matcher, {n_cells} celler, {n_reliable} reliable (n≥{MIN_N}) → {fname}")

    write_report(reports)

def write_report(reports):
    h, dm = reports['herr'], reports['dam']
    def curve_line(gj, diff):
        pts = []
        for minute in [1, 15, 30, 45, 60, 75, 89]:
            cell = gj['grid'].get(str(minute), {}).get(str(diff))
            if cell:
                flag = '' if cell['reliable'] else '*'
                pts.append(f"min{minute}: {cell['P_home']*100:.0f}%{flag} (n={cell['n']})")
        return ' | '.join(pts)

    lines = []
    lines.append("# A1 — Win probability-modell\n")
    lines.append("**Analys:** ANALYSSPEC_VAG2_OEXPLOATERAT.md A1. **Utförare:** Code. Fable skriver finding.\n")
    lines.append("## Metod\n")
    lines.append("Per-match tillståndslinje ur `goals[]`. För varje matchminut 1–90 och "
                 "målskillnad hemma−borta (trunkerad till [−3,+3] med kantklasser) empirisk "
                 "utfallsfördelning (hemmavinst / oavgjort / bortavinst) i grundserien. "
                 "Ett mål i minut m får effekt från minut m+1; flera mål samma minut "
                 "resolveras tillsammans. Celler med n≥30 markeras `reliable`.\n")
    lines.append("**Minutkonvention:** per rå matchminut (tillstånd vid en speltidsminut). "
                 "Halvleksflaggan gäller halvleks-*bucketing* — här indexeras på rå minut, "
                 "korrekt för en win-prob-tidslinje. Minut 45–50 blandar 1H-tilläggstid och "
                 "tidig 2H i speltid; noteras som begränsning, påverkar ej tillståndslogiken.\n")
    lines.append(f"**Underlag:** herr grundserie {h['_meta']['n_matches']} matcher, "
                 f"dam grundserie {dm['_meta']['n_matches']} matcher.\n")

    lines.append("## Hemmavinst-sannolikhet per målskillnad (herr, P_home, * = n<30)\n")
    for diff in [3, 2, 1, 0, -1, -2, -3]:
        lines.append(f"- **diff {diff:+d}:** {curve_line(h, diff)}")
    lines.append("")

    lines.append("## \"Match död\"-tröskel — första minut där utfallet är ≥95 % säkert (reliable)\n")
    lines.append("| Målskillnad | Herr | Dam |")
    lines.append("|---|---|---|")
    for diff in ['3', '2', '1', '-1', '-2', '-3']:
        hv = h['dead_thresholds'].get(diff); dv = dm['dead_thresholds'].get(diff)
        lines.append(f"| {diff} | {'min '+str(hv) if hv else 'aldrig <90'} | {'min '+str(dv) if dv else 'aldrig <90'} |")
    lines.append("")

    lines.append("## Halvtid (minut 45) — jämförelse mot findings 001/011/038\n")
    lines.append("Findings 001/011/038 anger halvtidsledning→vinst ~78 % (herr). Denna modell "
                 "ger tillståndet vid exakt minut 45:\n")
    lines.append("| diff vid min 45 | P_home herr | n | P_home dam | n |")
    lines.append("|---|---|---|---|---|")
    for diff in ['3', '2', '1', '0', '-1', '-2', '-3']:
        hc = h['ht_minute45'].get(diff); dc = dm['ht_minute45'].get(diff)
        hp = f"{hc['P_home']*100:.0f}%{'' if hc['reliable'] else '*'}" if hc else '—'
        hn = hc['n'] if hc else '—'
        dp = f"{dc['P_home']*100:.0f}%{'' if dc['reliable'] else '*'}" if dc else '—'
        dn = dc['n'] if dc else '—'
        lines.append(f"| {diff} | {hp} | {hn} | {dp} | {dn} |")
    lines.append("")
    lines.append("*Not:* modellens \"+1 vid minut 45\"-cell är den direkta motsvarigheten till "
                 "findings 001/011/038:s halvtidsledning. Findingsen aggregerar alla ledningar "
                 "≥1; denna modell särskiljer +1/+2/+3.\n")

    lines.append("## Täckning\n")
    lines.append(f"- Herr: {h['_meta']['cells_reliable']}/{h['_meta']['cells_total']} celler reliable (n≥30).")
    lines.append(f"- Dam: {dm['_meta']['cells_reliable']}/{dm['_meta']['cells_total']} celler reliable — "
                 f"glesare grid ({dm['_meta']['n_matches']} matcher); celler med n<30 flaggade, ej utelämnade.\n")

    lines.append("## Begränsningar\n")
    lines.append("- Grundserie endast; slutspel ej inkluderat (annan dramaturgi, bäst-av-format).")
    lines.append("- Tre-utfallsmodell: oavgjort redovisas som eget utfall, ej hopslaget.")
    lines.append("- Minut 45–50 blandar 1H-tilläggstid/tidig 2H i speltid (se metod).")
    lines.append("- Empirisk grid, ingen utjämning/regression — glesa celler brusiga (flaggade).")
    lines.append("- 2023–24 saknas i datasetet.\n")

    lines.append("## Öppna Q-nummer som berörs\n")
    lines.append("Win-prob-tidslinjen ger direkt underlag till halvtidslednings-frågorna bakom "
                 "findings 001/011/038 och till varje Q i `docs/findings/facts/questions/` som rör "
                 "matchläges-prediktion över tid. (Ingen enskild Q stängs helt — modellen är ett "
                 "verktyg, inte ett enkelt ja/nej.)\n")

    Path('docs/data/ANALYS_WIN_PROB.md').write_text('\n'.join(lines), encoding='utf-8')
    print("→ docs/data/ANALYS_WIN_PROB.md")

if __name__ == '__main__':
    main()
