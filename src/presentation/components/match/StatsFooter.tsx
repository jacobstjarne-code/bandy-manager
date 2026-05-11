import type { MatchStep } from '../../../domain/services/matchUtils'

interface LiveMatchStats {
  possession: [number, number]
  shots: [number, number]
  corners: [number, number]
  suspensions: [number, number]
}

export function calculateLiveStats(step: MatchStep): LiveMatchStats {
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
    <div className="stats-footer-stalvallen">
      <span className={`stats-footer-home${stats.possession[0] > stats.possession[1] ? ' lead' : ''}`}>
        {stats.possession[0]}%
      </span>
      <span className="stats-footer-label">Bollinnehav</span>
      <span className={`stats-footer-away${stats.possession[1] > stats.possession[0] ? ' lead' : ''}`}>
        {stats.possession[1]}%
      </span>

      <span className={`stats-footer-home${stats.shots[0] > stats.shots[1] ? ' lead' : ''}`}>
        {stats.shots[0]}
      </span>
      <span className="stats-footer-label">Skott</span>
      <span className={`stats-footer-away${stats.shots[1] > stats.shots[0] ? ' lead' : ''}`}>
        {stats.shots[1]}
      </span>

      <span className={`stats-footer-home${stats.corners[0] > stats.corners[1] ? ' lead' : ''}`}>
        {stats.corners[0]}
      </span>
      <span className="stats-footer-label">Hörnor</span>
      <span className={`stats-footer-away${stats.corners[1] > stats.corners[0] ? ' lead' : ''}`}>
        {stats.corners[1]}
      </span>

      {(stats.suspensions[0] + stats.suspensions[1]) > 0 && (
        <>
          <span className={`stats-footer-home${stats.suspensions[0] > 0 ? ' danger' : ''}`}
            style={stats.suspensions[0] > 0 ? { color: 'var(--led-red)' } : {}}>
            {stats.suspensions[0]}
          </span>
          <span className="stats-footer-label">Utvisn</span>
          <span className={`stats-footer-away${stats.suspensions[1] > 0 ? ' danger' : ''}`}
            style={stats.suspensions[1] > 0 ? { color: 'var(--led-red)' } : {}}>
            {stats.suspensions[1]}
          </span>
        </>
      )}
    </div>
  )
}
