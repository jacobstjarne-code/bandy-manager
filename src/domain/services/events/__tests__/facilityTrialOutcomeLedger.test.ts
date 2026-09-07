/**
 * liggare-ny-facility-trial-outcome (RAPPORT_OMSPARNING_SYSTEM_2026-09-04.md
 * §3): samma fyra hallProcess-resolutionsvägar som hallProcessResolution.test.ts
 * redan täcker för inbox/eko (Block 3c), men verifierar nu istället att en
 * facility_trial_outcome-post skrivs till event-liggaren — inklusive den
 * femte vägen (kommun-nej utan patron) som medvetet saknar inbox/eko-text.
 */
import { describe, it, expect } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { resolveEvent } from '../eventResolver'
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

describe('eventResolver — hallProcess resolution → facility_trial_outcome-liggarpost', () => {
  it('bordlagd (röstning): skriver en post med stage/outcome bordlagd, significance 50', () => {
    const base = createNewGame({ managerName: 'T', clubId: 'club_forsbacka', season: 2025, seed: 3 })
    const trial: HallTrial = { stage: 'forankring', support: 50, startedSeason: 2025, stageStartedRound: 10 }
    const event = forankringResEvent(2025, 'bordlagd')
    const game = withTrial({ ...base, pendingEvents: [event] }, trial)

    const result = resolveEvent(game, event.id, 'ok', undefined, true)

    const entry = result.eventLedger?.find(e => e.type === 'facility_trial_outcome')
    expect(entry).toBeDefined()
    expect(entry?.clubId).toBe(game.managedClubId)
    expect(entry?.facilityTrialOutcome).toEqual({ stage: 'bordlagd', outcome: 'bordlagd', support: 50 })
    expect(entry?.significance).toBe(50)
  })

  it('nedlagd (röstningsfall): outcome nedlagd_fall, significance 65', () => {
    const base = createNewGame({ managerName: 'T', clubId: 'club_forsbacka', season: 2025, seed: 3 })
    const trial: HallTrial = { stage: 'forankring', support: 20, startedSeason: 2025, stageStartedRound: 10 }
    const event = forankringResEvent(2025, 'nedlagd')
    const game = withTrial({ ...base, pendingEvents: [event] }, trial)

    const result = resolveEvent(game, event.id, 'ok', undefined, true)

    const entry = result.eventLedger?.find(e => e.type === 'facility_trial_outcome')
    expect(entry?.facilityTrialOutcome?.outcome).toBe('nedlagd_fall')
    expect(entry?.significance).toBe(65)
  })

  it('avbryta-valet (selfNedlagd): outcome nedlagd_egen, significance 65', () => {
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

    const result = resolveEvent(game, avbrytEvent.id, 'avbryta', undefined, true)

    const entry = result.eventLedger?.find(e => e.type === 'facility_trial_outcome')
    expect(entry?.facilityTrialOutcome?.outcome).toBe('nedlagd_egen')
    expect(entry?.significance).toBe(65)
  })

  it('kommunens nej vid förhandlingsbordet (fh1nej, CS<50): outcome kommun_nej, stage bordlagd', () => {
    const base = createNewGame({ managerName: 'T', clubId: 'club_forsbacka', season: 2025, seed: 3 })
    const trial: HallTrial = { stage: 'forhandling', support: 45, startedSeason: 2025, stageStartedRound: 10 }
    const fh1NejEvent: GameEvent = {
      id: 'hallprocess_fh1nej_s2025',
      type: 'hallProcess',
      title: 'Kommunen säger nej',
      body: 'x',
      choices: [{
        id: 'noterat', label: 'Noterat', subtitle: '',
        effect: { type: 'hallProcess', hallProcessData: JSON.stringify({ stage: 'bordlagd', cooldownUntilSeason: 2026 }) },
      }],
      resolved: false,
    }
    const game = withTrial({ ...base, pendingEvents: [fh1NejEvent] }, trial)

    const result = resolveEvent(game, fh1NejEvent.id, 'noterat', undefined, true)

    const entry = result.eventLedger?.find(e => e.type === 'facility_trial_outcome')
    expect(entry?.facilityTrialOutcome).toEqual({ stage: 'bordlagd', outcome: 'kommun_nej', support: 45 })
    // "nej" väger tyngre än ren röstningsbordläggning trots samma stage.
    expect(entry?.significance).toBe(65)
  })

  it('förhandlingens ANDRA nej (fhnej, ingen patron): outcome nedlagd_ingen_finansiering — den enda vägen utan inbox/eko', () => {
    const base = createNewGame({ managerName: 'T', clubId: 'club_forsbacka', season: 2025, seed: 3 })
    const trial: HallTrial = { stage: 'forhandling', support: 55, startedSeason: 2025, stageStartedRound: 10 }
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

    const result = resolveEvent(game, fhNejEvent.id, 'noterat', undefined, true)

    expect(result.pendingHallEcho).toBeUndefined()  // oförändrat — ingen text finns för denna vägen
    const entry = result.eventLedger?.find(e => e.type === 'facility_trial_outcome')
    expect(entry?.facilityTrialOutcome).toEqual({ stage: 'nedlagd', outcome: 'nedlagd_ingen_finansiering', support: 55 })
    expect(entry?.significance).toBe(65)
  })

  it('dedupar liggarposten om samma eventId resolvas igen', () => {
    const base = createNewGame({ managerName: 'T', clubId: 'club_forsbacka', season: 2025, seed: 3 })
    const trial: HallTrial = { stage: 'forankring', support: 50, startedSeason: 2025, stageStartedRound: 10 }
    const event = forankringResEvent(2025, 'bordlagd')
    const game = withTrial({ ...base, pendingEvents: [event] }, trial)

    const once = resolveEvent(game, event.id, 'ok', undefined, true)
    const gameWithExisting = { ...once, pendingEvents: [event] }
    const twice = resolveEvent(gameWithExisting, event.id, 'ok', undefined, true)

    expect(twice.eventLedger?.filter(e => e.type === 'facility_trial_outcome')).toHaveLength(1)
  })

  it('kravadvancement (ingen terminal outcome) skriver INGEN facility_trial_outcome-post', () => {
    const base = createNewGame({ managerName: 'T', clubId: 'club_forsbacka', season: 2025, seed: 3 })
    const trial: HallTrial = { stage: 'krav', support: 60, startedSeason: 2025, stageStartedRound: 5 }
    const kravEvent: GameEvent = {
      id: 'hallprocess_krav_adv_s2025',
      type: 'hallProcess',
      title: 'Kraven är uppfyllda',
      body: 'x',
      choices: [{
        id: 'ga_vidare', label: 'Gå vidare', subtitle: '',
        effect: { type: 'hallProcess', hallProcessData: JSON.stringify({ stage: 'forhandling', stageStartedRound: 20 }) },
      }],
      resolved: false,
    }
    const game = withTrial({ ...base, pendingEvents: [kravEvent] }, trial)

    const result = resolveEvent(game, kravEvent.id, 'ga_vidare', undefined, true)

    expect(result.eventLedger?.find(e => e.type === 'facility_trial_outcome')).toBeUndefined()
  })
})
