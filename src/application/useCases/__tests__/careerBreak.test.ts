/**
 * O13 / M11 — TRÄNARMARKNADEN (DOM_TRANARMARKNADEN_2026-08-26.md).
 *
 * Fyra saker som måste hålla, och som ingen befintlig grind täcker:
 *   1. Uppehållet spelar FAKTISKT klart säsongerna utan spelaren.
 *   2. Klubbytet behåller världen (samma spelare, samma historik, samma seed).
 *   3. Erbjudandena följer renommétrappan och skärpning 2:s återringningsvillkor.
 *   4. Årsboken bär två klubbar (HistoryScreens rena funktioner).
 */

import { describe, it, expect } from 'vitest'
import { createNewGame } from '../createNewGame'
import { simulateCareerBreak, derivePositionUnderPlayer, restoreProfileAfterBreak, canEnterCareerBreak } from '../simulateCareerBreak'
import { switchManagedClub, advanceProfileToNewClub } from '../switchManagedClub'
import {
  computeManagerRenomme,
  offerCountForRenomme,
  performedAtClub,
  buildCareerOffers,
  findVacantClubs,
  vacancyZoneSize,
  RENOMME_BASE,
  RENOMME_SM_GOLD,
  RENOMME_LEAGUE_WIN,
  RENOMME_FIRING,
  RENOMME_TIER_THREE,
  MAX_FIRINGS,
  type CareerBreakReport,
} from '../../../domain/services/careerBreakService'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { SeasonSummary } from '../../../domain/entities/SeasonSummary'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'
import { ClubExpectation } from '../../../domain/enums'

function newGame(seed = 4711, clubIndex = 0): SaveGame {
  const club = CLUB_TEMPLATES[clubIndex]
  return { ...createNewGame({ managerName: 'Test Manager', clubId: club.id, seed }), pendingScreen: null }
}

function summary(over: Partial<SeasonSummary>): SeasonSummary {
  return {
    id: `s_${over.season}_${over.clubId}`,
    season: 2026,
    clubId: 'club_a',
    clubName: 'Klubb A',
    finalPosition: 6,
    points: 20, wins: 8, draws: 4, losses: 10,
    goalsFor: 80, goalsAgainst: 85, goalDifference: -5,
    playoffResult: null,
    boardExpectation: ClubExpectation.MidTable,
    metExpectation: true,
    expectationVerdict: 'met',
    topScorer: null, topAssister: null, topRated: null, mostImproved: null, youngPlayer: null,
    totalGoals: 80, totalAssists: 50, totalCornerGoals: 18, totalCleanSheets: 2,
    longestWinStreak: 3, longestLossStreak: 3,
    biggestWin: null, worstLoss: null,
    homeRecord: { wins: 5, draws: 2, losses: 4 },
    awayRecord: { wins: 3, draws: 2, losses: 6 },
    firstHalfPoints: 10, secondHalfPoints: 10,
    formTrend: 'stable',
    totalInjuries: 4, mostInjuredPlayer: null,
    startFinances: 0, endFinances: 0, financialChange: 0,
    ...over,
  } as SeasonSummary
}

// ── 1. Uppehållet ──────────────────────────────────────────────────────────

