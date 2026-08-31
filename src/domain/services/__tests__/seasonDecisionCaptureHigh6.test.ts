/**
 * HIGH 6 (auditen 2026-08-29) — de tre NYA kandidatkällorna för årsbokens
 * "säsongens viktigaste beslut": mecenatkonflikten, kaptensmötet och
 * anläggningsbygget.
 *
 * Varför en egen fil med `vi.mock`: mallarna ersätts med maskinläsbara strängar
 * så att den FAKTISKA verifierings- och klassificeringslogiken (namedPerson,
 * irreversible, tension, moneyAmount, systemsAffectedCount och kollen mot
 * speltillståndet) kan testas i isolering från den levererade prosan. De riktiga
 * omockade årsboksraderna bevakas i seasonDecisionCaptureService.test.ts.
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('../../data/seasonDecisionSentences', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../data/seasonDecisionSentences')>()
  return {
    ...actual,
    getMecenatConflictSideSentence: (t: { backed: string; other: string }) =>
      `MALL backed=${t.backed} other=${t.other}`,
    getCaptainTakeChargeSentence: (t: { captain: string; last: string }) =>
      `MALL take_charge captain=${t.captain} last=${t.last}`,
    getCaptainSupportSentence: (t: { captain: string; last: string }) =>
      `MALL support captain=${t.captain} last=${t.last}`,
    getFacilityBuildSentence: (t: { facility: string; cost: string }) =>
      `MALL facility=${t.facility} cost=${t.cost}`,
  }
})

import { captureSystemDecision, captureFacilityBuildDecision } from '../seasonDecisionCaptureService'
import { resolveEvent } from '../events/eventResolver'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../worldGenerator'
import type { SaveGame } from '../../entities/SaveGame'
import type { GameEvent } from '../../entities/GameEvent'
import type { Mecenat } from '../../entities/Mecenat'

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  const template = CLUB_TEMPLATES[0]
  const game = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
  return { ...game, ...overrides }
}

function makeMecenat(overrides: Partial<Mecenat> = {}): Mecenat {
  return {
    id: 'mec1', name: 'Björn Lindqvist', gender: 'male', business: 'Lindqvist AB',
    businessType: 'it_miljonär', wealth: 50, personality: 'kalkylator', influence: 15,
    happiness: 60, goodwill: 60, contribution: 100000, totalContributed: 0, demands: [],
    socialExpectations: [], isActive: true, arrivedSeason: 1, silentShout: 0,
    ...overrides,
  }
}

// ── Källa 1: mecenatkonflikten ────────────────────────────────────────────

/** Exakt samma valform som mecenatService.generateMecenatConflictEvent bygger. */
function conflictEvent(): GameEvent {
  return {
    id: 'event_conflict_mec1_mec2', type: 'mecenatEvent',
    title: 'Konflikt', body: 'b',
    choices: [
      {
        id: 'side_mec1', label: 'Stöd A',
        effect: { type: 'multiEffect', subEffects: JSON.stringify([
          { type: 'mecenatHappiness', targetMecenatId: 'mec1', amount: 15 },
          { type: 'mecenatHappiness', targetMecenatId: 'mec2', amount: -10 },
        ]) },
      },
      {
        id: 'side_mec2', label: 'Stöd B',
        effect: { type: 'multiEffect', subEffects: JSON.stringify([
          { type: 'mecenatHappiness', targetMecenatId: 'mec2', amount: 15 },
          { type: 'mecenatHappiness', targetMecenatId: 'mec1', amount: -10 },
        ]) },
      },
      {
        id: 'neutral', label: 'Medla',
        effect: { type: 'multiEffect', subEffects: JSON.stringify([
          { type: 'mecenatHappiness', targetMecenatId: 'mec1', amount: 3 },
          { type: 'mecenatHappiness', targetMecenatId: 'mec2', amount: 3 },
        ]) },
      },
    ],
    resolved: false,
    // Inte systemhandelse — det är HELA poängen med gate-fixen i eventResolver.
  }
}

function conflictStates(beforeA: number, afterA: number, beforeB: number, afterB: number) {
  const gameBefore = makeGame({ mecenater: [
    makeMecenat({ id: 'mec1', name: 'Björn Lindqvist', happiness: beforeA }),
    makeMecenat({ id: 'mec2', name: 'Astrid Wahl', gender: 'female', happiness: beforeB }),
  ] })
  const gameAfter: SaveGame = { ...gameBefore, mecenater: [
    { ...gameBefore.mecenater![0], happiness: afterA },
    { ...gameBefore.mecenater![1], happiness: afterB },
  ] }
  return { gameBefore, gameAfter }
}

