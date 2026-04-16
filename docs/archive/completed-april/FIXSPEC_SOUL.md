# FIXSPEC: SJÄLEN — Stämning, rytm och minne — 11 april 2026

Varje feature är självständig. Kör uppifrån. `npm run build && npm test` efter varje.

Alla nya svenska strängar ska vara korta, torra, konkreta. Inga AI-klyschor.
Inga "den magiska resan" eller "en oförglömlig kväll". Skriv som en lokal sportjournalist.

**MOCKUP-REFERENS:** `docs/mockups/soul_features_mockup.html` — öppna i webbläsaren. Implementera det du SER, inte vad du tror det ska se ut som.

---

## Feature 1 — Stämningskortet (Pre-Match Mood)

**Vad:** Ett kort som visas OVANFÖR lineup-steppern i MatchScreen. En mening + väder-emoji. Sätter stämningen innan spelaren gör taktikval.

**Fil:** Ny: `src/domain/services/matchMoodService.ts`

```typescript
import type { SaveGame } from '../entities/SaveGame'
import type { Fixture } from '../entities/Fixture'
import type { MatchWeather } from '../entities/Weather'
import { getRivalry } from '../data/rivalries'

export function getMatchMood(
  game: SaveGame,
  fixture: Fixture,
  weather?: MatchWeather,
): string | null {
  const isHome = fixture.homeClubId === game.managedClubId
  const rivalry = getRivalry(fixture.homeClubId, fixture.awayClubId)
  const temp = weather?.weather.temperature ?? 0
  const standing = game.standings.find(s => s.clubId === game.managedClubId)
  const pos = standing?.position ?? 6
  const round = fixture.roundNumber
  const isCup = fixture.isCup

  // Annandagen
  if (fixture.matchday === 10) {
    return '🎄 Annandagen. Hela stan är på benen. Det luktar korv och kyla.'
  }

  // Derby
  if (rivalry && rivalry.intensity >= 2) {
    return `🔥 Derbydag. ${rivalry.name}. Gräsmattorna vid arenan är fulla en timme före nedsläpp.`
  }
  if (rivalry) {
    return `⚔️ ${rivalry.name}. Det är tystare än vanligt i omklädningsrummet.`
  }

  // Cup
  if (isCup) {
    return '🏆 Cupspel. En match avgör. Inga andra chanser.'
  }

  // Extreme cold
  if (temp <= -15) {
    return `🥶 ${temp}°. Vaktmästaren har varit ute sedan fem. Isen är hård som betong.`
  }

  // Snow
  if (weather?.weather.condition === 'heavySnow') {
    return '❄️ Snöfall. Linjerna syns knappt. Det blir en kamp om viljan.'
  }

  // Top of table clash
  const opponentId = isHome ? fixture.awayClubId : fixture.homeClubId
  const oppStanding = game.standings.find(s => s.clubId === opponentId)
  if (pos <= 3 && oppStanding && oppStanding.position <= 3) {
    return '📊 Toppdrabbning. Två lag som vill samma sak.'
  }

  // Must-win (bottom, late season)
  if (pos >= 10 && round >= 16) {
    return '⚠️ Varje poäng räknas nu. Laget vet vad som krävs.'
  }

  // Relegation battle
  if (pos >= 11 && round >= 19) {
    return '🔻 Desperation. Men desperata lag är farliga lag.'
  }

  // Playoff chase
  if (pos >= 7 && pos <= 9 && round >= 18) {
    return '📊 Slutspelsjakten. Ett par poäng skiljer.'
  }

  // Generic cold
  if (temp <= -5) {
    return `${temp}°. Frost på fönstren. En vanlig bandykväll.`
  }

  // Generic away
  if (!isHome) {
    const oppClub = game.clubs.find(c => c.id === opponentId)
    return `Borta hos ${oppClub?.name ?? 'motståndaren'}. Lång bussresa. Kort uppvärmning.`
  }

  // Generic home
  return null // Inget kort — sparar utrymme
}
```

**Fil:** `src/presentation/screens/MatchScreen.tsx`

Lägg till OVANFÖR step-indikatorn (efter MatchHeader, innan stepper-diven):

