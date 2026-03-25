import { useEffect } from 'react'
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
import { ClubBadge } from '../components/ClubBadge'
import { TrophySVG, BandyStickSVG } from '../components/Decorations'
import { IceQuality, PlayoffStatus, PlayoffRound } from '../../domain/enums'
import { getWeatherEmoji, getIceQualityLabel } from '../../domain/services/weatherService'
import type { PlayoffBracket, PlayoffSeries } from '../../domain/entities/Playoff'
import type { SaveGame } from '../../domain/entities/SaveGame'
import { getRivalry } from '../../domain/data/rivalries'
import type { Fixture } from '../../domain/entities/Fixture'

function getSeriesScore(series: { fixtures: string[]; homeClubId: string; awayClubId: string }, fixtures: Fixture[]) {
  const seriesFixtures = fixtures.filter(
    f => series.fixtures.includes(f.id) && f.status === 'completed'
  )
  let homeWins = 0, awayWins = 0
  for (const f of seriesFixtures) {
    const homeWon = f.homeScore > f.awayScore
    if (f.homeClubId === series.homeClubId) {
      if (homeWon) homeWins++
      else if (f.awayScore > f.homeScore) awayWins++
    } else {
      if (homeWon) awayWins++
      else if (f.awayScore > f.homeScore) homeWins++
    }
  }
  return { homeWins, awayWins }
}

function getRoundLabel(round: PlayoffRound): string {
  if (round === PlayoffRound.QuarterFinal) return 'KF'
  if (round === PlayoffRound.SemiFinal) return 'SF'
  return 'Final'
}

