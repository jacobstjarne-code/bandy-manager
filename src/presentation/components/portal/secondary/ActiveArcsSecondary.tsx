import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CardRenderProps } from '../portalTypes'
import type { ActiveArc } from '../../../../domain/entities/Narrative'
import { getArcHeadline } from '../../../../domain/data/activeArcStrings'

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

const ARC_GLYPHS = ['A', 'B', 'C', 'D', 'E']

function getGlyphVariant(arc: ActiveArc): 'warm' | 'muted' | 'default' {
  if (arc.type === 'derby_echo') return 'warm'
  if (arc.phase === 'building') return 'muted'
  return 'default'
}

interface ArcRowProps {
  arc: ActiveArc
  glyph: string
  currentMatchday: number
  onClick?: () => void
  isLast: boolean
}

function ArcRow({ arc, glyph, currentMatchday, onClick, isLast }: ArcRowProps) {
  const [hovered, setHovered] = useState(false)
  const roundsLeft = arc.expiresMatchday - currentMatchday
  const isUrgent = roundsLeft <= 1
  const filledDots = getPhaseDots(arc.phase)
  const variant = getGlyphVariant(arc)

  const glyphColor = variant === 'warm'
    ? 'var(--warm)'
    : variant === 'muted'
    ? 'var(--text-muted)'
    : 'var(--accent)'

  const glyphBorderColor = variant === 'warm'
    ? 'rgba(180,120,140,0.4)'
    : variant === 'muted'
    ? 'rgba(196,122,58,0.2)'
    : 'rgba(196,122,58,0.4)'

  const glyphBg = variant === 'warm'
    ? 'rgba(180,120,140,0.06)'
    : 'rgba(196,122,58,0.06)'

  const phaseLabel = arc.phase === 'building'
    ? 'Akt 1'
    : arc.phase === 'peak'
    ? 'Akt 2'
    : 'Akt 3'

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '10px 0',
        borderBottom: isLast ? 'none' : '0.5px solid rgba(196,122,58,0.15)',
        cursor: onClick ? 'pointer' : 'default',
        background: hovered && onClick ? 'rgba(196,122,58,0.04)' : 'transparent',
        transition: 'background 0.12s',
      }}
    >
      {/* Typographic glyph */}
      <span style={{
        flexShrink: 0,
        width: 22, height: 22,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
        color: glyphColor,
        border: `1px solid ${glyphBorderColor}`,
        borderRadius: '50%',
        background: glyphBg,
        marginTop: 1,
      }}>
        {glyph}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
          color: 'var(--text-light)', marginBottom: 4, lineHeight: 1.35,
        }}>
          {getArcHeadline(arc, undefined)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 10, color: 'var(--text-muted)' }}>
          {/* Phase dots */}
          <span style={{ display: 'inline-flex', gap: 3 }}>
            {[1, 2, 3].map(dot => (
              <span
                key={dot}
                style={{
                  display: 'block',
                  width: 5, height: 5, borderRadius: '50%',
                  background: dot < filledDots
                    ? 'var(--accent-deep)'
                    : dot === filledDots
                    ? 'var(--accent)'
                    : 'rgba(196,122,58,0.3)',
                }}
              />
            ))}
          </span>
          <span>{phaseLabel} · {isUrgent ? 'Avgörande snart' : `${roundsLeft} omg kvar`}</span>
        </div>
      </div>

      {onClick && (
        <span style={{
          fontSize: 11, flexShrink: 0,
          color: hovered ? 'var(--accent)' : 'var(--text-muted)',
          opacity: hovered ? 1 : 0.5,
          transition: 'opacity 0.15s, color 0.15s',
          alignSelf: 'center',
        }}>›</span>
      )}
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
      position: 'relative',
      background: 'var(--bg-portal-surface)',
      border: '1px solid rgba(196,122,58,0.15)',
      borderRadius: 8,
      padding: '14px 16px 14px 18px',
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'background 0.15s, border-color 0.15s',
    }}>
      {/* Left stripe — 2px copper */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: 2,
        background: 'var(--copper)',
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
        Arcs
      </div>

      {arcs.map((arc, index) => (
        <ArcRow
          key={arc.id}
          arc={arc}
          glyph={ARC_GLYPHS[index] ?? String(index + 1)}
          currentMatchday={currentMatchday}
          isLast={index === arcs.length - 1}
          onClick={arc.playerId
            ? () => navigate('/game/squad', { state: { highlightPlayer: arc.playerId } })
            : undefined}
        />
      ))}
    </div>
  )
}
