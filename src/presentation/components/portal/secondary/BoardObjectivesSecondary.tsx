import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CardRenderProps } from '../portalTypes'
import type { BoardObjective } from '../../../../domain/entities/Community'

const STATUS_ICON: Record<BoardObjective['status'], string> = {
  active:  '📌',
  at_risk: '⚠️',
  failed:  '❌',
  met:     '✅',
}

const STATUS_LABEL: Record<BoardObjective['status'], string> = {
  active:  'Aktivt',
  at_risk: 'I fara',
  failed:  'Misslyckat',
  met:     'Uppfyllt',
}

const STATUS_COLOR: Record<BoardObjective['status'], string> = {
  active:  'var(--text-light-secondary)',
  at_risk: '#E8A090',
  failed:  '#E8A090',
  met:     '#A0C890',
}

const SORT_ORDER: Record<BoardObjective['status'], number> = { failed: 0, at_risk: 1, active: 2, met: 3 }

function formatOwnerInitial(ownerId: string): string {
  const parts = ownerId.split(' ')
  if (parts.length >= 2) return `${parts[0][0]}. ${parts.slice(1).join(' ')}`
  return ownerId
}

function formatMoney(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} mkr`
  if (Math.abs(value) >= 1000) return `${Math.round(value / 1000)} tkr`
  return `${value} kr`
}

interface ObjRowProps {
  obj: BoardObjective
  onNavigate: () => void
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
        cursor: 'pointer',
        borderRadius: 4,
        background: hovered ? 'rgba(196,122,58,0.04)' : 'transparent',
      }}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto auto',
        gap: 8,
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 14, lineHeight: 1, flexShrink: 0 }}>{STATUS_ICON[obj.status]}</span>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: 13, fontWeight: 600,
          color: 'var(--text-light)', lineHeight: 1.3,
          minWidth: 0,
        }}>
          {obj.label}
        </span>
        <span style={{
          fontSize: 10, letterSpacing: '0.5px', textTransform: 'uppercase' as const,
          fontWeight: 600, flexShrink: 0,
          color: STATUS_COLOR[obj.status],
        }}>
          {STATUS_LABEL[obj.status]}
        </span>
        <span style={{
          fontSize: 11, flexShrink: 0, paddingLeft: 4,
          color: hovered ? 'var(--accent)' : 'var(--text-light-secondary)',
          opacity: hovered ? 1 : 0.5,
          transition: 'opacity 0.15s, color 0.15s',
        }}>
          ›
        </span>
      </div>

      <div style={{
        fontFamily: 'var(--font-display)', fontStyle: 'italic',
        fontSize: 11, color: 'var(--text-light-secondary)',
        marginTop: 3, marginLeft: 22,
      }}>
        {formatOwnerInitial(obj.ownerId)}
      </div>

      {isBalance ? (
        <div style={{
          marginTop: 6, marginLeft: 22,
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
          color: obj.currentValue >= 0 ? '#A0C890' : '#E8A090',
        }}>
          {obj.currentValue >= 0 ? '+' : '−'}{formatMoney(Math.abs(obj.currentValue))}
        </div>
      ) : obj.targetValue > 0 ? (
        <div style={{ marginTop: 8, marginLeft: 22 }}>
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
            height: 4, background: 'rgba(196,122,58,0.15)', borderRadius: 2, overflow: 'hidden',
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

export function BoardObjectivesSecondary({ game }: CardRenderProps) {
  const navigate = useNavigate()

  const active = (game.boardObjectives ?? [])
    .filter(o => o.status !== 'met')
    .sort((a, b) => SORT_ORDER[a.status] - SORT_ORDER[b.status])
    .slice(0, 2)

  if (active.length === 0) return null

  return (
    <div style={{
      gridColumn: '1 / -1',
      background: 'var(--bg-portal-surface)',
      borderLeft: '2px solid var(--accent)',
      borderRadius: '0 8px 8px 0',
      padding: '12px 14px',
    }}>
      <div style={{
        fontSize: 8, letterSpacing: '2px', textTransform: 'uppercase',
        color: 'var(--text-light-secondary)', fontWeight: 600,
        marginBottom: 10,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ fontSize: 12, lineHeight: 1 }}>🎯</span>
        <span>Styrelsens krav</span>
      </div>

      {active.map((obj, i) => (
        <div
          key={obj.id}
          style={i > 0 ? { borderTop: '0.5px solid rgba(196,122,58,0.15)' } : undefined}
        >
          <ObjRow
            obj={obj}
            onNavigate={() => navigate('/game/club', { state: { tab: 'orten', scrollTo: 'board-objectives' } })}
          />
        </div>
      ))}
    </div>
  )
}
