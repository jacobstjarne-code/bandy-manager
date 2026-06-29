import type { CardRenderProps } from '../portalTypes'
import { NextMatchCard } from '../../dashboard/NextMatchCard'
import { getPlayoffSeriesContext } from '../../../../domain/services/portal/playoffSeriesContext'
import { PlayoffRound } from '../../../../domain/enums'

export function NextMatchPrimary({ game, playoffCtx: playoffCtxFromParent, escalationSubState }: CardRenderProps) {
  const managedId = game.managedClubId

  const bracket = game.playoffBracket
  let eliminated = false
  if (bracket) {
    const allSeries = [
      ...(bracket.quarterFinals ?? []),
      ...(bracket.semiFinals ?? []),
      ...(bracket.final ? [bracket.final] : []),
    ]
    eliminated = allSeries.some(s => s.loserId === managedId)
  }

  const nextFixture = game.fixtures
    .filter(f => {
      if (f.status !== 'scheduled') return false
      if (f.homeClubId !== managedId && f.awayClubId !== managedId) return false
      if (eliminated && f.matchday > 26 && !f.isCup) return false
      return true
    })
    .sort((a, b) => a.matchday - b.matchday || (b.isCup ? 1 : 0) - (a.isCup ? 1 : 0))[0] ?? null

  if (!nextFixture) return null

  const opponent = game.clubs.find(c =>
    c.id === (nextFixture.homeClubId === managedId ? nextFixture.awayClubId : nextFixture.homeClubId)
  ) ?? null

  if (!opponent) return null

  const club = game.clubs.find(c => c.id === managedId) ?? null
  if (!club) return null

  const isHome = nextFixture.homeClubId === managedId
  const matchWeather = (game.matchWeathers ?? []).find(mw => mw.fixtureId === nextFixture.id)

  const specialDateLabel = nextFixture.isFinaldag ? 'SM-FINALEN'
    : nextFixture.isCupFinalhelgen ? 'CUPFINALHELGEN'
    : nextFixture.matchday === 12 ? 'ANNANDAGEN'
    : null

  const isPlayoffFixture = !!(nextFixture.roundNumber > 22)
  const playoffSeries = isPlayoffFixture && bracket ? (() => {
    const allSeries = [
      ...(bracket.quarterFinals ?? []),
      ...(bracket.semiFinals ?? []),
      ...(bracket.final ? [bracket.final] : []),
    ]
    return allSeries.find(s => s.fixtures.includes(nextFixture.id)) ?? null
  })() : null

  const managedIsSeriesHome = playoffSeries ? playoffSeries.homeClubId === managedId : false
  const dynamicHomeWins = playoffSeries ? (managedIsSeriesHome ? playoffSeries.homeWins : playoffSeries.awayWins) : 0
  const dynamicAwayWins = playoffSeries ? (managedIsSeriesHome ? playoffSeries.awayWins : playoffSeries.homeWins) : 0

  const hasPreviousMatch = game.fixtures.some(
    f => f.status === 'completed' && (f.homeClubId === managedId || f.awayClubId === managedId)
  )
  const hasPendingLineup = !!(game.managedClubPendingLineup) && hasPreviousMatch

  // Compute playoff context once — either from parent (PortalScreen pre-computed) or fresh call.
  // Used for both series data and weight class to avoid duplicate getPlayoffSeriesContext calls.
  const playoffCtx = playoffCtxFromParent !== undefined ? playoffCtxFromParent : getPlayoffSeriesContext(game)

  // R3+ — series context for weight-based styling (only when next fixture is playoff)
  const ctx = isPlayoffFixture ? playoffCtx : null
  const seriesWeight = ctx?.weight
  const critTagLabel = ctx && ctx.criticality !== 'open'
    ? (ctx.criticality === 'decisive' ? 'Avgörande' : 'Matchpuck')
    : undefined
  const seriesNextStyle: 'decisive' | 'gold' | undefined = ctx
    ? (ctx.round === PlayoffRound.Final && ctx.criticality !== 'open' ? 'gold'
      : ctx.criticality === 'decisive' ? 'decisive'
      : undefined)
    : undefined

  // C-SD2 4:e axeln — warm primary-vikt på semi + upptakt (null = behåll befintlig).
  // Inlined from getEscalationPrimaryWeightClass to avoid double call.
  const primaryWeightClass = (() => {
    if (playoffCtx != null) return playoffCtx.round === PlayoffRound.SemiFinal ? 'primary-weight-2-warm' : null
    const s = escalationSubState
    return s !== null && s !== undefined && s !== 'mittfalt' ? 'primary-weight-2-warm' : null
  })() ?? undefined

  // NextMatchCard byggdes för Dashboard (ljus bg, mörk text). Portal är mörk →
  // .card--portal scopar om light-theme-tokens till portal-värden (DB-6, ej inline-hack).
  return (
    <div className="card--portal">
      {specialDateLabel && (
        <p className="h-label" style={{ color: 'var(--accent)', marginBottom: 8 }}>
          {specialDateLabel}
        </p>
      )}
      <NextMatchCard
        nextFixture={nextFixture}
        opponent={opponent}
        isHome={isHome}
        club={club}
        game={game}
        isPlayoffFixture={isPlayoffFixture}
        playoffSeries={playoffSeries}
        dynamicHomeWins={dynamicHomeWins}
        dynamicAwayWins={dynamicAwayWins}
        matchWeather={matchWeather}
        hasPendingLineup={hasPendingLineup}
        lineupConfirmedThisRound={game.lineupConfirmedThisRound}
        seriesWeight={seriesWeight}
        critTagLabel={critTagLabel}
        seriesNextStyle={seriesNextStyle}
        primaryWeightClass={primaryWeightClass}
      />
    </div>
  )
}
