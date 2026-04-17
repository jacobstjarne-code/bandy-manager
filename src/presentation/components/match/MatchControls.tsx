import type { MatchStep } from '../../../domain/services/matchSimulator'
import { StatsFooter, calculateLiveStats } from './StatsFooter'
import { MomentumBar } from './MomentumBar'

interface MatchControlsProps {
  isPaused: boolean
  isFastForward: boolean
  matchDone: boolean
  muted: boolean
  currentMatchStep: MatchStep | null
  onTogglePause: () => void
  onToggleFastForward: () => void
  onOpenSubModal: () => void
  onToggleMute: () => void
  onOpenTacticQuick?: () => void
  tacticChangesLeft?: number
}

export function MatchControls({
  isPaused,
  isFastForward,
  matchDone,
  muted,
  currentMatchStep,
  onTogglePause,
  onToggleFastForward,
  onOpenSubModal,
  onToggleMute,
  onOpenTacticQuick,
  tacticChangesLeft,
}: MatchControlsProps) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px' }}>
        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginRight: 'auto' }}>
          🏛️ Match
        </span>
        <button onClick={onTogglePause} className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 14 }}>
          {isPaused ? '▶' : '⏸'}
        </button>
        <button
          onClick={onToggleFastForward}
          className={`btn ${isFastForward ? 'btn-copper' : 'btn-ghost'}`}
          style={{ padding: '6px 12px', fontSize: 14 }}
        >
          ⏩
        </button>
        {!matchDone && (
          <button onClick={onOpenSubModal} className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 14 }}>
            🔄
          </button>
        )}
        {!matchDone && onOpenTacticQuick && (tacticChangesLeft ?? 0) > 0 && (
          <button
            onClick={onOpenTacticQuick}
            className="btn btn-ghost"
            style={{ padding: '6px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
            title="Taktikjustering"
          >
            ⚙️ <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)' }}>{tacticChangesLeft}</span>
            <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>TAKTIK</span>
          </button>
        )}
        <button onClick={onToggleMute} className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 14 }}>
          {muted ? '🔇' : '🔊'}
        </button>
      </div>
      {currentMatchStep && (
        <MomentumBar
          homeActions={currentMatchStep.shotsHome + currentMatchStep.cornersHome}
          awayActions={currentMatchStep.shotsAway + currentMatchStep.cornersAway}
          intensity={currentMatchStep.intensity}
        />
      )}
      {currentMatchStep && (
        <StatsFooter stats={calculateLiveStats(currentMatchStep)} />
      )}
    </div>
  )
}
