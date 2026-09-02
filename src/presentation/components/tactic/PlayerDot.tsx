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

  // M4 (audit 5c9a7a8, 2026-08-24): "flera centrala ringar/kort är klickbara
  // divar [SVG-motsvarighet här] utan roll/tabindex" — det här är truppens
  // mest centrala interaktionspunkt (sätta startelvan). role/tabIndex/
  // onKeyDown fungerar identiskt på SVG-element som på div/button i moderna
  // webbläsare.
  const label = player ? `${slot.label}, ${player.firstName} ${player.lastName}` : `${slot.label}, tom position`
  return (
    <g
      onClick={!readOnly ? onClick : undefined}
      onKeyDown={!readOnly ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.() } } : undefined}
      role={!readOnly ? 'button' : undefined}
      tabIndex={!readOnly ? 0 : undefined}
      aria-label={!readOnly ? label : undefined}
      style={{ cursor: readOnly ? 'default' : 'pointer' }}
    >
      {/*
        M5: separat, osynlig tumträffyta. Den synliga spelarpricken behåller
        sin 28-enheters diameter; träffytan är 46×46 och ryms mellan planens
        tätaste slotar (56 enheter mellan centrum). `fill="transparent"`
        deltar i SVG-hit-testing utan att skapa en parallell kontroll.
      */}
      {!readOnly && (
        <circle cx={cx} cy={cy} r="23" fill="transparent" aria-hidden="true" data-player-dot-hit-area />
      )}
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
