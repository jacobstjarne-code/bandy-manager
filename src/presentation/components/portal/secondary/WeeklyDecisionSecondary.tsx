import { useState, useRef, useEffect } from 'react'
import type { CardRenderProps } from '../portalTypes'
import { useGameStore } from '../../../store/gameStore'
import type { WeeklyDecision, WeeklyDecisionCategory } from '../../../../domain/services/weeklyDecisionService'

const CATEGORY_META: Record<WeeklyDecisionCategory, { icon: string; label: string }> = {
  player:    { icon: '🏒', label: 'Veckans spelarfråga' },
  supporter: { icon: '📣', label: 'Veckans supporterfråga' },
  training:  { icon: '📋', label: 'Veckans träningsbeslut' },
  community: { icon: '🏛️', label: 'Veckans kommunfråga' },
}

export function WeeklyDecisionSecondary({ game }: CardRenderProps) {
  const resolveWeeklyDecision = useGameStore(s => s.resolveWeeklyDecision)
  const [resolvedInfo, setResolvedInfo] = useState<{ label: string; effect: string } | null>(null)
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
      gridColumn: '1 / -1',
      background: 'var(--bg-portal-surface)',
      borderLeft: '2px solid var(--accent)',
      borderRadius: '0 8px 8px 0',
      padding: '12px 14px 13px',
    }}>
      <div style={{
        fontSize: 8, letterSpacing: '2px', textTransform: 'uppercase',
        color: 'var(--accent)', fontWeight: 700,
        marginBottom: 10,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ fontSize: 13, lineHeight: 1, filter: 'saturate(0.85)' }}>{meta.icon}</span>
        <span>{meta.label}</span>
      </div>

      <div style={{
        fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: 600,
        color: 'var(--text-light)', lineHeight: 1.4,
        marginBottom: isResolved ? 0 : 14,
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {(['A', 'B'] as const).map(choice => {
            const opt = choice === 'A' ? decision.optionA : decision.optionB
            return (
              <button
                key={choice}
                onClick={() => handleChoice(choice)}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 4,
                  padding: '13px 12px',
                  background: 'var(--bg-portal-elevated)',
                  border: '1.5px solid var(--accent)',
                  borderRadius: 8,
                  cursor: 'pointer', textAlign: 'center',
                  transition: 'filter 0.15s',
                }}
              >
                <span style={{
                  fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700,
                  color: 'var(--text-light)', letterSpacing: '0.4px',
                }}>
                  {opt.label}
                </span>
                <span style={{
                  fontFamily: 'var(--font-display)', fontStyle: 'italic',
                  fontSize: 11, lineHeight: 1.3,
                  ...(opt.effectColor === 'success'
                    ? { color: '#A0C890' }
                    : opt.effectColor === 'danger'
                    ? { color: '#E8A090' }
                    : { color: 'var(--text-light-secondary)', opacity: 0.75 }),
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
