import { useState, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGameStore, useLastCompletedFixture } from '../store/gameStore'
import { PlayerPosition, FixtureStatus, MatchEventType, TacticMentality, TacticTempo, TacticPress, TacticPassingRisk, TacticWidth, TacticAttackingFocus, CornerStrategy, PenaltyKillStyle, PlayoffRound } from '../../domain/enums'
import { getWeatherEmoji, getIceQualityLabel, getConditionLabel } from '../../domain/services/weatherService'
import type { Tactic } from '../../domain/entities/Club'
import type { Fixture, MatchEvent } from '../../domain/entities/Fixture'
import type { Player } from '../../domain/entities/Player'
import type { SaveGame } from '../../domain/entities/SaveGame'
import { getRivalry } from '../../domain/data/rivalries'

function getPlayoffRoundLabel(round: PlayoffRound): string {
  if (round === PlayoffRound.QuarterFinal) return 'KVARTSFINAL'
  if (round === PlayoffRound.SemiFinal) return 'SEMIFINAL'
  return 'SM-FINAL'
}

function positionShort(pos: PlayerPosition): string {
  const map: Record<PlayerPosition, string> = {
    [PlayerPosition.Goalkeeper]: 'MV',
    [PlayerPosition.Defender]: 'DEF',
    [PlayerPosition.Half]: 'HALF',
    [PlayerPosition.Midfielder]: 'MID',
    [PlayerPosition.Forward]: 'FWD',
  }
  return map[pos] ?? pos
}

const POSITION_ORDER: Record<PlayerPosition, number> = {
  [PlayerPosition.Goalkeeper]: 0,
  [PlayerPosition.Defender]: 1,
  [PlayerPosition.Half]: 2,
  [PlayerPosition.Midfielder]: 3,
  [PlayerPosition.Forward]: 4,
}

// ── Segmented Control ──────────────────────────────────────────────────
interface SegmentedControlProps {
  options: { label: string; value: string }[]
  value: string
  onChange: (v: string) => void
}

function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            flex: 1,
            padding: '6px 4px',
            borderRadius: 'var(--radius-sm)',
            background: value === opt.value ? 'var(--accent)' : 'var(--bg-elevated)',
            border: '1px solid ' + (value === opt.value ? 'var(--accent)' : 'var(--border)'),
            color: value === opt.value ? '#fff' : 'var(--text-secondary)',
            fontSize: 11,
            fontWeight: value === opt.value ? 600 : 400,
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ── Match Report View ───────────────────────────────────────────────────
interface MatchReportViewProps {
  fixture: Fixture
  game: SaveGame
  onClose: () => void
}

function eventIcon(type: MatchEventType): string {
  if (type === MatchEventType.Goal) return '🔴'
  if (type === MatchEventType.YellowCard) return '🟨'
  if (type === MatchEventType.RedCard) return '🟥'
  if (type === MatchEventType.Save) return '🧤'
  if (type === MatchEventType.Corner) return '📐'
  return ''
}

function ratingColor(r: number): string {
  if (r < 6) return 'var(--danger)'
  if (r < 7) return 'var(--warning)'
  return 'var(--success)'
}

