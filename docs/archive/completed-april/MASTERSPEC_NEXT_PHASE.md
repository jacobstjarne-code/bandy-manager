# MASTERSPEC — Bandy Manager Next Phase

**Datum:** 15 april 2026  
**Författare:** Jacob + Claude Opus  
**Scope:** Arkitektur, gameplay, narrativ, polish  
**Mockups:** `docs/mockups/masterspec_mockups.html` och `docs/mockups/playercard_2_mockups.html`

**STATUS:** Spelarkort 2.0 redan implementerat. Sprint 1 (matchCore) påbörjad.

---

## SAMMANFATTNING

Bandy Manager har en solid arkitektur, djup domänkunskap och en fungerande spelkärna. Det stora problemet är inte att saker saknas — det är att system som redan finns inte pratar med varandra. Denna spec adresserar sex områden i prioritetsordning:

1. **Enhetlig matchmotor** — slå ihop tre motorer till en
2. **Systemkorsningar** — THE BOMB: system som refererar varandra
3. **Döda system väcks** — storylines, journalist, mecenater, anläggningar, säsongsfaser
4. **Omgångssammanfattning som narrativ höjdpunkt** — GranskaScreen 2.0
5. **Säsongens rytm** — faser som KÄNNS
6. **Restlista** — buggar och polish

---

## 1. ENHETLIG MATCHMOTOR

### Problem

Tre separata matchmotorer underhålls parallellt:

| Motor | Fil | Rader | Används av |
|-------|-----|-------|-----------|
| `matchEngine.ts` | AI-snabbsim | ~350 | roundProcessor (alla AI-matcher) |
| `matchStepByStep.ts` | Live steg-för-steg | ~900 | MatchLiveScreen (managed matcher) |
| `matchSecondHalf.ts` | Andra halvlek | ~200 | MatchLiveScreen (efter halvtid) |

Problemen:
- Dubblerad logik: goalThreshold-beräkningar, cornerChance, foulProbability, suspensionTimers finns i alla tre
- Kalibreringskonstanter DIVERGERAR mellan motorerna (matchEngine.ts fick uppdaterade värden 14 april, matchStepByStep.ts har äldre)
- Nya features (counter-interaction, free-kick-interaction, last-minute-press) finns BARA i matchStepByStep
- matchSecondHalf.ts duplicerar ~80% av matchStepByStep med annorlunda initialstate

### Beslut: matchEngine-konstanterna gäller

Snittet 10 mål/match gäller för ALLA matcher — live och sim. Tre skäl:
1. Bandys dramatik ligger i mångmålighet, ledbyten, comebacks. Live-matcher har redan spänningsmoment via interaktioner.
2. Konsistens förhindrar system-gaming (sim vs live ger olika statistik).
3. matchEngine-värdena är kalibrerade mot 1124 verkliga Elitseriematcher.

### Matchprofiler — varians utan att bryta snittet

Snittet 10 mål/match är ett statistiskt utfall per säsong — INTE ett mål per match. Individuella matcher ska variera dramatiskt. Introducera matchprofiler:

```typescript
type MatchProfile = 'defensive_battle' | 'standard' | 'open_game' | 'chaotic'

// Viktat utfall → snitt ~10 mål/match
const PROFILE_CONFIG: Record<MatchProfile, { weight: number; goalMod: number; approxGoals: number }> = {
  defensive_battle: { weight: 0.20, goalMod: 0.60, approxGoals: 6 },
  standard:         { weight: 0.55, goalMod: 1.00, approxGoals: 10 },
  open_game:        { weight: 0.20, goalMod: 1.40, approxGoals: 14 },
  chaotic:          { weight: 0.05, goalMod: 1.80, approxGoals: 18 },
}
// E[mål] = 0.20×6 + 0.55×10 + 0.20×14 + 0.05×18 = 10.2 ✓
```

Kontext skever profil-sannolikheten:

| Kontext | Effekt |
|---------|--------|
| Dåligt väder (snö/töväder) | +15% defensive_battle |
| Båda lag defensiv taktik | +20% defensive_battle |
| Derby (rivalitet) | +10% chaotic |
| Slutspelsmatch | +15% defensive_battle |
| Stor CA-skillnad (>15) | +15% open_game |
| Vinstsvit vs förlusthål | +10% open_game |

Arc-systemet (getSecondHalfMode) reagerar på profilen — defensive_battle gör att trailing-laget switchar till chasing tidigare, vilket kan öppna upp matchen och ge dramatik.

