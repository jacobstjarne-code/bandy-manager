# SCORELINE_REFERENCE.md
# Utvisningar, straff och spelläge per fas — referensvärden

**Källa:** `docs/data/bandygrytan_detailed.json` (1124 grundserie + 68 KVF + 38 SF + 12 Final)
**Genererad:** 2026-04-21 via `scripts/calibrate_v2.ts` (sektioner 1.1–1.6)
**Används av:** Sprint 25b (utvisningskalibrering), Sprint 25c (straff), Sprint 25d (fas-konstanter)

---

## ⚠️ VARNING — Skottdata från bandygrytan är underrapporterad

Bandygrytans `avgShotsPerMatch: 10.5` bygger på event-type 11 ("Skott på mål") men underrapporterar vs verkligheten. **Bandypuls uppger 28 skott/match och 63-64% räddningsprocent** — ~2.7x skillnad.

**Verifierat 2026-04-24 via Allsvenskan-scraping (scrape-allsvenskan.mjs):**

| Mått | Värde |
|------|-------|
| Antal allsvenskan-matcher med skottdata | 887 totalt |
| loggingQuality full | 222 matcher (24%) |
| loggingQuality partial | 546 matcher (59%) |
| loggingQuality minimal | 157 matcher (17%) |
| Snitt skott/match (full-matcher, n=222) | **15.8** |
| Bandypuls-referens | ~28 |
| Differens | ~12 (55% lägre) |

**Slutsats:** Bandygrytan räknar event-typ 11 inkonsekvent — sannolikt bara skott som uppfattades som på mål av rapportören (=räddningar + mål), INTE alla skott. Bandypuls räknar alla skott inklusive off-target och blockade. Skillnaden ~55% bekräftar att bandygrytans typ-11 ≈ "shots on frame" medan Bandypuls ≈ "all shots attempted".

Trolig orsak: live-rapportörer loggar inte alla skott, bara dramatiska eller tydliga på-mål-skott.

**Motorn kalibrerad mot Bandypuls-targets (post-25b-playtest):**
- 28 skott/match totalt
- 14 skott/lag
- ~9 räddningar/match (63-64% räddningsprocent)
- ~36-37% av skott på mål blir mål

**Använd EJ** `bandygrytan_detailed.json.calibrationTargets.avgShotsPerMatch` som kalibreringsmål. Använd Bandypuls-siffrorna ovan.

---

## Verifiering (sektion 1.5)

Alla fas-targets stämmer exakt mot `ANALYS_SLUTSPEL.md`:

| Fas        | Mål/match | Target | Hörnmål% | Target | n      |
|------------|-----------|--------|----------|--------|--------|
| Grundserie | 9.12      | 9.12   | 22.1%    | 22.2%  | 1124   |
| KVF        | 8.81      | 8.81   | 19.9%    | 20.0%  | 68     |
| SF         | 8.39      | 8.39   | 18.7%    | 18.8%  | 38     |
| Final      | 7.00      | 7.00   | 16.7%    | 16.7%  | 12     |

Fas-klassifikationen är korrekt. Sprint 24.2-data är pålitlig.

---

## Sektion 1.1 — Utvisningar × spelläge (normaliserat mot tid)

1271 matcher med scoreAtTime-data. 4987 utvisningar klassificerade.

```
                   Minuter    Utvisn   Per 1kmin   Relation
──────────────────────────────────────────────────────────
Ledning              86706      1949      22.478      1.04x
Jämnt                55368      1087      19.632      0.91x
Underläge            86706      1951      22.501      1.04x
```

**Tolkning:** Jämnt fördelat — spelläge påverkar inte utvisningsfrekvens.
Hypotes 1 (vinstprocent-bias) bekräftad. Ledning och underläge är symmetriska
(1.04x vardera). Jämnt läge ger 9% färre utvisningar/min — rimligt eftersom
jämnt läge ger mer försiktigt spel.

**Konsekvens för Sprint 25b:** `scorelineFoulMultiplier` bör vara nära 1.0
för alla lägen. Ingen stark spellägesbias att kalibrera mot.

