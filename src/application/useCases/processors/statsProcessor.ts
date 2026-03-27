import type { SaveGame, InboxItem } from '../../../domain/entities/SaveGame'
import type { Player, CareerMilestone } from '../../../domain/entities/Player'
import type { Fixture } from '../../../domain/entities/Fixture'
import { FixtureStatus, MatchEventType, InboxItemType } from '../../../domain/enums'

export interface StatsProcessorResult {
  finalPlayers: Player[]
  milestoneInboxItems: InboxItem[]
}

export function updatePlayerMatchStats(
  players: Player[],
  simulatedFixtures: Fixture[],
  game: SaveGame,
  nextRound: number,
): StatsProcessorResult {
  const newMilestoneInboxItems: InboxItem[] = []
  const finalPlayers = [...players]

  for (const fixture of simulatedFixtures) {
    if (fixture.status !== FixtureStatus.Completed) continue
    const allStarters = [
      ...(fixture.homeLineup?.startingPlayerIds ?? []),
      ...(fixture.awayLineup?.startingPlayerIds ?? []),
    ]

    for (const id of allStarters) {
      const idx = finalPlayers.findIndex(p => p.id === id)
      if (idx === -1) continue
      const p = finalPlayers[idx]
      const rating = fixture.report?.playerRatings[id]
      const goals = fixture.events.filter(
        e => e.type === MatchEventType.Goal && e.playerId === id
      ).length
      const assists = fixture.events.filter(
        e => e.type === MatchEventType.Assist && e.playerId === id
      ).length
      const cornerGoals = fixture.events.filter(
        e => e.type === MatchEventType.Goal && e.playerId === id && e.isCornerGoal
      ).length
      const yellows = fixture.events.filter(
        e => e.type === MatchEventType.YellowCard && e.playerId === id
      ).length
      const reds = fixture.events.filter(
        e => e.type === MatchEventType.RedCard && e.playerId === id
      ).length

      // Check if player was substituted out — use actual minutes played
      const subOutEvent = fixture.events.find(
        e => e.type === MatchEventType.Substitution && e.playerId === id
      )
      const minutesThisGame = subOutEvent ? Math.min(90, subOutEvent.minute) : 90

      const prevGames = p.seasonStats.gamesPlayed
      const prevAvgRating = p.seasonStats.averageRating
      const newAvgRating = rating !== undefined
        ? (prevAvgRating * prevGames + rating) / (prevGames + 1)
        : prevAvgRating

      // Update careerStats
      const prevCareerGames = p.careerStats.totalGames
      const prevCareerGoals = p.careerStats.totalGoals
      const prevCareerAssists = p.careerStats.totalAssists
      const newCareerGames = prevCareerGames + 1
      const newCareerGoals = prevCareerGoals + goals
      const newCareerAssists = prevCareerAssists + assists

      // Detect milestones for managed club players
      const isManaged = p.clubId === game.managedClubId
      const newMilestones: CareerMilestone[] = [...(p.careerMilestones ?? [])]
      const existingTypes = new Set(newMilestones.map(m => `${m.type}_${m.season}`))

      if (isManaged) {
        const playerName = `${p.firstName} ${p.lastName}`

        // Hat trick milestone (3+ goals this fixture)
        if (goals >= 3) {
          if (!newMilestones.some(m => m.type === 'hatTrick' && m.season === game.currentSeason && m.round === nextRound)) {
            newMilestones.push({
              type: 'hatTrick',
              season: game.currentSeason,
              round: nextRound,
              description: `${playerName} satte ${goals} mål i en match`,
            })
            newMilestoneInboxItems.push({
              id: `inbox_milestone_hatTrick_${p.id}_r${nextRound}_${game.currentSeason}`,
              date: game.currentDate,
              type: InboxItemType.BoardFeedback,
              title: `Karriärsmilstolpe: ${playerName}`,
              body: `${playerName} satte hattrick och nådde en karriärsmilstolpe!`,
              relatedPlayerId: p.id,
              isRead: false,
            } as InboxItem)
          }
        }

        // 100 games milestone
        if (prevCareerGames < 100 && newCareerGames >= 100) {
          const msKey = `games100_${game.currentSeason}`
          if (!existingTypes.has(msKey)) {
            newMilestones.push({
              type: 'games100',
              season: game.currentSeason,
              round: nextRound,
              description: `${playerName} spelade sin 100:e karriärmatch`,
            })
            newMilestoneInboxItems.push({
              id: `inbox_milestone_games100_${p.id}_${game.currentSeason}`,
              date: game.currentDate,
              type: InboxItemType.BoardFeedback,
              title: `Karriärsmilstolpe: ${playerName}`,
              body: `${playerName} spelade sin 100:e karriärmatch — en fantastisk bedrift!`,
              relatedPlayerId: p.id,
              isRead: false,
            } as InboxItem)
          }
        }

        // 50 goals milestone
        if (prevCareerGoals < 50 && newCareerGoals >= 50) {
          const msKey = `goals50_${game.currentSeason}`
          if (!existingTypes.has(msKey)) {
            newMilestones.push({
              type: 'goals50',
              season: game.currentSeason,
              round: nextRound,
              description: `${playerName} nådde 50 karriärmål`,
            })
            newMilestoneInboxItems.push({
              id: `inbox_milestone_goals50_${p.id}_${game.currentSeason}`,
              date: game.currentDate,
              type: InboxItemType.BoardFeedback,
              title: `Karriärsmilstolpe: ${playerName}`,
              body: `${playerName} nådde 50 mål i karriären — ett historiskt ögonblick!`,
              relatedPlayerId: p.id,
              isRead: false,
            } as InboxItem)
          }
        }
      }

      finalPlayers[idx] = {
        ...p,
        seasonStats: {
          ...p.seasonStats,
          gamesPlayed: prevGames + 1,
          goals: p.seasonStats.goals + goals,
          assists: p.seasonStats.assists + assists,
          cornerGoals: p.seasonStats.cornerGoals + cornerGoals,
          yellowCards: p.seasonStats.yellowCards + yellows,
          redCards: p.seasonStats.redCards + reds,
          averageRating: Math.round(newAvgRating * 100) / 100,
          minutesPlayed: p.seasonStats.minutesPlayed + minutesThisGame,
        },
        careerStats: {
          ...p.careerStats,
          totalGames: newCareerGames,
          totalGoals: newCareerGoals,
          totalAssists: newCareerAssists,
        },
        careerMilestones: isManaged ? newMilestones : p.careerMilestones,
      }
    }

    // Track minutes for substitute players who came on mid-game
    const subInEvents = fixture.events.filter(
      e => e.type === MatchEventType.Substitution && e.secondaryPlayerId !== undefined
    )
    for (const subEvent of subInEvents) {
      const subInId = subEvent.secondaryPlayerId!
      const subInIdx = finalPlayers.findIndex(p => p.id === subInId)
      if (subInIdx === -1) continue
      const subPlayer = finalPlayers[subInIdx]
      const subMinutes = Math.max(0, 90 - Math.min(90, subEvent.minute))
      if (subMinutes <= 0) continue
      finalPlayers[subInIdx] = {
        ...subPlayer,
        seasonStats: {
          ...subPlayer.seasonStats,
          minutesPlayed: subPlayer.seasonStats.minutesPlayed + subMinutes,
        },
      }
    }
  }

  return {
    finalPlayers,
    milestoneInboxItems: newMilestoneInboxItems,
  }
}
