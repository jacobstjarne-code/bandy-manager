/**
 * PÅSTÅENDEKARTAN (2026-08-24), Jacobs prioritet 5 — BoardMeetingScenens
 * hela ton (A/B/C) läste tidigare fulfillmentPct (förra säsongens
 * boardObjectives-måluppfyllelse), en FJÄRDE oberoende formel för styrelsens
 * nöjdhet efter sex kalibreringspass på att ena de tre andra
 * (evaluateBoard, getBoardPatienceZone, growFanbase-fyndet). Nu kopplad till
 * boardPatience via getBoardPatienceZone, samma 50-tröskel som redan är
 * kalibrerad på andra ställen.
 */
import { describe, it, expect } from 'vitest'
import { resolveBoardMeetingState } from '../boardMeetingStateResolver'
import { createNewGame } from '../../useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'
import type { SaveGame } from '../../../domain/entities/SaveGame'

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  const template = CLUB_TEMPLATES[0]
  const game = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
  return { ...game, ...overrides }
}

describe('resolveBoardMeetingState — kopplad till boardPatience (PÅSTÅENDEKARTAN)', () => {
  it('visar exakt samma ordförandenamn som den kanoniska game.board-posten', () => {
    const game = makeGame()
    const chair = game.board?.find(member => member.role === 'ordförande')

    expect(chair).toBeDefined()
    expect(resolveBoardMeetingState(game).chairmanName)
      .toBe(`${chair!.firstName} ${chair!.lastName}`)
  })

  it('säsong 2 (första mötet): alltid A, oavsett boardPatience', () => {
    const game = makeGame({ seasonSummaries: [{ season: 1 } as never], boardPatience: 10 })
    expect(resolveBoardMeetingState(game).state).toBe('A')
  })

  it('säsong 3+, boardPatience >= 50 (stabilt): B, trots att fulfillmentPct skulle sagt C (0%, allt misslyckat)', () => {
    const game = makeGame({
      seasonSummaries: [{ season: 1 } as never, { season: 2 } as never],
      currentSeason: 3,
      boardPatience: 70,
      boardObjectiveHistory: [
        { season: 2, objectiveId: 'o1', result: 'failed', ownerReaction: 'x' },
        { season: 2, objectiveId: 'o2', result: 'failed', ownerReaction: 'y' },
      ],
    })
    const data = resolveBoardMeetingState(game)
    expect(data.fulfillmentPct).toBe(0)
    expect(data.state).toBe('B')
  })

  it('säsong 3+, boardPatience < 50 (under press/ultimatum): C, trots att fulfillmentPct skulle sagt B (100%, allt uppfyllt)', () => {
    const game = makeGame({
      seasonSummaries: [{ season: 1 } as never, { season: 2 } as never],
      currentSeason: 3,
      boardPatience: 20,
      boardObjectiveHistory: [
        { season: 2, objectiveId: 'o1', result: 'met', ownerReaction: 'x' },
        { season: 2, objectiveId: 'o2', result: 'met', ownerReaction: 'y' },
      ],
    })
    const data = resolveBoardMeetingState(game)
    expect(data.fulfillmentPct).toBe(100)
    expect(data.state).toBe('C')
  })

  it('säsong 3+, ingen historik för förra säsongen: faller tillbaka på A (fulfillmentPct === -1)', () => {
    const game = makeGame({
      seasonSummaries: [{ season: 1 } as never, { season: 2 } as never],
      currentSeason: 3,
      boardPatience: 70,
      boardObjectiveHistory: [],
    })
    const data = resolveBoardMeetingState(game)
    expect(data.fulfillmentPct).toBe(-1)
    expect(data.state).toBe('A')
  })
})

