import type { FormationSlot } from '../../../domain/entities/Formation'
import type { Player } from '../../../domain/entities/Player'

interface PlayerDotProps {
  slot: FormationSlot
  player: Player | null
  onClick?: () => void
  readOnly?: boolean
  isSelected?: boolean
}

export function PlayerDot({ slot, player, onClick, readOnly, isSelected }: PlayerDotProps) {
  const cx = slot.x * 2.8
  const cy = slot.y * 4
  const r = 14

  return (
    <g
      onClick={!readOnly ? onClick : undefined}
      style={{ cursor: readOnly ? 'default' : 'pointer' }}
    >
      {/* Selection ring */}
      {isSelected && (
        <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke="var(--accent)" strokeWidth="2" opacity="0.8" />
      )}
      {/* Main circle */}
      <circle
        cx={cx} cy={cy} r={r}
        fill={player ? 'var(--accent)' : 'var(--bg-dark-elevated)'}
        stroke={player ? 'rgba(255,255,255,0.6)' : 'var(--border)'}
        strokeWidth="1.5"
      />
      {/* Player name or slot label */}
      <text
        x={cx} y={cy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="7"
        fontWeight="700"
        fill={player ? 'white' : 'var(--text-muted)'}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {player ? player.lastName.slice(0, 6) : slot.label}
      </text>
      {/* Position label below */}
      <text
        x={cx} y={cy + r + 8}
        textAnchor="middle"
        fontSize="7"
        fill="var(--text-muted)"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {slot.label}
      </text>
    </g>
  )
}
