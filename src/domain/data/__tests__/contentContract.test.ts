import { describe, it, expect } from 'vitest'
import { CONTENT_CONTRACT, getContentContractEntry, getWhyNowLine } from '../contentContract'

/**
 * O11 (SLUTTEST_KO.md, 2026-08-20) — INNEHÅLLSKONTRAKTET. Detta testet låser
 * registrets STRUKTUR (fullständighet + intern konsistens), inte innehållets
 * korrekthet — att sextiofältet är rätt ifyllt kan bara verifieras genom att
 * läsa källkoden, inte genom en assertion. Se contentContract.ts:s
 * huvudkommentar för täckningsläget (95 rader, en delmängd `filled: true`).
 */
describe('CONTENT_CONTRACT — struktur', () => {
  it('har 95 rader — 48 GameEventType + 22 StorylineType + 8 ArcType + 17 PortalBeat', () => {
    expect(CONTENT_CONTRACT).toHaveLength(95)
    const bySource = CONTENT_CONTRACT.reduce((acc, e) => {
      acc[e.source] = (acc[e.source] ?? 0) + 1
      return acc
    }, {} as Record<string, number>)
    expect(bySource.GameEventType).toBe(48)
    expect(bySource.StorylineType).toBe(22)
    expect(bySource.ArcType).toBe(8)
    expect(bySource.PortalBeat).toBe(17)
  })

  it('inga dubbletter av (id, source) — samma id FÅR förekomma i flera källor (arc-upplösningar), men inte två gånger i SAMMA källa', () => {
    const seen = new Set<string>()
    for (const e of CONTENT_CONTRACT) {
      const key = `${e.source}::${e.id}`
      expect(seen.has(key), `dubblett: ${key}`).toBe(false)
      seen.add(key)
    }
  })

  it('filled:true-rader har alla sex obligatoriska fält ifyllda (trigger/stateEffect/systems/lifespan icke-tomma; semanticKey+recallSurface får vara explicit undefined/"ingen")', () => {
    const filled = CONTENT_CONTRACT.filter(e => e.filled)
    expect(filled.length).toBeGreaterThan(0)
    for (const e of filled) {
      expect(e.trigger, `${e.id}: trigger saknas trots filled:true`).toBeTruthy()
      expect(e.stateEffect, `${e.id}: stateEffect saknas trots filled:true`).toBeTruthy()
      expect(e.systems?.length, `${e.id}: systems saknas/tomt trots filled:true`).toBeGreaterThan(0)
      expect(e.lifespan, `${e.id}: lifespan saknas trots filled:true`).toBeTruthy()
      // Fält 5/6: 'ingen'/undefined är GILTIGA svar (ambient-regeln) — kravet
      // är att fältet MEDVETET satts, inte att det har ett icke-trivialt värde.
      // recallSurface ska alltid vara en explicit sträng (även 'ingen'), aldrig undefined.
      expect(e.recallSurface, `${e.id}: recallSurface måste vara explicit satt (även 'ingen'), inte undefined`).toBeTruthy()
    }
  })

  it('ingen filled:false-rad låtsas vara komplett (ingen av de sex är av misstag ifylld på en TODO-rad)', () => {
    const todo = CONTENT_CONTRACT.filter(e => !e.filled)
    for (const e of todo) {
      const anyFieldSet = e.trigger || e.stateEffect || (e.systems?.length ?? 0) > 0 || e.lifespan || e.semanticKey || e.recallSurface
      expect(anyFieldSet, `${e.id}: har fält ifyllda men filled:false — sätt filled:true om raden faktiskt är klar`).toBeFalsy()
    }
  })

  it('ingen filled:false-rad har whyNow-fält satta (D1 punkt 4 — inget gissat innan raden faktiskt spårats)', () => {
    const todo = CONTENT_CONTRACT.filter(e => !e.filled)
    for (const e of todo) {
      const anyWhyNowSet = e.deadlineLabel || e.whyNowPerson || e.wholeEventIrreversible || e.seasonDefining
      expect(anyWhyNowSet, `${e.id}: har whyNow-fält satta trots filled:false`).toBeFalsy()
    }
  })
})

/**
 * D1 punkt 4 (DOM_D1_EVENTVIKTNING_2026-08-19.md) — "därför nu"-raden.
 * Jacobs dom 2026-08-21: getWhyNowLine läser contentContract-raden, inte
 * event-instansen. Copy ordagrant låst i domen, testet låser bara
 * prioritetsordningen och null-fallet.
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

  it('undefined-rad (ingen contentContract-träff) ger null', () => {
    expect(getWhyNowLine(undefined)).toBeNull()
  })
})

describe('getContentContractEntry', () => {
  it('hittar en känd rad', () => {
    expect(getContentContractEntry('GameEventType', 'hesitantPlayer')?.filled).toBe(true)
  })

  it('returnerar undefined för okänt (source, id)', () => {
    expect(getContentContractEntry('GameEventType', 'not_a_real_type')).toBeUndefined()
  })
})