describe('HIGH 6 källa 1 — mecenatEvent/side_mec1 + side_mec2', () => {
  it('side_mec1: namngiven person är den du ställde dig bakom, spänning sann, två system', () => {
    const { gameBefore, gameAfter } = conflictStates(60, 75, 60, 50)
    const c = captureSystemDecision(gameBefore, gameAfter, conflictEvent(), 'side_mec1')
    expect(c).not.toBeNull()
    expect(c!.namedPerson).toBe('Björn Lindqvist')
    expect(c!.tension).toBe(true)
    expect(c!.irreversible).toBe(false)
    expect(c!.systemsAffectedCount).toBe(2)
    expect(c!.moneyAmount).toBeUndefined()
    expect(c!.sentence).toBe('MALL backed=Björn Lindqvist other=Astrid Wahl')
  })

  it('side_mec2: spegelbilden byter person — sidan läses ur effekten, inte ur choiceId', () => {
    const { gameBefore, gameAfter } = conflictStates(60, 50, 60, 75)
    const c = captureSystemDecision(gameBefore, gameAfter, conflictEvent(), 'side_mec2')
    expect(c).not.toBeNull()
    expect(c!.namedPerson).toBe('Astrid Wahl')
    expect(c!.sentence).toBe('MALL backed=Astrid Wahl other=Björn Lindqvist')
  })

  it('PÅSTÅENDEKARTAN: ingen kandidat om den bakomstådda inte faktiskt steg (klamrad på 100)', () => {
    const { gameBefore, gameAfter } = conflictStates(100, 100, 60, 50)
    expect(captureSystemDecision(gameBefore, gameAfter, conflictEvent(), 'side_mec1')).toBeNull()
  })

  it('PÅSTÅENDEKARTAN: ingen kandidat om den bortvalda inte faktiskt föll (klamrad på 0)', () => {
    const { gameBefore, gameAfter } = conflictStates(60, 75, 0, 0)
    expect(captureSystemDecision(gameBefore, gameAfter, conflictEvent(), 'side_mec1')).toBeNull()
  })

  it('ingen kandidat om mecenaten saknas i speltillståndet', () => {
    const game = makeGame({ mecenater: [] })
    expect(captureSystemDecision(game, game, conflictEvent(), 'side_mec1')).toBeNull()
  })

  it('neutral har medvetet INGEN byggare — ingen part valdes bort', () => {
    const { gameBefore, gameAfter } = conflictStates(60, 63, 60, 63)
    expect(captureSystemDecision(gameBefore, gameAfter, conflictEvent(), 'neutral')).toBeNull()
  })
})

// ── Källa 1, regressionsvakt för eventResolver-grinden ────────────────────

describe('HIGH 6 — eventResolver fångar beslut UTAN systemhandelse (regression)', () => {
  it('mecenatEvent/side_mec1 utan systemhandelse hamnar i seasonDecisionCandidates', () => {
    const event = conflictEvent()
    expect(event.systemhandelse).toBeUndefined() // förutsättningen testet vilar på
    const game = makeGame({
      mecenater: [
        makeMecenat({ id: 'mec1', name: 'Björn Lindqvist', happiness: 60 }),
        makeMecenat({ id: 'mec2', name: 'Astrid Wahl', gender: 'female', happiness: 60 }),
      ],
      pendingEvents: [event],
    })
    const resolved = resolveEvent(game, event.id, 'side_mec1', undefined, true)
    const candidate = resolved.seasonDecisionCandidates?.find(c => c.eventId === event.id)
    expect(candidate).toBeDefined()
    expect(candidate!.namedPerson).toBe('Björn Lindqvist')
  })

  // HIGH 6, attributionshålet (Jacobs körorder 2026-08-31): den STALE-grinden
  // ovan doldes en andra bugg — anropet saknade en kontroll av VEM som löste
  // eventet. Samma mecenatkonflikt, men auto-resolvad (sim-the-rest/rollover,
  // madeByPlayer=false), ska INTE producera en kandidat — spelaren var inte
  // med om att fatta beslutet, och årsboken ska inte hävda att de var det.
  it('mecenatEvent/side_mec1 AUTO-RESOLVAD (madeByPlayer=false) ger INGEN kandidat', () => {
    const event = conflictEvent()
    const game = makeGame({
      mecenater: [
        makeMecenat({ id: 'mec1', name: 'Björn Lindqvist', happiness: 60 }),
        makeMecenat({ id: 'mec2', name: 'Astrid Wahl', gender: 'female', happiness: 60 }),
      ],
      pendingEvents: [event],
    })
    const resolved = resolveEvent(game, event.id, 'side_mec1', undefined, false)
    const candidate = resolved.seasonDecisionCandidates?.find(c => c.eventId === event.id)
    expect(candidate).toBeUndefined()
  })
})

