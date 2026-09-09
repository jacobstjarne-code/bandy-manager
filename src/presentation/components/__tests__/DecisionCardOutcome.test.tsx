import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DecisionCard } from '../DecisionCard'

const baseProps = {
  label: 'Beslut',
  body: 'Vad gör du?',
  choices: [],
  onChoose: () => {},
}

describe('DecisionCard — O12:s efterkvitto', () => {
  it('visar valt svar och exakt utfall först när beslutet är resolverat', () => {
    const resolved = renderToStaticMarkup(
      <DecisionCard
        {...baseProps}
        resolved
        chosenLabel="Stå fast"
        chosenOutcome="Klubbens rykte +2 · Kassan −10 000 kr"
      />,
    )
    expect(resolved).toContain('Stå fast')
    expect(resolved).toContain('Klubbens rykte +2 · Kassan −10 000 kr')

    const unresolved = renderToStaticMarkup(
      <DecisionCard
        {...baseProps}
        resolved={false}
        chosenOutcome="Klubbens rykte +2"
      />,
    )
    expect(unresolved).not.toContain('Klubbens rykte +2')
  })
})
