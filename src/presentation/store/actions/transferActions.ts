import type { SaveGame, TalentSearchRequest, Sponsor } from '../../../domain/entities/SaveGame'
import { processScoutAssignment, startScoutAssignment } from '../../../domain/services/scoutingService'
import { createOutgoingBid, getCounterOfferAmount, getTransferBudgetSummary } from '../../../domain/services/transferService'
import { generateSponsorOffer } from '../../../domain/services/sponsorService'
import { applyFinanceChange, appendFinanceLog, computeContractMinSalary, computeLeaguePositionAverages } from '../../../domain/services/economyService'
import type { FinanceEntry } from '../../../domain/services/economyService'
import { bidReceivedEvent } from '../../../domain/services/events/eventFactories'
import { resolveEvent } from '../../../domain/services/eventService'
import { promoteFromQueue } from '../../../domain/services/decisionBudgetService'
import { formatSalary } from '../../../domain/format'
import { fixtureSeed, mulberry32, seededPick } from '../../../domain/utils/random'
import { evaluateContractOffer } from '../../../domain/services/contractNegotiationService'
import { logEvent } from '../../../domain/services/eventLedgerService'

interface GetState { game: SaveGame | null }
type Get = () => GetState
type Set = (partial: Partial<{ game: SaveGame | null }>) => void

/**
 * PÅSTÅENDEKARTAN nivå 1 (2026-08-25): en roundNumber-sortering (placeOutgoingBid)
 * fixad till matchday samma dag. Uppföljning samma dag (Jacobs order, efter
 * BACKLOG-fyndet "createdRound/expiresRound/signedRound blandar minst två
 * skalor"): samtliga TRE `currentRound`-beräkningar i denna fil
 * (placeOutgoingBid/sellStar/seekSponsor) bytta från roundNumber till
 * matchday — de matar `TransferBid.createdRound/expiresRound` och
 * `Sponsor.signedRound`, som `transferProcessor.ts` jämför direkt mot
 * `nextMatchday` (matchday-skala). Se BACKLOG.md för hela inventeringen
 * (samma bugg fanns även i `LoanDeal.startRound/endRound`, fixad separat
 * i academyActions.ts).
 *
 * O5 kraft 1, prestationsfaktor (DOM_FRAMGANGSKURVAN_2026-08-27, anspråk 1):
 * player.currentAbility/player.dayJob citerades tidigare här, men läses nu
 * INTE längre direkt i denna funktionskropp — de läses i
 * computeContractMinSalary (economyService.ts), som är den funktion som
 * faktiskt fattar beslutet om golvet. Flyttat dit i samma anda som denna
 * grinds egen princip: @cites ska sitta på den funktion som LÄSER fältet,
 * inte varje anropare uppåt i kedjan.
 *
 * @cites minSalary, club.reputation
 */
