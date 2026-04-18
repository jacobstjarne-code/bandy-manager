import type { Player } from '../../../domain/entities/Player'
import { FORMATIONS } from '../../../domain/entities/Formation'
import type { Tactic } from '../../../domain/entities/Club'
import { calculateLineupChemistry } from '../../../domain/services/chemistryService'
import { PlayerDot } from './PlayerDot'

interface ChemistryViewProps {
  tactic: Tactic
  players: Player[]  // entire squad
  chemistryStats: Record<string, number>
}

function PitchLines() {
  return (
    <>
      <rect width="280" height="400" fill="rgba(196,122,58,0.04)" />
      <line x1="0" y1="200" x2="280" y2="200" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3,3" />
      <circle cx="140" cy="200" r="35" fill="none" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3,3" />
      <rect x="90" y="0" width="100" height="28" fill="none" stroke="var(--border)" strokeWidth="0.5" />
      <rect x="90" y="372" width="100" height="28" fill="none" stroke="var(--border)" strokeWidth="0.5" />
    </>
  )
}

export function ChemistryView({ tactic, players, chemistryStats }: ChemistryViewProps) {
  const formation = tactic.formation ?? '5-3-2'
  const template = FORMATIONS[formation]
  const lineupSlots = tactic.lineupSlots ?? {}

  // Map slotId → player
  const slotPlayers: Array<{ slot: typeof template.slots[0]; player: Player | null }> = template.slots.map(slot => ({
    slot,
    player: lineupSlots[slot.id] ? (players.find(p => p.id === lineupSlots[slot.id]) ?? null) : null,
  }))

  // Only starters
  const startingPlayers = slotPlayers.filter(sp => sp.player).map(sp => sp.player as Player)
  const chemistry = calculateLineupChemistry(startingPlayers, chemistryStats)

  // Build playerId → slot position (for line drawing)
  const playerToSlot = new Map<string, typeof template.slots[0]>()
  for (const sp of slotPlayers) {
    if (sp.player) playerToSlot.set(sp.player.id, sp.slot)
  }

  const topPairs = chemistry
    .filter(c => Math.abs(c.strength) >= 0.25)
    .sort((a, b) => Math.abs(b.strength) - Math.abs(a.strength))

  return (
    <>
      <svg viewBox="0 0 280 400" style={{ width: '100%', background: 'var(--bg-surface)', borderRadius: 6, display: 'block' }}>
        <PitchLines />

        {/* Chemistry lines */}
        {topPairs.map(pair => {
          const s1 = playerToSlot.get(pair.playerId1)
          const s2 = playerToSlot.get(pair.playerId2)
          if (!s1 || !s2) return null
          const x1 = s1.x * 2.8, y1 = s1.y * 4
          const x2 = s2.x * 2.8, y2 = s2.y * 4
          const isPositive = pair.strength > 0
          return (
            <line
              key={`${pair.playerId1}-${pair.playerId2}`}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={isPositive ? 'var(--success)' : 'var(--danger)'}
              strokeWidth={1 + Math.abs(pair.strength) * 2}
              opacity={0.55}
              strokeDasharray={isPositive ? undefined : '4,3'}
            />
          )
        })}

        {/* Player dots (read-only) */}
        {slotPlayers.map(({ slot, player }) => (
          <PlayerDot key={slot.id} slot={slot} player={player} readOnly />
        ))}
      </svg>

      {/* Legend */}
      <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--bg-dark-surface)', borderRadius: 4, border: '0.5px solid var(--border)' }}>
        <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1.5px', color: 'var(--text-muted)', marginBottom: 6 }}>
          KEMIN I LAGET
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 20, height: 2, background: 'var(--success)', flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: 'var(--text-light-secondary)' }}>Stark koppling</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 20, height: 2, background: 'var(--danger)', flexShrink: 0, borderBottom: '1px dashed var(--danger)' }} />
            <span style={{ fontSize: 10, color: 'var(--text-light-secondary)' }}>Svag koppling</span>
          </div>
        </div>
      </div>

      {/* Top pairs */}
      {chemistry.filter(c => c.strength > 0.4).sort((a, b) => b.strength - a.strength).slice(0, 3).map(pair => {
        const p1 = players.find(p => p.id === pair.playerId1)
        const p2 = players.find(p => p.id === pair.playerId2)
        if (!p1 || !p2) return null
        return (
          <div key={`${pair.playerId1}-${pair.playerId2}`} style={{
            padding: '6px 10px', fontSize: 11, borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ fontFamily: 'var(--font-display)', color: 'var(--text-light)' }}>
              {p1.lastName} × {p2.lastName}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
              {pair.reasons.join(' · ')}
            </span>
          </div>
        )
      })}

      {chemistry.every(c => Math.abs(c.strength) < 0.25) && (
        <p style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text-muted)', fontSize: 11, fontStyle: 'italic' }}>
          Laget har inte spelat nog ihop för att kemi ska synas.
        </p>
      )}
    </>
  )
}
