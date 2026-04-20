import { useState } from 'react'
import type { Club, Tactic } from '../../../domain/entities/Club'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { Player } from '../../../domain/entities/Player'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { PlayerPosition } from '../../../domain/enums'
import { positionShort } from '../../utils/formatters'
import { OpponentAnalysisCard } from './OpponentAnalysisCard'
import { LineupFormationView } from './LineupFormationView'
import { PitchLineupView } from './PitchLineupView'
import { MatchDayProgram } from './MatchDayProgram'

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
  [PlayerPosition.Goalkeeper]: '🧤 Målvakter',
  [PlayerPosition.Defender]: '🛡 Backar',
  [PlayerPosition.Half]: '🏒 Ytterhalvar',
  [PlayerPosition.Midfielder]: '⚙️ Mittfältare',
  [PlayerPosition.Forward]: '⚔️ Anfallare',
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
      {/* Matchdagsprogram — expandable pre-match briefing */}
      {nextFixture && opponent && (() => {
        const managedClub = game.clubs.find(c => c.id === game.managedClubId)
        if (!managedClub) return null
        return (
          <MatchDayProgram
            fixture={nextFixture}
            opponent={opponent}
            managedClub={managedClub}
            game={game}
            myPlayers={squadPlayers}
          />
        )
      })()}

      {/* Opponent info — single combined card */}
      {nextFixture && opponent && (
        <OpponentAnalysisCard fixture={nextFixture} opponent={opponent} game={game} onError={onError} />
      )}

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        margin: '0 0 12px',
      }}>
        {(['list', 'pitch'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            style={{
              flex: 1,
              padding: '10px 4px',
              background: 'none',
              border: 'none',
              borderBottom: viewMode === mode ? '2px solid var(--accent)' : '2px solid transparent',
              color: viewMode === mode ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {mode === 'list' ? '📋 Lista' : '🏒 Plan'}
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

          {/* Auto-fill — direkt efter plangrafiken */}
          <div style={{ padding: '0 12px 6px', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={onAutoFill} className="btn btn-ghost" style={{
              padding: '8px 16px', fontSize: 13, fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}>
              ✨ Generera bästa elvan
            </button>
          </div>

          {/* Player list */}
          <div style={{ padding: '0 12px 8px' }}>
            {groupedPlayers.map(group => (
              <div key={group.position} style={{ marginBottom: 6 }}>
                <p style={{
                  fontSize: 8, fontWeight: 600, letterSpacing: '2px',
                  textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 2,
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
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '4px 8px',
                        background: isStarting ? 'rgba(90,154,74,0.06)' : 'transparent',
                        borderBottom: '1px solid var(--border)',
                        cursor: isUnavailable ? 'default' : 'pointer',
                        opacity: isUnavailable ? 0.4 : 1,
                      }}
                    >
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 700,
                        border: isStarting ? '2px solid var(--success)' : '1.5px solid var(--border)',
                        color: isStarting ? 'var(--success)' : 'var(--text-muted)',
                        flexShrink: 0,
                      }}>
                        {player.shirtNumber ?? '?'}
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 20, flexShrink: 0 }}>
                        {positionShort(player.position)}
                      </span>
                      <span style={{ flex: 1, fontSize: 12, fontWeight: isStarting ? 700 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {player.lastName}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', flexShrink: 0 }}>
                        {Math.round(player.currentAbility)}
                      </span>
                      <span style={{
                        fontSize: 9, fontWeight: 600, width: 28, textAlign: 'right', flexShrink: 0,
                        color: isUnavailable ? 'var(--danger)' : isStarting ? 'var(--success)' : 'var(--text-muted)',
                      }}>
                        {isUnavailable ? (player.isInjured ? '🩹' : '🚫') : isStarting ? 'START' : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            ))}
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
          onAutoFill={onAutoFill}
        />
      )}

      {/* Validation + next — always visible */}
      <div style={{ padding: '8px 12px 24px' }}>
        {!canPlay && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: 12, color: 'var(--danger)', marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {startingIds.length !== 11 && <span>Välj exakt 11 startspelare (du har {startingIds.length})</span>}
            {injuredInStarting.map(p => (
              <span key={p.id}>⚠️ {p.firstName} {p.lastName} {p.isInjured ? 'är skadad' : `är avstängd (${p.suspensionGamesRemaining} matcher kvar)`}</span>
            ))}
          </div>
        )}
        {canPlay && !startingIds.some(id => squadPlayers.find(p => p.id === id)?.position === PlayerPosition.Goalkeeper) && (
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: 12, color: 'var(--warning)', marginBottom: 10 }}>
            ⚠️ Ingen målvakt i startelvan — en utespelare får gå i mål.
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
