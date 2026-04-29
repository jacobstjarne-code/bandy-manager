import { useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore, useCanAdvance } from '../store/gameStore'
import { buildPortal, makeSeed } from '../../domain/services/portal/portalBuilder'
import { getSeasonalTone } from '../../domain/services/portal/seasonalTone'
import { initCardBag } from '../../domain/services/portal/initCardBag'
import { PortalSecondarySection } from '../components/portal/PortalSecondarySection'
import { PortalMinimalBar } from '../components/portal/PortalMinimalBar'
import { PlayoffRound, PlayoffStatus } from '../../domain/enums'
import { playSound } from '../audio/soundEffects'

// Initialisera bag-of-cards en gång vid modulimport
initCardBag()

export function PortalScreen() {
  const { game, advance } = useGameStore()
  const canAdvance = useCanAdvance()
  const navigate = useNavigate()

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

  if (!game) return (
    <div style={{ padding: 20 }}>
      <div className="shimmer" style={{ height: 160, borderRadius: 3, marginBottom: 10 }} />
      <div className="shimmer" style={{ height: 80, borderRadius: 3, marginBottom: 10 }} />
      <div className="shimmer" style={{ height: 80, borderRadius: 3 }} />
    </div>
  )

  const seed = makeSeed(game)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const layout = useMemo(() => buildPortal(game, seed), [game, seed])

  // Sätt CSS-vars för seasonal tone
  useEffect(() => {
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
  }, [game.currentDate])

  // ── CTA logic ────────────────────────────────────────────────────
  const bracket = game.playoffBracket
  const eliminated = bracket
    ? [...(bracket.quarterFinals ?? []), ...(bracket.semiFinals ?? []), ...(bracket.final ? [bracket.final] : [])].some(s => s.loserId === game.managedClubId)
    : false

  const hasScheduledFixtures = game.fixtures.some(f => f.status === 'scheduled')
  const canClickAdvance = canAdvance || hasScheduledFixtures

  const advanceButtonText = (() => {
    const scheduled = game.fixtures.filter(f => f.status === 'scheduled')
    if (scheduled.length === 0) {
      if (!game.playoffBracket) {
        const s = game.standings.find(s => s.clubId === game.managedClubId)
        return s && s.position <= 8 ? 'Starta slutspel →' : 'Avsluta grundserien →'
      }
      if (game.playoffBracket.status === PlayoffStatus.Completed) return 'Avsluta säsongen →'
      return 'Fortsätt slutspel →'
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

  const handleAdvance = () => {
    playSound('click')
    const scheduledFixtures = game.fixtures.filter(f => f.status === 'scheduled')
    if (scheduledFixtures.length === 0) {
      try { advance() } catch (err) { console.error('advance() failed:', err) }
      return
    }
    const nextSimEff = Math.min(...scheduledFixtures.map(f => f.matchday))
    const managedMatchInNextRound = scheduledFixtures.find(
      f => f.matchday === nextSimEff && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
    )
    if (managedMatchInNextRound) { navigate('/game/match'); return }
    try { advance() } catch (err) { console.error('advance() failed:', err) }
  }

  const Primary = layout.primary.Component

  return (
    <>
      <div
        className="screen-enter texture-wood card-stack"
        style={{
          background: 'var(--bg-portal)',
          padding: '14px',
          minHeight: '100%',
          paddingBottom: 'calc(var(--bottom-nav-height) + var(--safe-bottom) + 72px)',
        }}
      >
        <Primary game={game} />
        <PortalSecondarySection cards={layout.secondary} game={game} />
        <PortalMinimalBar cards={layout.minimal} game={game} />
      </div>

      {/* STICKY CTA — alltid synlig ovanför BottomNav */}
      <div style={{
        position: 'fixed',
        bottom: 'calc(var(--bottom-nav-height) + var(--safe-bottom) + 8px)',
        left: 14,
        right: 14,
        zIndex: 200,
      }}>
        <button
          data-coach-id="cta-button"
          onClick={handleAdvance}
          disabled={!canClickAdvance}
          className={`btn btn-primary btn-cta${canClickAdvance ? ' btn-pulse' : ''}`}
        >
          {advanceButtonText}
        </button>
      </div>
    </>
  )
}
