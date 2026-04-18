import type { SaveGame, InboxItem } from '../../../domain/entities/SaveGame'
import type { MatchEvent, TeamSelection, MatchReport } from '../../../domain/entities/Fixture'
import { FixtureStatus, PlayoffStatus, InboxItemType } from '../../../domain/enums'
import { calculateStandings } from '../../../domain/services/standingsService'
import { updateCupBracketAfterRound } from '../../../domain/services/cupService'
import { updateSeriesAfterMatch, advancePlayoffRound } from '../../../domain/services/playoffService'
import { simulateMatch } from '../../../domain/services/matchEngine'
import { fixtureSeed } from '../../../domain/utils/random'
import { generateCoachQuote } from '../../../domain/services/assistantCoachService'

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
      attendance?: number,
    ) => {
      const { game } = get()
      if (!game) return
      const updatedFixtures = game.fixtures.map(f =>
        f.id === fixtureId
          ? {
              ...f, homeScore, awayScore, events, report, homeLineup, awayLineup,
              attendance: attendance ?? f.attendance,
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

      set({ game: { ...game, fixtures: updatedFixtures, lastCompletedFixtureId: fixtureId, standings, cupBracket: updatedCupBracket, playoffBracket: updatedPlayoffBracket, managedClubPendingLineup: undefined } })
    },

    simulateAbandonedMatch: (fixtureId: string) => {
      const { game } = get()
      if (!game) return
      const fixture = game.fixtures.find(f => f.id === fixtureId)
      if (!fixture || !fixture.homeLineup || !fixture.awayLineup) return

      const homePlayers = game.players.filter(p => p.clubId === fixture.homeClubId)
      const awayPlayers = game.players.filter(p => p.clubId === fixture.awayClubId)
      const homeClub = game.clubs.find(c => c.id === fixture.homeClubId)
      const awayClub = game.clubs.find(c => c.id === fixture.awayClubId)

      const result = simulateMatch({
        fixture,
        homeLineup: fixture.homeLineup,
        awayLineup: fixture.awayLineup,
        homePlayers,
        awayPlayers,
        seed: fixtureSeed(fixture.id),
        homeClubName: homeClub?.name,
        awayClubName: awayClub?.name,
        isPlayoff: fixture.isKnockout,
        managedIsHome: fixture.homeClubId === game.managedClubId,
      })

      const completed = result.fixture
      const updatedFixtures = game.fixtures.map(f => f.id === fixtureId ? completed : f)
      const completedLeague = updatedFixtures.filter(f => f.status === FixtureStatus.Completed && !f.isCup)
      const standings = calculateStandings(game.league.teamIds, completedLeague)

      const isHome = fixture.homeClubId === game.managedClubId
      const managedScore = isHome ? completed.homeScore ?? 0 : completed.awayScore ?? 0
      const oppScore     = isHome ? completed.awayScore ?? 0 : completed.homeScore ?? 0
      const opponent = game.clubs.find(c => c.id === (isHome ? fixture.awayClubId : fixture.homeClubId))

      const matchResult: 'win' | 'draw' | 'loss' =
        managedScore > oppScore ? 'win' : managedScore < oppScore ? 'loss' : 'draw'
      const score = `${managedScore}–${oppScore}`
      const coach = game.assistantCoach
      const coachBody = coach
        ? generateCoachQuote(coach, { type: 'match-result', result: matchResult, score }, fixtureSeed(fixtureId))
        : `Du lämnade matchen innan den var klar. Assistenten tog över. Resultat: ${score}.`

      const inboxItem: InboxItem = {
        id: `abandoned_match_${fixtureId}`,
        date: game.currentDate,
        type: InboxItemType.BoardFeedback,
        title: coach ? `${coach.name} · ${opponent?.shortName ?? opponent?.name ?? '?'} ${score}` : `Matchen mot ${opponent?.name ?? '?'} avgjord utan dig`,
        body: coachBody,
        isRead: false,
        ...(coach ? { tone: 'coach' as const, fromRole: 'ASSISTENTTRÄNARE', coachInitials: coach.initials } : {}),
      }

      set({ game: {
        ...game,
        fixtures: updatedFixtures,
        standings,
        inbox: [inboxItem, ...game.inbox],
      }})
    },

    markMatchStarted: (fixtureId: string, homeLineup?: TeamSelection, awayLineup?: TeamSelection) => {
      const { game } = get()
      if (!game) return
      const updatedFixtures = game.fixtures.map(f =>
        f.id === fixtureId
          ? {
              ...f,
              matchStartedAt: Date.now(),
              // Persist lineups so we can auto-simulate if user abandons mid-match
              ...(homeLineup ? { homeLineup } : {}),
              ...(awayLineup ? { awayLineup } : {}),
            }
          : f
      )
      set({ game: { ...game, fixtures: updatedFixtures } })
    },
  }
}
