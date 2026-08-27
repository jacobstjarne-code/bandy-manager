import { describe, it, expect } from 'vitest'
import { checkInvariants } from '../gameInvariants'
import { makeBaseGame } from '../../../presentation/screens/dev/gameStateFactory'

// SEXSÄSONGSAUDITEN 2026-08-26, SPÅR 2a — staleContracts-invarianten:
// en spelare som fortfarande sitter på en riktig klubb (clubId ≠ 'free_agent')
// ska aldrig ha contractUntilSeason < currentSeason. Se gameInvariants.ts:s
// checkStaleContracts för rotorsaksresonemang (seasonEndProcessor.ts löser
// kontraktsutgångar INNAN currentSeason räknas upp, så detta ska aldrig
// inträffa i normal spelgång — invarianten är ett skyddsnät, inte en känd bugg).
describe('gameInvariants — staleContracts', () => {
  it('ger inget fynd för ett fräscht spel (contractUntilSeason alltid >= currentSeason för klubbade spelare)', () => {
    const game = makeBaseGame({ seed: 1 })
    const findings = checkInvariants(game).filter(f => f.name === 'staleContracts')
    expect(findings).toEqual([])
  })

  it('ger inget fynd för en spelare vars kontrakt just tar slut den här säsongen (contractUntilSeason === currentSeason är fortfarande giltigt)', () => {
    const game = makeBaseGame({ seed: 1 })
    const player = game.players.find(p => p.clubId === game.managedClubId)!
    const withCurrentSeasonExpiry = {
      ...game,
      players: game.players.map(p => p.id === player.id ? { ...p, contractUntilSeason: game.currentSeason } : p),
    }
    const findings = checkInvariants(withCurrentSeasonExpiry).filter(f => f.name === 'staleContracts')
    expect(findings).toEqual([])
  })

  it('flaggar en klubbad spelare vars contractUntilSeason < currentSeason', () => {
    const game = makeBaseGame({ seed: 1 })
    const player = game.players.find(p => p.clubId === game.managedClubId)!
    const broken = {
      ...game,
      players: game.players.map(p => p.id === player.id ? { ...p, contractUntilSeason: game.currentSeason - 1 } : p),
    }
    const findings = checkInvariants(broken).filter(f => f.name === 'staleContracts')
    expect(findings).toHaveLength(1)
    expect(findings[0].severity).toBe('crash')
    expect(findings[0].message).toContain(player.id)
  })

  it('flaggar INTE en fri agent (clubId=free_agent) med gammalt contractUntilSeason — det är förväntat tillstånd, inte ett brott', () => {
    const game = makeBaseGame({ seed: 1 })
    const player = game.players.find(p => p.clubId === game.managedClubId)!
    const freeAgent = {
      ...game,
      players: game.players.map(p =>
        p.id === player.id ? { ...p, clubId: 'free_agent', contractUntilSeason: game.currentSeason - 3 } : p
      ),
    }
    const findings = checkInvariants(freeAgent).filter(f => f.name === 'staleContracts')
    expect(findings).toEqual([])
  })
})
