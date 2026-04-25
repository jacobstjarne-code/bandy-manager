# Sprint TS-1 — roundProcessor refactor (UTKAST-SPEC)

**Status:** SPEC-UTKAST — skrivet av Opus utan Code's analys än
**Syfte:** Bryta roundProcessor från ~800 raders monolit till pipeline med tydliga snitt
**Estimat:** 4-6h implementation + 2h test-iteration

**VIKTIGT:** Denna spec är ett utkast skrivet parallellt med Code's
analys (`SPEC_ROUNDPROCESSOR_ANALYSIS.md`). När analysen är klar ska
utkastet justeras mot faktiska fynd, inte tvärtom. Om Code hittar
dependencies eller komplexitet jag missat — Code har rätt.

---

## KONTEXT

`src/application/useCases/roundProcessor.ts` är ~800 rader och utför 50+ steg
per advance(). ~15 processors är redan extraherade till `/processors`-mappen
(trainingProcessor, matchSimProcessor, playerStateProcessor, etc.).

**Problem:** Trots extraktionerna finns fortfarande massor av inline-logik
som muterar SaveGame-state och blandar ansvar. Swept-under-rug komplexitet.
Hög regressionsrisk vid ändringar.

**Mål:** Bryt ut 4-5 ytterligare processors med tydliga input/output-kontrakt.
Inga beteendeförändringar — detta är en ren refactor.

---

## NUVARANDE PIPELINE (Opus analys)

Grova steg i roundProcessor.ts, i ordning:

1. **Matchday detection** — beräkna `nextMatchday`, `roundFixtures`, season/playoff trigger
2. **Pass-2 detection** — `isSecondPassForManagedMatch` för att undvika dubbla sidoeffekter
3. **Context derivation** — `currentLeagueRound`, `isCupRound`, `isPlayoffRound`
4. **Training** → `trainingProcessor` (extraherad)
5. **Match sim** → `matchSimProcessor` (extraherad)
6. **Standings** → `calculateStandings` (service)
7. **Player state** → `playerStateProcessor` (extraherad)
8. **Match stats** → `statsProcessor` (extraherad)
9. **INLINE: Captain morale cascade** (WEAK-006)
10. **INLINE: Chemistry stats + development** (chemistry-stats pair tracking + applyRoundDevelopment)
11. **INLINE: Match result notifications** (inbox)
12. **INLINE: Injury/suspension/recovery notifications + star injury ripple**
13. **INLINE: Board milestone messages** (round 7, 14, 22)
14. **Scouts** → `scoutProcessor` (extraherad)
15. **INLINE: Date update**
16. **INLINE: Derby win ripple**
17. **Narrative** → `narrativeProcessor` (extraherad)
18. **Playoff** → `playoffProcessor` (extraherad)
19. **Cup** → `cupProcessor` (extraherad)
20. **INLINE: Derby notification for upcoming match + opponent quote**
21. **INLINE: Market value update**
22. **INLINE: Player availability + trainer arc**
23. **INLINE: Board objectives check-in**
24. **INLINE: Market value change inbox**
25. **Economy** → `economyProcessor` (extraherad)
26. **Transfer bids** → `transferProcessor` (extraherad)
27. **Events** → `eventProcessor` (extraherad)
28. **Youth** → `youthProcessor` (extraherad)
29. **Loans** → `transferProcessor.processLoans` (extraherad)
30. **INLINE: Academy reputation delta**
31. **Media** → `mediaProcessor` (extraherad)
32. **INLINE: Data trimming** (inbox/training/weathers/bids)
33. **INLINE: Fixture stripping for storage**
34. **Sponsors** → `sponsorProcessor` (extraherad)
35. **INLINE: Contextual sponsors + kommunstöd**
36. **INLINE: Regen player persistence**
37. **INLINE: Transfer execution loop** — `executeTransfer` + nemesis + mecenat cost-share + sponsor reactions
38. **Community** → `communityProcessor` (extraherad)
39. **INLINE: CS mean reversion**
40. **INLINE: Facility/kommunstöd bonus**
41. **INLINE: Mecenat spawn**
42. **INLINE: Away trip generation**
43. **INLINE: Ripple merge** (via `mergeRippleDeltas`)
44. **INLINE: Massive updatedGame assembly** (~100 rader objekt-literal)
45. **INLINE: Market value notifications append**
46. **INLINE: Arc processing** (detectArcTriggers, progressArcs)
47. **INLINE: Pending follow-ups**
48. **INLINE: Pre-generate weather for next matchday**
49. **INLINE: Auto-advance playoff**
50. **INLINE: HalfTime trigger**
51. **INLINE: Onboarding step**
52. **INLINE: Bankruptcy check**
53. **INLINE: Recommendation change inbox**
54. **Return**

