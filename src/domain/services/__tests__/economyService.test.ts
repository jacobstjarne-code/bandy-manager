import { describe, it, expect } from 'vitest'
import {
  applyFinanceChange,
  appendFinanceLog,
  calcRoundIncome,
  calcAttendance,
  computeAttendanceRate,
  computeContractMinSalary,
  computeLeaguePositionAverages,
  MIN_LEAGUE_GAMES_FOR_PERFORMANCE_FACTOR,
  FINANCE_LOG_MAX,
} from '../economyService'
import type { FinanceEntry, LeaguePositionAverage } from '../economyService'
import type { Club } from '../../entities/Club'
import type { Player, PlayerSeasonStats } from '../../entities/Player'
import type { Sponsor, CommunityActivities, StandingRow, SaveGame } from '../../entities/SaveGame'
import { PlayerPosition, TacticMentality, TacticTempo, TacticPress, TacticPassingRisk, TacticWidth, TacticAttackingFocus, CornerStrategy, PenaltyKillStyle, ClubExpectation, ClubStyle } from '../../enums'

// ── Test helpers ──────────────────────────────────────────────────────────────

function makeClub(overrides: Partial<Club> = {}): Club {
  return {
    id: 'club_test',
    name: 'Testklubb',
    shortName: 'TEST',
    region: 'Mälardalen',
    reputation: 60,
    finances: 500000,
    wageBudget: 200000,
    transferBudget: 100000,
    youthQuality: 50,
    youthRecruitment: 50,
    youthDevelopment: 50,
    facilities: 50,
    boardExpectation: ClubExpectation.MidTable,
    fanExpectation: ClubExpectation.MidTable,
    preferredStyle: ClubStyle.Balanced,
    hasArtificialIce: false,
    arenaCapacity: 2000,
    activeTactic: {
      mentality: TacticMentality.Balanced,
      tempo: TacticTempo.Normal,
      press: TacticPress.Medium,
      passingRisk: TacticPassingRisk.Safe,
      width: TacticWidth.Normal,
      attackingFocus: TacticAttackingFocus.Center,
      cornerStrategy: CornerStrategy.Short,
      penaltyKillStyle: PenaltyKillStyle.Passive,
    },
    squadPlayerIds: [],
    ...overrides,
  }
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1',
    firstName: 'Test',
    lastName: 'Spelare',
    clubId: 'club_test',
    position: PlayerPosition.Forward,
    currentAbility: 60,
    potentialAbility: 70,
    age: 25,
    salary: 20000,
    contractEnds: 2026,
    isInjured: false,
    injuryDaysRemaining: 0,
    injuryProneness: 50,
    suspensionGamesRemaining: 0,
    gamesPlayed: 0,
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    minutesPlayed: 0,
    marketValue: 100000,
    shirtNumber: null,
    nationality: 'SWE',
    isRetired: false,
    ...overrides,
  }
}

function makeSponsor(overrides: Partial<Sponsor> = {}): Sponsor {
  return {
    id: 's1',
    name: 'TestSponsor',
    category: 'Sport',
    weeklyIncome: 5000,
    contractRounds: 10,
    signedRound: 1,
    ...overrides,
  }
}

function makeStanding(overrides: Partial<StandingRow> = {}): StandingRow {
  return {
    clubId: 'club_test',
    played: 5,
    wins: 3,
    draws: 1,
    losses: 1,
    goalsFor: 10,
    goalsAgainst: 6,
    goalDifference: 4,
    points: 10,
    position: 4,
    ...overrides,
  }
}

const deterministicRand = () => 0.5  // mid-point, no randomness

// ── Group 1: applyFinanceChange ───────────────────────────────────────────────

describe('applyFinanceChange', () => {
  it('adds positive amount to the correct club', () => {
    const clubs = [makeClub({ id: 'a', finances: 100000 }), makeClub({ id: 'b', finances: 200000 })]
    const result = applyFinanceChange(clubs, 'a', 50000)
    expect(result.find(c => c.id === 'a')!.finances).toBe(150000)
    expect(result.find(c => c.id === 'b')!.finances).toBe(200000)
  })

  it('subtracts negative amount correctly', () => {
    const clubs = [makeClub({ id: 'a', finances: 100000 })]
    const result = applyFinanceChange(clubs, 'a', -30000)
    expect(result[0].finances).toBe(70000)
  })

  it('allows finances to go negative', () => {
    const clubs = [makeClub({ id: 'a', finances: 10000 })]
    const result = applyFinanceChange(clubs, 'a', -50000)
    expect(result[0].finances).toBe(-40000)
  })

  it('does not affect clubs other than the target', () => {
    const clubs = [
      makeClub({ id: 'a', finances: 100000 }),
      makeClub({ id: 'b', finances: 200000 }),
      makeClub({ id: 'c', finances: 300000 }),
    ]
    const result = applyFinanceChange(clubs, 'b', 99999)
    expect(result.find(c => c.id === 'a')!.finances).toBe(100000)
    expect(result.find(c => c.id === 'c')!.finances).toBe(300000)
  })

  it('returns a new array, does not mutate the original', () => {
    const clubs = [makeClub({ id: 'a', finances: 100000 })]
    const result = applyFinanceChange(clubs, 'a', 1000)
    expect(result).not.toBe(clubs)
    expect(clubs[0].finances).toBe(100000)  // original unchanged
  })
})

// ── Group 2: appendFinanceLog ─────────────────────────────────────────────────

