import { describe, it, expect } from 'vitest'
import { evaluateBoard, generateBoardMessage, generateSeasonVerdict, seasonReputationDelta, computeBoardPatienceUpdate, updateRunningBoardPatience } from '../boardService'
import { ClubExpectation } from '../../enums'
import type { StandingRow } from '../../entities/SaveGame'

function makeStanding(position: number): StandingRow {
  return { clubId: 'c1', played: 10, wins: 5, draws: 1, losses: 4, goalsFor: 20, goalsAgainst: 18, goalDifference: 2, points: 16, position }
}

const TOTAL = 12
const TOTAL_ROUNDS = 22

describe('evaluateBoard', () => {
  describe('WinLeague', () => {
    it('delighted at top 2', () => {
      expect(evaluateBoard(ClubExpectation.WinLeague, makeStanding(1), TOTAL, 14, TOTAL_ROUNDS).satisfaction).toBe('delighted')
      expect(evaluateBoard(ClubExpectation.WinLeague, makeStanding(2), TOTAL, 14, TOTAL_ROUNDS).satisfaction).toBe('delighted')
    })
    it('satisfied at position 3-4 late season', () => {
      expect(evaluateBoard(ClubExpectation.WinLeague, makeStanding(4), TOTAL, 20, TOTAL_ROUNDS).satisfaction).toBe('satisfied')
    })
    it('concerned at 5-6 late season', () => {
      expect(evaluateBoard(ClubExpectation.WinLeague, makeStanding(6), TOTAL, 20, TOTAL_ROUNDS).satisfaction).toBe('concerned')
    })
    it('unhappy deep in table late season', () => {
      expect(evaluateBoard(ClubExpectation.WinLeague, makeStanding(9), TOTAL, 20, TOTAL_ROUNDS).satisfaction).toBe('unhappy')
    })
    it('more lenient early season', () => {
      // Position 6 early should not be unhappy yet
      const early = evaluateBoard(ClubExpectation.WinLeague, makeStanding(6), TOTAL, 5, TOTAL_ROUNDS).satisfaction
      expect(early).not.toBe('unhappy')
    })
  })

  describe('ChallengeTop', () => {
    it('delighted top 3', () => {
      expect(evaluateBoard(ClubExpectation.ChallengeTop, makeStanding(3), TOTAL, 14, TOTAL_ROUNDS).satisfaction).toBe('delighted')
    })
    it('satisfied at 4-6', () => {
      expect(evaluateBoard(ClubExpectation.ChallengeTop, makeStanding(5), TOTAL, 14, TOTAL_ROUNDS).satisfaction).toBe('satisfied')
    })
    it('unhappy at bottom late season', () => {
      expect(evaluateBoard(ClubExpectation.ChallengeTop, makeStanding(11), TOTAL, 20, TOTAL_ROUNDS).satisfaction).toBe('unhappy')
    })
  })

  describe('MidTable', () => {
    it('delighted in mid range 4-8', () => {
      expect(evaluateBoard(ClubExpectation.MidTable, makeStanding(6), TOTAL, 14, TOTAL_ROUNDS).satisfaction).toBe('delighted')
    })
    it('satisfied slightly outside mid range', () => {
      expect(evaluateBoard(ClubExpectation.MidTable, makeStanding(9), TOTAL, 14, TOTAL_ROUNDS).satisfaction).toBe('satisfied')
    })
  })

  describe('AvoidBottom', () => {
    it('delighted well clear of bottom', () => {
      expect(evaluateBoard(ClubExpectation.AvoidBottom, makeStanding(5), TOTAL, 14, TOTAL_ROUNDS).satisfaction).toBe('delighted')
    })
    it('unhappy at very bottom late season', () => {
      expect(evaluateBoard(ClubExpectation.AvoidBottom, makeStanding(12), TOTAL, 20, TOTAL_ROUNDS).satisfaction).toBe('unhappy')
    })
    // U1 (SLUTTEST_KO.md, 2026-08-17): RELEGATION_ZONE_SIZE=2 — plats 11 (näst
    // sist av 12) ska läsa som 'unhappy', inte bara 'concerned'. Tidigare var
    // bara den absolut sista platsen 'unhappy', vilket var kärnan i U1-fyndet
    // (en klubb kunde ligga näst sist utan att styrelsen brydde sig).
    it('näst sist (i den faktiska nedflyttningszonen) är också unhappy, inte bara concerned', () => {
      expect(evaluateBoard(ClubExpectation.AvoidBottom, makeStanding(11), TOTAL, 20, TOTAL_ROUNDS).satisfaction).toBe('unhappy')
    })
  })
})

