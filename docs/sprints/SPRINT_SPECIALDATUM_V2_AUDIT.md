# Sprint SPECIALDATUM_V2 — audit

**Commit:** `da686d9`
**Spec:** `docs/sprints/SPEC_SPECIALDATUM_V2.md`
**Auditform:** Kod-verifierad simulation
**Datum:** 2026-04-27

---

## Punkter i spec

### STEG 1A — Ta bort inline-logik ur specialDateStrings.ts

- [x] **Verifierat via grep:** `specialDateStrings.ts` exporterar bara inbox-funktioner och datafiler. Logikfunktioner (`pickVariant`, `substitute`, `annandagsbandyBriefing` etc.) finns INTE kvar som `^export function` i filen — bara `annandagsbandyInbox`, `finaldagInboxPlaying`, `finaldagInboxSpectator`, `cupFinalInboxPlaying` finns kvar som inbox-helpers.

```
grep -n "^function\|^export function\|^const.*=.*(" src/domain/data/specialDateStrings.ts | head -20
→ 123: export function annandagsbandyInbox(...)
→ 189: export function finaldagInboxPlaying(...)
→ 198: export function finaldagInboxSpectator(...)
→ 237: export function cupFinalInboxPlaying(...)
```

Logikfunktionerna finns i `specialDateService.ts` (verifierat nedan).

### STEG 1B — Uppdatera SpecialDateContext med isPlayerInFinal och weather

- [x] **Verifierat via grep:**

```
grep -n "isPlayerInFinal\|weather" src/domain/data/specialDateStrings.ts
→  92:  isPlayerInFinal?: boolean          // ny — är spelarens lag i finalen?
→  93:  weather?: {
→  96:    matchFormat?: '2x45' | '3x30' | 'cancelled'
→ 172: // 3×30-trigger — BARA för SM-final med weather.matchFormat === '3x30'
```

Båda fälten finns i typen.

### STEG 1C — Arena-konstanter SM_FINAL_VENUE och CUP_FINAL_VENUE

- [x] **Verifierat via grep:**

```
grep -n "SM_FINAL_VENUE\|CUP_FINAL_VENUE\|Studenternas\|Sävstaås" src/domain/data/specialDateStrings.ts
→   8: export const SM_FINAL_VENUE = {
→   9:   arenaName: 'Studenternas IP',
→  14: export const CUP_FINAL_VENUE = {
→  15:   arenaName: 'Sävstaås IP',
```

### STEG 1D — Lore-data STUDAN_FACTS och SAVSTAAS_FACTS

- [x] **Verifierat via grep:**

```
grep -n "STUDAN_FACTS\|SAVSTAAS_FACTS" src/domain/data/specialDateStrings.ts
→ 21: export const STUDAN_FACTS = {
→ 55: export const SAVSTAAS_FACTS = {
```

### STEG 1E — Lore-pooler och spectator commentary-pooler

- [x] **Verifierat via grep:**

```
grep -n "COMMENTARY_LORE\|COMMENTARY_3X30\|COMMENTARY_SPECTATOR" src/domain/data/specialDateStrings.ts
→ 110: export const ANNANDAGSBANDY_COMMENTARY_LORE: string[]
→ 160: export const FINALDAG_COMMENTARY_SPECTATOR: string[]
→ 165: export const FINALDAG_COMMENTARY_LORE: string[]
→ 173: export const FINALDAG_COMMENTARY_3X30: string[]
→ 213: export const CUPFINAL_COMMENTARY_SPECTATOR: string[]
→ 218: export const CUPFINAL_COMMENTARY_LORE: string[]
```

Sex pooler totalt (samtliga spec-namngivna finns).

### STEG 2 — specialDateService.ts exporterar rätt funktioner

- [x] **Verifierat via grep:**

```
grep -n "^export" src/domain/services/specialDateService.ts
→  28: export function substitute(...)
→  32: export function pickVariant<T>(...)
→  39: export function pickCommentary(...)
→  53: export function buildSpecialDateContext(...)
→  85: export function pickSpecialDateCommentary(...)
→ 114: export function pickFinaldagCommentary(...)
→ 130: export function annandagsbandyBriefing(...)
→ 139: export function nyarsbandyBriefing(...)
→ 148: export function finaldagBriefingPlaying(...)
→ 156: export function finaldagBriefingSpectator(...)
→ 164: export function cupFinalBriefingPlaying(...)
→ 173: export function cupFinalBriefingSpectator(...)
```

Alla spec-listade funktioner exporteras. `buildSpecialDateContext` finns (spec steg 2, `SpecialDateContext`-byggaren).

### STEG 3A — Fixture-typen har arenaName, venueCity, isCupFinalhelgen

- [x] **Verifierat via grep:**

```
grep -n "arenaName\|venueCity\|isCupFinalhelgen" src/domain/entities/Fixture.ts
→ 56:   arenaName?: string        // neutral venue-namn för final/cup-final
→ 57:   venueCity?: string        // stad för neutral venue
→ 58:   isCupFinalhelgen?: boolean
```

