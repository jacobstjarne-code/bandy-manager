import { useState } from 'react'
import type { Player } from '../../../domain/entities/Player'

function formatValue(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} mkr`
  if (v >= 1_000) return `${Math.round(v / 1_000)} tkr`
  return `${v} kr`
}

interface BidModalProps {
  player: Player
  managedClub: { transferBudget: number; finances: number }
  onClose: () => void
  onConfirm: (playerId: string, offerAmount: number, offeredSalary: number, contractYears: number) => void
}

export function BidModal({ player, managedClub, onClose, onConfirm }: BidModalProps) {
  const suggestedBid = Math.round((player.marketValue || 50000) / 5000) * 5000
  const [offerAmount, setOfferAmount] = useState(suggestedBid)
  const [offeredSalary, setOfferedSalary] = useState(Math.round(player.salary / 500) * 500)
  const [contractYears, setContractYears] = useState(3)
  const canAfford = managedClub.transferBudget >= offerAmount

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        maxWidth: 430, margin: '0 auto', padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg)', borderRadius: 12,
          border: '1px solid var(--border)',
          padding: '20px 16px 24px', width: '100%',
          maxHeight: '85vh', overflowY: 'auto',
          boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, fontFamily: 'var(--font-display)' }}>Lägg bud</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{player.firstName} {player.lastName}</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ width: 32, height: 32, fontSize: 16, padding: 0 }}>✕</button>
        </div>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', marginBottom: 16, border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)' }}>
          Marknadsvärde: {formatValue(player.marketValue ?? 0)} · Transferbudget: {formatValue(managedClub.transferBudget)}
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Budsumma (kr)</label>
          <input type="number" value={offerAmount} onChange={e => setOfferAmount(Number(e.target.value))} step={5000}
            style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 15 }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Erbjuden lön (kr/mån)</label>
          <input type="number" value={offeredSalary} onChange={e => setOfferedSalary(Number(e.target.value))} step={1000}
            style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 15 }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Kontraktslängd</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3].map(y => (
              <button
                key={y}
                onClick={() => setContractYears(y)}
                className={`btn ${contractYears === y ? 'btn-copper' : 'btn-outline'}`}
                style={{ flex: 1, padding: '10px', fontSize: 15, fontWeight: 600 }}
              >
                {y} år
              </button>
            ))}
          </div>
        </div>
        {!canAfford && <p style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 8 }}>Otillräcklig transferbudget</p>}
        <button
          onClick={() => canAfford && onConfirm(player.id, offerAmount, offeredSalary, contractYears)}
          disabled={!canAfford}
          className={`btn ${canAfford ? 'btn-copper' : 'btn-ghost'}`}
          style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 600, cursor: canAfford ? 'pointer' : 'not-allowed', opacity: canAfford ? 1 : 0.5 }}
        >
          Lägg bud
        </button>
      </div>
    </div>
  )
}
