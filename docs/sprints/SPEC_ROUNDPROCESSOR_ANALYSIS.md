# roundProcessor.ts — Arkitekturanalys

**Syfte:** Underlag för Opus att skriva refactor-spec. Inga kodändringar i denna sprint.

---

## 1. Nuvarande pipeline i `advanceToNextEvent()`

Filen är 1 305 rader. Enda exporterade funktion: `advanceToNextEvent(game, seed?)`.

### Steg i exekveringsordning

| # | Rad | Steg | Input | Muterar state | Sidoeffekter |
|---|-----|------|-------|---------------|--------------|
| 1 | 117–136 | **Säsongsgräns-guard** | `game.fixtures`, `game.playoffBracket` | — | Delegerar till `handlePlayoffStart` / `handleSeasonEnd` (tidigt return) |
| 2 | 139–153 | **Matchday-beräkning + diagnostik** | `game.fixtures` | `nextMatchday` (lokal) | `console.log`, `console.warn` |
| 3 | 155–181 | **Second-pass-detektering** | `roundFixtures` | `isSecondPassForManagedMatch` (lokal) | — |
| 4 | 208–215 | **Training** | `game`, `baseSeed`, `currentLeagueRound` | `trainingPlayers`, `trainingHistory` | `newInboxItems` |
| 5 | 217–224 | **Match-simulering** (`simulateRound`) | `game`, `roundFixtures`, `nextMatchday` | `simulatedFixtures`, `roundMatchWeathers` | `newInboxItems`, startersThisRound-set |
| 6 | 233–234 | **Standings-beräkning** | `allFixtures` | `standings` | — |
| 7 | 254–269 | **Player state** (`applyPlayerStateUpdates`) | `trainingPlayers`, startersThisRound | `updatedPlayers`, `newlyInjured`, `newlySuspended` | — |
| 8 | 272–279 | **Match-stats** (`updatePlayerMatchStats`) | `finalPlayers`, `simulatedFixtures` | `finalPlayers` (seasonStats/careerStats) | `milestoneInboxItems` |
| 9 | 281–303 | **Captain morale cascade** | `finalPlayers`, `game.captainPlayerId` | `finalPlayers` | `newMoments` |
| 10 | 305–360 | **Spelarutveckling** (`applyRoundDevelopment`) | `finalPlayers`, matchresultat, taktik | `finalPlayers` | — |
| 11 | 362–372 | **Matchresultat-inbox** | `simulatedFixtures` | — | `newInboxItems` |
| 12 | 374–393 | **Skadenotiser + star-ripple** | `newlyInjured` | `gameAfterRipples` | `newInboxItems`, `newMoments` |
| 13 | 395–400 | **Utvisningsnotiser** | `newlySuspended` | — | `newInboxItems` |
| 14 | 402–407 | **Återhämtningsnotiser** | `updatedPlayers` | — | `newInboxItems` |
| 15 | 409–438 | **Styrelsemöte-milstolpar** (r7/14/22) | `standings`, `currentLeagueRound` | — | `newInboxItems` |
| 16 | 440–445 | **Scouting** (`processScouts`) | `game`, `finalPlayers` | scoutReports, scoutAssignment | `newInboxItems` |
| 17 | 448–451 | **Datum** | `buildSeasonCalendar`, `nextMatchday` | `newDate` | — |
| 18 | 458–479 | **Derby win ripple** | `justCompletedManagedFixture` | `gameAfterRipples` | `newMoments` |
| 19 | 481–495 | **Narrativ** (`processNarrative`) | `game`, fixture, `nextMatchday` | fanMood, supporterGroup, rivalryHistory | `newInboxItems` |
| 20 | 502–526 | **Slutspelsbracket** (`processPlayoffRound`) | `game`, fixtures | `updatedBracket`, `cancelledFixtureIds` | `newInboxItems`, `gameEvents` |
| 21 | 528–537 | **Cupbracket** (`processCupRound`) | `game`, `simulatedFixtures` | `updatedCupBracket`, `cupNewFixtures` | `cupInboxItems` |
| 22 | 539–542 | **Fixture-sammanslagning** | allFixtures + bracketNewFixtures + cupNewFixtures | `finalAllFixtures` | — |
| 23 | 544–591 | **Derby-varning inför nästa omgång** | `finalAllFixtures` | — | `newInboxItems` |
| 24 | 593–596 | **Marknadsvärden** (`updateAllMarketValues`) | `finalPlayers` | `marketUpdatedPlayers` | — |
| 25 | 598–600 | **Spelartillgänglighet + tränararc** | players, fixtures, standings | `availabilityUpdatedPlayers`, `updatedArc` | — |
| 26 | 602–621 | **Styrelseuppdrag check-in** | `boardObjectives` | `updatedBoardObjectives` | `newInboxItems` |
| 27 | 623–644 | **Marknadsvärde-tracking** | `availabilityUpdatedPlayers` | `newPrevValues` | `marketValueInbox` |
| 28 | 646–660 | **Ekonomi** (`processEconomy`) | game, fixtures, fanMood, standings | `roundFinanceLog`, `updatedClubs` | — |
| 29 | 662–665 | **Transferbud** (`processTransferBids`) | `game`, players | `resolvedBids`, `newBids`, `allBids` | `newInboxItems` |
| 30 | 674–686 | **GameEvents** (`processGameEvents`) | preEventGame, `newBids`, fixture | `allNewEvents`, `updatedMecenater` | `newInboxItems` |
| 31 | 688–691 | **Ungdomslag** (`processYouth`) | `game`, players | `updatedYouthTeam` | `newInboxItems`, `gameEvents` |
| 32 | 694–699 | **Lånespelare** (`processLoans`) | game, players, clubs | `loanUpdatedPlayers`, `updatedLoanDeals` | `newInboxItems` |
| 33 | 712–735 | **Media** (`processMedia`) | game, fixtures, fixture | reputationDelta, scoutReportUpdates | `newInboxItems` |
| 34 | 737–756 | **Inbox-trimning** | `newInboxItems` + `game.inbox` | `trimmedInbox` | — |
| 35 | 759–794 | **Sponsorer** (`processSponsors` + `checkContextualSponsors`) | game, fixture, players | `updatedSponsors` | `newMoments` |
| 36 | 796–811 | **Regen-spelare** | `allRoundRegenPlayers` | players + clubs | — |
| 37 | 813–925 | **Transfer-exekvering** | `resolvedBids` | players, clubs | `newMoments`, sponsorNetworkMoodDelta |
| 38 | 927–958 | **Community** (`processCommunity`) | game, fixture, standings | csBoost, facilityProjects, volunteers | `newInboxItems` |
| 39 | 960–989 | **Mecenat-spawn** | cs, rep, `currentLeagueRound` | `updatedMecenater` | `allNewEvents` |
| 40 | 991–1014 | **Bortaresa** (`generateAwayTrip`) | `finalAllFixtures` | `awayTripUpdate` | — |
| 41 | 1016–1022 | **Ripple-merge** | `gameAfterRipples`, fanMood, csBoost | `rippleMerged` | — |
| 42 | 1024–1131 | **SaveGame-assembly** | Alla ovanstående resultat | Returnerar nytt `updatedGame` | — |
| 43 | 1133–1136 | **Marknadsvärde-inbox-append** | `marketValueInbox` | `updatedGame` | — |
| 44 | 1138–1165 | **Arc-processning** | `updatedGame`, fixture | activeArcs, pendingEvents, storylines | arcInbox |
| 45 | 1167–1197 | **Follow-ups** | `pendingFollowUps` | `updatedGame.inbox` | — |
| 46 | 1199–1222 | **Nästa omgångs väder** | `finalAllFixtures` | `updatedGame.matchWeathers` | — |
| 47 | 1224–1233 | **Auto-advance playoff** | `updatedBracket` | — | Rekursivt anrop till `advanceToNextEvent` |
| 48 | 1235–1243 | **Halvtidssummering-trigger** | `fixture.roundNumber === 11` | `updatedGame.pendingScreen` | — |
| 49 | 1245–1249 | **Onboarding-steg** | `currentOnboarding` | `updatedGame.onboardingStep` | — |
| 50 | 1251–1277 | **Konkurscheck** | `managedClub.finances` | `updatedGame.managerFired` / inbox | `newInboxItems` |
| 51 | 1279–1302 | **Formations-rekommendation** | `managedSquad` | `previousRecommendedFormation` | inbox |
| 52 | 1304 | **Return** | `updatedGame` | — | — |

