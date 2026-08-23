import { describe, it, expect } from 'vitest'
import { getEffectivePriority } from '../eventQueueService'
import { getEffectiveWhyNowLine } from '../../data/contentContract'
import { checkEconomicCrisis } from '../economicCrisisService'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../worldGenerator'
import type { GameEvent } from '../../entities/GameEvent'
import type { SaveGame } from '../../entities/SaveGame'

/**
 * Medium 4 (Skutskär-auditen, docs/incoming/bandy-manager-skutskaer-audit-52009671-2026-08-20.md):
 * "Prioritera per undertyp/instans, inte bara GameEventType. En bastu är
 * normal; ett irreversibelt stjärnsälj eller ett faktiskt ultimatum är
 * pivotal. Lägg kontraktstest som kräver minst en nåbar critical-
 * produktionsinstans." Detta ÄR det testet — riktig produktionsfunktion,
 * ingen syntetisk mock.
 */

function makeGame(): SaveGame {
  const template = CLUB_TEMPLATES[0]
  return createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
}

describe('Medium 4 — minst en nåbar critical-produktionsinstans', () => {
  it('economicCrisisService fas 3 (stjärnsälj-ultimatumet) är critical genom RIKTIG produktionskod, inte en mock', () => {
    let game = makeGame()
    game = {
      ...game,
      clubs: game.clubs.map(c => c.id === game.managedClubId ? { ...c, finances: -250_000 } : c),
      economicCrisisState: {
        startedSeason: game.currentSeason,
        startedMatchday: 1,
        phase: 'pressure',
        eventsFired: ['pressure'],
      },
    }
    const event = checkEconomicCrisis(game, 10).event // startedMatchday(1) + 5 ≤ 10 → fas 3 nås
    expect(event).not.toBeNull()
    expect(event!.type).toBe('criticalEconomy')
    expect(event!.whyNow).toEqual({ whyNowPerson: 'Johan Bergstedt' })
    expect(getEffectivePriority(event!)).toBe('critical')
  })

  it('economicCrisisService fas 1 (samma GameEventType, ingen instans-whyNow) nedgraderas till normal — bastu-nivå, inte ultimatum', () => {
    let game = makeGame()
    game = {
      ...game,
      clubs: game.clubs.map(c => c.id === game.managedClubId ? { ...c, finances: -250_000 } : c),
    }
    const event = checkEconomicCrisis(game, 1).event
    expect(event).not.toBeNull()
    expect(event!.type).toBe('criticalEconomy')
    expect(event!.whyNow).toBeUndefined()
    expect(getEffectivePriority(event!)).toBe('normal')
  })

  it('economicCrisisService fas 2 (samma GameEventType, ingen instans-whyNow) nedgraderas också till normal', () => {
    let game = makeGame()
    game = {
      ...game,
      clubs: game.clubs.map(c => c.id === game.managedClubId ? { ...c, finances: -250_000 } : c),
      economicCrisisState: {
        startedSeason: game.currentSeason,
        startedMatchday: 1,
        phase: 'awareness',
        eventsFired: [],
      },
    }
    const event = checkEconomicCrisis(game, 4).event // startedMatchday(1) + 3 ≤ 4 → fas 2 nås
    expect(event).not.toBeNull()
    expect(event!.type).toBe('criticalEconomy')
    expect(getEffectivePriority(event!)).toBe('normal')
  })
})

describe('getEffectiveWhyNowLine — instans vinner över typ-raden', () => {
  function makeEvent(overrides: Partial<GameEvent>): GameEvent {
    return { id: 'e1', type: 'mecenatEvent', title: 't', body: 'b', choices: [], resolved: false, ...overrides }
  }

  it('instans-whyNow (deadlineLabel) räcker för critical, oavsett typ-raden', () => {
    const event = makeEvent({ whyNow: { deadlineLabel: 'omgång 14' } })
    expect(getEffectiveWhyNowLine(event)).toBe('Svaret måste komma före omgång 14.')
    expect(getEffectivePriority(event)).toBe('critical')
  })

  it('instans-whyNow (wholeEventIrreversible) ger rätt låst copy', () => {
    const event = makeEvent({ whyNow: { wholeEventIrreversible: true } })
    expect(getEffectiveWhyNowLine(event)).toBe('Det här går inte att göra ogjort.')
  })

  it('ingen instans-whyNow → faller tillbaka på typ-raden (samma som förut)', () => {
    const event = makeEvent({}) // mecenatEvent, ingen ifylld contentContract-rad
    expect(getEffectiveWhyNowLine(event)).toBeNull()
    expect(getEffectivePriority(event)).toBe('normal')
  })
})
