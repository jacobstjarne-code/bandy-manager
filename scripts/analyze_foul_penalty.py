"""
Underlag för findings 057 (cyniskt fouling per spelläge), 058 (straffkonvertering)
och 059 (power play-effektivitet + straff-timing).

Kör: python3 scripts/analyze_foul_penalty.py
Output: skriver docs/data/foul_penalty_powerplay.json + docs/data/ANALYS_FOUL_PENALTY_POWERPLAY.md
        och printar en sammanfattning till stdout.

Detta är den reproducerbara källan bakom de tre redan publicerade finding-sidorna
(057/058/059). Den fullständiga A2-analysen (PP-konvertering per duration, reform
25/26, shorthanded-mål) är en separat, mer rigorös körning enligt
ANALYSSPEC_VAG2_OEXPLOATERAT.md — den ersätter inte detta underlag.

Minutkonvention: straff-timing bucketas per RÅ matchminut i 15-min-fönster.
Fönstret 45–59 blandar 1H-tilläggstid och tidig 2H i speltid (samma begränsning
som win-prob-modellen). Halvleksflaggan gäller halvleks-bucketing; för en
tidsfördelning över hela matchen är rå minut korrekt. Noteras som begränsning.
"""
import json, sys
from collections import Counter
sys.path.insert(0, 'scripts/pipeline')
from analysis_helpers import wilson_ci

d = json.load(open('docs/data/bandygrytan_detailed.json'))
out = {'_meta': {
    'analysis': 'foul / penalty / power play — underlag findings 057-059',
    'source': 'bandygrytan_detailed.json (Elitserien herr/dam)',
    'note': 'Alla matcher (grundserie + slutspel). A2 är den rigorösa PP-extensionen.',
    'n_matches': {'herr': len(d['herr']['matches']), 'dam': len(d['dam']['matches'])},
}}


# ── Finding 057: sabotage-utvisningar per spelläge ──
def sabotage_by_state(matches, label):
    st = Counter(); tot = Counter()
    for m in matches:
        for f in (m.get('fouls') or []):
            sc = f.get('scoreAtTime') or {}; t = f.get('team')
            if t not in ('home', 'away') or 'home' not in sc: continue
            mine = sc['home'] if t == 'home' else sc['away']
            theirs = sc['away'] if t == 'home' else sc['home']
            state = 'leder' if mine > theirs else ('under' if mine < theirs else 'jämnt')
            tot[state] += 1
            if f.get('reason_norm') == 'sabotage': st[state] += 1
    res = {}
    print(f"\n{label} — sabotage-andel per spelläge:")
    for s in ('leder', 'jämnt', 'under'):
        if tot[s]:
            p = st[s] / tot[s]; lo, hi = wilson_ci(p, tot[s])
            res[s] = {'sabotage': st[s], 'total': tot[s], 'pct': round(p * 100, 1),
                      'ci': [round(lo * 100, 1), round(hi * 100, 1)]}
            print(f"  {s:<6} {st[s]:>4}/{tot[s]:<5} = {p*100:.1f}% [{lo*100:.1f}–{hi*100:.1f}]")
    if tot['under'] and st['under']:
        ratio = (st['leder'] / tot['leder']) / (st['under'] / tot['under'])
        res['leder_under_kvot'] = round(ratio, 2)
        print(f"  leder/under-kvot: {ratio:.2f}x")
    return res

out['finding_057_sabotage_by_state'] = {
    'herr': sabotage_by_state(d['herr']['matches'], 'HERR'),
    'dam': sabotage_by_state(d['dam']['matches'], 'DAM'),
}

# ── Finding 058: straffkonvertering ──
print("\nStraffkonvertering:")
conv = {}
for lbl, ms in [('herr', d['herr']['matches']), ('dam', d['dam']['matches'])]:
    pa = sum(len(m.get('penalties') or []) for m in ms)
    pg = sum(1 for m in ms for g in (m.get('goals') or []) if g.get('type') == 'penalty')
    lo, hi = wilson_ci(pg / pa, pa)
    conv[lbl] = {'penalties': pa, 'goals': pg, 'pct': round(pg / pa * 100, 1),
                 'ci': [round(lo * 100), round(hi * 100)]}
    print(f"  {lbl}: {pg}/{pa} = {pg/pa*100:.1f}% [{lo*100:.0f}–{hi*100:.0f}]")
out['finding_058_penalty_conversion'] = conv


# ── Finding 059: power play-effektivitet (rate-matchat) ──
def pp_rate(matches, label):
    ppg = esg = ppm = esm = 0
    for m in matches:
        home_pp = [False] * 95; away_pp = [False] * 95
        for f in (m.get('fouls') or []):
            dur = f.get('duration')
            if dur not in (5, 10): continue
            pen = f.get('team'); fm = f.get('minute', 0)
            for mm in range(fm + 1, min(95, fm + dur + 1)):
                if pen == 'home': away_pp[mm] = True
                else: home_pp[mm] = True
        for mm in range(1, 91):
            ppm += (1 if away_pp[mm] else 0) + (1 if home_pp[mm] else 0)
            esm += (0 if away_pp[mm] else 1) + (0 if home_pp[mm] else 1)
        for g in (m.get('goals') or []):
            on = (away_pp if g['team'] == 'away' else home_pp)[min(94, g['minute'])]
            if on: ppg += 1
            else: esg += 1
    lift = (ppg / ppm) / (esg / esm)
    res = {'pp_goals': ppg, 'pp_team_minutes': ppm, 'pp_rate_pct': round(ppg / ppm * 100, 2),
           'es_goals': esg, 'es_team_minutes': esm, 'es_rate_pct': round(esg / esm * 100, 2),
           'lift': round(lift, 2), 'pp_share_of_goals_pct': round(ppg / (ppg + esg) * 100, 1)}
    print(f"\n{label} power play: PP {ppg}/{ppm}={ppg/ppm*100:.2f}%/min | "
          f"ES {esg}/{esm}={esg/esm*100:.2f}%/min | lyft {lift:.2f}x | "
          f"PP-andel av mål {ppg/(ppg+esg)*100:.1f}%")
    return res

