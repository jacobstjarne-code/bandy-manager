/**
 * DOM_BURNOUT_TAK_2026-09-02 — eventResolver.ts:s nya delar för
 * burnoutCeiling: multiEffect-sub-typen 'startBurnoutCeilingRecovery' (C)
 * och den dedikerade ärr-skrivningshooken (D). Samma mönster som
 * burnoutReliefResolver.test.ts (O4) redan etablerade.
 */
import { describe, it, expect } from 'vitest'
import { resolveEvent } from '../eventResolver'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import { redaktoren, agendaForSurface } from '../../redaktorenService'
import { currentChronology } from '../../currentChronology'
import { resolveSubjectName } from '../../momentLedgerService'
import type { GameEvent } from '../../../entities/GameEvent'
import type { SaveGame } from '../../../entities/SaveGame'

function baseGame(overrides: Partial<SaveGame> = {}): SaveGame {
  const template = CLUB_TEMPLATES[0]
  const game = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
  return { ...game, ...overrides }
}

function multiEffectEvent(id: string, subEffects: Array<{ type: string; amount?: number }>): GameEvent {
  return {
    id, type: 'burnoutRelief', title: 't', body: 'b',
    choices: [{ id: 'choice', label: 'l', effect: { type: 'multiEffect', subEffects: JSON.stringify(subEffects) } }],
    resolved: false,
  }
}

function ceilingEvent(id: string): GameEvent {
  return {
    id, type: 'burnoutCeiling', title: '[Opus]', body: '[Opus]',
    choices: [
      {
        id: 'step_back', label: '[Opus]', subtitle: '[Opus]', irreversible: true,
        effect: { type: 'multiEffect', subEffects: JSON.stringify([
          { type: 'startBurnoutCeilingRecovery', amount: 6 },
          { type: 'startTrainingSlowdown', amount: 6 },
          { type: 'boardPatience', amount: -10 },
        ]) },
      },
      { id: 'push_through', label: '[Opus]', subtitle: '[Opus]', irreversible: true, effect: { type: 'noOp' } },
    ],
    resolved: false,
  }
}

describe("eventResolver — multiEffect sub-typ 'startBurnoutCeilingRecovery'", () => {
  it('sätter burnoutCeilingRecoveryUntilRound = currentMatchday + amount', () => {
    let game = baseGame({ currentMatchday: 10 })
    const event = multiEffectEvent('test_ceiling_recovery_1', [{ type: 'startBurnoutCeilingRecovery', amount: 6 }])
    game = { ...game, pendingEvents: [event] }

    game = resolveEvent(game, 'test_ceiling_recovery_1', 'choice', undefined, true)

    expect(game.burnoutCeilingRecoveryUntilRound).toBe(16)
  })
})

