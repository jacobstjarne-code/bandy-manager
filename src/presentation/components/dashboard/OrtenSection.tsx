import { SectionLabel } from '../SectionLabel'
import { DiamondDivider } from './DiamondDivider'
import type { SaveGame } from '../../../domain/entities/SaveGame'

interface Props {
  game: SaveGame
  currentMatchday: number
}

export function OrtenSection({ game, currentMatchday }: Props) {
  const allMoments = game.recentMoments ?? []
  // Fräschhetsfönster: visa bara moments från denna eller de 2 senaste omgångarna
  const fresh = allMoments.filter(m =>
    m.season === game.currentSeason &&
    currentMatchday - m.matchday <= 2
  )
  if (fresh.length === 0) return null
  const visible = fresh.slice(0, 3)

  return (
    <div style={{ margin: '8px 0' }}>
      <SectionLabel style={{ marginBottom: 8 }}>🏘 ORTEN</SectionLabel>
      {visible.map((m, i) => (
        <div key={m.id}>
          <div style={{ borderRadius: 6, overflow: 'hidden', marginBottom: 4 }}>
            {/* Leather bar */}
            <div style={{
              background: 'var(--accent)',
              height: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 10px',
            }}>
              <span style={{ color: '#fff', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px' }}>HÄNDELSE</span>
              <span style={{ color: '#fff', fontSize: 9, opacity: 0.8, letterSpacing: '0.5px' }}>
                OMG {m.matchday} · S{m.season}
              </span>
            </div>
            {/* Content */}
            <div style={{ padding: '8px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 6px 6px' }}>
              <p style={{
                fontSize: 13, fontWeight: 700, color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)', margin: 0, lineHeight: 1.3,
              }}>
                {m.title}
              </p>
              <p style={{
                fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5,
                fontFamily: 'var(--font-body)', margin: '4px 0 0',
              }}>
                {m.body}
              </p>
            </div>
          </div>
          {i < visible.length - 1 && <DiamondDivider />}
        </div>
      ))}
    </div>
  )
}
