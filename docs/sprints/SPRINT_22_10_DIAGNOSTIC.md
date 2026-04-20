# Sprint 22.10 — BUG-STRESS-04 Diagnostik

## Sammanfattning

Rotorsak identifierad. Fix-spec till Opus nedan.

---

## Symptom (recap)

Invariant `cupBracket` bryter: "Cup bracket active (completed=false) with 1 unresolved real 
matches but 0 scheduled cup fixtures @ round 3"

## Diagnostic data

### Cup-generering — konsekvent korrekt

Varje säsong genererar `generateCupFixtures` exakt 4 fixtures + 4 byes:

```
[CUP-GEN s2026] fixtures=4 real-matches=4 byes=4 ids=cup-r1-m0,cup-r1-m1,cup-r1-m2,cup-r1-m3
[CUP-SEASON-END s2027] newCupFixtures=4 bracket.completed=false
[CUP-MERGED s2027] cupInFixtures=4 totalFixtures=136
```

Inget fel i generering. `newFixtures` innehåller alltid 4 cup-fixtures vid säsongsstart.

**Hypotes 1** (generateCupFixtures returnerar tomt): FALSIFIERAD.

### Crash-dump: bug04-seed5-s10-cup.json

```json
{
  "season": 10,
  "round": 3,
  "cupBracket": {
    "season": 2035,
    "completed": false,
    "matchCount": 8,
    "matches": [
      { "id": "cup-r1-m0", "round": 1, "isBye": false, "winnerId": "club_gagnef" },
      { "id": "cup-r1-m1", "round": 1, "isBye": false, "winnerId": "club_slottsbron" },
      { "id": "cup-r1-m2", "round": 1, "isBye": false, "winnerId": "club_skutskar" },
      { "id": "cup-r1-m3", "round": 1, "isBye": false, "winnerId": null },
      ... (4 byes med winner satta)
    ]
  },
  "allCupFixtures": [
    { "id": "cup-r1-m0", "status": "completed", "matchday": 3 },
    { "id": "cup-r1-m1", "status": "completed", "matchday": 3 },
    { "id": "cup-r1-m2", "status": "completed", "matchday": 3 },
    { "id": "cup-r1-m3", "status": "postponed", "matchday": 3 }
  ]
}
```

## Rotorsak

**`cup-r1-m3` fick status `postponed` via väderavbokning.**

Kodstig: `matchSimProcessor.ts:198-203`:
```typescript
if (matchWeather.effects.cancelled) {
  const postponedFixture: Fixture = { ...fixture, status: FixtureStatus.Postponed }
  simulatedFixtures.push(postponedFixture)
  // ...
}
```

`generateMatchWeather` kan returnera `effects.cancelled = true`. När det händer för en cup-match:
- Fixturestatus sätts till `Postponed`
- `winnerId` i bracket förblir `null`
- Invarianten `checkCupBracket` räknar `Postponed` som varken `Scheduled` → ger 0 schemalagda cup-fixtures
- Bracketen markeras aldrig `completed` (en match utan winner stoppar progression)
- Nästa advance hittar inga `Scheduled` cup-fixtures → matchen spelas aldrig om

Ligamatcher klarar sig med `Postponed` eftersom de inte är knockout. Cup-matcher kräver en vinnare — en avbokad cup-match orphanar bracketen permanent.

**Hypotes 6** (invarianten för strikt): DELVIS SANT — men problemet är genuint. Invarianten är korrekt; cup-logiken hanterar inte avbokade matcher.

---

## Fix-spec (för Opus)

### Alt A: Skippa väderavbokning för cup-matcher (enklast)

I `matchSimProcessor.ts`, rad ~198:

```typescript
// Väderavbokning gäller INTE cup-matcher (knockout kräver vinnare)
if (matchWeather.effects.cancelled && !fixture.isCup) {
  const postponedFixture: Fixture = { ...fixture, status: FixtureStatus.Postponed }
  simulatedFixtures.push(postponedFixture)
  // ...inbox item...
  continue
}
```

Cup-matcher spelas alltid, oavsett väder. Realistiskt motiverat: cupfinaler hålls på neutral arena, semifinaler och kvartsfinaler prioriteras om av SBF.

**Konsekvens:** `cup-r1-m3` spelas alltid på matchday 3. Bracket progression garanteras.

### Alt B: Reschedule avbokad cup-match till nästa disponibel matchday

Mer korrekt men mer komplex. Inte rekommenderat för nu — Alt A löser buggen med minimal risk.

---

## Instrumentering — att ta bort

Tre platser:

1. `src/domain/services/cupService.ts` — `[CUP-GEN]` log-blocket
2. `src/application/useCases/seasonEndProcessor.ts` — `[CUP-SEASON-END]` + `[CUP-MERGED]` log-blocket
3. `scripts/stress-test.ts` — `process.env.STRESS_DEBUG = 'true'` + BUG-STRESS-04 cup-dump-blocket

---

## Förbättring

| Sprint | 10×10 completed | cupBracket crashes |
|---|---|---|
| 22.9 (bankruptcy) | 99/100 (99%) | 1 |
| 22.10 fix (prognos) | 100/100 (100%) | 0 |
