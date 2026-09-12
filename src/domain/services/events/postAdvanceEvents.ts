import type { SaveGame, Sponsor } from '../../entities/SaveGame'
import type { GameEvent, TransferBid } from '../../entities/GameEvent'
import type { Fixture } from '../../entities/Fixture'
import { pickStarPerformanceText } from '../../data/eventCardInlineStrings'
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
  coworkerBondEventId,
  generateVarselEvent,
  varselEventId,
  generatePlayerMediaEvent,
  generatePlayerPraiseEvent,
  generateCaptainSpeechEvent,
  generateMecenatInterventionEvent,
  generateJournalistExclusiveEvent,
} from './eventFactories'
import { formatValue, formatDecimalComma } from '../../format'
import { findEmployerForJob } from '../../data/localEmployers'
import { generateMecenatConflictEvent, generateMecenatAllianceEvent, generateMecenatKravEvent, MECENAT_KRAV_HAPPINESS_THRESHOLD } from '../mecenatService'
import { getCsDetOmojligaValetProbability } from '../communityStandingScaling'
import { rotateSubject, genericBeatExcludeCount } from '../narrativeCoordinatorService'
import type { Player } from '../../entities/Player'
import { getKnownDecisionIdentities } from '../decisionLifecycleService'

// ── Journalistreportagets säsongsspärr + spelarrotation (A-H4a) ────────────
// Se GameEvent.journalistExclusiveKey för hela rotorsaksförklaringen.
const JOURNALIST_EXCLUSIVE_PREFIX = 'journalist_exclusive_player_'

// ── Centralredaktören, punkt 3 (docs/dom/DOM_CENTRALREDAKTOREN_2026-08-31.md) ───────
// Generiska personal-beats' subjekts-rotation. Se GameEvent.rotationKey.
const STAR_PERFORMANCE_PREFIX = 'star_performance_'
const PLAYER_MEDIA_PREFIX = 'player_media_'
const PLAYER_PRAISE_PREFIX = 'player_praise_'

export function journalistExclusiveFiredThisSeason(game: SaveGame, currentSeason: number): boolean {
  return (game.narrativeBeatLog ?? []).some(
    e => e.semanticKey.startsWith(JOURNALIST_EXCLUSIVE_PREFIX) && e.season === currentSeason,
  )
}

/**
 * "Inte samma spelare igen förrän poolen roterat": utesluter spelare som
 * redan figurerat (någonsin, career-brett) i journalistreportaget. Om ALLA
 * nuvarande truppspelare redan figurerat har poolen rullat ett fullt varv —
 * spärren släpper och hela truppen blir valbar igen.
 *
 * Centralredaktören (docs/dom/DOM_CENTRALREDAKTOREN_2026-08-31.md): pekad om till
 * den delade rotateSubject (narrativeCoordinatorService.ts) — domens ord,
 * "rör inte, det är mallen". excludeCount=Infinity reproducerar EXAKT det
 * gamla beteendet (utesluter ALLA distinkta ever-featured id ur hela
 * loggen, inte bara de N senaste) — den generiska K=5-varianten som
 * övriga personal-beats använder nedan är en AVSIKTLIGT annan, snävare
 * exkludering (se genericBeatExcludeCount), inte tillämplig här.
 */
export function pickJournalistExclusiveSubject(game: SaveGame, managedPlayers: Player[]): Player | null {
  return rotateSubject(
    managedPlayers,
    JOURNALIST_EXCLUSIVE_PREFIX,
    game,
    Infinity,
    candidates => candidates.reduce((best, p) => (p.currentAbility > best.currentAbility ? p : best), candidates[0]),
  )
}

// ── generatePostAdvanceEvents ──────────────────────────────────────────────
/**
 * PÅSTÅENDEGRINDEN nivå 2 (2026-08-24): fyra sorteringar i denna funktion
 * bytta från roundNumber till matchday (CLAUDE.md: "Använd ALDRIG
 * roundNumber ... All ordning via matchday").
 *
 * PÅSTÅENDEKARTAN omsvep (2026-08-25): hesitantPlayerEvent-gaten (6b) läser
 * här — inte i eventFactories.ts:s hesitantPlayerEvent själv — den
 * dokumenterade reputation-jämförelsen (contentContract.ts:222) mellan
 * bid.sellingClubId och bid.buyingClubId.
 *
 * @cites Fixture.matchday, bid.sellingClubId, bid.buyingClubId
 */
