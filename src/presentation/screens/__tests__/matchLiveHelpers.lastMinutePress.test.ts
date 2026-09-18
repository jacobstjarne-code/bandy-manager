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
 * (handleConfirm(c), valets huvudknapp) och ett timeout-standardval
 * (onTimeout={() => handleConfirm('pushForward')}). Eftersom båda vägarna
 * anropar EXAKT samma handler, verifierar detta test timerns slutvillkor —
 * samma arkitektoniska val som
 * matchLiveHelpers.ceremony.test.ts: ingen DOM-rendering
 * (@testing-library/react finns inte i projektet).
 */
import { describe, it, expect } from 'vitest'
import { applyLastMinutePressDecision, getChosenLivePress, shouldEndMatchAfterStep } from '../matchLiveHelpers'
import type { MatchStep } from '../../../domain/services/matchSimulator'

const step = (index: number): MatchStep => ({
  step: index, minute: index * 1.5, events: [], homeScore: 0, awayScore: 1,
  commentary: '', intensity: 'low',
  activeSuspensions: { homeCount: 0, awayCount: 0, homeTimers: [], awayTimers: [] },
  shotsHome: 0, shotsAway: 0, onTargetHome: 0, onTargetAway: 0,
  cornersHome: 0, cornersAway: 0,
})

describe('slutminutsvalets sparade stegserie', () => {
  it('Håll ut behåller framtiden och sparar valet utan att räkna om', () => {
    const before = [step(55), step(56), step(57)]
    before[0].lastMinutePressData = { minute: 83, scoreDiff: -1, stepsLeft: 5, fatigueLevel: 25 }
    const after = applyLastMinutePressDecision(before, 0, 'acceptResult', () => {
      throw new Error('Håll ut får inte simulera om matchen')
    })
    expect(after[1]).toBe(before[1])
    expect(after[2]).toBe(before[2])
    expect(after[0].lastMinutePressData).toBeUndefined()
    expect(getChosenLivePress(after)).toBe('acceptResult')
  })

  it('Allt fram ersätter bara återstående steg och lämnar ett durabelt valspår', () => {
    const before = [step(54), step(55), step(56)]
    const regenerated = [step(56), step(57)]
    const after = applyLastMinutePressDecision(before, 1, 'allIn', (home, away, atStep, choice) => {
      expect([home, away, atStep, choice]).toEqual([0, 1, 1, 'allIn'])
      return regenerated
    })
    expect(after[0]).toBe(before[0])
    expect(after.slice(2)).toEqual(regenerated)
    expect(getChosenLivePress(after)).toBe('allIn')
  })
})

describe('shouldEndMatchAfterStep — stegtimerns enda slutvillkor', () => {
  it('sista steget (currentStep + 1 === totalSteps) ska avsluta matchen', () => {
    // 60-stegs match, sista steget är index 59 (0-indexerat)
    expect(shouldEndMatchAfterStep(59, 60)).toBe(true)
  })

  it('ett äldre sparat pressval på sista steget leder ändå till matchDone', () => {
    // Nya matcher öppnar inte pressvalet på sista spelsteget: där finns inget
    // kvar att påverka. Äldre saves kan däremot redan bära rutan där.
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
