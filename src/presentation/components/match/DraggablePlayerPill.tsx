import type { Player } from '../../../domain/entities/Player'
import { PlayerPosition } from '../../../domain/enums'

const POS_SHORT: Partial<Record<string, string>> = {
  [PlayerPosition.Goalkeeper]: 'MV',
  [PlayerPosition.Defender]: 'B',
  [PlayerPosition.Half]: 'YH',
  [PlayerPosition.Midfielder]: 'MF',
  [PlayerPosition.Forward]: 'A',
}

interface PlayerPillProps {
  player: Player
  isSelected: boolean
  onTap: (playerId: string) => void
}

export function PlayerPill({ player, isSelected, onTap }: PlayerPillProps) {
  return (
    <div
      onClick={() => onTap(player.id)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        minHeight: 44,
        background: isSelected ? 'rgba(196,122,58,0.15)' : 'var(--bg-elevated)',
        border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 8,
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'background 100ms, border-color 100ms',
      }}
    >
      <span style={{
        width: 26,
        height: 26,
        borderRadius: '50%',
        background: isSelected ? 'rgba(196,122,58,0.25)' : 'rgba(196,122,58,0.15)',
        border: `1px solid ${isSelected ? 'var(--accent)' : 'rgba(196,122,58,0.3)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 800,
        color: 'var(--accent)',
        flexShrink: 0,
        fontFamily: 'system-ui, sans-serif',
      }}>
        {player.shirtNumber ?? '?'}
      </span>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
        {player.lastName}
      </span>
      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.3px' }}>
        {POS_SHORT[player.position] ?? player.position.toUpperCase()}
      </span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        {Math.round(player.currentAbility)}
      </span>
    </div>
  )
}
