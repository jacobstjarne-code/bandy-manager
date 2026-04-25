# Sprint TS-1 — roundProcessor refactor (SKARP SPEC)

**Status:** KLAR ATT IMPLEMENTERAS
**Syfte:** Bryta roundProcessor.ts från 1305-raders monolit till pipeline med tydliga snitt
**Estimat:** 4-6h implementation + 2h stresstest-verifiering
**Baserad på:** `SPEC_ROUNDPROCESSOR_ANALYSIS.md` (Code, 2026-04-24)

---

## MÅL

1. Minska `advanceToNextEvent()` från 1305 → ~600 rader
2. Eliminera "isSecondPassForManagedMatch"-guard-risken (7 ställen idag → 0)
3. Flytta logik till processors där den hör hemma (inte skapa nya i onödan)
4. **Zero beteendeförändring** — stresstest ska vara bit-för-bit identiskt

---

## GRUNDPRINCIPER

**Föredrar utökning av befintlig processor framför ny fil.** Om logiken
hör hemma i `playerStateProcessor` — lägg den där. Skapa bara ny processor
när logiken är genuint självständig.

**En sanning, ett ställe.** Efter refactor ska varje typ av sidoeffekt
genereras från ETT ställe. Inga fall där notifikation A genereras i
processor X och notifikation A:s kontextkontroll sker inline i
roundProcessor.

