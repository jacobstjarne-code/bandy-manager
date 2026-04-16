# SPEC: Sprint 1 — Kopplingar, Buggar & Narrativ Polish

**Datum:** 9 april 2026
**Typ:** Samlad sprint — Code
**Prioritet:** Buggfixar → Kopplingar → Features → Visuell polish
**Regel:** `npm run build && npm test` efter varje steg. Committa per steg.

---

## STEG 1: KRITISKA BUGGAR

### 1.1 Arc `decisionsMade` fylls aldrig

**Problem:** Arc-events har `type: 'playerArc'`. eventResolver hanterar effekten (boostMorale etc.) men uppdaterar aldrig arcens `decisionsMade`. Resolution-fasen kollar `arc.decisionsMade.includes('let_go')` etc. men arrayen är alltid tom. Hela arc-systemet är dekorativt — val har inga konsekvenser.

**Fil:** `src/domain/services/events/eventResolver.ts`

**Fix:** Lägg till EFTER switch-blocket, FÖRE "Mark event resolved and remove from pendingEvents":

```typescript
// ── Record arc decisions ──────────────────────────────────────────────
if (event.type === 'playerArc') {
  updatedGame = {
    ...updatedGame,
    activeArcs: (updatedGame.activeArcs ?? []).map(arc =>
      arc.eventsFired.includes(eventId)
        ? { ...arc, decisionsMade: [...arc.decisionsMade, choiceId] }
        : arc
    ),
  }
}
```

**Verifiering:** Starta spel, spela tills arc triggar, gör val i GranskaScreen. Kolla `game.activeArcs[0].decisionsMade` i Console — ska innehålla choice-ID.

---

### 1.2 Arc `hungrig_breakthrough` räknar fel

**Problem:** Räknar ALLA completed fixtures där spelaren inte gjort mål — inklusive matcher spelaren inte var med i. Triggar omedelbart för alla hungriga spelare.

**Fil:** `src/domain/services/arcService.ts`, i `detectArcTriggers`, sektionen `hungrig_breakthrough`

**Byt ut hela blocket** från `const hungrigPlayers` till `break` med:

```typescript
const hungrigPlayers = managedPlayers.filter(
  p => p.trait === 'hungrig' && p.age <= 21 && !activePlayerIds.has(p.id)
)
for (const p of hungrigPlayers) {
  // Räkna senaste konsekutiva STARTER utan mål
  const recentFixtures = [...completedManagedFixtures]
    .sort((a, b) => (b.matchday ?? 0) - (a.matchday ?? 0))
  let consecutiveWithoutGoal = 0
  for (const f of recentFixtures) {
    const wasStarter = (f.homeLineup?.startingPlayerIds?.includes(p.id)) ||
                       (f.awayLineup?.startingPlayerIds?.includes(p.id))
    if (!wasStarter) continue
    const scored = (f.events ?? []).some(e => e.type === 'goal' && e.playerId === p.id)
    if (scored) break
    consecutiveWithoutGoal++
  }
  if (consecutiveWithoutGoal >= 3) {
    newArcs.push({
      id: genId('arc', currentMatchday, `hungrig_${p.id}`),
      type: 'hungrig_breakthrough',
      playerId: p.id,
      startedMatchday: currentMatchday,
      phase: 'building',
      eventsFired: [],
      decisionsMade: [],
      expiresMatchday: currentMatchday + 6,
      data: { gamesWithoutGoal: consecutiveWithoutGoal },
    })
    break
  }
}
```

---

### 1.3 Presskonferens inline i GranskaScreen — klick reagerar inte

**Problem:** Presskonferens-val renderas i GranskaScreen men klick gör ingenting. EventOverlay-versionen funkar. Debug-loggar finns redan i `handleChoice`.

**Debug-steg:**
1. Öppna Console (Cmd+Opt+J)
2. Navigera till GranskaScreen efter match
3. Klicka på presskonferens-knapp
4. Kolla om `[GranskaScreen] handleChoice:` loggas

**Om INTE loggat → DOM-problem.** Trolig orsak: ett osynligt element (t.ex. gradient, overlay, animation-layer) fångar klicket. Fix: lägg `position: relative; zIndex: 1` på event-knapparna:

