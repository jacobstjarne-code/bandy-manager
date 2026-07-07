import { describe, it, expect } from 'vitest'
import { mapRecommendationToMentality } from '../opponentAnalysisService'
import { TacticMentality } from '../../enums'

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
