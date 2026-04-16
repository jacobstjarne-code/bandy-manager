# SPRINT 13 — ARKITEKTUR

**Berör ID:** ARCH-001, ARCH-002, ARCH-003, ARCH-004, ARCH-005, ARCH-006, ARCH-007, ARCH-008, BUG-010, BUG-011, DEAD-001, DEAD-002, DEAD-003  
**Kostnad:** ~2-3 sessioner  
**Typ:** Arkitektur (teknisk skuld)  
**Prioritet:** Kan göras efter public beta om tid trycker

---

## SYFTE

Kodbasen är välstrukturerad men har ackumulerade skulder: `roundProcessor.ts` är 1200 rader, tre parallella arc-system utan gemensam abstraktion, SaveGame har 60+ fält på toppnivå, migrationer saknas, seeded random är inkonsistent. Denna sprint städar upp teknisk skuld utan att lägga till features.

---

## ID 1: ARCH-001 — roundProcessor split

**Plats:** `src/application/useCases/roundProcessor.ts`

### Problem

~1200 rader, en `advanceToNextEvent()` hanterar: fixture-selektion, ekonomi, community, mecenater, transfers, scouting, arcs, trainer-arc, supporter, presskonferens, kafferum, DailyBriefing.

### Fix

Du har redan börjat splittra — `processors/playoffProcessor`, `processors/cupProcessor`, `processors/economyProcessor` existerar. Fortsätt:

**Splitta i följande filer:**

```
src/application/useCases/roundProcessor.ts              ← orkestrering only, ~150 rader
src/application/useCases/processors/
  fixtureProcessor.ts       ← fixture-selektion, dag-framsteg
  playoffProcessor.ts       ← finns
  cupProcessor.ts           ← finns
  economyProcessor.ts       ← finns
  communityProcessor.ts     ← finns
  scoutProcessor.ts         ← finns
  transferProcessor.ts      ← finns
  sponsorProcessor.ts       ← finns
  matchSimProcessor.ts      ← finns
  youthProcessor.ts         ← finns
  narrativeProcessor.ts     ← NY: arcs, storylines, trainerArc, klack-favorit
  eventProcessor.ts         ← NY: event-generering + resolving
  mediaProcessor.ts         ← NY: journalist, headlines, coffee room, dailyBriefing
```

### Mönster

Varje processor exporterar en funktion:

```typescript
export function processEconomy(game: SaveGame, context: RoundContext): SaveGame {
  // applicerar alla ekonomiska förändringar för omgången
  return game  // uppdaterad kopia
}
```

`advanceToNextEvent` blir:

```typescript
export function advanceToNextEvent(game: SaveGame, seed?: number): AdvanceResult {
  const context = buildRoundContext(game, seed)
  
  let next = game
  next = processFixtures(next, context)
  next = simulateRound(next, context)
  next = processEconomy(next, context)
  next = processCommunity(next, context)
  next = processTransfers(next, context)
  next = processScouts(next, context)
  next = processYouth(next, context)
  next = processNarrative(next, context)
  next = processEvents(next, context)
  next = processMedia(next, context)
  
  return buildAdvanceResult(next, context)
}
```

### Testbarhet

Varje processor blir isolerat testbar:

```typescript
// tests/processors/economyProcessor.test.ts
test('wages subtract from finances', () => {
  const game = buildTestGame({ finances: 100_000, players: [...] })
  const context = buildTestContext()
  const result = processEconomy(game, context)
  expect(result.clubs[0].finances).toBeLessThan(100_000)
})
```

---

## ID 2: ARCH-002 — Arc-system unifierat

**Plats:** `arcService.ts`, `trainerArcService.ts`, `storylineService.ts`

### Problem

Tre parallella arc-system:
- `arcService` — spelar-arcs (`{ id, type, playerId, phase, eventsFired }`)
- `trainerArcService` — tränar-arcs (`{ current, consecutiveWins, boardWarningGiven }`)
- `storylineService` — kortare storylines (`{ id, type, season, resolved }`)

Ingen gemensam abstraktion. Svårt att lista "aktiva bågar" på ett ställe.

