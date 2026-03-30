import { useState, useEffect } from 'react'
import type { Club, Tactic } from '../../../domain/entities/Club'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { Player } from '../../../domain/entities/Player'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { FORMATIONS } from '../../../domain/entities/Formation'
import type { FormationType } from '../../../domain/entities/Formation'
import { OpponentInfoCard } from './OpponentInfoCard'
import { OpponentAnalysisCard } from './OpponentAnalysisCard'
import { PitchLineupView } from './PitchLineupView'
import { SlotLineupView } from './SlotLineupView'

interface GroupedPlayers {
  position: string
  players: Player[]
}

interface LineupStepProps {
  opponent: Club | null
  nextFixture: Fixture | null
  game: SaveGame
  squadPlayers: Player[]
  groupedPlayers: GroupedPlayers[]
  startingIds: string[]
  benchIds: string[]
  captainId: string | null
  selectedSlotId: string | null
  tacticState: Tactic
  canPlay: boolean
  injuredInStarting: Player[]
  onTogglePlayer: (pid: string) => void
  onSetCaptain: (pid: string) => void
  onAutoFill: () => void
  onSlotClick: (slotId: string) => void
  onFormationChange: (newTactic: Tactic) => void
  onAssignPlayer: (playerId: string, slotId: string) => void
  onRemovePlayer: (playerId: string) => void
  onError: (err: string) => void
  onNext: () => void
}

export function LineupStep({
  opponent,
  nextFixture,
  game,
  squadPlayers,
  groupedPlayers: _groupedPlayers,
  startingIds,
  benchIds: _benchIds,
  captainId: _captainId,
  selectedSlotId: _selectedSlotId,
  tacticState,
  canPlay,
  injuredInStarting,
  onTogglePlayer,
  onSetCaptain: _onSetCaptain,
  onAutoFill,
  onSlotClick: _onSlotClick,
  onFormationChange,
  onAssignPlayer,
  onRemovePlayer,
  onError,
  onNext,
}: LineupStepProps) {
  const [viewMode, setViewMode] = useState<'list' | 'pitch'>(() => {
    return (localStorage.getItem('bm_lineup_view') as 'list' | 'pitch') ?? 'list'
  })

  useEffect(() => {
    localStorage.setItem('bm_lineup_view', viewMode)
  }, [viewMode])

  // ── PitchLineupView callbacks ──────────────────────────────────────────────

  function handleAssignPlayer(playerId: string, slotId: string) {
    const formationType = (tacticState.formation ?? '3-3-4') as FormationType
    const template = FORMATIONS[formationType]
    const slot = template.slots.find(s => s.id === slotId)
    if (!slot) return

    // Add to startingIds if not already starting
    if (!startingIds.includes(playerId)) {
      onTogglePlayer(playerId)
    }

    // Remove any player already in this slot, then assign
    const existingEntries = Object.entries(tacticState.positionAssignments ?? {})
    const newAssignments: Record<string, typeof slot> = {}
    for (const [pid, s] of existingEntries) {
      if (s.id !== slotId) {
        newAssignments[pid] = s
      }
    }
    newAssignments[playerId] = slot
    onFormationChange({ ...tacticState, positionAssignments: newAssignments })
  }

  function handleRemovePlayer(playerId: string) {
    const newAssignments = { ...(tacticState.positionAssignments ?? {}) }
    delete newAssignments[playerId]
    onFormationChange({ ...tacticState, positionAssignments: newAssignments })
    // Also remove from startingIds
    onTogglePlayer(playerId)
  }

  function handleSwapPlayers(fromSlotId: string, toSlotId: string) {
    const assignments = tacticState.positionAssignments ?? {}
    const fromPid = Object.entries(assignments).find(([, s]) => s.id === fromSlotId)?.[0]
    const toPid = Object.entries(assignments).find(([, s]) => s.id === toSlotId)?.[0]
    if (!fromPid || !toPid) return

    const fromSlot = assignments[fromPid]
    const toSlot = assignments[toPid]
    const newAssignments = { ...assignments, [fromPid]: toSlot, [toPid]: fromSlot }
    onFormationChange({ ...tacticState, positionAssignments: newAssignments })
  }

  return (
    <>
      {opponent && (
        <OpponentInfoCard opponent={opponent} game={game} />
      )}

      {nextFixture && opponent && (
        <OpponentAnalysisCard
          fixture={nextFixture}
          opponent={opponent}
          game={game}
          onError={onError}
        />
      )}

      {/* View toggle */}
      <div style={{
        display: 'flex', margin: '0 16px 12px',
        background: 'var(--bg-elevated)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
      }}>
        <button
          onClick={() => setViewMode('list')}
          style={{
            flex: 1, padding: '10px', fontSize: 13, fontWeight: 600,
            border: 'none', cursor: 'pointer',
            background: viewMode === 'list' ? 'rgba(196,122,58,0.15)' : 'transparent',
            color: viewMode === 'list' ? 'var(--accent)' : 'var(--text-muted)',
            borderRight: '1px solid var(--border)',
            transition: 'background 150ms, color 150ms',
          }}
        >
          📋 Lista
        </button>
        <button
          onClick={() => setViewMode('pitch')}
          style={{
            flex: 1, padding: '10px', fontSize: 13, fontWeight: 600,
            border: 'none', cursor: 'pointer',
            background: viewMode === 'pitch' ? 'rgba(196,122,58,0.15)' : 'transparent',
            color: viewMode === 'pitch' ? 'var(--accent)' : 'var(--text-muted)',
            transition: 'background 150ms, color 150ms',
          }}
        >
          🏒 Planvy
        </button>
      </div>

      {viewMode === 'list' ? (
        <SlotLineupView
          tacticState={tacticState}
          startingIds={startingIds}
          squadPlayers={squadPlayers}
          onAssignPlayer={onAssignPlayer}
          onRemovePlayer={onRemovePlayer}
          onAutoFill={onAutoFill}
          onFormationChange={onFormationChange}
        />
      ) : (
        <PitchLineupView
          tacticState={tacticState}
          startingIds={startingIds}
          squadPlayers={squadPlayers}
          onAssignPlayer={handleAssignPlayer}
          onRemovePlayer={handleRemovePlayer}
          onSwapPlayers={handleSwapPlayers}
          onFormationChange={onFormationChange}
        />
      )}

      <div style={{ padding: '16px 16px 24px' }}>
        {!canPlay && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: 12, color: 'var(--danger)', marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {startingIds.length !== 11 && <span>Välj exakt 11 startspelare (du har {startingIds.length})</span>}
            {injuredInStarting.map(p => (
              <span key={p.id}>⚠️ {p.firstName} {p.lastName} {p.isInjured ? 'är skadad' : `är avstängd (${p.suspensionGamesRemaining} matcher kvar)`}</span>
            ))}
          </div>
        )}
        <button onClick={onNext} disabled={!canPlay} className={`btn ${canPlay ? 'btn-copper' : 'btn-ghost'}`} style={{
          width: '100%', padding: '15px', fontSize: 16, fontWeight: 600,
          cursor: canPlay ? 'pointer' : 'not-allowed',
          opacity: canPlay ? 1 : 0.5,
        }}>
          Välj taktik →
        </button>
      </div>
    </>
  )
}
