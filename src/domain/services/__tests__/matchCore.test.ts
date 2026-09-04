import { describe, it, expect } from 'vitest'
import { canScoreGate, getGoalScorerWeight, pickMatchProfileFromSeed, MATCH_TOTAL_GOAL_CAP, MATCH_GOAL_DIFFERENCE_CAP, pickLegendCommentary } from '../matchCore'
import type { Player } from '../../entities/Player'

describe('canScoreGate', () => {
  it('blockerar mål när totalCap är nådd', () => {
    expect(canScoreGate(9, 8, true, 17, 6)).toBe(false)
  })

  it('tillåter mål under totalCap när målskillnaden håller sig inom diffCap', () => {
    expect(canScoreGate(1, 1, true, 17, 6)).toBe(true)
  })

  it('blockerar mål som skulle överskrida diffCap för attackerande hemmalag', () => {
    // homeScore 6, awayScore 0 → newDiff = 6+1-0 = 7 > diffCap 6
    expect(canScoreGate(6, 0, true, 17, 6)).toBe(false)
  })

  it('tillåter mål som exakt når diffCap-gränsen', () => {
    // homeScore 5, awayScore 0 → newDiff = 5+1-0 = 6 === diffCap 6
    expect(canScoreGate(5, 0, true, 17, 6)).toBe(true)
  })

  it('beräknar diff korrekt för attackerande bortalag', () => {
    // awayScore 0, homeScore 6 → newDiff = 0+1-6 = -5, |diff| = 5 <= 6
    expect(canScoreGate(6, 0, false, 17, 6)).toBe(true)
    // awayScore 0, homeScore 7 → newDiff = 0+1-7 = -6, |diff| = 6 <= 6
    expect(canScoreGate(7, 0, false, 17, 6)).toBe(true)
    // awayScore 0, homeScore 8 → newDiff = 0+1-8 = -7, |diff| = 7 > 6
    expect(canScoreGate(8, 0, false, 17, 6)).toBe(false)
  })

  it('respekterar default totalCap från matchCore utan att skicka in den explicit', () => {
    // 10+11=21 < 22 (totalCap), och nytt diff blir 0 → diffCap binder inte här
    expect(canScoreGate(10, 11, true)).toBe(true)
    // 11+11=22 === totalCap → blockerad oavsett diff
    expect(canScoreGate(11, 11, true)).toBe(false)
  })

  it('respekterar default diffCap från matchCore utan att skicka in den explicit', () => {
    expect(canScoreGate(MATCH_GOAL_DIFFERENCE_CAP - 1, 0, true)).toBe(true)
    expect(canScoreGate(MATCH_GOAL_DIFFERENCE_CAP, 0, true)).toBe(false)
  })

  it('blockerar exakt vid totalCap-gränsen (>=, inte >)', () => {
    expect(canScoreGate(8, 9, true, 17, 6)).toBe(false) // 8+9=17 === totalCap
    expect(canScoreGate(8, 8, true, 17, 6)).toBe(true)  // 8+8=16 < totalCap
  })
})

describe('getGoalScorerWeight', () => {
  it('returnerar full vikt för 0 eller 1 tidigare mål', () => {
    expect(getGoalScorerWeight(0, 10)).toBe(10)
    expect(getGoalScorerWeight(1, 10)).toBe(10)
  })

  it('applicerar soft brake ×0.7^(n-1) från och med andra målet', () => {
    expect(getGoalScorerWeight(2, 10)).toBeCloseTo(10 * 0.7, 10)
    expect(getGoalScorerWeight(3, 10)).toBeCloseTo(10 * 0.7 * 0.7, 10)
    expect(getGoalScorerWeight(4, 10)).toBeCloseTo(10 * Math.pow(0.7, 3), 10)
  })

  it('spärrar helt vid hard cap 5 mål', () => {
    expect(getGoalScorerWeight(5, 10)).toBe(0)
    expect(getGoalScorerWeight(6, 10)).toBe(0)
    expect(getGoalScorerWeight(100, 10)).toBe(0)
  })

  it('skalar linjärt med baseWeight under bromsen', () => {
    expect(getGoalScorerWeight(0, 20)).toBe(20)
    expect(getGoalScorerWeight(1, 0)).toBe(0)
  })
})

