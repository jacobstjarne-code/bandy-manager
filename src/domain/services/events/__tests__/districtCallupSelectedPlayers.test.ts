/**
 * M3 (oberoende speltest- och produktaudit, 5c9a7a8, 2026-08-24):
 * "Kortet nämner 1-2 utvalda, men resolver uppdaterar ALLA ungdomar
 * potential>50. Ingen tvåvägars unavailable-state sätts."
 *
 * Fix: event.selectedPlayerIds bär de EXAKT namngivna spelarna
 * (youthProcessor.ts) och resolvern (eventResolver.ts) verkar bara på dem —
 * inte en nyfiltrering av potentialAbility>50 vid resolveringstillfället,
 * som kan träffa fler/andra spelare än kortet visade. "send" sätter också
 * availabilityUntilRound, som simulateYouthMatch (academyService.ts) nu
 * faktiskt respekterar — kortets löfte "Ej tillgänglig 2 omg" hade
 * tidigare ingen mekanik.
 */
import { describe, it, expect } from 'vitest'
import { resolveEvent } from '../eventResolver'
import { simulateYouthMatch } from '../../academyService'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import type { SaveGame } from '../../../entities/SaveGame'
import type { YouthPlayer } from '../../../entities/Academy'
import type { GameEvent } from '../../../entities/GameEvent'
import { PlayerPosition } from '../../../enums'

function makeYouthPlayer(overrides: Partial<YouthPlayer>): YouthPlayer {
  return {
    id: 'yp_default',
    firstName: 'Test',
    lastName: 'Spelare',
    age: 17,
    position: PlayerPosition.Forward,
    archetype: 'balanced' as YouthPlayer['archetype'],
    currentAbility: 20,
    potentialAbility: 60,
    developmentRate: 50,
    confidence: 50,
    schoolConflict: false,
    seasonGoals: 0,
    seasonAssists: 0,
    readyForPromotion: false,
    roundsReadyForPromotion: 0,
    ...overrides,
  }
}

function makeGameWithYouthCallupEvent(): { game: SaveGame; event: GameEvent } {
  const base = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })

  // Tre spelare kvalificerar för potentialAbility>50 — bara TVÅ av dem
  // ("selected") ska ha namngetts på kortet och vara de resolvern rör.
  const selected1 = makeYouthPlayer({ id: 'yp_selected_1', firstName: 'Erik', potentialAbility: 70, confidence: 40 })
  const selected2 = makeYouthPlayer({ id: 'yp_selected_2', firstName: 'Anton', potentialAbility: 65, confidence: 40 })
  const notSelected = makeYouthPlayer({ id: 'yp_not_selected', firstName: 'Oskar', potentialAbility: 55, confidence: 40 })

  const event: GameEvent = {
    id: 'event_district_callup_8_2025',
    type: 'communityEvent',
    title: 'Juniorlandslagssamling — Erik och Anton',
    body: 'Erik och Anton är kallade till Sveriges P19-samling.',
    selectedPlayerIds: [selected1.id, selected2.id],
    choices: [
      { id: 'send', label: 'Skicka dem', subtitle: '', effect: { type: 'noOp' } },
      { id: 'keep', label: 'Behåll i klubben', subtitle: '', effect: { type: 'noOp' } },
    ],
    resolved: false,
  }

  const game: SaveGame = {
    ...base,
    currentMatchday: 8,
    pendingEvents: [event],
    youthTeam: {
      players: [selected1, selected2, notSelected],
      results: [],
      seasonRecord: { w: 0, d: 0, l: 0, gf: 0, ga: 0 },
      tablePosition: 6,
    },
  }
  return { game, event }
}

