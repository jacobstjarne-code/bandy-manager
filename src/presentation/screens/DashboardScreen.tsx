import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { TrophySVG } from '../components/Decorations'
import { PlayoffStatus } from '../../domain/enums'
import type { PlayoffBracket, PlayoffSeries } from '../../domain/entities/Playoff'
import type { SaveGame } from '../../domain/entities/SaveGame'
import { getRivalry } from '../../domain/data/rivalries'
import type { Fixture } from '../../domain/entities/Fixture'
import type { CupBracket } from '../../domain/entities/Cup'
import { getCupRoundLabel, getManagedClubCupStatus } from '../../domain/services/cupService'
import { playSound } from '../audio/soundEffects'
import { PlayoffBanner } from '../components/dashboard/PlayoffBanner'
import { NextMatchCard } from '../components/dashboard/NextMatchCard'
import { LastResultCard } from '../components/dashboard/LastResultCard'
import { SquadStatusCard } from '../components/dashboard/SquadStatusCard'
import { GuidanceBanner } from '../components/dashboard/GuidanceBanner'

function getSeriesScore(series: { fixtures: string[]; homeClubId: string; awayClubId: string }, fixtures: Fixture[]) {
  const seriesFixtures = fixtures.filter(
    f => series.fixtures.includes(f.id) && f.status === 'completed'
  )
  let homeWins = 0, awayWins = 0
  for (const f of seriesFixtures) {
    const homeWon = f.homeScore > f.awayScore
      || (f.homeScore === f.awayScore && f.penaltyResult != null && f.penaltyResult.home > f.penaltyResult.away)
    const awayWon = f.awayScore > f.homeScore
      || (f.homeScore === f.awayScore && f.penaltyResult != null && f.penaltyResult.away > f.penaltyResult.home)
    if (f.homeClubId === series.homeClubId) {
      if (homeWon) homeWins++
      else if (awayWon) awayWins++
    } else {
      if (homeWon) awayWins++
      else if (awayWon) homeWins++
    }
  }
  return { homeWins, awayWins }
}


interface PlayoffSeriesRowProps {
  series: PlayoffSeries
  game: SaveGame
  managedClubId: string
}

function PlayoffSeriesRow({ series, game, managedClubId }: PlayoffSeriesRowProps) {
  const homeClub = game.clubs.find(c => c.id === series.homeClubId)
  const awayClub = game.clubs.find(c => c.id === series.awayClubId)
  const isManagedHome = series.homeClubId === managedClubId
  const isManagedAway = series.awayClubId === managedClubId
  const isManaged = isManagedHome || isManagedAway

  const { homeWins, awayWins } = getSeriesScore(series, game.fixtures)
  const homeWon = homeWins > awayWins && series.winnerId !== null
  const awayWon = awayWins > homeWins && series.winnerId !== null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '6px 0',
      borderBottom: '1px solid #1a2e47',
    }}>
      <span style={{
        fontSize: 12,
        color: isManagedHome ? '#C9A84C' : homeWon ? '#F0F4F8' : '#4A6080',
        fontWeight: isManagedHome ? 700 : 400,
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {homeClub?.shortName ?? homeClub?.name ?? '?'}
      </span>
      <span style={{
        fontSize: 13,
        fontWeight: 800,
        color: isManaged ? '#C9A84C' : '#F0F4F8',
        letterSpacing: '1px',
        margin: '0 8px',
        minWidth: 32,
        textAlign: 'center',
      }}>
        {homeWins}–{awayWins}
      </span>
      <span style={{
        fontSize: 12,
        color: isManagedAway ? '#C9A84C' : awayWon ? '#F0F4F8' : '#4A6080',
        fontWeight: isManagedAway ? 700 : 400,
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        textAlign: 'right',
      }}>
        {awayClub?.shortName ?? awayClub?.name ?? '?'}
      </span>
    </div>
  )
}

interface PlayoffBracketCardProps {
  bracket: PlayoffBracket
  game: SaveGame
  cardStyle: React.CSSProperties
  cardLabelStyle: React.CSSProperties
}

