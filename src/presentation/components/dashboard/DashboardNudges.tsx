import type { NavigateFunction } from 'react-router-dom'
import type { SaveGame } from '../../../domain/entities/SaveGame'

interface Nudge {
  color: 'red' | 'yellow' | 'green'
  text: string
  onClick: () => void
}

function generateNudges(game: SaveGame, navigate: NavigateFunction): Nudge[] {
  const nudges: Nudge[] = []

  // 🔴 Injuries
  const squadPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  const injuredCount = squadPlayers.filter(p => p.isInjured).length
  if (injuredCount > 0) {
    nudges.push({
      color: 'red',
      text: `${injuredCount} skadad${injuredCount > 1 ? 'e' : ''} — kolla truppen`,
      onClick: () => navigate('/game/squad'),
    })
  }

  // 🔴 Expiring contracts
  const expiringPlayer = squadPlayers.find(p => p.contractUntilSeason <= game.currentSeason + 1)
  if (expiringPlayer && nudges.length < 3) {
    nudges.push({
      color: 'red',
      text: `Förläng kontrakt: ${expiringPlayer.firstName} ${expiringPlayer.lastName} (1 säs kvar)`,
      onClick: () => navigate('/game/transfers'),
    })
  }

  // 🟡 Low form (avg CA under 40)
  if (nudges.length < 3 && squadPlayers.length > 0) {
    const avgCA = squadPlayers.reduce((s, p) => s + p.currentAbility, 0) / squadPlayers.length
    if (avgCA < 40) {
      nudges.push({
        color: 'yellow',
        text: 'Snittstyrka under 40 — byt träningsfokus?',
        onClick: () => navigate('/game/club', { state: { tab: 'training' } }),
      })
    }
  }

  // 🟡 Ready scout reports
  if (nudges.length < 3) {
    const freshReports = Object.values(game.scoutReports ?? {}).filter(r => r.scoutedSeason === game.currentSeason).length
    if (freshReports > 0) {
      nudges.push({
        color: 'yellow',
        text: `${freshReports} scoutrapport${freshReports > 1 ? 'er' : ''} klar${freshReports > 1 ? 'a' : ''}`,
        onClick: () => navigate('/game/transfers'),
      })
    }
  }

  // 🟡 Negative finances
  if (nudges.length < 3) {
    const club = game.clubs.find(c => c.id === game.managedClubId)
    const finances = club?.finances ?? 0
    if (finances < 0) {
      const abs = Math.abs(finances)
      const formatted = abs >= 1_000_000 ? `${(abs / 1_000_000).toFixed(1)} mkr` : `${Math.round(abs / 1_000)} tkr`
      nudges.push({
        color: 'yellow',
        text: `Minussaldo: −${formatted}`,
        onClick: () => navigate('/game/club', { state: { tab: 'ekonomi' } }),
      })
    }
  }

  // 🟢 Board objective at risk or active
  if (nudges.length < 3) {
    const atRisk = (game.boardObjectives ?? []).find(o => o.status === 'at_risk')
    const active = (game.boardObjectives ?? []).find(o => o.status === 'active')
    const obj = atRisk ?? active
    if (obj) {
      nudges.push({
        color: atRisk ? 'red' : 'green',
        text: `Styrelseuppdrag: ${obj.label} — ${obj.status === 'at_risk' ? 'i riskzonen' : 'på gång'}`,
        onClick: () => navigate('/game/club', { state: { tab: 'ekonomi' } }),
      })
    }
  }

  return nudges.slice(0, 3)
}

interface DashboardNudgesProps {
  game: SaveGame
  navigate: NavigateFunction
}

export function DashboardNudges({ game, navigate }: DashboardNudgesProps) {
  const nudges = generateNudges(game, navigate)
  if (nudges.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, margin: '0 0 8px' }}>
      {nudges.map((n, i) => (
        <div
          key={i}
          onClick={n.onClick}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 8,
            background: 'var(--bg-surface)',
            border: '0.5px solid var(--border)',
            cursor: 'pointer',
            fontSize: 12, color: 'var(--text-secondary)',
            fontFamily: 'var(--font-body)',
          }}
        >
          <span style={{
            width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
            background: n.color === 'red' ? 'var(--danger)'
              : n.color === 'yellow' ? 'var(--warning)'
              : 'var(--success)',
          }} />
          {n.text}
        </div>
      ))}
    </div>
  )
}