function MatchReportView({ fixture, game, onClose }: MatchReportViewProps) {
  const homeClub = game.clubs.find(c => c.id === fixture.homeClubId)
  const awayClub = game.clubs.find(c => c.id === fixture.awayClubId)

  const visibleEvents = fixture.events.filter(e =>
    e.type === MatchEventType.Goal ||
    e.type === MatchEventType.YellowCard ||
    e.type === MatchEventType.RedCard
  ).sort((a, b) => a.minute - b.minute)

  const playerRatings = fixture.report?.playerRatings ?? {}

  // Collect all players from both lineups
  const allLineupIds = [
    ...(fixture.homeLineup?.startingPlayerIds ?? []),
    ...(fixture.awayLineup?.startingPlayerIds ?? []),
  ]

  const ratedPlayers = allLineupIds
    .map(id => {
      const player = game.players.find(p => p.id === id)
      const rating = playerRatings[id]
      if (!player || rating === undefined) return null
      const isHome = fixture.homeLineup?.startingPlayerIds.includes(id)
      return { player, rating, isHome: isHome ?? false }
    })
    .filter((x): x is { player: Player; rating: number; isHome: boolean } => x !== null)
    .sort((a, b) => b.rating - a.rating)

  function getPlayerName(playerId?: string): string {
    if (!playerId) return ''
    const p = game.players.find(pl => pl.id === playerId)
    return p ? `${p.firstName} ${p.lastName}` : ''
  }

  function getEventText(event: MatchEvent): string {
    const name = getPlayerName(event.playerId)
    if (event.type === MatchEventType.Goal) return `${name} 🔴`
    if (event.type === MatchEventType.YellowCard) return `${name} 🟨`
    if (event.type === MatchEventType.RedCard) return `${name} 🟥`
    return event.description
  }

  return (
    <div style={{ padding: '20px 16px', overflowY: 'auto', height: '100%', animation: 'fadeInUp 300ms ease-out both' }}>
      {/* Header */}
      <p style={{
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '2px',
        color: 'var(--accent)',
        marginBottom: 16,
        textAlign: 'center',
      }}>
        MATCHSAMMANFATTNING
      </p>
      {/* Score banner */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '20px 16px',
        marginBottom: 16,
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1, textAlign: 'left' }}>
            {homeClub?.shortName ?? homeClub?.name}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 0 }}>
            <span style={{ fontSize: 48, fontWeight: 800, lineHeight: 1 }}>{fixture.homeScore}</span>
            <span style={{ fontSize: 24, color: 'var(--text-muted)', fontWeight: 300 }}>—</span>
            <span style={{ fontSize: 48, fontWeight: 800, lineHeight: 1 }}>{fixture.awayScore}</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1, textAlign: 'right' }}>
            {awayClub?.shortName ?? awayClub?.name}
          </p>
        </div>
        {fixture.roundNumber > 22 ? (() => {
          const bracket = game.playoffBracket
          const allSeries = bracket ? [
            ...bracket.quarterFinals,
            ...bracket.semiFinals,
            ...(bracket.final ? [bracket.final] : []),
          ] : []
          const series = allSeries.find(s => s.fixtures.includes(fixture.id))
          return (
            <p style={{ fontSize: 12, color: '#C9A84C', fontWeight: 700 }}>
              {series ? getPlayoffRoundLabel(series.round) : 'SLUTSPEL'}
            </p>
          )
        })() : (
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Omgång {fixture.roundNumber}</p>
        )}
      </div>

      {/* Events timeline */}
      {visibleEvents.length > 0 && (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          marginBottom: 16,
        }}>
          <p style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            color: 'var(--text-muted)',
            padding: '12px 14px 8px',
          }}>
            Händelser
          </p>
          {visibleEvents.map((event, index) => {
            const isHome = event.clubId === fixture.homeClubId
            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 14px',
                  borderTop: '1px solid var(--border)',
                  flexDirection: isHome ? 'row' : 'row-reverse',
                }}
              >
                <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 30, flexShrink: 0, textAlign: isHome ? 'left' : 'right' }}>
                  {event.minute}'
                </span>
                <span style={{ fontSize: 16, margin: '0 8px', flexShrink: 0 }}>
                  {eventIcon(event.type)}
                </span>
                <span style={{ fontSize: 13, flex: 1, textAlign: isHome ? 'left' : 'right' }}>
                  {getEventText(event)}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Match stats */}
      {fixture.report && (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '14px',
          marginBottom: 16,
        }}>
          <p style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            color: 'var(--text-muted)',
            marginBottom: 12,
          }}>
            Statistik
          </p>
          {[
            {
              label: 'Skott',
              home: String(fixture.report.shotsHome),
              away: String(fixture.report.shotsAway),
            },
            {
              label: 'Hörnor',
              home: String(fixture.report.cornersHome),
              away: String(fixture.report.cornersAway),
            },
            {
              label: 'Bollinnehav',
              home: fixture.report.possessionHome + '%',
              away: fixture.report.possessionAway + '%',
            },
          ].map(({ label, home, away }) => (
            <div key={label} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}>
              <span style={{ fontSize: 14, fontWeight: 600, minWidth: 30 }}>{home}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1, textAlign: 'center' }}>{label}</span>
              <span style={{ fontSize: 14, fontWeight: 600, minWidth: 30, textAlign: 'right' }}>{away}</span>
            </div>
          ))}
        </div>
      )}

      {/* Player ratings */}
      {ratedPlayers.length > 0 && (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          marginBottom: 24,
        }}>
          <p style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            color: 'var(--text-muted)',
            padding: '12px 14px 8px',
          }}>
            Spelarbetyg
          </p>
          {/* Matchens spelare — player with highest rating */}
          {(() => {
            const potmId = fixture.report?.playerOfTheMatchId
            const potm = potmId ? ratedPlayers.find(r => r.player.id === potmId) : ratedPlayers[0]
            if (!potm) return null
            return (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 14px',
                background: 'linear-gradient(135deg, rgba(201,168,76,0.18) 0%, rgba(201,168,76,0.06) 100%)',
                borderBottom: '1px solid rgba(201,168,76,0.3)',
                gap: 10,
              }}>
                <span style={{ fontSize: 20 }}>⭐</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#C9A84C', marginBottom: 2 }}>
                    Matchens spelare
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#C9A84C' }}>
                    {potm.player.firstName} {potm.player.lastName}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>
                    {positionShort(potm.player.position)}
                  </span>
                </div>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#C9A84C' }}>
                  {potm.rating.toFixed(1)}
                </span>
              </div>
            )
          })()}
          {ratedPlayers.map(({ player, rating, isHome }) => (
            <div
              key={player.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '9px 14px',
                borderTop: '1px solid var(--border)',
                gap: 10,
              }}
            >
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: isHome ? 'var(--accent)' : 'var(--warning)',
                flexShrink: 0,
              }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{player.firstName} {player.lastName}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>
                  {positionShort(player.position)}
                </span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: ratingColor(rating) }}>
                {rating.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Continue button */}
      <button
        onClick={onClose}
        style={{
          width: '100%',
          padding: '14px',
          background: 'var(--accent)',
          border: '1px solid var(--accent)',
          borderRadius: 'var(--radius)',
          color: '#fff',
          fontSize: 15,
          fontWeight: 600,
          marginBottom: 20,
          cursor: 'pointer',
        }}
      >
        Fortsätt →
      </button>
    </div>
  )
}