```typescript
import { getMatchMood } from '../../domain/services/matchMoodService'

// I renderingen, efter MatchHeader:
{nextFixture && (() => {
  const mood = getMatchMood(game, nextFixture, matchWeatherData)
  if (!mood) return null
  return (
    <div className="card-round" style={{ margin: '0 12px 8px', padding: '8px 12px' }}>
      <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5, fontFamily: 'var(--font-display)', margin: 0 }}>
        {mood}
      </p>
    </div>
  )
})()}
```

---

## Feature 2 — Halvtidsbeslut (Halftime Choice)

**Vad:** HalftimeModal erbjuder tre val som påverkar andra halvlek.

**Fil:** `src/presentation/components/match/HalftimeModal.tsx`

Kontrollera nuvarande implementering. Om det bara är en info-modal → utöka med tre knappar:

```typescript
// Tre val baserade på matchläge:
interface HalftimeChoice {
  id: 'calm' | 'angry' | 'tactical'
  label: string
  effect: string // visningstext
}

function getHalftimeChoices(scoreDiff: number): HalftimeChoice[] {
  return [
    {
      id: 'calm',
      label: scoreDiff >= 0 ? 'Lugn genomgång' : 'Håll ihop',
      effect: 'Moral +5 för alla',
    },
    {
      id: 'angry',
      label: scoreDiff >= 0 ? 'Kräv mer' : 'Skäll ut dem',
      effect: 'Skärpa +8, Moral −3',
    },
    {
      id: 'tactical',
      label: 'Taktikjustering',
      effect: 'Öppna taktikpanelen',
    },
  ]
}
```

Vid val → sätt en `halftimeBoost` på MatchLiveScreen state:
- `calm`: alla managed spelare +5 morale-boost resten av matchen
- `angry`: +8 sharpness, −3 morale
- `tactical`: öppna en inline taktikväljare (mentality + tempo)

---

## Feature 3 — Slutsignalens berättelse

**Vad:** "Domaren blåser av!"-meddelandet varierar baserat på matchberättelsen.

**Fil:** Ny funktion i matchkommentars-logik:

```typescript
export function getFinalWhistleSummary(
  myScore: number,
  theirScore: number,
  lateGoals: number,
  totalGoals: number,
  isHome: boolean,
): string {
  const margin = myScore - theirScore
  if (margin >= 4) return 'Dominans från start till slut.'
  if (margin >= 2 && lateGoals === 0) return 'Kontrollerad seger. Laget visste vad som krävdes.'
  if (margin === 1 && lateGoals > 0) return 'Avgörandet kom sent. Nerverna höll.'
  if (margin === 1) return 'Knapp seger. Det kunde gått åt vilket håll som helst.'
  if (margin === 0 && totalGoals === 0) return 'Mållöst. Isen var hård men kreativiteten saknades.'
  if (margin === 0 && totalGoals >= 6) return 'Målfest och rättvis poängdelning.'
  if (margin === 0) return 'Poängdelning. Rättvist? Kanske.'
  if (margin === -1 && lateGoals > 0) return 'Sent avgörande — åt fel håll.'
  if (margin === -1) return 'En boll skilde. Marginaler.'
  if (margin <= -3) return 'Tung kväll. Det finns inte mycket att säga.'
  return 'Motståndarna var starkare idag.'
}
```

Använd i MatchLiveScreen vid matchDone, i stället för hårdkodat slutmeddelande.

---

## Feature 4 — Aktberäkning (Season Act)

**Vad:** En funktion som returnerar vilken "akt" säsongen befinner sig i. Används av DailyBriefing, pepTalk, journalisten.

**Fil:** Ny: `src/domain/services/seasonActService.ts`

```typescript
export type SeasonAct = 1 | 2 | 3 | 4

export function getCurrentAct(leagueRound: number): SeasonAct {
  if (leagueRound <= 6) return 1   // Etablering (okt-nov)
  if (leagueRound <= 11) return 2  // Vinterns kärna (dec-jan)
  if (leagueRound <= 18) return 3  // Jakten (jan-feb)
  return 4                          // Avgörandet (feb-mars)
}

export function getActLabel(act: SeasonAct): string {
  switch (act) {
    case 1: return 'Höstens prolog'
    case 2: return 'Vinterns kärna'
    case 3: return 'Jakten'
    case 4: return 'Avgörandet'
  }
}
```

**Fil:** `src/domain/services/dailyBriefingService.ts`

