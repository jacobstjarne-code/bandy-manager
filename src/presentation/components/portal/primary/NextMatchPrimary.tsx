import type { CardRenderProps } from '../portalTypes'
import { NextMatchCard } from '../../dashboard/NextMatchCard'
import { getPlayoffSeriesContext } from '../../../../domain/services/portal/playoffSeriesContext'
import { getEscalationPrimaryWeightClass } from '../../../../application/services/portalEscalationResolver'
import { PlayoffRound } from '../../../../domain/enums'

export function NextMatchPrimary({ game }: CardRenderProps) {
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

  // R3+ — series context for weight-based styling
  const ctx = isPlayoffFixture ? getPlayoffSeriesContext(game) : null
  const seriesWeight = ctx?.weight
  const critTagLabel = ctx && ctx.criticality !== 'open'
    ? (ctx.criticality === 'decisive' ? 'Avgörande' : 'Matchpuck')
    : undefined
  const seriesNextStyle: 'decisive' | 'gold' | undefined = ctx
    ? (ctx.round === PlayoffRound.Final && ctx.criticality !== 'open' ? 'gold'
      : ctx.criticality === 'decisive' ? 'decisive'
      : undefined)
    : undefined

  // C-SD2 4:e axeln — warm primary-vikt på semi + upptakt (null = behåll befintlig)
  const primaryWeightClass = getEscalationPrimaryWeightClass(game) ?? undefined

  // NextMatchCard byggdes för Dashboard (ljus bg, mörk text). Portal är mörk →
  // .card--portal scopar om light-theme-tokens till portal-värden (DB-6, ej inline-hack).
  return (
    <div className="card--portal">
      {specialDateLabel && (
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>
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