En 1–0-seger i en defensive_battle och en 8–5-thriller i open_game känns helt olika att spela, men säsongens snitt håller sig kring 10.

### Lösning: En generator, tre konsumenter

**Ny fil:** `src/domain/services/matchCore.ts`

En enda `function* simulateMatchCore(input)` generator som:
- Yieldar `MatchStep` för varje steg (exakt som matchStepByStep gör idag)
- Tar en `mode`-parameter: `'full'` (med commentary + interaktioner) eller `'fast'` (bara resultat + events)
- I `fast` mode: skippar commentary-generering, interaction-data, och atmosfär-steg
- I `full` mode: identisk med dagens matchStepByStep inklusive alla interaktioner
- Väljer matchprofil vid start och applicerar goalMod genom hela matchen

**Konsumenter:**

```
matchCore.ts (generator)
  ├── MatchLiveScreen: itererar steg-för-steg med delay (full mode)
  ├── roundProcessor: kör alla steg direkt, plockar ut fixture-data (fast mode)
  └── "Snabbsim med text": itererar alla steg, visar bara goals i feed (full mode, auto-advance)
```

### Implementation

#### Steg 1: Skapa matchCore.ts

Flytta ALL matchlogik från matchStepByStep.ts till matchCore.ts:
- `simulateMatchCore(input: MatchCoreInput): Generator<MatchStep>`
- Alla helpers (getGoalScorer, getAssistProvider, getGK, getDefendingPlayer, buildSequenceWeights)
- Alla konstanter (redan i matchUtils.ts — behåll där)
- Matchprofil-systemet (pickMatchProfile, applyContextWeighting)

```typescript
// matchCore.ts
export interface MatchCoreInput extends StepByStepInput {
  mode: 'full' | 'fast'
}

export function* simulateMatchCore(input: MatchCoreInput): Generator<MatchStep> {
  const isFast = input.mode === 'fast'

  // Pick match profile at start
  const profile = pickMatchProfile(input, rand)
  const profileGoalMod = PROFILE_CONFIG[profile].goalMod

  // ... all match logic from matchStepByStep.ts ...
  // Apply profileGoalMod to ALL goalThreshold calculations

  for (let step = 0; step < 60; step++) {
    // ... sequence resolution (identical for both modes) ...

    // Commentary: skip in fast mode
    const commentaryText = isFast ? '' : buildCommentary(...)

    // Interactions: skip in fast mode
    const cornerInteractionData = isFast ? undefined : buildCornerInteraction(...)
    const penaltyInteractionData = isFast ? undefined : buildPenaltyInteraction(...)

    yield { step, minute, events, homeScore, awayScore, commentary: commentaryText, ... }
  }
}

function pickMatchProfile(input: MatchCoreInput, rand: () => number): MatchProfile {
  // Start with base weights
  const weights = { ...BASE_PROFILE_WEIGHTS }

  // Apply context
  if (input.weather?.condition === 'heavySnow' || input.weather?.condition === 'thaw') {
    weights.defensive_battle += 0.15
    weights.standard -= 0.10
    weights.open_game -= 0.05
  }
  if (input.rivalry) {
    weights.chaotic += 0.10
    weights.standard -= 0.10
  }
  if (input.matchPhase !== 'regular') {
    weights.defensive_battle += 0.15
    weights.open_game -= 0.10
    weights.chaotic -= 0.05
  }
  // ... more context adjustments ...

  // Normalize and pick
  return weightedPickProfile(weights, rand)
}
```

#### Steg 2: matchEngine.ts → wrapper runt matchCore

```typescript
// matchEngine.ts (ersätter nuvarande ~350 rader)
import { simulateMatchCore } from './matchCore'

export function simulateMatch(input: SimulateMatchInput): SimulateMatchResult {
  const generator = simulateMatchCore({ ...input, mode: 'fast' })

  let lastStep: MatchStep | null = null
  const allEvents: MatchEvent[] = []

  for (const step of generator) {
    lastStep = step
    allEvents.push(...step.events)
  }

  // Build fixture result from accumulated state
  return buildFixtureResult(input.fixture, lastStep, allEvents, input)
}
```

#### Steg 3: Ta bort matchSecondHalf.ts

matchCore stödjer redan overtime och penalties. Halvtidspaus hanteras genom att splitta generatorn i två halvor:

```typescript
export function* simulateFirstHalf(input: MatchCoreInput): Generator<MatchStep> { /* step 0-30 */ }
export function* simulateSecondHalf(input: MatchCoreInput & SecondHalfState): Generator<MatchStep> { /* step 31-60 */ }
```

MatchLiveScreen pausar vid step 30, låter spelaren justera taktik, och skapar en ny generator för andra halvlek med uppdaterad taktik.

#### Steg 4: Kalibreringskonstanter — en sanning

Alla goalThreshold-multiplikatorer, cornerChance-formler, foulProbability-beräkningar ska finnas på ETT ställe i matchCore.ts.

Nuvarande divergens att harmonisera (ALLA ska använda matchEngine-värdena):

| Konstant | matchEngine.ts (korrekt) | matchStepByStep.ts (gammalt) |
|----------|--------------------------|------------------------------|
| homeAdvantage default | 0.14 | 0.05 |
| attack goalThreshold | × 1.05 | × 0.45 |
| transition goalThreshold | × 0.58 | × 0.28 |
| corner goalThreshold base | + 0.14 | + 0.08 |
| halfchance goalThreshold | × 0.63 | × 0.30 |

#### Steg 5: Rensa exporter

```typescript
// matchSimulator.ts — uppdatera:
export { simulateMatch } from './matchEngine'        // wrapper runt matchCore
export { simulateMatchCore } from './matchCore'       // primär export
export type { MatchStep, StepByStepInput, ... } from './matchUtils'
// Ta bort: simulateMatchStepByStep, simulateSecondHalf
```

#### Filer som berörs

| Fil | Ändring |
|-----|---------|
| `matchCore.ts` | **NY** — all matchlogik + matchprofiler |
| `matchEngine.ts` | **Rewrite** — wrapper runt matchCore |
| `matchStepByStep.ts` | **TA BORT** |
| `matchSecondHalf.ts` | **TA BORT** |
| `matchSimulator.ts` | Uppdatera exports |
| `MatchLiveScreen.tsx` | Importera matchCore |
| `matchLiveHelpers.ts` | Eventuellt uppdatera |
| `roundProcessor.ts` → `matchSimProcessor.ts` | Importera matchEngine (oförändrat API) |
| `calibrate.ts` | Verifiera alla 5 targets + profilfördelning |

#### Verifiering

1. `npm run build && npm test`
2. Kör `calibrate.ts` — alla 5 targets gröna:
   - goalsPerMatch: 10.0 ±1.5
   - cornerGoalShare: 0.232 ±0.03
   - homeWinRate: 0.507 ±0.05
   - drawRate: 0.090 ±0.03
   - secondHalfShare: 0.543 ±0.03
3. Kör 200 matcher, verifiera profilfördelning: ~20% defensive_battle, ~55% standard, ~20% open_game, ~5% chaotic
4. Verifiera att defensive_battle-matcher har signifikant lägre scoring än open_game
5. Testa MatchLiveScreen end-to-end: lineup → spela → halvtid → taktikändring → andra halvlek → resultat

---

## 2. SYSTEMKORSNINGAR — THE BOMB

Spelets system opererar i stuprör. Matchkommentarerna vet inte om spelarnas dagsjobb. Kafferummet vet inte om transfers. Presskonferensen vet inte om orten.

### 2.1 Matchkommentarer × Spelarprofiler

**Status:** Delvis implementerat i matchStepByStep.ts. Kontextuella kommentarer för academy-spelare, kapten, klackfavorit, dagsjobb, sent mål finns. Följer med automatiskt till matchCore.

**NYA kontextuella kommentarer att lägga till:**

```typescript
// Nemesis scores against us
if (nemesisTracker?.[scorerPlayerId]?.goalsAgainstUs >= 2) {
  contextual = `Honom igen! ${scorerName} — redan ${totalGoals} mål mot oss.`
}

// Player on expiring contract scores
if (scorerIsManaged && player?.contractUntilSeason <= currentSeason) {
  contextual = `MÅL! ${scorerName} — med kontrakt som löper ut. Förhandlingsläge förbättrat.`
}

// New signing's first goal
if (scorerIsManaged && player?.isNewSigning) {
  contextual = `DEBUTTMÅL! ${scorerName} gör sitt första i nya färgerna!`
}

// Hat trick
if (goalsThisMatch === 3) {
  contextual = `HATTRICK! ${scorerName} HAR GJORT TRE!`
}
```