describe('generateBoardMessage', () => {
  const satisfactions = ['delighted', 'satisfied', 'concerned', 'unhappy'] as const
  for (const s of satisfactions) {
    it(`returns non-empty title+body for ${s}`, () => {
      const { title, body } = generateBoardMessage({ satisfaction: s, message: '' }, 'Test BK', 14)
      expect(title.length).toBeGreaterThan(0)
      expect(body.length).toBeGreaterThan(0)
    })
  }
})

describe('generateSeasonVerdict', () => {
  it('rating 5 for WinLeague champion', () => {
    expect(generateSeasonVerdict(ClubExpectation.WinLeague, 1, TOTAL).rating).toBe(5)
  })
  it('rating 1 for WinLeague finishing last', () => {
    expect(generateSeasonVerdict(ClubExpectation.WinLeague, TOTAL, TOTAL).rating).toBe(1)
  })
  it('rating 4 for ChallengeTop at position 3', () => {
    expect(generateSeasonVerdict(ClubExpectation.ChallengeTop, 3, TOTAL).rating).toBe(4)
  })
  it('rating 1 for AvoidBottom finishing last', () => {
    expect(generateSeasonVerdict(ClubExpectation.AvoidBottom, TOTAL, TOTAL).rating).toBe(1)
  })
  it('all verdicts have non-empty title and body', () => {
    for (let pos = 1; pos <= TOTAL; pos++) {
      const v = generateSeasonVerdict(ClubExpectation.MidTable, pos, TOTAL)
      expect(v.title.length).toBeGreaterThan(0)
      expect(v.body.length).toBeGreaterThan(0)
      expect([1, 2, 3, 4, 5]).toContain(v.rating)
    }
  })
})

describe('computeBoardPatienceUpdate — U1 andra halvan (Jacobs dom 2026-08-22, efter Skutskär-auditen)', () => {
  const TOTAL = 12  // RELEGATION_ZONE_SIZE=2 → zon = plats 11-12
  const AB = ClubExpectation.AvoidBottom  // ankare 9, slope above=2/below=4

  it('nedflyttningszonen (plats 11-12): newConsecutiveFailures oförändrad logik (+1 per säsong i zonen)', () => {
    expect(computeBoardPatienceUpdate(11, TOTAL, 70, 0, AB)).toEqual({ newBoardPatience: 62, newConsecutiveFailures: 1, newMeritBuffer: 0 })
    expect(computeBoardPatienceUpdate(12, TOTAL, 70, 2, AB)).toEqual({ newBoardPatience: 58, newConsecutiveFailures: 3, newMeritBuffer: 0 })
  })

  it('varningszonen (plats 9-10): kontinuerlig, inte längre en fast -5', () => {
    expect(computeBoardPatienceUpdate(9, TOTAL, 70, 2, AB)).toEqual({ newBoardPatience: 70, newConsecutiveFailures: 0, newMeritBuffer: 0 })   // pos == ankare → delta 0
    expect(computeBoardPatienceUpdate(10, TOTAL, 70, 2, AB)).toEqual({ newBoardPatience: 66, newConsecutiveFailures: 0, newMeritBuffer: 0 })  // 1 under ankaret × below(4)
  })

  it('DÖDZONEN ÄR BORTA — plats 6 (tidigare noll effekt) rör nu siffran, AvoidBottom-klubb belönas för att slå ankaret', () => {
    // gap = ankare(9) − pos(6) = 3, delta = above(2) × 3 = +6 — INTE längre 0
    expect(computeBoardPatienceUpdate(6, TOTAL, 70, 3, AB)).toEqual({ newBoardPatience: 76, newConsecutiveFailures: 0, newMeritBuffer: 6 })
  })

  it('topp (plats 1): kontinuerlig above-lutning, inte en fast +20', () => {
    // gap = 9−1 = 8, delta = 2×8 = 16
    expect(computeBoardPatienceUpdate(1, TOTAL, 70, 0, AB).newBoardPatience).toBe(86)
  })

  it('plats 3: gap=6, delta=2×6=12', () => {
    expect(computeBoardPatienceUpdate(3, TOTAL, 70, 0, AB).newBoardPatience).toBe(82)
  })

  it('patience clampas till [0, 100]', () => {
    expect(computeBoardPatienceUpdate(1, TOTAL, 95, 0, AB).newBoardPatience).toBe(100)
    expect(computeBoardPatienceUpdate(12, TOTAL, 10, 0, AB).newBoardPatience).toBe(0)
  })

  it('boardExpectation-medveten: samma plats 8 läses olika för AvoidBottom vs ChallengeTop', () => {
    // AvoidBottom (ankare 9): gap=1, delta=above(2)×1=+2
    expect(computeBoardPatienceUpdate(8, TOTAL, 70, 0, ClubExpectation.AvoidBottom).newBoardPatience).toBe(72)
    // ChallengeTop (ankare 4): gap=4−8=−4, delta=below(4)×−4=−16
    expect(computeBoardPatienceUpdate(8, TOTAL, 70, 0, ClubExpectation.ChallengeTop).newBoardPatience).toBe(54)
  })

  it('WinLeague: ankare 1, above=0 (går inte att slå), below=5', () => {
    expect(computeBoardPatienceUpdate(1, TOTAL, 70, 0, ClubExpectation.WinLeague).newBoardPatience).toBe(70)
    // gap = 1−2 = −1, delta = 5×−1 = −5
    expect(computeBoardPatienceUpdate(2, TOTAL, 70, 0, ClubExpectation.WinLeague).newBoardPatience).toBe(65)
  })
})

