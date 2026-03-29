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
import { PlayoffStatus } from '../../domain/enums'
import type { PlayoffBracket, PlayoffSeries } from '../../domain/entities/Playoff'
import type { SaveGame } from '../../domain/entities/SaveGame'
import type { EventChoice } from '../../domain/entities/GameEvent'
import type { CupBracket } from '../../domain/entities/Cup'
import { getCupRoundLabel, getManagedClubCupStatus } from '../../domain/services/cupService'
import { playSound } from '../audio/soundEffects'
import { PlayoffBanner } from '../components/dashboard/PlayoffBanner'
import { NextMatchCard } from '../components/dashboard/NextMatchCard'
import { LastResultCard } from '../components/dashboard/LastResultCard'
import { SquadStatusCard } from '../components/dashboard/SquadStatusCard'
import { CommunityPulse } from '../components/dashboard/CommunityPulse'
import { calcWeeklyEconomy } from '../../domain/services/economyService'


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
  const homeWins = series.homeWins
  const awayWins = series.awayWins
  const homeWon = homeWins > awayWins && series.winnerId !== null
  const awayWon = awayWins > homeWins && series.winnerId !== null

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 12, color: isManagedHome ? 'var(--accent-dark)' : homeWon ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: isManagedHome ? 700 : 400, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>
        {homeClub?.shortName ?? homeClub?.name ?? '?'}
      </span>
      <span style={{ fontSize: 13, fontWeight: 700, color: isManaged ? 'var(--accent-dark)' : 'var(--text-primary)', letterSpacing: '1px', margin: '0 8px', minWidth: 32, textAlign: 'center', fontFamily: 'var(--font-display)' }}>
        {homeWins}–{awayWins}
      </span>
      <span style={{ fontSize: 12, color: isManagedAway ? 'var(--accent-dark)' : awayWon ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: isManagedAway ? 700 : 400, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right', fontFamily: 'var(--font-body)' }}>
        {awayClub?.shortName ?? awayClub?.name ?? '?'}
      </span>
    </div>
  )
}

interface PlayoffBracketCardProps {
  bracket: PlayoffBracket
  game: SaveGame
}

function PlayoffBracketCard({ bracket, game }: PlayoffBracketCardProps) {
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

  const navigate = useNavigate()

  return (
    <div className="card-sharp card-stagger-3" style={{ margin: '0 12px 10px', overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
            ⚔️ SLUTSPEL
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="tag tag-fill">{statusLabel}</span>
            <button
              onClick={(e) => { e.stopPropagation(); navigate('/game/tabell') }}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--accent)', fontSize: 12, lineHeight: 1,
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                cursor: 'pointer',
              }}
            >›</button>
          </div>
        </div>
      </div>
      <div style={{ padding: '0 14px 12px' }}>
        {bracket.status === PlayoffStatus.Completed && champion ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <span style={{ fontSize: 24 }}>🏆</span>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-dark)', marginTop: 4, fontFamily: 'var(--font-display)' }}>{champion.name}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Svenska Mästare {bracket.season}</p>
          </div>
        ) : (
          <div>
            {activeSeries.map(series => (
              <PlayoffSeriesRow key={series.id} series={series} game={game} managedClubId={managedClubId} />
            ))}
            {activeSeries.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Slutspelet startar snart</p>
            )}
          </div>
        )}
        {bracket.status !== PlayoffStatus.Completed && (
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8, fontFamily: 'var(--font-body)' }}>
            {bracket.status === PlayoffStatus.Final ? 'En match avgör' : 'Bäst av 5 matcher per serie'}
          </p>
        )}
      </div>
    </div>
  )
}

interface CupCardProps {
  bracket: CupBracket
  game: SaveGame
}

