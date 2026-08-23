/**
 * O2 lager 2 + lager 1 (Jacobs dom 2026-08-24).
 *
 * Lager 2: event_crisis_awareness (fas 1) var byte-identiska val
 * (accept_meeting/propose_club, samma effekt, ingen arkivering) — genuint
 * tomt val. Konverterat till ambient (choices:[]) — tillståndsövergången
 * sker nu vid genereringen, inte via resolution.
 *
 * Lager 1: ask_mecenat (fas 3) hade ett aldrig kodat "lojalitet −30"-löfte.
 * Wirad mot targetMecenatId (tie-break: högst happiness) + generationsgrind
 * (erbjuds bara med minst en aktiv mecenat).
 */
import { describe, it, expect } from 'vitest'
import { checkEconomicCrisis } from '../economicCrisisService'
import { resolveEvent } from '../events/eventResolver'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../worldGenerator'
import type { SaveGame } from '../../entities/SaveGame'
import type { Mecenat } from '../../entities/Mecenat'

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  const template = CLUB_TEMPLATES[0]
  const game = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
  return { ...game, clubs: game.clubs.map(c => c.id === game.managedClubId ? { ...c, finances: -250_000 } : c), ...overrides }
}

function makeMecenat(overrides: Partial<Mecenat> = {}): Mecenat {
  return {
    id: 'mec1', name: 'Björn Lindqvist', gender: 'male', business: 'Lindqvist AB',
    businessType: 'it_miljonär', wealth: 50, personality: 'kalkylator', influence: 15,
    happiness: 70, goodwill: 60, contribution: 100000, totalContributed: 0, demands: [],
    socialExpectations: [], isActive: true, arrivedSeason: 1, silentShout: 0,
    ...overrides,
  }
}

describe('event_crisis_awareness (fas 1) — ambient, ingen fejkad valkontrast', () => {
  it('genererar med choices:[] — inget val att göra', () => {
    const game = makeGame()
    const { event } = checkEconomicCrisis(game, 1)
    expect(event).not.toBeNull()
    expect(event!.choices).toEqual([])
  })

  it('economicCrisisState sätts DIREKT vid generering, inte via resolution', () => {
    const game = makeGame()
    const { economicCrisisState } = checkEconomicCrisis(game, 1)
    expect(economicCrisisState).toBeDefined()
    expect(economicCrisisState!.phase).toBe('awareness')
    expect(economicCrisisState!.startedSeason).toBe(game.currentSeason)
  })

  it('efter att tillståndet väl är satt (nästa körning) genereras fas 1 aldrig igen — fas 2 tar över', () => {
    const game = makeGame()
    const { economicCrisisState } = checkEconomicCrisis(game, 1)
    const gameWithCrisis = { ...game, economicCrisisState: economicCrisisState! }
    const secondCheck = checkEconomicCrisis(gameWithCrisis, 1)
    // Samma omgång, fas 2 kräver +3 omgångar — ingen ny fas-1-generering,
    // och inget nytt event alls än (för tidigt för fas 2).
    expect(secondCheck.event).toBeNull()
    expect(secondCheck.economicCrisisState).toEqual(economicCrisisState)
  })

  it('resolveEvent (ambient_dismiss-mönstret) tar bara bort ur kön, kraschar inte på ett choice-löst event', () => {
    const game = makeGame()
    const { event } = checkEconomicCrisis(game, 1)
    let g = { ...game, pendingEvents: [event!] }
    g = resolveEvent(g, event!.id, 'ambient_dismiss')
    expect(g.pendingEvents).toEqual([])
  })
})

