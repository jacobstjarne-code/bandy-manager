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

  const isWarn = player != null && (player.fitness < 40 || player.position !== slot.position)
  const dotFill = player ? (isWarn ? 'url(#dot-warn)' : 'url(#dot-ok)') : 'var(--bg-dark-elevated)'

  return (
    <g
      onClick={!readOnly ? onClick : undefined}
      style={{ cursor: readOnly ? 'default' : 'pointer' }}
    >
      {/* Selection ring */}
      {isSelected && (
        <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke="var(--accent)" strokeWidth="2" opacity="0.8" />
      )}
      {/* Main circle — green (ok) or red (wrong position / low fitness) */}
      <circle
        cx={cx} cy={cy} r={r}
        fill={dotFill}
        stroke={player ? 'white' : 'var(--border)'}
        strokeWidth={player ? 2 : 1.5}
        filter={player ? 'url(#dot-shadow)' : undefined}
      />
      {/* Position label inside circle */}
      <text
        x={cx} y={cy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="7"
        fontWeight="700"
        fill={player ? 'white' : 'var(--text-muted)'}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {slot.label}
      </text>
      {/* Player last name below circle */}
      {player && (
        <text
          x={cx} y={cy + r + 7}
          textAnchor="middle"
          fontSize="7.5"
          fill="var(--text-secondary)"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {player.lastName.slice(0, 7)}
        </text>
      )}
    </g>
  )
}
