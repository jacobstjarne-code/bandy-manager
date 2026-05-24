# Data Warehouse — Valideringsrapport

**Datum:** 2026-05-14T07:30:54.591Z
**Engine version:** 1.2.0
**Mode:** FULL (1050 matcher)
**Resultat:** NÅGRA KONTROLLER FAILADE

## Kontroller

| Kontroll | Status | Detaljer |
|----------|--------|----------|
| Total antal matcher | OK | 1050 matcher (förväntat: 1050) |
| Unika seeds | OK | 1050 unika av 1050 total |
| Bucket-distribution | OK | realistic: 600 (förväntat 600), varied: 250 (förväntat 250), edge: 100 (förväntat 100), control: 50 (förväntat 50), limits: 50 (förväntat 50) |
| Engine version konsistent | OK | Versioner i DB: 1.2.0 (aktuell: 1.2.0) |
| Period-summor stämmer med match-totaler | OK | Alla period-summor stämmer |
| Inga NULL i kritiska kolumner | OK | 0 rader med NULL-värden i kritiska kolumner |
| Mål per match | OK | 9.152 (mål 9.12 ±2, diff +0.032) |
| Hemmavinst-rate | OK | 47.238% (mål 50.2% ±10, diff -2.962) |
| Hörnor per match (rimligt band) | OK | 16.6 hörnor/match (förväntat: 5-40) |
| VMR (realistisk bucket) | FAIL | VMR=1.692 (band 1.20–1.45) |
| −2 HT-bucket AW% | FAIL | 78.6% (n=56, band 83–95%) |
| CornerStrategy spridning (agg−safe) | OK | 7.22 pp (agg 22.87%, safe 15.65%, krav ≥ 2 pp) |
| Reprodukbarhet (5 slumpmässiga matcher) | OK | 5/5 identiska resultat. 4f0cf6d3: DB=7-8 Repro=7-8 OK | 4667d78e: DB=2-0 Repro=2-0 OK | 06ad9378: DB=2-8 Repro=2-8 OK | 83314bfd: DB=3-0 Repro=3-0 OK | 22f3099b: DB=6-4 Repro=6-4 OK |

## Noteringar

- Period-shots och period-possession lagras inte (NULL) — deriveras inte från events.
- Expulsions är mappade från MatchEventType.RedCard (bandy-terminologi: utvisning, inte rött kort).
- Reproducibilitetskontrollen förutsätter identisk squad-generering med samma seed. Väderparametrar (windStrength, snowfall) rekonstrueras approximativt och kan skilja marginellt.
- Control och limits-buckets kör med homeAdvantage=0 (neutral plan) för att isolera taktikeffekter.
