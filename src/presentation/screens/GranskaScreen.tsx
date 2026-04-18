import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { playSound } from '../audio/soundEffects'
import { MatchEventType, InboxItemType } from '../../domain/enums'
import { csColor, formatFinance } from '../utils/formatters'
import { formatArenaName } from '../../domain/utils/arenaName'
import { FixtureStatus } from '../../domain/enums'
import { getRivalry } from '../../domain/data/rivalries'
import type { EventChoice } from '../../domain/entities/GameEvent'
import type { Fixture } from '../../domain/entities/Fixture'
import type { Player } from '../../domain/entities/Player'
import { SectionLabel } from '../components/SectionLabel'
import { generateInsandare } from '../../domain/services/insandareService'
import { generatePostMatchOpponentQuote } from '../../domain/services/opponentManagerService'
import { generateSilentMatchReport } from '../../domain/services/silentMatchReportService'

function choiceStyle(_choiceId: string): React.CSSProperties {
  return { background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }
}

function generateQuickSummary(fixture: Fixture, managedIsHome: boolean, players: Player[]): string {
  const homeScore = fixture.homeScore
  const awayScore = fixture.awayScore
  const myScore = managedIsHome ? homeScore : awayScore
  const theirScore = managedIsHome ? awayScore : homeScore
  const margin = myScore - theirScore
  const totalGoals = homeScore + awayScore

  const goals = fixture.events.filter(e => e.type === MatchEventType.Goal)
  const lateGoals = goals.filter(e => (e.minute ?? 0) >= 55)
  const lateDecider = lateGoals.length > 0 && Math.abs(margin) <= 1

  // Scorer summary
  const scorerCounts: Record<string, number> = {}
  const scorerNames: Record<string, string> = {}
  goals.forEach(e => {
    if (e.playerId) {
      scorerCounts[e.playerId] = (scorerCounts[e.playerId] ?? 0) + 1
      const p = players.find(pl => pl.id === e.playerId)
      scorerNames[e.playerId] = p ? p.lastName : 'Okänd'
    }
  })
  const allScorers = Object.entries(scorerCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([pid, n]) => ({ name: scorerNames[pid] ?? 'Okänd', n }))

  function scorerLine(): string | null {
    if (allScorers.length === 0) return null
    if (allScorers.length === 1 && allScorers[0].n === 1) return `${allScorers[0].name} satte det enda målet.`
    if (allScorers.length === 1) return `${allScorers[0].name} svarade för samtliga ${allScorers[0].n} mål.`
    const top = allScorers[0]
    if (top.n >= 3) return `${top.name} dominerade målprotokollen med ${top.n} mål.`
    if (top.n === 2) return `${top.name} sköt två. Övriga: ${allScorers.slice(1).map(s => s.name).join(', ')}.`
    return allScorers.slice(0, 4).map(s => `${s.name} (${s.n})`).join(', ') + '.'
  }

  const lines: string[] = []

  if (myScore > theirScore) {
    if (margin >= 4) {
      lines.push(`Stormatch. ${myScore}–${theirScore} och det var aldrig i närheten av en dramatisk avslutning.`)
      if (totalGoals >= 10) lines.push(`${totalGoals} mål totalt — publiken fick valuta för pengarna.`)
    } else if (margin >= 2) {
      lines.push(`Kontrollerad seger, ${myScore}–${theirScore}. Laget tog täten och höll den.`)
    } else if (lateDecider) {
      lines.push(`Nervpirrande till det sista. Avgörandet kom sent och slutade ${myScore}–${theirScore}.`)
    } else {
      lines.push(`Knapp seger, ${myScore}–${theirScore}. Jämnt länge men laget hade den avgörande kvaliteten när det gällde.`)
    }
  } else if (myScore < theirScore) {
    if (margin <= -4) {
      lines.push(`Tungt. ${myScore}–${theirScore} och motståndarna visade varför de är ett hot.`)
    } else if (margin <= -2) {
      lines.push(`${myScore}–${theirScore}. Motståndarna var ett snäpp bättre i de flesta delar av spelet.`)
    } else if (lateDecider) {
      lines.push(`Länge jämnt, men ett sent mål fällde avgörandet till motståndarnas fördel. ${myScore}–${theirScore}.`)
    } else {
      lines.push(`${myScore}–${theirScore}. Motståndarna var starkare idag — det är svårt att säga något annat.`)
    }
  } else {
    if (totalGoals >= 8) {
      lines.push(`Målfest och rättvis poängdelning, ${myScore}–${theirScore}. ${totalGoals} mål och publiken var med hela vägen.`)
    } else if (totalGoals === 0) {
      lines.push(`Mållöst kryss. Båda lagen var defensivt solida men offensivt utan genomslag.`)
    } else if (lateDecider) {
      lines.push(`Utjämning sent höll kryss vid liv — ${myScore}–${theirScore}.`)
    } else {
      lines.push(`Rättvis poängdelning, ${myScore}–${theirScore}. Båda lagen hade sina perioder.`)
    }
  }

  const sc = scorerLine()
  if (sc) lines.push(sc)

  return lines.join(' ')
}

