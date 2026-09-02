import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { FixtureStatus } from '../../../enums'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import { getRolloverPolicy } from '../../deferredRolloverService'
import { generatePlayerMediaEvent } from '../eventFactories'
import { generatePostAdvanceEvents } from '../postAdvanceEvents'
import { resolveEvent } from '../eventResolver'

function makeGame() {
  const template = CLUB_TEMPLATES[0]
  const base = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
  const subject = base.players.find(player => player.clubId === base.managedClubId)!
  const managedFixtures = base.fixtures
    .filter(fixture => fixture.homeClubId === base.managedClubId || fixture.awayClubId === base.managedClubId)
    .slice(0, 3)
    .map((fixture, index) => {
      const subjectOnBench = {
        startingPlayerIds: base.players
          .filter(player => player.clubId === base.managedClubId && player.id !== subject.id)
          .slice(0, 11)
          .map(player => player.id),
        benchPlayerIds: [subject.id],
      }
      return {
        ...fixture,
        status: FixtureStatus.Completed,
        matchday: index + 1,
        homeLineup: fixture.homeClubId === base.managedClubId ? subjectOnBench : fixture.homeLineup,
        awayLineup: fixture.awayClubId === base.managedClubId ? subjectOnBench : fixture.awayLineup,
      }
    })

  return {
    game: {
      ...base,
      currentMatchday: 6,
      fixtures: managedFixtures,
      players: base.players.map(player => ({
        ...player,
        isFullTimePro: true,
        dayJob: undefined,
        morale: player.id === subject.id ? 20 : 70,
        currentAbility: player.id === subject.id ? 60 : player.currentAbility,
      })),
      pendingEvents: [],
      resolvedEventIds: [],
      mecenater: [],
    },
    subjectId: subject.id,
  }
}

describe('playerMediaComment — text, state och deduplicering', () => {
  it('kräver minst tre verkliga matcher och använder canonical spelare+omgång-id', () => {
    const { game, subjectId } = makeGame()
    const tooEarly = generatePostAdvanceEvents({ ...game, fixtures: game.fixtures.slice(0, 2) }, [], 6, () => 0)
    expect(tooEarly.some(event => event.type === 'playerMediaComment')).toBe(false)

    const event = generatePostAdvanceEvents(game, [], 6, () => 0)
      .find(candidate => candidate.type === 'playerMediaComment')
    expect(event).toMatchObject({
      id: `event_media_${subjectId}_r6`,
      relatedPlayerId: subjectId,
      rotationKey: `player_media_${subjectId}`,
    })
    expect(event?.body).toContain('sällan få starta')
    expect(event?.body).not.toContain('sitter bara på bänken')

    const pendingRepeat = generatePostAdvanceEvents({ ...game, pendingEvents: [event!] }, [], 6, () => 0)
    const resolvedRepeat = generatePostAdvanceEvents({ ...game, resolvedEventIds: [event!.id] }, [], 6, () => 0)
    expect(pendingRepeat.some(candidate => candidate.type === 'playerMediaComment')).toBe(false)
    expect(resolvedRepeat.some(candidate => candidate.type === 'playerMediaComment')).toBe(false)
  })

  it.each([
    ['talk', 58],
    ['confront', 45],
    ['ignore', 48],
  ])('%s levererar exakt deklarerad morale-effekt', (choiceId, expectedMorale) => {
    const { game, subjectId } = makeGame()
    const subject = game.players.find(player => player.id === subjectId)!
    const event = generatePlayerMediaEvent(subject, 'Bandytidningen', 6)
    const result = resolveEvent({
      ...game,
      players: game.players.map(player => player.id === subjectId ? { ...player, morale: 50 } : player),
      pendingEvents: [event],
    }, event.id, choiceId, undefined, true)

    expect(result.players.find(player => player.id === subjectId)?.morale).toBe(expectedMorale)
    expect(result.narrativeBeatLog?.at(-1)?.semanticKey).toBe('playerMediaComment')
  })

  it('rinner ut vid rollover eftersom inget neutralt val finns', () => {
    expect(getRolloverPolicy('playerMediaComment')).toBe('expire')
  })
})
