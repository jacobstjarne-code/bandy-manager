import type { SaveGame } from '../entities/SaveGame'
import type { CupBracket } from '../entities/Cup'
import { getManagedClubCupStatus } from './cupService'
import { mulberry32 } from '../utils/random'
import type { AnslagText } from '../data/anslag/types'
import type { CupAnslagKey } from '../data/anslag/cupAnslag'
import { CUP_ANSLAG } from '../data/anslag/cupAnslag'
import type { LeagueAnslagKey } from '../data/anslag/leagueAnslag'
import { LEAGUE_ANSLAG } from '../data/anslag/leagueAnslag'

export type AnslagKey = CupAnslagKey | LeagueAnslagKey

// ── Variant picker ────────────────────────────────────────────────

function hashString(s: string): number {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i)
    hash |= 0
  }
  return hash >>> 0
}

export function pickAnslagVariant(
  text: AnslagText,
  season: number,
  anslagKey: AnslagKey,
  clubId: string,
): string {
  const candidates = text.variants
  if (candidates.length === 0) throw new Error(`No variants for anslag ${anslagKey}`)
  if (candidates.length === 1) return candidates[0].body

  const seed = hashString(`${season}_${anslagKey}_${clubId}`)
  const rand = mulberry32(seed)

  const totalWeight = candidates.reduce((sum, v) => sum + (v.weight ?? 1), 0)
  let r = rand() * totalWeight
  for (const variant of candidates) {
    r -= variant.weight ?? 1
    if (r < 0) return variant.body
  }
  return candidates[candidates.length - 1].body
}

export function getAnslagData(key: AnslagKey): AnslagText {
  if (key in CUP_ANSLAG) return CUP_ANSLAG[key as CupAnslagKey]
  if (key in LEAGUE_ANSLAG) return LEAGUE_ANSLAG[key as LeagueAnslagKey]
  throw new Error(`Unknown anslag key: ${key}`)
}

// ── Cup helpers ───────────────────────────────────────────────────

export function isClubDirektkvalad(bracket: CupBracket, clubId: string): boolean {
  return bracket.byeTeamIds?.includes(clubId) ?? false
}

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

// ── League helpers ────────────────────────────────────────────────

function cupIsDone(game: SaveGame): boolean {
  return game.cupBracket?.completed === true
}

function leagueHasStarted(game: SaveGame): boolean {
  return game.fixtures.some(f => f.status === 'completed' && !f.isCup)
}

// Returns highest completed league roundNumber, or 0 if none played.
export function currentLeagueRound(game: SaveGame): number {
  const rounds = game.fixtures
    .filter(f => f.status === 'completed' && !f.isCup)
    .map(f => f.roundNumber)
  if (rounds.length === 0) return 0
  return Math.max(...rounds)
}

function leagueComplete(game: SaveGame): boolean {
  const id = game.managedClubId
  const count = game.fixtures.filter(
    f => f.status === 'completed' && !f.isCup &&
      (f.homeClubId === id || f.awayClubId === id)
  ).length
  return count >= 22
}

function managedClubInPlayoffs(game: SaveGame): boolean {
  if (!game.playoffBracket) return false
  const id = game.managedClubId
  const allSeries = [
    ...game.playoffBracket.quarterFinals,
    ...game.playoffBracket.semiFinals,
    ...(game.playoffBracket.final ? [game.playoffBracket.final] : []),
  ]
  return allSeries.some(s => s.homeClubId === id || s.awayClubId === id)
}

function firstPlayoffMatchUpcoming(game: SaveGame): boolean {
  if (!game.playoffBracket) return false
  const id = game.managedClubId
  return game.fixtures.some(
    f => f.status === 'scheduled' && !f.isCup &&
      f.matchday > 26 &&
      (f.homeClubId === id || f.awayClubId === id)
  )
}