describe('O13 — uppehållet spelas utan spelaren', () => {
  it('avsked vid säsongsslut: den påföljande säsongen spelas klart, utan en enda spelaråtgärd', () => {
    const base = newGame(101)
    // seasonEndProcessor sätter managerFired I SAMMA svep som rollovern, så
    // spelet står redan i säsongen EFTER den avskedet gällde. Modelleras här
    // genom att firedAtSeason pekar ett steg bakåt.
    const fired: SaveGame = { ...base, managerFired: true, firedAtSeason: base.currentSeason - 1 }

    const { game, iterations } = simulateCareerBreak(fired)

    expect(iterations).toBeGreaterThan(0)
    // firedAtSeason + 2: den säsong avskedet gällde är redan spelad av
    // spelaren själv, kvar var den påföljande — alltså EN säsong.
    expect(game.currentSeason).toBeGreaterThanOrEqual(base.currentSeason + 1)
    expect(game.careerBreak).toBeDefined()
    expect(game.careerBreak!.report.seasonsSimulated).toBe(1)
    // Varje simulerad säsong ska ha en riktig sluttabell, inte en nolla.
    for (const line of game.careerBreak!.report.seasons) {
      expect(line.formerClubPosition).toBeGreaterThanOrEqual(1)
      expect(line.formerClubPosition).toBeLessThanOrEqual(game.clubs.length)
    }
  })

  it('avsked mitt i säsongen: RESTEN av den säsongen spelas också (två säsongsslut)', () => {
    const base = newGame(202)
    const fired: SaveGame = { ...base, managerFired: true, firedAtSeason: base.currentSeason }
    const { game } = simulateCareerBreak(fired)
    // Från säsongens början till currentSeason+2 passeras TVÅ säsongsslut.
    expect(game.careerBreak!.report.seasons.length).toBe(2)
  })

  it('årsboken växer inte av vad efterträdaren gjorde', () => {
    const base = newGame(303)
    const before = (base.seasonSummaries ?? []).length
    const fired: SaveGame = { ...base, managerFired: true, firedAtSeason: base.currentSeason }
    const { game } = simulateCareerBreak(fired)
    expect((game.seasonSummaries ?? []).length).toBe(before)
  })

  it('meriterna fryses vid avskedet — bara åldern går, och utbrändheten läker', () => {
    const base = newGame(404)
    const profile = base.managerProfile!
    const fired: SaveGame = {
      ...base,
      managerFired: true,
      firedAtSeason: base.currentSeason,
      managerProfile: { ...profile, careerWins: 42, burnoutScore: 88 },
    }
    const { game } = simulateCareerBreak(fired)
    expect(game.managerProfile!.careerWins).toBe(42)
    expect(game.managerProfile!.burnoutScore).toBeLessThanOrEqual(30)
    expect(game.managerProfile!.age).toBeGreaterThan(profile.age)
    expect(game.managerProfile!.firings).toBe(1)
  })

  it('restoreProfileAfterBreak: ålder + antal säsonger, utbrändhet aldrig höjd', () => {
    const p = { age: 45, burnoutScore: 12, careerWins: 3 } as never as Parameters<typeof restoreProfileAfterBreak>[0]
    const after = restoreProfileAfterBreak(p, 2)
    expect(after.age).toBe(47)
    expect(after.burnoutScore).toBe(12)
  })

  it('derivePositionUnderPlayer skiljer på avsked mitt i säsongen och vid säsongsslut', () => {
    const base = newGame(505)
    // LESSONS #50 — `played` måste vara > 0, annars är tillståndet omöjligt:
    // safeStandingPosition vägrar (korrekt) att citera en placering för en
    // klubb som inte spelat en match, och testet hade mätt en fantasi.
    const mid: SaveGame = {
      ...base,
      standings: base.standings.map(s => s.clubId === base.managedClubId
        ? { ...s, position: 9, played: 11 }
        : { ...s, played: 11 }),
    }
    expect(derivePositionUnderPlayer(mid, base.currentSeason)).toBe(9)

    // Och motsatsen: en orörd tabell ger sistaplats, inte en påhittad etta.
    expect(derivePositionUnderPlayer(base, base.currentSeason)).toBe(base.clubs.length)

    const rolled: SaveGame = {
      ...base,
      currentSeason: base.currentSeason + 1,
      seasonSummaries: [summary({ season: base.currentSeason, clubId: base.managedClubId, finalPosition: 4 })],
    }
    expect(derivePositionUnderPlayer(rolled, base.currentSeason)).toBe(4)
  })
})

// ── 2. Klubbytet ───────────────────────────────────────────────────────────

