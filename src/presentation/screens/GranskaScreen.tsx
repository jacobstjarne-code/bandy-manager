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
import { getPortraitSvg } from '../../domain/services/portraitService'
import { generateCoachQuote } from '../../domain/services/assistantCoachService'

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
    if (margin >= 4) lines.push('En övertygande seger.')
    else if (margin === 3) lines.push('En klar seger.')
    else if (margin === 2) lines.push('En välförtjänt seger.')
    else if (lateDecider) lines.push('En dramatisk seger i slutminuterna.')
    else lines.push('En knapp men viktig seger.')
  } else if (myScore < theirScore) {
    if (margin <= -4) lines.push('En tungt matchdag att glömma.')
    else if (margin === -3) lines.push('En klar förlust.')
    else if (lateDecider) lines.push('En bitter förlust i matchens slutskede.')
    else lines.push('En förlust att analysera.')
  } else {
    lines.push('En poäng som känns som en förlust — eller en vinst, beroende på perspektiv.')
  }

  const sl = scorerLine()
  if (sl) lines.push(sl)

  if (totalGoals >= 10) lines.push('Många mål i en öppen match.')
  else if (totalGoals <= 2) lines.push('En tät och defensiv drabbning.')

  return lines.join(' ')
}

// Seeded random for shot map positions
function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

type GranskaStep = 'oversikt' | 'spelare' | 'shotmap' | 'forlop' | 'analys'