describe('event_district_callup_ resolver — M3: bara namngivna spelare, inte hela potentialAbility>50-truppen', () => {
  it('"send" ger confidence/development-bonus ENDAST till selectedPlayerIds, inte notSelected', () => {
    const { game } = makeGameWithYouthCallupEvent()
    const result = resolveEvent(game, 'event_district_callup_8_2025', 'send')

    const selected1 = result.youthTeam!.players.find(p => p.id === 'yp_selected_1')!
    const selected2 = result.youthTeam!.players.find(p => p.id === 'yp_selected_2')!
    const notSelected = result.youthTeam!.players.find(p => p.id === 'yp_not_selected')!

    expect(selected1.confidence).toBe(40 + 15)
    expect(selected2.confidence).toBe(40 + 15)
    // Den avgörande skillnaden mot den gamla buggen: notSelected kvalificerar
    // för potentialAbility>50 (55) men namngavs ALDRIG på kortet.
    expect(notSelected.confidence).toBe(40)
  })

  it('"send" sätter availabilityUntilRound på exakt de skickade spelarna, ingen annan', () => {
    const { game } = makeGameWithYouthCallupEvent()
    const result = resolveEvent(game, 'event_district_callup_8_2025', 'send')

    const selected1 = result.youthTeam!.players.find(p => p.id === 'yp_selected_1')!
    const notSelected = result.youthTeam!.players.find(p => p.id === 'yp_not_selected')!

    expect(selected1.availabilityUntilRound).toBe(8 + 4)
    expect(notSelected.availabilityUntilRound).toBeUndefined()
  })

  it('"keep" ger INGEN availabilityUntilRound, bara confidence-avdrag', () => {
    const { game } = makeGameWithYouthCallupEvent()
    const result = resolveEvent(game, 'event_district_callup_8_2025', 'keep')

    const selected1 = result.youthTeam!.players.find(p => p.id === 'yp_selected_1')!
    expect(selected1.confidence).toBe(40 - 5)
    expect(selected1.availabilityUntilRound).toBeUndefined()
  })
})

describe('simulateYouthMatch — M3: en spelare med aktiv availabilityUntilRound spelar inte matchen', () => {
  it('en bortrest spelare bidrar inte till lagstyrkan och får ingen form-/utvecklingspåverkan', () => {
    const awayStar = makeYouthPlayer({
      id: 'yp_away', firstName: 'Bortrest', currentAbility: 30, confidence: 90, availabilityUntilRound: 12,
    })
    const homeGrinder = makeYouthPlayer({
      id: 'yp_home', firstName: 'Kvar', currentAbility: 10, confidence: 30,
    })
    const team = {
      players: [awayStar, homeGrinder],
      results: [],
      seasonRecord: { w: 0, d: 0, l: 0, gf: 0, ga: 0 },
      tablePosition: 6,
    }

    // round=10 <= availabilityUntilRound(12) → fortfarande borta.
    const rand = () => 0.5
    const result = simulateYouthMatch(team, 'basic', rand, 10)

    const awayAfter = result.updatedPlayers.find(p => p.id === 'yp_away')!
    // Orörd — spelade inte matchen, varken vann eller förlorade på utfallet.
    expect(awayAfter.confidence).toBe(90)
    expect(awayAfter.currentAbility).toBe(30)
  })

  it('samma spelare är tillgänglig och påverkas normalt igen så fort round > availabilityUntilRound', () => {
    const returningPlayer = makeYouthPlayer({
      id: 'yp_returning', firstName: 'Åter', currentAbility: 20, confidence: 50, availabilityUntilRound: 12,
    })
    const team = {
      players: [returningPlayer],
      results: [],
      seasonRecord: { w: 0, d: 0, l: 0, gf: 0, ga: 0 },
      tablePosition: 6,
    }

    const rand = () => 0.1 // vinstutfall
    const result = simulateYouthMatch(team, 'basic', rand, 14) // round 14 > 12

    const after = result.updatedPlayers.find(p => p.id === 'yp_returning')!
    // Spelade matchen — confidence ska ha rört sig (vinst → +delta), inte
    // stå still som i "borta"-testet ovan.
    expect(after.confidence).not.toBe(50)
  })
})
