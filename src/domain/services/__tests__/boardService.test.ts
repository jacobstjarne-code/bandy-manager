import { describe, it, expect } from 'vitest'
import { evaluateBoard, generateBoardMessage, generateSeasonVerdict, seasonReputationDelta, computeBoardPatienceUpdate, updateRunningBoardPatience, generatePreSeasonMessage, deriveBoardAssessment, BOARD_EXPECTATION_LEVEL_LABEL, boardGraceState } from '../boardService'
import { ClubExpectation } from '../../enums'
import type { Club } from '../../entities/Club'
const TOTAL = 12

// Skutskär-auditens test 2, Jacobs dom 2026-08-24: evaluateBoard läser nu
// boardPatience (samma ackumulerade värde som portalens
// getBoardPatienceZone), inte position/expectation — se boardService.ts:s
// kommentar på funktionen. De gamla position-baserade testerna (anchor-band
// per ClubExpectation) testade exakt den separata kalibrering domen
// avskaffade — ersatta av gränstester mot de nya boardPatience-trösklarna,
// satta så att de alltid faller inom samma zon som getBoardPatienceZone
// (30/50-gränserna, portal/boardPatienceZone.ts).
describe('evaluateBoard', () => {
  it('delighted vid boardPatience 80+', () => {
    expect(evaluateBoard(80).satisfaction).toBe('delighted')
    expect(evaluateBoard(100).satisfaction).toBe('delighted')
  })
  it('satisfied vid boardPatience 50-79 (portalzonen "stabilt")', () => {
    expect(evaluateBoard(50).satisfaction).toBe('satisfied')
    expect(evaluateBoard(79).satisfaction).toBe('satisfied')
  })
  it('concerned vid boardPatience 30-49 (portalzonen "under press")', () => {
    expect(evaluateBoard(30).satisfaction).toBe('concerned')
    expect(evaluateBoard(49).satisfaction).toBe('concerned')
  })
  it('unhappy vid boardPatience under 30 (portalzonen "ultimatum")', () => {
    expect(evaluateBoard(29).satisfaction).toBe('unhappy')
    expect(evaluateBoard(0).satisfaction).toBe('unhappy')
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

/**
 * H4 Heros (Jacobs dom 2026-08-25): Survive-tiern, "sistaplats är inte ett
 * misslyckande så länge klubben finns kvar" — samma tre-bandsmönster som
 * AvoidBottom, förskjutet så att sistaplats aldrig ger rating 1.
 */
describe('generateSeasonVerdict — Survive (H4 Heros)', () => {
  it('rating 3 (möter förväntan, INTE misslyckande) för sistaplats', () => {
    expect(generateSeasonVerdict(ClubExpectation.Survive, TOTAL, TOTAL).rating).toBe(3)
  })
  it('rating 4 för näst sist', () => {
    expect(generateSeasonVerdict(ClubExpectation.Survive, TOTAL - 1, TOTAL).rating).toBe(4)
  })
  it('rating 5 för allt bättre än näst sist', () => {
    expect(generateSeasonVerdict(ClubExpectation.Survive, TOTAL - 2, TOTAL).rating).toBe(5)
    expect(generateSeasonVerdict(ClubExpectation.Survive, 1, TOTAL).rating).toBe(5)
  })
  it('aldrig rating 1 eller 2 — Survive kan inte "misslyckas" på position ensamt', () => {
    for (let pos = 1; pos <= TOTAL; pos++) {
      const rating = generateSeasonVerdict(ClubExpectation.Survive, pos, TOTAL).rating
      expect(rating).toBeGreaterThanOrEqual(3)
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
    // DOM_BOARD_TALAMOD_SYSTEM_2026-09-01.md: plats 10 (1 under ankaret) är nu
    // grace för AvoidBottom — nearMiss(2) i stället för below(4). Plats 11-12
    // (den faktiska nedflyttningszonen) förblir OKLIPPT grace, se testet ovan.
    expect(computeBoardPatienceUpdate(10, TOTAL, 70, 2, AB)).toEqual({ newBoardPatience: 68, newConsecutiveFailures: 0, newMeritBuffer: 0 })  // grace: nearMiss(2) × gap(-1)
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
    // DOM_BOARD_TALAMOD_SYSTEM_2026-09-01.md: plats 2-4 är grace för WinLeague
    // (nästa tier, ChallengeTop, har ankare 4) — nearMiss(2) i stället för
    // below(5). gap = 1−2 = −1, delta = nearMiss(2) × −1 = −2.
    expect(computeBoardPatienceUpdate(2, TOTAL, 70, 0, ClubExpectation.WinLeague).newBoardPatience).toBe(68)
  })
})

describe('boardGraceState — DOM_BOARD_TALAMOD_SYSTEM_2026-09-01.md (ENDA definitionen av "nästan lyckad")', () => {
  it('WinLeague: grace exakt plats 2-4, inte plats 1 (möter) eller plats 5+ (kollaps)', () => {
    expect(boardGraceState(ClubExpectation.WinLeague, 1, TOTAL)).toBe(false)
    expect(boardGraceState(ClubExpectation.WinLeague, 2, TOTAL)).toBe(true)
    expect(boardGraceState(ClubExpectation.WinLeague, 3, TOTAL)).toBe(true)
    expect(boardGraceState(ClubExpectation.WinLeague, 4, TOTAL)).toBe(true)
    expect(boardGraceState(ClubExpectation.WinLeague, 5, TOTAL)).toBe(false)
  })

  it('ChallengeTop: grace exakt plats 5-6', () => {
    expect(boardGraceState(ClubExpectation.ChallengeTop, 4, TOTAL)).toBe(false)
    expect(boardGraceState(ClubExpectation.ChallengeTop, 5, TOTAL)).toBe(true)
    expect(boardGraceState(ClubExpectation.ChallengeTop, 6, TOTAL)).toBe(true)
    expect(boardGraceState(ClubExpectation.ChallengeTop, 7, TOTAL)).toBe(false)
  })

  it('AvoidBottom: grace ENDAST plats 10 — nedflyttningszonen (11-12) är klippt, aldrig grace', () => {
    expect(boardGraceState(ClubExpectation.AvoidBottom, 9, TOTAL)).toBe(false)
    expect(boardGraceState(ClubExpectation.AvoidBottom, 10, TOTAL)).toBe(true)
    expect(boardGraceState(ClubExpectation.AvoidBottom, 11, TOTAL)).toBe(false)
    expect(boardGraceState(ClubExpectation.AvoidBottom, 12, TOTAL)).toBe(false)
  })

  it('Survive: grace strukturellt tom på alla platser — inget golv under Survive', () => {
    for (let pos = 1; pos <= TOTAL; pos++) {
      expect(boardGraceState(ClubExpectation.Survive, pos, TOTAL)).toBe(false)
    }
  })
})

// Fjärde koefficientrundan (Jacobs dom 2026-08-23, DOM_MERITBUFFERT_2026-08-23.md,
// O5-acceptanstestets fynd: en klubb med tre raka SM-guld sparkades efter en
// normal svacka två säsonger senare). PROPOSAL — magnituderna (MERIT_BUFFER_CAP=20)
// är Codes förslag, inte Jacobs låsta dom.
/**
 * H4 Heros-uppföljning (Jacobs dom 2026-08-25): stegkedjan täckte tidigare
 * bara MidTable↔ChallengeTop↔WinLeague fullt ut. AvoidBottom kunde befordras
 * uppåt men aldrig degraderas (gated `!== AvoidBottom`), och Survive fanns
 * inte i någon gren alls — ett golv/tak en klubb aldrig kunde lämna. Nu en
 * ordnad femstegs-stege, samma ≤2/≥10-trösklar, ett steg per anrop.
 */
describe('generatePreSeasonMessage — femstegs-stegen, båda riktningar (H4 Heros-uppföljning)', () => {
  function makeClub(expectation: ClubExpectation): Club {
    return { boardExpectation: expectation } as Club
  }

  it('Survive → AvoidBottom vid topp-2 (tidigare omöjligt, Survive var inte i kedjan)', () => {
    const result = generatePreSeasonMessage(makeClub(ClubExpectation.Survive), [], 2, 0)
    expect(result.newExpectation).toBe(ClubExpectation.AvoidBottom)
  })

  it('AvoidBottom → Survive vid botten-3 (tidigare omöjligt, AvoidBottom var ett golv)', () => {
    const result = generatePreSeasonMessage(makeClub(ClubExpectation.AvoidBottom), [], 10, 0)
    expect(result.newExpectation).toBe(ClubExpectation.Survive)
  })

  it('WinLeague kan nu falla ända till AvoidBottom via tre raka dåliga säsonger', () => {
    let expectation = ClubExpectation.WinLeague
    for (let i = 0; i < 3; i++) {
      expectation = generatePreSeasonMessage(makeClub(expectation), [], 10, 0).newExpectation
    }
    expect(expectation).toBe(ClubExpectation.AvoidBottom)
  })

  it('Survive kan nu stiga ända till WinLeague via fyra raka topp-2-säsonger', () => {
    let expectation = ClubExpectation.Survive
    for (let i = 0; i < 4; i++) {
      expectation = generatePreSeasonMessage(makeClub(expectation), [], 2, 0).newExpectation
    }
    expect(expectation).toBe(ClubExpectation.WinLeague)
  })

  it('Survive vid topp-2 stannar på AvoidBottom, går inte längre på EN säsong (ett steg per anrop)', () => {
    const result = generatePreSeasonMessage(makeClub(ClubExpectation.Survive), [], 1, 0)
    expect(result.newExpectation).toBe(ClubExpectation.AvoidBottom)
    expect(result.newExpectation).not.toBe(ClubExpectation.MidTable)
  })

  it('Survive vid botten kan inte falla längre — redan golvet', () => {
    const result = generatePreSeasonMessage(makeClub(ClubExpectation.Survive), [], 12, 0)
    expect(result.newExpectation).toBe(ClubExpectation.Survive)
  })

  it('WinLeague vid topp kan inte stiga längre — redan taket', () => {
    const result = generatePreSeasonMessage(makeClub(ClubExpectation.WinLeague), [], 1, 0)
    expect(result.newExpectation).toBe(ClubExpectation.WinLeague)
  })

  it('mellanplacering (position 6): ingen förändring, oavsett tier', () => {
    for (const exp of [ClubExpectation.Survive, ClubExpectation.MidTable, ClubExpectation.WinLeague]) {
      const result = generatePreSeasonMessage(makeClub(exp), [], 6, 0)
      expect(result.newExpectation).toBe(exp)
    }
  })
})

/**
 * DOM_BOARDEXPEKTAN_TROGHET_2026-08-31.md — H5-fällan: en klubb på WinLeague
 * som håller 3:e-9:e plats fastnar för alltid (botten-3 kräver plats>=10,
 * men WinLeague-verdicten är binär — bara plats 1 "möter" den). Testerna
 * trädar consecutiveExpectationMisses mellan anrop (till skillnad från
 * describe-blocket ovan, som medvetet INTE gör det) för att simulera flera
 * säsonger i rad, precis som seasonEndProcessor.ts faktiskt gör.
 */
describe('generatePreSeasonMessage/deriveBoardAssessment — tröghets-demotering', () => {
  function makeClub(expectation: ClubExpectation, misses?: number): Club {
    return { boardExpectation: expectation, consecutiveExpectationMisses: misses } as Club
  }

  it('GODKÄNT NÄR 1: WinLeague-klubb som håller 3:e plats demoteras till ChallengeTop efter TVÅ säsonger, inte tidigare', () => {
    let club = makeClub(ClubExpectation.WinLeague)
    const r1 = generatePreSeasonMessage(club, [], 3, 0)
    expect(r1.newExpectation).toBe(ClubExpectation.WinLeague) // GODKÄNT NÄR 2: en enda svacka demoterar inte
    expect(r1.newConsecutiveExpectationMisses).toBe(1)

    club = { ...club, boardExpectation: r1.newExpectation, consecutiveExpectationMisses: r1.newConsecutiveExpectationMisses }
    const r2 = generatePreSeasonMessage(club, [], 3, 0)
    expect(r2.newExpectation).toBe(ClubExpectation.ChallengeTop) // andra raka missen → demotering
    expect(r2.newConsecutiveExpectationMisses).toBe(0) // räknaren nollställs av demoteringen
  })

  it('sparkas INTE i säsong 5 för en 3:e plats — H5-scenariot löst (klubben demoteras innan patiensen dör)', () => {
    let club = makeClub(ClubExpectation.WinLeague)
    for (let season = 0; season < 4; season++) {
      const r = generatePreSeasonMessage(club, [], 3, 0)
      club = { ...club, boardExpectation: r.newExpectation, consecutiveExpectationMisses: r.newConsecutiveExpectationMisses }
    }
    // efter fyra säsonger av 3:e plats: demoterad en gång (efter säsong 2),
    // sitter nu på ChallengeTop där plats 3 MÖTER förväntan (rating>=3 → met)
    expect(club.boardExpectation).toBe(ClubExpectation.ChallengeTop)
    expect(club.consecutiveExpectationMisses).toBe(0)
  })

  it('GODKÄNT NÄR 3: en genuint kollapsande klubb degraderas fortfarande direkt via botten-3, inte bara tröghet', () => {
    const club = makeClub(ClubExpectation.WinLeague, 1) // redan en miss från förra säsongen
    const result = generatePreSeasonMessage(club, [], 10, 0) // kollapsar till botten-3
    expect(result.newExpectation).toBe(ClubExpectation.ChallengeTop) // botten-3-vägen, ETT steg, ingen dubbel-demotering
  })

  it('GODKÄNT NÄR 4: en demoterad klubb som återhämtar sig (topp-2) re-promoveras och räknaren nollställs', () => {
    let club = makeClub(ClubExpectation.ChallengeTop, 1) // en miss ackumulerad
    const result = generatePreSeasonMessage(club, [], 2, 0) // toppresultat
    expect(result.newExpectation).toBe(ClubExpectation.WinLeague) // upp-ratchet
    expect(result.newConsecutiveExpectationMisses).toBe(0) // met/exceeded nollställer
  })

  it('GODKÄNT NÄR 5: Survive-golvet intakt — tröghet kan aldrig demotera under Survive', () => {
    const club = makeClub(ClubExpectation.Survive, 5) // hypotetiskt högt missantal
    const result = generatePreSeasonMessage(club, [], 12, 0)
    expect(result.newExpectation).toBe(ClubExpectation.Survive)
  })

  it('deriveBoardAssessment (Game Over-ytan) speglar samma tröghets-demotering och direction=lowered', () => {
    const club = makeClub(ClubExpectation.WinLeague, 1)
    const result = deriveBoardAssessment(club, 3, 2028, 12)
    expect(result.newExpectation).toBe(ClubExpectation.ChallengeTop)
    expect(result.direction).toBe('lowered')
  })
})

/**
 * Förutsättningsfasen, steg 1 (Jacobs dom 2026-08-25). deriveBoardAssessment
 * återanvänder exakt samma stege som generatePreSeasonMessage — testar
 * bara riktning/skälsrad-härledningen, inte kedjan igen (redan täckt ovan).
 */
describe('deriveBoardAssessment — Förutsättningsfasen steg 1', () => {
  function makeClub(expectation: ClubExpectation): Club {
    return { boardExpectation: expectation } as Club
  }

  it('höjd ribba: direction=raised, skälsraden är den enda beläggbara (låst text)', () => {
    const result = deriveBoardAssessment(makeClub(ClubExpectation.MidTable), 2, 2026, 12)
    expect(result.direction).toBe('raised')
    expect(result.previousExpectation).toBe(ClubExpectation.MidTable)
    expect(result.newExpectation).toBe(ClubExpectation.ChallengeTop)
    expect(result.reasonLine).toBe('Ni har visat att ni kan mer. Då begär vi mer.')
  })

  it('sänkt ribba: direction=lowered, skälsraden är den enda beläggbara (låst text)', () => {
    const result = deriveBoardAssessment(makeClub(ClubExpectation.ChallengeTop), 10, 2026, 12)
    expect(result.direction).toBe('lowered')
    expect(result.newExpectation).toBe(ClubExpectation.MidTable)
    expect(result.reasonLine).toBe('Ni tappade för mycket för att vi ska kunna kräva samma sak.')
  })

  it('oförändrad: ingen skälsrad — frånvaron av skäl är korrekt, inte en lucka', () => {
    const result = deriveBoardAssessment(makeClub(ClubExpectation.MidTable), 6, 2026, 12)
    expect(result.direction).toBe('unchanged')
    expect(result.newExpectation).toBe(ClubExpectation.MidTable)
    expect(result.reasonLine).toBeUndefined()
  })

  it('golv/tak ger unchanged, inte raised/lowered, trots kvalificerande position', () => {
    const atFloor = deriveBoardAssessment(makeClub(ClubExpectation.Survive), 12, 2026, 12)
    expect(atFloor.direction).toBe('unchanged')
    const atCeiling = deriveBoardAssessment(makeClub(ClubExpectation.WinLeague), 1, 2026, 12)
    expect(atCeiling.direction).toBe('unchanged')
  })

  it('season-fältet speglar det inskickade värdet', () => {
    const result = deriveBoardAssessment(makeClub(ClubExpectation.MidTable), 6, 2031, 12)
    expect(result.season).toBe(2031)
  })
})

describe('BOARD_EXPECTATION_LEVEL_LABEL — nivåetiketter (Förutsättningsfasen, låsta av Jacob 2026-08-25)', () => {
  it('alla fem nivåer har den låsta svenska etiketten', () => {
    expect(BOARD_EXPECTATION_LEVEL_LABEL[ClubExpectation.Survive]).toBe('Överleva')
    expect(BOARD_EXPECTATION_LEVEL_LABEL[ClubExpectation.AvoidBottom]).toBe('Undvika botten')
    expect(BOARD_EXPECTATION_LEVEL_LABEL[ClubExpectation.MidTable]).toBe('Mitten')
    expect(BOARD_EXPECTATION_LEVEL_LABEL[ClubExpectation.ChallengeTop]).toBe('Slutspel')
    expect(BOARD_EXPECTATION_LEVEL_LABEL[ClubExpectation.WinLeague]).toBe('Vinna ligan')
  })
})

describe('computeBoardPatienceUpdate — Survive (H4 Heros, 2026-08-25)', () => {
  const TOTAL = 12
  const SURVIVE = ClubExpectation.Survive  // ankare 12, slope above=1/below=4 (below oåtkomlig)

  it('sistaplats (pos=12=ankaret): patiens oförändrad, INTE ett straff — men den SEPARATA nedflyttningszons-räknaren (oberoende av expectation, Jacobs "en klubb som ändå kollapsar ska kunna kosta jobbet") tickar fortfarande', () => {
    const r = computeBoardPatienceUpdate(12, TOTAL, 70, 0, SURVIVE)
    expect(r.newBoardPatience).toBe(70)
    expect(r.newConsecutiveFailures).toBe(1)
  })

  it('bättre än sistaplats (pos=8): patiens ÖKAR, aldrig minskar', () => {
    // gap = 12-8 = 4, delta = above(1) × 4 = +4
    expect(computeBoardPatienceUpdate(8, TOTAL, 70, 0, SURVIVE).newBoardPatience).toBe(74)
  })

  it('genomgår alla positioner 1-12: patiens minskar ALDRIG under Survive', () => {
    for (let pos = 1; pos <= TOTAL; pos++) {
      const r = computeBoardPatienceUpdate(pos, TOTAL, 70, 0, SURVIVE)
      expect(r.newBoardPatience).toBeGreaterThanOrEqual(70)
    }
  })
})

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
  // H4 Heros (2026-08-25): den löpande förlustterm skalas nu mot
  // ClubExpectation — helpern behöver därför en clubs-array. MidTable
  // (multiplikator 1,0×) hålls som default så de befintliga, redan
  // etablerade förväntningarna nedan (-1.5 osv) förblir numeriskt oförändrade
  // utan att varje assertion behöver skrivas om.
  function makeGameWithLastFixture(overrides: { homeScore: number; awayScore: number; fixtureId?: string; boardPatience?: number; boardPatienceLastCountedFixtureId?: string; expectation?: ClubExpectation }) {
    return {
      managedClubId: 'club_a',
      boardPatience: overrides.boardPatience ?? 70,
      boardPatienceLastCountedFixtureId: overrides.boardPatienceLastCountedFixtureId,
      clubs: [{ id: 'club_a', boardExpectation: overrides.expectation ?? ClubExpectation.MidTable }],
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

  /**
   * H4 Heros (Jacobs dom 2026-08-25): basförlusten skalas mot ClubExpectation
   * — Survive 0,4×, AvoidBottom 0,7×, MidTable 1,0×, ChallengeTop 1,2×,
   * WinLeague 1,4×. Svit-tillägget (losingStreakSurcharge) förblir OSKALAT.
   */
  it('Survive (0,4×): basförlusten dämpad till -0,6, ingen svit', () => {
    const game = makeGameWithLastFixture({ homeScore: 0, awayScore: 1, expectation: ClubExpectation.Survive })
    expect(updateRunningBoardPatience(game, 1).boardPatience).toBe(70 - 0.6)
  })

  it('WinLeague (1,4×): basförlusten förstärkt till -2,1, ingen svit', () => {
    const game = makeGameWithLastFixture({ homeScore: 0, awayScore: 1, expectation: ClubExpectation.WinLeague })
    expect(updateRunningBoardPatience(game, 1).boardPatience).toBe(70 - 2.1)
  })

  it('Survive + förlustsvit ≥5: svit-tillägget (-8) är OSKALAT, bara basförlusten dämpas', () => {
    const game = makeGameWithLastFixture({ homeScore: 0, awayScore: 1, expectation: ClubExpectation.Survive })
    expect(updateRunningBoardPatience(game, 5).boardPatience).toBe(70 - 0.6 - 8)
  })

  it('vinst/oavgjort är OPÅVERKADE av expectation-skalan, oavsett tier', () => {
    const survive = makeGameWithLastFixture({ homeScore: 2, awayScore: 1, expectation: ClubExpectation.Survive })
    const winLeague = makeGameWithLastFixture({ homeScore: 2, awayScore: 1, expectation: ClubExpectation.WinLeague })
    expect(updateRunningBoardPatience(survive, 0).boardPatience).toBe(71)
    expect(updateRunningBoardPatience(winLeague, 0).boardPatience).toBe(71)
  })

  /**
   * DOM_BOARD_TALAMOD_SYSTEM_2026-09-01.md — löpande termen (klocka 4) läser
   * nu boardGraceState via klubbens LIVE tabellplacering (game.standings),
   * inte finalPos (okänd mitt i säsongen). Detta var rotorsaken till H5-
   * scenariot D044 inte löste: en WinLeague-klubb på 2:a-4:e plats tömdes av
   * DENNA klocka innan tröghetens säsongsslut-demotering hann fyra.
   */
  describe('grace-medveten (DOM_BOARD_TALAMOD_SYSTEM_2026-09-01.md)', () => {
    function makeGraceGame(overrides: { homeScore: number; awayScore: number; expectation: ClubExpectation; position: number; played?: number }) {
      // totalTeams läses av updateRunningBoardPatience som game.clubs.length —
      // måste vara 12 (samma fasta ligastorlek som TOTAL överallt annars i
      // denna testfil) för att boardGraceState:s nedflyttningszon-tak ska
      // klippa vid rätt plats.
      const clubs = [{ id: 'club_a', boardExpectation: overrides.expectation }, ...Array.from({ length: 11 }, (_, i) => ({ id: `club_other_${i}`, boardExpectation: ClubExpectation.MidTable }))]
      return {
        managedClubId: 'club_a',
        boardPatience: 70,
        clubs,
        standings: [{ clubId: 'club_a', position: overrides.position, played: overrides.played ?? 10 }],
        fixtures: [{
          id: 'fx1', status: 'completed', isCup: false, isKnockout: false, roundNumber: 5,
          homeClubId: 'club_a', awayClubId: 'club_b', homeScore: overrides.homeScore, awayScore: overrides.awayScore,
        }],
      } as unknown as Parameters<typeof updateRunningBoardPatience>[0]
    }

    it('WinLeague plats 3 (grace) + förlustsvit ≥5: bas OCH svit halveras', () => {
      const game = makeGraceGame({ homeScore: 0, awayScore: 1, expectation: ClubExpectation.WinLeague, position: 3 })
      // ograceat vore -1.5×1.4=-2.1 bas + -8 svit. Gracead: halva båda leden.
      expect(updateRunningBoardPatience(game, 5).boardPatience).toBe(70 - 1.05 - 4)
    })

    it('WinLeague plats 8 (kollaps, bortom grace-taket 4): fullt bled, oförändrat', () => {
      const game = makeGraceGame({ homeScore: 0, awayScore: 1, expectation: ClubExpectation.WinLeague, position: 8 })
      expect(updateRunningBoardPatience(game, 5).boardPatience).toBe(70 - 2.1 - 8)
    })

    it('WinLeague plats 1 (möter ankaret, inte grace): oförändrat', () => {
      const game = makeGraceGame({ homeScore: 0, awayScore: 1, expectation: ClubExpectation.WinLeague, position: 1 })
      expect(updateRunningBoardPatience(game, 1).boardPatience).toBe(70 - 2.1)
    })

    it('played=0 (alfabetisk skuggposition vid säsongsstart, trainerArcService-mönstret): aldrig grace oavsett position', () => {
      const game = makeGraceGame({ homeScore: 0, awayScore: 1, expectation: ClubExpectation.WinLeague, position: 3, played: 0 })
      expect(updateRunningBoardPatience(game, 1).boardPatience).toBe(70 - 2.1)
    })
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
