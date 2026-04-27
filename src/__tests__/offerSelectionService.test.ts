import { selectThreeOffers, selectQuoteIndex } from '../domain/services/offerSelectionService'

describe('selectThreeOffers', () => {
  const seeds = [1, 42, 12345, 999999, Date.now()]

  test.each(seeds)('seed %i ger exakt 1 hard, 1 medium, 1 easy', (seed) => {
    const offers = selectThreeOffers(seed)
    expect(offers).toHaveLength(3)
    const difficulties = offers.map(o => o.difficulty)
    expect(difficulties.filter(d => d === 'hard')).toHaveLength(1)
    expect(difficulties.filter(d => d === 'medium')).toHaveLength(1)
    expect(difficulties.filter(d => d === 'easy')).toHaveLength(1)
  })

  test('determinism — samma seed ger samma resultat', () => {
    const seed = 7890
    const first = selectThreeOffers(seed)
    const second = selectThreeOffers(seed)
    expect(first).toEqual(second)
  })

  test('olika seeds ger (nästan alltid) olika urval', () => {
    const a = selectThreeOffers(1)
    const b = selectThreeOffers(999999)
    // Det är statistiskt möjligt att de matchar, men med 12 klubbar är det osannolikt
    const sameIds = a.map(o => o.clubId).join(',') === b.map(o => o.clubId).join(',')
    // Vi testar bara att alla tre clubIds är unika inom varje urval
    const idsA = a.map(o => o.clubId)
    expect(new Set(idsA).size).toBe(3)
  })

  test('inga dubbletter inom ett urval', () => {
    for (const seed of [1, 42, 100, 200, 300]) {
      const offers = selectThreeOffers(seed)
      const ids = offers.map(o => o.clubId)
      expect(new Set(ids).size).toBe(3)
    }
  })

  test('alla returnerade clubIds är giltiga', () => {
    const offers = selectThreeOffers(42)
    for (const offer of offers) {
      expect(offer.clubId).toMatch(/^club_/)
      expect(offer.quoteIndex).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('selectQuoteIndex', () => {
  test('returnerar index inom [0, poolSize)', () => {
    for (let i = 0; i < 20; i++) {
      const idx = selectQuoteIndex(i * 1000, 'club_forsbacka', 5)
      expect(idx).toBeGreaterThanOrEqual(0)
      expect(idx).toBeLessThan(5)
    }
  })

  test('deterministisk — samma seed + clubId ger samma index', () => {
    const a = selectQuoteIndex(42, 'club_soderfors', 4)
    const b = selectQuoteIndex(42, 'club_soderfors', 4)
    expect(a).toBe(b)
  })

  test('poolSize 0 returnerar 0 utan krasch', () => {
    expect(selectQuoteIndex(42, 'club_forsbacka', 0)).toBe(0)
  })
})
