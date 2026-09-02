import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../createNewGame'
import { processSponsors } from '../sponsorProcessor'
import type { SaveGame, Sponsor } from '../../../../domain/entities/SaveGame'

function sponsor(): Sponsor {
  return {
    id: 'license_sponsor',
    name: 'Testpartnern',
    category: 'Test',
    weeklyIncome: 2_000,
    contractRounds: 20,
    signedRound: 0,
  }
}

function process(game: SaveGame) {
  return processSponsors(game, null, game.players, 2, game.currentDate, 1, () => 0.99)
}

describe('processSponsors — kanonisk licenszon', () => {
  it.each(['first_warning', 'point_deduction'] as const)(
    'kan avsluta en sponsor i %s utan licenseReview',
    licenseStatus => {
      const base = createNewGame({ managerName: 'Test', clubId: 'club_heros', season: 2025, seed: 1 })
      const result = process({ ...base, sponsors: [sponsor()], licenseStatus })
      expect(result.updatedSponsors).toEqual([])
      expect(result.inboxItems.some(item => item.id.startsWith('inbox_sponsor_license_leave_'))).toBe(true)
    },
  )

  it('clear ger inget licensdrivet sponsoravhopp med samma seed', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_heros', season: 2025, seed: 1 })
    const result = process({ ...base, sponsors: [sponsor()], licenseStatus: 'clear' })
    expect(result.updatedSponsors).toHaveLength(1)
    expect(result.inboxItems.some(item => item.id.startsWith('inbox_sponsor_license_leave_'))).toBe(false)
  })
})
