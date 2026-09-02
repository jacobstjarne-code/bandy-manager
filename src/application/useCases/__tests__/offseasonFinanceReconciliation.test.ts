/**
 * A-M5 (SEXSÄSONGSAUDITEN 2026-08-26): "Ekonomisk räddning kan ske utan
 * begriplig berättelse" — Lesjöfors gick från ca -322 tkr till -35 tkr över
 * sommaren utan att spelaren kunde härleda varför. Rotorsak: prispengar,
 * mecenatbidrag och kommunbidrag skrevs direkt på club.finances i
 * seasonEndProcessor.ts UTAN en enda appendFinanceLog-rad — så varken
 * game.financeLog eller Årsboken (HistoryScreen) hade något att visa.
 *
 * Detta test verifierar att handleSeasonEnd nu (a) skriver dessa poster till
 * financeLog med samma FinanceEntry-form som roundProcessor/transferService
 * redan använder, och (b) fryser samma poster på seasonSummary.offseasonFinanceEntries
 * så de överlever financeLog:ens 50-postars-cap.
 */
import { describe, it, expect } from 'vitest'
import { createNewGame } from '../createNewGame'
import { handleSeasonEnd } from '../seasonEndProcessor'

function makeGame() {
  return createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
}

describe('seasonEndProcessor — offseasonFinanceLog (A-M5)', () => {
  it('loggar ligaprispengar till financeLog vid säsongsslut', () => {
    const game = makeGame()
    const result = handleSeasonEnd(game, 1)

    const prizeEntry = (result.game.financeLog ?? []).find(e => e.reason === 'league_prize')
    expect(prizeEntry).toBeDefined()
    expect(prizeEntry?.amount).toBeGreaterThan(0)
    expect(prizeEntry?.label).toMatch(/Prispengar/)
  })

  it('fryser samma post på seasonSummary.offseasonFinanceEntries', () => {
    const game = makeGame()
    const result = handleSeasonEnd(game, 1)

    const summary = result.game.seasonSummaries?.at(-1)
    expect(summary?.offseasonFinanceEntries).toBeDefined()
    const prizeEntry = summary?.offseasonFinanceEntries?.find(e => e.reason === 'league_prize')
    expect(prizeEntry).toBeDefined()
    expect(prizeEntry?.amount).toBeGreaterThan(0)
  })

  it('loggar mecenatbidrag när en aktiv mecenat med bidrag finns', () => {
    const base = makeGame()
    const game = {
      ...base,
      patron: { isActive: true, name: 'Testmecenat', contribution: 75000 } as never,
    }
    const result = handleSeasonEnd(game, 1)

    const patronEntry = (result.game.financeLog ?? []).find(e => e.reason === 'patron')
    expect(patronEntry).toBeDefined()
    expect(patronEntry?.amount).toBe(75000)
    expect(patronEntry?.label).toMatch(/Testmecenat/)

    const summaryEntry = result.game.seasonSummaries?.at(-1)?.offseasonFinanceEntries?.find(e => e.reason === 'patron')
    expect(summaryEntry?.amount).toBe(75000)
  })

  it('betalar och loggar varje aktiv synlig mecenats säsongsbidrag separat från patronen', () => {
    const base = makeGame()
    const mecenat = {
      id: 'mec_1', name: 'Test Mecenat', gender: 'female', business: 'Test AB',
      businessType: 'brukspatron', wealth: 3, personality: 'filantropen',
      influence: 20, happiness: 60, goodwill: 50, contribution: 75_000,
      totalContributed: 0, demands: [], socialExpectations: [], isActive: true,
      arrivedSeason: 2025, silentShout: 0,
    } as const

    const withoutMecenat = handleSeasonEnd({ ...base, mecenater: [] }, 1).game
    const withMecenat = handleSeasonEnd({ ...base, mecenater: [mecenat] }, 1).game
    const managedWithout = withoutMecenat.clubs.find(c => c.id === base.managedClubId)!
    const managedWith = withMecenat.clubs.find(c => c.id === base.managedClubId)!

    expect(managedWith.finances - managedWithout.finances).toBe(75_000)
    expect(withMecenat.financeLog?.find(e => e.reason === 'mecenat')).toMatchObject({
      amount: 75_000,
      label: 'Mecenatbidrag (Test Mecenat)',
    })
    expect(withMecenat.seasonSummaries?.at(-1)?.offseasonFinanceEntries?.find(e => e.reason === 'mecenat')).toMatchObject({
      amount: 75_000,
    })
    expect(withMecenat.mecenater?.[0].totalContributed).toBe(75_000)
  })

  it('financeLog bevarar tidigare poster (append, inte overwrite)', () => {
    const base = makeGame()
    const game = {
      ...base,
      financeLog: [{ round: 22, amount: -5000, reason: 'wages' as const, label: 'Löner' }],
    }
    const result = handleSeasonEnd(game, 1)

    expect(result.game.financeLog?.some(e => e.reason === 'wages')).toBe(true)
    expect(result.game.financeLog?.some(e => e.reason === 'league_prize')).toBe(true)
  })

  it('ingen offseasonFinanceEntries-post för mecenat/kommunbidrag när ingen av dem är aktiv', () => {
    const base = makeGame()
    const game = { ...base, patron: undefined, localPolitician: undefined }
    const result = handleSeasonEnd(game, 1)

    const entries = result.game.seasonSummaries?.at(-1)?.offseasonFinanceEntries ?? []
    expect(entries.some(e => e.reason === 'patron')).toBe(false)
    expect(entries.some(e => e.reason === 'kommunbidrag_politiker')).toBe(false)
    // Prispengar ska ändå finnas — den är ovillkorad.
    expect(entries.some(e => e.reason === 'league_prize')).toBe(true)
  })
})
