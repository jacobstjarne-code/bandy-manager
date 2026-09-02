import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../createNewGame'
import type { GameEvent } from '../../../../domain/entities/GameEvent'
import type { Referee } from '../../../../domain/entities/Referee'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import { FixtureStatus, MatchEventType } from '../../../../domain/enums'
import { getDefaultRolloverChoice, getRolloverPolicy } from '../../../../domain/services/deferredRolloverService'
import { resolveEvent } from '../../../../domain/services/events/eventResolver'
import { mulberry32 } from '../../../../domain/utils/random'
import { simulateRound } from '../matchSimProcessor'

function referee(): Referee {
  return {
    id: 'ref_truth', firstName: 'Rut', lastName: 'Rask', homeTown: 'Falun',
    yearsOfExperience: 12, style: 'strict', personality: 'veteran', managedMatches: 4,
  }
}

function meeting(refereeId: string): GameEvent {
  return {
    id: 'referee_meeting_truth',
    type: 'refereeMeeting',
    title: 'Domaren vill träffas',
    body: 'Vi såg samma match.',
    choices: [
      { id: 'respect', label: 'Respektera', effect: { type: 'refereeRelationship', refereeId, value: 1 } },
      { id: 'neutral', label: 'Neutral', effect: { type: 'refereeRelationship', refereeId, value: 0 } },
      { id: 'protest', label: 'Protestera', effect: { type: 'refereeRelationship', refereeId, value: -1 } },
    ],
    resolved: false,
  }
}

describe('refereeMeeting — O11:s text/state-kontrakt', () => {
  it('matchsimuleringen bevarar den uppdaterade domarhistoriken i sitt resultat', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_heros', season: 2025, seed: 23 })
    const fixture = base.fixtures.find(candidate =>
      candidate.status === FixtureStatus.Scheduled
      && (candidate.homeClubId === base.managedClubId || candidate.awayClubId === base.managedClubId)
    )!
    const managedPlayers = base.players.filter(player => player.clubId === base.managedClubId)
    const game: SaveGame = {
      ...base,
      currentDate: fixture.date,
      referees: [referee()],
      refereeRelations: [{
        refereeId: 'ref_truth', lastMatchSeason: 2024, lastMatchRound: 3,
        totalMatches: 2, totalCardsGiven: 5, totalPenaltiesGiven: 1, clubReaction: 1,
      }],
      managedClubPendingLineup: {
        startingPlayerIds: managedPlayers.slice(0, 11).map(player => player.id),
        benchPlayerIds: managedPlayers.slice(11, 16).map(player => player.id),
        captainPlayerId: managedPlayers[0]?.id,
        tactic: base.clubs.find(club => club.id === base.managedClubId)!.activeTactic,
      },
    }
    const nextMatchday = fixture.matchday
    const baseSeed = nextMatchday * 1000 + game.currentSeason * 7
    const result = simulateRound(game, [{ ...fixture, isCup: true }], nextMatchday, baseSeed, mulberry32(77), false)
    const played = result.simulatedFixtures[0]
    const suspensions = played.events.filter(event =>
      event.type === MatchEventType.Suspension && event.clubId === game.managedClubId
    ).length
    const penalties = played.events.filter(event => event.isPenaltyGoal).length

    expect(played.status).toBe(FixtureStatus.Completed)
    expect(result.updatedRefereeRelations).toEqual([{
      refereeId: 'ref_truth',
      lastMatchSeason: game.currentSeason,
      lastMatchRound: nextMatchday,
      totalMatches: 3,
      totalCardsGiven: 5 + suspensions,
      totalPenaltiesGiven: 1 + penalties,
      clubReaction: 1,
    }])
    expect(result.updatedReferees[0].managedMatches).toBe(5)
  })

  it('mötessvaret ändrar bara reaktionen ovanpå redan sparad matchhistorik', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_heros', season: 2025, seed: 23 })
    const event = meeting('ref_truth')
    const beforeRelation = {
      refereeId: 'ref_truth', lastMatchSeason: 2025, lastMatchRound: 9,
      totalMatches: 3, totalCardsGiven: 7, totalPenaltiesGiven: 2, clubReaction: 1 as const,
    }
    const pending: SaveGame = {
      ...base,
      pendingRefereeMeeting: event,
      refereeRelations: [beforeRelation],
    }
    const resolved = resolveEvent(pending, event.id, 'respect', undefined, true)

    expect(resolved.refereeRelations).toEqual([{ ...beforeRelation, clubReaction: 2 }])
    expect(resolved.pendingRefereeMeeting).toBeUndefined()
    expect(resolved.resolvedEventIds).toContain(event.id)
    expect(resolved.resolvedChoices?.at(-1)).toMatchObject({ choiceId: 'respect', label: 'Respektera' })
  })

  it('reaktionen klampas till −2…2', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_heros', season: 2025, seed: 23 })
    const event = meeting('ref_truth')
    const relation = {
      refereeId: 'ref_truth', lastMatchSeason: 2025, lastMatchRound: 9,
      totalMatches: 1, totalCardsGiven: 0, totalPenaltiesGiven: 0, clubReaction: -2 as const,
    }
    const resolved = resolveEvent({ ...base, pendingRefereeMeeting: event, refereeRelations: [relation] }, event.id, 'protest', undefined, true)
    expect(resolved.refereeRelations?.[0].clubReaction).toBe(-2)
  })

  it('obesvarat domarmöte rinner ut; inget ställningstagande väljs åt spelaren', () => {
    const event = meeting('ref_truth')
    expect(getRolloverPolicy('refereeMeeting')).toBe('expire')
    expect(getDefaultRolloverChoice(event)).toBeNull()
  })
})