describe('appendFinanceLog', () => {
  function makeEntry(round: number): FinanceEntry {
    return { round, amount: 1000, reason: 'wages', label: 'Löner' }
  }

  it('appends an entry to an empty log', () => {
    const result = appendFinanceLog([], makeEntry(1))
    expect(result).toHaveLength(1)
    expect(result[0].round).toBe(1)
  })

  it('appends to existing log', () => {
    const log = [makeEntry(1), makeEntry(2)]
    const result = appendFinanceLog(log, makeEntry(3))
    expect(result).toHaveLength(3)
    expect(result[2].round).toBe(3)
  })

  it('does not exceed FINANCE_LOG_MAX entries', () => {
    let log: FinanceEntry[] = []
    for (let i = 0; i < FINANCE_LOG_MAX + 10; i++) {
      log = appendFinanceLog(log, makeEntry(i))
    }
    expect(log).toHaveLength(FINANCE_LOG_MAX)
  })

  it('keeps the most recent entries when capping', () => {
    let log: FinanceEntry[] = []
    for (let i = 0; i < FINANCE_LOG_MAX + 5; i++) {
      log = appendFinanceLog(log, makeEntry(i))
    }
    // First entry should be round 5 (oldest 5 dropped)
    expect(log[0].round).toBe(5)
    expect(log[log.length - 1].round).toBe(FINANCE_LOG_MAX + 4)
  })

  it('does not mutate the original log', () => {
    const log = [makeEntry(1)]
    appendFinanceLog(log, makeEntry(2))
    expect(log).toHaveLength(1)
  })
})

// ── Group 3: calcRoundIncome — wages and base income ─────────────────────────

describe('calcRoundIncome — wages and base income', () => {
  it('weeklyBase = 8000 (WEEKLY_BASE_FLAT, D033 karriärbana-fix 2026-08-29) + reputation × 50', () => {
    const club = makeClub({ reputation: 60 })
    const result = calcRoundIncome({
      club, players: [], sponsors: [], communityActivities: undefined,
      fanMood: 50, isHomeMatch: false, matchIsKnockout: false, matchIsCup: false,
      matchHasRivalry: false, standing: null, rand: deterministicRand,
    })
    expect(result.weeklyBase).toBe(8000 + 60 * 50)
  })

  it('weeklyWages = Math.round(totalSalary / 4)', () => {
    const players = [
      makePlayer({ salary: 20000 }),
      makePlayer({ id: 'p2', salary: 16000 }),
    ]
    const result = calcRoundIncome({
      club: makeClub(), players, sponsors: [], communityActivities: undefined,
      fanMood: 50, isHomeMatch: false, matchIsKnockout: false, matchIsCup: false,
      matchHasRivalry: false, standing: null, rand: deterministicRand,
    })
    expect(result.weeklyWages).toBe(Math.round(36000 / 4))
  })

  it('weeklyWages = 0 for empty squad', () => {
    const result = calcRoundIncome({
      club: makeClub(), players: [], sponsors: [], communityActivities: undefined,
      fanMood: 50, isHomeMatch: false, matchIsKnockout: false, matchIsCup: false,
      matchHasRivalry: false, standing: null, rand: deterministicRand,
    })
    expect(result.weeklyWages).toBe(0)
  })

  it('netPerRound = sum of incomes − wages − arena cost', () => {
    const players = [makePlayer({ salary: 20000 })]
    const result = calcRoundIncome({
      club: makeClub(), players, sponsors: [], communityActivities: undefined,
      fanMood: 50, isHomeMatch: false, matchIsKnockout: false, matchIsCup: false,
      matchHasRivalry: false, standing: null, rand: deterministicRand,
    })
    const expected = result.weeklyBase + result.sponsorIncome + result.matchRevenue
      + result.communityMatchIncome + result.communityRoundIncome - result.weeklyWages - result.weeklyArenaCost
    expect(result.netPerRound).toBe(expected)
  })
})

// O5 kraft 2 (Jacobs dom 2026-08-17, byggd 2026-08-23): anläggningsdrift,
// betalas en gång per säsong (isFirstRound), inte veckovis.
describe('calcRoundIncome — facilityUpkeep (O5 kraft 2)', () => {
  it('summerar builtFacilityUpkeepCosts vid isFirstRound', () => {
    const result = calcRoundIncome({
      club: makeClub(), players: [], sponsors: [], communityActivities: undefined,
      fanMood: 50, isHomeMatch: false, matchIsKnockout: false, matchIsCup: false,
      matchHasRivalry: false, standing: null, rand: deterministicRand,
      isFirstRound: true, builtFacilityUpkeepCosts: [10000, 6700, 20000],
    })
    expect(result.facilityUpkeep).toBe(36700)
  })

  it('0 om inte isFirstRound, även med byggda noder', () => {
    const result = calcRoundIncome({
      club: makeClub(), players: [], sponsors: [], communityActivities: undefined,
      fanMood: 50, isHomeMatch: false, matchIsKnockout: false, matchIsCup: false,
      matchHasRivalry: false, standing: null, rand: deterministicRand,
      isFirstRound: false, builtFacilityUpkeepCosts: [10000, 6700],
    })
    expect(result.facilityUpkeep).toBe(0)
  })

  it('0 om inga noder byggda', () => {
    const result = calcRoundIncome({
      club: makeClub(), players: [], sponsors: [], communityActivities: undefined,
      fanMood: 50, isHomeMatch: false, matchIsKnockout: false, matchIsCup: false,
      matchHasRivalry: false, standing: null, rand: deterministicRand,
      isFirstRound: true, builtFacilityUpkeepCosts: [],
    })
    expect(result.facilityUpkeep).toBe(0)
  })

  it('dras av i netPerRound', () => {
    const result = calcRoundIncome({
      club: makeClub(), players: [], sponsors: [], communityActivities: undefined,
      fanMood: 50, isHomeMatch: false, matchIsKnockout: false, matchIsCup: false,
      matchHasRivalry: false, standing: null, rand: deterministicRand,
      isFirstRound: true, builtFacilityUpkeepCosts: [10000],
    })
    const expected = result.weeklyBase + result.sponsorIncome + result.matchRevenue
      + result.communityMatchIncome + result.communityRoundIncome + result.volunteerIncome
      + result.kommunBidrag - result.weeklyWages - result.weeklyArenaCost - result.weeklyLegendCost - result.facilityUpkeep
    expect(result.netPerRound).toBe(expected)
    expect(result.facilityUpkeep).toBe(10000)
  })
})

// ── Group 4: calcRoundIncome — sponsors ───────────────────────────────────────