---

## Sektion 1.2 — Utvisningar × period × spelläge (per 1000 min)

```
               0-29    30-59   60-89     90+
──────────────────────────────────────────────
Ledning       11.90   20.29   26.49  171.43
Jämnt         13.73   22.34   26.32  241.72
Underläge     13.14   19.80   27.03  146.43
```

**Tolkning:**
- Tydlig tidsbaserad eskalering: ~12 → ~27/kmin från tidig till sen match.
  Ackumulativ trötthets-/intensitetseffekt, ingen skarp Christoffer-brytpunkt vid 60.
- 90+ är kraftigt förhöjd (146–242/kmin) — övertidspressens extrema intensitet.
- Spelläge inom samma period: liten variation. Perioden är den dominerande faktorn,
  inte spelläget.
- Hypotes 2 (domare bedömer annorlunda från minut 60) får svagt stöd — gradvis
  ökning snarare än skarp brytpunkt.

**Konsekvens för Sprint 25b:** `SUSP_TIMING_BY_PERIOD` (redan i motor) är rätt
mekanism. Värden bör kalibreras mot dessa data.

---

## Sektion 1.3 — Straff × spelläge + periodfördelning

648 straffmål totalt (5.4% av mål). Estimerat 926 straffar (÷ 0.70 konvertering).

```
Per spelläge (per 1000 min):
───────────────────────────────
Ledning          274 straffmål     3.036/kmin
Jämnt            137 straffmål     2.393/kmin
Underläge        237 straffmål     2.626/kmin

Per period (15-min buckets):
────────────────────────────
0-14        8.8%  (57)
15-29      14.2%  (92)
30-44      14.4%  (93)
45-59      17.3%  (112)
60-74      15.6%  (101)
75-89      22.5%  (146)
90+         7.3%  (47)
```

**Tolkning:**
- Ledning ger flest straffar/min (3.04 vs 2.39–2.63) — defensiva lag i ledning
  begår flest straffpliktiga fouls.
- Jämnt ger lägst frekvens — stämmer INTE med "straff är chans-drivet" teorin.
- Stark spätkumulering: 75-89 svarar för 22.5% trots bara 15 minuter (1/6 av speltid).
  Korrektion: 22.5%/15 vs totalt 100%/90 = 1.35x normal frekvens i sista kvarten.
- Straff är ett annat fenomen än utvisningar (Sektion 1.1 visar jämn fördelning,
  1.3 visar ledningsövervikt) — bekräftar sprint 24-hypotesen.

**Konsekvens för Sprint 25c:** Separat straff-trigger med tidsbaserad
förstärkning (×1.35 sista 15 min). Ledningsläge ger marginellt fler chanser.

---

## Sektion 1.4 — Fouls + straff × fas × spelläge (per 1000 min)

### Utvisningar per fas:

```
               Grundserie    KVF      SF    Final
──────────────────────────────────────────────────
Ledning             22.54  17.60   22.00   27.20
Jämnt               19.59  16.92   20.64   16.23
Underläge           22.12  21.61   23.43   23.32
(n matcher)          1085     63      34      12
```

**Tolkning:** KVF (17.60–21.61/kmin) är lägre än grundserie (19.59–22.54) —
möjligen urvalsbias med n=63. Final (27.20/kmin vid ledning) är förhöjd men
n=12 är litet urval.

### Straff per fas:

```
               Grundserie    KVF      SF    Final
──────────────────────────────────────────────────
Ledning             3.04    2.66    2.52   3.89*
Jämnt               2.57    1.22    0.96     —*
Underläge           2.53    2.05    4.20   1.30*
(n straffmål)        553      26      18       4

* = indikativt, litet urval
```

**Tolkning:** SF-underläge (4.20/kmin) sticker ut — desperat press i semifinal
mot ledande lag genererar försvarsfouls. Men n=18 straffmål total i SF, så
cellerna är osäkra. Final har n=4 — ej tolkningsbart.

---

