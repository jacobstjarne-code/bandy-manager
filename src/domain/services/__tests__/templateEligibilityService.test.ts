import { describe, it, expect } from 'vitest'
import { isTemplateEligible, filterEligible, type EligibilityContext, type TemplateEligibility } from '../templateEligibilityService'

/**
 * HIGH 7 (audit 2026-08-29) — grundtester för den generiska eligibility-
 * kontrollen. pressConferenceService.ts har sina egna, konkreta regressions-
 * tester (pressConferenceEligibility.test.ts) för de faktiska buggarna;
 * det här är modulens egna kontraktstest, pool-agnostiskt.
 */
function baseCtx(overrides: Partial<EligibilityContext> = {}): EligibilityContext {
  return {
    competition: 'league',
    homeAway: 'home',
    phase: 'in_season',
    result: 'win',
    isDerby: false,
    isFinal: false,
    trailedAtHalf: false,
    ...overrides,
  }
}

describe('isTemplateEligible', () => {
  it('en mall utan eligibility-fält är eligible överallt (bakåtkompatibel)', () => {
    expect(isTemplateEligible(undefined, baseCtx())).toBe(true)
    expect(isTemplateEligible(undefined, baseCtx({ result: 'loss', homeAway: 'away', isDerby: true }))).toBe(true)
  })

  it('competition: matchar bara angiven tävlingstyp, "any" matchar allt', () => {
    const cupOnly: TemplateEligibility = { competition: 'cup' }
    expect(isTemplateEligible(cupOnly, baseCtx({ competition: 'cup' }))).toBe(true)
    expect(isTemplateEligible(cupOnly, baseCtx({ competition: 'league' }))).toBe(false)
    expect(isTemplateEligible(cupOnly, baseCtx({ competition: 'playoff' }))).toBe(false)
    expect(isTemplateEligible({ competition: 'any' }, baseCtx({ competition: 'playoff' }))).toBe(true)
  })

  it('homeAway: matchar bara angiven sida', () => {
    const homeOnly: TemplateEligibility = { homeAway: 'home' }
    expect(isTemplateEligible(homeOnly, baseCtx({ homeAway: 'home' }))).toBe(true)
    expect(isTemplateEligible(homeOnly, baseCtx({ homeAway: 'away' }))).toBe(false)
  })

  it('result: matchar bara angivet utfall', () => {
    const lossOnly: TemplateEligibility = { result: 'loss' }
    expect(isTemplateEligible(lossOnly, baseCtx({ result: 'loss' }))).toBe(true)
    expect(isTemplateEligible(lossOnly, baseCtx({ result: 'win' }))).toBe(false)
    expect(isTemplateEligible(lossOnly, baseCtx({ result: 'draw' }))).toBe(false)
  })

  it('phase: matchar bara angiven säsongsfas', () => {
    const seasonOverOnly: TemplateEligibility = { phase: 'season_over' }
    expect(isTemplateEligible(seasonOverOnly, baseCtx({ phase: 'season_over' }))).toBe(true)
    expect(isTemplateEligible(seasonOverOnly, baseCtx({ phase: 'in_season' }))).toBe(false)
  })

  it('derby: "required" kräver isDerby, "excluded" förbjuder det, "any"/utelämnat bryr sig inte', () => {
    expect(isTemplateEligible({ derby: 'required' }, baseCtx({ isDerby: true }))).toBe(true)
    expect(isTemplateEligible({ derby: 'required' }, baseCtx({ isDerby: false }))).toBe(false)
    expect(isTemplateEligible({ derby: 'excluded' }, baseCtx({ isDerby: true }))).toBe(false)
    expect(isTemplateEligible({ derby: 'excluded' }, baseCtx({ isDerby: false }))).toBe(true)
    expect(isTemplateEligible({ derby: 'any' }, baseCtx({ isDerby: true }))).toBe(true)
  })

  it('finalOnly: kräver isFinal, oavsett competition:playoff i övrigt', () => {
    const finalOnly: TemplateEligibility = { competition: 'playoff', finalOnly: true }
    expect(isTemplateEligible(finalOnly, baseCtx({ competition: 'playoff', isFinal: true }))).toBe(true)
    // En slutspelsvinst som INTE är finalen (t.ex. en kvartsfinal) ska inte
    // räcka — det här är exakt den "kvarts-/semifinal får finaltext"-läckan
    // som motiverade fältet.
    expect(isTemplateEligible(finalOnly, baseCtx({ competition: 'playoff', isFinal: false }))).toBe(false)
  })

  it('trailedAtHalf: "required" kräver underläge vid paus, "excluded" förbjuder det, "any"/utelämnat bryr sig inte', () => {
    expect(isTemplateEligible({ trailedAtHalf: 'required' }, baseCtx({ trailedAtHalf: true }))).toBe(true)
    expect(isTemplateEligible({ trailedAtHalf: 'required' }, baseCtx({ trailedAtHalf: false }))).toBe(false)
    expect(isTemplateEligible({ trailedAtHalf: 'excluded' }, baseCtx({ trailedAtHalf: true }))).toBe(false)
    expect(isTemplateEligible({ trailedAtHalf: 'excluded' }, baseCtx({ trailedAtHalf: false }))).toBe(true)
    expect(isTemplateEligible({ trailedAtHalf: 'any' }, baseCtx({ trailedAtHalf: true }))).toBe(true)
  })

  it('flera villkor kombineras med AND — alla måste stämma', () => {
    const strict: TemplateEligibility = { competition: 'league', homeAway: 'home', result: 'loss' }
    expect(isTemplateEligible(strict, baseCtx({ competition: 'league', homeAway: 'home', result: 'loss' }))).toBe(true)
    expect(isTemplateEligible(strict, baseCtx({ competition: 'league', homeAway: 'away', result: 'loss' }))).toBe(false)
  })
})

describe('filterEligible', () => {
  it('filtrerar en array via en accessor-funktion', () => {
    interface Item { id: string; elig?: TemplateEligibility }
    const items: Item[] = [
      { id: 'a', elig: { homeAway: 'home' } },
      { id: 'b', elig: { homeAway: 'away' } },
      { id: 'c' }, // ingen eligibility → alltid med
    ]
    const result = filterEligible(items, i => i.elig, baseCtx({ homeAway: 'home' }))
    expect(result.map(i => i.id)).toEqual(['a', 'c'])
  })
})
