import { SectionLabel } from '../SectionLabel'
import { DiamondDivider } from './DiamondDivider'
import type { Moment } from '../../../domain/entities/Moment'
import type { SaveGame } from '../../../domain/entities/SaveGame'

interface Props {
  game: SaveGame
  currentMatchday: number
}

function formatMomentTime(moment: Moment, currentMatchday: number): string {
  const delta = currentMatchday - moment.matchday
  if (delta <= 0) return 'igår'
  if (delta === 1) return 'förra omgången'
  return `${delta} omgångar sedan`
}

export function OrtenSection({ game, currentMatchday }: Props) {
  const moments = game.recentMoments ?? []
  if (moments.length === 0) return null
  const visible = moments.slice(0, 3)

  return (
    <div className="card-sharp" style={{ margin: '8px 0', padding: '12px 14px' }}>
      <SectionLabel style={{ marginBottom: 10 }}>🏘 ORTEN</SectionLabel>
      {visible.map((m, i) => (
        <div key={m.id}>
          <div style={{ marginBottom: 4 }}>
            <p style={{
              fontSize: 12, fontWeight: 600, color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)', margin: 0, lineHeight: 1.3,
            }}>
              {m.title}
            </p>
            <p style={{
              fontSize: 9, color: 'var(--text-muted)', margin: '2px 0 6px',
              fontFamily: 'var(--font-body)',
            }}>
              — {formatMomentTime(m, currentMatchday)}
            </p>
            <p style={{
              fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5,
              fontFamily: 'var(--font-body)', margin: 0,
            }}>
              {m.body}
            </p>
          </div>
          {i < visible.length - 1 && <DiamondDivider />}
        </div>
      ))}
    </div>
  )
}
