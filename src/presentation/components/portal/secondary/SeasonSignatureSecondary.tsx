import type { CardRenderProps } from '../portalTypes'
import { getSignatureEmoji, getSignatureName } from '../../../../domain/services/seasonSignatureService'
import type { SeasonSignatureId } from '../../../../domain/entities/SeasonSignature'

const BORDER_COLOR: Record<SeasonSignatureId, string> = {
  calm_season:         'var(--accent)',
  cold_winter:         'var(--cold)',
  scandal_season:      'var(--danger)',
  hot_transfer_market: 'var(--gold)',
  injury_curve:        'var(--warm)',
  dream_round:         'var(--accent-glow)',
}

function getDefaultFact(id: SeasonSignatureId): string {
  switch (id) {
    case 'cold_winter':         return 'Kyla och 3×30 väntar.'
    case 'scandal_season':      return 'Fokus på spelet, inte rubrikerna.'
    case 'hot_transfer_market': return 'Transfermarknaden är het — håll koll på truppen.'
    case 'injury_curve':        return 'Mellansäsongen kan bli tuff för truppen.'
    case 'dream_round':         return 'Underdogs spelar över sin förmåga i år.'
    default:                    return ''
  }
}

export function SeasonSignatureSecondary({ game }: CardRenderProps) {
  const sig = game.currentSeasonSignature
  if (!sig || sig.id === 'calm_season') return null

  const emoji = getSignatureEmoji(sig.id)
  const name = getSignatureName(sig.id)
  const borderColor = BORDER_COLOR[sig.id]
  const factText = sig.observedFacts[0] ?? getDefaultFact(sig.id)

  return (
    <div style={{
      background: 'var(--bg-portal-surface)',
      border: '1px solid var(--border)',
      borderLeft: `2px solid ${borderColor}`,
      borderRadius: 10,
      padding: '11px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      gridColumn: 'span 2',
    }}>
      {/* Row 1: name + tag */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: 'Georgia, serif',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: 'var(--text-light)',
        }}>
          <span style={{ fontSize: 16, letterSpacing: 'normal' }}>{emoji}</span>
          {name}
        </div>
        <div style={{
          fontSize: 8,
          fontWeight: 700,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>
          aktiv signatur
        </div>
      </div>

      {/* Fact row */}
      <div style={{
        fontSize: 10.5,
        fontStyle: 'italic',
        color: 'var(--text-secondary)',
        lineHeight: 1.4,
      }}>
        {factText}
      </div>
    </div>
  )
}