describe('calcRoundIncome — sponsors', () => {
  it('sponsorIncome = sum of active sponsors weeklyIncome', () => {
    const sponsors = [
      makeSponsor({ weeklyIncome: 5000, contractRounds: 10 }),
      makeSponsor({ id: 's2', weeklyIncome: 3000, contractRounds: 5 }),
    ]
    const result = calcRoundIncome({
      club: makeClub(), players: [], sponsors, communityActivities: undefined,
      fanMood: 50, isHomeMatch: false, matchIsKnockout: false, matchIsCup: false,
      matchHasRivalry: false, standing: null, rand: deterministicRand,
    })
    expect(result.sponsorIncome).toBe(8000)
  })

  it('expired sponsors (contractRounds = 0) are excluded', () => {
    const sponsors = [
      makeSponsor({ weeklyIncome: 5000, contractRounds: 0 }),
      makeSponsor({ id: 's2', weeklyIncome: 3000, contractRounds: 5 }),
    ]
    const result = calcRoundIncome({
      club: makeClub(), players: [], sponsors, communityActivities: undefined,
      fanMood: 50, isHomeMatch: false, matchIsKnockout: false, matchIsCup: false,
      matchHasRivalry: false, standing: null, rand: deterministicRand,
    })
    expect(result.sponsorIncome).toBe(3000)
  })

  it('sponsorIncome = 0 with no sponsors', () => {
    const result = calcRoundIncome({
      club: makeClub(), players: [], sponsors: [], communityActivities: undefined,
      fanMood: 50, isHomeMatch: false, matchIsKnockout: false, matchIsCup: false,
      matchHasRivalry: false, standing: null, rand: deterministicRand,
    })
    expect(result.sponsorIncome).toBe(0)
  })
})

// ── Group 5: calcRoundIncome — match revenue ──────────────────────────────────

describe('calcRoundIncome — match revenue', () => {
  it('matchRevenue > 0 for a home match', () => {
    const result = calcRoundIncome({
      club: makeClub(), players: [], sponsors: [], communityActivities: undefined,
      fanMood: 50, isHomeMatch: true, matchIsKnockout: false, matchIsCup: false,
      matchHasRivalry: false, standing: makeStanding({ position: 6 }), rand: deterministicRand,
    })
    expect(result.matchRevenue).toBeGreaterThan(0)
  })

  it('matchRevenue = 0 for an away match', () => {
    const result = calcRoundIncome({
      club: makeClub(), players: [], sponsors: [], communityActivities: undefined,
      fanMood: 50, isHomeMatch: false, matchIsKnockout: false, matchIsCup: false,
      matchHasRivalry: false, standing: makeStanding(), rand: deterministicRand,
    })
    expect(result.matchRevenue).toBe(0)
  })

  it('cup match gives higher matchRevenue than league match (same conditions)', () => {
    const base = {
      club: makeClub(), players: [], sponsors: [], communityActivities: undefined,
      fanMood: 50, isHomeMatch: true, matchIsKnockout: false,
      matchHasRivalry: false, standing: makeStanding({ position: 6 }), rand: deterministicRand,
    }
    const league = calcRoundIncome({ ...base, matchIsCup: false })
    const cup = calcRoundIncome({ ...base, matchIsCup: true })
    expect(cup.matchRevenue).toBeGreaterThan(league.matchRevenue)
  })

  it('knockout match gives higher matchRevenue than cup match', () => {
    const base = {
      club: makeClub(), players: [], sponsors: [], communityActivities: undefined,
      fanMood: 50, isHomeMatch: true, matchHasRivalry: false,
      standing: makeStanding({ position: 6 }), rand: deterministicRand,
    }
    const cup = calcRoundIncome({ ...base, matchIsCup: true, matchIsKnockout: false })
    const knockout = calcRoundIncome({ ...base, matchIsCup: false, matchIsKnockout: true })
    expect(knockout.matchRevenue).toBeGreaterThan(cup.matchRevenue)
  })

  it('derby match gives higher matchRevenue than non-derby', () => {
    const base = {
      club: makeClub(), players: [], sponsors: [], communityActivities: undefined,
      fanMood: 50, isHomeMatch: true, matchIsKnockout: false, matchIsCup: false,
      standing: makeStanding({ position: 6 }), rand: deterministicRand,
    }
    const normal = calcRoundIncome({ ...base, matchHasRivalry: false })
    const derby = calcRoundIncome({ ...base, matchHasRivalry: true })
    expect(derby.matchRevenue).toBeGreaterThan(normal.matchRevenue)
  })
})

// ── Group 5a: calcRoundIncome — formBonus, vidgat spann (knapp 2, DOM_AH2_ ──
// BASEKONOMI_INTAKT_2026-08-28). Gamla spannet var 1.15/1.05/0.88/1.0 (samma
// tre trösklar: topp-3, topp-6, botten-3). Vidgat efter mätning (D033) —
// dessa tester låser TROSKLARNAS ORDNING och riktning, inte de exakta
// magnituderna (de kan omkalibreras utan att testerna behöver röras, så
// länge hierarkin topp3 > topp6 > mitt > botten3 hålls).
describe('calcRoundIncome — formBonus, vidgat spann (knapp 2)', () => {
  function revenueAtPosition(position: number): number {
    return calcRoundIncome({
      club: makeClub(), players: [], sponsors: [], communityActivities: undefined,
      fanMood: 50, isHomeMatch: true, matchIsKnockout: false, matchIsCup: false,
      matchHasRivalry: false, standing: makeStanding({ position }), rand: deterministicRand,
    }).matchRevenue
  }

  it('hierarkin topp3 > topp6 > mitten > botten3 håller, i denna ordning', () => {
    const top3 = revenueAtPosition(2)
    const top6 = revenueAtPosition(5)
    const mid = revenueAtPosition(8)
    const bottom3 = revenueAtPosition(11)
    expect(top3).toBeGreaterThan(top6)
    expect(top6).toBeGreaterThan(mid)
    expect(mid).toBeGreaterThan(bottom3)
  })

  it('spannet är vidgat mot gamla 1.15/1.0-kvoten mellan topp3 och mitten', () => {
    const top3 = revenueAtPosition(2)
    const mid = revenueAtPosition(8)
    // Gamla formBonus gav topp3/mid = 1.15/1.0 = 1.15. Det nya spannet ska
    // vara STÖRRE än det (inte bara lika stort) — annars är "vidga" inte gjort.
    expect(top3 / mid).toBeGreaterThan(1.15)
  })

  it('spannet är vidgat mot gamla 1.0/0.88-kvoten mellan mitten och botten3', () => {
    const mid = revenueAtPosition(8)
    const bottom3 = revenueAtPosition(11)
    expect(mid / bottom3).toBeGreaterThan(1.0 / 0.88)
  })
})

