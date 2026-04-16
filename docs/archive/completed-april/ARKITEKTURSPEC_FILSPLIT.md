# ARKITEKTURSPEC — Filsplittning och refaktorering

## Prioritet 1: roundProcessor.ts (81 KB → ~10 KB orchestrator)

roundProcessor.ts gör allt. Den ska bli en tunn orchestrator
som anropar specialiserade processorer. Mönstret finns redan
i `processors/` — utöka det.

### Nya processorer:

```
processors/
  trainingProcessor.ts      ← FINNS
  playerStateProcessor.ts   ← FINNS
  statsProcessor.ts         ← FINNS
  matchProcessor.ts         ← NY: simulera fixtures, generera lineups
  cupProcessor.ts           ← NY: updateCupBracket, generateNextRound, inbox
  playoffProcessor.ts       ← NY: updatePlayoffBracket, advance, elimination
  economyProcessor.ts       ← NY: calcIncome, sponsorer, finance log
  scoutProcessor.ts         ← NY: scout assignments, talent search
  communityProcessor.ts     ← NY: communityStanding, activities, nudges
  transferProcessor.ts      ← NY: bid resolution, execute transfers
  inboxProcessor.ts         ← NY: derby notifications, media, rivalry
```

### Orchestrator-mönster:

```typescript
export function advanceToNextEvent(game: SaveGame, seed?: number): AdvanceResult {
  // 1. Determine next matchday
  const { nextMatchday, roundFixtures, isCupRound, isPlayoffRound } = determineNextRound(game)
  
  // 2. Training
  const training = applyRoundTraining(game, seed, nextMatchday)
  
  // 3. Match simulation
  const matches = processMatches(roundFixtures, game, training.players, seed)
  
  // 4. Player updates
  const players = applyPlayerUpdates(matches, training, game, seed)
  
  // 5. Cup/Playoff
  const cup = processCup(game, matches.completed)
  const playoff = processPlayoff(game, matches.completed)
  
  // 6. Economy
  const economy = processEconomy(game, matches, players)
  
  // 7. Transfers
  const transfers = processTransfers(game, nextMatchday, seed)
  
  // 8. Community
  const community = processCommunity(game, matches, standings)
  
  // 9. Events + Inbox
  const events = processEvents(game, nextMatchday, matches, seed)
  
  // 10. Assemble final state
  return assembleGameState(game, { training, matches, players, cup, playoff, economy, transfers, community, events })
}
```

Varje processor returnerar ett resultat-objekt (inga side-effects)
som `assembleGameState` slår ihop till det slutgiltiga SaveGame.

---

## Prioritet 2: SaveGame.ts (14 KB → 4 separata filer)

```
entities/
  SaveGame.ts          ← Kvar: SaveGame interface + StandingRow, InboxItem, etc.
  Mecenat.ts           ← NY: Mecenat, MecenatType, MecenatPersonality, SocialEvent, MecenatDemand
  Community.ts         ← NY: CommunityActivities, FacilityProject, BoardObjective, BoardMember
  Narrative.ts         ← NY: StorylineEntry, ClubLegend, TrainerArc, Journalist, NamedCharacter
```

SaveGame.ts importerar från de nya filerna:
```typescript
import type { Mecenat } from './Mecenat'
import type { CommunityActivities, FacilityProject, BoardObjective } from './Community'
import type { StorylineEntry, ClubLegend, TrainerArc, Journalist } from './Narrative'
```

---

## Prioritet 3: TransfersScreen.tsx (52 KB)

Bryt ut inline-komponenter till egna filer:
```
components/transfers/
  TransferPlayerCard.tsx
  TransferBidModal.tsx
  TransferMarketFilters.tsx
  FreeAgentList.tsx
  ActiveBidsList.tsx
```

---

## Prioritet 4: MatchLiveScreen.tsx (37 KB)

Extrahera:
```
components/match/
  Scoreboard.tsx         ← LED scoreboard med utvisningar
  CommentaryFeed.tsx     ← Commentary feed med event-styling
  MatchControls.tsx      ← Play/pause/ff/sub/mute knappar
```

MatchLiveScreen blir orchestrator för state + effects.

---

## Regler vid splittning

1. **Inga beteendeändringar.** Ren refaktorering. Output ska vara identiskt.
2. **En processor per commit.** Splitta roundProcessor en processor i taget.
3. **npm run build && npm test efter varje split.**
4. **Processorer returnerar data, inte muterar state.** Pure functions.
5. **Importera types med `import type` — inte runtime-imports.**

---

## Ordning

```
Sprint 1: roundProcessor → cupProcessor + playoffProcessor (mest isolerade)
Sprint 2: roundProcessor → economyProcessor + communityProcessor
Sprint 3: roundProcessor → matchProcessor + transferProcessor + scoutProcessor + inboxProcessor
Sprint 4: SaveGame.ts → 4 filer
Sprint 5: TransfersScreen + MatchLiveScreen komponent-split
```

Varje sprint = en commit med build-verifiering.
Uppskattat: 2-3 timmar totalt.
