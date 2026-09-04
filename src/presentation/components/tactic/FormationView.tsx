import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Player } from '../../../domain/entities/Player'
import type { FormationType } from '../../../domain/entities/Formation'
import { FORMATIONS, autoAssignFormation, getRecommendedFormation, FORMATION_META } from '../../../domain/entities/Formation'
import type { Tactic } from '../../../domain/entities/Club'
import { positionShort } from '../../../domain/format'
import { TACTIC_MENTALITY_LABELS, TACTIC_TEMPO_LABELS } from '../../../domain/data/enumLabels'
import { PlayerDot } from './PlayerDot'
import { BandyPitch } from '../BandyPitch'
import { computeLagstyrka, STYRKA_GAP_VARNING } from '../../utils/lagstyrka'
import { calculateLineupChemistry } from '../../../domain/services/chemistryService'
import { prioritizeByFitnessFloor, SPELKLARHET_FITNESS_FLOOR } from '../../utils/lineupNudge'
import { getSelectionScore, getPositionFit } from '../../../domain/services/squadEvaluator'

// taktik-fyll-elvan-tre-lagen (Playtest Taktik 2026-09-03 MEDIUM 2, Jacobs
// dom 2026-09-03): "Fyll bästa elvan" prioriterade bara styrka och kunde
// starta spelare på 20–35 % kondition trots A3-golvet. Tre lägen, alla
// golv-medvetna (SPELKLARHET_FITNESS_FLOOR respekteras av samtliga).
type AutoFillMode = 'strongest' | 'rested' | 'matchfit'

const AUTOFILL_MODE_LABELS: Record<AutoFillMode, string> = {
  strongest: 'Starkast',
  rested: 'Mest utvilad',
  matchfit: 'Bäst för dagens match',
}

interface FormationViewProps {
  tactic: Tactic
  players: Player[]  // entire squad
  onChange: (tactic: Tactic) => void
  chemistryStats?: Record<string, number>
  lineupConfirmedThisRound?: boolean
}

// DOM_FORMATIONER_V2_2026-09-04.md: dömd ordning, #1 (532_tvatoppar) default.
const FORMATION_OPTIONS: FormationType[] = ['532_tvatoppar', '532_triangel', '532_ytterben', '532_hogahalvor', '523_hog', '541_hem']

