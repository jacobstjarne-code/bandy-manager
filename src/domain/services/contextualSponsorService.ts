import type { SaveGame } from '../entities/SaveGame'
import type { Sponsor } from '../entities/Sponsor'
import type { StandingRow } from '../entities/Standing'
import { FixtureStatus } from '../enums'

interface ContextualSponsorResult {
  newSponsors: Sponsor[]
  inboxTitles: string[]
}

// One-time payment amount for kommunstöd
const KOMMUNSTOD_AMOUNT = 80_000

export function checkContextualSponsors(
  game: SaveGame,
  standings: StandingRow[],
  currentRound: number,
): ContextualSponsorResult {
  const newSponsors: Sponsor[] = []
  const inboxTitles: string[] = []
  const season = game.currentSeason
  const existing = game.sponsors ?? []

  const managedPos = standings.find(s => s.clubId === game.managedClubId)?.position ?? 12
  const cs = game.communityStanding ?? 50

  // top4 → regional sponsor (one per season)
  const hasTop4Sponsor = existing.some(s => s.triggeredBy === 'top4' && s.triggeredSeason === season)
  if (!hasTop4Sponsor && managedPos <= 4) {
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
    inboxTitles.push('Regionalt Näringsliv AB hör av sig — topplacering öppnar dörrar')
  }

  // cs_over_70 → kommunalt engagemang (one-time payment)
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
    inboxTitles.push(`Kommunen beviljar extra stöd — ${KOMMUNSTOD_AMOUNT / 1000}k kr engångsbidrag`)
  }

  // attendance_1000 → catering-sponsor triggered by high attendance
  const hasAttendanceSponsor = existing.some(s => s.triggeredBy === 'attendance_1000' && s.triggeredSeason === season)
  if (!hasAttendanceSponsor) {
    const managedClubId = game.managedClubId
    const highAttendance = (game.fixtures ?? []).some(f =>
      f.status === FixtureStatus.Completed &&
      f.homeClubId === managedClubId &&
      (f.attendance ?? 0) >= 1_000,
    )
    if (highAttendance) {
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
      inboxTitles.push('Ortenmat Catering vill sponsra — stämningen på läktaren imponerade')
    }
  }

  return { newSponsors, inboxTitles }
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
