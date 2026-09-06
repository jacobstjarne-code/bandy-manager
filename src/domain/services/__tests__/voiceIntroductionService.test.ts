import { describe, expect, it } from 'vitest'
import type { GameEvent } from '../../entities/GameEvent'
import type { SaveGame } from '../../entities/SaveGame'
import {
  assistantCoachVoiceId,
  boardVoiceId,
  canIntroduceVoiceThisMatchday,
  getVoiceEligibleEvents,
  generateRosterVoiceIntroductions,
  isVoiceIntroduced,
  klackLeaderVoiceId,
  localPressVoiceId,
  mecenatVoiceId,
  queueRosterVoiceIntroductions,
  recordVoiceIntroduction,
  seedTilltradeVoices,
  voiceIntroductionBudgetUsed,
} from '../voiceIntroductionService'
import { getNextEvent } from '../eventQueueService'
import { GATED_VOICE_KINDS, SPONSOR_VOICE_GATE_POLICY } from '../../entities/Voice'

function game(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'save-1', managerName: 'Test', managedClubId: 'malilla',
    currentSeason: 2026, currentMatchday: 3, currentDate: '2026-10-12',
    introducedVoices: {}, eventLedger: [], board: [],
    ...overrides,
  } as unknown as SaveGame
}

function event(id: string, voiceId?: string, introducesVoiceId?: string): GameEvent {
  return {
    id, type: 'mecenatEvent', title: id, body: id,
    choices: [{ id: 'ok', label: 'OK', effect: { type: 'noOp' } }],
    resolved: false, voiceId, introducesVoiceId,
  }
}

describe('voice introduction gate', () => {
  it('scopes instance ids by club so a club switch cannot inherit another club voice', () => {
    expect(boardVoiceId('malilla', 'kassor-0')).not.toBe(boardVoiceId('skutskar', 'kassor-0'))
    expect(mecenatVoiceId('malilla', 'm1')).not.toBe(mecenatVoiceId('skutskar', 'm1'))
  })

  it('defers an unknown voice in-place and admits at most one intro card', () => {
    const firstVoice = mecenatVoiceId('malilla', 'm1')
    const secondVoice = mecenatVoiceId('malilla', 'm2')
    const pending = [
      event('blocked', firstVoice),
      event('intro-1', firstVoice, firstVoice),
      event('intro-2', secondVoice, secondVoice),
      event('system'),
    ]

    expect(getVoiceEligibleEvents(game(), pending).map(item => item.id)).toEqual(['intro-1', 'system'])
    expect(getNextEvent({ ...game(), pendingEvents: pending })?.id).toBe('intro-1')
    expect(pending.map(item => item.id)).toEqual(['blocked', 'intro-1', 'intro-2', 'system'])
  })

  it('records the permanent gate and canonical event without storing matchday in the record', () => {
    const voiceId = mecenatVoiceId('malilla', 'm1')
    const updated = recordVoiceIntroduction(game(), voiceId)

    expect(isVoiceIntroduced(updated, voiceId)).toBe(true)
    expect(updated.introducedVoices?.[voiceId]).toEqual({
      provenance: 'observed', source: 'event',
      introducedSeason: 2026, introducedDate: '2026-10-12',
    })
    expect(updated.introducedVoices?.[voiceId]).not.toHaveProperty('matchday')
    expect(updated.eventLedger?.at(-1)).toMatchObject({
      type: 'voice_introduced',
      semanticKey: `voice_introduced:${voiceId}`,
      subject: { kind: 'voice', id: voiceId },
      season: 2026, matchday: 3, clubId: 'malilla',
    })
    expect(voiceIntroductionBudgetUsed(updated)).toBe(1)
  })

  it('is idempotent and treats the budget as empty on the next matchday', () => {
    const voiceId = mecenatVoiceId('malilla', 'm1')
    const once = recordVoiceIntroduction(game(), voiceId)
    const twice = recordVoiceIntroduction(once, voiceId)

    expect(twice).toBe(once)
    expect(twice.eventLedger?.filter(entry => entry.type === 'voice_introduced')).toHaveLength(1)
    expect(canIntroduceVoiceThisMatchday(once)).toBe(false)
    expect(canIntroduceVoiceThisMatchday({ ...once, currentMatchday: 4 })).toBe(true)
  })

  it('defers the first substantive statement until the matchday after the intro', () => {
    const voiceId = mecenatVoiceId('malilla', 'm1')
    const introduced = recordVoiceIntroduction(game(), voiceId)
    const statement = event('statement', voiceId)

    expect(getVoiceEligibleEvents(introduced, [statement])).toEqual([])
    expect(getVoiceEligibleEvents({ ...introduced, currentMatchday: 4 }, [statement]))
      .toEqual([statement])
  })

  it('seeds the board and assistant coach from onboarding without consuming the matchday budget', () => {
    const base = game({
      currentMatchday: 0,
      board: [
        { id: 'kassor-0', firstName: 'Bertil', lastName: 'Kassör', age: 60, gender: 'm', role: 'kassör', personality: 'ekonom' },
      ],
      assistantCoach: { name: 'Karin Isaksson', age: 48, initials: 'KI', personality: 'calm', background: 'tactician' },
    })
    const updated = seedTilltradeVoices(base)

    expect(isVoiceIntroduced(updated, boardVoiceId('malilla', 'kassor-0'))).toBe(true)
    expect(isVoiceIntroduced(updated, assistantCoachVoiceId('malilla'))).toBe(true)
    expect(updated.voiceIntroductionBudget).toBeUndefined()
    expect(updated.eventLedger?.filter(entry => entry.type === 'voice_introduced')).toHaveLength(2)
  })

  it('queues local press before the named supporter leader and admits only one intro today', () => {
    const base = game({
      onboardingComplete: true,
      currentMatchday: 0,
      clubs: [{ id: 'malilla', name: 'Målilla Bandy', shortName: 'Målilla' }] as never,
      journalist: {
        name: 'Karin Bergström', outlet: 'Målilla Nytt', persona: 'analytical',
        style: 'neutral', relationship: 50, memory: [], pressRefusals: 0,
      },
      supporterGroup: { leader: { name: 'Sture', role: 'leader' } } as never,
      pendingEvents: [],
    })

    const queued = queueRosterVoiceIntroductions(base)
    expect(queued.pendingEvents?.map(item => item.introducesVoiceId)).toEqual([
      localPressVoiceId('malilla', 'Karin Bergström'),
      klackLeaderVoiceId('malilla', 'Sture'),
    ])
    expect(queued.pendingEvents?.[0]).toMatchObject({
      title: 'Karin Bergström, Målilla Nytt.',
      body: 'Bevakar Målilla Bandy — matcher, beslut, det som sägs i kön på Konsum. Var på plats före dig, och blir kvar efter.',
    })
    expect(queued.pendingEvents?.[1]?.body).toBe(
      'Håller ihop Målilla Bandys klack — sångerna, resorna, ståplatsen bakom kortsidan. Talar för dem som står där varje match.',
    )
    expect(getVoiceEligibleEvents(queued, queued.pendingEvents ?? []).map(item => item.id))
      .toEqual([queued.pendingEvents?.[0]?.id])
    expect(generateRosterVoiceIntroductions(queued)).toEqual([])
  })

  it('keeps sponsor companies explicitly outside the personal voice gate', () => {
    expect(GATED_VOICE_KINDS).not.toContain('sponsor')
    expect(SPONSOR_VOICE_GATE_POLICY).toBe('company_without_spokesperson_exempt')
  })
})
