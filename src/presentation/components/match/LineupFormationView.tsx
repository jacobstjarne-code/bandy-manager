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
        <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0, flexShrink: 0 }}>
          ⚙️ Formation
        </p>
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

          let ringColor = 'var(--accent)'
          if (assignedPlayer) {
            if (assignedPlayer.position === slot.position) ringColor = 'var(--success)'
            else if (ADJACENT_POS[assignedPlayer.position]?.includes(slot.position)) ringColor = 'var(--warning)'
            else ringColor = 'var(--danger)'
          }

          const circleR = 11
          const posLabel = slot.label.toUpperCase()
          const circleText = assignedPlayer
            ? (assignedPlayer.shirtNumber != null ? String(assignedPlayer.shirtNumber) : assignedPlayer.lastName.slice(0, 4))
            : ''
          const nameText = assignedPlayer ? assignedPlayer.lastName.slice(0, 5) : ''

          return (
            <g
              key={slot.id}
              onClick={() => onSlotClick(slot.id)}
              style={{ cursor: 'pointer' }}
            >
              {/* Position label above circle */}
              <text
                x={sx} y={sy - circleR - 3}
                textAnchor="middle" dominantBaseline="auto"
                fill="rgba(255,255,255,0.7)" fontSize={4} fontWeight="700"
                fontFamily="system-ui, sans-serif" letterSpacing="0.5"
              >
                {posLabel}
              </text>
              <circle
                cx={sx} cy={sy} r={circleR}
                fill="rgba(255,255,255,0.5)"
                stroke={isSelected ? 'var(--accent)' : ringColor}
                strokeWidth={isSelected ? 2 : 1.5}
              />
              {/* Shirt number or slot label in circle */}
              <text
                x={sx} y={sy}
                textAnchor="middle" dominantBaseline="middle"
                fill="#1A1A18" fontSize={assignedPlayer ? 7 : 6} fontWeight="700"
                fontFamily="system-ui, sans-serif"
              >
                {assignedPlayer ? circleText : posLabel}
              </text>
              {/* Player last name below circle */}
              {nameText && (
                <text
                  x={sx} y={sy + circleR + 4}
                  textAnchor="middle" dominantBaseline="hanging"
                  fill="rgba(255,255,255,0.85)" fontSize={4.5} fontFamily="system-ui, sans-serif"
                >
                  {nameText}
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
