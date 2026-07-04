import { useMemo, useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FastForward } from 'lucide-react'
import { Icon } from '../components/primitives/Icon'
import { useGameStore, useCanAdvance } from '../store/gameStore'
import { buildPortal, makeSeed } from '../../domain/services/portal/portalBuilder'
import { getSeasonalTone } from '../../domain/services/portal/seasonalTone'
import { initCardBag } from '../../domain/services/portal/initCardBag'
import { PortalSecondarySection } from '../components/portal/PortalSecondarySection'
import { PortalMinimalBar } from '../components/portal/PortalMinimalBar'
import { SituationCard } from '../components/portal/SituationCard'
import { PortalBeat } from '../components/portal/PortalBeat'
import { PortalPhaseMark } from '../components/portal/PortalPhaseMark'
import { PortalSpectatorMark } from '../components/portal/PortalSpectatorMark'
import { PortalAnniversaryMark } from '../components/portal/PortalAnniversaryMark'
import { PortalEventSlot } from '../components/portal/PortalEventSlot'
import { PortalQueueRail } from '../components/portal/PortalQueueRail'
import { PortalInboxCounter } from '../components/portal/PortalInboxCounter'
import { AnslagOverlay } from '../components/anslag/AnslagOverlay'
import { IllustrationScene } from '../components/illustration/IllustrationScene'
import { computeNextAnslag } from '../../domain/services/anslagService'
import { getActiveDecisionCount } from '../../domain/services/decisionBudgetService'
import { PlayoffRound, PendingScreen } from '../../domain/enums'
import { playSound } from '../audio/soundEffects'
import { PortalRoundMark } from '../components/portal/PortalRoundMark'
import { PortalUpptakt } from '../components/portal/PortalUpptakt'
import { getEscalationSubState } from '../../application/services/portalEscalationResolver'
import { AnnandagsValEvent } from '../components/portal/AnnandagsValEvent'
import { getPlayoffSeriesContext } from '../../domain/services/portal/playoffSeriesContext'
import { isManagedClubSpectator } from '../../domain/data/seasonPhases'
import { getSeasonEndPhase } from '../../domain/data/seasonEndPhase'
import { getRoundDate } from '../../domain/services/scheduleGenerator'
import { PortalObjectiveAlert } from '../components/portal/PortalObjectiveAlert'
import { getNextActionCue } from '../utils/nextActionCue'

// Initialisera bag-of-cards en gång vid modulimport
initCardBag()

