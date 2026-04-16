# SPEC: Player Arc Controller

**Datum:** 9 april 2026 (uppdaterad efter Codes feature-push)  
**Typ:** Ny feature — Code  
**Berör:** Ny service + SaveGame entity + roundProcessor hook + presskonferens-integration  
**Bygger på:** Codes trait-vikter i match, transfer-spekulationsinkorg, derby H2H-kort, "Säsongens stunder"

---

## Vad Code redan gjort (rör det inte)

1. **Trait-vikter i matchmotorn** — `hungrig` ×1.4 målchans, `joker` 30% ×2.8 / 70% ×0.6. Arcs rör INTE matchmotorn.
2. **Transfer-spekulationsinkorg** — 40% chans per omgång att generera inbox-meddelande vid olöst bud. Arc-systemet bygger OVANPÅ detta.
3. **Derby pre-match** — H2H i NextMatchCard + pre-derby inbox. Arc-systemet hanterar bara POST-match echo.
4. **Säsongens stunder** — SeasonSummaryScreen visar 5 matchögonblick rankade efter impact. Arc-resolutioner matar IN i detta system.

---

## Sammanfattning

Traits påverkar nu matcher (Code). Men spelaren fattar inga BESLUT kring dem. Arc controllern skapar beslutspunkter: trait + situation → 3-6 omgångars narrativ → val → konsekvens → minne.

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
  | 'contract_drama'          // Bygger på Codes transfer-spekulationsinkorg
  | 'derby_echo'              // POST-derby efterdyningar (2 omgångar)

