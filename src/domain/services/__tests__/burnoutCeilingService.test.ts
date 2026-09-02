import { describe, it, expect } from 'vitest'
import { generateBurnoutCeilingEvent } from '../burnoutCeilingService'
import { BURNOUT_CEILING_RECOVERY_WINDOW_ROUNDS, BURNOUT_CEILING_BOARD_PATIENCE_COST } from '../managerProfileService'

/**
 * DOM_BURNOUT_TAK_2026-09-02 (A) — det tvingande valet. Mallsträngarna är
 * '[Opus]' (Code skriver aldrig svensk speltext); testerna verifierar bara
 * strukturen — form, effekter, magnituder — inte prosan.
 */
describe('generateBurnoutCeilingEvent', () => {
  it('rätt typ, olöst, unikt id per säsong+omgång', () => {
    const a = generateBurnoutCeilingEvent(10, 3)
    const b = generateBurnoutCeilingEvent(11, 3)
    expect(a.type).toBe('burnoutCeiling')
    expect(a.resolved).toBe(false)
    expect(a.id).not.toBe(b.id)
  })

  it('två val, bägge irreversibla — ett ärr går inte att ändra i efterhand', () => {
    const event = generateBurnoutCeilingEvent(10, 3)
    expect(event.choices).toHaveLength(2)
    expect(event.choices.map(c => c.id)).toEqual(['step_back', 'push_through'])
    expect(event.choices.every(c => c.irreversible)).toBe(true)
  })

  it('step_back: startBurnoutCeilingRecovery + startTrainingSlowdown delar samma fönsterlängd, plus boardPatience-kostnaden', () => {
    const event = generateBurnoutCeilingEvent(10, 3)
    const stepBack = event.choices.find(c => c.id === 'step_back')!
    const sub = JSON.parse(stepBack.effect.subEffects!) as Array<{ type: string; amount?: number }>
    expect(sub).toEqual([
      { type: 'startBurnoutCeilingRecovery', amount: BURNOUT_CEILING_RECOVERY_WINDOW_ROUNDS },
      { type: 'startTrainingSlowdown', amount: BURNOUT_CEILING_RECOVERY_WINDOW_ROUNDS },
      { type: 'boardPatience', amount: BURNOUT_CEILING_BOARD_PATIENCE_COST },
    ])
  })

  it('push_through: inget mekaniskt pris (noOp) — risken är narrativ, inte modellerad som ett fält', () => {
    const event = generateBurnoutCeilingEvent(10, 3)
    const pushThrough = event.choices.find(c => c.id === 'push_through')!
    expect(pushThrough.effect).toEqual({ type: 'noOp' })
  })

  it('title/body/subtitles är alla \'[Opus]\' — Code skriver aldrig svensk speltext', () => {
    const event = generateBurnoutCeilingEvent(10, 3)
    expect(event.title).toBe('[Opus]')
    expect(event.body).toBe('[Opus]')
    for (const choice of event.choices) {
      expect(choice.label).toBe('[Opus]')
      expect(choice.subtitle).toBe('[Opus]')
    }
  })
})
