import { useState } from 'react'
import type { Player } from '../../../domain/entities/Player'
import type { FormationType } from '../../../domain/entities/Formation'
import { FORMATIONS, autoAssignFormation } from '../../../domain/entities/Formation'
import type { Tactic } from '../../../domain/entities/Club'
import { PlayerDot } from './PlayerDot'

interface FormationViewProps {
  tactic: Tactic
  players: Player[]  // entire squad
  onChange: (tactic: Tactic) => void
}

const FORMATION_OPTIONS: FormationType[] = ['5-3-2', '3-3-4', '4-3-3', '3-4-3', '2-3-2-3', '4-2-4']

function PitchLines() {
  return (
    <>
      {/* Outer rect fill */}
      <rect width="280" height="400" fill="rgba(196,122,58,0.04)" />
      {/* Center line */}
      <line x1="0" y1="200" x2="280" y2="200" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3,3" />
      {/* Center circle */}
      <circle cx="140" cy="200" r="35" fill="none" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3,3" />
      {/* Own goal area (top) */}
      <rect x="90" y="0" width="100" height="28" fill="none" stroke="var(--border)" strokeWidth="0.5" />
      {/* Opponent goal area (bottom) */}
      <rect x="90" y="372" width="100" height="28" fill="none" stroke="var(--border)" strokeWidth="0.5" />
    </>
  )
}

export function FormationView({ tactic, players, onChange }: FormationViewProps) {
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)

  const formation = tactic.formation ?? '5-3-2'
  const template = FORMATIONS[formation]
  const lineupSlots = tactic.lineupSlots ?? autoAssignFormation(template, players)

  // Starters: players currently in slots
  const starterIds = new Set(Object.values(lineupSlots).filter(Boolean) as string[])
  const benchPlayers = players.filter(p => !starterIds.has(p.id) && !p.isInjured && p.suspensionGamesRemaining === 0)

  function changeFormation(f: FormationType) {
    const newTemplate = FORMATIONS[f]
    const newLineup = autoAssignFormation(newTemplate, players)
    onChange({ ...tactic, formation: f, lineupSlots: newLineup })
    setSelectedSlotId(null)
  }

  function handleSlotClick(slotId: string) {
    if (selectedSlotId === null) {
      // Select this slot for swapping
      setSelectedSlotId(slotId)
    } else if (selectedSlotId === slotId) {
      // Deselect
      setSelectedSlotId(null)
    } else {
      // Swap the two slots
      const newSlots = { ...lineupSlots }
      const tmp = newSlots[selectedSlotId]
      newSlots[selectedSlotId] = newSlots[slotId]
      newSlots[slotId] = tmp ?? null
      onChange({ ...tactic, lineupSlots: newSlots })
      setSelectedSlotId(null)
    }
  }

  function swapWithBench(benchPlayerId: string) {
    if (!selectedSlotId) return
    const newSlots = { ...lineupSlots }
    // Find if bench player is in some other slot (shouldn't be, but safety check)
    const existingSlot = Object.entries(newSlots).find(([, pid]) => pid === benchPlayerId)?.[0]
    if (existingSlot) {
      newSlots[existingSlot] = newSlots[selectedSlotId]
    }
    newSlots[selectedSlotId] = benchPlayerId
    onChange({ ...tactic, lineupSlots: newSlots })
    setSelectedSlotId(null)
  }

  return (
    <>
      {/* Formation selector */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
        {FORMATION_OPTIONS.map(f => (
          <button
            key={f}
            onClick={() => changeFormation(f)}
            style={{
              padding: '5px 8px',
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 4,
              border: formation === f ? 'none' : '1px solid var(--accent)',
              background: formation === f ? 'var(--accent)' : 'transparent',
              color: formation === f ? '#fff' : 'var(--accent)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Pitch SVG */}
      <svg viewBox="0 0 280 400" style={{ width: '100%', background: 'var(--bg-surface)', borderRadius: 6, display: 'block', maxHeight: 240 }}>
        <PitchLines />
        {template.slots.map(slot => {
          const playerId = lineupSlots[slot.id]
          const player = playerId ? players.find(p => p.id === playerId) ?? null : null
          return (
            <PlayerDot
              key={slot.id}
              slot={slot}
              player={player}
              onClick={() => handleSlotClick(slot.id)}
              isSelected={selectedSlotId === slot.id}
            />
          )
        })}
      </svg>

      {/* Bench */}
      <div style={{ marginTop: 10 }}>
        <p style={{ fontSize: 9, letterSpacing: '1.5px', color: 'var(--text-muted)', marginBottom: 6 }}>
          {selectedSlotId ? '▶ VÄLJ FRÅN BÄNKEN ELLER EN ANNAN POSITION' : 'BÄNKEN'}
        </p>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {benchPlayers.slice(0, 10).map(p => (
            <button
              key={p.id}
              onClick={() => selectedSlotId ? swapWithBench(p.id) : setSelectedSlotId(null)}
              style={{
                flexShrink: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '6px 8px', borderRadius: 6, width: 56,
                border: `1px solid ${selectedSlotId ? 'var(--accent)' : 'var(--border)'}`,
                background: selectedSlotId ? 'rgba(196,122,58,0.1)' : 'var(--bg-dark-surface)',
                cursor: selectedSlotId ? 'pointer' : 'default',
              }}
            >
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)' }}>{p.position.slice(0, 3).toUpperCase()}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-light)', textAlign: 'center', lineHeight: 1.2, maxWidth: 48, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.lastName}
              </span>
              <span style={{ fontSize: 9, color: 'var(--text-light-secondary)' }}>{p.currentAbility}</span>
            </button>
          ))}
          {benchPlayers.length === 0 && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>Alla i startelvan</span>
          )}
        </div>
      </div>

      <p style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 8 }}>
        Tryck på en position för att byta. Formation påverkar nästa match.
      </p>
    </>
  )
}