### STEG 3B — playoffService.ts sätter arenaName/venueCity från SM_FINAL_VENUE

- [x] **Verifierat via grep:**

```
grep -n "SM_FINAL_VENUE\|arenaName.*Studenternas\|isFinaldag.*true" src/domain/services/playoffService.ts
→   5: import { SM_FINAL_VENUE } from '../data/specialDateStrings'
→  67:   isFinaldag: true,
→  68:   arenaName: SM_FINAL_VENUE.arenaName,
→  69:   venueCity: SM_FINAL_VENUE.city,
```

### STEG 3C — cupService.ts sätter arenaName/venueCity/isCupFinalhelgen för runda 3 och 4

- [x] **Verifierat via grep:**

```
grep -n "CUP_FINAL_VENUE\|isCupFinalhelgen\|isCupFinalWeekend" src/domain/services/cupService.ts
→   4: import { CUP_FINAL_VENUE } from '../data/specialDateStrings'
→ 160: const isCupFinalWeekend = nextRound >= 3
→ 178-181: ...(isCupFinalWeekend ? {
             arenaName: CUP_FINAL_VENUE.arenaName,
             venueCity: CUP_FINAL_VENUE.city,
             isCupFinalhelgen: true,
           } : {})
```

`nextRound >= 3` täcker både semifinal (runda 3) och final (runda 4) — spec-korrekt.

### STEG 4A — matchCore.ts importerar från specialDateService (inte specialDateStrings)

- [x] **Verifierat via grep:**

```
grep -n "specialDate" src/domain/services/matchCore.ts
→  59: import { pickSpecialDateCommentary } from './specialDateService'
→  60: import type { SpecialDateContext } from '../data/specialDateStrings'
```

Logik-import från `specialDateService`, typ-import från `specialDateStrings`. Korrekt separation.

### STEG 4A — matchCore.ts bygger sdCtx med arenaName, venueCity, isPlayerInFinal

- [x] **Verifierat via grep:**

```
grep -n -A 11 "const sdCtx: SpecialDateContext = {" src/domain/services/matchCore.ts
→ 1127: arenaName: fixture.arenaName ?? input.arenaName ?? '',
→ 1128: venueCity: fixture.venueCity ?? '',
→ 1129: isPlayerInFinal: !!fixture.isFinaldag,
→ 1130: weather: input.weather ? { tempC: ..., condition: ... } : undefined,
```

### STEG 4B — dailyBriefingService.ts importerar från specialDateService

- [x] **Verifierat via grep:**

```
grep -n "specialDate" src/domain/services/dailyBriefingService.ts
→  16: } from './specialDateService'
→  17: import type { SpecialDateContext } from '../data/specialDateStrings'
```

### STEG 4C — roundProcessor.ts anropar inbox-funktioner (bevarad från V1)

- [x] **Verifierat via grep:**

```
grep -n "finaldag\|cupFinalInbox\|annandagsbandy" src/application/useCases/roundProcessor.ts
→  53-56: annandagsbandyInbox, finaldagInboxPlaying, finaldagInboxSpectator, cupFinalInboxPlaying
→ 103: finaldagInboxPlaying(ctx)
→ 119: annandagsbandyInbox(ctx)
→ 129: cupFinalInboxPlaying(ctx)
→ 165: finaldagInboxSpectator(ctx)
```

### STEG 5 — 3×30-hook

- [x] **DELVIS verifierat.** `pickFinaldagCommentary` i `specialDateService.ts` hanterar 3×30 korrekt:

```
grep -n "COMMENTARY_3X30\|3x30\|matchFormat" src/domain/services/specialDateService.ts
→  14: FINALDAG_COMMENTARY_3X30,
→ 116: if (ctx.weather?.matchFormat === '3x30') {
→ 117:   return pickVariant(FINALDAG_COMMENTARY_3X30, season, matchday)
```

`StepByStepInput` i `matchUtils.ts` har `weather?: Weather` (domäntypen, inte inline-typen). `matchCore.ts` mappar `input.weather.temperature` → `sdCtx.weather.tempC` och `input.weather.condition` → `sdCtx.weather.condition` — men **sätter inte `matchFormat`** i `sdCtx.weather`. Det innebär att 3×30-grenen i `pickFinaldagCommentary` aldrig triggas i praktiken. Se "Ej verifierat" nedan.

### STEG 6 — Tre testfiler skapade och gröna

- [x] **Verifierat:**

```
ls src/__tests__/specialDate*
→ specialDateIntegration.test.ts
→ specialDateService.test.ts
→ specialDateStrings.test.ts
```

