# FILSPLITTNING — roundProcessor.ts (95KB → ~10KB orchestrator)

## LÄSORDNING
1. Läs denna fil helt
2. Läs `docs/ARKITEKTURSPEC_FILSPLIT.md` för full arkitekturplan
3. Läs `src/application/useCases/processors/playoffProcessor.ts` som referensmönster
4. Läs `src/application/useCases/roundProcessor.ts` helt — den är 95KB, läs hela

## TEKNIK — VIKTIGT

**roundProcessor.ts är för stor för str_replace/edit.** Använd denna teknik:

1. **Skriv nya processorfiler från scratch** i `processors/`-mappen
2. Kopiera relevant logik från roundProcessor.ts till varje ny processor
3. **Skriv om roundProcessor.ts HELT som en ny fil** — ersätt hela innehållet med en tunn orchestrator
4. Använd INTE edit/str_replace på roundProcessor.ts — skriv hela filen på nytt

Varje processor returnerar ett resultat-objekt (pure function, inga side-effects).
roundProcessor samlar ihop alla resultat och bygger det slutgiltiga SaveGame-objektet.

## MÖNSTER (se playoffProcessor.ts)

```typescript
// 1. Result interface
export interface XxxProcessorResult {
  // alla outputs denna processor genererar
}

// 2. Pure function
export function processXxx(game: SaveGame, ...args): XxxProcessorResult {
  // logik kopierad från roundProcessor
  // returnerar data, muterar INGET
}
```

## SPRINT 1: Cup + Playoff (mest isolerade)

### 1A. cupProcessor.ts (NY)
Extrahera ALL cuplogik från roundProcessor.ts:
- Identifiera cupmatcher bland simulerade fixtures
- `updateCupBracketAfterRound()`
- `generateNextCupRound()` 
- Cup-specifika inbox-items (cupresultat, "Ni slog ut X!")
- Cup-specifika communityStanding-bonusar
- Hantering av `hasManagedCupPending`

```typescript
export interface CupProcessorResult {
  updatedCupBracket: CupBracket | null
  newCupFixtures: Fixture[]
  cupInboxItems: InboxItem[]
  cupCsBoost: number
  hasManagedCupPending: boolean
}
```

### 1B. Wira playoffProcessor.ts (FINNS — kommenterad import i roundProcessor)
Processorn finns redan men importeras inte:
```typescript
// Playoff logic extracted to processors/playoffProcessor.ts — wiring pending
// import { processPlayoffRound } from './processors/playoffProcessor'
```
Avkommentera och använd den.

### 1C. Skriv om roundProcessor.ts
Efter att cup+playoff är extraherade, skriv hela roundProcessor.ts på nytt.
Behåll ALL logik som inte är cup/playoff exakt som den är.
Byt bara ut de inlined cup/playoff-blocken mot funktionsanrop.

**npm run build && npm test efter detta steg. Committa.**

## SPRINT 2: Economy + Community

### 2A. economyProcessor.ts (NY)
Extrahera:
- `calcRoundIncome()`, `calcAttendance()`
- Sponsorlogik, biljettintäkter
- `appendFinanceLog()`, `applyFinanceChange()`
- Transferbudget-beräkningar

```typescript
export interface EconomyProcessorResult {
  updatedBudget: number
  updatedTransferBudget: number
  financeEntries: FinanceEntry[]
  attendanceThisRound: number
}
```

### 2B. communityProcessor.ts (NY)
Extrahera:
- communityStanding-beräkningar (csBoost per match)
- Activity-bonusar (kiosk, lotteri, bandyskola, sociala medier)
- Nudge-logik för activities
- `generateSocialEvent()`, `generateSilentShoutEvent()`

```typescript
export interface CommunityProcessorResult {
  updatedCommunityStanding: number
  updatedActivities: CommunityActivities
  communityInboxItems: InboxItem[]
  communityEvents: PendingEvent[]
}
```

### 2C. Skriv om roundProcessor.ts IGEN (ersätt hela filen, nu med economy+community som anrop)

**npm run build && npm test. Committa.**

## SPRINT 3: Match + Transfer + Scout + Inbox

### 3A. matchProcessor.ts (NY)
Extrahera:
- AI lineup-generering (`generateAiLineup`, `createRegenPlayer`)
- Matchsimulering av alla fixtures i rundan
- Matchvädergenerering
- Post-match: skador, utvisningar, ratings
- `AI_FORMATIONS` konstanten

```typescript
export interface MatchProcessorResult {
  simulatedFixtures: Fixture[]
  matchWeathers: MatchWeather[]
  injuries: { playerId: string; days: number }[]
  suspensions: { playerId: string; games: number }[]
  matchInboxItems: InboxItem[]
  regenPlayers: Player[]
}
```

### 3B. transferProcessor.ts (NY)
Extrahera:
- `generateIncomingBids()`
- `resolveOutgoingBid()`, `executeTransfer()`
- `generateTransferRumor()`
- Transferfönster-logik

### 3C. scoutProcessor.ts (NY)
Extrahera:
- `processScoutAssignment()`
- `executeTalentSearch()`
- Scout-inbox-items

### 3D. inboxProcessor.ts (NY)
Extrahera:
- `generateMediaHeadlines()`, `generateTrendArticles()`
- Media-inbox-items
- Derby-notiser, rivalry-mentions
- Trimning (max 50, nyast-först)

### 3E. Skriv om roundProcessor.ts SISTA GÅNGEN (nu tunn orchestrator, ~10KB)

**npm run build && npm test. Committa.**

## SPRINT 4: SaveGame entity-split + UI-splits

### 4A. SaveGame.ts → 4 filer (se ARKITEKTURSPEC_FILSPLIT.md Prioritet 2)
- Mecenat.ts, Community.ts, Narrative.ts — extrahera typer
- SaveGame.ts importerar från de nya filerna
- INGA beteendeändringar, bara type-import-ompekning

### 4B. TransfersScreen.tsx (53KB) → 5 komponenter
Se ARKITEKTURSPEC_FILSPLIT.md Prioritet 3.
Skriv nya komponentfiler, sen skriv om TransfersScreen som orchestrator.

### 4C. MatchLiveScreen.tsx (39KB) → 3 komponenter
Se ARKITEKTURSPEC_FILSPLIT.md Prioritet 4.

**npm run build && npm test efter varje delfil. Committa per skärm.**

## REGLER

1. **INGA beteendeändringar.** Output ska vara IDENTISKT. Ren refaktorering.
2. **Skriv nya filer från scratch — redigera INTE roundProcessor med edit-verktyget.**
3. **npm run build && npm test efter VARJE sprint.**
4. **Processorer returnerar data, muterar inte state.** Pure functions.
5. **En commit per sprint.** Format: `Refactor: extract cupProcessor + wire playoffProcessor`
6. **Pusha efter sista sprinten.**
7. Om ett test failar — fixa det innan du går vidare. Committa INTE med trasiga tester.

## VERIFIERING EFTER SISTA SPRINTEN

```bash
# roundProcessor.ts ska vara < 15KB
wc -c src/application/useCases/roundProcessor.ts

# Alla processorer ska finnas
ls src/application/useCases/processors/

# TransfersScreen ska vara < 15KB
wc -c src/presentation/screens/TransfersScreen.tsx

# MatchLiveScreen ska vara < 15KB  
wc -c src/presentation/screens/MatchLiveScreen.tsx

# Bygge + tester gröna
npm run build && npm test
```
