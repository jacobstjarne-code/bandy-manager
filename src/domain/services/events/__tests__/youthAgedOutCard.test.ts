import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import { resolveEvent } from '../eventResolver'
import type { GameEvent } from '../../../entities/GameEvent'
import { buildMentorshipStartedLedgerEntry } from '../../clubHistoryLedgerService'
import { logEvent } from '../../eventLedgerService'

function makeGame() {
  const template = CLUB_TEMPLATES[0]
  const base = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
  const youthPlayer = { ...base.youthTeam!.players[0], age: 19, potentialAbility: 60 }
  const card: GameEvent = {
    id: `event_youth_aged_out_${youthPlayer.id}_s${base.currentSeason}`,
    type: 'academyEvent',
    relatedPlayerId: youthPlayer.id,
    title: `${youthPlayer.firstName} ${youthPlayer.lastName} fyller tjugo`,
    body: 'Sista året i P19 är slut. Antingen får han ett kontrakt, eller så får han gå. Ingen tredje väg.',
    choices: [
      { id: 'flytta_upp', label: 'Flytta upp', effect: { type: 'noOp' } },
      { id: 'slapp', label: 'Släpp', effect: { type: 'noOp' } },
    ],
    resolved: false,
  }
  return {
    game: {
      ...base,
      youthTeam: { ...base.youthTeam!, players: [youthPlayer, ...base.youthTeam!.players.slice(1)] },
      pendingEvents: [card],
    },
    youthPlayer,
    card,
  }
}

function withActiveMentorship(fixture: ReturnType<typeof makeGame>) {
  const senior = fixture.game.players[0]
  const game = {
    ...fixture.game,
    mentorships: [{ seniorPlayerId: senior.id, youthPlayerId: fixture.youthPlayer.id, startRound: 1, isActive: true }],
    mentorshipHistory: [{
      seniorPlayerId: senior.id,
      youthPlayerId: fixture.youthPlayer.id,
      seniorName: `${senior.firstName} ${senior.lastName}`,
      youthName: `${fixture.youthPlayer.firstName} ${fixture.youthPlayer.lastName}`,
      startRound: 1,
    }],
  }
  return {
    ...fixture,
    senior,
    game: {
      ...game,
      eventLedger: logEvent(game, buildMentorshipStartedLedgerEntry({
        clubId: game.managedClubId,
        season: game.currentSeason,
        matchday: game.currentMatchday,
        juniorId: fixture.youthPlayer.id,
        mentorId: senior.id,
        juniorCaAtStart: fixture.youthPlayer.currentAbility,
        developmentRateAtStart: fixture.youthPlayer.developmentRate,
      })),
    },
  }
}

describe('resolveEvent — event_youth_aged_out_* (DOM_AKADEMI_LIGGARE §4)', () => {
  it('"Flytta upp" promoverar spelaren till A-laget och tar bort honom ur youthTeam', () => {
    const { game, youthPlayer, senior, card } = withActiveMentorship(makeGame())
    const result = resolveEvent(game, card.id, 'flytta_upp', () => 0, true)

    expect(result.youthTeam?.players.some(p => p.id === youthPlayer.id)).toBe(false)
    const promoted = result.players.find(p => p.id === `player_promoted_${youthPlayer.id}_${game.currentSeason}`)
    expect(promoted).toBeDefined()
    expect(promoted?.clubId).toBe(game.managedClubId)
    expect(promoted?.promotedFromAcademy).toBe(true)
    const club = result.clubs.find(c => c.id === game.managedClubId)
    expect(club?.squadPlayerIds).toContain(promoted!.id)
    expect(result.eventLedger?.some(e => e.type === 'academy_promotion' && e.subject?.id === promoted!.id)).toBe(true)
    expect(result.mentorships.find(item => item.youthPlayerId === youthPlayer.id)?.isActive).toBe(false)
    expect(result.eventLedger?.find(e => e.type === 'mentorship_ended' && e.subject?.id === youthPlayer.id)).toEqual(expect.objectContaining({
      subject2: { kind: 'player', id: senior.id },
      mentorship: { reason: 'promoted', juniorCaAtEnd: youthPlayer.currentAbility, seasons: 1 },
    }))
  })

  it('"Släpp" friar spelaren direkt, skriver youth_aged_out och inboxtext med fullt namn', () => {
    const { game, youthPlayer, senior, card } = withActiveMentorship(makeGame())
    const result = resolveEvent(game, card.id, 'slapp', () => 0, true)

    expect(result.youthTeam?.players.some(p => p.id === youthPlayer.id)).toBe(false)
    expect(result.players.some(p => p.id === `player_promoted_${youthPlayer.id}_${game.currentSeason}`)).toBe(false)

    const ledgerEntry = result.eventLedger?.find(e => e.type === 'youth_aged_out' && e.subject?.id === youthPlayer.id)
    expect(ledgerEntry?.youthAgedOut).toEqual({ outcome: 'released', stars: 3, caAtExit: youthPlayer.currentAbility })

    const inboxItem = result.inbox.find(i => i.id === `inbox_youth_aged_out_${youthPlayer.id}_${game.currentSeason}`)
    expect(inboxItem?.body).toBe(
      `${youthPlayer.firstName} ${youthPlayer.lastName} släppt. Tjugo år, 3 stjärnor. Det var ditt val — och det kan ha varit rätt.`
    )
    expect(result.mentorships.find(item => item.youthPlayerId === youthPlayer.id)?.isActive).toBe(false)
    expect(result.eventLedger?.find(e => e.type === 'mentorship_ended' && e.subject?.id === youthPlayer.id)).toEqual(expect.objectContaining({
      subject2: { kind: 'player', id: senior.id },
      mentorship: { reason: 'aged_out', juniorCaAtEnd: youthPlayer.currentAbility, seasons: 1 },
    }))
  })
})
