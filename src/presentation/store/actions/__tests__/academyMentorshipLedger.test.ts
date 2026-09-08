import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { handleSeasonEnd } from '../../../../application/useCases/seasonEndProcessor'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import { academyActions } from '../academyActions'

function makeStore(initialGame: SaveGame) {
  let game: SaveGame | null = initialGame
  return {
    get: () => ({ game }),
    set: (partial: Partial<{ game: SaveGame | null }>) => { if ('game' in partial) game = partial.game ?? null },
    game: () => game,
  }
}

function mentorshipGame() {
  const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
  const senior = { ...base.players[0], age: 30, discipline: 80 }
  const youth = { ...base.youthTeam!.players[0], age: 18, currentAbility: 41, developmentRate: 1.25 }
  return {
    game: {
      ...base,
      currentMatchday: 7,
      eventLedger: [],
      players: [senior, ...base.players.slice(1)],
      youthTeam: {
        ...base.youthTeam!,
        players: [youth, ...base.youthTeam!.players.slice(1)],
      },
    },
    senior,
    youth,
  }
}

describe('akademimentorskap — kanonisk start och avslut', () => {
  it('fryser båda spelarnas identitet och juniorens startvärden när bandet skapas', () => {
    const { game, senior, youth } = mentorshipGame()
    const store = makeStore(game)

    expect(academyActions(store.get, store.set).assignMentor(senior.id, youth.id)).toEqual({ success: true })

    const entry = store.game()!.eventLedger?.find(item => item.type === 'mentorship_started')
    expect(entry).toEqual(expect.objectContaining({
      clubId: game.managedClubId,
      subject: { kind: 'player', id: youth.id },
      subject2: { kind: 'player', id: senior.id },
      subjectSnapshot: expect.objectContaining({ name: `${youth.firstName} ${youth.lastName}` }),
      subject2Snapshot: expect.objectContaining({ name: `${senior.firstName} ${senior.lastName}` }),
      season: 2025,
      matchday: 7,
      significance: 35,
      mentorship: {
        mentorId: senior.id,
        juniorCaAtStart: 41,
        developmentRateAtStart: 1.25,
      },
    }))
  })

  it('skriver ett avbrutet utfall när spelaren tar bort mentorn', () => {
    const { game, senior, youth } = mentorshipGame()
    const store = makeStore(game)
    const actions = academyActions(store.get, store.set)
    actions.assignMentor(senior.id, youth.id)

    actions.removeMentor(youth.id)

    const result = store.game()!
    expect(result.mentorships.find(item => item.youthPlayerId === youth.id)?.isActive).toBe(false)
    expect(result.mentorshipHistory?.find(item => item.youthPlayerId === youth.id)).toEqual(expect.objectContaining({
      endSeason: 2025,
      outcome: 'ended',
    }))
    expect(result.eventLedger?.filter(item => item.type === 'mentorship_ended')).toHaveLength(1)
    expect(result.eventLedger?.find(item => item.type === 'mentorship_ended')).toEqual(expect.objectContaining({
      subject: { kind: 'player', id: youth.id },
      subject2: { kind: 'player', id: senior.id },
      subjectSnapshot: expect.objectContaining({ name: `${youth.firstName} ${youth.lastName}` }),
      subject2Snapshot: expect.objectContaining({ name: `${senior.firstName} ${senior.lastName}` }),
      mentorship: { reason: 'cancelled', juniorCaAtEnd: 41, seasons: 1 },
    }))
  })

  it('stänger mentorbandet som uppflyttat före akademipromotionen', () => {
    const { game, senior, youth } = mentorshipGame()
    const store = makeStore(game)
    const actions = academyActions(store.get, store.set)
    actions.assignMentor(senior.id, youth.id)

    expect(actions.promoteYouthPlayer(youth.id)).toEqual(expect.objectContaining({ success: true }))

    const result = store.game()!
    const mentorshipEndIndex = result.eventLedger!.findIndex(item => item.type === 'mentorship_ended')
    const promotionIndex = result.eventLedger!.findIndex(item => item.type === 'academy_promotion')
    expect(mentorshipEndIndex).toBeGreaterThanOrEqual(0)
    expect(promotionIndex).toBeGreaterThan(mentorshipEndIndex)
    expect(result.eventLedger![mentorshipEndIndex].mentorship).toEqual({
      reason: 'promoted',
      juniorCaAtEnd: 41,
      seasons: 1,
    })
    expect(result.mentorshipHistory?.find(item => item.youthPlayerId === youth.id)?.outcome).toBe('graduated')
  })

  it('stänger ett kvarvarande 19-årsband som åldrat ut vid rollover', () => {
    const { game, senior, youth } = mentorshipGame()
    const store = makeStore({
      ...game,
      youthTeam: {
        ...game.youthTeam!,
        players: game.youthTeam!.players.map(player => player.id === youth.id ? { ...player, age: 19 } : player),
      },
    })
    academyActions(store.get, store.set).assignMentor(senior.id, youth.id)

    const rolled = handleSeasonEnd(store.game()!, 1).game
    const entry = rolled.eventLedger?.find(item => item.type === 'mentorship_ended' && item.subject?.id === youth.id)

    expect(rolled.mentorships).toEqual([])
    expect(entry?.mentorship).toEqual({ reason: 'aged_out', juniorCaAtEnd: 41, seasons: 1 })
    expect(entry?.subjectSnapshot?.name).toBe(`${youth.firstName} ${youth.lastName}`)
    expect(entry?.subject2Snapshot?.name).toBe(`${senior.firstName} ${senior.lastName}`)
  })
})
