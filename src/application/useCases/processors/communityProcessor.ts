import type { SaveGame, InboxItem, FacilityState, StandingRow } from '../../../domain/entities/SaveGame'
import type { Fixture } from '../../../domain/entities/Fixture'
import { InboxItemType } from '../../../domain/enums'
import { getRivalry } from '../../../domain/data/rivalries'
import { advanceFacilityState } from '../../../domain/services/facilityService'
import { getJournalistCommunityModifier } from '../../../domain/services/journalistVisibilityService'
import { generateVolunteerRoster } from '../../../domain/services/volunteerService'
import { getCsDiminishingFactor, csUpkeepFactor, csExpectationDrag } from '../../../domain/services/communityStandingScaling'
import { backfillActivitiesSince, getActiveStaleableActivities, ACTIVITY_CS_BOOST } from '../../../domain/services/communityRenewalService'
import type { CommunityActivitiesSince } from '../../../domain/entities/Community'
import { safeStandingPosition } from '../../../domain/services/standingsService'
import { deriveUtfall } from '../../../domain/services/matchTypeAxes'

export interface CommunityProcessorResult {
  csBoost: number
  /** Klack-matchreaktion (kartfynd 8a): mood-delta för supporterGroup, egen profil skild från pulsen. Appliceras i roundProcessor. */
  klackMoodDelta: number
  inboxItems: InboxItem[]
  updatedFacilityState: FacilityState | undefined
  /** Total facilities bonus from newly completed projects this round */
  facilityBonusTotal: number
  facilityCapacityBonus: number
  /** nodeId for any facility project that completed this round, null if none */
  completedNodeId: string | null
  updatedVolunteers: string[]
  updatedVolunteerMorale: Record<string, number>
  /** ANSPRÅK 4, spak 3: staleness-klockan efter backfyllning. Skrivs vidare av
   *  roundProcessor.ts. Samma referens som gick in när ingenting behövde
   *  backfyllas — ingen onödig state-skrivning. */
  updatedCommunityActivitiesSince: CommunityActivitiesSince
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
  // Klack-matchreaktion (kartfynd 8a): klacken lever med laget, inte bara med relationen.
  // Egen profil — mindre än pulsen på rena resultat (de hängivna överger inte laget på en
  // förlust lika lätt), MER än pulsen på derby (derbyt ÄR klackens identitet). Appliceras i roundProcessor.
  let klackMoodDelta = 0
  if (justCompletedManagedFixture) {
    const isHomeCs = justCompletedManagedFixture.homeClubId === game.managedClubId
    const myScoreCs = isHomeCs ? justCompletedManagedFixture.homeScore : justCompletedManagedFixture.awayScore
    const theirScoreCs = isHomeCs ? justCompletedManagedFixture.awayScore : justCompletedManagedFixture.homeScore
    const utfallCs = deriveUtfall(justCompletedManagedFixture, game.managedClubId)
    const wonCs = utfallCs === 'vunnet'
    const lostCs = utfallCs === 'forlorat'
    const bigWinCs = wonCs && (myScoreCs ?? 0) >= (theirScoreCs ?? 0) + 3
    const bigLossCs = lostCs && (theirScoreCs ?? 0) >= (myScoreCs ?? 0) + 3
    if (bigWinCs) csBoost += 5
    else if (wonCs) csBoost += 2
    else if (bigLossCs) csBoost -= 6
    else if (lostCs) csBoost -= 4
    const matchRivalryCs = getRivalry(justCompletedManagedFixture.homeClubId, justCompletedManagedFixture.awayClubId)
    if (matchRivalryCs && wonCs) csBoost += 2
    if (matchRivalryCs && lostCs) csBoost -= 2

    // Klack-profil (skild magnitud från pulsens ±2/±4/±5/±6 ovan)
    if (bigWinCs) klackMoodDelta = 4
    else if (wonCs) klackMoodDelta = 2
    else if (bigLossCs) klackMoodDelta = -5
    else if (lostCs) klackMoodDelta = -3
    // Derby väger tungt för klacken — dubbel vikt mot pulsens ±2
    if (matchRivalryCs && wonCs) klackMoodDelta += 4
    if (matchRivalryCs && lostCs) klackMoodDelta -= 4
  }
  // ── Ortsunderhållet: managerns egen spak (ANSPRÅK 4) ──────────────────────
  // Aktiviteterna och frivilliga summeras SEPARAT från matchresultat/placering
  // eftersom bara DE skalas av csUpkeepFactor(rykte). Summan är per konstruktion
  // aldrig negativ (varje term är ett tillägg) — domens krav att bara positiva
  // boostar skalas är alltså uppfyllt av formen, inte av ett villkor.
  //
  // ANSPRÅK 4, SPAK 3 — VÄG C (Jacobs beslut 2026-08-31, DOM_ANSPAK4_TREDJE_
  // SPAK_NYHET_2026-08-29.md §"VÄG C"): staleness rör INTE dessa konstanter.
  // Väg A multiplicerade varje konstant med sin egen staleness-multiplikator;
  // D038 mätte att det var tandlöst (att förnya köpte +0,3 CS för 318 tkr/säsong
  // — staleness kan per konstruktion bara röra de 0,67 aktiviteterna ger, medan
  // volontärbonusen nedan ensam bär upp till 1,5 CS/omgång). Konsekvensen av
  // staleness är flyttad till PUBLIKEN (getOrtFreshnessFactor →
  // computeAttendanceRate). csBoost känner inte längre till att staleness finns.
  //
  // Klockan (communityActivitiesSince) backfylls fortfarande HÄR — den behövs
  // av freshness-vägen och av förnyelsebeslutet, och det här är den enda
  // omgångsvisa processorn som äger ortsstate.
  const managedClubForUpkeep = game.clubs.find(c => c.id === game.managedClubId)
  const clubReputation = managedClubForUpkeep?.reputation ?? 50