describe('pickMatchProfileFromSeed', () => {
  it('är deterministisk — samma seed ger samma profil', () => {
    for (const seed of [1, 42, 1000, 999999]) {
      const a = pickMatchProfileFromSeed(seed)
      const b = pickMatchProfileFromSeed(seed)
      expect(a).toBe(b)
    }
  })

  it('returnerar alltid ett giltigt MatchProfile-värde', () => {
    const valid = new Set(['defensive_battle', 'standard', 'open_game', 'chaotic'])
    for (let seed = 0; seed < 500; seed++) {
      expect(valid.has(pickMatchProfileFromSeed(seed))).toBe(true)
    }
  })

  it('producerar samtliga fyra profiler över ett spann av seeds (inga vikter kan bli 0/negativa av misstag)', () => {
    const seen = new Set<string>()
    for (let seed = 0; seed < 2000; seed++) {
      seen.add(pickMatchProfileFromSeed(seed))
    }
    expect(seen.has('defensive_battle')).toBe(true)
    expect(seen.has('standard')).toBe(true)
    expect(seen.has('open_game')).toBe(true)
    expect(seen.has('chaotic')).toBe(true)
  })

  it('isFinal höjer defensiv vikt tydligt jämfört med neutral match (regressionsskydd för SM-final-kalibreringen)', () => {
    let neutralDefensive = 0
    let finalDefensive = 0
    const N = 3000
    for (let seed = 0; seed < N; seed++) {
      if (pickMatchProfileFromSeed(seed) === 'defensive_battle') neutralDefensive++
      if (pickMatchProfileFromSeed(seed, { isFinal: true, isPlayoff: true }) === 'defensive_battle') finalDefensive++
    }
    expect(finalDefensive).toBeGreaterThan(neutralDefensive)
  })

  it('largeCaDiff höjer open_game-andelen jämfört med neutral match', () => {
    let neutralOpen = 0
    let largeDiffOpen = 0
    const N = 3000
    for (let seed = 0; seed < N; seed++) {
      if (pickMatchProfileFromSeed(seed) === 'open_game') neutralOpen++
      if (pickMatchProfileFromSeed(seed, { largeCaDiff: true }) === 'open_game') largeDiffOpen++
    }
    expect(largeDiffOpen).toBeGreaterThan(neutralOpen)
  })
})

/**
 * PÅSTÅENDEKARTAN NÄR-mutation-fix (2026-08-25, Jacobs order, mutation-
 * VerificationGate-utökning i matchCore, det uppskjutna "halvdagsjobbet").
 * legend_goal-poolens "{totalGoals} mål för klubben nu" läste tidigare
 * player.careerStats.totalGoals direkt — förra matchens värde, eftersom
 * statsProcessor.ts bara uppdaterar det EFTER hela matchen. Om legenden
 * redan gjort mål TIDIGARE i samma match saknades de i "nu"-påståendet.
 * Fixen är aritmetisk (ingen separat trigger/avfyrnings-fas att haka i,
 * matchCore.ts kör allt synkront i samma steg): pickLegendCommentary tar
 * nu emot goalsThisMatchSoFar och lägger till den på career-basen.
 */
describe('pickLegendCommentary — totalGoals inkluderar matchens egna redan gjorda mål', () => {
  const legend = {
    lastName: 'Pålsson',
    careerStats: { seasonsPlayed: 12, totalGoals: 150 },
  } as Player

  // Pool-index 6 (0-baserat) i legend_goal är den enda raden som använder
  // {totalGoals} (matchCommentary.ts) — rand() styrs för att alltid träffa
  // just den raden, pool.length=12.
  const forceTotalGoalsLine = () => 6.5 / 12

  it('adderar 0 tidigare mål i matchen: visar career-basen oförändrad', () => {
    const text = pickLegendCommentary(legend, 'goal', 42, forceTotalGoalsLine, 0)
    expect(text).toContain('150 mål för klubben nu')
  })

  it('legenden har redan gjort 2 mål TIDIGARE i samma match: 152, inte 150', () => {
    const text = pickLegendCommentary(legend, 'goal', 78, forceTotalGoalsLine, 2)
    expect(text).toContain('152 mål för klubben nu')
    expect(text).not.toContain('150 mål för klubben nu')
  })
})
