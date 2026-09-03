import { describe, expect, it } from 'vitest'
import { fillTemplate, swedishGenitive } from '../matchCommentary'

describe('matchkommentarernas svenska genitiv', () => {
  it.each([
    ['Söderfors', 'Söderfors'],
    ['Bollnäs', 'Bollnäs'],
    ['Västanfors', 'Västanfors'],
    ['Målilla', 'Målillas'],
  ])('%s → %s', (name, expected) => {
    expect(swedishGenitive(name)).toBe(expected)
  })

  it('interpolerar genitiv-token utan dubbelt s', () => {
    expect(fillTemplate('{opponent}s välorganiserade försvar.', { opponent: 'Söderfors' }))
      .toBe('Söderfors välorganiserade försvar.')
    expect(fillTemplate('{opponent}s välorganiserade försvar.', { opponent: 'Målilla' }))
      .toBe('Målillas välorganiserade försvar.')
  })
})
