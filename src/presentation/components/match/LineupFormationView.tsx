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

  const rawAssignments = tacticState.positionAssignments ?? {}
  const assignments = Object.fromEntries(
    Object.entries(rawAssignments).filter(([pid]) => startingIds.includes(pid))
  )
  const slotToPlayer: Record<string, string> = {}
  for (const [pid, slot] of Object.entries(assignments)) {
    slotToPlayer[slot.id] = pid
  }

  const PW = 220, PH = 130

  return (
    <div style={{ padding: '0 16px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <select
          value={formationType}
          onChange={e => {
            const f = e.target.value as FormationType
            const tmpl = FORMATIONS[f]
            const currentStarters = startingIds
              .map(id => squadPlayers.find(p => p.id === id))
              .filter((p): p is Player => !!p)
            const newAssignments = autoAssignFormation(tmpl, currentStarters)
            onFormationChange({ ...tacticState, formation: f, positionAssignments: newAssignments })
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

      <BandyPitch width="100%">
        {template.slots.map(slot => {
          const assignedPid = slotToPlayer[slot.id]
          const assignedPlayer = assignedPid ? squadPlayers.find(p => p.id === assignedPid) : null
          const isSelected = selectedSlotId === slot.id
          const sx = (slot.x / 100) * PW
          const sy = (1 - slot.y / 100) * PH

          let ringColor = '#3b82f6'
          if (assignedPlayer) {
            if (assignedPlayer.position === slot.position) ringColor = 'var(--success)'
            else if (ADJACENT_POS[assignedPlayer.position]?.includes(slot.position)) ringColor = 'var(--warning)'
            else ringColor = 'var(--danger)'
          }

          const circleR = 11
          const displayText = assignedPlayer ? assignedPlayer.lastName.slice(0, 5) : slot.label
          const subText = assignedPlayer ? String(Math.round(assignedPlayer.currentAbility)) : ''

          return (
            <g
              key={slot.id}
              onClick={() => onSlotClick(slot.id)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={sx} cy={sy} r={circleR}
                fill={isSelected ? 'rgba(196,122,58,0.3)' : assignedPlayer ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)'}
                stroke={isSelected ? 'var(--accent)' : ringColor}
                strokeWidth={isSelected ? 2 : 1.5}
              />
              <text
                x={sx} y={sy - (subText ? 1.5 : 0)}
                textAnchor="middle" dominantBaseline="middle"
                fill="#F5F1EB" fontSize={assignedPlayer ? 5.5 : 6} fontWeight="700"
                fontFamily="system-ui, sans-serif"
              >
                {displayText}
              </text>
              {subText && (
                <text
                  x={sx} y={sy + 5}
                  textAnchor="middle" dominantBaseline="middle"
                  fill={ringColor} fontSize={4.5} fontFamily="system-ui, sans-serif"
                >
                  {subText}
                </text>
              )}
            </g>
          )
        })}
      </BandyPitch>

      {selectedSlotId && (
        <p style={{ fontSize: 12, color: 'var(--accent)', textAlign: 'center', marginTop: 6, fontWeight: 600 }}>
          Väljer spelare till: {template.slots.find(s => s.id === selectedSlotId)?.label ?? selectedSlotId} — klicka på en spelare nedan
        </p>
      )}
    </div>
  )
}
