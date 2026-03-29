import type { SaveGame } from '../entities/SaveGame'
import type { Player } from '../entities/Player'
import { mulberry32 } from '../utils/random'

interface AITransferResult {
  updatedPlayers: Player[]
  updatedClubs: SaveGame['clubs']
  transfers: Array<{
    playerId: string
    playerName: string
    fromClubId: string
    fromClubName: string
    toClubId: string
    toClubName: string
    fee: number
  }>
}

export function processAITransfers(
  players: Player[],
  clubs: SaveGame['clubs'],
  season: number,
  managedClubId: string,
  seed: number,
): AITransferResult {
  const rand = mulberry32(seed)
  const transfers: AITransferResult['transfers'] = []
  let updatedPlayers = [...players]
  let updatedClubs = clubs.map(c => ({ ...c }))

  // Each AI club attempts 0-2 signings per season
  const aiClubs = updatedClubs.filter(c => c.id !== managedClubId)

  for (const club of aiClubs) {
    const attempts = Math.floor(rand() * 3) // 0, 1, or 2
    if (attempts === 0) continue

    const clubPlayers = updatedPlayers.filter(p => p.clubId === club.id)
    const squadSize = clubPlayers.length

    // Don't buy if squad is already large
    if (squadSize >= 24) continue

    for (let a = 0; a < attempts; a++) {
      // Budget check
      if (club.transferBudget < 10000) break

      // Find available free agents or players from other AI clubs with large squads
      const candidates = updatedPlayers.filter(p => {
        if (p.clubId === managedClubId) return false
        if (p.clubId === club.id) return false
        if (p.age > 32) return false
        const isFreeAgent = p.clubId === 'free_agent'
        const sellerClub = updatedClubs.find(c => c.id === p.clubId)
        const sellerSquadSize = sellerClub
          ? updatedPlayers.filter(pp => pp.clubId === sellerClub.id).length
          : 0
        const sellerWilling = sellerSquadSize > 20
        return isFreeAgent || sellerWilling
      })

      if (candidates.length === 0) break

      // Pick a candidate (prefer higher CA, with some randomness)
      const sorted = [...candidates].sort((a, b) => b.currentAbility - a.currentAbility)
      const pickIdx = Math.min(Math.floor(rand() * 5), sorted.length - 1)
      const target = sorted[pickIdx]

      const isFreeAgent = target.clubId === 'free_agent'
      const fee = isFreeAgent
        ? 0
        : Math.round((target.marketValue ?? 0) * (0.7 + rand() * 0.5))

      if (!isFreeAgent && fee > club.transferBudget) continue

      const fromClub = updatedClubs.find(c => c.id === target.clubId)

      // Execute transfer
      updatedPlayers = updatedPlayers.map(p =>
        p.id === target.id
          ? { ...p, clubId: club.id, contractUntilSeason: season + 1 + Math.floor(rand() * 3) }
          : p
      )

      // Update squads and budgets
      updatedClubs = updatedClubs.map(c => {
        if (c.id === club.id) {
          return {
            ...c,
            squadPlayerIds: [...c.squadPlayerIds, target.id],
            transferBudget: c.transferBudget - fee,
          }
        }
        if (c.id === target.clubId) {
          return {
            ...c,
            squadPlayerIds: c.squadPlayerIds.filter(id => id !== target.id),
            finances: c.finances + fee,
          }
        }
        return c
      })

      transfers.push({
        playerId: target.id,
        playerName: `${target.firstName} ${target.lastName}`,
        fromClubId: target.clubId,
        fromClubName: fromClub?.name ?? 'Fri agent',
        toClubId: club.id,
        toClubName: club.name,
        fee,
      })
    }
  }

  return { updatedPlayers, updatedClubs, transfers }
}