---

## FÖRESLAGEN UPPDELNING — 5 nya processors

### 1. `matchdayContextProcessor` (låg risk)

**Ansvar:** All inledande detection (steg 1-3 ovan). Returnera en tydlig
kontext som resten av pipelinen konsumerar.

**Signatur:**
```typescript
export interface MatchdayContext {
  nextMatchday: number
  scheduledFixtures: Fixture[]
  roundFixtures: Fixture[]
  currentLeagueRound: number | null
  isCupRound: boolean
  isPlayoffRound: boolean
  isSecondPassForManagedMatch: boolean
  seasonEndTrigger: AdvanceResult | null  // returneras direkt om triggad
}

export function deriveMatchdayContext(
  game: SaveGame,
  seed?: number,
): MatchdayContext
```

**Risk:** Låg. Ren kontext-härledning utan sidoeffekter. Rak utbrytning.

---

### 2. `notificationProcessor` (medel risk)

**Ansvar:** All inline inbox-generering spridd över roundProcessor:
- Match result notifications (steg 11)
- Injury/suspension/recovery (steg 12)
- Board milestone messages (steg 13)
- Derby notification for upcoming + opponent quote (steg 20)
- Market value change (steg 24)
- Finance warning + recommendation change (steg 52-53)

**Obs:** De är utspridda för att de beror på *tidigare* pipeline-steg.
Lösning: en processor som tar in ALL data från tidigare steg och genererar
ALLA notifikationer i ett pass.

**Signatur:**
```typescript
export interface NotificationInput {
  game: SaveGame
  nextMatchday: number
  currentLeagueRound: number | null
  simulatedFixtures: Fixture[]
  justCompletedManagedFixture: Fixture | null
  newlyInjured: { player: Player; days: number }[]
  newlySuspended: { player: Player }[]
  injuredBeforeRound: Set<string>
  updatedPlayers: Player[]
  standings: StandingRow[]
  previousMarketValues: Record<string, number>
  finalAllFixtures: Fixture[]
  // etc.
}

export interface NotificationResult {
  inboxItems: InboxItem[]
  moments: Moment[]
}

export function generateRoundNotifications(
  input: NotificationInput,
): NotificationResult
```

**Risk:** Medel. Input-objektet blir brett men varje notifikation är
oberoende.

---

### 3. `transferExecutionProcessor` (medel risk)

**Ansvar:** Den massiva inline-loopen (steg 37) som kör:
- `executeTransfer` per accepted outgoing bid
- Nemesis-tracking vid inköp
- Mecenat cost-share (WEAK-022B)
- Sponsor reactions (WEAK-022C) — både köp och försäljning
- Transfer story Moments för historiska försäljningar (Hook 7)

Det är ~150 rader inline. Tydlig snittpunkt.

**Signatur:**
```typescript
export interface TransferExecutionInput {
  game: SaveGame
  preEventGame: SaveGame
  resolvedBids: TransferBid[]
  prevBids: TransferBid[]
  players: Player[]
  clubs: Club[]
  nextMatchday: number
}

export interface TransferExecutionResult {
  updatedPlayers: Player[]
  updatedClubs: Club[]
  updatedNemesisTracker: Record<string, NemesisEntry>
  sponsorNetworkMoodDelta: number
  moments: Moment[]
}

export function executeAcceptedTransfers(
  input: TransferExecutionInput,
): TransferExecutionResult
```