**Ny flagga behövs:** `isNewSigning: boolean` på Player — sätts vid transfer, resetas vid säsongsstart.

### 2.2 Kafferummet × Transfers + Events

**Fil:** `coffeeRoomService.ts`

Lägg till kontextuella citat som triggas av speldata:

```typescript
const TRANSFER_EXCHANGES = [
  { trigger: 'player_sold', quotes: [
    { speaker: 'Kioskvakten', text: 'Hörde att {playerName} försvann. Vem ska göra målen nu?' },
    { speaker: 'Materialaren', text: 'En ledig krok i omklädningsrummet. Alltid konstigt de första dagarna.' },
  ]},
  { trigger: 'player_bought', quotes: [
    { speaker: 'Vaktmästaren', text: 'Ny kille i omklädningsrummet. Sa knappt hej.' },
    { speaker: 'Kassören', text: 'Ge honom en vecka. Eller tre.' },
  ]},
  { trigger: 'deadline_approaching', quotes: [
    { speaker: 'Kassören', text: 'Telefonen ringer hela tiden.' },
    { speaker: 'Ordföranden', text: 'Svara inte.' },
  ]},
  { trigger: 'losing_streak', quotes: [
    { speaker: 'Materialaren', text: 'Det är tyst i duschen efter match numera.' },
    { speaker: 'Kioskvakten', text: 'Korvförsäljningen har sjunkit. Folk stannar inte kvar efter slutsignalen.' },
  ]},
  { trigger: 'winning_streak', quotes: [
    { speaker: 'Kioskvakten', text: 'Hade slut på kaffe vid halvtid igår. Det har aldrig hänt.' },
    { speaker: 'Vaktmästaren', text: 'Grabbarna sjunger i duschen igen. Bra tecken.' },
  ]},
]
```

**Logik i getCoffeeRoomQuote:**
1. Kolla inbox för transfer-events denna omgång → trigger 'player_sold' / 'player_bought'
2. Kolla form: 3 raka förluster → 'losing_streak', 3 raka vinster → 'winning_streak'
3. Kolla omgång: 13-15 → 'deadline_approaching'
4. Fallback → befintliga slumpade citat

### 2.3 Presskonferens × Orten + Storylines

**Fil:** `pressConferenceService.ts`

Nya community-triggers i QUESTIONS-poolen:

```typescript
const COMMUNITY_QUESTIONS = [
  { id: 'cs_high', trigger: (g) => (g.communityStanding ?? 50) > 75,
    text: 'Det pratas om er i hela kommunen. Är det press eller inspiration?', minRound: 5 },
  { id: 'cs_low', trigger: (g) => (g.communityStanding ?? 50) < 35,
    text: 'Publiken sviker. Hur påverkar det laget?', minRound: 5 },
  { id: 'mecenat_joined', trigger: (g) => g.mecenater?.some(m => m.isActive && m.arrivedSeason === g.currentSeason),
    text: 'Ni har fått en ny mecenats stöd. Gör det skillnad i omklädningsrummet?', minRound: 6 },
  { id: 'facility_project', trigger: (g) => (g.facilityProjects ?? []).some(p => p.status === 'in_progress'),
    text: 'Det byggs vid arenan. Hur påverkar det koncentrationen?', minRound: 8 },
  { id: 'academy_talent', trigger: (g) => g.players.some(p => p.clubId === g.managedClubId && p.promotedFromAcademy && p.age <= 20),
    text: 'Ni har en ungdomsspelare som imponerar. Hur hanterar ni trycket på en så ung spelare?', minRound: 4 },
]
```

### 2.4 Klacken × Matchkommentarer

Redan delvis implementerat (supporter_kickoff, supporter_halfTime, supporter_late_home). Utöka i matchCommentary.ts:

```typescript
supporter_goal_home: [
  '🎵 {leader} drar igång sången! {members} röster — inte mycket, men de HÖRS!',
  '📯 Trumman ekar! Klacken exploderar!',
],
supporter_goal_conceded: [
  'Tyst från hemmasidan. {leader} klappar händerna — försöker dra igång.',
],
supporter_attendance_low: [
  '{members} modiga har kommit trots allt. {leader} gör sitt bästa.',
],
```

---

## 3. DÖDA SYSTEM VÄCKS

### 3.1 Storylines → Synliga överallt

