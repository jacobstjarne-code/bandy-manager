import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { MatchEvent, TeamSelection, MatchReport } from '../../../domain/entities/Fixture'
import { FixtureStatus, PlayoffStatus, InboxItemType } from '../../../domain/enums'
import { calculateStandings } from '../../../domain/services/standingsService'
import { updateCupBracketAfterRound } from '../../../domain/services/cupService'
import { updateSeriesAfterMatch, advancePlayoffRound } from '../../../domain/services/playoffService'

interface GetState { game: SaveGame | null }
type Get = () => GetState
type Set = (partial: Partial<{ game: SaveGame | null }>) => void

export function matchActions(get: Get, set: Set) {
  return {
    saveLiveMatchResult: (
      fixtureId: string,
      homeScore: number,
      awayScore: number,
      events: MatchEvent[],
      report: MatchReport,
      homeLineup: TeamSelection,
      awayLineup: TeamSelection,
      overtimeResult?: 'home' | 'away',
      penaltyResult?: { home: number; away: number },
    ) => {
      const { game } = get()
      if (!game) return
      const updatedFixtures = game.fixtures.map(f =>
        f.id === fixtureId
          ? {
              ...f, homeScore, awayScore, events, report, homeLineup, awayLineup,
              status: FixtureStatus.Completed,
              wentToOvertime: (overtimeResult !== undefined || penaltyResult !== undefined) || undefined,
              wentToPenalties: penaltyResult !== undefined || undefined,
              overtimeResult,
              penaltyResult,
            }
          : f
      )
      const completedFixtures = updatedFixtures.filter(f => f.status === FixtureStatus.Completed && !f.isCup)
      const standings = calculateStandings(game.league.teamIds, completedFixtures)

      const completedCupFixture = updatedFixtures.find(f => f.id === fixtureId && f.isCup)
      let updatedCupBracket = game.cupBracket ?? null
      if (completedCupFixture && updatedCupBracket && !updatedCupBracket.completed) {
        updatedCupBracket = updateCupBracketAfterRound(updatedCupBracket, [completedCupFixture])

        // Check if cup final (round 4) is now decided → set winnerId + completed
        const finalMatch = updatedCupBracket.matches.find(m => m.round === 4 && m.winnerId)
        if (finalMatch) {
          updatedCupBracket = {
            ...updatedCupBracket,
            winnerId: finalMatch.winnerId,
            completed: true,
          }
        }
      }

      const completedFixture = updatedFixtures.find(f => f.id === fixtureId)!
      let updatedPlayoffBracket = game.playoffBracket
      if (completedFixture.isKnockout && !completedFixture.isCup && updatedPlayoffBracket) {
        updatedPlayoffBracket = {
          ...updatedPlayoffBracket,
          quarterFinals: updatedPlayoffBracket.quarterFinals.map(s =>
            s.fixtures.includes(fixtureId) ? updateSeriesAfterMatch(s, completedFixture) : s
          ),
          semiFinals: updatedPlayoffBracket.semiFinals.map(s =>
            s.fixtures.includes(fixtureId) ? updateSeriesAfterMatch(s, completedFixture) : s
          ),
          final: updatedPlayoffBracket.final && updatedPlayoffBracket.final.fixtures.includes(fixtureId)
            ? updateSeriesAfterMatch(updatedPlayoffBracket.final, completedFixture)
            : updatedPlayoffBracket.final,
        }

        const phaseComplete = (() => {
          if (updatedPlayoffBracket.status === PlayoffStatus.QuarterFinals)
            return updatedPlayoffBracket.quarterFinals.every(s => s.winnerId !== null)
          if (updatedPlayoffBracket.status === PlayoffStatus.SemiFinals)
            return updatedPlayoffBracket.semiFinals.every(s => s.winnerId !== null)
          if (updatedPlayoffBracket.status === PlayoffStatus.Final)
            return updatedPlayoffBracket.final?.winnerId !== null
          return false
        })()

        if (phaseComplete) {
          const nextRoundStart = updatedPlayoffBracket.status === PlayoffStatus.QuarterFinals ? 26
            : updatedPlayoffBracket.status === PlayoffStatus.SemiFinals ? 29 : 32
          const currentMaxMatchday = Math.max(0, ...updatedFixtures.map(f => f.matchday ?? 0))
          const { bracket: advancedBracket, newFixtures: newPlayoffFixtures } =
            advancePlayoffRound(updatedPlayoffBracket, game.currentSeason, nextRoundStart, currentMaxMatchday + 1)
          updatedPlayoffBracket = advancedBracket
          if (newPlayoffFixtures.length > 0) {
            updatedFixtures.push(...newPlayoffFixtures)
          }
        }
      }

      set({ game: { ...game, fixtures: updatedFixtures, lastCompletedFixtureId: fixtureId, standings, cupBracket: updatedCupBracket, playoffBracket: updatedPlayoffBracket } })
    },

    applyPressChoice: (moraleEffect: number, mediaQuote: string) => {
      const { game } = get()
      if (!game) return
      const updatedPlayers = game.players.map(p =>
        p.clubId === game.managedClubId
          ? { ...p, morale: Math.max(0, Math.min(100, p.morale + moraleEffect)) }
          : p
      )
      const personalizedQuote = mediaQuote.replace(/tränaren/gi, game.managerName)
      const inboxItem = {
        id: `inbox_press_live_${Date.now()}`,
        date: game.currentDate,
        type: InboxItemType.Media,
        title: `📰 ${personalizedQuote}`,
        body: '',
        isRead: false,
      }
      set({ game: { ...game, players: updatedPlayers, inbox: [...game.inbox, inboxItem] } })
    },
  }
}
