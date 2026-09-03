/**
 * BRÅDSKANDE FIX (GPT live-revision, verifierad, 2026-09-03) — blockerare.
 *
 * Rotorsak: handleLastMinutePressChoice (MatchLiveScreen.tsx) gjorde alltid
 * setCurrentStep(prev => prev + 1) utan att kontrollera matchens slut. På
 * matchens SISTA steg flyttades currentStep utanför steps — matchDone
 * sattes aldrig, ingen Granska-knapp nåddes, karriären låstes permanent.
 * Samma bugklass som den vanliga stegtimern redan skyddar mot (currentStep
 * + 1 >= steps.length → matchDone).
 *
 * Rotfixen gör stegtimern till ENSAM ägare av progression. Handlaren stänger
 * bara valet; timern återupptas och använder shouldEndMatchAfterStep mot den
 * aktuella steps-arrayen, som även kan ha regenererats under interaktionen.
 *
 * LastMinutePress.tsx:s onChoose nås via två vägar som BÅDA landar i
 * MatchLiveScreen.tsx:s handleLastMinutePressChoice: ett aktivt spelarval
 * (handleConfirm(c), knappen "Spräng igenom") och ett timeout-standardval
 * (onTimeout={() => handleConfirm('pushForward')}). Eftersom båda vägarna
 * anropar EXAKT samma handler, verifierar detta test timerns slutvillkor —
 * samma arkitektoniska val som
 * matchLiveHelpers.ceremony.test.ts: ingen DOM-rendering
 * (@testing-library/react finns inte i projektet).
 */
import { describe, it, expect } from 'vitest'
import { shouldEndMatchAfterStep } from '../matchLiveHelpers'

describe('shouldEndMatchAfterStep — stegtimerns enda slutvillkor', () => {
  it('sista steget (currentStep + 1 === totalSteps) ska avsluta matchen', () => {
    // 60-stegs match, sista steget är index 59 (0-indexerat)
    expect(shouldEndMatchAfterStep(59, 60)).toBe(true)
  })

  it('lastMinutePress som fyrar på det ALLRA sista steget (regression för den exakta buggen) leder till matchDone', () => {
    // Detta ÄR scenariot GPT hittade: en lastMinutePressData på step 59/60,
    // spelaren löser (aktivt eller timeout) — matchen ska avslutas, inte
    // stega currentStep till 60 (utanför steps).
    const totalSteps = 60
    const lastMinutePressStepIndex = 59
    expect(shouldEndMatchAfterStep(lastMinutePressStepIndex, totalSteps)).toBe(true)
  })

  it('näst sista steget ska INTE avsluta matchen — currentStep stegar normalt', () => {
    expect(shouldEndMatchAfterStep(58, 60)).toBe(false)
  })

  it('ett tidigt steg i matchen ska aldrig avsluta matchen', () => {
    expect(shouldEndMatchAfterStep(0, 60)).toBe(false)
    expect(shouldEndMatchAfterStep(30, 60)).toBe(false)
  })

  it('förlängning/straffar (färre totalsteg, t.ex. 65 efter övertid) hanteras med samma villkor', () => {
    expect(shouldEndMatchAfterStep(64, 65)).toBe(true)
    expect(shouldEndMatchAfterStep(63, 65)).toBe(false)
  })

  it('degenererat enstegs-fall (totalSteps=1) avslutar direkt på steg 0', () => {
    expect(shouldEndMatchAfterStep(0, 1)).toBe(true)
  })
})
