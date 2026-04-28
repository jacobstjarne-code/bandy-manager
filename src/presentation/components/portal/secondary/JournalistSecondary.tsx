/**
 * JournalistSecondary — Portal-kort för journalistrelationen.
 * Visas när relation <= 30 (cold) eller >= 70 (warm).
 * Klick öppnar journalist_relationship-scenen.
 */

import type { CardRenderProps } from '../portalTypes'
import { getJournalistCardSeverity } from '../../../../domain/services/journalistVisibilityService'
import { buildJournalistSceneData } from '../../../../domain/data/scenes/journalistRelationshipScene'
import { useGameStore } from '../../../store/gameStore'

export function JournalistSecondary({ game }: CardRenderProps) {
  const triggerJournalistScene = useGameStore(s => s.triggerJournalistScene)

  const severity = getJournalistCardSeverity(game)
  if (severity === 'hidden' || !game.journalist) return null

  const isCold = severity === 'cold'
  const data = buildJournalistSceneData(game.journalist, game.currentSeason)
  const recentSummary = data.memories.length > 0
    ? data.memories[0].summary
    : 'Ingen kontakt ännu'

  const stripeColor = isCold ? 'var(--cold)' : 'var(--warm)'

  const tagStyle: React.CSSProperties = isCold
    ? {
        fontSize: 8,
        fontWeight: 700,
        letterSpacing: 1.5,
        textTransform: 'uppercase' as const,
        padding: '2px 6px',
        borderRadius: 3,
        background: 'rgba(74, 102, 128, 0.15)',
        color: '#7095b8',
        border: '1px solid rgba(74, 102, 128, 0.3)',
      }
    : {
        fontSize: 8,
        fontWeight: 700,
        letterSpacing: 1.5,
        textTransform: 'uppercase' as const,
        padding: '2px 6px',
        borderRadius: 3,
        background: 'rgba(140, 110, 58, 0.15)',
        color: '#c8a058',
        border: '1px solid rgba(140, 110, 58, 0.35)',
      }

  const fillStyle: React.CSSProperties = isCold
    ? { background: 'var(--cold)', height: '100%', borderRadius: 2, transition: 'width 0.3s ease' }
    : { background: 'var(--warm)', height: '100%', borderRadius: 2, transition: 'width 0.3s ease' }

  const fillPct = `${Math.max(2, Math.min(100, data.relationship))}%`

  return (
    <div
      onClick={() => triggerJournalistScene()}
      style={{
        background: 'var(--bg-portal-surface)',
        border: '1px solid var(--border)',
        borderLeft: `2px solid ${stripeColor}`,
        borderRadius: 10,
        padding: '11px 12px',
        gap: 6,
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
      }}
    >
      {/* Row 1: name + emoji */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
        <span style={{
          fontFamily: 'Georgia, serif',
          fontSize: 12,
          color: 'var(--text-light)',
          fontWeight: 600,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
        }}>
          {data.name}
        </span>
        <span style={{ fontSize: 11 }}>
          {isCold ? '🥶' : '☀️'}
        </span>
      </div>
      {/* Row 2: tag */}
      <span style={{ ...tagStyle, alignSelf: 'flex-start' }}>
        {isCold ? 'kylig' : 'varm'}
      </span>

      {/* Recent memory text */}
      <div style={{
        fontSize: 10,
        color: 'var(--text-muted)',
        fontStyle: 'italic',
        lineHeight: 1.4,
      }}>
        {recentSummary}
      </div>

      {/* Relation track */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          flex: 1,
          height: 3,
          background: 'var(--bg-dark)',
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          <div style={{ ...fillStyle, width: fillPct }} />
        </div>
        <span style={{
          fontSize: 9,
          color: 'var(--text-muted)',
          fontFamily: 'Georgia, serif',
          minWidth: 18,
          textAlign: 'right',
        }}>
          {data.relationship}
        </span>
      </div>
    </div>
  )
}