// ── Group 5b: computeAttendanceRate / communityStanding (2026-08-25) ─────────
// Jacobs dom (RAPPORT_MATCHINTAKT_VIKT_OCH_COMMUNITYSTANDING_2026-08-25.md):
// "en klubb som betyder något för orten fyller läktaren" — communityStanding
// ska vara den DOMINERANDE termen (0,45), större än fanMood (0,25), eftersom
// fanMood strukturellt inte kan rädda en förlorande Survive-klubb men
// communityStanding är ortogonal mot resultat.

describe('computeAttendanceRate — communityStanding är nu den dominerande termen', () => {
  it('hög communityStanding ger högre rate än låg, vid samma fanMood', () => {
    const low = computeAttendanceRate(30, 20, 8)
    const high = computeAttendanceRate(30, 90, 8)
    expect(high).toBeGreaterThan(low)
  })

  it('communityStanding väger MER än fanMood (0,45 mot 0,25) — samma delta i endera ger olika utslag', () => {
    const base = computeAttendanceRate(50, 50, 8)
    const moodUp = computeAttendanceRate(90, 50, 8) - base
    const standingUp = computeAttendanceRate(50, 90, 8) - base
    expect(standingUp).toBeGreaterThan(moodUp)
  })

  // position=12 (sist i tabellen, 12-lagsligan) valt istf 8 i dessa två
  // tester (DOM_AH2_BASEKONOMI_INTAKT_2026-08-28, knapp 1): den kontinuerliga
  // positionstermen är per definition 0 vid position=12 (se
  // 'computeAttendanceRate — kontinuerlig positionsterm (knapp 1)' nedan),
  // så dessa två tester kan fortsätta isolera golvet/moodWeight-matematiken
  // utan att bindas till knapp 1:s magnitud (TOP_POSITION_BONUS_MAX) — en
  // framtida omkalibrering av magnituden ska inte behöva röra dessa.
  it('golvet (fanMood=0, communityStanding=0, position=12) är 0,20 — ignorera orten kostar mer än den gamla neutrala baslinjen (0,35)', () => {
    expect(computeAttendanceRate(0, 0, 12)).toBeCloseTo(0.20, 5)
  })

  it('taket är 0,95 — klampat vid maximal fanMood+communityStanding+positionsterm', () => {
    expect(computeAttendanceRate(100, 100, 1)).toBe(0.95)
  })

  it('moodWeight (neutral cupfinalhelg) dämpar BÅDE fanMood- och communityStanding-termen', () => {
    const full = computeAttendanceRate(80, 80, 12, 1.0)
    const halved = computeAttendanceRate(80, 80, 12, 0.5)
    expect(halved).toBeLessThan(full)
    expect(halved).toBeCloseTo(0.20 + (0.80 * 0.25 + 0.80 * 0.45) * 0.5, 5)
  })
})

// ── Group 5c: computeAttendanceRate — kontinuerlig positionsterm (knapp 1) ───
// DOM_AH2_BASEKONOMI_INTAKT_2026-08-28: den gamla termen var binär
// (position<=3 → +0,08, annars 0) — en trea och en fyra skildes åt av ett
// stup, en fyra och en tia inte alls. Ersatt med en linjär funktion av
// placeringen över hela 12-lagsligan: etta ger TOP_POSITION_BONUS_MAX (0,25),
// tolva ger 0, allt däremellan interpolerat. Se D033 (design_principles) för
// den mätta motiveringen bakom 0,25.
describe('computeAttendanceRate — kontinuerlig positionsterm (knapp 1)', () => {
  it('position 1 ger mer än position 6, som ger mer än position 12, vid identiskt fanMood/standing', () => {
    const pos1 = computeAttendanceRate(50, 50, 1)
    const pos6 = computeAttendanceRate(50, 50, 6)
    const pos12 = computeAttendanceRate(50, 50, 12)
    expect(pos1).toBeGreaterThan(pos6)
    expect(pos6).toBeGreaterThan(pos12)
  })

  it('position 4 ger mer än position 8 — kontinuerlig, inte en stupkant vid gamla top3-gränsen', () => {
    const pos4 = computeAttendanceRate(50, 50, 4)
    const pos8 = computeAttendanceRate(50, 50, 8)
    expect(pos4).toBeGreaterThan(pos8)
  })

  it('position 12 bidrar exakt 0 — golvet är oförändrat av positionstermen vid tabellens botten', () => {
    const withPosition = computeAttendanceRate(50, 50, 12)
    const floorOnly = 0.20 + (50 / 100) * 0.25 + (50 / 100) * 0.45
    expect(withPosition).toBeCloseTo(floorOnly, 5)
  })

  it('position 1 bidrar exakt TOP_POSITION_BONUS_MAX (0,25) före tak-klampningen', () => {
    // Låg fanMood/standing håller totalen under 0,95-taket så termen syns orört.
    const withPosition = computeAttendanceRate(10, 10, 1)
    const floorOnly = 0.20 + (10 / 100) * 0.25 + (10 / 100) * 0.45
    expect(withPosition - floorOnly).toBeCloseTo(0.25, 5)
  })

  it('position utanför 1-12 klampas till giltigt intervall (defensivt, ligan är alltid 12 lag)', () => {
    expect(computeAttendanceRate(50, 50, 0)).toBeCloseTo(computeAttendanceRate(50, 50, 1), 5)
    expect(computeAttendanceRate(50, 50, 20)).toBeCloseTo(computeAttendanceRate(50, 50, 12), 5)
  })
})

