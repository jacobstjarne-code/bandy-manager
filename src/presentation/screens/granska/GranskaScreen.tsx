import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../../store/gameStore'
import { playSound } from '../../audio/soundEffects'
import { MatchEventType } from '../../../domain/enums'
import { FixtureStatus } from '../../../domain/enums'
import { getCriticalEventsForGranska } from '../../../domain/services/granskaEventClassifier'
import { GranskaOversikt } from './GranskaOversikt'
import { GranskaSpelare } from './GranskaSpelare'
import { GranskaShotmap } from './GranskaShotmap'
import { GranskaForlop } from './GranskaForlop'
import { GranskaAnalys } from './GranskaAnalys'

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
  const potm = potmId ? (game.players.find(p => p.id === potmId) ?? null) : null
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

  const pendingEvents = game.pendingEvents ?? []

  function handleChoice(eventId: string, choiceId: string, choiceLabel: string) {
    playSound('click')
    setResolvedEventIds(prev => new Set([...prev, eventId]))
    setChosenLabels(prev => ({ ...prev, [eventId]: choiceLabel }))
    setTimeout(() => resolveEvent(eventId, choiceId), 600)
  }

  function handleResolveReactions(ids: string[]) {
    setResolvedEventIds(prev => new Set([...prev, ...ids]))
    ids.forEach(id => resolveEvent(id, 'auto'))
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

  const unresolvedCritical = getCriticalEventsForGranska(pendingEvents).filter(e => !resolvedEventIds.has(e.id)).length
  const unresolvedPC = game.pendingPressConference && !resolvedEventIds.has(game.pendingPressConference.id) ? 1 : 0
  const unresolvedRM = game.pendingRefereeMeeting && !resolvedEventIds.has(game.pendingRefereeMeeting.id) ? 1 : 0
  const unresolved = unresolvedCritical + unresolvedPC + unresolvedRM

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Content */}
      <div className="texture-wood card-stack" style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingTop: 12, paddingBottom: 8 }}>
        {step === 'oversikt' && (
          <GranskaOversikt
            game={game}
            fixture={fixture}
            homeClub={homeClub}
            awayClub={awayClub}
            isHome={isHome}
            won={won}
            lost={lost}
            resultColor={resultColor}
            resultLabel={resultLabel}
            potm={potm}
            potmRating={potmRating}
            penResult={penResult}
            keyMoments={keyMoments}
            pendingEvents={pendingEvents}
            resolvedEventIds={resolvedEventIds}
            chosenLabels={chosenLabels}
            fadeIn={fadeIn}
            onChoice={handleChoice}
            onResolve={handleResolveReactions}
          />
        )}
        {step === 'spelare' && (
          <GranskaSpelare
            game={game}
            fixture={fixture}
            isHome={isHome}
            potmId={potmId}
            pendingEvents={pendingEvents}
            resolvedEventIds={resolvedEventIds}
            chosenLabels={chosenLabels}
            onChoice={handleChoice}
          />
        )}
        {step === 'shotmap' && (
          <GranskaShotmap
            game={game}
            fixture={fixture}
            isHome={isHome}
          />
        )}
        {step === 'forlop' && (
          <GranskaForlop
            game={game}
            fixture={fixture}
            isHome={isHome}
            rs={rs}
            standing={standing}
            standingBefore={standingBefore}
            financesDelta={financesDelta}
            csDelta={csDelta}
            cs={cs}
            otherResults={otherResults}
          />
        )}
        {step === 'analys' && (
          <GranskaAnalys
            game={game}
            fixture={fixture}
            isHome={isHome}
            won={won}
            lost={lost}
            myScore={myScore}
            theirScore={theirScore}
            potm={potm}
            standing={standing}
            standingBefore={standingBefore}
            financesDelta={financesDelta}
            csDelta={csDelta}
            cs={cs}
          />
        )}
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
                <span style={{ fontSize: 8, color: isActive ? 'var(--text-light)' : 'var(--accent)', letterSpacing: '0.5px', fontWeight: 600 }}>{s.label}</span>
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
