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
      className={`arc-row ${isLast ? '' : 'arc-row-bordered'}`}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        background: hovered && onClick ? 'rgba(196,122,58,0.04)' : 'transparent',
      }}
    >
      {/* Typographic glyph */}
      <span
        className="arc-glyph"
        style={{ color: glyphColor, border: `1px solid ${glyphBorderColor}`, background: glyphBg }}
      >
        {glyph}
      </span>

      <div className="arc-body">
        <div className="arc-headline">{getArcHeadline(arc, undefined)}</div>
        <div className="arc-meta">
          <span className="arc-phase-dots">
            {[1, 2, 3].map(dot => (
              <span
                key={dot}
                className="arc-phase-dot"
                style={{
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
        <span
          className="arc-chevron"
          style={{ color: hovered ? 'var(--accent)' : 'var(--text-muted)', opacity: hovered ? 1 : 0.5 }}
        >›</span>
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
    <div className="portal-secondary-card">
      <div className="portal-card-stripe portal-card-stripe-copper" />
      <span className="portal-card-chevron">›</span>
      <div className="portal-card-eyebrow">Arcs</div>
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
