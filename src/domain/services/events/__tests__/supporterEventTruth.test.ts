import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import type { SupporterGroup } from '../../../entities/Community'
import { FixtureStatus } from '../../../enums'
import { getKlackDisplay } from '../../klackPresenter'
import { getRolloverPolicy } from '../../deferredRolloverService'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import { resolveEvent } from '../eventResolver'
import { generateSupporterEvents } from '../supporterEvents'

function supporterGroup(overrides: Partial<SupporterGroup> = {}): SupporterGroup {
  return {
    name: 'Järnkurvan', founded: 1990, members: 40, mood: 60,
    leader: { name: 'Sture', role: 'leader' },
    veteran: { name: 'Rolf', role: 'veteran' },
    youth: { name: 'Elin', role: 'youth' },
    family: { name: 'Tommy', role: 'family' },
    ...overrides,
  }
}

function makeGame(group: SupporterGroup) {
  const template = CLUB_TEMPLATES[0]
  return { ...createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 }), supporterGroup: group }
}

describe('supporterEvent — global tid, effekter och sann efterklang', () => {
  it('tifo använder currentMatchday och återberättar inte ett påhittat derby eller +12', () => {
    const game = { ...makeGame(supporterGroup()), currentMatchday: 5, lastProcessedMatchday: 99 }
    const event = generateSupporterEvents(game, 5, new Set(), () => 0)
      .find(candidate => candidate.id.startsWith('supporter_tifo_'))!
    const result = resolveEvent({ ...game, pendingEvents: [event] }, event.id, 'yes', undefined, true)
    expect(result.supporterGroup).toMatchObject({ mood: 65, tifoDone: true, tifoDoneMatchday: 5 })
    expect(result.communityStanding).toBe((game.communityStanding ?? 50) + 2)

    const display = getKlackDisplay(result, 5)!
    expect(display.title).toBe('Tifot tar form')
    expect(display.body).toContain('Elin')
    expect(`${display.title} ${display.body} ${display.note}`).not.toMatch(/derby|\+12/iu)
  })

  it('konfliktens båda-val visar och levererar supporterMood +5/fanMood +3 utan falsk fortsatt spricka', () => {
    const game = { ...makeGame(supporterGroup({ tifoDone: true })), currentMatchday: 9, lastProcessedMatchday: 99, fanMood: 50 }
    const event = generateSupporterEvents(game, 9, new Set(), () => 0)
      .find(candidate => candidate.id.startsWith('supporter_conflict_'))!
    expect(event.choices.find(choice => choice.id === 'both')?.subtitle)
      .toBe('💛 +5 klackens stämning · 🙂 +3 publikstämning')
    const result = resolveEvent({ ...game, pendingEvents: [event] }, event.id, 'both', undefined, true)
    expect(result.supporterGroup).toMatchObject({ mood: 65, conflictSeason: game.currentSeason, conflictMatchday: 9 })
    expect(result.fanMood).toBe(53)
    expect(getKlackDisplay(result, 9)?.body).not.toContain('tystare')
  })

  it('bortaresan söker kommande fixture.matchday och beskrivs som planerad, inte genomförd', () => {
    const base = makeGame(supporterGroup({ tifoDone: true }))
    const fixture = {
      ...base.fixtures[0],
      status: FixtureStatus.Scheduled,
      homeClubId: base.fixtures[0].homeClubId === base.managedClubId ? base.fixtures[0].awayClubId : base.fixtures[0].homeClubId,
      awayClubId: base.managedClubId,
      roundNumber: 1,
      matchday: 8,
      isCup: false,
    }
    const game = { ...base, currentMatchday: 6, lastProcessedMatchday: 99, fixtures: [fixture] }
    const event = generateSupporterEvents(game, 6, new Set(), () => 0)
      .find(candidate => candidate.id.startsWith('supporter_away_trip_'))!
    expect(event).toBeDefined()
    const result = resolveEvent({ ...game, pendingEvents: [event] }, event.id, 'acknowledge', undefined, true)
    expect(result.supporterGroup).toMatchObject({ mood: 62, awayTripSeason: game.currentSeason, awayTripMatchday: 6 })
    const display = getKlackDisplay(result, 6)!
    expect(display.title).toBe('Bortaresan planeras')
    expect(`${display.body} ${display.note}`).not.toMatch(/tretton|alla kom hem|\+8/iu)
  })

  it('rinner ut vid rollover eftersom alla supporterEvent-val ändrar state', () => {
    expect(getRolloverPolicy('supporterEvent')).toBe('expire')
  })
})