describe('calcRoundIncome — communityStanding driver för matchRevenue', () => {
  it('en Survive-liknande klubb (lågt rykte, dåligt fanMood) får högre matchRevenue vid hög communityStanding än vid låg', () => {
    const base = {
      club: makeClub({ reputation: 45 }), players: [], sponsors: [], communityActivities: undefined,
      fanMood: 30, isHomeMatch: true, matchIsKnockout: false, matchIsCup: false,
      matchHasRivalry: false, standing: makeStanding({ position: 11 }), rand: deterministicRand,
    }
    const lowStanding = calcRoundIncome({ ...base, communityStanding: 20 })
    const highStanding = calcRoundIncome({ ...base, communityStanding: 90 })
    expect(highStanding.matchRevenue).toBeGreaterThan(lowStanding.matchRevenue)
  })
})

describe('calcAttendance — communityStanding driver för den synliga publiksiffran', () => {
  it('hög communityStanding ger fler åskådare än låg, allt annat lika', () => {
    const base = {
      club: { reputation: 45 }, fanMood: 30, position: 11,
      isKnockout: false, isCup: false, isDerby: false,
    }
    const low = calcAttendance({ ...base, communityStanding: 20 })
    const high = calcAttendance({ ...base, communityStanding: 90 })
    expect(high).toBeGreaterThan(low)
  })

  it('saknad communityStanding defaultar till 50 — inte till 0 eller krasch', () => {
    const withDefault = calcAttendance({
      club: { reputation: 45 }, fanMood: 30, position: 11,
      isKnockout: false, isCup: false, isDerby: false,
    })
    const explicit50 = calcAttendance({
      club: { reputation: 45 }, fanMood: 30, position: 11, communityStanding: 50,
      isKnockout: false, isCup: false, isDerby: false,
    })
    expect(withDefault).toBe(explicit50)
  })
})

// ── Group 6: calcRoundIncome — community match income ────────────────────────

describe('calcRoundIncome — communityMatchIncome (per home match)', () => {
  it('all zero when communityActivities is undefined', () => {
    const result = calcRoundIncome({
      club: makeClub(), players: [], sponsors: [], communityActivities: undefined,
      fanMood: 50, isHomeMatch: true, matchIsKnockout: false, matchIsCup: false,
      matchHasRivalry: false, standing: null, rand: deterministicRand,
    })
    expect(result.communityMatchIncome).toBe(0)
  })

  it('communityMatchIncome = 0 on away match even with activities active', () => {
    const ca: CommunityActivities = {
      kiosk: 'upgraded', lottery: 'none', bandyplay: false,
      functionaries: true, julmarknad: false, vipTent: true,
    }
    const result = calcRoundIncome({
      club: makeClub(), players: [], sponsors: [], communityActivities: ca,
      fanMood: 50, isHomeMatch: false, matchIsKnockout: false, matchIsCup: false,
      matchHasRivalry: false, standing: null, rand: deterministicRand,
    })
    expect(result.communityMatchIncome).toBe(0)
  })

  it('kiosk basic gives a number for net income per home match', () => {
    const ca: CommunityActivities = {
      kiosk: 'basic', lottery: 'none', bandyplay: false,
      functionaries: false, julmarknad: false,
    }
    const result = calcRoundIncome({
      club: makeClub(), players: [], sponsors: [], communityActivities: ca,
      fanMood: 50, isHomeMatch: true, matchIsKnockout: false, matchIsCup: false,
      matchHasRivalry: false, standing: null, rand: deterministicRand,
    })
    // Åskådarekonomin kandidat 2 (2026-08-27): kiosk basic kan vara netto-
    // negativt vid låg publik — det är avsett (golvet är en ANDEL av
    // driftskostnaden, inte en garanti om vinst).
    expect(typeof result.communityMatchIncome).toBe('number')
  })

  it('kiosk upgraded gives higher communityMatchIncome than kiosk basic at same fanMood', () => {
    const base = {
      club: makeClub(), players: [], sponsors: [],
      fanMood: 80, isHomeMatch: true, matchIsKnockout: false, matchIsCup: false,
      matchHasRivalry: false, standing: null, rand: deterministicRand,
    }
    const basic = calcRoundIncome({
      ...base, communityActivities: { kiosk: 'basic', lottery: 'none', bandyplay: false, functionaries: false, julmarknad: false },
    })
    const upgraded = calcRoundIncome({
      ...base, communityActivities: { kiosk: 'upgraded', lottery: 'none', bandyplay: false, functionaries: false, julmarknad: false },
    })
    expect(upgraded.communityMatchIncome).toBeGreaterThan(basic.communityMatchIncome)
  })

  it('functionaries adds 1000 to communityMatchIncome', () => {
    const base = {
      club: makeClub(), players: [], sponsors: [],
      fanMood: 50, isHomeMatch: true, matchIsKnockout: false, matchIsCup: false,
      matchHasRivalry: false, standing: null, rand: deterministicRand,
    }
    const without = calcRoundIncome({
      ...base, communityActivities: { kiosk: 'none', lottery: 'none', bandyplay: false, functionaries: false, julmarknad: false },
    })
    const withFunc = calcRoundIncome({
      ...base, communityActivities: { kiosk: 'none', lottery: 'none', bandyplay: false, functionaries: true, julmarknad: false },
    })
    expect(withFunc.communityMatchIncome - without.communityMatchIncome).toBe(1000)
  })

  it('vipTent active increases communityMatchIncome', () => {
    const base = {
      club: makeClub(), players: [], sponsors: [],
      fanMood: 50, isHomeMatch: true, matchIsKnockout: false, matchIsCup: false,
      matchHasRivalry: false, standing: null, rand: deterministicRand,
    }
    const without = calcRoundIncome({
      ...base, communityActivities: { kiosk: 'none', lottery: 'none', bandyplay: false, functionaries: false, julmarknad: false },
    })
    const withVip = calcRoundIncome({
      ...base, communityActivities: { kiosk: 'none', lottery: 'none', bandyplay: false, functionaries: false, julmarknad: false, vipTent: true },
    })
    expect(withVip.communityMatchIncome).toBeGreaterThan(without.communityMatchIncome)
  })
})

