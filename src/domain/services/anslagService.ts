import type { SaveGame } from '../entities/SaveGame'
import type { CupBracket } from '../entities/Cup'
import { getManagedClubCupStatus } from './cupService'
import { mulberry32 } from '../utils/random'
import type { AnslagText } from '../data/anslag/types'
import type { CupAnslagKey } from '../data/anslag/cupAnslag'
import { CUP_ANSLAG } from '../data/anslag/cupAnslag'
import type { LeagueAnslagKey } from '../data/anslag/leagueAnslag'
import { LEAGUE_ANSLAG } from '../data/anslag/leagueAnslag'
import type { PlayoffAnslagKey } from '../data/anslag/playoffAnslag'
import { PLAYOFF_ANSLAG } from '../data/anslag/playoffAnslag'
import { FixtureStatus, PlayoffRound } from '../enums'
import { getSeasonEndPhase } from '../data/seasonEndPhase'

export type AnslagKey = CupAnslagKey | LeagueAnslagKey | PlayoffAnslagKey

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
  if (key in PLAYOFF_ANSLAG) return PLAYOFF_ANSLAG[key as PlayoffAnslagKey]
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

// ── Main service ──────────────────────────────────────────────────

export function computeNextAnslag(game: SaveGame): AnslagKey | null {
  const seen = game.seenAnslag ?? []
  const club = game.managedClubId
  const bracket = game.cupBracket

  // ── Cup priority ──────────────────────────────────────────────
  if (bracket) {
    // Anslaget — before first cup match has been played
    const noCupPlayed = !game.fixtures.some(
      f => f.isCup && f.status === FixtureStatus.Completed && f.season === game.currentSeason
    )
    if (game.currentMatchday >= 1 && noCupPlayed && !seen.includes('cup_start')) {
      return 'cup_start'
    }

    // cup_first_match — after cup_start, before managed clubs faktiska första cupmatch.
    // M66e (textaudit 2026-07-05): gaten krävde tidigare alltid roundNumber===1,
    // så direktkvalade klubbar (bye till kvarten, isClubDirektkvalad) fick
    // aldrig anslaget — cup_first_match-textens generalisering till "första
    // matchen" (cupAnslag.ts) var därmed onåbar för dem trots att texten redan
    // var skriven för att bära scenariot.
    if (seen.includes('cup_start') && !seen.includes('cup_first_match')) {
      const firstRoundForClub = isClubDirektkvalad(bracket, club) ? 2 : 1
      const hasScheduledFirstMatch = game.fixtures.some(
        f =>
          f.isCup &&
          f.roundNumber === firstRoundForClub &&
          f.season === game.currentSeason &&
          f.status === FixtureStatus.Scheduled &&
          (f.homeClubId === club || f.awayClubId === club)
      )
      if (hasScheduledFirstMatch) {
        return 'cup_first_match'
      }
    }

    // After quarterfinals complete (round 2)
    if (allRoundComplete(bracket, 2)) {
      const status = getManagedClubCupStatus(bracket, club)

      // Pokalen — eliminated i runda 1 (tidig utslag)
      if (status.eliminated && status.eliminatedInRound === 1
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

      // Snålvinden — cupen pågår och vi väntar på nästa runda
      // Triggas INTE när managed är eliminerad (cup_done hanterar det)
      // Triggas INTE när managed gått vidare till semi/final (cup_finalweekend_pre hanterar det)
      const hasAdvancedToSemiOrLater = bracket.matches.some(
        m => m.round >= 3 && (m.homeClubId === club || m.awayClubId === club)
      )
      if (!status.eliminated && !hasAdvancedToSemiOrLater && !seen.includes('cup_between')) {
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
    if (round === 11 && !seen.includes('league_halfway') && getSeasonEndPhase(game) === 'regular_active') {
      return 'league_halfway'
    }

    // Midwinter — after Annandagen (Dec 26) has been played
    const annandagenPlayed = game.fixtures.some(
      f => f.isAnnandagen === true && f.status === FixtureStatus.Completed
    )
    if (annandagenPlayed && !seen.includes('league_midwinter')) {
      return 'league_midwinter'
    }

    // Marginaler — last 3 rounds
    if (round >= 19 && !leagueComplete(game) && !seen.includes('playoff_qualification')) {
      return 'playoff_qualification'
    }
  }

  // Grundserien klar — all 22 rounds done, playoff bracket not yet created
  if (getSeasonEndPhase(game) === 'regular_done' && !seen.includes('regular_done')) {
    return 'regular_done'
  }

  // Slutspelet — managed club in playoffs, first match upcoming
  if (managedClubInPlayoffs(game) && firstPlayoffMatchUpcoming(game) && !seen.includes('playoff_start')) {
    return 'playoff_start'
  }

  // Playoff-eliminationsanslag — managed eliminerades, visa direkt efter seriebeslutet
  if (game.playoffBracket) {
    const allSeries = [
      ...game.playoffBracket.quarterFinals,
      ...game.playoffBracket.semiFinals,
      ...(game.playoffBracket.final ? [game.playoffBracket.final] : []),
    ]
    const eliminatingSeries = allSeries.find(s =>
      s.loserId === game.managedClubId && s.winnerId !== null
    )
    if (eliminatingSeries) {
      const key: PlayoffAnslagKey =
        eliminatingSeries.round === PlayoffRound.QuarterFinal ? 'playoff_eliminated_kf' :
        eliminatingSeries.round === PlayoffRound.SemiFinal ? 'playoff_eliminated_sf' :
        'playoff_eliminated_smf'
      if (!seen.includes(key)) return key
    }
  }

  // Sommaren kommer — bracket complete, hela säsongen spelad
  if (getSeasonEndPhase(game) === 'season_done' && !seen.includes('season_done')) {
    return 'season_done'
  }

  return null
}
