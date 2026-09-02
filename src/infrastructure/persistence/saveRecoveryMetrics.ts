export type SnapshotReason = 'pre_newgame' | 'pre_migration' | 'other'
export type RestoreOutcome = 'succeeded' | 'not_found' | 'failed'

interface PersistedSaveRecoveryMetrics {
  version: 1
  startedAt: string
  lastRecordedAt: string
  snapshots: {
    attempts: number
    succeeded: number
    failed: number
    byReason: Record<SnapshotReason, number>
  }
  restores: {
    attempts: number
    succeeded: number
    notFound: number
    failed: number
  }
}

export interface SaveRecoveryReport extends PersistedSaveRecoveryMetrics {
  snapshotSuccessRate: number | null
  restoreSuccessRate: number | null
}

const METRICS_KEY = 'bandy_save_recovery_metrics_v1'

function emptyMetrics(now = new Date().toISOString()): PersistedSaveRecoveryMetrics {
  return {
    version: 1,
    startedAt: now,
    lastRecordedAt: now,
    snapshots: {
      attempts: 0,
      succeeded: 0,
      failed: 0,
      byReason: { pre_newgame: 0, pre_migration: 0, other: 0 },
    },
    restores: { attempts: 0, succeeded: 0, notFound: 0, failed: 0 },
  }
}

function nonNegativeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0
}

function readMetrics(): PersistedSaveRecoveryMetrics {
  const fallback = emptyMetrics()
  if (typeof localStorage === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(METRICS_KEY)
    if (raw === null) return fallback
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const snapshots = typeof parsed.snapshots === 'object' && parsed.snapshots !== null
      ? parsed.snapshots as Record<string, unknown>
      : {}
    const restores = typeof parsed.restores === 'object' && parsed.restores !== null
      ? parsed.restores as Record<string, unknown>
      : {}
    const byReason = typeof snapshots.byReason === 'object' && snapshots.byReason !== null
      ? snapshots.byReason as Record<string, unknown>
      : {}
    return {
      version: 1,
      startedAt: typeof parsed.startedAt === 'string' ? parsed.startedAt : fallback.startedAt,
      lastRecordedAt: typeof parsed.lastRecordedAt === 'string' ? parsed.lastRecordedAt : fallback.lastRecordedAt,
      snapshots: {
        attempts: nonNegativeNumber(snapshots.attempts),
        succeeded: nonNegativeNumber(snapshots.succeeded),
        failed: nonNegativeNumber(snapshots.failed),
        byReason: {
          pre_newgame: nonNegativeNumber(byReason.pre_newgame),
          pre_migration: nonNegativeNumber(byReason.pre_migration),
          other: nonNegativeNumber(byReason.other),
        },
      },
      restores: {
        attempts: nonNegativeNumber(restores.attempts),
        succeeded: nonNegativeNumber(restores.succeeded),
        notFound: nonNegativeNumber(restores.notFound),
        failed: nonNegativeNumber(restores.failed),
      },
    }
  } catch {
    // Mätningen får aldrig störa det recoveryflöde den observerar.
    return fallback
  }
}

function writeMetrics(metrics: PersistedSaveRecoveryMetrics): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(METRICS_KEY, JSON.stringify(metrics))
  } catch {
    // Ett lokalt mätfel får aldrig blockera snapshot eller återläsning.
  }
}

function normalizedReason(reason: string): SnapshotReason {
  if (reason === 'pre_newgame' || reason === 'pre_migration') return reason
  return 'other'
}

/** Registreras efter snapshotförsöket, på samma verkliga kodväg. */
export function recordSnapshotResult(reason: string, succeeded: boolean): void {
  const metrics = readMetrics()
  const key = normalizedReason(reason)
  metrics.lastRecordedAt = new Date().toISOString()
  metrics.snapshots.attempts++
  metrics.snapshots.byReason[key]++
  if (succeeded) metrics.snapshots.succeeded++
  else metrics.snapshots.failed++
  writeMetrics(metrics)
}

/** Registreras efter ett verkligt loadSaveSnapshot-försök. */
export function recordRestoreResult(outcome: RestoreOutcome): void {
  const metrics = readMetrics()
  metrics.lastRecordedAt = new Date().toISOString()
  metrics.restores.attempts++
  if (outcome === 'succeeded') metrics.restores.succeeded++
  else if (outcome === 'not_found') metrics.restores.notFound++
  else metrics.restores.failed++
  writeMetrics(metrics)
}

export function getSaveRecoveryReport(): SaveRecoveryReport {
  const metrics = readMetrics()
  return {
    ...metrics,
    snapshotSuccessRate: metrics.snapshots.attempts > 0
      ? metrics.snapshots.succeeded / metrics.snapshots.attempts
      : null,
    restoreSuccessRate: metrics.restores.attempts > 0
      ? metrics.restores.succeeded / metrics.restores.attempts
      : null,
  }
}

/** Personuppgiftsfri lokal U9-rapport; innehåller inga save-id:n eller namn. */
export function exportSaveRecoveryReportAsJson(): void {
  const payload = JSON.stringify(getSaveRecoveryReport(), null, 2)
  const blob = new Blob([payload], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'bandy-save-recovery-report.json'
  link.click()
  URL.revokeObjectURL(url)
}
