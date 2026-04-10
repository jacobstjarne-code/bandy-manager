import { useNavigate } from 'react-router-dom'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { getArcMoodText } from '../../../domain/services/trainerArcService'

interface Props {
  game: SaveGame
}

export function CareerStatsCard({ game }: Props) {
  const navigate = useNavigate()
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

  if (arc.seasonCount === 0 && totalMatches === 0) return null

  const hasPastSeasons = (game.seasonSummaries ?? []).length > 0

  return (
    <div
      className="card-sharp"
      style={{ margin: '0 0 8px', cursor: hasPastSeasons ? 'pointer' : undefined }}
      onClick={hasPastSeasons ? () => navigate('/game/history') : undefined}
    >
      <div style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
            🎖️ TRÄNARKARRIÄR
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
              {phaseLabels[arc.current] ?? arc.current}
            </span>
            {hasPastSeasons && (
              <button
                onClick={(e) => { e.stopPropagation(); navigate('/game/history') }}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                  background: 'transparent', border: '1px solid var(--border)',
                  color: 'var(--accent)', fontSize: 12, lineHeight: 1,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  cursor: 'pointer',
                }}
              >›</button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 0 }}>
          <CareerStat label="Säsonger" value={`${seasons}`} />
          <CareerStat label="Matcher" value={`${totalMatches}`} />
          <CareerStat label="Vinst%" value={`${winPct}%`} />
          {bestFinish && <CareerStat label="Bästa" value={`${bestFinish}:a`} />}
          {trophies > 0 && <CareerStat label="Titlar" value={`${trophies}`} color="var(--accent)" />}
        </div>

        {(() => {
          const moodText = getArcMoodText(arc.current)
          if (!moodText) return null
          return (
            <p style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 6, fontFamily: 'var(--font-body)' }}>
              {moodText}
            </p>
          )
        })()}

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