  // Backfyllning FÖRE avläsning: en aktivitet utan känd startsäsong får
  // innevarande säsong, aldrig en bakåtdaterad. Returneras till roundProcessor
  // som skriver den vidare — utan den skrivningen hade backfyllningen räknats
  // om varje omgång och aktiviteten aldrig hunnit bli gammal.
  const activitiesSince = backfillActivitiesSince(
    game.communityActivitiesSince,
    game.communityActivities,
    game.currentSeason,
  )
  // Aktiviteternas flata csBoost. Konstanterna bor i ACTIVITY_CS_BOOST
  // (communityRenewalService.ts) sedan väg C — samma nio tal väger också
  // freshness-aggregeringen, och två kopior hade kunnat glida isär tyst.
  // getActiveStaleableActivities har exakt samma aktiv-villkor som de nio
  // if-satserna hade (kiosk/lottery är nivåfält, 'none' räknas inte).
  let upkeepBoost = 0
  for (const key of getActiveStaleableActivities(game.communityActivities)) {
    upkeepBoost += ACTIVITY_CS_BOOST[key]
  }
  // ── Frivilligbonus (puls) ─────────────────────────────────────────────────
  // Roster-baserat: regenerera från seed (samma som OrtenTab) → sum csBoost/10 per roll.
  // Kioskvakt=0.2, Matchvärd=0.4, Bandyskoleledare=0.5 etc. Cap +1.5/omg.
  const activeVolunteers = game.volunteers ?? []
  if (activeVolunteers.length > 0) {
    const seedNum = game.managedClubId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + game.currentSeason * 17
    const roster = generateVolunteerRoster(seedNum, 4)
    const rosterCsBoost = activeVolunteers.reduce((sum, name) => {
      const v = roster.find(r => r.name === name)
      return sum + (v ? v.csBoost / 10 : 0.32)
    }, 0)
    upkeepBoost += Math.min(1.5, rosterCsBoost)
  }

  // ANSPRÅK 4, knapp 1 (DOM_ANSPAK4_ORTSUNDERHALL_2026-08-29.md): samma insats
  // håller mindre när klubben vuxit. Skalas HÄR, alltså före den CS-baserade
  // dämpningen längre ned — en stor klubb vid hög CS träffas medvetet av BÅDA
  // (rep-faktor × cs-faktor), och att kombinationen lämnar holdbarheten intakt
  // är mätt, se D037. Matchresultat, placering och journalistmodifieraren
  // ligger UTANFÖR — de är inte managerns ortsinsats.
  csBoost += Math.max(0, upkeepBoost) * csUpkeepFactor(clubReputation)

  // LÄST-FÖRE-INITIERING (PASTAENDEKARTAN, 2026-08-26): `standings` här är
  // redan den lokalt omräknade tabellen (roundProcessor.ts, efter denna
  // omgångs resultat) — normalt säker, men en klubb som har bye denna
  // omgång kan fortfarande visa played=0 vid omgång 1. safeStandingPosition
  // stänger den kvarvarande luckan.
  const csPos = safeStandingPosition(standings, game.managedClubId) ?? 6
  if (csPos <= 3) csBoost += 0.2
  else if (csPos >= 10) csBoost -= 0.15

  // Journalist community modifier (SPEC_JOURNALIST_KAPITEL_A)
  csBoost += getJournalistCommunityModifier(game)

