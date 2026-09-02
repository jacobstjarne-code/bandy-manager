import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import { getDefaultRolloverChoice, getRolloverPolicy } from '../../deferredRolloverService'
import { resolveEvent } from '../eventResolver'
import { generatePostAdvanceEvents } from '../postAdvanceEvents'

function makeGame() {
  const base = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 11 })
  return {
    ...base,
    currentSeason: 2,
    currentMatchday: 5,
    patron: undefined,
    pendingEvents: [],
    resolvedEventIds: [],
    transferBids: [],
    clubs: base.clubs.map(club => club.id === base.managedClubId
      ? { ...club, finances: -1, reputation: 70 }
      : club),
  }
}

describe('spoksponsor — den permanenta styrelseeffekten är deklarerad', () => {
  it('är ett globalt engångserbjudande för en skuldsatt klubb utan patron', () => {
    const game = makeGame()
    const event = generatePostAdvanceEvents(game, [], 5, () => 0.99)
      .find(candidate => candidate.type === 'spoksponsor')!

    expect(event.id).toBe('ghostSponsorOffered')
    expect(event.choices[0].subtitle).toContain('ny styrelseledamot')
    expect(generatePostAdvanceEvents({ ...game, resolvedEventIds: [event.id] }, [], 6, () => 0.99)
      .some(candidate => candidate.type === 'spoksponsor')).toBe(false)
  })

  it('accept ger pengar, CS-kostnad och en riktig modernistisk BoardMember', () => {
    const game = makeGame()
    const event = generatePostAdvanceEvents(game, [], 5, () => 0.99)
      .find(candidate => candidate.type === 'spoksponsor')!
    const clubBefore = game.clubs.find(club => club.id === game.managedClubId)!
    const boardLengthBefore = game.board?.length ?? 0

    const result = resolveEvent({ ...game, pendingEvents: [event] }, event.id, 'accept', undefined, true)
    const clubAfter = result.clubs.find(club => club.id === game.managedClubId)!
    const investor = result.board?.find(member => member.firstName === 'Okänd' && member.lastName === 'Investerare')

    expect(clubAfter.finances - clubBefore.finances).toBe(150000)
    expect(result.communityStanding).toBe((game.communityStanding ?? 50) - 5)
    expect(result.board).toHaveLength(boardLengthBefore + 1)
    expect(investor).toMatchObject({ role: 'ledamot', personality: 'modernist' })
    expect(result.financeLog?.some(entry => entry.amount === 150000)).toBe(true)
  })

  it('rinner ut vid rollover eftersom även avslag kostar styrelsetålamod', () => {
    const event = generatePostAdvanceEvents(makeGame(), [], 5, () => 0.99)
      .find(candidate => candidate.type === 'spoksponsor')!

    expect(event.choices.find(choice => choice.id === 'decline')?.effect)
      .toEqual({ type: 'boardPatience', amount: -5 })
    expect(getRolloverPolicy('spoksponsor')).toBe('expire')
    expect(getDefaultRolloverChoice(event)).toBeNull()
  })
})
