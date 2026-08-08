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
  at_risk: 'var(--match-warn)',
  failed:  'var(--match-warn)',
  met:     'var(--match-positive)',
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

  const progressFillColor = obj.status === 'at_risk' || obj.status === 'failed'
    ? 'var(--match-warn)'
    : obj.status === 'met'
    ? 'var(--match-positive)'
    : 'var(--accent)'

  const balanceColor = obj.currentValue >= 0 ? 'var(--match-positive)' : 'var(--match-warn)'

  return (
    <div
      onClick={onNavigate}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`obj-row${onNavigate ? ' obj-row-clickable' : ''}${hovered && onNavigate ? ' obj-row-hovered' : ''}`}
    >
      <div className="obj-row-header">
        <div className="obj-row-title-group">
          <span className="obj-row-icon">{STATUS_ICON[obj.status]}</span>
          <span className="obj-row-label">{obj.label}</span>
        </div>
        <span className="obj-row-owner" style={{ color: STATUS_COLOR[obj.status] }}>
          {formatOwnerInitial(obj.ownerId)}
        </span>
      </div>

      {isBalance ? (
        <div className="obj-row-balance" style={{ color: balanceColor }}>
          {obj.currentValue >= 0 ? '+' : '−'}{formatMoney(Math.abs(obj.currentValue))}
          {obj.targetValue !== 0 && (
            <span style={{ color: 'var(--text-muted)' }}>
              {' '}av mål {obj.targetValue >= 0 ? '+' : '−'}{formatMoney(Math.abs(obj.targetValue))}
            </span>
          )}
        </div>
      ) : obj.targetValue > 0 ? (
        <>
          <div className="obj-progress-header">
            <span>Framsteg</span>
            {/* 2026-08-08 (sluttest): ekonomiska mål renderade rått tal ("0 / 100000")
                trots att formatMoney låg i samma fil — bryter Tal & enheter-kortet
                (DESIGN-DECISIONS 2026-06-11: pengar i tkr/mkr, aldrig rå krona). */}
            <span className="obj-progress-value">
              {obj.type === 'economic'
                ? `${formatMoney(obj.currentValue)} / ${formatMoney(obj.targetValue)}`
                : `${obj.currentValue} / ${obj.targetValue}`}
            </span>
          </div>
          <div className="obj-progress-track">
            <div className="obj-progress-fill" style={{ width: `${progressPct}%`, background: progressFillColor }} />
          </div>
        </>
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
        <div key={obj.id} className={i > 0 ? 'obj-row-separator' : undefined}>
          <ObjRow obj={obj} onNavigate={onNavigate} />
        </div>
      ))}
    </>
  )
}