describe('eventResolver — burnoutCeiling ärr-skrivning (D)', () => {
  it("step_back: burnoutScar='stepped_back', diary-post type burnout_scar, PLUS startBurnoutCeilingRecovery/startTrainingSlowdown/boardPatience alla applicerar", () => {
    let game = baseGame({ currentMatchday: 20, currentSeason: 3, boardPatience: 70 })
    game = { ...game, managerProfile: { ...game.managerProfile!, burnoutScore: 100 } }
    const event = ceilingEvent('test_ceiling_1')
    game = { ...game, pendingEvents: [event] }

    game = resolveEvent(game, 'test_ceiling_1', 'step_back', undefined, true)

    expect(game.managerProfile!.burnoutScar).toBe('stepped_back')
    const scarEntry = game.managerProfile!.diary!.find(e => e.type === 'burnout_scar')
    expect(scarEntry).toBeDefined()
    expect(scarEntry!.season).toBe(3)
    expect(scarEntry!.matchday).toBe(20)
    expect(game.burnoutCeilingRecoveryUntilRound).toBe(26)
    expect(game.burnoutTrainingSlowdownUntilRound).toBe(26)
    expect(game.boardPatience).toBe(60)
    expect(game.eventLedger).toContainEqual({
      type: 'decision',
      clubId: 'club_forsbacka',
      managerId: game.id,
      semanticKey: 'burnoutCeiling:step_back',
      season: 3,
      matchday: 20,
      significance: 100,
      irreversible: true,
      tension: true,
      systemsAffectedCount: 4,
      madeByPlayer: true,
      // begriplighet-klass-f (2026-09-15): subject.kind='manager' — se
      // redaktorenService.ts (kafferum/granska-eko) och
      // momentLedgerService.ts (namnuppslag).
      subject: { kind: 'manager', id: game.id },
    })
  })

  it('takvalet konsumerar ett redan köat lättnadskort från samma episod', () => {
    let game = baseGame({ currentMatchday: 20, currentSeason: 3 })
    game = { ...game, managerProfile: { ...game.managerProfile!, burnoutScore: 100 } }
    const ceiling = ceilingEvent('event_burnout_ceiling_3_20')
    const relief = multiEffectEvent('event_burnout_relief_3_19', [{ type: 'reduceBurnout', amount: -10 }])
    game = { ...game, pendingEvents: [ceiling, relief], deferredDecisions: [relief] }

    game = resolveEvent(game, ceiling.id, 'step_back', undefined, true)

    expect(game.pendingEvents.some(candidate => candidate.type === 'burnoutRelief')).toBe(false)
    expect(game.deferredDecisions.some(candidate => candidate.type === 'burnoutRelief')).toBe(false)
  })

  it("push_through: burnoutScar='hardened', diary-post skriven, INGET mekaniskt pris (ingen recovery, ingen slowdown, boardPatience orörd)", () => {
    let game = baseGame({ currentMatchday: 20, currentSeason: 3, boardPatience: 70 })
    game = { ...game, managerProfile: { ...game.managerProfile!, burnoutScore: 100 } }
    const event = ceilingEvent('test_ceiling_2')
    game = { ...game, pendingEvents: [event] }

    game = resolveEvent(game, 'test_ceiling_2', 'push_through', undefined, true)

    expect(game.managerProfile!.burnoutScar).toBe('hardened')
    expect(game.managerProfile!.diary!.some(e => e.type === 'burnout_scar')).toBe(true)
    expect(game.burnoutCeilingRecoveryUntilRound).toBeUndefined()
    expect(game.burnoutTrainingSlowdownUntilRound).toBeUndefined()
    expect(game.boardPatience).toBe(70)
    expect(game.eventLedger).toContainEqual(expect.objectContaining({
      type: 'decision',
      semanticKey: 'burnoutCeiling:push_through',
      season: 3,
      matchday: 20,
      irreversible: true,
      tension: true,
      systemsAffectedCount: 4,
      madeByPlayer: true,
    }))
  })

  it('madeByPlayer=false — inget ärr skrivs (HIGH 6-disciplinen, samma gate som varsel/offer_pro)', () => {
    let game = baseGame({ currentMatchday: 20 })
    game = { ...game, managerProfile: { ...game.managerProfile!, burnoutScore: 100 } }
    const event = ceilingEvent('test_ceiling_3')
    game = { ...game, pendingEvents: [event] }

    game = resolveEvent(game, 'test_ceiling_3', 'push_through', undefined, false)

    expect(game.managerProfile!.burnoutScar).toBeUndefined()
    expect((game.managerProfile!.diary ?? []).some(e => e.type === 'burnout_scar')).toBe(false)
    expect((game.eventLedger ?? []).some(e => e.semanticKey.startsWith('burnoutCeiling:'))).toBe(false)
  })

  it('ingen managerProfile → ingen krasch', () => {
    let game = baseGame({ managerProfile: undefined, currentMatchday: 20 })
    const event = ceilingEvent('test_ceiling_4')
    game = { ...game, pendingEvents: [event] }

    expect(() => resolveEvent(game, 'test_ceiling_4', 'step_back', undefined, true)).not.toThrow()
    game = resolveEvent(game, 'test_ceiling_4', 'step_back', undefined, true)
    expect(game.eventLedger).toContainEqual(expect.objectContaining({ semanticKey: 'burnoutCeiling:step_back' }))
  })

  it('dubbel-resolution-skydd: en senare kökopia samma säsong konsumeras utan effekter', () => {
    let game = baseGame({ currentMatchday: 20, currentSeason: 3, boardPatience: 70 })
    const first = ceilingEvent('test_ceiling_5a')
    game = { ...game, pendingEvents: [first] }
    game = resolveEvent(game, first.id, 'push_through', undefined, true)

    const second = ceilingEvent('test_ceiling_5b')
    game = { ...game, currentMatchday: 30, pendingEvents: [second], deferredDecisions: [second] }
    game = resolveEvent(game, second.id, 'step_back', undefined, true)

    expect(game.managerProfile!.burnoutScar).toBe('hardened')
    expect(game.managerProfile!.diary!.filter(e => e.type === 'burnout_scar')).toHaveLength(1)
    expect(game.eventLedger!.filter(e => e.semanticKey.startsWith('burnoutCeiling:'))).toHaveLength(1)
    expect(game.boardPatience).toBe(70)
    expect(game.burnoutCeilingRecoveryUntilRound).toBeUndefined()
    expect(game.pendingEvents).toEqual([])
    expect(game.deferredDecisions).toEqual([])
  })
})