// ── Åskådarekonomin kandidat 2 (2026-08-27) — sqrt(publik) + kostnadsrelativt golv ──
// RAPPORT_ASKADAREKONOMIN_V2_MATNING_2026-08-27.md. Golvet (50% av driftskostnaden)
// och sqrt-skalningen är de två delarna som skiljer denna formel från den kastade
// kandidat 1 (linjär kr/huvud, exploderade 27-34x för starka klubbar).
describe('calcRoundIncome — Åskådarekonomin kandidat 2 (sqrt + golv)', () => {
  const base = {
    club: makeClub(), players: [], sponsors: [],
    fanMood: 50, isHomeMatch: true, matchIsKnockout: false, matchIsCup: false,
    matchHasRivalry: false, standing: null, rand: deterministicRand,
  }

  it('golvet slår in vid mycket låg publik (Heros-liknande) — kiosk upgraded ger exakt 50% av driftskostnaden', () => {
    const result = calcRoundIncome({
      ...base,
      matchAttendance: 1, // sqrt(1)=1, 150*1=150 << golvet 0.5*2500=1250
      communityActivities: { kiosk: 'upgraded', lottery: 'none', bandyplay: false, functionaries: false, julmarknad: false },
    })
    // golv 1250 - driftskostnad 2500 = -1250 netto
    expect(result.communityMatchIncome).toBe(-1250)
  })

  it('vid hög publik dominerar sqrt-termen över golvet, inte linjärt mot publiken', () => {
    const low = calcRoundIncome({
      ...base, matchAttendance: 200,
      communityActivities: { kiosk: 'upgraded', lottery: 'none', bandyplay: false, functionaries: false, julmarknad: false },
    })
    const high = calcRoundIncome({
      ...base, matchAttendance: 1800, // 9x publiken
      communityActivities: { kiosk: 'upgraded', lottery: 'none', bandyplay: false, functionaries: false, julmarknad: false },
    })
    // sqrt(1800)/sqrt(200) = 3x, inte 9x — bruttot skalar med kvadratroten
    expect(high.communityMatchIncome).toBeGreaterThan(low.communityMatchIncome)
    const lowGross = low.communityMatchIncome + 2500
    const highGross = high.communityMatchIncome + 2500
    expect(highGross / lowGross).toBeLessThan(9)
    expect(highGross / lowGross).toBeGreaterThan(2)
  })

  it('vipTent-golvet slår in separat från kiosk-golvet vid låg publik', () => {
    const result = calcRoundIncome({
      ...base, matchAttendance: 1,
      communityActivities: { kiosk: 'none', lottery: 'none', bandyplay: false, functionaries: false, julmarknad: false, vipTent: true },
    })
    // golv 0.5*2000=1000 - driftskostnad 2000 = -1000 netto
    expect(result.communityMatchIncome).toBe(-1000)
  })

  it('functionaries och bandyplay är oförändrade av sqrt/golv-ändringen (flat tillägg)', () => {
    const without = calcRoundIncome({
      ...base, matchAttendance: 300,
      communityActivities: { kiosk: 'none', lottery: 'none', bandyplay: false, functionaries: false, julmarknad: false },
    })
    const withFunc = calcRoundIncome({
      ...base, matchAttendance: 300,
      communityActivities: { kiosk: 'none', lottery: 'none', bandyplay: false, functionaries: true, julmarknad: false },
    })
    expect(withFunc.communityMatchIncome - without.communityMatchIncome).toBe(1000)
  })

  it('utan matchAttendance faller formeln tillbaka på capacity × attendanceRate (ingen krasch, inget NaN)', () => {
    const result = calcRoundIncome({
      ...base,
      communityActivities: { kiosk: 'upgraded', lottery: 'none', bandyplay: false, functionaries: false, julmarknad: false, vipTent: true },
    })
    expect(Number.isFinite(result.communityMatchIncome)).toBe(true)
  })

  it('byggträdets kiosk-nod (builtNodeIds) höjer kiosk-sqrt-intäkten — löftet "Försäljningsintäkter" nu wirat', () => {
    const withoutNode = calcRoundIncome({
      ...base, matchAttendance: 900,
      communityActivities: { kiosk: 'upgraded', lottery: 'none', bandyplay: false, functionaries: false, julmarknad: false },
    })
    const withNode = calcRoundIncome({
      ...base, matchAttendance: 900, builtNodeIds: ['kiosk'],
      communityActivities: { kiosk: 'upgraded', lottery: 'none', bandyplay: false, functionaries: false, julmarknad: false },
    })
    expect(withNode.communityMatchIncome).toBeGreaterThan(withoutNode.communityMatchIncome)
  })

  it('golvet får INTE kiosk-nodens bonus (golvet är kostnadsrelativt, inte en försäljningssiffra)', () => {
    const result = calcRoundIncome({
      ...base, matchAttendance: 1, builtNodeIds: ['kiosk'],
      communityActivities: { kiosk: 'upgraded', lottery: 'none', bandyplay: false, functionaries: false, julmarknad: false },
    })
    // sqrt(1)=1, 150*1.25=187.5 << golvet 0.5*2500=1250 — golvet vinner oavsett bonus
    expect(result.communityMatchIncome).toBe(-1250)
  })
})

// ── Group 7: calcRoundIncome — community round income ────────────────────────

