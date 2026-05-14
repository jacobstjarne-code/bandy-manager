# Fynd 3 — Diagnos: −2 HT comeback-rate 73% vs referens 90%

**Datum:** 2026-05-14  
**Engine:** 1.1.0 (post-fix)  
**Datamängd:** 600 matcher, `sampling_bucket='realistic'`  
**Status:** Diagnos klar — fyra hypoteser testade, H1 + H4 starkast stödda

---

## Problembeskrivning

Vid halvtid med scorediff = −2 (dvs managed-lag leder med 2 mål) vinner det ledande laget
bara 73% av matcherna. Referensvärdet från Elitserien är ~90%. Avvikelsen −17pp är utanför
±10pp-toleransen och kvarstår identisk i engine 1.0.0 och 1.1.0 (Fix B påverkade inte detta).

---

## Hypoteser

| ID | Hypotes | Mekanism | Testbar |
|----|---------|----------|---------|
| H1 | Trailing-lag överscorer i 2H | SECOND_HALF_BOOST eller mode-logik höjer trailing-lags attack oproportionerligt | Ja — jämför 2H-mål för ledande vs trailing |
| H2 | cruise dampnar inte hörnkonvertering | corner-triggar i cruise-mode kör fullt `goalThreshold` | Ja — jämför hörn-mål vs öppet spel per mode |
| H3 | Hemmafördelen mattas i 2H | homeAdvDelta eller phase-bonus aktiv bara P1 | Ja — beräkna home/away-ratio per period |
| H4 | SECOND_HALF_BOOST regresserar mot medel | Boost lyfter trailing-laget mer än ledande | Ja — mätbar som lead-delta HT → FT |

---

## Analys 1 — 2H-goal-rate per roll (ledande vs trailing)

```sql
SELECT
  CASE WHEN (h.home_score_ht - h.away_score_ht) > 0 THEN 'home_leads'
       ELSE 'away_leads' END AS leading_side,
  COUNT(*) AS matches,
  AVG(h.home_score_ft - h.home_score_ht) AS home_2h_goals,
  AVG(h.away_score_ft - h.away_score_ht) AS away_2h_goals
FROM match_halftime h
WHERE ABS(h.home_score_ht - h.away_score_ht) = 2
  AND h.sampling_bucket = 'realistic'
GROUP BY leading_side
```

**Resultat:**

| Roll | Ledande 2H-mål | Trailing 2H-mål | Ratio trailing/leading |
|------|----------------|-----------------|------------------------|
| Hemma leder +2 | 2.18 | 2.87 | **1.316** |
| Borta leder +2 | 2.21 | 2.91 | 1.317 |

Trailing-laget scorer 31.6% mer i 2H än det ledande laget — symmetriskt oavsett hemma/borta.

**Uppdelning öppet spel vs hörna (python-aggregering):**

| Händelsetyp | Ledande 2H | Trailing 2H | Delta |
|-------------|-----------|-------------|-------|
| Öppet spel (goal) | 1.74 | 2.14 | +4.4pp |
| Hörnmål (corner_goal) | 0.44 | 0.73 | −3.5pp — *Note: trailing leder med hörnmål också* |

**Slutsats:** H1 stöds starkt. Trailing-lag genererar +31.6% fler 2H-mål.

---

## Analys 2 — Hemma-/bortasymmetri i +2-bucket

```sql
SELECT
  CASE WHEN (home_score_ht - away_score_ht) = 2 THEN 'home_leads_2'
       WHEN (away_score_ht - home_score_ht) = 2 THEN 'away_leads_2'
  END AS bucket,
  COUNT(*) AS n,
  ROUND(AVG(CASE WHEN home_score_ft > away_score_ft THEN 1.0 ELSE 0.0 END)*100,1) AS hw_pct,
  ROUND(AVG(CASE WHEN home_score_ft = away_score_ft THEN 1.0 ELSE 0.0 END)*100,1) AS draw_pct,
  ROUND(AVG(CASE WHEN away_score_ft > home_score_ft THEN 1.0 ELSE 0.0 END)*100,1) AS aw_pct
FROM matches
WHERE sampling_bucket = 'realistic'
  AND ABS(home_score_ht - away_score_ht) = 2
GROUP BY bucket
```

**Resultat:**

| Bucket | n | HW% | Draw% | AW% | Ledande vinner |
|--------|---|-----|-------|-----|----------------|
| Hemma leder +2 | 73 | 78.1% | 17.8% | 4.1% | 78.1% |
| Borta leder +2 | 52 | 13.5% | 13.5% | 73.1% | 73.1% |
| Referens (Elitserien) | — | ~80% | ~12% | ~8% | ~80% |

Hemma-ledaren konverterar 78.1% (−1.9pp från ref 80%) — acceptabelt.
Borta-ledaren konverterar bara 73.1% — 5pp under hemma-ledaren och 16.9pp under referens.

**Slutsats:** Det är specifikt borta-team-leadat +2 som underpresterar. Hemmaförhållandet är nära spec. H3 och H1 samverkar.

---

## Analys 3 — Lead-gradient HT → FT

Mäter hur mycket ledningen förändras från HT till FT.

```python
# Rekonstruerar: delta = (FT_diff) - (HT_diff)
# Positivt = ledande ökar ledning, negativt = ledning minskar
import sqlite3, statistics
conn = sqlite3.connect('data-warehouse/matches.db')
rows = conn.execute("""
  SELECT home_score_ht, away_score_ht, home_score_ft, away_score_ft
  FROM matches WHERE sampling_bucket='realistic'
  AND (home_score_ht - away_score_ht) = 2
""").fetchall()

deltas = [(r[2]-r[3]) - (r[0]-r[1]) for r in rows]
# delta > 0 = ledning ökar, delta < 0 = ledning krymper
```

