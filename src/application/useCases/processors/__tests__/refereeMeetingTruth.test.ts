import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../createNewGame'
import type { GameEvent } from '../../../../domain/entities/GameEvent'
import type { Referee } from '../../../../domain/entities/Referee'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import { FixtureStatus, MatchEventType } from '../../../../domain/enums'
import { getDefaultRolloverChoice, getRolloverPolicy } from '../../../../domain/services/deferredRolloverService'
import { resolveEvent } from '../../../../domain/services/events/eventResolver'
import { mulberry32 } from '../../../../domain/utils/random'
import { buildRefereeMeetingChoices, simulateRound } from '../matchSimProcessor'

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
    choices: buildRefereeMeetingChoices(refereeId),
    resolved: false,
  }
}

describe('refereeMeeting — O11:s text/state-kontrakt', () => {
  it('bär de tre låsta, asymmetriska förhandstexterna', () => {
    expect(buildRefereeMeetingChoices('ref_truth').map(choice => choice.subtitle)).toEqual([
      'Du skakar hand. Klacken buar.',
      'Du rycker på axlarna och går.',
      'Du säger vad du tycker. Domaren minns namn.',
    ])
  })

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

  it('respekt höjer domarrelationen, sänker klacken och bevarar matchhistoriken', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_heros', season: 2025, seed: 23 })
    const event = meeting('ref_truth')
    const beforeRelation = {
      refereeId: 'ref_truth', lastMatchSeason: 2025, lastMatchRound: 9,
      totalMatches: 3, totalCardsGiven: 7, totalPenaltiesGiven: 2, clubReaction: 1 as const,
    }
    const pending: SaveGame = {
      ...base,
      referees: [referee()],
      pendingRefereeMeeting: event,
      refereeRelations: [beforeRelation],
      supporterGroup: { ...base.supporterGroup!, mood: 50 },
    }
    const resolved = resolveEvent(pending, event.id, 'respect', undefined, true)

    expect(resolved.refereeRelations).toEqual([{ ...beforeRelation, clubReaction: 2 }])
    expect(resolved.supporterGroup?.mood).toBe(48)
    expect(resolved.pendingRefereeMeeting).toBeUndefined()
    expect(resolved.resolvedEventIds).toContain(event.id)
    expect(resolved.resolvedChoices?.at(-1)).toMatchObject({ choiceId: 'respect', label: 'Respektera' })
    expect(resolved.resolvedChoices?.at(-1)?.outcomeDeltas).toEqual([
      { resource: 'supporterMood', delta: -2 },
      { resource: 'refereeRelationship', delta: 1, subjectName: 'Rut Rask' },
    ])
    expect(resolved.eventLedger?.at(-1)?.consequences).toEqual([
      { field: 'supporterMood', dir: 'down', magnitude: 'knappt' },
      { field: 'refereeRelationship', dir: 'up', magnitude: 'knappt' },
    ])
  })

  it('neutral lämnar både domarrelation och klack oförändrade', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_heros', season: 2025, seed: 23 })
    const event = meeting('ref_truth')
    const relation = {
      refereeId: 'ref_truth', lastMatchSeason: 2025, lastMatchRound: 9,
      totalMatches: 3, totalCardsGiven: 7, totalPenaltiesGiven: 2, clubReaction: 0 as const,
    }
    const pending = {
      ...base,
      referees: [referee()],
      pendingRefereeMeeting: event,
      refereeRelations: [relation],
      supporterGroup: { ...base.supporterGroup!, mood: 50 },
    }
    const resolved = resolveEvent(pending, event.id, 'neutral', undefined, true)

    expect(resolved.refereeRelations).toEqual([relation])
    expect(resolved.supporterGroup?.mood).toBe(50)
    expect(resolved.resolvedChoices?.at(-1)?.outcomeDeltas).toBeUndefined()
  })

  it('protest sänker domarrelationen och höjer klacken med clampade verkliga deltan', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_heros', season: 2025, seed: 23 })
    const event = meeting('ref_truth')
    const relation = {
      refereeId: 'ref_truth', lastMatchSeason: 2025, lastMatchRound: 9,
      totalMatches: 3, totalCardsGiven: 7, totalPenaltiesGiven: 2, clubReaction: 0 as const,
    }
    const pending = {
      ...base,
      referees: [referee()],
      pendingRefereeMeeting: event,
      refereeRelations: [relation],
      supporterGroup: { ...base.supporterGroup!, mood: 99 },
    }
    const resolved = resolveEvent(pending, event.id, 'protest', undefined, true)

    expect(resolved.refereeRelations?.[0].clubReaction).toBe(-1)
    expect(resolved.supporterGroup?.mood).toBe(100)
    expect(resolved.resolvedChoices?.at(-1)?.outcomeDeltas).toEqual([
      { resource: 'supporterMood', delta: 1 },
      { resource: 'refereeRelationship', delta: -1, subjectName: 'Rut Rask' },
    ])
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
