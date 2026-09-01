import type { SaveGame } from '../entities/SaveGame'
import type { Sponsor } from '../entities/Sponsor'
import type { Moment } from '../entities/Moment'
import type { StandingRow } from '../entities/Standing'
import { FixtureStatus } from '../enums'
import { applyFinanceChange } from './economyService'

interface ContextualSponsorResult {
  newSponsors: Sponsor[]
  newMoments: Moment[]
}

// One-time payment amount for kommunstöd — nu ett TAK, inte ett fast belopp.
// Se checkContextualSponsors nedan (H4-uppföljning, 2026-08-26): beloppet
// skalar kontinuerligt med communityStanding istf ett fast belopp bakom en
// hård tröskel.
const KOMMUNSTOD_AMOUNT = 80_000

/**
 * @cites StandingRow.position, game.communityStanding, fixture.attendance
 */
export function checkContextualSponsors(
  game: SaveGame,
  standings: StandingRow[],
  currentRound: number,
  options?: { skipSideEffects?: boolean },
): ContextualSponsorResult {
  if (options?.skipSideEffects) {
    return { newSponsors: [], newMoments: [] }
  }
  const newSponsors: Sponsor[] = []
  const newMoments: Moment[] = []
  const season = game.currentSeason
  const existing = game.sponsors ?? []

  const managedPos = standings.find(s => s.clubId === game.managedClubId)?.position ?? 12
  const cs = game.communityStanding ?? 50

  const hasTop4Sponsor = existing.some(s => s.triggeredBy === 'top4' && s.triggeredSeason === season)
  if (!hasTop4Sponsor && managedPos <= 4 && currentRound === 11) {
    newSponsors.push({
      id: `contextual_top4_${season}`,
      name: 'Regionalt Näringsliv AB',
      category: 'Regional',
      weeklyIncome: 1_500,
      contractRounds: 22,
      signedRound: currentRound,
      tier: 'contextual_regional',
      triggeredBy: 'top4',
      triggeredSeason: season,
      expiresSeason: season + 1,
    })
    newMoments.push({
      id: `moment_sponsor_top4_${season}`,
      source: 'sponsor_positive',
      matchday: currentRound,
      season,
      title: 'Regionalt näringsliv hör av sig',
      body: 'Topplaceringen vid halvtid har inte gått obemärkt förbi. Regionalt Näringsliv AB erbjuder 1 500 kr per omgång — ett kvitto på att laget syns.',
    })
  }

  // H4-uppföljning (2026-08-26): "cs_over_70" var en hård tröskel (cs > 70)
  // som gav ETT fast belopp (80 000 kr) eller NOLL — ett steg på precis en
  // enhet communityStanding (70→71) gav en diskret ~80k intäktsskillnad,
  // bekräftat generellt (kodverifierat: gäller alla 12 klubbar, alla säsonger,
  // ingen region-/tier-scoping) och en av flera bidragande orsaker till
  // avskedsfrekvens-klippan mellan cs=70/71 (H4, docs/BACKLOG.md). Ersatt av
  // en kontinuerlig skala: beloppet växer jämnt med communityStanding
  // (0 kr vid/under 50, taket KOMMUNSTOD_AMOUNT vid cs>=90) istf ett
  // allt-eller-inget-hopp vid exakt 71. Golvet vid 50 (inte 0) speglar att
  // en klubb med genomsnittligt/svagt lokalt stöd inte rimligen får ett
  // kommunalt engångsbidrag alls — bara den övre halvan av skalan gör det,
  // gradvis.
  const csFactor = Math.max(0, Math.min(1, (cs - 50) / 40))
  // Dedup via game.kommunstodPaidSeason (SaveGame.ts), INTE via en sponsor-
  // post i `existing` — den posten skapas med contractRounds:1 och rensas
  // bort av sponsorProcessor.ts:s generiska expiry-svep efter EN omgång,
  // vilket lät detta bidraget betalas ut på nytt vid varje kontrollomgång
  // (financelog-gap-diagnos-2026-09-01.ts, Jacobs körorder 2026-09-01).
  const alreadyPaidThisSeason = game.kommunstodPaidSeason === season
  if (!alreadyPaidThisSeason && csFactor > 0 && [5, 11, 18].includes(currentRound)) {
    const managedClub = game.clubs.find(c => c.id === game.managedClubId)
    const amount = Math.round(KOMMUNSTOD_AMOUNT * csFactor)
    newSponsors.push({
      id: `contextual_cs70_${season}`,
      name: `${managedClub?.region ?? 'Kommunen'} Kommunstöd`,
      category: 'Kommunalt',
      weeklyIncome: 0,
      contractRounds: 1,
      signedRound: currentRound,
      tier: 'contextual_kommun',
      triggeredBy: 'cs_over_70',
      triggeredSeason: season,
      expiresSeason: season,
      isOneTime: true,
      oneTimeAmount: amount,
    })
    newMoments.push({
      id: `moment_sponsor_cs70_${season}`,
      source: 'sponsor_positive',
      matchday: currentRound,
      season,
      title: 'Kommunen beviljar engångsstöd',
      body: `Kommunen erkänner klubbens roll i orten och beviljar ${amount.toLocaleString('sv-SE')} kr i engångsbidrag. Pengarna betalas ut direkt.`,
    })
  }

  // attendance_1000 → catering-sponsor, fires only at rounds 7/14/22 with average attendance > 1000
  const hasAttendanceSponsor = existing.some(s => s.triggeredBy === 'attendance_1000' && s.triggeredSeason === season)
  if (!hasAttendanceSponsor && [7, 14, 22].includes(currentRound)) {
    const managedClubId = game.managedClubId
    const homeFixtures = (game.fixtures ?? []).filter(f =>
      f.status === FixtureStatus.Completed &&
      f.homeClubId === managedClubId &&
      f.matchday <= currentRound,
    )
    const avgAttendance = homeFixtures.length > 0
      ? homeFixtures.reduce((sum, f) => sum + (f.attendance ?? 0), 0) / homeFixtures.length
      : 0
    if (avgAttendance > 1_000) {
      newSponsors.push({
        id: `contextual_att1000_${season}`,
        name: 'Ortenmat Catering',
        category: 'Catering',
        weeklyIncome: 800,
        contractRounds: 22,
        signedRound: currentRound,
        tier: 'contextual_catering',
        triggeredBy: 'attendance_1000',
        triggeredSeason: season,
        expiresSeason: season + 1,
      })
      newMoments.push({
        id: `moment_sponsor_att1000_${season}`,
        source: 'sponsor_positive',
        matchday: currentRound,
        season,
        title: 'Ortenmat Catering vill in',
        body: `Snittet på ${Math.round(avgAttendance).toLocaleString('sv-SE')} åskådare per hemmamatch har väckt intresse. Ortenmat Catering erbjuder 800 kr per omgång — publiken är ett säljargument.`,
      })
    }
  }

  return { newSponsors, newMoments }
}

