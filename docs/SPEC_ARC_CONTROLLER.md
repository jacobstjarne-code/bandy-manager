# SPEC: Player Arc Controller

**Datum:** 9 april 2026  
**Typ:** Ny feature — Code  
**Berör:** Ny service + SaveGame entity + roundProcessor hook + presskonferens-integration  
**Krockar INTE med:** pep-talk (separat CTA-text), dead file cleanup, transfer-inbox (inbox-notiser ≠ arc-events)

---

## Sammanfattning

Spelet har traits (veteran, hungrig, ledare, lokal, joker) och storylines men de kopplar inte ihop. Traits är etiketter — de genererar inga händelser, kräver inga beslut, skapar inga minnen.

Arc controllern detekterar när trait + situation skapar ett narrativt tillfälle, driver det genom 2-3 beslutspunkter över 3-6 omgångar, och resolver det till en StorylineEntry som matar säsongssammanfattningen.

---

## 1. Ny entity: ActiveArc

Lägg till i `src/domain/entities/Narrative.ts`:

```typescript
export type ArcType =
  | 'hungrig_breakthrough'    // Ung hungrig spelare som kämpar för genombrott
  | 'joker_redemption'        // Joker som kostar/räddar — oförutsägbar
  | 'veteran_farewell'        // Veteran med utgående kontrakt, sista säsongen?
  | 'ledare_crisis'           // Kapten/ledare under krisperiod
  | 'lokal_hero'              // Lokalhjälte som gör något stort
  | 'contract_drama'          // Spelare med utgående kontrakt + hög form
  | 'derby_echo'              // Post-derby efterdyningar (2 omgångar)

export interface ActiveArc {
  id: string
  type: ArcType
  playerId?: string           // de flesta arcs knutna till spelare
  opponentClubId?: string     // derby_echo knutet till rival
  startedMatchday: number
  phase: 'building' | 'peak' | 'resolving'
  eventsFired: string[]       // event IDs redan genererade
  decisionsMade: string[]     // choice IDs spelaren valt
  expiresMatchday: number     // auto-resolve om inget händer
  data?: Record<string, unknown>  // arc-specifik data (t.ex. derbyresultat)
}
```

Lägg till i SaveGame:

```typescript
activeArcs?: ActiveArc[]
```

---

## 2. Ny fil: `src/domain/services/arcService.ts`

### 2.1 Trigger-detektion

Körs varje omgång EFTER matchsimulering. Max 2 aktiva arcs samtidigt (annars översvämning).

```typescript
export function detectArcTriggers(game: SaveGame, justCompletedFixture?: Fixture): ActiveArc[]
```

**Triggerregler:**

| Arc | Trigger | Krav |
|-----|---------|------|
| `hungrig_breakthrough` | Hungrig spelare, ålder ≤ 21, 3+ matcher utan mål | `trait === 'hungrig'`, ej redan aktiv arc på spelaren |
| `joker_redemption` | Joker som fick utvisning ELLER orsakade mål emot | `trait === 'joker'`, just completed fixture har event med spelaren |
| `veteran_farewell` | Veteran 30+ med kontrakt som går ut denna säsong | `trait === 'veteran'`, `contractUntilSeason <= currentSeason`, omgång ≥ 15 |
| `ledare_crisis` | Ledare/kapten under förlustsvit (3+) | `trait === 'ledare'` ELLER `captainPlayerId`, standing.losses − standing.wins ≥ 3 |
| `lokal_hero` | Lokal spelare gör mål i derby ELLER POTM i stor vinst | `trait === 'lokal'`, just completed fixture = derby + mål AV spelaren |
| `contract_drama` | Spelare med `availability === 'contract_expiring'`, form > 65, CA > 55 | Ej character player (undvik dubblering med veteran_farewell) |
| `derby_echo` | Just spelat derby | justCompletedFixture + `getRivalry()` ≠ null |

**Begränsning:** Max 1 arc per spelare. Max 2 aktiva arcs totalt. Derby-echo räknas inte mot limiten.

### 2.2 Fas-progression

```typescript
export function progressArcs(game: SaveGame, justCompletedFixture?: Fixture): {
  updatedArcs: ActiveArc[]
  newEvents: GameEvent[]
  newStorylines: StorylineEntry[]
}
```

Varje arc har 3 faser:

**building** (1-2 omgångar): Scensättning. Genererar ett inbox-meddelande eller en DailyBriefing-hint. Ingen beslutspunkt.

**peak** (1-2 omgångar): Beslutspunkten. Genererar ett `pendingEvent` med 2-3 val. Pressfrågor triggas om journalisten matchar (befintlig storyline-aware logik i pressConferenceService).

