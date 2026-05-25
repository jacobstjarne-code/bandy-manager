import { useNavigate } from 'react-router-dom'
import type { CardRenderProps } from '../portalTypes'
import { Sparkline, MIN_POINTS } from '../../primitives/Sparkline'

/** Minimal-kort: trupp kondition — sparkline om history finns, annars tillgänglighet. */
export function SquadStatusMinimal({ game }: CardRenderProps) {
  const navigate = useNavigate()
  const fitnessPoints = (game.teamFitnessHistory ?? []).slice(-5).map(e => e.avgFitness)
  const hasSparkline = fitnessPoints.length >= MIN_POINTS

  const squadPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  const injuredCount = squadPlayers.filter(p => p.isInjured).length
  const readyCount = Math.max(0, squadPlayers.length - injuredCount)

  const latestFitness = fitnessPoints[fitnessPoints.length - 1]
  const strokeColor = latestFitness === undefined ? 'accent'
    : latestFitness >= 70 ? 'success'
    : latestFitness >= 40 ? 'warm'
    : 'danger'

  return (
    <div
      style={{ textAlign: 'center', cursor: 'pointer' }}
      onClick={() => navigate('/game/taktik')}
    >
      <div style={{ color: 'var(--text-muted)', fontSize: 8, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>
        Kondition
      </div>
      {hasSparkline ? (
        <Sparkline points={fitnessPoints} stroke={strokeColor} height={20} areaFill />
      ) : (
        <div style={{ fontFamily: 'var(--font-display)', color: injuredCount > 0 ? 'var(--warning)' : 'var(--text-light)', fontSize: 13, fontWeight: 600 }}>
          {readyCount}/{squadPlayers.length}
        </div>
      )}
    </div>
  )
}
