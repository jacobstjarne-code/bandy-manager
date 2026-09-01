import { useState } from 'react'
import type { Player } from '../../../domain/entities/Player'
import type { Tactic } from '../../../domain/entities/Club'
import type { FormationType } from '../../../domain/entities/Formation'
import { FORMATIONS } from '../../../domain/entities/Formation'
import { BandyPitch } from '../BandyPitch'
import { PlayerPill } from './DraggablePlayerPill'
import { PlayerPosition } from '../../../domain/enums'
import { getPositionFit as getPositionFitScore } from '../../../domain/utils/positionFit'

/** Position-fit — grön/gul/röd (DS-regel 13). Delad med LineupStep:s
 * practice-läge (Tillträdet, Sätt elvan) för spotlight-fyndet av en fel-
 * placerad spelare. */
export type PositionFit = 'green' | 'amber' | 'red'

export function getPositionFit(playerPosition: PlayerPosition, slotPosition: PlayerPosition): PositionFit {
  const score = getPositionFitScore(playerPosition, slotPosition)
  if (score === 1) return 'green'
  if (score === 0.9) return 'amber'
  return 'red'
}

interface PitchLineupViewProps {
  tacticState: Tactic
  startingIds: string[]
  squadPlayers: Player[]
  onAssignPlayer: (playerId: string, slotId: string) => void
  onRemovePlayer: (playerId: string) => void
  onSwapPlayers: (fromSlotId: string, toSlotId: string) => void
  /** Practice-läge (Tillträdet, beat 3): dimma alla utom denna slot, som
   * glödmarkeras. Rent visuellt — interaktionen är oförändrad på alla slots. */
  spotlightSlotId?: string | null
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
  spotlightSlotId,
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
    p.suspensionGamesRemaining === 0 &&
    // A-H3 (DOM_AH3_TILLGANGLIGHET_2026-08-28.md): vilande/överbelastad efter
    // förra matchens sannolikhetskast — skild från isInjured, men samma
    // konsekvens för valbarhet.
    (p.restGamesRemaining ?? 0) === 0
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
              const fit = player ? getPositionFit(player.position, slot.position) : null
              const ringColor = fit === 'green' ? 'var(--success)' : fit === 'amber' ? 'var(--warning)' : fit === 'red' ? 'var(--danger)' : 'var(--accent)'

              const isSpotlighted = spotlightSlotId === slot.id
              const isDimmed = !!spotlightSlotId && !isSpotlighted

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
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                    opacity: isDimmed ? 0.3 : 1,
                    transition: 'opacity 220ms',
                    animation: isEmpty
                      ? 'pitchSlotPulse 1.2s ease-in-out infinite'
                      : 'none',
                  }}
                >
                  {/* Circle with shirt number or position label */}
                  <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: isEmpty
                      ? 'transparent'
                      : isSelected
                        ? `color-mix(in srgb, var(--accent) 60%, transparent)`
                        : `color-mix(in srgb, ${ringColor} 50%, transparent)`,
                    border: isEmpty
                      ? `1.5px dashed color-mix(in srgb, var(--ink) ${isTarget ? '70' : '30'}%, transparent)`
                      : isSelected
                        ? '2px solid var(--accent)'
                        : `${isSpotlighted ? 2.4 : 1.5}px solid color-mix(in srgb, ${ringColor} 75%, transparent)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isEmpty ? 8 : 12,
                    fontWeight: 800,
                    color: isEmpty ? 'var(--text-secondary)' : 'var(--text-primary)',
                    transition: 'background 120ms, border-color 120ms, transform 120ms',
                    transform: isSelected ? 'scale(1.18)' : isSpotlighted ? 'scale(1.16)' : isTarget ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: isSelected
                      ? '0 0 8px color-mix(in srgb, var(--accent) 35%, transparent)'
                      : isSpotlighted
                        ? `0 0 11px color-mix(in srgb, ${ringColor} 65%, transparent)`
                        : 'none',
                    fontFamily: 'system-ui, sans-serif',
                    flexShrink: 0,
                  }}>
                    {player
                      ? (player.shirtNumber != null ? String(player.shirtNumber) : '?')
                      : slot.label.toUpperCase()}
                  </div>

                  {/* Player name below circle */}
                  {player && (
                    <span style={{
                      fontSize: 8,
                      fontWeight: 700,
                      color: 'var(--ink, var(--text-primary))',
                      textAlign: 'center',
                      maxWidth: 44,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      lineHeight: 1,
                      textShadow: '0 0 3px rgba(255,255,255,0.8)',
                    }}>
                      {player.lastName}
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
                background: 'color-mix(in srgb, var(--danger) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--danger) 25%, transparent)',
                color: 'var(--danger)', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              }}
            >
              Ta bort från planen
            </button>
          )}
        </div>
      )}

      {/* Pitch legend — numbers + names */}
      {Object.keys(slotToPlayer).length > 0 && (
        <div style={{ padding: '4px 16px 8px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {template.slots.map(slot => {
            const pid = slotToPlayer[slot.id]
            const player = pid ? squadPlayers.find(p => p.id === pid) : null
            if (!player) return null
            return (
              <span key={slot.id} style={{ fontSize: 10, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 700 }}>{player.shirtNumber ?? '?'}</span>{' '}
                {player.lastName}
                <span style={{ color: 'var(--text-muted)' }}> ({slot.label})</span>
                {slot !== template.slots[template.slots.length - 1] && <span style={{ color: 'var(--border-dark)', margin: '0 2px' }}>·</span>}
              </span>
            )
          })}
        </div>
      )}

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