**resolving** (1 omgång): Konsekvens baserad på spelarens prestationer + dina val. Genererar en StorylineEntry + inbox-meddelande.

**Auto-resolve:** Om `expiresMatchday` passeras utan att peak nåtts, resolva tyst (ingen StorylineEntry, bara cleanup).

### 2.3 Arc-specifika events

Varje arc-typ har event-templates. Nedan exempel — fullständig text skrivs i implementationen.

#### hungrig_breakthrough

- **building:** DailyBriefing: "🔥 {namn} har inte gjort mål på {N} matcher. Pressen börjar fråga."
- **peak:** Event: "{Journalist}: Tror du fortfarande på {namn}?"
  - Val 1: "Han får tiden han behöver" → morale +5, +15% målchans nästa 3 matcher
  - Val 2: "Han måste leverera nu" → morale −5, +25% målchans nästa match (press)
  - Val 3: "Vi har andra alternativ" → morale −15, bench hint
- **resolving:** Om spelaren gör mål inom 3 omgångar → StorylineEntry `hungrig_breakthrough` + inbox "🔥 {namn} bröt isen!". Om inte → tyst resolve.

#### joker_redemption

- **building:** Inbox: "📰 {journalist}: '{namn} kostar laget poäng — hur länge har tränaren tålamod?'"
- **peak:** Event: "Styrelsen frågar om {namn}"
  - Val 1: "Jag tror på honom" → morale +8, joker trait kvar
  - Val 2: "Bänka tills vidare" → morale −10, bench
- **resolving:** Om spelaren gör något avgörande (mål/assist i nästa 3 matcher) → StorylineEntry `joker_vindicated`. Om bänkad → tyst resolve.

#### veteran_farewell

- **building:** DailyBriefing: "🏅 {namn}s kontrakt går ut. {N} säsonger i klubben."
- **peak:** Event: "Presskonferens: 'Hur ser framtiden ut för {namn}?'"
  - Val 1: "Han är en legend — vi förlänger" → trigger kontraktsförhandling
  - Val 2: "Alla goda ting har ett slut" → morale −20 men ärlig
  - Val 3: "Vi utvärderar efter säsongen" → diplomatiskt, ingen effekt
- **resolving:** Vid säsongsslut — om förlängd: StorylineEntry `veteran_stayed`. Om inte: StorylineEntry `veteran_farewell` + emotionellt inbox-meddelande.

#### derby_echo

- **building:** Direkt efter derby. communityStanding +5/−5 beroende på resultat.
- **peak:** Inbox: "📰 {lokaltidning}: '{headline baserat på resultat}'"
- **resolving:** Nästa omgång. fanMood-boost/dip. Om vinst: DailyBriefing refererar till det 2 omgångar. Auto-resolve.

---

## 3. Hook i roundProcessor.ts

EFTER `updatedGame` byggs (ca rad 380), FÖRE `return`:

```typescript
import { detectArcTriggers, progressArcs } from '../../domain/services/arcService'

// ── Arc processing ──
const existingArcs = updatedGame.activeArcs ?? []
const newTriggers = detectArcTriggers(updatedGame, justCompletedManagedFixture)
const allArcs = [...existingArcs, ...newTriggers]
const arcResult = progressArcs({ ...updatedGame, activeArcs: allArcs }, justCompletedManagedFixture)

updatedGame = {
  ...updatedGame,
  activeArcs: arcResult.updatedArcs,
  pendingEvents: [...(updatedGame.pendingEvents ?? []), ...arcResult.newEvents],
  storylines: [...(updatedGame.storylines ?? []), ...arcResult.newStorylines],
}
```

**VIKTIGT:** Placera EFTER `updateTrainerArc` och EFTER `processEconomy`/`processCommunity` — arcs behöver uppdaterad standing och fanMood.

---

## 4. Presskonferens-integration

I `pressConferenceService.ts`, den befintliga storyline-aware question override-sektionen (rad ~290, `if (rand() < 0.30 && storylines.length > 0)`):

**Utöka** med arc-aware frågor:

```typescript
// Arc-aware press question (40% chance if active arc in peak phase)
const peakArcs = (game.activeArcs ?? []).filter(a => a.phase === 'peak' && a.playerId)
if (rand() < 0.40 && peakArcs.length > 0) {
  const arc = peakArcs[0]
  const arcPlayer = game.players.find(p => p.id === arc.playerId)
  if (arcPlayer) {
    switch (arc.type) {
      case 'hungrig_breakthrough':
        question = { text: `${arcPlayer.firstName} ${arcPlayer.lastName} har det tungt. Tror du fortfarande på honom?`, preferIds: question.preferIds }
        break
      case 'joker_redemption':
        question = { text: `${arcPlayer.firstName} ${arcPlayer.lastName} delar fansen. Kostar han mer än han ger?`, preferIds: question.preferIds }
        break
      case 'veteran_farewell':
        question = { text: `Blir det här ${arcPlayer.firstName} ${arcPlayer.lastName}s sista säsong?`, preferIds: question.preferIds }
        break
      case 'contract_drama':
        question = { text: `Rykten säger att ${arcPlayer.firstName} ${arcPlayer.lastName} kan lämna. Kommentar?`, preferIds: question.preferIds }
        break
    }
  }
}
```

