import { describe, expect, it } from 'vitest'
import { getTraitCommentary } from '../matchCommentary'
import type { Player } from '../../entities/Player'

/**
 * Opus-dom 2026-09-07 (sluttest-missing-check-grind, item 1): "ledare"-poolen
 * påstår ordagrant captaincy ("Kaptenen", "bara bindel") men gated tidigare
 * på player.trait === 'ledare' — fel fält, samma proxy-buggklass som
 * sponsor_positive/condition_0. Bindelbäraren avgörs av captainPlayerId.
 */
function makePlayer(overrides: Partial<Player> = {}): Player {
  return { id: 'p1', firstName: 'Test', lastName: 'Spelaren', trait: undefined, ...overrides } as unknown as Player
}

describe('getTraitCommentary — ledare-poolen kräver faktisk captaincy (captainPlayerId), inte trait', () => {
  it('en spelare med trait=ledare som INTE är kapten får INGEN ledare-text', () => {
    const players = [makePlayer({ id: 'p1', trait: 'ledare' })]
    const text = getTraitCommentary('p1', 'goal', players, undefined, 'p2')
    expect(text).toBeNull()
  })

  it('den faktiska kaptenen får ledare-text vid mål, oavsett trait', () => {
    const players = [makePlayer({ id: 'p1', trait: 'hungrig' })]
    const text = getTraitCommentary('p1', 'goal', players, undefined, 'p1')
    expect(text).toMatch(/Kaptenen|bindel|Ledaren/)
  })

  it('den faktiska kaptenen får ledare-text vid utvisning, oavsett trait', () => {
    const players = [makePlayer({ id: 'p1', trait: undefined })]
    const text = getTraitCommentary('p1', 'suspension', players, 5, 'p1')
    expect(text).toMatch(/Kaptenen|Ledarskapet|disciplinen/)
  })

  it('ingen captainPlayerId angiven → ingen ledare-text, även för trait=ledare', () => {
    const players = [makePlayer({ id: 'p1', trait: 'ledare' })]
    expect(getTraitCommentary('p1', 'goal', players)).toBeNull()
  })

  it('andra traits (icke-ledare) opåverkade av captaincy-fixet', () => {
    const players = [makePlayer({ id: 'p1', trait: 'hungrig' })]
    const text = getTraitCommentary('p1', 'goal', players, undefined, 'p2')
    expect(text).not.toBeNull()
    expect(text).not.toMatch(/Kaptenen|bindel/)
  })
})
