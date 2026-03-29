import type { Player } from '../../../domain/entities/Player'

interface DraggablePlayerPillProps {
  player: Player
  isDragging: boolean
  onPointerDown: (e: React.PointerEvent, playerId: string) => void
}

export function DraggablePlayerPill({ player, isDragging, onPointerDown }: DraggablePlayerPillProps) {
  return (
    <div
      onPointerDown={e => onPointerDown(e, player.id)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        minHeight: 44,
        background: isDragging ? 'rgba(196,122,58,0.2)' : 'var(--bg-elevated)',
        border: `1px solid ${isDragging ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 8,
        cursor: 'grab',
        touchAction: 'none',
        opacity: isDragging ? 0.5 : 1,
        transition: 'opacity 100ms, background 100ms, border-color 100ms',
        userSelect: 'none',
      }}
    >
      <span style={{
        width: 26,
        height: 26,
        borderRadius: '50%',
        background: 'rgba(196,122,58,0.15)',
        border: '1px solid rgba(196,122,58,0.3)',
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
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        {Math.round(player.currentAbility)}
      </span>
    </div>
  )
}
