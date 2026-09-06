import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import { getRolloverPolicy } from '../../deferredRolloverService'
import { generateJournalistExclusiveEvent } from '../eventFactories'
import { resolveEvent } from '../eventResolver'
import { localPressVoiceId } from '../../voiceIntroductionService'

function makeGame() {
  const template = CLUB_TEMPLATES[0]
  const game = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
  const player = game.players.find(candidate => candidate.clubId === game.managedClubId)!
  const voiceId = localPressVoiceId(game.managedClubId, game.journalist!.name)
  return {
    game: {
      ...game,
      currentMatchday: 8,
      journalistRelationship: 10,
      journalist: { ...game.journalist!, relationship: 70, lastInteractionMatchday: 2 },
      introducedVoices: { [voiceId]: { provenance: 'legacy_assumed', source: 'migration' } },
      players: game.players.map(candidate => candidate.id === player.id ? { ...candidate, morale: 50 } : candidate),
    },
    player,
  }
}

describe('journalistExclusive — canonical relation och synlig spelare', () => {
  it('accept levererar +10 moral, +1 CS och synkad canonical/legacy relation +5', () => {
    const { game, player } = makeGame()
    const event = generateJournalistExclusiveEvent(game.journalist!.name, game.journalist!.outlet, player, 8, game.managedClubId)
    expect(event).toMatchObject({ relatedPlayerId: player.id })
    const result = resolveEvent({ ...game, pendingEvents: [event] }, event.id, 'accept', undefined, true)

    expect(result.players.find(candidate => candidate.id === player.id)?.morale).toBe(60)
    expect(result.communityStanding).toBe((game.communityStanding ?? 50) + 1)
    expect(result.journalist?.relationship).toBe(75)
    expect(result.journalistRelationship).toBe(75)
    expect(result.journalist?.lastInteractionMatchday).toBe(8)
  })

  it('decline sänker samma canonical relation med 5 och synkar legacyfältet', () => {
    const { game, player } = makeGame()
    const event = generateJournalistExclusiveEvent(game.journalist!.name, game.journalist!.outlet, player, 8, game.managedClubId)
    const result = resolveEvent({ ...game, pendingEvents: [event] }, event.id, 'decline', undefined, true)
    expect(result.journalist?.relationship).toBe(65)
    expect(result.journalistRelationship).toBe(65)
    expect(result.journalist?.lastInteractionMatchday).toBe(8)
  })

  it('rinner ut vid rollover eftersom båda valen ändrar relation/state', () => {
    expect(getRolloverPolicy('journalistExclusive')).toBe('expire')
  })
})
