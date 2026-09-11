import { describe, it, expect } from 'vitest'
import { academyBreakthroughQuote } from '../academyBreakthroughText'

const NEUTRAL_TEXTS = [
  'Vi har vetat länge. Han stannade kvar efter varje pass, ensam med bollen.',
  'Ingen har tvivlat på tekniken. Frågan var om han vågade. Nu vet vi.',
  'Han är lugnast på plan av allihop. Det märks först när det smäller.',
  'Han frågade aldrig om speltid. Han bara tog den, till slut.',
  'Han sa aldrig mycket i omklädningsrummet. Han lät bollen sköta snacket.',
  'Det är inte tur. Det har suttit i honom hela tiden — vi la bara inte fingrarna emellan.',
]

const TENURE_TEXTS = [
  'Han har varit den mest hungrige på träning i två år. Det är inte tur.',
  'Vi sa åt honom att ge det ett år till. Han gav det tre. Nu betalar det sig.',
  'Det där har suttit i honom sedan han var tolv. Vi la bara inte fingrarna emellan.',
]

// DOM_SPRAKSVEP4 (2026-09-12), Språksvep 4 B: en hash-vald tidsbunden rad
// ("två år", "sedan han var tolv") fick tidigare visas för en nyanländ
// akademispelare. Poolen är nu delad — riktat test på gränsvillkoret.
describe('academyBreakthroughQuote', () => {
  it('16-åring med seasonsInAcademy=0 (joinedSeason=innevarande) får aldrig en tidsbunden rad', () => {
    for (let i = 0; i < 200; i++) {
      const quote = academyBreakthroughQuote(`player_16_${i}`, 0)
      expect(TENURE_TEXTS, quote).not.toContain(quote)
      expect(NEUTRAL_TEXTS).toContain(quote)
    }
  })

  it('utan argument alls (äldre anropare) används bara den neutrala poolen', () => {
    for (let i = 0; i < 200; i++) {
      const quote = academyBreakthroughQuote(`player_noarg_${i}`)
      expect(NEUTRAL_TEXTS).toContain(quote)
    }
  })

  it('19-åring med seasonsInAcademy=3 (joinedSeason −3) kan få en tidsbunden rad', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 200; i++) {
      seen.add(academyBreakthroughQuote(`player_19_${i}`, 3))
    }
    const gotTenureLine = [...seen].some(q => TENURE_TEXTS.includes(q))
    expect(gotTenureLine).toBe(true)
    // minSeasons:4-raden ("sedan han var tolv") ska INTE vara nåbar vid 3.
    expect(seen.has(TENURE_TEXTS[2])).toBe(false)
  })

  it('seasonsInAcademy=4 öppnar samtliga tre tidsbundna rader', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 300; i++) {
      seen.add(academyBreakthroughQuote(`player_veteran_${i}`, 4))
    }
    for (const t of TENURE_TEXTS) expect(seen.has(t)).toBe(true)
  })

  it('samma spelare får alltid samma rad (deterministiskt per playerId)', () => {
    const a = academyBreakthroughQuote('fixed_id', 4)
    const b = academyBreakthroughQuote('fixed_id', 4)
    expect(a).toBe(b)
  })
})
