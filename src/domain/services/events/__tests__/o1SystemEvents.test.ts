import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import type { SaveGame } from '../../../entities/SaveGame'
import { resolveEvent } from '../eventResolver'
import {
  generateFacilityCommunityCostEvent,
  generateYouthBurnRiskEvent,
  generateSupporterLetterEvent,
  O1_FACILITY_BONUS,
  O1_FACILITY_COMMUNITY_COST,
  O1_FACILITY_COST,
  O1_FACILITY_SEASON_CHANCE,
  O1_SUPPORTER_LETTER_COST,
  O1_SUPPORTER_MOOD_GAIN,
  O1_SUPPORTER_LETTER_SEASON_CHANCE,
  O1_YOUTH_DEVELOPMENT_COST,
  passesO1SeasonalEventRoll,
} from '../o1SystemEvents'
import { klackLeaderVoiceId } from '../../voiceIntroductionService'
import { generateEvents } from '../communityEvents'

function makeGame(): SaveGame {
  return createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 41 })
}

function withClub(game: SaveGame, values: { finances?: number; facilities?: number }): SaveGame {
  return {
    ...game,
    clubs: game.clubs.map(club => club.id === game.managedClubId ? { ...club, ...values } : club),
  }
}

function withPassingO1Gates(
  game: SaveGame,
  keys: Array<'facility_community' | 'supporter_letter'>,
): SaveGame {
  for (let worldSeed = 1; worldSeed <= 10_000; worldSeed++) {
    const candidate = { ...game, worldSeed }
    const passes = keys.every(key => passesO1SeasonalEventRoll(
      candidate,
      key,
      key === 'facility_community' ? O1_FACILITY_SEASON_CHANCE : O1_SUPPORTER_LETTER_SEASON_CHANCE,
    ))
    if (passes) return candidate
  }
  throw new Error(`Ingen testseed passerade O1-grindarna: ${keys.join(', ')}`)
}

describe('O1 — sällsynthetsgrind', () => {
  it('kastar exakt en gång per save+säsong, inte på nytt varje omgång', () => {
    const game = makeGame()
    const first = passesO1SeasonalEventRoll(game, 'facility_community', O1_FACILITY_SEASON_CHANCE)
    expect(passesO1SeasonalEventRoll(game, 'facility_community', O1_FACILITY_SEASON_CHANCE)).toBe(first)
    expect(passesO1SeasonalEventRoll({ ...game, currentMatchday: 18 }, 'facility_community', O1_FACILITY_SEASON_CHANCE)).toBe(first)
  })

  it('håller de två återkommande O1-korten kring den namngivna 25-procentsnivån', () => {
    const game = makeGame()
    for (const [key, chance] of [
      ['facility_community', O1_FACILITY_SEASON_CHANCE],
      ['supporter_letter', O1_SUPPORTER_LETTER_SEASON_CHANCE],
    ] as const) {
      let hits = 0
      for (let worldSeed = 1; worldSeed <= 1_000; worldSeed++) {
        if (passesO1SeasonalEventRoll({ ...game, worldSeed }, key, chance)) hits++
      }
      expect(hits).toBeGreaterThanOrEqual(200)
      expect(hits).toBeLessThanOrEqual(300)
    }
  })
})