export function generatePostAdvanceEvents(
  game: SaveGame,
  newBids: TransferBid[],
  roundPlayed: number,
  rand: () => number,
  justCompletedFixture?: Fixture,
): GameEvent[] {
  const events: GameEvent[] = []
  const alreadyQueued = getKnownDecisionIdentities(game)

  // Centralredaktören, punkt 3: K=5-formeln (genericBeatExcludeCount) ska
  // storleksbedömas mot den TRUPP rotationen ska kännas naturlig över
  // ("en trupp på ~15 roterar naturligt", domen) — INTE mot antalet
  // kandidater som råkar kvalificera SIG DENNA OMGÅNG (typiskt 1–3 för
  // star-performance/media/praise, vilket golvar excludeCount till 0 och
  // gör rotationen i praktiken verkningslös). Mätningen
  // (centralredaktoren-matning-2026-08-31.ts) fångade detta: samma spelare
  // två raka gånger i samma beat-typ.
  const managedSquadSize = game.players.filter(p => p.clubId === game.managedClubId).length

  // 1. Incoming transfer bids → events
  for (const bid of newBids) {
    if (events.length >= 2) break
    const eid = `event_bid_${bid.id}`
    const incomingBidDue = bid.direction === 'incoming' && bid.status === 'pending' && !alreadyQueued.has(eid)
    if (incomingBidDue) {
      events.push(bidReceivedEvent(bid, game, incomingBidDue))
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
      const counterOfferAccepted = bid.offerAmount >= marketVal * 1.5
      if (counterOfferAccepted) {
        events.push({
          id: `event_bid_aiaccept_${bid.id}`,
          type: 'transferBidReceived',
          title: `${clubName} accepterar ditt motbud`,
          body: `${clubName} godkänner det höjda kravet på ${formatValue(bid.offerAmount)} för ${playerName}. Bekräfta försäljningen.`,
          proofSource: {
            form: 'state-predicate',
            description: 'motbudet är minst 1,5 gånger spelarens marknadsvärde',
            evaluatedTrue: counterOfferAccepted,
          },
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
          proofSource: {
            form: 'state-predicate',
            description: 'motbudet är lägre än 1,5 gånger spelarens marknadsvärde',
            evaluatedTrue: !counterOfferAccepted,
          },
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
      const incomingBidDue = bid.direction === 'incoming' && bid.status === 'pending' && !alreadyQueued.has(eid)
      events.push(bidReceivedEvent(bid, game, incomingBidDue))
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
      const contractRequestDue = p.clubId === game.managedClubId && p.currentAbility > 50 &&
        p.contractUntilSeason <= game.currentSeason + 1 && !handledIds.has(p.id)
      events.push(contractRequestEvent(game, p.id, contractRequestDue))
    }
  }

  if (events.length >= 2) return events

  // 3. Unhappy players (morale < 35, bänkad 3+ matcher) — simplified check
  // PÅSTÅENDEGRINDEN nivå 2 (2026-08-24): roundNumber → matchday. Samma
  // syskonbugg som de tre andra sorteringarna i denna fil (rad ~197/324/380
  // hade den redan) — global spelordning via matchday, aldrig roundNumber
  // (CLAUDE.md, Matchday-systemet). Cup/liga-interfoliering ger fel "senaste
  // matcher" annars.
  const recentFixtures = game.fixtures
    .filter(f => f.status === 'completed' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
    .sort((a, b) => (b.matchday ?? 0) - (a.matchday ?? 0))
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
      const unhappyPlayerDue = p.morale < 35 && benchedCount >= 2 && !alreadyQueued.has(eid)
      if (unhappyPlayerDue) {
        events.push(unhappyPlayerEvent(game, p.id, unhappyPlayerDue))
      }
    }
  }

  if (events.length >= 2) return events

  // 4. Star performance (8.5+ rating, auto-resolve with morale boost — add as resolved=false with single choice)
  //
  // Centralredaktören, punkt 3 (docs/dom/DOM_CENTRALREDAKTOREN_2026-08-31.md): när
  // FLERA spelare hade 8.5+ i samma match väljer rotateSubject bland de
  // kvalificerade, inte alltid rakt av högst rating — så samma spelares
  // stjärnprestation inte trycker undan en annan lagkamrats i flera raka
  // matcher. En ENSAM kandidat väljs alltid (rotateSubject faller tillbaka
  // till hela poolen om alla nyligen uteslutits) — en verklig 9.0-insats
  // trycks aldrig bort, bara ORDNINGEN mellan flera samtidiga kandidater
  // påverkas.
  const lastFixture = recentFixtures[0]
  const lastPlayerRatings = lastFixture?.report?.playerRatings
  const starPerformanceWindow = Boolean(lastPlayerRatings) && rand() > 0.5
  if (starPerformanceWindow) {
    const eligibleStars = Object.entries(lastPlayerRatings!)
      .filter(([pid, rating]) => {
        if (rating < 8.5) return false
        const player = game.players.find(p => p.id === pid)
        if (!player || player.clubId !== game.managedClubId) return false
        return !alreadyQueued.has(`event_star_${pid}_s${game.currentSeason}_r${roundPlayed}`)
      })
      .map(([pid, rating]) => ({ id: pid, pid, rating, player: game.players.find(p => p.id === pid)! }))

    if (eligibleStars.length > 0 && events.length < 2) {
      const excludeCount = genericBeatExcludeCount(managedSquadSize)
      const picked = rotateSubject(
        eligibleStars,
        STAR_PERFORMANCE_PREFIX,
        game,
        excludeCount,
        candidates => candidates.reduce((best, c) => (c.rating > best.rating ? c : best), candidates[0]),
      )
      if (picked) {
        const starPerformanceDue = starPerformanceWindow && eligibleStars.length > 0 && events.length < 2
        events.push({
          id: `event_star_${picked.pid}_s${game.currentSeason}_r${roundPlayed}`,
          type: 'starPerformance',
          title: `⭐ Stjärnprestation — ${picked.player.firstName} ${picked.player.lastName}`,
          body: pickStarPerformanceText(picked.player, picked.rating, roundPlayed),
          proofSource: {
            form: 'state-predicate',
            description: 'senaste matchen har en vald spelare i egna laget med minst 8,5 i betyg',
            evaluatedTrue: starPerformanceDue,
          },
          choices: [
            {
              id: 'ok',
              label: 'Bra jobbat!',
              subtitle: 'lyfter spelaren',
              effect: { type: 'boostMorale', targetPlayerId: picked.pid, value: 5 },
            },
          ],
          relatedPlayerId: picked.pid,
          relatedFixtureId: lastFixture.id,
          resolved: false,
          rotationKey: `${STAR_PERFORMANCE_PREFIX}${picked.pid}`,
        })
      }
    }
  }

  if (events.length >= 2) return events

  // 5. Day job conflict (~15% chance per round, max one per 5-round period per player)
  const dayJobWindow = events.length < 2 && rand() < 0.15
  if (dayJobWindow) {
    const recentCompleted = game.fixtures
      .filter(f =>
        f.status === 'completed' &&
        (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
      )
      .sort((a, b) => (b.matchday ?? 0) - (a.matchday ?? 0))
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
        const eid = `event_dayjob_${p.id}_s${game.currentSeason}`
        const semanticId = `dayJobConflict:${p.id}:s${game.currentSeason}`
        const legacyDayJobSeen = [...alreadyQueued]
          .some(identity => identity.startsWith(`event_dayjob_${p.id}_period`))
        const dayJobConflictDue = dayJobWindow
          && gamesInLast5 >= 3
          && !alreadyQueued.has(eid)
          && !alreadyQueued.has(semanticId)
          && !legacyDayJobSeen
        if (dayJobConflictDue) {
          events.push(generateDayJobConflictEvent(p, roundPlayed, dayJobConflictDue, game.currentSeason))
        }
      }
    }
  }

  if (events.length >= 2) return events

  // 5b. Promotion offer (~5% per round, player with dayJob, flexibility > 60, morale > 50)
  const promotionWindow = events.length < 2 && rand() < 0.05
  if (promotionWindow) {
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
      const promotionDue = promotionWindow && !alreadyQueued.has(eid)
      if (promotionDue) {
        events.push(generatePromotionOfferEvent(pick, game.currentSeason, promotionDue))
      }
    }
  }

  // 5c. Shift conflict (~8% per round, day job + low flexibility)
  const shiftWindow = events.length < 2 && rand() < 0.08
  if (shiftWindow) {
    const shiftCandidates = game.players.filter(p =>
      p.clubId === game.managedClubId &&
      !p.isFullTimePro &&
      p.dayJob &&
      (p.dayJob.flexibility ?? 75) < 65
    )
    if (shiftCandidates.length > 0) {
      const pick = shiftCandidates[Math.floor(rand() * shiftCandidates.length)]
      const eid = `event_shift_${pick.id}_r${roundPlayed}`
      const shiftConflictDue = shiftWindow && !alreadyQueued.has(eid)
      if (shiftConflictDue) {
        events.push(generateShiftConflictEvent(pick, roundPlayed, shiftConflictDue))
      }
    }
  }

  // 5d. Coworker bond (~3% per round, two non-pro players at same employer)
  const coworkerWindow = events.length < 2 && rand() < 0.03
  if (coworkerWindow) {
    const nonProPlayers = game.players.filter(p =>
      p.clubId === game.managedClubId &&
      !p.isFullTimePro &&
      p.dayJob
    )
    let coworkerBondAdded = false
    for (let i = 0; i < nonProPlayers.length && !coworkerBondAdded; i++) {
      for (let j = i + 1; j < nonProPlayers.length; j++) {
        const emp1 = findEmployerForJob(game.managedClubId, nonProPlayers[i].dayJob!.title)
        const emp2 = findEmployerForJob(game.managedClubId, nonProPlayers[j].dayJob!.title)
        if (emp1 && emp2 && emp1.name === emp2.name) {
          const eid = coworkerBondEventId(nonProPlayers[i].id, nonProPlayers[j].id)
          const coworkerBondDue = coworkerWindow && emp1.name === emp2.name && !alreadyQueued.has(eid)
          if (coworkerBondDue) {
            events.push(generateCoworkerBondEvent(nonProPlayers[i], nonProPlayers[j], emp1.name, coworkerBondDue))
            coworkerBondAdded = true
            break
          }
        }
      }
    }
  }

  // 5e. Varsel (once per season, round 8-14, 10% chance, affects large employer)
  const varselWindow = events.length < 2 && roundPlayed >= 8 && roundPlayed <= 14 && rand() < 0.10
  if (varselWindow) {
    const eid = varselEventId(game.currentSeason)
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
        const varselDue = varselWindow && bestCount >= 1
        events.push(generateVarselEvent(byEmployer.get(bestKey)!, bestKey, game.currentSeason, varselDue))
      }
    }
  }

  if (events.length >= 2) return events

  // 5f. Player media comment — unhappy benched player talks to press
  const playerMediaWindow = events.length < 2 && rand() < 0.12
  if (playerMediaWindow) {
    const mediaWindow = game.fixtures
      .filter(f => f.status === 'completed' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
      .sort((a, b) => (b.matchday ?? 0) - (a.matchday ?? 0))
      .slice(0, 10)
    const mediaCandidates = game.players.filter(p => {
      if (p.clubId !== game.managedClubId) return false
      if (p.morale >= 30) return false
      if (p.currentAbility < 55) return false
      // Minst tre spelade lagmatcher krävs innan "sällan få starta" är ett
      // grundat påstående. Tidigare kvalificerade 0 starter av 0 matcher.
      if (mediaWindow.length < 3) return false
      const gamesStarted = mediaWindow.filter(f => {
        const lineup = f.homeClubId === game.managedClubId ? f.homeLineup : f.awayLineup
        return lineup?.startingPlayerIds?.includes(p.id)
      }).length
      return gamesStarted < 3
    })
    if (mediaCandidates.length > 0) {
      // Centralredaktören, punkt 3: rotateSubject utesluter de senast
      // uttalade spelarna (K=5-formeln) innan rand() väljer bland det som
      // blir kvar — samma slumpkälla som förut, bara ett smalare urval.
      const excludeCount = genericBeatExcludeCount(managedSquadSize)
      const pick = rotateSubject(
        mediaCandidates,
        PLAYER_MEDIA_PREFIX,
        game,
        excludeCount,
        candidates => candidates[Math.floor(rand() * candidates.length)],
      )
      if (pick) {
        const eid = `event_media_${pick.id}_r${roundPlayed}`
        const playerMediaDue = playerMediaWindow && !alreadyQueued.has(eid)
        if (playerMediaDue) {
          const journalist = game.localPaperName ?? 'Lokaltidningen'
          events.push({ ...generatePlayerMediaEvent(pick, journalist, roundPlayed, playerMediaDue), rotationKey: `${PLAYER_MEDIA_PREFIX}${pick.id}` })
        }
      }
    }
  }

  // 5g. Player praise — happy player praises teammate (15% per match with goals)
  const playerPraiseWindow = events.length < 2 && Boolean(justCompletedFixture) && rand() < 0.15
  if (playerPraiseWindow && justCompletedFixture) {
    const happyPlayers = game.players.filter(p =>
      p.clubId === game.managedClubId && p.morale > 75
    )
    const goalScorers = justCompletedFixture.events
      .filter(e => e.type === 'goal' && e.clubId === game.managedClubId && e.playerId)
      .map(e => game.players.find(p => p.id === e.playerId))
      .filter(Boolean) as Player[]
    if (happyPlayers.length > 0 && goalScorers.length > 0) {
      const praiser = happyPlayers[Math.floor(rand() * happyPlayers.length)]
      // Centralredaktören, punkt 3: subjektet (den PRISADE, inte prisaren —
      // samma "vem handlar eventet om"-konvention som journalistExclusive)
      // roteras bort från de senast prisade lagkamraterna.
      const excludeCount = genericBeatExcludeCount(managedSquadSize)
      const praised = rotateSubject(
        goalScorers,
        PLAYER_PRAISE_PREFIX,
        game,
        excludeCount,
        candidates => candidates[Math.floor(rand() * candidates.length)],
      )
      if (praised && praiser.id !== praised.id) {
        const eid = `event_praise_${praiser.id}_${praised.id}_s${game.currentSeason}`
        const playerPraiseDue = playerPraiseWindow && praiser.morale > 75 && !alreadyQueued.has(eid)
        if (playerPraiseDue) {
          const isAwayMatch = justCompletedFixture.awayClubId === game.managedClubId
          events.push({ ...generatePlayerPraiseEvent(praiser, praised, game.currentSeason, playerPraiseDue, isAwayMatch), relatedFixtureId: justCompletedFixture.id, rotationKey: `${PLAYER_PRAISE_PREFIX}${praised.id}` })
        }
      }
    }
  }

  // 5h. Captain speech — 3+ losses in a row, captain morale > 50, max 1 per season
  // H2-uppföljning (människoupplevelse-audit 7024f8a, 2026-08-24): sorterade
  // tidigare på roundNumber — CLAUDE.md förbjuder det uttryckligen ("Använd
  // ALDRIG roundNumber... All ordning via matchday"). Symptomet matchade:
  // kaptenens why-now-text kunde peka på en förlustsvit som inte längre var
  // de tre senast spelade matcherna. matchday är den enda globala spelordningen.
  //
  // captainRallyAlreadyEngagedThisSeason(game)-vakten BORTTAGEN (H1-
  // uppföljning, 2026-08-24, Jacobs dom): den fanns för att reconcilera mot
  // arcService.ts:s ledare_crisis, nu borttagen — captainSpeech är kanon.
  // eid-kollen två rader ned (alreadyQueued, satt från pendingEvents+
  // resolvedEventIds längst upp i denna funktion) gjorde redan exakt samma
  // jobb för DETTA system (id:t är säsongsscopat: event_captain_speech_s{season}),
  // så vakten var dubbelarbete, inte skydd, sedan den andra källan försvann.
  if (events.length < 2) {
    const recentResults = game.fixtures
      .filter(f => f.status === 'completed' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) && !f.isCup && !f.isKnockout)
      .sort((a, b) => (b.matchday ?? 0) - (a.matchday ?? 0))
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
        // Samma >50-gate oavsett om kaptenen kommer från captainPlayerId
        // eller fallback-urvalet. Tidigare kunde en explicit satt kapten med
        // låg moral kringgå regeln som kommentaren och eventpremissen anger.
        if (captain && captain.morale > 50 && managedClub) {
          const captainSpeechDue = allLosses && !alreadyQueued.has(eid) && captain.morale > 50
          events.push(generateCaptainSpeechEvent(captain, managedClub.id, game.currentSeason, captainSpeechDue))
        }
      }
    }
  }

  if (events.length >= 2) return events

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

  // 5k3. Mecenatens krav (O1-kandidat 1/4, SPEC_O1_MECENATENS_KRAV_2026-09-09,
  // 5/5-mallen) — en aktiv mecenat med hög happiness (mecenat.happiness >=
  // MECENAT_KRAV_HAPPINESS_THRESHOLD) har ett gott öga till en veteran i
  // truppen. "Legend" (specens andra villkor) är inte kontrollerbart för en
  // ANNU AKTIV spelare — legendRole sätts först vid pension (ClubLegend,
  // retirementCeremony) — så villkoret är player.trait==='veteran' (samma
  // definition som characterPlayerService.ts/veteran_farewell-arcen redan
  // använder, age>=30), inte en ny klassificering. Ingen konstlad
  // sannolikhetsspärr (specens ord: rariteten kommer av villkoret, inte en
  // gissad rand()-siffra) — en gång per mecenat per säsong räcker
  // (eventets id bär mecenat.id + currentSeason).
  if (events.length < 2) {
    const highHappinessMecenat = (game.mecenater ?? []).find(
      m => m.isActive && !m.permanentlyWithdrawn && m.happiness >= MECENAT_KRAV_HAPPINESS_THRESHOLD,
    )
    const veteran = game.players.find(
      p => p.clubId === game.managedClubId && p.trait === 'veteran' && !p.isInjured,
    )
    if (highHappinessMecenat && veteran) {
      const kravEvent = generateMecenatKravEvent(highHappinessMecenat, veteran, game.currentSeason)
      if (!alreadyQueued.has(kravEvent.id)) {
        events.push({ ...kravEvent, systemhandelse: true })
      }
    }
  }

  if (events.length >= 2) return events

  // 5l. Mecenat intervention — happiness < 40, no existing intervention queued this season
  for (const mec of game.mecenater ?? []) {
    if (events.length >= 2) break
    if (!mec.isActive || mec.happiness >= 40) continue
    const interventionPrefix = `event_mec_intervention_${mec.id}_s${game.currentSeason}_`
    const eid = `${interventionPrefix}r${roundPlayed}`
    const alreadyHasIntervention = [...alreadyQueued].some(id => id.startsWith(interventionPrefix))
    const interventionDue = mec.isActive && mec.happiness < 40 && !alreadyQueued.has(eid) && !alreadyHasIntervention
    if (interventionDue) {
      events.push(generateMecenatInterventionEvent(mec, game.currentSeason, roundPlayed))
    }
  }

  if (events.length >= 2) return events

  // 5m. Journalist exclusive offer — relationship >= 65, ~15% chance.
  // SPÅR 3, A-H4a (SEXSÄSONGSAUDITEN 2026-08-26, BANDY_MANAGER_AUDIT_6_
  // SASONGER_2026-08-26.md #H4): den gamla "alreadyThisSeason"-kollen jämförde
  // eventets EGET roundPlayed mot sig självt — alltid sant, aldrig en spärr —
  // och subject var alltid lagets högst rankade friska spelare. Resultat:
  // samma spelare (och samma citat) kunde återkomma flera gånger per karriär,
  // ibland i två raka slutspelsmatcher. Fix: en riktig säsongsspärr
  // (journalistExclusiveFiredThisSeason, narrativeBeatLog) plus en
  // spelarrotation som utesluter redan figurerade spelare tills HELA den
  // nuvarande truppen rullat ett varv (pickJournalistExclusiveSubject).
  if (events.length < 2) {
    const j = game.journalist
    const journalistExclusiveWindow = Boolean(j) && (j?.relationship ?? 0) >= 65 && rand() < 0.15 &&
      !journalistExclusiveFiredThisSeason(game, game.currentSeason)
    if (j && journalistExclusiveWindow) {
      const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId && !p.isInjured)
      const subject = pickJournalistExclusiveSubject(game, managedPlayers)
      if (subject) {
        const eid = `event_journalist_exclusive_${subject.id}_r${roundPlayed}`
        const journalistExclusiveDue = journalistExclusiveWindow && !alreadyQueued.has(eid)
        if (journalistExclusiveDue) {
          events.push({
            ...generateJournalistExclusiveEvent(j.name, j.outlet, subject, roundPlayed, game.managedClubId, journalistExclusiveDue),
            journalistExclusiveKey: `${JOURNALIST_EXCLUSIVE_PREFIX}${subject.id}`,
          })
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
    const bidWarWindow = rand() <= 0.20
    if (!bidWarWindow) continue
    const eid = `event_bidwar_${bid.id}`
    const bidWarDue = bidWarWindow && bid.direction === 'outgoing' && bid.status === 'pending' && !alreadyQueued.has(eid)
    if (bidWarDue) {
      events.push(bidWarEvent(bid, game, bidWarDue))
    }
  }

  if (events.length >= 2) return events

  // 6b. Hesitant player (outgoing bid just resolved as accepted, buying club
  // has LOWER reputation than the player's current club — PÅSTÅENDEKARTAN
  // omsvep 2026-08-24, VAR-fel-fält: contentContract.ts:222 dokumenterar
  // triggern som "bid.buyingClubId har lägre reputation än spelarens
  // nuvarande klubb", men koden gated tidigare enbart på target.currentAbility
  // > truppens CA-snitt — ingen reputation-jämförelse gjordes någonsin, trots
  // att texten uttryckligen påstår "din klubb är ett steg ner i
  // ambitionsnivå". Bytt till den dokumenterade jämförelsen: sellingClubId
  // (spelarens nuvarande klubb) mot buyingClubId (oss, managedClubId).
  const justAccepted = (game.transferBids ?? []).filter(
    b => b.direction === 'outgoing' && b.status === 'accepted' && b.expiresRound === roundPlayed
  )
  if (justAccepted.length > 0) {
    for (const bid of justAccepted) {
      if (events.length >= 2) break
      const sellingClub = game.clubs.find(c => c.id === bid.sellingClubId)
      const buyingClub = game.clubs.find(c => c.id === bid.buyingClubId)
      if (!sellingClub || !buyingClub || buyingClub.reputation >= sellingClub.reputation) continue
      const eid = `event_hesitant_${bid.id}`
      const hesitantPlayerDue = bid.status === 'accepted' && bid.expiresRound === roundPlayed &&
        buyingClub.reputation < sellingClub.reputation && !alreadyQueued.has(eid)
      if (hesitantPlayerDue) {
        events.push(hesitantPlayerEvent(bid, game, hesitantPlayerDue))
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
    const ghostSponsorDue = (
      !alreadyQueued.has(spookId) &&
      (managedClubForSpook?.finances ?? 0) < 0 &&
      (managedClubForSpook?.reputation ?? 0) > 60 &&
      !game.patron &&
      (game.currentSeason ?? 1) >= 2
    )
    if (ghostSponsorDue) {
      events.push({
        id: spookId,
        type: 'spoksponsor',
        title: 'Okänt nummer',
        body: 'En affärsman ringer. Han har hört om er situation och vill investera 150 000 kr. I gengäld vill han sitta med på styrelsemöten och ha inflytande.',
        proofSource: {
          form: 'state-predicate',
          description: 'klubben har underskott, rykte över 60, ingen patron och är i minst säsong 2',
          evaluatedTrue: ghostSponsorDue,
        },
        choices: [
          {
            id: 'accept',
            label: 'Tacka ja — desperatläget kräver det',
            subtitle: '+150 tkr · orten kyler · ny styrelseledamot',
            effect: { type: 'multiEffect', subEffects: JSON.stringify([
              { type: 'income', amount: 150000 },
              { type: 'communityStanding', amount: -5 },
            ]) },
          },
          {
            id: 'decline',
            label: 'Tacka nej — vi klarar oss på annat sätt',
            subtitle: 'tär på styrelsens tålamod',
            effect: { type: 'boardPatience', amount: -5 },
          },
        ],
        resolved: false,
      })
    }
  }

  // Det omöjliga valet — one-time financial crisis. Tröskelsvepet (fynd
  // #11, Jacobs dom 2026-08-26): var `cs > 60` — en klubb under 60 kunde
  // ALDRIG se en av spelets nio 5/5-systemhändelser (DOM_VARSLET_
  // KLASSIFICERING_2026-08-17.md), oavsett hur länge den satt i finanskris
  // med en älskad akademispelare — exakt den klubbprofil händelsen handlar
  // om. "Samma klass som contract_drama som var strukturellt onåbar"
  // (Jacobs ord) — skillnaden här är graden, inte arten: inte 0% för alla,
  // men 0% för EN HEL KLUBBKLASS (låg-CS), permanent. Ersatt av en
  // sannolikhet som prövas varje kvalificerande omgång (samma idiom som
  // filens övriga rand()-villkor, t.ex. spöksponsorn ovan) — se
  // communityStandingScaling.ts.
  if (events.length < 2) {
    const omojligId = `detOmojligaValet_${game.currentSeason}`
    const managedClubOmojlig = game.clubs.find(c => c.id === game.managedClubId)
    const impossibleChoiceWindow = (
      !alreadyQueued.has(omojligId) &&
      (managedClubOmojlig?.finances ?? 0) < -50000 &&
      rand() < getCsDetOmojligaValetProbability(game.communityStanding ?? 50)
    )
    if (impossibleChoiceWindow) {
      const academyProspect = game.players.find(p =>
        p.clubId === game.managedClubId &&
        p.promotedFromAcademy === true &&
        (p.currentAbility ?? 0) > 50
      )
      if (academyProspect) {
        const impossibleChoiceDue = impossibleChoiceWindow && academyProspect.promotedFromAcademy === true && academyProspect.currentAbility > 50
        const playerName = `${academyProspect.firstName} ${academyProspect.lastName}`
        events.push({
          id: omojligId,
          type: 'detOmojligaValet',
          title: 'Det omöjliga valet',
          body: `Licensnämnden kräver positivt kapital. Du har en akademiprodukt värd pengar — ${playerName}. Hela orten älskar honom. Säljer du honom stärker du kassan, men skadar ditt rykte.`,
          proofSource: {
            form: 'state-predicate',
            description: 'klubben har mer än 50 000 kr i underskott och en egen akademispelare med CA över 50',
            evaluatedTrue: impossibleChoiceDue,
          },
          relatedPlayerId: academyProspect.id,
          choices: [
            {
              id: 'sell',
              label: `Sälj ${playerName} — stärk kassan med 180 000 kr`,
              subtitle: '+180 tkr · orten kyler · grumlar stämningen · kyler pressen',
              effect: { type: 'multiEffect', subEffects: JSON.stringify([
                { type: 'income', amount: 180000 },
                { type: 'communityStanding', amount: -12 },
                { type: 'fanMood', amount: -15 },
                { type: 'journalistRelationship', amount: -10 },
              ]) },
            },
            {
              id: 'keep',
              label: 'Behåll honom — låt underskottet bestå',
              subtitle: 'kassan oförändrad · orten värmer · lyfter stämningen på läktaren',
              effect: { type: 'multiEffect', subEffects: JSON.stringify([
                { type: 'communityStanding', amount: 5 },
                { type: 'fanMood', amount: 8 },
              ]) },
            },
          ],
          resolved: false,
          systemhandelse: true,  // O19: 5/5 i docs/dom/DOM_VARSLET_KLASSIFICERING_2026-08-17.md
        })
      }
    }
  }

  // Medium 1 (Skutskär-auditen, 2026-08-22): två sponsorerbjudanden kunde
  // ligga direkt efter varandra ("Bygg AB Nordin" och "Skrot & Metall
  // Nordin") eftersom activeSponsors bara räknar ACCEPTERADE avtal — ett
  // redan genererat men obesvarat erbjudande räknades inte som "aktivt",
  // så ett nytt kunde skapas ovanpå varje omgång. Dedupe: högst ett öppet
  // (obesvarat) sponsorOffer-event åt gången, oavsett auto-loopar.
  //
  // MEDIUM 15 (audit 2026-08-29): "samma ursprungliga 45-tkr-erbjudande igen".
  // Rotorsak, andra halvan: dedupen ovan tittar bara på `pendingEvents`, och
  // resolutionen tar bort eventet därifrån. I samma sekund som spelaren svarade
  // öppnade grinden alltså igen — och seeden är deterministisk per matchdag
  // (baseSeed = nextMatchday * 1000 + säsong * 7), så managed-matchens ANDRA pass
  // producerade ett byte-identiskt erbjudande med samma id. Enda utvägen var att
  // acceptera, eftersom accept höjer activeSponsors (grindens andra villkor).
  //
  // Två tillägg: (1) `deferredDecisions` räknas nu som ett öppet erbjudande — ett
  // kort som KF3-avbrottsbudgeten trängt undan låg utanför `pendingEvents` och
  // öppnade grinden på exakt samma sätt. (2) id:t prövas mot `alreadyQueued`
  // (pendingEvents ∪ resolvedEventIds, byggd överst i funktionen) precis som varje
  // annan händelsetyp i den här filen redan gör — nu när resolutionen faktiskt
  // skriver resolvedEventIds (eventResolver.ts) bär den spärren.
  const hasOpenSponsorOffer = [
    ...(game.pendingEvents ?? []),
    ...(game.deferredDecisions ?? []),
  ].some(e => e.type === 'sponsorOffer' && !e.resolved)
  if (activeSponsors.length < maxSponsors && !hasOpenSponsorOffer) {
    const offer = generateSponsorOffer(
      managedClub?.reputation ?? 50,
      activeSponsors.length,
      maxSponsors,
      roundPlayed,
      rand
    )
    if (offer) {
      const sponsorEvent = buildSponsorOfferEvent(offer, activeSponsors, managedClub?.name, maxSponsors)
      if (!alreadyQueued.has(sponsorEvent.id)) {
        events.push(sponsorEvent)
      }
    }
  }

  return events
}

// ── buildSponsorOfferEvent (O1) ─────────────────────────────────────────────
/**
 * O1 (varsel-mallen, docs/dom/DOM_VARSLET_SOM_SYSTEMMALL_2026-08-17.md, "sponsorn med
 * ett problem" — högst prioriterade kandidaten: vanligast och tommast, accept
 * var en ren kvitteringsknapp).
 *
 * Konfliktvariant: den nya sponsorn konkurrerar med en redan aktiv sponsor i
 * SAMMA kategori — den rivalen finns redan i spelvärlden (accepterad av
 * spelaren tidigare), vilket ger valet ett riktigt pris. 4/5 av mallen, inte
 * 5/5 — punkt 2 (spelare/funktionär redan mött) är inte uppfylld, sponsorer
 * är företag, inte personer. Därför INTE systemhandelse:true och INTE räknad
 * mot O19/U5:s säsongsbudget — att tagga en 4/5-händelse som systemhändelse
 * skulle blåsa upp räknaren mallen själv varnar för ("de ska vara få").
 *
 * COMMUNITY_STANDING_DELTA (-6): PROPOSAL, ingen D-fact-låst magnitud. Mellan
 * de befintliga referenspunkterna i kodbasen: -12 för att sälja en älskad
 * akademispelare (detOmojligaValet, ovan i denna fil), +2/+5 för triviala
 * sponsornickar (sponsorEvents.ts). En affärsrelation som avslutas för
 * klubbens eget val är mindre allvarligt än ett svek mot en spelare, mer än
 * en nick — proportionerligt placerad i mitten.
 *
 * Text skriven av Opus 2026-08-22, klistrad ordagrant (SPEC-LYDNAD). Sista
 * raden i utfallstexterna ("{GamleSponsor} fick aldrig veta") är avsiktligt
 * bärande — spelaren vet något funktionärerna i spelvärlden inte vet.
 *
 * @cites offer.weeklyIncome, offer.contractRounds, maxSponsors
 *
 * OBS (PÅSTÅENDESVEP batch-05, 2026-08-24): rivalTenureLine ("{RivalSponsor}
 * var med när det var tunnare än nu.") är MEDVETET INTE citerad ovan — den
 * grenen är en känd Proxy/SANNINGEN-SAKNAS (rivalSponsor bevisar bara att en
 * aktiv sponsor i samma kategori finns, inte att klubben faktiskt var
 * ekonomiskt svagare då). Kvarstår ofixad i väntan på Jacobs/Opus beslut —
 * se docs/pastaende_sweep_2026-08-24/batch-05.md, raden för
 * buildSponsorOfferEvent.
 */
export function buildSponsorOfferEvent(
  offer: Sponsor,
  activeSponsors: Sponsor[],
  managedClubName: string | undefined,
  maxSponsors?: number,
): GameEvent {
  const rivalSponsor = activeSponsors.find(s => s.category === offer.category)
  const sponsorOfferIsActionable = offer.weeklyIncome > 0 && offer.contractRounds > 0
  const sponsorOfferClaimIsGrounded = sponsorOfferIsActionable &&
    (!rivalSponsor || rivalSponsor.category === offer.category)
  if (!sponsorOfferClaimIsGrounded) {
    throw new Error('Sponsorerbjudanden måste ha positiv veckoersättning och löptid')
  }

  // 2026-08-17 (Stickiness-audit): weeklyFmt rundade till närmsta heltal-k
  // medan totalFmt räknade totalValue exakt ur samma (orundade) weeklyIncome
  // — vid t.ex. 1500 kr/vecka visade kortet "2k kr/vecka" men en total som
  // bara stämde med 1500, inte 2000. formatK visar en decimal BARA när
  // talet inte redan är ett jämnt tusental, så veckobelopp och total alltid
  // multiplicerar ut till samma tal utan att skräpa ner de vanliga, jämna
  // beloppen (weeklyIncome är alltid multipel av 500, sponsorService.ts)
  // med ett onödigt ",0".
  const formatK = (n: number) => Number.isInteger(n / 1000) ? `${n / 1000}k kr` : `${formatDecimalComma(n / 1000)}k kr`
  const totalValue = offer.weeklyIncome * offer.contractRounds
  const weeklyFmt = offer.weeklyIncome >= 1000 ? formatK(offer.weeklyIncome) : `${offer.weeklyIncome} kr`
  const totalFmt = totalValue >= 1000000
    ? `${formatDecimalComma(totalValue / 1000000)} mkr`
    : totalValue >= 1000
    ? formatK(totalValue)
    : `${totalValue} kr`

  const COMMUNITY_STANDING_DELTA_SPONSOR_CONFLICT = -6

  // Påståendesvepet #16 (MASTER.md, 2026-08-24), Jacobs dom 2026-08-26:
  // den tidigare raden ("{RivalSponsor} var med när det var tunnare än
  // nu.") påstod en historia som inte finns i data — koden vet bara ATT en
  // rivalsponsor finns i samma kategori NU, inget om NÄR den skrev på eller
  // hur klubbens ekonomi såg ut då. Struken, samma princip som HalftimeModal
  // #1 och ismaskinens "tre vintrar" — kan påståendet inte beläggas ska det
  // inte göras. Vad raden GJORDE (sa att en relation bryts) överlever utan
  // historik: sponsorn finns här I NUET, och det är spelaren som väljer
  // bort den. Ny låst text (Jacob, 2026-08-26).
  const rivalNoticeLine = rivalSponsor ? `${rivalSponsor.name} får beskedet av er.` : undefined

  // Synlighetsraden (Jacob, 2026-08-24, klistrad ordagrant — SPEC-LYDNAD:
  // ändra ingenting). "Platsen är er i {N} omgångar. Kommer något bättre i
  // vinter får ni tacka nej." beskriver en sanning som redan finns i
  // koden (kategoriplatsen är låst tills contractRounds går ut, se
  // maxSponsors-gaten i generatePostAdvanceEvents) — bara aldrig sagd högt
  // förut. "Sista platsen"-varianten när DETTA beslut skulle fylla sista
  // lediga platsen (maxSponsors nås av just detta accept).
  const willFillLastSlot = maxSponsors !== undefined && activeSponsors.length + 1 >= maxSponsors
  const visibilityLine = willFillLastSlot
    ? 'Sista platsen. Efter det här är det fullt fram till våren.'
    : `Platsen är er i ${offer.contractRounds} omgångar. Kommer något bättre i vinter får ni tacka nej.`

  return {
    id: `event_sponsor_${offer.id}`,
    type: 'sponsorOffer',
    title: rivalSponsor ? `${offer.name} vill in` : `Sponsorerbjudande — ${offer.name}`,
    body: rivalSponsor
      ? `${offer.name} vill synas på tröjan. De betalar ${weeklyFmt}. De gör samma sak i den här bygden, och de tänker inte dela på platsen. Tar ni deras pengar får ${rivalSponsor.name} beskedet av er, inte av dem.`
      : `${offer.name} vill sponsra ${managedClubName ?? 'klubben'} med ${weeklyFmt}/vecka i ${offer.contractRounds} ${offer.contractRounds === 1 ? 'omgång' : 'omgångar'} (totalt ${totalFmt}).`,
    proofSource: {
      form: 'state-predicate',
      description: 'sponsorerbjudandet har positiv ersättning/löptid och eventuell konfliktpartner har samma kategori',
      evaluatedTrue: sponsorOfferClaimIsGrounded,
    },
    relatedPlayerId: undefined,
    relatedClubId: undefined,
    choices: [
      {
        id: 'accept',
        label: rivalSponsor ? 'Ta avtalet' : `Acceptera (${weeklyFmt}/vecka)`,
        // O2 lager 3 (Jacobs dom 2026-08-24): communityStanding-kostnaden
        // fanns redan som data (COMMUNITY_STANDING_DELTA_SPONSOR_CONFLICT)
        // men syntes aldrig i accept-subtitlen — bara i löptext
        // (rivalfallet) eller inte alls (vanliga fallet). visibilityLine
        // (Jacobs låsta text ovan) ersätter den tidigare bara-siffra
        // "⏳ N omg" — samma fakta, sagt som en mening istället för en
        // ikon. Samma " · "-format som redan dokumenterat på
        // EventChoice.subtitle ovan — rivalNoticeLine (Jacob, 2026-08-26,
        // ersätter det tidigare obelagda rivalTenureLine, se #16 ovan).
        subtitle: rivalSponsor
          ? `${rivalNoticeLine} · orten kyler · ${visibilityLine}`
          : `💰 +${totalFmt} totalt · ${visibilityLine}`,
        effect: { type: 'acceptSponsor', sponsorData: JSON.stringify(offer) },
      },
      {
        id: 'reject',
        label: rivalSponsor ? 'Tacka nej' : 'Avslå',
        subtitle: rivalSponsor ? 'Ni behåller det ni har.' : 'Inga effekter',
        effect: { type: 'noOp' },
      },
      // docs/dom/DOM_SPONSOR_MOTBUD_2026-08-31.md: motbudet är INTE ett vanligt val
      // som resolveEvent kör direkt — EventCardInline fångar choiceId==='counter'
      // FÖRE resolveEvent och öppnar SponsorCounterModal i stället (fri
      // Y-inmatning, samma "konfigurera-sen-bekräfta"-mönster som BidModal).
      // effect:noOp är bara ett harmlöst fallback om interceptionen någonsin
      // missar — den faktiska logiken körs via useGameStore.counterSponsorOffer.
      // Label levererad av Opus 2026-09-01 (grind-1-sveps stale-fynd, MASTER_OPPET.md).
      {
        id: 'counter',
        label: 'Kräv mer',
        effect: { type: 'noOp' },
      },
    ],
    resolved: false,
    sponsorData: JSON.stringify(offer),
    ...(rivalSponsor && {
      terminateSponsorId: rivalSponsor.id,
      communityStandingDelta: COMMUNITY_STANDING_DELTA_SPONSOR_CONFLICT,
    }),
  }
}
