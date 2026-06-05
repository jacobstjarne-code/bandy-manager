import { useNavigate } from 'react-router-dom'
import type { SaveGame, RoundSummaryData } from '../../../domain/entities/SaveGame'
import type { Fixture, MatchEvent } from '../../../domain/entities/Fixture'
import type { Player } from '../../../domain/entities/Player'
import type { Club } from '../../../domain/entities/Club'
import type { GameEvent } from '../../../domain/entities/GameEvent'
import type { EventChoice } from '../../../domain/entities/GameEvent'
import { MatchEventType, InboxItemType, TrainingType } from '../../../domain/enums'
import { formatArenaName } from '../../../domain/utils/arenaName'
import { csColor, formatFinance } from '../../utils/formatters'
import { getRivalry } from '../../../domain/data/rivalries'
import { getCurrentLeaguePosition } from '../../../domain/services/standingsService'
import { getFormResults } from '../../utils/formUtils'
import { SectionLabel } from '../../components/SectionLabel'
import { ScoreBlock } from '../../components/primitives'
import { generateSilentMatchReport } from '../../../domain/services/silentMatchReportService'
import { generateQuickSummary, choiceStyle } from './helpers'
import { getCriticalEventsForGranska, getPlayerEventsForGranska, classifyEventNature } from '../../../domain/services/granskaEventClassifier'
import { ReaktionerKort } from '../../components/granska/ReaktionerKort'
import { HALFTIME_LABELS, HALFTIME_OUTCOMES, LINEUP_ROTATION_OUTCOMES, LEADERSHIP_OUTCOMES, STARTED_TIRED_OUTCOMES } from '../../../domain/data/managerKvittoText'
import type { KvittoOutcomeDir } from '../../../domain/data/managerKvittoText'

const TRAINING_LABEL: Record<string, string> = {
  [TrainingType.Skating]: 'Skridskoteknik', [TrainingType.BallControl]: 'Bollkontroll',
  [TrainingType.Passing]: 'Passningsspel', [TrainingType.Shooting]: 'Avslut',
  [TrainingType.Defending]: 'Försvarsspel', [TrainingType.CornerPlay]: 'Hörnor',
  [TrainingType.Physical]: 'Fysik', [TrainingType.Tactical]: 'Taktik',
  [TrainingType.Recovery]: 'Återhämtning', [TrainingType.MatchPrep]: 'Matchförberedelse',
}

/**
 * A1 — flavor-radens text. Straffavgjord match (bara cup/slutspel sätter penResult)
 * får egen label FÖRE margin-logiken, annars hade en straffseger 4–4 hamnat i kryss-grenen.
 * Ren funktion → enhetstestbar (straff-guard + att ligamatch aldrig läcker straff-text).
 */
export function granskaFlavorText(args: {
  penResult?: { home: number; away: number }
  won: boolean
  lost: boolean
  isHome: boolean
  homeScore?: number
  awayScore?: number
}): string {
  const { penResult, won, lost, isHome, homeScore, awayScore } = args
  if (penResult) return won ? '🎯 Straffseger' : '🎯 Förlust på straffar'
  const myScore = isHome ? (homeScore ?? 0) : (awayScore ?? 0)
  const theirScore = isHome ? (awayScore ?? 0) : (homeScore ?? 0)
  const margin = myScore - theirScore
  const totalGoals = (homeScore ?? 0) + (awayScore ?? 0)
  const flavor = won
    ? margin >= 3 ? '💪 Dominant insats' : totalGoals >= 8 ? '🔥 Målrik historia' : margin === 1 ? '😅 Knapp seger' : '✅ Klar vinst'
    : lost
    ? margin <= -3 ? '💣 Svår dag på jobbet' : margin === -1 ? '😤 Nära men inte nog' : '❌ Klar förlust'
    : totalGoals >= 8 ? '🎢 Dramatiskt kryss' : '🤝 Rättvis poängdelning'
  const flavorTail = won ? ` · ${isHome ? 'hemmaseger' : 'bortaseger'}` : ''
  return `${flavor}${flavorTail}`
}

