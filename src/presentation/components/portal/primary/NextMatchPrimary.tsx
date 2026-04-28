import type React from 'react'
import type { CardRenderProps } from '../portalTypes'
import { NextMatchCard } from '../../dashboard/NextMatchCard'

/**
 * Primary-kort för rutin-matchdag.
 * Wrappar NextMatchCard med samma logik som DashboardScreen.
 * Mock-referens: "Routine"-tillståndet i portal_bag_mockup.html.
 */
export function NextMatchPrimary({ game }: CardRenderProps) {
  const managedId = game.managedClubId

  // Kolla om laget är eliminerat
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
    .sort((a, b) => a.matchday - b.matchday)[0] ?? null

  if (!nextFixture) return null

  const opponent = game.clubs.find(c =>
    c.id === (nextFixture.homeClubId === managedId ? nextFixture.awayClubId : nextFixture.homeClubId)
  ) ?? null

  if (!opponent) return null

  const club = game.clubs.find(c => c.id === managedId) ?? null
  if (!club) return null

  const isHome = nextFixture.homeClubId === managedId
  const matchWeather = (game.matchWeathers ?? []).find(mw => mw.fixtureId === nextFixture.id)

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

  // Override light-theme surface tokens — NextMatchCard was built for Dashboard (--bg-surface = #FAF8F4).
  // Portal uses a dark background; without this wrapper the card renders white against --bg-portal.
  return (
    <div style={{
      '--bg-surface': 'var(--bg-portal-surface)',
      '--border':     'var(--border-dark)',
    } as React.CSSProperties}>
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
      />
    </div>
  )
}
