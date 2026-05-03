import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { Fixture, MatchEvent } from '../../../domain/entities/Fixture'
import type { Player } from '../../../domain/entities/Player'
import type { Club } from '../../../domain/entities/Club'
import type { GameEvent } from '../../../domain/entities/GameEvent'
import type { EventChoice } from '../../../domain/entities/GameEvent'
import { MatchEventType, InboxItemType } from '../../../domain/enums'
import { formatArenaName } from '../../../domain/utils/arenaName'
import { SectionLabel } from '../../components/SectionLabel'
import { generateInsandare } from '../../../domain/services/insandareService'
import { generatePostMatchOpponentQuote } from '../../../domain/services/opponentManagerService'
import { generateSilentMatchReport } from '../../../domain/services/silentMatchReportService'
import { generateQuickSummary, choiceStyle } from './helpers'

interface GranskaOversiktProps {
  game: SaveGame
  fixture: Fixture | undefined
  homeClub: Club | undefined
  awayClub: Club | undefined
  isHome: boolean
  myScore: number
  theirScore: number
  won: boolean
  lost: boolean
  resultColor: string
  resultLabel: string
  potm: Player | null
  potmRating: number | null | undefined
  penResult: { home: number; away: number } | undefined
  keyMoments: MatchEvent[]
  pendingEvents: GameEvent[]
  resolvedEventIds: Set<string>
  chosenLabels: Record<string, string>
  fadeIn: (i: number) => React.CSSProperties
  onChoice: (eventId: string, choiceId: string, choiceLabel: string) => void
}

