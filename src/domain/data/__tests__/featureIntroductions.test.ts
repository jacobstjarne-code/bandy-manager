import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { FEATURE_INTRODUCTIONS, getCommunityFeatureIntroductionSpeaker } from '../featureIntroductions'
import { TAB_INTROS } from '../tabIntros'
import { CLUB_TEMPLATES } from '../../services/worldGenerator'
import { politicianVoiceId, recordVoiceIntroduction } from '../../services/voiceIntroductionService'

describe('begriplighet-klass-e — flikintroduktioner', () => {
  it('Sälj, Fria och Orten delar den redan låsta hjälpcopyn', () => {
    expect(FEATURE_INTRODUCTIONS.sellPlayers).toBe(TAB_INTROS.sell.text)
    expect(FEATURE_INTRODUCTIONS.freeAgents).toBe(TAB_INTROS.freeagents.text)
    expect(FEATURE_INTRODUCTIONS.community).toBe(TAB_INTROS.orten.text)
  })

  it('Tränare förklarar belastning utan en tung FeatureIntroduction', () => {
    expect(TAB_INTROS.tranare.text).toContain('Hög belastning för länge sliter ut dig.')
  })

  it('Orten namnger aldrig politikern före den kanoniska entrén', () => {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 31 })
    expect(game.localPolitician).toBeDefined()
    expect(getCommunityFeatureIntroductionSpeaker(game)).toBeNull()

    const politician = game.localPolitician!
    const voiceId = politicianVoiceId(game.managedClubId, politician.mandatExpires ?? game.currentSeason)
    const introduced = recordVoiceIntroduction(game, voiceId, {
      name: politician.name,
      role: politician.title,
    })
    expect(getCommunityFeatureIntroductionSpeaker(introduced)).toEqual({
      speaker: politician.name,
      role: politician.title,
    })
  })
})
