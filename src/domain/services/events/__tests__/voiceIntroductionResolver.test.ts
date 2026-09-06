import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import type { GameEvent } from '../../../entities/GameEvent'
import type { VoiceId } from '../../../entities/Voice'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import { mecenatVoiceId } from '../../voiceIntroductionService'
import { resolveEvent } from '../eventResolver'

describe('eventResolver — voice introductions', () => {
  it('opens the gate and consumes the period budget when an intro card is answered', () => {
    const base = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 72 })
    const voiceId = mecenatVoiceId(base.managedClubId, 'm1')
    const intro: GameEvent = {
      id: 'voice-intro-test', type: 'mecenatEvent', title: 'Intro', body: 'Intro',
      sender: { name: 'Testperson', role: 'Mecenat' },
      voiceId, introducesVoiceId: voiceId, resolved: false,
      choices: [{ id: 'ack', label: 'Noterat', effect: { type: 'noOp' } }],
    }

    const resolved = resolveEvent({ ...base, pendingEvents: [intro] }, intro.id, 'ack', () => 0.5, true)

    expect(resolved.pendingEvents).toEqual([])
    expect(resolved.introducedVoices?.[voiceId]).toMatchObject({
      provenance: 'observed', source: 'event', nameSnapshot: 'Testperson', roleSnapshot: 'Mecenat',
    })
    expect(resolved.voiceIntroductionBudget).toEqual({
      season: base.currentSeason, matchday: base.currentMatchday, used: 1,
      introducedVoiceIds: [voiceId],
    })
    expect(resolved.eventLedger?.some(entry =>
      entry.type === 'voice_introduced' && entry.subject?.id === voiceId
    )).toBe(true)
  })

  it('cannot resolve a deferred voice event or a second intro on the same matchday', () => {
    const base = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 73 })
    const firstVoice = mecenatVoiceId(base.managedClubId, 'm1')
    const secondVoice = mecenatVoiceId(base.managedClubId, 'm2')
    const intro = (id: string, voiceId: VoiceId): GameEvent => ({
      id, type: 'mecenatEvent', title: id, body: id,
      voiceId, introducesVoiceId: voiceId, resolved: false,
      choices: [{ id: 'ack', label: 'Noterat', effect: { type: 'noOp' } }],
    })
    const blockedSpeech: GameEvent = {
      id: 'blocked-speech', type: 'mecenatEvent', title: 'Tal', body: 'Tal',
      voiceId: firstVoice, resolved: false,
      choices: [{ id: 'ack', label: 'Noterat', effect: { type: 'noOp' } }],
    }

    const beforeIntroduction = { ...base, pendingEvents: [blockedSpeech] }
    expect(resolveEvent(beforeIntroduction, blockedSpeech.id, 'ack', () => 0.5, true)).toBe(beforeIntroduction)

    const firstResolved = resolveEvent(
      { ...base, pendingEvents: [intro('intro-1', firstVoice)] },
      'intro-1', 'ack', () => 0.5, true,
    )
    const secondPending = { ...firstResolved, pendingEvents: [intro('intro-2', secondVoice)] }
    expect(resolveEvent(secondPending, 'intro-2', 'ack', () => 0.5, true)).toBe(secondPending)

    const sameDaySpeech = { ...firstResolved, pendingEvents: [blockedSpeech] }
    expect(resolveEvent(sameDaySpeech, blockedSpeech.id, 'ack', () => 0.5, true)).toBe(sameDaySpeech)

    const nextDaySpeech = { ...sameDaySpeech, currentMatchday: sameDaySpeech.currentMatchday + 1 }
    expect(resolveEvent(nextDaySpeech, blockedSpeech.id, 'ack', () => 0.5, true).pendingEvents).toEqual([])
  })
})