// ── Match Screen ───────────────────────────────────────────────────────
export function MatchScreen() {
  const { game, setPlayerLineup, advance, updateTactic } = useGameStore()
  const location = useLocation()
  const navigate = useNavigate()
  const lastCompletedFixtureFromStore = useLastCompletedFixture()

  const [showReport, setShowReport] = useState(() => !!(location.state as { showReport?: boolean } | null)?.showReport)
  const [completedFixture, setCompletedFixture] = useState<Fixture | null>(() =>
    (location.state as { showReport?: boolean } | null)?.showReport ? lastCompletedFixtureFromStore : null
  )
  const [tacticOpen, setTacticOpen] = useState(false)
  const [useLiveMode, setUseLiveMode] = useState(true)

  const managedClubId = game?.managedClubId ?? ''
  const managedClub = game?.clubs.find(c => c.id === managedClubId)
  const squadPlayers = useMemo(() => {
    if (!game) return []
    return game.players
      .filter(p => p.clubId === managedClubId)
      .sort((a, b) => POSITION_ORDER[a.position] - POSITION_ORDER[b.position])
  }, [game, managedClubId])

  // Default starting 11: exclude injured/suspended, sort by CA
  const defaultStarting = useMemo(() => {
    return [...squadPlayers]
      .filter(p => !p.isInjured && p.suspensionGamesRemaining <= 0)
      .sort((a, b) => b.currentAbility - a.currentAbility)
      .slice(0, 11)
      .map(p => p.id)
  }, [squadPlayers])

  // Init from saved pending lineup (single source of truth), fallback to computed default
  const savedLineup = game?.managedClubPendingLineup
  const [startingIds, setStartingIds] = useState<string[]>(() =>
    savedLineup?.startingPlayerIds ?? defaultStarting
  )
  const [benchIds, setBenchIds] = useState<string[]>(() =>
    savedLineup?.benchPlayerIds ??
    squadPlayers.filter(p => !defaultStarting.includes(p.id)).slice(0, 5).map(p => p.id)
  )
  const [captainId, setCaptainId] = useState<string | undefined>(() =>
    savedLineup?.captainPlayerId ?? defaultStarting[0]
  )
  const [lineupError, setLineupError] = useState<string | null>(null)
  const [tacticState, setTacticState] = useState<Tactic>(() =>
    managedClub?.activeTactic ?? {
      mentality: TacticMentality.Balanced,
      tempo: TacticTempo.Normal,
      press: TacticPress.Medium,
      passingRisk: TacticPassingRisk.Mixed,
      width: TacticWidth.Normal,
      attackingFocus: TacticAttackingFocus.Mixed,
      cornerStrategy: CornerStrategy.Standard,
      penaltyKillStyle: PenaltyKillStyle.Active,
    }
  )

  if (!game || !managedClub) return null

  const injuredInStarting = startingIds
    .map(id => squadPlayers.find(p => p.id === id))
    .filter((p): p is Player => !!p && (p.isInjured || p.suspensionGamesRemaining > 0))

  const canPlay = startingIds.length === 11 && injuredInStarting.length === 0

  const nextFixture = game.fixtures
    .filter(f =>
      (f.homeClubId === managedClubId || f.awayClubId === managedClubId) &&
      f.status === FixtureStatus.Scheduled
    )
    .sort((a, b) => a.roundNumber - b.roundNumber)[0] ?? null

  const rivalry = nextFixture ? getRivalry(nextFixture.homeClubId, nextFixture.awayClubId) : null

  const lastCompletedFixture = game.fixtures
    .filter(f =>
      (f.homeClubId === managedClubId || f.awayClubId === managedClubId) &&
      f.status === FixtureStatus.Completed
    )
    .sort((a, b) => b.roundNumber - a.roundNumber)[0] ?? null

  if (showReport && completedFixture) {
    return (
      <MatchReportView
        fixture={completedFixture}
        game={game}
        onClose={() => {
          setShowReport(false)
          setCompletedFixture(null)
        }}
      />
    )
  }

  function togglePlayer(playerId: string) {
    const player = squadPlayers.find(p => p.id === playerId)
    if (!player || player.isInjured || player.suspensionGamesRemaining > 0) return
    if (startingIds.includes(playerId)) {
      // Move to bench
      setStartingIds(prev => prev.filter(id => id !== playerId))
      setBenchIds(prev => [...prev, playerId])
    } else if (benchIds.includes(playerId)) {
      // Remove completely
      setBenchIds(prev => prev.filter(id => id !== playerId))
    } else {
      // Add to starting if < 11, else bench
      if (startingIds.length < 11) {
        setStartingIds(prev => [...prev, playerId])
      } else {
        setBenchIds(prev => [...prev, playerId])
      }
    }
  }

  function handleAutoFill() {
    const available = squadPlayers.filter(p => !p.isInjured && p.suspensionGamesRemaining <= 0)
    const sorted = [...available].sort((a, b) => b.currentAbility - a.currentAbility)
    const gkPool = sorted.filter(p => p.position === PlayerPosition.Goalkeeper)
    const outfieldPool = sorted.filter(p => p.position !== PlayerPosition.Goalkeeper)
    const starters: Player[] = gkPool.length > 0 ? [gkPool[0]] : []
    for (const p of outfieldPool) {
      if (starters.length >= 11) break
      starters.push(p)
    }
    for (const p of gkPool.slice(1)) {
      if (starters.length >= 11) break
      starters.push(p)
    }
    const starterIds = starters.map(p => p.id)
    const starterSet = new Set(starterIds)
    const bench = sorted.filter(p => !starterSet.has(p.id)).slice(0, 5)
    setStartingIds(starterIds)
    setBenchIds(bench.map(p => p.id))
    setCaptainId(starterIds[0])
    setLineupError(null)
  }

  function getPlayerStatus(playerId: string): 'start' | 'bench' | 'out' {
    if (startingIds.includes(playerId)) return 'start'
    if (benchIds.includes(playerId)) return 'bench'
    return 'out'
  }

  function handleTacticChange<K extends keyof Tactic>(key: K, value: Tactic[K]) {
    const newTactic = { ...tacticState, [key]: value }
    setTacticState(newTactic)
    updateTactic(newTactic)
  }

  function generateAiLineupForOpponent(): import('../../domain/entities/Fixture').TeamSelection {
    const opponentClubId = nextFixture
      ? (nextFixture.homeClubId === managedClubId ? nextFixture.awayClubId : nextFixture.homeClubId)
      : null
    const opponentClub = opponentClubId ? game!.clubs.find(c => c.id === opponentClubId) : null

    if (!opponentClub || !game) {
      return {
        startingPlayerIds: [],
        benchPlayerIds: [],
        tactic: tacticState,
      }
    }

    const available = game.players.filter(
      p =>
        opponentClub.squadPlayerIds.includes(p.id) &&
        !p.isInjured &&
        p.suspensionGamesRemaining <= 0
    )
    const sorted = [...available].sort((a, b) => b.currentAbility - a.currentAbility)
    const gkPool = sorted.filter(p => p.position === PlayerPosition.Goalkeeper)
    const outfieldPool = sorted.filter(p => p.position !== PlayerPosition.Goalkeeper)
    const starters: Player[] = []

    if (gkPool.length > 0) starters.push(gkPool[0])
    for (const p of outfieldPool) {
      if (starters.length >= 11) break
      starters.push(p)
    }
    if (starters.length < 11) {
      for (const p of gkPool.slice(1)) {
        if (starters.length >= 11) break
        starters.push(p)
      }
    }

    const starterIds = new Set(starters.map(p => p.id))
    const bench: Player[] = []
    for (const p of sorted) {
      if (bench.length >= 5) break
      if (!starterIds.has(p.id)) bench.push(p)
    }

    const captain = starters.reduce(
      (best, p) => (p.currentAbility > (best?.currentAbility ?? -1) ? p : best),
      starters[0]
    )

    return {
      startingPlayerIds: starters.map(p => p.id),
      benchPlayerIds: bench.map(p => p.id),
      captainPlayerId: captain?.id,
      tactic: opponentClub.activeTactic,
    }
  }

  function handlePlayMatch() {
    if (!canPlay) return
    setLineupError(null)

    const lineupResult = setPlayerLineup(startingIds, benchIds, captainId)
    if (!lineupResult.success) {
      setLineupError(lineupResult.error ?? 'Ogiltig uppställning')
      return
    }

    if (useLiveMode && nextFixture) {
      const homeClub = game!.clubs.find(c => c.id === nextFixture.homeClubId)
      const awayClub = game!.clubs.find(c => c.id === nextFixture.awayClubId)
      const isHome = nextFixture.homeClubId === managedClubId

      const myLineup: import('../../domain/entities/Fixture').TeamSelection = {
        startingPlayerIds: startingIds,
        benchPlayerIds: benchIds,
        captainPlayerId: captainId,
        tactic: tacticState,
      }
      const aiLineup = generateAiLineupForOpponent()

      const liveMatchWeather = game?.matchWeathers?.find(mw => mw.fixtureId === nextFixture.id)
      navigate('/game/match/live', {
        state: {
          fixture: nextFixture,
          homeLineup: isHome ? myLineup : aiLineup,
          awayLineup: isHome ? aiLineup : myLineup,
          homeClubName: homeClub?.name ?? '',
          awayClubName: awayClub?.name ?? '',
          isManaged: true,
          matchWeather: liveMatchWeather,
        },
      })
    } else {
      const result = advance()
      if (!result) return

      const justPlayed = result.game.fixtures.find(f =>
        (f.homeClubId === managedClubId || f.awayClubId === managedClubId) &&
        f.status === FixtureStatus.Completed &&
        f.roundNumber === (nextFixture?.roundNumber ?? -1)
      ) ?? null

      setCompletedFixture(justPlayed)
      setShowReport(true)
    }
  }

  const opponentId = nextFixture
    ? (nextFixture.homeClubId === managedClubId ? nextFixture.awayClubId : nextFixture.homeClubId)
    : null
  const opponent = opponentId ? game.clubs.find(c => c.id === opponentId) : null
  const isHome = nextFixture?.homeClubId === managedClubId

  // Grouped by position
  const groupedPlayers: { position: PlayerPosition; players: Player[] }[] = [
    PlayerPosition.Goalkeeper,
    PlayerPosition.Defender,
    PlayerPosition.Half,
    PlayerPosition.Midfielder,
    PlayerPosition.Forward,
  ].map(pos => ({
    position: pos,
    players: squadPlayers.filter(p => p.position === pos),
  })).filter(g => g.players.length > 0)

  if (!nextFixture) {
    return (
      <div style={{ padding: '20px 16px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Match</h2>
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '32px 20px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Säsongen är slut</p>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Inga fler matcher att spela den här säsongen.</p>
        </div>

        {lastCompletedFixture && (
          <div style={{ marginTop: 20 }}>
            <p style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: 'var(--text-muted)',
              marginBottom: 10,
            }}>
              Senaste match
            </p>
            <LastMatchCard fixture={lastCompletedFixture} game={game} managedClubId={managedClubId} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <div style={{ padding: '20px 16px 0' }}>
        {/* First-time hint — shown before any match has been completed */}
        {lastCompletedFixture === null && (
          <div style={{
            background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.25)',
            borderRadius: 'var(--radius)',
            padding: '12px 14px',
            fontSize: 13,
            color: 'var(--text-secondary)',
            marginBottom: 12,
          }}>
            💡 Klicka på spelarnas status-knapp (Ute → Start) för att välja 11 startspelare, sedan tryck Spela Match.
          </div>
        )}

        {/* Senaste match */}
        {lastCompletedFixture && (
          <div style={{ marginBottom: 16 }}>
            <p style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: 'var(--text-muted)',
              marginBottom: 8,
            }}>
              Senaste match
            </p>
            <LastMatchCard fixture={lastCompletedFixture} game={game} managedClubId={managedClubId} />
          </div>
        )}

        {/* Next match header */}
        {(() => {
          const isPlayoffRound = nextFixture.roundNumber > 22
          const playoffBracket = game?.playoffBracket
          const allSeries = playoffBracket ? [
            ...playoffBracket.quarterFinals,
            ...playoffBracket.semiFinals,
            ...(playoffBracket.final ? [playoffBracket.final] : []),
          ] : []
          const playoffSeries = allSeries.find(s => s.fixtures.includes(nextFixture.id)) ?? null
          const isSeriesHome = playoffSeries ? playoffSeries.homeClubId === managedClubId : false
          const myWins = playoffSeries ? (isSeriesHome ? playoffSeries.homeWins : playoffSeries.awayWins) : 0
          const theirWins = playoffSeries ? (isSeriesHome ? playoffSeries.awayWins : playoffSeries.homeWins) : 0

          return (
            <div style={{
              background: 'var(--bg-surface)',
              border: isPlayoffRound ? '1px solid rgba(201,168,76,0.3)' : rivalry ? '1px solid rgba(220,80,30,0.3)' : '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '14px 16px',
              marginBottom: 20,
            }}>
              <p style={{ fontSize: 11, color: isPlayoffRound ? '#C9A84C' : rivalry ? '#ff7040' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                {isPlayoffRound && playoffSeries
                  ? `${getPlayoffRoundLabel(playoffSeries.round)} · Serie ${myWins}–${theirWins} (bäst av 3)`
                  : rivalry
                  ? `🔥 ${rivalry.name} ${'🔥'.repeat(rivalry.intensity)}`
                  : `Omgång ${nextFixture.roundNumber}`
                }
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 17, fontWeight: 700 }}>vs {opponent?.name ?? 'Okänd'}</p>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: 99,
                  background: isHome ? 'var(--accent)' : 'var(--bg-elevated)',
                  border: '1px solid ' + (isHome ? 'var(--accent)' : 'var(--border)'),
                  color: isHome ? '#fff' : 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 600,
                }}>
                  {isHome ? 'Hemma' : 'Borta'}
                </span>
              </div>
            </div>
          )
        })()}

        {/* Weather card */}
        {nextFixture && (() => {
          const mw = game?.matchWeathers?.find(w => w.fixtureId === nextFixture.id)
          if (!mw) return null
          return (
            <div style={{
              background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
              padding: '10px 12px', marginBottom: 12,
              border: `1px solid ${mw.effects.cancelled ? 'var(--danger)' : 'var(--border)'}`,
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>Väder</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>{getWeatherEmoji(mw.weather.condition)}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {mw.weather.temperature > 0 ? '+' : ''}{mw.weather.temperature}° · {getConditionLabel(mw.weather.condition)}
                  </div>
                  <div style={{ fontSize: 12, color: mw.weather.iceQuality === 'poor' ? 'var(--danger)' : 'var(--text-secondary)' }}>
                    {getIceQualityLabel(mw.weather.iceQuality)}
                    {mw.effects.ballControlPenalty > 0 && ` · -${mw.effects.ballControlPenalty} bollkontroll`}
                    {mw.effects.speedModifier < 1 && ` · -${Math.round((1 - mw.effects.speedModifier) * 100)}% fart`}
                  </div>
                </div>
              </div>
              {mw.effects.cancelled && (
                <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6, fontWeight: 600 }}>
                  Matchen kan ställas in — dåliga isförhållanden
                </div>
              )}
            </div>
          )
        })()}

        {/* Live / Snabbsim toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => setUseLiveMode(true)}
            style={{
              flex: 1,
              padding: '10px',
              background: useLiveMode ? 'var(--accent)' : 'var(--bg-elevated)',
              border: '1px solid ' + (useLiveMode ? 'var(--accent)' : 'var(--border)'),
              borderRadius: 'var(--radius)',
              color: useLiveMode ? '#fff' : 'var(--text-secondary)',
              fontSize: 14,
              fontWeight: useLiveMode ? 600 : 400,
            }}
          >
            🎙 Live
          </button>
          <button
            onClick={() => setUseLiveMode(false)}
            style={{
              flex: 1,
              padding: '10px',
              background: !useLiveMode ? 'var(--accent)' : 'var(--bg-elevated)',
              border: '1px solid ' + (!useLiveMode ? 'var(--accent)' : 'var(--border)'),
              borderRadius: 'var(--radius)',
              color: !useLiveMode ? '#fff' : 'var(--text-secondary)',
              fontSize: 14,
              fontWeight: !useLiveMode ? 600 : 400,
            }}
          >
            ⏩ Snabbsim
          </button>
        </div>

        {/* Lineup counter + auto-fill */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p style={{ fontSize: 14, fontWeight: 600 }}>Laguppställning</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handleAutoFill}
              style={{
                padding: '4px 10px',
                borderRadius: 99,
                background: 'rgba(201,168,76,0.12)',
                border: '1px solid rgba(201,168,76,0.4)',
                color: 'var(--accent)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Bästa elvan
            </button>
            <span style={{
              fontSize: 13,
              color: startingIds.length === 11 ? 'var(--success)' : 'var(--warning)',
              fontWeight: 600,
            }}>
              {startingIds.length}/11 startande
            </span>
          </div>
        </div>
      </div>

      {/* Player list */}
      <div style={{ flex: 1, padding: '0 0 0 0' }}>
        {groupedPlayers.map(group => (
          <div key={group.position}>
            <div style={{
              padding: '6px 16px',
              background: 'var(--bg)',
              borderTop: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>
                {positionShort(group.position)}
              </span>
            </div>
            {group.players.map(player => {
              const status = getPlayerStatus(player.id)
              const isCaptain = player.id === captainId
              const unavailable = player.isInjured || player.suspensionGamesRemaining > 0
              return (
                <div
                  key={player.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--border)',
                    gap: 10,
                    background: unavailable ? 'rgba(239,68,68,0.04)' : 'transparent',
                    opacity: unavailable ? 0.55 : 1,
                  }}
                >
                  {/* Captain toggle */}
                  <button
                    onClick={() => setCaptainId(player.id)}
                    disabled={unavailable}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: 14,
                      opacity: isCaptain ? 1 : 0.2,
                      cursor: unavailable ? 'not-allowed' : 'pointer',
                      flexShrink: 0,
                      padding: 0,
                    }}
                    title="Kapten"
                  >
                    👑
                  </button>

                  {/* Player info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {player.firstName} {player.lastName}
                      {player.isInjured && <span style={{ marginLeft: 4, fontSize: 12 }}>🩹</span>}
                      {player.suspensionGamesRemaining > 0 && <span style={{ marginLeft: 4, fontSize: 12 }}>🚫</span>}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>
                      CA {player.currentAbility} · Form {player.form}
                    </p>
                  </div>

                  {/* Status toggle */}
                  <button
                    onClick={() => togglePlayer(player.id)}
                    disabled={unavailable}
                    style={{
                      flexShrink: 0,
                      padding: '4px 10px',
                      borderRadius: 99,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: unavailable ? 'not-allowed' : 'pointer',
                      ...(unavailable
                        ? { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)' }
                        : status === 'start'
                        ? { background: 'rgba(201,168,76,0.15)', border: '1px solid var(--accent)', color: 'var(--accent)' }
                        : status === 'bench'
                        ? { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }
                        : { background: 'transparent', border: '1px solid transparent', color: 'var(--text-muted)' }
                      ),
                    }}
                  >
                    {unavailable
                      ? (player.isInjured ? 'Skadad' : 'Avstängd')
                      : status === 'start' ? 'Start' : status === 'bench' ? 'Bänk' : 'Ute'}
                  </button>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Tactic section (collapsible) */}
      <div style={{ padding: '0 16px', marginTop: 4 }}>
        <button
          onClick={() => setTacticOpen(prev => !prev)}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 14px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: tacticOpen ? '10px 10px 0 0' : 'var(--radius)',
            color: 'var(--text-primary)',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <span>Taktik</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{tacticOpen ? '▲' : '▼'}</span>
        </button>

        {tacticOpen && (
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderTop: 'none',
            borderRadius: '0 0 10px 10px',
            padding: '14px',
            marginBottom: 4,
          }}>
            {[
              {
                label: 'Mentalitet',
                key: 'mentality' as keyof Tactic,
                options: [
                  { label: 'Defensiv', value: TacticMentality.Defensive },
                  { label: 'Balanserad', value: TacticMentality.Balanced },
                  { label: 'Offensiv', value: TacticMentality.Offensive },
                ],
              },
              {
                label: 'Tempo',
                key: 'tempo' as keyof Tactic,
                options: [
                  { label: 'Lågt', value: TacticTempo.Low },
                  { label: 'Normalt', value: TacticTempo.Normal },
                  { label: 'Högt', value: TacticTempo.High },
                ],
              },
              {
                label: 'Press',
                key: 'press' as keyof Tactic,
                options: [
                  { label: 'Låg', value: TacticPress.Low },
                  { label: 'Medium', value: TacticPress.Medium },
                  { label: 'Hög', value: TacticPress.High },
                ],
              },
              {
                label: 'Passning',
                key: 'passingRisk' as keyof Tactic,
                options: [
                  { label: 'Säker', value: TacticPassingRisk.Safe },
                  { label: 'Blandat', value: TacticPassingRisk.Mixed },
                  { label: 'Direkt', value: TacticPassingRisk.Direct },
                ],
              },
              {
                label: 'Bredd',
                key: 'width' as keyof Tactic,
                options: [
                  { label: 'Smal', value: TacticWidth.Narrow },
                  { label: 'Normal', value: TacticWidth.Normal },
                  { label: 'Bred', value: TacticWidth.Wide },
                ],
              },
              {
                label: 'Anfallsfokus',
                key: 'attackingFocus' as keyof Tactic,
                options: [
                  { label: 'Centralt', value: TacticAttackingFocus.Central },
                  { label: 'Kanter', value: TacticAttackingFocus.Wings },
                  { label: 'Blandat', value: TacticAttackingFocus.Mixed },
                ],
              },
              {
                label: 'Hörnstrategi',
                key: 'cornerStrategy' as keyof Tactic,
                options: [
                  { label: 'Säker', value: CornerStrategy.Safe },
                  { label: 'Standard', value: CornerStrategy.Standard },
                  { label: 'Aggressiv', value: CornerStrategy.Aggressive },
                ],
              },
              {
                label: 'Utvisningsspel',
                key: 'penaltyKillStyle' as keyof Tactic,
                options: [
                  { label: 'Passivt', value: PenaltyKillStyle.Passive },
                  { label: 'Aktivt', value: PenaltyKillStyle.Active },
                  { label: 'Aggressivt', value: PenaltyKillStyle.Aggressive },
                ],
              },
            ].map(({ label, key, options }) => (
              <div key={key as string} style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</p>
                <SegmentedControl
                  options={options}
                  value={tacticState[key] as string}
                  onChange={v => handleTacticChange(key, v as Tactic[typeof key])}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Play button */}
      <div style={{ padding: '16px 16px 24px' }}>
        {(!canPlay || lineupError) && (
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 12px',
            fontSize: 12,
            color: 'var(--danger)',
            marginBottom: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}>
            {startingIds.length !== 11 && (
              <span>Välj exakt 11 startspelare (du har {startingIds.length})</span>
            )}
            {injuredInStarting.map(p => (
              <span key={p.id}>
                ⚠️ {p.firstName} {p.lastName} {p.isInjured ? 'är skadad' : `är avstängd (${p.suspensionGamesRemaining} matcher kvar)`}
              </span>
            ))}
            {lineupError && <span>{lineupError}</span>}
          </div>
        )}
        <button
          onClick={handlePlayMatch}
          disabled={!canPlay}
          style={{
            width: '100%',
            padding: '15px',
            background: canPlay ? 'var(--accent)' : 'var(--bg-elevated)',
            border: '1px solid ' + (canPlay ? 'var(--accent)' : 'var(--border)'),
            borderRadius: 'var(--radius)',
            color: canPlay ? '#fff' : 'var(--text-muted)',
            fontSize: 16,
            fontWeight: 600,
            cursor: canPlay ? 'pointer' : 'not-allowed',
          }}
        >
          Spela match →
        </button>
      </div>
    </div>
  )
}

// ── Last Match Card ────────────────────────────────────────────────────
interface LastMatchCardProps {
  fixture: Fixture
  game: SaveGame
  managedClubId: string
}

function LastMatchCard({ fixture, game, managedClubId }: LastMatchCardProps) {
  const homeClub = game.clubs.find(c => c.id === fixture.homeClubId)
  const awayClub = game.clubs.find(c => c.id === fixture.awayClubId)
  const isHome = fixture.homeClubId === managedClubId
  const myScore = isHome ? fixture.homeScore : fixture.awayScore
  const theirScore = isHome ? fixture.awayScore : fixture.homeScore
  const resultColor = myScore > theirScore ? 'var(--success)' : myScore < theirScore ? 'var(--danger)' : 'var(--warning)'
  const resultLabel = myScore > theirScore ? 'V' : myScore < theirScore ? 'F' : 'O'

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '12px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <div style={{
        width: 28,
        height: 28,
        borderRadius: 'var(--radius-sm)',
        background: resultColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: 12,
        fontWeight: 800,
        color: '#000',
      }}>
        {resultLabel}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 600 }}>
          {homeClub?.shortName ?? homeClub?.name} {fixture.homeScore}–{fixture.awayScore} {awayClub?.shortName ?? awayClub?.name}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Omgång {fixture.roundNumber}</p>
      </div>
    </div>
  )
}