describe('O1 2/4 — anläggningen som kostar orten', () => {
  it('kräver kommunrelation, bärkraft och ett ledigt generiskt anläggningsläge', () => {
    const base = withClub(withPassingO1Gates(makeGame(), ['facility_community']), { finances: O1_FACILITY_COST, facilities: 60 })
    const game = {
      ...base,
      localPolitician: { ...base.localPolitician!, relationship: 55 },
      facilityState: { builtNodeIds: [] },
    }
    const event = generateFacilityCommunityCostEvent(game, 10, new Set())
    expect(event).toMatchObject({
      type: 'politicianEvent',
      systemhandelse: true,
      proofSource: { form: 'state-predicate', evaluatedTrue: true },
    })
    expect(generateFacilityCommunityCostEvent({ ...game, facilityState: { builtNodeIds: [], activeProject: { nodeId: 'gym', startedMatchday: 1, etaMatchday: 8 } } }, 10, new Set())).toBeNull()
    expect(generateFacilityCommunityCostEvent(game, 10, new Set([event!.id]))).toBeNull()
  })

  it('bygger ut genom de deklarerade ekonomi-, facilitets- och CS-effekterna', () => {
    const base = withClub(withPassingO1Gates(makeGame(), ['facility_community']), { finances: 400_000, facilities: 60 })
    const game = {
      ...base,
      communityStanding: 50,
      localPolitician: { ...base.localPolitician!, relationship: 55 },
      facilityState: { builtNodeIds: [] },
    }
    const event = generateFacilityCommunityCostEvent(game, 10, new Set())!
    const resolved = resolveEvent({ ...game, pendingEvents: [event] }, event.id, 'build_out', () => 0, true)
    const club = resolved.clubs.find(candidate => candidate.id === resolved.managedClubId)!
    expect(club.finances).toBe(400_000 - O1_FACILITY_COST)
    expect(club.facilities).toBe(60 + O1_FACILITY_BONUS)
    expect(resolved.communityStanding).toBe(50 + O1_FACILITY_COMMUNITY_COST)
    expect(resolved.inbox.some(item => item.id.startsWith('inbox_o1_facility_build_out_'))).toBe(true)
  })
})

describe('O1 3/4 — ungdomen som kan brännas', () => {
  function pressuredGame(): { game: SaveGame; youthId: string; developmentRate: number; round: number } {
    const base = makeGame()
    const youth = { ...base.youthTeam!.players[0], age: 17, currentAbility: 24, potentialAbility: 82, developmentRate: 61 }
    const round = base.fixtures.find(fixture =>
      fixture.status === 'scheduled'
        && (fixture.homeClubId === base.managedClubId || fixture.awayClubId === base.managedClubId),
    )!.matchday
    const own = base.players.filter(player => player.clubId === base.managedClubId).slice(0, 2).map(player => player.id)
    return {
      game: {
        ...base,
        youthTeam: { ...base.youthTeam!, players: [youth] },
        players: base.players.map(player => own.includes(player.id) ? { ...player, isInjured: true, injuryDaysRemaining: 5 } : player),
      },
      youthId: youth.id,
      developmentRate: youth.developmentRate,
      round,
    }
  }

  it('fryser den namngivna högpotentialjunioren när truppen är tunn inför match', () => {
    const { game, youthId, round } = pressuredGame()
    const event = generateYouthBurnRiskEvent(game, round, new Set())
    expect(event).toMatchObject({
      type: 'academyDecision',
      relatedPlayerId: youthId,
      systemhandelse: true,
      proofSource: { form: 'state-predicate', evaluatedTrue: true },
    })
  })

  it('låser Sjuttonåringen-påståendet till en faktisk 17-åring', () => {
    const { game, round } = pressuredGame()
    const youth = { ...game.youthTeam!.players[0], age: 18 }
    expect(generateYouthBurnRiskEvent({
      ...game,
      youthTeam: { ...game.youthTeam!, players: [youth] },
    }, round, new Set())).toBeNull()
  })

  it('kasta in återanvänder kanonisk uppflyttning och sänker utvecklingstakten', () => {
    const { game, youthId, developmentRate, round } = pressuredGame()
    const event = generateYouthBurnRiskEvent(game, round, new Set())!
    const resolved = resolveEvent({ ...game, currentMatchday: round, pendingEvents: [event] }, event.id, 'throw_in', () => 0, true)
    const promoted = resolved.players.find(player => player.id.startsWith(`player_promoted_${youthId}_`))
    expect(promoted?.developmentRate).toBe(developmentRate + O1_YOUTH_DEVELOPMENT_COST)
    expect(resolved.youthTeam?.players.some(player => player.id === youthId)).toBe(false)
    expect(resolved.clubs.find(club => club.id === resolved.managedClubId)?.squadPlayerIds).toContain(promoted?.id)
    expect(resolved.eventLedger.some(entry => entry.type === 'academy_promotion' && entry.subject?.id === promoted?.id)).toBe(true)
    expect(resolved.inbox.some(item => item.id.startsWith('inbox_o1_youth_throw_in_'))).toBe(true)
  })

  it('låta mogna lämnar P19-spelaren och utvecklingstakten orörda', () => {
    const { game, youthId, developmentRate, round } = pressuredGame()
    const event = generateYouthBurnRiskEvent(game, round, new Set())!
    const resolved = resolveEvent({ ...game, currentMatchday: round, pendingEvents: [event] }, event.id, 'let_mature', () => 0, true)
    expect(resolved.youthTeam?.players.find(player => player.id === youthId)?.developmentRate).toBe(developmentRate)
    expect(resolved.players.some(player => player.id.startsWith(`player_promoted_${youthId}_`))).toBe(false)
  })
})