describe('O13 — klubbytet behåller världen', () => {
  function switchedPair() {
    const base = newGame(606)
    const target = base.clubs.find(c => c.id !== base.managedClubId)!
    return { base, target, switched: switchManagedClub(base, target.id) }
  }

  it('samma spelare, samma matcher, samma liga, samma seed', () => {
    const { base, switched } = switchedPair()
    expect(switched.players.map(p => p.id).sort()).toEqual(base.players.map(p => p.id).sort())
    expect(switched.clubs.map(c => c.id)).toEqual(base.clubs.map(c => c.id))
    expect(switched.fixtures.length).toBe(base.fixtures.length)
    expect(switched.league).toEqual(base.league)
    expect(switched.worldSeed).toBe(base.worldSeed)
    expect(switched.ruleVersion).toBe(base.ruleVersion)
  })

  it('karriären följer med: årsboken orörd, managerProfile behållen', () => {
    const base = newGame(707)
    const withHistory: SaveGame = {
      ...base,
      seasonSummaries: [summary({ season: 2026, clubId: base.managedClubId, clubName: 'Gamla', finalPosition: 2 })],
    }
    const target = base.clubs.find(c => c.id !== base.managedClubId)!
    const switched = switchManagedClub(withHistory, target.id)
    expect(switched.seasonSummaries).toEqual(withHistory.seasonSummaries)
    expect(switched.managerProfile!.careerWins).toBe(withHistory.managerProfile!.careerWins)
  })

  it('det klubbspecifika byts ut — styrelse, klack, akademi, anläggning, mål', () => {
    const { base, target, switched } = switchedPair()
    expect(switched.managedClubId).toBe(target.id)
    // Klacken är den nya klubbens (SupporterGroup bär inget clubId — den
    // identifieras av sitt namn ur klubbens mall).
    expect(switched.supporterGroup).not.toEqual(base.supporterGroup)
    expect(switched.board).not.toEqual(base.board)
    expect(switched.youthTeam).toBeDefined()
    expect(switched.youthTeam).not.toEqual(base.youthTeam)
    expect(switched.facilityState).toEqual({ builtNodeIds: [] })
    expect(switched.boardPatience).toBe(70)
    expect(switched.consecutiveFailures).toBe(0)
    expect(switched.allTimeRecords).toBeUndefined()
    expect(switched.inbox).toEqual([])
    // Startelvan är den NYA klubbens spelare, inte den gamlas.
    const newSquad = new Set(switched.players.filter(p => p.clubId === target.id).map(p => p.id))
    for (const id of switched.managedClubPendingLineup!.startingPlayerIds) {
      expect(newSquad.has(id)).toBe(true)
    }
  })

  it('styrelsemålen är stämplade med startvärden, inte falska nollor', () => {
    const { switched } = switchedPair()
    expect((switched.boardObjectives ?? []).length).toBeGreaterThan(0)
    for (const obj of switched.boardObjectives ?? []) {
      expect(obj.startValue).toBeDefined()
      expect(obj.currentValue).toBe(obj.startValue)
    }
  })

  it('avskedsflaggorna är släckta efter bytet', () => {
    const base = newGame(808)
    const target = base.clubs.find(c => c.id !== base.managedClubId)!
    const fired: SaveGame = { ...base, managerFired: true, firedAtSeason: base.currentSeason }
    const switched = switchManagedClub(fired, target.id)
    expect(switched.managerFired).toBeUndefined()
    expect(switched.careerBreak).toBeUndefined()
    expect(switched.firedAtSeason).toBeUndefined()
  })

  it('samma seed + samma klubb ⇒ samma nya klubbfolk (determinism)', () => {
    const base = newGame(909)
    const target = base.clubs.find(c => c.id !== base.managedClubId)!
    const a = switchManagedClub(base, target.id)
    const b = switchManagedClub(base, target.id)
    expect(a.board).toEqual(b.board)
    expect(a.localPolitician).toEqual(b.localPolitician)
    expect(a.journalist).toEqual(b.journalist)
  })

  it('advanceProfileToNewClub: seasonsAtClub nollställs, karriärsumman bevaras', () => {
    const base = newGame(1010)
    const profile = { ...base.managerProfile!, seasonsAtClub: 5 }
    const after = advanceProfileToNewClub(profile, 'club_a', 'Klubb A', 'club_b', 'Klubb B', 2031)
    expect(after.seasonsAtClub).toBe(1)
    expect(after.careerSeasons).toBe(5)
    expect(after.clubSpells).toHaveLength(2)
    expect(after.clubSpells![0]).toMatchObject({ clubId: 'club_a', toSeason: 2031, endedBy: 'fired' })
    expect(after.clubSpells![1]).toMatchObject({ clubId: 'club_b', fromSeason: 2031 })
    expect(after.clubSpells![1].toSeason).toBeUndefined()
  })
})

// ── 3. Renommé och erbjudanden ─────────────────────────────────────────────