export function GranskaScreen() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const roundSummary = useGameStore(s => s.roundSummary)
  const clearRoundSummary = useGameStore(s => s.clearRoundSummary)
  const advance = useGameStore(s => s.advance)
  const resolveEvent = useGameStore(s => s.resolveEvent)
  const [visible, setVisible] = useState(false)
  const [resolvedEventIds, setResolvedEventIds] = useState<Set<string>>(new Set())
  const [chosenLabels, setChosenLabels] = useState<Record<string, string>>({})
  const [soundsPlayed, setSoundsPlayed] = useState(false)
  const didAdvance = useRef(false)
  const didRedirect = useRef(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (roundSummary) return
    if (!game?.lastCompletedFixtureId) {
      navigate('/game/dashboard', { replace: true })
      return
    }
    // Live match: advance() was never called. Process the remaining matchday now.
    // Guard: if this fixture's matchday was already processed (e.g. remount after back navigation),
    // skip advance() to prevent double side-effects.
    const liveFixture = game.fixtures.find(f => f.id === game.lastCompletedFixtureId)
    const alreadyProcessed = liveFixture && game.lastProcessedMatchday === liveFixture.matchday
    if (!didAdvance.current && !alreadyProcessed) {
      didAdvance.current = true
      advance(true)
    } else if (alreadyProcessed && !didRedirect.current) {
      didRedirect.current = true
      navigate('/game/dashboard', { replace: true })
    }
  }, [roundSummary, game, navigate, advance])

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
  const standingBefore = rs?.standingBefore ?? null
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
    setTimeout(() => resolveEvent(eventId, choiceId), 600)
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
      <div className="texture-wood card-stack" style={{ flex: 1, overflowY: 'auto', paddingTop: 12, paddingBottom: 'var(--scroll-padding-bottom)' }}>

        {/* ── RESULTAT-HERO ── */}
        {fixture && (
          <div className="card-sharp" style={{ margin: '0 0 6px', ...fadeIn(0) }}>
            <div style={{ padding: '16px 14px 12px', textAlign: 'center' }}>
              <SectionLabel style={{ marginBottom: 10 }}>SLUTRESULTAT</SectionLabel>

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
              {homeClub?.arenaName && !fixture.isNeutralVenue && (
                <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, fontStyle: 'italic' }}>Spelades på {formatArenaName(homeClub.arenaName)}</p>
              )}

              {/* Match summary — prose report for silent mode, quick summary otherwise */}
              {(() => {
                if (game.preferredMatchMode === 'silent') {
                  const homeClubName = game.clubs.find(c => c.id === fixture.homeClubId)?.name ?? ''
                  const awayClubName = game.clubs.find(c => c.id === fixture.awayClubId)?.name ?? ''
                  const report = generateSilentMatchReport(fixture, homeClubName, awayClubName, game.managedClubId)
                  return (
                    <div style={{
                      marginTop: 12, padding: '10px 12px',
                      background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
                      textAlign: 'left',
                    }}>
                      {report.split('\n\n').map((para, i) => (
                        <p key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: i < 2 ? 10 : 0, fontStyle: i === 0 ? 'normal' : 'normal' }}>
                          {para}
                        </p>
                      ))}
                    </div>
                  )
                }
                const summary = generateQuickSummary(fixture, isHome, game.players)
                return summary ? (
                  <p style={{
                    fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5,
                    marginTop: 12, padding: '10px 12px',
                    background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
                    textAlign: 'left',
                  }}>
                    {summary}
                  </p>
                ) : null
              })()}
            </div>
          </div>
        )}

        {/* ── TIDNINGSRUBRIK ── */}
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
            <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px', ...fadeIn(1) }}>
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

        {/* ── INSÄNDARE (DREAM-015) ── */}
        {(() => {
          if (!fixture) return null
          const insandare = generateInsandare(game, fixture)
          if (!insandare) return null
          return (
            <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px' }}>
              <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '2px', color: 'var(--text-muted)', marginBottom: 6 }}>
                ✉️ INSÄNDARE
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontStyle: 'italic', lineHeight: 1.5 }}>
                "{insandare.text}"
              </p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                — {insandare.signature}
              </p>
            </div>
          )
        })()}

        {/* ── NYCKELMOMENT ── */}
        {keyMoments.length > 0 && (
          <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px', ...fadeIn(1) }}>
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

        {/* ── MOTSTÅNDARTRÄNARE — visas vid storseger/storseger för motståndare (≥3 mål) ── */}
        {(() => {
          const margin = myScore - theirScore
          if (Math.abs(margin) < 3) return null
          const opponentClub = isHome ? awayClub : homeClub
          if (!opponentClub) return null
          const theyWon = margin < 0
          const quote = generatePostMatchOpponentQuote(opponentClub, theyWon)
          if (!quote) return null
          return (
            <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px', ...fadeIn(2) }}>
              <SectionLabel style={{ marginBottom: 6 }}>🎙 MOTSTÅNDET SÄGER</SectionLabel>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
                {quote}
              </p>
            </div>
          )
        })()}

        {/* ── PRESSKONFERENS INLINE (WEAK-002) — visas direkt efter match, före övriga events ── */}
        {(() => {
          const pc = game.pendingPressConference
          if (!pc) return null
          const pcResolved = resolvedEventIds.has(pc.id)
          const pcChosenLabel = chosenLabels[pc.id]
          return (
            <div className="card-sharp" style={{ margin: '0 0 6px', ...fadeIn(2) }}>
              <div style={{ padding: '10px 12px' }}>
                <SectionLabel style={{ marginBottom: pcResolved ? 4 : 6 }}>🎤 PRESSKONFERENS</SectionLabel>
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
                        <button
                          key={choice.id}
                          onClick={() => handleChoice(pc.id, choice.id, choice.label)}
                          style={{
                            width: '100%', padding: '9px 12px', borderRadius: 8,
                            fontSize: 12, fontWeight: 600, textAlign: 'left', cursor: 'pointer',
                            ...choiceStyle(choice.id),
                          }}
                        >
                          {choice.label}
                          {choice.subtitle && (
                            <span style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)', fontWeight: 400, marginTop: 2 }}>{choice.subtitle}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        })()}

        {/* ── EVENTS INLINE ── */}
        {pendingEvents.map((event, ei) => {
          const resolved = resolvedEventIds.has(event.id)
          const chosenLabel = chosenLabels[event.id]
          const relatedPlayer = event.relatedPlayerId ? game.players.find(p => p.id === event.relatedPlayerId) : null
          const relatedClub = event.relatedClubId ? game.clubs.find(c => c.id === event.relatedClubId) : null

          return (
            <div key={event.id} className="card-sharp" style={{ margin: '0 0 6px', ...fadeIn(2 + ei) }}>
              <div style={{ padding: '10px 12px' }}>
                <SectionLabel style={{ marginBottom: resolved ? 4 : 6 }}>
                  {event.sender ? `${event.sender.name}, ${event.sender.role}` : 'Händelse'}
                </SectionLabel>

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
                        {relatedPlayer && (
                          <span style={{ fontSize: 11, background: 'rgba(196,122,58,0.1)', border: '1px solid rgba(196,122,58,0.3)', borderRadius: 20, padding: '3px 8px', color: 'var(--accent)', fontWeight: 600 }}>
                            {relatedPlayer.firstName} {relatedPlayer.lastName} · Styrka {Math.round(relatedPlayer.currentAbility)}
                          </span>
                        )}
                        {relatedClub && (
                          <span style={{ fontSize: 11, background: 'rgba(126,179,212,0.10)', border: '1px solid rgba(126,179,212,0.25)', borderRadius: 20, padding: '3px 8px', color: 'var(--ice)', fontWeight: 600 }}>
                            {relatedClub.name}
                          </span>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {event.choices.map((choice: EventChoice) => (
                        <button
                          key={choice.id}
                          onClick={() => handleChoice(event.id, choice.id, choice.label)}
                          style={{
                            position: 'relative', zIndex: 1,
                            width: '100%', padding: '9px 12px', borderRadius: 8,
                            fontSize: 12, fontWeight: 600, textAlign: 'left', cursor: 'pointer',
                            ...choiceStyle(choice.id),
                          }}
                        >
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

        {/* ── OMGÅNGSSAMMANFATTNING ── */}
        {rs && (
          <div className="card-sharp" style={{ margin: '0 0 6px', ...fadeIn(3) }}>
            <div style={{ padding: '10px 12px' }}>
              <SectionLabel style={{ marginBottom: 8 }}>OMGÅNGSSAMMANFATTNING</SectionLabel>
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
                  <div style={{ padding: '4px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate('/game/squad')}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>🩹 Skador</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 3 }}>
                      {rs.injuries.map((inj, i) => (
                        <span key={i} style={{ fontSize: 12, fontWeight: 600, color: 'var(--danger)' }}>{inj}</span>
                      ))}
                    </div>
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
        {otherResults.length > 0 && (() => {
          // Find rival club (if any)
          const rivalClubId = game.clubs
            .filter(c => c.id !== game.managedClubId)
            .find(c => getRivalry(game.managedClubId, c.id))?.id ?? null

          // Rival summary: find rival result + new position
          let rivalSummary: string | null = null
          if (rivalClubId) {
            const rivalFixture = otherResults.find(f => f.homeClubId === rivalClubId || f.awayClubId === rivalClubId)
            if (rivalFixture) {
              const rivalIsHome = rivalFixture.homeClubId === rivalClubId
              const rivalScore = rivalIsHome ? rivalFixture.homeScore : rivalFixture.awayScore
              const oppScore = rivalIsHome ? rivalFixture.awayScore : rivalFixture.homeScore
              const rivalWon = rivalScore > oppScore
              const rivalDrew = rivalScore === oppScore
              const rivalPos = game.standings.find(s => s.clubId === rivalClubId)?.position
              const rivalName = game.clubs.find(c => c.id === rivalClubId)?.shortName ?? game.clubs.find(c => c.id === rivalClubId)?.name ?? 'Rivalen'
              const resultWord = rivalWon ? 'vann' : rivalDrew ? 'spelade kryss' : 'förlorade'
              rivalSummary = rivalPos
                ? `${rivalName} ${resultWord} — nu på plats ${rivalPos}`
                : `${rivalName} ${resultWord}`
            }
          }

          return (
            <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px', ...fadeIn(4) }}>
              <SectionLabel style={{ marginBottom: 6 }}>🏒 ANDRA MATCHER</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {otherResults.map(f => {
                  const homeWon = (f.homeScore ?? 0) > (f.awayScore ?? 0)
                  const awayWon = (f.awayScore ?? 0) > (f.homeScore ?? 0)
                  const isRivalMatch = rivalClubId && (f.homeClubId === rivalClubId || f.awayClubId === rivalClubId)
                  return (
                    <div key={f.id} style={{
                      display: 'flex', alignItems: 'center', padding: '3px 0 3px 6px',
                      borderLeft: isRivalMatch ? '2px solid var(--accent)' : '2px solid transparent',
                    }}>
                      <span style={{ flex: 1, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: homeWon ? 700 : 400, color: homeWon ? 'var(--text-primary)' : 'var(--text-muted)' }}>{getClubShort(f.homeClubId)}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', width: 40, textAlign: 'center', flexShrink: 0 }}>{f.homeScore}–{f.awayScore}</span>
                      <span style={{ flex: 1, fontSize: 11, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: awayWon ? 700 : 400, color: awayWon ? 'var(--text-primary)' : 'var(--text-muted)' }}>{getClubShort(f.awayClubId)}</span>
                    </div>
                  )
                })}
              </div>
              {rivalSummary && (
                <p style={{ fontSize: 11, color: 'var(--accent)', marginTop: 6, fontStyle: 'italic' }}>{rivalSummary}</p>
              )}
            </div>
          )
        })()}
        {/* ── SCOUTING ── */}
        {(() => {
          const scoutItems = game.inbox
            .filter(i => i.type === InboxItemType.ScoutReport && !i.isRead)
            .slice(-2)
          if (scoutItems.length === 0) return null
          return (
            <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px', ...fadeIn(5) }}>
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

      </div>

      {/* ── CTA ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430, padding: '12px 20px',
        paddingBottom: 'calc(12px + var(--safe-bottom, 0px))',
        background: 'linear-gradient(to top, var(--bg) 80%, transparent)',
        zIndex: 50, opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease 0.3s',
        display: 'flex', flexDirection: 'column', gap: 8,
        pointerEvents: 'none',
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
            style={{ width: '100%', padding: '11px', justifyContent: 'center', fontSize: 13, pointerEvents: 'auto' }}
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
          cursor: 'pointer', pointerEvents: 'auto',
        }}>
          Nästa omgång →
        </button>
      </div>
    </div>
  )
}