Importera `getCurrentAct`. Lägg till akt-medvetna briefings:
- Akt 1: optimistisk ton ("Tabellen tar form", "Allt är möjligt")
- Akt 2: uthållighetston ("Vintern testar alla")
- Akt 3: nervös ton ("Tabellen klarnar", "Varje poäng väger")
- Akt 4: dramatisk ton ("Sista raka", "Inget utrymme för misstag")

**Fil:** `src/domain/services/pepTalkService.ts`

Lägg till akt-baserade quotes i respektive pool.

---

## Feature 5 — Ljud: matchstart, mål, slutsignal

**Vad:** Tre nya ljud i det befintliga Web Audio-systemet.

**Fil:** `src/presentation/audio/soundEffects.ts`

Lägg till i `sounds`:

```typescript
matchStart: () => {
  // Dovt horn — en ton som "sätter sig"
  playTone(130, 0.6, 'triangle', 0.10, 0)
  playTone(130, 0.4, 'triangle', 0.06, 500)
},

goalHit: () => {
  // Klubba mot boll — kort "thwack"
  playTone(200, 0.05, 'sawtooth', 0.15, 0)
  playTone(120, 0.08, 'sawtooth', 0.10, 30)
  // Dämpt publikljud
  for (let i = 0; i < 4; i++) {
    playTone(300 + Math.random() * 200, 0.15, 'sine', 0.03, 80 + i * 60)
  }
},

finalWhistle: () => {
  // Lång vissling — stigande
  playTone(1100, 0.15, 'sine', 0.10, 0)
  playTone(1300, 0.30, 'sine', 0.12, 100)
  playTone(1500, 0.50, 'sine', 0.08, 350)
},
```

**Där de spelas:**
- `matchStart`: i StartStep vid "Spela match"-klick eller i MatchLiveScreen vid mount
- `goalHit`: i CommentaryFeed vid Goal-event (managed club-mål)
- `finalWhistle`: vid "Domaren blåser av"-meddelandet

---

## Feature 6 — Kafferummet

**Vad:** En roterande rad längst ner på dashboarden (under CTA-knappen, ovanför build-nummer) med dialog mellan frivilliga/funktionärer.

**Fil:** Ny: `src/domain/services/coffeeRoomService.ts`

```typescript
import type { SaveGame } from '../entities/SaveGame'

interface CoffeeQuote {
  speaker: string
  text: string
}

const GENERIC_EXCHANGES: Array<[string, string, string, string]> = [
  ['Kioskvakten', 'Ingen kommer betala 25 kr för en korv i den här kylan.', 'Kassören', 'Det sa du förra året. Vi sålde slut.'],
  ['Materialaren', 'Tre klubbor gick sönder igår.', 'Vaktmästaren', 'Beställ fem. Det blir kallt i veckan.'],
  ['Kassören', 'Har vi råd med nya tröjor?', 'Ordföranden', 'Har vi råd att INTE ha nya tröjor?'],
  ['Webbredaktören', 'Hemsidan hade 400 besök igår.', 'Kioskvakten', 'Hur många köpte korv?'],
  ['Vaktmästaren', 'Jag var ute klockan fem imorse.', 'Materialaren', 'Du säger det varje dag.'],
  ['Kassören', 'Sponsoravtalet med ICA går ut.', 'Ordföranden', 'Ring dom. Bjud på kaffe. Och korv.'],
  ['Ungdomstränaren', 'Lindberg i P19 börjar likna något.', 'Materialaren', 'Ge honom inte för stora tröjor.'],
]

const RESULT_EXCHANGES: Record<'win' | 'loss' | 'draw', Array<[string, string]>> = {
  win: [
    ['Kioskvakten', 'Vi sålde dubbelt idag. Seger säljer.'],
    ['Vaktmästaren', 'Publiken sjöng hela vägen ut. Länge sen sist.'],
    ['Kassören', 'Tre poäng och plusresultat. Jag sover gott.'],
  ],
  loss: [
    ['Kioskvakten', 'Tyst vid kiosken efteråt. Ingen ville ha korv.'],
    ['Vaktmästaren', 'Jag plogade ändå i en timme. Isen förtjänade bättre.'],
    ['Kassören', 'Vi behöver inte prata om det. Eller?'],
  ],
  draw: [
    ['Kioskvakten', 'Kryss igen. Folket vet inte om de ska vara nöjda.'],
    ['Vaktmästaren', 'En poäng är en poäng. Isen klagade inte.'],
  ],
}

export function getCoffeeRoomQuote(game: SaveGame): CoffeeQuote | null {
  const round = game.fixtures
    .filter(f => f.status === 'completed' && !f.isCup)
    .reduce((max, f) => Math.max(max, f.roundNumber), 0)
  
  if (round === 0) return null

  const lastFixture = game.fixtures
    .filter(f => f.status === 'completed' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
    .sort((a, b) => b.matchday - a.matchday)[0]

  const seed = round * 7 + game.currentSeason * 31
  const pick = (arr: unknown[]) => arr[Math.abs(seed) % arr.length]

  if (lastFixture && (seed % 2 === 0)) {
    const isHome = lastFixture.homeClubId === game.managedClubId
    const myScore = isHome ? lastFixture.homeScore : lastFixture.awayScore
    const theirScore = isHome ? lastFixture.awayScore : lastFixture.homeScore
    const result = myScore > theirScore ? 'win' : myScore < theirScore ? 'loss' : 'draw'
    const pool = RESULT_EXCHANGES[result]
    const [speaker, text] = pick(pool) as [string, string]
    return { speaker, text }
  }

  const volunteers = game.volunteers ?? []
  const exchange = pick(GENERIC_EXCHANGES) as [string, string, string, string]
  const speakerName = volunteers.length > 0
    ? volunteers[Math.abs(seed + 3) % volunteers.length]
    : exchange[0]
  
  return {
    speaker: speakerName,
    text: `"${exchange[1]}" — ${exchange[2]}: "${exchange[3]}"`,
  }
}
```

