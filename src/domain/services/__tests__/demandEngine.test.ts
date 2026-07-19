import { describe, it, expect } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import {
  pickDemandCategory, generateDemandDescription, createPendingDemand, isDemandFulfilled,
  DEMAND_WINDOW_MATCHDAYS,
} from '../demandEngine'
import {
  PATRON_PLAYTIME_DEMANDS, DEMAND_LEAGUE_POSITION_LINES, DEMAND_YOUTH_FOCUS_LINES, DEMAND_VISIBLE_MONEY_LINES,
} from '../../data/patronData'

const base = createNewGame({ managerName: 'T', clubId: 'club_forsbacka', season: 2025, seed: 9 })

describe('pickDemandCategory', () => {
  it('is deterministic for the same seed', () => {
    expect(pickDemandCategory(123)).toBe(pickDemandCategory(123))
  })

  it('covers all four categories across a range of seeds', () => {
    const seen = new Set(Array.from({ length: 40 }, (_, i) => pickDemandCategory(i)))
    expect(seen).toEqual(new Set(['playtime', 'league_position', 'youth_focus', 'visible_money']))
  })
})

describe('generateDemandDescription', () => {
  it('uses PATRON_PLAYTIME_DEMANDS content for playtime, interpolated', () => {
    const text = generateDemandDescription('playtime', { seed: 3, favoritePlayerName: 'Andersson', favoriteRelation: 'systerson' })
    const possible = PATRON_PLAYTIME_DEMANDS.map(t => t.replace('{favorit}', 'Andersson').replace('{relation}', 'systerson'))
    expect(possible).toContain(text)
  })

  it('falls back to placeholder favorit/relation text when not given', () => {
    const text = generateDemandDescription('playtime', { seed: 3 })
    expect(text).not.toContain('{favorit}')
    expect(text).not.toContain('{relation}')
  })

  it('uses the Opus-written pools for league_position/youth_focus/visible_money (2026-07-19)', () => {
    expect(DEMAND_LEAGUE_POSITION_LINES).toContain(generateDemandDescription('league_position', { seed: 1 }))
    expect(DEMAND_YOUTH_FOCUS_LINES).toContain(generateDemandDescription('youth_focus', { seed: 1 }))
    expect(DEMAND_VISIBLE_MONEY_LINES).toContain(generateDemandDescription('visible_money', { seed: 1 }))
  })

  it('is deterministic per seed for all three token-free categories', () => {
    expect(generateDemandDescription('league_position', { seed: 7 })).toBe(generateDemandDescription('league_position', { seed: 7 }))
    expect(generateDemandDescription('youth_focus', { seed: 7 })).toBe(generateDemandDescription('youth_focus', { seed: 7 }))
    expect(generateDemandDescription('visible_money', { seed: 7 })).toBe(generateDemandDescription('visible_money', { seed: 7 }))
  })
})

describe('createPendingDemand', () => {
  it('sets deadlineRound to createdRound + DEMAND_WINDOW_MATCHDAYS', () => {
    const demand = createPendingDemand(base, 'league_position', 10, { seed: 5 })
    expect(demand.deadlineRound).toBe(10 + DEMAND_WINDOW_MATCHDAYS)
    expect(demand.createdRound).toBe(10)
  })

  it('snapshots the target players gamesPlayed for playtime demands', () => {
    const player = base.players.find(p => p.clubId === base.managedClubId)!
    const gameWithStats = {
      ...base,
      players: base.players.map(p => p.id === player.id
        ? { ...p, seasonStats: { ...p.seasonStats, gamesPlayed: 7 } }
        : p),
    }
    const demand = createPendingDemand(gameWithStats, 'playtime', 10, { seed: 5, targetPlayerId: player.id })
    expect(demand.snapshotValue).toBe(7)
  })

  it('leaves snapshotValue undefined for non-playtime categories', () => {
    const demand = createPendingDemand(base, 'visible_money', 10, { seed: 5 })
    expect(demand.snapshotValue).toBeUndefined()
  })
})

describe('isDemandFulfilled', () => {
  it('playtime: fulfilled once the target player has played 3+ more games than the snapshot', () => {
    const player = base.players.find(p => p.clubId === base.managedClubId)!
    const demand = { category: 'playtime' as const, description: 'x', targetPlayerId: player.id, createdRound: 1, deadlineRound: 9, snapshotValue: 5 }

    const notYet = { ...base, players: base.players.map(p => p.id === player.id ? { ...p, seasonStats: { ...p.seasonStats, gamesPlayed: 6 } } : p) }
    expect(isDemandFulfilled(notYet, demand, base.managedClubId)).toBe(false)

    const yes = { ...base, players: base.players.map(p => p.id === player.id ? { ...p, seasonStats: { ...p.seasonStats, gamesPlayed: 8 } } : p) }
    expect(isDemandFulfilled(yes, demand, base.managedClubId)).toBe(true)
  })

  it('league_position: fulfilled when standing is in the top half', () => {
    const demand = { category: 'league_position' as const, description: 'x', createdRound: 1, deadlineRound: 9 }
    const totalTeams = base.standings.length
    const topHalfGame = {
      ...base,
      standings: base.standings.map(s => s.clubId === base.managedClubId ? { ...s, position: 1 } : s),
    }
    expect(isDemandFulfilled(topHalfGame, demand, base.managedClubId)).toBe(true)

    const bottomGame = {
      ...base,
      standings: base.standings.map(s => s.clubId === base.managedClubId ? { ...s, position: totalTeams } : s),
    }
    expect(isDemandFulfilled(bottomGame, demand, base.managedClubId)).toBe(false)
  })

  it('youth_focus: fulfilled by academyLevel upgrade or bandySchool', () => {
    const demand = { category: 'youth_focus' as const, description: 'x', createdRound: 1, deadlineRound: 9 }
    expect(isDemandFulfilled({ ...base, academyLevel: 'basic' }, demand, base.managedClubId)).toBe(false)
    expect(isDemandFulfilled({ ...base, academyLevel: 'developing' }, demand, base.managedClubId)).toBe(true)
    expect(isDemandFulfilled({
      ...base, academyLevel: 'basic',
      communityActivities: { ...base.communityActivities, kiosk: 'none', lottery: 'none', bandyplay: false, functionaries: false, julmarknad: false, bandySchool: true },
    }, demand, base.managedClubId)).toBe(true)
  })

  it('visible_money: fulfilled by vipTent or an indoor arena', () => {
    const demand = { category: 'visible_money' as const, description: 'x', createdRound: 1, deadlineRound: 9 }
    expect(isDemandFulfilled(base, demand, base.managedClubId)).toBe(false)
    expect(isDemandFulfilled({
      ...base,
      communityActivities: { ...base.communityActivities, kiosk: 'none', lottery: 'none', bandyplay: false, functionaries: false, julmarknad: false, vipTent: true },
    }, demand, base.managedClubId)).toBe(true)
    expect(isDemandFulfilled({
      ...base,
      clubs: base.clubs.map(c => c.id === base.managedClubId ? { ...c, hasIndoorArena: true } : c),
    }, demand, base.managedClubId)).toBe(true)
  })
})
