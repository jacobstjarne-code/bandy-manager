/**
 * C-B3 — Pensionsval-event
 * Portal-kort som visas när en veteran är aktuell för pensionsbeslut.
 */

import { useState } from 'react'
import { useGameStore } from '../../../store/gameStore'
import type { CardRenderProps } from '../portalTypes'
import { RETIREMENT_CHOICES } from '../../../../domain/data/retirementText'
import type { RetirementChoice } from '../../../../domain/data/retirementText'

export function RetirementDecisionSecondary({ game }: CardRenderProps) {
  const resolveRetirementDecision = useGameStore(s => s.resolveRetirementDecision)
  const [chosen, setChosen] = useState<RetirementChoice | null>(null)
  const [response, setResponse] = useState<string | null>(null)
  const [hoveredBtn, setHoveredBtn] = useState<RetirementChoice | null>(null)

  const decision = game.pendingRetirementDecision
  if (!decision) return null
  const player = game.players.find(p => p.id === decision.playerId)
  if (!player) return null

  const name = `${player.firstName} ${player.lastName}`

  function handleChoice(choiceKey: RetirementChoice) {
    if (chosen) return
    setChosen(choiceKey)
    const result = resolveRetirementDecision(decision!.playerId, choiceKey)
    setResponse(result.response)
  }

  return (
    <div className="portal-secondary-card" style={{ padding: '12px 14px' }}>
      <div className="portal-card-stripe portal-card-stripe-copper" />
      <div className="portal-card-eyebrow">🏁 PENSIONSVAL</div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, marginBottom: 4 }}>{name}</div>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', margin: '6px 0 10px' }}>
        {decision.quote}
      </p>
      {!chosen ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(Object.entries(RETIREMENT_CHOICES) as [RetirementChoice, { label: string; effect: string }][]).map(([key, { label, effect }]) => (
            <button
              key={key}
              onClick={() => handleChoice(key)}
              onMouseEnter={() => setHoveredBtn(key)}
              onMouseLeave={() => setHoveredBtn(null)}
              className={`weekly-decision-option-btn ${hoveredBtn === key ? 'weekly-decision-option-btn-hover' : 'weekly-decision-option-btn-idle'}`}
            >
              <span className="weekly-decision-option-label">{label}</span>
              <span className="weekly-decision-option-effect">{effect}</span>
            </button>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 12, color: 'var(--text-primary)', fontStyle: 'italic' }}>{response}</p>
      )}
    </div>
  )
}
