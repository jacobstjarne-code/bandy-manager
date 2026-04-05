import { useState } from 'react'
import type { Player } from '../../../domain/entities/Player'
import type { Tactic } from '../../../domain/entities/Club'
import type { FormationType } from '../../../domain/entities/Formation'
import { FORMATIONS } from '../../../domain/entities/Formation'
import { BandyPitch } from '../BandyPitch'
import { PlayerPill } from './DraggablePlayerPill'

const ADJACENT_POS: Record<string, string[]> = {
  goalkeeper: [],
  defender: ['half'],
  half: ['defender', 'midfielder'],
  midfielder: ['half', 'forward'],
  forward: ['midfielder'],
}

interface PitchLineupViewProps {
  tacticState: Tactic
  startingIds: string[]
  squadPlayers: Player[]
  onAssignPlayer: (playerId: string, slotId: string) => void
  onRemovePlayer: (playerId: string) => void
  onSwapPlayers: (fromSlotId: string, toSlotId: string) => void
  onFormationChange: (newTactic: Tactic) => void
  onAutoFill: () => void
}

type Selection =
  | { type: 'pill'; playerId: string }
  | { type: 'slot'; slotId: string; playerId: string }
  | null

export function PitchLineupView({
  tacticState,
  startingIds,
  squadPlayers,
  onAssignPlayer,
  onRemovePlayer,
  onSwapPlayers,
  onFormationChange,
  onAutoFill,
}: PitchLineupViewProps) {
  const [selection, setSelection] = useState<Selection>(null)

  const formationType = (tacticState.formation ?? '3-3-4') as FormationType
  const template = FORMATIONS[formationType]

  // lineupSlots is the canonical mapping: slotId → playerId | null
  const slotToPlayer: Record<string, string> = {}
  for (const [slotId, pid] of Object.entries(tacticState.lineupSlots ?? {})) {
    if (pid && startingIds.includes(pid)) slotToPlayer[slotId] = pid
  }

  // All available players not yet placed on the pitch
  const placedPids = new Set(Object.values(slotToPlayer))
  const pillPlayers = squadPlayers.filter(p =>
    !placedPids.has(p.id) &&
    !p.isInjured &&
    p.suspensionGamesRemaining === 0
  )

  // ── Tap handlers ──────────────────────────────────────────────────────────

  function handlePillTap(playerId: string) {
    if (selection?.type === 'pill' && selection.playerId === playerId) {
      setSelection(null) // deselect
    } else {
      setSelection({ type: 'pill', playerId })
    }
  }

  function handleSlotTap(slotId: string) {
    const existingPid = slotToPlayer[slotId]

    if (selection === null) {
      // Tapping an occupied slot selects that player for swap/move
      if (existingPid) {
        setSelection({ type: 'slot', slotId, playerId: existingPid })
      }
      return
    }

    if (selection.type === 'pill') {
      // Place unplaced player into slot
      onAssignPlayer(selection.playerId, slotId)
      setSelection(null)
      return
    }

    if (selection.type === 'slot') {
      if (selection.slotId === slotId) {
        // Tap same slot → deselect
        setSelection(null)
        return
      }
      if (existingPid) {
        // Both slots occupied → swap
        onSwapPlayers(selection.slotId, slotId)
      } else {
        // Move selected player to empty slot
        onAssignPlayer(selection.playerId, slotId)
      }
      setSelection(null)
      return
    }
  }

  function handleRemove(playerId: string) {
    onRemovePlayer(playerId)
    setSelection(null)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ userSelect: 'none' }}>
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
            onFormationChange({ ...tacticState, formation: e.target.value as FormationType })
            setSelection(null)
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
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <div style={{ position: 'relative' }}>
          <BandyPitch width="100%" />

          {/* Slot overlay — position: absolute fills the SVG */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {template.slots.map(slot => {
              const pid = slotToPlayer[slot.id]
              const player = pid ? squadPlayers.find(p => p.id === pid) ?? null : null
              const isEmpty = !player
              const isSelected = selection?.type === 'slot' && selection.slotId === slot.id
              const isTarget = selection !== null && !isSelected

              // Slot at top% = (1 - slot.y/100)*100%, left% = slot.x%
              const topPct = (1 - slot.y / 100) * 100
              const leftPct = slot.x

              // Position-match color
              let ringColor = 'var(--accent)'
              if (player) {
                if (player.position === slot.position) ringColor = 'var(--success)'
                else if (ADJACENT_POS[player.position]?.includes(slot.position)) ringColor = 'var(--warning)'
                else ringColor = 'var(--danger)'
              }

              return (
                <div
                  key={slot.id}
                  onClick={() => handleSlotTap(slot.id)}
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
                    animation: isEmpty && selection !== null
                      ? 'pitchSlotPulse 1.2s ease-in-out infinite'
                      : 'none',
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

                  {/* Circle */}
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
                      ? `1.5px dashed rgba(26,26,24,${isTarget ? '0.7' : '0.3'})`
                      : isSelected
                        ? '2px solid var(--accent)'
                        : `1.5px solid color-mix(in srgb, ${ringColor} 55%, transparent)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isEmpty ? 7 : 10,
                    fontWeight: 800,
                    color: isEmpty ? 'rgba(26,26,24,0.4)' : '#1A1A18',
                    transition: 'background 120ms, border-color 120ms, transform 120ms',
                    transform: isSelected ? 'scale(1.18)' : isTarget ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: isSelected ? '0 0 8px rgba(196,122,58,0.5)' : 'none',
                    fontFamily: 'system-ui, sans-serif',
                  }}>
                    {player
                      ? (player.shirtNumber != null ? String(player.shirtNumber) : '?')
                      : slot.label.slice(0, 2)}
                  </div>

                  {/* Player name below */}
                  {player && (
                    <span style={{
                      position: 'absolute',
                      bottom: -2,
                      fontSize: 7,
                      fontWeight: 600,
                      color: 'rgba(26,26,24,0.65)',
                      fontFamily: 'system-ui, sans-serif',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                    }}>
                      {player.lastName.slice(0, 5)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Selection hint */}
      {selection && (
        <div style={{ padding: '0 16px 8px', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
            {selection.type === 'pill'
              ? 'Tryck på en plats på planen för att placera spelaren'
              : 'Tryck på annan plats för att flytta, eller tryck igen för att avmarkera'}
          </p>
          {selection.type === 'slot' && (
            <button
              onClick={() => handleRemove(selection.playerId)}
              style={{
                marginTop: 6, padding: '5px 14px', fontSize: 11, fontWeight: 600,
                background: 'rgba(176,80,64,0.08)', border: '1px solid rgba(176,80,64,0.25)',
                color: 'var(--danger)', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              }}
            >
              Ta bort från planen
            </button>
          )}
        </div>
      )}

      {/* Auto-fill — direkt efter planen */}
      <div style={{ padding: '6px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 12,
          color: startingIds.length === 11 ? 'var(--success)' : 'var(--warning)',
          fontWeight: 600,
        }}>
          {(() => {
            const emptySlots = template.slots.filter(s => !slotToPlayer[s.id]).map(s => s.label)
            if (emptySlots.length === 0) return '11/11 startande ✅'
            return `${11 - emptySlots.length}/11 — saknas: ${emptySlots.join(', ')}`
          })()}
        </span>
        <button
          onClick={onAutoFill}
          className="btn btn-ghost"
          style={{
            padding: '8px 16px', fontSize: 13, fontWeight: 600,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          ✨ Generera bästa elvan
        </button>
      </div>

      {/* Unplaced players — tap to select */}
      <div style={{ padding: '10px 16px 4px', borderTop: '1px solid var(--border)' }}>
        <p style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '1.5px',
          textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8,
        }}>
          Oplacerade — tryck för att välja
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {pillPlayers.map(p => (
            <PlayerPill
              key={p.id}
              player={p}
              isSelected={selection?.type === 'pill' && selection.playerId === p.id}
              onTap={handlePillTap}
            />
          ))}
          {pillPlayers.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Alla spelare placerade
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