describe('calcRoundIncome — communityRoundIncome (per round regardless of home/away)', () => {
  it('communityRoundIncome = 0 when no communityActivities', () => {
    const result = calcRoundIncome({
      club: makeClub(), players: [], sponsors: [], communityActivities: undefined,
      fanMood: 50, isHomeMatch: false, matchIsKnockout: false, matchIsCup: false,
      matchHasRivalry: false, standing: null, rand: deterministicRand,
    })
    expect(result.communityRoundIncome).toBe(0)
  })

  it('lottery none → communityRoundIncome = 0 (no other activities)', () => {
    const ca: CommunityActivities = { kiosk: 'none', lottery: 'none', bandyplay: false, functionaries: false, julmarknad: false }
    const result = calcRoundIncome({
      club: makeClub(), players: [], sponsors: [], communityActivities: ca,
      fanMood: 50, isHomeMatch: false, matchIsKnockout: false, matchIsCup: false,
      matchHasRivalry: false, standing: null, rand: deterministicRand,
    })
    expect(result.communityRoundIncome).toBe(0)
  })

  it('lottery intensive yields higher communityRoundIncome than lottery basic', () => {
    const base = {
      club: makeClub(), players: [], sponsors: [],
      fanMood: 50, isHomeMatch: false, matchIsKnockout: false, matchIsCup: false,
      matchHasRivalry: false, standing: null, rand: deterministicRand,
    }
    const basic = calcRoundIncome({
      ...base, communityActivities: { kiosk: 'none', lottery: 'basic', bandyplay: false, functionaries: false, julmarknad: false },
    })
    const intensive = calcRoundIncome({
      ...base, communityActivities: { kiosk: 'none', lottery: 'intensive', bandyplay: false, functionaries: false, julmarknad: false },
    })
    expect(intensive.communityRoundIncome).toBeGreaterThan(basic.communityRoundIncome)
  })

  it('socialMedia active reduces communityRoundIncome by 500', () => {
    const base = {
      club: makeClub(), players: [], sponsors: [],
      fanMood: 50, isHomeMatch: false, matchIsKnockout: false, matchIsCup: false,
      matchHasRivalry: false, standing: null, rand: deterministicRand,
    }
    const without = calcRoundIncome({
      ...base, communityActivities: { kiosk: 'none', lottery: 'none', bandyplay: false, functionaries: false, julmarknad: false },
    })
    const withSocial = calcRoundIncome({
      ...base, communityActivities: { kiosk: 'none', lottery: 'none', bandyplay: false, functionaries: false, julmarknad: false, socialMedia: true },
    })
    expect(withSocial.communityRoundIncome - without.communityRoundIncome).toBe(-500)
  })

  it('bandySchool active adds 1000 to communityRoundIncome', () => {
    const base = {
      club: makeClub(), players: [], sponsors: [],
      fanMood: 50, isHomeMatch: false, matchIsKnockout: false, matchIsCup: false,
      matchHasRivalry: false, standing: null, rand: deterministicRand,
    }
    const without = calcRoundIncome({
      ...base, communityActivities: { kiosk: 'none', lottery: 'none', bandyplay: false, functionaries: false, julmarknad: false },
    })
    const withSchool = calcRoundIncome({
      ...base, communityActivities: { kiosk: 'none', lottery: 'none', bandyplay: false, functionaries: false, julmarknad: false, bandySchool: true },
    })
    expect(withSchool.communityRoundIncome - without.communityRoundIncome).toBe(1000)
  })

  it('communityRoundIncome is non-zero on away match (per-round activities apply regardless)', () => {
    const ca: CommunityActivities = { kiosk: 'none', lottery: 'intensive', bandyplay: false, functionaries: false, julmarknad: false }
    const result = calcRoundIncome({
      club: makeClub(), players: [], sponsors: [], communityActivities: ca,
      fanMood: 50, isHomeMatch: false, matchIsKnockout: false, matchIsCup: false,
      matchHasRivalry: false, standing: null, rand: deterministicRand,
    })
    expect(result.communityRoundIncome).not.toBe(0)
  })
})

// ── O5 kraft 1, prestationsfaktor på lönekravet (DOM_FRAMGANGSKURVAN_2026-08-27,
// anspråk 1: "Truppen vill ha det den är värd") ─────────────────────────────
// computeContractMinSalary/computeLeaguePositionAverages ersätter de tre
// dubblerade inline-formlerna i transferActions.ts, ContractsTab.tsx och
// transferService.ts. Se skäl-kommentarer i economyService.ts.

function makeSeasonStats(overrides: Partial<PlayerSeasonStats> = {}): PlayerSeasonStats {
  return {
    gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0,
    yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0,
    ...overrides,
  }
}

// Fast liga-genomsnitt (oberoende av computeLeaguePositionAverages, som
// testas separat nedan) — isolerar computeContractMinSalary-testerna mot
// en känd, kontrollerad baslinje.
function makeLeagueAverages(overrides: Partial<Record<PlayerPosition, LeaguePositionAverage>> = {}): Record<PlayerPosition, LeaguePositionAverage> {
  const flat: LeaguePositionAverage = { avgRating: 6.0, avgGoals: 3, avgAssists: 2 }
  return {
    [PlayerPosition.Goalkeeper]: { ...flat },
    [PlayerPosition.Defender]: { ...flat },
    [PlayerPosition.Half]: { ...flat },
    [PlayerPosition.Midfielder]: { ...flat },
    [PlayerPosition.Forward]: { ...flat },
    ...overrides,
  }
}

