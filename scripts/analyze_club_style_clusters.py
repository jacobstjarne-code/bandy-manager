"""
Spelstilsklustring v2 — kvalitetsneutral, med klubbnamns-normalisering.
Finding 054. Kör: python3 scripts/analyze_club_style_clusters.py
"""
import json, sys
from collections import defaultdict, Counter
import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from numpy.linalg import lstsq
sys.path.insert(0, 'scripts/pipeline')
from club_names import normalize_club

d = json.load(open('docs/data/bandygrytan_detailed.json'))
herr = d['herr']['matches']
for m in herr:
    m['homeTeam']=normalize_club(m['homeTeam']); m['awayTeam']=normalize_club(m['awayTeam'])
regular = [m for m in herr if m.get('phase')=='regular']

def find_clusters(goals, side, window=5):
    tg = sorted([g for g in goals if g['team']==side], key=lambda g:g['minute'])
    cl,i=[],0
    while i<len(tg):
        c=[tg[i]]; j=i+1
        while j<len(tg) and tg[j]['minute']-tg[i]['minute']<=window: c.append(tg[j]); j+=1
        if len(c)>=2: cl.append(c); i=j
        else: i+=1
    return cl

raw=defaultdict(lambda:defaultdict(list))
for m in regular:
    for t in [m['homeTeam'],m['awayTeam']]: raw[t][m['season']].append(m)

records=[]
for team,seasons in raw.items():
    for season,matches in seasons.items():
        if len(matches)<10: continue
        n=len(matches); gf=ga=tc=cg=og=fr=wins=hwin=hn=awin=an=cc=0
        for m in matches:
            side='home' if m['homeTeam']==team else 'away'
            g_for=m['homeScore'] if side=='home' else m['awayScore']
            g_ag=m['awayScore'] if side=='home' else m['homeScore']
            gf+=g_for; ga+=g_ag; wins+=g_for>g_ag
            goals=m.get('goals') or []; tg2=[g for g in goals if g['team']==side]
            cg+=sum(1 for g in tg2 if g['type']=='corner'); og+=sum(1 for g in tg2 if g['type']=='open')
            c=m.get('corners') or {}; tc+=c.get(side,0) or 0
            fr+=sum(1 for f in (m.get('fouls') or []) if f['team']==side)
            cc+=len(find_clusters(goals,side))
            if side=='home': hn+=1; hwin+=(g_for>g_ag)
            else: an+=1; awin+=(g_for>g_ag)
        if gf==0: continue
        records.append({'team':team,'season':season,
            'corner_goal_pct':cg/gf,'open_play_pct':og/gf,'corners_per_match':tc/n,
            'corners_per_goal':tc/max(1,gf),'cluster_freq':cc/n,'fouls_per_match':fr/n,
            'home_adv':(hwin/hn-awin/an) if hn and an else 0,'win_rate':wins/n})

tc2=Counter(r['team'] for r in records)
records=[r for r in records if tc2[r['team']]>=3]
SF=['corner_goal_pct','open_play_pct','corners_per_match','corners_per_goal','cluster_freq','fouls_per_match','home_adv']
seasons=list(set(r['season'] for r in records))
for f in SF:
    for s in seasons:
        vals=[r[f] for r in records if r['season']==s]
        if len(vals)<2: continue
        mu=sum(vals)/len(vals); sd=(sum((v-mu)**2 for v in vals)/(len(vals)-1))**0.5
        for r in records:
            if r['season']==s: r['z_'+f]=(r[f]-mu)/sd if sd>0 else 0
ZF=['z_'+f for f in SF]
X=np.array([[r[f] for f in ZF] for r in records])
sil={}
for k in range(2,6):
    km=KMeans(n_clusters=k,random_state=42,n_init=20)
    sil[k]=round(float(silhouette_score(X,km.fit_predict(X))),4)
print('n klubb-säsonger:',len(records),'| unika klubbar:',len(set(r['team'] for r in records)))
print('Silhouette:',sil)
km=KMeans(n_clusters=2,random_state=42,n_init=20); lab=km.fit_predict(X)
for i,r in enumerate(records): r['cluster']=int(lab[i])
ats=defaultdict(list)
for r in records: ats[r['team']].append(r['cluster'])
for c in range(2):
    mem=[r for r in records if r['cluster']==c]
    print(f'\nKluster {c} (n={len(mem)}):')
    for f in SF:
        z=sum(r['z_'+f] for r in mem)/len(mem); rw=sum(r[f] for r in mem)/len(mem)
        if abs(z)>0.2: print(f'  {f}: z={z:+.2f} raw={rw:.3f}')
    cons=sorted([(t,round(sum(1 for x in ats[t] if x==c)/len(ats[t])*100)) for t in set(r['team'] for r in mem) if len(ats[t])>=3 and sum(1 for x in ats[t] if x==c)/len(ats[t])>=0.6],key=lambda x:-x[1])
    print('  Konsistenta:',cons)
json.dump({'_meta':{'silhouette':sil,'n':len(records),'normalized':True},
  'records':[{'team':r['team'],'season':r['season'],'cluster':r['cluster'],**{f:round(r[f],4) for f in SF}} for r in records]},
  open('docs/data/klubb_stilkluster.json','w'),ensure_ascii=False,indent=2)
print('\n✓ klubb_stilkluster.json (normaliserad)')
