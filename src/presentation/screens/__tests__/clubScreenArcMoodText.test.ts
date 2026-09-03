/**
 * inv-2-21b-getarcmoodtext (DOM 2026-09-03, Opus): getArcMoodText fanns
 * skriven och testad men hade noll konsumenter — dödmärkt text-utan-yta
 * (CLAUDE.md §7). Domen placerar den som en dämpad rad i ClubScreens
 * "Klubben i korthet"-kort, under epok-etiketten. Testet täcker wiringens
 * ENDA nya logik: null-guard när trainerArc saknas, och att seedet är
 * stabilt per omgång (currentSeason*100 + matchday), inte per render.
 */
import { describe, it, expect } from 'vitest'
import { computeArcMoodText } from '../ClubScreen'
import { createTrainerArc } from '../../../domain/services/trainerArcService'

describe('ClubScreen — computeArcMoodText', () => {
  it('är null när trainerArc saknas (äldre saves)', () => {
    expect(computeArcMoodText({ currentSeason: 2026, currentMatchday: 5 })).toBeNull()
  })

  it('ger en textrad när trainerArc finns', () => {
    const trainerArc = createTrainerArc()
    const text = computeArcMoodText({ trainerArc, currentSeason: 2026, currentMatchday: 5 })
    expect(typeof text).toBe('string')
    expect(text!.length).toBeGreaterThan(0)
  })

  it('är stabilt för samma säsong+omgång, oavsett hur många gånger det anropas', () => {
    const trainerArc = createTrainerArc()
    const a = computeArcMoodText({ trainerArc, currentSeason: 2026, currentMatchday: 5 })
    const b = computeArcMoodText({ trainerArc, currentSeason: 2026, currentMatchday: 5 })
    expect(a).toBe(b)
  })

  it('kan byta text mellan olika omgångar (seedet varierar med matchday)', () => {
    const trainerArc = createTrainerArc()
    const texts = new Set<string | null>()
    for (let matchday = 1; matchday <= 12; matchday++) {
      texts.add(computeArcMoodText({ trainerArc, currentSeason: 2026, currentMatchday: matchday }))
    }
    expect(texts.size).toBeGreaterThan(1)
  })
})