export function GranskaOversikt({
  game, fixture, homeClub, awayClub, isHome, myScore, theirScore,
  won, lost, resultColor, resultLabel, potm, potmRating, penResult,
  keyMoments, pendingEvents, resolvedEventIds, chosenLabels, fadeIn, onChoice,
}: GranskaOversiktProps) {
  return (
    <>
      {/* Result hero */}
      {fixture && (
        <div className="card-sharp" style={{ margin: '0 0 6px', ...fadeIn(0) }}>
          <div style={{ padding: '16px 14px 12px', textAlign: 'center' }}>
            <SectionLabel style={{ marginBottom: 10 }}>SLUTRESULTAT</SectionLabel>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', flex: 1, textAlign: 'left' }}>{homeClub?.shortName ?? homeClub?.name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', flex: 1, textAlign: 'right' }}>{awayClub?.shortName ?? awayClub?.name}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 8 }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: resultColor, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{fixture.homeScore}</span>
              <span style={{ fontSize: 24, color: 'var(--text-muted)', fontWeight: 300 }}>–</span>
              <span style={{ fontSize: 36, fontWeight: 800, color: resultColor, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{fixture.awayScore}</span>
            </div>

            {(fixture.wentToOvertime || penResult) && (
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
                {penResult ? `Straffar: ${penResult.home}–${penResult.away}` : 'Avgjort i förlängning'}
              </p>
            )}

            <span style={{
              display: 'inline-block', padding: '4px 14px', borderRadius: 20,
              background: won ? 'rgba(90,154,74,0.12)' : lost ? 'rgba(176,80,64,0.12)' : 'rgba(245,241,235,0.08)',
              border: `1px solid ${won ? 'rgba(90,154,74,0.3)' : lost ? 'rgba(176,80,64,0.3)' : 'rgba(245,241,235,0.2)'}`,
              color: resultColor, fontSize: 11, fontWeight: 700, letterSpacing: '1px', marginBottom: 8,
            }}>
              {resultLabel}
            </span>

            {potm && potmRating != null && (
              <p style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4 }}>⭐ {potm.firstName} {potm.lastName} · {potmRating.toFixed(1)}</p>
            )}
            {fixture.attendance != null && (
              <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>🏟️ {fixture.attendance} åskådare</p>
            )}
            {homeClub?.arenaName && !fixture.isNeutralVenue && (
              <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, fontStyle: 'italic' }}>Spelades på {formatArenaName(homeClub.arenaName)}</p>
            )}

            {/* Match summary */}
            {(() => {
              if (game.preferredMatchMode === 'silent') {
                const homeClubName = game.clubs.find(c => c.id === fixture.homeClubId)?.name ?? ''
                const awayClubName = game.clubs.find(c => c.id === fixture.awayClubId)?.name ?? ''
                const report = generateSilentMatchReport(fixture, homeClubName, awayClubName, game.managedClubId)
                return (
                  <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', textAlign: 'left' }}>
                    {report.split('\n\n').map((para, i) => (
                      <p key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: i < 2 ? 10 : 0 }}>{para}</p>
                    ))}
                  </div>
                )
              }
              const summary = generateQuickSummary(fixture, isHome, game.players)
              return summary ? (
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 12, padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', textAlign: 'left' }}>
                  {summary}
                </p>
              ) : null
            })()}
          </div>
        </div>
      )}

      {/* Statistik */}
      {fixture?.report && (
        <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px', ...fadeIn(1) }}>
          <SectionLabel style={{ marginBottom: 8 }}>STATISTIK</SectionLabel>
          {[
            { label: 'Skott', home: fixture.report.shotsHome, away: fixture.report.shotsAway },
            { label: 'Hörnor', home: fixture.report.cornersHome, away: fixture.report.cornersAway },
            { label: 'Bollinnehav', home: fixture.report.possessionHome, away: fixture.report.possessionAway, suffix: '%' },
            ...(fixture.report.penaltiesHome + fixture.report.penaltiesAway > 0 ? [{ label: 'Straffar', home: fixture.report.penaltiesHome, away: fixture.report.penaltiesAway }] : []),
          ].map(stat => {
            const total = stat.home + stat.away
            const homeW = total > 0 ? (stat.home / total) * 100 : 50
            return (
              <div key={stat.label} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{stat.home}{stat.suffix ?? ''}</span>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '1px' }}>{stat.label.toUpperCase()}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{stat.away}{stat.suffix ?? ''}</span>
                </div>
                <div style={{ display: 'flex', height: 3, borderRadius: 2, overflow: 'hidden', gap: 1 }}>
                  <div style={{ flex: homeW, background: isHome ? 'var(--accent)' : 'var(--border)' }} />
                  <div style={{ flex: 100 - homeW, background: !isHome ? 'var(--accent)' : 'var(--border)' }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Events — tidskritiska, kräver val innan nästa omgång */}
      {pendingEvents.map((event, ei) => {
        const resolved = resolvedEventIds.has(event.id)
        const chosenLabel = chosenLabels[event.id]
        const relatedPlayer = event.relatedPlayerId ? game.players.find(p => p.id === event.relatedPlayerId) : null
        const relatedClub = event.relatedClubId ? game.clubs.find(c => c.id === event.relatedClubId) : null
        return (
          <div key={event.id} className="card-sharp" style={{ margin: '0 0 6px', ...fadeIn(2 + ei) }}>
            <div style={{ padding: '10px 12px' }}>
              <SectionLabel style={{ marginBottom: resolved ? 4 : 6 }}>{event.sender ? `${event.sender.name}, ${event.sender.role}` : 'Händelse'}</SectionLabel>
              {resolved ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--success)' }}>✓</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>{chosenLabel}</span>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 5, lineHeight: 1.3 }}>{event.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: 8, whiteSpace: 'pre-line' }}>{event.body}</p>
                  {(relatedPlayer || relatedClub) && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                      {relatedPlayer && <span style={{ fontSize: 11, background: 'rgba(196,122,58,0.1)', border: '1px solid rgba(196,122,58,0.3)', borderRadius: 20, padding: '3px 8px', color: 'var(--accent)', fontWeight: 600 }}>{relatedPlayer.firstName} {relatedPlayer.lastName} · Styrka {Math.round(relatedPlayer.currentAbility)}</span>}
                      {relatedClub && <span style={{ fontSize: 11, background: 'rgba(126,179,212,0.10)', border: '1px solid rgba(126,179,212,0.25)', borderRadius: 20, padding: '3px 8px', color: 'var(--ice)', fontWeight: 600 }}>{relatedClub.name}</span>}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {event.choices.map((choice: EventChoice) => (
                      <button key={choice.id} onClick={() => onChoice(event.id, choice.id, choice.label)}
                        style={{ position: 'relative', zIndex: 1, width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, textAlign: 'left', cursor: 'pointer', ...choiceStyle(choice.id) }}>
                        {choice.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )
      })}

      {/* Presskonferens — tidskritisk, direkt efter events */}
      {(() => {
        const pc = game.pendingPressConference
        if (!pc) return null
        const pcResolved = resolvedEventIds.has(pc.id)
        const pcChosenLabel = chosenLabels[pc.id]
        return (
          <div className="card-sharp" style={{ margin: '0 0 6px', ...fadeIn(4) }}>
            <div style={{ padding: '10px 12px' }}>
              {pcResolved ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--success)' }}>✓</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>{pcChosenLabel}</span>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{pc.title}</p>
                  <p style={{ fontSize: 13, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 8, fontStyle: 'italic' }}>{pc.body}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {pc.choices.map((choice: EventChoice) => (
                      <button key={choice.id} onClick={() => onChoice(pc.id, choice.id, choice.label)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, textAlign: 'left', cursor: 'pointer', ...choiceStyle(choice.id) }}>
                        {choice.label}
                        {choice.subtitle && <span style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)', fontWeight: 400, marginTop: 2 }}>{choice.subtitle}</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )
      })()}

      {/* Domarmöte */}
      {(() => {
        const rm = game.pendingRefereeMeeting
        if (!rm) return null
        const rmResolved = resolvedEventIds.has(rm.id)
        const rmChosenLabel = chosenLabels[rm.id]
        return (
          <div className="card-sharp" style={{ margin: '0 0 6px', ...fadeIn(4) }}>
            <div style={{ padding: '10px 12px' }}>
              <SectionLabel style={{ marginBottom: rmResolved ? 4 : 6 }}>🏟️ DOMARENS LOCKER ROOM</SectionLabel>
              {rmResolved ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--success)' }}>✓</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>{rmChosenLabel}</span>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{rm.sender?.name}</p>
                  <p style={{ fontSize: 13, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 8, fontStyle: 'italic' }}>{rm.body}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {rm.choices.map((choice: EventChoice) => (
                      <button key={choice.id} onClick={() => onChoice(rm.id, choice.id, choice.label)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, textAlign: 'left', cursor: 'pointer', ...choiceStyle(choice.id) }}>
                        {choice.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )
      })()}

      {/* Media */}
      {(() => {
        const headlineItem = game.inbox
          .filter(i => i.type === InboxItemType.MediaEvent)
          .sort((a, b) => b.date.localeCompare(a.date))[0]
        if (!headlineItem) return null
        const journalist = game.journalist
        const personaLabel = journalist?.persona === 'critical' ? 'Kritisk'
          : journalist?.persona === 'supportive' ? 'Stödjande'
          : journalist?.persona === 'sensationalist' ? 'Sensationalistisk'
          : journalist?.persona === 'analytical' ? 'Analytisk' : null
        return (
          <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px', ...fadeIn(5) }}>
            <SectionLabel style={{ marginBottom: 6 }}>📰 MEDIA</SectionLabel>
            {journalist && (
              <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                {journalist.name} · {journalist.outlet}{personaLabel ? ` · ${personaLabel}` : ''}
              </p>
            )}
            <p style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', lineHeight: 1.4, fontStyle: 'italic' }}>
              {headlineItem.body}
            </p>
          </div>
        )
      })()}

      {/* Insändare */}
      {(() => {
        if (!fixture) return null
        const insandare = generateInsandare(game, fixture)
        if (!insandare) return null
        return (
          <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px' }}>
            <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', color: 'var(--text-muted)', marginBottom: 6 }}>✉️ INSÄNDARE</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontStyle: 'italic', lineHeight: 1.5 }}>"{insandare.text}"</p>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>— {insandare.signature}</p>
          </div>
        )
      })()}

      {/* Nyckelmoment */}
      {keyMoments.length > 0 && (
        <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px', ...fadeIn(6) }}>
          <SectionLabel style={{ marginBottom: 8 }}>NYCKELMOMENT</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {keyMoments.map((e, i) => {
              const isHomeEvent = e.clubId === fixture?.homeClubId
              const scorer = e.playerId ? game.players.find(p => p.id === e.playerId) : null
              const scorerName = scorer ? `${scorer.firstName[0]}. ${scorer.lastName}` : '?'
              const icon = e.type === MatchEventType.Goal ? (e.isCornerGoal ? '📐' : '🏒') : '⏱️'
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: isHomeEvent ? 'flex-start' : 'flex-end', gap: 5 }}>
                  {isHomeEvent && <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 24, textAlign: 'right', flexShrink: 0 }}>{e.minute}'</span>}
                  {isHomeEvent && <span style={{ fontSize: 11 }}>{icon}</span>}
                  <span style={{ fontSize: 11, color: e.type === MatchEventType.RedCard ? 'var(--danger)' : 'var(--text-secondary)' }}>{scorerName}</span>
                  {!isHomeEvent && <span style={{ fontSize: 11 }}>{icon}</span>}
                  {!isHomeEvent && <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 24, textAlign: 'left', flexShrink: 0 }}>{e.minute}'</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Motståndartränare */}
      {(() => {
        const margin = myScore - theirScore
        if (Math.abs(margin) < 3) return null
        const opponentClub = isHome ? awayClub : homeClub
        if (!opponentClub) return null
        const theyWon = margin < 0
        const opponentScandal = (game.scandalHistory ?? []).some(s =>
          s.affectedClubId === opponentClub.id &&
          s.season === game.currentSeason &&
          s.type !== 'small_absurdity'
        )
        const quote = generatePostMatchOpponentQuote(opponentClub, theyWon, opponentScandal)
        if (!quote) return null
        return (
          <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px' }}>
            <SectionLabel style={{ marginBottom: 6 }}>🎙 MOTSTÅNDET SÄGER</SectionLabel>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>{quote}</p>
          </div>
        )
      })()}
    </>
  )
}
