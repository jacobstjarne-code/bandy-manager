import type { SaveGame, InboxItem } from '../../../domain/entities/SaveGame'
import type { Player, CareerMilestone, PlayerSeasonStats } from '../../../domain/entities/Player'
import type { Fixture } from '../../../domain/entities/Fixture'
import { FixtureStatus, MatchEventType, InboxItemType } from '../../../domain/enums'

/** A5: tom säsongsstatistik (för cup-grenen innan första cupmatchen). */
function emptySeasonStats(): PlayerSeasonStats {
  return { gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0 }
}
import {
  generateHatTrickEntry,
  generateGoodMatchEntry,
  generatePoorMatchEntry,
  generateDebutEntry,
  generateMilestoneGoalEntry,
  generateMilestoneGamesEntry,
} from '../../../domain/services/narrativeService'

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
    const isCupFixture = !!fixture.isCup  // A5: cup-mål bokförs separat från ligastatistik
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
      const reds = fixture.events.filter(
        e => e.type === MatchEventType.Suspension && e.playerId === id
      ).length

      // Check if player was substituted out — use actual minutes played
      const subOutEvent = fixture.events.find(
        e => e.type === MatchEventType.Substitution && e.playerId === id
      )
      const minutesThisGame = subOutEvent ? Math.min(90, subOutEvent.minute) : 90

      // A5: läs/skriv mot rätt statistik-hink (cup vs liga)
      const targetStats = isCupFixture ? (p.seasonCupStats ?? emptySeasonStats()) : p.seasonStats
      const prevGames = targetStats.gamesPlayed
      const prevAvgRating = targetStats.averageRating
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

      // Build narrative entries for managed players
      let updatedNarrativeLog = p.narrativeLog
      if (isManaged) {
        const isHome = fixture.homeClubId === game.managedClubId
        const opponentId = isHome ? fixture.awayClubId : fixture.homeClubId
        const opponent = game.clubs.find(c => c.id === opponentId)
        const oppName = opponent?.shortName ?? opponent?.name ?? 'motståndet'
        const newEntries: NonNullable<Player['narrativeLog']> = []

        // A-lagsdebut — bara meningsfull för en akademispelare som gör sin första A-match.
        // Grundtruppen "debuterar" INTE: de var etablerade när spelet började (alla skapas med
        // totalGames 0, vilket annars ger elva falska debuter i premiären). En äkta debut är
        // när akademin levererar en spelare till A-laget.
        if (prevCareerGames === 0 && p.promotedFromAcademy) {
          newEntries.push(generateDebutEntry(oppName, game.currentSeason, nextRound))
        }

        if (rating !== undefined) {
          if (goals >= 3) {
            newEntries.push(generateHatTrickEntry(p, oppName, goals, game.currentSeason, nextRound))
          } else if (rating >= 8.0) {
            newEntries.push(generateGoodMatchEntry(rating, goals, oppName, game.currentSeason, nextRound))
          } else if (rating < 5.5 && prevGames >= 3) {
            newEntries.push(generatePoorMatchEntry(rating, oppName, game.currentSeason, nextRound))
          }
        }

        // Career goal milestones: 10, 25, 50, 100
        const goalMilestones = [10, 25, 50, 100]
        for (const ms of goalMilestones) {
          if (prevCareerGoals < ms && newCareerGoals >= ms) {
            newEntries.push(generateMilestoneGoalEntry(ms, game.currentSeason, nextRound))
          }
        }

        // Career game milestones: 50, 100, 200
        const gameMilestones = [50, 100, 200]
        for (const ms of gameMilestones) {
          if (prevCareerGames < ms && newCareerGames >= ms) {
            newEntries.push(generateMilestoneGamesEntry(ms, game.currentSeason, nextRound))
          }
        }

        if (newEntries.length > 0) {
          updatedNarrativeLog = [...(p.narrativeLog ?? []), ...newEntries].slice(-20)
        }
      }

      const updatedTarget: PlayerSeasonStats = {
        ...targetStats,
        gamesPlayed: prevGames + 1,
        goals: targetStats.goals + goals,
        assists: targetStats.assists + assists,
        cornerGoals: targetStats.cornerGoals + cornerGoals,
        yellowCards: targetStats.yellowCards + 0,
        redCards: targetStats.redCards + reds,
        averageRating: Math.round(newAvgRating * 100) / 100,
        minutesPlayed: targetStats.minutesPlayed + minutesThisGame,
      }
      finalPlayers[idx] = {
        ...p,
        seasonStats: isCupFixture ? p.seasonStats : updatedTarget,
        seasonCupStats: isCupFixture ? updatedTarget : p.seasonCupStats,
        careerStats: {
          ...p.careerStats,
          totalGames: newCareerGames,
          totalGoals: newCareerGoals,
          totalAssists: newCareerAssists,
        },
        careerMilestones: isManaged ? newMilestones : p.careerMilestones,
        narrativeLog: updatedNarrativeLog,
      }
    }

    // Track minutes for substitute players who came on mid-game
    const subInEvents = fixture.events.filter(
      e => e.type === MatchEventType.Substitution && e.secondaryPlayerId !== undefined
    )
    const subInIds = new Set<string>()
    for (const subEvent of subInEvents) {
      const subInId = subEvent.secondaryPlayerId!
      subInIds.add(subInId)
      const subInIdx = finalPlayers.findIndex(p => p.id === subInId)
      if (subInIdx === -1) continue
      const subPlayer = finalPlayers[subInIdx]
      const subMinutes = Math.max(0, 90 - Math.min(90, subEvent.minute))
      if (subMinutes <= 0) continue
      const subTarget = isCupFixture ? (subPlayer.seasonCupStats ?? emptySeasonStats()) : subPlayer.seasonStats
      const subUpdated = { ...subTarget, minutesPlayed: subTarget.minutesPlayed + subMinutes }
      finalPlayers[subInIdx] = {
        ...subPlayer,
        seasonStats: isCupFixture ? subPlayer.seasonStats : subUpdated,
        seasonCupStats: isCupFixture ? subUpdated : subPlayer.seasonCupStats,
      }
    }

    // Flygande byten — bänkspelare som INTE byttes in får ~30-40 min speltid
    // (bandy använder löpande byten som ishockey)
    const allBench = [
      ...(fixture.homeLineup?.benchPlayerIds ?? []),
      ...(fixture.awayLineup?.benchPlayerIds ?? []),
    ]
    for (const benchId of allBench) {
      if (subInIds.has(benchId)) continue  // already tracked via sub event
      if (allStarters.includes(benchId)) continue
      const idx = finalPlayers.findIndex(p => p.id === benchId)
      if (idx === -1) continue
      const benchMinutes = 30 + Math.floor(Math.random() * 11)  // 30-40 min
      const benchPlayer = finalPlayers[idx]
      const benchTarget = isCupFixture ? (benchPlayer.seasonCupStats ?? emptySeasonStats()) : benchPlayer.seasonStats
      const benchUpdated = { ...benchTarget, minutesPlayed: benchTarget.minutesPlayed + benchMinutes, gamesPlayed: benchTarget.gamesPlayed + 1 }
      finalPlayers[idx] = {
        ...benchPlayer,
        seasonStats: isCupFixture ? benchPlayer.seasonStats : benchUpdated,
        seasonCupStats: isCupFixture ? benchUpdated : benchPlayer.seasonCupStats,
      }
    }
  }

  return {
    finalPlayers,
    milestoneInboxItems: newMilestoneInboxItems,
  }
}