**Problem:** 15 StorylineTypes skapas men refereras aldrig i matchkommentarer, presskonferenser, eller säsongssammanfattningar.

**Koppling A: Matchkommentarer** — redan delvis i matchStepByStep, följer med till matchCore.

**Koppling B: Säsongssammanfattning**

Ny funktion i `seasonSummaryService.ts`:
```typescript
export function generateSeasonNarrative(game: SaveGame): string[] {
  const managedStorylines = (game.storylines ?? [])
    .filter(s => {
      const player = game.players.find(p => p.id === s.playerId)
      return player?.clubId === game.managedClubId
    })
    .slice(-5)
  return managedStorylines.map(s => s.displayText)
}
```

Rendera i SeasonSummaryScreen under "📖 SÄSONGENS BERÄTTELSER" som card-round med kursiv prosa.

**Koppling C: Spelarkort — Karriärresa**

REDAN IMPLEMENTERAT i Spelarkort 2.0.

### 3.2 Journalisten → Personlighet syns

**Problem:** Namngivna journalister med persona och memory finns men påverkar inte frågorna.

**A. Visa journalist i presskonferens-header:**
```
🎤 Sven Lindkvist · Stålortsbladet · Sensationsjagare
```

**B. Persona påverkar frågornas ton:**
- sensationalist: "Kan du förklara" istället för "Hur ser du på"
- supportive: "Berätta om" istället för "Hur försvarar du"

**C. Headlines i inbox efter match:**

Ny funktion `generatePostMatchHeadline(game, fixture, journalist)` i journalistService.ts:
- sensationalist + bigWin → "STORSTILAT! Krossade motståndaren"
- sensationalist + bigLoss → "KRIS! Ny kollaps — hur länge håller tränaren?"
- supportive + loss → "Hårfint — formen är bättre än resultatet"
- analytical + win → "Effektivt av hemmalaget"

Returnerar InboxItem med type `InboxItemType.MediaHeadline`.

### 3.3 Anläggningsprojekt → Startbar

**Problem:** Spelaren kan aldrig starta nya projekt. Knappen finns inte.

**Lösning:** I ClubScreen.tsx, under "Anläggning"-tabben, visa tillgängliga projekt med starta-knapp:

```tsx
const available = getAvailableProjects(club.facilities, game.facilityProjects ?? [])

{available.map(project => (
  <div key={project.id} className="card-sharp" style={{ padding: '10px 12px', marginBottom: 4 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <p style={{ fontSize: 12, fontWeight: 600 }}>{project.name}</p>
        <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          {Math.round(project.cost / 1000)} tkr · {project.durationRounds} omgångar
          {project.requiresKommun && ' · Kräver kommunstöd'}
        </p>
      </div>
      <button onClick={() => startFacilityProject(project.id)}
        disabled={club.finances < project.cost}
        className="btn btn-copper" style={{ padding: '6px 12px', fontSize: 11 }}>
        Starta
      </button>
    </div>
  </div>
))}
```

Se mockup: `docs/mockups/masterspec_mockups.html`

### 3.4 Season Phases → Påverkar allt

**Problem:** `seasonPhases.ts` definierar faser men de används bara för funktionärscitat.

**Ny export:**
```typescript
export type SeasonPhase = 'pre_season' | 'early' | 'mid' | 'endgame' | 'playoff'

export function getSeasonPhase(leagueRound: number, isPlayoff: boolean): SeasonPhase {
  if (isPlayoff) return 'playoff'
  if (leagueRound <= 3) return 'early'
  if (leagueRound <= 11) return 'mid'
  if (leagueRound <= 18) return 'endgame'
  return 'endgame'
}
```

Koppla till: event-generering, journalist-frågor, styrelsens ton, klack-beteende, DailyBriefing-texter.

### 3.5 Club Legends → Pensionsceremoni

**Problem:** ClubLegend skapas vid pensionering men renderas inte som moment.

**Lösning:** Generera pensionsevent med val i retirementService.ts:
- "Erbjud roll som ungdomstränare" → +5 akademi-reputation
- "Erbjud roll som scout" → +3 scoutbudget
- "Tack och lycka till"

Referera i kafferummet: `"{legendName} var nere på träningen igår. Grabbarna lyssnade."`

Se mockup: `docs/mockups/masterspec_mockups.html` — pensionsceremoni-kortet.

---

## 4. OMGÅNGSSAMMANFATTNING 2.0 (GranskaScreen)

