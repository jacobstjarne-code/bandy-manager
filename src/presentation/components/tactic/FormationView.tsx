import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Player } from '../../../domain/entities/Player'
import type { FormationType } from '../../../domain/entities/Formation'
import { FORMATIONS, autoAssignFormation, getRecommendedFormation, FORMATION_META } from '../../../domain/entities/Formation'
import type { Tactic } from '../../../domain/entities/Club'
import { PlayerDot } from './PlayerDot'

interface FormationViewProps {
  tactic: Tactic
  players: Player[]  // entire squad
  onChange: (tactic: Tactic) => void
}

const FORMATION_OPTIONS: FormationType[] = ['5-3-2', '3-3-4', '4-3-3', '3-4-3', '2-3-2-3', '4-2-4']

const MENTALITY_LABELS: Record<string, string> = {
  defensive: 'Defensiv', balanced: 'Balanserad', offensive: 'Offensiv',
}
const TEMPO_LABELS: Record<string, string> = {
  low: 'Lågt', normal: 'Normal', high: 'Högt',
}
const PRESS_LABELS: Record<string, string> = {
  low: 'Lågt', medium: 'Medel', high: 'Högt',
}

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
  const navigate = useNavigate()

  const formation = tactic.formation ?? '5-3-2'
  const template = FORMATIONS[formation]
  const lineupSlots = tactic.lineupSlots ?? autoAssignFormation(template, players)
  const recommended = getRecommendedFormation(players)

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

  const meta = FORMATION_META[formation]

  return (
    <>
      {/* B3c: Tactic overview — read-only, links to lineup */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '6px 8px', borderRadius: 4,
        background: 'var(--bg-elevated)', border: '0.5px solid var(--border)',
        marginBottom: 10, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>
          {MENTALITY_LABELS[tactic.mentality] ?? tactic.mentality}
        </span>
        <span style={{ fontSize: 9, color: 'var(--border)' }}>·</span>
        <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>
          Tempo: {TEMPO_LABELS[tactic.tempo] ?? tactic.tempo}
        </span>
        <span style={{ fontSize: 9, color: 'var(--border)' }}>·</span>
        <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>
          Press: {PRESS_LABELS[tactic.press] ?? tactic.press}
        </span>
        <button
          onClick={() => navigate('/game/squad')}
          style={{
            marginLeft: 'auto', fontSize: 9, color: 'var(--accent)', fontWeight: 400,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            textDecoration: 'underline',
          }}
        >
          ändras i lineup
        </button>
      </div>

      {/* B1c: Formation selector with coach recommendation */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
        {FORMATION_OPTIONS.map(f => (
          <div key={f} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <button
              onClick={() => changeFormation(f)}
              style={{
                padding: '5px 8px',
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 4,
                border: formation === f ? 'none' : '1px solid var(--accent)',
                background: formation === f ? 'var(--accent)' : 'transparent',
                color: formation === f ? 'var(--text-light)' : 'var(--accent)',
                cursor: 'pointer',
                flexShrink: 0,
                outline: recommended === f && formation !== f ? '1px solid var(--success)' : 'none',
                outlineOffset: 1,
              }}
            >
              {f}
            </button>
            {recommended === f && (
              <span style={{ fontSize: 8, color: 'var(--success)', fontWeight: 700, letterSpacing: '0.5px' }}>
                ★ COACH
              </span>
            )}
          </div>
        ))}
      </div>

      {/* B2c: Formation anatomy tags + coach quote */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
          {meta.tags.map(tag => (
            <span key={tag} className="tag tag-ghost">{tag}</span>
          ))}
        </div>
        <p style={{
          fontFamily: 'var(--font-display)', fontSize: 11, fontStyle: 'italic',
          color: 'var(--text-secondary)', lineHeight: 1.5,
        }}>
          "{meta.coachQuote}"
        </p>
        <p style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>— Coachen</p>
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
                background: selectedSlotId ? 'rgba(196,122,58,0.1)' : 'var(--bg-elevated)',
                cursor: selectedSlotId ? 'pointer' : 'default',
              }}
            >
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)' }}>{p.position.slice(0, 3).toUpperCase()}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center', lineHeight: 1.2, maxWidth: 48, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.lastName}
              </span>
              <span style={{ fontSize: 9, color: 'var(--text-secondary)' }}>{p.currentAbility}</span>
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
