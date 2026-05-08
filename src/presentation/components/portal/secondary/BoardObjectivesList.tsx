import { useState } from 'react'
import type { BoardObjective } from '../../../../domain/entities/Community'

export const STATUS_ICON: Record<BoardObjective['status'], string> = {
  active:  '📌',
  at_risk: '⚠️',
  failed:  '❌',
  met:     '✅',
}

export const STATUS_COLOR: Record<BoardObjective['status'], string> = {
  active:  'var(--text-light-secondary)',
  at_risk: '#E8A090',
  failed:  '#E8A090',
  met:     '#A0C890',
}

export const SORT_ORDER: Record<BoardObjective['status'], number> = { failed: 0, at_risk: 1, active: 2, met: 3 }

export function formatOwnerInitial(ownerId: string): string {
  const parts = ownerId.split(' ')
  if (parts.length >= 2) return `${parts[0][0]}. ${parts.slice(1).join(' ')}`
  return ownerId
}

export function formatMoney(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} mkr`
  if (Math.abs(value) >= 1000) return `${Math.round(value / 1000)} tkr`
  return `${value} kr`
}

interface ObjRowProps {
  obj: BoardObjective
  onNavigate?: () => void
}

function ObjRow({ obj, onNavigate }: ObjRowProps) {
  const [hovered, setHovered] = useState(false)
  const isBalance = obj.measureFn === 'balanceBudget'
  const progressPct = obj.targetValue > 0 ? Math.min(100, Math.round((obj.currentValue / obj.targetValue) * 100)) : 0

  return (
    <div
      onClick={onNavigate}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '9px 6px',
        cursor: onNavigate ? 'pointer' : 'default',
        borderRadius: 4,
        background: hovered && onNavigate ? 'rgba(196,122,58,0.04)' : 'transparent',
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 14, lineHeight: 1, flexShrink: 0 }}>{STATUS_ICON[obj.status]}</span>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13, fontWeight: 600,
            color: 'var(--text-light)', lineHeight: 1.3,
            minWidth: 0,
          }}>
            {obj.label}
          </span>
        </div>
        <span style={{
          fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase',
          flexShrink: 0,
          color: STATUS_COLOR[obj.status],
        }}>
          {formatOwnerInitial(obj.ownerId)}
        </span>
      </div>

      {isBalance ? (
        <div style={{
          marginTop: 6,
          fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 12,
          color: obj.currentValue >= 0 ? '#A0C890' : '#E8A090',
        }}>
          {obj.currentValue >= 0 ? '+' : '−'}{formatMoney(Math.abs(obj.currentValue))}
          {obj.targetValue !== 0 && (
            <span style={{ color: 'var(--text-muted)' }}>
              {' '}av mål {obj.targetValue >= 0 ? '+' : '−'}{formatMoney(Math.abs(obj.targetValue))}
            </span>
          )}
        </div>
      ) : obj.targetValue > 0 ? (
        <div style={{ marginTop: 8 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 10, color: 'var(--text-light-secondary)',
            marginBottom: 3, letterSpacing: '0.3px',
          }}>
            <span>Framsteg</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-light)' }}>
              {obj.currentValue} / {obj.targetValue}
            </span>
          </div>
          <div style={{
            height: 3, background: 'rgba(196,122,58,0.15)', borderRadius: 2, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 2,
              width: `${progressPct}%`,
              background: obj.status === 'at_risk' || obj.status === 'failed' ? '#E8A090'
                : obj.status === 'met' ? '#A0C890'
                : 'var(--accent)',
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

export interface BoardObjectivesListProps {
  objectives: BoardObjective[]
  max?: number
  onNavigate?: () => void
}

export function BoardObjectivesList({ objectives, max = 2, onNavigate }: BoardObjectivesListProps) {
  const items = (objectives ?? [])
    .filter(o => o.status !== 'met')
    .sort((a, b) => SORT_ORDER[a.status] - SORT_ORDER[b.status])
    .slice(0, max)

  if (items.length === 0) return null

  return (
    <>
      {items.map((obj, i) => (
        <div
          key={obj.id}
          style={i > 0 ? { borderTop: '0.5px solid rgba(196,122,58,0.15)' } : undefined}
        >
          <ObjRow obj={obj} onNavigate={onNavigate} />
        </div>
      ))}
    </>
  )
}
