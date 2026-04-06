import type { SaveGame } from '../../../domain/entities/SaveGame'

interface Props {
  game: SaveGame
}

export function CareerStatsCard({ game }: Props) {
  const arc = game.trainerArc
  if (!arc) return null

  // Total matches managed
  const managedFixtures = game.fixtures.filter(f =>
    f.status === 'completed' &&
    (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
  )
  const totalMatches = managedFixtures.length
  const wins = managedFixtures.filter(f => {
    const isHome = f.homeClubId === game.managedClubId
    return isHome ? f.homeScore > f.awayScore : f.awayScore > f.homeScore
  }).length
  const winPct = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0

  // All-time records
  const records = game.allTimeRecords
  const trophies = (records?.championSeasons?.length ?? 0) + (records?.cupWinSeasons?.length ?? 0)

  // Season count
  const seasons = arc.seasonCount

  // Best finish
  const bestFinish = arc.bestFinish > 0 ? arc.bestFinish : (records?.bestFinish?.position ?? null)

  // Arc phase display
  const phaseLabels: Record<string, string> = {
    newcomer: 'Nykomling',
    honeymoon: 'Smekmånad',
    grind: 'Vardagen',
    questioned: 'Ifrågasatt',
    crisis: 'Kris',
    redemption: 'Vändning',
    established: 'Etablerad',
    legendary: 'Legend',
    farewell: 'Avsked',
  }

  if (totalMatches < 5) return null

  return (
    <div className="card-sharp" style={{ margin: '0 0 10px' }}>
      <div style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
            🎖️ TRÄNARKARRIÄR
          </p>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            {phaseLabels[arc.current] ?? arc.current}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 0 }}>
          <CareerStat label="Säsonger" value={`${seasons}`} />
          <CareerStat label="Matcher" value={`${totalMatches}`} />
          <CareerStat label="Vinst%" value={`${winPct}%`} />
          {bestFinish && <CareerStat label="Bästa" value={`${bestFinish}:a`} />}
          {trophies > 0 && <CareerStat label="Titlar" value={`${trophies}`} color="var(--accent)" />}
        </div>

        {/* Trophy shelf */}
        {trophies > 0 && (
          <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {(records?.championSeasons ?? []).map(s => (
              <span key={`champ-${s}`} className="tag tag-fill" style={{ fontSize: 9 }}>🏆 SM {s}</span>
            ))}
            {(records?.cupWinSeasons ?? []).map(s => (
              <span key={`cup-${s}`} className="tag tag-copper" style={{ fontSize: 9 }}>🏆 Cup {s}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CareerStat({ label, value, color }: { label: string; value: string; color?: string }) {
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
