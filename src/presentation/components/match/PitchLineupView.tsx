import { useRef, useState } from 'react'
import type { Player } from '../../../domain/entities/Player'
import type { Tactic } from '../../../domain/entities/Club'
import type { FormationSlot, FormationType } from '../../../domain/entities/Formation'
import { FORMATIONS, autoAssignFormation } from '../../../domain/entities/Formation'
import { BandyPitch } from '../BandyPitch'
import { DraggablePlayerPill } from './DraggablePlayerPill'

interface PitchLineupViewProps {
  tacticState: Tactic
  startingIds: string[]
  squadPlayers: Player[]
  onAssignPlayer: (playerId: string, slotId: string) => void
  onRemovePlayer: (playerId: string) => void
  onSwapPlayers: (fromSlotId: string, toSlotId: string) => void
  onFormationChange: (newTactic: Tactic) => void
}

interface DragState {
  playerId: string
  fromSlotId: string | null
  x: number
  y: number
}

export function PitchLineupView({
  tacticState,
  startingIds,
  squadPlayers,
  onAssignPlayer,
  onRemovePlayer,
  onSwapPlayers,
  onFormationChange,
}: PitchLineupViewProps) {
  const [drag, setDrag] = useState<DragState | null>(null)
  const [hoverSlotId, setHoverSlotId] = useState<string | null>(null)
  const slotRefs = useRef<Map<string, HTMLElement>>(new Map())

  const formationType = (tacticState.formation ?? '3-3-4') as FormationType
  const template = FORMATIONS[formationType]

  // Build slot → player mapping (only from startingIds)
  const rawAssignments = tacticState.positionAssignments ?? {}
  const assignments: Record<string, FormationSlot> = Object.fromEntries(
    Object.entries(rawAssignments).filter(([pid]) => startingIds.includes(pid))
  )
  const slotToPlayer: Record<string, string> = {}
  for (const [pid, slot] of Object.entries(assignments)) {
    slotToPlayer[slot.id] = pid
  }

  // Players not yet placed on the pitch (available to drag)
  const assignedPids = new Set(Object.keys(assignments))
  const pillPlayers = squadPlayers.filter(p =>
    !assignedPids.has(p.id) &&
    !p.isInjured &&
    p.suspensionGamesRemaining === 0
  )

  const dragPlayer = drag ? squadPlayers.find(p => p.id === drag.playerId) ?? null : null

  // ── Closest slot hit-test ─────────────────────────────────────────────────

  function findClosestSlot(x: number, y: number): string | null {
    let closest: string | null = null
    let minDist = 60
    for (const [slotId, el] of slotRefs.current) {
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const dist = Math.hypot(x - cx, y - cy)
      if (dist < minDist) {
        minDist = dist
        closest = slotId
      }
    }
    return closest
  }

  // ── Drag handlers ─────────────────────────────────────────────────────────

  function handleStartDrag(e: React.PointerEvent, playerId: string, fromSlotId: string | null) {
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    setDrag({ playerId, fromSlotId, x: e.clientX, y: e.clientY })
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!drag) return
    e.preventDefault()
    setDrag(d => d ? { ...d, x: e.clientX, y: e.clientY } : null)
    setHoverSlotId(findClosestSlot(e.clientX, e.clientY))
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!drag) return
    const target = findClosestSlot(e.clientX, e.clientY)
    if (target) {
      const existingPid = slotToPlayer[target]
      if (existingPid && drag.fromSlotId && existingPid !== drag.playerId) {
        onSwapPlayers(drag.fromSlotId, target)
      } else {
        onAssignPlayer(drag.playerId, target)
      }
      navigator.vibrate?.(10)
    } else if (drag.fromSlotId) {
      // Dropped outside any slot — unplace the player
      onRemovePlayer(drag.playerId)
    }
    setDrag(null)
    setHoverSlotId(null)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ userSelect: 'none' }}
    >
      {/* Formation selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', marginBottom: 10 }}>
        <p style={{
          fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase',
          color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0, flexShrink: 0,
        }}>
          ⚙️ Formation
        </p>
        <select
          value={formationType}
          onChange={e => {
            const f = e.target.value as FormationType
            const starters = startingIds
              .map(id => squadPlayers.find(p => p.id === id))
              .filter((p): p is Player => !!p)
            onFormationChange({
              ...tacticState,
              formation: f,
              positionAssignments: autoAssignFormation(FORMATIONS[f], starters),
            })
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

      {/* Pitch with HTML slot overlay */}
      <div style={{ padding: '0 16px', touchAction: 'none' }}>
        <div style={{ position: 'relative' }}>
          <BandyPitch width="100%" />

          {/* Slot overlay — position: absolute fills the SVG */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {template.slots.map(slot => {
              const pid = slotToPlayer[slot.id]
              const player = pid ? squadPlayers.find(p => p.id === pid) ?? null : null
              const isDraggingFrom = drag?.fromSlotId === slot.id
              const isHoverTarget = hoverSlotId === slot.id && !!drag && !isDraggingFrom
              const isEmpty = !player || isDraggingFrom

              // Slot at top% = (1 - slot.y/100)*100%, left% = slot.x%
              // Matches the SVG sy = (1 - slot.y/100) * PH calculation
              const topPct = (1 - slot.y / 100) * 100
              const leftPct = slot.x

              return (
                <div
                  key={slot.id}
                  ref={el => {
                    if (el) slotRefs.current.set(slot.id, el)
                    else slotRefs.current.delete(slot.id)
                  }}
                  onPointerDown={player && !isDraggingFrom
                    ? e => handleStartDrag(e, player.id, slot.id)
                    : undefined
                  }
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
                    cursor: player && !isDraggingFrom ? 'grab' : 'default',
                    touchAction: 'none',
                    pointerEvents: 'auto',
                    // Pulse animation for empty slots during drag
                    animation: isEmpty && !!drag
                      ? 'pitchSlotPulse 1.2s ease-in-out infinite'
                      : 'none',
                  }}
                >
                  {/* Position label above circle */}
                  <span style={{
                    position: 'absolute',
                    top: -2,
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

                  {/* Circle */}
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: isEmpty
                      ? 'transparent'
                      : isHoverTarget
                        ? 'rgba(196,122,58,0.35)'
                        : 'rgba(196,122,58,0.18)',
                    border: isEmpty
                      ? `1.5px dashed rgba(26,26,24,${isHoverTarget ? '0.7' : '0.3'})`
                      : `1.5px solid ${isHoverTarget ? 'rgba(196,122,58,0.9)' : 'rgba(196,122,58,0.55)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isEmpty ? 7 : 10,
                    fontWeight: 800,
                    color: isEmpty ? 'rgba(26,26,24,0.4)' : '#1A1A18',
                    transition: 'background 120ms, border-color 120ms, transform 120ms',
                    transform: isHoverTarget ? 'scale(1.18)' : 'scale(1)',
                    boxShadow: isHoverTarget ? '0 0 6px rgba(196,122,58,0.45)' : 'none',
                    fontFamily: 'system-ui, sans-serif',
                  }}>
                    {!isDraggingFrom && player
                      ? (player.shirtNumber != null ? String(player.shirtNumber) : player.lastName.slice(0, 3))
                      : slot.label.slice(0, 2)}
                  </div>

                  {/* Player last name below circle */}
                  {!isDraggingFrom && player && (
                    <span style={{
                      position: 'absolute',
                      bottom: -2,
                      fontSize: 8,
                      fontWeight: 600,
                      color: 'rgba(26,26,24,0.7)',
                      whiteSpace: 'nowrap',
                      maxWidth: 46,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontFamily: 'system-ui, sans-serif',
                      pointerEvents: 'none',
                    }}>
                      {player.lastName.slice(0, 6)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bench / Unplaced players */}
      <div style={{ padding: '10px 16px 4px', borderTop: '1px solid var(--border)', marginTop: 6 }}>
        <p style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '1.5px',
          textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8,
        }}>
          Oplacerade — dra till planen
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {pillPlayers.map(p => (
            <DraggablePlayerPill
              key={p.id}
              player={p}
              isDragging={drag?.playerId === p.id}
              onPointerDown={(e, pid) => handleStartDrag(e, pid, null)}
            />
          ))}
          {pillPlayers.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Alla spelare placerade
            </p>
          )}
        </div>
      </div>

      {/* Count + auto-fill */}
      <div style={{ padding: '8px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 13,
          color: startingIds.length === 11 ? 'var(--success)' : 'var(--warning)',
          fontWeight: 600,
        }}>
          {startingIds.length}/11 startande
        </span>
        <button
          onClick={() => {
            const starters = startingIds
              .map(id => squadPlayers.find(p => p.id === id))
              .filter((p): p is Player => !!p)
            onFormationChange({
              ...tacticState,
              positionAssignments: autoAssignFormation(template, starters),
            })
          }}
          style={{
            padding: '8px 16px', fontSize: 13, fontWeight: 700,
            background: 'rgba(196,122,58,0.08)', border: '1.5px solid var(--accent)',
            color: 'var(--accent)', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
          }}
        >
          ✨ Generera bästa elvan
        </button>
      </div>

      {/* Drag ghost — follows pointer */}
      {drag && dragPlayer && (
        <div style={{
          position: 'fixed',
          left: drag.x - 22,
          top: drag.y - 30,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'rgba(196,122,58,0.92)',
          border: '2px solid var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 1000,
          transform: 'scale(1.15)',
          boxShadow: '0 4px 18px rgba(196,122,58,0.5)',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 13,
          fontWeight: 800,
          color: '#fff',
        }}>
          {dragPlayer.shirtNumber ?? '?'}
        </div>
      )}
    </div>
  )
}
