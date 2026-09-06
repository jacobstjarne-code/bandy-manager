import { describe, expect, it } from 'vitest'
import { createNewGame } from '../createNewGame'
import { handleSeasonEnd } from '../seasonEndProcessor'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'

/**
 * DOM_AKADEMI_LIGGARE §4 "utan kort" — täcker BÅDE <3-stjärniga (fick aldrig
 * kort) OCH ≥3-stjärniga vars kort låg obesvarat vid rollover, i samma
 * villkor: närvaro i game.youthTeam.players vid rollover-tidpunkten betyder
 * per definition att inget kort löstes ut (event_youth_aged_out_*-handlern
 * i eventResolver.ts tar bort spelaren direkt vid "Flytta upp"/"Släpp").
 */
describe('handleSeasonEnd — youth_aged_out "utan kort"-fallback (DOM_AKADEMI_LIGGARE §4)', () => {
  it('skriver låst inboxtext + youth_aged_out-ledgerpost för en P19-spelare som fyller 20 utan resolverat kort', () => {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, season: 2025, seed: 1 })
    const target = { ...game.youthTeam!.players[0], age: 19, potentialAbility: 30, currentAbility: 22, joinedSeason: 2022 }
    const result = handleSeasonEnd({
      ...game,
      youthTeam: { ...game.youthTeam!, players: [target, ...game.youthTeam!.players.slice(1)] },
    }, 1).game

    expect(result.youthTeam?.players.some(p => p.id === target.id)).toBe(false)

    const inboxItem = result.inbox.find(i => i.id === `inbox_youth_aged_out_${target.id}_${game.currentSeason + 1}`)
    expect(inboxItem?.body).toBe(
      `${target.firstName} ${target.lastName} fyllde tjugo. Ingen plats i A-laget, inget kontrakt. Han tackade för 4 år och gick.`
    )

    const ledgerEntry = result.eventLedger?.find(e => e.type === 'youth_aged_out' && e.subject?.id === target.id)
    expect(ledgerEntry?.youthAgedOut).toEqual({ outcome: 'released', stars: 1, caAtExit: 22 })
  })

  it('faller tillbaka till 5 säsonger för legacy-data utan joinedSeason', () => {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, season: 2025, seed: 1 })
    const target = { ...game.youthTeam!.players[0], age: 19, potentialAbility: 30, currentAbility: 22, joinedSeason: undefined }
    const result = handleSeasonEnd({
      ...game,
      youthTeam: { ...game.youthTeam!, players: [target, ...game.youthTeam!.players.slice(1)] },
    }, 1).game

    const inboxItem = result.inbox.find(i => i.id === `inbox_youth_aged_out_${target.id}_${game.currentSeason + 1}`)
    expect(inboxItem?.body).toContain('Han tackade för 5 år och gick.')
  })

  it('skriver ingen youth_aged_out-post för en P19-spelare som stannar under 19', () => {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, season: 2025, seed: 1 })
    const target = { ...game.youthTeam!.players[0], age: 17 }
    const result = handleSeasonEnd({
      ...game,
      youthTeam: { ...game.youthTeam!, players: [target, ...game.youthTeam!.players.slice(1)] },
    }, 1).game

    expect(result.eventLedger?.some(e => e.type === 'youth_aged_out' && e.subject?.id === target.id)).toBe(false)
    expect(result.inbox.some(i => i.id === `inbox_youth_aged_out_${target.id}_${game.currentSeason + 1}`)).toBe(false)
  })
})
