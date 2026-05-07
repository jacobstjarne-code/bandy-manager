import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CardRenderProps } from '../portalTypes'
import type { ActiveArc } from '../../../../domain/entities/Narrative'
import { ARC_ICON, getArcHeadline } from '../../../../domain/data/activeArcStrings'

function getCurrentMatchday(game: CardRenderProps['game']): number {
  const scheduled = game.fixtures.filter(f => f.status === 'scheduled').map(f => f.matchday)
  if (scheduled.length === 0) return 0
  return Math.min(...scheduled)
}

function getPhaseDots(phase: ActiveArc['phase']): number {
  if (phase === 'building') return 1
  if (phase === 'peak') return 2
  return 3
}

interface ArcRowProps {
  arc: ActiveArc
  currentMatchday: number
  onClick?: () => void
}

function ArcRow({ arc, currentMatchday, onClick }: ArcRowProps) {
  const [hovered, setHovered] = useState(false)
  const roundsLeft = arc.expiresMatchday - currentMatchday
  const isUrgent = roundsLeft <= 1
  const filledDots = getPhaseDots(arc.phase)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto auto',
        gap: 10,
        alignItems: 'center',
        padding: '8px 4px',
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: 4,
        background: hovered && onClick ? 'rgba(196,122,58,0.04)' : 'transparent',
      }}
    >
      <span style={{ fontSize: 18, lineHeight: 1, filter: 'saturate(0.85)' }}>
        {ARC_ICON[arc.type]}
      </span>

      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-body)', fontSize: 12.5,
          color: 'var(--text-light)', fontWeight: 600, lineHeight: 1.35,
        }}>
          {getArcHeadline(arc, undefined)}
        </div>
        <div style={{
          fontFamily: 'var(--font-display)', fontStyle: 'italic',
          fontSize: 10.5,
          color: isUrgent ? '#c8a058' : 'var(--text-light-secondary)',
          marginTop: 2,
        }}>
          {isUrgent ? 'Avgörande snart' : `${roundsLeft} omgångar kvar`}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexShrink: 0 }}>
        {[1, 2, 3].map(dot => (
          <div
            key={dot}
            style={{
              width: 5, height: 5, borderRadius: '50%',
              border: '1px solid var(--accent)',
              background: dot <= filledDots ? 'var(--accent)' : 'transparent',
            }}
          />
        ))}
      </div>

      {onClick ? (
        <span style={{
          fontSize: 11, flexShrink: 0, paddingLeft: 2,
          color: hovered ? 'var(--accent)' : 'var(--text-light-secondary)',
          opacity: hovered ? 1 : 0.5,
          transition: 'opacity 0.15s, color 0.15s',
        }}>
          ›
        </span>
      ) : <span />}
    </div>
  )
}

export function ActiveArcsSecondary({ game }: CardRenderProps) {
  const navigate = useNavigate()

  const arcs = (game.activeArcs ?? [])
    .filter(a => a.type !== 'derby_echo' && a.phase !== 'resolving')
    .sort((a, b) => {
      const order: Record<string, number> = { peak: 0, building: 1, resolving: 2 }
      return (order[a.phase] ?? 1) - (order[b.phase] ?? 1)
    })
    .slice(0, 2)

  if (arcs.length === 0) return null

  const currentMatchday = getCurrentMatchday(game)

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
        <span style={{ fontSize: 12, lineHeight: 1 }}>📖</span>
        <span>I blickfånget</span>
      </div>

      {arcs.map((arc, index) => (
        <div
          key={arc.id}
          style={index > 0 ? { borderTop: '0.5px solid rgba(196,122,58,0.15)' } : undefined}
        >
          <ArcRow
            arc={arc}
            currentMatchday={currentMatchday}
            onClick={arc.playerId
              ? () => navigate('/game/squad', { state: { highlightPlayer: arc.playerId } })
              : undefined}
          />
        </div>
      ))}
    </div>
  )
}
