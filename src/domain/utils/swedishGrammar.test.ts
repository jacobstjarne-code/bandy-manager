import { describe, expect, it } from 'vitest'
import { fillSwedishTemplate, swedishGenitive } from './swedishGrammar'

describe('svensk genitiv', () => {
  it.each([
    ['Målilla', 'Målillas'],
    ['Söderfors', 'Söderfors'],
    ['Max', 'Max'],
    ['Jazz', 'Jazz'],
    ['Målilla  ', 'Målillas'],
  ])('böjer %s utan dubbelt s', (name, expected) => {
    expect(swedishGenitive(name)).toBe(expected)
  })

  it('fyller genitiv före vanliga tokens och lämnar okända tokens orörda', () => {
    expect(fillSwedishTemplate('{klubb}s {spelare} möter {motståndare}', {
      klubb: 'Söderfors',
      spelare: 'Max',
    })).toBe('Söderfors Max möter {motståndare}')
  })

  it('behandlar ersättningsvärden bokstavligt', () => {
    expect(fillSwedishTemplate('{namn}s avtal', { namn: 'A$&B' })).toBe('A$&Bs avtal')
  })

  it('fyller svenska tokennamn med diakritiska tecken', () => {
    expect(fillSwedishTemplate('{motståndare} igen', { motståndare: 'Västanfors' }))
      .toBe('Västanfors igen')
  })
})
