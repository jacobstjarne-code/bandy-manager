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
})
