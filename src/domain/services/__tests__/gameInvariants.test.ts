import { describe, it, expect } from 'vitest'
import { checkInvariants, checkFinanceLogGap } from '../gameInvariants'
import { appendFinanceLog, FINANCE_LOG_MAX } from '../economyService'
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
    const before = { ...makeBaseGame({ seed: 1 }), currentMatchday: 4 }
    const club = before.clubs.find(c => c.id === before.managedClubId)!
    const after = {
      ...before,
      currentMatchday: 5,
      clubs: before.clubs.map(c => c.id === club.id ? { ...c, finances: c.finances - 1000 } : c),
      financeLog: [...(before.financeLog ?? []), { round: 5, amount: -1000, reason: 'event' as const, label: 'test' }],
    }
    expect(checkFinanceLogGap(before, after)).toEqual([])
  })

  it('flaggar en kassaändring utan någon financeLog-post samma omgång', () => {
    const before = { ...makeBaseGame({ seed: 1 }), currentMatchday: 4 }
    const club = before.clubs.find(c => c.id === before.managedClubId)!
    const after = {
      ...before,
      currentMatchday: 5,
      clubs: before.clubs.map(c => c.id === club.id ? { ...c, finances: c.finances - 5000 } : c),
    }
    const findings = checkFinanceLogGap(before, after)
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ name: 'financeLogGap', severity: 'warn' })
    expect(findings[0].message).toContain('-5000')
  })

  it('flaggar en delvis förklarad ändring (loggat belopp matchar inte faktiskt delta)', () => {
    const before = { ...makeBaseGame({ seed: 1 }), currentMatchday: 4 }
    const club = before.clubs.find(c => c.id === before.managedClubId)!
    const after = {
      ...before,
      currentMatchday: 5,
      clubs: before.clubs.map(c => c.id === club.id ? { ...c, finances: c.finances - 5000 } : c),
      financeLog: [...(before.financeLog ?? []), { round: 5, amount: -3000, reason: 'event' as const, label: 'delvis' }],
    }
    const findings = checkFinanceLogGap(before, after)
    expect(findings).toHaveLength(1)
    expect(findings[0].message).toContain('-2000')
  })

  it('räknar bara financeLog-poster i omgångsintervallet (before, after] — inte poster från FÖRE detta anrops fönster', () => {
    const before = { ...makeBaseGame({ seed: 1 }), currentMatchday: 4 }
    const club = before.clubs.find(c => c.id === before.managedClubId)!
    const after = {
      ...before,
      currentMatchday: 5,
      clubs: before.clubs.map(c => c.id === club.id ? { ...c, finances: c.finances - 1000 } : c),
      // Runda 4 hann redan innan detta anrops fönster (before.currentMatchday
      // === 4) — ska INTE räknas med, den hör till ett tidigare anrop.
      financeLog: [...(before.financeLog ?? []), { round: 4, amount: -1000, reason: 'event' as const, label: 'fel omgång' }],
    }
    const findings = checkFinanceLogGap(before, after)
    expect(findings).toHaveLength(1)
  })

  // begriplighet-b-flerommgangshopp-financelog (2026-09-15): rättelsen som
  // orsakade denna omskrivning. roundProcessor.ts:s "Auto-advance playoff
  // rounds when managed club is eliminated" kan låta ETT yttre
  // advanceToNextEvent-anrop rekursera över FLERA matchdays — varje inre
  // hopp loggar korrekt under sitt EGET round-nummer. Ett repro (seed 1,
  // matchday 29→37 i ett enda anrop) visade en SKENBAR lucka på −258 625 kr
  // med den gamla single-round-checken; en range-check över hela fönstret
  // gav gap=0. Inget spelfel fanns — bara i den gamla checkens antagande att
  // ett anrop alltid täcker EN omgång.
  it('ett multi-omgångshopp (flera financeLog-poster i fönstret) ger INGEN falsk lucka så länge summan stämmer', () => {
    const before = { ...makeBaseGame({ seed: 1 }), currentMatchday: 29 }
    const club = before.clubs.find(c => c.id === before.managedClubId)!
    const perRoundNet = -1000
    const rounds = [30, 31, 32, 33, 34, 35, 37] // 36 saknas i sekvensen (bye-vecka), precis som det verifierade repro:t
    const after = {
      ...before,
      currentMatchday: 37,
      clubs: before.clubs.map(c => c.id === club.id ? { ...c, finances: c.finances + perRoundNet * rounds.length } : c),
      financeLog: [
        ...(before.financeLog ?? []),
        ...rounds.map(round => ({ round, amount: perRoundNet, reason: 'wages' as const, label: `Löner omg ${round}` })),
      ],
    }
    expect(checkFinanceLogGap(before, after)).toEqual([])
  })

  it('ett multi-omgångshopp MED en genuin lucka i en av mellanomgångarna flaggas fortfarande', () => {
    const before = { ...makeBaseGame({ seed: 1 }), currentMatchday: 29 }
    const club = before.clubs.find(c => c.id === before.managedClubId)!
    const after = {
      ...before,
      currentMatchday: 37,
      clubs: before.clubs.map(c => c.id === club.id ? { ...c, finances: c.finances - 9000 } : c),
      financeLog: [
        ...(before.financeLog ?? []),
        // Bara 8 000 av 9 000 kr loggade över hela fönstret — en genuin lucka kvarstår.
        { round: 31, amount: -3000, reason: 'wages' as const, label: 'Löner' },
        { round: 34, amount: -5000, reason: 'wages' as const, label: 'Löner' },
      ],
    }
    const findings = checkFinanceLogGap(before, after)
    expect(findings).toHaveLength(1)
    expect(findings[0].message).toContain('-1000')
    expect(findings[0].message).toContain('30-37')
  })

  it('ger ingen falsk lucka när samma multi-omgångshopp fyller capen och början av observationsfönstret har pensionerats', () => {
    const base = { ...makeBaseGame({ seed: 1 }), currentMatchday: 26 }
    let beforeLog = [] as NonNullable<typeof base.financeLog>
    for (let i = 0; i < FINANCE_LOG_MAX; i++) {
      beforeLog = appendFinanceLog(beforeLog, { round: 18, amount: 1, reason: 'event', label: `gammal-${i}` })
    }
    const before = { ...base, financeLog: beforeLog }
    const club = before.clubs.find(c => c.id === before.managedClubId)!
    const amounts = Array.from({ length: FINANCE_LOG_MAX + 8 }, (_, index) => ({
      round: 27 + Math.floor(index / 6),
      amount: index === 0 ? 7750 : -100,
      reason: 'event' as const,
      label: `ny-${index}`,
    }))
    let afterLog = beforeLog
    for (const entry of amounts) afterLog = appendFinanceLog(afterLog, entry)
    const actualDelta = amounts.reduce((sum, entry) => sum + entry.amount, 0)
    const after = {
      ...before,
      currentMatchday: 37,
      clubs: before.clubs.map(c => c.id === club.id ? { ...c, finances: c.finances + actualDelta } : c),
      financeLog: afterLog,
    }

    expect(after.financeLog).toHaveLength(FINANCE_LOG_MAX)
    expect(after.financeLog).not.toContain(beforeLog[beforeLog.length - 1])
    expect(checkFinanceLogGap(before, after)).toEqual([])
  })
})
