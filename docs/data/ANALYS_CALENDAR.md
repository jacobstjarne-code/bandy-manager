# A6 — Kalendereffekter

**Analys:** ANALYSSPEC A6. **Utförare:** Code. Fable skriver finding.

## Metod

Per-lag-schema ur `date` (100% täckning). Vilodagar = dagar sedan lagets förra match samma säsong. Juluppehåll = årsskiftesgapet (dec→jan, ≥7 dgr). Säsongsfas = datum-terciler per säsong (round är None för äldre säsonger). Wilson-CI på andelar. 2023-24 saknas.

## Vilodagar → resultat (herr, per-lag-match)

| Vilodagar | Poäng/match | Mål för | Mål mot | Vinst% | n |
|---|---|---|---|---|---|
| ≤3 | 1.02 | 4.47 | 4.42 | 45.8% | 1390 |
| 4-6 | 1.0 | 4.75 | 4.68 | 44.5% | 822 |
| 7-13 | 0.93 | 4.35 | 4.66 | 40.7% | 300 |
| 14+ | 1.08 | 4.3 | 4.51 | 48.6% | 37 |

När ett lag har ≥3 dagars vilo-övertag vinner det mer utvilade laget **45.7%** av de avgjorda matcherna (CI 37.7–54.0, n=140). 50% = ingen vilofördel.

## Juluppehåll (herr) — sista match före årsskiftet vs första efter

Elitseriens årsskiftesgap är oftast kort. Stratifierat på uppehållslängd; rost-effekt väntas främst efter längre uppehåll.

| Uppehåll | Mål/match före → efter | Poäng/match före → efter | n |
|---|---|---|---|
| kort (3-6 dgr) (median 5 dgr) | 4.69 → 4.8 | 1.09 → 1.11 | 64 |
| långt (≥7 dgr) (median 7 dgr) | 4.5 → 3.45 | 0.9 → 0.65 | 20 |
| alla (≥3 dgr) (median 6 dgr) | 4.64 → 4.48 | 1.05 → 1.0 | 84 |

## Säsongsfas — datum-terciler (herr)

| Fas | Mål/match | Utvisningar/match | Hemmavinst% | n |
|---|---|---|---|---|
| tidig | 8.89 | 3.9 | 47.6% (CI 43.0–52.3) | 439 |
| mitt | 8.94 | 3.63 | 51.5% (CI 46.8–56.1) | 439 |
| sen | 9.4 | 3.8 | 53.5% (CI 48.8–58.1) | 443 |

## Månad — höst vs vinter (herr, Q004)

| Månad | Mål/match | Hemmavinst% | n |
|---|---|---|---|
| jan | 8.95 | 51.4% | 282 |
| feb | 9.59 | 54.4% | 252 |
| mar | 8.75 | 54.6% | 119 |
| 4 | 9.0 | 100.0% | 1 |
| okt | 9.5 | 51.4% | 70 |
| nov | 8.98 | 46.7% | 289 |
| dec | 8.9 | 49.7% | 308 |

## Frågor i questions-trädet

- **Q004** (höst vs vinter-variation): besvaras av månadstabellen + säsongsfas-terciler ovan.
- **Q167** (matchens tidpunkt i seriespelet): besvaras av säsongsfas-terciler (mål/utvisningar/hemmafördel per fas).
- **Q174** (säsongsperiod tidig/mitt/sen): besvaras direkt av datum-tercilerna.
Fable: bedöm om de kan stängas eller markeras delvis besvarade utifrån effektstorlekarna.

## Begränsningar

- Vilodagar samvarierar med schemaläggning (topplag kan ha annat schema); observationellt, ej kausalt.
- Långa viloperioder (14+) domineras av juluppehållet — överlappar den analysen.
- Säsongsfas via datum-terciler, inte round (round None för äldre säsonger).
- 2023-24 saknas i datan.
