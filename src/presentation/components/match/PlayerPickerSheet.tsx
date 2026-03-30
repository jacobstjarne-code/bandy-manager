import type { Player } from '../../../domain/entities/Player'
import { PlayerPosition } from '../../../domain/enums'
import { positionShort } from '../../utils/formatters'

interface PlayerPickerSheetProps {
  slotLabel: string
  slotPosition: PlayerPosition
  availablePlayers: Player[]        // all squad players not blocked by injury/suspension
  assignedPlayerIds: Set<string>    // already in other slots
  currentPlayerId: string | null    // player currently in this slot
  onSelect: (playerId: string) => void
  onClose: () => void
}

function formBar(value: number, color: string) {
  return (
    <div style={{ width: 40, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 2 }} />
    </div>
  )
}

export function PlayerPickerSheet({
  slotLabel,
  slotPosition,
  availablePlayers,
  assignedPlayerIds,
  currentPlayerId,
  onSelect,
  onClose,
}: PlayerPickerSheetProps) {
  // Sort: matching position first, then by CA desc
  const sorted = [...availablePlayers].sort((a, b) => {
    const aMatch = a.position === slotPosition ? 0 : 1
    const bMatch = b.position === slotPosition ? 0 : 1
    if (aMatch !== bMatch) return aMatch - bMatch
    return b.currentAbility - a.currentAbility
  })

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-elevated)',
          borderRadius: '16px 16px 0 0',
          maxHeight: '75vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--border)',
          borderBottom: 'none',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '14px 16px 10px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Välj spelare för <span style={{ color: 'var(--accent)' }}>{slotLabel}</span>
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Normalpositionen: {positionShort(slotPosition)}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px' }}
          >
            ✕
          </button>
        </div>

        {/* Player list */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {sorted.map(player => {
            const isCurrentSlot = player.id === currentPlayerId
            const isOtherSlot = assignedPlayerIds.has(player.id) && !isCurrentSlot
            const wrongPos = player.position !== slotPosition
            const unavailable = player.isInjured || player.suspensionGamesRemaining > 0

            return (
              <div
                key={player.id}
                onClick={() => !unavailable && !isOtherSlot && onSelect(player.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 16px',
                  borderBottom: '1px solid var(--border)',
                  cursor: (unavailable || isOtherSlot) ? 'default' : 'pointer',
                  opacity: unavailable ? 0.4 : 1,
                  background: isCurrentSlot ? 'rgba(196,122,58,0.08)' : 'transparent',
                }}
              >
                {/* Shirt number badge */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: isCurrentSlot ? 'rgba(196,122,58,0.2)' : 'var(--bg)',
                  border: `1px solid ${isCurrentSlot ? 'var(--accent)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700,
                  color: isCurrentSlot ? 'var(--accent)' : 'var(--text-muted)',
                }}>
                  {player.shirtNumber ?? positionShort(player.position).charAt(0)}
                </div>

                {/* Name + info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {player.lastName}
                    </span>
                    {wrongPos && !unavailable && (
                      <span style={{ fontSize: 10, color: 'var(--warning)', fontStyle: 'italic' }}>
                        ({positionShort(player.position)} · felpos)
                      </span>
                    )}
                    {isOtherSlot && (
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        (används)
                      </span>
                    )}
                    {unavailable && (
                      <span style={{ fontSize: 10, color: 'var(--danger)' }}>
                        {player.isInjured ? '🩹' : '🚫'}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {positionShort(player.position)} · {player.age} år
                    </span>
                    {formBar(player.form, 'var(--accent)')}
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Form {Math.round(player.form)}</span>
                  </div>
                </div>

                {/* CA */}
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent)', flexShrink: 0 }}>
                  {Math.round(player.currentAbility)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
