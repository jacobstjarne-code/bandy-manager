/**
 * B1 §5 — migration av gamla facilityProjects → ny facilityState (med orphan-fix).
 */
import { describe, it, expect } from 'vitest'
import { migrateSaveGame } from '../infrastructure/persistence/saveGameMigration'

const base = { id: 't', version: '1.0', managedClubId: 'club_a', fixtures: [], pendingEvents: [] }

describe('migrateSaveGame — B1 facilityState', () => {
  it('mappar färdiga legacy-projekt → builtNodeIds (omkladningsrum släpps per §8)', () => {
    const m = migrateSaveGame({ ...base, facilityProjects: [
      { id: 'stralkastare', status: 'completed' },
      { id: 'varmestuga_legacy', status: 'completed' },
      { id: 'omkladningsrum', status: 'completed' },
    ] })
    expect(m.facilityState?.builtNodeIds).toEqual(expect.arrayContaining(['stralkastare', 'varmestuga']))
    expect(m.facilityState?.builtNodeIds).not.toContain('omkladningsrum')
    expect(m.facilityState?.builtNodeIds).toHaveLength(2)
    expect(m.facilityState?.activeProject).toBeUndefined()
  })

  it('orphan-fix: pågående legacy-bygge → activeProject med kvarvarande omgångar', () => {
    const m = migrateSaveGame({ ...base, facilityProjects: [
      { id: 'laktare_legacy', status: 'completed' },
      { id: 'gym', status: 'in_progress', startedMatchday: 4 },
    ] })
    expect(m.facilityState?.builtNodeIds).toEqual(['laktare_ostra'])
    expect(m.facilityState?.activeProject?.nodeId).toBe('gym')
    expect(m.facilityState?.activeProject?.startedMatchday).toBe(4)
    expect(m.facilityState?.activeProject?.etaMatchday).toBeGreaterThan(4)  // started + buildRounds, bygget tappas inte
  })

  it('behåller befintlig facilityState (migrerar inte över en redan satt)', () => {
    const m = migrateSaveGame({ ...base, facilityState: { builtNodeIds: ['kiosk'] }, facilityProjects: [{ id: 'gym', status: 'completed' }] })
    expect(m.facilityState?.builtNodeIds).toEqual(['kiosk'])
  })

  it('tomt/avsaknat facilityProjects → tom facilityState', () => {
    const m = migrateSaveGame({ ...base })
    expect(m.facilityState?.builtNodeIds).toEqual([])
  })
})
