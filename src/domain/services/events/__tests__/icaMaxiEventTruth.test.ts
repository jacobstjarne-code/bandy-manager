import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import { getDefaultRolloverChoice } from '../../deferredRolloverService'
import { resolveEvent } from '../eventResolver'
import { generateSponsorEvents } from '../sponsorEvents'

function makeGame() {
  const base = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 7 })
  return {
    ...base,
    currentSeason: 2026,
    currentMatchday: 4,
    communityStanding: 50,
    sponsors: [{
      id: 'ica-test',
      name: 'ICA Maxi Testköping',
      category: 'Dagligvaruhandel',
      weeklyIncome: 4000,
      contractRounds: 8,
      signedRound: 0,
      icaMaxi: true,
    }],
  }
}

describe('icaMaxiEvent — deklarerad effekt är hela effekten', () => {
  it('triggar bara på fyrtal av omgång medan specialavtalet är aktivt', () => {
    const game = makeGame()

    expect(generateSponsorEvents(game, 3, new Set(), () => 0)).toHaveLength(0)
    const event = generateSponsorEvents(game, 4, new Set(), () => 0)[0]
    expect(event.id).toBe('icamaxi_visit_r4_2026')
    expect(event.body).toContain('5 000 kr extra den här omgången')
    expect(generateSponsorEvents(game, 4, new Set([event.id]), () => 0)).toHaveLength(0)
    expect(generateSponsorEvents({ ...game, sponsors: [{ ...game.sponsors[0], contractRounds: 0 }] }, 4, new Set(), () => 0)).toHaveLength(0)
  })

  it('ja ger exakt pengar och communityStanding utan dold spelarmoral', () => {
    const game = makeGame()
    const event = generateSponsorEvents(game, 4, new Set(), () => 0)[0]
    const clubBefore = game.clubs.find(club => club.id === game.managedClubId)!
    const moraleBefore = game.players.map(player => [player.id, player.morale])

    const result = resolveEvent({ ...game, pendingEvents: [event] }, event.id, 'send_player', () => 0, true)
    const clubAfter = result.clubs.find(club => club.id === game.managedClubId)!

    expect(clubAfter.finances - clubBefore.finances).toBe(5000)
    expect(result.communityStanding).toBe(52)
    expect(result.players.map(player => [player.id, player.morale])).toEqual(moraleBefore)
    expect(result.financeLog?.some(entry => entry.amount === 5000)).toBe(true)
  })

  it('nej är ett verkligt noOp och är därför det säkra rollover-utfallet', () => {
    const game = makeGame()
    const event = generateSponsorEvents(game, 4, new Set(), () => 0)[0]

    expect(event.choices.find(choice => choice.id === 'decline')?.effect).toEqual({ type: 'noOp' })
    expect(getDefaultRolloverChoice(event)?.id).toBe('decline')
  })
})
