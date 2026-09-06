import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../createNewGame'
import { FORMATIONS, type FormationType } from '../../../../domain/entities/Formation'
import { ClubStyle } from '../../../../domain/enums'
import { generateAiLineup } from '../matchSimProcessor'

const EXPECTED_FORMATION: Record<ClubStyle, FormationType> = {
  [ClubStyle.Defensive]: '541_hem',
  [ClubStyle.Balanced]: '532_tvatoppar',
  [ClubStyle.Attacking]: '532_ytterben',
  [ClubStyle.Physical]: '523_hog',
  [ClubStyle.Technical]: '532_triangel',
}

describe('generateAiLineup — Formation V2', () => {
  it.each(Object.values(ClubStyle))(
    'sparar en komplett slot-mappning för AI-stilen %s',
    style => {
      const game = createNewGame({ managerName: 'AI-slot-test', clubId: 'club_malilla', seed: 731 })
      const club = game.clubs.find(candidate => candidate.id === game.managedClubId)!
      const formation = EXPECTED_FORMATION[style]

      const { selection } = generateAiLineup(
        { ...club, preferredStyle: style },
        game.players,
        () => 0.5,
      )

      expect(selection.tactic.formation).toBe(formation)
      expect(Object.keys(selection.tactic.lineupSlots ?? {})).toEqual(
        FORMATIONS[formation].slots.map(slot => slot.id),
      )

      const slottedPlayerIds = Object.values(selection.tactic.lineupSlots ?? {})
        .filter((id): id is string => id !== null)
      expect(slottedPlayerIds).toHaveLength(11)
      expect(new Set(slottedPlayerIds).size).toBe(11)
      expect(new Set(slottedPlayerIds)).toEqual(new Set(selection.startingPlayerIds))
    },
  )
})