export interface ActiveArc {
  id: string
  type: ArcType
  playerId?: string
  opponentClubId?: string     // derby_echo
  startedMatchday: number
  phase: 'building' | 'peak' | 'resolving'
  eventsFired: string[]       // event IDs redan genererade
  decisionsMade: string[]     // choice IDs spelaren valt
  expiresMatchday: number
  data?: Record<string, unknown>
}
```

Lägg till i SaveGame:

```typescript
activeArcs?: ActiveArc[]
```

---

## 2. Ny fil: `src/domain/services/arcService.ts`

### 2.1 Trigger-detektion

Max 2 aktiva arcs samtidigt (derby_echo undantaget). Max 1 arc per spelare.

```typescript
export function detectArcTriggers(game: SaveGame, justCompletedFixture?: Fixture): ActiveArc[]
```

**Triggerregler (uppdaterade):**

| Arc | Trigger | Relation till Codes features |
|-----|---------|------------------------------|
| `hungrig_breakthrough` | `trait === 'hungrig'`, ålder ≤ 21, 3+ matcher utan mål | Codes trait-vikter gör att genombrott KAN ske (×1.4), men arcs ger spelaren KONTROLL via beslut |
| `joker_redemption` | `trait === 'joker'`, just completed fixture har utvisning/eget mål av spelaren | Codes ×2.8/×0.6 skapar dramat i matchen, arcen ger konsekvenserna mellan matcher |
| `veteran_farewell` | `trait === 'veteran'`, 30+, kontrakt ut denna säsong, omgång ≥ 15 | Nytt — ingen överlapp |
| `ledare_crisis` | `trait === 'ledare'` ELLER kapten, förlustsvit ≥ 3 | Nytt — ingen överlapp |
| `lokal_hero` | `trait === 'lokal'`, mål i just spelat derby | Codes derby-kort visar H2H, arcs ger karaktären en story |
| `contract_drama` | Codes transfer-inkorg har genererat ≥ 2 spekulationsmeddelanden om SAMMA spelare + form > 65 | **Bygger PÅ** Codes feature — triggar först när passiv drama redan existerar, eskalerar till aktiv beslutspunkt |
| `derby_echo` | Just spelat derby (getRivalry ≠ null) | **Bara post-match.** Codes pre-match H2H + inbox hanterar uppbyggnaden. Arc = efterdyningar. |

### 2.2 Fas-progression

```typescript
export function progressArcs(game: SaveGame, justCompletedFixture?: Fixture): {
  updatedArcs: ActiveArc[]
  newEvents: GameEvent[]
  newStorylines: StorylineEntry[]
  newSeasonMoments: Array<{ type: string; headline: string; body: string; matchday: number; relatedPlayerId?: string }>
}
```

**NYTT vs tidigare spec:** `newSeasonMoments` — arc-resolutioner genererar moment som matas in i Codes "Säsongens stunder". Format matchar Codes befintliga storyTriggers-format.

Tre faser:

**building** (1-2 omgångar): DailyBriefing-hint. Inget val.

**peak** (1-2 omgångar): `pendingEvent` med 2-3 val. Presskonferens 40% arc-aware fråga.

**resolving** (1 omgång): Konsekvens. StorylineEntry + seasonMoment om resolution var dramatisk.

### 2.3 Arc-specifika events

#### hungrig_breakthrough

- **building:** DailyBriefing: "🔥 {namn} har inte gjort mål på {N} matcher. Publiken väntar."
- **peak:** Event: "{Journalist}: Tror du fortfarande på {namn}?"
  - Val 1: "Han får tiden han behöver" → morale +5
  - Val 2: "Han måste leverera nu" → morale −5, form +10 (adrenalinkick)
  - Val 3: "Vi har andra alternativ" → morale −15
- **resolving:** Om spelaren gör mål inom 3 omgångar (Codes ×1.4 hungrig-vikt ökar sannolikheten) → StorylineEntry + seasonMoment "🔥 {namn} bröt isen". Om inte → tyst resolve.

#### joker_redemption

- **building:** Inbox: "📰 {journalist}: '{namn} — geni eller risk?'"
- **peak:** Event: "Styrelsen frågar om {namn}"
  - Val 1: "Jag tror på honom" → morale +8
  - Val 2: "Bänka tills vidare" → morale −10
- **resolving:** Om spelaren avgör nästa match (Codes ×2.8 joker-bonus kan slå till) → StorylineEntry `joker_vindicated` + seasonMoment. Om bänkad → tyst.

#### veteran_farewell

- **building:** DailyBriefing: "🏅 {namn}s kontrakt går ut. {N} säsonger i klubben."
- **peak:** Event: presskonferens: "'Hur ser framtiden ut för {namn}?'"
  - Val 1: "Han är en legend — vi förlänger" → trigger kontraktsförhandling
  - Val 2: "Alla goda ting har ett slut" → morale −20
  - Val 3: "Vi utvärderar efter säsongen" → ingen effekt
- **resolving:** Vid säsongsslut — om förlängd: StorylineEntry `veteran_stayed`. Om inte: StorylineEntry `veteran_farewell` + emotionellt inbox + seasonMoment.

#### ledare_crisis

- **building:** Inbox: "Kaptenen har samlat spelarna till möte."
- **peak:** Event: "Kaptenen vill prata"
  - Val 1: "Ge honom ordet" → om lagets form > 40: morale +10 alla. Om form < 40: morale +3 (orden räcker inte).
  - Val 2: "Jag sköter det" → morale +0, kaptenens lojalitet −2
- **resolving:** StorylineEntry `captain_rallied_team` (redan existerande typ).

#### lokal_hero

- **building:** DailyBriefing: "🏠 Hela orten pratar om {namn}s derby-mål."
- **peak:** Inbox: "📰 {lokaltidning}: '{namn} — ortens hjälte'" + communityStanding +3
- **resolving:** Auto-resolve. seasonMoment om det var derbymål.

#### contract_drama

**Triggar BARA om Codes transfer-spekulationsinkorg redan genererat ≥ 2 meddelanden för samma spelare.**

- **building:** Ingen extra output (Codes inkorg täcker det).
- **peak:** Event: "{Spelare} ber om ett möte"
  - Val 1: "Erbjud förlängning nu" → öppnar förhandling, spekulationer upphör
  - Val 2: "Vänta till säsongsslut" → risk att spelaren tappar morale, 30% chans att rival lägger bud
  - Val 3: "Du får gå" → morale −25, transferlista
- **resolving:** Baserat på val + utfall → StorylineEntry + seasonMoment vid dramatisk upplösning.

#### derby_echo

**Bara POST-match. Codes pre-match H2H + inbox hanterar uppbyggnaden.**

- **building:** Direkt efter derby. communityStanding +5 (vinst) / −3 (förlust). fanMood +8 / −5.
- **peak:** Inbox: "📰 {lokaltidning}: '{headline}'" — t.ex. "Derbyseger ger hela orten energi" / "Tung förlust — men nästa gång..."
- **resolving:** Auto-resolve efter 2 omgångar. DailyBriefing refererar till derbyt en omgång efter ("Efterdyningarna av derbyt märks fortfarande").

---

## 3. Hook i roundProcessor.ts

EFTER `updateTrainerArc` och `processCommunity`, FÖRE return:

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

---

## 4. Presskonferens-integration

I `pressConferenceService.ts`, FÖRE befintliga storyline-aware overrides:

```typescript
const peakArcs = (game.activeArcs ?? []).filter(a => a.phase === 'peak' && a.playerId)
if (rand() < 0.40 && peakArcs.length > 0) {
  const arc = peakArcs[0]
  const arcPlayer = game.players.find(p => p.id === arc.playerId)
  if (arcPlayer) {
    const arcQuestions: Partial<Record<ArcType, string>> = {
      hungrig_breakthrough: `${arcPlayer.firstName} ${arcPlayer.lastName} har det tungt. Tror du fortfarande på honom?`,
      joker_redemption: `${arcPlayer.firstName} ${arcPlayer.lastName} delar fansen. Kostar han mer än han ger?`,
      veteran_farewell: `Blir det här ${arcPlayer.firstName} ${arcPlayer.lastName}s sista säsong?`,
      contract_drama: `Rykten säger att ${arcPlayer.firstName} ${arcPlayer.lastName} kan lämna. Kommentar?`,
    }
    const q = arcQuestions[arc.type]
    if (q) question = { text: q, preferIds: question.preferIds }
  }
}
```

---

## 5. Säsongssammanfattning — integration med Codes "Säsongens stunder"

**INTE ett parallellt system.** Arc-resolutioner genererar samma format som Codes befintliga stunder.

I `seasonSummaryService.ts` eller var "Säsongens stunder" genereras:

Efter Codes impact-rankade matchmoment, lägg till resolved arcs:

```typescript
const resolvedArcStories = (game.storylines ?? []).filter(s =>
  s.season === game.currentSeason &&
  ['hungrig_breakthrough', 'joker_vindicated', 'veteran_farewell', 'veteran_stayed',
   'lokal_hero_moment', 'captain_rallied_team'].includes(s.type as string)
)
for (const arc of resolvedArcStories) {
  if (moments.length >= 7) break  // max 7 stunder (5 match + 2 arc)
  moments.push({
    type: arc.type,
    headline: arc.displayText,
    body: arc.description,
    matchday: arc.matchday,
    impact: 80,  // arcs rankas högt men under hattricks/derbysegrar
    relatedPlayerId: arc.playerId,
  })
}
// Re-sort by impact
moments.sort((a, b) => b.impact - a.impact)
moments = moments.slice(0, 7)
```

**OBS:** Kolla exakt format i Codes implementation. Ovanstående är konceptuellt — anpassa fältnamn till vad Code faktiskt byggt.

---

## 6. DailyBriefing-integration

I `dailyBriefingService.ts`, ny prioritet (mellan derby och form):

```typescript
const buildingArc = (game.activeArcs ?? []).find(a => a.phase === 'building' && a.playerId)
if (buildingArc) {
  const arcPlayer = game.players.find(p => p.id === buildingArc.playerId)
  if (arcPlayer) {
    const texts: Partial<Record<ArcType, string>> = {
      hungrig_breakthrough: `🔥 ${arcPlayer.firstName} ${arcPlayer.lastName} har inte gjort mål på ${buildingArc.data?.gamesWithoutGoal ?? '?'} matcher.`,
      veteran_farewell: `🏅 ${arcPlayer.firstName} ${arcPlayer.lastName}s kontrakt går ut. ${arcPlayer.age} år i klubben.`,
      contract_drama: `📋 ${arcPlayer.firstName} ${arcPlayer.lastName} i blåsväder — kontraktet löper ut.`,
      lokal_hero: `🏠 Hela orten pratar om ${arcPlayer.firstName} ${arcPlayer.lastName}.`,
    }
    const t = texts[buildingArc.type]
    if (t) return { text: t, navigateTo: { path: '/game/squad', state: { highlightPlayer: arcPlayer.id } } }
  }
}
```

---

## 7. Saker att INTE göra

- **Rör inte matchmotorn.** Code har lagt trait-vikter. Arcs påverkar morale/form — det räcker.
- **Rör inte NextMatchCard.** Code har lagt derby H2H. Arcs hanterar bara post-match.
- **Rör inte transfer-inkorgen.** Code genererar spekulationsmeddelanden. `contract_drama` BYGGER PÅ dessa (triggar efter ≥ 2 meddelanden), ersätter dem inte.
- **Skapa inte parallell "Stunder"-sektion.** Mata in i Codes befintliga system.
- **Max 2 aktiva arcs + derby_echo.** Mer = noise.

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
- [ ] derby_echo: communityStanding ändras, fanMood ändras, inbox, auto-resolve efter 2 omgångar
- [ ] Resolved arcs syns i "Säsongens stunder" (max 7 totalt)
- [ ] contract_drama triggar INTE förrän Codes spekulationsinkorg genererat ≥ 2 meddelanden

---

## 9. Implementationsordning

1. Entity (`ActiveArc` + `ArcType` i Narrative.ts, `activeArcs` i SaveGame)
2. `arcService.ts` — `detectArcTriggers` + `progressArcs`
3. roundProcessor hook (efter trainer arc, före return)
4. DailyBriefing-integration
5. Presskonferens-integration
6. Säsongssammanfattning — mata in i Codes "stunder"
7. Testa ett komplett flöde

Committa per steg. `npm run build && npm test` efter varje.
