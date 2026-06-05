import { createPortal } from 'react-dom'
import type { EfterklangMemory } from '../../../../domain/services/portal/pickEfterklang'
import { EFTERKLANG_TYPE_ICON } from '../../../../domain/data/efterklangText'

interface Props {
  memory: EfterklangMemory
  onClose: () => void
}

export function EfterklangThreadModal({ memory, onClose }: Props) {
  // A2: renderas via portal till body — annars fångar Portal-innehållets
  // stacking-context (.screen-enter animation: fadeIn) z-index:n lokalt och den
  // sticky CTA-baren (z 200, root-kontext) målar över modalens nederkant + äter touch.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
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
              {EFTERKLANG_TYPE_ICON[memory.type]} EFTERKLANG
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

        {/* Thread entries — tidslinje */}
        {memory.threadEntries.length > 0 ? (
          <div style={{ position: 'relative' }}>
            {/* Vertikal gradient-linje */}
            <div style={{
              position: 'absolute', left: 7, top: 4, bottom: 8, width: 1,
              background: 'linear-gradient(180deg, color-mix(in srgb, var(--warm) 50%, transparent), color-mix(in srgb, var(--warm) 15%, transparent))',
            }} />
            {memory.threadEntries.map((entry, i) => {
              const isLatest = i === memory.threadEntries.length - 1
              return (
                <div key={i} style={{ position: 'relative', paddingLeft: 26, marginBottom: isLatest ? 0 : 16, opacity: isLatest ? 1 : 0.78 }}>
                  {/* Nod-prick */}
                  <span style={{
                    position: 'absolute', left: 3, top: 2,
                    width: 9, height: 9, borderRadius: '50%',
                    background: isLatest ? 'var(--warm)' : 'var(--bg-portal-elevated)',
                    border: '1.5px solid var(--warm)',
                    boxShadow: isLatest ? '0 0 6px rgba(140,110,58,0.5)' : 'none',
                    boxSizing: 'border-box',
                  }} />
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '1px',
                    color: isLatest ? 'var(--warm-light)' : 'var(--text-muted)', marginBottom: 2,
                  }}>
                    OMG {entry.matchday}{isLatest ? ' · senast' : ''}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-light-secondary)', lineHeight: 1.4 }}>
                    {entry.text}
                  </div>
                </div>
              )
            })}
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

        {/* Modal-foot — kontext-rad */}
        <div style={{
          marginTop: 16, paddingTop: 12,
          borderTop: '1px dashed color-mix(in srgb, var(--warm) 20%, transparent)',
          fontFamily: 'var(--font-mono)', fontStyle: 'italic',
          fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5,
        }}>
          En linje som löper genom säsongen.
        </div>
      </div>
    </div>,
    document.body,
  )
}
