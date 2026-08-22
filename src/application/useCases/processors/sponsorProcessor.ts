import type { SaveGame, InboxItem, Sponsor } from '../../../domain/entities/SaveGame'
import type { Player } from '../../../domain/entities/Player'
import type { Fixture } from '../../../domain/entities/Fixture'
import { InboxItemType, TrainingType, TrainingIntensity } from '../../../domain/enums'
import { mulberry32 } from '../../../domain/utils/random'
import { applyFinanceChange } from '../../../domain/services/economyService'
import { RISKY_SPONSOR_CONTRACT_ROUNDS } from '../../../domain/data/eventProcessorStrings'

export interface SponsorProcessorResult {
  updatedSponsors: Sponsor[]
  inboxItems: InboxItem[]
}

/**
 * Processes sponsor chain effects, patron inbox notifications, and nudge notifications.
 *
 * @param justCompletedManagedFixture - Managed club's fixture this round (if any)
 * @param finalPlayers - Players after all round updates (for morale nudge)
 * @param nextMatchday - The matchday number being processed
 * @param newDate - ISO date string for this round
 * @param baseSeed - Base seed for deterministic randomness
 * @param localRand - Seeded random function from outer round
 */
export function processSponsors(
  game: SaveGame,
  justCompletedManagedFixture: Fixture | null,
  finalPlayers: Player[],
  nextMatchday: number,
  newDate: string,
  baseSeed: number,
  localRand: () => number,
  options?: { skipSideEffects?: boolean },
): SponsorProcessorResult {
  if (options?.skipSideEffects) {
    return { updatedSponsors: game.sponsors ?? [], inboxItems: [] }
  }
  const inboxItems: InboxItem[] = []
  const v09Rand = mulberry32(baseSeed + 999777)

  // ── Sponsor chain effects ──────────────────────────────────────────────────
  let v09Sponsors = (game.sponsors ?? []).map(s => ({ ...s, contractRounds: s.contractRounds - 1 }))

  const leavingSponsors = v09Sponsors.filter(s => s.contractRounds <= 0)
  for (const leaving of leavingSponsors) {
    inboxItems.push({
      id: `inbox_sponsor_expire_${leaving.id}_${nextMatchday}`,
      date: newDate,
      type: InboxItemType.SponsorNetwork,
      title: `${leaving.name} avslutar`,
      body: `Sponsoravtalet med ${leaving.name} har löpt ut. Intäkten på ${Math.round(leaving.weeklyIncome / 1000)} tkr/omg försvinner.`,
      isRead: false,
    } as InboxItem)
  }

  if (leavingSponsors.length > 0 && v09Rand() < 0.3) {
    const remaining = v09Sponsors.filter(s => s.contractRounds > 0)
    if (remaining.length > 0) {
      const idx = Math.floor(v09Rand() * remaining.length)
      const affectedSponsor = remaining[idx]
      v09Sponsors = v09Sponsors.map(s =>
        s.id === affectedSponsor.id
          ? { ...s, weeklyIncome: Math.round(s.weeklyIncome * 0.8) }
          : s,
      )
      inboxItems.push({
        id: `inbox_sponsor_chain_${nextMatchday}_${game.currentSeason}`,
        date: newDate,
        type: InboxItemType.SponsorNetwork,
        title: 'Sponsornätverket oroligt',
        body: `${affectedSponsor.name} har hört rykten om en avgång i sponsorgruppen. Deras bidrag minskar tillfälligt.`,
        isRead: false,
      } as InboxItem)
    }
  }

  if (
    game.licenseReview?.status === 'warning' ||
    game.licenseReview?.status === 'continued_review'
  ) {
    const activeSponsorsForCheck = v09Sponsors.filter(s => s.contractRounds > 0)
    if (activeSponsorsForCheck.length > 0 && v09Rand() < 0.2) {
      const leavingIdx = Math.floor(v09Rand() * activeSponsorsForCheck.length)
      const leavingSponsor = activeSponsorsForCheck[leavingIdx]
      v09Sponsors = v09Sponsors.map(s =>
        s.id === leavingSponsor.id ? { ...s, contractRounds: 0 } : s,
      )
      inboxItems.push({
        id: `inbox_sponsor_license_leave_${nextMatchday}_${game.currentSeason}`,
        date: newDate,
        type: InboxItemType.SponsorNetwork,
        title: `${leavingSponsor.name} drar sig ur`,
        body: `${leavingSponsor.name} har fått kännedom om licensnämndens varning och väljer att avsluta samarbetet omedelbart.`,
        isRead: false,
      } as InboxItem)
    }
  }

  if (justCompletedManagedFixture) {
    const isHome = justCompletedManagedFixture.homeClubId === game.managedClubId
    const myScore = isHome ? justCompletedManagedFixture.homeScore : justCompletedManagedFixture.awayScore
    const theirScore = isHome ? justCompletedManagedFixture.awayScore : justCompletedManagedFixture.homeScore
    const wonMatch = (myScore ?? 0) > (theirScore ?? 0)
    if (wonMatch && v09Rand() < 0.05) {
      inboxItems.push({
        id: `inbox_sponsor_win_${nextMatchday}_${game.currentSeason}`,
        date: newDate,
        type: InboxItemType.SponsorNetwork,
        title: 'Spontant sponsorintresse',
        body: 'En lokal företagare hörde om segern och är intresserad av ett sponsorsamarbete. Se Ekonomi-fliken.',
        isRead: false,
      } as InboxItem)
    }
  }

  const updatedSponsors = v09Sponsors.filter(s => s.contractRounds > 0)

  // ── Patron influence inbox ─────────────────────────────────────────────────
  const v09Patron = game.patron
  if (v09Patron?.isActive) {
    const influence = v09Patron.influence ?? 30
    if (influence >= 30 && influence < 60) {
      const patronInboxId = `inbox_patron_invite_${game.currentSeason}`
      if (!game.inbox.some(i => i.id === patronInboxId)) {
        inboxItems.push({
          id: patronInboxId,
          date: newDate,
          type: InboxItemType.PatronInfluence,
          title: `${v09Patron.name} vill bli inbjuden till matcher`,
          body: `${v09Patron.name} har bidragit generöst och hör av sig: "Jag skulle gärna se ett par matcher live i år."`,
          isRead: false,
        } as InboxItem)
      }
    }
  }

  // ── Nudge notifications ────────────────────────────────────────────────────
  const nudgeManagedClub = game.clubs.find(c => c.id === game.managedClubId)
  const activeSponsorsCount = (game.sponsors ?? []).filter(s => s.contractRounds > 0).length
  const nudgeMaxSponsors = nudgeManagedClub ? Math.min(6, 2 + Math.floor(nudgeManagedClub.reputation / 20)) : 3

  const communityNudges = [
    { round: 5, id: `inbox_nudge_kiosk_${game.currentSeason}`, title: 'Kioskverksamhet?', body: 'En grupp frivilliga har frågat om att starta en kiosk vid hemmamatcherna. Det skulle kosta 3 tkr att komma igång.' },
    { round: 3, id: `inbox_nudge_socialmedia_${game.currentSeason}`, title: 'Sociala medier?', body: 'Någon i styrelsen föreslår att klubben borde vara mer aktiv på sociala medier. Det kostar lite men ger synlighet. Kolla in Förening → Ekonomi.' },
    { round: 8, id: `inbox_nudge_lottery_${game.currentSeason}`, title: 'Lotteri för klubben?', body: 'En av supportrarna har föreslagit ett lotteri. Det kan ge ett bra tillskott till kassan. Se Förening → Ekonomi.' },
  ]
  for (const nudge of communityNudges) {
    if (nextMatchday === nudge.round && !game.inbox.some(i => i.id === nudge.id)) {
      inboxItems.push({
        id: nudge.id,
        date: newDate,
        type: InboxItemType.Community,
        title: nudge.title,
        body: nudge.body,
        isRead: false,
      } as InboxItem)
    }
  }

  if (nextMatchday === 12 && !game.communityActivities?.bandySchool && (game.academyLevel ?? 'basic') !== 'basic') {
    const id = `inbox_nudge_bandyschool_${game.currentSeason}`
    if (!game.inbox.some(i => i.id === id)) {
      inboxItems.push({
        id,
        date: newDate,
        type: InboxItemType.Community,
        title: 'Starta bandyskola?',
        body: 'Med er akademi på plats finns det möjlighet att starta en bandyskola för barn. Det stärker klubbens lokala förankring. Se Förening → Ekonomi.',
        isRead: false,
      } as InboxItem)
    }
  }

  if (nextMatchday === 3) {
    const defaultTraining =
      (game.managedClubTraining?.type === TrainingType.Physical || game.managedClubTraining?.type === undefined) &&
      (game.managedClubTraining?.intensity === TrainingIntensity.Normal || game.managedClubTraining?.intensity === undefined)
    const id = `inbox_nudge_training_${game.currentSeason}`
    if (defaultTraining && !game.inbox.some(i => i.id === id)) {
      inboxItems.push({
        id,
        date: newDate,
        type: InboxItemType.Training,
        title: 'Träningsschema',
        body: 'Spelarna undrar om det inte är dags att variera träningen? Kolla in träningstabben under Förening.',
        isRead: false,
      } as InboxItem)
    }
  }

  if (nextMatchday % 4 === 0 && activeSponsorsCount < nudgeMaxSponsors && localRand() < 0.25) {
    const id = `inbox_nudge_sponsor_${nextMatchday}_${game.currentSeason}`
    if (!game.inbox.some(i => i.id === id)) {
      const sponsorNames = ['Johanssons Bygg AB', 'Karlssons Bil', 'Bergström El & Installation', 'Lindströms Åkeri', 'Erikssons Redovisning']
      const sponsorName = sponsorNames[Math.floor(localRand() * sponsorNames.length)]
      const incomePerRound = 500 + Math.round(localRand() * 1000)
      const durationRounds = 4 + Math.round(localRand() * 4)
      inboxItems.push({
        id,
        date: newDate,
        type: InboxItemType.SponsorNetwork,
        title: `Sponsorerbjudande från ${sponsorName}`,
        body: `${sponsorName} vill teckna ett avtal värt ${incomePerRound} kr/omgång i ${durationRounds} omgångar. Gå till Förening → Ekonomi → Sponsorer.`,
        isRead: false,
      } as InboxItem)
    }
  }

  // Morale nudge: if any managed squad player drops below 30
  const managedSquadIds = nudgeManagedClub?.squadPlayerIds ?? []
  for (const player of finalPlayers.filter(p => managedSquadIds.includes(p.id) && (p.morale ?? 50) < 30)) {
    const id = `inbox_morale_${player.id}_r${nextMatchday}_${game.currentSeason}`
    if (!game.inbox.some(i => i.id === id)) {
      inboxItems.push({
        id,
        date: newDate,
        type: InboxItemType.Community,
        title: `${player.firstName} ${player.lastName} vill prata`,
        body: `${player.firstName} ${player.lastName} verkar inte må bra. Kanske är det dags för ett spelarsamtal? Klicka på spelaren i Trupp.`,
        isRead: false,
      } as InboxItem)
      break // max one morale nudge per round
    }
  }

  return { updatedSponsors, inboxItems }
}