describe('ask_mecenat (fas 3) — generationsgrind + tie-break', () => {
  const crisisAtPhase3Start: SaveGame['economicCrisisState'] = {
    startedSeason: 1, startedMatchday: 1, phase: 'pressure', eventsFired: ['pressure'],
  }

  it('utan aktiv mecenat: ask_mecenat erbjuds INTE alls', () => {
    const game = makeGame({ economicCrisisState: crisisAtPhase3Start, mecenater: [] })
    const { event } = checkEconomicCrisis(game, 10)
    expect(event!.choices.map(c => c.id)).toEqual(['sell_star', 'take_loan'])
  })

  it('med en aktiv mecenat: ask_mecenat erbjuds och targetar den mecenaten', () => {
    const mec = makeMecenat({ happiness: 55 })
    const game = makeGame({ economicCrisisState: crisisAtPhase3Start, mecenater: [mec] })
    const { event } = checkEconomicCrisis(game, 10)
    const askMecenat = event!.choices.find(c => c.id === 'ask_mecenat')!
    expect(askMecenat).toBeDefined()
    expect(askMecenat.effect.targetMecenatId).toBe('mec1')
    expect(askMecenat.effect.mecenatHappinessDelta).toBe(-30)
  })

  it('flera aktiva mecenater: tie-break väljer den med HÖGST happiness', () => {
    const mecLow = makeMecenat({ id: 'mec-low', happiness: 30 })
    const mecHigh = makeMecenat({ id: 'mec-high', happiness: 85 })
    const game = makeGame({ economicCrisisState: crisisAtPhase3Start, mecenater: [mecLow, mecHigh] })
    const { event } = checkEconomicCrisis(game, 10)
    const askMecenat = event!.choices.find(c => c.id === 'ask_mecenat')!
    expect(askMecenat.effect.targetMecenatId).toBe('mec-high')
  })

  it('inaktiva mecenater räknas inte som "aktiv" för grinden', () => {
    const mecInactive = makeMecenat({ isActive: false, happiness: 90 })
    const game = makeGame({ economicCrisisState: crisisAtPhase3Start, mecenater: [mecInactive] })
    const { event } = checkEconomicCrisis(game, 10)
    expect(event!.choices.map(c => c.id)).toEqual(['sell_star', 'take_loan'])
  })

  it('resolution: mecenatens happiness sänks med exakt 30, andra mecenater orörda', () => {
    const target = makeMecenat({ id: 'mec-target', happiness: 60 })
    const other = makeMecenat({ id: 'mec-other', happiness: 60 })
    let game = makeGame({ economicCrisisState: crisisAtPhase3Start, mecenater: [target, other] })
    const { event } = checkEconomicCrisis(game, 10)
    game = { ...game, pendingEvents: [event!] }

    game = resolveEvent(game, event!.id, 'ask_mecenat')

    const updatedTarget = game.mecenater!.find(m => m.id === 'mec-target')!
    const updatedOther = game.mecenater!.find(m => m.id === 'mec-other')!
    expect(updatedTarget.happiness).toBe(30)
    expect(updatedOther.happiness).toBe(60)
  })

  it('resolution: pengarna appliceras fortfarande (+200 000 kr)', () => {
    const target = makeMecenat()
    let game = makeGame({ economicCrisisState: crisisAtPhase3Start, mecenater: [target] })
    const startFinances = game.clubs.find(c => c.id === game.managedClubId)!.finances
    const { event } = checkEconomicCrisis(game, 10)
    game = { ...game, pendingEvents: [event!] }

    game = resolveEvent(game, event!.id, 'ask_mecenat')

    const endFinances = game.clubs.find(c => c.id === game.managedClubId)!.finances
    expect(endFinances).toBe(startFinances + 200_000)
  })

  it('happiness clampas vid 0, sänks aldrig under', () => {
    const target = makeMecenat({ happiness: 10 })
    let game = makeGame({ economicCrisisState: crisisAtPhase3Start, mecenater: [target] })
    const { event } = checkEconomicCrisis(game, 10)
    game = { ...game, pendingEvents: [event!] }

    game = resolveEvent(game, event!.id, 'ask_mecenat')

    expect(game.mecenater!.find(m => m.id === 'mec1')!.happiness).toBe(0)
  })
})