**Fil:** `src/presentation/screens/DashboardScreen.tsx`

Lägg till efter CTA-knappen, ovanför build-nummret. **INTE ett card-round.** En tunn sektion med border-top:

```typescript
import { getCoffeeRoomQuote } from '../../domain/services/coffeeRoomService'

{(() => {
  const coffee = getCoffeeRoomQuote(game)
  if (!coffee) return null
  return (
    <div style={{
      margin: '12px 4px 0',
      padding: '8px 10px',
      borderTop: '1px solid var(--border)',
    }}>
      <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
        ☕ KAFFERUMMET
      </p>
      <p style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>
        {coffee.speaker}: {coffee.text}
      </p>
    </div>
  )
})()}
```

---

## Feature 7 — Årsboken: DINA VAL

**Vad:** En sektion i SeasonSummaryScreen som listar spelarens viktigaste beslut under säsongen.

**Fil:** Ny: `src/domain/services/seasonDecisionsService.ts`

```typescript
import type { SaveGame } from '../entities/SaveGame'

export interface SeasonDecision {
  icon: string
  text: string
  round?: number
}

export function collectSeasonDecisions(game: SaveGame): SeasonDecision[] {
  const decisions: SeasonDecision[] = []
  const season = game.currentSeason

  // Academy promotions
  const promoted = game.players.filter(p =>
    p.clubId === game.managedClubId &&
    p.promotedFromAcademy &&
    p.promotionRound !== undefined
  )
  for (const p of promoted) {
    decisions.push({
      icon: '🎓',
      text: `Kallade upp ${p.firstName} ${p.lastName} (${p.age} år) från akademin`,
      round: p.promotionRound,
    })
  }

  // Resolved storylines
  for (const sl of game.storylines ?? []) {
    if (sl.season === season && sl.displayText) {
      decisions.push({ icon: '📖', text: sl.displayText, round: sl.matchday })
    }
  }

  // Board objectives met/failed
  for (const obj of game.boardObjectiveHistory ?? []) {
    if (obj.season === season) {
      decisions.push({
        icon: obj.result === 'met' ? '✅' : '❌',
        text: `Styrelseuppdrag: ${obj.objectiveId} — ${obj.result === 'met' ? 'uppfyllt' : 'misslyckat'}`,
      })
    }
  }

  // License
  if (game.licenseReview?.season === season && game.licenseReview.status !== 'approved') {
    decisions.push({
      icon: '📋',
      text: `Licensnämnden: ${game.licenseReview.status === 'warning' ? 'Varning' : 'Fortsatt granskning'}`,
    })
  }

  // Facility projects
  for (const proj of game.facilityProjects ?? []) {
    if (proj.status === 'completed' || proj.status === 'in_progress') {
      decisions.push({ icon: '🏗️', text: `Startade projekt: ${proj.name}` })
    }
  }

  return decisions.sort((a, b) => (a.round ?? 99) - (b.round ?? 99)).slice(0, 8)
}
```

