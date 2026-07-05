"""
Underlag för Finding 057 (cyniskt fouling per spelläge) och 058 (straffkonvertering).
Kör: python3 scripts/analyze_foul_penalty.py
"""
import json, sys
from collections import Counter
sys.path.insert(0, 'scripts/pipeline')
from analysis_helpers import wilson_ci

d = json.load(open('docs/data/bandygrytan_detailed.json'))

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
    print(f"\n{label} — sabotage-andel per spelläge:")
    for s in ('leder', 'jämnt', 'under'):
        if tot[s]:
            p = st[s] / tot[s]; lo, hi = wilson_ci(p, tot[s])
            print(f"  {s:<6} {st[s]:>4}/{tot[s]:<5} = {p*100:.1f}% [{lo*100:.1f}–{hi*100:.1f}]")
    if tot['under'] and st['under']:
        print(f"  leder/under-kvot: {(st['leder']/tot['leder'])/(st['under']/tot['under']):.2f}x")

sabotage_by_state(d['herr']['matches'], 'HERR')
sabotage_by_state(d['dam']['matches'], 'DAM')

# ── Finding 058: straffkonvertering ──
print("\nStraffkonvertering:")
for lbl, ms in [('herr', d['herr']['matches']), ('dam', d['dam']['matches'])]:
    pa = sum(len(m.get('penalties') or []) for m in ms)
    pg = sum(1 for m in ms for g in (m.get('goals') or []) if g.get('type') == 'penalty')
    lo, hi = wilson_ci(pg / pa, pa)
    print(f"  {lbl}: {pg}/{pa} = {pg/pa*100:.1f}% [{lo*100:.0f}–{hi*100:.0f}]")

# ── Finding 059: power play-effektivitet (rate-matchat) ──
def pp_rate(matches, label):
    ppg=esg=ppm=esm=0
    for m in matches:
        home_pp=[False]*95; away_pp=[False]*95
        for f in (m.get('fouls') or []):
            dur=f.get('duration')
            if dur not in (5,10): continue
            pen=f.get('team'); fm=f.get('minute',0)
            for mm in range(fm+1, min(95, fm+dur+1)):
                if pen=='home': away_pp[mm]=True
                else: home_pp[mm]=True
        for mm in range(1,91):
            ppm+= (1 if away_pp[mm] else 0) + (1 if home_pp[mm] else 0)
            esm+= (0 if away_pp[mm] else 1) + (0 if home_pp[mm] else 1)
        for g in (m.get('goals') or []):
            on = (away_pp if g['team']=='away' else home_pp)[min(94,g['minute'])]
            if on: ppg+=1
            else: esg+=1
    print(f"\n{label} power play: PP {ppg}/{ppm}={ppg/ppm*100:.2f}%/min | ES {esg}/{esm}={esg/esm*100:.2f}%/min | lyft {ppg/ppm/(esg/esm):.2f}x | PP-andel av mål {ppg/(ppg+esg)*100:.1f}%")

pp_rate(d['herr']['matches'],'HERR')
pp_rate(d['dam']['matches'],'DAM')
