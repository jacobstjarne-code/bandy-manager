import type { SaveGame } from '../../entities/SaveGame'
import type { GameEvent, TransferBid } from '../../entities/GameEvent'
import type { Fixture } from '../../entities/Fixture'
import { pickStarPerformanceText } from '../../data/eventCardInlineStrings'
import { generatePressConference } from '../pressConferenceService'
import { generateSponsorOffer } from '../sponsorService'
import {
  bidReceivedEvent,
  bidWarEvent,
  hesitantPlayerEvent,
  contractRequestEvent,
  unhappyPlayerEvent,
  generateDayJobConflictEvent,
  generatePromotionOfferEvent,
  generateShiftConflictEvent,
  generateCoworkerBondEvent,
  generateVarselEvent,
  generatePlayerMediaEvent,
  generatePlayerPraiseEvent,
  generateCaptainSpeechEvent,
  generateMecenatInterventionEvent,
  generateJournalistExclusiveEvent,
  formatValue,
} from './eventFactories'
import { findEmployerForJob } from '../../data/localEmployers'
import { generateSilentShoutEvent, generateMecenatConflictEvent, generateMecenatAllianceEvent } from '../mecenatService'

// ── generatePostAdvanceEvents ──────────────────────────────────────────────
export function generatePostAdvanceEvents(
  game: SaveGame,
  newBids: TransferBid[],
  roundPlayed: number,
  rand: () => number,
  justCompletedFixture?: Fixture,
): GameEvent[] {
  const events: GameEvent[] = []
  const alreadyQueued = new Set([
    ...(game.pendingEvents ?? []).map(e => e.id),
    ...(game.resolvedEventIds ?? []),
  ])

  // 0. Press conference after managed match
  if (justCompletedFixture) {
    const pressEvent = generatePressConference(justCompletedFixture, game, rand)
    if (pressEvent && !alreadyQueued.has(pressEvent.id)) {
      events.push(pressEvent)
    }
  }

  // 1. Incoming transfer bids → events
  for (const bid of newBids) {
    if (events.length >= 2) break
    const eid = `event_bid_${bid.id}`
    if (!alreadyQueued.has(eid)) {
      events.push(bidReceivedEvent(bid, game))
    }
  }

  // 1b. Re-surface existing pending incoming bids (e.g. after counter-offer)
  const existingPendingBids = (game.transferBids ?? []).filter(
    b => b.direction === 'incoming' && b.status === 'pending',
  )
  for (const bid of existingPendingBids) {
    if (events.length >= 2) break
    const eid = `event_bid_${bid.id}`
    if (alreadyQueued.has(eid)) continue
    if ((bid.counterCount ?? 0) >= 1) {
      // AI responds to counter — accept if ≥1.5x market value, otherwise withdraw
      const player = game.players.find(p => p.id === bid.playerId)
      const marketVal = player?.marketValue ?? 50000
      const buyingClub = game.clubs.find(c => c.id === bid.buyingClubId)
      const clubName = buyingClub?.name ?? 'Köparklubben'
      const playerName = player ? `${player.firstName} ${player.lastName}` : 'spelaren'
      if (bid.offerAmount >= marketVal * 1.5) {
        events.push({
          id: `event_bid_aiaccept_${bid.id}`,
          type: 'transferBidReceived',
          title: `${clubName} accepterar din motbud`,
          body: `${clubName} godkänner det höjda kravet på ${formatValue(bid.offerAmount)} för ${playerName}. Bekräfta försäljningen.`,
          choices: [{
            id: 'confirm',
            label: `Genomför transfer (${formatValue(bid.offerAmount)})`,
            subtitle: `💰 +${formatValue(bid.offerAmount)} · spelaren lämnar`,
            effect: { type: 'acceptTransfer', bidId: bid.id, targetPlayerId: bid.playerId, targetClubId: bid.buyingClubId },
          }],
          relatedPlayerId: bid.playerId,
          relatedBidId: bid.id,
          resolved: false,
        })
      } else {
        events.push({
          id: `event_bid_aireject_${bid.id}`,
          type: 'transferBidReceived',
          title: `${clubName} drar sig ur`,
          body: `${clubName} accepterar inte din prissättning på ${formatValue(bid.offerAmount)} för ${playerName} och drar tillbaka budet.`,
          choices: [{
            id: 'ok',
            label: 'OK',
            subtitle: 'Budet avslaget',
            effect: { type: 'rejectTransfer', bidId: bid.id, targetPlayerId: bid.playerId },
          }],
          relatedPlayerId: bid.playerId,
          relatedBidId: bid.id,
          resolved: false,
        })
      }
    } else {
      events.push(bidReceivedEvent(bid, game))
    }
  }

  if (events.length >= 2) return events

  // 2. Contract requests (CA > 50, < 1 season left, managed club)
  const CONTRACT_ROUNDS = [5, 10, 15, 20]
  if (CONTRACT_ROUNDS.includes(roundPlayed)) {
    const handledIds = new Set(game.handledContractPlayerIds ?? [])
    const contractCandidates = game.players
      .filter(p =>
        p.clubId === game.managedClubId &&
        p.currentAbility > 50 &&
        p.contractUntilSeason <= game.currentSeason + 1 &&
        !handledIds.has(p.id)
      )
      .sort((a, b) => b.currentAbility - a.currentAbility)

    if (contractCandidates.length > 0 && events.length < 2) {
      const p = contractCandidates[0]
      events.push(contractRequestEvent(game, p.id))
    }
  }

  if (events.length >= 2) return events

  // 3. Unhappy players (morale < 35, bänkad 3+ matcher) — simplified check
  const recentFixtures = game.fixtures
    .filter(f => f.status === 'completed' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
    .sort((a, b) => b.roundNumber - a.roundNumber)
    .slice(0, 3)

  const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId && !p.isInjured)
  for (const p of managedPlayers) {
    if (events.length >= 2) break
    if (p.morale >= 35) continue

    // Check if benched in last 3 matches
    const benchedCount = recentFixtures.filter(f => {
      const lineup = f.homeClubId === game.managedClubId ? f.homeLineup : f.awayLineup
      return lineup && lineup.benchPlayerIds.includes(p.id) && !lineup.startingPlayerIds.includes(p.id)
    }).length

    if (benchedCount >= 2) {
      const eid = `event_unhappy_${p.id}_${game.currentSeason}`
      if (!alreadyQueued.has(eid)) {
        events.push(unhappyPlayerEvent(game, p.id))
      }
    }
  }

  if (events.length >= 2) return events

  // 4. Star performance (8.5+ rating, auto-resolve with morale boost — add as resolved=false with single choice)
  const lastFixture = recentFixtures[0]
  if (lastFixture?.report?.playerRatings && rand() > 0.5) {
    for (const [pid, rating] of Object.entries(lastFixture.report.playerRatings)) {
      if (events.length >= 2) break
      if (rating < 8.5) continue

      const player = game.players.find(p => p.id === pid)
      if (!player || player.clubId !== game.managedClubId) continue
      const eid = `event_star_${pid}_${roundPlayed}`
      if (alreadyQueued.has(eid)) continue

      events.push({
        id: eid,
        type: 'starPerformance',
        title: `⭐ Stjärnprestation — ${player.firstName} ${player.lastName}`,
        body: pickStarPerformanceText(player, rating, roundPlayed),
        choices: [
          {
            id: 'ok',
            label: 'Bra jobbat!',
            subtitle: '+5 moral',
            effect: { type: 'boostMorale', targetPlayerId: pid, value: 5 },
          },
        ],
        relatedPlayerId: pid,
        resolved: false,
      })
      break
    }
  }

  if (events.length >= 2) return events

  // 5. Day job conflict (~15% chance per round, max one per 5-round period per player)
  if (events.length < 2 && rand() < 0.15) {
    const recentCompleted = game.fixtures
      .filter(f =>
        f.status === 'completed' &&
        (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
      )
      .sort((a, b) => b.roundNumber - a.roundNumber)
      .slice(0, 5)

    const dayJobCandidates = game.players.filter(p =>
      p.clubId === game.managedClubId &&
      !p.isInjured &&
      !(p.isFullTimePro ?? false) &&
      (p.dayJob?.flexibility ?? 75) < 70
    )

    for (const p of dayJobCandidates) {
      if (events.length >= 2) break
      const gamesInLast5 = recentCompleted.filter(f => {
        const lineup = f.homeClubId === game.managedClubId ? f.homeLineup : f.awayLineup
        return lineup && lineup.startingPlayerIds.includes(p.id)
      }).length
      if (gamesInLast5 >= 3) {
        const period = Math.floor(roundPlayed / 5)
        const eid = `event_dayjob_${p.id}_period${period}`
        if (!alreadyQueued.has(eid)) {
          events.push(generateDayJobConflictEvent(p, roundPlayed))
        }
      }
    }
  }

  if (events.length >= 2) return events

  // 5b. Promotion offer (~5% per round, player with dayJob, flexibility > 60, morale > 50)
  if (events.length < 2 && rand() < 0.05) {
    const promoCandidates = game.players.filter(p =>
      p.clubId === game.managedClubId &&
      !p.isFullTimePro &&
      p.dayJob &&
      (p.dayJob.flexibility ?? 75) > 60 &&
      p.morale > 50
    )
    if (promoCandidates.length > 0) {
      const pick = promoCandidates[Math.floor(rand() * promoCandidates.length)]
      const eid = `event_promotion_${pick.id}_s${game.currentSeason}`
      if (!alreadyQueued.has(eid)) {
        events.push(generatePromotionOfferEvent(pick))
      }
    }
  }

  // 5c. Shift conflict (~8% per round, day job + low flexibility)
  if (events.length < 2 && rand() < 0.08) {
    const shiftCandidates = game.players.filter(p =>
      p.clubId === game.managedClubId &&
      !p.isFullTimePro &&
      p.dayJob &&
      (p.dayJob.flexibility ?? 75) < 65
    )
    if (shiftCandidates.length > 0) {
      const pick = shiftCandidates[Math.floor(rand() * shiftCandidates.length)]
      const eid = `event_shift_${pick.id}_r${roundPlayed}`
      if (!alreadyQueued.has(eid)) {
        events.push(generateShiftConflictEvent(pick, roundPlayed))
      }
    }
  }

  // 5d. Coworker bond (~3% per round, two non-pro players at same employer)
  if (events.length < 2 && rand() < 0.03) {
    const nonProPlayers = game.players.filter(p =>
      p.clubId === game.managedClubId &&
      !p.isFullTimePro &&
      p.dayJob
    )
    for (let i = 0; i < nonProPlayers.length && events.length < 2; i++) {
      for (let j = i + 1; j < nonProPlayers.length; j++) {
        const emp1 = findEmployerForJob(game.managedClubId, nonProPlayers[i].dayJob!.title)
        const emp2 = findEmployerForJob(game.managedClubId, nonProPlayers[j].dayJob!.title)
        if (emp1 && emp2 && emp1.name === emp2.name) {
          const eid = `event_bond_${nonProPlayers[i].id}_${nonProPlayers[j].id}`
          if (!alreadyQueued.has(eid)) {
            events.push(generateCoworkerBondEvent(nonProPlayers[i], nonProPlayers[j], emp1.name))
            break
          }
        }
      }
    }
  }

  // 5e. Varsel (once per season, round 8-14, 10% chance, affects large employer)
  if (events.length < 2 && roundPlayed >= 8 && roundPlayed <= 14 && rand() < 0.10) {
    const eid = `event_varsel_s${game.currentSeason}`
    if (!alreadyQueued.has(eid)) {
      const nonProWithJob = game.players.filter(p =>
        p.clubId === game.managedClubId &&
        !p.isFullTimePro &&
        p.dayJob
      )
      // Group by employer
      const byEmployer = new Map<string, typeof nonProWithJob>()
      for (const p of nonProWithJob) {
        const emp = findEmployerForJob(game.managedClubId, p.dayJob!.title)
        if (emp && emp.size !== 'small') {
          const key = emp.name
          if (!byEmployer.has(key)) byEmployer.set(key, [])
          byEmployer.get(key)!.push(p)
        }
      }
      // Pick the largest group
      let bestKey = ''
      let bestCount = 0
      for (const [key, group] of byEmployer) {
        if (group.length > bestCount) { bestKey = key; bestCount = group.length }
      }
      if (bestKey && bestCount >= 1) {
        events.push(generateVarselEvent(byEmployer.get(bestKey)!, bestKey, game.currentSeason))
      }
    }
  }

  if (events.length >= 2) return events

  // 5f. Player media comment — unhappy benched player talks to press
  if (events.length < 2 && rand() < 0.12) {
    const mediaCandidates = game.players.filter(p => {
      if (p.clubId !== game.managedClubId) return false
      if (p.morale >= 30) return false
      if (p.currentAbility < 55) return false
      // Check: played < 3 of last 10 fixtures
      const recentFixtures = game.fixtures
        .filter(f => f.status === 'completed' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
        .sort((a, b) => b.roundNumber - a.roundNumber)
        .slice(0, 10)
      const gamesStarted = recentFixtures.filter(f => {
        const lineup = f.homeClubId === game.managedClubId ? f.homeLineup : f.awayLineup
        return lineup?.startingPlayerIds?.includes(p.id)
      }).length
      return gamesStarted < 3
    })
    if (mediaCandidates.length > 0) {
      const pick = mediaCandidates[Math.floor(rand() * mediaCandidates.length)]
      const eid = `event_media_${pick.id}_r${roundPlayed}`
      if (!alreadyQueued.has(eid)) {
        const journalist = game.localPaperName ?? 'Lokaltidningen'
        events.push(generatePlayerMediaEvent(pick, journalist))
      }
    }
  }

  // 5g. Player praise — happy player praises teammate (15% per match with goals)
  if (events.length < 2 && justCompletedFixture && rand() < 0.15) {
    const happyPlayers = game.players.filter(p =>
      p.clubId === game.managedClubId && p.morale > 75
    )
    const goalScorers = justCompletedFixture.events
      .filter(e => e.type === 'goal' && e.clubId === game.managedClubId && e.playerId)
      .map(e => game.players.find(p => p.id === e.playerId))
      .filter(Boolean)
    if (happyPlayers.length > 0 && goalScorers.length > 0) {
      const praiser = happyPlayers[Math.floor(rand() * happyPlayers.length)]
      const praised = goalScorers[Math.floor(rand() * goalScorers.length)]!
      if (praiser.id !== praised.id) {
        const eid = `event_praise_${praiser.id}_${praised.id}_s${game.currentSeason}`
        if (!alreadyQueued.has(eid)) {
          events.push(generatePlayerPraiseEvent(praiser, praised))
        }
      }
    }
  }

  // 5h. Captain speech — 3+ losses in a row, captain morale > 50, max 1 per season
  if (events.length < 2) {
    const recentResults = game.fixtures
      .filter(f => f.status === 'completed' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) && !f.isCup)
      .sort((a, b) => b.roundNumber - a.roundNumber)
      .slice(0, 3)
    const allLosses = recentResults.length >= 3 && recentResults.every(f => {
      const isHome = f.homeClubId === game.managedClubId
      return isHome ? f.homeScore < f.awayScore : f.awayScore < f.homeScore
    })
    if (allLosses) {
      const eid = `event_captain_speech_s${game.currentSeason}`
      if (!alreadyQueued.has(eid)) {
        const managedClub = game.clubs.find(c => c.id === game.managedClubId)
        const captain = game.captainPlayerId
          ? game.players.find(p => p.id === game.captainPlayerId)
          : game.players.find(p =>
              p.clubId === game.managedClubId && p.morale > 50 &&
              p.age >= 25 && p.currentAbility >= 50
            )
        if (captain && managedClub) {
          events.push(generateCaptainSpeechEvent(captain, managedClub.name, game.currentSeason))
        }
      }
    }
  }

  if (events.length >= 2) return events

  // 5j. Silent shout events (mecenat influence thresholds)
  for (const mec of game.mecenater ?? []) {
    if (events.length >= 2) break
    if (!mec.isActive || mec.silentShout < 30) continue
    const shoutEvent = generateSilentShoutEvent(mec, undefined, rand)
    if (shoutEvent && !alreadyQueued.has(shoutEvent.id)) {
      events.push(shoutEvent)
    }
  }

  // 5k. Mecenat conflict (~3% if 2+ active mecenater)
  if (events.length < 2) {
    const activeMecs = (game.mecenater ?? []).filter(m => m.isActive)
    if (activeMecs.length >= 2 && rand() < 0.03) {
      const m1 = activeMecs[0]
      const m2 = activeMecs[1]
      const eid = `event_conflict_${m1.id}_${m2.id}_r${roundPlayed}`
      if (!alreadyQueued.has(eid)) {
        events.push(generateMecenatConflictEvent(m1, m2))
      }
    }
  }

  if (events.length >= 2) return events

  // 5k2. Mecenat alliance (~2% if 2+ active mecenater with both happiness >= 60)
  if (events.length < 2) {
    const happyMecs = (game.mecenater ?? []).filter(m => m.isActive && m.happiness >= 60)
    if (happyMecs.length >= 2 && rand() < 0.02) {
      const m1 = happyMecs[0]
      const m2 = happyMecs[1]
      const eid = `event_alliance_${m1.id}_${m2.id}`
      if (!alreadyQueued.has(eid)) {
        // Föreslå ett projekt som passar deras kombinerade intresse
        const projectNames = ['en ny värmestuga', 'uppgradering av strålkastarna', 'omklädningsrummet']
        const projectName = projectNames[Math.floor(rand() * projectNames.length)]
        events.push(generateMecenatAllianceEvent(m1, m2, projectName))
      }
    }
  }

  if (events.length >= 2) return events

  // 5l. Mecenat intervention — happiness < 40, no existing intervention queued this season
  for (const mec of game.mecenater ?? []) {
    if (events.length >= 2) break
    if (!mec.isActive || mec.happiness >= 40) continue
    const eid = `event_mec_intervention_${mec.id}_r${roundPlayed}`
    const alreadyHasIntervention = [...alreadyQueued].some(id => id.startsWith(`event_mec_intervention_${mec.id}`))
    if (!alreadyQueued.has(eid) && !alreadyHasIntervention) {
      events.push(generateMecenatInterventionEvent(mec, roundPlayed))
    }
  }

  if (events.length >= 2) return events

  // 5m. Journalist exclusive offer — relationship >= 65, ~15% chance, once per season per player
  if (events.length < 2) {
    const j = game.journalist
    if (j && j.relationship >= 65 && rand() < 0.15) {
      const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId && !p.isInjured)
      if (managedPlayers.length > 0) {
        const subject = managedPlayers.reduce((best, p) => p.currentAbility > best.currentAbility ? p : best, managedPlayers[0])
        const eid = `event_journalist_exclusive_${subject.id}_r${roundPlayed}`
        const alreadyThisSeason = [...alreadyQueued].some(id => id.startsWith(`event_journalist_exclusive_`) && id.includes(`_r${roundPlayed}`))
        if (!alreadyQueued.has(eid) && !alreadyThisSeason) {
          events.push(generateJournalistExclusiveEvent(j.name, j.outlet, subject, roundPlayed))
        }
      }
    }
  }

  if (events.length >= 2) return events

  // 6a. Bid war (pending outgoing bid, 20% chance per round)
  const pendingOutgoing = (game.transferBids ?? []).filter(
    b => b.direction === 'outgoing' && b.status === 'pending'
  )
  for (const bid of pendingOutgoing) {
    if (events.length >= 2) break
    if (rand() > 0.20) continue
    const eid = `event_bidwar_${bid.id}`
    if (!alreadyQueued.has(eid)) {
      events.push(bidWarEvent(bid, game))
    }
  }

  if (events.length >= 2) return events

  // 6b. Hesitant player (outgoing bid just resolved as accepted, player CA > club avg)
  const justAccepted = (game.transferBids ?? []).filter(
    b => b.direction === 'outgoing' && b.status === 'accepted' && b.expiresRound === roundPlayed
  )
  if (justAccepted.length > 0) {
    const managedPlayersForHesitant = game.players.filter(p => p.clubId === game.managedClubId)
    const avgCA = managedPlayersForHesitant.length > 0
      ? managedPlayersForHesitant.reduce((s, p) => s + p.currentAbility, 0) / managedPlayersForHesitant.length
      : 0
    for (const bid of justAccepted) {
      if (events.length >= 2) break
      const target = game.players.find(p => p.id === bid.playerId)
      if (!target || target.currentAbility <= avgCA) continue
      const eid = `event_hesitant_${bid.id}`
      if (!alreadyQueued.has(eid)) {
        events.push(hesitantPlayerEvent(bid, game))
      }
    }
  }

  if (events.length >= 2) return events

  // 6. Sponsor offer
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  const activeSponsors = (game.sponsors ?? []).filter(s => s.contractRounds > 0)
  const maxSponsors = Math.min(6, 2 + Math.floor((managedClub?.reputation ?? 50) / 20))

  // Spöksponsorn — one-time if desperate
  if (events.length < 2) {
    const spookId = 'ghostSponsorOffered'
    const managedClubForSpook = game.clubs.find(c => c.id === game.managedClubId)
    if (
      !alreadyQueued.has(spookId) &&
      (managedClubForSpook?.finances ?? 0) < 0 &&
      (managedClubForSpook?.reputation ?? 0) > 60 &&
      !game.patron &&
      (game.currentSeason ?? 1) >= 2
    ) {
      events.push({
        id: spookId,
        type: 'spoksponsor',
        title: 'Okänt nummer',
        body: 'En affärsman ringer. Han har hört om er situation och vill investera 150 000 kr. I gengäld vill han sitta med på styrelsemöten och ha inflytande.',
        choices: [
          {
            id: 'accept',
            label: 'Tacka ja — desperatläget kräver det',
            subtitle: '💰 +150 tkr · ⭐ -5 communityStanding',
            effect: { type: 'multiEffect', subEffects: JSON.stringify([
              { type: 'income', amount: 150000 },
              { type: 'communityStanding', amount: -5 },
            ]) },
          },
          {
            id: 'decline',
            label: 'Tacka nej — vi klarar oss på annat sätt',
            subtitle: '⚠️ -5 styrelsens tålamod',
            effect: { type: 'boardPatience', amount: -5 },
          },
        ],
        resolved: false,
      })
    }
  }

  // Det omöjliga valet — one-time financial crisis
  if (events.length < 2) {
    const omojligId = `detOmojligaValet_${game.currentSeason}`
    const managedClubOmojlig = game.clubs.find(c => c.id === game.managedClubId)
    if (
      !alreadyQueued.has(omojligId) &&
      (managedClubOmojlig?.finances ?? 0) < -50000 &&
      (game.communityStanding ?? 50) > 60
    ) {
      const academyProspect = game.players.find(p =>
        p.clubId === game.managedClubId &&
        p.promotedFromAcademy === true &&
        (p.currentAbility ?? 0) > 50
      )
      if (academyProspect) {
        const playerName = `${academyProspect.firstName} ${academyProspect.lastName}`
        events.push({
          id: omojligId,
          type: 'detOmojligaValet',
          title: 'Det omöjliga valet',
          body: `Licensnämnden kräver positivt kapital. Du har en akademiprodukt värd pengar — ${playerName}. Hela orten älskar honom. Säljer du honom räddar du klubben, men skadar ditt rykte.`,
          relatedPlayerId: academyProspect.id,
          choices: [
            {
              id: 'sell',
              label: `Sälj ${playerName} — rädda klubben (180 000 kr)`,
              subtitle: '💰 +180 tkr · ⭐ -12 communityStanding · 💛 -15 fanMood',
              effect: { type: 'multiEffect', subEffects: JSON.stringify([
                { type: 'income', amount: 180000 },
                { type: 'communityStanding', amount: -12 },
                { type: 'fanMood', amount: -15 },
                { type: 'journalistRelationship', amount: -10 },
              ]) },
            },
            {
              id: 'keep',
              label: 'Behåll honom — riskera licensproblem',
              subtitle: '⭐ +5 communityStanding · 💛 +8 fanMood',
              effect: { type: 'multiEffect', subEffects: JSON.stringify([
                { type: 'communityStanding', amount: 5 },
                { type: 'fanMood', amount: 8 },
              ]) },
            },
          ],
          resolved: false,
        })
      }
    }
  }

  if (activeSponsors.length < maxSponsors) {
    const offer = generateSponsorOffer(
      managedClub?.reputation ?? 50,
      activeSponsors.length,
      maxSponsors,
      roundPlayed,
      rand
    )
    if (offer) {
      const totalValue = offer.weeklyIncome * offer.contractRounds
      const weeklyFmt = offer.weeklyIncome >= 1000
        ? `${Math.round(offer.weeklyIncome / 1000)}k kr`
        : `${offer.weeklyIncome} kr`
      const totalFmt = totalValue >= 1000000
        ? `${(totalValue / 1000000).toFixed(1)} mkr`
        : totalValue >= 1000
        ? `${Math.round(totalValue / 1000)}k kr`
        : `${totalValue} kr`

      events.push({
        id: `event_sponsor_${offer.id}`,
        type: 'sponsorOffer',
        title: `Sponsorerbjudande — ${offer.name}`,
        body: `${offer.name} vill sponsra ${managedClub?.name ?? 'klubben'} med ${weeklyFmt}/vecka i ${offer.contractRounds} omgångar (totalt ${totalFmt}).`,
        relatedPlayerId: undefined,
        relatedClubId: undefined,
        choices: [
          {
            id: 'accept',
            label: `Acceptera (${weeklyFmt}/vecka)`,
            subtitle: `💰 +${totalFmt} totalt`,
            effect: { type: 'acceptSponsor', sponsorData: JSON.stringify(offer) },
          },
          {
            id: 'reject',
            label: 'Avslå',
            subtitle: 'Inga effekter',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
        sponsorData: JSON.stringify(offer),
      })
    }
  }

  return events
}
