import type { Fixture } from '../../domain/entities/Fixture'
import type { SaveGame } from '../../domain/entities/SaveGame'
import { FixtureStatus, PlayoffStatus } from '../../domain/enums'
import { calculateStandings } from '../../domain/services/standingsService'
import { updateCupBracketAfterRound, generateNextCupRound } from '../../domain/services/cupService'
import { stampFixturesFromCalendar } from '../../domain/services/scheduleGenerator'
import { updateSeriesAfterMatch, advancePlayoffRound, nextPlayoffStart } from '../../domain/services/playoffService'
import { isPlayoffNarrativeCardStillValid } from '../../domain/services/playoffNarrativeService'
import { isPlayThroughInjuryCardStillValid } from './processors/eventProcessor'

/**
 * Den enda omedelbara slutskrivningen för en match som spelaren själv äger.
 *
 * Live, återhämtning efter avbruten match och walkover hade tidigare tre
 * kopior av samma transaktion. Återhämtningskopian uppdaterade bara fixture
 * och tabell, inte cup/slutspelsbracket, medan de två andra kopiorna kunde
 * driva vidare. Det gav två samtidiga sanningar: Granska visade den
 * omsimulerade matchen men serien stod kvar före matchen.
 *
 * Funktionen tar ett redan avgjort facit och utför HELA transaktionen:
 * fixture → tabell → cup/slutspel → köstädning → pending match-state. Den är
 * idempotent på fixture-status; samma resultat kan därför inte räknas två
 * gånger i en serie om en React-effekt kör om.
 */
export function completeManagedFixture(game: SaveGame, completedInput: Fixture): SaveGame {
  const current = game.fixtures.find(fixture => fixture.id === completedInput.id)
  if (!current || current.status === FixtureStatus.Completed) return game

  const completed: Fixture = {
    ...completedInput,
    status: FixtureStatus.Completed,
    matchStartedAt: undefined,
  }
  const fixtures = game.fixtures.map(fixture => fixture.id === completed.id ? completed : fixture)
  const completedLeague = fixtures.filter(fixture =>
    fixture.status === FixtureStatus.Completed && !fixture.isCup && !fixture.isKnockout,
  )
  const standings = calculateStandings(game.league.teamIds, completedLeague, game.pointDeductions)

  let cupBracket = game.cupBracket ?? null
  if (completed.isCup && cupBracket && !cupBracket.completed) {
    cupBracket = updateCupBracketAfterRound(cupBracket, [completed])
    const playedMatch = cupBracket.matches.find(match => match.fixtureId === completed.id)
    const round = playedMatch?.round ?? 0

    if (round === 4) {
      const finalMatch = cupBracket.matches.find(match => match.round === 4 && match.winnerId)
      if (finalMatch) cupBracket = { ...cupBracket, winnerId: finalMatch.winnerId, completed: true }
    } else if (round > 0) {
      const roundMatches = cupBracket.matches.filter(match => match.round === round)
      if (roundMatches.every(match => match.winnerId)) {
        const next = generateNextCupRound(cupBracket, round, game.currentSeason)
        cupBracket = next.updatedBracket
        fixtures.push(...stampFixturesFromCalendar(next.newFixtures, game.seasonCalendar ?? []))
      }
    }
  }

  let playoffBracket = game.playoffBracket
  if (completed.isKnockout && !completed.isCup && playoffBracket) {
    playoffBracket = {
      ...playoffBracket,
      quarterFinals: playoffBracket.quarterFinals.map(series =>
        series.fixtures.includes(completed.id) ? updateSeriesAfterMatch(series, completed) : series,
      ),
      semiFinals: playoffBracket.semiFinals.map(series =>
        series.fixtures.includes(completed.id) ? updateSeriesAfterMatch(series, completed) : series,
      ),
      final: playoffBracket.final?.fixtures.includes(completed.id)
        ? updateSeriesAfterMatch(playoffBracket.final, completed)
        : playoffBracket.final,
    }

    const phaseComplete =
      playoffBracket.status === PlayoffStatus.QuarterFinals
        ? playoffBracket.quarterFinals.every(series => series.winnerId !== null)
        : playoffBracket.status === PlayoffStatus.SemiFinals
          ? playoffBracket.semiFinals.every(series => series.winnerId !== null)
          : playoffBracket.status === PlayoffStatus.Final
            ? playoffBracket.final?.winnerId !== null
            : false

    if (phaseComplete) {
      const { startRound, startMatchday } = nextPlayoffStart(fixtures)
      const advanced = advancePlayoffRound(playoffBracket, game.currentSeason, startRound, startMatchday)
      playoffBracket = advanced.bracket
      fixtures.push(...advanced.newFixtures)
    }
  }

  const postMatchGame: SaveGame = {
    ...game,
    fixtures,
    standings,
    cupBracket,
    playoffBracket,
    lastCompletedFixtureId: completed.id,
    managedClubPendingLineup: undefined,
    lastHalftimeDecision: undefined,
  }
  const stillValid = (event: SaveGame['pendingEvents'][number]) =>
    isPlayoffNarrativeCardStillValid(event.id, playoffBracket, game.managedClubId) &&
    isPlayThroughInjuryCardStillValid(event, postMatchGame)

  return {
    ...postMatchGame,
    pendingEvents: (game.pendingEvents ?? []).filter(stillValid),
    deferredDecisions: (game.deferredDecisions ?? []).filter(stillValid),
  }
}
