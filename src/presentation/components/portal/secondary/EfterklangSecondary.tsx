import type { CardRenderProps } from '../portalTypes'
import { pickEfterklang } from '../../../../domain/services/portal/pickEfterklang'
import { EFTERKLANG_EYEBROW } from '../../../../domain/data/efterklangText'
import { Sparkline, MIN_POINTS } from '../../primitives/Sparkline'
import { SectionLabel } from '../../SectionLabel'

const TYPE_ICON: Record<string, string> = {
  anniversary:    '📅',
  klackEcho:      '📣',
  journalist:     '📰',
  followUp:       '✉️',
  boardObjective: '🎯',
  nemesis:        '⚔️',
  economicScar:   '💸',
  rivalSale:      '🔄',
}

export function EfterklangSecondary({ game }: CardRenderProps) {
  const memories = pickEfterklang(game, 2)
  if (memories.length === 0) return null

  const journalistPoints = game.scoreSnapshots?.journalistRelation ?? []
  const eyebrow = `${EFTERKLANG_EYEBROW} · ${memories.length} minne${memories.length > 1 ? 'n' : ''}`

  return (
    <div
      style={{
        background: 'var(--bg-portal-surface)',
        border: '1px solid var(--bg-leather)',
        borderLeft: '2px solid var(--cold)',
        borderRadius: 10,
        padding: '10px 14px',
      }}
    >
      <SectionLabel style={{ marginBottom: 8 }}>{eyebrow}</SectionLabel>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {memories.map((mem, i) => (
          <div key={mem.type} style={i > 0 ? { borderTop: '1px solid var(--bg-leather)', paddingTop: 10 } : {}}>
            {/* Primary text — only for types that have meaningful primaryText */}
            {mem.primaryText && (
              <p style={{ fontSize: 11, color: 'var(--text-light-secondary)', margin: '0 0 4px' }}>
                {TYPE_ICON[mem.type]} {mem.primaryText}
              </p>
            )}

            {/* Journalist sparkline */}
            {mem.type === 'journalist' && mem.hasJournalistSparkline && journalistPoints.length >= MIN_POINTS && (
              <div style={{ marginBottom: 6 }}>
                <Sparkline
                  points={journalistPoints}
                  stroke="accent"
                  height={20}
                  label="Relation"
                />
              </div>
            )}

            {/* Echo row */}
            <p style={{ fontSize: 11, color: 'var(--text-light-secondary)', fontStyle: 'italic', margin: 0 }}>
              ↻ {mem.echo}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
