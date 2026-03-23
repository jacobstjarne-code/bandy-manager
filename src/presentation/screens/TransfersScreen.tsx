import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { PlayerPosition } from '../../domain/enums'
import type { Player } from '../../domain/entities/Player'
import { saveSaveGame } from '../../infrastructure/persistence/saveGameStorage'
import { getTransferWindowStatus } from '../../domain/services/transferWindowService'

function formatCurrency(n: number): string {
  return n.toLocaleString('sv-SE') + ' kr'
}

function positionShort(pos: PlayerPosition): string {
  const map: Record<PlayerPosition, string> = {
    [PlayerPosition.Goalkeeper]: 'MV',
    [PlayerPosition.Defender]: 'DEF',
    [PlayerPosition.Half]: 'HALF',
    [PlayerPosition.Midfielder]: 'MID',
    [PlayerPosition.Forward]: 'FWD',
  }
  return map[pos] ?? pos
}

interface RenewModalProps {
  player: Player
  currentSeason: number
  onClose: () => void
  onConfirm: (playerId: string, newSalary: number, years: number) => void
}

function RenewContractModal({ player, currentSeason, onClose, onConfirm }: RenewModalProps) {
  const [newSalary, setNewSalary] = useState(player.salary)
  const [years, setYears] = useState(1)

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 300,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex',
      alignItems: 'flex-end',
      maxWidth: 430,
      margin: '0 auto',
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: '16px 16px 0 0',
        border: '1px solid var(--border)',
        borderBottom: 'none',
        padding: '24px 20px',
        width: '100%',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
              Förläng kontrakt
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              {player.firstName} {player.lastName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              width: 32,
              height: 32,
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>

        {/* Current contract info */}
        <div style={{
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 12px',
          marginBottom: 20,
          border: '1px solid var(--border)',
        }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Nuvarande: {formatCurrency(player.salary)}/mån · kontrakt t.o.m. säsong {player.contractUntilSeason}
          </p>
        </div>

        {/* New salary input */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
            Ny lön (kr/mån)
          </label>
          <input
            type="number"
            value={newSalary}
            onChange={e => setNewSalary(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 15,
            }}
          />
        </div>

        {/* Years selector */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
            Antal år
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3].map(y => (
              <button
                key={y}
                onClick={() => setYears(y)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  background: years === y ? 'var(--accent)' : 'var(--bg-elevated)',
                  border: '1px solid ' + (years === y ? 'var(--accent)' : 'var(--border)'),
                  color: years === y ? '#fff' : 'var(--text-secondary)',
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                {y} år
              </button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
            Nytt slutdatum: säsong {currentSeason + years}
          </p>
        </div>

        <button
          onClick={() => onConfirm(player.id, newSalary, years)}
          style={{
            width: '100%',
            padding: '14px',
            background: 'var(--accent)',
            color: '#fff',
            borderRadius: 'var(--radius)',
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          Förläng kontrakt
        </button>
      </div>
    </div>
  )
}

export function TransfersScreen() {
  const game = useGameStore(s => s.game)
  const [renewingPlayerId, setRenewingPlayerId] = useState<string | null>(null)

  if (!game) return null

  const managedClubPlayers = game.players.filter(p => p.clubId === game.managedClubId)

  // Expiring contracts: contractUntilSeason <= currentSeason + 1
  const expiringPlayers = managedClubPlayers
    .filter(p => p.contractUntilSeason <= game.currentSeason + 1)
    .sort((a, b) => a.contractUntilSeason - b.contractUntilSeason)

  const freeAgents = game.transferState.freeAgents
  const windowInfo = getTransferWindowStatus(game.currentDate)
  const windowOpen = windowInfo.status !== 'closed'

  const renewingPlayer = renewingPlayerId ? game.players.find(p => p.id === renewingPlayerId) ?? null : null

  function handleRenew(playerId: string, newSalary: number, years: number) {
    if (!game) return
    const updatedPlayers = game.players.map(p =>
      p.id === playerId
        ? { ...p, contractUntilSeason: game.currentSeason + years, salary: newSalary }
        : p
    )
    const updatedGame = { ...game, players: updatedPlayers }
    useGameStore.setState({ game: updatedGame })
    saveSaveGame(updatedGame)
    setRenewingPlayerId(null)
  }

  function handleSignFreeAgent(agentId: string) {
    if (!game) return
    const updatedPlayers = game.players.map(p =>
      p.id === agentId ? { ...p, clubId: game.managedClubId } : p
    )
    const updatedFreeAgents = game.transferState.freeAgents.filter(p => p.id !== agentId)
    const updatedGame = {
      ...game,
      players: updatedPlayers,
      transferState: { ...game.transferState, freeAgents: updatedFreeAgents },
    }
    useGameStore.setState({ game: updatedGame })
    saveSaveGame(updatedGame)
  }

  return (
    <div style={{ padding: '20px 16px', overflowY: 'auto', height: '100%' }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Transfers</h2>

      {/* Transfer window status banner */}
      <div style={{
        background: windowInfo.status === 'open'
          ? 'rgba(34,197,94,0.08)'
          : windowInfo.status === 'winter'
          ? 'rgba(59,130,246,0.08)'
          : 'rgba(239,68,68,0.06)',
        border: `1px solid ${
          windowInfo.status === 'open'
            ? 'rgba(34,197,94,0.3)'
            : windowInfo.status === 'winter'
            ? 'rgba(59,130,246,0.3)'
            : 'rgba(239,68,68,0.2)'
        }`,
        borderRadius: 'var(--radius)',
        padding: '12px 14px',
        marginBottom: 20,
      }}>
        <p style={{
          fontSize: 13,
          fontWeight: 700,
          color: windowInfo.status === 'open'
            ? 'var(--success)'
            : windowInfo.status === 'winter'
            ? '#60a5fa'
            : 'var(--danger)',
          marginBottom: 4,
        }}>
          {windowInfo.status === 'open' ? '🟢' : windowInfo.status === 'winter' ? '🔵' : '🔴'} {windowInfo.label}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {windowInfo.description}
        </p>
      </div>

      {/* Expiring contracts section */}
      <div style={{ marginBottom: 24 }}>
        <p style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          color: 'var(--text-muted)',
          marginBottom: 12,
        }}>
          Utgående kontrakt
        </p>

        {expiringPlayers.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', padding: '12px 0' }}>
            Inga kontrakt utgår snart.
          </p>
        ) : (
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
          }}>
            {expiringPlayers.map((player, index) => (
              <div
                key={player.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderBottom: index < expiringPlayers.length - 1 ? '1px solid var(--border)' : 'none',
                  gap: 10,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {player.firstName} {player.lastName}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {positionShort(player.position)} · {formatCurrency(player.salary)}/mån · t.o.m. {player.contractUntilSeason}
                  </p>
                </div>
                <button
                  onClick={() => setRenewingPlayerId(player.id)}
                  style={{
                    flexShrink: 0,
                    padding: '6px 12px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--accent)',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Förläng
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Free agents section */}
      <div>
        <p style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          color: 'var(--text-muted)',
          marginBottom: 12,
        }}>
          Fria agenter
        </p>

        {freeAgents.length === 0 ? (
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '20px 16px',
          }}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Inga fria agenter tillgängliga just nu. Fria agenter dyker upp vid säsongsslut.
            </p>
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
          }}>
            {freeAgents.map((agent, index) => (
              <div
                key={agent.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderBottom: index < freeAgents.length - 1 ? '1px solid var(--border)' : 'none',
                  gap: 10,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {agent.firstName} {agent.lastName}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {positionShort(agent.position)} · Styrka {Math.round(agent.currentAbility)} · {formatCurrency(agent.salary)}/mån
                  </p>
                </div>
                <button
                  onClick={() => windowOpen && handleSignFreeAgent(agent.id)}
                  disabled={!windowOpen}
                  style={{
                    flexShrink: 0,
                    padding: '6px 12px',
                    background: windowOpen ? 'var(--accent)' : 'var(--bg-elevated)',
                    border: windowOpen ? 'none' : '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    color: windowOpen ? '#fff' : 'var(--text-muted)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: windowOpen ? 'pointer' : 'not-allowed',
                    opacity: windowOpen ? 1 : 0.6,
                  }}
                >
                  Värva
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Renew modal */}
      {renewingPlayer && (
        <RenewContractModal
          player={renewingPlayer}
          currentSeason={game.currentSeason}
          onClose={() => setRenewingPlayerId(null)}
          onConfirm={handleRenew}
        />
      )}
    </div>
  )
}