**Fil:** `src/presentation/screens/GranskaScreen.tsx`, i event choice-knappen:

```tsx
<button
  key={choice.id}
  onClick={() => handleChoice(event.id, choice.id, choice.label)}
  style={{
    position: 'relative', zIndex: 1,  // ← LÄGG TILL
    width: '100%', padding: '12px 14px', borderRadius: 10,
    fontSize: 13, fontWeight: 600, textAlign: 'left', cursor: 'pointer',
    ...choiceStyle(choice.id),
  }}
>
```

**Om loggat men `resolveEvent CRASHED`** → titta på felmeddelandet och fixa resolver.

**Om loggat + succeeded** → eventet försvinner ur listan utan synlig feedback. Problemet är att `resolveEvent` tar bort eventet från `pendingEvents` → React re-render → eventet är borta. Resolved-checketten (`resolvedEventIds.has(event.id)`) matchar aldrig eftersom eventet redan försvunnit. Fix: kolla `resolvedEventIds` INNAN `pendingEvents`-filtrering:

```typescript
// Visa resolved events OCKSÅ (de är borta från pendingEvents men vi har deras data lokalt)
const allVisibleEvents = [
  ...pendingEvents,
  // Redan resolved events som vi hanterade i denna vy-session
  // (dessa visas som collapsed med ✓)
]
```

Alternativt (enklare): fördröj `resolveEvent` med 500ms så användaren ser kollapsen:

```typescript
function handleChoice(eventId: string, choiceId: string, choiceLabel: string) {
  playSound('click')
  setResolvedEventIds(prev => new Set([...prev, eventId]))
  setChosenLabels(prev => ({ ...prev, [eventId]: choiceLabel }))
  // Fördröj resolve så spelaren ser ✓-kollapsen
  setTimeout(() => resolveEvent(eventId, choiceId), 600)
}
```

**Ta bort** debug-loggarna efter fix (console.log i handleChoice).

---

### 1.4 CTA "STARTA SLUTSPEL" för lag utanför topp 8

**Fil:** `src/presentation/screens/DashboardScreen.tsx`, i `advanceButtonText`

**Fix:** I blocket `if (scheduled.length === 0)`, FÖRE `if (!game.playoffBracket)`:

```typescript
if (scheduled.length === 0) {
  const myStanding = game.standings.find(s => s.clubId === game.managedClubId)
  const qualified = myStanding && myStanding.position <= 8

  if (!game.playoffBracket) {
    return qualified ? 'Starta slutspel →' : 'Avsluta grundserien →'
  }
  if (game.playoffBracket.status === PlayoffStatus.Completed) return 'Avsluta säsongen →'
  return qualified ? 'Fortsätt slutspel →' : 'Vänta på slutspelet →'
}
```

---

### 1.5 EventOverlay knappar ser "förvalda" ut

**Fil:** `choiceStyle()` i `src/presentation/components/EventOverlay.tsx` OCH `src/presentation/screens/GranskaScreen.tsx`

**Byt ut** `choiceStyle` i BÅDA filerna:

```typescript
function choiceStyle(_choiceId: string): React.CSSProperties {
  return {
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
  }
}
```

Alla knappar neutrala. Ingen färgkodning på accept/reject — spelaren ska välja utan visuell ledning.

---

## STEG 2: TRAIT-AWARE MATCHKOMMENTARER

### Vad

Traits synliggörs i det ögonblick de spelar roll — i matchkommentaren vid mål, assist, utvisning.

### Fil: `src/domain/data/matchCommentary.ts`

Lägg till en ny funktion som wrapprar befintliga kommentarer:

