/**
 * B1 §3 (close-out) — en byggd kapacitetsnod höjer arenaCapacity (taket), engång vid completion.
 */
import { describe, it, expect } from 'vitest'
import { createNewGame } from '../application/useCases/createNewGame'
import { advanceToNextEvent } from '../application/useCases/advanceToNextEvent'

describe('B1 facility capacityBonus → arenaCapacity', () => {
  it('värmestuga (capacityBonus 100) höjer arenaCapacity med exakt bonusen, en gång', () => {
    const g = createNewGame({ managerName: 'T', clubId: 'club_forsbacka', season: 2025, seed: 5 })
    const club0 = g.clubs.find(c => c.id === 'club_forsbacka')!
    const base = club0.arenaCapacity ?? Math.round(club0.reputation * 7 + 150)

    // Injicera ett bygge som blir klart på matchday 1 (advanceFacilityState slutför vid eta).
    g.facilityState = { builtNodeIds: [], activeProject: { nodeId: 'varmestuga', startedMatchday: 0, etaMatchday: 1 } }

    const r = advanceToNextEvent(g)
    const club1 = r.game.clubs.find(c => c.id === 'club_forsbacka')!

    expect(r.game.facilityState?.builtNodeIds).toContain('varmestuga')   // bygget slutfört
    expect(r.game.facilityState?.activeProject).toBeUndefined()
    expect(club1.arenaCapacity).toBe(base + 100)                         // exakt bonusen, en gång (M62: sänkt från 1000)
  })

  it('en nod utan capacityBonus (kiosk) rör inte arenaCapacity', () => {
    const g = createNewGame({ managerName: 'T', clubId: 'club_forsbacka', season: 2025, seed: 5 })
    const club0 = g.clubs.find(c => c.id === 'club_forsbacka')!
    const before = club0.arenaCapacity
    g.facilityState = { builtNodeIds: [], activeProject: { nodeId: 'kiosk', startedMatchday: 0, etaMatchday: 1 } }
    const r = advanceToNextEvent(g)
    const club1 = r.game.clubs.find(c => c.id === 'club_forsbacka')!
    expect(r.game.facilityState?.builtNodeIds).toContain('kiosk')
    expect(club1.arenaCapacity).toBe(before)   // oförändrad (kiosk har ingen capacityBonus)
  })
})
