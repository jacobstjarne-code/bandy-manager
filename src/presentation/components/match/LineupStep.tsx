import type { Club, Tactic } from '../../../domain/entities/Club'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { Player } from '../../../domain/entities/Player'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { PlayerPosition } from '../../../domain/enums'
import { positionShort } from '../../utils/formatters'
import { OpponentInfoCard } from './OpponentInfoCard'
import { OpponentAnalysisCard } from './OpponentAnalysisCard'
import { LineupFormationView } from './LineupFormationView'

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
  onError: (err: string) => void
  onNext: () => void
}

export function LineupStep({
  opponent,
  nextFixture,
  game,
  squadPlayers,
  groupedPlayers,
  startingIds,
  benchIds,
  captainId,
  selectedSlotId,
  tacticState,
  canPlay,
  injuredInStarting,
  onTogglePlayer,
  onSetCaptain,
  onAutoFill,
  onSlotClick,
  onFormationChange,
  onError,
  onNext,
}: LineupStepProps) {
  function getStatus(pid: string): 'start' | 'bench' | 'out' {
    if (startingIds.includes(pid)) return 'start'
    if (benchIds.includes(pid)) return 'bench'
    return 'out'
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

      <LineupFormationView
        tacticState={tacticState}
        startingIds={startingIds}
        squadPlayers={squadPlayers}
        selectedSlotId={selectedSlotId}
        onSlotClick={onSlotClick}
        onFormationChange={onFormationChange}
      />

      <div style={{ padding: '0 16px 6px' }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
          Spelare placeras automatiskt. Manuell placering i framtida version.
        </p>
      </div>

      <div style={{ padding: '0 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: startingIds.length === 11 ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>
          {startingIds.length}/11 startande
        </span>
        <button
          onClick={onAutoFill}
          className="btn btn-outline"
          style={{
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          ⚡ Bästa elvan
        </button>
      </div>

      <div style={{ flex: 1 }}>
        {groupedPlayers.map(group => (
          <div key={group.position}>
            <div style={{ padding: '6px 16px', background: 'var(--bg)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>
                {positionShort(group.position as PlayerPosition)}
              </span>
            </div>
            {group.players.map(player => {
              const status = getStatus(player.id)
              const isCaptain = player.id === captainId
              const unavailable = player.isInjured || player.suspensionGamesRemaining > 0
              return (
                <div key={player.id} style={{
                  display: 'flex', alignItems: 'center', padding: '10px 16px',
                  borderBottom: '1px solid var(--border)', gap: 10,
                  background: unavailable ? 'rgba(239,68,68,0.04)' : 'transparent',
                  opacity: unavailable ? 0.55 : 1,
                }}>
                  <button onClick={() => onSetCaptain(player.id)} disabled={unavailable} style={{
                    background: 'none', border: 'none', fontSize: 14,
                    opacity: isCaptain ? 1 : 0.2,
                    cursor: unavailable ? 'not-allowed' : 'pointer', flexShrink: 0, padding: 0,
                  }} title="Kapten">👑</button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {player.firstName} {player.lastName}
                      {player.isInjured && <span style={{ marginLeft: 4, fontSize: 12 }}>🩹</span>}
                      {player.suspensionGamesRemaining > 0 && <span style={{ marginLeft: 4, fontSize: 12 }}>🚫</span>}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>
                      Styrka {Math.round(player.currentAbility)} · Form {Math.round(player.form)}
                    </p>
                  </div>
                  <button onClick={() => onTogglePlayer(player.id)} disabled={unavailable} style={{
                    flexShrink: 0, padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                    cursor: unavailable ? 'not-allowed' : 'pointer',
                    ...(unavailable
                      ? { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)' }
                      : status === 'start'
                      ? { background: 'rgba(196,122,58,0.15)', border: '1px solid var(--accent)', color: 'var(--accent)' }
                      : status === 'bench'
                      ? { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }
                      : { background: 'transparent', border: '1px solid transparent', color: 'var(--text-muted)' }),
                  }}>
                    {unavailable ? (player.isInjured ? 'Skadad' : 'Avstängd') : status === 'start' ? 'Start' : status === 'bench' ? 'Bänk' : 'Ute'}
                  </button>
                </div>
              )
            })}
          </div>
        ))}
      </div>

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
