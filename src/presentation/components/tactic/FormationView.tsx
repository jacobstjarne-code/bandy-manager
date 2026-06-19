import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Player } from '../../../domain/entities/Player'
import type { FormationType } from '../../../domain/entities/Formation'
import { FORMATIONS, autoAssignFormation, getRecommendedFormation, FORMATION_META } from '../../../domain/entities/Formation'
import type { Tactic } from '../../../domain/entities/Club'
import { PlayerDot } from './PlayerDot'
import { computeLagstyrka, STYRKA_GAP_VARNING } from '../../utils/lagstyrka'
import { calculateLineupChemistry } from '../../../domain/services/chemistryService'
import { getPairExpandText } from './chemistryPairText'

interface FormationViewProps {
  tactic: Tactic
  players: Player[]  // entire squad
  onChange: (tactic: Tactic) => void
  // Genomgång II B: kemin är ett lager på samma plan, inte en egen vy.
  showChemistry?: boolean
  chemistryStats?: Record<string, number>
}

const FORMATION_OPTIONS: FormationType[] = ['3-3-4', '5-3-2', '4-3-3', '3-4-3', '2-3-2-3', '4-2-4']

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
      <defs>
        <radialGradient id="dot-ok" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#6BAA5A"/>
          <stop offset="100%" stopColor="#4A8A3A"/>
        </radialGradient>
        <radialGradient id="dot-warn" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#C46A5A"/>
          <stop offset="100%" stopColor="#A04030"/>
        </radialGradient>
        <filter id="dot-shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.25"/>
        </filter>
      </defs>
      {/* Center line */}
      <line x1="0" y1="200" x2="280" y2="200" stroke="rgba(90,122,138,.4)" strokeWidth="0.5" strokeDasharray="3,3" />
      {/* Center circle */}
      <circle cx="140" cy="200" r="35" fill="none" stroke="rgba(90,122,138,.4)" strokeWidth="0.5" strokeDasharray="3,3" />
      {/* Own goal area (top) */}
      <rect x="90" y="0" width="100" height="28" fill="none" stroke="rgba(90,122,138,.4)" strokeWidth="0.5" />
      {/* Opponent goal area (bottom) */}
      <rect x="90" y="372" width="100" height="28" fill="none" stroke="rgba(90,122,138,.4)" strokeWidth="0.5" />
    </>
  )
}

