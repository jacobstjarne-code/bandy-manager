# SPRINT 15 — ARKITEKTUR-REST (REFAKTORER)

**Typ:** Arkitektursession — tre isolerade refaktorer  
**ID:er:** ARCH-002, ARCH-003, ARCH-008  
**Uppskattad tid:** 8h totalt  
**Förutsättning:** Kör `npm test` efter VARJE enskild refaktor. Commita separat per ID. Backa om test bryts.

---

## PRINCIP

Tre fristående refaktorer som INTE ändrar beteende. Ingen ny feature, ingen ny UI, ingen ny data i SaveGame. Bara strukturell flytt. Om ett test bryts → stoppa, analysera, fixa test ELLER backa refaktorn.

---

## ARCH-008 — SaveGame.ts split (GÖR FÖRST — enklast, minst risk)

**Varför först:** Denna ändrar inga import-paths för konsumenter tack vare re-exports. Ren filsplitt.

**Nuläge:** SaveGame.ts har ~300 rader med 7 inline interfaces (StandingRow, InboxItem, TransferOffer, TransferState, YouthIntakeRecord, Sponsor, TalentSearchRequest, TalentSuggestion, TalentSearchResult, RoundSummaryData) plus det enorma SaveGame-interfacet.

**Steg:**

1. Skapa `src/domain/entities/Standing.ts`:
```typescript
export interface StandingRow {
  clubId: string
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  position: number
}
```

2. Skapa `src/domain/entities/Inbox.ts`:
```typescript
import type { InboxItemType } from '../enums'

export interface InboxItem {
  id: string
  date: string
  type: InboxItemType
  title: string
  body: string
  relatedClubId?: string
  relatedPlayerId?: string
  relatedFixtureId?: string
  isRead: boolean
}
```

3. Skapa `src/domain/entities/Transfer.ts`:
```typescript
import type { Player } from './Player'

export interface TransferOffer {
  id: string
  playerId: string
  fromClubId: string
  toClubId: string
  offerAmount: number
  offeredSalary: number
  contractYears: number
  status: 'pending' | 'accepted' | 'rejected'
}

export interface TransferState {
  freeAgents: Player[]
  pendingOffers: TransferOffer[]
}
```

4. Skapa `src/domain/entities/Sponsor.ts`:
```typescript
export interface Sponsor {
  id: string
  name: string
  category: string
  weeklyIncome: number
  contractRounds: number
  signedRound: number
  personality?: 'local' | 'regional' | 'foundation'
  networkMood?: number
  icaMaxi?: boolean
  icaMaxi_active?: boolean
}
```

5. Skapa `src/domain/entities/TalentSearch.ts`:
```typescript
export interface TalentSearchRequest { ... }
export interface TalentSuggestion { ... }
export interface TalentSearchResult { ... }
```

6. Skapa `src/domain/entities/RoundSummary.ts`:
```typescript
export interface RoundSummaryData { ... }
```

7. **I SaveGame.ts:** Ta bort inline-definitionerna. Importera från nya filer. Re-exportera ALLT:

```typescript
// Ny import
import type { StandingRow } from './Standing'
import type { InboxItem } from './Inbox'
import type { TransferOffer, TransferState } from './Transfer'
import type { Sponsor } from './Sponsor'
import type { TalentSearchRequest, TalentSuggestion, TalentSearchResult } from './TalentSearch'
import type { RoundSummaryData } from './RoundSummary'

// Re-export — alla befintliga `import { StandingRow } from '../entities/SaveGame'` fortsätter fungera
export type { StandingRow }
export type { InboxItem }
export type { TransferOffer, TransferState }
export type { Sponsor }
export type { TalentSearchRequest, TalentSuggestion, TalentSearchResult }
export type { RoundSummaryData }
```

8. **Uppdatera `src/domain/entities/index.ts`** med exports från nya filer.

**Verifiering:**
```bash
npm run build && npm test
grep -rn "from.*SaveGame" src/ | head -30  # alla ska fortfarande kompilera
```

**KRITISKT:** Ingen konsument ska behöva byta import. Re-exports i SaveGame.ts garanterar bakåtkompatibilitet.

---

## ARCH-003 — show*-flaggor → pendingScreen enum (GÖR ANDRA)

