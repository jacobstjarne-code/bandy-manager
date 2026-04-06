import type { SaveGame } from '../../../domain/entities/SaveGame'

interface Props {
  game: SaveGame
}

export function SeasonBarometer({ game }: Props) {
  const squad = game.players.filter(p => p.clubId === game.managedClubId)
  if (squad.length === 0) return null

  const avgCA = Math.round(squad.reduce((s, p) => s + (p.currentAbility ?? 50), 0) / squad.length)
  const avgForm = Math.round(squad.reduce((s, p) => s + p.form, 0) / squad.length)

  // Season start comparison
  const startFinances = game.seasonStartFinances ?? (game.clubs.find(c => c.id === game.managedClubId)?.finances ?? 0)
  const currentFinances = game.clubs.find(c => c.id === game.managedClubId)?.finances ?? 0
  const financeDelta = currentFinances - startFinances

  // Win rate this season
  const seasonFixtures = game.fixtures.filter(f =>
    f.status === 'completed' && !f.isCup &&
    (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
  )
  const wins = seasonFixtures.filter(f => {
    const isHome = f.homeClubId === game.managedClubId
    return isHome ? f.homeScore > f.awayScore : f.awayScore > f.homeScore
  }).length
  const winRate = seasonFixtures.length > 0 ? Math.round((wins / seasonFixtures.length) * 100) : 0

  // Community standing
  const cs = game.communityStanding ?? 50

  // Simple trend: compare first half vs second half of season fixtures
  const halfIdx = Math.floor(seasonFixtures.length / 2)
  let trend: 'up' | 'down' | 'flat' = 'flat'
  if (seasonFixtures.length >= 6) {
    const firstHalf = seasonFixtures.slice(0, halfIdx)
    const secondHalf = seasonFixtures.slice(halfIdx)
    const firstPts = firstHalf.reduce((s, f) => {
      const isHome = f.homeClubId === game.managedClubId
      const won = isHome ? f.homeScore > f.awayScore : f.awayScore > f.homeScore
      const drew = f.homeScore === f.awayScore
      return s + (won ? 2 : drew ? 1 : 0)
    }, 0) / firstHalf.length
    const secondPts = secondHalf.reduce((s, f) => {
      const isHome = f.homeClubId === game.managedClubId
      const won = isHome ? f.homeScore > f.awayScore : f.awayScore > f.homeScore
      const drew = f.homeScore === f.awayScore
      return s + (won ? 2 : drew ? 1 : 0)
    }, 0) / secondHalf.length
    if (secondPts > firstPts + 0.2) trend = 'up'
    else if (secondPts < firstPts - 0.2) trend = 'down'
  }

  if (seasonFixtures.length < 3) return null

  const trendIcon = trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️'
  const trendText = trend === 'up' ? 'Stigande form' : trend === 'down' ? 'Dalande form' : 'Stabil nivå'
  const trendColor = trend === 'up' ? 'var(--success)' : trend === 'down' ? 'var(--danger)' : 'var(--text-muted)'

  const formatTkr = (n: number) => {
    const sign = n >= 0 ? '+' : ''
    if (Math.abs(n) >= 1_000_000) return `${sign}${(n / 1_000_000).toFixed(1)} mkr`
    return `${sign}${Math.round(n / 1_000)} tkr`
  }

  return (
    <div className="card-sharp" style={{ margin: '0 0 10px' }}>
      <div style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
            {trendIcon} SÄSONGSBAROMETER
          </p>
          <span style={{ fontSize: 11, fontWeight: 700, color: trendColor }}>{trendText}</span>
        </div>

        <div style={{ display: 'flex', gap: 0 }}>
          <Stat label="Snitt CA" value={`${avgCA}`} />
          <Stat label="Form" value={`${avgForm}`} />
          <Stat label="Vinst%" value={`${winRate}%`} />
          <Stat label="Kassa" value={formatTkr(financeDelta)} color={financeDelta >= 0 ? 'var(--success)' : 'var(--danger)'} />
          <Stat label="Orten" value={`${cs}`} />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <p style={{ fontSize: 15, fontWeight: 700, color: color ?? 'var(--text-primary)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 3 }}>
        {label}
      </p>
    </div>
  )
}
