import { useNavigate } from 'react-router-dom'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { Player } from '../../../domain/entities/Player'
import { MatchEventType } from '../../../domain/enums'
import { SectionLabel } from '../../components/SectionLabel'
import { generateCoachQuote } from '../../../domain/services/assistantCoachService'
import { getNextManagedFixture } from '../../../domain/services/portal/triggers/matchTriggers'

interface GranskaAnalysProps {
  game: SaveGame
  fixture: Fixture | undefined
  isHome: boolean
  won: boolean
  lost: boolean
  myScore: number
  theirScore: number
  potm: Player | null
}

/**
 * @cites fixture.report.shotsHome, fixture.report.shotsAway, myScore, theirScore, potm, fixture.report.playerRatings
 */
export function GranskaAnalys({ game, fixture, isHome, won, lost, myScore, theirScore, potm }: GranskaAnalysProps) {
  const navigate = useNavigate()
  const coach = game.assistantCoach

  const nextFixture = getNextManagedFixture(game)
  const nextOpponent = nextFixture
    ? game.clubs.find(c => c.id !== game.managedClubId &&
        (c.id === nextFixture.homeClubId || c.id === nextFixture.awayClubId))
    : null
  const nextOpponentName = nextOpponent?.shortName ?? nextOpponent?.name ?? null
  const coachItem = game.inbox
    .filter(i => i.tone === 'coach')
    .sort((a, b) => b.date.localeCompare(a.date))[0]

  // HÄNDELSETIDSLINJE — flyttad från forlop (full event-för-event-vy)
  const allEvents = fixture?.events
    .filter(e => e.type === MatchEventType.Goal || e.type === MatchEventType.Suspension || e.type === MatchEventType.Corner || e.type === MatchEventType.Penalty)
    .sort((a, b) => a.minute - b.minute) ?? []

  return (
    <>
      {coach && (() => {
        const quote = coachItem?.body ?? (coach ? generateCoachQuote(coach, {
          type: 'match-result',
          result: won ? 'win' : lost ? 'loss' : 'draw',
          score: `${myScore}–${theirScore}`,
        }) : null)
        if (!quote) return null
        return (
          <div className="card-sharp" style={{ margin: '0 0 6px', overflow: 'hidden' }}>
            <div style={{ background: 'var(--accent)', height: 22, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--accent-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="h-micro" style={{ fontWeight: 700, color: 'var(--text-light)' }}>{coach.initials}</span>
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', color: 'var(--text-light)' }}>{coach.name.toUpperCase()} · ASSISTENTTRÄNARE</span>
            </div>
            <div style={{ padding: '12px 14px' }}>
              <p style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                "{quote}"
              </p>
            </div>
          </div>
        )
      })()}

      {/* Händelsetidslinje — full event-för-event-vy (flyttad från forlop) */}
      {allEvents.length > 0 && (
        <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px' }}>
          <SectionLabel style={{ marginBottom: 8 }}>HÄNDELSETIDSLINJE</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {allEvents.map((e, i) => {
              const isHomeEvent = e.clubId === fixture?.homeClubId
              const isManagedEvent = isHome ? isHomeEvent : !isHomeEvent
              const icon = e.type === MatchEventType.Goal ? (e.isCornerGoal ? '📐' : '🥅')
                : e.type === MatchEventType.Corner ? '🔄'
                : e.type === MatchEventType.Penalty ? '🎯'
                : '🚫' // Suspension (bandy-utvisning, inte rött kort — emojiConsistency.ts)
              const p = e.playerId ? game.players.find(pl => pl.id === e.playerId) : null
              const name = p ? `${p.firstName[0]}. ${p.lastName}` : (e.description ?? '')
              const textColor = isManagedEvent ? 'var(--text-primary)' : 'var(--text-muted)'
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '2px 0', borderBottom: i < allEvents.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {isHomeEvent && (
                      <>
                        <span className="h-micro" style={{ color: 'var(--text-muted)', flexShrink: 0, minWidth: 18 }}>{e.minute}'</span>
                        <span style={{ fontSize: 11 }}>{icon}</span>
                        <span style={{ fontSize: 11, color: textColor }}>{name}</span>
                      </>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                    {!isHomeEvent && (
                      <>
                        <span style={{ fontSize: 11, color: textColor }}>{name}</span>
                        <span style={{ fontSize: 11 }}>{icon}</span>
                        <span className="h-micro" style={{ color: 'var(--text-muted)', flexShrink: 0, minWidth: 18, textAlign: 'right' }}>{e.minute}'</span>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Form players */}
      {fixture?.report && (() => {
        const ratings = fixture.report.playerRatings
        const managedLineup = isHome ? fixture.homeLineup : fixture.awayLineup
        const starterIds = managedLineup?.startingPlayerIds ?? []
        const best = starterIds
          .map(id => ({ id, r: ratings[id] ?? 0 }))
          .sort((a, b) => b.r - a.r)
          .slice(0, 3)
        const worst = starterIds
          .map(id => ({ id, r: ratings[id] ?? 0 }))
          .sort((a, b) => a.r - b.r)
          .slice(0, 1)

        return (
          <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px' }}>
            <SectionLabel style={{ marginBottom: 8 }}>FORMSPELARE</SectionLabel>
            {best.map(({ id, r }) => {
              const p = game.players.find(pl => pl.id === id)
              if (!p) return null
              return (
                <div key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.firstName[0]}. {p.lastName}</span>
                  <span className="h-num-sm" style={{ color: r >= 7 ? 'var(--success)' : 'var(--text-primary)' }}>{r.toFixed(1)}</span>
                </div>
              )
            })}
            {worst.map(({ id, r }) => {
              const p = game.players.find(pl => pl.id === id)
              if (!p || r >= 5.5) return null
              return (
                <div key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Svagaste länken: {p.firstName[0]}. {p.lastName}</span>
                  <span className="h-num-sm" style={{ color: 'var(--danger)' }}>{r.toFixed(1)}</span>
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* Key insights */}
      {fixture?.report && (() => {
        const insights: string[] = []
        const shots = isHome ? fixture.report.shotsHome : fixture.report.shotsAway
        const goals = myScore
        const conversion = shots > 0 ? goals / shots : 0
        if (conversion > 0.5) insights.push(`Effektivt anfallsspel — ${Math.round(conversion * 100)}% målkonvertering.`)
        else if (shots > 0 && conversion < 0.15) insights.push(`Ineffektivt framåt — ${shots} skott gav bara ${goals} mål.`)
        const myCorners = isHome ? fixture.report.cornersHome : fixture.report.cornersAway
        if (myCorners >= 8) insights.push(`Kontinuerligt hörnstryck — ${myCorners} hörnor under matchen.`)
        const potmPlayer = potm
        if (potmPlayer) insights.push(`${potmPlayer.firstName} ${potmPlayer.lastName} utsågs till matchens bästa spelare.`)
        if (won && (myScore - theirScore) >= 3) insights.push('En klar seger som styrker lagets nuvarande form.')
        if (lost && (theirScore - myScore) >= 3) insights.push('En tung förlust att analysera grundligt.')
        if (insights.length === 0) return null
        return (
          <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px' }}>
            <SectionLabel style={{ marginBottom: 8 }}>NYCKELINSIKTER</SectionLabel>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.7 }}>
              {insights.map((ins, i) => (
                <li key={i} style={{ color: 'var(--text-secondary)' }}>{ins}</li>
              ))}
            </ul>
          </div>
        )
      })()}

      {/* Brygga → Taktik — bara när nästa managed fixture finns */}
      {nextOpponentName && (
        <button
          className="btn btn-outline"
          style={{ width: '100%', marginTop: 8 }}
          onClick={() => navigate('/game/taktik')}
        >
          Ställ laget mot {nextOpponentName} →
        </button>
      )}
      {nextFixture && !nextOpponentName && (
        <button
          className="btn btn-outline"
          style={{ width: '100%', marginTop: 8 }}
          onClick={() => navigate('/game/taktik')}
        >
          Förbered nästa match →
        </button>
      )}
    </>
  )
}
