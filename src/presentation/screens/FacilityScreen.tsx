import { useGameStore } from '../store/gameStore'
import { useNavigate } from 'react-router-dom'
import { FacilityTab } from '../components/club/FacilityTab'

/**
 * design-d7-bottennav-sju (DOM 2026-09-03, Jacob) — Bygget är inte längre en
 * bottennav-flik; den vanliga vägen dit är Klubb → Bygget (ClubScreen renderar
 * FacilityTab direkt, se ClubScreen.tsx). Den här route:n (`/game/bygget`)
 * lever kvar ENBART som mål för push-baserade djuplänkar (Portal-kortet
 * "bygge klart", Ortskartans arena-nod, hallprövningens tillbaka-pil) — därför
 * alltid en tillbaka-pil, ingen isTab-gren längre.
 */
export default function FacilityScreen() {
  const game = useGameStore(s => s.game)
  const startFacilityBuildNode = useGameStore(s => s.startFacilityBuildNode)
  const decommissionFacilityNode = useGameStore(s => s.decommissionFacilityNode)
  const navigate = useNavigate()

  if (!game) return null

  const managedClub = game.clubs.find(c => c.id === game.managedClubId)

  return (
    <div className="screen-col-layout">
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '0 12px', height: 44, flexShrink: 0,
        borderBottom: '1px solid var(--border)', background: 'var(--bg)',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', padding: '4px 2px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 18, lineHeight: 1 }}
          aria-label="Tillbaka"
        >←</button>
        <span style={{ fontFamily: 'Georgia,serif', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
          {managedClub?.name ?? 'Anläggningen'}
        </span>
      </div>

      {/* Tab-innehåll (delat med Klubb → Bygget) */}
      <div className="screen-scroll" style={{ padding: '12px 12px 24px' }}>
        <FacilityTab
          game={game}
          navigate={navigate}
          startFacilityBuildNode={startFacilityBuildNode}
          decommissionFacilityNode={decommissionFacilityNode}
        />
      </div>
    </div>
  )
}
