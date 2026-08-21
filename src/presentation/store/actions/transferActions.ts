import type { SaveGame, TalentSearchRequest, Sponsor } from '../../../domain/entities/SaveGame'
import { startScoutAssignment } from '../../../domain/services/scoutingService'
import { createOutgoingBid } from '../../../domain/services/transferService'
import { generateSponsorOffer } from '../../../domain/services/sponsorService'
import { applyFinanceChange, reputationSalaryMultiplier } from '../../../domain/services/economyService'
import { bidReceivedEvent } from '../../../domain/services/events/eventFactories'
import { resolveEvent } from '../../../domain/services/eventService'
import { promoteFromQueue } from '../../../domain/services/decisionBudgetService'
import { formatSalary } from '../../../domain/format'

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

    renewContract: (playerId: string, newSalary: number, years: number) => {
      const { game } = get()
      if (!game) return { success: false, error: 'Inget spel laddat' }
      const player = game.players.find(p => p.id === playerId && p.clubId === game.managedClubId)
      if (!player) return { success: false, error: 'Spelaren hittades inte' }
      const club = game.clubs.find(c => c.id === game.managedClubId)
      if (!club) return { success: false, error: 'Ingen klubb hittad' }

      // O5 kraft 1 (Jacobs dom 2026-08-17, byggd 2026-08-23): rykte skalar
      // lönekravet, samma kurva som economyService.ts:s kommunbidrag —
      // rot: intäktssidan skalade redan med rykte, lönesidan gjorde det inte.
      const isFullTimePro = !player.dayJob
      const repFactor = reputationSalaryMultiplier(club.reputation)
      const minSalary = Math.round((isFullTimePro ? player.currentAbility * 200 * 0.80 : player.currentAbility * 80 * 0.80) * repFactor / 500) * 500
      if (newSalary < minSalary) return { success: false, error: `${player.firstName} avslår — kräver minst ${formatSalary(minSalary)}` }

      const currentWageBill = game.players
        .filter(p => p.clubId === game.managedClubId)
        .reduce((sum, p) => sum + p.salary, 0)
      const projectedWageBill = currentWageBill - player.salary + newSalary

      const isMinSalary = newSalary === minSalary
      const updatedPlayers = game.players.map(p =>
        p.id === playerId
          ? { ...p, contractUntilSeason: game.currentSeason + years, salary: newSalary, morale: isMinSalary ? Math.max(20, p.morale - 12) : p.morale }
          : p
      )

      set({ game: { ...game, players: updatedPlayers } })
      return {
        success: true,
        wageWarning: projectedWageBill > club.wageBudget
          ? projectedWageBill - club.wageBudget
          : undefined,
      }
    },

    signFreeAgent: (agentId: string) => {
      const { game } = get()
      if (!game) return { success: false, error: 'Inget spel laddat' }
      const agent = game.transferState.freeAgents.find(p => p.id === agentId)
      if (!agent) return { success: false, error: 'Spelaren hittades inte' }

      const agentWithClub = { ...agent, clubId: game.managedClubId, contractUntilSeason: game.currentSeason + 2 }
      const updatedPlayers = [...game.players, agentWithClub]
      const updatedFreeAgents = game.transferState.freeAgents.filter(p => p.id !== agentId)
      const updatedClubs = game.clubs.map(c =>
        c.id === game.managedClubId
          ? { ...c, squadPlayerIds: [...c.squadPlayerIds, agentId] }
          : c
      )

      set({
        game: {
          ...game,
          players: updatedPlayers,
          clubs: updatedClubs,
          transferState: { ...game.transferState, freeAgents: updatedFreeAgents },
        },
      })
      return { success: true }
    },

    listPlayerForSale: (playerId: string) => {
      const { game } = get()
      if (!game) return { success: false, error: 'Inget spel laddat' }
      const player = game.players.find(p => p.id === playerId)
      if (!player) return { success: false, error: 'Spelaren hittades inte' }

      const otherClubs = game.clubs.filter(c => c.id !== game.managedClubId)
      if (otherClubs.length === 0) return { success: false, error: 'Inga motståndarklubbar tillgängliga' }

      const buyingClub = otherClubs[Math.floor(Math.random() * otherClubs.length)]
      const marketVal = player.marketValue ?? 50000
      const offerAmount = Math.round(marketVal * 0.9 / 5000) * 5000
      const offeredSalary = Math.round(player.salary * 1.1 / 1000) * 1000
      const currentRound = Math.max(0, ...game.fixtures.filter(f => f.status === 'completed' && !f.isCup).map(f => f.roundNumber))
      const bid = {
        id: `bid_sell_${Date.now()}_${playerId}`,
        playerId,
        buyingClubId: buyingClub.id,
        sellingClubId: game.managedClubId,
        offerAmount,
        offeredSalary,
        contractYears: 3,
        direction: 'incoming' as const,
        status: 'pending' as const,
        createdRound: currentRound,
        expiresRound: currentRound + 2,
      }
      const event = bidReceivedEvent(bid, game)
      set({
        game: {
          ...game,
          transferBids: [...(game.transferBids ?? []), bid],
          pendingEvents: [...(game.pendingEvents ?? []), event],
        },
      })
      return { success: true }
    },

    /**
     * ÖVERLÄMNING 2 (2026-08-12), sammanslagen med resolveEvent — tidigare
     * (AUDIT DEL 2 B1, 2026-08-09) svarade den här funktionen på inkommande
     * bud med en egen, parallell reducer (kärnlogiken identisk med
     * eventResolver.ts:s acceptTransfer/rejectTransfer, men handrullad här).
     * Konsekvensen: Marknadsvägen saknade "kräv mer" helt och fick aldrig
     * ripple-kvittot (pilotTransferBidRippleChain) som resolveEvent-vägen
     * har sedan ÖVERLÄMNING 2 steg 1. Två skal, samma kärna, glidna isär.
     *
     * Nu: samma bidReceivedEvent(bid, game) som HÄNDELSE-kortet visar
     * syntetiseras här, injiceras temporärt i pendingEvents, och resolveEvent
     * gör det faktiska arbetet — en enda källa för acceptTransfer/
     * rejectTransfer/counterOffer, oavsett vilken skärm spelaren står på.
     *
     * Ett bud har inte garanterat en matchande pendingEvent-post sedan
     * tidigare (postAdvanceEvents.ts kappar på 2 events/omgång) — därför
     * injiceras eventet OAVSETT om det redan låg i kön, och alla tre kända
     * id-varianter (accept/aiaccept/aireject) sopas undan efteråt, precis
     * som den gamla implementationen gjorde. Den städningen fick INTE tappas
     * i sammanslagningen.
     */
    respondToIncomingBid: (bidId: string, choiceId: string) => {
      const { game } = get()
      if (!game) return { success: false, error: 'Inget spel laddat' }
      const bid = (game.transferBids ?? []).find(b => b.id === bidId)
      if (!bid) return { success: false, error: 'Budet hittades inte' }

      const event = bidReceivedEvent(bid, game)
      if (!event.choices.some(c => c.id === choiceId)) {
        return { success: false, error: 'Det alternativet är inte tillgängligt för det här budet' }
      }

      const gameWithEvent: SaveGame = {
        ...game,
        pendingEvents: [...(game.pendingEvents ?? []), event],
      }
      const afterResolve = resolveEvent(gameWithEvent, event.id, choiceId)

      // Syskon-undanstädningen från den gamla implementationen — resolveEvents
      // egen tail rensar bara event.id, inte AI-svarsvarianterna.
      const relatedEventIds = new Set([
        `event_bid_${bidId}`, `event_bid_aiaccept_${bidId}`, `event_bid_aireject_${bidId}`,
      ])
      const sweptEvents = (afterResolve.pendingEvents ?? []).filter(e => !relatedEventIds.has(e.id))

      const afterSweep: SaveGame = { ...afterResolve, pendingEvents: sweptEvents }
      const updatedGame = (afterSweep.deferredDecisions ?? []).length > 0
        ? promoteFromQueue(afterSweep)
        : afterSweep

      set({ game: updatedGame })
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
      const updatedClubs = applyFinanceChange(game.clubs, game.managedClubId, -SEEK_COST)
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
