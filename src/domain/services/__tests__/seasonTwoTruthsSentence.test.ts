/**
 * ÅRSBOKENS_TVASANNINGSMENING_2026-08-23.md (Jacobs dom): när
 * placeringsdomen och uppdragsutfallet pekar åt olika håll ska båda stå i
 * samma mening, förbundna med "men". Pekar de åt samma håll: bara
 * placeringsdomen, ingen tvåsanningsmening.
 */
import { describe, it, expect } from 'vitest'
import { seasonTwoTruthsSentence, placeringsdomText } from '../seasonSummaryService'
import { ClubExpectation } from '../../enums'

describe('placeringsdomText — Jacobs låsta text, fem betyg', () => {
  it('betyg 5 (WinLeague, 1:a): "överträffade det de bad om"', () => {
    expect(placeringsdomText(ClubExpectation.WinLeague, 1, 12)).toBe('Förstaplatsen överträffade det de bad om.')
  })
  it('betyg 3 säger "vad de väntade sig", INTE "precis vad de väntade sig"', () => {
    expect(placeringsdomText(ClubExpectation.WinLeague, 4, 12)).toBe('Fjärdeplatsen var vad de väntade sig.')
  })
  it('betyg 1 (AvoidBottom, sist): "långt under det de bad om"', () => {
    expect(placeringsdomText(ClubExpectation.AvoidBottom, 12, 12)).toBe('Tolfteplatsen var långt under det de bad om.')
  })
  it('ordinal i bestämd form: Åttondeplatsen, Tredjeplatsen, Elfteplatsen', () => {
    expect(placeringsdomText(ClubExpectation.ChallengeTop, 8, 12)).toContain('Åttondeplatsen')
    expect(placeringsdomText(ClubExpectation.ChallengeTop, 3, 12)).toContain('Tredjeplatsen')
    expect(placeringsdomText(ClubExpectation.AvoidBottom, 11, 12)).toContain('Elfteplatsen')
  })
  it('okänd position (utanför 1-12): fallback till siffra+ändelse', () => {
    expect(placeringsdomText(ClubExpectation.MidTable, 15, 16)).toContain('15:e platsen')
  })
})