---

## 2. Befintliga processors (15 st)

Alla följer samma grundmönster: tar `SaveGame` + kontextvärden → returnerar ett resultat-objekt med `inboxItems`, `gameEvents` och muterat delstate.

| Fil | Rader | Tar in | Returnerar |
|-----|-------|--------|------------|
| `trainingProcessor.ts` | 105 | `game`, seed, leagueRound | players, trainingHistory, inboxItems |
| `playerStateProcessor.ts` | 214 | players, starters/bench, game, tactic | updatedPlayers, newlyInjured, newlySuspended |
| `statsProcessor.ts` | 265 | players, fixtures, game | finalPlayers, milestoneInboxItems |
| `matchSimProcessor.ts` | 382 | game, fixtures, nextMatchday, seed | simulatedFixtures, inboxItems, pressEvent, refereeMeetingEvent |
| `economyProcessor.ts` | 132 | game, fixtures, players, fanMood, standings | roundFinanceLog, updatedClubs |
| `communityProcessor.ts` | 265 | game, fixture, playoffCsBoost, standings | csBoost, facilityProjects, volunteers, inboxItems |
| `scoutProcessor.ts` | 107 | game, players, nextMatchday, seed | updatedScoutReports, inboxItems |
| `transferProcessor.ts` | 303 | game, players, nextMatchday, date | resolvedBids, newBids, allBids, loanDeals, inboxItems |
| `sponsorProcessor.ts` | 220 | game, fixture, players, nextMatchday | updatedSponsors, inboxItems |
| `eventProcessor.ts` | 121 | game, newBids, fixture, matchday | gameEvents, updatedMecenater, inboxItems |
| `narrativeProcessor.ts` | 249 | game, fixture, matchday, date | fanMood, supporterGroup, rivalryHistory, inboxItems |
| `mediaProcessor.ts` | 109 | game, fixtures, fixture, matchday | inboxItems, reputationDelta, scoutReportUpdates |
| `playoffProcessor.ts` | 257 | game, simulatedFixtures, allFixtures | updatedBracket, bracketNewFixtures, gameEvents, inboxItems |
| `cupProcessor.ts` | 187 | game, simulatedFixtures | updatedCupBracket, cupNewFixtures, cupInboxItems |
| `youthProcessor.ts` | 189 | game, players, matchday, date, seed | updatedYouthTeam, academyReputationDelta, gameEvents, inboxItems |
| `narrativeProcessor.ts` | 249 | game, fixture, matchday, date | fanMood, supporterGroup, rivalryHistory, inboxItems |

