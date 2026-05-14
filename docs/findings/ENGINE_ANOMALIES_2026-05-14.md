# Engine Anomaly Audit — 2026-05-14

**Data:** `data-warehouse/matches.db`, 1050 matcher, engine 1.0.0  
**Filter:** `sampling_bucket = 'realistic'` (600 matcher) om inget annat anges  
**Analysverktyg:** Python 3 + sqlite3 (inget scipy)

---

## Fynd 1 — Corner strategy kopplar till frekvens men inte till konvertering

**Vad:** `cornerStrategy` ('aggressive' / 'standard' / 'safe') påverkar hur många hörnor ett lag
tjänar men har noll effekt på sannolikheten att en given hörna resulterar i mål. Spelaren
får en taktikdimension som ser ut att handla om konverteringskvalitet men i realiteten
bara styr frekvens.

**Bevis:**

```sql
-- Poolat home+away, realistic bucket
-- aggressive: 2704 hörnor, 271 hörnmål → 10.02%
-- standard:   4753 hörnor, 450 hörnmål →  9.47%
-- safe:        2396 hörnor, 222 hörnmål →  9.27%
```

| Strategi | Hörnor | Hörnmål | Konvertering |
|----------|--------|---------|--------------|
| aggressive | 2 704 | 271 | **10.02%** |
| standard | 4 753 | 450 | **9.47%** |
| safe | 2 396 | 222 | **9.27%** |

Ordning correct (aggressive > standard > safe), men effektstorleken är 0.75 procentenheter
(aggressive minus safe). Specgränsen för "systemet är kosmetiskt" är < 1 pp. Statistisk
test: z ≈ 0.9 (SE ≈ 0.83 pp), p > 0.3. Ej signifikant.

Hemmasidan visar dessutom omvänd ordning: safe (10.28%) > aggressive (10.00%) > standard (9.36%).

**Mekanismhypotes:**

`matchCore.ts:559` är det enda stället där `cornerStrategy` används:

```ts
if (tactic.cornerStrategy === 'aggressive') { wCorner += 3 }
```

Detta höjer vikten för `corner` i event-urvalslotteriet — fler hörnor genereras — men
`cornerInteractionService.resolveCorner()` tar inget `cornerStrategy`-argument. Funktionen
tar `deliveryQuality` (spelarattribut), `rushers`, `defenders`, `goalkeeper`, `opponentPenaltyKill`,
`isHome` och `supporterBoost`. Strategivalet speglas aldrig i per-hörna-chansen.

**Konfidens:** hög — koden bekräftar att parametern inte skickas vidare. Datamönstret är
konsekvent (n ≈ 2700 per strategipar). Motargument saknas.

**Nästa steg:** Antingen (a) koppla `cornerStrategy` till `resolveCorner()` så att aggressive
höjer `deliveryMod` eller reducerar `defenseStrength`, eller (b) ta ett medvetet designbeslut
att strategin *bara* styr frekvens och dokumentera det som D-fact.

---

## Fynd 2 — 3-minuters tidsdiskretisering skapar periodiskt mönster i inter-arrival

**Vad:** Alla matchhändelser genereras vid minuter där `minute % 3 ≠ 1`. Minuter 1, 4, 7,
10, 13 … är systematiskt tomma. Inter-arrival-fördelningen för mål har tydliga toppar vid
multiplar av 3 (3 min: 15.2%, 6 min: 9.3%, 9 min: 6.8%) — mer än dubbelt mot exponential-
förväntningen.

**Bevis:**

```sql
SELECT event_type, minute % 3 AS mod3, COUNT(*) as n
FROM match_events me JOIN matches m ON m.match_id = me.match_id
WHERE m.sampling_bucket = 'realistic'
GROUP BY event_type, minute % 3
ORDER BY event_type, mod3
```

Returnerar enbart `mod3 IN (0, 2)`. Ingen rad med mod3 = 1.

Inter-arrival distribution (n = 4 763):

| Minuter | Observerat | Exponential-förväntat (λ=1/8.57) | Ratio |
|---------|-----------|----------------------------------|-------|
| 1 min | 8.6% | 11.0% | 0.78 |
| 2 min | 8.7% | 9.8% | 0.89 |
| **3 min** | **15.2%** | **8.7%** | **1.75** ← topp |
| 4 min | 5.9% | 7.8% | 0.76 |
| 5 min | 5.8% | 6.9% | 0.84 |
| **6 min** | **9.3%** | **6.1%** | **1.52** ← topp |
| **9 min** | **6.8%** | **4.3%** | **1.58** ← topp |
| **12 min** | **4.3%** | **3.0%** | **1.43** ← topp |

CV (std/mean) = 0.908 — lätt underdispersion relativt exponential (Poisson-hypotesen
säger CV ≈ 1.0; verklig bandy förväntas ha CV > 1.2).

**Mekanismhypotes:**

`matchCore.ts:669`:

```ts
const minute = Math.round(step * 1.5)
```