```typescript
export function getTraitCommentary(
  playerId: string,
  eventType: 'goal' | 'assist' | 'suspension',
  players: Player[],
): string | null {
  const player = players.find(p => p.id === playerId)
  if (!player?.trait) return null

  const name = player.lastName

  const traitGoals: Record<string, string[]> = {
    hungrig: [
      `Den hungriga forwarden bryter igenom! ${name} har väntat på det här.`,
      `${name} ger sig aldrig. Hungern driver honom framåt.`,
      `Där satt den! ${name} har jagat det här målet i veckor.`,
    ],
    joker: [
      `${name} ur ingenstans! Oförutsägbar som alltid.`,
      `Geni eller galenskap? ${name} bestämde sig för geni ikväll.`,
      `Ingen visste vad ${name} tänkte — inte ens han själv. Men bollen gick in.`,
    ],
    veteran: [
      `Rutin i avgörande läge. ${name} har gjort det här hundra gånger.`,
      `${name} med den gamla vanliga. Klass är permanent.`,
      `Veteranen levererar. ${name} visar vägen.`,
    ],
    lokal: [
      `Hela orten jublar! ${name} — en av deras egna.`,
      `Lokalhjälten ${name}! Det kan inte bli bättre på hemmaplan.`,
      `${name} med ett mål som orten kommer prata om länge.`,
    ],
    ledare: [
      `Kaptenen kliver fram! ${name} tar ansvar när det behövs.`,
      `${name} leder med handling, inte bara armband.`,
      `Ledaren ${name} visar att ord inte räcker — det krävs mål.`,
    ],
  }

  const traitSuspensions: Record<string, string[]> = {
    joker: [
      `${name} gör det igen. Briljant ena sekunden, utvisad nästa.`,
      `10 minuter utanför. ${name}s temperament kostar laget.`,
    ],
    hungrig: [
      `Frustrationen kokar över. ${name} åker ut efter en onödig tackling.`,
    ],
  }

  if (eventType === 'goal') {
    const pool = traitGoals[player.trait]
    if (!pool) return null
    return pool[Math.floor(Math.random() * pool.length)]
  }
  if (eventType === 'suspension') {
    const pool = traitSuspensions[player.trait]
    if (!pool) return null
    return pool[Math.floor(Math.random() * pool.length)]
  }
  return null
}
```

### Integration i matchmotorn

**Fil:** `src/domain/services/matchStepByStep.ts` (live-match) och `src/domain/services/matchSimulator.ts` (snabbsim)

Vid målgenerering, efter att kommentar valts: om spelaren har trait, ERSÄTT kommentaren med trait-versionen (50% chans):

```typescript
import { getTraitCommentary } from '../data/matchCommentary'

// Efter att goal-kommentar genererats:
if (Math.random() < 0.5) {
  const traitComment = getTraitCommentary(scorerId, 'goal', allPlayers)
  if (traitComment) commentary = traitComment
}
```

Samma vid utvisning:
```typescript
if (Math.random() < 0.5) {
  const traitComment = getTraitCommentary(suspendedPlayerId, 'suspension', allPlayers)
  if (traitComment) commentary = traitComment
}
```

---

## STEG 3: RIKT MATCHREFERAT VID SLUTSIGNAL

### Vad

Slutsignalens sammanfattning utökas från 1 mening till 3-4 meningar som refererar till vad som faktiskt hände.

### Fil: `src/presentation/components/match/CommentaryFeed.tsx`

**Byt ut** `generateMatchSummary`:

```typescript
function generateMatchSummary(
  home: number, away: number, managedIsHome: boolean, steps: MatchStep[]
): string {
  const myScore = managedIsHome ? home : away
  const theirScore = managedIsHome ? away : home
  const totalGoals = home + away
  const margin = myScore - theirScore
  const allEvents = steps.flatMap(s => s.events)
  const goals = allEvents.filter(e => e.type === 'goal')

  // Hitta målskyttar
  const scorerCounts: Record<string, number> = {}
  const scorerNames: Record<string, string> = {}
  goals.forEach(e => {
    if (e.playerId && e.description) {
      scorerCounts[e.playerId] = (scorerCounts[e.playerId] ?? 0) + 1
      // Extrahera namn från beskrivning eller fallback
      scorerNames[e.playerId] = e.description.split(' ')[0] ?? 'Spelaren'
    }
  })
  const topScorerId = Object.entries(scorerCounts).sort((a, b) => b[1] - a[1])[0]
  const topScorerName = topScorerId ? scorerNames[topScorerId[0]] : null
  const topScorerGoals = topScorerId ? topScorerId[1] : 0

  // Kolla vändning (trailed at halftime)
  const htStep = steps.find(s => s.step === 30)
  const htHome = htStep?.homeScore ?? 0
  const htAway = htStep?.awayScore ?? 0
  const myHt = managedIsHome ? htHome : htAway
  const theirHt = managedIsHome ? htAway : htHome
  const wasComeback = myScore > theirScore && myHt < theirHt

  // Sent avgörande (mål efter minut 55)
  const lateGoals = goals.filter(e => (e.minute ?? 0) >= 55)
  const lateDecider = lateGoals.length > 0 && Math.abs(myScore - theirScore) <= 1

  // Publik
  const lastStep = steps[steps.length - 1]
  const attendance = lastStep?.attendance

  // Bygg sammanfattning
  const lines: string[] = []

  if (myScore > theirScore) {
    if (wasComeback) {
      lines.push(`Laget låg under i paus men vände till ${myScore}–${theirScore}.`)
    } else if (margin >= 3) {
      lines.push(`Dominant insats. ${myScore}–${theirScore} — aldrig hotat.`)
    } else if (lateDecider) {
      lines.push(`Sent avgörande! ${myScore}–${theirScore} efter en nervös avslutning.`)
    } else {
      lines.push(`Kontrollerad seger, ${myScore}–${theirScore}.`)
    }
  } else if (myScore < theirScore) {
    if (margin <= -3) {
      lines.push(`Tung förlust, ${myScore}–${theirScore}. Mycket att jobba med.`)
    } else if (myHt > theirHt) {
      lines.push(`Ledde i paus men tappade. ${myScore}–${theirScore} i slutändan.`)
    } else {
      lines.push(`${myScore}–${theirScore}. Motståndarna var starkare idag.`)
    }
  } else {
    if (totalGoals >= 6) {
      lines.push(`Målrikt kryss, ${myScore}–${theirScore}. Drama åt båda hållen.`)
    } else if (totalGoals === 0) {
      lines.push(`Mållöst. Defensivt stabilt men offensivt tamt.`)
    } else {
      lines.push(`Rättvis poängdelning, ${myScore}–${theirScore}.`)
    }
  }

  if (topScorerName && topScorerGoals >= 2) {
    lines.push(`${topScorerName} med ${topScorerGoals} mål.`)
  } else if (topScorerName && topScorerGoals === 1 && totalGoals <= 3) {
    lines.push(`${topScorerName} med det avgörande målet.`)
  }

  if (totalGoals >= 8) {
    lines.push(`${totalGoals} mål totalt — publiken fick valuta.`)
  }

  return lines.join(' ')
}
```

---

## STEG 4: HÖSTSUMMERING — "HALVVÄGS"

### Vad

Halvtidsreflektion efter omgång 11 (närmast 26 december). Visas som mellanskärm före dashboard, samma mönster som BoardMeeting.

### Ny flagga i SaveGame

**Fil:** `src/domain/entities/SaveGame.ts`

```typescript
showHalfTimeSummary?: boolean
```

### Trigger i roundProcessor

**Fil:** `src/application/useCases/roundProcessor.ts`

EFTER onboarding-steget, FÖRE return:

```typescript
// Höstsummering trigger — efter omgång 11
if (!updatedGame.showHalfTimeSummary) {
  const managedLeagueRound = updatedGame.fixtures
    .filter(f => f.status === 'completed' && !f.isCup &&
      (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
    .length
  if (managedLeagueRound === 11) {
    updatedGame = { ...updatedGame, showHalfTimeSummary: true }
  }
}
```

### DashboardScreen redirect

**Fil:** `src/presentation/screens/DashboardScreen.tsx`

I useEffect-redirects, EFTER `showPreSeason`:

```typescript
else if (game?.showHalfTimeSummary) navigate('/game/half-time-summary', { replace: true })
```

### Ny skärm: `HalfTimeSummaryScreen.tsx`

**Fil:** `src/presentation/screens/HalfTimeSummaryScreen.tsx`

