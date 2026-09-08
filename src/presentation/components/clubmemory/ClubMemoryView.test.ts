import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { buildBlodslinje } from './ClubMemoryView'
import { buildMentorshipEndedLedgerEntry, buildMentorshipStartedLedgerEntry } from '../../../domain/services/clubHistoryLedgerService'
import { logEvent } from '../../../domain/services/eventLedgerService'

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

  it('läser avslutade mentorband ur liggaren med frysta namn och mätbart utfall', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 23 })
    const senior = game.players.find(p => p.clubId === game.managedClubId)!
    const youth = { ...game.youthTeam!.players[0], currentAbility: 43 }
    const withYouth = {
      ...game,
      youthTeam: { ...game.youthTeam!, players: [youth, ...game.youthTeam!.players.slice(1)] },
    }
    const startedLedger = logEvent(withYouth, buildMentorshipStartedLedgerEntry({
      clubId: game.managedClubId,
      season: 2025,
      matchday: 2,
      juniorId: youth.id,
      mentorId: senior.id,
      juniorCaAtStart: 43,
      developmentRateAtStart: youth.developmentRate,
    }))
    const withStart = { ...withYouth, eventLedger: startedLedger }
    const ledger = logEvent(withStart, buildMentorshipEndedLedgerEntry({
      clubId: game.managedClubId,
      season: 2026,
      matchday: 18,
      juniorId: youth.id,
      mentorId: senior.id,
      reason: 'promoted',
      juniorCaAtEnd: 51,
      seasons: 2,
    }))

    const items = buildBlodslinje({
      ...withStart,
      players: game.players.filter(player => player.id !== senior.id),
      youthTeam: { ...game.youthTeam!, players: [] },
      eventLedger: ledger,
      mentorshipHistory: [{
        seniorPlayerId: senior.id,
        youthPlayerId: youth.id,
        seniorName: 'Ska inte vinna',
        youthName: 'Ska inte dubblas',
        startRound: 1,
        endSeason: 2026,
        outcome: 'graduated',
      }],
    })

    expect(items).toHaveLength(1)
    expect(items[0].label).toBe(`${senior.firstName} ${senior.lastName}`)
    expect(items[0].text).toBe(
      `${youth.firstName} ${youth.lastName}, mentor ${senior.firstName} ${senior.lastName} 2 säsonger: 43→51. Klar för A-laget.`
    )
  })
})
