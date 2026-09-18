import type { SaveGame } from '../../../domain/entities/SaveGame'
import { seasonSpanLabel } from '../../../domain/utils/seasonYear'
import { csColor } from '../../utils/formatters'

/** Bygdens puls: samma mätare i Orten och Klubbpärmens exempel. */
export function CommunityPulseMeter({ game }: { game: SaveGame }) {
  const pulse = game.communityStanding ?? 50
  const delta = game.communityStandingDelta ?? 0

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 40, fontWeight: 300, color: csColor(pulse), fontFamily: 'var(--font-display)', lineHeight: 1 }}>{pulse}</span>
        {delta !== 0 && (
          <>
            {/* adherence-semantic-key: grön/röd pil anger om bygdens puls steg eller sjönk. */}
            <span style={{ fontSize: 20, color: delta > 0 ? 'var(--success)' : 'var(--danger)' }}>
              {delta > 0 ? '▲' : '▼'}
            </span>
          </>
        )}
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <p className="h-label">SÄSONG</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{seasonSpanLabel(game.currentSeason)}</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 2, marginBottom: 10 }}>
        <div style={{ flex: pulse, height: 7, background: csColor(pulse), borderRadius: '4px 0 0 4px' }} />
        <div style={{ flex: 100 - pulse, height: 7, background: 'var(--border-dark)', borderRadius: '0 4px 4px 0' }} />
      </div>
    </>
  )
}