Matchen körs i 60 steg (30 per halvlek). `step * 1.5` ger sekvensen:
0, 2, 3, 5, 6, 8, 9, 11, 12 … — alternerande +2, +1, +2, +1. Minuter där `minute % 3 = 1`
(1, 4, 7, 10 …) kan aldrig nås med heltal-steg. Två mål exakt 2 steg ifrån varandra ger alltid
3 minutsintervall, oavsett var i matchen de inträffar — därav toppen vid 3 min.

Konsekvens: En tredjedel av matchminuterna (de med mod3 = 1) saknar händelsedata. Inter-arrival-
toppar sammanfaller med step-gränserna.

**Konfidens:** hög — mekanismen är deterministisk och direkt verifierbar i koden. Datamönstret
är extremt tydligt (noll av 14 034 händelser vid mod3 = 1 i realistic-bucket).

**UX-konsekvens:** låg för spelaren (tidsstämplar i kommentarsvy syns vid valda steg). Hög för
kalibreringsanalys — inter-arrival-fördelningar och KS-test mot exponential är meningslösa utan
att korrigera för kvantiseringen.

**Nästa steg:** Om matchrealismen ska förbättras: addera ±0–1 minuters brus per händelse vid
skrivning till datalagret. Eller dokumentera kvantiseringen explicit i data-warehouse/README.md
som känd begränsning.

---

## Fynd 3 — Comeback-sannolikhet för hög vid −2 halvtidsdiff

**Vad:** Lag som leder med 2 mål i halvtid vinner bara 73.1% av matcherna (n = 52), mot
referensvärdet ~90% från verklig bandy. Avvikelsen på −16.9 pp överstiger specens tolerans
på ±10 pp. Oavgjort-frekvensen (17.3%) är troligen dubbelt mot verklig data.

**Bevis:**

```sql
SELECT mp.home_goals - mp.away_goals AS ht_diff, m.result_outcome, COUNT(*) AS n
FROM match_periods mp
JOIN matches m ON m.match_id = mp.match_id
WHERE mp.period = 1 AND m.sampling_bucket = 'realistic'
GROUP BY ht_diff, m.result_outcome
```

Korstabell (hemmaperspektiv, realistic, n = 600):

| HT diff | n | H-win% | Draw% | A-win% | Referens |
|---------|---|--------|-------|--------|---------|
| −3 el. sämre | 58 | 3.4% | 5.2% | 91.4% | — |
| **−2** | **52** | **9.6%** | **17.3%** | **73.1%** | AW ~90%, HW ~10% |
| −1 | 111 | 26.1% | 19.8% | 54.1% | — |
| 0 | 102 | 36.3% | 35.3% | 28.4% | — |
| +1 | 117 | 64.1% | 17.9% | 17.9% | — |
| **+2** | **71** | **77.5%** | **15.5%** | **7.0%** | HW ~80% ✓ |
| **+3** | **52** | **90.4%** | **7.7%** | **1.9%** | HW ~90% ✓ |

+2 och +3 stämmer (inom ±10 pp). −2 avviker: AW-rate 73.1% vs 90% = **−16.9 pp**.
Binomial 95% KI för 38/52 ≈ [60%, 85%] — 90% ligger utanför intervallet.
Oavgjort-frekvensen 17.3% (9/52) är troligen 2–3× verklighetens nivå (verklig bandy:
lag som leder 2–0 i halvtid oavgjort i < 5% av matcher).

**Mekanismhypotes:**

Motorns `cruise`-läge aktiveras när diff ≥ 1 och step > 45 (`matchCore.ts:215–216`). Det
dämpar anfallsfrekvensen hos det ledande laget — men enligt datan är dämpareffekten
otillräcklig i 2:a halvlek. Möjliga orsaker:

1. `cruise`-modifikatorn reducerar wAttack men inte wCorner — hörnor genererar mål utan att
   hämmas av `cruise`-läget.
2. Det eftersläpande lagets scoring-rate är densamma oavsett poängläge (motorns `trailing`-mod
   kan vara för hög relativt verklig bandy).
3. `SECOND_HALF_BOOST` (1.19) höjer 2:a halvleks målfrekvens generellt — kombinerat med att
   `cruise`-läget inte är tillräckligt starkt driver det ner ledningskonverteringen.

**Konfidens:** medel–hög. n = 52 ger ett tillförlitligt estimat (KI utesluter referensvärdet),
men referensvärdet 90% är en rund approximation. Verklig data från bandygrytan för exakt
detta scenario vore bekräftelse.

**Nästa steg:** Kör `scripts/calibrate.ts` med filter `half_time_diff = -2` och jämför
FT-utfallsfördelning. Granska `matchCore.ts` `cruise`-multiplier för wCorner och `trailing`-
modifikatorn. Kontrollera `SCORELINE_REFERENCE.md` för halvtidsstatus-specifika data.

---

## Fynd 4 — Överdispersion (VMR = 1.56): distribtionen är bredare än Poisson

**Vad:** Totalt målantal per match (realistic) har variansen-mot-medelvärde-ratio (VMR) = 1.56,
mot Poissonprocessens VMR = 1.0. Chi-square-test mot Poisson(9.12) ger χ² = 191 (df ≈ 12;
kritiskt värde p = 0.01: ≈ 26). Distribtionen är **överdisperserad** — inte underdisperserad
som hypotesen antog. Överdispersionen drivs primärt av vänstersvansen: 72 matcher (12%) har
0–4 mål mot Poisson-förväntat 31.

