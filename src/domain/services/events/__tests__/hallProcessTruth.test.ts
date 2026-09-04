import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { rolloverFacilityState } from '../../../../application/useCases/seasonEndProcessor'
import type { Mecenat } from '../../../entities/Mecenat'
import type { HallTrial } from '../../../entities/Community'
import { advanceFacilityState } from '../../facilityService'
import { generateHallProcessEvent, formatHallNodeSub } from '../hallProcessService'
import { resolveEvent } from '../eventResolver'

function makeGame(trial: HallTrial) {
  const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2026, seed: 1 })
  return {
    ...base,
    currentSeason: 2026,
    currentMatchday: 10,
    facilityState: { builtNodeIds: ['laktare_ostra'], hallTrial: trial },
    clubs: base.clubs.map(club => club.id === base.managedClubId ? { ...club, finances: 3_000_000 } : club),
  }
}

function activeMecenat(): Mecenat {
  return {
    id: 'mec_hall', name: 'Märta Bruk', gender: 'female', business: 'Bruket',
    businessType: 'brukspatron', wealth: 4, personality: 'tyst_kraft',
    influence: 50, happiness: 70, goodwill: 70, contribution: 100000,
    totalContributed: 0, demands: [], socialExpectations: [], isActive: true,
    arrivedSeason: 2025, silentShout: 0,
  }
}

