import { useNavigate } from 'react-router-dom'
import type { CardRenderProps } from '../portalTypes'

/**
 * Primary-kort för patron-konflikt.
 * Ingen mock-referens — använder DerbyPrimary-anatomi med röd ton (var(--danger)).
 */
export function PatronDemandPrimary({ game }: CardRenderProps) {
  const navigate = useNavigate()
  const patron = game.patron

  if (!patron || !patron.isActive) return null

  const demand = patron.demands?.[0] ?? 'Kräver åtgärd'
  const patience = patron.patience ?? 50
  const patienceLabel = patience < 20
    ? 'Ytterst otålig'
    : patience < 40
    ? 'Missnöjd'
    : 'Otålig'

  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--bg-portal-elevated) 0%, color-mix(in srgb, var(--danger) 15%, transparent) 100%)',
      border: '1px solid var(--danger)',
      borderRadius: 8,
      padding: 16,
      marginBottom: 14,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div className="h-label" style={{ marginBottom: 8, color: 'var(--danger)' }}>
        👤 PATRON KRÄVER
      </div>
      <div className="h-display-sm" style={{ color: 'var(--text-light)', marginBottom: 6 }}>
        {patron.name}
      </div>
      <div className="h-quote h-quote-light" style={{ lineHeight: 1.5, marginBottom: 10 }}>
        {demand}
      </div>
      <div style={{
        display: 'flex',
        gap: 12,
        fontSize: 10,
        color: 'var(--text-muted)',
        marginTop: 8,
        paddingTop: 8,
        borderTop: '1px solid var(--bg-leather)',
      }}>
        <span>
          <strong style={{ color: 'var(--danger)', fontWeight: 600 }}>{patienceLabel}</strong>
          {' · '}tålamod {patience}
        </span>
      </div>
      <button
        onClick={() => navigate('/game/club', { state: { tab: 'orten' } })}
        className="btn btn-primary"
        style={{ width: '100%', marginTop: 12 }}
      >
        Hantera patron →
      </button>
    </div>
  )
}
