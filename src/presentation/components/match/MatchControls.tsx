import { ArrowLeftRight } from 'lucide-react'

interface MatchControlsProps {
  isPaused: boolean
  isFastForward: boolean
  matchDone: boolean
  muted: boolean
  onTogglePause: () => void
  onToggleFastForward: () => void
  onOpenSubModal: () => void
  onToggleMute: () => void
  onOpenSiffror: () => void
  onOpenTacticQuick?: () => void
  tacticChangesLeft?: number
  tacticGlow?: boolean
}

export function MatchControls({
  isPaused,
  isFastForward,
  matchDone,
  muted,
  onTogglePause,
  onToggleFastForward,
  onOpenSubModal,
  onToggleMute,
  onOpenSiffror,
  onOpenTacticQuick,
  tacticChangesLeft,
  tacticGlow,
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
            <ArrowLeftRight size={16} />
          </button>
        )}

        {!matchDone && onOpenTacticQuick && (tacticChangesLeft ?? 0) > 0 && (
          <button
            onClick={onOpenTacticQuick}
            className={`match-control-btn match-control-tactic${tacticGlow ? ' spak-b-glow' : ''}`}
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

        <button
          onClick={onOpenSiffror}
          className="match-control-btn"
          title="Siffror"
        >
          〰
        </button>
      </div>
    </div>
  )
}