describe('O13 — renommétrappan och skärpningarna', () => {
  it('domens referensfall B: liga- och SM-vinnare som sparkas får tre samtal', () => {
    const summaries = [summary({ season: 2026, finalPosition: 1, playoffResult: 'champion' })]
    const r = computeManagerRenomme(summaries, 1, 12)
    // 40 bas + 20 SM + 8 ligavinst + 3 slutspelskval − 12 avsked
    expect(r).toBe(RENOMME_BASE + RENOMME_SM_GOLD + RENOMME_LEAGUE_WIN + 3 + RENOMME_FIRING)
    expect(r).toBeGreaterThanOrEqual(RENOMME_TIER_THREE)
    expect(offerCountForRenomme(r, 1)).toBe(3)
  })

  it('domens referensfall A: mittenkarriär med en bottenplacering får ETT samtal', () => {
    const summaries = [
      summary({ season: 2026, finalPosition: 7 }),
      summary({ season: 2027, finalPosition: 11 }), // nedflyttningszon i en 12-lagsliga
    ]
    const r = computeManagerRenomme(summaries, 1, 12)
    expect(offerCountForRenomme(r, 1)).toBe(1)
  })

  it('skärpning 3: efter tredje avskedet ringer ingen, oavsett renommé', () => {
    expect(offerCountForRenomme(100, MAX_FIRINGS)).toBe(0)
    expect(offerCountForRenomme(100, MAX_FIRINGS - 1)).toBe(3)
    // canEnterCareerBreak stänger dörren redan på Game Over-skärmen
    const base = newGame(1111)
    const spent: SaveGame = {
      ...base,
      managerFired: true,
      managerProfile: { ...base.managerProfile!, firings: MAX_FIRINGS - 1 },
    }
    expect(canEnterCareerBreak(spent)).toBe(false)
  })

  it('performedAtClub mäter hela perioden, inte bara sista säsongen', () => {
    const summaries = [
      summary({ season: 2026, clubId: 'club_a', finalPosition: 3 }),
      summary({ season: 2027, clubId: 'club_a', finalPosition: 12 }),
    ]
    expect(performedAtClub(summaries, 'club_a', 12)).toBe(true)
    expect(performedAtClub(summaries.slice(1), 'club_a', 12)).toBe(false)
    expect(performedAtClub(summaries, 'club_b', 12)).toBe(false)
  })

  it('skärpning 2: gamla klubben ringer bara när den gjorde det SÄMRE utan dig', () => {
    const base = newGame(1212)
    const report: CareerBreakReport = {
      formerClubId: base.managedClubId,
      formerClubName: 'Gamla',
      positionUnderPlayer: 6,
      bestPositionUnderReplacement: 11,
      seasons: [],
      replacementCoachName: 'Efterträdaren',
      formerClubDidWorse: true,
      seasonsSimulated: 2,
      finalStandings: base.standings.map(r => ({ clubId: r.clubId, position: r.position })),
    }
    const withDidWorse = buildCareerOffers({ game: base, report, renomme: 60, firings: 1 })
    expect(withDidWorse.some(o => o.isFormerClub)).toBe(true)
    // Den bästa berättelsen får inte kunna sållas bort av taket.
    expect(withDidWorse[0].isFormerClub).toBe(true)

    const better: CareerBreakReport = { ...report, bestPositionUnderReplacement: 3, formerClubDidWorse: false }
    const withDidBetter = buildCareerOffers({ game: base, report: better, renomme: 60, firings: 1 })
    expect(withDidBetter.some(o => o.isFormerClub)).toBe(false)
  })

  it('skärpning 1: en bättre klubb än den du lämnade kräver att du presterade', () => {
    const base = newGame(1313)
    const totalTeams = base.clubs.length
    // Bygg en tabell där de två sämst placerade klubbarna har HÖGRE rykte än
    // den klubb spelaren lämnade — då ska de bara kunna erbjudas en manager
    // som faktiskt presterade i sin gamla klubb.
    const others = base.clubs.filter(c => c.id !== base.managedClubId).slice(0, 2)
    const game: SaveGame = {
      ...base,
      clubs: base.clubs.map(c => {
        if (c.id === base.managedClubId) return { ...c, reputation: 30 }
        if (others.some(o => o.id === c.id)) return { ...c, reputation: 90, boardExpectation: ClubExpectation.ChallengeTop }
        return c
      }),
      standings: base.standings.map(s => {
        const i = others.findIndex(o => o.id === s.clubId)
        if (i >= 0) return { ...s, position: totalTeams - i }
        return s
      }),
    }
    const report: CareerBreakReport = {
      formerClubId: base.managedClubId,
      formerClubName: 'Gamla',
      positionUnderPlayer: 6,
      bestPositionUnderReplacement: 6,
      seasons: [],
      replacementCoachName: 'Efterträdaren',
      formerClubDidWorse: false,
      seasonsSimulated: 1,
      finalStandings: game.standings.map(r => ({ clubId: r.clubId, position: r.position })),
    }

    // Hög renommé men inga meriter I DEN KLUBB man lämnade ⇒ ingen bättre klubb.
    const noMerit = buildCareerOffers({ game: { ...game, seasonSummaries: [] }, report, renomme: 80, firings: 1 })
    expect(noMerit).toHaveLength(0)

    // Samma läge, men med en topphalvsplacering i den gamla klubben.
    const withMerit = buildCareerOffers({
      game: { ...game, seasonSummaries: [summary({ clubId: base.managedClubId, finalPosition: 3 })] },
      report,
      renomme: 80,
      firings: 1,
    })
    expect(withMerit.length).toBeGreaterThan(0)
  })

  it('bara klubbar ur tabellens bottenband erbjuds — aldrig en mittenklubb', () => {
    const base = newGame(1414)
    const totalTeams = base.clubs.length
    const finalStandings = base.clubs.map((c, i) => ({ clubId: c.id, position: i + 1 }))
    const report: CareerBreakReport = {
      formerClubId: base.managedClubId,
      formerClubName: 'Gamla',
      positionUnderPlayer: 6,
      bestPositionUnderReplacement: 6,
      seasons: [],
      replacementCoachName: 'X',
      formerClubDidWorse: false,
      seasonsSimulated: 1,
      finalStandings,
    }
    const vacant = findVacantClubs(base, finalStandings, [])
    const zone = vacancyZoneSize(totalTeams)
    expect(vacant.length).toBeGreaterThanOrEqual(3)
    for (const v of vacant) expect(v.position).toBeGreaterThan(totalTeams - zone)
    // Bäst placerad först: renommén styr ANTALET dörrar, inte kvaliteten på
    // den enskilda dörren.
    expect(vacant[0].position).toBeLessThan(vacant[vacant.length - 1].position)

    const offers = buildCareerOffers({ game: base, report, renomme: 60, firings: 1 })
    for (const o of offers) {
      const pos = finalStandings.find(r => r.clubId === o.clubId)!.position
      expect(pos).toBeGreaterThan(totalTeams - zone)
    }
  })
})

