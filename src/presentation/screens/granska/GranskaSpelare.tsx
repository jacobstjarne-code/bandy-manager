import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { Player } from '../../../domain/entities/Player'
import type { GameEvent, EventChoice } from '../../../domain/entities/GameEvent'
import { MatchEventType } from '../../../domain/enums'
import { SectionLabel } from '../../components/SectionLabel'
import { getPortraitSvg } from '../../../domain/services/portraitService'
import { ratingColor, choiceStyle } from './helpers'
import { classifyEventNature } from '../../../domain/services/granskaEventClassifier'

interface GranskaSpelareProps {
  game: SaveGame
  fixture: Fixture | undefined
  isHome: boolean
  potmId: string | null | undefined
  pendingEvents: GameEvent[]
  resolvedEventIds: Set<string>
  chosenLabels: Record<string, string>
  onChoice: (eventId: string, choiceId: string, choiceLabel: string) => void
}

export function GranskaSpelare({ game, fixture, isHome, potmId, pendingEvents, resolvedEventIds, chosenLabels, onChoice }: GranskaSpelareProps) {
  if (!fixture || !fixture.report) return (
    <div className="card-sharp" style={{ margin: '0 0 6px', padding: '20px 14px', textAlign: 'center' }}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Spelarbetyg saknas</p>
    </div>
  )

  const myLineup = isHome ? fixture.homeLineup : fixture.awayLineup
  const ratings = fixture.report.playerRatings

  const starterIds = myLineup?.startingPlayerIds ?? []
  const benchIds = myLineup?.benchPlayerIds ?? []
  const captainId = myLineup?.captainPlayerId ?? game.captainPlayerId

  const starters = starterIds
    .map(id => game.players.find(p => p.id === id))
    .filter(Boolean) as Player[]
  starters.sort((a, b) => (ratings[b.id] ?? 0) - (ratings[a.id] ?? 0))

  const bench = benchIds
    .map(id => game.players.find(p => p.id === id))
    .filter(Boolean) as Player[]

  const playerEvents = pendingEvents.filter(e => !e.resolved && classifyEventNature(e) === 'player')

  return (
    <>
      {playerEvents.length > 0 && (
        <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px' }}>
          <SectionLabel style={{ marginBottom: 8 }}>👥 KRING SPELARNA</SectionLabel>
          {playerEvents.map(event => {
            const resolved = resolvedEventIds.has(event.id)
            const chosenLabel = chosenLabels[event.id]
            const relatedPlayer = event.relatedPlayerId ? game.players.find(p => p.id === event.relatedPlayerId) : null
            return (
              <div key={event.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                {event.sender && (
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 3 }}>
                    {event.sender.name} · {event.sender.role}
                  </p>
                )}
                {relatedPlayer && (
                  <span style={{ display: 'inline-block', fontSize: 11, background: 'rgba(196,122,58,0.1)', border: '1px solid rgba(196,122,58,0.3)', borderRadius: 20, padding: '2px 8px', color: 'var(--accent)', fontWeight: 600, marginBottom: 4 }}>
                    {relatedPlayer.firstName} {relatedPlayer.lastName}
                  </span>
                )}
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.3 }}>{event.title}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: resolved || !event.choices?.length ? 0 : 8 }}>{event.body}</p>
                {resolved ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--success)' }}>✓</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>{chosenLabel}</span>
                  </div>
                ) : event.choices?.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {event.choices.map((choice: EventChoice) => (
                      <button key={choice.id} onClick={() => onChoice(event.id, choice.id, choice.label)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, textAlign: 'left', cursor: 'pointer', ...choiceStyle(choice.id) }}>
                        {choice.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="card-sharp" style={{ margin: '0 0 6px', overflow: 'hidden' }}>
        <div style={{ padding: '10px 12px 6px', borderBottom: '1px solid var(--border)' }}>
          <SectionLabel>STARTELVA — BETYG</SectionLabel>
        </div>
        {starters.map((p, i) => {
          const r = ratings[p.id] ?? 0
          const isCap = p.id === captainId
          const goals = fixture.events.filter(e => e.type === MatchEventType.Goal && e.playerId === p.id).length
          const assists = fixture.events.filter(e => e.type === MatchEventType.Assist && e.playerId === p.id).length
          const saves = fixture.events.filter(e => e.type === MatchEventType.Save && e.playerId === p.id).length
          const statParts: string[] = []
          if (goals > 0) statParts.push(`${goals} mål`)
          if (assists > 0) statParts.push(`${assists} assist`)
          if (saves > 0) statParts.push(`${saves} räddning${saves > 1 ? 'ar' : ''}`)
          const isPOTM = p.id === potmId

          return (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 12px',
              borderBottom: i < starters.length - 1 ? '1px solid var(--border)' : 'none',
              background: isPOTM ? 'rgba(196,122,58,0.06)' : 'transparent',
            }}>
              {/* TODO(FAS 5): byt mot riktig karaktärsillustration · se CHARACTER-BRIEF.md */}
              <div style={{ width: 22, height: 22, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-surface)', border: isCap ? '1.5px solid var(--accent)' : '1px solid var(--border)' }}
                dangerouslySetInnerHTML={{ __html: getPortraitSvg(p.id, p.age, p.position) }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {isCap && <span style={{ marginRight: 2 }}>⭐</span>}
                  {isPOTM && <span style={{ marginRight: 2 }}>🏒</span>}
                  {p.firstName[0]}. {p.lastName}
                </p>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                  {p.position}{statParts.length > 0 ? ` · ${statParts.join(' · ')}` : ''}
                </p>
              </div>
              <span style={{ fontSize: 15, fontFamily: 'var(--font-display)', fontWeight: 700, color: ratingColor(r), flexShrink: 0 }}>
                {r > 0 ? r.toFixed(1) : '–'}
              </span>
            </div>
          )
        })}
      </div>

      {bench.length > 0 && (
        <div className="card-sharp" style={{ margin: '0 0 6px', overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px 6px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>BÄNKEN</span>
          </div>
          {bench.map((p, i) => {
            const r = ratings[p.id] ?? 0
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderBottom: i < bench.length - 1 ? '1px solid var(--border)' : 'none', opacity: 0.7 }}>
                {/* TODO(FAS 5): byt mot riktig karaktärsillustration · se CHARACTER-BRIEF.md */}
                <div style={{ width: 18, height: 18, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                  dangerouslySetInnerHTML={{ __html: getPortraitSvg(p.id, p.age, p.position) }} />
                <span style={{ flex: 1, fontSize: 11, color: 'var(--text-secondary)' }}>{p.firstName[0]}. {p.lastName}</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}>{r > 0 ? r.toFixed(1) : '–'}</span>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