function CupCard({ bracket, game }: CupCardProps) {
  const managedClubId = game.managedClubId
  const cupStatus = getManagedClubCupStatus(bracket, managedClubId)
  const nextCupFixture = game.fixtures
    .filter(f => f.isCup && f.status === 'scheduled' &&
      (f.homeClubId === managedClubId || f.awayClubId === managedClubId))
    .sort((a, b) => a.roundNumber - b.roundNumber)[0]
  const roundsWithMatches = [...new Set(bracket.matches.map(m => m.round))]
  const currentRound = Math.max(...roundsWithMatches)
  const stageLabel = getCupRoundLabel(currentRound)

  let statusContent: React.ReactNode

  if (bracket.completed && bracket.winnerId === managedClubId) {
    statusContent = (
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <span style={{ fontSize: 24 }}>🏆</span>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-dark)', marginTop: 4, fontFamily: 'var(--font-display)' }}>CUPVINNARE!</p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Svenska Cupen {bracket.season}</p>
      </div>
    )
  } else if (bracket.completed) {
    const winner = game.clubs.find(c => c.id === bracket.winnerId)
    statusContent = (
      <div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'var(--font-body)' }}>Cupen är avgjord</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>🏆 {winner?.name ?? 'Okänd klubb'} vann Svenska Cupen</p>
      </div>
    )
  } else if (cupStatus.eliminated) {
    const roundName = cupStatus.eliminatedInRound === 1 ? 'förstarundan' : cupStatus.eliminatedInRound === 2 ? 'kvartsfinalen' : cupStatus.eliminatedInRound === 3 ? 'semifinalen' : 'finalen'
    const winner = bracket.winnerId ? game.clubs.find(c => c.id === bracket.winnerId) : null
    statusContent = (
      <div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: winner ? 4 : 0, fontFamily: 'var(--font-body)' }}>Utslagna i {roundName}</p>
        {winner && <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Vinnare: {winner.name}</p>}
      </div>
    )
  } else if (nextCupFixture) {
    const opponent = game.clubs.find(c => c.id === (nextCupFixture.homeClubId === managedClubId ? nextCupFixture.awayClubId : nextCupFixture.homeClubId))
    const isHome = nextCupFixture.homeClubId === managedClubId
    const cupLeagueRound = nextCupFixture.roundNumber - 100
    const lastLeagueRound = Math.max(0, ...game.fixtures.filter(f => !f.isCup && f.status === 'completed').map(f => f.roundNumber))
    const roundsUntil = cupLeagueRound - lastLeagueRound
    statusContent = (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'var(--font-body)' }}>vs {opponent?.shortName ?? opponent?.name ?? '?'}</span>
          <span className={isHome ? 'tag tag-green' : 'tag tag-ice'}>{isHome ? 'Hemma' : 'Borta'}</span>
        </div>
        <p style={{ fontSize: 11, color: roundsUntil <= 1 ? 'var(--warning)' : 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-body)' }}>
          {roundsUntil <= 1 ? '⚡ Spelas NÄSTA omgång!' : `Spelas vid serieomgång ${cupLeagueRound} (om ${roundsUntil} omgångar)`}
        </p>
      </div>
    )
  } else {
    const playedAndWon = bracket.matches.filter(m => (m.homeClubId === managedClubId || m.awayClubId === managedClubId) && m.winnerId === managedClubId)
    statusContent = playedAndWon.length > 0
      ? <p style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600, fontFamily: 'var(--font-body)' }}>✅ Klar för {playedAndWon.length >= 2 ? 'finalen' : 'semifinalen'}</p>
      : <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Drar igång under säsongen</p>
  }

  return (
    <div className="card-sharp card-stagger-3" style={{ margin: '0 12px 10px', overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
            🏆 SVENSKA CUPEN
          </p>
          {!bracket.completed && !cupStatus.eliminated && <span className="tag tag-copper">{stageLabel}</span>}
        </div>
      </div>
      <div style={{ padding: '0 14px 12px' }}>{statusContent}</div>
    </div>
  )
}

function pickBatchSimChoice(choices: EventChoice[]): string {
  const noOp = choices.find(c => c.effect.type === 'noOp')
  if (noOp) return noOp.id
  const rejectTransfer = choices.find(c => c.effect.type === 'rejectTransfer')
  if (rejectTransfer) return rejectTransfer.id
  return choices[0].id
}

// Ornamental diamond divider above CTA
function DiamondDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, var(--border-dark))' }} />
      <svg viewBox="0 0 28 12" width="28" height="12">
        <polygon points="14,1 27,6 14,11 1,6" fill="none" stroke="var(--accent)" strokeWidth="0.8" opacity="0.4"/>
        <polygon points="14,4 20,6 14,8 8,6" fill="var(--accent)" opacity="0.15"/>
      </svg>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, var(--border-dark), transparent)' }} />
    </div>
  )
}

