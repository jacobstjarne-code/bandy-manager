import type { Player } from '../../../domain/entities/Player'
import type { Tactic } from '../../../domain/entities/Club'
import { FORMATIONS, autoAssignFormation } from '../../../domain/entities/Formation'
import { BandyPitch } from '../BandyPitch'
import { getPositionFit } from '../../../domain/utils/positionFit'

interface LineupFormationViewProps {
  tacticState: Tactic
  startingIds: string[]
  squadPlayers: Player[]
  selectedSlotId: string | null
  onSlotClick: (slotId: string) => void
}

export function LineupFormationView({
  tacticState,
  startingIds,
  squadPlayers,
  selectedSlotId,
  onSlotClick,
}: LineupFormationViewProps) {
  const formationType = tacticState.formation ?? '3-3-4'
  const template = FORMATIONS[formationType]

  const slotToPlayer: Record<string, string> = {}
  for (const [slotId, pid] of Object.entries(tacticState.lineupSlots ?? {})) {
    if (pid && startingIds.includes(pid)) slotToPlayer[slotId] = pid
  }

  if (startingIds.length > 0 && Object.keys(slotToPlayer).length === 0) {
    const startingPlayers = squadPlayers.filter(p => startingIds.includes(p.id))
    const autoSlots = autoAssignFormation(template, startingPlayers)
    for (const [slotId, pid] of Object.entries(autoSlots)) {
      if (pid) slotToPlayer[slotId] = pid
    }
  }

  return (
    <div style={{ padding: '0 16px', marginBottom: 16 }}>
      {/* Pitch with HTML slot overlay */}
      <div style={{ position: 'relative' }}>
        <BandyPitch width="100%" />

        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {template.slots.map(slot => {
            const pid = slotToPlayer[slot.id]
            const player = pid ? squadPlayers.find(p => p.id === pid) ?? null : null
            const isEmpty = !player
            const isSelected = selectedSlotId === slot.id

            const topPct = (1 - slot.y / 100) * 100
            const leftPct = slot.x

            let ringColor = 'var(--accent)'
            if (player) {
              const positionFit = getPositionFit(player.position, slot.position)
              if (positionFit === 1) ringColor = 'var(--success)'
              else if (positionFit === 0.9) ringColor = 'var(--warning)'
              else ringColor = 'var(--danger)'
            }

            return (
              <div
                key={slot.id}
                onClick={() => onSlotClick(slot.id)}
                style={{
                  position: 'absolute',
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 38,
                  height: 38,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                }}
              >
                {/* Circle — position code within, no label above */}
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: isEmpty
                    ? 'transparent'
                    : isSelected
                      ? `color-mix(in srgb, var(--accent) 40%, transparent)`
                      : `color-mix(in srgb, ${ringColor} 18%, transparent)`,
                  border: isEmpty
                    ? '1.5px dashed color-mix(in srgb, var(--ink) 30%, transparent)'
                    : isSelected
                      ? '2px solid var(--accent)'
                      : `1.5px solid color-mix(in srgb, ${ringColor} 55%, transparent)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isEmpty ? 8 : 13,
                  fontWeight: isEmpty ? 700 : 800,
                  color: isEmpty ? 'color-mix(in srgb, var(--ink) 40%, transparent)' : 'var(--text-primary)',
                  transition: 'background 120ms, border-color 120ms, transform 120ms',
                  transform: isSelected ? 'scale(1.18)' : 'scale(1)',
                  boxShadow: isSelected ? '0 0 8px color-mix(in srgb, var(--accent) 35%, transparent)' : 'none',
                  fontFamily: 'system-ui, sans-serif',
                }}>
                  {player
                    ? (player.shirtNumber != null ? String(player.shirtNumber) : '?')
                    : slot.label.toUpperCase()}
                </div>

                {/* NO name text — shown in legend/list below */}
              </div>
            )
          })}
        </div>
      </div>

      {selectedSlotId && (
        <p style={{ fontSize: 12, color: 'var(--accent)', textAlign: 'center', marginTop: 6, fontWeight: 600 }}>
          Väljer spelare till: {template.slots.find(s => s.id === selectedSlotId)?.label ?? selectedSlotId} — klicka på en spelare nedan
        </p>
      )}
    </div>
  )
}
