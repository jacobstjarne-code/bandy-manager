import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import { generatePatronEmergenceEvent, generatePatronEvents } from '../patronEvents'
import { resolveEvent } from '../eventResolver'

function makeGame() {
  return createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
}

function withPatron(happiness: number, season = 2026) {
  const game = makeGame()
  return {
    ...game,
    currentSeason: season,
    patron: {
      name: 'Patron Testsson',
      business: 'Testbruket',
      influence: 50,
      happiness,
      contribution: 75000,
      wantsStyle: 'attacking',
      isActive: true,
      goodwill: 80,
      totalContributed: 0,
      demands: [],
    },
  }
}

describe('patronEvent — text, state och livscykel håller ihop', () => {
  it('återanvänder inte gamla säsongers missnöjes-, avhopps- eller stil-id:n', () => {
    const game = withPatron(20, 2027)
    const ids = generatePatronEvents(game, 11, new Set([
      'patron_unhappy_s2026_r11',
      'patron_withdraw_s2026_r11',
      'patron_style_s2026_r11',
    ]), () => 0).map(event => event.id)

    expect(ids).toContain('patron_withdraw_s2027_r11')
    expect(ids).not.toContain('patron_withdraw_s2026_r11')
  })

  it('ett redan avgjort patronerbjudande återkommer inte och skapar inte ett dubbelt intro', () => {
    const base = { ...makeGame(), currentSeason: 2026, patron: undefined }
    expect(generatePatronEmergenceEvent({ ...base, resolvedEventIds: ['patron_emerge_2026'] }, () => 0)).toBeNull()

    const accepted = withPatron(80, 2026)
    const events = generatePatronEvents(accepted, 3, new Set(['patron_emerge_2026']), () => 0)
    expect(events.some(event => event.id === 'patron_intro_2026')).toBe(false)
  })

  it('krismötet ger de +30 relation som kortet anger och behåller patronen', () => {
    const base = withPatron(20)
    const event = generatePatronEvents(base, 8, new Set(), () => 0)
      .find(candidate => candidate.id === 'patron_withdraw_s2026_r8')!
    const result = resolveEvent({ ...base, pendingEvents: [event] }, event.id, 'meet', undefined, true)

    expect(event.choices.find(choice => choice.id === 'meet')?.subtitle).toContain('+30 relation')
    expect(result.patron?.happiness).toBe(50)
    expect(result.patron?.isActive).toBe(true)
  })

  it('stilvalens deklarerade relationsvärden är de som appliceras', () => {
    const base = withPatron(50)
    const event = generatePatronEvents(base, 11, new Set(), () => 0)
      .find(candidate => candidate.id === 'patron_style_s2026_r11')!

    const diplomatic = resolveEvent({ ...base, pendingEvents: [event] }, event.id, 'diplomatic', undefined, true)
    const refusal = resolveEvent({ ...base, pendingEvents: [event] }, event.id, 'refuse', undefined, true)

    expect(event.choices.find(choice => choice.id === 'agree')?.label).not.toContain('Lova')
    expect(diplomatic.patron?.happiness).toBe(55)
    expect(refusal.patron?.happiness).toBe(35)
  })

  it('bonusen ger både 20 000 kr och +10 relation via den gemensamma patronvägen', () => {
    const base = withPatron(85)
    const event = generatePatronEvents(base, 10, new Set(), () => 0)
      .find(candidate => candidate.id === 'patron_bonus_2026')!
    const before = base.clubs.find(club => club.id === base.managedClubId)!.finances

    const result = resolveEvent({ ...base, pendingEvents: [event] }, event.id, 'thank', undefined, true)

    expect(result.clubs.find(club => club.id === base.managedClubId)?.finances).toBe(before + 20000)
    expect(result.patron?.happiness).toBe(95)
  })

  it('en negativ patron-subeffekt behåller samma avhoppsföljd som top-level-effekten', () => {
    const base = withPatron(10)
    const event = {
      id: 'patron_multi_withdraw',
      type: 'patronEvent' as const,
      title: 'Test',
      body: 'Test',
      choices: [{
        id: 'ok',
        label: 'Test',
        effect: { type: 'multiEffect' as const, subEffects: JSON.stringify([{ type: 'patronHappiness', amount: -10 }]) },
      }],
      resolved: false,
    }

    const result = resolveEvent({ ...base, pendingEvents: [event] }, event.id, 'ok', undefined, true)

    expect(result.patron?.isActive).toBe(false)
    expect(result.patronWithdrawnSeason).toBe(2026)
    expect(result.pendingEvents?.some(candidate => candidate.type === 'patronWithdrawal')).toBe(true)
  })
})
