import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import type { GameEvent } from '../../../../domain/entities/GameEvent'
import { EventCardInline } from '../EventCardInline'

const state = vi.hoisted(() => ({ resolveEvent: vi.fn(), game: { players: [], fixtures: [], clubs: [] } }))
vi.mock('../../../store/gameStore', () => ({ useGameStore: (select: (s: typeof state) => unknown) => select(state) }))

describe('portalens mecenatmiddag', () => {
  it('öppnar en fråga i taget och skickar bara det färdiga slutvalet till resolvern', async () => {
    const event = {
      id: 'dinner', type: 'mecenatDinner', title: 'På jakt med Karin', body: 'Karin bjuder med dig.', resolved: false,
      choices: Array.from({ length: 8 }, (_, i) => ({ id: `combination-${i}`, label: `Kombination ${i}`, effect: { type: 'noOp' } })),
      sponsorData: JSON.stringify({ mecenatId: 'karin', mecenatName: 'Karin', setting: 'jakt', settingDescription: 'Vid jaktstugan.',
        questions: Array.from({ length: 3 }, (_, i) => ({ id: `q${i}`, text: `Fråga ${i + 1}?`,
          options: [0, 1].map(n => ({ id: `q${i}_opt${n}`, label: `Svar ${i + 1}.${n + 1}`, followUp: 'Karin nickar.', effect: { happiness: 1, communityStanding: 0 } })) })) }),
    } as GameEvent
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
    async function click(text: string) {
      const button = [...host.querySelectorAll('button')].find(b => b.textContent === text)
      expect(button, text).toBeDefined()
      await act(async () => button!.click())
    }
    try {
      await act(async () => root.render(<EventCardInline event={event} />))
      expect(host.textContent).not.toContain('Kombination')
      await click('Följ med')
      await click('Slå dig ner')
      for (let i = 0; i < 3; i++) {
        expect(host.textContent).toContain(`Fråga ${i + 1}?`)
        expect(host.textContent).not.toContain(`Svar ${i + 2}.1`)
        await click(`Svar ${i + 1}.1`)
        expect(host.textContent).toContain('Karin nickar.')
        expect(state.resolveEvent).not.toHaveBeenCalled()
        const next = [...host.querySelectorAll('button')].at(-1)!
        await act(async () => next.click())
      }
      expect(state.resolveEvent).not.toHaveBeenCalled()
      const finish = [...host.querySelectorAll('button')].at(-1)!
      await act(async () => finish.click())
      expect(state.resolveEvent).toHaveBeenCalledTimes(1)
      expect(state.resolveEvent).toHaveBeenCalledWith('dinner', 'final|q0_opt0|q1_opt0|q2_opt0', true)
    } finally {
      await act(async () => root.unmount())
      host.remove()
      Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: false })
    }
  })
})
