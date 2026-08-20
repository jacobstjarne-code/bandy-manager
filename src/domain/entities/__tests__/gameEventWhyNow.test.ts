import { describe, it, expect } from 'vitest'
import { getWhyNowLine } from '../GameEvent'

/**
 * D1 punkt 4 (DOM_D1_EVENTVIKTNING_2026-08-19.md, SLUTTEST_KO.md) —
 * "därför nu"-raden. Copy ordagrant låst i domen, testet låser bara
 * prioritetsordningen och null-fallet, inte innehållet i sig.
 */
describe('getWhyNowLine', () => {
  it('deadline vinner över allt annat om flera fält är satta', () => {
    expect(getWhyNowLine({ deadlineLabel: 'omgång 14', whyNowPerson: 'Anders', wholeEventIrreversible: true, seasonDefining: true }))
      .toBe('Svaret måste komma före omgång 14.')
  })

  it('person vinner över irreversibel och säsongsavgörande', () => {
    expect(getWhyNowLine({ whyNowPerson: 'Anders', wholeEventIrreversible: true, seasonDefining: true }))
      .toBe('Anders väntar på besked.')
  })

  it('irreversibel vinner över säsongsavgörande', () => {
    expect(getWhyNowLine({ wholeEventIrreversible: true, seasonDefining: true }))
      .toBe('Det här går inte att göra ogjort.')
  })

  it('säsongsavgörande är sista fallet', () => {
    expect(getWhyNowLine({ seasonDefining: true })).toBe('Det som bestäms här bär hela våren.')
  })

  it('inget fält satt ger null — domens signal att vikten ska sänkas', () => {
    expect(getWhyNowLine({})).toBeNull()
  })
})
