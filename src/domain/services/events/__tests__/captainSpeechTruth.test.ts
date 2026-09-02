import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { FixtureStatus } from '../../../enums'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import { getDefaultRolloverChoice } from '../../deferredRolloverService'
import { generateCaptainSpeechEvent } from '../eventFactories'
import { generatePostAdvanceEvents } from '../postAdvanceEvents'
import { resolveEvent } from '../eventResolver'

function makeLossStreakGame(captainMorale = 80) {
  const template = CLUB_TEMPLATES[0]
  const base = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
  const captain = base.players.find(player => player.clubId === base.managedClubId)!
  const losses = base.fixtures
    .filter(fixture => fixture.leagueId && !fixture.isCup && !fixture.isKnockout
      && (fixture.homeClubId === base.managedClubId || fixture.awayClubId === base.managedClubId))
    .slice(0, 3)
    .map((fixture, index) => {
      const managedAtHome = fixture.homeClubId === base.managedClubId
      return {
        ...fixture,
        status: FixtureStatus.Completed,
        matchday: index + 1,
        homeScore: managedAtHome ? 0 : 3,
        awayScore: managedAtHome ? 3 : 0,
      }
    })
  return {
    game: {
      ...base,
      currentMatchday: 4,
      fixtures: losses,
      captainPlayerId: captain.id,
      players: base.players.map(player => player.id === captain.id ? { ...player, morale: captainMorale } : player),
      pendingEvents: [],
      resolvedEventIds: [],
    },
    captainId: captain.id,
  }
}

describe('captainSpeech — trigger, text och state', () => {
  it('kräver morale>50 även för en explicit satt captainPlayerId', () => {
    const low = makeLossStreakGame(50)
    expect(generatePostAdvanceEvents(low.game, [], 4, () => 0.99)
      .some(event => event.type === 'captainSpeech')).toBe(false)

    const high = makeLossStreakGame(80)
    const event = generatePostAdvanceEvents(high.game, [], 4, () => 0.99)
      .find(candidate => candidate.type === 'captainSpeech')
    expect(event).toMatchObject({
      id: `event_captain_speech_s${high.game.currentSeason}`,
      relatedPlayerId: high.captainId,
    })
  })

  it('support deklarerar och levererar +8 lagmoral samt −3 boardPatience', () => {
    const { game, captainId } = makeLossStreakGame(80)
    const captain = game.players.find(player => player.id === captainId)!
    const event = generateCaptainSpeechEvent(captain, game.managedClubId, game.currentSeason)
    expect(event.choices.find(choice => choice.id === 'support')?.subtitle)
      .toBe('💛 Lagets moral +8 · styrelsens tålamod −3')

    const before = {
      ...game,
      boardPatience: 70,
      players: game.players.map(player => player.clubId === game.managedClubId ? { ...player, morale: 50 } : player),
      pendingEvents: [event],
    }
    const result = resolveEvent(before, event.id, 'support', undefined, true)
    expect(result.boardPatience).toBe(67)
    expect(result.players.filter(player => player.clubId === game.managedClubId)
      .every(player => player.morale === 58)).toBe(true)
    expect(result.storylines?.find(story => story.type === 'captain_rallied_team')).toMatchObject({
      id: `story_captain_${game.currentSeason}`,
      playerId: captainId,
      clubId: game.managedClubId,
      description: 'Kaptenen samlade laget efter en svår period',
      displayText: 'Kaptenen samlade laget efter en svår period',
      resolved: true,
    })
  })

  it('skriver ingen falsk kaptenstoryline om kortets namngivna spelare har lämnat klubben', () => {
    const { game, captainId } = makeLossStreakGame(80)
    const captain = game.players.find(player => player.id === captainId)!
    const event = generateCaptainSpeechEvent(captain, game.managedClubId, game.currentSeason)
    const stale = {
      ...game,
      players: game.players.map(player => player.id === captainId ? { ...player, clubId: 'free_agent' } : player),
      pendingEvents: [event],
    }

    const result = resolveEvent(stale, event.id, 'support', undefined, true)

    expect(result.storylines?.some(story => story.type === 'captain_rallied_team') ?? false).toBe(false)
  })

  it('take_charge kostar exakt 5 kaptenmoral medan decline är noOp', () => {
    const { game, captainId } = makeLossStreakGame(80)
    const captain = game.players.find(player => player.id === captainId)!
    const event = generateCaptainSpeechEvent(captain, game.managedClubId, game.currentSeason)
    const pending = { ...game, pendingEvents: [event] }

    const charged = resolveEvent(pending, event.id, 'take_charge', undefined, true)
    const declined = resolveEvent(pending, event.id, 'decline', undefined, true)
    expect(charged.players.find(player => player.id === captainId)?.morale).toBe(75)
    expect(declined.players.find(player => player.id === captainId)?.morale).toBe(80)
    expect(declined.boardPatience).toBe(game.boardPatience)
    expect(declined.storylines?.some(story => story.type === 'captain_rallied_team')).toBe(false)
  })

  it('rollover använder eventets uttryckliga noOp-val', () => {
    const { game, captainId } = makeLossStreakGame(80)
    const captain = game.players.find(player => player.id === captainId)!
    const event = generateCaptainSpeechEvent(captain, game.managedClubId, game.currentSeason)
    expect(getDefaultRolloverChoice(event)?.id).toBe('decline')
  })
})
