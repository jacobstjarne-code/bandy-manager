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
      background: 'linear-gradient(135deg, var(--bg-elevated) 0%, rgba(160,72,72,0.15) 100%)',
      border: '1px solid var(--danger)',
      borderRadius: 8,
      padding: 16,
      marginBottom: 14,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        fontSize: 9,
        letterSpacing: '2px',
        textTransform: 'uppercase',
        fontWeight: 700,
        marginBottom: 8,
        color: 'var(--danger)',
      }}>
        👤 PATRON KRÄVER
      </div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 22,
        fontWeight: 700,
        lineHeight: 1.2,
        color: 'var(--text-light)',
        marginBottom: 6,
      }}>
        {patron.name}
      </div>
      <div style={{
        fontSize: 12,
        color: 'var(--text-secondary)',
        lineHeight: 1.5,
        marginBottom: 10,
        fontFamily: 'var(--font-display)',
        fontStyle: 'italic',
      }}>
        "{demand}"
      </div>
      <div style={{
        display: 'flex',
        gap: 12,
        fontSize: 10,
        color: 'var(--text-muted)',
        marginTop: 8,
        paddingTop: 8,
        borderTop: '1px solid var(--border)',
      }}>
        <span>
          <strong style={{ color: 'var(--danger)', fontWeight: 600 }}>{patienceLabel}</strong>
          {' · '}tålamod {patience}
        </span>
      </div>
      <button
        onClick={() => navigate('/game/club', { state: { tab: 'orten' } })}
        style={{
          width: '100%',
          marginTop: 12,
          background: 'linear-gradient(135deg, var(--accent-dark) 0%, var(--accent-deep) 100%)',
          color: 'var(--text-light)',
          border: 'none',
          padding: '12px 14px',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.5px',
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
        }}
      >
        Hantera patron →
      </button>
    </div>
  )
}
