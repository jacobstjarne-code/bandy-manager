import type { EfterklangMemory } from '../../../../domain/services/portal/pickEfterklang'

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

interface Props {
  memory: EfterklangMemory
  onClose: () => void
}

export function EfterklangThreadModal({ memory, onClose }: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: 430,
          background: 'var(--bg-portal-surface)',
          borderRadius: '14px 14px 0 0',
          padding: '20px 16px 32px',
          maxHeight: '70vh', overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 8, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 2 }}>
              {TYPE_ICON[memory.type]} EFTERKLANG
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-light)' }}>
              {memory.objectName}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: '1px solid var(--bg-leather)',
              borderRadius: 6, color: 'var(--text-muted)', fontSize: 12,
              padding: '4px 10px', cursor: 'pointer',
            }}
          >
            Stäng
          </button>
        </div>

        {/* Thread entries */}
        {memory.threadEntries.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {memory.threadEntries.map((entry, i) => (
              <div key={i} style={{
                borderLeft: '2px solid var(--cold)',
                paddingLeft: 10,
              }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: 2 }}>
                  OMG {entry.matchday}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-light-secondary)', lineHeight: 1.4 }}>
                  {entry.text}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Ingen historik lagrad.</p>
        )}

        {/* Echo */}
        <div style={{
          marginTop: 16, paddingTop: 12,
          borderTop: '1px solid var(--bg-leather)',
          fontSize: 11, color: 'var(--text-light-secondary)', fontStyle: 'italic',
        }}>
          ↻ {memory.echo}
        </div>
      </div>
    </div>
  )
}
