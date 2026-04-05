import type { MatchStep } from '../../../domain/services/matchUtils'

export interface LiveMatchStats {
  possession: [number, number]
  shots: [number, number]
  corners: [number, number]
  suspensions: [number, number]
}

export function calculateLiveStats(
  currentStep: MatchStep | null,
): LiveMatchStats {
  if (!currentStep) {
    return { possession: [50, 50], shots: [0, 0], corners: [0, 0], suspensions: [0, 0] }
  }
  const hp = currentStep.activeSuspensions
    ? 50 // possession not tracked per-step, use 50/50
    : 50
  return {
    possession: [hp, 100 - hp],
    shots: [currentStep.shotsHome, currentStep.shotsAway],
    corners: [currentStep.cornersHome, currentStep.cornersAway],
    suspensions: [currentStep.activeSuspensions.homeCount, currentStep.activeSuspensions.awayCount],
  }
}

export function StatsFooter({ stats }: { stats: LiveMatchStats }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--border)',
      padding: '6px 16px',
      flexShrink: 0,
      display: 'grid',
      gridTemplateColumns: '40px 1fr 40px',
      gap: '2px 0',
      fontSize: 11,
      fontFamily: 'var(--font-body)',
    }}>
      <span style={{ textAlign: 'right', fontWeight: 600 }}>{stats.shots[0]}</span>
      <span style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 9 }}>Skott</span>
      <span style={{ textAlign: 'left', fontWeight: 600 }}>{stats.shots[1]}</span>

      <span style={{ textAlign: 'right', fontWeight: 600 }}>{stats.corners[0]}</span>
      <span style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 9 }}>Hörnor</span>
      <span style={{ textAlign: 'left', fontWeight: 600 }}>{stats.corners[1]}</span>

      {(stats.suspensions[0] + stats.suspensions[1]) > 0 && (<>
        <span style={{ textAlign: 'right', fontWeight: 600, color: stats.suspensions[0] > 0 ? 'var(--danger)' : undefined }}>{stats.suspensions[0]}</span>
        <span style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 9 }}>Utvisningar</span>
        <span style={{ textAlign: 'left', fontWeight: 600, color: stats.suspensions[1] > 0 ? 'var(--danger)' : undefined }}>{stats.suspensions[1]}</span>
      </>)}
    </div>
  )
}