describe('resolveBoardMeetingState — tillstånd N (DOM_STYRELSEMOTE_NY_KLUBB_2026-09-10)', () => {
  it('klubbyte mitt i en lång karriär (seasonsAtClub===1, en stängd tidigare spell): N, aldrig A', () => {
    const game = makeGame({
      currentSeason: 6,
      seasonSummaries: [
        { season: 3 } as never, { season: 4 } as never, { season: 5 } as never,
      ],
      boardObjectiveHistory: [], // nollställd av switchManagedClub vid bytet
      managerProfile: {
        firstName: 'Test', lastName: 'Manager', age: 40, hometown: 'Ort',
        burnoutScore: 0, burnoutHistory: [], careerWins: 10, careerDraws: 2, careerLosses: 5,
        seasonsAtClub: 1,
        contractUntilSeason: 8,
        monthlySalary: 30,
        coachRivalries: [],
        clubSpells: [
          { clubId: 'club_gamla', clubName: 'Gamla BK', fromSeason: 1, toSeason: 5, endedBy: 'fired' },
          { clubId: 'club_forsbacka', clubName: 'Forsbacka BK', fromSeason: 6 },
        ],
      },
    })
    expect(resolveBoardMeetingState(game).state).toBe('N')
  })

  it('karriärens allra första klubb, säsong 2 (seasonsAtClub===1, ingen stängd spell): fortsatt A', () => {
    const game = makeGame({
      currentSeason: 2,
      seasonSummaries: [{ season: 1 } as never],
      managerProfile: {
        firstName: 'Test', lastName: 'Manager', age: 30, hometown: 'Ort',
        burnoutScore: 0, burnoutHistory: [], careerWins: 5, careerDraws: 1, careerLosses: 3,
        seasonsAtClub: 1,
        contractUntilSeason: 4,
        monthlySalary: 20,
        coachRivalries: [],
        clubSpells: [{ clubId: 'club_forsbacka', clubName: 'Forsbacka BK', fromSeason: 1 }],
      },
    })
    expect(resolveBoardMeetingState(game).state).toBe('A')
  })

  it('inget managerProfile (äldre save): faller inte tillbaka på N', () => {
    const game = makeGame({
      seasonSummaries: [{ season: 1 } as never],
      managerProfile: undefined,
    })
    expect(resolveBoardMeetingState(game).state).not.toBe('N')
  })

  it('bygger övertaganderaden ur manager_appointed + föregående klubbperiod', () => {
    const game = makeGame({
      currentSeason: 6,
      managerProfile: {
        firstName: 'Test', lastName: 'Manager', age: 40, hometown: 'Ort',
        burnoutScore: 0, burnoutHistory: [], careerWins: 10, careerDraws: 2, careerLosses: 5,
        seasonsAtClub: 1, contractUntilSeason: 8, monthlySalary: 30, coachRivalries: [],
        clubSpells: [
          { clubId: 'club_gamla', clubName: 'Gamla BK', fromSeason: 1, toSeason: 5, endedBy: 'fired' },
          { clubId: CLUB_TEMPLATES[0].id, clubName: CLUB_TEMPLATES[0].name, fromSeason: 6 },
        ],
      },
      eventLedger: [{
        type: 'manager_appointed', semanticKey: 'manager_appointed_test',
        clubId: CLUB_TEMPLATES[0].id, season: 6, matchday: 0, significance: 65,
      }],
    })

    expect(resolveBoardMeetingState(game).takeoverLine)
      .toBe('Du kom hit efter att Gamla BK tackat för sig.')
  })

  it('visar återkomstklausulen, men fabricerar ingen rad utan liggarbelägg', () => {
    const profile = {
      firstName: 'Test', lastName: 'Manager', age: 40, hometown: 'Ort',
      burnoutScore: 0, burnoutHistory: [], careerWins: 10, careerDraws: 2, careerLosses: 5,
      seasonsAtClub: 1, contractUntilSeason: 8, monthlySalary: 30, coachRivalries: [],
      clubSpells: [
        { clubId: CLUB_TEMPLATES[0].id, clubName: CLUB_TEMPLATES[0].name, fromSeason: 1, toSeason: 2, endedBy: 'voluntary' as const },
        { clubId: 'club_gamla', clubName: 'Gamla BK', fromSeason: 3, toSeason: 5, endedBy: 'voluntary' as const },
        { clubId: CLUB_TEMPLATES[0].id, clubName: CLUB_TEMPLATES[0].name, fromSeason: 6 },
      ],
    }
    const withoutEvidence = makeGame({ currentSeason: 6, managerProfile: profile, eventLedger: [] })
    expect(resolveBoardMeetingState(withoutEvidence).takeoverLine).toBeUndefined()

    const withEvidence = {
      ...withoutEvidence,
      eventLedger: [{
        type: 'manager_appointed' as const, semanticKey: 'manager_appointed_return',
        clubId: CLUB_TEMPLATES[0].id, season: 6, matchday: 0, significance: 65,
      }],
    }
    expect(resolveBoardMeetingState(withEvidence).takeoverLine)
      .toBe('Du lämnade Gamla BK för det här. · Du har suttit i det här båset förr. De minns vem du är.')
  })
})
