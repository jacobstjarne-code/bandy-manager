import { useState, useRef, useEffect } from 'react'
import type { CardRenderProps } from '../portalTypes'
import { useGameStore } from '../../../store/gameStore'
import type { WeeklyDecision, WeeklyDecisionCategory } from '../../../../domain/services/weeklyDecisionService'

const CATEGORY_META: Record<WeeklyDecisionCategory, { label: string }> = {
  player:    { label: 'Veckans beslut' },
  supporter: { label: 'Veckans supporterfråga' },
  training:  { label: 'Veckans beslut' },
  community: { label: 'Veckans beslut' },
}

export function WeeklyDecisionSecondary({ game }: CardRenderProps) {
  const resolveWeeklyDecision = useGameStore(s => s.resolveWeeklyDecision)
  const [resolvedInfo, setResolvedInfo] = useState<{ label: string; effect: string } | null>(null)
  const [hoveredBtn, setHoveredBtn] = useState<'A' | 'B' | null>(null)
  const capturedDecision = useRef<WeeklyDecision | null>(game.pendingWeeklyDecision ?? null)
  const resolvedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (game.pendingWeeklyDecision) {
      capturedDecision.current = game.pendingWeeklyDecision
      if (resolvedTimeoutRef.current) clearTimeout(resolvedTimeoutRef.current)
      setResolvedInfo(null)
    }
  }, [game.pendingWeeklyDecision])

  const decision = capturedDecision.current
  if (!decision) return null
  if (!game.pendingWeeklyDecision && !resolvedInfo) return null

  const meta = CATEGORY_META[decision.category]
  const isSupporter = decision.category === 'supporter'

  function handleChoice(choice: 'A' | 'B') {
    if (resolvedInfo) return
    const option = choice === 'A' ? decision!.optionA : decision!.optionB
    setResolvedInfo({ label: option.label, effect: option.effect })
    resolveWeeklyDecision(choice)
    if (resolvedTimeoutRef.current) clearTimeout(resolvedTimeoutRef.current)
    resolvedTimeoutRef.current = setTimeout(() => setResolvedInfo(null), 2600)
  }

  const isResolved = !!resolvedInfo

  return (
    <div className="portal-secondary-card">
      {/* Left stripe */}
      <div className={`portal-card-stripe ${isSupporter ? 'portal-card-stripe-warm' : 'portal-card-stripe-copper-wide'}`} />

      {/* Chevron affordance */}
      <span className="portal-card-chevron">›</span>

      {/* Eyebrow label */}
      <div className="portal-card-eyebrow">{meta.label}</div>

      {/* Question */}
      <div
        className="weekly-decision-question"
        style={{ marginBottom: isResolved ? 0 : 12, opacity: isResolved ? 0.5 : 1 }}
      >
        {decision.question}
      </div>

      {isResolved ? (
        <div className="weekly-decision-resolved">
          <div className="weekly-decision-check">✓</div>
          <div className="weekly-decision-resolved-text">
            <strong style={{ fontStyle: 'normal', color: 'var(--text-light)', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
              {resolvedInfo.label}.
            </strong>
            {' '}{resolvedInfo.effect}
          </div>
        </div>
      ) : (
        <div className="weekly-decision-options">
          {(['A', 'B'] as const).map(choice => {
            const opt = choice === 'A' ? decision.optionA : decision.optionB
            const isHovered = hoveredBtn === choice
            return (
              <button
                key={choice}
                onClick={() => handleChoice(choice)}
                onMouseEnter={() => setHoveredBtn(choice)}
                onMouseLeave={() => setHoveredBtn(null)}
                className={`weekly-decision-option-btn ${isHovered ? 'weekly-decision-option-btn-hover' : 'weekly-decision-option-btn-idle'}`}
              >
                <span className="weekly-decision-option-label">{opt.label}</span>
                <span className="weekly-decision-option-effect">{opt.effect}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
