import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { buildBlodslinje } from './ClubMemoryView'

describe('buildBlodslinje — hållbara mentorband', () => {
  it('visar en aktiv P19-adept som ännu inte finns i seniorspelarlistan', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', seed: 21 })
    const senior = game.players.find(p => p.clubId === game.managedClubId)!
    const youth = game.youthTeam!.players[0]

    const items = buildBlodslinje({
      ...game,
      mentorshipHistory: [{ seniorPlayerId: senior.id, youthPlayerId: youth.id, startRound: 1 }],
    })

    expect(items).toHaveLength(1)
    expect(items[0].text).toContain(`${youth.firstName} ${youth.lastName}`)
  })

  it('visar ett avslutat band från namnsnapshot efter att båda spelarna lämnat aktiva arrayer', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', seed: 22 })
    const items = buildBlodslinje({
      ...game,
      mentorshipHistory: [{
        seniorPlayerId: 'gone-senior',
        youthPlayerId: 'gone-youth',
        seniorName: 'Timo Martinsson',
        youthName: 'Arvid Löfgren',
        startRound: 1,
        endSeason: game.currentSeason,
        outcome: 'ended',
      }],
    })

    expect(items).toHaveLength(1)
    expect(items[0].label).toBe('Timo Martinsson')
    expect(items[0].text).toBe('Arvid Löfgren och Timo Martinsson gick skilda vägar.')
  })
})
