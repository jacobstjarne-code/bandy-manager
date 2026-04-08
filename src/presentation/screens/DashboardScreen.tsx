import { useEffect, useState } from 'react'
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
import { TutorialOverlay } from '../components/TutorialOverlay'
import { PlayoffStatus, PlayoffRound } from '../../domain/enums'
import type { EventChoice } from '../../domain/entities/GameEvent'
import { playSound } from '../audio/soundEffects'
import { getFormResults } from '../utils/formUtils'

import { MatchTab } from '../components/dashboard/MatchTab'
import { KlubbTab } from '../components/dashboard/KlubbTab'
import { OrtenTab } from '../components/dashboard/OrtenTab'

function pickBatchSimChoice(choices: EventChoice[]): string {
  const noOp = choices.find(c => c.effect.type === 'noOp')
  if (noOp) return noOp.id
  const rejectTransfer = choices.find(c => c.effect.type === 'rejectTransfer')
  if (rejectTransfer) return rejectTransfer.id
  return choices[0].id
}

export function DashboardScreen() {
  const { game, advance, markTutorialSeen, dismissOnboarding, resolveEvent } = useGameStore()
  const club = useManagedClub()
  const standing = useCurrentStanding()
  const hasPendingLineup = useHasPendingLineup()
  const canAdvance = useCanAdvance()
  const lastCompletedFixture = useLastCompletedFixture()
  const playoffInfo = usePlayoffInfo()
  const navigate = useNavigate()
  const location = useLocation()

  const [activeTab, setActiveTab] = useState<'match' | 'klubb' | 'orten'>(
    (location.state as any)?.tab ?? 'match'
  )
  const [isBatchSim, setIsBatchSim] = useState(false)

  useEffect(() => {
    if (!isBatchSim || !game) return
    if ((game.pendingEvents?.length ?? 0) > 0) {
      const event = game.pendingEvents![0]
      if (event.choices.length > 0) {
        const choiceId = pickBatchSimChoice(event.choices)
        const t = setTimeout(() => resolveEvent(event.id, choiceId), 0)
        return () => clearTimeout(t)
      }
    }
    const scheduled = game.fixtures.filter(f => f.status === 'scheduled')
    if (scheduled.length === 0) { setIsBatchSim(false); return }
    const nextEff = Math.min(...scheduled.map(f => f.matchday))
    const managedMatchNext = scheduled.some(f => f.matchday === nextEff && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
    if (managedMatchNext) { setIsBatchSim(false); return }
    const t = setTimeout(() => {
      const result = advance(true)
      if (result?.seasonEnded || result?.playoffStarted) { setIsBatchSim(false); return }
    }, 80)
    return () => clearTimeout(t)
  }, [isBatchSim, game])

  useEffect(() => {
    if (game?.managerFired) navigate('/game/game-over', { replace: true })
    else if (game?.showSeasonSummary) navigate('/game/season-summary', { replace: true })
    else if (game?.showBoardMeeting) navigate('/game/board-meeting', { replace: true })
    else if (game?.showPreSeason) navigate('/game/pre-season', { replace: true })
    else if (playoffInfo?.status === PlayoffStatus.Completed) navigate('/game/champion', { replace: true })
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

  const recentForm = getFormResults(game.managedClubId, game.fixtures, game.clubs)

  const isPlayoffFixture = !!(nextFixture && nextFixture.roundNumber > 22)
  const playoffSeries = isPlayoffFixture && playoffInfo ? (() => {
    const allSeries = [...playoffInfo.quarterFinals, ...playoffInfo.semiFinals, ...(playoffInfo.final ? [playoffInfo.final] : [])]
    return allSeries.find(s => s.fixtures.includes(nextFixture!.id)) ?? null
  })() : null

  const managedIsSeriesHome = playoffSeries ? playoffSeries.homeClubId === game.managedClubId : false
  const dynamicHomeWins = playoffSeries ? (managedIsSeriesHome ? playoffSeries.homeWins : playoffSeries.awayWins) : 0
  const dynamicAwayWins = playoffSeries ? (managedIsSeriesHome ? playoffSeries.awayWins : playoffSeries.homeWins) : 0

  const isPlayoffJustStarted = !!(playoffInfo && playoffInfo.status === PlayoffStatus.QuarterFinals &&
    playoffInfo.quarterFinals.every(s => game.fixtures.filter(f => s.fixtures.includes(f.id) && f.status === 'completed').length === 0))

  // CTA logic
  const hasScheduledFixtures = game.fixtures.some(f => f.status === 'scheduled')
  const canClickAdvance = canAdvance || hasScheduledFixtures
  const playedRounds = game.fixtures.filter(f => f.status === 'completed' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) && !f.isCup).length
  const canSimulateRemaining = hasScheduledFixtures && playedRounds >= 10 && !game.playoffBracket
  const remainingOtherFixtures = new Set(game.fixtures.filter(f => f.status === 'scheduled').map(f => f.matchday)).size

  const advanceButtonText = (() => {
    const scheduled = game.fixtures.filter(f => f.status === 'scheduled')
    if (scheduled.length === 0) {
      if (!game.playoffBracket) return 'Starta slutspel →'
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
          return `Spela ${label} →`
        }
        return 'Fortsätt slutspel →'
      }
      return `Spela omgång ${nextManaged.roundNumber} →`
    }
    return 'Fortsätt →'
  })()

  const handleAdvance = () => {
    playSound('click')
    const scheduledFixtures = game.fixtures.filter(f => f.status === 'scheduled')
    if (scheduledFixtures.length === 0) {
      try {
        const result = advance()
        if (result?.playoffStarted || result?.seasonEnded) return
        navigate('/game/review')
      } catch (err) { console.error('advance() failed:', err) }
      return
    }
    const nextSimEff = Math.min(...scheduledFixtures.map(f => f.matchday))
    const managedMatchInNextRound = scheduledFixtures.find(f => f.matchday === nextSimEff && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
    if (managedMatchInNextRound) { navigate('/game/match'); return }
    try {
      advance()
      navigate('/game/review')
    } catch (err) { console.error('advance() failed:', err) }
  }

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="screen-enter" style={{ position: 'relative', minHeight: '100%', background: 'var(--bg)' }}>
      {!game.tutorialSeen && (
        <TutorialOverlay managerName={game.managerName} clubName={club.name} onDone={markTutorialSeen} />
      )}

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 4, padding: '8px 12px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        {(['match', 'klubb', 'orten'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '8px 4px', borderRadius: 8,
              background: activeTab === tab ? 'rgba(196,168,76,0.12)' : 'transparent',
              border: `1.5px solid ${activeTab === tab ? 'var(--accent)' : 'transparent'}`,
              color: activeTab === tab ? 'var(--accent-dark)' : 'var(--text-muted)',
              fontSize: 12, fontWeight: activeTab === tab ? 700 : 400,
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {tab === 'match' ? '🏒 Match' : tab === 'klubb' ? '🏛️ Klubb' : '🏘️ Orten'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="texture-wood card-stack" style={{ paddingTop: 8, paddingBottom: activeTab === 'match' ? 120 : 24 }}>
        {activeTab === 'match' && (
          <MatchTab
            game={game}
            club={club}
            standing={standing}
            nextFixture={nextFixture}
            opponent={opponent}
            isHome={isHome}
            matchWeather={matchWeather}
            hasPendingLineup={hasPendingLineup}
            isPlayoffFixture={isPlayoffFixture}
            playoffInfo={playoffInfo}
            playoffSeries={playoffSeries}
            dynamicHomeWins={dynamicHomeWins}
            dynamicAwayWins={dynamicAwayWins}
            isPlayoffJustStarted={isPlayoffJustStarted}
            eliminated={eliminated}
            lastResult={lastResult}
            lastCompletedFixture={lastCompletedFixture}
            recentForm={recentForm}
            currentRound={currentRound}
            currentDateStr={currentDateStr}
            canClickAdvance={canClickAdvance}
            isBatchSim={isBatchSim}
            setIsBatchSim={setIsBatchSim}
            advanceButtonText={advanceButtonText}
            canSimulateRemaining={canSimulateRemaining}
            remainingOtherFixtures={remainingOtherFixtures}
            onAdvance={handleAdvance}
            onDismissOnboarding={dismissOnboarding}
            navigate={navigate}
          />
        )}
        {activeTab === 'klubb' && (
          <KlubbTab
            game={game}
            club={club}
            standing={standing}
            navigate={navigate}
          />
        )}
        {activeTab === 'orten' && (
          <OrtenTab
            game={game}
            currentRound={currentRound}
            navigate={navigate}
          />
        )}
      </div>
    </div>
  )
}
