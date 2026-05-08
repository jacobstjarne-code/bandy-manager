import type { SaveGame } from '../entities/SaveGame'
import type { CupBracket } from '../entities/Cup'
import { getManagedClubCupStatus } from './cupService'
import type { AnslagKey } from '../data/anslag/cupAnslag'

export type { AnslagKey }

function allRoundComplete(bracket: CupBracket, round: number): boolean {
  const matches = bracket.matches.filter(m => m.round === round && !m.isBye)
  return matches.length > 0 && matches.every(m => m.winnerId)
}

function managedClubLastCupMatchCompleted(bracket: CupBracket, clubId: string): boolean {
  const allClubMatches = bracket.matches.filter(
    m => (m.homeClubId === clubId || m.awayClubId === clubId) && !m.isBye
  )
  if (allClubMatches.length === 0) return false
  const latest = allClubMatches.sort((a, b) => b.round - a.round)[0]
  return Boolean(latest.winnerId) && (latest.winnerId !== clubId || latest.round === 4)
}

export function isClubDirektkvalad(bracket: CupBracket, clubId: string): boolean {
  return bracket.byeTeamIds?.includes(clubId) ?? false
}

export function computeNextAnslag(game: SaveGame): AnslagKey | null {
  const seen = game.seenAnslag ?? []
  const club = game.managedClubId
  const bracket = game.cupBracket
  const matchday = game.currentMatchday

  if (!bracket) return null

  // Anslaget — innan första cup-match (matchday 1 = förstarunda)
  if (matchday >= 1 && !seen.includes('cup_start')) {
    return 'cup_start'
  }

  // After kvartsfinaler complete (round 2)
  if (allRoundComplete(bracket, 2)) {
    const status = getManagedClubCupStatus(bracket, club)

    // Pokalen för utslagna i kvart (round 2 eliminerade) — tar företräde
    if (status.eliminated && (status.eliminatedInRound ?? 0) <= 2
        && !seen.includes('cup_done') && !seen.includes('cup_done_winner')) {
      return 'cup_done'
    }

    // Helgen — kvalad till semifinal (round 3)
    const inSemi = bracket.matches.some(
      m => m.round === 3 && (m.homeClubId === club || m.awayClubId === club)
    )
    if (inSemi && !seen.includes('cup_finalweekend_pre')) {
      return 'cup_finalweekend_pre'
    }

    // Snålvinden — ej utslagen i round 1 men utslagen i round 2
    if (status.eliminated && status.eliminatedInRound === 2 && !seen.includes('cup_between')) {
      return 'cup_between'
    }
  }

  // Pokalen — efter klubbens sista cup-match (semi/final-förlorare + vinnare)
  if (managedClubLastCupMatchCompleted(bracket, club)
      && !seen.includes('cup_done') && !seen.includes('cup_done_winner')) {
    return bracket.winnerId === club ? 'cup_done_winner' : 'cup_done'
  }

  return null
}
