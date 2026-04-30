import type { SaveGame } from '../../../domain/entities/SaveGame'
import { getActiveBeat, getBeatKey } from '../../../domain/services/portalBeatService'
import { useGameStore } from '../../store/gameStore'

interface Props {
  game: SaveGame
}

export function PortalBeat({ game }: Props) {
  const dismissBeat = useGameStore(s => s.dismissBeat)
  const beat = getActiveBeat(game)
  if (!beat) return null

  const dismiss = () => {
    const key = getBeatKey(beat, game.currentSeason)
    dismissBeat(key)
  }

  return (
    <div style={{
      marginBottom: 10,
      padding: '8px 12px',
      background: 'var(--bg-portal-surface)',
      borderRadius: 6,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
    }}>
      <span style={{ fontSize: 18, lineHeight: 1.3, flexShrink: 0 }}>{beat.emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12,
          color: 'var(--text-light-secondary)',
          lineHeight: 1.55,
          fontStyle: 'italic',
          fontFamily: 'var(--font-display)',
        }}>
          {beat.text}
        </div>
      </div>
      <button
        onClick={dismiss}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          fontSize: 14,
          cursor: 'pointer',
          padding: '0 0 0 4px',
          lineHeight: 1,
          flexShrink: 0,
          alignSelf: 'center',
        }}
        aria-label="Stäng"
      >
        ×
      </button>
    </div>
  )
}