export function transferActions(get: Get, set: Set) {
  return {
    startEvaluation: (playerId: string, clubId: string, sameRegion: boolean, hasPlayedAgainst = false) => {
      const { game } = get()
      if (!game) return { success: false, error: 'Inget spel laddat' }
      if (game.activeTalentSearch) return { success: false, error: 'Spaning pågår — vänta tills den är klar' }
      if (game.activeScoutAssignment) return { success: false, error: 'Scout är redan utsänd' }
      if (game.scoutBudget <= 0) return { success: false, error: 'Scoutbudgeten är slut för säsongen' }
      const assignment = startScoutAssignment(playerId, clubId, game.currentDate, sameRegion, hasPlayedAgainst)
      const nextScoutBudget = game.scoutBudget - 1

      // En rapport med noll återstående omgångar ska vara klar nu. Tidigare
      // sparades även den som ett aktivt uppdrag och löstes först när nästa
      // matchrunda råkade processas, trots att UI lovade "klar direkt".
      if (assignment.roundsRemaining === 0) {
        const target = game.players.find(p => p.id === playerId)
        if (!target) return { success: false, error: 'Spelaren hittades inte' }
        const scoutAccuracy = Math.min(95, 50 + nextScoutBudget * 2)
        const report = processScoutAssignment(
          assignment,
          target,
          scoutAccuracy,
          fixtureSeed(`${game.id}:${game.currentSeason}:${game.currentMatchday}:${playerId}:scout`),
          game.currentSeason,
        )
        set({
          game: {
            ...game,
            activeScoutAssignment: null,
            scoutBudget: nextScoutBudget,
            scoutReports: { ...(game.scoutReports ?? {}), [playerId]: report },
          },
        })
        return { success: true, roundsRemaining: 0 }
      }

      set({ game: { ...game, activeScoutAssignment: assignment, scoutBudget: nextScoutBudget } })
      return { success: true, roundsRemaining: assignment.roundsRemaining }
    },

    // L3 (mobil speltest-audit, 2026-08-26): favoritmärke för scoutrapporter
    // — ren tvärvänd boolean, ingen annan state påverkas. Se Scouting.ts:s
    // fältkommentar för motivet.
    toggleScoutShortlist: (playerId: string) => {
      const { game } = get()
      if (!game) return
      const report = game.scoutReports?.[playerId]
      if (!report) return
      set({
        game: {
          ...game,
          scoutReports: {
            ...game.scoutReports,
            [playerId]: { ...report, shortlisted: !report.shortlisted },
          },
        },
      })
    },

    placeOutgoingBid: (playerId: string, offerAmount: number, offeredSalary: number, contractYears: number) => {
      const { game } = get()
      if (!game) return { success: false, error: 'Inget spel laddat' }
      // PÅSTÅENDEKARTAN nivå 1 (2026-08-25): roundNumber → matchday.
      // CLAUDE.md: "Använd ALDRIG roundNumber ... All ordning via matchday."
      const scheduledFixtures = game.fixtures
        .filter(f => (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) && f.status === 'scheduled')
        .sort((a, b) => (a.matchday ?? 0) - (b.matchday ?? 0))

      if (scheduledFixtures.length === 0) {
        return { success: false, error: 'Inga fler matcher denna säsong — vänta till nästa säsong' }
      }
      // Skaldiskrepans fixad (2026-08-25, se BACKLOG.md): roundNumber → matchday
      // — samma skala som transferProcessor.ts jämför expiresRound/createdRound mot.
      const currentRound = game.currentMatchday ?? 0
      const result = createOutgoingBid(game, playerId, offerAmount, offeredSalary, contractYears, currentRound)
      if (!result.success || !result.bid) return { success: false, error: result.error }
      set({ game: { ...game, transferBids: [...(game.transferBids ?? []), result.bid] } })
      return { success: true }
    },

    respondToOutgoingBid: (bidId: string, choiceId: 'raise' | 'withdraw') => {
      const { game } = get()
      if (!game) return { success: false, error: 'Inget spel laddat' }
      const bid = (game.transferBids ?? []).find(b => b.id === bidId)
      if (!bid || bid.direction !== 'outgoing' || bid.status !== 'pending' || (bid.counterCount ?? 0) < 1) {
        return { success: false, error: 'Motbudet hittades inte' }
      }

      const currentRound = game.currentMatchday ?? 0
      if (choiceId === 'withdraw') {
        set({
          game: {
            ...game,
            transferBids: game.transferBids.map(b => b.id === bidId
              ? { ...b, status: 'expired' as const, resolvedRound: currentRound }
              : b),
          },
        })
        return { success: true }
      }

      const counterAmount = getCounterOfferAmount(bid, game).amount
      const club = game.clubs.find(c => c.id === game.managedClubId)
      if (!club) return { success: false, error: 'Ingen klubb hittad' }
      const budget = getTransferBudgetSummary(game, bid.id)
      if (budget.available < counterAmount) return { success: false, error: 'Otillräcklig tillgänglig transferbudget' }
      if (club.finances - counterAmount < -100000) return { success: false, error: 'Budet skulle föra kassan under −100 000 kr' }

      set({
        game: {
          ...game,
          transferBids: game.transferBids.map(b => b.id === bidId
            ? { ...b, offerAmount: counterAmount, expiresRound: currentRound + 1 }
            : b),
        },
      })
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
      // Prestationsfaktor (DOM_FRAMGANGSKURVAN_2026-08-27, anspråk 1) lades
      // till 2026-08-27 — formeln bor nu i computeContractMinSalary
      // (economyService.ts), EN SANNING, ETT STÄLLE (var duplicerad på tre
      // ställen: här, ContractsTab.tsx och transferService.ts).
      const leagueAverages = computeLeaguePositionAverages(game)
      const minSalary = computeContractMinSalary(player, club, leagueAverages)
      const negotiation = evaluateContractOffer(
        player,
        minSalary,
        newSalary,
        years,
        mulberry32(fixtureSeed(`${game.id}:${playerId}:${game.currentSeason}:${newSalary}:${years}:renew`)),
      )
      if (!negotiation.accepted) {
        return { success: false, error: `${player.firstName} avvisar erbjudandet — vill ha minst ${formatSalary(negotiation.counterSalary ?? minSalary)}` }
      }

      const currentWageBill = game.players
        .filter(p => p.clubId === game.managedClubId)
        .reduce((sum, p) => sum + p.salary, 0)
      const projectedWageBill = currentWageBill - player.salary + newSalary

      // A-H2b (DOM_AH2B_RETENTION_2026-08-28), rapportfråga 2 — feltecknad
      // straff, RÄTTAD: PT-13 (2026-08-?, "fix: PT-4/13/14/15") skrev denna
      // −12:a när `minSalary` var en ren ability/rykte-formel utan
      // performanceFactor — "signing at minimum salary costs goodwill" (att
      // pruta ner spelaren till lagligt golv utan påslag). O5 kraft 1
      // (2026-08-27) lade performanceFactor OVANPÅ golvet i
      // computeContractMinSalary — minSalary ÄR NU marknadskravet självt
      // (höjt för överpresterare), inte ett lågt golv man kan pruta till.
      // isMinSalary betyder alltså idag "betalade EXAKT vad marknaden kräver",
      // inte "prutade ner spelaren" — att straffa det är exakt det domen
      // varnade för ("att betala marknadsnivå ska inte förolämpa"). A-H2b:s
      // egen mekanik (contractDemandService.ts) äger nu morale-konsekvensen
      // av lönebeslut: möta kravet = neutral, INTE möta det = erosion. Denna
      // manuella förlängningsväg ska spegla samma princip, inte en egen,
      // motsatt regel.
      const updatedPlayers = game.players.map(p =>
        p.id === playerId
          ? { ...p, contractUntilSeason: game.currentSeason + years, salary: newSalary }
          : p
      )

      // Framgångskurvan steg 3, del 1 (DOM_FRAMGANGSKURVAN_2026-08-27, anspråk 3):
      // kontraktsförlängningar loggades tidigare inte alls — investSurplus (nästa
      // steg) behöver kunna se att en förlängning HÄNT under säsongen. amount=0:
      // det är en händelsemarkör ("ett investeringsbeslut togs"), inte en
      // kassaflödespost — själva lönekostnaden bärs redan av den befintliga
      // veckovisa 'wages'-raden i calcRoundIncome/economyProcessor.ts, som läser
      // player.salary (redan uppdaterat ovan) varje omgång. Att lägga en icke-noll
      // summa här hade dubbelräknat lönehöjningen.
      const extensionEntry: FinanceEntry = {
        round: game.currentMatchday ?? 0,
        amount: 0,
        reason: 'contract_extension',
        label: `Kontraktsförlängning — ${player.firstName} ${player.lastName} (${formatSalary(newSalary)}/${game.currentSeason + years})`,
      }
      const updatedFinanceLog = appendFinanceLog(game.financeLog ?? [], extensionEntry)

      // Framgångskurvan steg 3 fix (2026-08-28): dedikerad, ocappad säsongsräknare
      // för investSurplus — financeLog-posten ovan trängs ut av FINANCE_LOG_MAX
      // (50) i en händelserik säsong, se SaveGame.ts's kommentar på fältet.
      const updatedExtensionCount = (game.seasonContractExtensionCount ?? 0) + 1

      set({ game: { ...game, players: updatedPlayers, financeLog: updatedFinanceLog, seasonContractExtensionCount: updatedExtensionCount } })
      return {
        success: true,
        wageWarning: projectedWageBill > club.wageBudget
          ? projectedWageBill - club.wageBudget
          : undefined,
      }
    },

    signFreeAgent: (agentId: string, offeredSalary: number, contractYears: number) => {
      const { game } = get()
      if (!game) return { success: false, error: 'Inget spel laddat' }
      const agent = game.transferState.freeAgents.find(p => p.id === agentId)
      if (!agent) return { success: false, error: 'Spelaren hittades inte' }
      const club = game.clubs.find(c => c.id === game.managedClubId)
      if (!club) return { success: false, error: 'Ingen klubb hittad' }

      const leagueAverages = computeLeaguePositionAverages(game)
      const minSalary = computeContractMinSalary(agent, club, leagueAverages)
      const negotiation = evaluateContractOffer(
        agent,
        minSalary,
        offeredSalary,
        contractYears,
        mulberry32(fixtureSeed(`${game.id}:${agentId}:${game.currentSeason}:${offeredSalary}:${contractYears}:free-agent`)),
      )
      if (!negotiation.accepted) {
        return { success: false, error: `${agent.firstName} avvisar erbjudandet — vill ha minst ${formatSalary(negotiation.counterSalary ?? minSalary)}` }
      }

      // tenure-falt-joinedclubseason (DOM 2026-09-03): friövergång är ett av
      // domens tre skrivställen.
      const agentWithClub = {
        ...agent,
        clubId: game.managedClubId,
        joinedClubSeason: game.currentSeason,
        salary: offeredSalary,
        contractUntilSeason: game.currentSeason + contractYears,
      }
      const updatedPlayers = [...game.players, agentWithClub]
      const updatedFreeAgents = game.transferState.freeAgents.filter(p => p.id !== agentId)
      const updatedClubs = game.clubs.map(c =>
        c.id === game.managedClubId
          ? { ...c, squadPlayerIds: [...c.squadPlayerIds, agentId] }
          : c
      )

      const currentWageBill = game.players
        .filter(p => p.clubId === game.managedClubId)
        .reduce((sum, p) => sum + p.salary, 0)
      const updatedGame: SaveGame = {
          ...game,
          players: updatedPlayers,
          clubs: updatedClubs,
          transferState: { ...game.transferState, freeAgents: updatedFreeAgents },
        }
      set({
        game: {
          ...updatedGame,
          eventLedger: logEvent(updatedGame, {
            type: 'transfer_signed',
            semanticKey: `free-agent:${agentId}:${game.currentSeason}:${game.currentMatchday ?? 0}`,
            season: game.currentSeason,
            matchday: game.currentMatchday ?? 0,
            subject: { kind: 'player', id: agentId },
            subject2: { kind: 'club', id: game.managedClubId },
            significance: 40,
            madeByPlayer: true,
          }),
        },
      })
      const projectedWageBill = currentWageBill + offeredSalary
      return {
        success: true,
        wageWarning: projectedWageBill > club.wageBudget
          ? projectedWageBill - club.wageBudget
          : undefined,
      }
    },

    listPlayerForSale: (playerId: string) => {
      const { game } = get()
      if (!game) return { success: false, error: 'Inget spel laddat' }
      const player = game.players.find(p => p.id === playerId)
      if (!player) return { success: false, error: 'Spelaren hittades inte' }

      const otherClubs = game.clubs.filter(c => c.id !== game.managedClubId)
      if (otherClubs.length === 0) return { success: false, error: 'Inga motståndarklubbar tillgängliga' }

      const existingListings = (game.transferBids ?? []).filter(b => b.playerId === playerId).length
      const listingSeed = `${game.id}:${game.currentSeason}:${playerId}:${existingListings}`
      const buyingClub = seededPick(otherClubs, listingSeed)
      const marketVal = player.marketValue ?? 50000
      const offerAmount = Math.round(marketVal * 0.9 / 5000) * 5000
      const offeredSalary = Math.round(player.salary * 1.1 / 1000) * 1000
      // Skaldiskrepans fixad (2026-08-25, se BACKLOG.md): roundNumber → matchday.
      const currentRound = Math.max(0, ...game.fixtures.filter(f => f.status === 'completed' && !f.isCup && !f.isKnockout).map(f => f.matchday ?? 0))
      const bid = {
        id: `bid_sell_${fixtureSeed(listingSeed)}_${playerId}`,
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
     * samma orsak/verkan-fångst som resolveEvent-vägen. Två skal, samma
     * kärna, glidna isär.
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
      // HIGH 6 (Jacobs körorder 2026-08-31): respondToIncomingBid är alltid
      // spelarens svar på Marknad-skärmen — aldrig en auto-resolution.
      const afterResolve = resolveEvent(gameWithEvent, event.id, choiceId, undefined, true)

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
      // Skaldiskrepans fixad (2026-08-25, se BACKLOG.md): roundNumber → matchday.
      const currentRound = Math.max(0, ...game.fixtures.filter(f => f.status === 'completed' && !f.isCup && !f.isKnockout).map(f => f.matchday ?? 0))
      const rand = Math.random.bind(Math)
      const updatedClubs = applyFinanceChange(game.clubs, game.managedClubId, -SEEK_COST)
      const financeLog = appendFinanceLog(game.financeLog ?? [], {
        round: game.currentMatchday ?? currentRound,
        amount: -SEEK_COST,
        reason: 'event',
        label: 'Sponsorsökning',
      })
      const sponsor = generateSponsorOffer(club.reputation, activeSponsors.length, maxSponsors, currentRound, rand)
      if (!sponsor) {
        set({ game: { ...game, clubs: updatedClubs, financeLog } })
        return { success: false, error: 'Ingen sponsor intresserad den här gången' }
      }
      set({ game: { ...game, clubs: updatedClubs, sponsors: [...(game.sponsors ?? []), sponsor], financeLog } })
      return { success: true, sponsor }
    },
  }
}