export function DashboardScreen() {
  const { game, advance, markTutorialSeen, resolveEvent } = useGameStore()
  const club = useManagedClub()
  const standing = useCurrentStanding()
  const hasPendingLineup = useHasPendingLineup()
  const canAdvance = useCanAdvance()
  const lastCompletedFixture = useLastCompletedFixture()
  const playoffInfo = usePlayoffInfo()
  const navigate = useNavigate()
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
    const batchEffRound = (f: { roundNumber: number; isCup?: boolean }) => f.isCup ? f.roundNumber - 100 : f.roundNumber
    const nextEff = Math.min(...scheduled.map(batchEffRound))
    const managedCupNext = scheduled.some(f => batchEffRound(f) === nextEff && f.isCup && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
    if (managedCupNext) { setIsBatchSim(false); return }
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

  function effectiveRound(f: { roundNumber: number; isCup?: boolean }): number {
    return f.isCup ? f.roundNumber - 100 : f.roundNumber
  }

  function isManagedTeamEliminated(g: SaveGame): boolean {
    const bracket = g.playoffBracket
    if (!bracket) return false
    const id = g.managedClubId
    const allSeries = [...(bracket.quarterFinals ?? []), ...(bracket.semiFinals ?? []), ...(bracket.final ? [bracket.final] : [])]
    return allSeries.some(s => s.loserId === id)
  }

  const eliminated = isManagedTeamEliminated(game)

  const nextFixture = game.fixtures
    .filter(f => {
      if (f.status !== 'scheduled') return false
      if (f.homeClubId !== game.managedClubId && f.awayClubId !== game.managedClubId) return false
      if (eliminated && f.roundNumber > 22 && !f.isCup) return false
      return true
    })
    .sort((a, b) => effectiveRound(a) - effectiveRound(b))[0]

  const matchWeather = nextFixture ? (game.matchWeathers ?? []).find(mw => mw.fixtureId === nextFixture.id) : undefined
  const opponent = nextFixture ? game.clubs.find(c => c.id === (nextFixture.homeClubId === game.managedClubId ? nextFixture.awayClubId : nextFixture.homeClubId)) : null
  const isHome = nextFixture ? nextFixture.homeClubId === game.managedClubId : false

  // Last match result
  let lastResult: { scoreFor: number; scoreAgainst: number; opponentName: string } | null = null
  if (lastCompletedFixture) {
    const isHomeTeam = lastCompletedFixture.homeClubId === game.managedClubId
    const scoreFor = isHomeTeam ? lastCompletedFixture.homeScore : lastCompletedFixture.awayScore
    const scoreAgainst = isHomeTeam ? lastCompletedFixture.awayScore : lastCompletedFixture.homeScore
    const lastOpponent = game.clubs.find(c => c.id === (isHomeTeam ? lastCompletedFixture.awayClubId : lastCompletedFixture.homeClubId))
    lastResult = { scoreFor, scoreAgainst, opponentName: lastOpponent?.name ?? 'Okänd' }
  }

  // Squad stats
  const squadPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  const injuredCount = squadPlayers.filter(p => p.isInjured).length
  const readyCount = Math.max(0, squadPlayers.length - injuredCount)
  const avgForm = squadPlayers.length > 0 ? Math.round(squadPlayers.reduce((sum, p) => sum + p.form, 0) / squadPlayers.length) : 0
  const avgFitness = squadPlayers.length > 0 ? Math.round(squadPlayers.reduce((sum, p) => sum + (p.fitness ?? 75), 0) / squadPlayers.length) : 0
  const morale = game.fanMood ?? 50
  const sharpness = Math.round((avgForm * 0.6 + avgFitness * 0.4))

  // Current round
  const currentRound = game.fixtures.filter(f => f.status === 'completed' && !f.isCup).reduce((max, f) => Math.max(max, f.roundNumber), 0)

  // Recent form (last 5)
  const recentForm: Array<'V' | 'O' | 'F'> = game.fixtures
    .filter(f => f.status === 'completed' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) && !f.isCup)
    .sort((a, b) => b.roundNumber - a.roundNumber)
    .slice(0, 5)
    .map(f => {
      const isHomeTeam = f.homeClubId === game.managedClubId
      const scored = isHomeTeam ? f.homeScore : f.awayScore
      const conceded = isHomeTeam ? f.awayScore : f.homeScore
      return scored > conceded ? 'V' : scored < conceded ? 'F' : 'O'
    })

  // Playoff context
  const isPlayoffFixture = nextFixture && nextFixture.roundNumber > 22
  const playoffSeries = isPlayoffFixture && playoffInfo ? (() => {
    const allSeries = [...playoffInfo.quarterFinals, ...playoffInfo.semiFinals, ...(playoffInfo.final ? [playoffInfo.final] : [])]
    return allSeries.find(s => s.fixtures.includes(nextFixture.id)) ?? null
  })() : null

  const managedIsSeriesHome = playoffSeries ? playoffSeries.homeClubId === game.managedClubId : false
  const dynamicHomeWins = playoffSeries ? (managedIsSeriesHome ? playoffSeries.homeWins : playoffSeries.awayWins) : 0
  const dynamicAwayWins = playoffSeries ? (managedIsSeriesHome ? playoffSeries.awayWins : playoffSeries.homeWins) : 0

  const isPlayoffJustStarted = playoffInfo && playoffInfo.status === PlayoffStatus.QuarterFinals &&
    playoffInfo.quarterFinals.every(s => game.fixtures.filter(f => s.fixtures.includes(f.id) && f.status === 'completed').length === 0)

  // Economy
  const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  const monthlySalary = managedPlayers.reduce((s, p) => s + p.salary, 0)
  const { netPerRound } = calcWeeklyEconomy(club.reputation ?? 50, game.sponsors ?? [], game.communityActivities, monthlySalary)
  const ca = game.communityActivities
  const finances = club.finances ?? 0
  const formatTkr = (n: number) => {
    const abs = Math.abs(n)
    const sign = n < 0 ? '-' : n > 0 ? '+' : ''
    if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)} mkr`
    return `${sign}${Math.round(abs / 1_000)} tkr`
  }
  const activeIcons = [
    ca?.kiosk && ca.kiosk !== 'none' ? '🏪' : null,
    ca?.lottery && ca.lottery !== 'none' ? '🎟️' : null,
    ca?.bandyplay ? '🏒' : null,
    ca?.functionaries ? '🤝' : null,
  ].filter(Boolean)

  // Inbox
  const unread = (game.inbox ?? []).filter(i => !i.isRead)
  const latestUnread = unread.sort((a, b) => b.date.localeCompare(a.date))[0]

  // Advance button
  const hasScheduledFixtures = game.fixtures.some(f => f.status === 'scheduled')
  const canClickAdvance = canAdvance || hasScheduledFixtures
  const playedRounds = game.fixtures.filter(f => f.status === 'completed' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) && !f.isCup).length
  const canSimulateRemaining = hasScheduledFixtures && playedRounds >= 10 && !game.playoffBracket
  const remainingOtherFixtures = game.fixtures.filter(f => f.status === 'scheduled').length

  const advanceButtonText = (() => {
    const scheduled = game.fixtures.filter(f => f.status === 'scheduled')
    if (scheduled.length === 0) {
      if (!game.playoffBracket) return 'Starta slutspel →'
      if (game.playoffBracket.status === PlayoffStatus.Completed) return 'Avsluta säsongen →'
      return 'Fortsätt slutspel →'
    }
    const nextManaged = scheduled.filter(f => {
      if (f.homeClubId !== game.managedClubId && f.awayClubId !== game.managedClubId) return false
      if (eliminated && f.roundNumber > 22 && !f.isCup) return false
      return true
    }).sort((a, b) => a.roundNumber - b.roundNumber)[0]
    if (nextManaged) {
      if (nextManaged.isCup) {
        const cupMatch = game.cupBracket?.matches.find(m => m.fixtureId === nextManaged.id)
        const cupRound = cupMatch?.round ?? 1
        const cupLabel = cupRound === 1 ? 'Förstarunda' : cupRound === 2 ? 'Kvartsfinal' : cupRound === 3 ? 'Semifinal' : 'Final'
        return `Spela Cup-${cupLabel} →`
      }
      if (game.playoffBracket) {
        const r = nextManaged.roundNumber
        return `Spela ${r <= 25 ? 'Kvartsfinal' : r <= 28 ? 'Semifinal' : 'Final'} →`
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
        if ((result?.pendingEvents?.length ?? 0) > 0) { navigate('/game/events'); return }
        navigate('/game/round-summary')
      } catch (err) { console.error('advance() failed:', err) }
      return
    }
    const effRound = (f: { roundNumber: number; isCup?: boolean }) => f.isCup ? f.roundNumber - 100 : f.roundNumber
    const nextSimEff = Math.min(...scheduledFixtures.map(effRound))
    const managedMatchInNextRound = scheduledFixtures.find(f => effRound(f) === nextSimEff && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
    if (managedMatchInNextRound) { navigate('/game/match'); return }
    try {
      const result = advance()
      if ((result?.pendingEvents?.length ?? 0) > 0) { navigate('/game/events'); return }
      navigate('/game/round-summary')
    } catch (err) { console.error('advance() failed:', err) }
  }

  return (
    <div className="screen-enter" style={{ position: 'relative', minHeight: '100%', background: 'var(--bg)' }}>
      {!game.tutorialSeen && (
        <TutorialOverlay managerName={game.managerName} clubName={club.name} onDone={markTutorialSeen} />
      )}

      {/* ── CONTENT ── */}
      <div className="texture-wood" style={{ paddingTop: 12, paddingBottom: 120 }}>

        {/* Playoff just started banner */}
        {isPlayoffJustStarted && (
          <div style={{ margin: '0 12px 10px' }}>
            <PlayoffBanner game={game} playoffInfo={playoffInfo} />
          </div>
        )}

        {/* Eliminated */}
        {eliminated && !nextFixture && game.playoffBracket && game.playoffBracket.status !== PlayoffStatus.Completed && (
          <div className="card-round card-stagger-1" style={{ margin: '0 12px 10px', padding: '18px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4, fontFamily: 'var(--font-body)' }}>Din säsong är slut</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-body)' }}>Väntar på att slutspelet ska avgöras...</p>
          </div>
        )}

        {/* Next match card */}
        {nextFixture && opponent && (
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
          />
        )}

        {/* Stats row: Tabell + Senast */}
        <div style={{ display: 'flex', gap: 8, margin: '0 12px 10px' }}>
          {/* Tabell sharp card */}
          {standing && (
            <div
              className="card-sharp card-stagger-3"
              style={{ flex: 1, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
              onClick={() => navigate('/game/tabell')}
            >
              {standing.position <= 8 && (
                <span className="tag tag-fill" style={{ position: 'absolute', top: -1, right: 8, borderRadius: '0 0 8px 8px', letterSpacing: '1px' }}>
                  SLUTSPEL
                </span>
              )}
              <div style={{ padding: '14px 12px 10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
                    📊 Tabell
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate('/game/tabell') }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                      background: 'transparent', border: '1px solid var(--border)',
                      color: 'var(--accent)', fontSize: 12, lineHeight: 1,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                      cursor: 'pointer',
                    }}
                  >›</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                  <span style={{ fontSize: 36, fontWeight: 400, color: 'var(--accent-dark)', lineHeight: 1, fontFamily: 'var(--font-display)' }}>
                    {standing.position}
                  </span>
                  <div>
                    {(() => {
                      const lastSummary = (game.seasonSummaries ?? []).slice(-1)[0]
                      const lastPos = lastSummary?.finalPosition ?? null
                      const posDiff = lastPos != null ? lastPos - standing.position : null
                      return posDiff !== null && posDiff !== 0 ? (
                        <span style={{ fontSize: 12, fontWeight: 700, color: posDiff > 0 ? 'var(--success)' : 'var(--danger)', fontFamily: 'var(--font-body)' }}>
                          {posDiff > 0 ? `↑${posDiff}` : `↓${Math.abs(posDiff)}`}
                        </span>
                      ) : null
                    })()}
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '3px 0 0', fontFamily: 'var(--font-body)' }}>
                      {standing.points}p · {standing.goalDifference >= 0 ? '+' : ''}{standing.goalDifference} mål
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Senast sharp card */}
          {lastResult && (
            <LastResultCard
              lastResult={lastResult}
              lastCompletedFixture={lastCompletedFixture}
              recentForm={recentForm}
              onNavigateToReport={() => navigate('/game/match', { state: { showReport: true } })}
            />
          )}
        </div>

        {/* Playoff bracket or cup */}
        {playoffInfo ? (
          <PlayoffBracketCard bracket={playoffInfo} game={game} />
        ) : game.cupBracket ? (
          <CupCard bracket={game.cupBracket} game={game} />
        ) : null}

        {/* Squad status (Trupp) */}
        <SquadStatusCard
          readyCount={readyCount}
          injuredCount={injuredCount}
          avgForm={avgForm}
          avgFitness={avgFitness}
          morale={morale}
          sharpness={sharpness}
          onNavigateToSquad={() => navigate('/game/squad')}
        />

        {/* Ekonomi sharp card */}
        <div
          className="card-sharp"
          style={{ margin: '0 12px 10px', cursor: 'pointer' }}
          onClick={() => navigate('/game/club', { state: { tab: 'ekonomi' } })}
        >
          <div style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
                  💰 Ekonomi
                </p>
                <span style={{ fontSize: 18, fontWeight: 400, color: finances < 0 ? 'var(--danger)' : 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                  {Math.abs(finances) >= 1_000_000 ? `${(finances / 1_000_000).toFixed(1)} mkr` : `${Math.round(finances / 1_000)} tkr`}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: netPerRound >= 0 ? 'var(--success-light)' : 'var(--danger-text)', fontFamily: 'var(--font-body)' }}>
                  {formatTkr(netPerRound)}/omg
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate('/game/club', { state: { tab: 'ekonomi' } }) }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                    background: 'transparent', border: '1px solid var(--border)',
                    color: 'var(--accent)', fontSize: 12, lineHeight: 1,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    cursor: 'pointer',
                  }}
                >›</button>
              </div>
            </div>
            {activeIcons.length > 0 && (
              <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
                <span className="tag tag-outline">{activeIcons.join(' ')} aktiva</span>
                <span
                  onClick={e => { e.stopPropagation(); navigate('/game/club', { state: { tab: 'ekonomi' } }) }}
                  className="btn btn-ghost"
                  style={{ fontSize: 11 }}
                >
                  Budget →
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bygdens Puls */}
        <CommunityPulse game={game} currentRound={currentRound} onNavigate={() => navigate('/game/club', { state: { tab: 'ekonomi' } })} />

        {/* Inkorg round card */}
        {latestUnread && (
          <div
            className="card-round"
            style={{ margin: '0 12px 10px', cursor: 'pointer' }}
            onClick={() => navigate('/game/inbox')}
          >
            <div style={{ padding: '10px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0, flexShrink: 0 }}>
                    📬 Inkorg
                  </p>
                  <span className="tag tag-fill" style={{ animation: 'breatheDot 2s ease-in-out infinite', flexShrink: 0 }}>
                    {unread.length}
                  </span>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {latestUnread.title}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate('/game/inbox') }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                    background: 'transparent', border: '1px solid var(--border)',
                    color: 'var(--accent)', fontSize: 12, lineHeight: 1,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    cursor: 'pointer', marginLeft: 8,
                  }}
                >›</button>
              </div>
            </div>
          </div>
        )}

        {/* P17 sharp card */}
        {game.youthTeam && (
          <div className="card-sharp" style={{ margin: '0 12px 10px', cursor: 'pointer' }} onClick={() => navigate('/game/club', { state: { tab: 'akademi' } })}>
            <div style={{ padding: '10px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
                    🎓 Akademi
                  </p>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
                    P17 · {game.youthTeam.tablePosition}:a · {game.youthTeam.seasonRecord.w}V {game.youthTeam.seasonRecord.d}O {game.youthTeam.seasonRecord.l}F
                  </span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate('/game/club', { state: { tab: 'akademi' } }) }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                    background: 'transparent', border: '1px solid var(--border)',
                    color: 'var(--accent)', fontSize: 12, lineHeight: 1,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    cursor: 'pointer',
                  }}
                >›</button>
              </div>
            </div>
          </div>
        )}

        {/* Bandydoktorn */}
        {(() => {
          const questionsLeft = Math.max(0, 5 - (game.doctorQuestionsUsed ?? 0))
          return (
            <div
              className="card-sharp"
              style={{ margin: '0 12px 4px', cursor: 'pointer' }}
              onClick={() => navigate('/game/doctor')}
            >
              <div style={{ padding: '10px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
                    🩺 Bandydoktorn
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                      {questionsLeft} frågor kvar
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate('/game/doctor') }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                        background: 'transparent', border: '1px solid var(--border)',
                        color: 'var(--accent)', fontSize: 12, lineHeight: 1,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                        cursor: 'pointer',
                      }}
                    >›</button>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Diamond ornament + CTA */}
        <div style={{ margin: '8px 12px 0' }}>
          <DiamondDivider />

          {/* Batch sim */}
          {canSimulateRemaining && !isBatchSim && (
            <button
              onClick={() => setIsBatchSim(true)}
              className="btn btn-ghost"
              style={{ width: '100%', marginBottom: 8, justifyContent: 'center' }}
            >
              ⏩ Simulera resterande säsong
            </button>
          )}
          {isBatchSim && (
            <div style={{ marginBottom: 8, padding: '10px 14px', background: 'rgba(196,122,58,0.08)', border: '1px solid rgba(196,122,58,0.2)', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--accent-dark)', fontWeight: 700, fontFamily: 'var(--font-body)' }}>⏩ Simulerar säsongen...</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, fontFamily: 'var(--font-body)' }}>{remainingOtherFixtures} omgångar kvar</div>
                </div>
                <button
                  onClick={() => setIsBatchSim(false)}
                  className="btn btn-ghost"
                  style={{ fontSize: 11, padding: '4px 10px' }}
                >
                  Stopp
                </button>
              </div>
            </div>
          )}

          {/* Main CTA */}
          <button
            onClick={handleAdvance}
            disabled={!canClickAdvance || isBatchSim}
            className="texture-leather"
            style={{
              width: '100%',
              padding: '18px',
              background: canClickAdvance && !isBatchSim
                ? 'linear-gradient(135deg, #B06830, #8B4820)'
                : 'var(--border)',
              color: canClickAdvance && !isBatchSim ? 'var(--text-light)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-body)',
              cursor: canClickAdvance && !isBatchSim ? 'pointer' : 'not-allowed',
              animation: canClickAdvance && !isBatchSim ? 'pulseCTA 3s ease-in-out infinite' : undefined,
            }}
          >
            {advanceButtonText}
          </button>
        </div>
      </div>
    </div>
  )
}