  // ── Politiker inbox-notiser ────────────────────────────────────────────────
  const pol = game.localPolitician
  if (pol && justCompletedManagedFixture && pol.relationship > 50) {
    const wonNotif = deriveUtfall(justCompletedManagedFixture, game.managedClubId) === 'vunnet'
    if (wonNotif) {
      const isHomeNotif = justCompletedManagedFixture.homeClubId === game.managedClubId
      const opponent = game.clubs.find(c => c.id === (isHomeNotif ? justCompletedManagedFixture.awayClubId : justCompletedManagedFixture.homeClubId))
      inboxItems.push({
        id: `inbox_pol_match_${nextMatchday}_${game.currentSeason}`,
        date: game.currentDate,
        type: InboxItemType.BoardFeedback,
        title: `${pol.name} noterade segern`,
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
          title: `Stärkt relation med ${pol.name}`,
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
        title: `Kommunbidraget ${direction}`,
        // M34 (textaudit 2026-07-03): kommunBidrag betalas ut en gång per säsong
        // (economyService.ts: "once at round 1") — inte månadsvis.
        body: `Kommunen har ${direction} bidraget till klubben (${diffStr} kr/säsong). Nytt bidrag: ${pol.kommunBidrag} kr.`,
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
        title: `${mec.name} är missnöjd`,
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
          title: `${mec.name} överväger att lämna`,
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
          title: `${mec.name} är nöjd`,
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
          title: `Ny mecenat: ${mec.name}`,
          // M34 (textaudit 2026-07-03): mec.contribution läggs till totalContributed
          // en gång per säsong (updateSilentShout) — inte månadsvis.
          body: `${mec.name} (${mec.business}) vill stötta klubben ekonomiskt. Bidrag: ${mec.contribution} kr/säsong.`,
          isRead: false,
        } as InboxItem)
      }
    }
  }

  // ── Facility project completion ────────────────────────────────────────────
  // New model (B1): use FacilityState if present
  let updatedFacilityState: FacilityState | undefined
  let facilityBonusTotal = 0
  let facilityCapacityBonus = 0

  let completedNodeId: string | null = null
  if (game.facilityState) {
    const advanced = advanceFacilityState(game.facilityState, nextMatchday, game.currentSeason)
    updatedFacilityState = advanced.state
    facilityBonusTotal = advanced.facilitiesBonus
    facilityCapacityBonus = advanced.capacityBonus
    completedNodeId = advanced.completedNodeId
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
    const won = deriveUtfall(justCompletedManagedFixture, game.managedClubId) === 'vunnet'
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

  // Drift volunteerMorale toward communityStanding (mean-reversion, ±3 cap)
  const csPulse = game.communityStanding ?? 50
  for (const name of volunteers) {
    const current = volunteerMorale[name] ?? 70
    const drift = Math.max(-3, Math.min(3, (csPulse - current) * 0.15))
    if (Math.abs(drift) >= 0.5) {
      volunteerMorale[name] = Math.min(100, Math.max(0, Math.round(current + drift)))
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
      title: `${name} slutar som frivillig`,
      body: `${name} har tröttnat och drar sig tillbaka. Det har varit tungt kring klubben på sistone, och det tar på humöret.`,
      isRead: false,
    } as InboxItem)
  }

  // ── Diminishing returns on positive CS boosts ─────────────────────────────
  // Negative effects (losses, scandals) are unaffected — equally easy to fall from 90 as from 50
  //
  // Tröskelsvepet (RAPPORT_COMMUNITYSTANDING_TROSKELSVEP_2026-08-26, fynd #1,
  // Jacobs dom 2026-08-26): var tidigare ett 4-stegs trappsteg (>85/>70/>55)
  // — en boost delades exakt på hälften mellan cs=70 (faktor 0.5) och cs=71
  // (faktor 0.75), på EXAKT samma linje som tre andra system slår om (H4-
  // tröskelfamiljen). "En vägg mitt i det spelaren ska klättra på" (Jacobs
  // ord). Ersatt av en kontinuerlig linjär ramp: oförändrad full effekt
  // (1.0) vid/under cs=55 (samma golv gamla plattån hade), linjärt fallande
  // till 0.25 vid cs=100 (samma tak gamla trappans sista steg hade) — inga
  // trappsteg kvar, men ändpunkterna oförändrade så den övergripande
  // balansen inte hoppar okontrollerat.
  const positiveBoost = Math.max(0, csBoost)
  const negativeBoost = Math.min(0, csBoost)
  const currentCS = game.communityStanding ?? 50
  const diminishingFactor = getCsDiminishingFactor(currentCS) // se communityStandingScaling.ts

  // ANSPRÅK 4, knapp 2: ortens stigande förväntan som baslinjedrag, rykte-skalat
  // och kontinuerligt (csExpectationDrag). Dras EFTER dämpningen, inte före:
  // splitten ovan delar totalsumman, så ett drag som lagts in tidigare hade
  // ätits upp av positiveBoost och sedan skalats av diminishingFactor — alltså
  // dämpats bort precis för den klubb den ska bita på. Dragets uppgift är att
  // bita ÄVEN på en klubb som coastar på segrar (baslinjemätningen: en dominant
  // klubb utan en enda aktivitet låg ändå på CS-snitt 77).
  //
  // Detta är TRYCKET, inte konsekvensen: mecenat-/patron-/sponsoruttågen fyrar
  // exakt som förut när CS faktiskt korsar sina egna trösklar. Anspråk 4 rör
  // inte de trösklarna och räknar dem inte en andra gång.
  const expectationDrag = csExpectationDrag(clubReputation)
  csBoost = positiveBoost * diminishingFactor + negativeBoost - expectationDrag

  return { csBoost, klackMoodDelta, inboxItems, updatedFacilityState, facilityBonusTotal, facilityCapacityBonus, completedNodeId, updatedVolunteers, updatedVolunteerMorale: volunteerMorale, updatedCommunityActivitiesSince: activitiesSince }
}