**Nuläge:** Dessa booleans på SaveGame:
```
showSeasonSummary?: boolean
showBoardMeeting?: boolean
showPreSeason?: boolean
showHalfTimeSummary?: boolean
showPlayoffIntro?: boolean
showQFSummary?: boolean
```

Alla används med samma mönster i DashboardScreen:
```typescript
if (game?.showSeasonSummary) navigate('/game/season-summary', { replace: true })
else if (game?.showHalfTimeSummary) navigate('/game/half-time-summary', { replace: true })
// etc.
```

Och i roundProcessor/seasonEndProcessor:
```typescript
updatedGame.showSeasonSummary = true
```

**Steg:**

1. Definiera enum i `src/domain/enums.ts` (eller separat fil):

```typescript
export enum PendingScreen {
  SeasonSummary = 'season_summary',
  BoardMeeting = 'board_meeting',
  PreSeason = 'pre_season',
  HalfTimeSummary = 'half_time_summary',
  PlayoffIntro = 'playoff_intro',
  QFSummary = 'qf_summary',
}
```

2. **I SaveGame.ts**, lägg till:
```typescript
pendingScreen?: PendingScreen | null
```

3. **Behåll gamla booleans som deprecated getters** (eller bara behåll dem en sprint till med migration). Enklaste migrationsstrategin:

```typescript
// I saveGameMigration.ts — lägg till:
if (game.showSeasonSummary) game.pendingScreen = PendingScreen.SeasonSummary
if (game.showBoardMeeting) game.pendingScreen = PendingScreen.BoardMeeting
if (game.showPreSeason) game.pendingScreen = PendingScreen.PreSeason
if (game.showHalfTimeSummary) game.pendingScreen = PendingScreen.HalfTimeSummary
if (game.showPlayoffIntro) game.pendingScreen = PendingScreen.PlayoffIntro
if (game.showQFSummary) game.pendingScreen = PendingScreen.QFSummary
// Rensa gamla
delete game.showSeasonSummary
delete game.showBoardMeeting
delete game.showPreSeason
delete game.showHalfTimeSummary
delete game.showPlayoffIntro
delete game.showQFSummary
```

4. **Uppdatera DashboardScreen** — den stora if/else-kedjan blir:

```typescript
const SCREEN_ROUTES: Record<PendingScreen, string> = {
  [PendingScreen.SeasonSummary]: '/game/season-summary',
  [PendingScreen.BoardMeeting]: '/game/board-meeting',
  [PendingScreen.PreSeason]: '/game/pre-season',
  [PendingScreen.HalfTimeSummary]: '/game/half-time-summary',
  [PendingScreen.PlayoffIntro]: '/game/playoff-intro',
  [PendingScreen.QFSummary]: '/game/qf-summary',
}

useEffect(() => {
  if (!game) return
  if (game.managerFired) { navigate('/game/game-over', { replace: true }); return }
  if (game.pendingScreen) {
    const route = SCREEN_ROUTES[game.pendingScreen]
    if (route) navigate(route, { replace: true })
    return
  }
  if (playoffInfo?.status === PlayoffStatus.Completed) navigate('/game/champion', { replace: true })
}, [])
```

5. **Uppdatera alla sättare.** Grep:
```bash
grep -rn "showSeasonSummary\|showBoardMeeting\|showPreSeason\|showHalfTimeSummary\|showPlayoffIntro\|showQFSummary" src/
```
Varje `game.showX = true` → `game.pendingScreen = PendingScreen.X`
Varje `game.showX = false` (eller `delete game.showX`) → `game.pendingScreen = null`

6. **Uppdatera alla läsare.** Samma grep — varje `if (game.showX)` → `if (game.pendingScreen === PendingScreen.X)`

**Verifiering:**
```bash
npm run build && npm test
grep -rn "show\(Season\|Board\|PreSeason\|HalfTime\|Playoff\|QF\)" src/ | grep -v "// deprecated"
# Ska ge 0 (förutom migration-koden)
```

Manuell: starta nytt spel, spela en hel säsong, verifiera att alla övergångar funkar (halfTimeSummary vid omg 11, seasonSummary vid slut, boardMeeting, preSeason).

---

## ARCH-002 — Unified Arc interface (GÖR SIST — störst risk)

**Nuläge:** Tre separata system:
- `trainerArcService.ts` — hanterar TrainerArc med faser (newcomer→grind→established→etc)
- `arcService.ts` — hanterar ActiveArc[] med player arcs (hungrig_breakthrough, veteran_farewell etc)
- `storylineService.ts` — hanterar StorylineEntry[] med lösa narrativa trådar