**Fil:** `src/presentation/screens/SeasonSummaryScreen.tsx`

Lägg till sektion EFTER "AVSLUTADE KARRIÄRER":

```typescript
import { collectSeasonDecisions } from '../../domain/services/seasonDecisionsService'

{(() => {
  const decisions = collectSeasonDecisions(game)
  if (decisions.length === 0) return null
  return (
    <div className="card-sharp" style={{ padding: '10px 14px', marginBottom: 8 }}>
      <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
        📋 DINA VAL
      </p>
      {decisions.map((d, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          padding: '5px 0',
          borderBottom: i < decisions.length - 1 ? '1px solid var(--border)' : 'none',
        }}>
          <span style={{ fontSize: 12, flexShrink: 0 }}>{d.icon}</span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, flex: 1 }}>{d.text}</span>
          {d.round && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 'auto' }}>O{d.round}</span>
          )}
        </div>
      ))}
    </div>
  )
})()}
```

---

## Feature 8 — Generationsväxlingens känsla

### 8a — Pensionärens nummer
I `narrativeService.ts`: om ny spelares shirtNumber matchar en clubLegend → dagboksentry:
`"Fick nummer {N} — {legend.name}s gamla. Stort ansvar."`

### 8b — Tomma omklädningsrummet
I `dailyBriefingService.ts`, omgång 1: om det finns pensionärer från förra säsongen:
`"Ny säsong. Omklädningsrummet känns tomt utan {legend.name}."`

### 8c — Akademistjärnans kliv
I `dailyBriefingService.ts`: om en P19-spelare nyligen kallats upp och spelat 3+ matcher:
`"🎓 {namn} ({age}) — tre matcher i A-laget. Akademin levererade."`

---

## Feature 9 — NextMatchCard glow

**Fil:** `src/presentation/components/dashboard/NextMatchCard.tsx`

```typescript
import { getCurrentAct } from '../../../domain/services/seasonActService'

// I NextMatchCard, efter befintlig cardStyle:
const act = getCurrentAct(nextFixture.roundNumber)
const actGlow = act >= 3
  ? { boxShadow: `0 0 ${act === 4 ? 12 : 6}px rgba(196,122,58,${act === 4 ? 0.15 : 0.08})` }
  : {}
```

Merga med befintlig cardStyle. **Statisk, INTE pulserande.**

---

## Feature 10 — Träningsscenen (4 per säsong)

**Fil:** Ny: `src/domain/services/trainingSceneService.ts`

```typescript
import type { SaveGame } from '../entities/SaveGame'

const TRAINING_ROUNDS = [3, 8, 14, 20]

export function getTrainingScene(game: SaveGame): string | null {
  const round = game.fixtures
    .filter(f => f.status === 'completed' && !f.isCup)
    .reduce((max, f) => Math.max(max, f.roundNumber), 0)

  if (!TRAINING_ROUNDS.includes(round)) return null

  const focus = game.managedClubTraining?.type ?? 'physical'
  const players = game.players.filter(p => p.clubId === game.managedClubId)

  const hotPlayer = players
    .filter(p => p.seasonStats.goals >= 3)
    .sort((a, b) => b.seasonStats.goals - a.seasonStats.goals)[0]

  const coldPlayer = players
    .filter(p => p.form < 40 && p.seasonStats.gamesPlayed >= 3)
    .sort((a, b) => a.form - b.form)[0]

  const focusText: Record<string, string> = {
    skating: 'Intervaller på isen. Lungor som brinner.',
    ballControl: 'Bollkontroll i tight yta. En och en, ingen paus.',
    passing: 'Passningsövningar i trekanter. Tempo, tempo, tempo.',
    shooting: 'Skottövning från distans. Målvakten får jobba.',
    defending: 'Positionsspel i backlinje. Kommunikation i kylan.',
    tactical: 'Taktiktavla i omklädningsrummet. Sen ut på plan.',
    physical: 'Styrkepass. Ingen pratar. Alla jobbar.',
    matchPrep: 'Matchförberedelse. Genomgång av motståndaren.',
    recovery: 'Lättare pass. Stretch. Kroppen behöver vila.',
    cornerPlay: 'Hörnträning. Samma rutin, tjugonde gången idag.',
  }

  let scene = `Tisdag, 14:30. Plan 2. ${focusText[focus] ?? 'Träning.'}`

  if (hotPlayer) {
    scene += ` ${hotPlayer.lastName} hittar nätet varje gång.`
  } else if (coldPlayer) {
    scene += ` ${coldPlayer.lastName} sliter — men bollarna vill inte.`
  }

  return scene
}
```

