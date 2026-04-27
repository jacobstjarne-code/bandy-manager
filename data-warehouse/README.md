# Bandy Manager Data Warehouse

SQLite-databas med 1050 simulerade bandymatcher för analys och kalibrering av matchmotorn.

## Struktur

```
data-warehouse/
├── matches.db              — SQLite-databas (1050 matcher, ~5 MB per körning)
├── README.md               — denna fil
└── reports/
    └── initial-run-validation.md  — senaste valideringsrapport
```

Generatorskript och schema ligger i `scripts/data-warehouse/`.

## Schema

### matches

En rad per match. Alla taktiska fält och väderfält är normaliserade till egna kolumner för direkt SQL-analys.

| Kolumn | Typ | Beskrivning |
|--------|-----|-------------|
| match_id | TEXT | UUID, primärnyckel |
| engine_version | TEXT | Motorversion (från `ENGINE_VERSION` i matchCore.ts) |
| seed | INTEGER | Slumpfrö — används för reproducerbarhet |
| run_timestamp | TEXT | ISO-8601, när matchen genererades |
| sampling_bucket | TEXT | `realistic` / `varied` / `edge` / `control` / `limits` |
| home_team_id / away_team_id | TEXT | Syntetiska team-ID:n |
| home_ca / away_ca | INTEGER | Genomsnittlig `currentAbility` 0–100 per lag |
| home_formation / away_formation | TEXT | En av sex formationer |
| home_mentality … home_pp_strategy | TEXT | 8 taktiska dimensioner, hemmalag |
| away_mentality … away_pp_strategy | TEXT | 8 taktiska dimensioner, bortalag |
| weather_condition | TEXT | `clear` / `overcast` / `lightSnow` / `heavySnow` / `fog` / `thaw` (NULL = inget väder) |
| weather_temperature | INTEGER | Grader Celsius (NULL om inget väder) |
| weather_ice_quality | TEXT | `excellent` / `good` / `moderate` / `poor` (NULL om inget väder) |
| home_goals / away_goals | INTEGER | Slutresultat |
| home_corners / away_corners | INTEGER | Hörnsparkar totalt |
| home_shots / away_shots | INTEGER | Skott totalt |
| home_on_target / away_on_target | INTEGER | Skott på mål |
| home_penalties / away_penalties | INTEGER | Straffar tilldelade |
| home_expulsions / away_expulsions | INTEGER | Utvisningar (mappade från `MatchEventType.RedCard` — terminologin i koden är arvssynd från fotboll, datalagret använder bandy-korrekt term) |
| home_possession / away_possession | REAL | Bollinnehav 0–100 (estimat från skottkvot) |
| result_outcome | TEXT | `home_win` / `draw` / `away_win` |

### match_periods

Två rader per match (period 1 och 2). Stats deriveras från events i generate.ts — shots och possession per halvlek lagras inte (motorn exponerar inte det).

Sanity check i validate.ts: `SUM(period goals) MUST = matches.(home|away)_goals`.

### match_events

En rad per signifikant händelse (mål, hörna, utvisning, straff, räddning, byte).

`is_corner_goal` och `is_penalty_goal` är 0/1 (SQLite boolean). `score_home_at_event` och `score_away_at_event` är poängläget vid händelsen.

## Sampling-strategi

1050 matcher fördelade på fem buckets:

| Bucket | Antal | Syfte |
|--------|-------|-------|
| **realistic** | 600 | CA draget ur triangulär fördelning (min 50, max 92, mode 70). Formationer viktat: 50% 5-3-2, 30% 4-3-3, 20% 3-3-4. En av fyra taktikprofiler per lag. |
| **varied** | 250 | Full slump: CA 40–95, alla 6 formationer, alla 8 taktikdimensioner varieras oberoende. Explorerar hela parametrummet. |
| **edge** | 100 | 4 extremmönster × 25 matcher: stark hemma/svag borta, svag hemma/stark borta, lika CA med maximal taktikkontrast, båda attackerande. |
| **control** | 50 | Lika CA (70), neutral plan (homeAdvantage=0), neutralt väder. Varierar en taktikdimension i taget — isolerar effekter. |
| **limits** | 50 | Lika CA, neutral plan. Systematiska kontrastpar för dimensioner som auditrapporten flaggade som svåra att särskilja: press, hörnstrategi, bredd, passningsrisk. |

### Taktikprofiler (realistic-bucket)

| Profil | Mentality | Tempo | Press | Övrigt |
|--------|-----------|-------|-------|--------|
| defensive | defensive | low | low | narrow, wings, safe corner |
| balanced | balanced | normal | medium | normal, mixed, standard corner |
| pressing | offensive | high | high | normal, mixed, standard corner |
| attacking | offensive | high | medium | wide, central, aggressive corner |

## Köra generate.ts

```bash
# Pilot — 50 matcher (proportionellt urval)
npm run warehouse:generate -- --pilot

# Full körning — 1050 matcher
npm run warehouse:generate

# Kör mot tom DB (tar bort gammal fil först)
rm data-warehouse/matches.db && npm run warehouse:generate
```

Kräver ingen env-var. DB skapas automatiskt om den inte finns. Schema appliceras via `IF NOT EXISTS`-guards — kör generate.ts flera gånger appenderar inte dubbletter men ersätter inte heller existerande data.

## Köra validate.ts

```bash
# Pilot-validering
npm run warehouse:validate -- --pilot

# Full validering
npm run warehouse:validate
```

Exit code 0 om alla kontroller passerar, 1 annars. Rapport skrivs till `data-warehouse/reports/initial-run-validation.md`.

## Kända begränsningar

- **Syntetiska lag** — spelare genereras med uniform CA och standardattribut. Inga riktiga klubbprofiler, inga positionsviktade attributes. CA-variansen per spelare är ±5 kring lagets CA.
- **Frekvensbaserad motor** — matchEngine är en frekvens-/sannolikhetsbaserad simulator, inte en positionsbaserad. Mönster i datan speglar motorns statistiska egenskaper, inte taktisk geometri.
- **Period-shots/possession** är NULL — motorn exponerar inte per-halvlek-data för dessa mått.
- **Expulsions** är mappade från `MatchEventType.RedCard`. I bandy är det utvisning (10 min), inte rött kort — koden använder fel terminologi (arvssynd). Kolumnen i datalagret är korrekt namngiven `expulsions`.
- **Hemmavinst-rate** i full körning: 45.5% (target 50.2%). Avvikelsen beror på att control/limits-buckets kör med `homeAdvantage=0` (neutral plan), vilket trycke ned det övergripande snittet. Filtrera på `sampling_bucket = 'realistic'` för en mer representativ hemmavinst-rate.
- **Reproducerbarhet** — reproducibilitetskontrollen i validate.ts rekonstruerar väder approximativt (windStrength/snowfall deriveras från condition, inte exakta lagrade värden). Kontrollens 5/5 träff bekräftar att kärnresultaten är deterministiska givet seed och CA.
