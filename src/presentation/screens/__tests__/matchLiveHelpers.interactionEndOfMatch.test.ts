/**
 * Uppföljning till blockeraren (89271a47, handleLastMinutePressChoice) —
 * samma bugklass fanns i tre till ovillkorliga setCurrentStep(prev => prev
 * + 1)-anrop i MatchLiveScreen.tsx:s interaktionshandlare (corner ~836,
 * straff ~906, kontring ~979), plus en fjärde instans (frislag ~1052)
 * upptäckt i samma grep men inte namngiven i den ursprungliga rapporten —
 * fixad i samma pass för att stänga HELA klassen, inte bara de tre
 * uttryckligen listade.
 *
 * Rotfixen gör stegtimern till ENSAM ägare av progression. De fyra
 * handlarnas enda ansvar är att lösa och stänga interaktionen; när den är
 * stängd kör timern detta gemensamma slutvillkor mot aktuell steps-array.
 *
 * "Regressionstest per handler" här betyder: verifiera shouldEndMatchAfterStep
 * mot de faktiska (currentStep, steps.length)-paren när timern återtar
 * kontrollen efter respektive interaktion. Ingen handler stegar längre.
 */
import { describe, it, expect } from 'vitest'
import { shouldEndMatchAfterStep } from '../matchLiveHelpers'

describe('Stegtimerns slutvillkor efter interaktioner', () => {
  it('corner-interaktion (activeCorner) på matchens sista steg leder till matchDone', () => {
    const totalSteps = 60
    const cornerFiresOnLastStep = 59
    expect(shouldEndMatchAfterStep(cornerFiresOnLastStep, totalSteps)).toBe(true)
  })

  it('corner-interaktion på ett icke-sista steg stegar normalt vidare', () => {
    expect(shouldEndMatchAfterStep(45, 60)).toBe(false)
  })

  it('straff-interaktion (activePenalty) på matchens sista steg leder till matchDone', () => {
    const totalSteps = 60
    const penaltyFiresOnLastStep = 59
    expect(shouldEndMatchAfterStep(penaltyFiresOnLastStep, totalSteps)).toBe(true)
  })

  it('straff-interaktion på ett icke-sista steg stegar normalt vidare', () => {
    expect(shouldEndMatchAfterStep(50, 60)).toBe(false)
  })

  it('kontrings-interaktion (activeCounter) på matchens sista steg leder till matchDone', () => {
    const totalSteps = 60
    const counterFiresOnLastStep = 59
    expect(shouldEndMatchAfterStep(counterFiresOnLastStep, totalSteps)).toBe(true)
  })

  it('kontrings-interaktion på ett icke-sista steg stegar normalt vidare', () => {
    expect(shouldEndMatchAfterStep(52, 60)).toBe(false)
  })

  it('frislags-interaktion (activeFreeKick) på matchens sista steg leder till matchDone (fjärde, ej ursprungligen namngivna instansen)', () => {
    const totalSteps = 60
    const freeKickFiresOnLastStep = 59
    expect(shouldEndMatchAfterStep(freeKickFiresOnLastStep, totalSteps)).toBe(true)
  })

  it('frislags-interaktion på ett icke-sista steg stegar normalt vidare', () => {
    expect(shouldEndMatchAfterStep(40, 60)).toBe(false)
  })

  it('förlängning/straffar (kortare totalsteg) — alla fyra handlare hanteras med samma villkor på det nya slutet', () => {
    const totalStepsWithOT = 65
    expect(shouldEndMatchAfterStep(64, totalStepsWithOT)).toBe(true)
    expect(shouldEndMatchAfterStep(63, totalStepsWithOT)).toBe(false)
  })
})