**Route:** `/game/half-time-summary`

**Layout:**

```tsx
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'

export function HalfTimeSummaryScreen() {
  const game = useGameStore(s => s.game)
  const navigate = useNavigate()

  if (!game) return null

  const club = game.clubs.find(c => c.id === game.managedClubId)
  const standing = game.standings.find(s => s.clubId === game.managedClubId)
  const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  const completedFixtures = game.fixtures.filter(f =>
    f.status === 'completed' && !f.isCup &&
    (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
  ).sort((a, b) => a.matchday - b.matchday)

  // Avstånd till topp 8
  const pos = standing?.position ?? 12
  const pts = standing?.points ?? 0
  const top8Standing = [...game.standings].sort((a, b) => a.position - b.position)[7]
  const ptsToTop8 = top8Standing ? Math.max(0, top8Standing.points - pts) : 0
  const leaderPts = game.standings[0]?.points ?? 0

  // Höstens 3 bästa stunder (matchday ≤ 11)
  // Återanvänd samma impact-logik som Säsongens stunder men filtrera
  const moments: Array<{ icon: string; headline: string; matchday: number }> = []
  for (const f of completedFixtures) {
    if (f.matchday > 15) break
    const isHome = f.homeClubId === game.managedClubId
    const our = isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0)
    const their = isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0)
    const opponent = game.clubs.find(c => c.id === (isHome ? f.awayClubId : f.homeClubId))
    const oppName = opponent?.shortName ?? opponent?.name ?? '?'
    const margin = our - their

    if (margin >= 3) moments.push({ icon: '💪', headline: `Storseger mot ${oppName} (${our}–${their})`, matchday: f.matchday })
    else if (margin <= -3) moments.push({ icon: '❌', headline: `Tung förlust mot ${oppName} (${our}–${their})`, matchday: f.matchday })
    else if (our > their && (f.events ?? []).some(e => e.type === 'goal' && (e.minute ?? 0) >= 55)) {
      moments.push({ icon: '⚡', headline: `Sent avgörande mot ${oppName} (${our}–${their})`, matchday: f.matchday })
    }
  }
  // Hattricks
  const hattrickPlayers = managedPlayers.filter(p =>
    (p.careerMilestones ?? []).some(m => m.type === 'hatTrick' && m.season === game.currentSeason && m.round <= 11)
  )
  for (const p of hattrickPlayers) {
    moments.push({ icon: '🎩', headline: `${p.firstName} ${p.lastName} med hattrick`, matchday: (p.careerMilestones ?? []).find(m => m.type === 'hatTrick')?.round ?? 0 })
  }
  moments.sort((a, b) => a.matchday - b.matchday)
  const topMoments = moments.slice(0, 3)

  // Aktiva arcs
  const activeArc = (game.activeArcs ?? []).find(a => a.phase !== 'resolving' && a.playerId)
  const arcPlayer = activeArc?.playerId ? managedPlayers.find(p => p.id === activeArc.playerId) : null

  // Tränartips
  const tips: string[] = []
  const cornerGoals = completedFixtures.reduce((sum, f) =>
    sum + (f.events ?? []).filter(e => e.type === 'goal' && e.isCornerGoal && e.clubId === game.managedClubId).length, 0)
  if (cornerGoals <= 1) tips.push('Ni skapar få hörnmål. Överväg en hörnspecialist i transferfönstret.')
  const awayLosses = completedFixtures.filter(f => {
    const isHome = f.homeClubId === game.managedClubId
    if (isHome) return false
    return (isHome ? f.homeScore : f.awayScore) < (isHome ? f.awayScore : f.homeScore)
  }).length
  if (awayLosses >= 4) tips.push('Bortaformen oroar. Testa en defensivare taktik borta.')
  const recentForm = completedFixtures.slice(-5)
  const recentWins = recentForm.filter(f => {
    const isHome = f.homeClubId === game.managedClubId
    return (isHome ? f.homeScore : f.awayScore) > (isHome ? f.awayScore : f.homeScore)
  }).length
  if (recentWins >= 4) tips.push('Formen pekar uppåt. Håll kursen.')
  const clubFinances = club?.finances ?? 0
  if (clubFinances < 0) tips.push('Kassan krymper. Se över löner eller sök sponsor.')
  if (tips.length === 0) tips.push('Ni ligger stabilt. Fortsätt jobba — våren avgör.')

  function handleContinue() {
    useGameStore.setState(state => ({
      game: state.game ? { ...state.game, showHalfTimeSummary: false } : null
    }))
    navigate('/game/dashboard', { replace: true })
  }

  return (
    <div className="screen-enter texture-wood" style={{ minHeight: '100%', padding: '24px 16px 40px', background: 'var(--bg)' }}>

      {/* Rubrik */}
      <p style={{
        fontSize: 8, fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase',
        color: 'var(--text-muted)', fontFamily: 'var(--font-body)', textAlign: 'center', marginBottom: 6,
      }}>
        HALVVÄGS
      </p>
      <h1 style={{
        fontSize: 22, fontWeight: 400, fontFamily: 'var(--font-display)',
        color: 'var(--text-primary)', textAlign: 'center', marginBottom: 4,
      }}>
        Inför våren
      </h1>
      <p style={{
        fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 20,
        fontFamily: 'var(--font-body)',
      }}>
        {club?.name} · Säsong {game.currentSeason}
      </p>

      {/* Tabellposition */}
      <div className="card-sharp" style={{ padding: '12px 14px', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 36, fontWeight: 400, color: 'var(--accent-dark)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
            {pos}
          </span>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
              {pts} poäng · {standing?.wins ?? 0}V {standing?.draws ?? 0}O {standing?.losses ?? 0}F
            </p>
            <p style={{ fontSize: 11, color: pos <= 8 ? 'var(--success)' : 'var(--danger)', marginTop: 2, fontWeight: 600 }}>
              {pos <= 3 ? `${leaderPts - pts}p till serieledaren` :
               pos <= 8 ? 'I slutspelszonen' :
               `${ptsToTop8}p till slutspelsplats`}
            </p>
          </div>
        </div>
      </div>

      {/* Höstens stunder */}
      {topMoments.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <p style={{
            fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase',
            color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 6,
          }}>
            🏒 DIN HÖST
          </p>
          {topMoments.map((m, i) => (
            <div key={i} className="card-round" style={{ padding: '8px 12px', marginBottom: 4 }}>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', margin: 0 }}>
                {m.icon} <span style={{ fontWeight: 600 }}>Omg {m.matchday}:</span> {m.headline}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Arc-uppdatering */}
      {activeArc && arcPlayer && (
        <div className="card-round" style={{ padding: '8px 12px', marginBottom: 8, border: '1px solid rgba(196,122,58,0.2)' }}>
          <p style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'var(--font-body)', margin: 0, fontStyle: 'italic' }}>
            {activeArc.type === 'hungrig_breakthrough' && `🔥 ${arcPlayer.firstName} ${arcPlayer.lastName} kämpar fortfarande för sitt genombrott.`}
            {activeArc.type === 'veteran_farewell' && `🏅 ${arcPlayer.firstName} ${arcPlayer.lastName}s kontrakt tickar — beslut krävs före mars.`}
            {activeArc.type === 'joker_redemption' && `🎭 ${arcPlayer.firstName} ${arcPlayer.lastName} — alla väntar på revansch.`}
            {activeArc.type === 'contract_drama' && `📋 ${arcPlayer.firstName} ${arcPlayer.lastName} vill ha besked om framtiden.`}
            {activeArc.type === 'ledare_crisis' && `🦁 ${arcPlayer.firstName} ${arcPlayer.lastName} försöker vända lagets kris.`}
          </p>
        </div>
      )}

      {/* Tränartips */}
      <div className="card-sharp" style={{ padding: '10px 12px', marginBottom: 20 }}>
        <p style={{
          fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase',
          color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 6,
        }}>
          📣 INFÖR VÅREN
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', lineHeight: 1.5, margin: 0 }}>
          {tips[0]}
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={handleContinue}
        className="texture-leather"
        style={{
          width: '100%', padding: '16px',
          background: 'linear-gradient(135deg, var(--accent-dark), var(--accent-deep))',
          color: 'var(--text-light)',
          border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600,
          letterSpacing: '2px', textTransform: 'uppercase',
          fontFamily: 'var(--font-body)', cursor: 'pointer',
        }}
      >
        Fortsätt säsongen →
      </button>
    </div>
  )
}
```