export function PortalScreen() {
  const { game, advance, simulateRemainingStep, markAnslagSeen, recordPortalShown } = useGameStore()
  const canAdvance = useCanAdvance()
  const navigate = useNavigate()
  const [isAdvancing, setIsAdvancing] = useState(false)

  // Auto-skip rounds where managed team has no fixture (e.g. cup R1 for bye-teams,
  // or cup rounds after elimination). The advance() auto-loop handles chaining,
  // so a single call processes all non-managed rounds in sequence.
  useEffect(() => {
    if (!game) return
    if (game.pendingScreen) return
    const scheduled = game.fixtures.filter(f => f.status === 'scheduled')
    if (scheduled.length === 0) return
    const nextMd = Math.min(...scheduled.map(f => f.matchday))
    const hasManagedAtNextMd = scheduled.some(
      f => f.matchday === nextMd &&
           (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
    )
    if (!hasManagedAtNextMd) {
      advance()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run once on mount — advance() navigates away, re-mount after return handles any remaining rounds

  const seed = game ? makeSeed(game) : 0
  const layout = useMemo(
    () => (game ? buildPortal(game, seed) : null),
    [game, seed],
  )

  // Registrera visade kort för stale-bias-beräkning nästa omgång
  useEffect(() => {
    if (!layout) return
    const shownIds = [
      layout.primary.id,
      ...(layout.storySlot ? [layout.storySlot.id] : []),
      ...layout.secondary.map(c => c.id),
      ...layout.minimal.map(c => c.id),
    ]
    recordPortalShown(shownIds, layout.storySlot?.kind)
  }, [layout, recordPortalShown])

  // Sätt CSS-vars för seasonal tone
  useEffect(() => {
    if (!game) return
    const tone = getSeasonalTone(game.currentDate)
    document.documentElement.style.setProperty('--bg-portal', tone.bgPrimary)
    document.documentElement.style.setProperty('--bg-portal-surface', tone.bgSurface)
    document.documentElement.style.setProperty('--bg-portal-elevated', tone.bgElevated)
    document.documentElement.style.setProperty('--accent-portal', tone.accentTone)
    document.body.style.background = tone.bgPrimary
    return () => {
      document.documentElement.style.removeProperty('--bg-portal')
      document.documentElement.style.removeProperty('--bg-portal-surface')
      document.documentElement.style.removeProperty('--bg-portal-elevated')
      document.documentElement.style.removeProperty('--accent-portal')
      document.body.style.background = ''
    }
  }, [game?.currentDate])

  if (!game || !layout) return (
    <div style={{ padding: 20 }}>
      <div className="shimmer" style={{ height: 160, borderRadius: 3, marginBottom: 10 }} />
      <div className="shimmer" style={{ height: 80, borderRadius: 3, marginBottom: 10 }} />
      <div className="shimmer" style={{ height: 80, borderRadius: 3 }} />
    </div>
  )

  const nextAnslag = computeNextAnslag(game)

  // ── CTA logic ────────────────────────────────────────────────────
  const bracket = game.playoffBracket
  const eliminated = bracket
    ? [...(bracket.quarterFinals ?? []), ...(bracket.semiFinals ?? []), ...(bracket.final ? [bracket.final] : [])].some(s => s.loserId === game.managedClubId)
    : false

  const hasScheduledFixtures = game.fixtures.some(f => f.status === 'scheduled')
  const canClickAdvance = canAdvance || hasScheduledFixtures

  const isSpectator = isManagedClubSpectator(game)

  const phase = getSeasonEndPhase(game)
  const advanceButtonText = (() => {
    const scheduled = game.fixtures.filter(f => f.status === 'scheduled')
    if (scheduled.length === 0) {
      if (phase === 'season_done') return 'Avsluta säsongen →'
      if (phase === 'playoff_spectator') return 'Säsong över →'
      if (phase === 'regular_done') {
        const s = game.standings.find(s => s.clubId === game.managedClubId)
        return s && s.position <= 8 ? 'Starta slutspel →' : 'Avsluta grundserien →'
      }
      return 'Fortsätt slutspel →'
    }

    if (isSpectator) {
      const nextPlayoffMatch = scheduled
        .filter(f => !f.isCup && f.homeClubId !== game.managedClubId && f.awayClubId !== game.managedClubId)
        .sort((a, b) => a.matchday - b.matchday)[0]
      if (nextPlayoffMatch) {
        const dateStr = nextPlayoffMatch.date || getRoundDate(game.currentSeason, nextPlayoffMatch.roundNumber)
        const d = new Date(dateStr)
        const days = ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör']
        return `Fortsätt — ${days[d.getDay()]} →`
      }
      return 'Fortsätt →'
    }

    const nextManaged = scheduled.filter(f => {
      if (f.homeClubId !== game.managedClubId && f.awayClubId !== game.managedClubId) return false
      if (eliminated && f.matchday > 26 && !f.isCup) return false
      return true
    }).sort((a, b) => a.matchday - b.matchday)[0]
    if (nextManaged) {
      if (nextManaged.isCup) {
        const cupMatch = game.cupBracket?.matches.find(m => m.fixtureId === nextManaged.id)
        const cupRound = cupMatch?.round ?? 1
        const cupLabel = cupRound === 1 ? 'Förstarunda' : cupRound === 2 ? 'Kvartsfinal' : cupRound === 3 ? 'Semifinal' : 'Final'
        return `Spela Cup-${cupLabel} →`
      }
      if (game.playoffBracket) {
        const allSeries = [
          ...game.playoffBracket.quarterFinals,
          ...game.playoffBracket.semiFinals,
          ...(game.playoffBracket.final ? [game.playoffBracket.final] : []),
        ]
        const thisSeries = allSeries.find(s => s.fixtures.includes(nextManaged.id))
        if (thisSeries) {
          const label = thisSeries.round === PlayoffRound.QuarterFinal ? 'Kvartsfinal'
            : thisSeries.round === PlayoffRound.SemiFinal ? 'Semifinal'
            : 'SM-Final'
          return `Redo — spela ${label} →`
        }
        return 'Fortsätt slutspel →'
      }
      return `Redo — spela omgång ${nextManaged.roundNumber} →`
    }
    return 'Fortsätt →'
  })()

  const handleAdvance = useCallback(() => {
    if (isAdvancing) return
    playSound('click')
    const scheduledFixtures = game.fixtures.filter(f => f.status === 'scheduled')
    if (scheduledFixtures.length === 0) {
      setIsAdvancing(true)
      requestAnimationFrame(() => {
        try { advance() } catch (err) { console.error('advance() failed:', err) }
        setIsAdvancing(false)
      })
      return
    }
    const nextSimEff = Math.min(...scheduledFixtures.map(f => f.matchday))
    const managedMatchInNextRound = scheduledFixtures.find(
      f => f.matchday === nextSimEff && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
    )
    if (managedMatchInNextRound) { navigate('/game/match'); return }
    // Safety: never call advance() if an upcoming managed match has no lineup —
    // matchSimProcessor would silently skip it, leaving the fixture stuck as Scheduled.
    const hasPendingManagedWithoutLineup = !game.managedClubPendingLineup && scheduledFixtures.some(
      f => f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId
    )
    if (hasPendingManagedWithoutLineup) { navigate('/game/match'); return }
    setIsAdvancing(true)
    requestAnimationFrame(() => {
      try { advance() } catch (err) { console.error('advance() failed:', err) }
      setIsAdvancing(false)
    })
  }, [isAdvancing, game, advance, navigate])

  const playedLeagueRounds = game.fixtures.filter(
    f => f.status === 'completed' &&
         (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) &&
         !f.isCup
  ).length
  const nextManagedScheduled = game.fixtures
    .filter(f => f.status === 'scheduled' &&
                 (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
    .sort((a, b) => a.matchday - b.matchday || (b.isCup ? 1 : 0) - (a.isCup ? 1 : 0))[0]
  const canSimulateRemaining =
    hasScheduledFixtures &&
    playedLeagueRounds >= 12 &&
    !game.playoffBracket &&
    !nextManagedScheduled?.isCup &&
    game.pendingScreen !== PendingScreen.HalfTimeSummary

  const handleSimulateRemaining = () => {
    if (!canSimulateRemaining) return
    playSound('click')
    const HALT_SCREENS: (PendingScreen | null | undefined)[] = [
      PendingScreen.HalfTimeSummary,
      PendingScreen.PlayoffIntro,
      PendingScreen.QFSummary,
    ]
    for (let step = 0; step < 120; step++) {
      const result = simulateRemainingStep()
      if (!result) break
      if (result.seasonEnded) { navigate('/game/sim-summary'); return }
      if (result.playoffStarted) break
      const currentGame = result.game
      if (HALT_SCREENS.includes(currentGame?.pendingScreen)) break
      if (!currentGame?.fixtures.some(f => f.status === 'scheduled')) break
    }
  }

  const Primary = layout.primary.Component
  const StorySlotComponent = layout.storySlot?.Component ?? null

  const isSeason1Round1 = (game.seasonSummaries?.length ?? 0) === 0 && game.currentMatchday === 1
  const playoffCtx = getPlayoffSeriesContext(game)
  const isSmFinal = playoffCtx?.round === PlayoffRound.Final
  const escalationSubState = getEscalationSubState(game)
  // C-SD2: warm CTA på kvart/semi + upptakt-fönstret (ej final → gold)
  // !isSmFinal garanterar redan att en ev. playoffCtx inte är final
  const isCtaWarm = !isSmFinal && (playoffCtx != null || (escalationSubState !== null && escalationSubState !== 'mittfalt'))
  const activeCount = getActiveDecisionCount(game)
  // Slinga 1: grinda avancera-CTA:n tills veckans beslut hanterats (anti-autopilot).
  // buildPortal garanterar att beslutskortet syns när detta är satt — ingen soft-lock.
  const weeklyDecisionPending = game.pendingWeeklyDecision != null

  // Grind-läget leder ögat: klick på den låsta CTA:n scrollar till beslutskortet
  // istället för att vara en död spärr. Målet är WeeklyDecisionSecondary (data-decision-anchor).
  const scrollToDecision = useCallback(() => {
    const el = document.querySelector('[data-decision-anchor]')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('decision-flash')
      setTimeout(() => el.classList.remove('decision-flash'), 1200)
    }
  }, [])

  return (
    <>
      {nextAnslag && (
        <AnslagOverlay
          game={game}
          anslagKey={nextAnslag}
          onDismiss={() => markAnslagSeen(nextAnslag)}
        />
      )}
      <div
        className="texture-wood card-stack"
        style={{
          background: 'var(--bg-portal)',
          padding: '14px',
          minHeight: '100%',
          paddingBottom: 'calc(var(--bottom-nav-height) + var(--safe-bottom) + 72px)',
        }}
      >
        {/* Finalhelg-portal: ceremoniellt header-band (final.jpg, fallback tills bilden droppas).
            Edge-to-edge via negativ marginal ut ur card-stackens 14px-padding. */}
        {isSmFinal && (
          <IllustrationScene mode="header" name="final" alt="SM-finalhelg" style={{ margin: '-14px -14px 14px' }} />
        )}
        <SituationCard game={game} />
        <PortalPhaseMark game={game} />
        <PortalUpptakt game={game} subState={escalationSubState} />
        <PortalSpectatorMark game={game} />
        <PortalAnniversaryMark game={game} />
        <PortalBeat game={game} />
        <PortalRoundMark game={game} />
        {/* PortalActiveBudget (pills) removed — Variant B: en fråga åt gången, ingen paginering */}
        {isSeason1Round1 && activeCount > 0 && (
          <div className="portal-tutorial-frame">
            <strong>Lugnare första veckan</strong>
            En fråga åt gången. Resten ligger och väntar tills du hittat rytmen.
          </div>
        )}
        {game.pendingAnnandagsVal && (
          <AnnandagsValEvent game={game} />
        )}
        <PortalObjectiveAlert game={game} />
        <PortalEventSlot game={game} />
        <div data-coach-id="klacken-card">
          <Primary game={game} playoffCtx={playoffCtx} escalationSubState={escalationSubState} />
        </div>
        {StorySlotComponent && <StorySlotComponent game={game} />}
        <PortalQueueRail game={game} />
        <PortalSecondarySection cards={layout.secondary} game={game} />
        <PortalMinimalBar cards={layout.minimal} game={game} />
        <PortalInboxCounter game={game} />
      </div>

      {/* STICKY CTA — alltid synlig ovanför BottomNav */}
      <div style={{
        position: 'fixed',
        bottom: 'calc(var(--bottom-nav-height) + var(--safe-bottom) + 8px)',
        left: 14,
        right: 14,
        zIndex: 'var(--z-header)',  // persistent botten-chrome (ej modal) — var 200 = oförändrat
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}>
        {canSimulateRemaining && (
          <button
            onClick={handleSimulateRemaining}
            className="btn btn-ghost"
            style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Icon icon={FastForward} size={13} /> Simulera resterande säsong
          </button>
        )}
        {/* Drag 3 (§11 punkt 6) — "Vad nu?"-affordansen. Bildtext på handlingen,
            aldrig en tooltip/overlay. Färg = allvar: warning i grind-läge, annars
            secondary. Kassörens röst — terse, ↳-prefix, pekar utan att peka. */}
        {(() => {
          const cue = getNextActionCue(game)
          const cueColor = cue.tone === 'warning' ? 'var(--warning)' : 'var(--text-secondary)'
          return (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '0 2px' }}>
              <span style={{ color: cueColor, fontSize: 12, lineHeight: 1.3, flexShrink: 0 }}>
                {cue.tone === 'warning' ? '⚠' : '↳'}
              </span>
              <span style={{ fontSize: 10.5, color: cueColor, lineHeight: 1.35 }}>
                {cue.text}
              </span>
            </div>
          )
        })()}
        <button
          data-coach-id="cta-button"
          onClick={weeklyDecisionPending ? scrollToDecision : handleAdvance}
          disabled={(!canClickAdvance || isAdvancing) && !weeklyDecisionPending}
          aria-disabled={weeklyDecisionPending || undefined}
          className={`btn btn-primary btn-cta${canClickAdvance && !isAdvancing && !weeklyDecisionPending ? ' btn-pulse' : ''}${weeklyDecisionPending ? ' btn-cta-locked' : isSmFinal ? ' btn-gold' : isCtaWarm ? ' btn-warm' : ''}`}
        >
          {isAdvancing ? '···' : weeklyDecisionPending ? 'Hantera veckans beslut först ↑' : advanceButtonText}
        </button>
      </div>
    </>
  )
}