Alla tre har fas-koncept men olika interfaces.

**Vad vi GÖR (konservativt):**

Inte fullständig unifiering — det är för riskabelt. Istället: **gemensam bastyp som alla tre implementerar**, utan att ändra befintlig logik.

1. Definiera i `src/domain/entities/Narrative.ts`:

```typescript
/**
 * Gemensam basstruktur för alla arc-lika system.
 * Specifika arc-typer (TrainerArc, ActiveArc, StorylineEntry) UTÖKAR detta.
 */
export interface BaseArc {
  id: string
  type: string           // arc-typ-nyckel
  subject: string        // vem/vad handlar det om
  phase: string          // aktuell fas
  startedMatchday: number
  startedSeason: number
  expiresMatchday?: number
}
```

2. **Utöka TrainerArc** (i Narrative.ts) att extendera BaseArc:
```typescript
export interface TrainerArc extends BaseArc {
  type: 'trainer'
  subject: 'manager'  // alltid managern
  phase: ArcPhase      // specifik enum
  current: ArcPhase    // behåll för bakåtkompatibilitet
  // ... alla befintliga fält
}
```

3. **Utöka ActiveArc** att extendera BaseArc:
```typescript
export interface ActiveArc extends BaseArc {
  type: ArcType
  playerId: string
  phase: 'building' | 'peak' | 'resolving'
  subject: string      // spelarnamn
  // ... alla befintliga fält
}
```

4. **Utöka StorylineEntry** att extendera BaseArc (om det passar):
```typescript
export interface StorylineEntry extends BaseArc {
  type: StorylineType
  // ... befintliga fält
}
```

5. **Skapa en hjälp-funktion** `src/domain/services/arcUtils.ts`:
```typescript
import type { SaveGame } from '../entities/SaveGame'
import type { BaseArc } from '../entities/Narrative'

/**
 * Samla alla aktiva arcs i spelet, oavsett typ.
 * Användbart för dashboard-rendering och priority-system.
 */
export function getAllActiveArcs(game: SaveGame): BaseArc[] {
  const arcs: BaseArc[] = []
  if (game.trainerArc) arcs.push(game.trainerArc)
  if (game.activeArcs) arcs.push(...game.activeArcs)
  if (game.storylines) arcs.push(...game.storylines.filter(s => s.phase !== 'resolved'))
  return arcs
}

/**
 * Räkna aktiva arcs. Användbart för att begränsa totalt antal.
 */
export function countActiveArcs(game: SaveGame): number {
  return getAllActiveArcs(game).length
}
```

**Vad vi INTE gör:**
- Slår inte ihop trainerArcService + arcService + storylineService till en fil
- Ändrar inte hur fasövergångar fungerar
- Ändrar inte hur roundProcessor anropar respektive service

**Varför:** Att slå ihop tre services med olika faslogik i en session är recept för regressioner. Bas-interfacet + getAllActiveArcs ger oss 80% av vinsten (gemensam typning, aggregering) utan att röra fungerande logik.

**Verifiering:**
```bash
npm run build && npm test
```

Manuell: spela 5 omgångar, verifiera att trainerArc fortfarande transitionar, att spelar-arcs triggar, att storylines fungerar.

---

## ORDNING OCH COMMITS

```
1. ARCH-008: SaveGame inline types → separata filer
   Commit: "ARCH-008: split SaveGame inline types to Standing/Inbox/Transfer/Sponsor/TalentSearch/RoundSummary"
   → npm test

2. ARCH-003: show* booleans → pendingScreen enum
   Commit: "ARCH-003: replace 6 show* booleans with PendingScreen enum"
   → npm test + manuell säsongstest

3. ARCH-002: BaseArc + getAllActiveArcs
   Commit: "ARCH-002: introduce BaseArc interface, extend TrainerArc/ActiveArc/StorylineEntry"
   → npm test
```

**Om något bryts:** Commita det som fungerar, skapa en separat bugg för det som inte gick. Backa inte hela sprinten — de tre är oberoende.

---

## RAPPORTERA PER ID

```
ARCH-008: ✅/⚠️/❌ — [vad som gjordes]
ARCH-003: ✅/⚠️/❌ — [vad som gjordes]
ARCH-002: ✅/⚠️/❌ — [vad som gjordes]
```
