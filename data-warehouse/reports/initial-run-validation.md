# Data Warehouse — Valideringsrapport

**Datum:** 2026-05-14T00:02:16.171Z
**Engine version:** 1.1.0
**Mode:** FULL (1050 matcher)
**Resultat:** ALLA KONTROLLER PASSERADE

## Kontroller

| Kontroll | Status | Detaljer |
|----------|--------|----------|
| Total antal matcher | OK | 1050 matcher (förväntat: 1050) |
| Unika seeds | OK | 1050 unika av 1050 total |
| Bucket-distribution | OK | realistic: 600 (förväntat 600), varied: 250 (förväntat 250), edge: 100 (förväntat 100), control: 50 (förväntat 50), limits: 50 (förväntat 50) |
| Engine version konsistent | OK | Versioner i DB: 1.1.0 (aktuell: 1.1.0) |
| Period-summor stämmer med match-totaler | OK | Alla period-summor stämmer |
| Inga NULL i kritiska kolumner | OK | 0 rader med NULL-värden i kritiska kolumner |
| Mål per match | OK | 8.939 (mål 9.12 ±2, diff -0.181) |
| Hemmavinst-rate | OK | 45.810% (mål 50.2% ±10, diff -4.390) |
| Hörnor per match (rimligt band) | OK | 16.5 hörnor/match (förväntat: 5-40) |
| Reprodukbarhet (5 slumpmässiga matcher) | OK | 5/5 identiska resultat. 3ac8cba0: DB=2-1 Repro=2-1 OK | 1ce4a0db: DB=5-7 Repro=5-7 OK | ac7ce352: DB=2-3 Repro=2-3 OK | f970f17c: DB=6-2 Repro=6-2 OK | 4d3aa48c: DB=5-6 Repro=5-6 OK |

## Noteringar

- Period-shots och period-possession lagras inte (NULL) — deriveras inte från events.
- Expulsions är mappade från MatchEventType.RedCard (bandy-terminologi: utvisning, inte rött kort).
- Reproducibilitetskontrollen förutsätter identisk squad-generering med samma seed. Väderparametrar (windStrength, snowfall) rekonstrueras approximativt och kan skilja marginellt.
- Control och limits-buckets kör med homeAdvantage=0 (neutral plan) för att isolera taktikeffekter.