// ── Källa 2: kaptensmötet ─────────────────────────────────────────────────

/** Samma valform som eventFactories.generateCaptainSpeechEvent bygger. */
function captainEvent(captainId: string, clubId: string): GameEvent {
  return {
    id: 'event_captain_speech_s1', type: 'captainSpeech', title: 't', body: 'b',
    choices: [
      {
        id: 'support', label: 'Ja',
        effect: { type: 'multiEffect', subEffects: JSON.stringify([
          { type: 'teamBoostMorale', amount: 5, targetClubId: clubId },
          { type: 'boardPatience', amount: -3 },
        ]) },
      },
      { id: 'take_charge', label: 'Jag sköter det', effect: { type: 'boostMorale', value: -5, targetPlayerId: captainId } },
      { id: 'decline', label: 'Nej', effect: { type: 'noOp', value: 0 } },
    ],
    resolved: false,
    // Inte systemhandelse — se gate-fixen ovan.
  }
}

function captainSetup() {
  const base = makeGame({ boardPatience: 70 })
  const captain = base.players.find(p => p.clubId === base.managedClubId && p.morale > 10)!
  return { base, captain, event: captainEvent(captain.id, base.managedClubId) }
}

describe('HIGH 6 källa 2 — captainSpeech/take_charge', () => {
  it('kaptenens identitet läses ur valets targetPlayerId, moralkostnaden verifieras', () => {
    const { base, captain, event } = captainSetup()
    const gameAfter: SaveGame = {
      ...base,
      players: base.players.map(p => p.id === captain.id ? { ...p, morale: p.morale - 5 } : p),
    }
    const c = captureSystemDecision(base, gameAfter, event, 'take_charge')
    expect(c).not.toBeNull()
    expect(c!.namedPerson).toBe(`${captain.firstName} ${captain.lastName}`)
    expect(c!.irreversible).toBe(false)
    expect(c!.tension).toBe(true)
    expect(c!.systemsAffectedCount).toBe(1)
    expect(c!.sentence).toBe(`MALL take_charge captain=${captain.firstName} ${captain.lastName} last=${captain.lastName}`)
  })

  it('PÅSTÅENDEKARTAN: ingen kandidat om moralen inte faktiskt sjönk', () => {
    const { base, event } = captainSetup()
    expect(captureSystemDecision(base, base, event, 'take_charge')).toBeNull()
  })

  it('decline har medvetet INGEN byggare — noOp, ingen betalar något', () => {
    const { base, event } = captainSetup()
    expect(captureSystemDecision(base, base, event, 'decline')).toBeNull()
  })
})

describe('HIGH 6 källa 2 — captainSpeech/support', () => {
  it('två system åt varsitt håll: lagmoral upp, styrelsens tålamod ned', () => {
    const { base, captain, event } = captainSetup()
    const gameAfter: SaveGame = {
      ...base,
      boardPatience: 67,
      players: base.players.map(p =>
        p.clubId === base.managedClubId ? { ...p, morale: Math.min(100, p.morale + 5) } : p
      ),
    }
    const c = captureSystemDecision(base, gameAfter, event, 'support')
    expect(c).not.toBeNull()
    expect(c!.namedPerson).toBe(`${captain.firstName} ${captain.lastName}`)
    expect(c!.tension).toBe(true)
    expect(c!.systemsAffectedCount).toBe(2)
    expect(c!.sentence).toContain('MALL support')
  })

  it('PÅSTÅENDEKARTAN: ingen kandidat om styrelsens tålamod inte faktiskt föll', () => {
    const { base, event } = captainSetup()
    const gameAfter: SaveGame = {
      ...base,
      players: base.players.map(p =>
        p.clubId === base.managedClubId ? { ...p, morale: Math.min(100, p.morale + 5) } : p
      ),
    }
    expect(captureSystemDecision(base, gameAfter, event, 'support')).toBeNull()
  })

  it('PÅSTÅENDEKARTAN: ingen kandidat om ingen spelares moral faktiskt steg', () => {
    const { base, event } = captainSetup()
    const gameAfter: SaveGame = { ...base, boardPatience: 67 }
    expect(captureSystemDecision(base, gameAfter, event, 'support')).toBeNull()
  })
})