out['finding_059_powerplay'] = {
    'herr': pp_rate(d['herr']['matches'], 'HERR'),
    'dam': pp_rate(d['dam']['matches'], 'DAM'),
}


# ── Finding 059: straff-timing per 15-min-fönster (rå minut) ──
def penalty_timing(matches, label):
    buckets = [(0, 14), (15, 29), (30, 44), (45, 59), (60, 74), (75, 89)]
    counts = [0] * len(buckets); tot = 0
    for m in matches:
        for p in (m.get('penalties') or []):
            mn = p.get('minute')
            if mn is None: continue
            tot += 1
            for i, (lo, hi) in enumerate(buckets):
                if lo <= mn <= hi: counts[i] += 1; break
    rows = []
    print(f"\n{label} straff-timing (rå minut, n={tot}):")
    for (lo, hi), c in zip(buckets, counts):
        pct = round(c / tot * 100) if tot else 0
        rows.append({'window': f'{lo}-{hi}', 'count': c, 'pct': pct})
        print(f"  {lo:>2}-{hi:<2} {c:>4} = {pct}%")
    return {'n': tot, 'windows': rows}

out['finding_059_penalty_timing'] = {
    'herr': penalty_timing(d['herr']['matches'], 'HERR'),
    'dam': penalty_timing(d['dam']['matches'], 'DAM'),
}

# ── Persistera ──
json.dump(out, open('docs/data/foul_penalty_powerplay.json', 'w'),
          ensure_ascii=False, indent=2)
print("\n→ docs/data/foul_penalty_powerplay.json")

# md-rapport
s57h = out['finding_057_sabotage_by_state']['herr']
s58 = out['finding_058_penalty_conversion']
s59h = out['finding_059_powerplay']['herr']; s59d = out['finding_059_powerplay']['dam']
tim = out['finding_059_penalty_timing']['herr']
nm = out['_meta']['n_matches']
L = []
L.append("# Underlag — foul / straff / power play (findings 057–059)\n")
L.append("**Utförare:** Code. **Källa:** `bandygrytan_detailed.json`, alla matcher "
         f"(herr {nm['herr']}, dam {nm['dam']}). Reproducerbar: `python3 scripts/analyze_foul_penalty.py`.\n")
L.append("Detta är den persisterade källan bakom de tre redan publicerade finding-sidorna. "
         "Den fullständiga A2 (PP-konvertering per duration, reform 25/26, shorthanded-mål) "
         "enligt `ANALYSSPEC_VAG2_OEXPLOATERAT.md` är en separat, mer rigorös körning.\n")

L.append("## Finding 057 — sabotage per spelläge (herr)\n")
L.append("| Spelläge | Sabotage/utv. | Andel | 95 % CI |")
L.append("|---|---|---|---|")
for s in ('leder', 'jämnt', 'under'):
    if s in s57h:
        r = s57h[s]
        L.append(f"| {s} | {r['sabotage']}/{r['total']} | {r['pct']} % | [{r['ci'][0]}–{r['ci'][1]}] |")
L.append(f"\nLeder/under-kvot: **{s57h.get('leder_under_kvot')}×** — ledande lag saboterar oftare.\n")

L.append("## Finding 058 — straffkonvertering\n")
L.append("| Serie | Straffar | Straffmål | Konvertering | 95 % CI |")
L.append("|---|---|---|---|---|")
for lbl in ('herr', 'dam'):
    r = s58[lbl]
    L.append(f"| {lbl} | {r['penalties']} | {r['goals']} | {r['pct']} % | [{r['ci'][0]}–{r['ci'][1]}] |")
L.append("")

L.append("## Finding 059 — power play (rate-matchat)\n")
L.append("| Serie | PP mål/min | ES mål/min | Lyft | PP-andel av mål |")
L.append("|---|---|---|---|---|")
for lbl, r in (('herr', s59h), ('dam', s59d)):
    L.append(f"| {lbl} | {r['pp_rate_pct']} % | {r['es_rate_pct']} % | {r['lift']}× | {r['pp_share_of_goals_pct']} % |")
L.append("\n### Straff-timing per 15-min-fönster (herr, rå minut)\n")
L.append("| Fönster | Straffar | Andel |")
L.append("|---|---|---|")
for w in tim['windows']:
    L.append(f"| {w['window']} | {w['count']} | {w['pct']} % |")
L.append(f"\nn = {tim['n']}. Straffarna koncentreras till slutkvarten (75–89).\n")

L.append("## Begränsningar\n")
L.append("- PP-status härleds ur utvisningarnas start + längd; överlappande utvisningar (5v3) slås samman.")
L.append("- Shorthanded-mål räknas till full styrka, vilket trycker ihop PP-lyftet något (försiktig skattning).")
L.append("- Straff-timing per rå minut; fönstret 45–59 blandar 1H-tilläggstid och tidig 2H (se toppnot).")
L.append("- 2023–24 saknas i datasetet.\n")

open('docs/data/ANALYS_FOUL_PENALTY_POWERPLAY.md', 'w').write('\n'.join(L))
print("→ docs/data/ANALYS_FOUL_PENALTY_POWERPLAY.md")