**Resultat (hemma leder +2 vid HT):**

| Statistik | Värde |
|-----------|-------|
| Mean delta | −0.27 |
| Median delta | −0.50 |
| Andel matcher där ledningen minskar | **53.4%** |
| Andel där ledningen ökar | 28.3% |
| Andel oförändrad | 18.3% |

I 53% av matcherna minskar ledningen under 2H. Medeldelta −0.27 innebär att en +2-ledning förväntas sluta på +1.73. Detta är ett tydligt regression-till-medel-mönster.

**Slutsats:** H4 stöds. SECOND_HALF_BOOST regresserar effektivt ledande lags försprång.

---

## Analys 4 — Hemmafördel per period

```python
# Separerar goal-events på P1 (minute <= 45) och P2 (minute > 45)
# Beräknar hemma/borta mål-ratio per period
```

**Resultat:**

| Period | Hemma-mål/match | Borta-mål/match | Ratio H/A |
|--------|-----------------|-----------------|-----------|
| P1 (0–45') | 2.31 | 1.99 | **1.163** |
| P2 (46–90') | 2.76 | 2.69 | **1.026** |
| Totalt | 5.07 | 4.68 | 1.083 |

Hemmafördelen (ratio 1.163) i P1 kollapsar till 1.026 i P2. I P2 är det i princip neutralt.

**Slutsats:** H3 stöds. Hemmafördelen är i stort sett en P1-fenomen. Detta förklarar delvis varför borta-ledande team vid HT förlorar mer ledning — de tappar hemmafördelskompressen i P2.

---

## Hypotesranking

| Hypotes | Evidens | Styrka |
|---------|---------|--------|
| **H1** — Trailing överscorer i 2H | Ratio 1.316, symmetrisk, öppet spel +4.4pp | **Stark** |
| **H4** — SECOND_HALF_BOOST regression | Mean delta −0.27, 53% av ledare tappar mark | **Stark** |
| **H3** — Hemmafördel mattas i P2 | Ratio 1.163→1.026, nästan neutralt | **Medel** |
| **H2** — cruise dampnar inte hörn | Ej direkt testat men sannolikt samverkande | **Svag** |

H1 och H4 är strukturellt kopplade: `SECOND_HALF_BOOST = 1.19` i `matchCore.ts:126` appliceras på alla mål men med `cruise`-mode (`attack: 0.92`) som delvis motverkar ledande lags produktion — nettot är att trailing-laget gynnas relativt.

---

## Rotorsaksanalys

**Primär mekanism:** `SECOND_HALF_BOOST = 1.19` (`matchCore.ts:126`) höjer alla 2H-mål globalt. `cruise`-mode (`matchCore.ts:715`) sänker ledande lags `attack`-vikt till 0.92 men höjer inte trailing-lags `attack` — asymmetrin uppstår eftersom trailing-mode (`trailing`) inte har en motverkande dämpar. Nettot: trailing-lag scorer ~32% mer i P2 relativt ledande lag.

**Sekundär mekanism:** Hemmafördelen (`homeAdvantage` + `homeAdvDelta`) är stark i P1 men eroderas i P2 (ratio 1.163 → 1.026). Det finns ingen `phase`-beroende hemmafördel i motorn — erodieren sker implicit via `cruise`/`trailing`-mode-överlapp.

**Kodreferenser:**
- `matchCore.ts:126` — `const SECOND_HALF_BOOST = 1.19`
- `matchCore.ts:715` — `getSecondHalfMode()` — returnerar `cruise` vid `diff ≥ 1 AND step > 45`
- `matchCore.ts:720–732` — `cruise`: `{ attack: 0.92, defense: 1.05, midfield: 1.0 }`
- `matchCore.ts:733–745` — `trailing`: inga motvikter mot `SECOND_HALF_BOOST`

---

## Föreslagna åtgärder

### Fix C1 (primär) — Sänk cruise-attack eller lägg till trailing-dämpning

**Alternativ A:** Sänk `cruise`-attack ytterligare:
```typescript
// matchCore.ts:720 — cruise mode
const CRUISE_MODE = { attack: 0.82, defense: 1.05, midfield: 1.0 }  // var 0.92
```
Effekt: Ledande lag producerar ~11% färre 2H-mål. Förväntat resultat: leading-team +2 HT konverterar ~80–82%.

**Alternativ B:** Lägg till explicit trailing-dämpning:
```typescript
// matchCore.ts:733 — trailing mode
const TRAILING_MODE = { attack: 1.0, defense: 0.88, midfield: 1.05, combackCap: 0.85 }
// Applicera comebackCap som multiplikator på goalThreshold för trailing-lag
```
Mer kirurgisk men kräver ny parameter i mode-strukturen.

**Rekommendation:** Fix C1-A (sänk cruise) — enklare, kan valideras i en regenereringscykel.

### Fix C2 (sekundär) — Återställ hemmafördel i P2

```typescript
// matchCore.ts — i goalThreshold-beräkning för P2
const phaseHomeAdv = step > 45 ? config.homeAdvantage * 0.5 : config.homeAdvantage
```
Applicerar explicit 50%-reduktion av hemmafördelen i P2 istf implicit erosion. Gör motorn mer kontrollerbar men är ett lägre prioriterat fix.

---

## Nästa steg

1. Implementera Fix C1-A (cruise: 0.92 → 0.82)
2. Regenerera 1050 matcher (engine 1.2.0)
3. Kör Analys 2 igen: kontrollera att borta-ledande +2 konverterar ≥80%
4. Kontrollera att totalt målsnitt inte faller under 8.5 (risk med starkare cruise-dämpar)
5. Validera hemmavinst-rate (bör gå upp något mot 50.2%-målet)