export function FormationView({ tactic, players, onChange, chemistryStats = {}, lineupConfirmedThisRound = false }: FormationViewProps) {
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [autoFillMsg, setAutoFillMsg] = useState<string | null>(null)
  // Default = Bäst för dagens match (Jacobs dom 2026-09-03).
  const [autoFillMode, setAutoFillMode] = useState<AutoFillMode>('matchfit')
  const autoFillTimerRef = useRef<number | null>(null)
  const navigate = useNavigate()

  useEffect(() => () => {
    if (autoFillTimerRef.current) clearTimeout(autoFillTimerRef.current)
  }, [])

  const formation = tactic.formation ?? '532_tvatoppar'
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

  // En bekräftad elva är spelarens frusna val för omgången. Skador/form kan
  // ändras efter bekräftelsen, men rekommendationsmarkeringen får då inte
  // börja peka mot en annan formation och se ut som en ny uppmaning.
  const recommended = lineupConfirmedThisRound ? formation : getRecommendedFormation(players)

  // Starters: players currently in slots
  const starterIds = useMemo(
    () => new Set(Object.values(lineupSlots).filter(Boolean) as string[]),
    [lineupSlots],
  )
  const benchPlayers = players.filter(p => !starterIds.has(p.id) && !p.isInjured && p.suspensionGamesRemaining === 0)

  // Mest utvilad: sortera på kondition (över golvet, sedan CA) istf ren CA.
  // Golv-partitionen (över/under SPELKLARHET_FITNESS_FLOOR) är densamma som
  // prioritizeByFitnessFloor — bara ORDNINGEN inom respektive block byts.
  function sortByRest(pool: Player[]): Player[] {
    const byRestThenCA = (a: Player, b: Player) => b.fitness - a.fitness || getSelectionScore(b) - getSelectionScore(a)
    const above = pool.filter(p => p.fitness >= SPELKLARHET_FITNESS_FLOOR).sort(byRestThenCA)
    const below = pool.filter(p => p.fitness < SPELKLARHET_FITNESS_FLOOR).sort(byRestThenCA)
    return [...above, ...below]
  }

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
    const candidates = available.filter(p => !placedIds.has(p.id))
    // taktik-fyll-elvan-tre-lagen: Starkast och Bäst för dagens match delar
    // samma golv-medvetna CA-sortering för EXAKT positionsmatch (positions-
    // passningen är redan 1 där) — de skiljer sig bara i FALLBACK-steget
    // nedan, där matchfit väger in positionspassning för spelare utan exakt
    // matchning. Exakt viktning mäts i kalibreringsrundan C2 — enkel start.
    const sorted = autoFillMode === 'rested' ? sortByRest(candidates) : prioritizeByFitnessFloor(candidates)

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
      if (sorted.length === 0) continue
      if (autoFillMode === 'matchfit') {
        let bestIdx = 0
        let bestScore = -Infinity
        sorted.forEach((p, idx) => {
          const score = getSelectionScore(p) * getPositionFit(p.position, slot.position)
          if (score > bestScore) { bestScore = score; bestIdx = idx }
        })
        newLineupSlots[slot.id] = sorted[bestIdx].id
        sorted.splice(bestIdx, 1)
        continue
      }
      // Fallback: bästa (i den redan valda sorteringsordningen) tillgängliga
      newLineupSlots[slot.id] = sorted[0].id
      sorted.shift()
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

      {/* taktik-fyll-elvan-tre-lagen: lägesväljare för autofyll-knappen */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
        {(['strongest', 'rested', 'matchfit'] as const).map(m => (
          <button
            key={m}
            onClick={() => setAutoFillMode(m)}
            className={`btn ${autoFillMode === m ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '3px 8px', fontSize: 10 }}
          >
            {AUTOFILL_MODE_LABELS[m]}
          </button>
        ))}
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

      {/* DOM_FORMATIONER_V2_2026-09-04.md / FORMATIONER_V2_TEXT_2026-09-04.md:
          "Uppställning" — bandyns ord, inte "Formation". Text kopierad ordagrant. */}
      <p className="h-label" style={{ marginBottom: 4 }}>Uppställning</p>
      <p className="h-micro" style={{ color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.4 }}>
        Femman bak är alltid femman bak. Det du väljer är hur de fem främre står — och hur högt laget försvarar.
      </p>

      {/* Formation selector with coach recommendation */}
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
              {FORMATIONS[f].label}
            </button>
            {recommended === f && (
              <span style={{ fontSize: 8, color: 'var(--success)', fontWeight: 700, letterSpacing: '0.5px' }}>
                ★ COACH
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Villkorade varningsrader, TEXT LÅST (FORMATIONER_V2_TEXT_2026-09-04.md §Taktikskärmen) */}
      {formation === '523_hog' && (
        // adherence-semantic-key: --warm är avsiktlig — en faktisk kostnadsvarning (kondition), inte dekoration.
        <p className="h-micro" style={{ color: 'var(--warm)', marginBottom: 8 }}>
          Kostar kondition varje omgång den används.
        </p>
      )}
      {formation === '541_hem' && (
        <p className="h-micro" style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
          Färre egna chanser. Färre av deras.
        </p>
      )}

      {/* Formation anatomy tags + coach quote + truppkrav — TEXT LÅST, kopierat ordagrant */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
          {meta.tags.map(tag => (
            <span key={tag} className="tag tag-ghost">{tag}</span>
          ))}
        </div>
        <p className="h-quote-sm" style={{ lineHeight: 1.5 }}>
          "{meta.coachQuote}"
        </p>
        <p className="h-micro" style={{ marginTop: 2 }}>— Coachen</p>
        <p className="h-micro" style={{ marginTop: 6, color: 'var(--text-secondary)' }}>
          Kräver: {meta.requires}
        </p>
      </div>

      {/* Gemensamt planskal; kemi och spelarinteraktioner är FormationViews lager. */}
      <BandyPitch variant="tactical" style={{ width: '100%', maxHeight: 400 }}>

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
      </BandyPitch>

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
