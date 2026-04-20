import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  useGameStore,
  useManagedClub,
  useCurrentStanding,
  useHasPendingLineup,
  useLastCompletedFixture,
  useCanAdvance,
  usePlayoffInfo,
} from '../store/gameStore'
import { PendingScreen, PlayoffStatus, PlayoffRound } from '../../domain/enums'
import { playSound } from '../audio/soundEffects'
import { getFormResults } from '../utils/formUtils'
import { calcRoundIncome } from '../../domain/services/economyService'
import { csColor, formatFinanceAbs } from '../utils/formatters'
import { DailyBriefing } from '../components/dashboard/DailyBriefing'
import { NextMatchCard } from '../components/dashboard/NextMatchCard'
import { PlayoffBracketCard } from '../components/dashboard/PlayoffBracketCard'
import { CupCard } from '../components/dashboard/CupCard'
import { DiamondDivider } from '../components/dashboard/DiamondDivider'
import { FormSquares } from '../components/FormDots'
import { getManagedClubCupStatus, getCupRoundLabel } from '../../domain/services/cupService'
import { CareerStatsCard } from '../components/dashboard/CareerStatsCard'
import { OrtenSection } from '../components/dashboard/OrtenSection'
import { getPepTalk } from '../../domain/services/pepTalkService'
import { getCoffeeRoomQuote } from '../../domain/services/coffeeRoomService'
import { getTrainingScene } from '../../domain/services/trainingSceneService'
import { getKlackDisplay } from '../../domain/services/klackPresenter'
import type { WeeklyDecision } from '../../domain/services/weeklyDecisionService'
import { SectionLabel } from '../components/SectionLabel'
import { HOTEL_NAMES, RESOLVED_TEXTS } from '../../domain/services/awayTripService'


const NAV_BTN: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
  background: 'transparent', border: '1px solid var(--border)',
  color: 'var(--accent)', fontSize: 11, lineHeight: 1,
  cursor: 'pointer',
}