function getRoundFullLabel(round: PlayoffRound): string {
  if (round === PlayoffRound.QuarterFinal) return 'Kvartsfinal'
  if (round === PlayoffRound.SemiFinal) return 'Semifinal'
  return 'SM-Final'
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
          Bäst av 3 matcher per serie
        </p>
      )}
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

  if (!game || !club) return null

  const nextFixture = game.fixtures
    .filter(f => (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) && f.status === 'scheduled')
    .sort((a, b) => a.roundNumber - b.roundNumber)[0]

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
      .filter(f => f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
      .sort((a, b) => a.roundNumber - b.roundNumber)[0]

    if (nextManaged) {
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
          <div style={{
            background: 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))',
            border: '2px solid rgba(201,168,76,0.4)',
            borderRadius: 12,
            padding: '20px 16px',
            marginBottom: 16,
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 24 }}>🏆</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#C9A84C', marginTop: 8 }}>
              Dags för slutspel!
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>
              Grundserien är avslutad. Matcherna har lottats:
            </p>
            <div style={{ marginTop: 12 }}>
              {playoffInfo.quarterFinals.map(series => {
                const home = game.clubs.find(c => c.id === series.homeClubId)
                const away = game.clubs.find(c => c.id === series.awayClubId)
                const isManaged = series.homeClubId === game.managedClubId ||
                                  series.awayClubId === game.managedClubId
                return (
                  <div key={series.id} style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 0',
                    fontWeight: isManaged ? 700 : 400,
                    color: isManaged ? '#C9A84C' : 'var(--text-secondary)',
                    fontSize: 13,
                  }}>
                    <span>{home?.shortName ?? home?.name}</span>
                    <span style={{ color: 'var(--text-muted)' }}>vs</span>
                    <span>{away?.shortName ?? away?.name}</span>
                  </div>
                )
              })}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
              Bäst av 3 matcher per serie
            </p>
          </div>
        )}

        {/* NEXT MATCH card */}
        {nextFixture && opponent && (
          <div className="card-stagger-1" style={{
            background: rivalry
              ? 'linear-gradient(135deg, #1a1215 0%, #0D1B2A 50%, #1a1215 100%) padding-box, linear-gradient(135deg, #DC3220, #C9A84C, #DC3220) border-box'
              : 'linear-gradient(135deg, #122235 0%, #0D1B2A 50%, #0f1e30 100%) padding-box, linear-gradient(135deg, #C9A84C, transparent 60%) border-box',
            border: '2px solid transparent',
            borderRadius: 12,
            padding: '18px',
            marginBottom: 12,
            boxShadow: '0 8px 32px rgba(201,168,76,0.12)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Watermark decoration */}
            <div style={{ position: 'absolute', top: -8, right: -8, opacity: 0.08, pointerEvents: 'none', zIndex: 0 }}>
              <BandyStickSVG size={80} />
            </div>
            {rivalry && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 10px',
                borderRadius: 99,
                background: 'linear-gradient(90deg, rgba(220,50,30,0.2), rgba(201,168,76,0.2))',
                border: '1px solid rgba(220,100,30,0.4)',
                fontSize: 11,
                fontWeight: 700,
                color: '#ff7040',
                marginBottom: 8,
                position: 'relative',
                zIndex: 1,
              }}>
                🔥 DERBY — {rivalry.name}
              </div>
            )}
            <p className="section-heading" style={{ ...cardLabelStyle, position: 'relative', zIndex: 1 }}>
              {isPlayoffFixture ? `NÄSTA MATCH — ${playoffSeries ? getRoundFullLabel(playoffSeries.round).toUpperCase() : 'SLUTSPEL'}` : 'NÄSTA MATCH'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, position: 'relative', zIndex: 1 }}>
              {/* Club badges */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <ClubBadge clubId={game.managedClubId} name={club.name} size={36} />
                <span style={{ fontSize: 10, color: '#8A9BB0', maxWidth: 56, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {club.name}
                </span>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#F0F4F8', letterSpacing: '2px' }}>VS</p>
                {isPlayoffFixture && playoffSeries ? (
                  <p style={{ fontSize: 13, color: '#C9A84C', marginTop: 2, fontWeight: 700 }}>
                    {getRoundLabel(playoffSeries.round)} · {dynamicHomeWins}–{dynamicAwayWins}
                  </p>
                ) : (
                  <p style={{ fontSize: 13, color: '#8A9BB0', marginTop: 2 }}>Omgång {nextFixture.roundNumber}</p>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <ClubBadge clubId={nextFixture.homeClubId === game.managedClubId ? nextFixture.awayClubId : nextFixture.homeClubId} name={opponent.name} size={36} />
                <span style={{ fontSize: 10, color: '#8A9BB0', maxWidth: 56, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {opponent.name}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {/* Home/away pill */}
              <span style={{
                padding: '4px 10px',
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.5px',
                background: isHome ? 'rgba(34,197,94,0.15)' : 'rgba(37,99,235,0.15)',
                color: isHome ? '#22c55e' : '#60a5fa',
                border: `1px solid ${isHome ? 'rgba(34,197,94,0.3)' : 'rgba(37,99,235,0.3)'}`,
              }}>
                {isHome ? 'HEMMAMATCH' : 'BORTAMATCH'}
              </span>
              {/* Lineup status pill */}
              <span style={{
                padding: '4px 10px',
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.5px',
                background: hasPendingLineup ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                color: hasPendingLineup ? '#22c55e' : '#f59e0b',
                border: `1px solid ${hasPendingLineup ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
              }}>
                {hasPendingLineup ? 'TRUPP KLAR ✓' : '⚠ VÄLJ TRUPP'}
              </span>
            </div>
            {matchWeather && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                <span>{getWeatherEmoji(matchWeather.weather.condition)}</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {matchWeather.weather.temperature > 0 ? '+' : ''}{matchWeather.weather.temperature}°
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>·</span>
                <span style={{
                  fontSize: 12,
                  color: matchWeather.weather.iceQuality === IceQuality.Poor || matchWeather.weather.iceQuality === IceQuality.Cancelled
                    ? 'var(--danger)' : 'var(--text-secondary)'
                }}>
                  {getIceQualityLabel(matchWeather.weather.iceQuality)}
                  {(matchWeather.weather.iceQuality === IceQuality.Poor || matchWeather.weather.iceQuality === IceQuality.Cancelled) ? ' ⚠️' : ''}
                </span>
              </div>
            )}
          </div>
        )}

        {/* SENASTE RESULTAT card */}
        {lastResult && (
          <div
            className="card-stagger-2"
            style={{ ...cardStyle, cursor: 'pointer' }}
            onClick={() => navigate('/game/match', { state: { showReport: true } })}
          >
            <p className="section-heading" style={cardLabelStyle}>SENASTE RESULTAT</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p
                  className="tabular"
                  key={`${lastResult.scoreFor}-${lastResult.scoreAgainst}`}
                  style={{
                    fontSize: 32,
                    fontWeight: 900,
                    color: lastResult.scoreFor > lastResult.scoreAgainst
                      ? '#22c55e'
                      : lastResult.scoreFor < lastResult.scoreAgainst
                        ? '#ef4444'
                        : '#F0F4F8',
                    letterSpacing: '2px',
                    lineHeight: 1,
                    animation: 'countUp 400ms ease-out both',
                  }}
                >
                  {lastResult.scoreFor} — {lastResult.scoreAgainst}
                </p>
                <p style={{ fontSize: 12, color: '#8A9BB0', marginTop: 4 }}>
                  vs {lastResult.opponentName}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: 99,
                  fontSize: 11,
                  fontWeight: 700,
                  background: lastResult.scoreFor > lastResult.scoreAgainst
                    ? 'rgba(34,197,94,0.15)'
                    : lastResult.scoreFor < lastResult.scoreAgainst
                      ? 'rgba(239,68,68,0.15)'
                      : 'rgba(248,250,252,0.1)',
                  color: lastResult.scoreFor > lastResult.scoreAgainst
                    ? '#22c55e'
                    : lastResult.scoreFor < lastResult.scoreAgainst
                      ? '#ef4444'
                      : '#F0F4F8',
                  border: `1px solid ${lastResult.scoreFor > lastResult.scoreAgainst
                    ? 'rgba(34,197,94,0.3)'
                    : lastResult.scoreFor < lastResult.scoreAgainst
                      ? 'rgba(239,68,68,0.3)'
                      : 'rgba(248,250,252,0.15)'}`,
                }}>
                  {lastResult.scoreFor > lastResult.scoreAgainst
                    ? 'Vinst'
                    : lastResult.scoreFor < lastResult.scoreAgainst
                      ? 'Förlust'
                      : 'Oavgjort'}
                </span>
                <span style={{ color: '#C9A84C', fontSize: 16, fontWeight: 700 }}>→</span>
              </div>
            </div>
          </div>
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
            className="card-stagger-3"
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

        {/* TRUPPSTATUS card */}
        <div className="card-stagger-4" style={cardStyle}>
          <p className="section-heading" style={cardLabelStyle}>TRUPPSTATUS</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: injuredCount === 0 ? '#22c55e' : '#ef4444',
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 13, color: '#8A9BB0' }}>
                Skador: <span style={{ color: injuredCount > 0 ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
                  {injuredCount} spelare
                </span>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BandyStickSVG size={14} color={formColor} />
              <span style={{ fontSize: 13, color: '#8A9BB0' }}>
                Form: <span style={{ color: formColor, fontWeight: 600 }}>{formLabel}</span>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#8A9BB0' }}>
                Klubbkassa:{' '}
                <span style={{
                  color: club.finances > 0 ? '#22c55e' : '#ef4444',
                  fontWeight: 600
                }}>
                  {club.finances >= 1000000
                    ? `${(club.finances / 1000000).toFixed(1)} mkr`
                    : `${Math.round(club.finances / 1000)} tkr`}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Guidance banners */}
        {!hasPendingLineup && nextFixture ? (
          <div className="card-stagger-5" style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 10,
            padding: '12px 14px',
            fontSize: 13,
            color: '#8A9BB0',
            marginBottom: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>⚠ Du har inte satt en startelva. Sätt din trupp inför matchen.</span>
              <button
                onClick={() => navigate('/game/match')}
                style={{
                  flexShrink: 0,
                  marginLeft: 10,
                  background: 'none',
                  border: 'none',
                  color: '#C9A84C',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                → Trupp
              </button>
            </div>
          </div>
        ) : lastCompletedFixture ? (
          <div
            className="card-stagger-5"
            style={{
              background: 'rgba(37,99,235,0.08)',
              border: '1px solid rgba(37,99,235,0.2)',
              borderRadius: 10,
              padding: '12px 14px',
              fontSize: 13,
              color: '#8A9BB0',
              marginBottom: 12,
              cursor: 'pointer',
            }}
            onClick={() => navigate('/game/match', { state: { showReport: true } })}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📋 Ny matchrapport tillgänglig. Klicka för att se rapporten</span>
              <span style={{ marginLeft: 10, color: '#C9A84C', fontWeight: 700 }}>→</span>
            </div>
          </div>
        ) : (
          <div className="card-stagger-5" style={{
            fontSize: 13,
            color: '#22c55e',
            fontWeight: 600,
            marginBottom: 12,
            padding: '10px 14px',
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 10,
          }}>
            ✓ Redo för match
          </div>
        )}

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
        <button
          onClick={handleAdvance}
          disabled={!canClickAdvance}
          className={canClickAdvance ? 'btn-pulse' : undefined}
          style={{
            width: '100%',
            padding: '17px',
            background: canClickAdvance ? '#C9A84C' : '#1a2e47',
            color: canClickAdvance ? '#0D1B2A' : '#4A6080',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            border: 'none',
            boxShadow: canClickAdvance ? '0 4px 20px rgba(201,168,76,0.3)' : 'none',
            cursor: canClickAdvance ? 'pointer' : 'not-allowed',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {advanceButtonText}
        </button>
      </div>
    </div>
  )
}