### Fix

**Gemensamt `Arc`-interface:**

```typescript
export type ArcSubjectType = 'player' | 'trainer' | 'club' | 'opponent' | 'mecenat'
export type ArcCategory = 'performance' | 'contract' | 'narrative' | 'relationship' | 'crisis'

export interface Arc {
  id: string
  type: string                   // specific string like 'hungrig_breakthrough'
  category: ArcCategory
  subjectType: ArcSubjectType
  subjectId: string              // playerId / 'trainer' / clubId / mecenat.id
  phase: 'building' | 'peak' | 'resolving' | 'resolved'
  triggeredMatchday: number
  triggeredSeason: number
  expiresMatchday?: number
  eventsFired: string[]
  data?: Record<string, unknown>
}
```

### Migration

I `SaveGame`:

```typescript
// Deprecated (behåll under migrationsperiod)
activeArcs?: ActiveArc[]
trainerArc?: TrainerArc
storylines?: StorylineEntry[]

// New
arcs: Arc[]  // alla arcs i en lista
```

Migrationsfunktion konverterar gamla till nya format.

### Services

- `playerArcService.ts` — triggerregler för spelar-arcs, returnerar Arc[]
- `trainerArcService.ts` — state machine för trainer, returnerar Arc | null
- `clubArcService.ts` — NY: economic crisis, standing crisis, etc
- `arcRegistry.ts` — aggregatorfunktion: `getActiveArcs(game): Arc[]`

### UI

DashboardScreen och DailyBriefing kan läsa `getActiveArcs(game)` och visa alla typer uniformt.

---

## ID 3: ARCH-003 — pendingScreen enum

**Plats:** `src/domain/entities/SaveGame.ts`, screens som navigerar

### Problem

Sex separata booleans:
```typescript
showSeasonSummary?: boolean
showBoardMeeting?: boolean
showPreSeason?: boolean
showHalfTimeSummary?: boolean
showPlayoffIntro?: boolean
showQFSummary?: boolean
```

### Fix

```typescript
export type PendingScreen = 
  | 'season_summary'
  | 'board_meeting'
  | 'pre_season'
  | 'half_time_summary'
  | 'playoff_intro'
  | 'qf_summary'

// i SaveGame
pendingScreen: PendingScreen | null
```

### DashboardScreen-redirect blir:

```tsx
useEffect(() => {
  if (!game) return
  if (game.managerFired) return navigate('/game/game-over', { replace: true })
  
  const routes: Record<PendingScreen, string> = {
    season_summary: '/game/season-summary',
    board_meeting: '/game/board-meeting',
    pre_season: '/game/pre-season',
    half_time_summary: '/game/half-time-summary',
    playoff_intro: '/game/playoff-intro',
    qf_summary: '/game/qf-summary',
  }
  
  if (game.pendingScreen && routes[game.pendingScreen]) {
    navigate(routes[game.pendingScreen], { replace: true })
  }
}, [game?.pendingScreen])
```

---

## ID 4: ARCH-004 — Event-prioritering

**Plats:** `src/domain/entities/SaveGame.ts`, `eventService.ts`, `EventOverlay.tsx`

### Problem

Alla events i samma kö. Mecenat-intro och kontraktsfråga prioriteras likadant.

### Fix

```typescript
export type EventPriority = 'critical' | 'high' | 'normal' | 'low'

export interface GameEvent {
  // befintliga fält...
  priority: EventPriority
}

// i SaveGame
pendingEvents: GameEvent[]  // sortera på priority när konsumerat
```

### Event-klassificering

```typescript
function getEventPriority(type: GameEventType): EventPriority {
  switch (type) {
    case 'mecenatIntro':
    case 'criticalEconomy':
    case 'playerDemand':
      return 'critical'
    
    case 'patronEvent':
    case 'pressConference':
    case 'politicianBid':
      return 'high'
    
    case 'transferBid':
    case 'contractRenewal':
    case 'academyEvent':
      return 'normal'
    
    default:
      return 'low'
  }
}
```

### Konsumtion

EventOverlay presenterar events i prioritetsordning:

```typescript
const nextEvent = [...game.pendingEvents].sort((a, b) => {
  const order = { critical: 0, high: 1, normal: 2, low: 3 }
  return order[a.priority] - order[b.priority]
})[0]
```

---

## ID 5: ARCH-005 — keyMoments behåller data

**Plats:** `roundProcessor.ts stripCompletedFixture`

### Problem

Efter match tas lineup/ratings/description bort. Historiska matchrapporter kan inte renderas.

### Fix

Utvidga logik:

```typescript
function isKeyMoment(fixture: Fixture, game: SaveGame): boolean {
  // Säsongens första seger
  // Derby-vinst
  // Playoff
  // Hat-trick (spelare har 3+ mål)
  // Comeback från 0-3
  // Blowout (6-0+)
  
  if (fixture.matchday > 22) return true  // playoff
  if (getRivalry(fixture.homeClubId, fixture.awayClubId)) return true  // derby
  
  const scoreDiff = Math.abs((fixture.homeScore ?? 0) - (fixture.awayScore ?? 0))
  if (scoreDiff >= 5) return true  // blowout
  
  // Hat-trick
  const goalsByPlayer = countGoalsByPlayer(fixture.events)
  if (Object.values(goalsByPlayer).some(c => c >= 3)) return true
  
  return false
}

function stripCompletedFixture(f: Fixture, game: SaveGame): Fixture {
  if (f.id === game.lastCompletedFixtureId) return f  // senaste always full
  if (isKeyMoment(f, game)) return f  // key moments always full
  
  // ... strip som tidigare
}
```

Nytt fält på `Fixture`:
```typescript
isKeyMoment?: boolean  // cachas vid match-klar
```

---

## ID 6: ARCH-006 — Migrationer

**Plats:** `src/infrastructure/saveGameStorage.ts` eller motsv.

### Fix

```typescript
const CURRENT_VERSION = '1.4.0'

type Migration = (save: any) => any

const MIGRATIONS: Record<string, Migration> = {
  '1.0.0→1.1.0': (save) => ({
    ...save,
    coachMarksSeen: save.tutorialSeen ?? false,
    tutorialSeen: undefined,
  }),
  '1.1.0→1.2.0': (save) => ({
    ...save,
    visitedScreensThisRound: save.visitedScreensThisRound ?? [],
  }),
  '1.3.0→1.4.0': (save) => {
    // klubb-ID normalisering (från Sprint 8)
    // arcs unified (från ARCH-002)
    return migrateClubIds(save)
  },
}

export function loadSaveGame(raw: any): SaveGame {
  let save = raw
  let version = save.version ?? '1.0.0'
  
  while (version !== CURRENT_VERSION) {
    const migrationKey = Object.keys(MIGRATIONS).find(k => k.startsWith(`${version}→`))
    if (!migrationKey) {
      console.error(`No migration path from ${version} to ${CURRENT_VERSION}`)
      break
    }
    save = MIGRATIONS[migrationKey](save)
    version = migrationKey.split('→')[1]
  }
  
  save.version = CURRENT_VERSION
  return save
}
```

---

## ID 7: ARCH-007 — Seed-determinism

**Plats:** Alla `mulberry32`-användningar

### Problem

Olika services seedar olika — ofta `Date.now()`. Quicktaktik-reroll och halvtidstaktik kan ge olika utfall för identiska situationer.

### Fix

Enhetlig seed-strategi:

```typescript
// src/domain/utils/seedHelpers.ts
export function fixtureSeed(fixture: Fixture): number {
  // Deterministisk från fixture-ID + matchday
  let h = 0
  for (let i = 0; i < fixture.id.length; i++) {
    h = (h * 31 + fixture.id.charCodeAt(i)) | 0
  }
  return Math.abs(h ^ (fixture.matchday * 7919))
}

export function fixtureStepSeed(fixture: Fixture, step: number): number {
  return fixtureSeed(fixture) + step * 104729
}
```

Byt ut alla `Date.now()`-seeds inne i match-logik mot `fixtureSeed(fixture)`.

---

## ID 8: ARCH-008 — SaveGame split

**Plats:** `src/domain/entities/SaveGame.ts`