---

## 3. Steg som INTE är utbrutna ännu (kvar i roundProcessor.ts)

Dessa 8 logikblock hanteras direkt i `advanceToNextEvent()`:

### 3A. Captain morale cascade (rad 281–303)
Kontrollerar om kaptenen har morale < 40 → sänker övriga spelares moral. Skapar ett Moment.
**Naturlig processor:** `playerStateProcessor.ts` — hör hemma där, inte i orkestreringen.

### 3B. Spelarutveckling + chemistry (rad 305–360)
Anropar `applyRoundDevelopment` men bygger upp kontexten (playedIds, ratings, tactic-bucket) inline. 57 rader.
**Naturlig processor:** ny `developmentProcessor.ts` eller utvidgad `playerStateProcessor.ts`.

### 3C. Transfer-exekvering (rad 813–925)
112 rader med tre distinkta logikblock: executeTransfer-loop, nemesis-check, mecenat cost-share, sponsornätverk-reaktion, fan-favorite-sälj-reaktion, transfer-story Moment.
**Naturlig processor:** `transferProcessor.ts` har redan `processTransferBids` och `processLoans` — denna logik bör dit.

### 3D. Mecenat-spawn (rad 960–989)
Genererar ny mecenat med sannolikhet 15% i omgång 6–18. 29 rader.
**Naturlig processor:** `eventProcessor.ts` (spawn är en GameEvent-trigger).

### 3E. Regen-spelare (rad 796–811)
Hanterar AI-clubbars regen-spelare: filtrerar duplikat, lägger till i squads.
**Naturlig processor:** `matchSimProcessor.ts` — regenen skapas där, kan returneras som färdig state.

### 3F. Derby-notification (rad 544–591)
Genererar derby-varning + pre-match citat för kommande omgång. 47 rader.
**Naturlig processor:** `narrativeProcessor.ts` — det är en narrativ sidoeffekt, inte ekonomi/transfer.

### 3G. Marknadsvärde-tracking + inbox (rad 623–644)
15% delta → skickar inbox. Hör ihop med `updateAllMarketValues` som anropas precis ovanför.
**Naturlig processor:** ny `playerValueProcessor.ts` eller del av `statsProcessor.ts`.

### 3H. Formations-rekommendation (rad 1279–1302)
Räknar ut och notifierar vid ny rekommendation. 23 rader.
**Naturlig processor:** `mediaProcessor.ts` (coaching-råd är en medialiknande notifikation) eller `trainingProcessor.ts`.

---

## 4. Föreslagna nya snittpunkter

### Snitt 1: `playerLifecycleProcessor.ts`
Samlar allt som rör spelare mellan matcher (kaptensmoral, spelarutveckling, chemistry, marknadsvärden + tracking). Ersätter inline-stegen 3A, 3B, 3G.

