import type { Player } from '../../../domain/entities/Player'
import type { Tactic } from '../../../domain/entities/Club'
import { FORMATIONS, autoAssignFormation } from '../../../domain/entities/Formation'
import type { FormationType } from '../../../domain/entities/Formation'
import { BandyPitch } from '../BandyPitch'

interface LineupFormationViewProps {
  tacticState: Tactic
  startingIds: string[]
  squadPlayers: Player[]
  selectedSlotId: string | null
  onSlotClick: (slotId: string) => void
  onFormationChange: (newTactic: Tactic) => void
}

const ADJACENT_POS: Record<string, string[]> = {
  goalkeeper: [],
  defender: ['half'],
  half: ['defender', 'midfielder'],
  midfielder: ['half', 'forward'],
  forward: ['midfielder'],
}

export function LineupFormationView({
  tacticState,
  startingIds,
  squadPlayers,
  selectedSlotId,
  onSlotClick,
  onFormationChange,
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0, flexShrink: 0 }}>
          ⚙️ Formation
        </p>
        <select
          value={formationType}
          onChange={e => {
            onFormationChange({ ...tacticState, formation: e.target.value as FormationType })
          }}
          style={{
            flex: 1, padding: '7px 10px',
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
            fontSize: 13, fontWeight: 600,
          }}
        >
          {(Object.keys(FORMATIONS) as FormationType[]).map(f => (
            <option key={f} value={f}>{FORMATIONS[f].label}</option>
          ))}
        </select>
      </div>

      {/* Pitch with HTML slot overlay — SAME technique as PitchLineupView */}
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
              if (player.position === slot.position) ringColor = 'var(--success)'
              else if (ADJACENT_POS[player.position]?.includes(slot.position)) ringColor = 'var(--warning)'
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
                  width: 44,
                  height: 58,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                }}
              >
                {/* Position label above circle */}
                <span style={{
                  position: 'absolute',
                  top: -5,
                  fontSize: 8,
                  fontWeight: 700,
                  color: isEmpty ? 'rgba(26,26,24,0.55)' : 'rgba(26,26,24,0.65)',
                  letterSpacing: '0.3px',
                  fontFamily: 'system-ui, sans-serif',
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}>
                  {slot.label.toUpperCase()}
                </span>

                {/* Circle — IDENTICAL to PitchLineupView */}
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: isEmpty
                    ? 'transparent'
                    : isSelected
                      ? `color-mix(in srgb, var(--accent) 40%, transparent)`
                      : `color-mix(in srgb, ${ringColor} 18%, transparent)`,
                  border: isEmpty
                    ? '1.5px dashed rgba(26,26,24,0.3)'
                    : isSelected
                      ? '2px solid var(--accent)'
                      : `1.5px solid color-mix(in srgb, ${ringColor} 55%, transparent)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isEmpty ? 7 : 10,
                  fontWeight: 800,
                  color: isEmpty ? 'rgba(26,26,24,0.4)' : 'var(--text-primary)',
                  transition: 'background 120ms, border-color 120ms, transform 120ms',
                  transform: isSelected ? 'scale(1.18)' : 'scale(1)',
                  boxShadow: isSelected ? '0 0 8px rgba(196,122,58,0.5)' : 'none',
                  fontFamily: 'system-ui, sans-serif',
                }}>
                  {player
                    ? (player.shirtNumber != null ? String(player.shirtNumber) : '?')
                    : slot.label.slice(0, 2)}
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
