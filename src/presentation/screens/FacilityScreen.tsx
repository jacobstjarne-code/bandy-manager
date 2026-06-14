import { useGameStore } from '../store/gameStore'
import { useNavigate } from 'react-router-dom'
import { FacilityTree } from '../components/club/FacilityTree'

export default function FacilityScreen() {
  const game = useGameStore(s => s.game)
  const navigate = useNavigate()

  if (!game) return null

  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  const facilityState = game.facilityState ?? { builtNodeIds: [] }

  return (
    <div className="screen-col-layout">
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '0 12px', height: 44, flexShrink: 0,
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none', border: 'none', padding: '4px 2px',
            cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 18,
            lineHeight: 1,
          }}
          aria-label="Tillbaka"
        >
          ←
        </button>
        <span style={{ fontFamily: 'Georgia,serif', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
          {managedClub?.name ?? 'Anläggningen'}
        </span>
      </div>

      {/* Tree */}
      <div className="screen-scroll" style={{ padding: '12px 12px 24px' }}>
        <FacilityTree
          facilityState={facilityState}
          currentMatchday={game.currentMatchday}
          currentSeason={game.currentSeason}
          mode="betrakta"
          clubName={managedClub?.arenaName ?? managedClub?.name}
        />
      </div>
    </div>
  )
}