describe('computeContractMinSalary — prestationsfaktor', () => {
  // CA 60, isFullTimePro (inget dayJob), rep 50 → repFactor 1.0, base = 60*200*0.8 = 9600.
  // Utan prestationsfaktor: round(9600/500)*500 = 9500 — detta är golvet
  // "ren ability/rykte-formel" som alla nedanstående jämförs mot.
  const club = makeClub({ reputation: 50 })
  const leagueAverages = makeLeagueAverages()

  it('en spelare som matchar ligasnittet exakt får performanceFactor 1 (oförändrat golv)', () => {
    const atAverage = makePlayer({
      currentAbility: 60,
      seasonStats: makeSeasonStats({ gamesPlayed: 10, averageRating: 6.0, goals: 3, assists: 2 }),
    })
    expect(computeContractMinSalary(atAverage, club, leagueAverages)).toBe(9500)
  })

  it('(a) en toppspelare kostar märkbart mer än en reserv med samma currentAbility', () => {
    const benchPlayer = makePlayer({
      currentAbility: 60,
      seasonStats: makeSeasonStats({ gamesPlayed: 10, averageRating: 6.0, goals: 3, assists: 2 }),  // = ligasnitt
    })
    const starPlayer = makePlayer({
      currentAbility: 60,
      // +1.0 rating, +5 mål, +3 assist över ligasnittet
      seasonStats: makeSeasonStats({ gamesPlayed: 20, averageRating: 7.0, goals: 8, assists: 5 }),
    })
    const benchMinSalary = computeContractMinSalary(benchPlayer, club, leagueAverages)
    const starMinSalary = computeContractMinSalary(starPlayer, club, leagueAverages)
    expect(benchMinSalary).toBe(9500)
    // factor = 1 + 1.0*0.08 + 5*0.015 + 3*0.012 = 1.191 → round(9600*1.191/500)*500 = 11500
    expect(starMinSalary).toBe(11500)
    expect(starMinSalary).toBeGreaterThan(benchMinSalary)
  })

  it('(b) under 5 ligamatcher: performanceFactor === 1 oavsett hur extrema delstatistiken är', () => {
    const cameo = makePlayer({
      currentAbility: 60,
      seasonStats: makeSeasonStats({ gamesPlayed: MIN_LEAGUE_GAMES_FOR_PERFORMANCE_FACTOR - 1, averageRating: 10, goals: 100, assists: 100 }),
    })
    expect(computeContractMinSalary(cameo, club, leagueAverages)).toBe(9500)
  })

  it('exakt 5 ligamatcher är gränsen där prestationsfaktorn SLÅR IGENOM (inklusive, inte exklusive)', () => {
    const fiveGames = makePlayer({
      currentAbility: 60,
      seasonStats: makeSeasonStats({ gamesPlayed: MIN_LEAGUE_GAMES_FOR_PERFORMANCE_FACTOR, averageRating: 7.0, goals: 8, assists: 5 }),
    })
    expect(computeContractMinSalary(fiveGames, club, leagueAverages)).toBe(11500)
  })

  it('(c) performanceFactor klampas vid 1.40 för extrem överprestation', () => {
    const extremeStar = makePlayer({
      currentAbility: 60,
      // ratingDelta 5, goalsDelta 50, assistsDelta 50 → rå faktor 2.75, klampad till 1.40
      seasonStats: makeSeasonStats({ gamesPlayed: 20, averageRating: 11, goals: 53, assists: 52 }),
    })
    // round(9600*1.40/500)*500 = 13500
    expect(computeContractMinSalary(extremeStar, club, leagueAverages)).toBe(13500)
  })

  it('(c) performanceFactor klampas vid 0.85 för extrem underprestation', () => {
    const extremeBench = makePlayer({
      currentAbility: 60,
      // ratingDelta -5, goalsDelta -50 (golvat vid 0 mål ändå negativ delta), assistsDelta -50 → rå faktor -0.75, klampad till 0.85
      seasonStats: makeSeasonStats({ gamesPlayed: 20, averageRating: 1, goals: 0, assists: 0 }),
    })
    // round(9600*0.85/500)*500 = 8000
    expect(computeContractMinSalary(extremeBench, club, leagueAverages)).toBe(8000)
  })
})

describe('computeLeaguePositionAverages', () => {
  function makeGameWithPlayers(players: Player[]): SaveGame {
    return { players } as unknown as SaveGame
  }

  it('(d) exkluderar spelare med färre än 5 matcher ur ligasnittet (cameo-spelare drar inte ner snittet)', () => {
    const f1 = makePlayer({ id: 'f1', position: PlayerPosition.Forward, seasonStats: makeSeasonStats({ gamesPlayed: 10, goals: 10, assists: 5, averageRating: 7.0 }) })
    const f2 = makePlayer({ id: 'f2', position: PlayerPosition.Forward, seasonStats: makeSeasonStats({ gamesPlayed: 8, goals: 6, assists: 3, averageRating: 6.0 }) })
    // Cameo-forward: bara 2 matcher, men 50 mål — SKA INTE räknas in, annars skulle
    // den ensam dra snittet uppåt mot ett orimligt tal.
    const cameo = makePlayer({ id: 'f3-cameo', position: PlayerPosition.Forward, seasonStats: makeSeasonStats({ gamesPlayed: 2, goals: 50, assists: 20, averageRating: 9.9 }) })

    const averages = computeLeaguePositionAverages(makeGameWithPlayers([f1, f2, cameo]))
    expect(averages[PlayerPosition.Forward].avgGoals).toBe(8)      // (10+6)/2, INTE (10+6+50)/3
    expect(averages[PlayerPosition.Forward].avgAssists).toBe(4)    // (5+3)/2
    expect(averages[PlayerPosition.Forward].avgRating).toBe(6.5)   // (7.0+6.0)/2
  })

  it('(d) separerar snittet per position — en anfallares snitt påverkas inte av en backs statistik', () => {
    const forward = makePlayer({ id: 'fwd', position: PlayerPosition.Forward, seasonStats: makeSeasonStats({ gamesPlayed: 10, goals: 10, assists: 5, averageRating: 7.0 }) })
    const defender = makePlayer({ id: 'def', position: PlayerPosition.Defender, seasonStats: makeSeasonStats({ gamesPlayed: 10, goals: 1, assists: 1, averageRating: 5.5 }) })

    const averages = computeLeaguePositionAverages(makeGameWithPlayers([forward, defender]))
    expect(averages[PlayerPosition.Forward]).toEqual({ avgGoals: 10, avgAssists: 5, avgRating: 7.0 })
    expect(averages[PlayerPosition.Defender]).toEqual({ avgGoals: 1, avgAssists: 1, avgRating: 5.5 })
  })

  it('en position utan kvalificerade spelare (0 med ≥5 matcher) faller tillbaka till ett neutralt default', () => {
    const onlyForward = makePlayer({ id: 'fwd', position: PlayerPosition.Forward, seasonStats: makeSeasonStats({ gamesPlayed: 10, goals: 10, assists: 5, averageRating: 7.0 }) })
    const averages = computeLeaguePositionAverages(makeGameWithPlayers([onlyForward]))
    expect(averages[PlayerPosition.Goalkeeper]).toEqual({ avgRating: 6.0, avgGoals: 0, avgAssists: 0 })
  })
})