### Route-registrering

Lägg till i routern (samma fil som andra game-routes):

```tsx
<Route path="half-time-summary" element={<HalfTimeSummaryScreen />} />
```

### Styling-regler

- `card-sharp` för statistik/position (fontSize 8 labels, 12 body, Georgia display-siffror)
- `card-round` för stunder och arc-text (fontSize 12, italic för arc)
- `texture-wood` bakgrund
- CTA: `texture-leather`, copper gradient, borderRadius 12, versaler, letterSpacing 2px
- Max EN scrollhöjd — inte mer content
- Samma width-begränsning som övriga skärmar (max-width 430px via #root)

---

## STEG 5: "DIN SÄSONG" — SAMLAD TIMELINE I SÄSONGSSAMMANFATTNING

### Vad

Slå ihop "SÄSONGENS STUNDER", "SÄSONGENS BERÄTTELSER", och "SÄSONGENS BERÄTTELSE" till EN sektion. Flytta den till TOPPEN, direkt efter slutplacering.

### Fil: `src/presentation/screens/SeasonSummaryScreen.tsx`

**Sektionsnamn:** "DIN SÄSONG"

**Innehåll:** Kronologisk lista med matchmoment OCH arc-storylines blandat, sorterat på matchday. Max 7 stunder.

**Unika rubriker** — INTE generisk text:
- `Vändningen mot ${opponent} (${score})` istf "Comeback mot X"
- `Katastrofen mot ${opponent} (${score})` istf "Tung förlust mot X"
- `Sent avgörande mot ${opponent} (${score})` istf generisk
- Storylines: `${spelarnamn} bröt isen` / `${spelarnamn} lämnade` / `${spelarnamn} samlade laget`

**Visuellt per stund:**

```tsx
<div className="card-round" style={{ padding: '10px 12px', marginBottom: 6 }}>
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
    <div style={{
      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
      background: 'var(--bg-dark)', color: 'var(--text-light)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-body)',
    }}>
      O{matchday}
    </div>
    <div>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
        {icon} {headline}
      </p>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 2, lineHeight: 1.4 }}>
        {body}
      </p>
      {relatedPlayerName && (
        <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>{relatedPlayerName}</span>
      )}
    </div>
  </div>
</div>
```

**Ta bort** de separata sektionerna "SÄSONGENS BERÄTTELSER" och "SÄSONGENS BERÄTTELSE" — allt in i "DIN SÄSONG".

---

## STEG 6: SPELARKORTET MED HISTORIA

### Vad

PlayerCard visar en mini-timeline av spelarens säsong — inte bara stats.

### Fil: `src/presentation/components/PlayerCard.tsx`

**Lägg till** en ny sektion i PlayerCard, EFTER stats-sektionen:

```tsx
{/* Säsongens händelser */}
{(() => {
  const events: Array<{ round: number; text: string; icon: string }> = []

  // Milstolpar
  for (const m of player.careerMilestones ?? []) {
    if (m.season !== game?.currentSeason) continue
    if (m.type === 'debutGoal') events.push({ round: m.round, text: 'Första A-lagsmålet', icon: '⚡' })
    if (m.type === 'hatTrick') events.push({ round: m.round, text: 'Hattrick', icon: '🎩' })
    if (m.type === 'games100') events.push({ round: m.round, text: '100 A-lagsmatcher', icon: '🏅' })
  }

  // Storylines
  for (const s of storylines ?? []) {
    events.push({ round: s.matchday, text: s.displayText, icon: '📖' })
  }

  if (events.length === 0) return null

  events.sort((a, b) => a.round - b.round)

  return (
    <div style={{ padding: '0 14px 12px' }}>
      <p style={{
        fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase',
        color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 8,
      }}>
        📖 DENNA SÄSONG
      </p>
      {events.slice(0, 4).map((e, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '4px 0', borderBottom: i < events.length - 1 ? '1px solid var(--border)' : 'none',
        }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 28 }}>Omg {e.round}</span>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{e.icon} {e.text}</span>
        </div>
      ))}
    </div>
  )
})()}
```

**OBS:** PlayerCard behöver ta emot `game` som prop (eller via store) för att komma åt `currentSeason`. Kolla hur den importeras — om den redan har `storylines` som prop, lägg till `game` som optional prop.

### Trait-text istf bara badge

Byt trait-badgen från bara `"🔥 Hungrig"` till en mer narrativ rad. I PlayerCard, under trait-sektionen:

```tsx
<p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
  {player.trait === 'hungrig' && `${player.seasonStats.goals} mål på ${player.seasonStats.gamesPlayed} matcher${player.startSeasonCA && player.currentAbility > player.startSeasonCA ? `, CA +${Math.round(player.currentAbility - player.startSeasonCA)} denna säsong` : ''}`}
  {player.trait === 'veteran' && `${(player.careerStats?.seasonsPlayed ?? 1)} säsonger i karriären. ${player.contractUntilSeason <= (game?.currentSeason ?? 0) ? 'Kontraktet löper ut.' : ''}`}
  {player.trait === 'joker' && `Oförutsägbar. ${player.seasonStats.goals} mål och ${player.seasonStats.redCards} utvisningar.`}
  {player.trait === 'lokal' && `Född och uppvuxen här. Publiken älskar honom.`}
  {player.trait === 'ledare' && `Lagets ansikte utåt. ${player.seasonStats.gamesPlayed} matcher som ledare.`}
</p>
```

---

## IMPLEMENTATIONSORDNING

| Steg | Vad | Storlek | Filer |
|------|-----|---------|-------|
| 1.1 | Arc decisionsMade | 10 rader | eventResolver.ts |
| 1.2 | hungrig räkning | 20 rader | arcService.ts |
| 1.3 | Presskonferens inline | 5-20 rader | GranskaScreen.tsx |
| 1.4 | CTA slutspelstext | 10 rader | DashboardScreen.tsx |
| 1.5 | Knapp-färger neutral | 10 rader | EventOverlay.tsx, GranskaScreen.tsx |
| 2 | Trait-kommentarer | 60 rader ny, 10 rader integration | matchCommentary.ts, matchStepByStep.ts, matchSimulator.ts |
| 3 | Rikt matchreferat | 50 rader | CommentaryFeed.tsx |
| 4 | Höstsummering | 150 rader ny skärm + 10 rader trigger | HalfTimeSummaryScreen.tsx, roundProcessor.ts, DashboardScreen.tsx, router |
| 5 | "Din säsong" timeline | 80 rader refactor | SeasonSummaryScreen.tsx |
| 6 | Spelarkort historia | 40 rader | PlayerCard.tsx |

**Committa per steg.** `npm run build && npm test` efter varje.

---

## VERIFIERING — HELA SPRINTEN

Starta nytt spel. Spela 22 omgångar + slutspel. Bekräfta:

- [ ] Arc triggar (hungrig efter 3 starter utan mål, INTE efter 3 av valfria matcher)
- [ ] Arc-val i GranskaScreen kollapsar till ✓ med feedback
- [ ] Arc-resolution använder spelarens val (veteran stannar/lämnar baserat på val)
- [ ] Presskonferens-knappar i GranskaScreen reagerar
- [ ] Trait-kommentarer dyker upp i matchfeed vid mål/utvisning (~50% chans)
- [ ] Slutsignal-referat 3-4 meningar med målskyttar och kontext
- [ ] Höstsummering visas efter omgång 11 med stunder + tips + arc
- [ ] "DIN SÄSONG" i säsongssammanfattning — kronologisk, unika rubriker, max 7
- [ ] Spelarkortet visar milstolpar och storylines som timeline
- [ ] Trait-text narrativ (inte bara badge)
- [ ] CTA säger "Avsluta grundserien" vid plats 9-12
- [ ] Inga förvalda knapp-färger på events
