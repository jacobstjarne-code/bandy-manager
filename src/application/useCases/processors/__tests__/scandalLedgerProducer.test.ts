import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../createNewGame'
import { processScandals } from '../eventProcessor'

describe('processScandals — eventLedger dual-write', () => {
  it('bygger en canonical scandal-post när den egna klubben drabbas', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
    const managedClub = base.clubs.find(club => club.id === base.managedClubId)!
    const game = {
      ...base,
      clubs: [managedClub],
      activeScandals: [],
      scandalHistory: [],
      pointDeductions: {},
      pendingPointDeductions: {},
    }

    // 0: trigger, municipal_scandal, managed club, positiv variant och första textraderna.
    const result = processScandals(game, 6, () => 0)

    expect(result.ledgerEntries).toEqual([expect.objectContaining({
      type: 'scandal',
      season: 2025,
      matchday: 6,
      subject: { kind: 'club', id: base.managedClubId },
      significance: 70,
    })])
    expect(result.ledgerEntries[0]?.semanticKey).toBe(result.updatedScandals[0]?.id)
  })

  it('skriver ingen klubbkanon för en skandal som bara drabbar en AI-klubb', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
    const aiClub = base.clubs.find(club => club.id !== base.managedClubId)!
    const game = {
      ...base,
      clubs: [aiClub],
      activeScandals: [],
      scandalHistory: [],
      pointDeductions: {},
      pendingPointDeductions: {},
    }

    const result = processScandals(game, 6, () => 0)

    expect(result.updatedScandals).toHaveLength(1)
    expect(result.ledgerEntries).toEqual([])
  })
})
