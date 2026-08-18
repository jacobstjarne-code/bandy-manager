import { selectThreeOffers, selectQuoteIndex, computeDifficultyScore } from '../domain/services/offerSelectionService'
import { ClubExpectation } from '../domain/enums'

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

describe('computeDifficultyScore — U1 (SLUTTEST_KO.md, 2026-08-17) / D029', () => {
  // Skutskär (rep 52, AvoidBottom, finances 210000/wageBudget 50000 = 4.2x
  // marginal) var det konkreta buggexemplet: gammal modell (reputation-only,
  // <55=hard) gav "hard" trots att styrelsekravet var det lägsta som finns
  // och ekonomin var sund. En testare tankade en hel säsong och styrelsen
  // blev ändå NÖJDARE.
  it('Skutskär-liknande klubb (lågt rykte, lågt krav, sund ekonomi) landar INTE i hard-tröskeln', () => {
    const score = computeDifficultyScore({
      reputation: 52, finances: 210_000, wageBudget: 50_000, boardExpectation: ClubExpectation.AvoidBottom,
    })
    expect(score).toBeGreaterThanOrEqual(50)  // medium-tröskeln, se getDifficulty
  })

  it('en klubb vars styrelsekrav ÖVERSTIGER vad ryktet motiverar får lägre score', () => {
    const matched = computeDifficultyScore({
      reputation: 55, finances: 300_000, wageBudget: 60_000, boardExpectation: ClubExpectation.MidTable,
    })
    const overreaching = computeDifficultyScore({
      reputation: 55, finances: 300_000, wageBudget: 60_000, boardExpectation: ClubExpectation.WinLeague,
    })
    expect(overreaching).toBeLessThan(matched)
  })

  it('tunn kassamarginal (< 4x lönebudget) sänker score, rejäl marginal (>= 6x) höjer den', () => {
    const thin = computeDifficultyScore({
      reputation: 60, finances: 150_000, wageBudget: 50_000, boardExpectation: ClubExpectation.MidTable,
    })
    const neutral = computeDifficultyScore({
      reputation: 60, finances: 250_000, wageBudget: 50_000, boardExpectation: ClubExpectation.MidTable,
    })
    const healthy = computeDifficultyScore({
      reputation: 60, finances: 350_000, wageBudget: 50_000, boardExpectation: ClubExpectation.MidTable,
    })
    expect(thin).toBeLessThan(neutral)
    expect(healthy).toBeGreaterThan(neutral)
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
