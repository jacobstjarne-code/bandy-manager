import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { playSound } from '../audio/soundEffects'
import { MatchEventType } from '../../domain/enums'
import { csColor, formatFinance } from '../utils/formatters'
import { FixtureStatus } from '../../domain/enums'
import type { EventChoice } from '../../domain/entities/GameEvent'

function choiceStyle(choiceId: string): React.CSSProperties {
  if (choiceId === 'accept' || choiceId === 'extend3') {
    return { background: 'var(--accent)', color: 'var(--text-light)', border: 'none' }
  }
  if (choiceId === 'reject') {
    return { background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.35)' }
  }
  return { background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }
}

export function GranskaScreen() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const roundSummary = useGameStore(s => s.roundSummary)
  const clearRoundSummary = useGameStore(s => s.clearRoundSummary)
  const resolveEvent = useGameStore(s => s.resolveEvent)
  const [visible, setVisible] = useState(false)
  const [resolvedEventIds, setResolvedEventIds] = useState<Set<string>>(new Set())
  const [chosenLabels, setChosenLabels] = useState<Record<string, string>>({})
  const [soundsPlayed, setSoundsPlayed] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!roundSummary && !game?.lastCompletedFixtureId) {
      navigate('/game/dashboard', { replace: true })
    }
  }, [roundSummary, game, navigate])

  useEffect(() => {
    if (!roundSummary || soundsPlayed) return
    setSoundsPlayed(true)
    const csDelta = (roundSummary.communityStandingAfter ?? 0) - (roundSummary.communityStandingBefore ?? roundSummary.communityStandingAfter ?? 0)
    if (csDelta > 0) setTimeout(() => playSound('communityUp'), 400)
    else if (csDelta < 0) setTimeout(() => playSound('communityDown'), 400)
    if (roundSummary.youthMatchResult?.includes('vann')) setTimeout(() => playSound('youthGoal'), 600)
  }, [roundSummary, soundsPlayed])

  if (!game) return null

  const fixture = game.lastCompletedFixtureId
    ? game.fixtures.find(f => f.id === game.lastCompletedFixtureId)
    : undefined

  const homeClub = fixture ? game.clubs.find(c => c.id === fixture.homeClubId) : undefined
  const awayClub = fixture ? game.clubs.find(c => c.id === fixture.awayClubId) : undefined
  const isHome = fixture?.homeClubId === game.managedClubId
  const myScore = fixture ? (isHome ? fixture.homeScore : fixture.awayScore) : 0
  const theirScore = fixture ? (isHome ? fixture.awayScore : fixture.homeScore) : 0

  const penResult = fixture?.penaltyResult
  const otResult = fixture?.overtimeResult
  const wonByPenalties = penResult ? (isHome ? penResult.home > penResult.away : penResult.away > penResult.home) : false
  const lostByPenalties = penResult ? (isHome ? penResult.home < penResult.away : penResult.away < penResult.home) : false
  const wonByOT = otResult ? (isHome ? otResult === 'home' : otResult === 'away') : false
  const lostByOT = otResult ? (isHome ? otResult === 'away' : otResult === 'home') : false
  const won = myScore > theirScore || wonByOT || wonByPenalties
  const lost = myScore < theirScore || lostByOT || lostByPenalties

  const resultColor = won ? 'var(--success)' : lost ? 'var(--danger)' : 'var(--accent)'
  const resultLabel = wonByPenalties ? 'SEGER (straffar)'
    : lostByPenalties ? 'FÖRLUST (straffar)'
    : wonByOT ? 'SEGER (förl.)'
    : lostByOT ? 'FÖRLUST (förl.)'
    : won ? 'SEGER' : lost ? 'FÖRLUST' : 'OAVGJORT'

  const potmId = fixture?.report?.playerOfTheMatchId
  const potm = potmId ? game.players.find(p => p.id === potmId) : null
  const potmRating = potmId ? fixture?.report?.playerRatings[potmId] : null

  // Key moments
  const keyMoments = fixture?.events
    .filter(e => e.type === MatchEventType.Goal || e.type === MatchEventType.RedCard)
    .sort((a, b) => a.minute - b.minute) ?? []

  // Round summary data
  const rs = roundSummary
  const standing = game.standings.find(s => s.clubId === game.managedClubId)
  const standingBefore = rs ? (rs as any).standingBefore ?? null : null
  const financesDelta = rs ? rs.financesAfter - rs.financesBefore : 0
  const csDelta = rs ? rs.communityStandingAfter - (rs.communityStandingBefore ?? rs.communityStandingAfter) : 0
  const cs = rs?.communityStandingAfter ?? game.communityStanding ?? 50

  // Other matches this matchday
  const currentMatchday = fixture?.matchday ?? 0
  const otherResults = currentMatchday > 0
    ? game.fixtures.filter(f =>
        f.matchday === currentMatchday &&
        f.status === FixtureStatus.Completed &&
        f.homeClubId !== game.managedClubId &&
        f.awayClubId !== game.managedClubId
      )
    : []
  const getClubShort = (id: string) => game.clubs.find(c => c.id === id)?.shortName ?? game.clubs.find(c => c.id === id)?.name ?? '?'

  // Pending events (inline)
  const pendingEvents = game.pendingEvents ?? []

  function handleChoice(eventId: string, choiceId: string, choiceLabel: string) {
    playSound('click')
    setResolvedEventIds(prev => new Set([...prev, eventId]))
    setChosenLabels(prev => ({ ...prev, [eventId]: choiceLabel }))
    resolveEvent(eventId, choiceId)
  }

  function handleContinue() {
    clearRoundSummary()
    navigate('/game/dashboard', { replace: true })
  }

  const fadeIn = (i: number) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(12px)',
    transition: `all 0.35s ease ${80 + i * 60}ms`,
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div className="texture-wood card-stack" style={{ flex: 1, overflowY: 'auto', paddingTop: 12, paddingBottom: 120 }}>

        {/* ── RESULTAT-HERO ── */}
        {fixture && (
          <div className="card-sharp" style={{ margin: '0 0 6px', ...fadeIn(0) }}>
            <div style={{ padding: '16px 14px 12px', textAlign: 'center' }}>
              <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 10 }}>
                SLUTRESULTAT
              </p>

              {/* Club names */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', flex: 1, textAlign: 'left' }}>{homeClub?.shortName ?? homeClub?.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', flex: 1, textAlign: 'right' }}>{awayClub?.shortName ?? awayClub?.name}</span>
              </div>

              {/* Big score */}
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

              {/* Result pill */}
              <span style={{
                display: 'inline-block', padding: '4px 14px', borderRadius: 20,
                background: won ? 'rgba(90,154,74,0.12)' : lost ? 'rgba(176,80,64,0.12)' : 'rgba(245,241,235,0.08)',
                border: `1px solid ${won ? 'rgba(90,154,74,0.3)' : lost ? 'rgba(176,80,64,0.3)' : 'rgba(245,241,235,0.2)'}`,
                color: resultColor, fontSize: 11, fontWeight: 700, letterSpacing: '1px', marginBottom: 8,
              }}>
                {resultLabel}
              </span>

              {/* POTM + attendance */}
              {potm && potmRating != null && (
                <p style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4 }}>⭐ {potm.firstName} {potm.lastName} · {potmRating.toFixed(1)}</p>
              )}
              {fixture.attendance != null && (
                <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>🏟️ {fixture.attendance} åskådare</p>
              )}
            </div>
          </div>
        )}

        {/* ── NYCKELMOMENT ── */}
        {keyMoments.length > 0 && (
          <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px', ...fadeIn(1) }}>
            <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 8 }}>
              NYCKELMOMENT
            </p>
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

        {/* ── EVENTS INLINE ── */}
        {pendingEvents.map((event, ei) => {
          const resolved = resolvedEventIds.has(event.id)
          const chosenLabel = chosenLabels[event.id]
          const relatedPlayer = event.relatedPlayerId ? game.players.find(p => p.id === event.relatedPlayerId) : null
          const relatedClub = event.relatedClubId ? game.clubs.find(c => c.id === event.relatedClubId) : null

          return (
            <div key={event.id} className="card-sharp" style={{ margin: '0 0 6px', ...fadeIn(2 + ei) }}>
              <div style={{ padding: '12px 12px' }}>
                <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: resolved ? 6 : 10 }}>
                  {event.sender ? `${event.sender.name}, ${event.sender.role}` : 'Händelse'}
                </p>

                {resolved ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--success)' }}>✓</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>{chosenLabel}</span>
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.3 }}>{event.title}</p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12, whiteSpace: 'pre-line' }}>{event.body}</p>

                    {(relatedPlayer || relatedClub) && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                        {relatedPlayer && (
                          <span style={{ fontSize: 12, background: 'rgba(196,122,58,0.1)', border: '1px solid rgba(196,122,58,0.3)', borderRadius: 20, padding: '4px 10px', color: 'var(--accent)', fontWeight: 600 }}>
                            {relatedPlayer.firstName} {relatedPlayer.lastName} · Styrka {Math.round(relatedPlayer.currentAbility)}
                          </span>
                        )}
                        {relatedClub && (
                          <span style={{ fontSize: 12, background: 'rgba(126,179,212,0.10)', border: '1px solid rgba(126,179,212,0.25)', borderRadius: 20, padding: '4px 10px', color: 'var(--ice)', fontWeight: 600 }}>
                            {relatedClub.name}
                          </span>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {event.choices.map((choice: EventChoice) => (
                        <button
                          key={choice.id}
                          onClick={() => handleChoice(event.id, choice.id, choice.label)}
                          style={{
                            width: '100%', padding: '12px 14px', borderRadius: 10,
                            fontSize: 13, fontWeight: 600, textAlign: 'left', cursor: 'pointer',
                            ...choiceStyle(choice.id),
                          }}
                        >
                          {choice.label}
                          {choice.subtitle && <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{choice.subtitle}</p>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        })}

        {/* ── OMGÅNGSSAMMANFATTNING ── */}
        {rs && (
          <div className="card-sharp" style={{ margin: '0 0 6px', ...fadeIn(3) }}>
            <div style={{ padding: '10px 12px' }}>
              <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 8 }}>
                OMGÅNGSSAMMANFATTNING
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {standing && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate('/game/tabell')}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>📊 Tabellplacering</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                      {standingBefore && standingBefore !== standing.position
                        ? `${standingBefore} → ${standing.position} ${standingBefore > standing.position ? '↑' : '↓'}`
                        : `${standing.position}:a`
                      }
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate('/game/club', { state: { tab: 'ekonomi' } })}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>💰 Ekonomi</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: financesDelta >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {formatFinance(financesDelta)}/omg
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate('/game/club', { state: { tab: 'orten' } })}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>🏘 Bygdens puls</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: csColor(cs) }}>
                    {csDelta !== 0
                      ? `${rs.communityStandingBefore ?? cs} → ${cs} ${csDelta > 0 ? '↑' : '↓'}`
                      : `${cs}`
                    }
                  </span>
                </div>
                {rs.injuries && rs.injuries.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate('/game/squad')}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>🩹 Skador</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--danger)' }}>{rs.injuries.join(', ')}</span>
                  </div>
                )}
                {rs.youthMatchResult && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate('/game/club', { state: { tab: 'akademi' } })}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>🎓 P19</span>
                    <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{rs.youthMatchResult}</span>
                  </div>
                )}
                {rs.newInboxCount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', cursor: 'pointer' }} onClick={() => navigate('/game/inbox')}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>📬 Inkorg</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{rs.newInboxCount} nya</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── ANDRA MATCHER ── */}
        {otherResults.length > 0 && (
          <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px', ...fadeIn(4) }}>
            <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 6 }}>
              🏒 ANDRA MATCHER
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {otherResults.map(f => {
                const homeWon = (f.homeScore ?? 0) > (f.awayScore ?? 0)
                const awayWon = (f.awayScore ?? 0) > (f.homeScore ?? 0)
                return (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', padding: '3px 0' }}>
                    <span style={{ flex: 1, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: homeWon ? 700 : 400, color: homeWon ? 'var(--text-primary)' : 'var(--text-muted)' }}>{getClubShort(f.homeClubId)}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', width: 40, textAlign: 'center', flexShrink: 0 }}>{f.homeScore}–{f.awayScore}</span>
                    <span style={{ flex: 1, fontSize: 11, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: awayWon ? 700 : 400, color: awayWon ? 'var(--text-primary)' : 'var(--text-muted)' }}>{getClubShort(f.awayClubId)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── CTA ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430, padding: '12px 20px',
        paddingBottom: 'calc(12px + var(--safe-bottom, 0px))',
        background: 'linear-gradient(to top, var(--bg) 80%, transparent)',
        zIndex: 50, opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease 0.3s',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {(() => {
          const unresolved = pendingEvents.filter(e => !resolvedEventIds.has(e.id)).length
          if (unresolved === 0) return null
          return (
            <p style={{ fontSize: 10, color: 'var(--warning)', textAlign: 'center', margin: '0 0 4px' }}>
              {unresolved} ohanterad{unresolved > 1 ? 'e' : ''} händelse{unresolved > 1 ? 'r' : ''} — du kan hantera dem senare
            </p>
          )
        })()}
        {fixture && (
          <button
            onClick={() => navigate('/game/match', { state: { showReport: true } })}
            className="btn btn-ghost"
            style={{ width: '100%', padding: '11px', justifyContent: 'center', fontSize: 13 }}
          >
            Se fullständig matchrapport →
          </button>
        )}
        <button onClick={handleContinue} className="texture-leather" style={{
          width: '100%', padding: '15px',
          background: 'linear-gradient(135deg, var(--accent-dark), var(--accent-deep))',
          color: 'var(--text-light)',
          borderRadius: 12, fontSize: 15, fontWeight: 600, letterSpacing: '2px',
          textTransform: 'uppercase', border: 'none', fontFamily: 'var(--font-body)',
          cursor: 'pointer',
        }}>
          Nästa omgång →
        </button>
      </div>
    </div>
  )
}