**`isSecondPass`-guarden blir kontextparameter, inte per-processor-ternary.**
Detta stänger en klass av framtida regressioner (LESSONS.md §4 — "Klart
utan UI-verifiering missar luckor" applicerad på guards).

---

## IMPLEMENTATIONSSORDNING

Tre pass. Stresstest mellan varje pass. Varje pass ska vara en egen commit.

### PASS 1 — Låg risk, strukturella utbrytningar

Mål: Etablera `RoundContext` som första-klass-objekt. Inga logikflyttar,
bara utbrytningar av redan självständiga block.

**1A. Skapa `preRoundContextProcessor.ts`**

Ny fil: `src/application/useCases/processors/preRoundContextProcessor.ts`

Bryter ut steg 1-3 i pipelinen (rad ~117-181 i nuvarande roundProcessor).

```typescript
// src/application/useCases/processors/preRoundContextProcessor.ts

import type { SaveGame, Fixture } from '../../../domain/entities/...'
import { FixtureStatus, PlayoffStatus } from '../../../domain/enums'
import { handlePlayoffStart } from '../playoffTransition'
import { handleSeasonEnd } from '../seasonEndProcessor'
import type { AdvanceResult } from '../advanceTypes'

export interface RoundContext {
  nextMatchday: number
  scheduledFixtures: Fixture[]
  scheduledLeagueFixtures: Fixture[]
  roundFixtures: Fixture[]
  currentLeagueRound: number | null
  isCupRound: boolean
  isPlayoffRound: boolean
  isSecondPassForManagedMatch: boolean
  baseSeed: number
}

export type PreRoundResult =
  | { kind: 'proceed'; context: RoundContext }
  | { kind: 'earlyReturn'; result: AdvanceResult }

export function derivePreRoundContext(
  game: SaveGame,
  seed?: number,
): PreRoundResult {
  const scheduledFixtures = game.fixtures.filter(f => f.status === FixtureStatus.Scheduled)
  const scheduledLeagueFixtures = scheduledFixtures.filter(f => !f.isCup)

  // Season-end / playoff-start guard
  if (scheduledLeagueFixtures.length === 0) {
    if (!game.playoffBracket) {
      return { kind: 'earlyReturn', result: handlePlayoffStart(game, seed) }
    }
    if (game.playoffBracket.status === PlayoffStatus.Completed) {
      const pendingCup = scheduledFixtures.filter(f => f.isCup)
      if (pendingCup.length === 0) {
        return { kind: 'earlyReturn', result: handleSeasonEnd(game, seed) }
      }
      // Cup still running — proceed to simulate
    } else {
      return { kind: 'earlyReturn', result: handleSeasonEnd(game, seed) }
    }
  }

  const nextMatchday = Math.min(...scheduledFixtures.map(f => f.matchday))

  // Diagnostic logging preserved
  if (typeof window !== 'undefined') {
    console.log('[ADVANCE] nextMatchday:', nextMatchday, /* ... */)
  }

  const roundFixtures = game.fixtures.filter(f =>
    f.matchday === nextMatchday &&
    (f.status === FixtureStatus.Scheduled || f.status === FixtureStatus.Completed)
  )

  const isCupRound = roundFixtures.some(f => f.isCup)
  const isPlayoffRound = !isCupRound && game.playoffBracket !== null && nextMatchday > 26
  const currentLeagueRound = roundFixtures.find(f => !f.isCup && f.roundNumber <= 22)?.roundNumber ?? null

  // Second-pass detection (original logic preserved verbatim)
  let aiCount = 0, aiCompletedCount = 0, hasManagedScheduled = false
  for (const f of roundFixtures) {
    const isManaged = f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId
    if (isManaged) {
      if (f.status === FixtureStatus.Scheduled) hasManagedScheduled = true
    } else {
      aiCount++
      if (f.status === FixtureStatus.Completed) aiCompletedCount++
    }
  }
  const isSecondPassForManagedMatch = aiCount > 0 && aiCompletedCount === aiCount && hasManagedScheduled

  const baseSeed = seed ?? (nextMatchday * 1000 + game.currentSeason * 7)

  return {
    kind: 'proceed',
    context: {
      nextMatchday,
      scheduledFixtures,
      scheduledLeagueFixtures,
      roundFixtures,
      currentLeagueRound,
      isCupRound,
      isPlayoffRound,
      isSecondPassForManagedMatch,
      baseSeed,
    },
  }
}
```

**Tester:** `preRoundContextProcessor.test.ts` — minst:
- Returnerar `earlyReturn` när inga liga-fixtures kvar och ingen bracket
- Returnerar `earlyReturn` med season-end när bracket completed och inga cup-fixtures
- Returnerar `proceed` med `isSecondPass: true` när alla AI-matcher klara men managed scheduled
- Returnerar `proceed` med korrekt `currentLeagueRound` / `isCupRound` / `isPlayoffRound`

---

**1B. Skapa `applyPostRoundFlags.ts`**

Ny fil: `src/application/useCases/processors/postRoundFlagsProcessor.ts`

Bryter ut steg 48-51 (halvtidssummering, onboarding, konkurscheck,
formations-rekommendation — rad ~1235-1302).

```typescript
// src/application/useCases/processors/postRoundFlagsProcessor.ts

import type { SaveGame, InboxItem, Fixture } from '...'
import { PendingScreen, InboxItemType } from '...'
import { evaluateFinanceStatus } from '../../../domain/services/economyService'
import { getRecommendedFormation } from '../../../domain/entities/Formation'

export interface PostRoundFlagsInput {
  game: SaveGame
  justCompletedManagedFixture: Fixture | undefined
  nextMatchday: number
}

export interface PostRoundFlagsResult {
  updatedGame: SaveGame
}

export function applyPostRoundFlags(
  input: PostRoundFlagsInput,
): PostRoundFlagsResult {
  let updatedGame = input.game

  // 1. Halvtidssummering-trigger
  // 2. Onboarding-steg
  // 3. Konkurscheck (bankruptcy)
  // 4. Formations-rekommendation

  // (All logic moved verbatim from roundProcessor rad 1235-1302)

  return { updatedGame }
}
```

**Viktigt:** Auto-advance playoff (rad 1224-1233) stannar i roundProcessor
eftersom den anropar `advanceToNextEvent` rekursivt och måste ske FÖRE
dessa flags körs.

**Tester:** Minst ett test per flag-typ.

---

**1C. Uppdatera `advanceToNextEvent()` att använda 1A + 1B**

Roundprocessor-toppen blir:

```typescript
export function advanceToNextEvent(game: SaveGame, seed?: number): AdvanceResult {
  const preRound = derivePreRoundContext(game, seed)
  if (preRound.kind === 'earlyReturn') return preRound.result
  const ctx = preRound.context

  // ... resten av pipelinen använder ctx.nextMatchday, ctx.isSecondPassForManagedMatch, etc
```

Och slutet:

```typescript
  // Auto-advance playoff (stannar inline — rekursivt anrop)
  if (isPlayoffRound && updatedBracket !== null && ...) {
    if (!managedHasMorePlayoffFixtures) {
      return advanceToNextEvent(updatedGame, (seed ?? baseSeed) + 1)
    }
  }

  // Post-round flags
  const flagsResult = applyPostRoundFlags({
    game: updatedGame,
    justCompletedManagedFixture,
    nextMatchday: ctx.nextMatchday,
  })
  updatedGame = flagsResult.updatedGame

  return { game: updatedGame, ... }
}
```

**Commit:** `refactor: bryt ut preRoundContext + postRoundFlags (pass 1/3)`

**Verifiering före commit:**
- `npm run build && npm test` — alla gröna
- `npm run stress` (10 seeds) — bit-för-bit identiskt mot pre-refactor

---

### PASS 2 — Medel risk, logikflyttar till befintliga processors

Mål: Flytta logik dit den hör hemma. Inga nya filer — bara utökning av
`playerStateProcessor`, `transferProcessor`, `narrativeProcessor`,
`eventProcessor`.

**2A. Captain morale cascade → `playerStateProcessor.ts`**

Flytta rad 281-303 (captain morale cascade) in i `playerStateProcessor`.

Ändring av `playerStateProcessor`s signatur:
```typescript
export interface PlayerStateResult {
  updatedPlayers: Player[]
  newlyInjured: { player: Player; days: number }[]
  newlySuspended: { player: Player }[]
  captainCrisisMoment: Moment | null  // NY
}
```

Logiken körs sist i processor (efter state-updates men innan return).
Om `captainCrisisMoment` returneras — roundProcessor pushar till
`newMoments`.

**2B. Transfer execution-loopen → `transferProcessor.ts`**

Flytta rad 813-925 (transfer-exekvering med nemesis, mecenat cost-share,
sponsor-reaktioner, transfer story moments) till ny exporterad funktion
i `transferProcessor`:

```typescript
// transferProcessor.ts

export interface TransferExecutionInput {
  game: SaveGame
  preEventGame: SaveGame
  players: Player[]
  clubs: Club[]
  resolvedBids: TransferBid[]
  prevBids: TransferBid[]
  nemesisTracker: Record<string, NemesisEntry>
  nextMatchday: number
}

export interface TransferExecutionResult {
  players: Player[]
  clubs: Club[]
  nemesisTracker: Record<string, NemesisEntry>
  sponsorNetworkMoodDelta: number
  moments: Moment[]
}

export function executeAcceptedTransfers(
  input: TransferExecutionInput,
): TransferExecutionResult
```

**Viktigt:** Mecenat cost-share-logiken behöver tillgång till
`game.mecenater` och payment-effekter på `clubs`. Skicka `game` men
muterar INTE — returnerar uppdaterade `clubs`.

**2C. Derby-notification → `narrativeProcessor.ts`**

Flytta rad 544-591 (derby notification + opponent pre-match quote för
nästa omgång) till `narrativeProcessor`. Blir del av samma output som
övriga narrativa notifikationer.

**Obs:** Detta kräver att `narrativeProcessor` får tillgång till
`finalAllFixtures` (efter bracket/cup-merge). Signatur utökas:

```typescript
export interface NarrativeInput {
  game: SaveGame
  justCompletedManagedFixture: Fixture | null
  finalAllFixtures: Fixture[]  // NY
  nextMatchday: number
  newDate: string
  rand: () => number
}
```

Alternativt: dela upp i två anrop — `processNarrative` (förblir som nu)
och `processUpcomingDerbyNotification(finalAllFixtures, game)` som separat
export från samma fil. **Code väljer vilken som är renast efter att ha
läst koden.**

**2D. Mecenat-spawn → `eventProcessor.ts`**

Flytta rad 960-989 (mecenat-spawn-logik) till `eventProcessor`. Den hör
hemma där — mecenat-spawn är en GameEvent-trigger.

`eventProcessor` returnerar redan `updatedMecenater` och `gameEvents` —
utökningen passar direkt.

**Commit:** `refactor: flytta logik till rätt processors (pass 2/3)`

**Verifiering före commit:**
- `npm run build && npm test` — alla gröna
- `npm run stress` (10 seeds) — bit-för-bit identiskt

---

### PASS 3 — isSecondPass-guard som kontextparameter

Mål: Eliminera per-processor-ternary för `isSecondPassForManagedMatch`.

**Nuvarande mönster (sju ställen):**
```typescript
const trainingResult = isSecondPassForManagedMatch
  ? { /* dummy */ }
  : applyRoundTraining(...)
```

**Nytt mönster — processor tar själv beslutet:**
```typescript
const trainingResult = applyRoundTraining(game, baseSeed, leagueRound, {
  skipSideEffects: ctx.isSecondPassForManagedMatch,
})
```

Varje berörd processor får en `options?: { skipSideEffects?: boolean }`-parameter.
Om `skipSideEffects` true: returnera neutral output (inga inbox-items,
ingen player-state-förändring, ingen finance-ändring).

**Berörda processors (enligt analysen, §6):**
1. `applyRoundTraining`
2. `processEconomy`
3. `processSponsors`
4. `checkContextualSponsors` (service, inte processor — behöver också option)
5. `applyOneTimeKommunstod` (service)
6. Mecenat-spawn (nu i `eventProcessor` efter pass 2)
7. `processMedia`

**Varje processor lägger till i början:**
```typescript
export function processEconomy(input: EconomyInput, options?: { skipSideEffects?: boolean }) {
  if (options?.skipSideEffects) {
    return { roundFinanceLog: [], updatedClubs: input.game.clubs }
  }
  // ... existing logic
}
```

**Fördel:** Om någon lägger till en ny processor senare och glömmer
`skipSideEffects`-hanteringen — testerna fångar det (skriv ett test som
verifierar att ALLA side-effect-processors honorerar flaggan).

**Commit:** `refactor: isSecondPass som processor-option (pass 3/3)`

**Verifiering före commit:**
- `npm run build && npm test`
- `npm run stress` — identiskt
- **Bonus-test:** `roundProcessor.secondPass.test.ts` som verifierar att
  en second-pass-run genererar NOLL nya finance-entries, inbox-items eller
  mecenat-events.

---

## STEG SOM FORTSÄTTER INLINE (stannar i roundProcessor)

Enligt analysen §5 "Svårast att bryta ut":

1. **SaveGame-assembleringen (rad 1024-1131)** — funktionens kärna,
   107 rader spread-literal. Kan inte extraheras meningsfullt.
2. **Auto-advance playoff (rad 1224-1233)** — rekursivt anrop. Måste
   stanna i funktionen.
3. **Chemistry stats + applyRoundDevelopment (rad 305-360)** — tätt
   kopplat till managed fixture + player state, 57 rader. Sparas för
   framtida sprint om behovet växer.
4. **Regen-spelare (rad 796-811)** — enligt analysen §3E kan flyttas till
   `matchSimProcessor`, men det ökar risken i denna refactor. **Sparas
   för pass 4 om Jacob vill ha mer.**
5. **Ripple-merge (rad 1016-1022)** — enda anropet, wrappar `mergeRippleDeltas`.
   Inte värt egen processor.
6. **Follow-ups + arc-processning + pre-generate weather** — stannar inline,
   wrappade i block som de är idag.

---

## FÖRVÄNTAT RESULTAT

| | Före | Efter |
|-|------|-------|
| `roundProcessor.ts` | 1305 rader | ~600 rader |
| Antal processors | 15 | 17 (pre, postFlags) + utökade (playerState, transfer, narrative, event) |
| `isSecondPass`-ternaries | 7 | 0 |
| Antal filer med side-effect-logik för samma typ | 3-4 | 1 |

---

## TEST-STRATEGI

### Nya tester att skriva

1. `preRoundContextProcessor.test.ts` — 5-6 tester (proceed / earlyReturn-varianter)
2. `postRoundFlagsProcessor.test.ts` — 4 tester (halftime, onboarding, bankruptcy, formation-rec)
3. `transferProcessor.executeAcceptedTransfers.test.ts` — 4 tester
   (basic execution, nemesis, mecenat cost-share, sponsor reaction)
4. `roundProcessor.secondPass.test.ts` (integrationstest) — verifierar att
   second-pass inte producerar dubbla sidoeffekter

### Stresstest-regression

Efter varje pass:
```bash
npm run stress  # 10 seeds, identiskt utfall krävs
```

Om något diverar — det är en regression, inte en förbättring. Rollback
och fundera ut varför.

**Utfall att verifiera:**
- Slutpoäng per klubb efter 22 omgångar
- Finance per klubb
- communityStanding
- Inbox-count per klubb
- Alla spelares career stats

### Befintliga tester

Alla befintliga tester ska fortsätta passera. Om något test behöver
justeras — flagga till Jacob innan ändring. "Gröna tester" är
valideringsmekanism för beteendebevarande.

---

## COMMIT-KONVENTION

En commit per pass. Format:

```
refactor: [kort beskrivning] (pass N/3)

Rot: roundProcessor.ts är 1305 rader med blandat ansvar; [det här passet]
extraherar [X, Y, Z] till [A, B, C] för [vilket problem det löser].

Stresstest: 10 seeds, bit-för-bit identiskt utfall.
```

---

## OM NÅGOT KÄNNS OKLART

Code får INTE gissa eller "förbättra" utöver vad specen säger. Om en
signatur inte passar, om en processor redan har intern logik som krockar,
om något block är mer komplext än analysen antydde — **stanna och rapportera**
innan ändring. Opus justerar specen.

Ingen sprint utan `SPRINT_TS1_AUDIT.md` efter varje pass (enligt CLAUDE.md).
