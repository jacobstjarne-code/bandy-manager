/**
 * AUDIT DEL 2 B3, avkallad — minimal delning (2026-08-11): playoffResultLabel/
 * cupResultLabel/formatFinanceAbs konsoliderar vad som tidigare var separata
 * SeasonSummaryScreen.tsx- och HistoryScreen.tsx-implementationer med text
 * som redan glidit isär. Detta test låser den KANONISKA texten (Season-
 * SummaryScreen.tsx:s ordagranna, den fulla ytan) så den inte kan drifta
 * tillbaka isär om någon justerar en av skärmarna separat igen.
 */
import { describe, it, expect } from 'vitest'
import { playoffResultLabel, cupResultLabel, formatFinanceAbs } from '../formatters'

describe('playoffResultLabel', () => {
  it('mappar alla kända utfall', () => {
    expect(playoffResultLabel('champion')).toBe('🏆 Svenska mästare')
    expect(playoffResultLabel('finalist')).toBe('🥈 Finalist')
    expect(playoffResultLabel('semifinal')).toBe('4:e i semifinal')
    expect(playoffResultLabel('quarterfinal')).toBe('Kvartsfinalist')
    expect(playoffResultLabel('didNotQualify')).toBe('Ej kvalad till slutspel')
  })

  it('null/undefined ger tom sträng (anroparen väljer egen fallback-glyf)', () => {
    expect(playoffResultLabel(null)).toBe('')
    expect(playoffResultLabel(undefined)).toBe('')
  })
})

describe('cupResultLabel', () => {
  it('mappar alla kända utfall', () => {
    expect(cupResultLabel('winner')).toBe('CUPVINNARE!')
    expect(cupResultLabel('finalist')).toBe('Cupfinalist')
    expect(cupResultLabel('semifinal')).toBe('Cupsemifinalist')
    expect(cupResultLabel('quarter')).toBe('Cupkvartsfinalist')
  })

  it('eliminated/null ger tom sträng', () => {
    expect(cupResultLabel('eliminated')).toBe('')
    expect(cupResultLabel(null)).toBe('')
    expect(cupResultLabel(undefined)).toBe('')
  })
})

describe('formatFinanceAbs', () => {
  it('mkr för belopp >= 1 000 000', () => {
    expect(formatFinanceAbs(1_200_000)).toBe('1.2 mkr')
  })

  it('tkr för belopp >= 1 000', () => {
    expect(formatFinanceAbs(450_000)).toBe('450 tkr')
  })

  it('kr för belopp under 1 000 — saknades innan konsolideringen (visade "0 tkr")', () => {
    expect(formatFinanceAbs(600)).toBe('600 kr')
  })
})