// Fjärde koefficientrundan (Jacobs dom 2026-08-23, DOM_MERITBUFFERT_2026-08-23.md,
// O5-acceptanstestets fynd: en klubb med tre raka SM-guld sparkades efter en
// normal svacka två säsonger senare). PROPOSAL — magnituderna (MERIT_BUFFER_CAP=20)
// är Codes förslag, inte Jacobs låsta dom.
describe('computeBoardPatienceUpdate — meritbuffert (fjärde koefficientrundan, 2026-08-23)', () => {
  const TOTAL = 12
  const CT = ClubExpectation.ChallengeTop  // ankare 4, above=2.5, below=4

  it('god säsong (gap>=0) bankar kredit UTAN att sänka den direkta vinsten', () => {
    // plats 1: gap=3, delta=above(2.5)×3=7.5
    const result = computeBoardPatienceUpdate(1, TOTAL, 70, 0, CT, 0)
    expect(result.newBoardPatience).toBe(77.5)
    expect(result.newMeritBuffer).toBe(7.5)
  })

  it('krediten kapas vid MERIT_BUFFER_CAP (20)', () => {
    // Redan 18 i banken, ny god säsong tjänar in 7.5 → hade blivit 25.5, kapas till 20
    const result = computeBoardPatienceUpdate(1, TOTAL, 70, 0, CT, 18)
    expect(result.newMeritBuffer).toBe(20)
  })

  it('dålig säsong förbrukar krediten FÖRST — patiensen orörd om krediten räcker', () => {
    // plats 8: gap=4−8=−4, delta=below(4)×−4=−16. Buffer 20 räcker.
    const result = computeBoardPatienceUpdate(8, TOTAL, 70, 0, CT, 20)
    expect(result.newBoardPatience).toBe(70)  // helt skyddad
    expect(result.newMeritBuffer).toBe(4)     // 20 − 16 absorberat
  })

  it('dålig säsong med otillräcklig kredit — resten drar patiensen, som förut', () => {
    // Buffer 10, behov 16 → 10 absorberas, resterande −6 drar patiensen
    const result = computeBoardPatienceUpdate(8, TOTAL, 70, 0, CT, 10)
    expect(result.newBoardPatience).toBe(64)
    expect(result.newMeritBuffer).toBe(0)
  })

  it('utan buffert (0) beter sig EXAKT som innan fixet — ingen regression för klubbar utan historik', () => {
    const result = computeBoardPatienceUpdate(8, TOTAL, 70, 0, CT, 0)
    expect(result.newBoardPatience).toBe(54)  // samma som testet ovan ("boardExpectation-medveten")
    expect(result.newMeritBuffer).toBe(0)
  })

  it('seed 70014-scenariot (O5-acceptanstestet): tre raka SM-guld, sedan en 8:e-plats — patiensen ska INTE krascha', () => {
    let patience = 70
    let buffer = 0
    // Tre säsonger plats 1 (gap=3, delta=+7.5 var)
    for (let i = 0; i < 3; i++) {
      const r = computeBoardPatienceUpdate(1, TOTAL, patience, 0, CT, buffer)
      patience = r.newBoardPatience
      buffer = r.newMeritBuffer
    }
    expect(buffer).toBe(20)  // 7.5×3=22.5, kapat till 20
    // Säsong 4: plats 8 (gap=−4, delta=−16)
    const crash = computeBoardPatienceUpdate(8, TOTAL, patience, 0, CT, buffer)
    expect(crash.newBoardPatience).toBe(patience)  // oförändrad — hela smällen absorberad
    expect(crash.newMeritBuffer).toBe(4)
  })
})