function managedClubLastSeasonMatchCompleted(game: SaveGame): boolean {
  const id = game.managedClubId
  const hasAnyCompleted = game.fixtures.some(
    f => f.status === 'completed' && (f.homeClubId === id || f.awayClubId === id)
  )
  const hasAnyScheduled = game.fixtures.some(
    f => f.status === 'scheduled' && (f.homeClubId === id || f.awayClubId === id)
  )
  return hasAnyCompleted && !hasAnyScheduled
}

// ── Main service ──────────────────────────────────────────────────

export function computeNextAnslag(game: SaveGame): AnslagKey | null {
  const seen = game.seenAnslag ?? []
  const club = game.managedClubId
  const bracket = game.cupBracket

  // ── Cup priority ──────────────────────────────────────────────
  if (bracket) {
    // Anslaget — before first cup match
    if (game.currentMatchday >= 1 && !seen.includes('cup_start')) {
      return 'cup_start'
    }

    // After quarterfinals complete (round 2)
    if (allRoundComplete(bracket, 2)) {
      const status = getManagedClubCupStatus(bracket, club)

      // Pokalen for eliminated in round 1 or 2 — takes precedence
      if (status.eliminated && (status.eliminatedInRound ?? 0) <= 2
          && !seen.includes('cup_done') && !seen.includes('cup_done_winner')) {
        return 'cup_done'
      }

      // Helgen — qualified to semifinal (round 3)
      const inSemi = bracket.matches.some(
        m => m.round === 3 && (m.homeClubId === club || m.awayClubId === club)
      )
      if (inSemi && !seen.includes('cup_finalweekend_pre')) {
        return 'cup_finalweekend_pre'
      }

      // Snålvinden — not eliminated in round 1, but eliminated in round 2
      if (status.eliminated && status.eliminatedInRound === 2 && !seen.includes('cup_between')) {
        return 'cup_between'
      }
    }

    // Cupfinalen — managed club i final (round 4), semifinal spelad
    const hasFinalUpcoming = game.fixtures.some(
      f => f.isCup && f.roundNumber >= 4 &&
        f.season === game.currentSeason &&
        f.status === 'scheduled' &&
        (f.homeClubId === club || f.awayClubId === club)
    )
    const semiCompleted = game.fixtures.some(
      f => f.isCup && f.roundNumber === 3 &&
        f.season === game.currentSeason &&
        f.status === 'completed' &&
        (f.homeClubId === club || f.awayClubId === club)
    )
    if (hasFinalUpcoming && semiCompleted && !seen.includes('cup_final_pre')) {
      return 'cup_final_pre'
    }

    // Pokalen — after managed club's last cup match (semi/final scenarios)
    if (managedClubLastCupMatchCompleted(bracket, club)
        && !seen.includes('cup_done') && !seen.includes('cup_done_winner')) {
      return bracket.winnerId === club ? 'cup_done_winner' : 'cup_done'
    }
  }

  // ── League priority ───────────────────────────────────────────

  // league_start — cup done, league not yet started
  if (cupIsDone(game) && !leagueHasStarted(game) && !seen.includes('league_start')) {
    return 'league_start'
  }

  if (leagueHasStarted(game)) {
    const round = currentLeagueRound(game)

    // Halvvägs — exact round 11 (more specific than midwinter spann, takes priority)
    if (round === 11 && !seen.includes('league_halfway')) {
      return 'league_halfway'
    }

    // Midwinter — round 7-9
    if (round >= 7 && round <= 9 && !seen.includes('league_midwinter')) {
      return 'league_midwinter'
    }

    // Marginaler — last 3 rounds
    if (round >= 19 && !leagueComplete(game) && !seen.includes('playoff_qualification')) {
      return 'playoff_qualification'
    }
  }

  // Slutspelet — managed club in playoffs, first match upcoming
  if (managedClubInPlayoffs(game) && firstPlayoffMatchUpcoming(game) && !seen.includes('playoff_start')) {
    return 'playoff_start'
  }

  // Sommaren kommer — last match played, nothing left
  if (managedClubLastSeasonMatchCompleted(game) && !seen.includes('season_done')) {
    return 'season_done'
  }

  return null
}