Placera FÖRE den befintliga `if (rand() < 0.30 && storylines.length > 0)` — arcs har prioritet.

---

## 5. Säsongssammanfattning

I `seasonSummaryService.ts`, `generateStoryTriggers()`:

Lägg till i slutet, EFTER befintliga triggers:

```typescript
// Resolved arcs from this season
const resolvedArcs = (game.storylines ?? []).filter(s =>
  s.season === game.currentSeason &&
  ['hungrig_breakthrough', 'joker_vindicated', 'veteran_farewell', 'veteran_stayed', 'lokal_hero_moment', 'contract_drama_resolved'].includes(s.type as string)
)
for (const arc of resolvedArcs) {
  if (triggers.length >= 6) break
  const player = arc.playerId ? game.players.find(p => p.id === arc.playerId) : null
  if (player) {
    triggers.push({
      type: 'comebackKing' as any, // reuse existing type, or add new
      headline: arc.displayText,
      body: arc.description,
      relatedPlayerId: arc.playerId,
    })
  }
}
```

---

## 6. DailyBriefing-integration

I `dailyBriefingService.ts`, `generateBriefing()`:

Lägg till en ny prioritet (mellan derby-check och form-check):

```typescript
// Active arc in building phase
const buildingArc = (game.activeArcs ?? []).find(a => a.phase === 'building' && a.playerId)
if (buildingArc) {
  const arcPlayer = game.players.find(p => p.id === buildingArc.playerId)
  if (arcPlayer) {
    switch (buildingArc.type) {
      case 'hungrig_breakthrough':
        return { text: `🔥 ${arcPlayer.firstName} ${arcPlayer.lastName} har inte gjort mål på ${buildingArc.data?.gamesWithoutGoal ?? '?'} matcher.`, navigateTo: { path: '/game/squad', state: { highlightPlayer: arcPlayer.id } } }
      case 'veteran_farewell':
        return { text: `🏅 ${arcPlayer.firstName} ${arcPlayer.lastName}s kontrakt går ut. ${arcPlayer.age} år och ${(arcPlayer.careerStats?.seasonsPlayed ?? 1)} säsonger i klubben.`, navigateTo: { path: '/game/squad', state: { highlightPlayer: arcPlayer.id } } }
      case 'contract_drama':
        return { text: `📋 ${arcPlayer.firstName} ${arcPlayer.lastName} i blåsväder. Kontraktet löper ut — flera klubbar bevakar.`, navigateTo: { path: '/game/transfers' } }
    }
  }
}
```

---

## 7. Saker att INTE göra

- **Rör inte matchmotorn.** Arcs påverkar morale och form — det räcker. Ingen "arc-aware" målgenerering.
- **Rör inte transferService.** `contract_drama` genererar events via pendingEvents, inte via transfer-logiken. Codes transfer-inbox-arbete (InboxItemType-notiser) är separat och kompletterande.
- **Max 2 aktiva arcs.** Mer = noise. Derby-echo är undantag (auto-resolve efter 2 omgångar).
- **Inga nya StorylineTypes ännu.** Använd befintliga typer där det går. Om en ny typ behövs, lägg till den i Narrative.ts — men bara om den behövs för resolution.

---

## 8. Verifiering

```bash
npm run build && npm test
```

Starta nytt spel. Spela 5-6 omgångar. Bekräfta:
- [ ] Minst 1 arc triggad (hungrig eller joker mest troligt)
- [ ] DailyBriefing visar arc-text i building-fas
- [ ] Event dyker upp i GranskaScreen i peak-fas
- [ ] Presskonferens frågar om arc-spelaren (40% chans)
- [ ] StorylineEntry skapas vid resolution
- [ ] Max 2 aktiva arcs (exkl derby-echo)
- [ ] Derby-echo: communityStanding ändras, inbox-meddelande, auto-resolve

---

## 9. Implementationsordning

1. Entity (`ActiveArc` i Narrative.ts, `activeArcs` i SaveGame)
2. `arcService.ts` — `detectArcTriggers` + `progressArcs`
3. roundProcessor hook
4. DailyBriefing-integration
5. Presskonferens-integration
6. Säsongssammanfattning-integration
7. Testa ett komplett flöde

Committa per steg. `npm run build && npm test` efter varje.