export function FormationView({ tactic, players, onChange, showChemistry = false, chemistryStats = {} }: FormationViewProps) {
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [autoFillMsg, setAutoFillMsg] = useState<string | null>(null)
  const [expandedPairKey, setExpandedPairKey] = useState<string | null>(null)
  const autoFillTimerRef = useRef<number | null>(null)
  const navigate = useNavigate()

  useEffect(() => () => {
    if (autoFillTimerRef.current) clearTimeout(autoFillTimerRef.current)
  }, [])

  const formation = tactic.formation ?? '3-3-4'
  const template = FORMATIONS[formation]
  const rawLineupSlots = tactic.lineupSlots ?? autoAssignFormation(template, players)

  const lineupSlots = useMemo(() => {
    const slots: Record<string, string | null> = {}
    for (const [slotId, playerId] of Object.entries(rawLineupSlots)) {
      if (!playerId) { slots[slotId] = null; continue }
      const player = players.find(p => p.id === playerId)
      if (!player || player.isInjured || player.suspensionGamesRemaining > 0) {
        slots[slotId] = null; continue
      }
      slots[slotId] = playerId
    }
    return slots
  }, [rawLineupSlots, players])

  const recommended = getRecommendedFormation(players)

  // Starters: players currently in slots
  const starterIds = useMemo(
    () => new Set(Object.values(lineupSlots).filter(Boolean) as string[]),
    [lineupSlots],
  )
  const benchPlayers = players.filter(p => !starterIds.has(p.id) && !p.isInjured && p.suspensionGamesRemaining === 0)

  function handleAutoFill() {
    const available = players.filter(p => !p.isInjured && p.suspensionGamesRemaining <= 0)
    const placedIds = new Set(Object.values(lineupSlots).filter(Boolean) as string[])
    const sorted = [...available]
      .filter(p => !placedIds.has(p.id))
      .sort((a, b) => b.currentAbility - a.currentAbility)

    const newLineupSlots = { ...lineupSlots }
    const emptySlots = template.slots.filter(s => !newLineupSlots[s.id])
    const emptyCount = emptySlots.length

    // Try to fill empty slots with position-matched players first
    for (const slot of emptySlots) {
      const matchIdx = sorted.findIndex(p => p.position === slot.position)
      if (matchIdx >= 0) {
        newLineupSlots[slot.id] = sorted[matchIdx].id
        sorted.splice(matchIdx, 1)
        continue
      }
      // Fallback: any available player
      if (sorted.length > 0) {
        newLineupSlots[slot.id] = sorted[0].id
        sorted.shift()
      }
    }

    onChange({ ...tactic, lineupSlots: newLineupSlots })
    setSelectedSlotId(null)
    setAutoFillMsg(
      emptyCount === 0
        ? 'Elvan är redan komplett — tryck på en spelare för att byta.'
        : `Fyllde ${emptyCount} ${emptyCount === 1 ? 'plats' : 'platser'} med bästa tillgängliga.`,
    )
    if (autoFillTimerRef.current) clearTimeout(autoFillTimerRef.current)
    autoFillTimerRef.current = window.setTimeout(() => setAutoFillMsg(null), 3000)
  }

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

  const styrka = useMemo(
    () => computeLagstyrka(Array.from(starterIds), players, tactic),
    [starterIds, players, tactic],
  )

  // Genomgång II B: kemi-lagret — samma koordinater (x*2.8, y*4) som dot-mappningen,
  // beräknas bara när lagret är på.
  const chem = useMemo(() => {
    if (!showChemistry) return null
    const slotPlayers = template.slots.map(slot => ({
      slot,
      player: lineupSlots[slot.id] ? (players.find(p => p.id === lineupSlots[slot.id]) ?? null) : null,
    }))
    const starters = slotPlayers.filter(sp => sp.player).map(sp => sp.player as Player)
    const chemistry = calculateLineupChemistry(starters, chemistryStats)
    const playerToSlot = new Map<string, typeof template.slots[0]>()
    for (const sp of slotPlayers) if (sp.player) playerToSlot.set(sp.player.id, sp.slot)
    const topPairs = chemistry
      .filter(c => Math.abs(c.strength) >= 0.25)
      .sort((a, b) => Math.abs(b.strength) - Math.abs(a.strength))
    return { chemistry, playerToSlot, topPairs }
  }, [showChemistry, template, lineupSlots, players, chemistryStats])

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

      {/* Auto-fill button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: autoFillMsg ? 4 : 8 }}>
        <button
          onClick={handleAutoFill}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '5px 10px',
            background: 'transparent',
            border: '1.5px solid var(--accent)',
            color: 'var(--accent-dark)',
            fontSize: 11, fontWeight: 600,
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          ✦ Fyll bästa elvan
        </button>
      </div>
      {autoFillMsg && (
        <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'right', marginBottom: 8, fontStyle: 'italic' }}>
          {autoFillMsg}
        </p>
      )}

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
      <svg viewBox="0 0 280 400" style={{ width: '100%', background: 'linear-gradient(180deg, #F4F6F5, #E0E6E6)', border: '1px solid color-mix(in srgb, var(--ice-dark) 50%, transparent)', boxShadow: 'inset 0 1px 4px color-mix(in srgb, var(--ice-dark) 15%, transparent)', borderRadius: 'var(--radius-md)', display: 'block', maxHeight: 240 }}>
        <PitchLines />

        {/* Kemi-lager: linjer mellan inspelta/svaga par, under spelarprickarna */}
        {chem?.topPairs.map(pair => {
          const s1 = chem.playerToSlot.get(pair.playerId1)
          const s2 = chem.playerToSlot.get(pair.playerId2)
          if (!s1 || !s2) return null
          const x1 = s1.x * 2.8, y1 = s1.y * 4
          const x2 = s2.x * 2.8, y2 = s2.y * 4
          const isPositive = pair.strength > 0
          return (
            <line
              key={`chem-${pair.playerId1}-${pair.playerId2}`}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={isPositive ? 'var(--success)' : 'var(--danger)'}
              strokeWidth={1 + Math.abs(pair.strength) * 2}
              opacity={0.55}
              strokeDasharray={isPositive ? undefined : '4,3'}
            />
          )
        })}

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

      {/* Kemi-lagret: legend + interaktiv par-lista under planen (genomgång II B) */}
      {showChemistry && chem && (
        <>
          <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--bg-elevated)', borderRadius: 4, border: '0.5px solid var(--border)' }}>
            <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1.5px', color: 'var(--text-muted)', marginBottom: 6 }}>
              KEMIN I LAGET
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 20, height: 2, background: 'var(--success)', flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Stark koppling</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 20, height: 2, background: 'var(--danger)', flexShrink: 0, borderBottom: '1px dashed var(--danger)' }} />
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Svag koppling</span>
              </div>
            </div>
          </div>

          {chem.chemistry.filter(c => Math.abs(c.strength) >= 0.25).sort((a, b) => Math.abs(b.strength) - Math.abs(a.strength)).slice(0, 4).map((pair, idx) => {
            const p1 = players.find(p => p.id === pair.playerId1)
            const p2 = players.find(p => p.id === pair.playerId2)
            if (!p1 || !p2) return null
            const pairKey = `${pair.playerId1}-${pair.playerId2}`
            const isExpanded = expandedPairKey === pairKey
            const isPositive = pair.strength > 0
            const strength: 'strong' | 'weak' | 'neutral' =
              pair.strength > 0.4 ? 'strong' : pair.strength < -0.2 ? 'weak' : 'neutral'
            const slotA = chem.playerToSlot.get(pair.playerId1)
            const slotB = chem.playerToSlot.get(pair.playerId2)
            const expandText = (isExpanded && slotA && slotB)
              ? getPairExpandText(p1, p2, slotA, slotB, strength, idx)
              : null
            return (
              <div key={pairKey}>
                <div
                  onClick={() => setExpandedPairKey(isExpanded ? null : pairKey)}
                  style={{
                    padding: '6px 10px', fontSize: 11, borderBottom: '0.5px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                    background: isExpanded ? 'var(--bg-elevated)' : 'transparent',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                    {p1.lastName} × {p2.lastName}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                    {pair.reasons.join(' · ')}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: isPositive ? 'var(--success)' : 'var(--danger)' }}>
                    {isPositive ? '↑' : '↓'}
                  </span>
                </div>
                {isExpanded && expandText && (
                  <div style={{
                    padding: '8px 12px', fontSize: 11,
                    color: 'var(--text-secondary)', fontFamily: 'var(--font-display)',
                    background: 'var(--bg-elevated)', borderBottom: '0.5px solid var(--border)',
                    lineHeight: 1.5,
                  }}>
                    💡 {expandText}
                  </div>
                )}
              </div>
            )
          })}

          {chem.chemistry.every(c => Math.abs(c.strength) < 0.25) && (
            <p style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text-muted)', fontSize: 11, fontStyle: 'italic' }}>
              Laget har inte spelat nog ihop för att kemi ska synas.
            </p>
          )}
        </>
      )}

      {/* C-FT1: Lagstyrka — ärlig magnitud, samma evaluateSquad som motorn */}
      {styrka.utvilat > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Lagstyrka</span>
          <span style={{ fontSize: 12 }}>
            <span style={{ fontWeight: 800, color: styrka.gap >= STYRKA_GAP_VARNING ? 'var(--warm)' : 'var(--text-primary)' }}>{styrka.idag}</span>
            <span style={{ color: 'var(--text-muted)' }}> / {styrka.utvilat} utvilat</span>
          </span>
        </div>
      )}

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
                padding: '6px 8px', borderRadius: 'var(--radius-md)', width: 56,
                border: `1px solid ${selectedSlotId ? 'var(--accent)' : 'var(--border)'}`,
                background: selectedSlotId ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'var(--bg-elevated)',
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

      <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 9, color: 'var(--text-secondary)', alignItems: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#4A8A3A', display: 'inline-block' }}/>
          Rätt plats
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#A04030', display: 'inline-block' }}/>
          Fel position / låg ork
        </span>
        <span style={{ marginLeft: 'auto', fontStyle: 'italic', color: 'var(--text-muted)' }}>Dra för att byta</span>
      </div>
    </>
  )
}
