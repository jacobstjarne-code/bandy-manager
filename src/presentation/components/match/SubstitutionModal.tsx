import { useState } from 'react'
import type { Player } from '../../../domain/entities/Player'
import { positionShort } from '../../utils/formatters'

interface SubstitutionModalProps {
  starters: Player[]
  bench: Player[]
  onConfirm: (outId: string, inId: string) => void
  onClose: () => void
}

function fitnessColor(f: number): string {
  if (f >= 70) return 'var(--success)'
  if (f >= 40) return 'var(--warning)'
  return 'var(--danger)'
}

function PlayerRow({ player, isPick, onClick }: { player: Player; isPick?: boolean; onClick: () => void }) {
  return (
    <button className={`match-modal-row${isPick ? ' in-pick' : ''}`} onClick={onClick}>
      <div>
        <span className="match-modal-row-name">{player.lastName}</span>
        <span className="match-modal-row-pos">{positionShort(player.position)}</span>
      </div>
      <div className="match-modal-row-meta">
        <span className="match-modal-row-ability">{Math.round(player.currentAbility)}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: fitnessColor(player.fitness) }}>
          ⚡ {Math.round(player.fitness)}
        </span>
      </div>
    </button>
  )
}

export function SubstitutionModal({ starters, bench, onConfirm, onClose }: SubstitutionModalProps) {
  const [outId, setOutId] = useState<string | null>(null)
  const availableBench = bench.filter(p => !p.isInjured && (p.suspensionGamesRemaining ?? 0) <= 0)

  return (
    <div className="match-modal-dock match-modal-panel">
      <div className="match-modal-head">
        <span className="match-modal-title">
          {outId ? 'Välj in-spelare' : 'Välj ut-spelare'}
        </span>
        <button className="match-modal-close" onClick={onClose}>×</button>
      </div>
      {!outId ? (
        <div className="match-modal-list" style={{ overflowY: 'auto', maxHeight: 'calc(65vh - 70px)' }}>
          {starters.map(p => (
            <PlayerRow key={p.id} player={p} onClick={() => setOutId(p.id)} />
          ))}
        </div>
      ) : availableBench.length === 0 ? (
        <div>
          <p className="match-modal-empty">Ingen tillgänglig på bänken.</p>
          <button className="match-modal-back" onClick={() => setOutId(null)}>← Tillbaka</button>
        </div>
      ) : (
        <div className="match-modal-list" style={{ overflowY: 'auto', maxHeight: 'calc(65vh - 70px)' }}>
          <button className="match-modal-back" style={{ marginBottom: 4 }} onClick={() => setOutId(null)}>← Tillbaka</button>
          {availableBench.map(p => (
            <PlayerRow key={p.id} player={p} isPick onClick={() => onConfirm(outId, p.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
