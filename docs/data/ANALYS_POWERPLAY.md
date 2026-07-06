# A2 — Powerplay-konvertering

**Analys:** ANALYSSPEC_VAG2_OEXPLOATERAT.md A2. **Utförare:** Code. Fable skriver finding (061).

Rigorös extension av 059-underlaget: konvertering per duration, reformjämförelse, shorthanded-mål, överlappshantering.

## Metod

`fouls[].team` är det **utvisade** laget (DATA.md §4); motståndaren spelar i överläge. Per match byggs en per-minut boxräkning per lag → numerärt övertag. Utvisningar med duration 5/10 (schemaVersion 5, 100% täckning); anomalier (grovt matchstraff `60`, enstaka `30/3/6`, `null`) exkluderas ur PP-fönstren och redovisas separat. Rate ratio med log-baserat Poisson-CI; konvertering per utvisning med Wilson-CI. Ren 5v4 = utvisade laget har exakt 1 i box och motståndaren 0 under hela fönstret; överlapp (5v3) särredovisas. Reform: pre-reform (2019-25, 2023-24 saknas) poolad mot 2025-26, Cohen's h + Bonferroni.

## Herr (1321 matcher, 11719 mål ≤90 min)

**Rate ratio, en man mer vs even strength:** 1.332× (95% CI 1.265–1.403). PP 6.445 %/lag-min mot ES 4.838 %/lag-min.
**Två man mer (5v3):** 1.812× (CI 1.58–2.077, n=210 mål på 2396 lag-minuter).

**Konvertering per utvisning (ren 5v4 — minst ett mål under fönstret):**

| Duration | Rena utv. | Gav mål | Konvertering | 95% CI | Mål/utv. | Överlapp (5v3) |
|---|---|---|---|---|---|---|
| 5 min | 226 | 66 | 29.2 % | [23.7–35.4] | 0.314 | 169 (51 gav mål) |
| 10 min | 2348 | 934 | 39.8 % | [37.8–41.8] | 0.496 | 2233 (1013 gav mål) |

**Shorthanded-mål:** 1111 (9.48 % av alla mål) — mål av det numerärt underlägsna laget.

**Anomalier exkluderade ur PP-fönster:** {'3': 1, '30': 1, '6': 1, '60': 4, 'None': 4} (`60`=grovt matchstraff, `null`=ej extraherad duration).

**Per säsong** (rate ratio, ren konvertering, 5-min-andel av utvisningar):

| Säsong | Rate ratio | Konvertering (ren) | 5-min-andel | Utv. totalt |
|---|---|---|---|---|
| 2019-20 | 1.231× | 34.5 % (n=391) | 2.0 % | 811 |
| 2020-21 | 1.291× | 39.5 % (n=418) | 2.6 % | 862 |
| 2021-22 | 1.391× | 38.8 % (n=551) | 2.4 % | 1007 |
| 2022-23 | 1.416× | 36.5 % (n=406) | 6.9 % | 677 |
| 2024-25 | 1.457× | 43.0 % (n=335) | 15.2 % | 702 |
| 2025-26 | 1.42× | 41.0 % (n=473) | 19.5 % | 917 |

**Reform 2025-26 vs pre-reform (poolad):**

- **5-min-andel:** 5.3 % → 19.5 % (Cohen's h = 0.45). Reformsignalen — fler lätta utvisningar.
- **Konvertering (ren 5v4):** 38.4 % (n=2101) → 41.0 % (n=473), Cohen's h = 0.054.

## Dam (428 matcher, 3763 mål ≤90 min)

**Rate ratio, en man mer vs even strength:** 1.314× (95% CI 1.2–1.438). PP 6.407 %/lag-min mot ES 4.876 %/lag-min.
**Två man mer (5v3):** 1.652× (CI 1.317–2.071, n=77 mål på 956 lag-minuter).

**Konvertering per utvisning (ren 5v4 — minst ett mål under fönstret):**

| Duration | Rena utv. | Gav mål | Konvertering | 95% CI | Mål/utv. | Överlapp (5v3) |
|---|---|---|---|---|---|---|
| 5 min | 64 | 17 | 26.6 % | [17.3–38.5] | 0.344 | 45 (6 gav mål) |
| 10 min | 723 | 283 | 39.1 % | [35.7–42.7] | 0.549 | 728 (315 gav mål) |

**Shorthanded-mål:** 316 (8.4 % av alla mål) — mål av det numerärt underlägsna laget.

**Anomalier exkluderade ur PP-fönster:** {} (`60`=grovt matchstraff, `null`=ej extraherad duration).

**Per säsong** (rate ratio, ren konvertering, 5-min-andel av utvisningar):

| Säsong | Rate ratio | Konvertering (ren) | 5-min-andel | Utv. totalt |
|---|---|---|---|---|
| 2019-20 | 1.257× | 31.9 % (n=113) | 1.8 % | 221 |
| 2020-21 | 1.298× | 36.6 % (n=145) | 1.5 % | 324 |
| 2021-22 | 1.196× | 37.7 % (n=159) | 2.2 % | 318 |
| 2022-23 | 1.455× | 42.5 % (n=134) | 12.6 % | 254 |
| 2024-25 | 1.482× | 45.3 % (n=117) | 11.6 % | 207 |
| 2025-26 | 1.416× | 34.5 % (n=119) | 15.7 % | 236 |

**Reform 2025-26 vs pre-reform (poolad):**

- **5-min-andel:** 5.4 % → 15.7 % (Cohen's h = 0.343). Reformsignalen — fler lätta utvisningar.
- **Konvertering (ren 5v4):** 38.8 % (n=668) → 34.5 % (n=119), Cohen's h = -0.09.

## Begränsningar

- Utvisningslängden antas löpa fullt ut; bryts en utvisning tidigt (mål mot i vissa regelvarianter) överskattas PP-minuterna något.
- Ren 5v4 kräver att motståndaren har 0 i box hela fönstret; sekvenser med utvisningar på båda håll hamnar i överlapp-kolumnen, inte i ren konvertering.
- Alla faser inkluderade (grundserie + slutspel). Reformsplit på season-fältet.
- 2023-24 saknas i datasetet — pre-reform-poolen är 2019-20…2022-23 + 2024-25.
- Rate ratio är en försiktig skattning: shorthanded-mål räknas inte som PP-mål, vilket trycker ihop skillnaden marginellt.

## Öppna Q-nummer som berörs

Underlag till varje Q i `docs/findings/facts/questions/` som rör utvisningars måleffekt och reformens 25/26-genomslag. Kompletterar findings 052/055/057/059 med per-duration-konvertering och reform-kvantifiering.