**Bevis:**

```sql
SELECT home_goals + away_goals AS total, COUNT(*) AS n
FROM matches WHERE sampling_bucket = 'realistic'
GROUP BY total ORDER BY total
```

| Total mål | Observerat | Förväntat Poisson(9.12) | O − E |
|-----------|-----------|------------------------|-------|
| 0 | 3 | 0.07 | +2.93 |
| 1 | 1 | 0.60 | +0.40 |
| 2 | **22** | 2.73 | **+19.27** |
| 3 | **20** | 8.30 | **+11.70** |
| 4 | **26** | 18.93 | **+7.07** |
| 5–12 | 405 | 447.5 | −42.5 |
| 13 | 40 | 31.84 | +8.16 |
| 14 | 12 | 20.74 | −8.74 |
| 15 | 16 | 12.61 | +3.39 |
| 16 | **19** | 7.19 | **+11.81** |
| 17 | **19** | 3.86 | **+15.14** |

Statistik: mean = 8.93, variance = 13.97, VMR = **1.56**, skewness = 0.16, excess kurtosis = −0.44.

CA-kvintilanalys visar att VMR är förhöjd även för nästan lika lag (Q1, |CA-diff| snitt 1.8: VMR = 1.73),
inte bara för missmatchade par. Överdispersionen är alltså inte CA-mismatch-driven.

```python
# Python
totals = [...]; mu = 8.93; var = 13.97
VMR = var / mu  # = 1.56
skew = sum((x-mu)**3 for x in totals) / (n * sd**3)   # = 0.16
```

**Mekanismhypotes:**

Motorn drar ett `MatchProfile` i början av varje match (`defensive_battle` / `standard` /
`open_game` / `chaotic` med vikter 0.80 / 1.00 / 1.25 / 1.45 relativt baseline).
Blandningsfördelningen av fyra profiler med skilda målrater skapar per konstruktion en
blandningsfördelning (mixture distribution) med mer varians än en ensam Poisson. Detta är
sannolikt intentionellt — `defensive_battle` är utformad att ge täta matcher med 3–6 mål,
`chaotic` att ge 12–17-matcher.

Overdispersionen vid vänstersvansen (2–4 mål: 70 obs vs 30 exp) pekar på att
`defensive_battle`-profilen antingen är för vanlig eller har för låg basrate. Högersvansen
(16–17 mål: 38 obs vs 11 exp) kan delvis förklaras av `MATCH_TOTAL_GOAL_CAP = 17`
(`matchCore.ts:21`) som samlar matcher som annars spridit sig till 18–20 i ett kluster vid taket.

**Konfidens:** medel. Chi-square-resultatet är robust, men den exakta källan till vänstersvansen
kräver profilerat stress-test med per-MatchProfile-statistik.

**Nästa steg:** Lägg till per-`matchProfile`-aggregering i `scripts/stress-test.ts`. Jämför
VMR per profil för att bekräfta att `defensive_battle` driver vänstersvansen. Kontrollera
vikterna i `PHASE_CONSTANTS` mot `docs/data/ANALYS_MATCHMONSTER.md`.

---

## Sammanfattning

| Analys | Status | Rapporteras |
|--------|--------|-------------|
| **A1** Distribtionsform (VMR, chi-square) | Överdispersion VMR=1.56 tydlig | ✓ Fynd 4 |
| **A2** P(slutresultat \| HT-diff) | −2 HT-bucket utanför tolerans | ✓ Fynd 3 |
| **A3** Inter-arrival times | CV=0.91 ≈ 1.0 (hypotesen bekräftad), 3-min-diskretisering påvisad | ✓ Fynd 2 |
| **A4** Hörnmål per cornerStrategy | 0.75 pp effekt, ej signifikant, strukturell disconnektion i kod | ✓ Fynd 1 |
| **A5** Väder × taktik i tail-events | Thaw 0% i top-5%-tail vs 11.8% baseline; overcast 3× överrepresenterat | Avvisad — n=38 för liten för robust slutsats om overcast-mekanismen. Thaw-mönstret är intuitivt korrekt men tillför inte ny motorinsikt utöver "väder kopplar till utfall" som redan är systemets design. |

**Avvisade fynd:**

- A5 (väder/tail): Chi-square = 22.97 (signifikant), men n = 38 top-tail ger breda konfidensintervall
  för enskilda väderklasser. Thaw-frånvaron är förväntat (design), overcast-övervikten saknar
  tydlig modulkoppling. Avvisa tills större dataset kan bekräfta.

**Prioriteringsordning för åtgärd:**

1. **Fynd 1** — Kodefel (disconnektion), hög konfidens, direkt åtgärdbar.
2. **Fynd 3** — UX-signifikant avvikelse, utanför toleransband.
3. **Fynd 2** — Dokumentera kvantisering; avgör om brus ska adderas.
4. **Fynd 4** — Kräver per-profil-data för att isolera källan; nästa stress-test-iteration.
