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
