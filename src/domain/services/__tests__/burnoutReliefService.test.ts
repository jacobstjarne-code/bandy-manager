/**
 * O4 (DOM_BURNOUT_2026-08-17.md, Jacobs dom 2026-08-23) — burnoutkortet
 * hade ingen gameplay-effekt. Två delar testade här: informationskvaliteten
 * (taktikrekommendationens uteblivande, deterministisk) och burnoutRelief-
 * eventets tre handlingar (text/effekt-struktur).
 */
import { describe, it, expect } from 'vitest'
import {
  getBurnoutTacticSuppression,
  suppressTacticRecommendation,
  generateBurnoutReliefEvent,
  burnoutEffectSeed,
  pickBurnoutQuoteIndex,
  pickBurnoutHelperIndex,
  BURNOUT_QUOTE_PREFIX,
} from '../burnoutReliefService'
import type { ManagerProfile } from '../../entities/ManagerProfile'
import type { OpponentAnalysis } from '../opponentAnalysisService'
import { TacticMentality, TacticPress } from '../../enums'

function makeProfile(burnoutScore: number): ManagerProfile {
  return {
    firstName: 'Test', lastName: 'Manager', age: 45, hometown: 'Edsbyn',
    burnoutScore, burnoutHistory: [], careerWins: 0, careerDraws: 0, careerLosses: 0,
    seasonsAtClub: 1, contractUntilSeason: 3, monthlySalary: 40, coachRivalries: [],
  }
}

describe('getBurnoutTacticSuppression', () => {
  it('frisk-zon (< 40) undertrycker aldrig, oavsett seed', () => {
    const profile = makeProfile(10)
    for (let seed = 0; seed < 20; seed++) {
      expect(getBurnoutTacticSuppression(profile, seed)).toBe(false)
    }
  })

  it('ingen profil (undefined) → aldrig undertryckt', () => {
    expect(getBurnoutTacticSuppression(undefined, 42)).toBe(false)
  })

  it('markbar/hög-zon undertrycker ibland, inte aldrig och inte alltid, över många seeds', () => {
    const markbar = makeProfile(50)
    const hog = makeProfile(90)
    const markbarResults = Array.from({ length: 200 }, (_, i) => getBurnoutTacticSuppression(markbar, i))
    const hogResults = Array.from({ length: 200 }, (_, i) => getBurnoutTacticSuppression(hog, i))
    expect(markbarResults.some(v => v)).toBe(true)
    expect(markbarResults.some(v => !v)).toBe(true)
    expect(hogResults.some(v => v)).toBe(true)
    expect(hogResults.some(v => !v)).toBe(true)
  })

  it('hög-zon undertrycker oftare än markbar-zon ("uteblir oftare", domen)', () => {
    const markbar = makeProfile(50)
    const hog = makeProfile(90)
    const n = 2000
    const markbarRate = Array.from({ length: n }, (_, i) => getBurnoutTacticSuppression(markbar, i)).filter(Boolean).length / n
    const hogRate = Array.from({ length: n }, (_, i) => getBurnoutTacticSuppression(hog, i)).filter(Boolean).length / n
    expect(hogRate).toBeGreaterThan(markbarRate)
  })

  it('samma profil + samma seed → samma svar (deterministiskt, inte Math.random)', () => {
    const profile = makeProfile(90)
    const a = getBurnoutTacticSuppression(profile, 123)
    const b = getBurnoutTacticSuppression(profile, 123)
    expect(a).toBe(b)
  })
})

describe('burnoutEffectSeed', () => {
  it('samma säsong+omgång → samma seed (TaktikScreen/SquadScreen måste komma överens)', () => {
    expect(burnoutEffectSeed({ currentSeason: 3, currentMatchday: 12 }))
      .toBe(burnoutEffectSeed({ currentSeason: 3, currentMatchday: 12 }))
  })

  it('olika omgång → olika seed', () => {
    expect(burnoutEffectSeed({ currentSeason: 3, currentMatchday: 12 }))
      .not.toBe(burnoutEffectSeed({ currentSeason: 3, currentMatchday: 13 }))
  })
})

describe('suppressTacticRecommendation', () => {
  function makeAnalysis(): OpponentAnalysis {
    return {
      level: 'detailed',
      keyPlayers: [{ playerId: 'p1', name: 'Test Testsson', position: 'Forward', estimatedCA: 70 }],
      suggestedMentality: TacticMentality.Attacking,
      suggestedPress: TacticPress.High,
    } as OpponentAnalysis
  }

  it('nollställer bara suggestedMentality/suggestedPress, resten orört', () => {
    const analysis = makeAnalysis()
    const suppressed = suppressTacticRecommendation(analysis)
    expect(suppressed?.suggestedMentality).toBeUndefined()
    expect(suppressed?.suggestedPress).toBeUndefined()
    expect(suppressed?.keyPlayers).toEqual(analysis.keyPlayers)
    expect(suppressed?.level).toBe('detailed')
  })

  it('undefined analysis → undefined tillbaka (ingen krasch)', () => {
    expect(suppressTacticRecommendation(undefined)).toBeUndefined()
  })
})

