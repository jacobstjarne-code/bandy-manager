/**
 * DOM_O20_K3K5_KLASS_2026-09-02 — Jacobs beslut: survival_emergency_lotto
 * ska ha en LITEN nedsida mot en stor uppsida (asymmetrisk chansning), inte
 * längre ett garanterat gratis-gott utfall. 80/20-vikten regressionstestas
 * här; text/uppsida i övrigt orörd.
 */
import { describe, it, expect } from 'vitest'
import { resolveWeeklyDecision, type WeeklyDecision } from '../weeklyDecisionService'
import type { SaveGame } from '../../entities/SaveGame'

const decision: WeeklyDecision = {
  id: 'survival_emergency_lotto',
  category: 'community',
  question: 'test',
  optionA: { label: 'Kör igång', effect: '+5 tkr · +klackstämning (chansning)', effectColor: 'success' },
  optionB: { label: 'Inte nu', effect: 'besviken', effectColor: 'muted' },
}

function makeGame(currentMatchday: number): SaveGame {
  return {
    currentMatchday,
    currentSeason: 2025,
    players: [],
    managedClubId: 'c1',
  } as unknown as SaveGame
}

describe('survival_emergency_lotto — asymmetrisk chansning', () => {
  it('val B (avstå) ger fortfarande bara den lilla besvikelse-kostnaden', () => {
    const effects = resolveWeeklyDecision(makeGame(1), decision, 'B')
    expect(effects).toEqual([{ type: 'supporterMood', delta: -2 }])
  })

  it('val A ger antingen den fulla potten ELLER en liten arrangemangskostnad, aldrig ett mellanting', () => {
    const seen = new Set<string>()
    for (let matchday = 1; matchday <= 300; matchday++) {
      const effects = resolveWeeklyDecision(makeGame(matchday), decision, 'A')
      const key = JSON.stringify(effects)
      seen.add(key)
      const isFullPot = JSON.stringify(effects) === JSON.stringify([{ type: 'finances', delta: 5_000 }, { type: 'supporterMood', delta: 3 }])
      const isSmallLoss = JSON.stringify(effects) === JSON.stringify([{ type: 'finances', delta: -1_000 }])
      expect(isFullPot || isSmallLoss).toBe(true)
    }
    // Båda utfallen ska faktiskt förekomma över ett spann av matchdagar.
    expect(seen.size).toBe(2)
  })

  it('uppsidan är väsentligt vanligare än nedsidan (asymmetrisk, inte 50/50)', () => {
    let fullPotCount = 0
    const total = 500
    for (let matchday = 1; matchday <= total; matchday++) {
      const [first] = resolveWeeklyDecision(makeGame(matchday), decision, 'A')
      if (first.type === 'finances' && first.delta === 5_000) fullPotCount++
    }
    const ratio = fullPotCount / total
    expect(ratio).toBeGreaterThan(0.65)
    expect(ratio).toBeLessThan(0.95)
  })

  it('nedsidan är verkligen liten mot uppsidan (aldrig ett stort minus)', () => {
    for (let matchday = 1; matchday <= 200; matchday++) {
      const effects = resolveWeeklyDecision(makeGame(matchday), decision, 'A')
      for (const e of effects) {
        if (e.type === 'finances') {
          expect(e.delta).toBeGreaterThanOrEqual(-1_000)
        }
      }
    }
  })
})
