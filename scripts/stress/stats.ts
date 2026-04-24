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
  onTargetHome: number
  onTargetAway: number
  savesHome: number
  savesAway: number
  attendance: number
  weather?: string
  matchProfile?: string
}

export interface EconSnapshot {
  round: number
  finances: number  // managed club finances after this round
  puls: number      // communityStanding after this round
  leaguePosition: number
}

export interface SeasonStats {
  seed: number
  season: number
  clubId: string
  clubRep: number
  matches: MatchStat[]
  econSnapshots: EconSnapshot[]
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
  // Penalty events are stripped from fix.events by roundProcessor to save memory.
  // Use the isPenaltyGoal flag set directly on Goal events instead.

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
      goals.push({
        minute: ev.minute,
        team,
        isCornerGoal: ev.isCornerGoal ?? false,
        isPenaltyGoal: ev.isPenaltyGoal ?? false,
      })
      if (ev.minute < 45) {
        if (isHome) htHome++
        else htAway++
      }
    } else if (ev.type === MatchEventType.RedCard) {
      // Bandy uses 10-min suspensions (MatchEventType.RedCard in matchCore.ts)
      suspensions.push({ minute: ev.minute, team })
    } else if (ev.type === MatchEventType.Corner) {
      if (isHome) cornersHome++
      else cornersAway++
    } else if (ev.type === MatchEventType.Shot) {
      if (isHome) shotsHome++
      else shotsAway++
    }
  }

  // Use report values for corners/shots/onTarget/saves if available (more accurate than event counting)
  let onTargetHome = 0
  let onTargetAway = 0
  let savesHome = 0
  let savesAway = 0
  if (fix.report) {
    cornersHome = fix.report.cornersHome
    cornersAway = fix.report.cornersAway
    shotsHome = fix.report.shotsHome
    shotsAway = fix.report.shotsAway
    onTargetHome = fix.report.onTargetHome
    onTargetAway = fix.report.onTargetAway
    savesHome = fix.report.savesHome
    savesAway = fix.report.savesAway
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
    onTargetHome,
    onTargetAway,
    savesHome,
    savesAway,
    attendance: fix.attendance ?? 0,
    weather: weather ? String((weather as unknown as Record<string, unknown>).condition ?? '') : undefined,
    matchProfile: fix.report?.matchProfile,
  }
}

export function newSeasonStats(seed: number, season: number, clubId: string, clubRep: number): SeasonStats {
  return { seed, season, clubId, clubRep, matches: [], econSnapshots: [] }
}

export function extractEconSnapshot(
  game: SaveGame,
  round: number,
  standings: Array<{ clubId: string; position: number }>,
): EconSnapshot {
  const finances = game.clubs.find(c => c.id === game.managedClubId)?.finances ?? 0
  const puls = game.communityStanding ?? 50
  const leaguePosition = standings.find(s => s.clubId === game.managedClubId)?.position ?? 6
  return { round, finances, puls, leaguePosition }
}
