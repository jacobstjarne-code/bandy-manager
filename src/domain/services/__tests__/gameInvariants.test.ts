import { describe, it, expect } from 'vitest'
import { checkInvariants, checkFinanceLogGap } from '../gameInvariants'
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

// begriplighet-klass-b (BEGRIPLIGHETSREVISION_2026-09-12, Opus dom 2026-09-15):
// checkFinanceLogGap tar TVÅ tillstånd (before/after), avsiktligt utanför
// checkInvariants()'s single-state-kontrakt — se gameInvariants.ts:s
// kommentar vid funktionen för varför.
describe('gameInvariants — checkFinanceLogGap', () => {
  it('ingen finding när kassaändringen matchar en financeLog-post samma omgång', () => {
    const before = makeBaseGame({ seed: 1 })
    const club = before.clubs.find(c => c.id === before.managedClubId)!
    const after = {
      ...before,
      clubs: before.clubs.map(c => c.id === club.id ? { ...c, finances: c.finances - 1000 } : c),
      financeLog: [...(before.financeLog ?? []), { round: 5, amount: -1000, reason: 'event' as const, label: 'test' }],
    }
    expect(checkFinanceLogGap(before, after, 5)).toEqual([])
  })

  it('flaggar en kassaändring utan någon financeLog-post samma omgång', () => {
    const before = makeBaseGame({ seed: 1 })
    const club = before.clubs.find(c => c.id === before.managedClubId)!
    const after = {
      ...before,
      clubs: before.clubs.map(c => c.id === club.id ? { ...c, finances: c.finances - 5000 } : c),
    }
    const findings = checkFinanceLogGap(before, after, 5)
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ name: 'financeLogGap', severity: 'warn' })
    expect(findings[0].message).toContain('-5000')
  })

  it('flaggar en delvis förklarad ändring (loggat belopp matchar inte faktiskt delta)', () => {
    const before = makeBaseGame({ seed: 1 })
    const club = before.clubs.find(c => c.id === before.managedClubId)!
    const after = {
      ...before,
      clubs: before.clubs.map(c => c.id === club.id ? { ...c, finances: c.finances - 5000 } : c),
      financeLog: [...(before.financeLog ?? []), { round: 5, amount: -3000, reason: 'event' as const, label: 'delvis' }],
    }
    const findings = checkFinanceLogGap(before, after, 5)
    expect(findings).toHaveLength(1)
    expect(findings[0].message).toContain('-2000')
  })

  it('räknar bara financeLog-poster för RÄTT omgång, inte tidigare omgångars poster', () => {
    const before = makeBaseGame({ seed: 1 })
    const club = before.clubs.find(c => c.id === before.managedClubId)!
    const after = {
      ...before,
      clubs: before.clubs.map(c => c.id === club.id ? { ...c, finances: c.finances - 1000 } : c),
      financeLog: [...(before.financeLog ?? []), { round: 4, amount: -1000, reason: 'event' as const, label: 'fel omgång' }],
    }
    const findings = checkFinanceLogGap(before, after, 5)
    expect(findings).toHaveLength(1)
  })
})
