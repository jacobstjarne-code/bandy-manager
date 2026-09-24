import { describe, it, expect } from 'vitest'
import { resolveAIPenaltyKeeperDive, resolveAIPenaltyShot, resolvePenalty } from '../penaltyInteractionService'
import type { PenaltyDirection, PenaltyHeight } from '../penaltyInteractionService'
import { simulateMatch } from '../matchSimulator'
import { PlayerPosition, PlayerArchetype, FixtureStatus, MatchEventType } from '../../enums'
import type { Player } from '../../entities/Player'
import type { Fixture, TeamSelection } from '../../entities/Fixture'
import type { Tactic } from '../../entities/Club'

/**
 * CODE-ORDER B2 STRAFFKALIBRERING (2026-09-24) — permanenta tester, punkt 6.
 * Sanningskälla för konvertering/andel: docs/data/SCORELINE_REFERENCE.md §1.3
 * (70% konvertering, 5.4% av alla mål). Fullständig före/efter-mätning i
 * docs/BETATEST_B2_STRAFFKALIBRERING_2026-09-24.md.
 */

function mulberry32(seed: number) {
  let a = seed
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const DIRS: PenaltyDirection[] = ['left', 'center', 'right']
const HEIGHTS: PenaltyHeight[] = ['low', 'high']

function penData(shooterSkill: number, keeperSkill: number) {
  return { minute: 45, shooterName: 'X', shooterId: 'x', shooterSkill, keeperName: 'Y', keeperSkill }
}

function goalRate(
  shooterSkill: number, keeperSkill: number, dir: PenaltyDirection, height: PenaltyHeight,
  keeperDive: PenaltyDirection, seed: number, n = 5000,
): number {
  const rand = mulberry32(seed)
  let goals = 0
  for (let i = 0; i < n; i++) {
    if (resolvePenalty(penData(shooterSkill, keeperSkill), dir, height, keeperDive, rand).type === 'goal') goals++
  }
  return goals / n
}

describe('resolvePenalty — B2: rimlig total konvertering', () => {
  it('sannolikhetsviktat snitt över en realistisk skytt/mv/riktning/höjd-mix ligger nära 70%', () => {
    const rand = mulberry32(1)
    const N = 30_000
    let goals = 0
    for (let i = 0; i < N; i++) {
      const shooterSkill = 40 + Math.floor(rand() * 41)
      const keeperSkill = 40 + Math.floor(rand() * 41)
      const mentality = rand() < 0.5 ? 'offensive' : 'defensive'
      const keeperDive = resolveAIPenaltyKeeperDive(mentality, rand)
      const { dir, height } = resolveAIPenaltyShot(rand)
      const outcome = resolvePenalty(penData(shooterSkill, keeperSkill), dir, height, keeperDive, rand)
      if (outcome.type === 'goal') goals++
    }
    const pct = goals / N
    // Brett band (60–80%) runt sanningskällans 70% — testet ska fånga en
    // framtida drift, inte flaka på normalt slumpbrus. Se rapporten för den
    // exakta punktmätningen (69,8–70,7% över flera oberoende körningar).
    expect(pct).toBeGreaterThan(0.60)
    expect(pct).toBeLessThan(0.80)
  })
})

describe('resolvePenalty — B2: monotont kvalitetsutfall', () => {
  it('bättre målvakt (fast skytt, fast riktning/höjd) ger strikt färre mål', () => {
    const lo = goalRate(60, 35, 'left', 'low', 'left', 10)
    const mid = goalRate(60, 60, 'left', 'low', 'left', 11)
    const hi = goalRate(60, 85, 'left', 'low', 'left', 12)
    expect(lo).toBeGreaterThan(mid)
    expect(mid).toBeGreaterThan(hi)
  })

  it('bättre skytt (fast målvakt, fast riktning/höjd) ger strikt fler mål', () => {
    const lo = goalRate(35, 60, 'right', 'high', 'left', 20)
    const mid = goalRate(60, 60, 'right', 'high', 'left', 21)
    const hi = goalRate(85, 60, 'right', 'high', 'left', 22)
    expect(lo).toBeLessThan(mid)
    expect(mid).toBeLessThan(hi)
  })

  it('kvalitetstermen kan inte skrivas över av height==="high" eller dir==="center" — samma skillnad syns i alla fyra grenar', () => {
    // Detta var den faktiska B2-rotorsaken: goalChance = ... (omskrivning,
    // inte +=) i height/center-grenarna kastade bort skillterm redan satt.
    // Testet kör alla fyra kombinationer explicit och kräver att den SVAGA
    // målvakten (35) ger fler mål än den STARKA (85) i VARJE gren.
    for (const dir of DIRS) {
      for (const height of HEIGHTS) {
        const weakKeeper = goalRate(60, 35, dir, height, dir, 30 + DIRS.indexOf(dir) * 2 + HEIGHTS.indexOf(height))
        const strongKeeper = goalRate(60, 85, dir, height, dir, 40 + DIRS.indexOf(dir) * 2 + HEIGHTS.indexOf(height))
        expect(weakKeeper, `dir=${dir} height=${height}: svag MV borde ge fler mål än stark MV`).toBeGreaterThan(strongKeeper)
      }
    }
  })
})

describe('resolvePenalty — B2: samtliga riktning/höjd-kombinationer, ingen dold nitlott', () => {
  it.each(
    DIRS.flatMap(dir => HEIGHTS.map(height => [dir, height] as const)),
  )('dir=%s height=%s ger en meningsfull målchans (varken nära 0%% eller nära 100%%)', (dir, height) => {
    // Jämn skytt/mv (60/60), keeperDive slumpad — samma uppställning som
    // rapportens riktning/höjd-tabell. Bandet (35–90%) är brett med flit:
    // poängen är att INGEN kombination är en nitlott (< 20%) eller en
    // garanti (> 95%), inte att fastna vid exakta procenttal.
    const rand = mulberry32(50 + DIRS.indexOf(dir) * 10 + HEIGHTS.indexOf(height))
    const N = 8000
    let goals = 0
    for (let i = 0; i < N; i++) {
      const mentality = i % 2 === 0 ? 'offensive' : 'defensive'
      const keeperDive = resolveAIPenaltyKeeperDive(mentality, rand)
      if (resolvePenalty(penData(60, 60), dir, height, keeperDive, rand).type === 'goal') goals++
    }
    const pct = goals / N
    expect(pct).toBeGreaterThan(0.35)
    expect(pct).toBeLessThan(0.90)
  })
})

describe('resolveAIPenaltyShot — B2: avsedd valfördelning, en rand()-roll', () => {
  it('riktning: ~1/3 vardera (inte den gamla 40/42/18-snedheten)', () => {
    const rand = mulberry32(77)
    const N = 60_000
    const counts: Record<PenaltyDirection, number> = { left: 0, right: 0, center: 0 }
    for (let i = 0; i < N; i++) counts[resolveAIPenaltyShot(rand).dir]++
    for (const dir of DIRS) {
      const share = counts[dir] / N
      expect(share, `${dir}: ${share}`).toBeGreaterThan(0.30)
      expect(share, `${dir}: ${share}`).toBeLessThan(0.37)
    }
  })

  it('höjd: ~65/35 lågt/högt', () => {
    const rand = mulberry32(78)
    const N = 60_000
    let low = 0
    for (let i = 0; i < N; i++) if (resolveAIPenaltyShot(rand).height === 'low') low++
    const share = low / N
    expect(share).toBeGreaterThan(0.62)
    expect(share).toBeLessThan(0.68)
  })

  it('rullar rand() exakt två gånger per anrop (ett för riktning, ett för höjd) — determinism, inte den gamla variabla konsumtionen', () => {
    let calls = 0
    const countingRand = () => { calls++; return 0.5 }
    resolveAIPenaltyShot(countingRand)
    expect(calls).toBe(2)
  })
})

// ── Integrationstest: fullständig matchmotor, deterministiskt prov ─────────

const NEUTRAL_TACTIC: Tactic = {
  mentality: 'balanced' as never, tempo: 'normal' as never, press: 'medium' as never,
  passingRisk: 'mixed' as never, width: 'normal' as never, attackingFocus: 'mixed' as never,
  cornerStrategy: 'standard' as never, penaltyKillStyle: 'active' as never, formation: '532_tvatoppar' as never,
}

function makePlayer(id: string, position: PlayerPosition, clubId: string, ca = 55): Player {
  const isGK = position === PlayerPosition.Goalkeeper
  return {
    id, firstName: 'X', lastName: id, age: 26, nationality: 'SWE', clubId,
    academyClubId: undefined, isHomegrown: false, position,
    archetype: isGK ? PlayerArchetype.ReflexGoalkeeper : PlayerArchetype.TwoWaySkater,
    salary: 0, contractUntilSeason: 2, marketValue: 0,
    morale: 70, form: 70, fitness: 85, sharpness: 75, seasonForm: 70, isFullTimePro: false,
    currentAbility: ca, potentialAbility: ca, developmentRate: 50, injuryProneness: 50, discipline: 70,
    attributes: {
      skating: ca, acceleration: ca, stamina: ca, ballControl: ca, passing: ca, shooting: ca,
      dribbling: ca, vision: ca, decisions: ca, workRate: ca, positioning: ca, defending: ca,
      cornerSkill: ca, goalkeeping: isGK ? ca + 20 : 20, cornerRecovery: ca,
    },
    isInjured: false, injuryDaysRemaining: 0, suspensionGamesRemaining: 0,
    seasonStats: { gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0 },
    careerStats: { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 0 },
  } as unknown as Player
}

function makeSquad(clubId: string, ca = 55): Player[] {
  return [
    makePlayer(`${clubId}_gk`, PlayerPosition.Goalkeeper, clubId, ca),
    makePlayer(`${clubId}_d1`, PlayerPosition.Defender, clubId, ca),
    makePlayer(`${clubId}_d2`, PlayerPosition.Defender, clubId, ca),
    makePlayer(`${clubId}_d3`, PlayerPosition.Defender, clubId, ca),
    makePlayer(`${clubId}_h1`, PlayerPosition.Half, clubId, ca),
    makePlayer(`${clubId}_h2`, PlayerPosition.Half, clubId, ca),
    makePlayer(`${clubId}_h3`, PlayerPosition.Half, clubId, ca),
    makePlayer(`${clubId}_f1`, PlayerPosition.Forward, clubId, ca),
    makePlayer(`${clubId}_f2`, PlayerPosition.Forward, clubId, ca),
    makePlayer(`${clubId}_f3`, PlayerPosition.Forward, clubId, ca),
    makePlayer(`${clubId}_f4`, PlayerPosition.Forward, clubId, ca),
  ]
}

function makeSelection(players: Player[]): TeamSelection {
  return { startingPlayerIds: players.map(p => p.id), benchPlayerIds: [], tactic: NEUTRAL_TACTIC }
}

describe('matchCore/matchEngine — B2: straffrekvens och andel straffmål i ett större deterministiskt matchprov', () => {
  it('penaltyGoalPct (straffmål / alla mål) ligger nära 5,4% över 600 matcher', () => {
    let totalGoals = 0
    let penaltyGoals = 0
    for (let i = 0; i < 600; i++) {
      const homeCa = 45 + (i % 40)
      const awayCa = 45 + ((i * 7) % 40)
      const homePlayers = makeSquad('home', homeCa)
      const awayPlayers = makeSquad('away', awayCa)
      const fixture: Fixture = {
        id: `fx${i}`, leagueId: 'test', season: 1, matchday: i + 1, roundNumber: i + 1,
        homeClubId: 'home', awayClubId: 'away', status: FixtureStatus.Scheduled, date: '2025-01-01',
        homeScore: 0, awayScore: 0, events: [], attendance: 500,
        isCup: false, isKnockout: false, isNeutralVenue: false,
      }
      const result = simulateMatch({
        fixture,
        homeLineup: makeSelection(homePlayers), awayLineup: makeSelection(awayPlayers),
        homePlayers, awayPlayers, homeAdvantage: 0.14, seed: i * 1337,
      })
      const f = result.fixture
      totalGoals += (f.homeScore ?? 0) + (f.awayScore ?? 0)
      penaltyGoals += f.events.filter(e => e.type === MatchEventType.Goal && e.isPenaltyGoal).length
    }
    const pct = penaltyGoals / totalGoals
    // Brett band av samma skäl som konverteringstestet ovan — se rapporten
    // för punktmätningen (5,51–5,54% över 3000–8000 matcher).
    expect(pct).toBeGreaterThan(0.03)
    expect(pct).toBeLessThan(0.08)
  })
})
