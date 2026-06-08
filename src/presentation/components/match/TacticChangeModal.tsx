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
    <div className="match-modal-dock match-modal-panel">
      <div className="match-modal-head">
        <span className="match-modal-title">⚙️ Snabbändring</span>
        <span className="match-modal-meta">{changesLeft} kvar</span>
      </div>
      <div className="match-modal-grid">
        {OPTIONS.map(opt => (
          <button
            key={opt.id}
            className="match-modal-btn"
            onClick={() => onChoose(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <button className="match-modal-cancel" onClick={onClose}>
        Avbryt
      </button>
    </div>
  )
}