const STEPS: { id: GranskaStep; icon: string; label: string }[] = [
  { id: 'oversikt', icon: '🎯', label: 'Översikt' },
  { id: 'spelare', icon: '👥', label: 'Spelare' },
  { id: 'shotmap', icon: '📈', label: 'Shotmap' },
  { id: 'forlop', icon: '⚡', label: 'Förlopp' },
  { id: 'analys', icon: '🎓', label: 'Analys' },
]

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
  const [step, setStep] = useState<GranskaStep>('oversikt')
  const [visitedSteps, setVisitedSteps] = useState<Set<GranskaStep>>(new Set(['oversikt']))
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
  const g = game  // narrowed SaveGame — used by nested render functions

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

  const keyMoments = fixture?.events
    .filter(e => e.type === MatchEventType.Goal || e.type === MatchEventType.RedCard)
    .sort((a, b) => a.minute - b.minute) ?? []

  const rs = roundSummary
  const standing = game.standings.find(s => s.clubId === game.managedClubId)
  const standingBefore = rs?.standingBefore ?? null
  const financesDelta = rs ? rs.financesAfter - rs.financesBefore : 0
  const csDelta = rs ? rs.communityStandingAfter - (rs.communityStandingBefore ?? rs.communityStandingAfter) : 0
  const cs = rs?.communityStandingAfter ?? game.communityStanding ?? 50

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

  function goToStep(s: GranskaStep) {
    setStep(s)
    setVisitedSteps(prev => new Set([...prev, s]))
  }

  const fadeIn = (i: number) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(12px)',
    transition: `all 0.35s ease ${80 + i * 60}ms`,
  })

  // ── STEP: ÖVERSIKT ────────────────────────────────────────────────────────
  function renderOversikt() {
    const game = g
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
            <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px', ...fadeIn(2) }}>
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
          <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px', ...fadeIn(3) }}>
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
          const quote = generatePostMatchOpponentQuote(opponentClub, theyWon)
          if (!quote) return null
          return (
            <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px' }}>
              <SectionLabel style={{ marginBottom: 6 }}>🎙 MOTSTÅNDET SÄGER</SectionLabel>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>{quote}</p>
            </div>
          )
        })()}

        {/* Presskonferens */}
        {(() => {
          const pc = game.pendingPressConference
          if (!pc) return null
          const pcResolved = resolvedEventIds.has(pc.id)
          const pcChosenLabel = chosenLabels[pc.id]
          return (
            <div className="card-sharp" style={{ margin: '0 0 6px', ...fadeIn(4) }}>
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
                        <button key={choice.id} onClick={() => handleChoice(pc.id, choice.id, choice.label)}
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

        {/* Events */}
        {pendingEvents.map((event, ei) => {
          const resolved = resolvedEventIds.has(event.id)
          const chosenLabel = chosenLabels[event.id]
          const relatedPlayer = event.relatedPlayerId ? game.players.find(p => p.id === event.relatedPlayerId) : null
          const relatedClub = event.relatedClubId ? game.clubs.find(c => c.id === event.relatedClubId) : null
          return (
            <div key={event.id} className="card-sharp" style={{ margin: '0 0 6px', ...fadeIn(5 + ei) }}>
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
                        <button key={choice.id} onClick={() => handleChoice(event.id, choice.id, choice.label)}
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
      </>
    )
  }

  // ── STEP: SPELARE ─────────────────────────────────────────────────────────
  function renderSpelare() {
    const game = g
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

    function ratingColor(r: number): string {
      if (r >= 8) return 'var(--success)'
      if (r >= 6.5) return 'var(--text-primary)'
      if (r >= 5) return 'var(--text-secondary)'
      return 'var(--danger)'
    }

    return (
      <>
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

  // ── STEP: SHOT MAP ────────────────────────────────────────────────────────
  function renderShotmap() {
    const game = g
    if (!fixture?.report) return null

    const managedClubId = isHome ? fixture.homeClubId : fixture.awayClubId
    const goals = fixture.events.filter(e => e.type === MatchEventType.Goal && e.clubId === managedClubId)
    const saves = fixture.events.filter(e => e.type === MatchEventType.Save && e.clubId !== managedClubId)

    const totalShots = isHome ? fixture.report.shotsHome : fixture.report.shotsAway
    const scoredCount = goals.length
    const savedCount = Math.min(saves.length, totalShots - scoredCount)
    const missCount = Math.max(0, totalShots - scoredCount - savedCount)

    // Generate seeded positions in attack half (SVG: 280×190 viewBox, goal at top center)
    const GOAL_Y = 20
    const GOAL_X = 140
    const W = 280
    const H = 190

    type ShotDot = { x: number; y: number; kind: 'goal' | 'save' | 'miss'; label?: string }
    const dots: ShotDot[] = []
    let seed = 0

    function nextPos(kind: 'goal' | 'save' | 'miss', playerId?: string): { x: number; y: number } {
      seed++
      const r1 = seededRand(seed * 7 + (playerId ? playerId.charCodeAt(0) : 0))
      const r2 = seededRand(seed * 13 + 1)
      let x: number, y: number
      if (kind === 'goal') {
        x = GOAL_X + (r1 - 0.5) * 90
        y = GOAL_Y + 10 + r2 * 80
      } else if (kind === 'save') {
        x = GOAL_X + (r1 - 0.5) * 100
        y = GOAL_Y + 15 + r2 * 100
      } else {
        x = W * 0.1 + r1 * W * 0.8
        y = GOAL_Y + 20 + r2 * 130
      }
      return { x: Math.max(10, Math.min(W - 10, x)), y: Math.max(GOAL_Y + 5, Math.min(H - 10, y)) }
    }

    goals.forEach(e => {
      const pos = nextPos('goal', e.playerId)
      const scorer = e.playerId ? game.players.find(p => p.id === e.playerId) : null
      dots.push({ ...pos, kind: 'goal', label: scorer?.lastName })
    })
    for (let i = 0; i < savedCount; i++) {
      dots.push({ ...nextPos('save'), kind: 'save' })
    }
    for (let i = 0; i < missCount; i++) {
      dots.push({ ...nextPos('miss'), kind: 'miss' })
    }

    const oppShots = isHome ? fixture.report.shotsAway : fixture.report.shotsHome
    const oppGoals = fixture.events.filter(e => e.type === MatchEventType.Goal && e.clubId !== managedClubId).length

    // Opponent shots in lower half (mirrored)
    const OPP_GOAL_Y = H - 20
    type OppDot = { x: number; y: number; kind: 'goal' | 'save' | 'miss' }
    const oppDots: OppDot[] = []
    let oppSeed = 100

    function nextOppPos(kind: 'goal' | 'save' | 'miss'): { x: number; y: number } {
      oppSeed++
      const r1 = seededRand(oppSeed * 11)
      const r2 = seededRand(oppSeed * 17)
      if (kind === 'goal') return { x: GOAL_X + (r1 - 0.5) * 90, y: OPP_GOAL_Y - 10 - r2 * 80 }
      if (kind === 'save') return { x: GOAL_X + (r1 - 0.5) * 100, y: OPP_GOAL_Y - 15 - r2 * 100 }
      return { x: W * 0.1 + r1 * W * 0.8, y: OPP_GOAL_Y - 20 - r2 * 130 }
    }

    const oppGoalCount = fixture.events.filter(e => e.type === MatchEventType.Goal && e.clubId !== managedClubId).length
    const oppSavedCount = Math.min(oppShots - oppGoalCount, oppShots)
    const oppMissCount = Math.max(0, oppShots - oppGoalCount - oppSavedCount)
    for (let i = 0; i < oppGoalCount; i++) oppDots.push({ ...nextOppPos('goal'), kind: 'goal' })
    for (let i = 0; i < oppSavedCount; i++) oppDots.push({ ...nextOppPos('save'), kind: 'save' })
    for (let i = 0; i < oppMissCount; i++) oppDots.push({ ...nextOppPos('miss'), kind: 'miss' })

    return (
      <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px' }}>
        <SectionLabel style={{ marginBottom: 8 }}>SKOTTBILD</SectionLabel>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 320, display: 'block', margin: '0 auto' }}>
            {/* Pitch background */}
            <rect x="0" y="0" width={W} height={H} fill="var(--bg-surface)" rx="4" />
            {/* Goal */}
            <rect x={GOAL_X - 20} y={GOAL_Y - 8} width="40" height="8" fill="var(--border)" />
            <rect x={GOAL_X - 20} y={GOAL_Y - 8} width="1" height="12" fill="var(--border)" />
            <rect x={GOAL_X + 19} y={GOAL_Y - 8} width="1" height="12" fill="var(--border)" />
            {/* Goal area */}
            <rect x={GOAL_X - 40} y={GOAL_Y} width="80" height="30" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            {/* Opponent goal area */}
            <rect x={GOAL_X - 40} y={H - 30} width="80" height="30" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            {/* Center arc */}
            <ellipse cx={GOAL_X} cy={H} rx="80" ry="50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            {/* Center line */}
            <line x1="0" y1={H/2} x2={W} y2={H/2} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3,3" />
            {/* Shot dots */}
            {dots.map((d, i) => (
              <g key={i}>
                <circle
                  cx={d.x} cy={d.y}
                  r={d.kind === 'goal' ? 6 : 4}
                  fill={d.kind === 'goal' ? 'rgba(90,154,74,0.85)' : d.kind === 'save' ? 'rgba(196,122,58,0.7)' : 'rgba(255,255,255,0.2)'}
                  stroke={d.kind === 'goal' ? 'rgba(90,154,74,1)' : d.kind === 'save' ? 'rgba(196,122,58,1)' : 'rgba(255,255,255,0.4)'}
                  strokeWidth="1"
                />
                {d.label && (() => {
                  const angle = (d.label.charCodeAt(0) % 8) * (Math.PI / 4)
                  const lx = d.x + Math.cos(angle) * 12
                  const ly = d.y + Math.sin(angle) * 12 + 2
                  return <text x={lx} y={ly} fontSize="7" fill="rgba(255,255,255,0.7)">{d.label}</text>
                })()}
              </g>
            ))}
            {/* Opponent goal at bottom */}
            <rect x={GOAL_X - 20} y={H - 8} width="40" height="8" fill="var(--border)" />
            <rect x={GOAL_X - 20} y={H - 12} width="1" height="12" fill="var(--border)" />
            <rect x={GOAL_X + 19} y={H - 12} width="1" height="12" fill="var(--border)" />
            {/* Opponent shot dots */}
            {oppDots.map((d, i) => (
              <circle
                key={`opp-${i}`}
                cx={Math.max(10, Math.min(W - 10, d.x))}
                cy={Math.max(10, Math.min(H - 8, d.y))}
                r={d.kind === 'goal' ? 5 : 3}
                fill={d.kind === 'goal' ? 'rgba(176,80,64,0.6)' : d.kind === 'save' ? 'rgba(196,122,58,0.4)' : 'rgba(255,255,255,0.1)'}
                stroke={d.kind === 'goal' ? 'rgba(176,80,64,0.9)' : 'rgba(255,255,255,0.2)'}
                strokeWidth="1"
                opacity="0.6"
              />
            ))}
          </svg>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 8 }}>
          {[
            { color: 'var(--success)', label: `Mål (${scoredCount})` },
            { color: 'var(--accent)', label: `Räddad (${savedCount})` },
            { color: 'rgba(255,255,255,0.3)', label: `Miss (${missCount})` },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* DITT SKOTTMÖNSTER */}
        <div className="card-sharp" style={{ marginTop: 8, padding: '10px 12px' }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2px', color: 'var(--text-muted)', marginBottom: 8 }}>🎯 DITT SKOTTMÖNSTER</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Den här matchen</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
              {totalShots} skott · {totalShots > 0 ? Math.round(scoredCount / totalShots * 100) : 0}% konvertering
            </span>
          </div>
          {(() => {
            // Compute season-to-date stats from all completed managed club fixtures
            const managedClubId = isHome ? fixture.homeClubId : fixture.awayClubId
            const completedFixtures = game.fixtures.filter(f =>
              f.report != null &&
              (f.homeClubId === managedClubId || f.awayClubId === managedClubId) &&
              f.id !== fixture.id
            )
            const seasonShots = completedFixtures.reduce((sum, f) => {
              const h = f.homeClubId === managedClubId
              return sum + (h ? (f.report?.shotsHome ?? 0) : (f.report?.shotsAway ?? 0))
            }, 0)
            const seasonGoals = completedFixtures.reduce((sum, f) => {
              const h = f.homeClubId === managedClubId
              return sum + (h ? f.homeScore : f.awayScore)
            }, 0)
            const seasonConversion = seasonShots > 0 ? Math.round(seasonGoals / seasonShots * 100) : 0
            if (completedFixtures.length === 0) return null
            return (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Säsongen ({completedFixtures.length} matcher)</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {seasonShots} skott · {seasonConversion}%
                  {seasonConversion > (totalShots > 0 ? Math.round(scoredCount / totalShots * 100) : 0) ? ' ▼' : ' ▲'}
                </span>
              </div>
            )
          })()}
        </div>

        {/* MOTSTÅNDAREN */}
        {(() => {
          const oppClubId = isHome ? fixture.awayClubId : fixture.homeClubId
          const oppClub = game.clubs.find(c => c.id === oppClubId)
          const oppSavedByUs = saves.length  // saves by our keeper = opp shots saved
          const oppConversion = oppShots > 0 ? Math.round(oppGoals / oppShots * 100) : 0
          if (!oppClub) return null
          return (
            <div className="card-sharp" style={{ marginTop: 6, padding: '10px 12px' }}>
              <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2px', color: 'var(--text-muted)', marginBottom: 8 }}>
                🛡 {oppClub.name.toUpperCase()}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Skott</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {oppShots} skott · {oppConversion}% konvertering
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Vår MV räddade</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: oppSavedByUs > 0 ? 'var(--success)' : 'var(--text-primary)' }}>
                  {oppSavedByUs} räddningar
                </span>
              </div>
            </div>
          )
        })()}

        {/* INSIKT */}
        {(() => {
          const myConv = totalShots > 0 ? scoredCount / totalShots : 0
          const oppConv = oppShots > 0 ? oppGoals / oppShots : 0
          let insight = ''
          if (myConv > 0.4 && oppConv < 0.2) {
            insight = `Klinisk effektivitet — ni konverterade ${Math.round(myConv * 100)}% av skotten medan motståndaren bara lyckades med ${Math.round(oppConv * 100)}%.`
          } else if (myConv < 0.2 && oppConv > 0.3) {
            insight = `Motståndaren var mer effektiva. Era ${totalShots} skott gav bara ${scoredCount} mål — nästa match handlar om att skapa lägen nära mål.`
          } else if (totalShots > oppShots + 5) {
            insight = `Ni dominerade skottstatistiken (${totalShots} mot ${oppShots}) men konverteringen avgör. Fortsätt pressa på.`
          } else if (oppShots > totalShots + 5) {
            insight = `Motståndaren hade flest skott (${oppShots} mot ${totalShots}). Defensiven behöver hålla linjerna bättre.`
          } else if (scoredCount >= 3 && myConv > 0.35) {
            insight = `Stark offensiv — ${scoredCount} mål på ${totalShots} skott är över ligasnittet. Håll den formen.`
          } else {
            insight = `${totalShots} skott och ${scoredCount} mål. Motståndaren sköt ${oppShots} gånger och sköt ${oppGoals} mål.`
          }
          return (
            <div style={{ marginTop: 6, padding: '8px 10px', background: 'rgba(196,122,58,0.08)', border: '1px solid rgba(196,122,58,0.2)', borderRadius: 6 }}>
              <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1.5px', color: 'var(--accent)', marginBottom: 4 }}>💡 INSIKT</p>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{insight}</p>
            </div>
          )
        })()}
      </div>
    )
  }

  // ── STEP: FÖRLOPP ─────────────────────────────────────────────────────────
  function renderForlop() {
    const game = g
    const allEvents = fixture?.events
      .filter(e => e.type === MatchEventType.Goal || e.type === MatchEventType.RedCard || e.type === MatchEventType.Corner || e.type === MatchEventType.Penalty)
      .sort((a, b) => a.minute - b.minute) ?? []

    return (
      <>
        {/* Other matches */}
        {rs && (
          <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px' }}>
            <SectionLabel style={{ marginBottom: 8 }}>OMGÅNGSSAMMANFATTNING</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {standing && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate('/game/tabell')}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>📊 Tabellplacering</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                    {standingBefore && standingBefore !== standing.position
                      ? `${standingBefore} → ${standing.position} ${standingBefore > standing.position ? '↑' : '↓'}`
                      : `${standing.position}:a`}
                  </span>
                </div>
              )}
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
              {rs.injuries && rs.injuries.length > 0 && (
                <div style={{ padding: '4px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate('/game/squad')}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>🩹 Skador</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 3 }}>
                    {rs.injuries.map((inj, i) => <span key={i} style={{ fontSize: 12, fontWeight: 600, color: 'var(--danger)' }}>{inj}</span>)}
                  </div>
                </div>
              )}
              {rs.youthMatchResult && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate('/game/club', { state: { tab: 'akademi' } })}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>🎓 P19</span>
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

        {/* Match event timeline */}
        {allEvents.length > 0 && (
          <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px' }}>
            <SectionLabel style={{ marginBottom: 8 }}>HÄNDELSETIDSLINJE</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {allEvents.map((e, i) => {
                const isManagedEvent = isHome ? e.clubId === fixture?.homeClubId : e.clubId === fixture?.awayClubId
                const icon = e.type === MatchEventType.Goal ? (e.isCornerGoal ? '📐' : '🏒')
                  : e.type === MatchEventType.Corner ? '🔄'
                  : e.type === MatchEventType.Penalty ? '🎯'
                  : '🟥'
                const p = e.playerId ? game.players.find(pl => pl.id === e.playerId) : null
                const name = p ? `${p.firstName[0]}. ${p.lastName}` : ''
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', width: 22, textAlign: 'right', flexShrink: 0 }}>{e.minute}'</span>
                    <span style={{ fontSize: 11 }}>{icon}</span>
                    <span style={{ fontSize: 11, flex: 1, color: isManagedEvent ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {name || e.description}
                    </span>
                    {!isManagedEvent && <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>mot</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Other results */}
        {otherResults.length > 0 && (() => {
          const rivalClubId = game.clubs
            .filter(c => c.id !== game.managedClubId)
            .find(c => getRivalry(game.managedClubId, c.id))?.id ?? null
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
              const rivalName = game.clubs.find(c => c.id === rivalClubId)?.shortName ?? 'Rivalen'
              const resultWord = rivalWon ? 'vann' : rivalDrew ? 'spelade kryss' : 'förlorade'
              rivalSummary = rivalPos ? `${rivalName} ${resultWord} — nu på plats ${rivalPos}` : `${rivalName} ${resultWord}`
            }
          }
          return (
            <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px' }}>
              <SectionLabel style={{ marginBottom: 6 }}>🏒 ANDRA MATCHER</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {otherResults.map(f => {
                  const homeWon = (f.homeScore ?? 0) > (f.awayScore ?? 0)
                  const awayWon = (f.awayScore ?? 0) > (f.homeScore ?? 0)
                  const isRivalMatch = rivalClubId && (f.homeClubId === rivalClubId || f.awayClubId === rivalClubId)
                  return (
                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', padding: '3px 0 3px 6px', borderLeft: isRivalMatch ? '2px solid var(--accent)' : '2px solid transparent' }}>
                      <span style={{ flex: 1, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: homeWon ? 700 : 400, color: homeWon ? 'var(--text-primary)' : 'var(--text-muted)' }}>{getClubShort(f.homeClubId)}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', width: 40, textAlign: 'center', flexShrink: 0 }}>{f.homeScore}–{f.awayScore}</span>
                      <span style={{ flex: 1, fontSize: 11, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: awayWon ? 700 : 400, color: awayWon ? 'var(--text-primary)' : 'var(--text-muted)' }}>{getClubShort(f.awayClubId)}</span>
                    </div>
                  )
                })}
              </div>
              {rivalSummary && <p style={{ fontSize: 11, color: 'var(--accent)', marginTop: 6, fontStyle: 'italic' }}>{rivalSummary}</p>}
            </div>
          )
        })()}

        {/* Scouting */}
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

  // ── STEP: ANALYS ──────────────────────────────────────────────────────────
  function renderAnalys() {
    const game = g
    const coach = game.assistantCoach
    const coachItem = game.inbox
      .filter(i => i.tone === 'coach')
      .sort((a, b) => b.date.localeCompare(a.date))[0]

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
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#fff' }}>{coach.initials}</span>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', color: '#fff' }}>{coach.name.toUpperCase()} · ASSISTENTTRÄNARE</span>
              </div>
              <div style={{ padding: '12px 14px' }}>
                <p style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                  "{quote}"
                </p>
              </div>
            </div>
          )
        })()}

        {/* Consequences */}
        {standing && (
          <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px' }}>
            <SectionLabel style={{ marginBottom: 8 }}>KONSEKVENSER</SectionLabel>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Tabellplacering</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                {standingBefore && standingBefore !== standing.position
                  ? `${standingBefore} → ${standing.position}`
                  : `${standing.position}:a`}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Ekonomi denna omgång</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: financesDelta >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatFinance(financesDelta)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Bygdens puls</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: csColor(cs) }}>
                {csDelta !== 0 ? `${csDelta > 0 ? '+' : ''}${csDelta} → ${cs}` : `${cs}`}
              </span>
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
                    <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-display)', color: r >= 7 ? 'var(--success)' : 'var(--text-primary)' }}>{r.toFixed(1)}</span>
                  </div>
                )
              })}
              {worst.map(({ id, r }) => {
                const p = game.players.find(pl => pl.id === id)
                if (!p || r >= 5.5) return null
                return (
                  <div key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Svagaste länken: {p.firstName[0]}. {p.lastName}</span>
                    <span style={{ fontSize: 12, fontFamily: 'var(--font-display)', color: 'var(--danger)' }}>{r.toFixed(1)}</span>
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
          if (lost && (theirScore - myScore) >= 3) insights.push('En tungt förlust att analysera grundligt.')
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
      </>
    )
  }

  const unresolved = pendingEvents.filter(e => !resolvedEventIds.has(e.id)).length

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Content */}
      <div className="texture-wood card-stack" style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingTop: 12, paddingBottom: 8 }}>
        {step === 'oversikt' && renderOversikt()}
        {step === 'spelare' && renderSpelare()}
        {step === 'shotmap' && renderShotmap()}
        {step === 'forlop' && renderForlop()}
        {step === 'analys' && renderAnalys()}
      </div>

      {/* Bottom nav + CTA */}
      <div style={{
        flexShrink: 0,
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'var(--safe-bottom, 0px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease 0.3s',
      }}>
        {/* Step label */}
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', textAlign: 'center', color: 'var(--text-muted)', paddingTop: 8, marginBottom: 2 }}>
          FÖRDJUPA
        </p>

        {/* Icon buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 20px', marginBottom: 8 }}>
          {STEPS.map(s => {
            const isActive = step === s.id
            const isVisited = visitedSteps.has(s.id) && !isActive
            return (
              <button
                key={s.id}
                onClick={() => goToStep(s.id)}
                style={{
                  width: 56,
                  height: 56,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  borderRadius: 8,
                  border: isActive ? 'none' : '1px solid var(--accent)',
                  background: isActive ? 'var(--accent)' : 'transparent',
                  cursor: 'pointer',
                  opacity: isVisited ? 0.55 : 1,
                  boxShadow: isVisited ? 'none' : (isActive ? '0 2px 6px rgba(196,122,58,0.35)' : 'none'),
                  position: 'relative',
                }}
              >
                <span style={{ fontSize: 20 }}>{s.icon}</span>
                <span style={{ fontSize: 8, color: isActive ? '#fff' : 'var(--accent)', letterSpacing: '0.5px', fontWeight: 600 }}>{s.label}</span>
              </button>
            )
          })}
        </div>

        {/* CTA */}
        <div style={{ padding: '0 20px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {unresolved > 0 && (
            <p style={{ fontSize: 10, color: 'var(--warning)', textAlign: 'center', margin: 0 }}>
              {unresolved} ohanterad{unresolved > 1 ? 'e' : ''} händelse{unresolved > 1 ? 'r' : ''} — du kan hantera dem i Översikt
            </p>
          )}
          <button onClick={handleContinue} className="btn btn-primary btn-cta">
            KLAR — NÄSTA OMGÅNG →
          </button>
        </div>
      </div>
    </div>
  )
}
