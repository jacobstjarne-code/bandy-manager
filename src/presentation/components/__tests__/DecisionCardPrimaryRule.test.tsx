import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { BreakpointDecisionScene } from '../BreakpointDecisionScene'
import { DecisionCard } from '../DecisionCard'

const choices = [
  { id: 'stay', label: 'Stanna', subtitle: 'Klubben före stoltheten.', effect: { type: 'noOp' as const } },
  { id: 'leave', label: 'Gå', effect: { type: 'noOp' as const } },
]

describe('beslutskortens primärregel', () => {
  it('visar ingen kopparprimär när valen saknar en uttrycklig asymmetridom', () => {
    const html = renderToStaticMarkup(
      <DecisionCard
        label="Fråga"
        body="Vad gör du?"
        resolved={false}
        choices={choices}
        onChoose={vi.fn()}
      />,
    )

    expect(html.match(/btn-outline/g)).toHaveLength(2)
    expect(html).not.toContain('btn-primary')
  })

  it('visar exakt den uttryckligen valda vägen som kopparprimär', () => {
    const html = renderToStaticMarkup(
      <DecisionCard
        label="Fråga"
        body="Vad gör du?"
        resolved={false}
        choices={choices}
        primaryChoiceId="stay"
        onChoose={vi.fn()}
      />,
    )

    expect(html.match(/btn-primary/g)).toHaveLength(1)
    expect(html.match(/btn-outline/g)).toHaveLength(1)
  })

  it('håller brytpunkten i scenregistret: tint men aldrig btn-primary', () => {
    const html = renderToStaticMarkup(
      <BreakpointDecisionScene
        label="Ordföranden"
        title="Två år till?"
        body="Lampan över bordet är den enda som lyser."
        choices={choices}
        primaryChoiceId="stay"
        onChoose={vi.fn()}
      />,
    )

    expect(html.match(/scene-choice weight/g)).toHaveLength(1)
    expect(html.match(/class="scene-choice"/g)).toHaveLength(1)
    expect(html).not.toContain('btn-primary')
    expect(html).toContain('Klubben före stoltheten.')
  })
})
