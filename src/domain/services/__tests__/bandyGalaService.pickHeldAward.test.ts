import { describe, it, expect } from 'vitest'
import { pickHeldAward } from '../bandyGalaService'
import type { GalaNomination } from '../bandyGalaService'

// HANDOFF-GALAN-GESTALTNING_2026-09-10 §2/§6 — vilket pris bär den hållna scenen.

function nom(award: GalaNomination['award'], playerName: string): GalaNomination {
  return { award, playerId: `p_${playerName}`, playerName, clubName: 'Testklubben', stat: 'stat' }
}

describe('pickHeldAward', () => {
  it('ingen egen vinnare: håller topp-liga-priset (Årets spelare), inte own', () => {
    const nominations = [nom('arets_spelare', 'Rival A'), nom('arets_malvakt', 'Rival B')]
    const result = pickHeldAward(nominations, [])
    expect(result?.nomination.award).toBe('arets_spelare')
    expect(result?.isOwn).toBe(false)
  })

  it('ingen nominering alls: null', () => {
    expect(pickHeldAward([], [])).toBeNull()
  })

  it('Årets spelare saknas bland nomineringarna: faller tillbaka på första nomineringen', () => {
    const nominations = [nom('arets_forward', 'Rival C'), nom('arets_malvakt', 'Rival D')]
    const result = pickHeldAward(nominations, [])
    expect(result?.nomination.award).toBe('arets_forward')
    expect(result?.isOwn).toBe(false)
  })

  it('egen vinnare: nykomling väger tyngre än spelare/forward', () => {
    const spelare = nom('arets_spelare', 'Egen A')
    const nykomling = nom('arets_nykomling', 'Egen B')
    const nominations = [spelare, nykomling]
    const result = pickHeldAward(nominations, [spelare, nykomling])
    expect(result?.nomination.award).toBe('arets_nykomling')
    expect(result?.isOwn).toBe(true)
  })

  it('egen vinnare: veteran väger tyngre än målvakt när nykomling saknas', () => {
    const veteran = nom('arets_veteran', 'Egen C')
    const malvakt = nom('arets_malvakt', 'Egen D')
    const nominations = [malvakt, veteran]
    const result = pickHeldAward(nominations, [malvakt, veteran])
    expect(result?.nomination.award).toBe('arets_veteran')
    expect(result?.isOwn).toBe(true)
  })

  it('flera egna vinnare av samma prioritetsnivå: FIFO-stabil (första i managedWinners-ordning)', () => {
    const a = nom('arets_malvakt', 'Egen E')
    const b = nom('arets_forward', 'Egen F')
    const result = pickHeldAward([a, b], [a, b])
    // Ingen av dem är nykomling/veteran — spelare/forward/målvakt delar
    // resten av prioritetslistan i fast ordning (spelare, forward, målvakt),
    // så 'arets_forward' (b) vinner över 'arets_malvakt' (a).
    expect(result?.nomination.award).toBe('arets_forward')
  })
})