describe('O1 4/4 — supporterbrevet', () => {
  function supporterGame(): SaveGame {
    const base = withClub(withPassingO1Gates(makeGame(), ['supporter_letter']), { finances: 200_000 })
    const group = { ...base.supporterGroup!, mood: 60 }
    const voiceId = klackLeaderVoiceId(base.managedClubId, group.leader.name)
    return {
      ...base,
      supporterGroup: group,
      introducedVoices: {
        ...(base.introducedVoices ?? {}),
        [voiceId]: { provenance: 'observed', source: 'event', introducedSeason: base.currentSeason, introducedDate: base.currentDate },
      },
    }
  }

  it('är säsongsdeduplicerat och bär klackledarens stabila röst', () => {
    const game = supporterGame()
    const event = generateSupporterLetterEvent(game, 12, new Set())
    expect(event).toMatchObject({
      type: 'supporterEvent',
      sender: { name: game.supporterGroup!.leader.name, role: 'Klackledare' },
      systemhandelse: true,
      proofSource: { form: 'state-predicate', evaluatedTrue: true },
    })
    expect(event?.voiceId).toBe(klackLeaderVoiceId(game.managedClubId, game.supporterGroup!.leader.name))
    expect(generateSupporterLetterEvent(game, 12, new Set([event!.id]))).toBeNull()
  })

  it('ge dem det tar den deklarerade kostnaden, värmer klacken och skriver utfallet', () => {
    const game = supporterGame()
    const event = generateSupporterLetterEvent(game, 12, new Set())!
    const resolved = resolveEvent({ ...game, pendingEvents: [event] }, event.id, 'grant_wish', () => 0, true)
    const club = resolved.clubs.find(candidate => candidate.id === resolved.managedClubId)!
    expect(club.finances).toBe(200_000 - O1_SUPPORTER_LETTER_COST)
    expect(resolved.supporterGroup?.mood).toBe(60 + O1_SUPPORTER_MOOD_GAIN)
    expect(resolved.inbox.some(item => item.id.startsWith('inbox_o1_supporter_grant_wish_'))).toBe(true)
  })
})

describe('O1 2–4 — ordinarie eventpipeline', () => {
  it('kopplar in alla tre generatorerna utan en separat processor', () => {
    const base = withClub(withPassingO1Gates(makeGame(), ['facility_community', 'supporter_letter']), { finances: 400_000, facilities: 60 })
    const youth = { ...base.youthTeam!.players[0], age: 17, currentAbility: 24, potentialAbility: 82 }
    const round = 12
    const own = base.players.filter(player => player.clubId === base.managedClubId).slice(0, 2).map(player => player.id)
    const sourceFixture = base.fixtures.find(fixture =>
      fixture.homeClubId === base.managedClubId || fixture.awayClubId === base.managedClubId,
    )!
    const game: SaveGame = {
      ...base,
      currentMatchday: round,
      localPolitician: { ...base.localPolitician!, relationship: 55 },
      supporterGroup: { ...base.supporterGroup!, mood: 60 },
      facilityState: { builtNodeIds: [] },
      youthTeam: { ...base.youthTeam!, players: [youth] },
      players: base.players.map(player => own.includes(player.id) ? { ...player, isInjured: true, injuryDaysRemaining: 5 } : player),
      fixtures: [{
        ...sourceFixture,
        id: 'fixture_o1_pipeline',
        status: 'scheduled',
        matchday: round,
      }],
      pendingEvents: [],
      resolvedEventIds: [],
    }

    const ids = generateEvents(game, round, new Set(), () => 1).map(event => event.id)
    expect(ids).toContain(`event_o1_facility_community_s${game.currentSeason}`)
    expect(ids).toContain(`event_o1_youth_burn_${youth.id}_s${game.currentSeason}`)
    expect(ids).toContain(`event_o1_supporter_letter_s${game.currentSeason}`)
  })
})
