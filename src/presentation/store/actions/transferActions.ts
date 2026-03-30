import type { SaveGame, TalentSearchRequest, Sponsor } from '../../../domain/entities/SaveGame'
import { startScoutAssignment } from '../../../domain/services/scoutingService'
import { createOutgoingBid } from '../../../domain/services/transferService'
import { generateSponsorOffer } from '../../../domain/services/sponsorService'

interface GetState { game: SaveGame | null }
type Get = () => GetState
type Set = (partial: Partial<{ game: SaveGame | null }>) => void

export function transferActions(get: Get, set: Set) {
  return {
    startEvaluation: (playerId: string, clubId: string, sameRegion: boolean, hasPlayedAgainst = false) => {
      const { game } = get()
      if (!game) return { success: false, error: 'Inget spel laddat' }
      if (game.activeTalentSearch) return { success: false, error: 'Spaning pågår — vänta tills den är klar' }
      if (game.activeScoutAssignment) return { success: false, error: 'Scout är redan utsänd' }
      if (game.scoutBudget <= 0) return { success: false, error: 'Scoutbudgeten är slut för säsongen' }
      const assignment = startScoutAssignment(playerId, clubId, game.currentDate, sameRegion, hasPlayedAgainst)
      set({ game: { ...game, activeScoutAssignment: assignment, scoutBudget: game.scoutBudget - 1 } })
      return { success: true }
    },

    placeOutgoingBid: (playerId: string, offerAmount: number, offeredSalary: number, contractYears: number) => {
      const { game } = get()
      if (!game) return { success: false, error: 'Inget spel laddat' }
      const scheduledFixtures = game.fixtures
        .filter(f => (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) && f.status === 'scheduled')
        .sort((a, b) => a.roundNumber - b.roundNumber)

      if (scheduledFixtures.length === 0) {
        return { success: false, error: 'Inga fler matcher denna säsong — vänta till nästa säsong' }
      }
      const currentRound = scheduledFixtures[0].roundNumber
      const result = createOutgoingBid(game, playerId, offerAmount, offeredSalary, contractYears, currentRound)
      if (!result.success || !result.bid) return { success: false, error: result.error }
      set({ game: { ...game, transferBids: [...(game.transferBids ?? []), result.bid] } })
      return { success: true }
    },

    startTalentSearch: (position: string, maxAge: number, maxSalary: number, currentRound: number) => {
      const { game } = get()
      if (!game) return { success: false, error: 'Inget spel laddat' }
      if (game.activeScoutAssignment) return { success: false, error: 'Utvärdering pågår — vänta tills den är klar' }
      if (game.activeTalentSearch) return { success: false, error: 'En spaning pågår redan' }
      if (game.scoutBudget < 2) return { success: false, error: 'Otillräcklig scoutbudget (kräver 2)' }
      const search: TalentSearchRequest = {
        id: `search_${game.currentSeason}_r${currentRound}`,
        position,
        maxAge,
        maxSalary,
        roundsRemaining: 2,
        createdRound: currentRound,
      }
      set({ game: { ...game, activeTalentSearch: search, scoutBudget: game.scoutBudget - 2 } })
      return { success: true }
    },

    seekSponsor: () => {
      const { game } = get()
      if (!game) return { success: false, error: 'Inget spel laddat' } as { success: boolean; sponsor?: Sponsor; error?: string }
      const club = game.clubs.find(c => c.id === game.managedClubId)
      if (!club) return { success: false, error: 'Ingen klubb hittad' }
      const SEEK_COST = 2500
      if (club.finances < SEEK_COST) return { success: false, error: 'Inte tillräckligt med pengar (kräver 2,5 tkr)' }
      const activeSponsors = (game.sponsors ?? []).filter(s => s.contractRounds > 0)
      const maxSponsors = Math.min(6, 2 + Math.floor(club.reputation / 20))
      if (activeSponsors.length >= maxSponsors) return { success: false, error: 'Alla sponsorplatser är fyllda' }
      const currentRound = Math.max(0, ...game.fixtures.filter(f => f.status === 'completed' && !f.isCup).map(f => f.roundNumber))
      const rand = Math.random.bind(Math)
      const updatedClubs = game.clubs.map(c => c.id === game.managedClubId ? { ...c, finances: c.finances - SEEK_COST } : c)
      const sponsor = generateSponsorOffer(club.reputation, activeSponsors.length, maxSponsors, currentRound, rand)
      if (!sponsor) {
        set({ game: { ...game, clubs: updatedClubs } })
        return { success: false, error: 'Ingen sponsor intresserad den här gången' }
      }
      set({ game: { ...game, clubs: updatedClubs, sponsors: [...(game.sponsors ?? []), sponsor] } })
      return { success: true, sponsor }
    },
  }
}
