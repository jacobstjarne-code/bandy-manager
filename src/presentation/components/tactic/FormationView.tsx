import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Player } from '../../../domain/entities/Player'
import type { FormationType } from '../../../domain/entities/Formation'
import { FORMATIONS, autoAssignFormation, getRecommendedFormation, FORMATION_META } from '../../../domain/entities/Formation'
import type { Tactic } from '../../../domain/entities/Club'
import { positionShort } from '../../../domain/format'
import { TACTIC_MENTALITY_LABELS, TACTIC_TEMPO_LABELS, TACTIC_PRESS_LABELS } from '../../../domain/data/enumLabels'
import { PlayerDot } from './PlayerDot'
import { computeLagstyrka, STYRKA_GAP_VARNING } from '../../utils/lagstyrka'
import { calculateLineupChemistry } from '../../../domain/services/chemistryService'
import { prioritizeByFitnessFloor } from '../../utils/lineupNudge'
interface FormationViewProps {
  tactic: Tactic
  players: Player[]  // entire squad
  onChange: (tactic: Tactic) => void
  chemistryStats?: Record<string, number>
}

const FORMATION_OPTIONS: FormationType[] = ['3-3-4', '5-3-2', '4-3-3', '3-4-3', '2-3-2-3', '4-2-4']

function PitchLines() {
  return (
    <>
      <defs>
        <radialGradient id="dot-ok" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="var(--tactic-dot-ok-start)"/>
          <stop offset="100%" stopColor="var(--tactic-dot-ok-end)"/>
        </radialGradient>
        <radialGradient id="dot-warn" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="var(--tactic-dot-warn-start)"/>
          <stop offset="100%" stopColor="var(--tactic-dot-warn-end)"/>
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

export function FormationView({ tactic, players, onChange, chemistryStats = {} }: FormationViewProps) {
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [autoFillMsg, setAutoFillMsg] = useState<string | null>(null)
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
    // A3-residualen (2026-08-31, Jacobs körorder): denna var kandidaturvalets
    // TREDJE, oberoende kopia — saknade både vilofiltret (restGamesRemaining,
    // A-H3 ben 2) och golv-medvetenheten (sorterade rå currentAbility, ingen
    // fitness-hänsyn). Ingen egen bekräftelsemodal här — matchtidens
    // FatigueFloorConfirm (LineupStep, via assessFatigueFloorBreach på den
    // faktiska elvan) fångar redan varje tvingad golvbrytning nedströms.
    // Den här fixen stoppar bara den tysta PREFERENSEN för slitna spelare.
    const available = players.filter(
      p => !p.isInjured && p.suspensionGamesRemaining <= 0 && (p.restGamesRemaining ?? 0) === 0,
    )
    const placedIds = new Set(Object.values(lineupSlots).filter(Boolean) as string[])
    const sorted = prioritizeByFitnessFloor(available.filter(p => !placedIds.has(p.id)))

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

  // Genomgång II B: kemi-lagret — alltid beräknat, linjer alltid synliga på planen.
  const chem = useMemo(() => {
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
  }, [template, lineupSlots, players, chemistryStats])

  return (
    <>
      {/* B3c: Tactic overview — read-only, links to lineup */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '6px 8px', borderRadius: 4,
        background: 'var(--bg-elevated)', border: '0.5px solid var(--border)',
        marginBottom: 10, flexWrap: 'wrap',
      }}>
        <span className="h-micro" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
          {TACTIC_MENTALITY_LABELS[tactic.mentality]}
        </span>
        <span className="h-micro" style={{ color: 'var(--border)' }}>·</span>
        <span className="h-micro" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
          Tempo: {TACTIC_TEMPO_LABELS[tactic.tempo]}
        </span>
        <span className="h-micro" style={{ color: 'var(--border)' }}>·</span>
        <span className="h-micro" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
          Press: {TACTIC_PRESS_LABELS[tactic.press]}
        </span>
        <button
          onClick={() => navigate('/game/squad')}
          className="h-micro"
          style={{
            marginLeft: 'auto', color: 'var(--accent)', fontWeight: 400,
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
        <p className="h-quote-sm" style={{ lineHeight: 1.5 }}>
          "{meta.coachQuote}"
        </p>
        <p className="h-micro" style={{ marginTop: 2 }}>— Coachen</p>
      </div>

      {/* Pitch SVG */}
      <svg viewBox="0 0 280 400" style={{ width: '100%', background: 'linear-gradient(180deg, var(--ice-rink), var(--ice-rink-deep))', border: '1px solid color-mix(in srgb, var(--ice-dark) 50%, transparent)', boxShadow: 'inset 0 1px 4px color-mix(in srgb, var(--ice-dark) 15%, transparent)', borderRadius: 'var(--radius-md)', display: 'block', maxHeight: 240 }}>
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

      {/* C-FT1: Lagstyrka — ärlig magnitud, samma evaluateSquad som motorn */}
      {styrka.utvilat > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 }}>
          <span className="h-label">Lagstyrka</span>
          <span style={{ fontSize: 12 }}>
            <span style={{ fontWeight: 800, color: styrka.gap >= STYRKA_GAP_VARNING ? 'var(--warm)' : 'var(--text-primary)' }}>{styrka.idag}</span>
            <span style={{ color: 'var(--text-muted)' }}> / {styrka.utvilat} utvilat</span>
          </span>
        </div>
      )}

      {/* Bench */}
      <div style={{ marginTop: 10 }}>
        <p className="h-label" style={{ marginBottom: 6 }}>
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
              <span className="h-label">{positionShort(p.position)}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center', lineHeight: 1.2, maxWidth: 48, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.lastName}
              </span>
              <span className="h-micro">{p.currentAbility}</span>
            </button>
          ))}
          {benchPlayers.length === 0 && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>Alla i startelvan</span>
          )}
        </div>
      </div>

      <div className="h-micro" style={{ display: 'flex', gap: 12, marginTop: 8, color: 'var(--text-secondary)', alignItems: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--tactic-dot-ok-end)', display: 'inline-block' }}/>
          Rätt plats
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--tactic-dot-warn-end)', display: 'inline-block' }}/>
          Fel position / låg ork
        </span>
        <span style={{ marginLeft: 'auto', fontStyle: 'italic', color: 'var(--text-muted)' }}>Dra för att byta</span>
      </div>
    </>
  )
}