// Apply one-time kommunstöd payment to club finances
export function applyOneTimeKommunstod(
  game: SaveGame,
  options?: { skipSideEffects?: boolean },
): { updatedGame: SaveGame; paid: boolean; amount: number } {
  if (options?.skipSideEffects) {
    return { updatedGame: game, paid: false, amount: 0 }
  }
  const season = game.currentSeason
  const kommunSponsor = (game.sponsors ?? []).find(
    s => s.isOneTime && s.triggeredBy === 'cs_over_70' && s.triggeredSeason === season && !s.paidOutSeason,
  )
  if (!kommunSponsor) return { updatedGame: game, paid: false, amount: 0 }

  if (!game.clubs.find(c => c.id === game.managedClubId)) return { updatedGame: game, paid: false, amount: 0 }

  // H4-uppföljning: läs det skalade beloppet satt vid skapandetillfället —
  // fall tillbaka till hela KOMMUNSTOD_AMOUNT bara för gamla sparfiler vars
  // sponsor skapades innan detta fält fanns (annars 0 kr utbetalt, tystare
  // fel än det gamla fasta beloppet).
  const amount = kommunSponsor.oneTimeAmount ?? KOMMUNSTOD_AMOUNT
  const updatedClubs = applyFinanceChange(game.clubs, game.managedClubId, amount)
  const updatedSponsors = (game.sponsors ?? []).map(s =>
    s.id === kommunSponsor.id ? { ...s, paidOutSeason: season } : s,
  )

  return {
    // kommunstodPaidSeason: dedup-minnet (SaveGame.ts) — se checkContextualSponsors.
    // Satt HÄR, inte bara på sponsor-posten, eftersom sponsor-posten rensas
    // bort av sponsorProcessor.ts:s expiry-svep inom en enda omgång.
    updatedGame: { ...game, clubs: updatedClubs, sponsors: updatedSponsors, kommunstodPaidSeason: season },
    paid: true,
    amount,
  }
}
