import { CLUB_EXTENDED_INFO } from '../domain/data/clubExtendedInfo'
import { CLUB_TEMPLATES } from '../domain/services/worldGenerator'

describe('CLUB_EXTENDED_INFO', () => {
  const expectedIds = CLUB_TEMPLATES.map(t => t.id)

  test('alla 12 klubb-IDs från CLUB_TEMPLATES finns i CLUB_EXTENDED_INFO', () => {
    for (const id of expectedIds) {
      expect(CLUB_EXTENDED_INFO[id]).toBeDefined()
    }
  })

  test('inga extra IDs i CLUB_EXTENDED_INFO', () => {
    const extIds = Object.keys(CLUB_EXTENDED_INFO)
    expect(extIds.length).toBe(expectedIds.length)
  })

  // Enkel kontroll — vanliga svenska förnamn
  const SVENSKA_FORNAMN = /\b(Lars|Erik|Per|Jan|Sven|Anders|Johan|Karl|Nils|Birger|Gunnar|Sten|Rune|Göran|Bo|Ulf|Ingvar|Bengt|Kjell|Leif|Margareta|Britta|Eva|Karin|Anna|Lisa|Maria|Kristina|Helena|Berit|Inga|Eivor|Ingrid)\b/

  test('inga personnamn i arenaNote-fält', () => {
    for (const [id, info] of Object.entries(CLUB_EXTENDED_INFO)) {
      expect(info.arenaNote).not.toMatch(SVENSKA_FORNAMN)
    }
  })

  test('inga personnamn i patronType-fält', () => {
    for (const [id, info] of Object.entries(CLUB_EXTENDED_INFO)) {
      expect(info.patronType).not.toMatch(SVENSKA_FORNAMN)
    }
  })

  test('inga personnamn i briefDescription-fält', () => {
    for (const [id, info] of Object.entries(CLUB_EXTENDED_INFO)) {
      expect(info.briefDescription).not.toMatch(SVENSKA_FORNAMN)
    }
  })

  test('clubId matchar nyckeln', () => {
    for (const [key, info] of Object.entries(CLUB_EXTENDED_INFO)) {
      expect(info.clubId).toBe(key)
    }
  })

  test('alla obligatoriska fält är ifyllda', () => {
    for (const [id, info] of Object.entries(CLUB_EXTENDED_INFO)) {
      expect(info.arenaNote.trim().length).toBeGreaterThan(0)
      expect(info.patronType.trim().length).toBeGreaterThan(0)
      expect(info.klimateArchetype.trim().length).toBeGreaterThan(0)
      expect(info.briefDescription.trim().length).toBeGreaterThan(0)
    }
  })

  // B3 (Jacobs dom, 2026-08-19): sex och sex, avsiktligt — de två SVÅR-klassade
  // klubbarna (U1s difficulty-modell) på var sitt håll. Låser domen mot
  // en framtida omedveten ändring — flippar någon en klubb utan att döma
  // om ska testet faila, inte tyst glida isär från domen.
  test('playStyleTradition — alla tolv dömda, sex spelande och sex åkande', () => {
    const bySplit: Record<'spelande' | 'akande', string[]> = { spelande: [], akande: [] }
    for (const [id, info] of Object.entries(CLUB_EXTENDED_INFO)) {
      expect(info.playStyleTradition, `${id} saknar playStyleTradition`).toBeDefined()
      bySplit[info.playStyleTradition!].push(id)
    }
    expect(bySplit.spelande.sort()).toEqual(
      ['club_gagnef', 'club_malilla', 'club_rogle', 'club_skutskar', 'club_soderfors', 'club_vastanfors']
    )
    expect(bySplit.akande.sort()).toEqual(
      ['club_forsbacka', 'club_halleforsnas', 'club_heros', 'club_karlsborg', 'club_lesjofors', 'club_slottsbron']
    )
  })

  test('playStyleTradition — de två SVÅR-klubbarna på var sitt håll (avsiktligt)', () => {
    expect(CLUB_EXTENDED_INFO['club_skutskar'].playStyleTradition).toBe('spelande')
    expect(CLUB_EXTENDED_INFO['club_slottsbron'].playStyleTradition).toBe('akande')
  })
})