### Problem
GranskaScreen visar matchresultat + presskonferens + events + sammanfattning. Saknar:
- Andra lags resultat
- Tidningsrubriker
- Transfernyheter
- Akademi-nyheter

### Lösning

Se **mockup** `docs/mockups/masterspec_mockups.html` — sektion "GranskaScreen 2.0"

#### Layout (uppifrån och ner):

1. **Resultat-hero** (befintlig)
2. **Tidningsrubrik** (NY) — journalistens namn + persona + rubrik genererad av journalist-persona × matchresultat
3. **Nyckelmoment** (befintlig)
4. **Presskonferens inline** (befintlig — med journalist-namn + community-frågor)
5. **Andra matcher** (NY)
   - Alla omgångens resultat
   - Vinnande lag bold, förlorande muted
   - Rivalens match markerad med accent left-border
   - Sammanfattning: "Bergslagen vann — din rival avancerar till 4:a"
6. **Förändring denna omgång** (NY grid)
   - Tabell: 7→6 ↑
   - Kassa: +8.4k
   - Orten: 72→74
7. **Scouting** (NY — om rapport klar)
8. **Akademi** (NY — om P19 spelade)
9. **CTA** — "Nästa omgång →" + "Se fullständig matchrapport →"

#### Andra matcher — implementation

```typescript
function getOtherMatchResults(game: SaveGame, currentMatchday: number) {
  return game.fixtures
    .filter(f => f.matchday === currentMatchday && f.status === 'completed'
      && f.homeClubId !== game.managedClubId && f.awayClubId !== game.managedClubId)
    .map(f => ({
      homeName: game.clubs.find(c => c.id === f.homeClubId)?.name ?? '?',
      awayName: game.clubs.find(c => c.id === f.awayClubId)?.name ?? '?',
      homeScore: f.homeScore,
      awayScore: f.awayScore,
      homeWon: f.homeScore > f.awayScore,
      awayWon: f.awayScore > f.homeScore,
      isRival: getRivalry(f.homeClubId, f.awayClubId) !== null,
    }))
}
```

---

## 5. SÄSONGENS RYTM

### Månadsvy i DailyBriefing

Fas-specifika texter i DailyBriefing:

```typescript
const SEASON_MOOD: Record<SeasonPhase, string[]> = {
  early: [
    'Oktober. Första frosten. Truppen samlas.',
    'Höstmörkret sänker sig. Men isen glänser.',
  ],
  mid: [
    'November. Mörkret har lagt sig. Dagsjobben tar kraft.',
    'December. Julturneringen närmar sig.',
  ],
  endgame: [
    'Februari. Slutstriden börjar ta form.',
    'Varje match räknas nu. Tabellen stramas åt.',
  ],
  playoff: [
    'Slutspel. Inga andra chanser.',
    'Bäst av fem. Varje match kan vara den sista.',
  ],
  pre_season: ['Ny säsong. Nya möjligheter.'],
}
```

---

## 6. "ÅRETS MATCH" — Säsongssammanfattningens kronjuvel

### Logik

```typescript
export function pickSeasonHighlight(game: SaveGame): MatchHighlight | null {
  const managedFixtures = game.fixtures.filter(f =>
    f.status === 'completed' &&
    (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))

  let bestScore = 0
  let bestFixture: Fixture | null = null

  for (const f of managedFixtures) {
    let score = 0
    const isHome = f.homeClubId === game.managedClubId
    const myScore = isHome ? f.homeScore : f.awayScore
    const theirScore = isHome ? f.awayScore : f.homeScore

    if (Math.abs(myScore - theirScore) <= 1) score += 3  // tight margin
    score += f.events.filter(e => e.type === 'goal' && e.minute > 75).length * 2  // late goals
    if (getRivalry(f.homeClubId, f.awayClubId)) score += 3  // derby
    if (f.isCup) score += 2  // cup
    if (f.matchday > 26) score += 3  // playoff
    if (myScore + theirScore >= 8) score += 2  // high scoring

    if (score > bestScore) { bestScore = score; bestFixture = f }
  }

  return bestFixture ? buildHighlight(bestFixture, game) : null
}
```

Rendera i SeasonSummaryScreen med accent-border-kort + klack-citat. Se mockup.

---

## 7. RESTLISTA — BUGGAR OCH POLISH

### Kritiska buggar