const RISKY_SPONSOR_MATURATION_CHANCE = 0.25
const RISKY_SPONSOR_CLAWBACK_SHARE = 0.5
const RISKY_SPONSOR_COMMUNITY_STANDING_DELTA = -4

/**
 * O1-uppföljning (SLUTTEST_KO.md, 2026-08-22) — riskySponsorOffers
 * maturation-konsekvens, konsoliderad till EN funktion (check + alla tre
 * effekter). Låg tidigare uppdelad: checken/inbox-texten i roundProcessor.ts
 * långt före sponsors/clubs var färdigmonterade, med en kommentar som lovade
 * att sponsorn togs bort och pengar krävdes tillbaka "i SaveGame-monteringen
 * nedan" — ingen sådan kod fanns någonsin. Text lovade tre effekter, koden
 * gav noll.
 *
 * Sidofynd wirat i SAMMA leverans (Jacobs order — annars wiras tre effekter
 * till en väg som ändå aldrig nås): den gamla checken gated på
 * `rc.season === game.currentSeason`, vilket gjorde kontraktet permanent
 * okontrollerbart så fort säsongen rullade över UTAN att risken utlösts
 * (rc.season låst vid tecknandet, currentSeason bara ökar). En SENARE säsong
 * har per definition redan passerat mognadsfönstret (riskMaturityRound
 * sattes alltid inom tecknandesäsongen) — annars skulle kontraktet aldrig
 * kunna kontrolleras igen efter ett säsongsskifte. `riskySponsorContract`
 * rensades inte heller när risken FAKTISKT utlöstes, eller när sponsorn
 * löpte ut naturligt innan risken hann utlösas — båda fallen städas nu.
 *
 * Ren funktion (game in, game ut) — `localRand` injiceras så testerna kan
 * styra utfallet deterministiskt utan att fejka hela omgångspipelinen.
 */
