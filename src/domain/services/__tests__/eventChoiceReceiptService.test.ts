import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import type { GameEvent } from '../../entities/GameEvent'
import { CLUB_TEMPLATES } from '../worldGenerator'
import { captureResolvedChoiceOutcome, formatResolvedChoiceOutcome } from '../eventChoiceReceiptService'
import { resolveEvent } from '../events/eventResolver'

function baseGame() {
  const template = CLUB_TEMPLATES[0]
  return createNewGame({ managerName: 'O12', clubId: template.id, seed: 12 })
}

describe('O12 §2 — exakt efterkvitto', () => {
  it('diffar faktisk state och formaterar exakta tal först efter valet', () => {
    const before = baseGame()
    const club = before.clubs.find(candidate => candidate.id === before.managedClubId)!
    const after = {
      ...before,
      fanMood: (before.fanMood ?? 50) + 4,
      communityStanding: (before.communityStanding ?? 50) - 3,
      clubs: before.clubs.map(candidate => candidate.id === club.id
        ? { ...candidate, finances: candidate.finances + 8_000 }
        : candidate),
    }

    const rows = captureResolvedChoiceOutcome(before, after)
    expect(rows).toEqual([
      { resource: 'finances', delta: 8_000 },
      { resource: 'fanMood', delta: 4 },
      { resource: 'communityStanding', delta: -3 },
    ])
    expect(formatResolvedChoiceOutcome(rows)).toBe(
      'Kassan +8 000 kr · Stämningen på läktaren +4 · Orten −3',
    )
  })

  it('resolveEvent sparar clampad verklig delta, inte det deklarerade beloppet', () => {
    let game = baseGame()
    game = {
      ...game,
      clubs: game.clubs.map(club => club.id === game.managedClubId ? { ...club, reputation: 99 } : club),
    }
    const event: GameEvent = {
      id: 'o12_clamp', type: 'communityEvent', title: 't', body: 'b', resolved: false,
      choices: [
        { id: 'yes', label: 'Gör det', subtitle: 'stärker klubbens rykte', effect: { type: 'reputation', amount: 5 } },
        { id: 'no', label: 'Avstå', effect: { type: 'noOp' } },
      ],
    }
    game = { ...game, pendingEvents: [event] }

    const resolved = resolveEvent(game, event.id, 'yes', undefined, true)
    expect(resolved.resolvedChoices?.at(-1)?.outcomeDeltas).toEqual([
      { resource: 'reputation', delta: 1 },
    ])
  })

  it('samlar en lagbred moraländring utan att läcka dolda spelarvärden', () => {
    const before = baseGame()
    const managedIds = new Set(before.clubs.find(club => club.id === before.managedClubId)!.squadPlayerIds)
    const prepared = {
      ...before,
      players: before.players.map(player => managedIds.has(player.id) ? { ...player, morale: 98 } : player),
    }
    const after = {
      ...prepared,
      players: prepared.players.map(player => managedIds.has(player.id) ? { ...player, morale: 100 } : player),
    }

    const morale = captureResolvedChoiceOutcome(prepared, after).filter(row => row.resource === 'morale')
    expect(morale).toEqual([{
      resource: 'morale',
      delta: 2,
      subjectName: `Truppen (${managedIds.size} spelare)`,
    }])
  })
})
