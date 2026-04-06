import type { Fixture, MatchEvent } from '../../../domain/entities/Fixture'
import type { Player } from '../../../domain/entities/Player'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { MatchEventType, PlayoffRound } from '../../../domain/enums'
import { positionShort, eventIcon } from '../../utils/formatters'
import { PlayerLink } from '../PlayerLink'

function getPlayoffRoundLabel(round: PlayoffRound): string {
  if (round === PlayoffRound.QuarterFinal) return 'KVARTSFINAL'
  if (round === PlayoffRound.SemiFinal) return 'SEMIFINAL'
  return 'SM-FINAL'
}

function ratingColor(r: number): string {
  if (r < 6) return 'var(--danger)'
  if (r < 7) return 'var(--warning)'
  return 'var(--success)'
}

interface MatchReportViewProps {
  fixture: Fixture
  game: SaveGame
  onClose: () => void
}

export function MatchReportView({ fixture, game, onClose }: MatchReportViewProps) {
  const homeClub = game.clubs.find(c => c.id === fixture.homeClubId)
  const awayClub = game.clubs.find(c => c.id === fixture.awayClubId)
  const managedIsHome = fixture.homeClubId === game.managedClubId
  const managedCornerGoals = fixture.events.filter(
    e => e.isCornerGoal && e.clubId === game.managedClubId
  ).length
  const managedCorners = managedIsHome ? (fixture.report?.cornersHome ?? 0) : (fixture.report?.cornersAway ?? 0)
  const oppCorners = managedIsHome ? (fixture.report?.cornersAway ?? 0) : (fixture.report?.cornersHome ?? 0)

  const visibleEvents = fixture.events.filter(e =>
    e.type === MatchEventType.Goal ||
    e.type === MatchEventType.YellowCard ||
    e.type === MatchEventType.RedCard
  ).sort((a, b) => a.minute - b.minute)

  const playerRatings = fixture.report?.playerRatings ?? {}

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
    if (event.type === MatchEventType.Goal) return `${name} 🏒`
    if (event.type === MatchEventType.YellowCard) return `${name} ⚠️ Varning`
    if (event.type === MatchEventType.RedCard) return `${name} 🚫 Utvisning 10 min`
    return event.description
  }

  return (
    <div style={{ padding: '20px 16px', overflowY: 'auto', height: '100%', animation: 'fadeInUp 300ms ease-out both' }}>
      <p style={{
        fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px',
        color: 'var(--accent)', marginBottom: 16, textAlign: 'center',
      }}>
        MATCHSAMMANFATTNING
      </p>

      {/* Arena + attendance */}
      {fixture.attendance && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 10 }}>
          {homeClub?.arenaName ?? `${homeClub?.shortName ?? '?'}s IP`} · {fixture.attendance} åskådare
        </p>
      )}

      {/* Score banner */}
      <div className="card-sharp" style={{ padding: '20px 16px', marginBottom: 10, textAlign: 'center' }}>
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
        {fixture.wentToPenalties && fixture.penaltyResult && (
          <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginTop: 2 }}>
            efter straffar ({fixture.penaltyResult.home}-{fixture.penaltyResult.away})
          </p>
        )}
        {fixture.wentToOvertime && !fixture.wentToPenalties && (
          <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginTop: 2 }}>
            efter förlängning
          </p>
        )}
        {fixture.roundNumber > 22 ? (() => {
          const bracket = game.playoffBracket
          const allSeries = bracket ? [
            ...bracket.quarterFinals,
            ...bracket.semiFinals,
            ...(bracket.final ? [bracket.final] : []),
          ] : []
          const series = allSeries.find(s => s.fixtures.includes(fixture.id))
          return (
            <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>
              {series ? getPlayoffRoundLabel(series.round) : 'SLUTSPEL'}
            </p>
          )
        })() : (
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Omgång {fixture.roundNumber}</p>
        )}
      </div>

      {/* Events timeline */}
      {visibleEvents.length > 0 && (
        <div className="card-sharp" style={{ overflow: 'hidden', marginBottom: 10 }}>
          <p style={{
            fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2.5px',
            color: 'var(--text-muted)', padding: '12px 14px 8px',
          }}>
            ⚡ Händelser
          </p>
          {visibleEvents.map((event, index) => {
            const isHome = event.clubId === fixture.homeClubId
            return (
              <div
                key={index}
                style={{
                  display: 'flex', alignItems: 'center', padding: '8px 14px',
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
                <span style={{
                  fontSize: 13, flex: 1, textAlign: isHome ? 'left' : 'right',
                  color: event.isCornerGoal ? 'var(--accent)' : undefined,
                  fontWeight: event.isCornerGoal ? 600 : undefined,
                }}>
                  {event.isCornerGoal ? '📐 ' : ''}
                  {event.playerId
                    ? <PlayerLink playerId={event.playerId} name={getPlayerName(event.playerId)} style={{ color: event.isCornerGoal ? 'var(--accent)' : undefined }} />
                    : getEventText(event)
                  }
                  {event.playerId && event.type === MatchEventType.Goal && ' 🏒'}
                  {event.playerId && event.type === MatchEventType.YellowCard && ' ⚠️ Varning'}
                  {event.playerId && event.type === MatchEventType.RedCard && ' 🚫 Utvisning 10 min'}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Match stats */}
      {fixture.report && (
        <div className="card-sharp" style={{ padding: '14px', marginBottom: 10 }}>
          <p style={{
            fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2.5px',
            color: 'var(--text-muted)', marginBottom: 12,
          }}>
            📊 Statistik
          </p>
          {[
            { label: 'Hörnor', home: String(fixture.report.cornersHome), away: String(fixture.report.cornersAway) },
            { label: 'Skott', home: String(fixture.report.shotsHome), away: String(fixture.report.shotsAway) },
            { label: 'Bollinnehav', home: fixture.report.possessionHome + '%', away: fixture.report.possessionAway + '%' },
          ].map(({ label, home, away }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, minWidth: 30 }}>{home}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1, textAlign: 'center' }}>{label}</span>
              <span style={{ fontSize: 14, fontWeight: 600, minWidth: 30, textAlign: 'right' }}>{away}</span>
            </div>
          ))}
        </div>
      )}

      {/* Corner goals highlight */}
      {managedCornerGoals > 0 && (
        <div style={{
          background: 'rgba(196,122,58,0.08)', border: '1px solid rgba(196,122,58,0.3)',
          borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>📐</span>
          <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
            {managedCornerGoals} hörnmål — {managedCorners}–{oppCorners} hörnor totalt
          </span>
        </div>
      )}

      {/* Player ratings */}
      {ratedPlayers.length > 0 && (
        <div className="card-sharp" style={{ overflow: 'hidden', marginBottom: 16 }}>
          <p style={{
            fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2.5px',
            color: 'var(--text-muted)', padding: '12px 14px 8px',
          }}>
            ⭐ Spelarbetyg
          </p>
          {(() => {
            const potmId = fixture.report?.playerOfTheMatchId
            const potm = potmId ? ratedPlayers.find(r => r.player.id === potmId) : ratedPlayers[0]
            if (!potm) return null
            return (
              <div style={{
                display: 'flex', alignItems: 'center', padding: '12px 14px',
                background: 'linear-gradient(135deg, rgba(196,122,58,0.18) 0%, rgba(196,122,58,0.06) 100%)',
                borderBottom: '1px solid rgba(196,122,58,0.3)', gap: 10,
              }}>
                <span style={{ fontSize: 20 }}>⭐</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent)', marginBottom: 2 }}>
                    Matchens spelare
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>
                    {potm.player.firstName} {potm.player.lastName}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>
                    {positionShort(potm.player.position)}
                  </span>
                </div>
                <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>
                  {potm.rating.toFixed(1)}
                </span>
              </div>
            )
          })()}
          {ratedPlayers.map(({ player, rating, isHome }) => (
            <div key={player.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderTop: '1px solid var(--border)', gap: 8 }}>
              <span style={{
                fontSize: 10, color: 'var(--text-muted)', minWidth: 20, textAlign: 'right',
              }}>
                #{player.shirtNumber ?? '?'}
              </span>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: isHome ? 'var(--accent)' : 'var(--ice)', flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{player.lastName}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>
                  {positionShort(player.position)}
                </span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: ratingColor(rating), fontFamily: 'var(--font-display)' }}>
                {rating.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Statistics */}
      {fixture.report && (
        <div className="card-sharp" style={{ padding: '14px 16px', marginBottom: 10 }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
            STATISTIK
          </p>
          {[
            { label: 'Skott', home: fixture.report.shotsHome, away: fixture.report.shotsAway },
            { label: 'Hörnor', home: fixture.report.cornersHome, away: fixture.report.cornersAway },
            ...(fixture.attendance ? [{ label: 'Publik', home: fixture.attendance, away: null as number | null }] : []),
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', padding: '4px 0' }}>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 600, textAlign: 'right' }}>{row.home}</span>
              <span style={{ width: 80, textAlign: 'center', fontSize: 10, color: 'var(--text-muted)' }}>{row.label}</span>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 600, textAlign: 'left' }}>{row.away ?? ''}</span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onClose}
        style={{
          width: '100%', padding: '14px', background: 'var(--accent)',
          border: '1px solid var(--accent)', borderRadius: 'var(--radius)',
          color: 'var(--text-light)', fontSize: 15, fontWeight: 600, marginBottom: 20, cursor: 'pointer',
        }}
      >
        Fortsätt →
      </button>
    </div>
  )
}