**Input:**
```typescript
{
  game: SaveGame,
  simulatedFixtures: Fixture[],
  trainingPlayers: Player[],
  startersThisRound: Set<string>,
  benchThisRound: Set<string>,
  standings: Standing[],
  nextMatchday: number,
  baseSeed: number,
}
```
**Output:**
```typescript
{
  finalPlayers: Player[],
  chemistryStats: Record<string, number>,
  newPrevValues: Record<string, number>,
  inboxItems: InboxItem[],
  moments: Moment[],
}
```
**Tester som följer med:** `playerStateProcessor.test.ts` (om den finns), plus de tester som testar morale-kaskad.

---

### Snitt 2: `transferLifecycleProcessor.ts`
Samlar `processTransferBids`, `processLoans`, transfer-exekvering och mecenat cost-share (steg 3C + 3E parts).

**Input:**
```typescript
{
  game: SaveGame,
  availabilityUpdatedPlayers: Player[],
  clubs: Club[],
  nextMatchday: number,
  newDate: string,
  localRand: () => number,
}
```
**Output:**
```typescript
{
  postTransferPlayers: Player[],
  postTransferClubs: Club[],
  updatedLoanDeals: LoanDeal[],
  allBids: TransferBid[],
  resolvedBids: TransferBid[],
  newBids: TransferBid[],
  sponsorNetworkMoodDelta: number,
  inboxItems: InboxItem[],
  moments: Moment[],
}
```
**Tester som följer med:** befintliga transferService-tester.

---

### Snitt 3: `preRoundContextProcessor.ts` (liten hjälpare)
Räknar ut `isSecondPassForManagedMatch`, `nextMatchday`, `isCupRound`, `isPlayoffRound`, `currentLeagueRound` — all kontext som idag beräknas inline i 60+ rader kod i toppen av funktionen.

**Input:** `game: SaveGame, seed?: number`
**Output:** `RoundContext` — ett DTO med alla beräknade värden.

Inga sidoeffekter. Enkelt att testa i isolation.

---

### Snitt 4: Utbrytning av `derbyNotificationProcessor.ts` (alternativt: in i narrativeProcessor)
Derby-varning + pre-match citat (steg 3F) är 47 rader som beror på `finalAllFixtures` (behöver vara klar). Kan antingen bli en separat processor eller ett extra anrop till `narrativeProcessor`.

---

## 5. Riskbedömning

### Svårast att bryta ut (mest kopplat)

**Transfer-exekvering (3C)** — 112 rader med implicit beroende på `postTransferPlayers`/`postTransferClubs` som muteras i en loop. Logiken refererar till `preEventGame`, `game.mecenater`, `game.supporterGroup`, och producerar `newMoments` + `sponsorNetworkMoodDelta`. Svårt att isolera utan att skicka med ett stort input-objekt. Risk: det finns 3 logikblock i loopen (nemesis, cost-share, sponsor-reaktion) som inte är testade i isolation.

**SaveGame-assembly (rad 1024–1131)** — 107 rader spread-literal som sammanställer alla delresultat. Kan inte brytas ut som processor; det är funktionens kärna. Enklast att lämna intakt.

**Rekursivt auto-advance playoff (rad 1224–1233)** — anropar sig själv. Svårt att extrahera utan att förstå hela loop-kontraktet. Lämna intakt.

### Lättast att bryta ut (isolerade, redan testbara)

**`preRoundContextProcessor.ts` (Snitt 3)** — Ren beräkning, inga sidoeffekter, inga externa beroenden. Kan extraheras och testas trivialt. Minskar roundProcessor med ~60 rader.

**Halvtidssummering + onboarding + formations-rekommendation (rad 1235–1302)** — 67 rader med tre oberoende `if`-satser. Kan samlas i ett `applyPostRoundFlags(updatedGame, context)` anrop.

**Captain morale cascade (3A)** — 22 rader, klart begränsat scope. Kan läggas sist i `playerStateProcessor.ts` som ett tillval.

**Derby-notification (3F)** — 47 rader, beror bara på `finalAllFixtures` + `game`. Kan extraheras direkt.

---

## 6. Observerat mönster: `isSecondPassForManagedMatch`-guard

Sju processors anropas villkorligt med `isSecondPassForManagedMatch`:

- `trainingProcessor` — skip
- `processEconomy` — skip
- `processSponsors` — skip
- `checkContextualSponsors` — skip
- `applyOneTimeKommunstod` — skip
- Mecenat-spawn — skip
- `processMedia` — skip

Nuvarande implementation: varje processor-anrop wrappas separat med ett ternary. Konsekvens: om en ny processor läggs till och man glömmer guarden → double side-effects. Bättre: skicka in `isSecondPass: boolean` till ett top-level `RoundContext`-objekt (Snitt 3 ovan) och låt varje processor besluta själv, eller filter:a processorer i ett `runIfFirstPass()`-wrapper.

---

*Skrivet av Code, 2026-04-24. Underlag för Opus refactor-spec.*
