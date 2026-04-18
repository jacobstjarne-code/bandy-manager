import { useNavigate } from 'react-router-dom'
import { useGameStore, useManagedClub, useManagedPlayers } from '../store/gameStore'
import { TacticBoardCard } from '../components/tactic/TacticBoardCard'
import type { Tactic } from '../../domain/entities/Club'

export function TaktikScreen() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const club = useManagedClub()
  const players = useManagedPlayers()
  const updateTactic = useGameStore(s => s.updateTactic)
  const coach = game?.assistantCoach
  const captainPlayerId = game?.captainPlayerId

  if (!game || !club || !coach) {
    return (
      <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
        Ingen aktiv säsong.
      </div>
    )
  }

  function handleTacticChange(tactic: Tactic) {
    updateTactic(tactic)
  }

  return (
    <div style={{ padding: '0 0 calc(var(--bottom-nav-height, 60px) + 16px)' }}>
      {/* Back header */}
      <div style={{
        padding: '10px 12px',
        display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: '0.5px solid var(--border)',
        background: 'var(--bg-surface)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none', border: 'none', color: 'var(--accent)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '2px 0',
          }}
        >
          ← Tillbaka
        </button>
        <p style={{
          fontSize: 9, fontWeight: 600, letterSpacing: '2.5px',
          color: 'var(--text-muted)', marginLeft: 'auto',
        }}>
          TAKTIKTAVLAN
        </p>
      </div>

      <div style={{ padding: '8px 12px' }}>
        <TacticBoardCard
          club={club}
          players={players}
          coach={coach}
          captainPlayerId={captainPlayerId}
          chemistryStats={game.chemistryStats ?? {}}
          onTacticChange={handleTacticChange}
        />
      </div>
    </div>
  )
}
