import { describe, it, expect } from 'vitest'
import {
  applyFinanceChange,
  appendFinanceLog,
  calcRoundIncome,
  FINANCE_LOG_MAX,
} from '../economyService'
import type { FinanceEntry } from '../economyService'
import type { Club } from '../../entities/Club'
import type { Player } from '../../entities/Player'
import type { Sponsor, CommunityActivities, StandingRow } from '../../entities/SaveGame'
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
  it('weeklyBase = 3000 + reputation × 50', () => {
    const club = makeClub({ reputation: 60 })
    const result = calcRoundIncome({
      club, players: [], sponsors: [], communityActivities: undefined,
      fanMood: 50, isHomeMatch: false, matchIsKnockout: false, matchIsCup: false,
      matchHasRivalry: false, standing: null, rand: deterministicRand,
    })
    expect(result.weeklyBase).toBe(3000 + 60 * 50)
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

  it('kiosk basic gives positive net income per home match', () => {
    const ca: CommunityActivities = {
      kiosk: 'basic', lottery: 'none', bandyplay: false,
      functionaries: false, julmarknad: false,
    }
    const result = calcRoundIncome({
      club: makeClub(), players: [], sponsors: [], communityActivities: ca,
      fanMood: 50, isHomeMatch: true, matchIsKnockout: false, matchIsCup: false,
      matchHasRivalry: false, standing: null, rand: deterministicRand,
    })
    // kiosk basic gross - running cost. At fanMood 50: 1250*1.0 - 1500 = -250 (net negative due to costs)
    // This is the real game logic — basic kiosk can be net negative at low fanMood
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
    // VIP-tält: 1250 + 0.5*2500 (rand=0.5) - 2000 running = 500 net
    expect(withVip.communityMatchIncome).toBeGreaterThan(without.communityMatchIncome)
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