// Femte koefficientrundan (Jacobs dom 2026-08-23, O5_FEMTE_PASSET_AVSKEDSDIAGNOS_
// 2026-08-23.md): bufferten utökad till HELA säsongsslutstermen — position OCH
// objektivkostnad (bufferEligibleObjectiveDelta) tillsammans, inte bara position.
describe('computeBoardPatienceUpdate — meritbuffert täcker position+objektiv (femte koefficientrundan, 2026-08-23)', () => {
  const TOTAL = 12
  const CT = ClubExpectation.ChallengeTop  // ankare 4, above=2.5, below=4

  it('objektivkostnad bankas i bufferten precis som position, om delen är positiv', () => {
    // plats 4 (på ankaret, positionsdelta=0) + objektiv +3 (ett möte) → delta=+3
    const result = computeBoardPatienceUpdate(4, TOTAL, 70, 0, CT, 0, 3)
    expect(result.newBoardPatience).toBe(73)
    expect(result.newMeritBuffer).toBe(3)
  })

  it('objektivkostnad förbrukar bufferten precis som position, om delen är negativ — position exakt på ankaret bevisar att kostnaden är REN objektiv (samma bevisform som seed 70000 säsong 3 i diagnosen)', () => {
    // plats 4 (positionsdelta=0) + objektiv -12 (flera missade uppdrag) → delta=-12. Buffer 20 räcker.
    const result = computeBoardPatienceUpdate(4, TOTAL, 70, 0, CT, 20, -12)
    expect(result.newBoardPatience).toBe(70)  // helt skyddad — ren objektivkostnad absorberad
    expect(result.newMeritBuffer).toBe(8)     // 20 - 12
  })

  it('position+objektiv SUMMERAS innan buffer-logiken — en dålig position kan kvittas av goda objektiv och tvärtom', () => {
    // plats 8 (gap=-4, positionDelta=-16) + objektiv +20 (flera möten) → summa +4, netto POSITIVT
    const result = computeBoardPatienceUpdate(8, TOTAL, 70, 0, CT, 0, 20)
    expect(result.newBoardPatience).toBe(74)  // 70 + 4
    expect(result.newMeritBuffer).toBe(4)     // positiv summa bankas
  })

  it('Jacobs villkor 1 — golvet är noll, ALDRIG ett plus: stor buffert kan inte göra en dålig säsong till en bra', () => {
    // plats 8 (positionDelta=-16) + objektiv -4 → summa -20. Buffer 100 (hypotetiskt stor).
    const result = computeBoardPatienceUpdate(8, TOTAL, 70, 0, CT, 100, -4)
    expect(result.newBoardPatience).toBe(70)  // neutral — INTE 90 eller högre
    expect(result.newMeritBuffer).toBe(80)    // 100 - 20 absorberat, aldrig mer än vad som behövdes
  })

  it('samma räkneexempel som O5_FEMTE_PASSET_AVSKEDSDIAGNOS_2026-08-23.md — seed 70000 säsong 3: position på ankaret, hela smällen är objektiv', () => {
    // pos=4 → positionDelta=0. Diagnosen observerade säsongsslut+objektiv=-12.0 den säsongen.
    const result = computeBoardPatienceUpdate(4, TOTAL, 87, 0, CT, 0, -12)
    expect(result.newBoardPatience).toBe(75)  // 87 - 12, ingen buffert fanns att skydda med
  })
})

