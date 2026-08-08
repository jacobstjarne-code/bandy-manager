import { describe, it, expect } from 'vitest'
import { mapRecommendationToMentality, mapRecommendationToPress, getSuggestionWhyLine } from '../opponentAnalysisService'
import { TacticMentality, TacticPress } from '../../enums'

// Yta 3 (Audit-syntes, 2026-07-07): recommendation → suggestedMentality-mappningen
// för Analys→Taktik-bryggan. De fyra strängarna är ordagrant desamma som
// opponentAnalysisService.generateDetailedAnalysis producerar — ändras den texten
// måste den här mappningen uppdateras i samma commit.
describe('mapRecommendationToMentality', () => {
  it('mappar "Pressa högt och dominera mitten." till Offensive', () => {
    expect(mapRecommendationToMentality('Pressa högt och dominera mitten.')).toBe(TacticMentality.Offensive)
  })

  it('mappar "Spela offensivt — deras försvar är sårbart." till Offensive', () => {
    expect(mapRecommendationToMentality('Spela offensivt — deras försvar är sårbart.')).toBe(TacticMentality.Offensive)
  })

  it('mappar "Prioritera defensiven — de har farliga forwards." till Defensive', () => {
    expect(mapRecommendationToMentality('Prioritera defensiven — de har farliga forwards.')).toBe(TacticMentality.Defensive)
  })

  it('ger undefined för "Jämn motståndare" — ingen falsk föreslagen knapp', () => {
    expect(mapRecommendationToMentality('Jämn motståndare. Spelplanen avgör.')).toBeUndefined()
  })

  it('ger undefined för okänd/saknad recommendation', () => {
    expect(mapRecommendationToMentality(undefined)).toBeUndefined()
    expect(mapRecommendationToMentality('Något helt annat.')).toBeUndefined()
  })
})

// SLUTTEST 2026-08-08 (punkt 5): samma princip som mapRecommendationToMentality
// ovan, för TacticStep.tsx:s press-rekommendation — enda källan, inte en
// separat recentForm/tablePosition-beräkning i komponenten.
describe('mapRecommendationToPress', () => {
  it('mappar "Pressa högt och dominera mitten." till High', () => {
    expect(mapRecommendationToPress('Pressa högt och dominera mitten.')).toBe(TacticPress.High)
  })

  it('mappar "Spela offensivt — deras försvar är sårbart." till High', () => {
    expect(mapRecommendationToPress('Spela offensivt — deras försvar är sårbart.')).toBe(TacticPress.High)
  })

  it('mappar "Prioritera defensiven — de har farliga forwards." till Low', () => {
    expect(mapRecommendationToPress('Prioritera defensiven — de har farliga forwards.')).toBe(TacticPress.Low)
  })

  it('ger undefined för "Jämn motståndare" — ingen falsk föreslagen knapp', () => {
    expect(mapRecommendationToPress('Jämn motståndare. Spelplanen avgör.')).toBeUndefined()
  })

  it('ger undefined för okänd/saknad recommendation', () => {
    expect(mapRecommendationToPress(undefined)).toBeUndefined()
    expect(mapRecommendationToPress('Något helt annat.')).toBeUndefined()
  })
})

// Yta 3 textleverans (Fable, 2026-07-07): varför-raden. {coach} interpolerar mot
// assistentens NAMN, inte initialer — testerna verifierar det uttryckligen.
describe('getSuggestionWhyLine', () => {
  it('interpolerar assistentens namn i "Pressa högt"-varianten', () => {
    expect(getSuggestionWhyLine('Pressa högt och dominera mitten.', 'Sixten'))
      .toBe('Sixten såg det: deras halvlinje är tunn. Pressa högt, ta mitten.')
  })

  it('interpolerar assistentens namn i "Spela offensivt"-varianten', () => {
    expect(getSuggestionWhyLine('Spela offensivt — deras försvar är sårbart.', 'Sixten'))
      .toBe('Sixten såg en spricka i deras försvar. Våga framåt.')
  })

  it('interpolerar assistentens namn i "Prioritera defensiven"-varianten', () => {
    expect(getSuggestionWhyLine('Prioritera defensiven — de har farliga forwards.', 'Sixten'))
      .toBe('Sixten varnar för deras forwards. Stå stadigt först.')
  })

  it('ger undefined för "Jämn motståndare" — ingen rad när inget föreslås', () => {
    expect(getSuggestionWhyLine('Jämn motståndare. Spelplanen avgör.', 'Sixten')).toBeUndefined()
  })

  it('ger undefined för okänd/saknad recommendation', () => {
    expect(getSuggestionWhyLine(undefined, 'Sixten')).toBeUndefined()
    expect(getSuggestionWhyLine('Något helt annat.', 'Sixten')).toBeUndefined()
  })
})
