/**
 * ANSPRÅK 4 — ortsunderhållet (DOM_ANSPAK4_ORTSUNDERHALL_2026-08-29.md, D037).
 *
 * Testar WIRINGEN i processCommunity, inte rampernas form (den ligger i
 * domain/services/__tests__/communityStandingScaling.test.ts):
 *   1. Bara aktivitets-/volontärboosten skalas av csUpkeepFactor — matchresultat
 *      och placering är orörda.
 *   2. Negativ csBoost (förlust) skalas ALDRIG av storleken — det ska vara lika
 *      lätt att falla oavsett hur stor klubben är (domen, "SKYDDAT").
 *   3. Baslinjedraget (knapp 2) biter oavsett resultat och oavsett aktiviteter,
 *      men bara på en stor klubb.
 *   4. En liten klubb får exakt samma csBoost som före anspråk 4 (Survive-golvet).
 */
import { describe, it, expect } from 'vitest'
import { processCommunity } from '../communityProcessor'
import { createNewGame } from '../../createNewGame'
import {
  csUpkeepFactor,
  csExpectationDrag,
  getCsDiminishingFactor,
  CS_UPKEEP_REP_FLOOR,
  CS_UPKEEP_REP_CEIL,
} from '../../../../domain/services/communityStandingScaling'
import type { SaveGame, StandingRow } from '../../../../domain/entities/SaveGame'
import type { Fixture } from '../../../../domain/entities/Fixture'
import type { CommunityActivities } from '../../../../domain/entities/Community'

const ALLA_AKTIVITETER: CommunityActivities = {
  kiosk: 'upgraded', lottery: 'intensive', bandyplay: true, functionaries: true,
  julmarknad: false, bandySchool: true, socialMedia: true, vipTent: true,
  pensionarskaffe: true, soppkvall: true, skolbesok: true,
}
/** Summan av aktivitetsboostarna i communityProcessor (0.08+0.05+0.08+0.05+0.08+0.03+0.10+0.08+0.12). */
const ALLA_AKTIVITETER_RAW = 0.67

const INGA_AKTIVITETER: CommunityActivities = {
  kiosk: 'none', lottery: 'none', bandyplay: false, functionaries: false,
  julmarknad: false, bandySchool: false, socialMedia: false, vipTent: false,
  pensionarskaffe: false, soppkvall: false, skolbesok: false,
}

function makeGame(reputation: number, activities: CommunityActivities, communityStanding = 50): SaveGame {
  const base = createNewGame({ managerName: 'A4-test', clubId: 'club_forsbacka', season: 2025, seed: 7 })
  return {
    ...base,
    communityStanding,
    communityActivities: activities,
    volunteers: [],
    // Journalistmodifieraren ska inte smyga in i talen — nollställd genom att
    // låta spelet vara utan journalistrelation (default i createNewGame).
    clubs: base.clubs.map(c => (c.id === base.managedClubId ? { ...c, reputation } : c)),
  }
}

/** Neutral tabell: klubben på plats 6 → varken topp-3-bonus (+0.2) eller ≥10-avdrag. */
function neutralStandings(game: SaveGame): StandingRow[] {
  return game.clubs.map((c, i) => ({
    clubId: c.id,
    position: c.id === game.managedClubId ? 6 : (i < 5 ? i + 1 : i + 2),
    played: 10, won: 5, drawn: 0, lost: 5, goalsFor: 30, goalsAgainst: 30, goalDifference: 0, points: 10,
  })) as StandingRow[]
}

function makeFixture(game: SaveGame, myScore: number, theirScore: number): Fixture {
  const opponent = game.clubs.find(c => c.id !== game.managedClubId)!
  return {
    id: 'fx_test', homeClubId: game.managedClubId, awayClubId: opponent.id,
    homeScore: myScore, awayScore: theirScore, status: 'completed',
    matchday: 10, roundNumber: 10, isCup: false,
  } as Fixture
}

describe('processCommunity — anspråk 4, knapp 1 (csUpkeepFactor)', () => {
  it('en liten klubb (rykte på golvet) får aktivitetsboosten oskalad', () => {
    const game = makeGame(CS_UPKEEP_REP_FLOOR, ALLA_AKTIVITETER)
    const utan = processCommunity(makeGame(CS_UPKEEP_REP_FLOOR, INGA_AKTIVITETER), null, 0, neutralStandings(game), 10)
    const med = processCommunity(game, null, 0, neutralStandings(game), 10)
    // cs=50 → getCsDiminishingFactor = 1.0, så skillnaden är råsumman rakt av.
    expect(med.csBoost - utan.csBoost).toBeCloseTo(ALLA_AKTIVITETER_RAW, 6)
  })

  it('en stor klubb (rykte på taket) får SAMMA aktiviteter att hålla mindre', () => {
    const game = makeGame(CS_UPKEEP_REP_CEIL, ALLA_AKTIVITETER)
    const utan = processCommunity(makeGame(CS_UPKEEP_REP_CEIL, INGA_AKTIVITETER), null, 0, neutralStandings(game), 10)
    const med = processCommunity(game, null, 0, neutralStandings(game), 10)
    const delta = med.csBoost - utan.csBoost
    expect(delta).toBeCloseTo(ALLA_AKTIVITETER_RAW * csUpkeepFactor(CS_UPKEEP_REP_CEIL), 6)
    expect(delta).toBeLessThan(ALLA_AKTIVITETER_RAW)
    // Holdbarheten: mindre, aldrig borta.
    expect(delta).toBeGreaterThan(0)
  })

  it('matchresultatets boost är OSKALAD — bara ortsinsatsen träffas', () => {
    const liten = makeGame(CS_UPKEEP_REP_FLOOR, INGA_AKTIVITETER)
    const stor = makeGame(CS_UPKEEP_REP_CEIL, INGA_AKTIVITETER)
    const segerLiten = processCommunity(liten, makeFixture(liten, 3, 1), 0, neutralStandings(liten), 10)
    const segerStor = processCommunity(stor, makeFixture(stor, 3, 1), 0, neutralStandings(stor), 10)
    const utanLiten = processCommunity(liten, null, 0, neutralStandings(liten), 10)
    const utanStor = processCommunity(stor, null, 0, neutralStandings(stor), 10)
    // Segerns bidrag (+2, × diminishingFactor) ska vara identiskt för båda.
    expect(segerStor.csBoost - utanStor.csBoost).toBeCloseTo(segerLiten.csBoost - utanLiten.csBoost, 6)
  })
})