/** Grupp-avdelare: ⬩ + label + hairline. */
function GroupDivider({ label, style }: { label: string; style?: React.CSSProperties }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 2px 6px', ...style }}>
      <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        ⬩ {label}
      </span>
      <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

interface GranskaOversiktProps {
  game: SaveGame
  fixture: Fixture | undefined
  homeClub: Club | undefined
  awayClub: Club | undefined
  isHome: boolean
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
  onResolve: (ids: string[]) => void
  rs: RoundSummaryData | null
  standing: { clubId: string; position: number } | undefined
  standingBefore: number | null
  financesDelta: number
  csDelta: number
  cs: number
  otherResults: Fixture[]
  onOpenReport: () => void
}

export function GranskaOversikt({
  game, fixture, homeClub, awayClub, isHome,
  won, lost, resultColor, resultLabel, potm, potmRating, penResult,
  keyMoments, pendingEvents, resolvedEventIds, chosenLabels, fadeIn, onChoice, onResolve,
  rs, standing, standingBefore, financesDelta, csDelta, cs, otherResults, onOpenReport,
}: GranskaOversiktProps) {
  const navigate = useNavigate()
  const leaguePosition = getCurrentLeaguePosition(game.managedClubId, game)
  const getClubShort = (id: string) => game.clubs.find(c => c.id === id)?.shortName ?? game.clubs.find(c => c.id === id)?.name ?? '?'
  const latestTraining = (game.trainingHistory ?? []).slice(-1)[0]
  const trainingLabel = latestTraining ? TRAINING_LABEL[latestTraining.focus.type] ?? 'Träning' : null
  return (
    <>
      <GroupDivider label="Resultatet" style={{ marginTop: 2 }} />
      {/* Result hero — tappbar → Analys (händelsetidslinje + insikter) */}
      {fixture && (
        <div className="card-sharp card-tap" onClick={onOpenReport} style={{ margin: '0 0 3px', position: 'relative', cursor: 'pointer', ...fadeIn(0) }}>
          <span style={{ position: 'absolute', top: 13, right: 14, fontSize: 16, color: 'var(--accent)' }}>›</span>
          <div style={{ padding: '16px 14px 16px', textAlign: 'center' }}>
            <SectionLabel style={{ marginBottom: 10 }}>🏒 MATCHEN</SectionLabel>

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
              background: won ? 'color-mix(in srgb, var(--success) 12%, transparent)' : lost ? 'color-mix(in srgb, var(--danger) 12%, transparent)' : 'rgba(245,241,235,0.08)',
              border: `1px solid ${won ? 'color-mix(in srgb, var(--success) 30%, transparent)' : lost ? 'color-mix(in srgb, var(--danger) 30%, transparent)' : 'rgba(245,241,235,0.2)'}`,
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

            {/* Flavor-rad — kort sammanfattning, border-top, klipps aldrig mot underkanten */}
            {(() => {
              const flavorText = granskaFlavorText({ penResult, won, lost, isHome, homeScore: fixture.homeScore, awayScore: fixture.awayScore })
              // penResult-grenen har egen färglogik (straff → alltid won/lost, ingen neutral)
              if (penResult) {
                return (
                  <div style={{ marginTop: 12, paddingTop: 11, borderTop: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: won ? 'var(--success)' : 'var(--danger)' }}>
                    {flavorText}
                  </div>
                )
              }
              return (
                <div style={{ marginTop: 12, paddingTop: 11, borderTop: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: won ? 'var(--success)' : lost ? 'var(--danger)' : 'var(--text-secondary)' }}>
                  {flavorText}
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Resultat-strip — tabell + form (två kolumner) */}
      {standing && (() => {
        const form = getFormResults(game.managedClubId, game.fixtures, game.clubs).slice(-5)
        const dotColor = (r: 'V' | 'O' | 'F') => r === 'V' ? 'var(--success)' : r === 'F' ? 'var(--danger)' : 'var(--text-muted)'
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, margin: '0 0 3px', ...fadeIn(1) }}>
            <div className="card-sharp card-tap" onClick={() => navigate('/game/tabell')} style={{ padding: '10px 12px', cursor: 'pointer' }}>
              <SectionLabel style={{ marginBottom: 7 }}>📊 TABELL</SectionLabel>
              <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                {leaguePosition ?? '—'}{leaguePosition ? ':a' : ''}
              </span>
              {standingBefore && leaguePosition && standingBefore !== leaguePosition && (
                <span style={{ fontSize: 11, marginLeft: 6, color: standingBefore > leaguePosition ? 'var(--success)' : 'var(--danger)' }}>
                  {standingBefore > leaguePosition ? '↑' : '↓'}
                </span>
              )}
            </div>
            <div className="card-sharp" style={{ padding: '10px 12px' }}>
              <SectionLabel style={{ marginBottom: 7 }}>📈 FORM</SectionLabel>
              <div style={{ display: 'flex', gap: 4 }}>
                {form.length === 0
                  ? <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                  : form.map((r, i) => (
                    <span key={i} style={{ width: 16, height: 16, borderRadius: 4, background: dotColor(r.result), color: 'var(--text-light)', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.result}</span>
                  ))}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Statistik */}
      {fixture?.report && (
        <div className="card-sharp" style={{ margin: '0 0 3px', padding: '10px 12px', ...fadeIn(1) }}>
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

      {/* Critical events — max 3, kräver val */}
      {(() => {
        const criticalEvents = getCriticalEventsForGranska(pendingEvents).slice(0, 3)
        const playerEvents = getPlayerEventsForGranska(pendingEvents)
        const inboxOnlyCount = pendingEvents.filter(e => !e.resolved && classifyEventNature(e) === 'inbox-only').length
        return (
          <>
            {criticalEvents.map((event, ei) => {
              const resolved = resolvedEventIds.has(event.id)
              const chosenLabel = chosenLabels[event.id]
              const relatedPlayer = event.relatedPlayerId ? game.players.find(p => p.id === event.relatedPlayerId) : null
              const relatedClub = event.relatedClubId ? game.clubs.find(c => c.id === event.relatedClubId) : null
              return (
                <div key={event.id} className="card-sharp" style={{ margin: '0 0 3px', ...fadeIn(2 + ei) }}>
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
                            {relatedPlayer && <span style={{ fontSize: 11, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)', borderRadius: 20, padding: '3px 8px', color: 'var(--accent)', fontWeight: 600 }}>{relatedPlayer.firstName} {relatedPlayer.lastName} · Styrka {Math.round(relatedPlayer.currentAbility)}</span>}
                            {relatedClub && <span style={{ fontSize: 11, background: 'color-mix(in srgb, var(--ice) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--ice) 25%, transparent)', borderRadius: 20, padding: '3px 8px', color: 'var(--ice)', fontWeight: 600 }}>{relatedClub.name}</span>}
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
            {playerEvents.length > 0 && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '4px 12px 6px' }}>
                {playerEvents.length} spelar{playerEvents.length > 1 ? 'händelser' : 'händelse'} i Spelare-fliken
              </p>
            )}
            {inboxOnlyCount > 0 && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '4px 12px 6px' }}>
                {inboxOnlyCount} notis{inboxOnlyCount === 1 ? '' : 'er'} i inboxen
              </p>
            )}
          </>
        )
      })()}

      {/* Presskonferens — tidskritisk, direkt efter events */}
      {(() => {
        const pc = game.pendingPressConference
        if (!pc) return null
        const pcResolved = resolvedEventIds.has(pc.id)
        const pcChosenLabel = chosenLabels[pc.id]
        const pcTitle = pc.title.replace(/^🎤\s*Presskonferens\s*[—–-]\s*/i, '').trim()
        return (
          <div className="card-sharp" style={{
            margin: '0 0 3px',
            borderLeft: '3px solid var(--warm)',
            borderRadius: '0 8px 8px 0',
            ...fadeIn(4),
          }}>
            <div style={{ padding: '10px 12px' }}>
              <SectionLabel style={{ marginBottom: pcResolved ? 4 : 6 }}>🎤 PRESSKONFERENSEN</SectionLabel>
              {pcResolved ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--success)' }}>✓</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>{pcChosenLabel}</span>
                </div>
              ) : (
                <>
                  {pcTitle && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{pcTitle}</p>}
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

      {/* C-B1: CS-pressfråga */}
      {(() => {
        const cp = game.pendingCSPress
        if (!cp) return null
        const cpResolved = resolvedEventIds.has(cp.id)
        const cpChosenLabel = chosenLabels[cp.id]
        const journalist = game.journalist
        return (
          <div className="card-sharp" style={{
            margin: '0 0 3px',
            borderLeft: '3px solid var(--warm)',
            borderRadius: '0 8px 8px 0',
            ...fadeIn(4),
          }}>
            <div style={{ padding: '10px 12px' }}>
              <SectionLabel style={{ marginBottom: cpResolved ? 4 : 6 }}>📰 PRESSFRÅGA</SectionLabel>
              {cpResolved ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--success)' }}>✓</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>{cpChosenLabel}</span>
                </div>
              ) : (
                <>
                  {journalist && (
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                      {journalist.name} · {journalist.outlet}
                    </p>
                  )}
                  <p style={{ fontSize: 13, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 8, fontStyle: 'italic' }}>{cp.body}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {cp.choices.map((choice: EventChoice) => (
                      <button key={choice.id} onClick={() => onChoice(cp.id, choice.id, choice.label)}
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

      {/* Domarmöte */}
      {(() => {
        const rm = game.pendingRefereeMeeting
        if (!rm) return null
        const rmResolved = resolvedEventIds.has(rm.id)
        const rmChosenLabel = chosenLabels[rm.id]
        return (
          <div className="card-sharp" style={{ margin: '0 0 3px', ...fadeIn(4) }}>
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

      <ReaktionerKort pendingEvents={pendingEvents} onResolve={onResolve} />

      {/* Media */}
      {(() => {
        const headlineItem = game.inbox
          .filter(i => i.type === InboxItemType.MediaEvent &&
            (!fixture || i.id === `inbox_headline_md${fixture.matchday}_${game.currentSeason}`))
          .sort((a, b) => b.date.localeCompare(a.date))[0]
        if (!headlineItem) return null
        const journalist = game.journalist
        const personaLabel = journalist?.persona === 'critical' ? 'Kritisk'
          : journalist?.persona === 'supportive' ? 'Stödjande'
          : journalist?.persona === 'sensationalist' ? 'Sensationalistisk'
          : journalist?.persona === 'analytical' ? 'Analytisk' : null
        return (
          <div className="card-sharp" style={{
            margin: '0 0 3px', padding: '10px 12px',
            borderLeft: '2px solid var(--accent)',
            borderRadius: '0 8px 8px 0',
            ...fadeIn(5),
          }}>
            <SectionLabel style={{ marginBottom: 6 }}>📰 MEDIA</SectionLabel>
            {journalist && (
              <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                {journalist.name} · {journalist.outlet}{personaLabel ? ` · ${personaLabel}` : ''}
              </p>
            )}
            <p style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', lineHeight: 1.4 }}>
              {headlineItem.title}
            </p>
          </div>
        )
      })()}

      {/* Manager kvitto — val → utfall */}
      {(() => {
        const log = fixture?.report?.managerChoiceLog
        if (!log || log.length === 0) return null
        const kvittoDir: KvittoOutcomeDir = won ? 'good' : lost ? 'bad' : 'neutral'
        const seed = (fixture?.homeScore ?? 0) + (fixture?.awayScore ?? 0)
        const lines: { label: string; text: string }[] = []
        const findPlayer = (id?: string) => id ? game.players.find(p => p.id === id) : undefined

        for (const entry of log) {
          const i = lines.length
          if (i >= 4) break
          if (entry.type === 'halftime_tactic') {
            const key = entry.detail === 'lowered_tempo' ? 'lugna'
              : entry.detail === 'increased_pressure' ? 'pressa'
              : entry.detail === 'player_talk' ? 'prata'
              : null
            if (!key) continue
            const pool = HALFTIME_OUTCOMES[key][kvittoDir]
            lines.push({ label: HALFTIME_LABELS[key], text: pool[(seed + i) % pool.length] })
          } else if (entry.type === 'captain' && entry.playerId) {
            const player = findPlayer(entry.playerId)
            if (!player) continue
            const pool = LEADERSHIP_OUTCOMES[kvittoDir]
            lines.push({ label: `Kapten: ${player.lastName}`, text: pool[(seed + i) % pool.length] })
          } else if (entry.type === 'started_tired' && entry.playerId) {
            const player = findPlayer(entry.playerId)
            if (!player) continue
            const rating = fixture?.report?.playerRatings[entry.playerId]
            const dir: KvittoOutcomeDir = rating !== undefined ? (rating >= 7 ? 'good' : rating <= 5 ? 'bad' : 'neutral') : kvittoDir
            const cond = entry.detail.startsWith('condition_') ? entry.detail.slice(10) : entry.detail
            const pool = STARTED_TIRED_OUTCOMES[dir]
            lines.push({ label: `Startade trött: ${player.lastName} (${cond}%)`, text: pool[(seed + i) % pool.length].replace('{spelare}', player.lastName) })
          } else if (entry.type === 'bench_fit' && entry.playerId) {
            const player = findPlayer(entry.playerId)
            if (!player) continue
            const pool = LINEUP_ROTATION_OUTCOMES[kvittoDir]
            lines.push({ label: `Vilad: ${player.lastName}`, text: pool[(seed + i) % pool.length].replace('{spelare}', player.lastName) })
          }
        }

        if (lines.length === 0) return null
        return (
          <div className="card-sharp" style={{ margin: '0 0 3px', padding: '10px 12px', ...fadeIn(7) }}>
            <SectionLabel style={{ marginBottom: 4 }}>📋 DINA VAL</SectionLabel>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 8 }}>
              Dina beslut den här matchen, och hur de föll ut.
            </p>
            {lines.map((line, i) => (
              <div key={i} style={{ marginBottom: i < lines.length - 1 ? 8 : 0 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 2 }}>
                  {line.label}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.4 }}>
                  {line.text}
                </p>
              </div>
            ))}
          </div>
        )
      })()}

      {/* Nyckelmoment */}
      {keyMoments.length > 0 && (
        <div className="card-sharp" style={{ margin: '0 0 3px', padding: '10px 12px', ...fadeIn(6) }}>
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
                  <span style={{ fontSize: 11, color: e.type === MatchEventType.Suspension ? 'var(--danger)' : 'var(--text-secondary)' }}>{scorerName}</span>
                  {!isHomeEvent && <span style={{ fontSize: 11 }}>{icon}</span>}
                  {!isHomeEvent && <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 24, textAlign: 'left', flexShrink: 0 }}>{e.minute}'</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── KLUBBEN ── */}
      <GroupDivider label="Klubben" />
      {rs && (
        <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px' }}>
          <SectionLabel style={{ marginBottom: 8 }}>OMGÅNGSSAMMANFATTNING</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate('/game/club', { state: { tab: 'ekonomi' } })}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>💰 Ekonomi</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: financesDelta >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatFinance(financesDelta)}/omg</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate('/game/club', { state: { tab: 'orten' } })}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>🏘 Bygdens puls</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: csColor(cs) }}>
                {csDelta !== 0 ? `${rs.communityStandingBefore ?? cs} → ${cs} ${csDelta > 0 ? '↑' : '↓'}` : `${cs}`}
              </span>
            </div>
            {trainingLabel && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>🏋️ Träning</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{trainingLabel}</span>
              </div>
            )}
            {rs.youthMatchResult && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate('/game/club', { state: { tab: 'akademi' } })}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>🎓 Akademin (P19)</span>
                <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{rs.youthMatchResult}</span>
              </div>
            )}
            {rs.newInboxCount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', cursor: 'pointer' }} onClick={() => navigate('/game/inbox')}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>📬 Inkorg</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{rs.newInboxCount} nya</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NY SKADA — eget danger-stripe-kort, bara om en ny skada finns denna omg */}
      {rs?.injuries && rs.injuries.length > 0 && (
        <div className="card-sharp card-tap" onClick={() => navigate('/game/squad')}
          style={{ margin: '0 0 6px', padding: '10px 12px', borderLeft: '3px solid var(--danger)', borderRadius: '0 8px 8px 0', cursor: 'pointer' }}>
          <SectionLabel style={{ marginBottom: 6 }}>🩹 NY SKADA</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {rs.injuries.map((inj: string, i: number) => (
              <span key={i} style={{ fontSize: 12, fontWeight: 600, color: 'var(--danger)' }}>{inj}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── OMVÄRLDEN ── */}
      {(otherResults.length > 0 || game.inbox.some(i => i.type === InboxItemType.ScoutReport && !i.isRead)) && (
        <GroupDivider label="Omvärlden" />
      )}
      {otherResults.length > 0 && (() => {
        const rivalClubId = game.clubs.filter(c => c.id !== game.managedClubId).find(c => getRivalry(game.managedClubId, c.id))?.id ?? null
        return (
          <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px' }}>
            <SectionLabel style={{ marginBottom: 6 }}>🏒 ANDRA MATCHER</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {otherResults.map(f => {
                const homeWon = (f.homeScore ?? 0) > (f.awayScore ?? 0)
                const awayWon = (f.awayScore ?? 0) > (f.homeScore ?? 0)
                const isRivalMatch = rivalClubId && (f.homeClubId === rivalClubId || f.awayClubId === rivalClubId)
                const isDraw = !homeWon && !awayWon
                const blockVariant = isRivalMatch ? 'derby' : isDraw ? 'draw' : 'subtle'
                return (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ flex: 1, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: homeWon ? 600 : 400, color: homeWon ? 'var(--text-primary)' : 'var(--text-secondary)', textAlign: 'right' }}>{isRivalMatch && f.homeClubId === rivalClubId ? '🔥 ' : ''}{getClubShort(f.homeClubId)}</span>
                    <ScoreBlock score={`${f.homeScore}–${f.awayScore}`} variant={blockVariant} light compact />
                    <span style={{ flex: 1, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: awayWon ? 600 : 400, color: awayWon ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{isRivalMatch && f.awayClubId === rivalClubId ? '🔥 ' : ''}{getClubShort(f.awayClubId)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}
      {(() => {
        const scoutItems = game.inbox.filter(i => i.type === InboxItemType.ScoutReport && !i.isRead).slice(-2)
        if (scoutItems.length === 0) return null
        return (
          <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px' }}>
            <SectionLabel style={{ marginBottom: 6 }}>🔍 SCOUTING</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {scoutItems.map((item, i) => (
                <div key={i} style={{ borderBottom: i < scoutItems.length - 1 ? '1px solid var(--border)' : 'none', paddingBottom: i < scoutItems.length - 1 ? 5 : 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{item.title}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })()}
    </>
  )
}
