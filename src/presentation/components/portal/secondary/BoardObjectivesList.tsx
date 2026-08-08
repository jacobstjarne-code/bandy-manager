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

// SLUTTEST 2026-08-08 (uppföljning): formatMoney väljer enhet (kr/tkr/mkr)
// oberoende per tal — currentValue och targetValue på SAMMA rad kan då landa
// i olika enheter (t.ex. "0 kr / 100 tkr" tidigt i säsongen, growFinances).
// Enheten väljs nu en gång på det STÖRRE av de två talen och används på
// båda sidorna — samma enhet på båda sidor av snedstrecket.
export function formatMoneyPair(current: number, target: number): [string, string] {
  const scale = Math.max(Math.abs(current), Math.abs(target))
  if (scale >= 1_000_000) return [`${(current / 1_000_000).toFixed(1)} mkr`, `${(target / 1_000_000).toFixed(1)} mkr`]
  if (scale >= 1000) return [`${Math.round(current / 1000)} tkr`, `${Math.round(target / 1000)} tkr`]
  return [`${current} kr`, `${target} kr`]
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
                (DESIGN-DECISIONS 2026-06-11: pengar i tkr/mkr, aldrig rå krona).
                Uppföljning samma dag: formatMoney(a) / formatMoney(b) var för sig
                kunde ge OLIKA enheter på de två sidorna ("0 kr / 100 tkr") —
                formatMoneyPair väljer en delad enhet på det större talet. */}
            <span className="obj-progress-value">
              {obj.type === 'economic'
                ? formatMoneyPair(obj.currentValue, obj.targetValue).join(' / ')
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
