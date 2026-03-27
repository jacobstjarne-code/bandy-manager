import { describe, it, expect } from 'vitest'
import { generateWorld } from '../worldGenerator'
import { PlayerPosition } from '../../enums'

describe('generateWorld', () => {
  const world = generateWorld(2026)

  it('generates exactly 12 clubs', () => {
    expect(world.clubs).toHaveLength(12)
  })

  it('generates exactly 264 players (22 per club)', () => {
    expect(world.players).toHaveLength(264)
  })

  it('each club has exactly 22 players in squadPlayerIds', () => {
    for (const club of world.clubs) {
      expect(club.squadPlayerIds).toHaveLength(22)
    }
  })

  it('each club has at least 1 goalkeeper, 3 defenders, 3 halfs, 3 midfielders, 3 forwards', () => {
    const playerMap = new Map(world.players.map((p) => [p.id, p]))

    for (const club of world.clubs) {
      const squad = club.squadPlayerIds.map((id) => playerMap.get(id)!)

      const gkCount = squad.filter((p) => p.position === PlayerPosition.Goalkeeper).length
      const defCount = squad.filter((p) => p.position === PlayerPosition.Defender).length
      const halfCount = squad.filter((p) => p.position === PlayerPosition.Half).length
      const midCount = squad.filter((p) => p.position === PlayerPosition.Midfielder).length
      const fwdCount = squad.filter((p) => p.position === PlayerPosition.Forward).length

      expect(gkCount).toBeGreaterThanOrEqual(1)
      expect(defCount).toBeGreaterThanOrEqual(3)
      expect(halfCount).toBeGreaterThanOrEqual(3)
      expect(midCount).toBeGreaterThanOrEqual(3)
      expect(fwdCount).toBeGreaterThanOrEqual(3)
    }
  })

  it('no player has undefined attribute values (all 14 attributes are numbers 1-99)', () => {
    const ATTR_KEYS = [
      'skating', 'acceleration', 'stamina', 'ballControl', 'passing', 'shooting',
      'dribbling', 'vision', 'decisions', 'workRate', 'positioning', 'defending',
      'cornerSkill', 'goalkeeping',
    ] as const

    for (const player of world.players) {
      for (const key of ATTR_KEYS) {
        const val = player.attributes[key]
        expect(val).toBeDefined()
        expect(typeof val).toBe('number')
        expect(val).toBeGreaterThanOrEqual(1)
        expect(val).toBeLessThanOrEqual(99)
      }
    }
  })

  it('all players have CA between 20-80 and PA >= CA', () => {
    for (const player of world.players) {
      expect(player.currentAbility).toBeGreaterThanOrEqual(20)
      expect(player.currentAbility).toBeLessThanOrEqual(80)
      expect(player.potentialAbility).toBeGreaterThanOrEqual(player.currentAbility)
    }
  })

  it('all players have PA <= 98', () => {
    for (const player of world.players) {
      expect(player.potentialAbility).toBeLessThanOrEqual(98)
    }
  })

  it('Sandviken players have higher average CA than Söderhamns AIK players', () => {
    const sandvikenPlayers = world.players.filter((p) => p.clubId === 'club_sandviken')
    const soderhamnsPlayers = world.players.filter((p) => p.clubId === 'club_soderhamns')

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length

    const sandvikenAvgCA = avg(sandvikenPlayers.map((p) => p.currentAbility))
    const soderhamnsAvgCA = avg(soderhamnsPlayers.map((p) => p.currentAbility))

    expect(sandvikenAvgCA).toBeGreaterThan(soderhamnsAvgCA)
  })

  it('player ids are unique across all 264 players', () => {
    const ids = world.players.map((p) => p.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(264)
  })

  it('same seed produces same output (determinism)', () => {
    const world1 = generateWorld(2026, 99)
    const world2 = generateWorld(2026, 99)

    expect(world1.players[0].id).toBe(world2.players[0].id)
    expect(world1.players[0].firstName).toBe(world2.players[0].firstName)
    expect(world1.players[100].currentAbility).toBe(world2.players[100].currentAbility)
    expect(world1.players[263].attributes.skating).toBe(world2.players[263].attributes.skating)
  })

  it('all clubs have squadPlayerIds.length === 22', () => {
    for (const club of world.clubs) {
      expect(club.squadPlayerIds.length).toBe(22)
    }
  })

  it("every player's clubId matches a valid club id", () => {
    const clubIds = new Set(world.clubs.map((c) => c.id))
    for (const player of world.players) {
      expect(clubIds.has(player.clubId)).toBe(true)
    }
  })

  it('all clubs have arenaCapacity between 2000 and 12000', () => {
    for (const club of world.clubs) {
      expect(club.arenaCapacity).toBeDefined()
      expect(club.arenaCapacity).toBeGreaterThanOrEqual(2000)
      expect(club.arenaCapacity).toBeLessThanOrEqual(12000)
    }
  })
})
