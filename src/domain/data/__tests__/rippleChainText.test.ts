// ÖVERLÄMNING 2 steg 3 (2026-08-16): verifierar att textraderna Jacob
// skrev faktiskt slår upp korrekt per fält × riktning × magnitude, och att
// en icke-existerande kombination (ej reachable idag) ger undefined istf
// en gissning.
import { describe, it, expect } from 'vitest'
import { getRippleStepText } from '../rippleChainText'
import type { RippleChainStep } from '../../entities/SaveGame'

function step(overrides: Partial<RippleChainStep>): RippleChainStep {
  return { label: 'Stämningen', dir: 'down', scope: 'club', magnitude: 'knappt', ...overrides }
}

describe('getRippleStepText', () => {
  it('slår upp alla tre nivåer för Stämningen ner', () => {
    expect(getRippleStepText(step({ magnitude: 'knappt' }))).toBe('Lite tystare på läktaren nästa gång.')
    expect(getRippleStepText(step({ magnitude: 'tydligt' }))).toBe('Stämningen sjönk. Det märks på söndag.')
    expect(getRippleStepText(step({ magnitude: 'kraftigt' }))).toBe('Stämningen är i botten. Folk pratar om annat än bandy.')
  })

  it('Moralen ner, kraftigt', () => {
    expect(getRippleStepText(step({ label: 'Moralen', dir: 'down', scope: 'player', magnitude: 'kraftigt' })))
      .toBe('Han är förbannad. Det där kommer att märkas ett tag.')
  })

  it('Kassan upp, tydligt', () => {
    expect(getRippleStepText(step({ label: 'Kassan', dir: 'up', magnitude: 'tydligt' })))
      .toBe('Kassan andas. Det går att planera igen.')
  })

  it('en riktning utan text (Orten upp — ingen trigger höjer den idag) ger undefined, inte en gissning', () => {
    expect(getRippleStepText(step({ label: 'Orten', dir: 'up' }))).toBeUndefined()
  })
})
