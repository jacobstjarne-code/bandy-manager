import type { SaveGame } from '../entities/SaveGame'
import type { Sponsor } from '../entities/Sponsor'
import type { Moment } from '../entities/Moment'
import type { StandingRow } from '../entities/Standing'
import { FixtureStatus } from '../enums'

interface ContextualSponsorResult {
  newSponsors: Sponsor[]
  newMoments: Moment[]
}

// One-time payment amount for kommunstöd
const KOMMUNSTOD_AMOUNT = 80_000

export function checkContextualSponsors(
  game: SaveGame,
  standings: StandingRow[],
  currentRound: number,
): ContextualSponsorResult {
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

  // cs_over_70 → kommunalt engagemang (one-time payment, also checked at round 11)
  const hasCsSponsor = existing.some(s => s.triggeredBy === 'cs_over_70' && s.triggeredSeason === season)
  if (!hasCsSponsor && cs > 70) {
    const managedClub = game.clubs.find(c => c.id === game.managedClubId)
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
    })
    newMoments.push({
      id: `moment_sponsor_cs70_${season}`,
      source: 'sponsor_positive',
      matchday: currentRound,
      season,
      title: 'Kommunen beviljar engångsstöd',
      body: `Kommunen erkänner klubbens roll i orten och beviljar ${KOMMUNSTOD_AMOUNT.toLocaleString('sv-SE')} kr i engångsbidrag. Pengarna betalas ut direkt.`,
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
): { updatedGame: SaveGame; paid: boolean } {
  const season = game.currentSeason
  const kommunSponsor = (game.sponsors ?? []).find(
    s => s.isOneTime && s.triggeredBy === 'cs_over_70' && s.triggeredSeason === season && !s.paidOutSeason,
  )
  if (!kommunSponsor) return { updatedGame: game, paid: false }

  if (!game.clubs.find(c => c.id === game.managedClubId)) return { updatedGame: game, paid: false }

  const updatedClubs = game.clubs.map(c =>
    c.id === game.managedClubId ? { ...c, finances: c.finances + KOMMUNSTOD_AMOUNT } : c,
  )
  const updatedSponsors = (game.sponsors ?? []).map(s =>
    s.id === kommunSponsor.id ? { ...s, paidOutSeason: season } : s,
  )

  return {
    updatedGame: { ...game, clubs: updatedClubs, sponsors: updatedSponsors },
    paid: true,
  }
}