describe('begriplighet-klass-f (2026-09-15) — burnoutCeiling når kafferum + granska, inte press', () => {
  it('subject.kind=manager gör posten kvalificerad för coffee_room och review, inte press', () => {
    let game = baseGame({ currentMatchday: 20, currentSeason: 3 })
    game = { ...game, managerProfile: { ...game.managerProfile!, burnoutScore: 100 } }
    const event = ceilingEvent('test_ceiling_surfaces')
    game = { ...game, pendingEvents: [event] }
    game = resolveEvent(game, 'test_ceiling_surfaces', 'push_through', undefined, true)

    const entry = game.eventLedger!.find(e => e.semanticKey === 'burnoutCeiling:push_through')!
    const agenda = redaktoren(game, currentChronology(game))
    const item = agenda.items.find(candidate => candidate.post === entry)!

    expect(item.fitsSurfaces).toEqual(expect.arrayContaining(['coffee_room', 'review']))
    expect(item.fitsSurfaces).not.toContain('press')
    expect(agendaForSurface(agenda, 'coffee_room').some(candidate => candidate.post === entry)).toBe(true)
  })

  it('resolveSubjectName löser manager-subject till game.managerName', () => {
    const game = baseGame({ managerName: 'Anna Test' })
    const name = resolveSubjectName(game, { kind: 'manager', id: game.id }, undefined)
    expect(name).toBe('Anna Test')
  })
})

describe('begriplighet-klass-f (2026-09-15) — supporter_conflict skriver en liggarpost', () => {
  const STURE_VOICE_ID = 'klack_leader:club_forsbacka:sture' as const

  // Klackledaren introduceras redan omgång 1 via generateRosterVoiceIntroductions
  // (voiceIntroductionService.ts) — konflikten kan tidigast fira omg 9-11, långt
  // efter. Fixturen speglar det redan-introducerade normalläget, inte en
  // första-kontakt-situation.
  function gameWithSture(overrides: Partial<SaveGame> = {}): SaveGame {
    return baseGame({
      currentMatchday: 12, currentSeason: 2,
      introducedVoices: { [STURE_VOICE_ID]: { provenance: 'observed', source: 'event', introducedSeason: 1, introducedDate: '2026-01-01' } },
      ...overrides,
    })
  }

  function conflictEvent(id: string): GameEvent {
    return {
      id, type: 'supporterEvent', title: 't', body: 'b',
      sender: { name: 'Sture', role: 'Klackledare' },
      voiceId: STURE_VOICE_ID,
      choices: [
        { id: 'both', label: 'l', effect: { type: 'multiEffect', subEffects: JSON.stringify([{ type: 'supporterMood', amount: 5 }]) } },
        { id: 'sture', label: 'l', effect: { type: 'supporterMood', amount: -2 } },
        { id: 'elin', label: 'l', effect: { type: 'multiEffect', subEffects: JSON.stringify([{ type: 'supporterMood', amount: 3 }]) } },
      ],
      resolved: false,
    }
  }

  it('skriver en decision-post med subject.kind=voice, oavsett vilket val som görs', () => {
    let game = gameWithSture()
    const event = conflictEvent('supporter_conflict_2')
    game = { ...game, pendingEvents: [event] }

    game = resolveEvent(game, event.id, 'sture', undefined, true)

    const entry = game.eventLedger!.find(e => e.semanticKey === 'supporterConflict:2')
    expect(entry).toBeDefined()
    expect(entry).toMatchObject({
      type: 'decision',
      subject: { kind: 'voice', id: STURE_VOICE_ID },
      madeByPlayer: true,
    })
  })

  it('madeByPlayer=false skriver ingen post (samma disciplin som burnoutCeiling)', () => {
    let game = gameWithSture()
    const event = conflictEvent('supporter_conflict_2')
    game = { ...game, pendingEvents: [event] }

    game = resolveEvent(game, event.id, 'sture', undefined, false)

    expect((game.eventLedger ?? []).some(e => e.semanticKey === 'supporterConflict:2')).toBe(false)
  })

  it('dubbel-resolution-skydd: samma säsong loggas bara en gång', () => {
    let game = gameWithSture()
    const first = conflictEvent('supporter_conflict_2a')
    game = { ...game, pendingEvents: [first] }
    game = resolveEvent(game, first.id, 'sture', undefined, true)

    const second = conflictEvent('supporter_conflict_2b')
    game = { ...game, pendingEvents: [second] }
    game = resolveEvent(game, second.id, 'elin', undefined, true)

    expect(game.eventLedger!.filter(e => e.semanticKey === 'supporterConflict:2')).toHaveLength(1)
  })
})
