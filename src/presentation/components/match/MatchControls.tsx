import { Activity, ArrowLeftRight, FastForward, Pause, Play, Settings, Volume2, VolumeX } from 'lucide-react'
import { Icon } from '../primitives/Icon'

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
          <Icon icon={isPaused ? Play : Pause} size={16} />
        </button>

        <button
          onClick={onToggleFastForward}
          className={`match-control-btn${isFastForward ? ' active' : ''}`}
          title="Snabbsim"
        >
          <Icon icon={FastForward} size={16} />
        </button>

        {!matchDone && (
          <button
            onClick={onOpenSubModal}
            className="match-control-btn"
            title="Byten"
          >
            <Icon icon={ArrowLeftRight} size={16} />
          </button>
        )}

        {!matchDone && onOpenTacticQuick && (tacticChangesLeft ?? 0) > 0 && (
          <button
            onClick={onOpenTacticQuick}
            className={`match-control-btn match-control-tactic${tacticGlow ? ' spak-b-glow' : ''}`}
            title="Taktikjustering"
          >
            <Icon icon={Settings} size={16} />
            <span className="match-control-tactic-count">{tacticChangesLeft}</span>
            <span className="match-control-tactic-label">TAKTIK</span>
          </button>
        )}

        <button
          onClick={onToggleMute}
          className={`match-control-btn${muted ? ' active' : ''}`}
          title={muted ? 'Slå på ljud' : 'Stäng av ljud'}
        >
          <Icon icon={muted ? VolumeX : Volume2} size={16} />
        </button>

        <button
          onClick={onOpenSiffror}
          className="match-control-btn"
          title="Siffror"
        >
          <Icon icon={Activity} size={16} />
        </button>
      </div>
    </div>
  )
}
