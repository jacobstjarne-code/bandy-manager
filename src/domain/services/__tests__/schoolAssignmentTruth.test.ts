import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { generateSchoolAssignmentEvent } from '../schoolAssignmentService'
import { resolveEvent } from '../events/eventResolver'
import { getDefaultRolloverChoice, getRolloverPolicy } from '../deferredRolloverService'
import type { SaveGame } from '../../entities/SaveGame'

function game(overrides: Partial<SaveGame> = {}): SaveGame {
  const base = createNewGame({ managerName: 'Test', clubId: 'club_heros', season: 2025, seed: 4 })
  const academyPlayers = base.players
    .filter(player => player.clubId === base.managedClubId)
    .slice(0, 2)
    .map((player, index) => ({
      ...player,
      age: 18 + index,
      academyClubId: base.managedClubId,
    }))
  const academyIds = new Set(academyPlayers.map(player => player.id))
  return {
    ...base,
    players: base.players.map(player => academyIds.has(player.id)
      ? academyPlayers.find(candidate => candidate.id === player.id)!
      : player),
    ...overrides,
  }
}

describe('schoolAssignment — O11:s text/state-kontrakt', () => {
  it('väljer yngsta egna akademispelaren och bygger val enbart från verklig historik', () => {
    const base = game({
      seasonSummaries: [{ season: 2023, finalPosition: 2, playoffResult: 'semifinal' } as never],
      clubLegends: [{
        playerId: 'legend', name: 'A. Legend', position: 'forward', seasons: 7,
        totalGoals: 58, totalAssists: 40, titles: [], retiredSeason: 2024,
      } as never],
    })
    const event = generateSchoolAssignmentEvent(base, 10)
    const expected = base.players
      .filter(player => player.academyClubId === base.managedClubId && player.clubId === base.managedClubId && player.age <= 21)
      .sort((a, b) => a.age - b.age)[0]

    expect(event?.relatedPlayerId).toBe(expected.id)
    expect(event?.choices.map(choice => choice.id)).toEqual(['tell_notable', 'tell_legend', 'tell_now'])
    expect(event?.choices.every(choice => choice.effect.type === 'saveSchoolAssignment' && !!choice.effect.replyText)).toBe(true)
    expect(event?.choices[0]?.label).toContain('2023/24')
    expect(event?.choices[0]?.effect.replyText).toContain('2023/24')
  })

  it('ett redan defererat canonical skolkort kan inte genereras igen', () => {
    const base = game()
    const first = generateSchoolAssignmentEvent(base, 10)!
    expect(generateSchoolAssignmentEvent({ ...base, deferredDecisions: [first] }, 11)).toBeNull()
  })

  it('valet sparar exakt namngiven spelare, label och arkivtext utan dold state-effekt', () => {
    const base = game()
    const event = generateSchoolAssignmentEvent(base, 10)!
    const choice = event.choices.find(candidate => candidate.id === 'tell_now')!
    const prepared = { ...base, pendingEvents: [event] }
    const resolved = resolveEvent(prepared, event.id, choice.id, undefined, true)
    const player = base.players.find(candidate => candidate.id === event.relatedPlayerId)!

    expect(resolved.players).toEqual(prepared.players)
    expect(resolved.clubs).toEqual(prepared.clubs)
    expect(resolved.communityStanding).toBe(prepared.communityStanding)
    expect(resolved.schoolAssignmentArchive?.at(-1)).toEqual({
      season: base.currentSeason,
      youngPlayerName: `${player.firstName} ${player.lastName}`,
      choiceLabel: choice.label,
      archiveText: choice.effect.replyText,
    })
    expect(resolved.schoolAssignmentThisSeason).toBe(base.currentSeason)
    expect(resolved.pendingEvents).toEqual([])
  })

  it('obesvarad intervju rinner ut eftersom inget historieval är neutralt', () => {
    const event = generateSchoolAssignmentEvent(game(), 10)!
    expect(getRolloverPolicy('schoolAssignment')).toBe('expire')
    expect(getDefaultRolloverChoice(event)).toBeNull()
  })
})