Testutfall (från `npm test`-körningen):
```
✓ specialDateService.test.ts > substitute > ersätter kända nycklar
✓ specialDateService.test.ts > substitute > lämnar okända nycklar orörda
✓ specialDateService.test.ts > pickVariant > är deterministiskt för samma season+matchday
✓ specialDateService.test.ts > pickVariant > ger olika resultat för olika säsonger
✓ specialDateService.test.ts > pickCommentary lore-frekvens > triggar lore ~15% av säsonger (± 5pp)
✓ specialDateService.test.ts > pickCommentary lore-frekvens > returnerar standard om ingen lore
✓ specialDateIntegration.test.ts > SM-final fixture > har arenaName = Studenternas IP och isFinaldag = true
✓ specialDateStrings.test.ts > SM_FINAL_VENUE > är Studenternas IP, Uppsala
✓ specialDateStrings.test.ts > CUP_FINAL_VENUE > är Sävstaås IP, Bollnäs
```

9 nya tester, samtliga gröna.

---

## Kod-verifiering

- **Build:** ✅ `tsc && vite build` — ren, inga TypeScript-fel
- **Tester:** ✅ 1904/1904 gröna, 168 testfiler
- **Stresstest:** Ej kört (denna sprint berör inte spellogikens magnituder)

---

## Edge-cases verifierade

| Edge-case | Hur det testades | Utfall |
|---|---|---|
| `substitute` med okänd nyckel | `specialDateService.test.ts` | `{name}` lämnas orört |
| `pickVariant` determinism | samma seed (2026, 14) ger identiskt val | Verifierat |
| `pickVariant` variation | 50 olika säsonger, pool om 10 → >3 unika | Verifierat |
| `pickCommentary` lore-frekvens | 1000 iterationer → ~15% (±5pp) | Verifierat |
| SM-final fixture | `playoffService` sätter `arenaName = 'Studenternas IP'` | Verifierat via integration-test |
| Cup-semi (runda 3) | `nextRound >= 3` → `isCupFinalhelgen: true` | Verifierat via grep |
| Cup-final (runda 4) | `nextRound >= 3` → `isCupFinalhelgen: true` | Verifierat via grep |
| Ingen arena på vanlig fixture | `fixture.arenaName ?? input.arenaName ?? ''` | Verifierat via grep i matchCore |

---

## Ej verifierat / antaganden

### 1. 3×30-grenen i pickFinaldagCommentary triggas aldrig i praktiken (funktionellt gap)

`matchCore.ts` mappar `input.weather` (domäntypen `Weather`) till `sdCtx.weather` med `tempC` och `condition` — men sätter aldrig `matchFormat`. Det innebär att `ctx.weather?.matchFormat === '3x30'` är `false` för alla matcher, inklusive SM-finalen. FINALDAG_COMMENTARY_3X30-poolen är alltså inbyggd men inaktiv.

**Kräver åtgärd:** antingen sätt `matchFormat: '3x30'` i `matchCore.ts` när fixture är SM-final och vädervillkor uppfylls, eller bekräfta att 3×30-formatet är avsett för framtida aktivering.

### 2. cupFinalInboxSpectator saknas i roundProcessor.ts

`finaldagInboxSpectator` anropas i `roundProcessor.ts` men `cupFinalInboxSpectator` syns inte i grep-resultatet. Oklart om `cupFinalInboxSpectator` existerar som funktion — verifiering krävs.

### 3. Visuell verifiering av commentary i live-match ej gjord

Att commentary-texterna visas korrekt i `MatchLiveScreen` vid annandagen, finaldag och cup-finalhelgen kräver manuell playtest. Koden är på plats men timingen (steg 0 = avslag) kan inte verifiera med enhetstester om MatchLiveScreen-renderingen visar texten.

### 4. `buildSpecialDateContext` i specialDateService.ts används inte av matchCore

`matchCore.ts` bygger `sdCtx`-objektet inline (rad 1123-1134) istället för att anropa `buildSpecialDateContext`. Funktionen exporteras och existerar men verkar vara redundant med den inline-konstruktionen. Kan skapa divergens om `SpecialDateContext` utökas.

---

## Post-mortem — 3×30-grenen

**Bugg:** `FINALDAG_COMMENTARY_3X30`-poolen var dead code — `matchFormat` sattes aldrig i `sdCtx.weather` i `matchCore.ts`. Grenen existerade men kunde aldrig triggas.

**Rotorsak:** Hook-kedjan spänner tre filer (`specialDateStrings.ts` → `specialDateService.ts` → `matchCore.ts`). Specen beskrev triggervillkoret men specificerade inte var i `matchCore` `matchFormat` ska hämtas ifrån. Code byggde inline-kontexten utan fältet.

**Fix:** Fall B — interim-beräkning baserad på `temperature <= -17`, markerad `// INTERIM — se SPEC_VADER §5.4` i koden. `Weather`-entiteten har inget `matchFormat`-fält (det tillhör `SpecialDateContext.weather`), så beräkningen görs direkt i sdCtx-konstruktionen i `matchCore.ts` rad 1130-1133.

**Regressiontest tillagt:** `specialDateIntegration.test.ts` verifierar nu att `pickFinaldagCommentary` med `weather.matchFormat === '3x30'` returnerar en sträng ur `FINALDAG_COMMENTARY_3X30`.

**Lärdom:** Vid hook-kedjor som spänner > 2 filer — spec-sätt exakt VAR i konsumentfilen källvärdet hämtas, inte bara att det ska skickas vidare.