function PlayoffBracketCard({ bracket, game, cardStyle, cardLabelStyle }: PlayoffBracketCardProps) {
  const managedClubId = game.managedClubId

  const statusLabel = bracket.status === PlayoffStatus.QuarterFinals ? 'KVARTSFINAL'
    : bracket.status === PlayoffStatus.SemiFinals ? 'SEMIFINAL'
    : bracket.status === PlayoffStatus.Final ? 'SM-FINAL'
    : bracket.status === PlayoffStatus.Completed ? 'AVSLUTAD'
    : 'SLUTSPEL'

  const activeSeries = bracket.status === PlayoffStatus.QuarterFinals ? bracket.quarterFinals
    : bracket.status === PlayoffStatus.SemiFinals ? bracket.semiFinals
    : bracket.status === PlayoffStatus.Final && bracket.final ? [bracket.final]
    : []

  const champion = bracket.champion ? game.clubs.find(c => c.id === bracket.champion) : null

  return (
    <div
      className="card-stagger-3"
      style={{
        ...cardStyle,
        background: 'linear-gradient(#122235, #122235) padding-box, linear-gradient(135deg, #C9A84C, transparent 60%) border-box',
        border: '2px solid transparent',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <p className="section-heading" style={cardLabelStyle}>SLUTSPEL</p>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '1px',
          color: '#C9A84C',
          textTransform: 'uppercase',
        }}>
          {statusLabel}
        </span>
      </div>

      {bracket.status === PlayoffStatus.Completed && champion ? (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <span style={{ fontSize: 24 }}>🏆</span>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#C9A84C', marginTop: 4 }}>
            {champion.name}
          </p>
          <p style={{ fontSize: 11, color: '#4A6080' }}>Svenska Mästare {bracket.season}</p>
        </div>
      ) : (
        <div>
          {activeSeries.map(series => (
            <PlayoffSeriesRow
              key={series.id}
              series={series}
              game={game}
              managedClubId={managedClubId}
            />
          ))}
          {activeSeries.length === 0 && (
            <p style={{ fontSize: 12, color: '#4A6080' }}>Slutspelet startar snart</p>
          )}
        </div>
      )}

      {bracket.status !== PlayoffStatus.Completed && (
        <p style={{ fontSize: 11, color: '#8A9BB0', marginTop: 8 }}>
          {bracket.status === PlayoffStatus.Final
            ? 'En match avgör'
            : 'Bäst av 5 matcher per serie'}
        </p>
      )}
    </div>
  )
}

interface CupCardProps {
  bracket: CupBracket
  game: SaveGame
  cardStyle: React.CSSProperties
  cardLabelStyle: React.CSSProperties
}