describe('hallProcess — sekvens, finansiering och byggpaus håller ihop', () => {
  it('kräver att förankringsbeslut 1–3 löses i ordning före röstningen', () => {
    const trial: HallTrial = { stage: 'forankring', support: 50, startedSeason: 2026, stageStartedRound: 0 }
    const base = makeGame(trial)

    const d2 = generateHallProcessEvent({ ...base, resolvedEventIds: ['hallprocess_d1_s2026'] }, 6, new Set(['hallprocess_d1_s2026']))
    const d3 = generateHallProcessEvent({ ...base, resolvedEventIds: ['hallprocess_d1_s2026', 'hallprocess_d2_s2026'] }, 8, new Set(['hallprocess_d1_s2026', 'hallprocess_d2_s2026']))
    const waiting = generateHallProcessEvent({ ...base, resolvedEventIds: ['hallprocess_d1_s2026', 'hallprocess_d2_s2026'] }, 10, new Set(['hallprocess_d1_s2026', 'hallprocess_d2_s2026', 'hallprocess_d3_s2026']))
    const resolution = generateHallProcessEvent({ ...base, resolvedEventIds: ['hallprocess_d1_s2026', 'hallprocess_d2_s2026', 'hallprocess_d3_s2026'] }, 10, new Set(['hallprocess_d1_s2026', 'hallprocess_d2_s2026', 'hallprocess_d3_s2026']))

    expect(d2?.id).toBe('hallprocess_d2_s2026')
    expect(d3?.id).toBe('hallprocess_d3_s2026')
    expect(waiting).toBeNull()
    expect(resolution?.id).toBe('hallprocess_res_s2026')
  })

  it('kommunfinansiering startar bygget, drar kanoniska 60 % av 1,8 mkr och visar kostnaden', () => {
    const trial: HallTrial = { stage: 'forhandling', support: 70, startedSeason: 2026, stageStartedRound: 8 }
    const base = makeGame(trial)
    const game = { ...base, localPolitician: { ...base.localPolitician!, relationship: 60 } }
    const event = generateHallProcessEvent(game, 10, new Set())!
    const before = game.clubs.find(club => club.id === game.managedClubId)!.finances

    expect(event.id).toBe('hallprocess_fh1_s2026')
    expect(event.choices).toHaveLength(1)
    expect(event.choices[0].subtitle).toContain('Kassa −1 080 tkr')

    const result = resolveEvent({ ...game, pendingEvents: [event] }, event.id, 'ungdomstimmar', undefined, true)

    expect(result.facilityState?.hallTrial?.stage).toBe('bygge')
    expect(result.facilityState?.activeProject?.nodeId).toBe('matchhall')
    expect(result.clubs.find(club => club.id === result.managedClubId)?.finances).toBe(before - 1_080_000)
    expect(result.financeLog?.at(-1)?.amount).toBe(-1_080_000)
  })

  it('hall-kommun-nej-onabart: relation ≥45 men communityStanding <50 — kommunen säger nej, bordläggs (inte bygge)', () => {
    const trial: HallTrial = { stage: 'forhandling', support: 70, startedSeason: 2026, stageStartedRound: 8 }
    const base = makeGame(trial)
    const game = { ...base, localPolitician: { ...base.localPolitician!, relationship: 60 }, communityStanding: 49 }
    const event = generateHallProcessEvent(game, 10, new Set())!

    expect(event.id).toBe('hallprocess_fh1nej_s2026')
    expect(event.title).toBe('Kommunen säger nej')
    expect(event.choices).toHaveLength(1)
    expect(event.choices[0].subtitle).toBe('Bordlagd till nästa säsong. Orten avgör.')

    const result = resolveEvent({ ...game, pendingEvents: [event] }, event.id, 'noterat', undefined, true)
    expect(result.facilityState?.hallTrial?.stage).toBe('bordlagd')
    expect(result.facilityState?.hallTrial?.cooldownUntilSeason).toBe(2027)
    expect(result.facilityState?.activeProject).toBeUndefined()
    expect(result.pendingHallEcho?.text).toBe('Kommunen sa nej. Inte till hallen. Till oss.')
  })

  it('hall-kommun-nej-onabart: relation ≥45 och communityStanding 50 — ungdomstimmar-erbjudandet som förut', () => {
    const trial: HallTrial = { stage: 'forhandling', support: 70, startedSeason: 2026, stageStartedRound: 8 }
    const base = makeGame(trial)
    const game = { ...base, localPolitician: { ...base.localPolitician!, relationship: 60 }, communityStanding: 50 }
    const event = generateHallProcessEvent(game, 10, new Set())!

    expect(event.id).toBe('hallprocess_fh1_s2026')
  })

  it('låg kommunrelation når patronreservvägen med olika verkliga klubbkostnader', () => {
    const trial: HallTrial = { stage: 'forhandling', support: 70, startedSeason: 2026, stageStartedRound: 4 }
    const base = makeGame(trial)
    const game = {
      ...base,
      localPolitician: { ...base.localPolitician!, relationship: 20 },
      mecenater: [activeMecenat()],
    }
    const event = generateHallProcessEvent(game, 10, new Set())!

    expect(event.id).toBe('hallprocess_fh2_s2026')
    expect(event.choices.find(choice => choice.id === 'borgen')?.subtitle).toContain('1 080 tkr')
    expect(event.choices.find(choice => choice.id === 'tacka_nej')?.subtitle).toContain('1 800 tkr')

    const withPatron = resolveEvent({ ...game, pendingEvents: [event] }, event.id, 'borgen', undefined, true)
    const selfFunded = resolveEvent({ ...game, pendingEvents: [event] }, event.id, 'tacka_nej', undefined, true)
    expect(withPatron.clubs.find(club => club.id === game.managedClubId)?.finances).toBe(1_920_000)
    expect(selfFunded.clubs.find(club => club.id === game.managedClubId)?.finances).toBe(1_200_000)
  })

  it('utan kommunstöd eller patron landar den befintliga nej-utgången', () => {
    const trial: HallTrial = { stage: 'forhandling', support: 70, startedSeason: 2026, stageStartedRound: 4 }
    const base = makeGame(trial)
    const game = {
      ...base,
      localPolitician: { ...base.localPolitician!, relationship: 20 },
      mecenater: [],
    }

    expect(generateHallProcessEvent(game, 10, new Set())?.id).toBe('hallprocess_fhnej_s2026')
  })

  it('fördyringsvalet pausa stoppar completion till nästa säsong och statusytan säger det', () => {
    const trial: HallTrial = { stage: 'bygge', support: 70, startedSeason: 2026, stageStartedRound: 0, finansiering: 'kommun' }
    const base = makeGame(trial)
    const game = {
      ...base,
      facilityState: {
        ...base.facilityState,
        activeProject: { nodeId: 'matchhall', startedMatchday: 0, etaMatchday: 20 },
      },
    }
    // 2026*31 + 0*13 ger ett seed under 25 och därmed fördyringskortet.
    const event = generateHallProcessEvent(game, 11, new Set())!
    const paused = resolveEvent({ ...game, pendingEvents: [event] }, event.id, 'pausa', undefined, true)

    expect(paused.facilityState?.hallTrial?.buildPausedUntilSeason).toBe(2027)
    expect(paused.facilityState?.hallTrial?.buildPausedAtMatchday).toBe(10)
    expect(formatHallNodeSub(paused)).toContain('paus till säsong 2027')
    expect(advanceFacilityState(paused.facilityState!, 30, 2026).completedNodeId).toBeNull()

    const rolled = rolloverFacilityState(paused)!
    expect(rolled.activeProject).toMatchObject({ startedMatchday: 0, etaMatchday: 10 })
    expect(rolled.hallTrial?.buildPausedAtMatchday).toBeUndefined()
    expect(advanceFacilityState(rolled, 9, 2027).completedNodeId).toBeNull()
    expect(advanceFacilityState(rolled, 10, 2027).completedNodeId).toBe('matchhall')
  })

  it('ett vanligt sent bygge behåller exakt återstående byggtid efter rollover', () => {
    const game = {
      ...makeGame({ stage: 'bygge', support: 70, startedSeason: 2026, stageStartedRound: 18 }),
      currentMatchday: 22,
      facilityState: {
        builtNodeIds: [],
        activeProject: { nodeId: 'gym', startedMatchday: 18, etaMatchday: 26 },
      },
    }

    expect(rolloverFacilityState(game)?.activeProject).toMatchObject({
      startedMatchday: 0,
      etaMatchday: 4,
    })
  })

  it('rebasar hallprocessens eget steg även innan ett bygge finns', () => {
    const game = {
      ...makeGame({ stage: 'forhandling', support: 65, startedSeason: 2026, stageStartedRound: 22 }),
      currentMatchday: 23,
    }

    const rolled = rolloverFacilityState(game)!
    expect(rolled.activeProject).toBeUndefined()
    expect(rolled.hallTrial?.stageStartedRound).toBe(-1)
    expect(generateHallProcessEvent({ ...game, currentSeason: 2027, currentMatchday: 0, facilityState: rolled }, 0, new Set()))
      .toBeNull()
    expect(generateHallProcessEvent({ ...game, currentSeason: 2027, currentMatchday: 0, facilityState: rolled }, 1, new Set())?.id)
      .toBe('hallprocess_fh1_s2027')
  })
})
