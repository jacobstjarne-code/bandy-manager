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

  useEffect(() => {
    if (game.pendingWeeklyDecision) {
      capturedDecision.current = game.pendingWeeklyDecision
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
    setTimeout(() => setResolvedInfo(null), 1500)
  }

  const isResolved = !!resolvedInfo

  return (
    <div style={{
      position: 'relative',
      background: 'var(--bg-portal-surface)',
      border: '1px solid rgba(196,122,58,0.15)',
      borderRadius: 8,
      padding: '14px 16px 14px 18px',
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'background 0.15s, border-color 0.15s',
    }}>
      {/* Left stripe — 3px warm for relations/supporter */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: isSupporter ? 3 : 2,
        background: isSupporter ? 'var(--warm)' : 'var(--copper)',
        borderRadius: '8px 0 0 8px',
      }} />

      {/* Chevron affordance */}
      <span style={{
        position: 'absolute', right: 14, top: 14,
        color: 'var(--text-muted)', fontSize: 14, opacity: 0.5,
        lineHeight: 1,
      }}>›</span>

      {/* Eyebrow label */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 9, fontWeight: 600,
        letterSpacing: '2px', textTransform: 'uppercase',
        color: 'var(--copper)', opacity: 0.85,
        marginBottom: 10,
      }}>
        {meta.label}
      </div>

      {/* Question */}
      <div style={{
        fontFamily: 'var(--font-display)', fontStyle: 'italic',
        fontSize: 14, fontWeight: 400, lineHeight: 1.5,
        color: 'var(--text-light)',
        marginBottom: isResolved ? 0 : 12,
        opacity: isResolved ? 0.5 : 1,
        transition: 'opacity 0.2s',
      }}>
        {decision.question}
      </div>

      {isResolved ? (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 4px 0' }}>
          <div style={{
            width: 16, height: 16, borderRadius: '50%',
            background: 'rgba(160, 200, 144, 0.2)',
            color: '#A0C890',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700,
            flexShrink: 0, marginTop: 1,
          }}>
            ✓
          </div>
          <div style={{
            fontFamily: 'var(--font-display)', fontStyle: 'italic',
            fontSize: 12, color: 'var(--text-light-secondary)', lineHeight: 1.4,
          }}>
            <strong style={{
              fontStyle: 'normal', color: 'var(--text-light)',
              fontWeight: 600, fontFamily: 'var(--font-body)',
            }}>
              {resolvedInfo.label}.
            </strong>
            {' '}{resolvedInfo.effect}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          {(['A', 'B'] as const).map(choice => {
            const opt = choice === 'A' ? decision.optionA : decision.optionB
            const isHovered = hoveredBtn === choice
            return (
              <button
                key={choice}
                onClick={() => handleChoice(choice)}
                onMouseEnter={() => setHoveredBtn(choice)}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  flex: 1,
                  display: 'flex', flexDirection: 'column',
                  padding: '10px 12px',
                  background: isHovered ? 'rgba(196,122,58,0.1)' : 'transparent',
                  border: `1px solid ${isHovered ? 'var(--accent)' : 'rgba(196,122,58,0.4)'}`,
                  borderRadius: 3,
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'background 0.12s, border-color 0.12s',
                }}
              >
                <span style={{
                  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
                  color: 'var(--text-light)',
                }}>
                  {opt.label}
                </span>
                <span style={{
                  display: 'block',
                  fontSize: 10, fontStyle: 'italic',
                  color: 'var(--text-muted)',
                  marginTop: 4, lineHeight: 1.4,
                }}>
                  {opt.effect}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
