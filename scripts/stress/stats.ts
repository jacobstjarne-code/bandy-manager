/**
 * MatchStat extraction for stress-test season logging.
 */

import type { Fixture } from '../../src/domain/entities/Fixture'
import type { SaveGame } from '../../src/domain/entities/SaveGame'
import { MatchEventType, FixtureStatus } from '../../src/domain/enums'

export interface MatchStat {
  seed: number
  season: number
  round: number
  phase: 'regular' | 'cup' | 'playoff_qf' | 'playoff_sf' | 'playoff_final'
  homeClubId: string
  awayClubId: string
  homeScore: number
  awayScore: number
  halfTimeHome: number
  halfTimeAway: number
  goals: Array<{
    minute: number
    team: 'home' | 'away'
    isCornerGoal: boolean
    isPenaltyGoal: boolean
  }>
  suspensions: Array<{
    minute: number
    team: 'home' | 'away'
  }>
  cornersHome: number
  cornersAway: number
  shotsHome: number
  shotsAway: number
  attendance: number
  weather?: string
}

export interface SeasonStats {
  seed: number
  season: number
  matches: MatchStat[]
}

function getPhase(fix: Fixture): MatchStat['phase'] {
  if (fix.isCup) return 'cup'
  if (fix.matchday > 26) {
    if (fix.matchday <= 31) return 'playoff_qf'
    if (fix.matchday <= 36) return 'playoff_sf'
    return 'playoff_final'
  }
  return 'regular'
}

export function extractMatchStat(fix: Fixture, game: SaveGame, seed: number, season: number): MatchStat {
  // Build a set of minutes where a Penalty event fired per club (to identify penalty goals)
  const penaltyMinutes = new Map<string, Set<number>>()
  for (const ev of fix.events) {
    if (ev.type === MatchEventType.Penalty) {
      if (!penaltyMinutes.has(ev.clubId)) penaltyMinutes.set(ev.clubId, new Set())
      penaltyMinutes.get(ev.clubId)!.add(ev.minute)
    }
  }

  const goals: MatchStat['goals'] = []
  const suspensions: MatchStat['suspensions'] = []
  let htHome = 0
  let htAway = 0
  let cornersHome = 0
  let cornersAway = 0
  let shotsHome = 0
  let shotsAway = 0

  for (const ev of fix.events) {
    const isHome = ev.clubId === fix.homeClubId
    const team: 'home' | 'away' = isHome ? 'home' : 'away'

    if (ev.type === MatchEventType.Goal) {
      const isPenaltyGoal = penaltyMinutes.get(ev.clubId)?.has(ev.minute) ?? false
      goals.push({
        minute: ev.minute,
        team,
        isCornerGoal: ev.isCornerGoal ?? false,
        isPenaltyGoal,
      })
      if (ev.minute < 45) {
        if (isHome) htHome++
        else htAway++
      }
    } else if (ev.type === MatchEventType.Suspension) {
      suspensions.push({ minute: ev.minute, team })
    } else if (ev.type === MatchEventType.Corner) {
      if (isHome) cornersHome++
      else cornersAway++
    } else if (ev.type === MatchEventType.Shot) {
      if (isHome) shotsHome++
      else shotsAway++
    }
  }

  // Use report values for corners/shots if available (more accurate than event counting)
  if (fix.report) {
    cornersHome = fix.report.cornersHome
    cornersAway = fix.report.cornersAway
    shotsHome = fix.report.shotsHome
    shotsAway = fix.report.shotsAway
  }

  const weather = game.matchWeathers?.find(w =>
    'fixtureId' in w && (w as unknown as { fixtureId: string }).fixtureId === fix.id
  )

  return {
    seed,
    season,
    round: fix.roundNumber,
    phase: getPhase(fix),
    homeClubId: fix.homeClubId,
    awayClubId: fix.awayClubId,
    homeScore: fix.homeScore,
    awayScore: fix.awayScore,
    halfTimeHome: htHome,
    halfTimeAway: htAway,
    goals,
    suspensions,
    cornersHome,
    cornersAway,
    shotsHome,
    shotsAway,
    attendance: fix.attendance ?? 0,
    weather: weather ? String((weather as unknown as Record<string, unknown>).condition ?? '') : undefined,
  }
}

export function newSeasonStats(seed: number, season: number): SeasonStats {
  return { seed, season, matches: [] }
}
