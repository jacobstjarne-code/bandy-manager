import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  exportSaveRecoveryReportAsJson,
  getSaveRecoveryReport,
  recordRestoreResult,
  recordSnapshotResult,
} from '../saveRecoveryMetrics'

function createLocalStorageMock() {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (index: number) => Object.keys(store)[index] ?? null,
  }
}

vi.stubGlobal('localStorage', createLocalStorageMock())

describe('saveRecoveryMetrics — U9 lokal recovery-mätning', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('räknar snapshotutfall och normaliserar fria reasons utan att spara dem', () => {
    recordSnapshotResult('pre_migration', true)
    recordSnapshotResult('pre_newgame', true)
    recordSnapshotResult('save_med_personnamn', false)

    expect(getSaveRecoveryReport()).toMatchObject({
      snapshots: {
        attempts: 3,
        succeeded: 2,
        failed: 1,
        byReason: { pre_migration: 1, pre_newgame: 1, other: 1 },
      },
      snapshotSuccessRate: 2 / 3,
    })
    expect(JSON.stringify(getSaveRecoveryReport())).not.toContain('personnamn')
  })

  it('räknar lyckad, saknad och tekniskt misslyckad återläsning separat', () => {
    recordRestoreResult('succeeded')
    recordRestoreResult('not_found')
    recordRestoreResult('failed')

    expect(getSaveRecoveryReport()).toMatchObject({
      restores: { attempts: 3, succeeded: 1, notFound: 1, failed: 1 },
      restoreSuccessRate: 1 / 3,
    })
  })

  it('har null i stället för en påhittad procentsats före första försöket', () => {
    const report = getSaveRecoveryReport()
    expect(report.snapshotSuccessRate).toBeNull()
    expect(report.restoreSuccessRate).toBeNull()
  })

  it('exporterar den aggregerade rapporten utan save-data', () => {
    recordSnapshotResult('pre_migration', true)
    const createObjectURL = vi.fn().mockReturnValue('blob:recovery')
    const revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const originalCreateObjectURL = URL.createObjectURL
    const originalRevokeObjectURL = URL.revokeObjectURL
    URL.createObjectURL = createObjectURL
    URL.revokeObjectURL = revokeObjectURL

    exportSaveRecoveryReportAsJson()

    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(click).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:recovery')
    click.mockRestore()
    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
  })
})
