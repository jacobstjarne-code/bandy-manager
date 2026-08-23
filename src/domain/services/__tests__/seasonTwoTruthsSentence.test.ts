/**
 * ÅRSBOKENS_TVASANNINGSMENING_2026-08-23.md (Jacobs dom): när
 * placeringsdomen och uppdragsutfallet pekar åt olika håll ska båda stå i
 * samma mening, förbundna med "men". Pekar de åt samma håll: bara
 * placeringsdomen, ingen tvåsanningsmening.
 */
import { describe, it, expect } from 'vitest'
import { seasonTwoTruthsSentence } from '../seasonSummaryService'

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
})
