import { useState } from 'react'
import type { Player } from '../../../domain/entities/Player'
import type { Tactic } from '../../../domain/entities/Club'
import type { FormationSlot, FormationType } from '../../../domain/entities/Formation'
import { FORMATIONS } from '../../../domain/entities/Formation'
import { PlayerPosition } from '../../../domain/enums'
import { positionShort } from '../../utils/formatters'
import { PlayerPickerSheet } from './PlayerPickerSheet'

interface SlotLineupViewProps {
  tacticState: Tactic
  startingIds: string[]
  squadPlayers: Player[]
  onAssignPlayer: (playerId: string, slotId: string) => void
  onRemovePlayer: (playerId: string) => void
  onAutoFill: () => void
  onFormationChange: (newTactic: Tactic) => void
}

const POSITION_GROUP_LABELS: Partial<Record<PlayerPosition, string>> = {
  [PlayerPosition.Goalkeeper]: 'MÅLVAKT',
  [PlayerPosition.Defender]: 'BACKAR',
  [PlayerPosition.Half]: 'HALVBACKAR',
  [PlayerPosition.Midfielder]: 'HALVBACKAR',
  [PlayerPosition.Forward]: 'FORWARDS',
}

const FORMATION_OPTIONS: FormationType[] = ['5-3-2', '3-3-4', '4-3-3', '3-4-3', '2-3-2-3', '4-2-4']