export function DashboardScreen() {
  const { game, advance, simulateRemainingStep } = useGameStore()
  const simulateAbandonedMatch = useGameStore(s => s.simulateAbandonedMatch)
  const markScreenVisited = useGameStore(s => s.markScreenVisited)
  const resolveWeeklyDecision = useGameStore(s => s.resolveWeeklyDecision)
  const resolveAwayTrip = useGameStore(s => s.resolveAwayTrip)
  const club = useManagedClub()
  const standing = useCurrentStanding()
  const hasPendingLineup = useHasPendingLineup()
  const canAdvance = useCanAdvance()
  const lastCompletedFixture = useLastCompletedFixture()
  const playoffInfo = usePlayoffInfo()
  const navigate = useNavigate()
  useLocation() // reset scroll on route change

  // Mark dashboard visited (for possible future tracking)
  useEffect(() => { markScreenVisited('dashboard') }, [])

  // Auto-simulate match left in abandoned state (e.g. browser refresh mid-match)
  useEffect(() => {
    if (!game) return
    const abandoned = game.fixtures.find(f =>
      f.matchStartedAt &&
      f.status === 'scheduled' &&
      (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) &&
      f.homeLineup &&
      f.awayLineup
    )
    if (abandoned) simulateAbandonedMatch(abandoned.id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps


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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!game || !club) return (
    <div style={{ padding: 20 }}>
      <div className="shimmer" style={{ height: 160, borderRadius: 3, marginBottom: 10 }} />
      <div className="shimmer" style={{ height: 80, borderRadius: 3, marginBottom: 10 }} />
      <div className="shimmer" style={{ height: 80, borderRadius: 3 }} />
    </div>
  )

  // ── Shared computations ────────────────────────────────────────

  function isManagedTeamEliminated(): boolean {
    const bracket = game!.playoffBracket
    if (!bracket) return false
    const id = game!.managedClubId
    const allSeries = [...(bracket.quarterFinals ?? []), ...(bracket.semiFinals ?? []), ...(bracket.final ? [bracket.final] : [])]
    return allSeries.some(s => s.loserId === id)
  }

  const eliminated = isManagedTeamEliminated()

  const nextFixture = game.fixtures
    .filter(f => {
      if (f.status !== 'scheduled') return false
      if (f.homeClubId !== game.managedClubId && f.awayClubId !== game.managedClubId) return false
      if (eliminated && f.matchday > 26 && !f.isCup) return false
      return true
    })
    .sort((a, b) => a.matchday - b.matchday)[0] ?? null

  const matchWeather = nextFixture ? (game.matchWeathers ?? []).find(mw => mw.fixtureId === nextFixture.id) : undefined
  const opponent = nextFixture ? game.clubs.find(c => c.id === (nextFixture.homeClubId === game.managedClubId ? nextFixture.awayClubId : nextFixture.homeClubId)) ?? null : null
  const isHome = nextFixture ? nextFixture.homeClubId === game.managedClubId : false

  let lastResult: { scoreFor: number; scoreAgainst: number; opponentName: string } | null = null
  if (lastCompletedFixture) {
    const isHomeTeam = lastCompletedFixture.homeClubId === game.managedClubId
    const scoreFor = isHomeTeam ? lastCompletedFixture.homeScore : lastCompletedFixture.awayScore
    const scoreAgainst = isHomeTeam ? lastCompletedFixture.awayScore : lastCompletedFixture.homeScore
    const lastOpponent = game.clubs.find(c => c.id === (isHomeTeam ? lastCompletedFixture.awayClubId : lastCompletedFixture.homeClubId))
    lastResult = { scoreFor, scoreAgainst, opponentName: lastOpponent?.name ?? 'Okänd' }
  }

  const lastPlayedRound = game.fixtures.filter(f => f.status === 'completed' && !f.isCup).reduce((max, f) => Math.max(max, f.roundNumber), 0)
  const currentRound = nextFixture && !nextFixture.isCup ? nextFixture.roundNumber : lastPlayedRound

  const currentDateObj = new Date(game.currentDate)
  const MONTHS = ['januari','februari','mars','april','maj','juni','juli','augusti','september','oktober','november','december']
  const currentDateStr = `${currentDateObj.getDate()} ${MONTHS[currentDateObj.getMonth()]} ${currentDateObj.getFullYear()}`

  function getSeasonalBackground(date: Date): string {
    const month = date.getMonth() + 1
    switch (month) {
      case 10: return 'var(--bg-october)'
      case 11: return 'var(--bg-november)'
      case 12: return 'var(--bg-december)'
      case 1:  return 'var(--bg-january)'
      case 2:  return 'var(--bg-february)'
      case 3:  return 'var(--bg-march)'
      case 4:  return 'var(--bg-april)'
      default: return 'var(--bg)'
    }
  }

  const recentForm = getFormResults(game.managedClubId, game.fixtures, game.clubs)

  const isPlayoffFixture = !!(nextFixture && nextFixture.roundNumber > 22)
  const playoffSeries = isPlayoffFixture && playoffInfo ? (() => {
    const allSeries = [...playoffInfo.quarterFinals, ...playoffInfo.semiFinals, ...(playoffInfo.final ? [playoffInfo.final] : [])]
    return allSeries.find(s => s.fixtures.includes(nextFixture!.id)) ?? null
  })() : null

  const managedIsSeriesHome = playoffSeries ? playoffSeries.homeClubId === game.managedClubId : false
  const dynamicHomeWins = playoffSeries ? (managedIsSeriesHome ? playoffSeries.homeWins : playoffSeries.awayWins) : 0
  const dynamicAwayWins = playoffSeries ? (managedIsSeriesHome ? playoffSeries.awayWins : playoffSeries.homeWins) : 0

  // CTA logic
  const hasScheduledFixtures = game.fixtures.some(f => f.status === 'scheduled')
  const canClickAdvance = canAdvance || hasScheduledFixtures
  const playedRounds = game.fixtures.filter(f => f.status === 'completed' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) && !f.isCup).length
  const nextManagedScheduled = game.fixtures
    .filter(f => f.status === 'scheduled' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
    .sort((a, b) => a.matchday - b.matchday)[0]
  // Hide simulate button if next managed fixture is a cup match — user should play it themselves
  const canSimulateRemaining = hasScheduledFixtures && playedRounds >= 12 && !game.playoffBracket && !nextManagedScheduled?.isCup && game.pendingScreen !== PendingScreen.HalfTimeSummary

  const advanceButtonText = (() => {
    const scheduled = game.fixtures.filter(f => f.status === 'scheduled')
    if (scheduled.length === 0) {
      if (!game.playoffBracket) {
        const standing = game.standings.find(s => s.clubId === game.managedClubId)
        return standing && standing.position <= 8 ? 'Starta slutspel →' : 'Avsluta grundserien →'
      }
      if (game.playoffBracket.status === PlayoffStatus.Completed) return 'Avsluta säsongen →'
      return 'Fortsätt slutspel →'
    }
    const nextManaged = scheduled.filter(f => {
      if (f.homeClubId !== game.managedClubId && f.awayClubId !== game.managedClubId) return false
      if (eliminated && f.matchday > 26 && !f.isCup) return false
      return true
    }).sort((a, b) => a.matchday - b.matchday)[0]
    if (nextManaged) {
      if (nextManaged.isCup) {
        const cupMatch = game.cupBracket?.matches.find(m => m.fixtureId === nextManaged.id)
        const cupRound = cupMatch?.round ?? 1
        const cupLabel = cupRound === 1 ? 'Förstarunda' : cupRound === 2 ? 'Kvartsfinal' : cupRound === 3 ? 'Semifinal' : 'Final'
        return `Spela Cup-${cupLabel} →`
      }
      if (game.playoffBracket) {
        const allSeries = [
          ...game.playoffBracket.quarterFinals,
          ...game.playoffBracket.semiFinals,
          ...(game.playoffBracket.final ? [game.playoffBracket.final] : []),
        ]
        const thisSeries = allSeries.find(s => s.fixtures.includes(nextManaged.id))
        if (thisSeries) {
          const label = thisSeries.round === PlayoffRound.QuarterFinal ? 'Kvartsfinal'
            : thisSeries.round === PlayoffRound.SemiFinal ? 'Semifinal'
            : 'SM-Final'
          return `Redo — spela ${label} →`
        }
        return 'Fortsätt slutspel →'
      }
      return `Redo — spela omgång ${nextManaged.roundNumber} →`
    }
    return 'Fortsätt →'
  })()

  const handleSimulateRemaining = () => {
    playSound('click')

    // Snapshot state before simulation
    const gameBeforeSim = useGameStore.getState().game
    if (!gameBeforeSim) return
    const managedId = gameBeforeSim.managedClubId
    const standingBefore = gameBeforeSim.standings.find(s => s.clubId === managedId)
    const positionBefore = standingBefore?.position ?? 0
    const pointsBefore = standingBefore?.points ?? 0
    // Record which managed fixtures were already completed before simulation
    const completedBefore = new Set(
      gameBeforeSim.fixtures
        .filter(f => f.status === 'completed' && (f.homeClubId === managedId || f.awayClubId === managedId))
        .map(f => f.id)
    )

    let safetyLimit = 100  // 22 liga + ~4 cup + ~10 playoff = need headroom
    while (safetyLimit-- > 0) {
      const currentGame = useGameStore.getState().game
      if (!currentGame) break
      if (currentGame.pendingScreen === PendingScreen.HalfTimeSummary) break  // halt at mid-season summary
      if (currentGame.pendingScreen === PendingScreen.PlayoffIntro) break    // halt at playoff intro
      if (currentGame.pendingScreen === PendingScreen.QFSummary) break       // halt at QF summary
      // advance() handles cup-skip internally — loop stops at playoffStarted or seasonEnded.
      const result = simulateRemainingStep()
      if (!result) break
      if (result.seasonEnded) break
      if (result.playoffStarted) break
      if (result.hasManagedCupMatch) break  // cup match pending — user must play it
      // Stop if no more scheduled fixtures (season end / playoff start handled by dashboard)
      const hasMore = useGameStore.getState().game?.fixtures.some(f => f.status === 'scheduled')
      if (!hasMore) break
    }

    // Collect newly completed managed fixtures
    const gameAfterSim = useGameStore.getState().game
    const standingAfter = gameAfterSim?.standings.find(s => s.clubId === managedId)
    const positionAfter = standingAfter?.position ?? positionBefore
    const pointsAfter = standingAfter?.points ?? pointsBefore
    const simulatedFixtures = (gameAfterSim?.fixtures ?? []).filter(
      f => f.status === 'completed'
        && (f.homeClubId === managedId || f.awayClubId === managedId)
        && !completedBefore.has(f.id)
    ).sort((a, b) => a.matchday - b.matchday)

    navigate('/game/sim-summary', {
      replace: true,
      state: { simulatedFixtures, positionBefore, positionAfter, pointsBefore, pointsAfter },
    })
  }

  const handleAdvance = () => {
    playSound('click')
    const scheduledFixtures = game.fixtures.filter(f => f.status === 'scheduled')
    if (scheduledFixtures.length === 0) {
      try {
        advance()
      } catch (err) { console.error('advance() failed:', err) }
      return
    }
    const nextSimEff = Math.min(...scheduledFixtures.map(f => f.matchday))
    const managedMatchInNextRound = scheduledFixtures.find(f => f.matchday === nextSimEff && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
    if (managedMatchInNextRound) { navigate('/game/match'); return }
    try {
      advance()
    } catch (err) { console.error('advance() failed:', err) }
  }

  // ── Nudge-agenda ───────────────────────────────────────────────
  const visited = game.visitedScreensThisRound ?? []
  const squadPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  const injuredCount = squadPlayers.filter(p => p.isInjured).length
  const expiringPlayer = squadPlayers.find(p => p.contractUntilSeason <= game.currentSeason)

  // ── First round ────────────────────────────────────────────────
  const isFirstRound = !game.fixtures.some(f =>
    f.status === 'completed' &&
    (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
  )

  const nudges: { text: string; screen: string; state?: Record<string, unknown>; done: boolean; color: 'red' | 'yellow' | 'green' }[] = []
  if (injuredCount > 0) nudges.push({ text: `Kontrollera truppen (${injuredCount} skadad${injuredCount > 1 ? 'e' : ''})`, screen: 'squad', done: visited.includes('squad'), color: 'red' })
  if (expiringPlayer && nudges.length < 3) nudges.push({ text: `Förläng kontrakt: ${expiringPlayer.firstName} ${expiringPlayer.lastName}`, screen: 'transfers', state: { tab: 'contracts' }, done: visited.includes('transfers'), color: 'red' })
  const atRisk = (game.boardObjectives ?? []).find(o => o.status === 'at_risk')
  const active = (game.boardObjectives ?? []).find(o => o.status === 'active')
  const obj = atRisk ?? active
  if (obj && nudges.length < 3) {
    const objTab = obj.type === 'academy' ? 'akademi' : obj.type === 'economic' ? 'ekonomi' : obj.type === 'community' ? 'orten' : 'ekonomi'
    nudges.push({ text: `Styrelseuppdrag: ${obj.label}`, screen: 'club', state: { tab: objTab }, done: visited.includes('club'), color: atRisk ? 'red' : 'yellow' })
  }
  if (!isFirstRound && game.onboardingStep !== undefined && game.onboardingStep <= 4 && nudges.length < 3) {
    const onboardingHints: Record<number, { text: string; screen: string; state?: Record<string, unknown> }> = {
      1: { text: 'Justera träningen', screen: 'club', state: { tab: 'training' } },
      2: { text: 'Kolla styrelsens uppdrag', screen: 'club', state: { tab: 'ekonomi' } },
      3: { text: 'Besök Orten', screen: 'club', state: { tab: 'orten' } },
    }
    const oh = onboardingHints[game.onboardingStep]
    if (oh) nudges.push({ text: oh.text, screen: oh.screen, state: oh.state, done: visited.includes(oh.screen), color: 'green' })
  }
  const doneCount = nudges.filter(n => n.done).length

  // ── Ekonomi data ───────────────────────────────────────────────
  const finances = club.finances ?? 0
  const { netPerRound } = calcRoundIncome({
    club,
    players: squadPlayers,
    sponsors: game.sponsors ?? [],
    communityActivities: game.communityActivities,
    fanMood: game.fanMood ?? 50,
    isHomeMatch: true,
    matchIsKnockout: false,
    matchIsCup: false,
    matchHasRivalry: false,
    standing: standing ?? null,
    rand: () => 0.5,
  })

  // ── Community standing ─────────────────────────────────────────
  const cs = game.communityStanding ?? 50

  // ── Trupp single-row data ──────────────────────────────────────
  const readyCount = Math.max(0, squadPlayers.length - injuredCount)
  const avgForm = squadPlayers.length > 0 ? Math.round(squadPlayers.reduce((s, p) => s + p.form, 0) / squadPlayers.length) : 0
  const avgFitness = squadPlayers.length > 0 ? Math.round(squadPlayers.reduce((s, p) => s + (p.fitness ?? 75), 0) / squadPlayers.length) : 0

  // ── Cup visibility ─────────────────────────────────────────────
  const nextCupFixture = game.fixtures.find(f =>
    f.isCup && f.status === 'scheduled' &&
    (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
  )
  const cupStatus = game.cupBracket ? getManagedClubCupStatus(game.cupBracket, game.managedClubId) : null
  const cupEliminated = cupStatus?.eliminated ?? false
  const showExpandedCup = !!(game.cupBracket && !cupEliminated && nextCupFixture)

  // ── Dashboard priority (VIS-001) ────────────────────────────────
  type DashboardPriority = 'event' | 'weekly_decision' | 'match' | 'arc' | 'last_match_glory' | 'default'
  function getPrimaryCard(): DashboardPriority {
    const hasCriticalEvent = (game!.pendingEvents ?? []).some(e => !e.resolved && e.type !== 'pressConference')
    if (hasCriticalEvent) return 'event'
    if (game!.pendingWeeklyDecision) return 'weekly_decision'
    if (nextFixture && !game!.lineupConfirmedThisRound) return 'match'
    if (game!.trainerArc?.current === 'crisis') return 'arc'
    const lastWasSpecial = lastCompletedFixture && (() => {
      const isHome = lastCompletedFixture.homeClubId === game!.managedClubId
      const scored = isHome ? (lastCompletedFixture.homeScore ?? 0) : (lastCompletedFixture.awayScore ?? 0)
      const conceded = isHome ? (lastCompletedFixture.awayScore ?? 0) : (lastCompletedFixture.homeScore ?? 0)
      return scored > conceded && (scored - conceded >= 3 || lastCompletedFixture.matchday > 22)
    })()
    if (lastWasSpecial) return 'last_match_glory'
    return 'default'
  }
  const primaryCard = getPrimaryCard()
  const collapseGrid = primaryCard !== 'default'

  // ── Trainer arc ────────────────────────────────────────────────

  // ── Render ─────────────────────────────────────────────────────

  return (
    <>
    <div className="screen-enter" style={{ position: 'relative', minHeight: '100%', background: getSeasonalBackground(currentDateObj) }}>


      <div className="texture-wood card-stack" style={{ paddingTop: 8, paddingBottom: 'var(--scroll-padding-bottom)' }}>

        {/* ① VÄLKOMSTKORT (omgång 1) eller AGENDA (övriga omgångar) */}
        {isFirstRound ? (
          <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px' }}>
            <SectionLabel style={{ marginBottom: 8 }}>🏒 SÄSONGSSTART {game.currentSeason}</SectionLabel>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10, fontFamily: 'var(--font-body)' }}>
              Säsongen börjar. Sätt din startelva för {club.name} och kör.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {nudges.map((n, i) => (
                <div
                  key={i}
                  onClick={() => !n.done && navigate(`/game/${n.screen}`, n.state ? { state: n.state } : undefined)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 10px', borderRadius: 8,
                    background: 'var(--bg-surface)', border: '0.5px solid var(--border)',
                    cursor: n.done ? 'default' : 'pointer',
                    fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)',
                    opacity: n.done ? 0.5 : 1,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: n.done ? 'var(--success)' : 'var(--danger)' }} />
                  <span style={{ flex: 1, textDecoration: n.done ? 'line-through' : 'none' }}>{n.text}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--accent)' }}>→</span>
                </div>
              ))}
            </div>
          </div>
        ) : nudges.length > 0 ? (
          <div style={{ margin: '0 0 6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2px', marginBottom: 4 }}>
              <SectionLabel>Att göra</SectionLabel>
              <span style={{ fontSize: 8, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>{doneCount} av {nudges.length} klart</span>
            </div>
            {nudges.map((n, i) => (
              <div
                key={i}
                onClick={() => !n.done && navigate(`/game/${n.screen}`, n.state ? { state: n.state } : undefined)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 10px', borderRadius: 8,
                  background: 'var(--bg-surface)', border: '0.5px solid var(--border)',
                  cursor: n.done ? 'default' : 'pointer',
                  fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)',
                  opacity: n.done ? 0.5 : 1, marginBottom: i < nudges.length - 1 ? 3 : 0,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: n.done ? 'var(--success)' : n.color === 'red' ? 'var(--danger)' : 'var(--warning)' }} />
                <span style={{ flex: 1, textDecoration: n.done ? 'line-through' : 'none' }}>{n.text}</span>
                {n.done && <span style={{ fontSize: 9, color: 'var(--success)', marginLeft: 'auto' }}>✓</span>}
              </div>
            ))}
          </div>
        ) : null}

        {/* Transferdödline-indikator (omgång 13-15) */}
        {(() => {
          const windowClosesIn = Math.max(0, 15 - currentRound)
          if (windowClosesIn <= 0 || windowClosesIn > 3 || currentRound === 0) return null
          return (
            <div style={{
              padding: '6px 12px',
              background: 'rgba(176,80,64,0.06)',
              border: '1px solid rgba(176,80,64,0.2)',
              borderRadius: 8,
              textAlign: 'center',
              marginBottom: 4,
            }}>
              <p style={{ fontSize: 10, color: 'var(--danger)', fontWeight: 600, margin: 0 }}>
                ⏳ Transferfönstret stänger om {windowClosesIn} omgång{windowClosesIn > 1 ? 'ar' : ''}
              </p>
            </div>
          )
        })()}

        {/* ② MATCHKORT — accent border when it's the primary card */}
        {nextFixture && opponent && (
          <div style={primaryCard === 'match' ? { border: '2px solid var(--accent)', borderRadius: 10, marginBottom: 6 } : {}}>
          <NextMatchCard
            nextFixture={nextFixture}
            opponent={opponent}
            isHome={isHome}
            club={club}
            game={game}
            isPlayoffFixture={isPlayoffFixture}
            playoffSeries={playoffSeries}
            dynamicHomeWins={dynamicHomeWins}
            dynamicAwayWins={dynamicAwayWins}
            matchWeather={matchWeather}
            hasPendingLineup={hasPendingLineup}
            lineupConfirmedThisRound={game.lineupConfirmedThisRound}
          />
          </div>
        )}

        {/* ② BORTARESA (WEAK-019) */}
        {game.awayTrip && nextFixture && !isHome && (
          <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px' }}>
            <SectionLabel style={{ marginBottom: 6 }}>🚌 BORTARESA — {opponent?.name}</SectionLabel>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>
              Bussen avgår fredag 14:00. Övernattning på {HOTEL_NAMES[game.awayTrip.hotel]}.
              {game.awayTrip.weatherWarning && ` ${game.awayTrip.weatherWarning}.`}
            </p>
            {game.awayTrip.mikrobeslut === null && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                {([
                  { id: 'book_nice' as const, label: 'Bättre hotell — 8k kr', sub: '+2 moral på startelvan' },
                  { id: 'ask_foundation' as const, label: 'Fråga föreningen om mattstöd', sub: '−2 orten' },
                  { id: 'stay_home' as const, label: 'Åk samma kväll', sub: '−3 form på startelvan' },
                ] as const).map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => resolveAwayTrip(opt.id)}
                    style={{
                      padding: '7px 10px', borderRadius: 6, textAlign: 'left',
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      cursor: 'pointer', fontSize: 11, color: 'var(--text-secondary)',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{opt.label}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>{opt.sub}</span>
                  </button>
                ))}
              </div>
            )}
            {game.awayTrip.mikrobeslut !== null && (
              <p style={{ fontSize: 10, fontStyle: 'italic', color: 'var(--text-muted)', marginTop: 6 }}>
                {RESOLVED_TEXTS[game.awayTrip.mikrobeslut]}
              </p>
            )}
          </div>
        )}

        {/* Eliminated */}
        {eliminated && !nextFixture && game.playoffBracket && game.playoffBracket.status !== PlayoffStatus.Completed && (
          <div className="card-sharp" style={{ margin: '0 0 6px', padding: '14px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>Din säsong är slut</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>Väntar på att slutspelet ska avgöras...</p>
          </div>
        )}

        {/* ③ DAGBOKEN */}
        <DailyBriefing game={game} />

        {/* ③a ORTEN FEED */}
        <OrtenSection
          game={game}
          currentMatchday={nextFixture?.matchday ?? lastPlayedRound}
        />

        {/* ③b TRÄNINGSSCENEN */}
        {(() => {
          const scene = getTrainingScene(game)
          if (!scene) return null
          return (
            <div className="card-round" style={{ padding: '8px 12px', marginBottom: 6 }}>
              <SectionLabel style={{ marginBottom: 4 }}>🏋️ TRÄNINGSPLAN</SectionLabel>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5, fontFamily: 'var(--font-display)', margin: 0 }}>
                {scene}
              </p>
            </div>
          )
        })()}

        {/* ③c TRÄNARKARRIÄR */}
        <CareerStatsCard game={game} />

        {/* ④ ÖVERBLICK — collapsed rows when primary card active, otherwise 2×2 grid */}
        {collapseGrid && (
          <div className="card-sharp" style={{ margin: '0 0 6px', padding: '7px 10px', display: 'flex', flexDirection: 'column', gap: 0 }}>
            {standing && (
              <div onClick={() => navigate('/game/tabell')} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                <span style={{ fontSize: 13, width: 20 }}>📊</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>Tabell</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {standing.position}:a · {standing.points}p
                </span>
              </div>
            )}
            <div onClick={() => navigate('/game/club', { state: { tab: 'ekonomi' } })} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
              <span style={{ fontSize: 13, width: 20 }}>💰</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>Ekonomi</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: finances < 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                {formatFinanceAbs(finances)}
              </span>
            </div>
            <div onClick={() => navigate('/game/club', { state: { tab: 'orten' } })} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', cursor: 'pointer' }}>
              <span style={{ fontSize: 13, width: 20 }}>🏘</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>Orten</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: csColor(cs) }}>CS {cs}</span>
            </div>
          </div>
        )}
        {!collapseGrid && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, margin: '0 0 6px' }}>

          {/* Tabell */}
          {standing ? (
            <div className="card-sharp" style={{ padding: '8px 10px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }} onClick={() => navigate('/game/tabell')}>
              {standing.position <= 8 && currentRound > 0 && (
                <span className="tag tag-fill" style={{ position: 'absolute', top: -1, right: 6, borderRadius: '0 0 6px 6px', letterSpacing: '1px', fontSize: 8 }}>
                  TOPP 8
                </span>
              )}
              <SectionLabel style={{ marginBottom: 6 }}>📊 Tabell</SectionLabel>
              {standing.played === 0 ? (
                <>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3, fontFamily: 'var(--font-display)' }}>12 lag · 22 omg</p>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-body)' }}>Okt – Mar</p>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 30, fontWeight: 400, color: 'var(--accent-dark)', lineHeight: 1, fontFamily: 'var(--font-display)' }}>
                      {standing.position}
                    </span>
                    <div>
                      <p style={{ fontSize: 9, color: 'var(--text-muted)', margin: 0 }}>{standing.points}p · {standing.goalDifference >= 0 ? '+' : ''}{standing.goalDifference}</p>
                      <p style={{ fontSize: 8, fontWeight: 600, marginTop: 2, color: standing.position <= 8 ? 'var(--success)' : standing.position <= 10 ? 'var(--text-muted)' : 'var(--danger)' }}>
                        {standing.position <= 8 ? 'Slutspelszonen' : standing.position <= 10 ? 'Utanför' : 'Nedflyttning'}
                      </p>
                    </div>
                  </div>
                  {recentForm.length > 0 && (
                    <div style={{ marginTop: 5 }}>
                      <FormSquares results={recentForm} size={10} />
                    </div>
                  )}
                </>
              )}
            </div>
          ) : <div />}

          {/* Senast */}
          {lastResult ? (
            <div className="card-sharp" style={{ padding: '8px 10px', cursor: 'pointer' }} onClick={() => navigate('/game/match', { state: { showReport: true } })}>
              <SectionLabel style={{ marginBottom: 6 }}>Senast</SectionLabel>
              {(() => {
                const won = lastResult!.scoreFor > lastResult!.scoreAgainst
                const lost = lastResult!.scoreFor < lastResult!.scoreAgainst
                const rc = won ? 'var(--success)' : lost ? 'var(--danger)' : 'var(--accent)'
                return (
                  <>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontSize: 22, fontWeight: 800, color: rc, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                        {lastResult!.scoreFor}–{lastResult!.scoreAgainst}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: rc, padding: '1px 6px', borderRadius: 99, border: `1px solid ${rc}` }}>
                        {won ? 'V' : lost ? 'F' : 'O'}
                      </span>
                    </div>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-body)' }}>
                      vs {lastResult!.opponentName.split(' ')[0]}
                    </p>
                    {lastCompletedFixture?.report?.playerOfTheMatchId && (() => {
                      const potm = game.players.find(p => p.id === lastCompletedFixture.report?.playerOfTheMatchId)
                      return potm ? <p style={{ fontSize: 10, color: 'var(--accent)', marginTop: 2 }}>⭐ {potm.lastName}</p> : null
                    })()}
                  </>
                )
              })()}
            </div>
          ) : (
            <div className="card-sharp" style={{ padding: '8px 10px', cursor: 'pointer' }} onClick={() => navigate('/game/club', { state: { tab: 'ekonomi' } })}>
              <SectionLabel style={{ marginBottom: 6 }}>🎯 Styrelsens mål</SectionLabel>
              {(game.boardObjectives ?? []).slice(0, 2).map((o, i) => (
                <p key={i} style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', marginBottom: 2, lineHeight: 1.4 }}>"{o.label}"</p>
              ))}
              {(game.boardObjectives ?? []).length === 0 && (
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Inga uppdrag ännu</p>
              )}
            </div>
          )}

          {/* Orten */}
          <div data-coach-id="orten-card" className="card-sharp" style={{ padding: '8px 10px', cursor: 'pointer' }} onClick={() => navigate('/game/club', { state: { tab: 'orten' } })}>
            <SectionLabel style={{ marginBottom: 6 }}>🏘 Orten</SectionLabel>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 5 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: csColor(cs), fontFamily: 'var(--font-display)', lineHeight: 1 }}>{cs}</span>
              {(() => {
                const delta = game.communityStandingDelta
                if (delta == null) return null
                if (delta === 0) return (
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', lineHeight: 1 }}>→</span>
                )
                return (
                  <span style={{ fontSize: 10, fontWeight: 700, color: delta > 0 ? 'var(--success)' : 'var(--danger)', lineHeight: 1 }}>
                    {delta > 0 ? `+${delta} ↑` : `${delta} ↓`}
                  </span>
                )
              })()}
            </div>
            <div style={{ display: 'flex', gap: 2 }}>
              <div style={{ flex: cs, height: 5, background: csColor(cs), borderRadius: '3px 0 0 3px' }} />
              <div style={{ flex: 100 - cs, height: 5, background: 'var(--border-dark)', borderRadius: '0 3px 3px 0' }} />
            </div>
          </div>

          {/* Ekonomi */}
          <div className="card-sharp" style={{ padding: '8px 10px', cursor: 'pointer' }} onClick={() => navigate('/game/club', { state: { tab: 'ekonomi' } })}>
            <SectionLabel style={{ marginBottom: 6 }}>💰 Ekonomi</SectionLabel>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: finances < 0 ? 'var(--danger)' : 'var(--text-primary)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                {formatFinanceAbs(finances)}
              </span>
              <span style={{ fontSize: 10, fontWeight: 600, color: netPerRound >= 0 ? 'var(--success)' : 'var(--danger)', fontFamily: 'var(--font-body)' }}>
                {netPerRound >= 0 ? '+' : ''}{Math.round(netPerRound / 1000)} tkr/omg
              </span>
            </div>
            {game.averageAttendance != null && (
              <p style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 3, fontFamily: 'var(--font-body)' }}>
                👥 Snitt: {game.averageAttendance.toLocaleString('sv-SE')}
                {game.previousAverageAttendance != null && game.previousAverageAttendance !== game.averageAttendance && (
                  <span style={{ color: game.averageAttendance > game.previousAverageAttendance ? 'var(--success)' : 'var(--danger)', marginLeft: 4 }}>
                    {game.averageAttendance > game.previousAverageAttendance ? '+' : ''}{(game.averageAttendance - game.previousAverageAttendance).toLocaleString('sv-SE')}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>}

        {/* ⑩ KLACKEN */}
        {(() => {
          const sg = game.supporterGroup
          if (!sg) return null
          const klack = getKlackDisplay(game, nextFixture?.matchday ?? lastPlayedRound)
          if (!klack) return null

          const ROLE_EMOJI: Record<string, string> = { leader: '📣', veteran: '🏆', youth: '🎨', family: '👨‍👩‍👧' }
          const ROLE_DESC: Record<string, string> = {
            leader: 'ordförande',
            veteran: `veteran sedan ${sg.founded}`,
            youth: 'första säsongen i klacken',
            family: 'familjefar i klacken',
          }

          const cardBase: React.CSSProperties = {
            margin: '0 0 6px',
            padding: '12px 14px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
            cursor: 'pointer',
            position: 'relative',
          }

          const headRow = (sub: string) => (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
                📯 {sg.name}
              </span>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>{sub}</span>
            </div>
          )

          if (klack.type === 'event') {
            return (
              <div
                data-coach-id="klacken-card"
                className="card-sharp"
                style={{ ...cardBase, padding: 0, overflow: 'hidden' }}
                onClick={() => navigate('/game/club', { state: { tab: 'orten' } })}
              >
                {/* Leather bar */}
                <div style={{
                  background: 'var(--accent)',
                  height: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 12px',
                }}>
                  <span style={{ color: '#fff', fontSize: 9, fontWeight: 700, letterSpacing: '2px', fontFamily: 'var(--font-body)' }}>
                    HÄNDELSE
                  </span>
                  <span style={{ color: '#fff', fontSize: 9, opacity: 0.8, letterSpacing: '1px', fontFamily: 'var(--font-body)' }}>
                    OMG {currentRound} · {currentDateStr}
                  </span>
                </div>
                {/* Content */}
                <div style={{ padding: '10px 12px' }}>
                  {headRow(`grundad ${sg.founded}`)}
                  <p style={{ fontSize: 14, fontWeight: 700, margin: '4px 0 6px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', lineHeight: 1.3 }}>
                    {klack.title}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 8px', fontFamily: 'var(--font-display)' }}>
                    {klack.body}
                  </p>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, fontFamily: 'var(--font-body)' }}>
                    {klack.note}
                  </p>
                </div>
              </div>
            )
          }

          if (klack.type === 'mood') {
            const isLow = klack.extreme === 'low'
            return (
              <div
                data-coach-id="klacken-card"
                style={{
                  ...cardBase,
                  borderColor: isLow ? 'rgba(176,80,64,0.35)' : 'rgba(95,127,95,0.35)',
                  background: isLow
                    ? 'linear-gradient(180deg, var(--bg-elevated) 0%, rgba(176,80,64,0.04) 100%)'
                    : 'linear-gradient(180deg, var(--bg-elevated) 0%, rgba(95,127,95,0.04) 100%)',
                }}
                onClick={() => navigate('/game/club', { state: { tab: 'orten' } })}
              >
                {headRow(klack.subLabel)}
                <p style={{ fontSize: 14, fontWeight: 700, margin: '4px 0 6px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', lineHeight: 1.3 }}>
                  {klack.title}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 8px', fontFamily: 'var(--font-display)' }}>
                  {klack.body}
                </p>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, fontFamily: 'var(--font-body)' }}>
                  mood{' '}
                  <span style={{ color: isLow ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>
                    {sg.mood}
                  </span>
                  {' '}· {sg.members} medlemmar
                </p>
              </div>
            )
          }

          // Mode C: Person i fokus
          return (
            <div
              data-coach-id="klacken-card"
              style={cardBase}
              onClick={() => navigate('/game/club', { state: { tab: 'orten' } })}
            >
              {headRow(`mood ${sg.mood} · ${sg.members} medlemmar`)}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0 8px' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, flexShrink: 0,
                }}>
                  {ROLE_EMOJI[klack.role]}
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, margin: 0, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                    {klack.character.name}, {klack.age}
                  </p>
                  <p style={{ fontSize: 9, color: 'var(--text-muted)', margin: '2px 0 0', fontFamily: 'var(--font-body)' }}>
                    {ROLE_DESC[klack.role]}
                  </p>
                </div>
              </div>
              <p style={{
                fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5,
                margin: '0 0 6px', paddingLeft: 10,
                borderLeft: '2px solid var(--border)', fontFamily: 'var(--font-display)',
              }}>
                "{klack.quote}"
              </p>
              {klack.favoritePlayerName && (
                <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, fontFamily: 'var(--font-body)' }}>
                  ❤️ Egen favorit: {klack.favoritePlayerName}
                </p>
              )}
            </div>
          )
        })()}

        {/* ⑤ ENRADERS-KORT */}

        {/* Trupp */}
        <div className="card-sharp" style={{ margin: '0 0 4px', cursor: 'pointer' }} onClick={() => navigate('/game/squad')}>
          <div style={{ padding: '7px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>👥 Trupp</span>
              <span style={{ fontSize: 11, color: injuredCount > 0 ? 'var(--danger)' : 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
                {readyCount} redo{injuredCount > 0 ? ` · ${injuredCount} skadad${injuredCount > 1 ? 'e' : ''}` : ''} · Form {avgForm} · Kond {avgFitness}
              </span>
            </div>
            <button style={NAV_BTN}>›</button>
          </div>
        </div>

        {/* Cup eller Slutspel */}
        {game.playoffBracket ? (
          <div className="card-sharp" style={{ margin: '0 0 4px', cursor: 'pointer' }} onClick={() => navigate('/game/tabell')}>
            <div style={{ padding: '7px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>⚔️ Slutspel</span>
                {playoffSeries ? (
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
                    {playoffSeries.round === PlayoffRound.QuarterFinal ? 'Kvartsfinal' : playoffSeries.round === PlayoffRound.SemiFinal ? 'Semifinal' : 'SM-Final'} · {dynamicHomeWins}–{dynamicAwayWins} i matcher
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>Topp 8</span>
                )}
              </div>
              <button style={NAV_BTN}>›</button>
            </div>
          </div>
        ) : game.cupBracket && !showExpandedCup ? (
          <div className="card-sharp" style={{ margin: '0 0 4px', cursor: 'pointer' }} onClick={() => navigate('/game/tabell', { state: { tab: 'cupen' } })}>
            <div style={{ padding: '7px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>🏆 Cupen</span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
                  {cupEliminated ? 'Utslagna' : (() => {
                    const hasBye = game.cupBracket!.matches.some(m => m.isBye && (m.homeClubId === game.managedClubId || m.awayClubId === game.managedClubId))
                    if (hasBye) return 'Direktkvalificerad till kvartsfinal'
                    const nextScheduled = game.fixtures.filter(f => f.isCup && f.status === 'scheduled').sort((a, b) => a.matchday - b.matchday)[0]
                    if (nextScheduled) {
                      const cupMatch = game.cupBracket!.matches.find(m => m.fixtureId === nextScheduled.id)
                      const round = cupMatch?.round ?? 1
                      return `${getCupRoundLabel(round)} md ${nextScheduled.matchday}`
                    }
                    return 'Startar snart'
                  })()}
                </span>
              </div>
              <button style={NAV_BTN}>›</button>
            </div>
          </div>
        ) : null}

        {/* Akademi */}
        {game.youthTeam && (
          <div className="card-sharp" style={{ margin: '0 0 4px', cursor: 'pointer' }} onClick={() => navigate('/game/club', { state: { tab: 'akademi' } })}>
            <div style={{ padding: '7px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>🎓 Akademi</span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
                  P19 · {game.youthTeam.tablePosition}:a · {game.youthTeam.seasonRecord.w}V {game.youthTeam.seasonRecord.d}O {game.youthTeam.seasonRecord.l}F
                </span>
              </div>
              <button style={NAV_BTN}>›</button>
            </div>
          </div>
        )}

        {/* Playoff bracket eller cup (kompakt) */}
        {playoffInfo ? (
          <div style={{ margin: '0 0 6px' }}>
            <PlayoffBracketCard bracket={playoffInfo} game={game} />
          </div>
        ) : showExpandedCup ? (
          <div style={{ margin: '0 0 6px' }}>
            <CupCard bracket={game.cupBracket!} game={game} />
          </div>
        ) : null}

        {/* ⑦ CTA-SEKTION */}
        <div style={{ margin: '8px 0 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, padding: '0 2px' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>{currentDateStr}</span>
            {currentRound > 0 && (
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Omgång {currentRound}</span>
            )}
          </div>
          <DiamondDivider />

          {/* KAFFERUMMET */}
          {(() => {
            const coffee = getCoffeeRoomQuote(game)
            if (!coffee) return null
            return (
              <div style={{ margin: '0 0 8px', padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
                <SectionLabel style={{ marginBottom: 4 }}>☕ KAFFERUMMET</SectionLabel>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>
                  {coffee.speaker ? `${coffee.speaker}: ${coffee.text}` : coffee.text}
                </p>
              </div>
            )
          })()}

          {/* VECKANS BESLUT */}
          {game.pendingWeeklyDecision && (() => {
            const d = game.pendingWeeklyDecision as WeeklyDecision
            return (
              <div className="card-sharp" style={{ padding: '10px 12px', margin: '0 -12px 8px' }}>
                <SectionLabel style={{ marginBottom: 6 }}>🤔 VECKANS BESLUT</SectionLabel>
                <p style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 8 }}>{d.question}</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => resolveWeeklyDecision('A')}
                    style={{ flex: 1, padding: '10px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)', textAlign: 'center' }}
                  >
                    {d.optionA.label}
                    <span style={{ display: 'block', fontSize: 9, fontWeight: 400, color: d.optionA.effectColor === 'success' ? 'var(--success)' : d.optionA.effectColor === 'danger' ? 'var(--danger)' : 'var(--text-muted)', marginTop: 2 }}>{d.optionA.effect}</span>
                  </button>
                  <button
                    onClick={() => resolveWeeklyDecision('B')}
                    style={{ flex: 1, padding: '10px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)', textAlign: 'center' }}
                  >
                    {d.optionB.label}
                    <span style={{ display: 'block', fontSize: 9, fontWeight: 400, color: d.optionB.effectColor === 'success' ? 'var(--success)' : d.optionB.effectColor === 'danger' ? 'var(--danger)' : 'var(--text-muted)', marginTop: 2 }}>{d.optionB.effect}</span>
                  </button>
                </div>
              </div>
            )
          })()}

          {(() => {
            const pepTalk = getPepTalk(game)
            if (!pepTalk) return null
            return (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', margin: '0 0 6px', fontFamily: 'var(--font-display)' }}>
                "{pepTalk}"
              </p>
            )
          })()}

          {canSimulateRemaining && (
            <button onClick={handleSimulateRemaining} className="btn btn-ghost" style={{ width: '100%', marginBottom: 8, justifyContent: 'center' }}>
              ⏩ Simulera resterande säsong
            </button>
          )}

          <button
            data-coach-id="cta-button"
            onClick={handleAdvance}
            disabled={!canClickAdvance}
            className="texture-leather"
            style={{
              width: '100%', padding: '18px',
              background: canClickAdvance
                ? 'linear-gradient(135deg, var(--accent-dark), var(--accent-deep))'
                : 'var(--border)',
              color: canClickAdvance ? 'var(--text-light)' : 'var(--text-muted)',
              border: 'none', borderRadius: 12,
              fontSize: 15, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase',
              fontFamily: 'var(--font-body)',
              cursor: canClickAdvance ? 'pointer' : 'not-allowed',
              animation: canClickAdvance ? 'pulseCTA 3s ease-in-out infinite' : undefined,
            }}
          >
            {advanceButtonText}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 9, color: 'var(--text-secondary)', marginTop: 16 }}>
          build {(typeof __GIT_HASH__ !== 'undefined' ? __GIT_HASH__ : '?')} · {(typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : '')}
        </p>
      </div>
    </div>
    {/* CoachMarks disabled until re-enabled for new players */}
    {/* {!game.coachMarksSeen && <CoachMarks onDone={markCoachMarksSeen} />} */}
    </>
  )
}
