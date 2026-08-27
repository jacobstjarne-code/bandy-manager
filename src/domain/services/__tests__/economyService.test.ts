import { describe, it, expect } from 'vitest'
import {
  applyFinanceChange,
  appendFinanceLog,
  calcRoundIncome,
  calcAttendance,
  computeAttendanceRate,
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

  it('golvet (fanMood=0, communityStanding=0) är 0,20 — ignorera orten kostar mer än den gamla neutrala baslinjen (0,35)', () => {
    expect(computeAttendanceRate(0, 0, 8)).toBeCloseTo(0.20, 5)
  })

  it('taket är 0,95 — klampat vid maximal fanMood+communityStanding+topp-3-bonus', () => {
    expect(computeAttendanceRate(100, 100, 1)).toBe(0.95)
  })

  it('moodWeight (neutral cupfinalhelg) dämpar BÅDE fanMood- och communityStanding-termen', () => {
    const full = computeAttendanceRate(80, 80, 8, 1.0)
    const halved = computeAttendanceRate(80, 80, 8, 0.5)
    expect(halved).toBeLessThan(full)
    expect(halved).toBeCloseTo(0.20 + (0.80 * 0.25 + 0.80 * 0.45) * 0.5, 5)
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