// ── Källa 3: anläggningsbygget ────────────────────────────────────────────

function facilityStates(nodeId: string, cost: number) {
  const gameBefore = makeGame({ facilityState: { builtNodeIds: [] } })
  const club = gameBefore.clubs.find(c => c.id === gameBefore.managedClubId)!
  const gameAfter: SaveGame = {
    ...gameBefore,
    facilityState: { builtNodeIds: [], activeProject: { nodeId, startedMatchday: 0, etaMatchday: 8 } },
    clubs: gameBefore.clubs.map(c => c.id === club.id ? { ...c, finances: c.finances - cost } : c),
  }
  return { gameBefore, gameAfter }
}

describe('HIGH 6 källa 3 — anläggningsbygget (utanför GameEvent)', () => {
  it('irreversibelt + spänning räcker för att kvalificera utan namngiven person', () => {
    const { gameBefore, gameAfter } = facilityStates('varmestuga', 120000)
    const c = captureFacilityBuildDecision(gameBefore, gameAfter, 'varmestuga', 120000)
    expect(c).not.toBeNull()
    expect(c!.namedPerson).toBeUndefined()
    expect(c!.irreversible).toBe(true)
    expect(c!.tension).toBe(true)
    expect(c!.moneyAmount).toBe(120000)
    expect(c!.eventId).toBe(`facility_varmestuga_s${gameAfter.currentSeason}`)
    expect(c!.sentence).toBe('MALL facility=Värmestuga cost=120 tkr')
  })

  it('systemsAffectedCount räknas ur nodens egen konsekvenstabell, inte en gissad siffra', () => {
    const varme = facilityStates('varmestuga', 120000)
    // publik + själ + ekonomi
    expect(captureFacilityBuildDecision(varme.gameBefore, varme.gameAfter, 'varmestuga', 120000)!.systemsAffectedCount).toBe(3)
    const bel = facilityStates('belysning', 240000)
    // ungdom + ekonomi ('publik' är uttryckligen dir:'noll' och räknas inte)
    expect(captureFacilityBuildDecision(bel.gameBefore, bel.gameAfter, 'belysning', 240000)!.systemsAffectedCount).toBe(2)
  })

  it('moneyAmount är vad kassan FAKTISKT tappade, inte det belopp anroparen påstod', () => {
    const { gameBefore, gameAfter } = facilityStates('varmestuga', 84000) // medfinansierad
    const c = captureFacilityBuildDecision(gameBefore, gameAfter, 'varmestuga', 84000)
    expect(c!.moneyAmount).toBe(84000)
  })

  it('PÅSTÅENDEKARTAN: ingen kandidat om bygget inte faktiskt startade', () => {
    const { gameBefore } = facilityStates('varmestuga', 120000)
    const club = gameBefore.clubs.find(c => c.id === gameBefore.managedClubId)!
    const paidButNoProject: SaveGame = {
      ...gameBefore,
      clubs: gameBefore.clubs.map(c => c.id === club.id ? { ...c, finances: c.finances - 120000 } : c),
    }
    expect(captureFacilityBuildDecision(gameBefore, paidButNoProject, 'varmestuga', 120000)).toBeNull()
  })

  it('PÅSTÅENDEKARTAN: ingen kandidat om kassan inte faktiskt debiterades', () => {
    const { gameBefore } = facilityStates('varmestuga', 120000)
    const startedButFree: SaveGame = {
      ...gameBefore,
      facilityState: { builtNodeIds: [], activeProject: { nodeId: 'varmestuga', startedMatchday: 0, etaMatchday: 8 } },
    }
    expect(captureFacilityBuildDecision(gameBefore, startedButFree, 'varmestuga', 120000)).toBeNull()
  })

  it('okänd nod ger ingen kandidat', () => {
    const { gameBefore, gameAfter } = facilityStates('varmestuga', 120000)
    expect(captureFacilityBuildDecision(gameBefore, gameAfter, 'finns_inte', 120000)).toBeNull()
  })
})
