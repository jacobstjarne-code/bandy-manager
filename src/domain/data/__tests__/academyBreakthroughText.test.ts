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
// ("två år", "sedan han var tolv") fick visas för en nyanländ akademispelare.
// Efter att Code byggde Player.academyJoinedSeason (bevarar P19-inträdet genom
// uppflyttningen) gatas de tidsbundna raderna på den faktiska akademitiden.
describe('academyBreakthroughQuote', () => {
  it('en nyuppflyttad spelare (0 säsonger i akademin) får aldrig en tidsbunden rad', () => {
    for (let i = 0; i < 200; i++) {
      const quote = academyBreakthroughQuote(`p16_${i}`, { academyJoinedSeason: 2030, currentSeason: 2030 })
      expect(TENURE_TEXTS, quote).not.toContain(quote)
      expect(NEUTRAL_TEXTS).toContain(quote)
    }
  })

  it('utan tenure-uppgift (äldre saves) används bara den neutrala poolen', () => {
    for (let i = 0; i < 200; i++) {
      expect(NEUTRAL_TEXTS).toContain(academyBreakthroughQuote(`pna_${i}`))
      expect(NEUTRAL_TEXTS).toContain(academyBreakthroughQuote(`pundef_${i}`, { currentSeason: 2030 }))
    }
  })

  it('tre säsonger i akademin öppnar minSeasons≤3 men inte minSeasons=4', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 300; i++) {
      seen.add(academyBreakthroughQuote(`p19_${i}`, { academyJoinedSeason: 2027, currentSeason: 2030 }))
    }
    expect([...seen].some(q => TENURE_TEXTS.includes(q))).toBe(true)
    // "sedan han var tolv" kräver 4 — ska inte vara nåbar vid 3.
    expect(seen.has(TENURE_TEXTS[2])).toBe(false)
  })

  it('fyra säsonger öppnar samtliga tre tidsbundna rader', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 400; i++) {
      seen.add(academyBreakthroughQuote(`pvet_${i}`, { academyJoinedSeason: 2026, currentSeason: 2030 }))
    }
    for (const t of TENURE_TEXTS) expect(seen.has(t)).toBe(true)
  })

  it('den råa sifferformen fungerar för anropare som redan har talet', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 300; i++) seen.add(academyBreakthroughQuote(`praw_${i}`, 4))
    for (const t of TENURE_TEXTS) expect(seen.has(t)).toBe(true)
    // och 0 ger bara neutralt
    for (let i = 0; i < 200; i++) expect(NEUTRAL_TEXTS).toContain(academyBreakthroughQuote(`praw0_${i}`, 0))
  })

  it('samma spelare + samma tenure får alltid samma rad (deterministiskt)', () => {
    const a = academyBreakthroughQuote('fixed', { academyJoinedSeason: 2026, currentSeason: 2030 })
    const b = academyBreakthroughQuote('fixed', { academyJoinedSeason: 2026, currentSeason: 2030 })
    expect(a).toBe(b)
  })
})
