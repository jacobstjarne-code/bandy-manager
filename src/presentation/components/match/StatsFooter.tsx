import type { MatchStep } from '../../../domain/services/matchUtils'

interface LiveMatchStats {
  possession: [number, number]
  shots: [number, number]
  corners: [number, number]
  suspensions: [number, number]
}

export function calculateLiveStats(step: MatchStep): LiveMatchStats {
  // Derive possession from shots+corners ratio (cumulative stats on each step)
  const homeAct = step.shotsHome + step.cornersHome
  const awayAct = step.shotsAway + step.cornersAway
  const total = homeAct + awayAct
  const hp = total > 0 ? Math.round(homeAct / total * 100) : 50
  return {
    possession: [hp, 100 - hp],
    shots: [step.shotsHome, step.shotsAway],
    corners: [step.cornersHome, step.cornersAway],
    suspensions: [step.activeSuspensions.homeCount, step.activeSuspensions.awayCount],
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
      <span style={{ textAlign: 'right', fontWeight: 600 }}>{stats.possession[0]}%</span>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>Bollinnehav</span>
        <div style={{ width: '70%', height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${stats.possession[0]}%`, height: '100%', background: 'var(--accent)', borderRadius: 2 }} />
        </div>
      </div>
      <span style={{ textAlign: 'left', fontWeight: 600 }}>{stats.possession[1]}%</span>

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
