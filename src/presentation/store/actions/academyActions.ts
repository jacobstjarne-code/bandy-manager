import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { LoanDeal } from '../../../domain/entities/Academy'
import { PlayerPosition, InboxItemType } from '../../../domain/enums'

interface GetState { game: SaveGame | null }
type Get = () => GetState
type Set = (partial: Partial<{ game: SaveGame | null }>) => void

export function academyActions(get: Get, set: Set) {
  return {
    activateCommunity: (key: string, level: string) => {
      const { game } = get()
      if (!game) return { success: false, error: 'Inget spel laddat' }
      const club = game.clubs.find(c => c.id === game.managedClubId)
      if (!club) return { success: false, error: 'Ingen klubb hittad' }

      const costs: Record<string, Record<string, number>> = {
        kiosk:         { basic: 3000, upgraded: 8000 },
        lottery:       { basic: 1000, intensive: 5000 },
        bandyplay:     { active: 0 },
        functionaries: { active: 2000 },
        julmarknad:    { active: 2000 },
        bandySchool:   { active: 5000 },
        socialMedia:   { active: 2000 },
        vipTent:       { active: 10000 },
      }

      const cost = costs[key]?.[level] ?? 0
      if (club.finances < cost) {
        return { success: false, error: `Inte tillräckligt med pengar (kräver ${Math.round(cost / 1000)} tkr)` }
      }

      const ca = game.communityActivities ?? {
        kiosk: 'none', lottery: 'none', bandyplay: false, functionaries: false, julmarknad: false,
        bandySchool: false, socialMedia: false, vipTent: false,
      }

      const currentRound = Math.max(
        0,
        ...game.fixtures
          .filter(f => f.status === 'completed' && !f.isCup)
          .map(f => f.roundNumber),
      )

      if (key === 'kiosk' && !ca.functionaries && club.reputation < 50) {
        return { success: false, error: 'Kräver funktionärer eller reputation > 50' }
      }
      if (key === 'bandyplay' && club.reputation < 40) {
        return { success: false, error: 'Ingen kanal intresserad än (reputation < 40)' }
      }
      if (key === 'vipTent' && club.facilities <= 60) {
        return { success: false, error: 'Kräver anläggningsnivå > 60' }
      }
      if (key === 'julmarknad' && (currentRound < 8 || currentRound > 12)) {
        return { success: false, error: 'Bara möjligt omgång 8–12 (december)' }
      }
      if (key === 'kiosk' && ca.kiosk === 'upgraded') {
        return { success: false, error: 'Kiosken är redan uppgraderad' }
      }
      if (key === 'kiosk' && ca.kiosk === level) {
        return { success: false, error: 'Redan aktiv' }
      }
      if (key === 'lottery' && ca.lottery === level) {
        return { success: false, error: 'Redan aktiv' }
      }

      const boolKeys = ['bandyplay', 'functionaries', 'julmarknad', 'bandySchool', 'socialMedia', 'vipTent']
      const updatedCA = boolKeys.includes(key)
        ? { ...ca, [key]: true }
        : { ...ca, [key]: level }

      let updatedClubs = game.clubs.map(c =>
        c.id === game.managedClubId ? { ...c, finances: c.finances - cost } : c
      )

      if (key === 'bandySchool') {
        updatedClubs = updatedClubs.map(c =>
          c.id === game.managedClubId
            ? { ...c, youthRecruitment: Math.min(100, (c.youthRecruitment ?? 50) + 2) }
            : c
        )
      }

      set({ game: { ...game, clubs: updatedClubs, communityActivities: updatedCA } })
      return { success: true }
    },

    upgradeAcademy: () => {
      const { game } = get()
      if (!game) return { success: false, error: 'Inget spel laddat' }
      const club = game.clubs.find(c => c.id === game.managedClubId)
      if (!club) return { success: false, error: 'Ingen klubb hittad' }

      const currentLevel = game.academyLevel ?? 'basic'
      if (currentLevel === 'elite') return { success: false, error: 'Akademin är redan på elitnivå' }
      if (game.academyUpgradeInProgress) return { success: false, error: 'Uppgradering pågår redan' }

      const cost = currentLevel === 'basic' ? 50000 : 150000

      if (currentLevel === 'developing' && club.facilities <= 70) {
        return { success: false, error: 'Elitnivå kräver anläggning > 70' }
      }
      if (currentLevel === 'developing' && (club.youthQuality ?? 0) <= 65) {
        return { success: false, error: 'Elitnivå kräver ungdomskvalitet > 65' }
      }
      if (currentLevel === 'basic' && club.facilities <= 50) {
        return { success: false, error: 'Satsningsnivå kräver anläggning > 50' }
      }
      if (club.finances < cost) {
        return { success: false, error: `Inte tillräckligt med pengar (kräver ${cost / 1000} tkr)` }
      }

      const updatedClubs = game.clubs.map(c =>
        c.id === game.managedClubId ? { ...c, finances: c.finances - cost } : c
      )

      set({
        game: {
          ...game,
          clubs: updatedClubs,
          academyUpgradeInProgress: true,
          academyUpgradeSeason: game.currentSeason + 1,
        }
      })
      return { success: true }
    },

    promoteYouthPlayer: (youthPlayerId: string) => {
      const { game } = get()
      if (!game) return { success: false, error: 'Inget spel laddat' }

      const youthPlayer = game.youthTeam?.players.find(p => p.id === youthPlayerId)
      if (!youthPlayer) return { success: false, error: 'Spelare hittades inte' }

      const club = game.clubs.find(c => c.id === game.managedClubId)
      if (!club) return { success: false, error: 'Ingen klubb hittad' }

      let timing: 'early' | 'good' | 'late'
      if (youthPlayer.currentAbility < 25 || youthPlayer.confidence < 40) {
        timing = 'early'
      } else if (youthPlayer.currentAbility > 35 && youthPlayer.confidence > 70 && youthPlayer.age >= 17) {
        timing = 'late'
      } else {
        timing = 'good'
      }

      const currentRound = game.fixtures
        .filter(f => f.status === 'completed' && !f.isCup)
        .reduce((max, f) => Math.max(max, f.roundNumber), 0) + 1

      let hash = 0
      for (let i = 0; i < youthPlayerId.length; i++) {
        hash = ((hash << 5) - hash) + youthPlayerId.charCodeAt(i)
        hash |= 0
      }
      const hashRand = Math.abs(hash % 1000) / 1000
      const salary = 2000 + Math.round(hashRand * 2000)

      function generateAttributes(position: PlayerPosition, ca: number) {
        const base = Math.round(ca * 0.6)
        const high = Math.round(ca * 1.1)
        const low = Math.round(ca * 0.4)
        const mid = Math.round(ca * 0.8)

        if (position === PlayerPosition.Goalkeeper) {
          return { skating: mid, acceleration: base, stamina: mid, ballControl: low, passing: low, shooting: low, dribbling: low, vision: mid, decisions: mid, workRate: mid, positioning: mid, defending: mid, cornerSkill: low, goalkeeping: high }
        } else if (position === PlayerPosition.Defender) {
          return { skating: mid, acceleration: mid, stamina: mid, ballControl: base, passing: base, shooting: low, dribbling: low, vision: base, decisions: mid, workRate: high, positioning: high, defending: high, cornerSkill: base, goalkeeping: low }
        } else if (position === PlayerPosition.Half) {
          return { skating: mid, acceleration: mid, stamina: high, ballControl: mid, passing: mid, shooting: base, dribbling: base, vision: mid, decisions: mid, workRate: high, positioning: mid, defending: mid, cornerSkill: base, goalkeeping: low }
        } else if (position === PlayerPosition.Midfielder) {
          return { skating: mid, acceleration: mid, stamina: mid, ballControl: mid, passing: high, shooting: base, dribbling: mid, vision: high, decisions: high, workRate: mid, positioning: mid, defending: base, cornerSkill: base, goalkeeping: low }
        } else {
          return { skating: high, acceleration: high, stamina: mid, ballControl: mid, passing: base, shooting: high, dribbling: high, vision: mid, decisions: mid, workRate: mid, positioning: high, defending: low, cornerSkill: base, goalkeeping: low }
        }
      }

      const newPlayer = {
        id: `player_promoted_${youthPlayerId}_${game.currentSeason}`,
        firstName: youthPlayer.firstName,
        lastName: youthPlayer.lastName,
        age: youthPlayer.age,
        nationality: 'Svensk',
        clubId: game.managedClubId,
        academyClubId: game.managedClubId,
        isHomegrown: true,
        position: youthPlayer.position,
        archetype: youthPlayer.archetype,
        salary,
        contractUntilSeason: game.currentSeason + 2,
        marketValue: Math.round(youthPlayer.currentAbility * 1000),
        morale: timing === 'good' ? 75 : timing === 'early' ? 45 : 60,
        form: 50,
        fitness: 80,
        sharpness: 60,
        dayJob: undefined,
        isFullTimePro: false,
        currentAbility: youthPlayer.currentAbility,
        potentialAbility: youthPlayer.potentialAbility,
        developmentRate: youthPlayer.developmentRate,
        injuryProneness: 30,
        discipline: 65,
        attributes: generateAttributes(youthPlayer.position, youthPlayer.currentAbility),
        isInjured: false,
        injuryDaysRemaining: 0,
        suspensionGamesRemaining: 0,
        seasonStats: { gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0 },
        careerStats: { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 0 },
        promotedFromAcademy: true,
        promotionRound: currentRound,
      }

      const updatedYouthPlayers = game.youthTeam!.players.filter(p => p.id !== youthPlayerId)
      const updatedYouthTeam = { ...game.youthTeam!, players: updatedYouthPlayers }
      const updatedPlayers = [...game.players, newPlayer]
      const updatedClubs = game.clubs.map(c =>
        c.id === game.managedClubId
          ? { ...c, squadPlayerIds: [...c.squadPlayerIds, newPlayer.id] }
          : c
      )

      const inboxItem = {
        id: `inbox_promotion_${youthPlayerId}_${game.currentSeason}`,
        date: game.currentDate,
        type: InboxItemType.YouthIntake,
        title: `⭐ ${youthPlayer.firstName} ${youthPlayer.lastName} kallas upp till A-truppen`,
        body: timing === 'good'
          ? `${youthPlayer.firstName} ${youthPlayer.lastName} (${youthPlayer.age} år) är klar för steget upp. Tajmingen är bra.`
          : timing === 'early'
          ? `${youthPlayer.firstName} ${youthPlayer.lastName} kallas upp lite tidigt. Han är fortfarande ung och kanske inte riktigt mogen.`
          : `${youthPlayer.firstName} ${youthPlayer.lastName} har vänt på ett par uppkallningar — nu är det dags att ta steget.`,
        isRead: false,
      }

      set({
        game: {
          ...game,
          players: updatedPlayers,
          clubs: updatedClubs,
          youthTeam: updatedYouthTeam,
          inbox: [inboxItem, ...game.inbox],
        }
      })
      return { success: true, timing }
    },

    assignMentor: (seniorPlayerId: string, youthPlayerId: string) => {
      const { game } = get()
      if (!game) return { success: false, error: 'Inget spel laddat' }

      const activeMentorships = (game.mentorships ?? []).filter(m => m.isActive)
      if (activeMentorships.length >= 3) return { success: false, error: 'Max 3 aktiva mentorskap' }

      const seniorPlayer = game.players.find(p => p.id === seniorPlayerId)
      if (!seniorPlayer) return { success: false, error: 'Mentor hittades inte' }
      if (seniorPlayer.age < 25) return { success: false, error: 'Mentorn måste vara minst 25 år' }
      if (seniorPlayer.discipline <= 60) return { success: false, error: 'Mentorn behöver disciplin > 60' }

      const youthInTeam = game.youthTeam?.players.some(p => p.id === youthPlayerId)
      const youthInA = game.players.some(p => p.id === youthPlayerId && p.promotedFromAcademy)
      if (!youthInTeam && !youthInA) return { success: false, error: 'Yngre spelare hittades inte' }

      const alreadyMentored = (game.mentorships ?? []).some(m => m.isActive && m.youthPlayerId === youthPlayerId)
      if (alreadyMentored) return { success: false, error: 'Spelaren har redan en mentor' }

      const currentRound = game.fixtures
        .filter(f => f.status === 'completed' && !f.isCup)
        .reduce((max, f) => Math.max(max, f.roundNumber), 0)

      const mentorship = { seniorPlayerId, youthPlayerId, startRound: currentRound, isActive: true }
      set({ game: { ...game, mentorships: [...(game.mentorships ?? []), mentorship] } })
      return { success: true }
    },

    removeMentor: (youthPlayerId: string) => {
      const { game } = get()
      if (!game) return
      const updatedMentorships = (game.mentorships ?? []).map(m =>
        m.youthPlayerId === youthPlayerId && m.isActive ? { ...m, isActive: false } : m
      )
      set({ game: { ...game, mentorships: updatedMentorships } })
    },

    loanOutPlayer: (playerId: string, destinationClubName: string, rounds: number) => {
      const { game } = get()
      if (!game) return { success: false, error: 'Inget spel laddat' }

      const player = game.players.find(p => p.id === playerId)
      if (!player) return { success: false, error: 'Spelare hittades inte' }
      if (player.clubId !== game.managedClubId) return { success: false, error: 'Spelaren tillhör inte din klubb' }
      if (player.age > 23) return { success: false, error: 'Lån är bara för spelare under 24 år' }
      if (player.isOnLoan) return { success: false, error: 'Spelaren är redan på lån' }

      const currentRound = game.fixtures
        .filter(f => f.status === 'completed' && !f.isCup)
        .reduce((max, f) => Math.max(max, f.roundNumber), 0)

      const loanDeal: LoanDeal = {
        playerId,
        destinationClubName,
        startRound: currentRound,
        endRound: currentRound + rounds,
        salaryShare: 0.5,
        matchesPlayed: 0,
        totalMatches: rounds,
        averageRating: 0,
        reports: [],
      }

      const updatedPlayers = game.players.map(p =>
        p.id === playerId ? { ...p, isOnLoan: true, loanClubName: destinationClubName } : p
      )
      const updatedClubs = game.clubs.map(c =>
        c.id === game.managedClubId
          ? { ...c, squadPlayerIds: c.squadPlayerIds.filter(id => id !== playerId) }
          : c
      )

      set({
        game: {
          ...game,
          players: updatedPlayers,
          clubs: updatedClubs,
          loanDeals: [...(game.loanDeals ?? []), loanDeal],
        }
      })
      return { success: true }
    },

    recallLoan: (playerId: string) => {
      const { game } = get()
      if (!game) return

      const updatedPlayers = game.players.map(p =>
        p.id === playerId ? { ...p, isOnLoan: false, loanClubName: undefined } : p
      )
      const updatedClubs = game.clubs.map(c =>
        c.id === game.managedClubId && !c.squadPlayerIds.includes(playerId)
          ? { ...c, squadPlayerIds: [...c.squadPlayerIds, playerId] }
          : c
      )
      const updatedLoanDeals = (game.loanDeals ?? []).filter(d => d.playerId !== playerId)

      set({ game: { ...game, players: updatedPlayers, clubs: updatedClubs, loanDeals: updatedLoanDeals } })
    },
  }
}
