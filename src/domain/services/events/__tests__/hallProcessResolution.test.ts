/**
 * Release-svepet 2026-07-21 (Block 3c) — PROVNING_RESOLUTION → inbox + kafferums-eko.
 * eventResolver.ts:s hallProcess-case saknade tidigare all täckning (0 tester i hela
 * events/-katalogen) — den här filen täcker bara den NYA inbox/eko-grenen, inte hela FSM:en.
 */
import { describe, it, expect } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { resolveEvent } from '../eventResolver'
import { PROVNING_RESOLUTION } from '../../../data/hallProvningData'
import type { GameEvent } from '../../../entities/GameEvent'
import type { HallTrial } from '../../../entities/Community'
import type { SaveGame } from '../../../entities/SaveGame'

function withTrial(game: SaveGame, trial: HallTrial): SaveGame {
  return { ...game, facilityState: { builtNodeIds: ['laktare_ostra'], hallTrial: trial } }
}

function forankringResEvent(season: number, stage: 'bordlagd' | 'nedlagd'): GameEvent {
  return {
    id: `hallprocess_res_s${season}`,
    type: 'hallProcess',
    title: 'Röstningen är klar',
    body: 'x',
    choices: [{
      id: 'ok', label: 'Noterat', subtitle: '',
      effect: { type: 'hallProcess', hallProcessData: JSON.stringify({ stage, supportDelta: 0 }) },
    }],
    resolved: false,
  }
}

describe('eventResolver — hallProcess resolution → inbox + eko (Block 3c)', () => {
  it('bordlagd: pushar inbox-item med PROVNING_RESOLUTION.bordlagd och sätter pendingHallEcho', () => {
    const base = createNewGame({ managerName: 'T', clubId: 'club_forsbacka', season: 2025, seed: 3 })
    const trial: HallTrial = { stage: 'forankring', support: 50, startedSeason: 2025, stageStartedRound: 10 }
    const event = forankringResEvent(2025, 'bordlagd')
    const game = withTrial({ ...base, pendingEvents: [event] }, trial)

    const result = resolveEvent(game, event.id, 'ok')

    expect(result.facilityState?.hallTrial?.stage).toBe('bordlagd')
    expect(result.pendingHallEcho?.text).toBe(PROVNING_RESOLUTION.bordlagd)
    const inboxItem = result.inbox.find(i => i.title === 'Hallfrågan')
    expect(inboxItem?.body).toBe(PROVNING_RESOLUTION.bordlagd)
  })

  it('nedlagd (röstningsfall): PROVNING_RESOLUTION.nedlagd_fall, inte nedlagd_egen', () => {
    const base = createNewGame({ managerName: 'T', clubId: 'club_forsbacka', season: 2025, seed: 3 })
    const trial: HallTrial = { stage: 'forankring', support: 20, startedSeason: 2025, stageStartedRound: 10 }
    const event = forankringResEvent(2025, 'nedlagd')
    const game = withTrial({ ...base, pendingEvents: [event] }, trial)

    const result = resolveEvent(game, event.id, 'ok')

    expect(result.pendingHallEcho?.text).toBe(PROVNING_RESOLUTION.nedlagd_fall)
    expect(result.pendingHallEcho?.text).not.toBe(PROVNING_RESOLUTION.nedlagd_egen)
  })

  it('avbryta-valet (selfNedlagd): PROVNING_RESOLUTION.nedlagd_egen, oavsett vilken decision', () => {
    const base = createNewGame({ managerName: 'T', clubId: 'club_forsbacka', season: 2025, seed: 3 })
    const trial: HallTrial = { stage: 'forankring', support: 50, startedSeason: 2025, stageStartedRound: 10 }
    const avbrytEvent: GameEvent = {
      id: 'hallprocess_d1_s2025',
      type: 'hallProcess',
      title: 'Medlemsmötet i klubbhuset',
      body: 'x',
      choices: [{
        id: 'avbryta', label: 'Lägg ner frågan', subtitle: '',
        effect: { type: 'hallProcess', hallProcessData: JSON.stringify({ stage: 'nedlagd', cooldownUntilSeason: 2026, selfNedlagd: true }) },
      }],
      resolved: false,
    }
    const game = withTrial({ ...base, pendingEvents: [avbrytEvent] }, trial)

    const result = resolveEvent(game, avbrytEvent.id, 'avbryta')

    expect(result.pendingHallEcho?.text).toBe(PROVNING_RESOLUTION.nedlagd_egen)
    expect(result.inbox.find(i => i.title === 'Hallfrågan')?.body).toBe(PROVNING_RESOLUTION.nedlagd_egen)
  })

  it('förhandlingens kommun-nej (hallprocess_fhnej_s) rör INTE PROVNING_RESOLUTION/pendingHallEcho', () => {
    const base = createNewGame({ managerName: 'T', clubId: 'club_forsbacka', season: 2025, seed: 3 })
    const trial: HallTrial = { stage: 'forhandling', startedSeason: 2025, stageStartedRound: 10 }
    const fhNejEvent: GameEvent = {
      id: 'hallprocess_fhnej_s2025',
      type: 'hallProcess',
      title: 'Förhandlingen avslutas',
      body: 'Kommunen passade. Ingen patron att falla tillbaka på. Hallfrågan får vänta.',
      choices: [{
        id: 'noterat', label: 'Noterat', subtitle: '',
        effect: { type: 'hallProcess', hallProcessData: JSON.stringify({ stage: 'nedlagd', cooldownUntilSeason: 2027 }) },
      }],
      resolved: false,
    }
    const game = withTrial({ ...base, pendingEvents: [fhNejEvent] }, trial)

    const result = resolveEvent(game, fhNejEvent.id, 'noterat')

    expect(result.facilityState?.hallTrial?.stage).toBe('nedlagd')
    expect(result.pendingHallEcho).toBeUndefined()
    expect(result.inbox.find(i => i.title === 'Hallfrågan')).toBeUndefined()
  })

  it('dedupar inbox-posten om samma eventId resolvas igen (idempotent id)', () => {
    const base = createNewGame({ managerName: 'T', clubId: 'club_forsbacka', season: 2025, seed: 3 })
    const trial: HallTrial = { stage: 'forankring', support: 50, startedSeason: 2025, stageStartedRound: 10 }
    const event = forankringResEvent(2025, 'bordlagd')
    const game = withTrial({ ...base, pendingEvents: [event] }, trial)

    const once = resolveEvent(game, event.id, 'ok')
    const gameWithExistingInbox = { ...once, pendingEvents: [event] }
    const twice = resolveEvent(gameWithExistingInbox, event.id, 'ok')

    expect(twice.inbox.filter(i => i.title === 'Hallfrågan')).toHaveLength(1)
  })
})