describe('processCommunity — anspråk 4: negativ csBoost skalas aldrig av storleken', () => {
  it('en storförlust kostar en stor klubb exakt lika mycket som en liten', () => {
    const liten = makeGame(CS_UPKEEP_REP_FLOOR, INGA_AKTIVITETER)
    const stor = makeGame(CS_UPKEEP_REP_CEIL, INGA_AKTIVITETER)
    const forlustLiten = processCommunity(liten, makeFixture(liten, 0, 4), 0, neutralStandings(liten), 10)
    const forlustStor = processCommunity(stor, makeFixture(stor, 0, 4), 0, neutralStandings(stor), 10)
    const utanLiten = processCommunity(liten, null, 0, neutralStandings(liten), 10)
    const utanStor = processCommunity(stor, null, 0, neutralStandings(stor), 10)
    const kostnadLiten = forlustLiten.csBoost - utanLiten.csBoost
    const kostnadStor = forlustStor.csBoost - utanStor.csBoost
    expect(kostnadStor).toBeCloseTo(kostnadLiten, 6)
    expect(kostnadStor).toBeLessThan(0)
  })

  // OBS: positiv/negativ-splitten (Math.max/Math.min på TOTALEN, förbefintlig
  // sedan tröskelsvepet) gör att en omgångs positiva delar absorberas i
  // nettosumman när den slår över till negativ. Testet isolerar därför
  // förlusten utan aktiviteter — annars mäts splittens semantik, inte anspråk 4.
  it('storförlusten är oskalad även vid hög CS där positiva boostar dämpas hårt', () => {
    const stor = makeGame(CS_UPKEEP_REP_CEIL, INGA_AKTIVITETER, 100)
    const forlust = processCommunity(stor, makeFixture(stor, 0, 4), 0, neutralStandings(stor), 10)
    const utan = processCommunity(stor, null, 0, neutralStandings(stor), 10)
    // -6 rakt av, ingen dämpning, ingen storleksskalning.
    expect(forlust.csBoost - utan.csBoost).toBeCloseTo(-6, 6)
  })
})

describe('processCommunity — anspråk 4, knapp 2 (csExpectationDrag)', () => {
  it('ingen drag för en liten klubb (Survive-golvet intakt)', () => {
    const game = makeGame(CS_UPKEEP_REP_FLOOR, INGA_AKTIVITETER)
    // Utan aktiviteter, utan match, plats 6: enda kvarvarande term är draget.
    expect(processCommunity(game, null, 0, neutralStandings(game), 10).csBoost).toBeCloseTo(0, 6)
  })

  it('full drag för en stor klubb, oavsett att den vann', () => {
    const game = makeGame(CS_UPKEEP_REP_CEIL, INGA_AKTIVITETER)
    const seger = processCommunity(game, makeFixture(game, 3, 1), 0, neutralStandings(game), 10)
    // +2 seger × diminishingFactor(50)=1.0, minus draget.
    expect(seger.csBoost).toBeCloseTo(2 - csExpectationDrag(CS_UPKEEP_REP_CEIL), 6)
    expect(csExpectationDrag(CS_UPKEEP_REP_CEIL)).toBeGreaterThan(0)
  })

  it('draget dämpas INTE av getCsDiminishingFactor — det biter även vid hög CS', () => {
    const game = makeGame(CS_UPKEEP_REP_CEIL, INGA_AKTIVITETER, 100)
    const utan = processCommunity(game, null, 0, neutralStandings(game), 10)
    expect(utan.csBoost).toBeCloseTo(-csExpectationDrag(CS_UPKEEP_REP_CEIL), 6)
    // Sanity: dämpningen vid cs=100 är hård (0.25) — hade draget lagts före
    // splitten hade det bara synts som 0.25× av sitt värde.
    expect(getCsDiminishingFactor(100)).toBeLessThan(0.3)
  })
})

describe('processCommunity — anspråk 4 sänker inte CS för en liten klubb alls', () => {
  it('hela ortspaketet ger en liten klubb exakt samma csBoost som utan anspråk 4', () => {
    const game = makeGame(50, ALLA_AKTIVITETER)
    const result = processCommunity(game, makeFixture(game, 3, 1), 0, neutralStandings(game), 10)
    // cs=50 → dämpning 1.0, rykte 50 → faktor 1.0 och drag 0.
    // Förväntat: seger +2 + aktiviteter 0.67, ingenting avdraget.
    expect(result.csBoost).toBeCloseTo(2 + ALLA_AKTIVITETER_RAW, 6)
  })
})