**Risk:** Medel. Många sidoeffekter men alla samlade kring transfers.

---

### 4. `endOfRoundChecksProcessor` (låg risk)

**Ansvar:** "Efter allt annat"-kontroller:
- Auto-advance playoff när managed eliminerats (steg 48)
- HalfTime summary trigger (steg 49)
- Onboarding step (steg 50)
- Bankruptcy check (steg 51)
- Recommendation change inbox (steg 52)

Dessa är alla slutsteg som tar ett `updatedGame` och returnerar ett
ytterligare uppdaterat `updatedGame`.

**Signatur:**
```typescript
export interface EndOfRoundResult {
  updatedGame: SaveGame
  shouldAutoAdvance: boolean  // triggar ny advance() om true
}

export function runEndOfRoundChecks(
  game: SaveGame,
  justCompletedManagedFixture: Fixture | undefined,
  isPlayoffRound: boolean,
  nextMatchday: number,
  baseSeed: number,
  originalSeed?: number,
): EndOfRoundResult
```

**Risk:** Låg. Self-contained, ingen tidigare state-beroende.

---

### 5. `nextRoundPrepProcessor` (låg risk)

**Ansvar:** Förberedelser för nästa omgång:
- Pre-generate weather för nästa matchday (steg 47)
- Away trip generation för nästa bortamatch (steg 42)

**Signatur:**
```typescript
export interface NextRoundPrepInput {
  game: SaveGame
  finalAllFixtures: Fixture[]
  justCompletedManagedFixture: Fixture | null
  matchWeathers: MatchWeather[]
  baseSeed: number
}

export interface NextRoundPrepResult {
  newWeathers: MatchWeather[]
  awayTripUpdate: AwayTrip | undefined
}

export function prepareNextRound(
  input: NextRoundPrepInput,
): NextRoundPrepResult
```

**Risk:** Låg. Ren förberedelse utan beroenden mot nuvarande omgångs
state.

---

## ICKE-EXTRAHERAT — stannar inline

Detta stannar i roundProcessor:

1. **Captain morale cascade** (steg 9) — tätt kopplat till player-state,
   liten kodmängd. Extrahering ger marginellt värde.
2. **Chemistry stats + development** (steg 10) — tätt kopplat till
   managed fixture + player state. Kan brytas ut senare som "playerRoundDevelopmentProcessor" om behovet växer.
3. **Ripple triggers** (steg 16, 12 stjärn-injury) — tajmade till specifika
   pipeline-steg, svårt att extrahera utan att ändra ordning.
4. **Arc processing** (steg 46) — redan wrappad i ett block, men använder
   `updatedGame` state direkt. Kan extraheras separat senare.
5. **Den stora updatedGame-assembleringen** (steg 44) — detta är *sista
   sammanställningen*. Att extrahera den gör bara ont. Lämnas.
6. **Regen player persistence, facility/kommunstöd bonus** — små isolerade
   blocks som inte tjänar på egen fil.

---

## EFTER REFACTOR — ny struktur

```typescript
export function advanceToNextEvent(game: SaveGame, seed?: number): AdvanceResult {
  // 1. Matchday context
  const ctx = deriveMatchdayContext(game, seed)
  if (ctx.seasonEndTrigger) return ctx.seasonEndTrigger

  // 2. Core pipeline (befintlig)
  const trainingResult = ctx.isSecondPassForManagedMatch ? ... : applyRoundTraining(...)
  const simResult = simulateRound(...)
  const playerStateResult = applyPlayerStateUpdates(...)
  const statsResult = updatePlayerMatchStats(...)
  
  // 3. Inline: captain morale, chemistry, development
  // (stannar)
  
  // 4. Övriga processors (befintliga)
  const scoutResult = processScouts(...)
  const narrativeResult = processNarrative(...)
  const playoffResult = processPlayoffRound(...)
  const cupResult = processCupRound(...)
  const economyResult = processEconomy(...)
  // ... etc
  
  // 5. Notifikationer (NY)
  const notificationsResult = generateRoundNotifications({...})
  
  // 6. Transfer execution (NY)
  const transferExec = executeAcceptedTransfers({...})
  
  // 7. Community + övriga sidoeffekter
  const communityResult = processCommunity(...)
  // ... drift, facility bonus etc inline
  
  // 8. Next round prep (NY)
  const nextPrep = prepareNextRound({...})
  
  // 9. Assemblera updatedGame (stannar inline)
  let updatedGame: SaveGame = {...}
  
  // 10. Arc processing + follow-ups (stannar inline)
  // ...
  
  // 11. End of round checks (NY)
  const endChecks = runEndOfRoundChecks(updatedGame, ...)
  updatedGame = endChecks.updatedGame
  if (endChecks.shouldAutoAdvance) {
    return advanceToNextEvent(updatedGame, (seed ?? baseSeed) + 1)
  }
  
  return { game: updatedGame, ... }
}
```

