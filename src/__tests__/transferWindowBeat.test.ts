/**
 * Drag 2 (2026-07-02) — transfer_window_open-beatets fönster-förankring.
 * Låser: explicit copy + "Stänger omg 15"-kicker vid första mötet (ingen
 * tidigare säsongs-nyckel i shownBeats), terse copy + ingen kicker därefter.
 */
import { describe, it, expect } from 'vitest'
import { createNewGame } from '../application/useCases/createNewGame'
import { PORTAL_BEATS } from '../domain/data/portalBeats'

const base = createNewGame({ managerName: 'T', clubId: 'club_forsbacka', season: 2025, seed: 5 })
const beat = PORTAL_BEATS.find(b => b.id === 'transfer_window_open')!

describe('transfer_window_open — Drag 2 fönster-förankring', () => {
  it('första gången (ingen tidigare säsongs-nyckel i shownBeats): explicit copy + kicker', () => {
    const game = { ...base, currentSeason: 1, shownBeats: [] }
    const text = typeof beat.text === 'function' ? beat.text(game) : beat.text
    const kicker = typeof beat.kicker === 'function' ? beat.kicker(game) : beat.kicker
    expect(text).toBe('Transferfönstret är öppet — spelare kan köpas och säljas fram till omg 15.')
    expect(kicker).toBe('Stänger omg 15')
  })

  it('återkommande säsong (en tidigare säsongs-nyckel finns): terse copy, ingen kicker', () => {
    const game = { ...base, currentSeason: 2, shownBeats: ['transfer_window_open_1'] }
    const text = typeof beat.text === 'function' ? beat.text(game) : beat.text
    const kicker = typeof beat.kicker === 'function' ? beat.kicker(game) : beat.kicker
    expect(text).toBe('Transferfönstret öppet. Telefonen har redan börjat ringa hos någon — bara inte hos er än.')
    expect(kicker).toBeUndefined()
  })
})
