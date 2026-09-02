/**
 * transfer_window_open-beatets fönster-förankring.
 * Låser: samma datumstatus och förstagångsbeskrivning som transfermotorn,
 * terse copy + ingen kicker därefter.
 */
import { describe, it, expect } from 'vitest'
import { createNewGame } from '../application/useCases/createNewGame'
import { PORTAL_BEATS } from '../domain/data/portalBeats'

const base = createNewGame({ managerName: 'T', clubId: 'club_forsbacka', season: 2025, seed: 5 })
const beat = PORTAL_BEATS.find(b => b.id === 'transfer_window_open')!

describe('transfer_window_open — Drag 2 fönster-förankring', () => {
  it('första gången i januarifönstret: återanvänder transfermotorns copy + etikett', () => {
    const game = { ...base, currentDate: '2026-01-03', currentSeason: 1, shownBeats: [] }
    const text = typeof beat.text === 'function' ? beat.text(game) : beat.text
    const kicker = typeof beat.kicker === 'function' ? beat.kicker(game) : beat.kicker
    expect(text).toBe('Januarifönstret är öppet. Sista chansen att förstärka inför slutspurten.')
    expect(kicker).toBe('Vintermarknad öppen')
  })

  it('återkommande säsong (en tidigare säsongs-nyckel finns): terse copy, ingen kicker', () => {
    const game = { ...base, currentDate: '2026-01-03', currentSeason: 2, shownBeats: ['transfer_window_open_1'] }
    const text = typeof beat.text === 'function' ? beat.text(game) : beat.text
    const kicker = typeof beat.kicker === 'function' ? beat.kicker(game) : beat.kicker
    expect(text).toBe('Transferfönstret öppet. Telefonen har redan börjat ringa hos någon — bara inte hos er än.')
    expect(kicker).toBeUndefined()
  })

  it('triggar under det faktiska januarifönstret oberoende av ligaräknaren', () => {
    expect(beat.trigger({ ...base, currentDate: '2026-01-01' })).toBe(true)
    expect(beat.trigger({ ...base, currentDate: '2026-01-31' })).toBe(true)
  })

  it('triggar inte efter ligaomgång 5–7 när marknaden är stängd i november/december', () => {
    const completedLeague = base.fixtures
      .filter(f => !f.isCup && !f.isKnockout)
      .slice(0, 7)
      .map(f => ({ ...f, status: 'completed' as const }))

    expect(beat.trigger({ ...base, currentDate: '2025-11-29', fixtures: completedLeague.slice(0, 5) })).toBe(false)
    expect(beat.trigger({ ...base, currentDate: '2025-12-17', fixtures: completedLeague })).toBe(false)
  })

  it('triggar inte i försäsongsfönstret eller efter januaristängningen', () => {
    expect(beat.trigger({ ...base, currentDate: '2025-10-15' })).toBe(false)
    expect(beat.trigger({ ...base, currentDate: '2026-02-01' })).toBe(false)
  })
})
