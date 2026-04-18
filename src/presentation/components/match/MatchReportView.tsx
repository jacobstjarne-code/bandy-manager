import type React from 'react'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { Player } from '../../../domain/entities/Player'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { MatchEventType, PlayoffRound } from '../../../domain/enums'
import { positionShort, eventIcon } from '../../utils/formatters'
import { formatArenaName } from '../../../domain/utils/arenaName'
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

const LABEL: React.CSSProperties = {
  fontSize: 8, fontWeight: 600, letterSpacing: '2px',
  textTransform: 'uppercase', color: 'var(--text-muted)',
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

  function generateMatchStory(): string {
    const managedClub = game.clubs.find(c => c.id === game.managedClubId)
    const oppClub = game.clubs.find(c => c.id !== game.managedClubId && (c.id === fixture.homeClubId || c.id === fixture.awayClubId))
    const myScore = managedIsHome ? fixture.homeScore : fixture.awayScore
    const theirScore = managedIsHome ? fixture.awayScore : fixture.homeScore

    const myGoalEvents = fixture.events.filter(e => e.type === MatchEventType.Goal && e.clubId === game.managedClubId)
    const cornerGoals = myGoalEvents.filter(e => e.isCornerGoal).length

    // Find top scorer for managed club
    const scorerCounts: Record<string, number> = {}
    for (const e of myGoalEvents) {
      if (e.playerId) scorerCounts[e.playerId] = (scorerCounts[e.playerId] ?? 0) + 1
    }
    const topScorerId = Object.entries(scorerCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
    const topScorerGoals = topScorerId ? scorerCounts[topScorerId] : 0
    const topScorerName = topScorerId ? getPlayerName(topScorerId).split(' ').pop() : ''

    // Detect comeback: check if we were trailing at some point during goals
    let myRunning = 0, theirRunning = 0, wasTrailing = false
    for (const e of fixture.events.filter(ev => ev.type === MatchEventType.Goal).sort((a, b) => a.minute - b.minute)) {
      if (e.clubId === game.managedClubId) myRunning++
      else theirRunning++
      if (myRunning < theirRunning) wasTrailing = true
    }

    const sentences: string[] = []

    // Opening sentence
    if (myScore > theirScore) {
      if (wasTrailing) {
        sentences.push(`Seger efter vändning — ni låg under men tog tre poäng till slut.`)
      } else if (myScore - theirScore >= 4) {
        sentences.push(`Övertygande seger mot ${oppClub?.shortName ?? 'motståndet'}.`)
      } else {
        sentences.push(`${myScore}–${theirScore} till slut mot ${oppClub?.shortName ?? 'motståndet'}.`)
      }
    } else if (myScore === theirScore) {
      sentences.push(`Oavgjort — ni delade poängen med ${oppClub?.shortName ?? 'motståndet'}.`)
    } else {
      sentences.push(`Förlust mot ${oppClub?.shortName ?? 'motståndet'} — ${myScore}–${theirScore}.`)
    }

    // Top scorer sentence
    if (topScorerName && topScorerGoals >= 2) {
      sentences.push(`${topScorerName} stod för ${topScorerGoals} mål.`)
    } else if (topScorerName && topScorerGoals === 1 && myGoalEvents.length >= 1) {
      sentences.push(`Bland annat ${topScorerName} på skytteligget.`)
    }

    // Corner goals
    if (cornerGoals >= 2) {
      sentences.push(`${cornerGoals} av målen kom från hörnor — fasta situationer avgjorde.`)
    } else if (cornerGoals === 1) {
      sentences.push(`Ett hörnmål bidrog till resultatet.`)
    }

    // Attendance
    if (fixture.attendance && managedIsHome && managedClub) {
      sentences.push(`${fixture.attendance} på ${formatArenaName(managedClub.arenaName ?? managedClub.name + 's IP')}.`)
    }

    return sentences.join(' ')
  }

  return (
    <div style={{ padding: '12px 12px', overflowY: 'auto', height: '100%', animation: 'fadeInUp 300ms ease-out both' }}>
      <p style={{
        fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px',
        color: 'var(--accent)', marginBottom: 12, textAlign: 'center',
      }}>
        MATCHSAMMANFATTNING
      </p>

      {/* Arena + attendance */}
      {fixture.attendance && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 8 }}>
          {formatArenaName(homeClub?.arenaName ?? `${homeClub?.shortName ?? '?'}s IP`)} · {fixture.attendance} åskådare
        </p>
      )}

      {/* Score banner */}
      <div className="card-sharp" style={{ padding: '10px 14px', marginBottom: 8, textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1, textAlign: 'left' }}>
            {homeClub?.shortName ?? homeClub?.name}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 0 }}>
            <span style={{ fontSize: 36, fontWeight: 800, lineHeight: 1 }}>{fixture.homeScore}</span>
            <span style={{ fontSize: 20, color: 'var(--text-muted)', fontWeight: 300 }}>—</span>
            <span style={{ fontSize: 36, fontWeight: 800, lineHeight: 1 }}>{fixture.awayScore}</span>
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

      {/* MATCHENS BERÄTTELSE */}
      <div className="card-sharp" style={{
        padding: '10px 14px', marginBottom: 8,
        border: '1px solid rgba(196,122,58,0.25)',
        background: 'rgba(196,122,58,0.03)',
      }}>
        <p style={{ ...LABEL, color: 'var(--accent)', marginBottom: 4 }}>
          📰 MATCHENS BERÄTTELSE
        </p>
        <p style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--text-secondary)', margin: 0 }}>
          {generateMatchStory()}
        </p>
      </div>

      {/* Events timeline */}
      {visibleEvents.length > 0 && (
        <div className="card-sharp" style={{ overflow: 'hidden', marginBottom: 8 }}>
          <p style={{ ...LABEL, padding: '10px 14px 6px' }}>
            ⚡ HÄNDELSER
          </p>
          {visibleEvents.map((event, index) => {
            const isHome = event.clubId === fixture.homeClubId
            const clubShort = isHome ? (homeClub?.shortName ?? 'H') : (awayClub?.shortName ?? 'B')
            return (
              <div
                key={index}
                style={{
                  display: 'flex', alignItems: 'center', padding: '6px 14px',
                  borderTop: '1px solid var(--border)',
                }}
              >
                <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 30, flexShrink: 0 }}>
                  {event.minute}'
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 28, flexShrink: 0 }}>
                  {clubShort}
                </span>
                <span style={{ fontSize: 16, margin: '0 6px', flexShrink: 0 }}>
                  {eventIcon(event.type)}
                </span>
                <span style={{
                  fontSize: 13, flex: 1,
                  color: event.isCornerGoal ? 'var(--accent)' : undefined,
                  fontWeight: event.isCornerGoal ? 600 : undefined,
                }}>
                  {event.isCornerGoal ? '📐 ' : ''}
                  {event.playerId
                    ? <PlayerLink playerId={event.playerId} name={getPlayerName(event.playerId)} style={{ color: event.isCornerGoal ? 'var(--accent)' : undefined }} />
                    : (() => {
                        const name = getPlayerName(event.playerId)
                        if (event.type === MatchEventType.Goal) return `${name} 🏒`
                        if (event.type === MatchEventType.YellowCard) return `${name} ⚠️ Varning`
                        if (event.type === MatchEventType.RedCard) return `${name} 🚫 Utvisning 10 min`
                        return event.description
                      })()
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

      {/* Match stats — hemma | label | borta */}
      {fixture.report && (
        <div className="card-sharp" style={{ padding: '10px 14px', marginBottom: 8 }}>
          <p style={{ ...LABEL, marginBottom: 8 }}>📊 STATISTIK</p>
          {/* Column headers */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ flex: 1, fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>
              {homeClub?.shortName ?? 'Hemma'}
            </span>
            <span style={{ width: 80, textAlign: 'center' }} />
            <span style={{ flex: 1, fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left' }}>
              {awayClub?.shortName ?? 'Borta'}
            </span>
          </div>
          {[
            { label: 'Skott', home: String(fixture.report.shotsHome), away: String(fixture.report.shotsAway) },
            { label: 'Hörnor', home: String(fixture.report.cornersHome), away: String(fixture.report.cornersAway) },
            { label: 'Bollinnehav', home: fixture.report.possessionHome + '%', away: fixture.report.possessionAway + '%' },
          ].map(({ label, home, away }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', padding: '4px 0' }}>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, textAlign: 'right', fontFamily: 'var(--font-display)' }}>{home}</span>
              <span style={{ width: 80, textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, textAlign: 'left', fontFamily: 'var(--font-display)' }}>{away}</span>
            </div>
          ))}
        </div>
      )}

      {/* Corner goals highlight */}
      {managedCornerGoals > 0 && (
        <div className="card-sharp" style={{
          background: 'rgba(196,122,58,0.08)', border: '1px solid rgba(196,122,58,0.3)',
          padding: '10px 14px', marginBottom: 8,
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
        <div className="card-sharp" style={{ overflow: 'hidden', marginBottom: 8 }}>
          <p style={{ ...LABEL, padding: '10px 14px 6px' }}>⭐ SPELARBETYG</p>
          {/* POTM highlight */}
          {(() => {
            const potmId = fixture.report?.playerOfTheMatchId
            const potm = potmId ? ratedPlayers.find(r => r.player.id === potmId) : ratedPlayers[0]
            if (!potm) return null
            return (
              <div style={{
                display: 'flex', alignItems: 'center', padding: '8px 14px',
                background: 'linear-gradient(135deg, rgba(196,122,58,0.18) 0%, rgba(196,122,58,0.06) 100%)',
                borderBottom: '1px solid rgba(196,122,58,0.3)', gap: 8,
              }}>
                <span style={{ fontSize: 18 }}>⭐</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent)', marginBottom: 1 }}>
                    Matchens spelare
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>
                    {potm.player.firstName} {potm.player.lastName}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>
                    {positionShort(potm.player.position)}
                  </span>
                </div>
                <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>
                  {potm.rating.toFixed(1)}
                </span>
              </div>
            )
          })()}
          {/* Player rows with position color dot + rating bar */}
          {ratedPlayers.map(({ player, rating, isHome }) => {
            const barWidth = Math.max(0, Math.min(100, ((rating - 4) / 6) * 100))
            return (
              <div key={player.id} style={{
                display: 'flex', alignItems: 'center', padding: '5px 14px',
                borderTop: '1px solid var(--border)', gap: 6,
              }}>
                {/* Shirt number */}
                <span style={{
                  fontSize: 10, color: 'var(--text-muted)', minWidth: 18, textAlign: 'right', flexShrink: 0,
                }}>
                  #{player.shirtNumber ?? '?'}
                </span>
                {/* Name + position */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {player.lastName}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
                    {positionShort(player.position)}
                  </span>
                  {/* Home/away indicator */}
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', flexShrink: 0 }}>
                    {isHome ? '(H)' : '(B)'}
                  </span>
                </div>
                {/* Rating bar */}
                <div style={{
                  width: 40, height: 4, borderRadius: 2,
                  background: 'var(--border-dark)', flexShrink: 0, overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${barWidth}%`, height: '100%',
                    background: ratingColor(rating), borderRadius: 2,
                  }} />
                </div>
                {/* Rating number */}
                <span style={{
                  fontSize: 13, fontWeight: 700, color: ratingColor(rating),
                  fontFamily: 'var(--font-display)', minWidth: 26, textAlign: 'right', flexShrink: 0,
                }}>
                  {rating.toFixed(1)}
                </span>
              </div>
            )
          })}
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
