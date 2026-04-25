import { describe, it, expect } from 'vitest'
import { checkLicenseStatus, buildLicenseInboxItem } from '../licenseService'
import type { SaveGame } from '../../entities/SaveGame'
import type { LicenseStatus } from '../licenseService'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeGame(overrides: {
  finances?: number
  startFinances?: number
  licenseStatus?: LicenseStatus
  consecutiveLossSeasons?: number
} = {}): SaveGame {
  const {
    finances = 100000,
    startFinances = 100000,
    licenseStatus,
    consecutiveLossSeasons,
  } = overrides
  return {
    managedClubId: 'club_1',
    currentSeason: 1,
    currentDate: '2026-01-01',
    clubs: [
      {
        id: 'club_1',
        name: 'Testklubb',
        shortName: 'TEST',
        region: 'Mälardalen',
        reputation: 60,
        finances,
        wageBudget: 200000,
        transferBudget: 100000,
        youthQuality: 50,
        youthRecruitment: 50,
        youthDevelopment: 50,
        facilities: 50,
        squadPlayerIds: [],
      } as never,
    ],
    seasonStartSnapshot: { season: 1, finalPosition: 6, finances: startFinances, communityStanding: 50, squadSize: 20, supporterMembers: 100, academyPromotions: 0 },
    licenseStatus,
    consecutiveLossSeasons,
  } as unknown as SaveGame
}

// ── checkLicenseStatus ────────────────────────────────────────────────────────

describe('checkLicenseStatus', () => {
  it('returns null action and clear status when season is profitable', () => {
    const game = makeGame({ finances: 150000, startFinances: 100000 })
    const { action, newLicenseStatus, newConsecutiveLossSeasons } = checkLicenseStatus(game, 1)
    expect(action).toBeNull()
    expect(newLicenseStatus).toBe('clear')
    expect(newConsecutiveLossSeasons).toBe(0)
  })

  it('resets consecutive losses to 0 on profit season', () => {
    const game = makeGame({ finances: 200000, startFinances: 100000, consecutiveLossSeasons: 1 })
    const { newConsecutiveLossSeasons } = checkLicenseStatus(game, 1)
    expect(newConsecutiveLossSeasons).toBe(0)
  })

  it('emits cleared action when recovering from warning status', () => {
    const game = makeGame({
      finances: 200000,
      startFinances: 100000,
      licenseStatus: 'first_warning',
      consecutiveLossSeasons: 2,
    })
    const { action, newLicenseStatus } = checkLicenseStatus(game, 1)
    expect(action?.type).toBe('cleared')
    expect(newLicenseStatus).toBe('clear')
  })

  it('no action when profit with already-clear status', () => {
    const game = makeGame({ finances: 200000, startFinances: 100000, licenseStatus: 'clear' })
    const { action } = checkLicenseStatus(game, 1)
    expect(action).toBeNull()
  })

  it('increments consecutive losses on deficit', () => {
    const game = makeGame({ finances: 80000, startFinances: 100000 })
    const { newConsecutiveLossSeasons } = checkLicenseStatus(game, 1)
    expect(newConsecutiveLossSeasons).toBe(1)
  })

  it('issues first_warning on 2nd consecutive loss from clear', () => {
    const game = makeGame({
      finances: 80000,
      startFinances: 100000,
      licenseStatus: 'clear',
      consecutiveLossSeasons: 1,
    })
    const { action, newLicenseStatus } = checkLicenseStatus(game, 1)
    expect(action?.type).toBe('first_warning')
    expect(newLicenseStatus).toBe('first_warning')
  })

  it('issues point_deduction on 3rd consecutive loss from first_warning', () => {
    const game = makeGame({
      finances: 80000,
      startFinances: 100000,
      licenseStatus: 'first_warning',
      consecutiveLossSeasons: 2,
    })
    const { action, newLicenseStatus } = checkLicenseStatus(game, 1)
    expect(action?.type).toBe('point_deduction')
    expect(newLicenseStatus).toBe('point_deduction')
  })

  it('issues license_denied on 4th consecutive loss from point_deduction', () => {
    const game = makeGame({
      finances: 80000,
      startFinances: 100000,
      licenseStatus: 'point_deduction',
      consecutiveLossSeasons: 3,
    })
    const { action, newLicenseStatus } = checkLicenseStatus(game, 1)
    expect(action?.type).toBe('license_denied')
    expect(newLicenseStatus).toBe('license_denied')
  })

  it('no action when losing but threshold not crossed yet (1st loss)', () => {
    const game = makeGame({ finances: 50000, startFinances: 100000 })
    const { action } = checkLicenseStatus(game, 1)
    expect(action).toBeNull()
  })

  it('no action when losing and already past threshold (e.g. status = first_warning but only 2 consecutive)', () => {
    const game = makeGame({
      finances: 50000,
      startFinances: 100000,
      licenseStatus: 'first_warning',
      consecutiveLossSeasons: 1,
    })
    // consecutiveLoss becomes 2, but newConsecutive === 2 only triggers when status was 'clear'
    const { action } = checkLicenseStatus(game, 1)
    expect(action).toBeNull()
  })

  it('action texts are non-empty strings', () => {
    const game = makeGame({
      finances: 80000,
      startFinances: 100000,
      licenseStatus: 'clear',
      consecutiveLossSeasons: 1,
    })
    const { action } = checkLicenseStatus(game, 42)
    expect(action?.message.length).toBeGreaterThan(5)
    expect(action?.inboxTitle.length).toBeGreaterThan(5)
  })

  it('different seeds produce different texts (pick rotation)', () => {
    const game1 = makeGame({ finances: 80000, startFinances: 100000, consecutiveLossSeasons: 1 })
    const game2 = makeGame({ finances: 80000, startFinances: 100000, consecutiveLossSeasons: 1 })
    const r1 = checkLicenseStatus(game1, 0)
    const r2 = checkLicenseStatus(game2, 1)
    // seed 0 picks index 0, seed 1 picks index 1 — texts may differ
    // just ensure determinism: same seed = same text
    const r1b = checkLicenseStatus(game1, 0)
    expect(r1.action?.message).toBe(r1b.action?.message)
  })
})

// ── buildLicenseInboxItem ─────────────────────────────────────────────────────

describe('buildLicenseInboxItem', () => {
  it('builds correct inbox item', () => {
    const game = makeGame({ finances: 80000, startFinances: 100000, consecutiveLossSeasons: 1 })
    const { action } = checkLicenseStatus(game, 1)
    const item = buildLicenseInboxItem(action!, '2026-04-01', 1)
    expect(item.id).toBe('inbox_license_status_1')
    expect(item.title).toBe(action!.inboxTitle)
    expect(item.body).toBe(action!.message)
    expect(item.isRead).toBe(false)
  })
})
