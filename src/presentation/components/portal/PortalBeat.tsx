import { useNavigate } from 'react-router-dom'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { getActiveBeat, getBeatKey } from '../../../domain/services/portalBeatService'
import { useGameStore } from '../../store/gameStore'

interface Props {
  game: SaveGame
}

export function PortalBeat({ game }: Props) {
  const dismissBeat = useGameStore(s => s.dismissBeat)
  const navigate = useNavigate()
  const beat = getActiveBeat(game)
  if (!beat) return null

  const beatText = typeof beat.text === 'function' ? beat.text(game) : beat.text

  const dismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    const key = getBeatKey(beat, game.currentSeason, game)
    dismissBeat(key)
  }

  const handleClick = () => {
    if (beat.route) {
      const key = getBeatKey(beat, game.currentSeason, game)
      dismissBeat(key)
      navigate(beat.route)
    }
  }

  const isNavigable = !!beat.route

  return (
    <div
      onClick={isNavigable ? handleClick : undefined}
      style={{
        marginBottom: 10,
        padding: beat.kicker ? '7px 12px 9px' : '8px 12px',
        background: beat.kicker ? 'color-mix(in srgb, var(--copper) 8%, var(--bg-portal-surface))' : 'var(--bg-portal-surface)',
        borderRadius: 'var(--radius-md)',
        border: beat.kicker ? '1px solid color-mix(in srgb, var(--copper) 25%, transparent)' : 'none',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        cursor: isNavigable ? 'pointer' : 'default',
      }}
    >
      <span style={{ fontSize: 18, lineHeight: 1.3, flexShrink: 0, marginTop: beat.kicker ? 2 : 0 }}>
        {beat.emoji}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {beat.kicker && (
          <div style={{
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: 'var(--copper)',
            marginBottom: 3,
          }}>
            {beat.kicker}
          </div>
        )}
        <div style={{
          fontSize: 12,
          color: 'var(--text-light-secondary)',
          lineHeight: 1.55,
          fontStyle: 'italic',
          fontFamily: 'var(--font-display)',
        }}>
          {beatText}
        </div>
      </div>
      {isNavigable && (
        <span style={{
          fontSize: 14,
          color: 'var(--copper)',
          flexShrink: 0,
          alignSelf: 'center',
          lineHeight: 1,
        }}>
          ›
        </span>
      )}
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