| # | Bugg | Fil |
|---|------|-----|
| 1 | Cupen: lottning parar lag mot sig själva | cupService.ts / scheduleGenerator.ts |
| 2 | Mecenater spawnar aldrig (BUG-4) | roundProcessor.ts |
| 3 | Kontraktsförnyelse fastnar (BUG-7) | TransfersScreen.tsx |
| 4 | EventOverlay blockerar /game/review | EventOverlay.tsx |
| 5 | Presskonferens "Neutral · Neutral" | pressConferenceService.ts |

### Design/UX-buggar

| # | Bugg | Fil |
|---|------|-----|
| 6 | ?-knappen koppar → dämpad | GameHeader.tsx |
| 7 | paddingBottom på 7 skärmar | Se SPRINT_ALLT_KVAR 1.14 |
| 8 | "rinkar" i NewGameScreen | NewGameScreen.tsx |
| 9 | Styrelsemöte dubbelcitat | BoardMeetingScreen.tsx |

### Features kvar

| # | Feature | Referens |
|---|---------|----------|
| 10 | Kaptensmekanism | SPRINT_ALLT_KVAR 2.2 |
| 11 | Tab-beskrivningar | VERIFIERAD_RESTLISTA R6 |
| 12 | Settings-meny (⚙ dropdown) | VERIFIERAD_RESTLISTA R8 |
| 13 | StatsFooter i MatchLiveScreen | VERIFIERAD_RESTLISTA R4 |

---

## PRIORITERING

### Sprint 1: Motorkonsolidering (pågår)
1. Skapa matchCore.ts med matchprofiler
2. Rewrite matchEngine.ts som wrapper
3. Ta bort matchStepByStep.ts och matchSecondHalf.ts
4. Kör calibrate.ts — alla 5 targets gröna + profilfördelning
5. Testa MatchLiveScreen end-to-end

### Sprint 2: Buggar + Dead systems
1. Cupen fix (lottning)
2. Mecenat-spawn fix
3. Kontraktsförnyelse fix
4. EventOverlay blockering
5. Anläggningsprojekt startbar
6. Storylines → säsongssammanfattning

### Sprint 3: Systemkorsningar
1. Kafferummet × transfers/events
2. Presskonferens × orten + journalist-personlighet
3. Klacken × matchkommentarer (utöka)
4. Journalist-headlines i inbox
5. Season phases → events/dagbok/styrelseton

### Sprint 4: GranskaScreen 2.0 + Årets Match
1. Andra matchers resultat
2. Tidningsrubrik i Granska
3. Transfer/akademi-nyheter i Granska
4. "Årets match" i SeasonSummaryScreen

### Sprint 5: Polish + Pensioner + Rytm
1. Pensionsceremoni
2. Club legends i kafferummet
3. Säsongsrytm i DailyBriefing
4. Restlistans design-buggar
5. Kaptensmekanism

---

## FILER SOM BERÖRS

### Nya filer
- `src/domain/services/matchCore.ts` — enhetlig matchmotor + matchprofiler

### Stora ändringar
- `src/domain/services/matchEngine.ts` — rewrite till wrapper
- `src/domain/services/coffeeRoomService.ts` — transfer/event-koppling
- `src/domain/services/pressConferenceService.ts` — community-frågor + journalist
- `src/domain/services/journalistService.ts` — headlines
- `src/domain/services/seasonSummaryService.ts` — storylines + årets match
- `src/presentation/screens/GranskaScreen.tsx` — andra matcher, tidningsrubrik
- `src/presentation/screens/SeasonSummaryScreen.tsx` — storylines + årets match
- `src/presentation/screens/ClubScreen.tsx` — anläggningsprojekt UI

### Ta bort
- `src/domain/services/matchStepByStep.ts`
- `src/domain/services/matchSecondHalf.ts`

### Mindre ändringar
- `matchSimulator.ts` — uppdatera exports
- `matchCommentary.ts` — nya supporter/context-arrayer
- `retirementService.ts` — pensionsceremoni
- `seasonPhases.ts` — getSeasonPhase() export
- `roundProcessor.ts` — journalist-headline, season phase
- `DashboardScreen.tsx` — fas-specifik DailyBriefing
- `EventOverlay.tsx` — blockera på /game/review
- `GameHeader.tsx` — ?-knapp dämpad
- `NewGameScreen.tsx` — "rinkar" → "planer"
- `BoardMeetingScreen.tsx` — dubbelcitat fix
