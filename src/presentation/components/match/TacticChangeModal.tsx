interface TacticChangeModalProps {
  changesLeft: number
  onChoose: (optId: string) => void
  onClose: () => void
}

const OPTIONS = [
  { id: 'tempo_high', label: 'Höj tempot' },
  { id: 'tempo_low', label: 'Sänk tempot' },
  { id: 'attack', label: 'Anfallspress' },
  { id: 'defend', label: 'Parkera bussen' },
]

export function TacticChangeModal({ changesLeft, onChoose, onClose }: TacticChangeModalProps) {
  return (
    <div style={{
      position: 'fixed', bottom: 70, left: 16, right: 16,
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '14px 16px', zIndex: 'var(--z-modal)',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>⚙️ Snabbändring</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {changesLeft} kvar
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {OPTIONS.map(opt => (
          <button
            key={opt.id}
            className="btn btn-ghost"
            style={{ padding: 10, fontSize: 12 }}
            onClick={() => onChoose(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <button
        onClick={onClose}
        style={{
          width: '100%', marginTop: 8, padding: 8,
          background: 'none', border: 'none',
          color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
        }}
      >
        Avbryt
      </button>
    </div>
  )
}
