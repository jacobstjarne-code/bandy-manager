/**
 * O16 — GRANSKA SOM LÄRANDEYTA (DOM_GRANSKA_LARANDEYTA_2026-08-17.md).
 * dittValCornerText: kandidat 2 (cornerStrategy → hörnmål), den enda av fyra
 * kandidater matchmotorn har siffror för idag. Formen är låst i domen:
 * "vad du valde, vad som hände" — ingen bindestreckad slutsats, aldrig
 * beröm/tillrättavisning. null när 0 hörnor togs (ingen koppling att visa).
 */
import { describe, it, expect } from 'vitest'
import { dittValCornerText } from '../presentation/screens/granska/GranskaOversikt'
import { CornerStrategy } from '../domain/enums'

describe('dittValCornerText — O16', () => {
  it('0 hörnor togs → ingen sektion (null), oavsett strategi', () => {
    expect(dittValCornerText({ cornerStrategy: CornerStrategy.Safe, totalCorners: 0, cornerGoalMinutes: [] })).toBeNull()
    expect(dittValCornerText({ cornerStrategy: CornerStrategy.Aggressive, totalCorners: 0, cornerGoalMinutes: [] })).toBeNull()
  })

  it('1 hörna, inget mål — singularform "Den gick inte in."', () => {
    expect(dittValCornerText({ cornerStrategy: CornerStrategy.Standard, totalCorners: 1, cornerGoalMinutes: [] }))
      .toBe('Du valde vanliga hörnor. Den gick inte in.')
  })

  it('flera hörnor, inget mål — "Ingen av de fem gick in." (domens exempel)', () => {
    expect(dittValCornerText({ cornerStrategy: CornerStrategy.Aggressive, totalCorners: 5, cornerGoalMinutes: [] }))
      .toBe('Du valde aggressiva hörnor. Ingen av de fem gick in.')
  })

  it('exakt ett hörnmål, första halvlek — domens exempel', () => {
    expect(dittValCornerText({ cornerStrategy: CornerStrategy.Standard, totalCorners: 3, cornerGoalMinutes: [22] }))
      .toBe('Du valde vanliga hörnor. Det gav ett mål i första halvlek.')
  })

  it('exakt ett hörnmål, andra halvlek', () => {
    expect(dittValCornerText({ cornerStrategy: CornerStrategy.Safe, totalCorners: 2, cornerGoalMinutes: [67] }))
      .toBe('Du valde säkra hörnor. Det gav ett mål i andra halvlek.')
  })

  it('minut 45 räknas som andra halvlek (matchCore.ts-konventionen: minute < 45 = första)', () => {
    expect(dittValCornerText({ cornerStrategy: CornerStrategy.Standard, totalCorners: 1, cornerGoalMinutes: [45] }))
      .toBe('Du valde vanliga hörnor. Det gav ett mål i andra halvlek.')
  })

  it('flera hörnmål — plural, ingen halvlek-precisering', () => {
    expect(dittValCornerText({ cornerStrategy: CornerStrategy.Aggressive, totalCorners: 6, cornerGoalMinutes: [12, 58] }))
      .toBe('Du valde aggressiva hörnor. Det gav två mål.')
  })

  it('strategi-namnen: safe/standard/aggressive → säkra/vanliga/aggressiva hörnor', () => {
    expect(dittValCornerText({ cornerStrategy: CornerStrategy.Safe, totalCorners: 1, cornerGoalMinutes: [] }))
      .toContain('säkra hörnor')
    expect(dittValCornerText({ cornerStrategy: CornerStrategy.Standard, totalCorners: 1, cornerGoalMinutes: [] }))
      .toContain('vanliga hörnor')
    expect(dittValCornerText({ cornerStrategy: CornerStrategy.Aggressive, totalCorners: 1, cornerGoalMinutes: [] }))
      .toContain('aggressiva hörnor')
  })

  it('aldrig beröm/tillrättavisning — texten innehåller inga värderande ord', () => {
    const banned = ['bra', 'dåligt', 'rätt', 'fel', 'fungerade', 'misslyckades']
    const samples = [
      dittValCornerText({ cornerStrategy: CornerStrategy.Safe, totalCorners: 4, cornerGoalMinutes: [] }),
      dittValCornerText({ cornerStrategy: CornerStrategy.Aggressive, totalCorners: 4, cornerGoalMinutes: [10] }),
    ]
    for (const s of samples) {
      expect(s).not.toBeNull()
      for (const word of banned) {
        expect(s!.toLowerCase()).not.toContain(word)
      }
    }
  })
})