// ── 4. Hela kedjan ─────────────────────────────────────────────────────────

describe('O13 — hela kedjan: avsked → uppehåll → nytt jobb', () => {
  it('spelaren kan gå från en klubb till en annan utan att världen byts ut', () => {
    const base = newGame(1515)
    const fired: SaveGame = { ...base, managerFired: true, firedAtSeason: base.currentSeason }
    const { game: afterBreak } = simulateCareerBreak(fired)

    expect(afterBreak.careerBreak!.stage).toBe('season')

    // Domens ordning: erbjudandena finns beräknade men skärmen får inte visa
    // dem förrän stage är 'market'. Här verifieras bara datat.
    const offers = afterBreak.careerBreak!.offers
    if (offers.length === 0) {
      expect(afterBreak.careerBreak!.careerOver).toBe(true)
      return
    }

    const target = offers[0].clubId
    const playersBefore = afterBreak.players.length
    const resumed = switchManagedClub(afterBreak, target)

    expect(resumed.managedClubId).toBe(target)
    expect(resumed.managerFired).toBeUndefined()
    expect(resumed.players.length).toBe(playersBefore)
    expect(resumed.worldSeed).toBe(base.worldSeed)
    expect(resumed.managerProfile!.seasonsAtClub).toBe(1)
    expect(resumed.managerProfile!.clubSpells).toHaveLength(2)
  })
})
