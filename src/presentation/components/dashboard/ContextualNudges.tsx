import { useNavigate } from 'react-router-dom'
import type { SaveGame } from '../../../domain/entities/SaveGame'

interface Props {
  game: SaveGame
  currentRound: number
}

interface Nudge {
  icon: string
  text: string
  path: string
}

export function ContextualNudges({ game, currentRound: _r }: Props) {
  const navigate = useNavigate()
  const nudges: Nudge[] = []

  const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)

  const criticalFitness = managedPlayers.filter(p => p.fitness < 30 && !p.isInjured)
  if (criticalFitness.length >= 2)
    nudges.push({ icon: '⚡', text: `${criticalFitness.length} spelare med kritisk fitness — byt träningsfokus?`, path: '/game/club' })

  const expiringContracts = managedPlayers.filter(p =>
    (p.contractUntilSeason ?? 0) <= (game.currentSeason ?? 2025) + 1 && (p.currentAbility ?? 0) > 55
  )
  if (expiringContracts.length > 0)
    nudges.push({ icon: '📋', text: `${expiringContracts[0].firstName} ${expiringContracts[0].lastName} — kontrakt löper ut snart`, path: '/game/transfers' })

  if ((managedClub?.finances ?? 0) < -50000)
    nudges.push({ icon: '💸', text: 'Kassan är negativ — se budgeten', path: '/game/budget' })

  if (game.licenseReview?.status === 'warning' || game.licenseReview?.status === 'continued_review')
    nudges.push({ icon: '🏛️', text: 'Licensnämnden kräver åtgärder', path: '/game/budget' })

  const freshReport = Object.values(game.scoutReports ?? {}).find(r => r.scoutedSeason === game.currentSeason)
  if (freshReport) {
    const player = game.players.find(p => p.id === freshReport.playerId)
    if (player && game.inbox.some(i => i.type === 'scoutReport' && !i.isRead))
      nudges.push({ icon: '🔍', text: `Scoutrapport klar: ${player.firstName} ${player.lastName}`, path: '/game/transfers' })
  }

  const readyYouth = game.youthTeam?.players?.find(p => p.readyForPromotion)
  if (readyYouth)
    nudges.push({ icon: '⭐', text: `${readyYouth.firstName} ${readyYouth.lastName} kan vara redo för A-laget`, path: '/game/club' })

  if (game.patron?.isActive && (game.patron.happiness ?? 50) < 30)
    nudges.push({ icon: '😤', text: `${game.patron.name} är missnöjd — agera`, path: '/game/club' })

  if (nudges.length === 0) return null

  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#4A6080', marginBottom: 8 }}>
        ATT TÄNKA PÅ
      </p>
      {nudges.slice(0, 3).map((n, i) => (
        <div
          key={i}
          onClick={() => navigate(n.path)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', marginBottom: 6,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 8, cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 14 }}>{n.icon}</span>
          <span style={{ fontSize: 13, color: '#8A9BB0', flex: 1 }}>{n.text}</span>
          <span style={{ fontSize: 14, color: '#4A6080' }}>›</span>
        </div>
      ))}
    </div>
  )
}
