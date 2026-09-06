/**
 * AUDIT DEL 2 B3, avkallad — minimal delning (2026-08-11): playoffResultLabel/
 * cupResultLabel/formatFinanceAbs konsoliderar vad som tidigare var separata
 * SeasonSummaryScreen.tsx- och HistoryScreen.tsx-implementationer med text
 * som redan glidit isär. Detta test låser den KANONISKA texten (Season-
 * SummaryScreen.tsx:s ordagranna, den fulla ytan) så den inte kan drifta
 * tillbaka isär om någon justerar en av skärmarna separat igen.
 */
import { describe, it, expect } from 'vitest'
import { playoffResultLabel, cupResultLabel, formatFinanceAbs, formatContractUntil, formatContractRemaining, contractSeasonsRemaining } from '../formatters'

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

// SEXSÄSONGSAUDITEN 2026-08-26, SPÅR 2a: contractUntilSeason presenterades
// tidigare i minst fyra olika former (PlayerCard.tsx +1-buggen adderade ett
// helt fel årtal, ContractsTab.tsx/RenewContractModal.tsx visade rått tal med
// olika ordval, eventFactories.ts räknade "N kvar" separat). Dessa tester
// låser den kanoniska semantiken: rå säsongssiffra, inget offset.
describe('formatContractUntil', () => {
  // design-d2 (sluttest-narrative-truth-grind R1, 2026-09-06): bandyårs-span
  // (seasonSpanLabel), inte ett naket kalenderår — men fortfarande INGET +1-
  // offset på själva säsongstalet (det var PlayerCard.tsx-buggen).
  it('visar bandyårs-spannet utan offset (INGET +1 — det var PlayerCard.tsx-buggen)', () => {
    expect(formatContractUntil(2028)).toBe('t.o.m. säsong 2028/29')
  })

  // B1 (Designgranskning fresh-eyes 2026-09-03, blockerare): "t.o.m. säsong
  // undefined" läckte till spelaren när contractUntilSeason var undefined/NaN.
  it('renderar aldrig "undefined" eller "NaN" — guardar mot icke-finita värden', () => {
    expect(formatContractUntil(undefined as unknown as number)).not.toContain('undefined')
    expect(formatContractUntil(NaN)).not.toContain('NaN')
  })
})

describe('contractSeasonsRemaining', () => {
  it('0 när kontraktet gäller ut innevarande säsong', () => {
    expect(contractSeasonsRemaining(2026, 2026)).toBe(0)
  })

  it('positivt för framtida utgång, negativt för redan utgånget', () => {
    expect(contractSeasonsRemaining(2028, 2026)).toBe(2)
    expect(contractSeasonsRemaining(2025, 2026)).toBe(-1)
  })
})

describe('formatContractRemaining', () => {
  it('"Sista säsongen" när contractUntilSeason === currentSeason', () => {
    expect(formatContractRemaining(2026, 2026)).toBe('Sista säsongen')
  })

  it('singular för exakt 1 säsong kvar', () => {
    expect(formatContractRemaining(2027, 2026)).toBe('1 säsong kvar')
  })

  it('plural för fler säsonger kvar', () => {
    expect(formatContractRemaining(2029, 2026)).toBe('3 säsonger kvar')
  })

  it('"Kontrakt utgånget" för ett redan trasigt (invariant-brytande) tillstånd', () => {
    expect(formatContractRemaining(2025, 2026)).toBe('Kontrakt utgånget')
  })
})
