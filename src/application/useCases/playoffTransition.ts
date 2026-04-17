import type { SaveGame, InboxItem } from '../../domain/entities/SaveGame'
import type { GameEvent } from '../../domain/entities/GameEvent'
import { FixtureStatus, InboxItemType, PendingScreen } from '../../domain/enums'
import { generateQuarterFinalEvent } from '../../domain/services/playoffNarrativeService'
import { calculateStandings } from '../../domain/services/standingsService'
import {
  generatePlayoffBracket,
  generatePlayoffFixtures,
} from '../../domain/services/playoffService'
import type { AdvanceResult } from './advanceTypes'

function advanceDate(dateStr: string, days: number): string {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export function handlePlayoffStart(game: SaveGame, _seed?: number): AdvanceResult {
  // Calculate standings from regular season completed fixtures — exclude cup
  const completedFixtures = game.fixtures.filter(f => f.status === FixtureStatus.Completed && !f.isCup)
  const standings = calculateStandings(game.league.teamIds, completedFixtures)

  const bracket = generatePlayoffBracket(standings, game.currentSeason)
  const allQFFixtures: ReturnType<typeof generatePlayoffFixtures> = []

  const startMatchday = Math.max(0, ...game.fixtures.map(f => f.matchday ?? 0)) + 1

  const bracketWithFixtures = {
    ...bracket,
    quarterFinals: bracket.quarterFinals.map(series => {
      const fixtures = generatePlayoffFixtures(series, game.currentSeason, 23, startMatchday)
      allQFFixtures.push(...fixtures)
      return { ...series, fixtures: fixtures.map(f => f.id) }
    }),
  }

  const managedStanding = standings.find(s => s.clubId === game.managedClubId)
  const isInPlayoffs = managedStanding && managedStanding.position <= 8

  const newInboxItems: InboxItem[] = []
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)!

  if (isInPlayoffs) {
    const managedSeries = bracketWithFixtures.quarterFinals.find(
      s => s.homeClubId === game.managedClubId || s.awayClubId === game.managedClubId
    )
    const opponentId = managedSeries
      ? (managedSeries.homeClubId === game.managedClubId ? managedSeries.awayClubId : managedSeries.homeClubId)
      : null
    const opponent = opponentId ? game.clubs.find(c => c.id === opponentId) : null

    newInboxItems.push({
      id: `inbox_playoff_start_${game.currentSeason}`,
      date: game.currentDate,
      type: InboxItemType.Playoff,
      title: 'Slutspelet börjar!',
      body: `Grundserien är klar! ${managedClub.name} har kvalificerat sig för slutspelet och möter ${opponent?.name ?? 'okänd motståndare'} i kvartsfinal.`,
      isRead: false,
    })
  } else {
    const position = managedStanding?.position ?? 0
    newInboxItems.push({
      id: `inbox_playoff_out_${game.currentSeason}`,
      date: game.currentDate,
      type: InboxItemType.Playoff,
      title: 'Grundserien avslutad',
      body: `Grundserien är avslutad. ${managedClub.name} slutade på plats ${position} och kvalificerade sig inte för slutspelet.`,
      isRead: false,
    })
  }

  const newDate = advanceDate(game.currentDate, 7)

  const newPendingEvents: GameEvent[] = []
  if (isInPlayoffs) {
    const qfEventId = `playoff_qf_${game.currentSeason}`
    const alreadyFired = (game.pendingEvents ?? []).some(e => e.id === qfEventId) ||
      (game.resolvedEventIds ?? []).includes(qfEventId)
    if (!alreadyFired) {
      newPendingEvents.push(generateQuarterFinalEvent(game))
    }
  }

  const updatedGame: SaveGame = {
    ...game,
    fixtures: [...game.fixtures, ...allQFFixtures],
    playoffBracket: bracketWithFixtures,
    standings,
    inbox: [...game.inbox, ...newInboxItems],
    pendingEvents: [...(game.pendingEvents ?? []), ...newPendingEvents],
    currentDate: newDate,
    pendingScreen: PendingScreen.PlayoffIntro,
  }

  // If managed club didn't make playoffs, we have scheduled fixtures for other teams
  // but the bracket is set. Return playoffStarted so UI can react.
  return { game: updatedGame, roundPlayed: null, seasonEnded: false, playoffStarted: true }
}
