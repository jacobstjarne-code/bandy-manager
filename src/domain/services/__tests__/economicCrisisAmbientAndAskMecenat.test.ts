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
import { classifyEventNature } from '../granskaEventClassifier'
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
    g = resolveEvent(g, event!.id, 'ambient_dismiss', undefined, true)
    expect(g.pendingEvents).toEqual([])
  })

  // A-H10 (SEXSÄSONGSAUDITEN 2026-08-26): innan fixen klassade
  // classifyEventNature() ALLA criticalEconomy-typer som 'critical' oavsett
  // choices.length. Det gav ett kriskort utan knappar i Granska (fas 1 har
  // choices:[] avsiktligt) samtidigt som unresolvedCritical-räknaren blockerade
  // "Fortsätt" — soft-lock, observerat efter en förlorad slutspelsmatch med
  // aktiv ekonomisk kris. Detta är regressionstestet för det.
  it('regression: fas 1-eventet klassas ALDRIG critical i Granska (skulle blockera Fortsätt utan ett synligt val)', () => {
    const game = makeGame()
    const { event } = checkEconomicCrisis(game, 1)
    expect(classifyEventNature(event!)).toBe('reactions')
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

    game = resolveEvent(game, event!.id, 'ask_mecenat', undefined, true)

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

    game = resolveEvent(game, event!.id, 'ask_mecenat', undefined, true)

    const endFinances = game.clubs.find(c => c.id === game.managedClubId)!.finances
    expect(endFinances).toBe(startFinances + 200_000)
  })

  it('happiness clampas vid 0, sänks aldrig under', () => {
    const target = makeMecenat({ happiness: 10 })
    let game = makeGame({ economicCrisisState: crisisAtPhase3Start, mecenater: [target] })
    const { event } = checkEconomicCrisis(game, 10)
    game = { ...game, pendingEvents: [event!] }

    game = resolveEvent(game, event!.id, 'ask_mecenat', undefined, true)

    expect(game.mecenater!.find(m => m.id === 'mec1')!.happiness).toBe(0)
  })
})

describe('fas 2 — beslutet konsumeras', () => {
  it('presenterad plan kan inte återgenerera samma huvudsponsorkort', () => {
    let game = makeGame({
      economicCrisisState: {
        startedSeason: 1,
        startedMatchday: 1,
        phase: 'awareness',
        eventsFired: ['awareness'],
      },
    })
    const { event } = checkEconomicCrisis(game, 4)
    expect(event?.id).toBe(`event_crisis_pressure_${game.currentSeason}`)
    game = resolveEvent({ ...game, pendingEvents: [event!] }, event!.id, 'present_plan', undefined, true)

    expect(game.pendingEvents).toEqual([])
    expect(game.economicCrisisState?.phase).toBe('pressure')
    expect(game.economicCrisisState?.eventsFired).toContain('pressure')
    expect(game.resolvedEventIds).toContain(event!.id)
    expect(checkEconomicCrisis(game, 5).event).toBeNull()
  })
})

// A-H10 invariant sweep: kör alla tre kriskort-faser under sämsta möjliga
// spelläge (noll mecenater, noll sponsorer, ingen aktiv spelare i truppen) och
// bekräfta att INGEN fas ger ett event som Granska skulle klassa 'critical'
// med noll val. Detta är precis det scenario auditen bad om: "iterera alla
// crisis-card-definitioner och action-filtreringen under ett worst-case
// spelläge, assert att varje fortfarande ger ≥1 enabled action".
describe('A-H10 invariant: unresolvedBlockingCount > 0 ⇒ minst en synlig enabled action', () => {
  function assertNeverBlockedWithoutAction(event: SaveGame['pendingEvents'][number] | null) {
    if (!event) return
    const nature = classifyEventNature(event)
    if (nature === 'critical') {
      expect(event.choices.length).toBeGreaterThan(0)
    }
  }

  it('fas 1 (awareness), noll resurser', () => {
    const game = makeGame({ mecenater: [], sponsors: [], players: [] })
    const { event } = checkEconomicCrisis(game, 1)
    assertNeverBlockedWithoutAction(event)
  })

  it('fas 2 (pressure), noll resurser', () => {
    const crisis: SaveGame['economicCrisisState'] = {
      startedSeason: 1, startedMatchday: 1, phase: 'awareness', eventsFired: ['awareness'],
    }
    const game = makeGame({ economicCrisisState: crisis, mecenater: [], sponsors: [], players: [] })
    const { event } = checkEconomicCrisis(game, 10)
    assertNeverBlockedWithoutAction(event)
  })

  it('fas 3 (decision), noll resurser (inga mecenater, ingen kvarvarande spelare)', () => {
    const crisis: SaveGame['economicCrisisState'] = {
      startedSeason: 1, startedMatchday: 1, phase: 'pressure', eventsFired: ['pressure'],
    }
    const game = makeGame({ economicCrisisState: crisis, mecenater: [], sponsors: [], players: [] })
    const { event } = checkEconomicCrisis(game, 10)
    assertNeverBlockedWithoutAction(event)
    // fas 3 ska fortfarande erbjuda minst take_loan även utan spelare att sälja
    // eller mecenat att fråga.
    expect(event!.choices.map(c => c.id)).toContain('take_loan')
  })
})