**Fil:** `src/presentation/screens/DashboardScreen.tsx`

Lägg till efter DailyBriefing, som card-round:

```typescript
import { getTrainingScene } from '../../domain/services/trainingSceneService'

{(() => {
  const scene = getTrainingScene(game)
  if (!scene) return null
  return (
    <div className="card-round" style={{ padding: '8px 12px', marginBottom: 6 }}>
      <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
        🏋️ TRÄNINGSPLAN
      </p>
      <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5, fontFamily: 'var(--font-display)', margin: 0 }}>
        {scene}
      </p>
    </div>
  )
})()}
```

---

## Feature 11 — Ortens siluett

**Fil:** Ny: `src/presentation/components/TownSilhouette.tsx`

```tsx
interface TownSilhouetteProps {
  clubId: string
  width?: number
  height?: number
}

const SILHOUETTES = [
  // Bruksort
  'M0,50 L5,50 L5,25 L8,25 L8,10 L11,10 L11,25 L25,25 L25,15 L40,15 L40,25 L45,25 L45,50 L55,50 L55,35 L58,35 L58,38 L62,38 L62,35 L65,35 L65,50 L75,50 L78,30 L82,50 L90,50 L92,35 L95,50 L100,50',
  // Dalort
  'M0,50 L10,50 L10,40 L12,40 L12,20 L14,20 L14,40 L16,40 L16,50 L30,50 L30,35 L45,35 L45,50 L55,50 L55,38 L60,38 L60,32 L65,32 L65,38 L70,38 L70,50 L80,50 L100,30',
  // Norrlandsort
  'M0,50 L5,50 L8,30 L11,50 L14,32 L17,50 L20,50 L20,35 L35,35 L38,20 L41,35 L55,35 L55,50 L60,50 L63,28 L66,50 L70,48 L73,25 L76,50 L100,40',
  // Mälardalsort
  'M0,50 L15,50 L15,35 L20,30 L50,30 L55,35 L55,50 L65,50 L65,42 L75,42 L75,50 L85,50 L85,45 L95,45 L95,50 L100,50',
  // Småort
  'M0,50 L10,50 L12,35 L18,35 L20,50 L30,50 L32,40 L34,32 L36,40 L38,50 L50,50 L50,38 L55,30 L60,38 L60,50 L70,50 L72,33 L74,28 L76,33 L78,50 L100,50',
]

export function TownSilhouette({ clubId, width = 100, height = 20 }: TownSilhouetteProps) {
  const hash = clubId.split('').reduce((h, c) => h * 31 + c.charCodeAt(0), 0)
  const idx = Math.abs(hash) % SILHOUETTES.length
  const path = SILHOUETTES[idx]

  return (
    <svg viewBox="0 0 100 50" width={width} height={height} style={{ opacity: 0.12, display: 'block' }}>
      <path d={path} fill="none" stroke="var(--text-muted)" strokeWidth="1.5" />
    </svg>
  )
}
```

**Fil:** `src/presentation/components/GameHeader.tsx`

Lägg till som absolut positionerad bakgrund:

```typescript
import { TownSilhouette } from './TownSilhouette'

// I header-diven, som första child:
<div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, pointerEvents: 'none' }}>
  <TownSilhouette clubId={game.managedClubId} width={375} height={20} />
</div>
```

**opacity 0.12.** Code ska INTE göra den synligare.

---

## Verifiering

```bash
npm run build && npm test

# Inga hardkodade hex:
grep -rn "#[0-9a-fA-F]\{6\}" src/presentation/ --include="*.tsx" | grep -v node_modules | grep -v ".svg" | grep -v TownSilhouette

# Nya services importeras korrekt:
grep -rn 'matchMoodService\|coffeeRoomService\|seasonDecisionsService\|trainingSceneService\|seasonActService' src/ --include="*.ts" --include="*.tsx" | grep import
```