describe('generateBurnoutReliefEvent', () => {
  it('markbar-zon: rätt titel (BURNOUT_ZONE_LABELS) och rätt kroppstext (domens exakta ord)', () => {
    const event = generateBurnoutReliefEvent(10, 3, 'markbar')
    expect(event.title).toBe('Märkbar')
    expect(event.body).toBe('Du hinner inte förbereda som du vill. Det märks på vad du ser.')
  })

  it('hög-zon: rätt titel och rätt kroppstext', () => {
    const event = generateBurnoutReliefEvent(10, 3, 'hog')
    expect(event.title).toBe('Hög')
    expect(event.body).toBe('Du läser inte rapporterna längre. Du bläddrar förbi dem.')
  })

  it('tre val med domens exakta etiketter och citat', () => {
    const event = generateBurnoutReliefEvent(10, 3, 'hog')
    expect(event.choices).toHaveLength(3)
    expect(event.choices.map(c => c.label)).toEqual([
      'Låt assistenten ta pressen',
      'Sänk tempot på träningen',
      'Be styrelsen om andrum',
    ])
    expect(event.choices[0].subtitle).toBe('Han säger det du hade sagt. Ungefär.')
    expect(event.choices[1].subtitle).toBe('Laget vilar. Utvecklingen väntar.')
    expect(event.choices[2].subtitle).toBe('De lyssnar. De räknar också.')
  })

  it('delegera-valet sänker burnout OCH journalistRelationship (multiEffect)', () => {
    const event = generateBurnoutReliefEvent(10, 3, 'hog')
    const sub = JSON.parse(event.choices[0].effect.subEffects!)
    expect(sub).toEqual([
      { type: 'reduceBurnout', amount: -12 },
      { type: 'journalistRelationship', amount: -10 },
    ])
  })

  it('träningsvalet sänker burnout OCH startar en träningssaktmatta (multiEffect)', () => {
    const event = generateBurnoutReliefEvent(10, 3, 'hog')
    const sub = JSON.parse(event.choices[1].effect.subEffects!)
    expect(sub).toEqual([
      { type: 'reduceBurnout', amount: -15 },
      { type: 'startTrainingSlowdown', amount: 4 },
    ])
  })

  it('styrelsevalet sänker burnout MEST OCH kostar boardPatience (multiEffect)', () => {
    const event = generateBurnoutReliefEvent(10, 3, 'hog')
    const sub = JSON.parse(event.choices[2].effect.subEffects!)
    expect(sub).toEqual([
      { type: 'reduceBurnout', amount: -25 },
      { type: 'boardPatience', amount: -10 },
    ])
    // "sjunker mest" (domen) — styrelsevalets burnout-sänkning ska vara
    // störst i absoluta tal av de tre.
    const delegateSub = JSON.parse(event.choices[0].effect.subEffects!)
    const trainSub = JSON.parse(event.choices[1].effect.subEffects!)
    expect(Math.abs(sub[0].amount)).toBeGreaterThan(Math.abs(delegateSub[0].amount))
    expect(Math.abs(sub[0].amount)).toBeGreaterThan(Math.abs(trainSub[0].amount))
  })

  it('event-typ är burnoutRelief, aldrig löst (resolved: false), inget sender-fält', () => {
    const event = generateBurnoutReliefEvent(10, 3, 'markbar')
    expect(event.type).toBe('burnoutRelief')
    expect(event.resolved).toBe(false)
    expect(event.sender).toBeUndefined()
  })

  it('id är unikt per säsong+omgång', () => {
    const a = generateBurnoutReliefEvent(10, 3, 'hog')
    const b = generateBurnoutReliefEvent(11, 3, 'hog')
    expect(a.id).not.toBe(b.id)
  })
})

/**
 * A-H4a (SEXSÄSONGSAUDITEN 2026-08-26): BurnoutMark.tsx:s gamla
 * `round % quotes.length` hade ingen koll mot vad som redan visats — en
 * envis burnoutzon lät den lilla poolen (5 citat/zon) cykla och kännas som
 * tapet. pickBurnoutQuoteIndex/pickBurnoutHelperIndex läser narrativeBeatLog
 * med no-repeat INOM säsongen (managerKaraktarText.ts:s egen dokumenterade
 * målbild, aldrig byggd förrän nu).
 */
describe('pickBurnoutQuoteIndex — no-repeat inom säsongen', () => {
  const baseGame = { currentSeason: 3, currentMatchday: 10, narrativeBeatLog: undefined }

  it('utan logg: deterministiskt via tie-break (matchday)', () => {
    const idx = pickBurnoutQuoteIndex(baseGame, 'markbar', 5)
    expect(idx).toBe(10 % 5)
  })

  it('citat 0 redan visat DENNA säsong — väljer ett annat', () => {
    const game = {
      ...baseGame,
      narrativeBeatLog: [{ semanticKey: `${BURNOUT_QUOTE_PREFIX}markbar_${10 % 5}`, season: 3, round: 5 }],
    }
    const idx = pickBurnoutQuoteIndex(game, 'markbar', 5)
    expect(idx).not.toBe(10 % 5)
  })

  it('citatet visades en TIDIGARE säsong — inte på cooldown, kan väljas igen', () => {
    const game = {
      ...baseGame,
      narrativeBeatLog: [{ semanticKey: `${BURNOUT_QUOTE_PREFIX}markbar_${10 % 5}`, season: 1, round: 5 }],
    }
    const idx = pickBurnoutQuoteIndex(game, 'markbar', 5)
    expect(idx).toBe(10 % 5)
  })

  it('markbar och hög delar aldrig cooldown-utrymme (skilda semanticKeys per zon)', () => {
    const game = {
      ...baseGame,
      narrativeBeatLog: [{ semanticKey: `${BURNOUT_QUOTE_PREFIX}markbar_${10 % 5}`, season: 3, round: 5 }],
    }
    const idx = pickBurnoutQuoteIndex(game, 'hog', 5)
    expect(idx).toBe(10 % 5) // hög-poolen opåverkad av markbar-poolens cooldown
  })

  it('pickBurnoutHelperIndex fungerar oberoende av quote-indexet (egen prefix)', () => {
    const idx = pickBurnoutHelperIndex(baseGame, 'hog', 2)
    expect(idx).toBeGreaterThanOrEqual(0)
    expect(idx).toBeLessThan(2)
  })
})