function CupCard({ bracket, game, cardStyle, cardLabelStyle }: CupCardProps) {
  const managedClubId = game.managedClubId
  const cupStatus = getManagedClubCupStatus(bracket, managedClubId)

  // Find managed club's next cup fixture
  const nextCupFixture = game.fixtures
    .filter(f => f.isCup && f.status === 'scheduled' &&
      (f.homeClubId === managedClubId || f.awayClubId === managedClubId))
    .sort((a, b) => a.roundNumber - b.roundNumber)[0]

  // Determine current stage label
  const roundsWithMatches = [...new Set(bracket.matches.map(m => m.round))]
  const currentRound = Math.max(...roundsWithMatches)
  const stageLabel = getCupRoundLabel(currentRound)

  let statusContent: React.ReactNode

  if (bracket.completed && bracket.winnerId === managedClubId) {
    statusContent = (
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <span style={{ fontSize: 24 }}>🏆</span>
        <p style={{ fontSize: 14, fontWeight: 800, color: '#C9A84C', marginTop: 4 }}>CUPVINNARE!</p>
        <p style={{ fontSize: 11, color: '#4A6080' }}>Svenska Cupen {bracket.season}</p>
      </div>
    )
  } else if (cupStatus.eliminated) {
    const roundName = cupStatus.eliminatedInRound === 1 ? 'kvartsfinalen'
      : cupStatus.eliminatedInRound === 2 ? 'semifinalen'
      : 'finalen'
    statusContent = (
      <p style={{ fontSize: 13, color: '#4A6080' }}>Utslagna i {roundName}</p>
    )
  } else if (nextCupFixture) {
    const opponent = game.clubs.find(c =>
      c.id === (nextCupFixture.homeClubId === managedClubId
        ? nextCupFixture.awayClubId
        : nextCupFixture.homeClubId)
    )
    const isHome = nextCupFixture.homeClubId === managedClubId
    const cupLeagueRound = nextCupFixture.roundNumber - 100
    const lastLeagueRound = Math.max(
      0,
      ...game.fixtures
        .filter(f => !f.isCup && f.status === 'completed')
        .map(f => f.roundNumber)
    )
    const roundsUntil = cupLeagueRound - lastLeagueRound
    statusContent = (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 13, color: '#F0F4F8', fontWeight: 600 }}>
            vs {opponent?.shortName ?? opponent?.name ?? '?'}
          </span>
          <span style={{
            padding: '3px 8px',
            borderRadius: 99,
            fontSize: 11,
            fontWeight: 700,
            background: isHome ? 'rgba(34,197,94,0.15)' : 'rgba(37,99,235,0.15)',
            color: isHome ? '#22c55e' : '#60a5fa',
            border: `1px solid ${isHome ? 'rgba(34,197,94,0.3)' : 'rgba(37,99,235,0.3)'}`,
          }}>
            {isHome ? 'Hemma' : 'Borta'}
          </span>
        </div>
        <p style={{ fontSize: 11, color: roundsUntil <= 1 ? '#f59e0b' : '#8A9BB0', marginTop: 4 }}>
          {roundsUntil <= 1
            ? '⚡ Spelas NÄSTA omgång!'
            : `Spelas vid serieomgång ${cupLeagueRound} (om ${roundsUntil} omgångar)`}
        </p>
      </div>
    )
  } else {
    statusContent = (
      <p style={{ fontSize: 13, color: '#4A6080' }}>Drar igång under säsongen</p>
    )
  }

  return (
    <div
      className="card-stagger-3"
      style={{
        ...cardStyle,
        background: bracket.completed && bracket.winnerId === managedClubId
          ? 'linear-gradient(#122235, #122235) padding-box, linear-gradient(135deg, #C9A84C, transparent 60%) border-box'
          : cardStyle.background,
        border: bracket.completed && bracket.winnerId === managedClubId
          ? '2px solid transparent'
          : cardStyle.border,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <p className="section-heading" style={cardLabelStyle}>SVENSKA CUPEN</p>
        {!bracket.completed && !cupStatus.eliminated && (
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '1px',
            color: '#C9A84C',
            textTransform: 'uppercase',
          }}>
            {stageLabel}
          </span>
        )}
      </div>
      {statusContent}
    </div>
  )
}