describe('seasonTwoTruthsSentence', () => {
  it('ingen objectiveOutcome-data: null', () => {
    expect(seasonTwoTruthsSentence({ expectationVerdict: 'met' }, 'X')).toBeNull()
  })

  it('placering bra, ett uppdrag missat: räkneform singular', () => {
    const s = { expectationVerdict: 'exceeded' as const, objectiveOutcome: { met: 1, atRisk: 0, active: 0, failed: 1 } }
    expect(seasonTwoTruthsSentence(s, 'Åttondeplatsen överträffade målet')).toBe(
      'Åttondeplatsen överträffade målet, men ett uppdrag missades.'
    )
  })

  it('placering bra, två uppdrag missade: räkneform plural', () => {
    const s = { expectationVerdict: 'met' as const, objectiveOutcome: { met: 0, atRisk: 0, active: 0, failed: 2 } }
    expect(seasonTwoTruthsSentence(s, 'X')).toBe('X, men 2 uppdrag missades.')
  })

  it('placering dålig, uppdrag mötta: "Uppdragen höll ni däremot"', () => {
    const s = { expectationVerdict: 'failed' as const, objectiveOutcome: { met: 2, atRisk: 0, active: 0, failed: 0 } }
    expect(seasonTwoTruthsSentence(s, 'X')).toBe('X. Uppdragen höll ni däremot.')
  })

  it('placering dålig men INGA uppdrag alls (met=0): ingen tvåsanningsmening (inget att säga höll)', () => {
    const s = { expectationVerdict: 'failed' as const, objectiveOutcome: { met: 0, atRisk: 0, active: 0, failed: 0 } }
    expect(seasonTwoTruthsSentence(s, 'X')).toBeNull()
  })

  it('placering bra, uppdrag hotade men inte missade: "hängde löst"', () => {
    const s = { expectationVerdict: 'exceeded' as const, objectiveOutcome: { met: 1, atRisk: 1, active: 0, failed: 0 } }
    expect(seasonTwoTruthsSentence(s, 'X')).toBe('X. Ett uppdrag hängde löst ända in i mars.')
  })

  it('placering bra, flera uppdrag hotade: pluralform', () => {
    const s = { expectationVerdict: 'met' as const, objectiveOutcome: { met: 0, atRisk: 3, active: 0, failed: 0 } }
    expect(seasonTwoTruthsSentence(s, 'X')).toBe('X. 3 uppdrag hängde löst ända in i mars.')
  })

  it('båda pekar åt samma håll (bra placering, uppdrag mötta): ingen tvåsanningsmening', () => {
    const s = { expectationVerdict: 'exceeded' as const, objectiveOutcome: { met: 3, atRisk: 0, active: 0, failed: 0 } }
    expect(seasonTwoTruthsSentence(s, 'X')).toBeNull()
  })

  it('båda pekar åt samma håll (dålig placering, uppdrag missade): ingen tvåsanningsmening', () => {
    const s = { expectationVerdict: 'failed' as const, objectiveOutcome: { met: 0, atRisk: 0, active: 0, failed: 2 } }
    expect(seasonTwoTruthsSentence(s, 'X')).toBeNull()
  })

  it('dålig placering + hotade-men-ej-missade: domen ger inget fjärde fall, null', () => {
    const s = { expectationVerdict: 'failed' as const, objectiveOutcome: { met: 0, atRisk: 2, active: 0, failed: 0 } }
    expect(seasonTwoTruthsSentence(s, 'X')).toBeNull()
  })

  // SEXSÄSONGSAUDITEN 2026-08-26, "Dubbel interpunktion": årsboken visade
  // "Förstaplatsen överträffade det de bad om., men ett uppdrag missades."
  // — placeringsdom kommer ALLTID färdigpunkterad från placeringsdomText
  // (se PLACERINGSDOM_TEMPLATES), men alla tre grenarna i denna funktion
  // tejpade på ny interpunktion utan att kolla om en redan fanns. Dessa
  // tester använder ett RIKTIGT placeringsdomText-resultat (inte 'X') just
  // för att fånga att indata redan slutar på punkt.
  it('placeringsdom slutar redan på punkt (riktig placeringsdomText) — ingen dubbel interpunktion vid "men"', () => {
    const dom = placeringsdomText(ClubExpectation.WinLeague, 1, 12)
    expect(dom).toBe('Förstaplatsen överträffade det de bad om.')
    const s = { expectationVerdict: 'exceeded' as const, objectiveOutcome: { met: 0, atRisk: 0, active: 0, failed: 1 } }
    const result = seasonTwoTruthsSentence(s, dom)
    expect(result).toBe('Förstaplatsen överträffade det de bad om, men ett uppdrag missades.')
    expect(result).not.toContain('.,')
  })

  it('placeringsdom slutar redan på punkt — ingen dubbel punkt före "Uppdragen höll ni däremot"', () => {
    const dom = placeringsdomText(ClubExpectation.AvoidBottom, 12, 12)
    const s = { expectationVerdict: 'failed' as const, objectiveOutcome: { met: 1, atRisk: 0, active: 0, failed: 0 } }
    const result = seasonTwoTruthsSentence(s, dom)
    expect(result).not.toMatch(/\.\./)
    expect(result).toBe(`${dom} Uppdragen höll ni däremot.`)
  })

  it('placeringsdom slutar redan på punkt — ingen dubbel punkt före "hängde löst"', () => {
    const dom = placeringsdomText(ClubExpectation.WinLeague, 1, 12)
    const s = { expectationVerdict: 'exceeded' as const, objectiveOutcome: { met: 0, atRisk: 1, active: 0, failed: 0 } }
    const result = seasonTwoTruthsSentence(s, dom)
    expect(result).not.toMatch(/\.\./)
    expect(result).toBe(`${dom} Ett uppdrag hängde löst ända in i mars.`)
  })
})