describe('updateRunningBoardPatience — U1 andra halvan, ändring 1+2 (Jacobs dom 2026-08-22)', () => {
  function makeGameWithLastFixture(overrides: { homeScore: number; awayScore: number; fixtureId?: string; boardPatience?: number; boardPatienceLastCountedFixtureId?: string }) {
    return {
      managedClubId: 'club_a',
      boardPatience: overrides.boardPatience ?? 70,
      boardPatienceLastCountedFixtureId: overrides.boardPatienceLastCountedFixtureId,
      fixtures: [{
        id: overrides.fixtureId ?? 'fx1',
        status: 'completed',
        isCup: false,
        roundNumber: 5,
        homeClubId: 'club_a',
        awayClubId: 'club_b',
        homeScore: overrides.homeScore,
        awayScore: overrides.awayScore,
      }],
    } as unknown as Parameters<typeof updateRunningBoardPatience>[0]
  }

  it('vinst: +1.0', () => {
    const game = makeGameWithLastFixture({ homeScore: 2, awayScore: 1 })
    expect(updateRunningBoardPatience(game, 0)).toEqual({ boardPatience: 71, boardPatienceLastCountedFixtureId: 'fx1' })
  })

  it('oavgjort: +0.5', () => {
    const game = makeGameWithLastFixture({ homeScore: 1, awayScore: 1 })
    expect(updateRunningBoardPatience(game, 0)).toEqual({ boardPatience: 70.5, boardPatienceLastCountedFixtureId: 'fx1' })
  })

  it('förlust utan svit: -1.5, inget tillägg', () => {
    const game = makeGameWithLastFixture({ homeScore: 0, awayScore: 1 })
    expect(updateRunningBoardPatience(game, 1)).toEqual({ boardPatience: 68.5, boardPatienceLastCountedFixtureId: 'fx1' })
  })

  it('förlustsvit 3-4: extra -3 ovanpå bas-förlusten', () => {
    const game = makeGameWithLastFixture({ homeScore: 0, awayScore: 1 })
    expect(updateRunningBoardPatience(game, 3).boardPatience).toBe(70 - 1.5 - 3)
  })

  it('förlustsvit ≥5: extra -8 ovanpå bas-förlusten — den bärande signalen', () => {
    const game = makeGameWithLastFixture({ homeScore: 0, awayScore: 1 })
    expect(updateRunningBoardPatience(game, 5).boardPatience).toBe(70 - 1.5 - 8)
  })

  it('TAK (Jacobs koefficientdom 2026-08-23): förlustsvit 6 — tillägget utgår, bara bas-förlusten kvar', () => {
    const game = makeGameWithLastFixture({ homeScore: 0, awayScore: 1 })
    expect(updateRunningBoardPatience(game, 6).boardPatience).toBe(70 - 1.5)
  })

  it('TAK: förlustsvit 16 (verklig längd ur Grind 1 v3-stresstestet) — samma delta som svit 6, ingen ytterligare eskalering', () => {
    const game = makeGameWithLastFixture({ homeScore: 0, awayScore: 1 })
    expect(updateRunningBoardPatience(game, 16).boardPatience).toBe(70 - 1.5)
  })

  it('samma fixture räknas inte två gånger (idempotens, samma mönster som trainerArc.lastCountedFixtureId)', () => {
    const game = makeGameWithLastFixture({ homeScore: 2, awayScore: 1, boardPatienceLastCountedFixtureId: 'fx1' })
    expect(updateRunningBoardPatience(game, 0)).toEqual({ boardPatience: 70, boardPatienceLastCountedFixtureId: 'fx1' })
  })

  it('klämd till [0, 100]', () => {
    const game = makeGameWithLastFixture({ homeScore: 0, awayScore: 1, boardPatience: 1 })
    expect(updateRunningBoardPatience(game, 5).boardPatience).toBe(0)
  })
})

describe('seasonReputationDelta — U6 (SLUTTEST_KO.md, 2026-08-17) / D028', () => {
  it('exakt formeln från D028', () => {
    expect(seasonReputationDelta(1)).toBe(-6)
    expect(seasonReputationDelta(2)).toBe(-3)
    expect(seasonReputationDelta(3)).toBe(0)
    expect(seasonReputationDelta(4)).toBe(2)
    expect(seasonReputationDelta(5)).toBe(4)
  })

  it('understiger skandalstraffet i magnitud (proportion mot befintligt mönster)', () => {
    const SCANDAL_MIN_PENALTY = 5  // scandalService.ts: fundraiser_vanished/coach_meltdown, −8 till −5
    expect(Math.abs(seasonReputationDelta(1))).toBeLessThan(SCANDAL_MIN_PENALTY + 3)
  })

  it('bara rating 4-5 ger positivt delta, bara 1-2 ger negativt, 3 är neutralt', () => {
    expect(seasonReputationDelta(3)).toBe(0)
    expect(seasonReputationDelta(1)).toBeLessThan(0)
    expect(seasonReputationDelta(2)).toBeLessThan(0)
    expect(seasonReputationDelta(4)).toBeGreaterThan(0)
    expect(seasonReputationDelta(5)).toBeGreaterThan(0)
  })
})
