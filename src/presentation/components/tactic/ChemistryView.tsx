import { useState } from 'react'
import type { Player } from '../../../domain/entities/Player'
import type { FormationSlot } from '../../../domain/entities/Formation'
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

// ── B4b: Branch-based pair expand text ──────────────────────────────────────
// Texts from TEXT_REVIEW_formations_2026-04-20.md — copied exactly.
// Returns null when no concrete suggestion exists (tystnad > generalisering).
function getPairExpandText(
  playerA: Player,
  playerB: Player,
  slotA: FormationSlot,
  slotB: FormationSlot,
  chemistryStrength: 'strong' | 'weak' | 'neutral',
  seed: number,  // deterministic pick within session
): string | null {
  const nameA = playerA.lastName
  const nameB = playerB.lastName

  // Branch 1: New signing — overrides all other branches
  // Approximation: count career games in current club via seasonHistory
  function gamesInCurrentClub(p: Player): number {
    return (p.seasonHistory ?? [])
      .filter(s => s.clubId === p.clubId)
      .reduce((sum, s) => sum + s.games, 0)
  }
  const aIsNew = gamesInCurrentClub(playerA) < 5
  const bIsNew = gamesInCurrentClub(playerB) < 5
  if (aIsNew || bIsNew) {
    const ny = aIsNew ? nameA : nameB
    const gammal = aIsNew ? nameB : nameA
    const templates = [
      `"${ny} är ny i klubben. Ge det några matcher innan ni bygger anfall via dom båda."`,
      `"${ny} har inte hittat rytmen med ${gammal} än. Tålamod — kemin kommer."`,
    ]
    return templates[seed % templates.length]
  }

  const xDist = Math.abs(slotA.x - slotB.x)

  if (chemistryStrength === 'strong') {
    // Branch 2: Strong + together — already optimal, say nothing
    if (xDist <= 25) return null

    // Branch 3: Strong + far apart — unused potential, suggest side
    if (xDist > 50) {
      const sida = slotA.x < 40 ? 'vänster' : slotA.x > 60 ? 'höger' : null
      const templates = sida ? [
        `"${nameA} och ${nameB} har bra kemi — men sitter långt isär. Prova att flytta ihop dom på ${sida}."`,
        `"Stark koppling som inte utnyttjas. Överväg att sätta ${nameB} på ${sida} tillsammans med ${nameA}."`,
        `"Bra kemi men utspritt. Flytta ihop dom om laget tillåter."`,
      ] : [
        `"Bra kemi men utspritt. Flytta ihop dom om laget tillåter."`,
      ]
      return templates[seed % templates.length]
    }

    // Moderate distance — no concrete suggestion
    return null
  }

  if (chemistryStrength === 'weak') {
    // Branch 4: Weak + together — warn about direct passes
    if (xDist <= 25) {
      const templates = [
        `"${nameA} och ${nameB} läser inte varandra än. Undvik långa direktpass — låt dom spela via mittfältet."`,
        `"Svag koppling men dom kommer jobba ihop. Håll det enkelt tills dom hittar varandra."`,
        `"Om laget tillåter — sätt ${nameA} och ${nameB} på olika sidor tills kemin växt."`,
      ]
      return templates[seed % templates.length]
    }

    // Branch 5: Weak + far apart — low risk, say nothing
    return null
  }

  // Branch 6: Neutral — say nothing
  return null
}

export function ChemistryView({ tactic, players, chemistryStats }: ChemistryViewProps) {
  const [expandedPairKey, setExpandedPairKey] = useState<string | null>(null)

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
      <svg viewBox="0 0 280 400" style={{ width: '100%', background: 'var(--bg-surface)', borderRadius: 6, display: 'block', maxHeight: 240 }}>
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

      {/* B4b: Interactive pair list */}
      {chemistry.filter(c => Math.abs(c.strength) >= 0.25).sort((a, b) => Math.abs(b.strength) - Math.abs(a.strength)).slice(0, 4).map((pair, idx) => {
        const p1 = players.find(p => p.id === pair.playerId1)
        const p2 = players.find(p => p.id === pair.playerId2)
        if (!p1 || !p2) return null

        const pairKey = `${pair.playerId1}-${pair.playerId2}`
        const isExpanded = expandedPairKey === pairKey
        const isPositive = pair.strength > 0
        const strength: 'strong' | 'weak' | 'neutral' =
          pair.strength > 0.4 ? 'strong' : pair.strength < -0.2 ? 'weak' : 'neutral'

        const slotA = playerToSlot.get(pair.playerId1)
        const slotB = playerToSlot.get(pair.playerId2)
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
              <span style={{
                marginLeft: 'auto', fontSize: 9, fontWeight: 700,
                color: isPositive ? 'var(--success)' : 'var(--danger)',
              }}>
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

      {chemistry.every(c => Math.abs(c.strength) < 0.25) && (
        <p style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text-muted)', fontSize: 11, fontStyle: 'italic' }}>
          Laget har inte spelat nog ihop för att kemi ska synas.
        </p>
      )}
    </>
  )
}