## Sektion 1.6 — Hemmafördel i slutspel per spelnummer

Baserat på 69 serier. Spel 1 = högre rankat lag hemma per definition.

```
                  Spel 1    Spel 2    Spel 3    Spel 4    Spel 5
──────────────────────────────────────────────────────────────────
KVF hemma%      68% (19)  33% (18)  83% (18)   38% (8)   80% (5)
SF hemma%       60% (10)  40% (10)   75% (8)   43% (7)  100% (3)
Final hemma%     50% (8)   50% (4)        —         —         —
```

**Tolkning:**
- Tydligt alterneringsmönster (68% → 33% → 83% → 38%) bekräftar att
  hemmaplansfördelen i seriens udda spel (1,3,5) = högre rankat lags hemma.
- KVF Spel 1: 68% → rankingsfördel dominerar, inte plansfaktor per se.
- SF Spel 1: 60% — lägre, rimligt (SF-lag är jämnare matchade).
- Final: 50%/50% på 8+4 matcher — ingen plansfaktor detekterbar i finalen.

**Konsekvens för Sprint 25d:** `homeAdvDelta` för slutspel behöver INTE
ökas globalt. Seedning är nyckeln. Befintlig `homeAdvantage: 0.14` räcker
om seedning är korrekt implementerad (högre rankat = hemma i spel 1).

---

## Jämförelse: stress-data vs bandygrytan

### Utvisningar (sektion F):

| Spelläge  | Motor (stress) | Bandygrytan | Diff   |
|-----------|---------------|-------------|--------|
| Ledning   | 2.98/kmin     | 22.5/kmin   | −19.5  |
| Jämnt     | 1.94/kmin     | 19.6/kmin   | −17.7  |
| Underläge | 2.45/kmin     | 22.5/kmin   | −20.1  |
| Snitt/match | 0.45        | 3.77        | −3.32  |

Gap 3 bekräftat. Spellägesfördelning internt korrekt (jämn), absolutnivå
~10x för låg. Problem: basfrekvens för foul-sekvenser, inte spellägesbias.

### Straff (sektion G):

| Spelläge  | Motor (stress) | Bandygrytan | Diff   |
|-----------|---------------|-------------|--------|
| Ledning   | 0.144/kmin    | 3.04/kmin   | −2.90  |
| Jämnt     | 0.138/kmin    | 2.57/kmin   | −2.43  |
| Underläge | 0.134/kmin    | 2.53/kmin   | −2.40  |
| % av mål  | 0.25%         | 5.4%        | −5.2pp |

Gap 5 bekräftat. Motor producerar 21× färre straffar än verkligheten.
Spellägesfördelning internt jämn (korrekt struktur, fel nivå).

---

## Implikationer för kommande sprinter

**Sprint 25b (utvisningsfrekvens):**
- Target: 3.77/match (nu 0.45)
- `scorelineFoulMultiplier` behöver INTE vara spellägesberoende (1.01–1.04 bandygrytan)
- Problemet är i `foulProb`-beräkningen eller `seqType === 'foul'`-fördelningen
- `SUSP_TIMING_BY_PERIOD` bör kalibreras mot 1.2: tidig 12/kmin → sen 27/kmin

**Sprint 25c (straff):**
- Target: 5.4% av mål (nu 0.25%)
- Separat straff-trigger med tidsbaserad förstärkning (×1.35 sista 15 min)
- Spellägesbias: ledning +20% vs jämnt/underläge (men liten effekt)
- Inte spellägesberoende i samma grad som frustrationsfouls

**Sprint 25d (fas-konstanter):**
- Fas-uppdelning i kalibreringsdatan korrekt (verifiering ✅)
- `homeAdvDelta` behöver INTE globalt ökas för slutspel — seedning är nyckeln
- Utvisningsfrekvens ökar marginellt i slutspel (+3.9%) — `suspMod` i PHASE_CONSTANTS
  kan kalibreras mot detta

---

*Fil uppdateras om bandygrytan_detailed.json utökas framöver.*
