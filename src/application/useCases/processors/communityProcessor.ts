import type { SaveGame, InboxItem, FacilityProject, StandingRow } from '../../../domain/entities/SaveGame'
import type { Fixture } from '../../../domain/entities/Fixture'
import { InboxItemType } from '../../../domain/enums'
import { getRivalry } from '../../../domain/data/rivalries'
import { checkProjectCompletion } from '../../../domain/services/facilityService'

export interface CommunityProcessorResult {
  csBoost: number
  inboxItems: InboxItem[]
  updatedFacilityProjects: FacilityProject[]
  /** Total facilities bonus from newly completed projects this round */
  facilityBonusTotal: number
  updatedVolunteers: string[]
  updatedVolunteerMorale: Record<string, number>
}

/**
 * Processes community standing boost, politician/mecenat inbox notifications,
 * and facility project completion checks.
 *
 * @param justCompletedManagedFixture - The managed club's fixture completed this round (if any)
 * @param playoffCsBoost - Community standing boost from playoff advancement (already computed)
 * @param standings - Current league standings
 * @param nextMatchday - The matchday number being processed
 */
export function processCommunity(
  game: SaveGame,
  justCompletedManagedFixture: Fixture | null,
  playoffCsBoost: number,
  standings: StandingRow[],
  nextMatchday: number,
): CommunityProcessorResult {
  const inboxItems: InboxItem[] = []

  // ── Community standing boost ───────────────────────────────────────────────
  let csBoost = playoffCsBoost
  if (justCompletedManagedFixture) {
    const isHomeCs = justCompletedManagedFixture.homeClubId === game.managedClubId
    const myScoreCs = isHomeCs ? justCompletedManagedFixture.homeScore : justCompletedManagedFixture.awayScore
    const theirScoreCs = isHomeCs ? justCompletedManagedFixture.awayScore : justCompletedManagedFixture.homeScore
    const wonCs = (myScoreCs ?? 0) > (theirScoreCs ?? 0)
    const lostCs = (myScoreCs ?? 0) < (theirScoreCs ?? 0)
    const bigWinCs = wonCs && (myScoreCs ?? 0) >= (theirScoreCs ?? 0) + 3
    const bigLossCs = lostCs && (theirScoreCs ?? 0) >= (myScoreCs ?? 0) + 3
    if (bigWinCs) csBoost += 5
    else if (wonCs) csBoost += 2
    else if (bigLossCs) csBoost -= 6
    else if (lostCs) csBoost -= 4
    const matchRivalryCs = getRivalry(justCompletedManagedFixture.homeClubId, justCompletedManagedFixture.awayClubId)
    if (matchRivalryCs && wonCs) csBoost += 2
    if (matchRivalryCs && lostCs) csBoost -= 2
  }
  const csActivities = game.communityActivities
  if (csActivities?.kiosk && csActivities.kiosk !== 'none') csBoost += 0.08
  if (csActivities?.lottery && csActivities.lottery !== 'none') csBoost += 0.05
  if (csActivities?.bandyplay) csBoost += 0.08
  if (csActivities?.functionaries) csBoost += 0.05
  if (csActivities?.bandySchool) csBoost += 0.08
  if (csActivities?.socialMedia) csBoost += 0.03
  // ── Frivilligbonus ────────────────────────────────────────────────────────
  const volunteerCount = (game.volunteers ?? []).length
  if (volunteerCount > 0) {
    csBoost += Math.min(15, volunteerCount * 0.3)
  }

  const csPos = standings.find(s => s.clubId === game.managedClubId)?.position ?? 6
  if (csPos <= 3) csBoost += 0.2
  else if (csPos >= 10) csBoost -= 0.15

  // ── Politiker inbox-notiser ────────────────────────────────────────────────
  const pol = game.localPolitician
  if (pol && justCompletedManagedFixture && pol.relationship > 50) {
    const isHomeNotif = justCompletedManagedFixture.homeClubId === game.managedClubId
    const myScoreNotif = isHomeNotif ? justCompletedManagedFixture.homeScore : justCompletedManagedFixture.awayScore
    const theirScoreNotif = isHomeNotif ? justCompletedManagedFixture.awayScore : justCompletedManagedFixture.homeScore
    const wonNotif = (myScoreNotif ?? 0) > (theirScoreNotif ?? 0)
    if (wonNotif) {
      const opponent = game.clubs.find(c => c.id === (isHomeNotif ? justCompletedManagedFixture.awayClubId : justCompletedManagedFixture.homeClubId))
      inboxItems.push({
        id: `inbox_pol_match_${nextMatchday}_${game.currentSeason}`,
        date: game.currentDate,
        type: InboxItemType.BoardFeedback,
        title: `🏛️ ${pol.name} noterade segern`,
        body: `Kommunalrådet ${pol.name} skickade ett meddelande: "Bra match mot ${opponent?.name ?? 'motståndaren'}. Fortsätt så."`,
        isRead: false,
      } as InboxItem)
    }
  }

  // Politician relationship milestones (25, 50, 75)
  if (pol) {
    const relMilestones = [25, 50, 75]
    for (const milestone of relMilestones) {
      const milestoneId = `inbox_pol_rel_${milestone}_${game.currentSeason}`
      if (pol.relationship >= milestone && pol.relationship < milestone + 5 && !game.inbox.some(i => i.id === milestoneId)) {
        const milestoneTexts: Record<number, string> = {
          25: `Kommunalrådet ${pol.name} börjar visa intresse för klubben. "Ni gör bra saker för ungdomarna i kommunen."`,
          50: `${pol.name} ser klubben som en viktig samhällsaktör. "Vi borde prata om framtida satsningar."`,
          75: `${pol.name} är en stark allierad. "Jag kommer att driva frågan om ökat kommunbidrag i nästa budgetomgång."`,
        }
        inboxItems.push({
          id: milestoneId,
          date: game.currentDate,
          type: InboxItemType.KommunBidrag,
          title: `🏛️ Stärkt relation med ${pol.name}`,
          body: milestoneTexts[milestone] ?? '',
          isRead: false,
        } as InboxItem)
      }
    }
  }

  // KommunBidrag change notification
  if (pol) {
    const prevKommunBidrag = game.previousKommunBidrag ?? pol.kommunBidrag
    if (pol.kommunBidrag !== prevKommunBidrag) {
      const direction = pol.kommunBidrag > prevKommunBidrag ? 'höjt' : 'sänkt'
      const diff = pol.kommunBidrag - prevKommunBidrag
      const diffStr = diff > 0 ? `+${diff}` : `${diff}`
      inboxItems.push({
        id: `inbox_kommun_bidrag_${nextMatchday}_${game.currentSeason}`,
        date: game.currentDate,
        type: InboxItemType.KommunBidrag,
        title: `🏛️ Kommunbidraget ${direction}`,
        body: `Kommunen har ${direction} bidraget till klubben (${diffStr} kr/månad). Nytt bidrag: ${pol.kommunBidrag} kr.`,
        isRead: false,
      } as InboxItem)
    }
  }

  // ── Mecenat inbox-notiser ──────────────────────────────────────────────────
  for (const mec of game.mecenater ?? []) {
    if (!mec.isActive) continue

    if (mec.happiness < 30 && mec.happiness > 20) {
      inboxItems.push({
        id: `inbox_mec_unhappy_${mec.id}_${nextMatchday}`,
        date: game.currentDate,
        type: InboxItemType.PatronInfluence,
        title: `👥 ${mec.name} är missnöjd`,
        body: `${mec.name} från ${mec.business} uttrycker oro. "Jag hade hoppats på bättre resultat."`,
        isRead: false,
      } as InboxItem)
    }
    if (mec.happiness <= 20) {
      const critId = `inbox_mec_critical_${mec.id}_${game.currentSeason}`
      if (!game.inbox.some(i => i.id === critId)) {
        inboxItems.push({
          id: critId,
          date: game.currentDate,
          type: InboxItemType.PatronInfluence,
          title: `⚠️ ${mec.name} överväger att lämna`,
          body: `${mec.name} är allvarligt missnöjd. "Om inget förändras snart får ni klara er utan mig."`,
          isRead: false,
        } as InboxItem)
      }
    }
    if (mec.happiness > 70) {
      const happyId = `inbox_mec_happy_${mec.id}_${game.currentSeason}`
      if (!game.inbox.some(i => i.id === happyId)) {
        inboxItems.push({
          id: happyId,
          date: game.currentDate,
          type: InboxItemType.PatronInfluence,
          title: `🤝 ${mec.name} är nöjd`,
          body: `${mec.name} från ${mec.business} är mycket nöjd med klubbens utveckling. "Det här är precis vad jag ville se."`,
          isRead: false,
        } as InboxItem)
      }
    }
  }

  // New mecenat activated — notify
  for (const mec of game.mecenater ?? []) {
    if (mec.isActive && mec.arrivedSeason === game.currentSeason) {
      const arrivalId = `inbox_mec_new_${mec.id}_${game.currentSeason}`
      if (!game.inbox.some(i => i.id === arrivalId) && !inboxItems.some(i => i.id === arrivalId)) {
        inboxItems.push({
          id: arrivalId,
          date: game.currentDate,
          type: InboxItemType.PatronInfluence,
          title: `💰 Ny mecenat: ${mec.name}`,
          body: `${mec.name} (${mec.business}) vill stötta klubben ekonomiskt. Bidrag: ${mec.contribution} kr/månad.`,
          isRead: false,
        } as InboxItem)
      }
    }
  }

  // ── Facility project completion ────────────────────────────────────────────
  const updatedFacilityProjects = (game.facilityProjects ?? []).map(p => checkProjectCompletion(p, nextMatchday))
  const oldFacilityProjects = game.facilityProjects ?? []
  let facilityBonusTotal = 0
  for (const up of updatedFacilityProjects) {
    if (up.status === 'completed') {
      const old = oldFacilityProjects.find(o => o.id === up.id)
      if (old && old.status === 'in_progress') {
        facilityBonusTotal += up.facilitiesBonus
      }
    }
  }

  // ── Frivillig moral + attrition ───────────────────────────────────────────
  const volunteers = game.volunteers ?? []
  let volunteerMorale = { ...(game.volunteerMorale ?? {}) }

  // Initialise morale for new volunteers — name-seeded variation (55–80)
  for (const name of volunteers) {
    if (volunteerMorale[name] === undefined) {
      const nameSeed = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
      volunteerMorale[name] = 55 + (nameSeed % 26)  // 55–80
    }
  }

  // Shift morale based on managed match result
  if (justCompletedManagedFixture) {
    const isHome = justCompletedManagedFixture.homeClubId === game.managedClubId
    const myScore = isHome ? justCompletedManagedFixture.homeScore : justCompletedManagedFixture.awayScore
    const theirScore = isHome ? justCompletedManagedFixture.awayScore : justCompletedManagedFixture.homeScore
    const won = (myScore ?? 0) > (theirScore ?? 0)
    const bigLoss = (theirScore ?? 0) - (myScore ?? 0) >= 3
    const baseShift = won ? 5 : bigLoss ? -8 : -2
    for (const name of volunteers) {
      // Individual noise: ±3 based on name + matchday seed
      const noise = ((name.charCodeAt(0) + nextMatchday) % 7) - 3  // -3 to +3
      const shift = baseShift + noise
      volunteerMorale[name] = Math.min(100, Math.max(0, (volunteerMorale[name] ?? 70) + shift))
    }
  } else {
    // No match this round — small natural decay with individual variation
    for (const name of volunteers) {
      const noise = (name.charCodeAt(0) + nextMatchday) % 3  // 0–2
      volunteerMorale[name] = Math.max(0, (volunteerMorale[name] ?? 70) - noise)
    }
  }

  // Attrition: remove volunteers with morale <= 10
  const quitters = volunteers.filter(name => (volunteerMorale[name] ?? 70) <= 10)
  const updatedVolunteers = volunteers.filter(name => (volunteerMorale[name] ?? 70) > 10)
  for (const name of quitters) {
    delete volunteerMorale[name]
    inboxItems.push({
      id: `inbox_volunteer_quit_${name.replace(/\s/g, '_')}_r${nextMatchday}`,
      date: game.currentDate,
      type: InboxItemType.BoardFeedback,
      title: `👥 ${name} slutar som frivillig`,
      body: `${name} har tröttnat och drar sig tillbaka. Dåliga resultat på sistone har tagit på humöret.`,
      isRead: false,
    } as InboxItem)
  }

  // ── Diminishing returns on positive CS boosts ─────────────────────────────
  // Negative effects (losses, scandals) are unaffected — equally easy to fall from 90 as from 50
  const positiveBoost = Math.max(0, csBoost)
  const negativeBoost = Math.min(0, csBoost)
  const currentCS = game.communityStanding ?? 50
  const diminishingFactor = currentCS > 85 ? 0.25 : currentCS > 70 ? 0.5 : currentCS > 55 ? 0.75 : 1.0
  csBoost = positiveBoost * diminishingFactor + negativeBoost

  return { csBoost, inboxItems, updatedFacilityProjects, facilityBonusTotal, updatedVolunteers, updatedVolunteerMorale: volunteerMorale }
}