export function applyRiskySponsorMaturation(
  game: SaveGame,
  nextMatchday: number,
  newDate: string,
  localRand: () => number,
): SaveGame {
  const rc = game.riskySponsorContract
  if (!rc) return game

  const sponsor = game.sponsors?.find(s => s.id === rc.sponsorId)
  if (!sponsor) {
    // Löpte ut naturligt (contractRounds→0) innan risken hann utlösas —
    // inget kvar att exponera, inget att kräva tillbaka.
    return { ...game, riskySponsorContract: undefined }
  }

  // Samma säsong: håll den ursprungliga inom-säsongs-omgångsjämförelsen.
  // En senare säsong har redan passerat mognadsfönstret, se filhuvudet.
  const maturityReached = rc.season === game.currentSeason
    ? nextMatchday >= rc.riskMaturityRound
    : true
  if (!maturityReached || localRand() >= RISKY_SPONSOR_MATURATION_CHANCE) return game

  const matId = `risky_sponsor_exposed_${rc.sponsorId}`
  if (game.inbox.some(i => i.id === matId)) return game

  const sponsorName = sponsor.name
  const riskConsequences = [
    {
      title: `${sponsorName}: Skatteverket-granskning publik`,
      body: `Skatteverket har gripit in mot ${sponsorName}. Företagets bankmedel är frysta och avtal med tredje part avslutas. {KLUBB} förlorar sponsorn i förtid och måste betala tillbaka del av redan utbetalda medel. Anseendet tar en törn.`,
    },
    {
      title: `${sponsorName}: Försatt i konkurs`,
      body: `${sponsorName} har försatts i konkurs. Det fanns inget att granska — företaget hade inga riktiga kunder. {KLUBB}s avtal är värdelöst. Pengarna som kommit in betalas tillbaka till konkursboet.`,
    },
    {
      title: `${sponsorName} i lokaltidningen`,
      body: `Lokaltidningen har börjat skriva om ${sponsorName}. Reportagen handlar om okända ägare, suspekta bolagsstrukturer och kopplingar till en tidigare brottsmisstänkt person. {KLUBB} avslutar avtalet före det blir värre.`,
    },
  ]
  const clubName = game.clubs.find(c => c.id === game.managedClubId)?.name ?? 'Klubben'
  const picked = riskConsequences[game.currentSeason % riskConsequences.length]

  // Effekt 1: sponsorn tas bort.
  const sponsorsAfter = (game.sponsors ?? []).filter(s => s.id !== rc.sponsorId)

  // Effekt 2: claw-back — HÄLFTEN av vad sponsorn hunnit betala, inte allt
  // (Jacobs dom: en sponsor som drar sig ur tar tillbaka det som återstår av
  // avtalet, inte pengar som redan gått åt). contractRounds decrementeras
  // varje omgång oavsett säsongsgräns (processSponsors ovan) — robust mot att
  // kontraktet nu kan sträcka sig över ett säsongsskifte.
  const roundsElapsed = Math.max(0, RISKY_SPONSOR_CONTRACT_ROUNDS - sponsor.contractRounds)
  const paidSoFar = sponsor.weeklyIncome * roundsElapsed
  const clawback = Math.round(paidSoFar * RISKY_SPONSOR_CLAWBACK_SHARE)
  const clubsAfter = applyFinanceChange(game.clubs, game.managedClubId, -clawback)

  // Effekt 3: anseende −4 — mildare än O1-konfliktkortets −6. Jacobs dom: att
  // bli lurad väger lättare än att aktivt välja bort någon.
  const communityStandingAfter = Math.max(0, Math.min(100, (game.communityStanding ?? 50) + RISKY_SPONSOR_COMMUNITY_STANDING_DELTA))

  return {
    ...game,
    sponsors: sponsorsAfter,
    clubs: clubsAfter,
    communityStanding: communityStandingAfter,
    riskySponsorContract: undefined,
    inbox: [...game.inbox, {
      id: matId,
      date: newDate,
      type: InboxItemType.BoardFeedback,
      title: picked.title,
      body: picked.body.replace(/{KLUBB}/g, clubName),
      isRead: false,
    } as InboxItem],
  }
}