Förväntad radminskning: ~800 → ~400 rader.

---

## TEST-STRATEGI

**Existerande tester:** `src/application/useCases/__tests__/roundProcessor.test.ts`
(om det finns — Code bekräftar i analys).

**Nya tester per processor:**
- `matchdayContextProcessor.test.ts` — kontext-härledning, pass-2-detection
- `notificationProcessor.test.ts` — varje notifikationstyp triggar korrekt
- `transferExecutionProcessor.test.ts` — bid-execution, nemesis, cost-share
- `endOfRoundChecksProcessor.test.ts` — bankruptcy, halftime, auto-advance
- `nextRoundPrepProcessor.test.ts` — weather, away trip

**Regressionstest:** Kör `npm run stress` efter refactor. Utfall ska vara
bit-för-bit identiskt med pre-refactor (samma seed → samma resultat).
Om något diverar — det är en regression, inte en förbättring.

---

## IMPLEMENTATIONSSORDNING

**Pass 1 (säkraste först):**
1. `matchdayContextProcessor` — minimal risk
2. `nextRoundPrepProcessor` — oberoende
3. `endOfRoundChecksProcessor` — oberoende

Efter pass 1: kör stresstest. Ska vara 100% identiskt.

**Pass 2 (mer komplext):**
4. `notificationProcessor` — stor input, oberoende output
5. `transferExecutionProcessor` — mest logik, behöver care

Efter pass 2: kör stresstest igen. Ska fortfarande vara identiskt.

---

## VAD SOM INTE GÖRS

- Inga beteendeförändringar. Detta är strikt refactor.
- Ingen omstrukturering av redan extraherade processors.
- Ingen ändring av SaveGame-shape.
- Ingen ändring av publika API:er (advanceToNextEvent-signaturen är stabil).

---

## RISKBEDÖMNING (preliminär)

| Processor | Risk | Varför |
|-----------|------|--------|
| matchdayContextProcessor | Låg | Ren detection, inga sidoeffekter |
| nextRoundPrepProcessor | Låg | Oberoende förberedelse |
| endOfRoundChecksProcessor | Låg | Self-contained slutkontroller |
| notificationProcessor | Medel | Stor input-yta, många notifikationstyper |
| transferExecutionProcessor | Medel | Stort logikblock med flera sidoeffekter |

**Total riskbedömning:** Medel. Refactor är stor men processors är väl
isolerade. Stresstest-regression ger tydlig valideringssignal.

---

## COMMIT-FORMAT

En commit per processor. Förslag:

```
refactor: bryt ut matchdayContextProcessor ur roundProcessor

Första steget av TS-1-refactor. Tar 30 rader ur roundProcessor
och placerar i egen fil med tydligt kontrakt.

Stresstest: identiskt utfall pre/post för alla 10 seeds.
```

---

## NÄR CODE'S ANALYS KOMMER

Opus jämför denna utkast-spec med Code's fynd och uppdaterar:
1. Om Code hittar dependencies jag missat — lägg till i spec
2. Om Code föreslår annan snittpunkt — diskutera innan beslut
3. Om Code flaggar risk jag underskattat — uppdatera riskbedömning

Sen skickas skarp spec till Code för implementation.