export function SlotLineupView({
  tacticState,
  startingIds,
  squadPlayers,
  onAssignPlayer,
  onRemovePlayer,
  onAutoFill,
  onFormationChange,
}: SlotLineupViewProps) {
  const [pickerSlot, setPickerSlot] = useState<FormationSlot | null>(null)
  const [showFormationPicker, setShowFormationPicker] = useState(false)

  const formation = (tacticState.formation ?? '5-3-2') as FormationType
  const template = FORMATIONS[formation]
  const assignments = tacticState.positionAssignments ?? {}

  // Reverse map: slotId → playerId
  const slotToPlayer: Record<string, string> = {}
  for (const [pid, slot] of Object.entries(assignments)) {
    slotToPlayer[slot.id] = pid
  }

  void Object.keys(assignments) // used via slotToPlayer

  const availablePlayers = squadPlayers.filter(
    p => !p.isInjured && p.suspensionGamesRemaining <= 0
  )

  // Group slots by position group
  const groupOrder: PlayerPosition[] = [
    PlayerPosition.Goalkeeper,
    PlayerPosition.Defender,
    PlayerPosition.Half,
    PlayerPosition.Midfielder,
    PlayerPosition.Forward,
  ]
  const groupedSlots: Array<{ groupLabel: string; slots: FormationSlot[] }> = []
  for (const pos of groupOrder) {
    const slots = template.slots.filter(s => s.position === pos)
    if (slots.length === 0) continue
    const label = POSITION_GROUP_LABELS[pos] ?? positionShort(pos)
    const existing = groupedSlots.find(g => g.groupLabel === label)
    if (existing) {
      existing.slots.push(...slots)
    } else {
      groupedSlots.push({ groupLabel: label, slots })
    }
  }

  function handleSlotTap(slot: FormationSlot) {
    setPickerSlot(slot)
  }

  function handlePickPlayer(playerId: string) {
    if (!pickerSlot) return
    onAssignPlayer(playerId, pickerSlot.id)
    setPickerSlot(null)
  }

  function handleClearSlot(slot: FormationSlot) {
    const playerId = slotToPlayer[slot.id]
    if (playerId) onRemovePlayer(playerId)
  }

  return (
    <div style={{ padding: '0 16px' }}>
      {/* Formation selector */}
      <div style={{ marginBottom: 12 }}>
        <div
          onClick={() => setShowFormationPicker(v => !v)}
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 12px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600 }}>⚙️ {FORMATIONS[formation].label}</span>
          <span style={{ fontSize: 12, color: 'var(--accent)' }}>{showFormationPicker ? '▲' : '▼'}</span>
        </div>
        {showFormationPicker && (
          <div style={{
            border: '1px solid var(--border)',
            borderTop: 'none',
            borderRadius: '0 0 var(--radius-sm) var(--radius-sm)',
            overflow: 'hidden',
          }}>
            {FORMATION_OPTIONS.map(f => (
              <div
                key={f}
                onClick={() => {
                  onFormationChange({ ...tacticState, formation: f })
                  setShowFormationPicker(false)
                }}
                style={{
                  padding: '10px 12px',
                  fontSize: 13,
                  background: f === formation ? 'rgba(196,122,58,0.08)' : 'var(--bg-elevated)',
                  color: f === formation ? 'var(--accent)' : 'var(--text-primary)',
                  fontWeight: f === formation ? 700 : 400,
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                }}
              >
                {FORMATIONS[f].label}
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                  {FORMATIONS[f].description}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Slot groups */}
      {groupedSlots.map(group => (
        <div key={group.groupLabel} style={{ marginBottom: 12 }}>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '1.5px',
            textTransform: 'uppercase', color: 'var(--text-muted)',
            marginBottom: 6,
          }}>
            {group.groupLabel}
          </p>
          {group.slots.map(slot => {
            const playerId = slotToPlayer[slot.id]
            const player = playerId ? squadPlayers.find(p => p.id === playerId) : null

            return (
              <div
                key={slot.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px',
                  marginBottom: 6,
                  background: player ? 'var(--bg-elevated)' : 'transparent',
                  border: player ? '1px solid var(--border)' : '1.5px dashed rgba(196,122,58,0.35)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {/* Slot badge */}
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                  background: player ? 'rgba(196,122,58,0.15)' : 'rgba(196,122,58,0.06)',
                  border: `1px solid ${player ? 'rgba(196,122,58,0.4)' : 'rgba(196,122,58,0.2)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 800, color: 'var(--accent)',
                }}>
                  {slot.label}
                </div>

                {/* Player info or empty */}
                {player ? (
                  <div
                    onClick={() => handleSlotTap(slot)}
                    style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                  >
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {player.shirtNumber != null && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 4 }}>#{player.shirtNumber}</span>
                      )}
                      {player.lastName}
                    </p>
                    <p style={{ fontSize: 11, color: player.position !== slot.position ? 'var(--warning)' : 'var(--text-muted)', marginTop: 1 }}>
                      {positionShort(player.position)} · {Math.round(player.currentAbility)} CA
                      {player.position !== slot.position && ' · felpos'}
                    </p>
                  </div>
                ) : (
                  <div
                    onClick={() => handleSlotTap(slot)}
                    style={{ flex: 1, cursor: 'pointer' }}
                  >
                    <p style={{ fontSize: 13, color: 'rgba(196,122,58,0.6)', fontStyle: 'italic' }}>
                      välj spelare ›
                    </p>
                  </div>
                )}

                {/* Clear button */}
                {player && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleClearSlot(slot) }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 14, color: 'var(--text-muted)',
                      padding: '4px', lineHeight: 1, flexShrink: 0,
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ))}

      {/* Auto-fill + count */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: startingIds.length === 11 ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>
          {startingIds.length}/11 startande
        </span>
        <button
          onClick={onAutoFill}
          style={{
            padding: '8px 16px', fontSize: 13, fontWeight: 700,
            background: 'rgba(196,122,58,0.08)', border: '1.5px solid var(--accent)',
            color: 'var(--accent)', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
          }}
        >
          ✨ Generera bästa elvan
        </button>
      </div>

      {/* Player picker modal */}
      {pickerSlot && (
        <PlayerPickerSheet
          slotLabel={pickerSlot.label}
          slotPosition={pickerSlot.position}
          availablePlayers={availablePlayers}
          assignedPlayerIds={new Set(
            Object.entries(slotToPlayer)
              .filter(([sid]) => sid !== pickerSlot.id)
              .map(([, pid]) => pid)
          )}
          currentPlayerId={slotToPlayer[pickerSlot.id] ?? null}
          onSelect={handlePickPlayer}
          onClose={() => setPickerSlot(null)}
        />
      )}
    </div>
  )
}
