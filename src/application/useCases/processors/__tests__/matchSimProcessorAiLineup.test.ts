import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../createNewGame'
import { FORMATIONS, type FormationType } from '../../../../domain/entities/Formation'
import { ClubStyle, PlayerPosition } from '../../../../domain/enums'
import { FATIGUE_AVAILABILITY_FLOOR } from '../../../../domain/services/squadEvaluator'
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

  it('delar fitnessgolv och matchformskurva med spelarens autofyllnad', () => {
    const game = createNewGame({ managerName: 'AI-fitness-test', clubId: 'club_malilla', seed: 732 })
    const club = game.clubs.find(candidate => candidate.id === game.managedClubId)!
    const clubPlayers = game.players.filter(player => club.squadPlayerIds.includes(player.id))
    const exhausted = clubPlayers.find(player => player.position !== PlayerPosition.Goalkeeper)!
    const calibratedPlayers = game.players.map(player => {
      if (!club.squadPlayerIds.includes(player.id)) return player
      return {
        ...player,
        currentAbility: player.id === exhausted.id ? 100 : 50,
        fitness: player.id === exhausted.id ? FATIGUE_AVAILABILITY_FLOOR - 1 : 100,
        form: 100,
        sharpness: 100,
        seasonForm: 100,
      }
    })

    const { selection, regenPlayers } = generateAiLineup(club, calibratedPlayers, () => 0.5)

    expect(regenPlayers).toHaveLength(0)
    expect(selection.startingPlayerIds).toHaveLength(11)
    expect(selection.startingPlayerIds).not.toContain(exhausted.id)
  })

  it('behåller spelare under golvet som fallback när AI-truppen är tunn', () => {
    const game = createNewGame({ managerName: 'AI-thin-test', clubId: 'club_malilla', seed: 733 })
    const club = game.clubs.find(candidate => candidate.id === game.managedClubId)!
    const clubPlayers = game.players.filter(player => club.squadPlayerIds.includes(player.id))
    const goalkeeper = clubPlayers.find(player => player.position === PlayerPosition.Goalkeeper)!
    const thinSquad = [
      goalkeeper,
      ...clubPlayers.filter(player => player.position !== PlayerPosition.Goalkeeper).slice(0, 10),
    ].map(player => ({ ...player, fitness: FATIGUE_AVAILABILITY_FLOOR - 1 }))

    const { selection, regenPlayers } = generateAiLineup(club, thinSquad, () => 0.5)

    expect(regenPlayers).toHaveLength(0)
    expect(selection.startingPlayerIds).toHaveLength(11)
    expect(new Set(selection.startingPlayerIds)).toEqual(new Set(thinSquad.map(player => player.id)))
  })
})
