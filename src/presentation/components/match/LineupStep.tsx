import { useState } from 'react'
import type { Club, Tactic } from '../../../domain/entities/Club'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { Player } from '../../../domain/entities/Player'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { PlayerPosition } from '../../../domain/enums'
import { OpponentInfoCard } from './OpponentInfoCard'
import { OpponentAnalysisCard } from './OpponentAnalysisCard'
import { LineupFormationView } from './LineupFormationView'
import { PitchLineupView } from './PitchLineupView'

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
  onSwapPlayers: (fromSlotId: string, toSlotId: string) => void
  onError: (err: string) => void
  onNext: () => void
}

const GROUP_LABELS: Partial<Record<string, string>> = {
  [PlayerPosition.Goalkeeper]: 'Målvakter',
  [PlayerPosition.Defender]: 'Backar',
  [PlayerPosition.Half]: 'Halvbackar',
  [PlayerPosition.Midfielder]: 'Halvbackar',
  [PlayerPosition.Forward]: 'Forwards',
}

export function LineupStep({
  opponent,
  nextFixture,
  game,
  squadPlayers,
  groupedPlayers,
  startingIds,
  benchIds: _benchIds,
  captainId: _captainId,
  selectedSlotId,
  tacticState,
  canPlay,
  injuredInStarting,
  onTogglePlayer,
  onSetCaptain: _onSetCaptain,
  onAutoFill,
  onSlotClick,
  onFormationChange,
  onAssignPlayer,
  onRemovePlayer,
  onSwapPlayers,
  onError,
  onNext,
}: LineupStepProps) {
  const [viewMode, setViewMode] = useState<'list' | 'pitch'>('list')

  function handlePlayerClick(player: Player) {
    if (player.isInjured || player.suspensionGamesRemaining > 0) return
    if (selectedSlotId) {
      onAssignPlayer(player.id, selectedSlotId)
    } else {
      onTogglePlayer(player.id)
    }
  }

  return (
    <>
      {opponent && <OpponentInfoCard opponent={opponent} game={game} />}
      {nextFixture && opponent && (
        <OpponentAnalysisCard fixture={nextFixture} opponent={opponent} game={game} onError={onError} />
      )}

      {/* Tab switcher */}
      <div style={{ display: 'flex', margin: '0 16px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
        {(['list', 'pitch'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            style={{
              flex: 1,
              padding: '8px 0',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.5px',
              border: 'none',
              cursor: 'pointer',
              background: viewMode === mode ? 'var(--accent)' : 'var(--bg-elevated)',
              color: viewMode === mode ? 'var(--bg-dark)' : 'var(--text-muted)',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {mode === 'list' ? '📋 Lista' : '⚽ Plan'}
          </button>
        ))}
      </div>

      {viewMode === 'list' ? (
        <>
          <LineupFormationView
            tacticState={tacticState}
            startingIds={startingIds}
            squadPlayers={squadPlayers}
            selectedSlotId={selectedSlotId}
            onSlotClick={onSlotClick}
            onFormationChange={onFormationChange}
          />

          {/* Player list */}
          <div style={{ padding: '0 16px 8px' }}>
            {groupedPlayers.map(group => (
              <div key={group.position} style={{ marginBottom: 10 }}>
                <p style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '1.5px',
                  textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4,
                }}>
                  {GROUP_LABELS[group.position] ?? group.position}
                </p>
                {group.players.map(player => {
                  const isStarting = startingIds.includes(player.id)
                  const isUnavailable = player.isInjured || player.suspensionGamesRemaining > 0
                  return (
                    <div
                      key={player.id}
                      onClick={() => handlePlayerClick(player)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '7px 10px', marginBottom: 3,
                        background: isStarting ? 'var(--bg-elevated)' : 'transparent',
                        border: selectedSlotId && !isUnavailable
                          ? '1px solid var(--accent)'
                          : isStarting ? '1px solid var(--border)' : '1px dashed rgba(196,122,58,0.2)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: isUnavailable ? 'default' : 'pointer',
                        opacity: isUnavailable ? 0.4 : 1,
                      }}
                    >
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 26 }}>
                        {player.shirtNumber != null ? `#${player.shirtNumber}` : ''}
                      </span>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: isStarting ? 700 : 400, color: isStarting ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {player.lastName}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {Math.round(player.currentAbility)} CA
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 600, minWidth: 34, textAlign: 'right', color: isUnavailable ? 'var(--danger)' : isStarting ? 'var(--success)' : 'var(--text-muted)' }}>
                        {isUnavailable ? (player.isInjured ? '🩹' : '🚫') : isStarting ? 'START' : 'BÄNK'}
                      </span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Auto-fill */}
          <div style={{ padding: '0 16px 8px', display: 'flex', justifyContent: 'flex-end' }}>
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
        </>
      ) : (
        <PitchLineupView
          tacticState={tacticState}
          startingIds={startingIds}
          squadPlayers={squadPlayers}
          onAssignPlayer={onAssignPlayer}
          onRemovePlayer={onRemovePlayer}
          onSwapPlayers={onSwapPlayers}
          onFormationChange={onFormationChange}
        />
      )}

      {/* Validation + next — always visible */}
      <div style={{ padding: '8px 16px 24px' }}>
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
