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
          style={{
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 700,
            background: 'rgba(196,122,58,0.08)',
            border: '1.5px solid var(--accent)',
            color: 'var(--accent)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
          }}
        >
          ✨ Generera bästa elvan
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
              const posLetter = positionShort(player.position).charAt(0)
              const badgeColor = unavailable
                ? { bg: 'rgba(176,80,64,0.15)', border: 'rgba(176,80,64,0.3)', text: 'var(--danger)' }
                : status === 'start'
                ? { bg: 'rgba(196,122,58,0.15)', border: 'rgba(196,122,58,0.3)', text: 'var(--accent)' }
                : { bg: 'rgba(90,154,74,0.15)', border: 'rgba(90,154,74,0.3)', text: 'var(--success)' }
              return (
                <div key={player.id} style={{
                  display: 'flex', alignItems: 'center', padding: '8px 16px',
                  borderBottom: '1px solid var(--border)', gap: 10,
                  opacity: unavailable ? 0.5 : 1,
                  cursor: unavailable ? 'default' : 'pointer',
                }} onClick={() => !unavailable && onTogglePlayer(player.id)}>
                  <div
                    onClick={(e) => { e.stopPropagation(); if (!unavailable) onSetCaptain(player.id) }}
                    style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: badgeColor.bg, border: `1px solid ${badgeColor.border}`,
                      color: badgeColor.text, fontSize: 11, fontWeight: 800,
                      cursor: unavailable ? 'default' : 'pointer',
                      position: 'relative',
                    }}>
                    {posLetter}
                    {isCaptain && (
                      <span style={{ position: 'absolute', top: -4, right: -4, fontSize: 10 }}>👑</span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                      {player.firstName} {player.lastName}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                      Styrka {Math.round(player.currentAbility)} · Form {Math.round(player.form)}
                    </p>
                  </div>
                  <span
                    className={unavailable ? 'tag tag-red' : status === 'start' ? 'tag tag-green' : status === 'bench' ? 'tag tag-outline' : ''}
                    style={{
                      flexShrink: 0, fontSize: 9, fontWeight: 600,
                      ...(status === 'out' && !unavailable ? { color: 'var(--text-muted)', fontSize: 11 } : {}),
                    }}
                  >
                    {unavailable
                      ? (player.isInjured ? '🩹 Skadad' : `🚫 Avstängd`)
                      : status === 'start' ? 'Start'
                      : status === 'bench' ? 'Bänk'
                      : 'Ute'}
                  </span>
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
