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
    <div className="match-controls-stalvallen">
      <div className="match-controls-row">
        <span className="match-controls-label">
          🏛️ MATCH
        </span>

        <button
          onClick={onTogglePause}
          className={`match-control-btn${!isPaused ? ' active' : ''}`}
          title={isPaused ? 'Spela' : 'Pausa'}
        >
          {isPaused ? '▶' : '⏸'}
        </button>

        <button
          onClick={onToggleFastForward}
          className={`match-control-btn${isFastForward ? ' active' : ''}`}
          title="Snabbsim"
        >
          ⏩
        </button>

        {!matchDone && (
          <button
            onClick={onOpenSubModal}
            className="match-control-btn"
            title="Byten"
          >
            🔄
          </button>
        )}

        {!matchDone && onOpenTacticQuick && (tacticChangesLeft ?? 0) > 0 && (
          <button
            onClick={onOpenTacticQuick}
            className="match-control-btn match-control-tactic"
            title="Taktikjustering"
          >
            ⚙️
            <span className="match-control-tactic-count">{tacticChangesLeft}</span>
            <span className="match-control-tactic-label">TAKTIK</span>
          </button>
        )}

        <button
          onClick={onToggleMute}
          className={`match-control-btn${muted ? ' active' : ''}`}
          title={muted ? 'Slå på ljud' : 'Stäng av ljud'}
        >
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