### Fix

Dela upp typerna i tematiska filer:

```
src/domain/entities/SaveGame/
  index.ts          ← huvudexport (SaveGame + re-exports)
  core.ts           ← id, managedClub, date, season, players, clubs, fixtures, league
  inbox.ts          ← InboxItem, pendingEvents, resolvedEventIds
  economy.ts        ← transferState, sponsors, financeLog, boardPatience
  narrative.ts      ← trainerArc, activeArcs, storylines, journalist, namedCharacters
  community.ts      ← CommunityActivities, patron, politician, facilityProjects, supporterGroup
  competition.ts    ← playoffBracket, cupBracket, standings, seasonSummaries
  ui_state.ts       ← pendingScreen, coachMarksSeen, onboardingStep, visitedScreensThisRound
```

`SaveGame` i index.ts blir:

```typescript
export interface SaveGame extends
  CoreSaveGame,
  InboxSaveGame,
  EconomySaveGame,
  NarrativeSaveGame,
  CommunitySaveGame,
  CompetitionSaveGame,
  UISaveGame {}
```

---

## ID 9: BUG-010 — Lånespelares statistik

**Plats:** `loanDeals`-hantering, statsProcessor

### Problem

Lånespelare finns inte i `game.players` under lånet. Matcher räknas inte.

### Fix

Lånespelares stats mergas in:

```typescript
// När spelaren kommer tillbaka från lån
function finalizeLoanReturn(player: Player, loanDeal: LoanDeal): Player {
  const loanStats = loanDeal.accumulatedStats ?? defaultStats()
  return {
    ...player,
    seasonStats: mergeStats(player.seasonStats, loanStats),
    careerStats: mergeStats(player.careerStats, loanStats),
  }
}
```

Lånespelaren ska fortfarande delta i matchsimulering för lånklubben — men simuleringen skriver `accumulatedStats` till loanDeal istället för `seasonStats` på player.

---

## ID 10: BUG-011 — Determinism i matchprofil

(Behandlas via ARCH-007)

---

## ID 11-13: DEAD-001/002/003 — Verifiera och aktivera

### DEAD-001: narrativeService utvidga

Sprint 4 (executeTransfer) och Sprint 7 (spelarens röst) använder den redan. Efter dessa är den inte längre underutnyttjad. Verifiera efter Sprint 7: är det fortfarande ett problem? Om ja, bredda till klack-favorit-byte och veteran-arc-prosa.

### DEAD-002: rivalryHistory

```bash
grep -rn "rivalryHistory" src/domain/services/ src/presentation/
```

Om används bara i 1-2 filer: utvidga till matchkommentar ("Senaste tre mot dem: VFV"). Om inte används alls: ta bort.

### DEAD-003: resolvedEventIds

```bash
grep -rn "resolvedEventIds" src/
```

Verifiera att det faktiskt används för att filtrera bort triggade events. Om inte: implementera kontrollen i `eventService.ts generateEvents`.

---

## ORDNING

Denna sprint är stor. Dela upp i tre sessioner:

**Session 13a:** ARCH-001 (roundProcessor split)  
**Session 13b:** ARCH-002 (arcs unified), ARCH-003 (pendingScreen), ARCH-004 (event-priority), ARCH-005 (keyMoments)  
**Session 13c:** ARCH-006 (migrationer), ARCH-007 (seed), ARCH-008 (SaveGame split), BUG-010 (loan stats), DEAD verifieringar  

## SLUTRAPPORT

```
ARCH-001: ✅/⚠️/❌
ARCH-002: ✅/⚠️/❌
ARCH-003: ✅/⚠️/❌
ARCH-004: ✅/⚠️/❌
ARCH-005: ✅/⚠️/❌
ARCH-006: ✅/⚠️/❌
ARCH-007: ✅/⚠️/❌
ARCH-008: ✅/⚠️/❌
BUG-010: ✅/⚠️/❌
BUG-011: ✅/⚠️/❌
DEAD-001: ✅/⚠️/❌
DEAD-002: ✅/⚠️/❌
DEAD-003: ✅/⚠️/❌
```
