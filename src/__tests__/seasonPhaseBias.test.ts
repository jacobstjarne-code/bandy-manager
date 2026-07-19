import { describe, it, expect } from 'vitest'
import { applyPhaseBias, applyPhaseCardBias } from '../domain/services/portal/seasonPhaseBias'

// B1 (2026-07-19): PortalPhase (sju funktionärsfaser + playoff/spectator)
// ersatte SeasonPhase (early/mid/endgame) här. Testerna uppdaterade till de
// nya fasnamnen — samma bias-nivåer som tidigare täcktes av 'endgame'/'mid'/
// 'early' finns nu uppdelade på fler, distinkta faser.
describe('applyPhaseBias', () => {
  it('playoff secondary dämpas till 40% — 60 × 0.4 = 24.0', () => {
    expect(applyPhaseBias(60, 'secondary', 'playoff')).toBeCloseTo(24.0)
  })

  it('slutspurt secondary dämpas till 40% — 60 × 0.4 = 24.0', () => {
    expect(applyPhaseBias(60, 'secondary', 'slutspurt')).toBeCloseTo(24.0)
  })

  it('våroffensiv secondary dämpas till 60% — 60 × 0.6 = 36.0', () => {
    expect(applyPhaseBias(60, 'secondary', 'våroffensiv')).toBeCloseTo(36.0)
  })

  it('vinterkris höjer primary och dämpar secondary — krisen smalnar fokus', () => {
    expect(applyPhaseBias(100, 'primary', 'vinterkris')).toBeCloseTo(130)
    expect(applyPhaseBias(60, 'secondary', 'vinterkris')).toBeCloseTo(42)
  })

  it('vinter höjer secondary lätt — platsens röst väger mer i djupvintern', () => {
    expect(applyPhaseBias(60, 'secondary', 'vinter')).toBeCloseTo(69)
  })

  it('primary orörd vid playoff — 100 × 1.0 = 100', () => {
    expect(applyPhaseBias(100, 'primary', 'playoff')).toBe(100)
  })

  it('minimal orörd vid playoff — 30 × 1.0 = 30', () => {
    expect(applyPhaseBias(30, 'minimal', 'playoff')).toBe(30)
  })

  it('annandagen-fas ger bias × 1.0 för secondary', () => {
    expect(applyPhaseBias(87, 'secondary', 'annandagen')).toBeCloseTo(87)
  })

  it('höststart-fas ger bias × 1.0 för alla tiers', () => {
    expect(applyPhaseBias(50, 'primary', 'höststart')).toBe(50)
    expect(applyPhaseBias(50, 'secondary', 'höststart')).toBe(50)
    expect(applyPhaseBias(50, 'minimal', 'höststart')).toBe(50)
  })
})

describe('applyPhaseCardBias', () => {
  it('lyfter coffee_room_card/journalist_card/tabell/board_objectives i vinterkris', () => {
    expect(applyPhaseCardBias(100, 'coffee_room_card', 'vinterkris')).toBeCloseTo(130)
    expect(applyPhaseCardBias(100, 'journalist_card', 'vinterkris')).toBeCloseTo(130)
    expect(applyPhaseCardBias(100, 'board_objectives', 'vinterkris')).toBeCloseTo(140)
  })

  it('dämpar rutinkort (ekonomi, watch_others, season_signature_card) i vinterkris', () => {
    expect(applyPhaseCardBias(100, 'ekonomi', 'vinterkris')).toBeCloseTo(60)
    expect(applyPhaseCardBias(100, 'watch_others', 'vinterkris')).toBeCloseTo(50)
  })

  it('rör inte kort utan en explicit vinterkris-post', () => {
    expect(applyPhaseCardBias(100, 'next_match', 'vinterkris')).toBe(100)
  })

  it('rör inget alls utanför vinterkris (ingen tabell för andra faser ännu)', () => {
    expect(applyPhaseCardBias(100, 'coffee_room_card', 'vinter')).toBe(100)
    expect(applyPhaseCardBias(100, 'coffee_room_card', 'slutspurt')).toBe(100)
  })
})