export function DashboardScreen() {
  const { game, advance, markTutorialSeen } = useGameStore()
  const club = useManagedClub()
  const standing = useCurrentStanding()
  const hasPendingLineup = useHasPendingLineup()
  const canAdvance = useCanAdvance()
  const lastCompletedFixture = useLastCompletedFixture()
  const playoffInfo = usePlayoffInfo()
  const navigate = useNavigate()
  const [isBatchSim, setIsBatchSim] = useState(false)

  // Batch simulation loop — runs until a managed match or season end appears
  useEffect(() => {
    if (!isBatchSim || !game) return
    const scheduled = game.fixtures.filter(f => f.status === 'scheduled')
    if (scheduled.length === 0) { setIsBatchSim(false); return }
    const nextRound = Math.min(...scheduled.map(f => f.roundNumber))
    const managedNext = scheduled.some(
      f => f.roundNumber === nextRound &&
           (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
    )
    if (managedNext) { setIsBatchSim(false); return }
    const t = setTimeout(() => {
      const result = advance()
      if (result?.seasonEnded || result?.playoffStarted) { setIsBatchSim(false); return }
      if ((result?.pendingEvents?.length ?? 0) > 0) { setIsBatchSim(false); navigate('/game/events') }
    }, 120)
    return () => clearTimeout(t)
  }, [isBatchSim, game])

  const lastSummary = game ? (game.seasonSummaries ?? []).slice(-1)[0] : null
  const lastPos = lastSummary?.finalPosition ?? null
  const currentPos = standing?.position ?? null
  const posDiff = lastPos != null && currentPos != null ? lastPos - currentPos : null

  // Navigate to champion screen when bracket is completed
  useEffect(() => {
    if (playoffInfo?.status === PlayoffStatus.Completed) {
      navigate('/game/champion', { replace: true })
    }
  }, [playoffInfo?.status, navigate])

  // Auto-navigate to season summary when it's ready
  useEffect(() => {
    if (game?.showSeasonSummary) {
      navigate('/game/season-summary', { replace: true })
    }
  }, [game?.showSeasonSummary, navigate])

  // Auto-navigate to board meeting when it's ready
  useEffect(() => {
    if (game?.showBoardMeeting) {
      navigate('/game/board-meeting', { replace: true })
    }
  }, [game?.showBoardMeeting, navigate])

  // Auto-navigate to pre-season screen
  useEffect(() => {
    if (game?.showPreSeason && !game?.showBoardMeeting && !game?.showSeasonSummary) {
      navigate('/game/pre-season', { replace: true })
    }
  }, [game?.showPreSeason, game?.showBoardMeeting, game?.showSeasonSummary, navigate])

  // Auto-navigate to game over screen when manager is fired
  useEffect(() => {
    if (game?.managerFired) {
      navigate('/game/game-over', { replace: true })
    }
  }, [game?.managerFired, navigate])

  if (!game || !club) return (
    <div style={{ padding: '20px' }}>
      <div className="shimmer" style={{ height: 120, borderRadius: 'var(--radius)', marginBottom: 12 }} />
      <div className="shimmer" style={{ height: 80, borderRadius: 'var(--radius)', marginBottom: 12 }} />
      <div className="shimmer" style={{ height: 80, borderRadius: 'var(--radius)' }} />
    </div>
  )

  function effectiveRound(f: { roundNumber: number; isCup?: boolean }): number {
    return f.isCup ? f.roundNumber - 100 : f.roundNumber
  }

  function isManagedTeamEliminated(g: SaveGame): boolean {
    const bracket = g.playoffBracket
    if (!bracket) return false
    const id = g.managedClubId
    const allSeries = [
      ...(bracket.quarterFinals ?? []),
      ...(bracket.semiFinals ?? []),
      ...(bracket.final ? [bracket.final] : []),
    ]
    return allSeries.some(s => s.loserId === id)
  }

  const eliminated = isManagedTeamEliminated(game)

  const nextFixture = game.fixtures
    .filter(f => {
      if (f.status !== 'scheduled') return false
      if (f.homeClubId !== game.managedClubId && f.awayClubId !== game.managedClubId) return false
      // If eliminated from playoffs, don't show remaining playoff fixtures
      if (eliminated && f.roundNumber > 22 && !f.isCup) return false
      return true
    })
    .sort((a, b) => effectiveRound(a) - effectiveRound(b))[0]

  const matchWeather = nextFixture
    ? (game.matchWeathers ?? []).find(mw => mw.fixtureId === nextFixture.id)
    : undefined

  const opponent = nextFixture
    ? game.clubs.find(c => c.id === (nextFixture.homeClubId === game.managedClubId ? nextFixture.awayClubId : nextFixture.homeClubId))
    : null

  const isHome = nextFixture ? nextFixture.homeClubId === game.managedClubId : false

  const rivalry = nextFixture ? getRivalry(nextFixture.homeClubId, nextFixture.awayClubId) : null

  // Last match result data
  let lastResult: { scoreFor: number; scoreAgainst: number; opponentName: string } | null = null
  if (lastCompletedFixture) {
    const isHomeTeam = lastCompletedFixture.homeClubId === game.managedClubId
    const scoreFor = isHomeTeam ? lastCompletedFixture.homeScore : lastCompletedFixture.awayScore
    const scoreAgainst = isHomeTeam ? lastCompletedFixture.awayScore : lastCompletedFixture.homeScore
    const lastOpponentId = isHomeTeam ? lastCompletedFixture.awayClubId : lastCompletedFixture.homeClubId
    const lastOpponent = game.clubs.find(c => c.id === lastOpponentId)
    lastResult = {
      scoreFor,
      scoreAgainst,
      opponentName: lastOpponent?.name ?? 'Okänd',
    }
  }

  // Squad status
  const squadPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  const injuredCount = squadPlayers.filter(p => p.isInjured).length
  const avgForm = squadPlayers.length > 0
    ? squadPlayers.reduce((sum, p) => sum + p.form, 0) / squadPlayers.length
    : 0
  const formLabel = avgForm >= 65 ? 'Hög' : avgForm >= 40 ? 'Normal' : 'Låg'
  const formColor = avgForm >= 65 ? '#22c55e' : avgForm >= 40 ? '#f59e0b' : '#ef4444'

  // Determine playoff context for next fixture
  const isPlayoffFixture = nextFixture && nextFixture.roundNumber > 22
  const playoffSeries = isPlayoffFixture && playoffInfo ? (() => {
    const allSeries = [
      ...playoffInfo.quarterFinals,
      ...playoffInfo.semiFinals,
      ...(playoffInfo.final ? [playoffInfo.final] : []),
    ]
    return allSeries.find(s => s.fixtures.includes(nextFixture.id)) ?? null
  })() : null

  const seriesFixtures = playoffSeries
    ? game.fixtures.filter(f => playoffSeries.fixtures.includes(f.id) && f.status === 'completed')
    : []
  const dynamicHomeWins = seriesFixtures.filter(f => {
    const isSeriesHome = f.homeClubId === playoffSeries?.homeClubId
    return isSeriesHome ? f.homeScore > f.awayScore : f.awayScore > f.homeScore
  }).length
  const dynamicAwayWins = seriesFixtures.filter(f => {
    const isSeriesHome = f.homeClubId === playoffSeries?.homeClubId
    return isSeriesHome ? f.awayScore > f.homeScore : f.homeScore > f.awayScore
  }).length

  const isPlayoffJustStarted = playoffInfo &&
    playoffInfo.status === PlayoffStatus.QuarterFinals &&
    playoffInfo.quarterFinals.every(s =>
      game.fixtures.filter(f => s.fixtures.includes(f.id) && f.status === 'completed').length === 0
    )

  const handleAdvance = () => {
    playSound('click')
    const scheduledFixtures = game!.fixtures.filter(f => f.status === 'scheduled')

    if (scheduledFixtures.length === 0) {
      // No scheduled fixtures → trigger playoff start or season end
      try {
        const result = advance()
        if (result?.playoffStarted) {
          return
        }
        if (result?.seasonEnded) {
          return
        }
        if ((result?.pendingEvents?.length ?? 0) > 0) {
          navigate('/game/events')
        }
      } catch (err) {
        console.error('advance() failed:', err)
      }
      return
    }

    const nextSimRound = Math.min(...scheduledFixtures.map(f => f.roundNumber))

    const managedMatchInNextRound = game!.fixtures.find(
      f => f.roundNumber === nextSimRound &&
           (f.homeClubId === game!.managedClubId || f.awayClubId === game!.managedClubId) &&
           f.status === 'scheduled'
    )

    if (managedMatchInNextRound) {
      navigate('/game/match')
      return
    }

    try {
      const result = advance()
      if ((result?.pendingEvents?.length ?? 0) > 0) {
        navigate('/game/events')
      }
    } catch (err) {
      console.error('advance() failed:', err)
    }
  }

  const hasScheduledFixtures = game!.fixtures.some(f => f.status === 'scheduled')
  const canClickAdvance = canAdvance || hasScheduledFixtures

  const managedClubId = game!.managedClubId
  const remainingOtherFixtures = game!.fixtures.filter(f => f.status === 'scheduled').length
  const playedRounds = game!.fixtures.filter(
    f => f.status === 'completed' &&
         (f.homeClubId === managedClubId || f.awayClubId === managedClubId) &&
         !f.isCup
  ).length
  const canSimulateRemaining = hasScheduledFixtures && playedRounds >= 10 && !game!.playoffBracket

  const cardStyle: React.CSSProperties = {
    background: '#122235',
    border: '1px solid #1e3450',
    borderRadius: 12,
    padding: '16px',
    marginBottom: 12,
  }

  const cardLabelStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: '#4A6080',
    marginBottom: 10,
  }

  // Determine advance button text
  const advanceButtonText = (() => {
    if (!game) return 'Laddar...'
    const scheduled = game.fixtures.filter(f => f.status === 'scheduled')

    if (scheduled.length === 0) {
      if (!game.playoffBracket) return 'Starta slutspel →'
      if (game.playoffBracket.status === PlayoffStatus.Completed) return 'Avsluta säsongen →'
      return 'Fortsätt slutspel →'
    }

    const nextManaged = scheduled
      .filter(f => {
        if (f.homeClubId !== game.managedClubId && f.awayClubId !== game.managedClubId) return false
        if (eliminated && f.roundNumber > 22 && !f.isCup) return false
        return true
      })
      .sort((a, b) => a.roundNumber - b.roundNumber)[0]

    if (nextManaged) {
      if (nextManaged.isCup) {
        const cupMatch = game.cupBracket?.matches.find(m => m.fixtureId === nextManaged.id)
        const cupRound = cupMatch?.round ?? 1
        const cupLabel = cupRound === 1 ? 'Kvartsfinal' : cupRound === 2 ? 'Semifinal' : 'Final'
        return `Spela Cup-${cupLabel} →`
      }
      if (game.playoffBracket) {
        const r = nextManaged.roundNumber
        const label = r <= 25 ? 'Kvartsfinal' : r <= 28 ? 'Semifinal' : 'Final'
        return `Spela ${label} →`
      }
      return `Spela omgång ${nextManaged.roundNumber} →`
    }

    return 'Fortsätt →'
  })()

  return (
    <div className="screen-enter floodlight-bg noise-overlay" style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0D1B2A',
    }}>
      {/* Tutorial overlay */}
      {!game.tutorialSeen && (
        <TutorialOverlay
          managerName={game.managerName}
          clubName={club.name}
          onDone={markTutorialSeen}
        />
      )}

      {/* Header */}
      <div style={{
        textAlign: 'center',
        padding: '16px 20px 12px',
        borderBottom: '1px solid #1e3450',
        background: '#0D1B2A',
        flexShrink: 0,
      }}>
        <p style={{ color: '#4A6080', fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 4 }}>
          Säsong {game.currentSeason}
        </p>
        <h1 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '3px', color: '#F0F4F8', textTransform: 'uppercase' }}>
          Bandy Manager
        </h1>
        <p style={{ color: '#8A9BB0', fontSize: 12, marginTop: 4 }}>{club.name}</p>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px', paddingBottom: '100px' }}>

        {/* PLAYOFF JUST STARTED banner */}
        {isPlayoffJustStarted && (
          <PlayoffBanner game={game} playoffInfo={playoffInfo} />
        )}

        {/* ELIMINATED card */}
        {eliminated && !nextFixture && game.playoffBracket && game.playoffBracket.status !== PlayoffStatus.Completed && (
          <div className="card-stagger-1" style={{
            background: '#122235',
            border: '1px solid #1e3450',
            borderRadius: 12,
            padding: '18px',
            marginBottom: 12,
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#8A9BB0', marginBottom: 4 }}>Din säsong är slut</p>
            <p style={{ color: '#4A6080', fontSize: 13 }}>
              Väntar på att slutspelet ska avgöras...
            </p>
          </div>
        )}

        {/* NEXT MATCH card */}
        {nextFixture && opponent && (
          <NextMatchCard
            nextFixture={nextFixture}
            opponent={opponent}
            isHome={isHome}
            rivalry={rivalry}
            club={club}
            game={game}
            isPlayoffFixture={isPlayoffFixture}
            playoffSeries={playoffSeries}
            dynamicHomeWins={dynamicHomeWins}
            dynamicAwayWins={dynamicAwayWins}
            matchWeather={matchWeather}
            hasPendingLineup={hasPendingLineup}
            onNavigate={() => navigate('/game/match')}
            cardLabelStyle={cardLabelStyle}
          />
        )}

        {/* SENASTE RESULTAT card */}
        {lastResult && (
          <LastResultCard
            lastResult={lastResult}
            lastCompletedFixture={lastCompletedFixture}
            onNavigateToReport={() => navigate('/game/match', { state: { showReport: true } })}
            cardStyle={cardStyle}
            cardLabelStyle={cardLabelStyle}
          />
        )}

        {/* SLUTSPEL card (when active) or SERIEPLACERING card */}
        {playoffInfo ? (
          <PlayoffBracketCard
            bracket={playoffInfo}
            game={game}
            cardStyle={cardStyle}
            cardLabelStyle={cardLabelStyle}
          />
        ) : standing && (
          <div
            className="card-stagger-3 gold-border-pulse"
            style={{ ...cardStyle, cursor: 'pointer' }}
            onClick={() => navigate('/game/tabell')}
          >
            <p className="section-heading" style={cardLabelStyle}>SERIEPLACERING</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <TrophySVG size={36} />
              <div>
                <p
                  className={standing.position <= 3 ? 'gold-glow tabular' : 'tabular'}
                  style={{
                    fontSize: 28,
                    fontWeight: standing.position <= 3 ? 800 : 900,
                    color: standing.position <= 3 ? '#C9A84C' : '#F0F4F8',
                    lineHeight: 1,
                  }}
                >
                  {standing.position}.
                </p>
                <p style={{ fontSize: 13, color: '#8A9BB0', marginTop: 2 }}>
                  plats · {standing.points} poäng
                  {posDiff !== null && posDiff !== 0 && (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: posDiff > 0 ? '#22c55e' : '#ef4444',
                      marginLeft: 6,
                    }}>
                      {posDiff > 0 ? `↑${posDiff}` : `↓${Math.abs(posDiff)}`} jfr förra
                    </span>
                  )}
                </p>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <p style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: standing.goalDifference >= 0 ? '#22c55e' : '#ef4444',
                }}>
                  {standing.goalDifference >= 0 ? '+' : ''}{standing.goalDifference}
                </p>
                <p style={{ fontSize: 11, color: '#4A6080' }}>Målskillnad</p>
              </div>
            </div>
            <p style={{ fontSize: 11, color: '#C9A84C', marginTop: 10, fontWeight: 600 }}>
              Visa full tabell →
            </p>
          </div>
        )}

        {/* SVENSKA CUPEN card */}
        {game.cupBracket && (
          <CupCard
            bracket={game.cupBracket}
            game={game}
            cardStyle={cardStyle}
            cardLabelStyle={cardLabelStyle}
          />
        )}

        {/* TRUPPSTATUS card */}
        <SquadStatusCard
          injuredCount={injuredCount}
          formLabel={formLabel}
          formColor={formColor}
          club={club}
          game={game}
          cardStyle={cardStyle}
          cardLabelStyle={cardLabelStyle}
        />

        {/* EKONOMI card */}
        {(() => {
          const managedPlayers = game!.players.filter(p => p.clubId === game!.managedClubId)
          const weeklyWages = Math.round(managedPlayers.reduce((s, p) => s + p.salary, 0) / 4)
          const sponsorIncome = (game!.sponsors ?? []).filter(s => s.contractRounds > 0).reduce((s, sp) => s + sp.weeklyIncome, 0)
          const ca = game!.communityActivities
          const kioskEst = ca?.kiosk === 'upgraded' ? 7000 : ca?.kiosk === 'basic' ? 3500 : 0
          const lotteryEst = ca?.lottery === 'intensive' ? 2250 : ca?.lottery === 'basic' ? 1000 : 0
          const communityEst = kioskEst + lotteryEst + (ca?.functionaries ? 3000 : 0)
          const weeklyBase = Math.round((club?.reputation ?? 50) * 150)
          const netPerRound = weeklyBase + sponsorIncome + communityEst - weeklyWages
          const finances = club?.finances ?? 0
          const formatTkr = (n: number) => {
            const abs = Math.abs(n)
            const sign = n < 0 ? '-' : n > 0 ? '+' : ''
            if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)} mkr`
            return `${sign}${Math.round(abs / 1_000)} tkr`
          }
          const activeIcons = [
            ca?.kiosk !== 'none' && ca?.kiosk ? '🏪' : null,
            ca?.lottery !== 'none' && ca?.lottery ? '🎟️' : null,
            ca?.bandyplay ? '🏒' : null,
            ca?.functionaries ? '🤝' : null,
          ].filter(Boolean)
          return (
            <div
              onClick={() => navigate('/game/club', { state: { tab: 'ekonomi' } })}
              style={{ ...cardStyle, cursor: 'pointer' }}
            >
              <p style={{ ...cardLabelStyle }}>💰 Ekonomi</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: finances < 0 ? '#ef4444' : '#F0F4F8' }}>
                  {finances >= 0 ? '' : ''}{Math.abs(finances) >= 1_000_000 ? `${(finances / 1_000_000).toFixed(1)} mkr` : `${Math.round(finances / 1_000)} tkr`}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: netPerRound >= 0 ? '#22c55e' : '#ef4444' }}>
                  Netto {formatTkr(netPerRound)}/omg
                </span>
              </div>
              {activeIcons.length > 0 && (
                <p style={{ fontSize: 11, color: '#4A6080' }}>
                  Aktiva: {activeIcons.join(' ')}
                </p>
              )}
            </div>
          )
        })()}

        {/* Guidance banners */}
        <GuidanceBanner
          hasPendingLineup={hasPendingLineup}
          nextFixture={nextFixture ?? null}
          lastCompletedFixture={lastCompletedFixture}
          onNavigateToMatch={() => navigate('/game/match')}
          onNavigateToReport={() => navigate('/game/match', { state: { showReport: true } })}
        />

        {/* Bandydoktorn */}
        {(() => {
          const questionsLeft = Math.max(0, 5 - (game!.doctorQuestionsUsed ?? 0))
          return (
            <button
              onClick={() => navigate('/game/doctor')}
              style={{
                width: '100%', marginTop: 8, marginBottom: 120,
                padding: '11px 14px',
                background: 'rgba(56,189,248,0.05)',
                border: '1px solid rgba(56,189,248,0.15)',
                borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 13, color: '#38bdf8', fontWeight: 600 }}>🩺 Bandydoktorn</span>
              <span style={{ fontSize: 12, color: '#4A6080' }}>{questionsLeft} frågor kvar →</span>
            </button>
          )
        })()}

      </div>

      {/* Fixed bottom: FORTSÄTT button */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '430px',
        padding: '12px 20px',
        paddingBottom: 'calc(12px + var(--safe-bottom))',
        background: 'linear-gradient(to top, #0D1B2A 80%, transparent)',
        zIndex: 50,
      }}>
        {canSimulateRemaining && !isBatchSim && (
          <button
            onClick={() => setIsBatchSim(true)}
            style={{
              width: '100%', marginBottom: 8,
              padding: '11px',
              background: 'transparent',
              border: '1px solid #1e3450',
              borderRadius: 10,
              color: '#4A6080',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ⏩ Simulera resterande säsong
          </button>
        )}
        {isBatchSim && (
          <div style={{
            marginBottom: 8, padding: '10px 14px',
            background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: 10, textAlign: 'center',
          }}>
            <div style={{ fontSize: 13, color: '#C9A84C', fontWeight: 700 }}>⏩ Simulerar säsongen...</div>
            <div style={{ fontSize: 11, color: '#4A6080', marginTop: 3 }}>
              {remainingOtherFixtures} omgångar kvar
            </div>
          </div>
        )}
        <button
          onClick={handleAdvance}
          disabled={!canClickAdvance || isBatchSim}
          className={canClickAdvance && !isBatchSim ? 'btn-pulse' : undefined}
          style={{
            width: '100%',
            padding: '17px',
            background: canClickAdvance && !isBatchSim ? '#C9A84C' : '#1a2e47',
            color: canClickAdvance && !isBatchSim ? '#0D1B2A' : '#4A6080',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            border: 'none',
            boxShadow: canClickAdvance && !isBatchSim ? '0 4px 20px rgba(201,168,76,0.3)' : 'none',
            cursor: canClickAdvance && !isBatchSim ? 'pointer' : 'not-allowed',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {advanceButtonText}
        </button>
      </div>
    </div>
  )
}
