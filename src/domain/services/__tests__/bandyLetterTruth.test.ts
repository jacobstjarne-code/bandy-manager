import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { generateBandyLetterEvent } from '../bandyLetterService'
import { resolveEvent } from '../events/eventResolver'
import { getDefaultRolloverChoice, getRolloverPolicy } from '../deferredRolloverService'
import { classifyEventNature } from '../granskaEventClassifier'

function game() {
  return createNewGame({ managerName: 'Test', clubId: 'club_heros', season: 2025, seed: 9 })
}

describe('bandyLetter — O11:s text/state-kontrakt', () => {
  it('skapar alla tre mallformer med strukturerad avsändare och resolverbar yta', () => {
    const base = game()
    const events = Array.from({ length: 9 }, (_, i) => generateBandyLetterEvent(base, 10 + i))
      .filter((event): event is NonNullable<typeof event> => event !== null)
    const choiceShapes = new Set(events.map(event => event.choices.map(choice => choice.id).join('|')))

    expect(choiceShapes).toEqual(new Set([
      'reply_warm|archive_no_reply',
      'reply_radio|archive_no_reply',
      'reply_accept_jersey|reply_decline',
    ]))
    for (const event of events) {
      expect(classifyEventNature(event)).toBe('critical')
      for (const choice of event.choices) {
        expect(choice.effect.type).toBe('saveBandyLetter')
        expect(choice.effect.senderAge).toBeGreaterThanOrEqual(68)
        expect(choice.effect.senderOrigin).toBeTruthy()
      }
    }
  })

  it('ett redan defererat canonical brev kan inte genereras igen samma säsong', () => {
    const base = game()
    const first = generateBandyLetterEvent(base, 10)!
    expect(generateBandyLetterEvent({ ...base, deferredDecisions: [first] }, 11)).toBeNull()
  })

  it('ett svar sparar exakt brevet/svaret men ger ingen dold moralbonus', () => {
    const base = game()
    const event = Array.from({ length: 9 }, (_, i) => generateBandyLetterEvent(base, 10 + i)!)
      .find(candidate => candidate.choices.some(choice => choice.id === 'reply_accept_jersey'))!
    const choice = event.choices.find(candidate => candidate.id === 'reply_accept_jersey')!
    const prepared = { ...base, pendingEvents: [event] }
    const moraleBefore = prepared.players.map(player => [player.id, player.morale])
    const resolved = resolveEvent(prepared, event.id, choice.id, undefined, true)
    const letter = resolved.bandyLetters?.at(-1)

    expect(resolved.players.map(player => [player.id, player.morale])).toEqual(moraleBefore)
    expect(letter).toMatchObject({
      id: event.id,
      senderName: event.sender?.name,
      senderAge: choice.effect.senderAge,
      senderOrigin: choice.effect.senderOrigin,
      season: base.currentSeason,
      text: event.body,
      playerReply: choice.effect.replyText,
      savedInArchive: true,
    })
    expect(resolved.bandyLetterThisSeason).toBe(base.currentSeason)
    expect(resolved.pendingEvents).toEqual([])
  })

  it('arkivera utan svar sparar brevet utan att hitta på ett svar', () => {
    const base = game()
    const event = generateBandyLetterEvent(base, 10)!
    const resolved = resolveEvent({ ...base, pendingEvents: [event] }, event.id, 'archive_no_reply', undefined, true)

    expect(resolved.bandyLetters?.at(-1)?.playerReply).toBeUndefined()
    expect(resolved.bandyLetters?.at(-1)?.savedInArchive).toBe(true)
  })

  it('obesvarat brev rinner ut; inget svar eller arkivval auto-väljs', () => {
    const event = generateBandyLetterEvent(game(), 10)!
    expect(getRolloverPolicy('bandyLetter')).toBe('expire')
    expect(getDefaultRolloverChoice(event)).toBeNull()
  })
})
