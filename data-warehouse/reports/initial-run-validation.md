# Data Warehouse — Valideringsrapport

**Datum:** 2026-04-27T11:32:28.601Z
**Engine version:** 1.0.0
**Mode:** FULL (1050 matcher)
**Resultat:** ALLA KONTROLLER PASSERADE

## Kontroller

| Kontroll | Status | Detaljer |
|----------|--------|----------|
| Total antal matcher | OK | 1050 matcher (förväntat: 1050) |
| Unika seeds | OK | 1050 unika av 1050 total |
| Bucket-distribution | OK | realistic: 600 (förväntat 600), varied: 250 (förväntat 250), edge: 100 (förväntat 100), control: 50 (förväntat 50), limits: 50 (förväntat 50) |
| Engine version konsistent | OK | Versioner i DB: 1.0.0 (aktuell: 1.0.0) |
| Period-summor stämmer med match-totaler | OK | Alla period-summor stämmer |
| Inga NULL i kritiska kolumner | OK | 0 rader med NULL-värden i kritiska kolumner |
| Mål per match | OK | 9.058 (mål 9.12 ±2, diff -0.062) |
| Hemmavinst-rate | OK | 45.524% (mål 50.2% ±10, diff -4.676) |
| Hörnor per match (rimligt band) | OK | 16.5 hörnor/match (förväntat: 5-40) |
| Reprodukbarhet (5 slumpmässiga matcher) | OK | 5/5 identiska resultat. a6538fcf: DB=5-1 Repro=5-1 OK | 3cd930fc: DB=6-3 Repro=6-3 OK | 7f5db3cd: DB=3-7 Repro=3-7 OK | 8e71b5f9: DB=2-6 Repro=2-6 OK | aad4c367: DB=5-4 Repro=5-4 OK |

## Noteringar

- Period-shots och period-possession lagras inte (NULL) — deriveras inte från events.
- Expulsions är mappade från MatchEventType.RedCard (bandy-terminologi: utvisning, inte rött kort).
- Reproducibilitetskontrollen förutsätter identisk squad-generering med samma seed. Väderparametrar (windStrength, snowfall) rekonstrueras approximativt och kan skilja marginellt.
- Control och limits-buckets kör med homeAdvantage=0 (neutral plan) för att isolera taktikeffekter.
