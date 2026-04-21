# Bandygrytan Detailed Data — Schema v2

Dataformat för `bandygrytan_detailed.json`. Code-extraktionen ska producera denna fil.

## Filstruktur

```
bandygrytan_detailed.json
├── _meta           (källa, säsonger, antal matcher)
├── combined        (aggregat, samma som v1 men uppdaterat)
├── bySeason        (per-säsong-aggregat, samma struktur som v1)
├── calibrationTargets  (samma som v1)
└── matches[]       (NYTT — en rad per match)
```

## matches[] — obligatoriska fält per match

| Fält | Typ | Beskrivning |
|------|-----|-------------|
| `matchId` | string | Unikt ID från Bandygrytan |
| `season` | string | "2024-25" format |
| `round` | number | Omgångsnummer i serien (1-22 för grundserie) |
| `phase` | string | `regular` \| `quarterfinal` \| `semifinal` \| `final` |
| `date` | string | ISO-datum "2025-01-18" |
| `homeTeam` | string | Lagnamn |
| `awayTeam` | string | Lagnamn |
| `homeScore` | number | Slutresultat hemma |
| `awayScore` | number | Slutresultat borta |
| `halfTimeHome` | number\|null | Halvtidsställning hemma (null om ej tillgängligt) |
| `halfTimeAway` | number\|null | Halvtidsställning borta |

## matches[].goals[] — per mål

| Fält | Typ | Beskrivning |
|------|-----|-------------|
| `minute` | number | Minut (0-90+) |
| `team` | string | `home` \| `away` |
| `type` | string | `open` \| `corner` \| `penalty` \| `own_goal` |

Om måltyp inte går att avgöra → `open` som default.

## matches[].fouls[] — per utvisning

| Fält | Typ | Beskrivning |
|------|-----|-------------|
| `minute` | number | Minut |
| `team` | string | `home` \| `away` |
| `duration` | number\|null | 5 eller 10 minuter (null om okänt) |

## matches[].corners — hörnor per lag

| Fält | Typ | Beskrivning |
|------|-----|-------------|
| `home` | number\|null | Antal hörnor hemma |
| `away` | number\|null | Antal hörnor borta |

Hela corners-objektet kan vara `null` om data saknas.

## Valfria fält

| Fält | Typ | Beskrivning |
|------|-----|-------------|
| `attendance` | number\|null | Åskådarantal |
| `overtime` | boolean | Gick till förlängning |
| `penalties` | boolean | Avgjordes på straffar |

## Prioritering vid extraktion

1. **Måste ha:** matchId, season, round, phase, homeTeam, awayTeam, homeScore, awayScore, goals[].minute, goals[].team
2. **Viktigt:** halfTimeHome/Away, goals[].type, fouls[]
3. **Bonus:** corners, attendance, overtime/penalties

Om goal type inte går att skilja ut (corner vs open) — sätt allt till `open` och notera det i `_meta`. Vi kan fortfarande använda 90% av analyserna.

## Säsonger

Extrahera alla tillgängliga säsonger 2010-11 och framåt. Varje säsong bör ha ~130-210 matcher (grundserie + slutspel).

---

## Kval- och Allsvenskan-filer (tillägg 2026-04-21)

`bandygrytan_kval.json` och `bandygrytan_allsvenskan.json` använder samma schema som `matches[]` ovan, med dessa skillnader:

- `phase`: kval-filer har `"qualification"`, Allsvenskan-filer har `"regular"`
- `competitionName`: bevaras från Firebase (t.ex. "Bandyallsvenskan Herr", "Elitserien Herr Kval")
- `corners`: alltid `null` (ej extraherat från events)
- `fouls[].team`: alltid `null` (ej möjligt att bestämma team från event typ 3 utan extra kontextdata)
- `goals[].type`: **OtillföRlitlig** — parser-metod (hörn-event ≤2 min före mål → "corner") ger ~45% hörnmål vilket är för högt. Använd inte `cornerGoal%` från dessa filer.
- Firebase-matchstatus: gamla format = "signed", nya format (2023+) = "ended". Båda ingår.

### Täckning per fil

| Fil | Säsonger | Matcher | Begränsning |
|---|---|---|---|
| `bandygrytan_kval.json` | 2019-20 – 2022-23 | 38 | 2023-24 och 2024-25 ej i preCache |
| `bandygrytan_allsvenskan.json` | 2019-20 – 2023-24 + 2024-25 Övre | 887 | 2024-25: enbart Övre-grupp (28 matcher) |

### Firebase preCache — täckning per format

Äldre competition-IDs (numeriska, t.ex. 11831) har fixture-listor i `preCache/getCompetitionFixtures/{id}`.
Nyare competition-IDs (`fx_XXXXX`, säsong 2023+) kräver kombinerat format: `preCache/getCompetitionFixtures/fx_XXXXXXX` (utan suffix) eller full sub-competition-nyckel. Se `scripts/scrape-allsvenskan.mjs` för detaljer.
