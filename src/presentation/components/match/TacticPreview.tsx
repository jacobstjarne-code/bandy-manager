import type { Tactic } from '../../../domain/entities/Club'
import { TacticMentality, TacticPress, TacticWidth, TacticAttackingFocus, PlayerPosition } from '../../../domain/enums'
import { FORMATIONS, type FormationType } from '../../../domain/entities/Formation'

interface TacticPreviewProps {
  tacticState: Tactic
}

function getBasePositions(formation: FormationType): { x: number; y: number; pos: PlayerPosition }[] {
  const template = FORMATIONS[formation] ?? FORMATIONS['5-3-2']
  return template.slots.map(slot => ({
    x: slot.x,
    y: 95 - slot.y * 0.9,  // invert: Formation 0=own goal→Preview 95(bottom), Formation 80→Preview 23(top)
    pos: slot.position,
  }))
}

function calcPositions(t: Tactic): { x: number; y: number; isGK: boolean }[] {
  const formation = (t.formation ?? '5-3-2') as FormationType
  const base = getBasePositions(formation)

  const yShift = t.mentality === TacticMentality.Offensive ? -8 : t.mentality === TacticMentality.Defensive ? 8 : 0
  const pressShift = t.press === TacticPress.High ? -5 : t.press === TacticPress.Low ? 5 : 0
  const wScale = t.width === TacticWidth.Wide ? 1.15 : t.width === TacticWidth.Narrow ? 0.75 : 1.0
  const af = t.attackingFocus

  return base.map((b) => {
    let x = b.x
    let y = b.y

    if (b.pos === PlayerPosition.Goalkeeper) return { x, y, isGK: true }

    y += yShift
    if (b.pos === PlayerPosition.Defender) y += pressShift

    x = 50 + (x - 50) * wScale

    if (af === TacticAttackingFocus.Central && b.pos === PlayerPosition.Forward) x = 50 + (x - 50) * 0.5
    if (af === TacticAttackingFocus.Wings && b.pos === PlayerPosition.Forward) x = 50 + (x - 50) * 1.4
    if (af === TacticAttackingFocus.Wings && b.pos === PlayerPosition.Half) x = 50 + (x - 50) * 1.2

    return { x: Math.max(5, Math.min(95, x)), y: Math.max(8, Math.min(92, y)), isGK: false }
  })
}

export function TacticPreview({ tacticState }: TacticPreviewProps) {
  const positions = calcPositions(tacticState)

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: 220,
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 0,
      border: '1px solid var(--border)',
    }}>
      {/* Ice gradient background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(200,220,210,0.15) 0%, rgba(180,210,200,0.25) 50%, rgba(200,220,210,0.15) 100%)',
        backgroundColor: 'var(--bg-surface)',
      }} />

      {/* Pitch lines */}
      <svg
        viewBox="0 0 300 220"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        fill="none"
        stroke="rgba(100,90,70,0.15)"
        strokeWidth="1"
      >
        <line x1="0" y1="110" x2="300" y2="110" />
        <circle cx="150" cy="110" r="30" />
        <rect x="100" y="0" width="100" height="30" rx="2" />
        <rect x="100" y="190" width="100" height="30" rx="2" />
        <circle cx="150" cy="20" r="2" fill="rgba(100,90,70,0.2)" stroke="none" />
        <circle cx="150" cy="200" r="2" fill="rgba(100,90,70,0.2)" stroke="none" />
        <path d="M 0 8 A 8 8 0 0 0 8 0" />
        <path d="M 292 0 A 8 8 0 0 0 300 8" />
        <path d="M 0 212 A 8 8 0 0 1 8 220" />
        <path d="M 292 220 A 8 8 0 0 1 300 212" />
      </svg>

      {/* Labels */}
      <div style={{
        position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
        fontSize: 9, color: 'rgba(100,90,70,0.5)', fontWeight: 600,
        letterSpacing: '1px', textTransform: 'uppercase', whiteSpace: 'nowrap',
      }}>
        MOTSTÅNDARENS MÅL
      </div>
      <div style={{
        position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        fontSize: 9, color: 'rgba(100,90,70,0.5)', fontWeight: 600,
        letterSpacing: '1px', textTransform: 'uppercase', whiteSpace: 'nowrap',
      }}>
        VÅRT MÅL
      </div>

      {/* Player dots */}
      {positions.map((pos, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `calc(${pos.x}% - 7px)`,
            top: `calc(${pos.y}% - 7px)`,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: pos.isGK ? 'var(--success)' : 'var(--accent)',
            border: '2px solid var(--bg)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            transition: 'all 0.4s cubic-bezier(0.25,0.46,0.45,0.94)',
            zIndex: 2,
          }}
        />
      ))}

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 6, right: 8,
        display: 'flex', gap: 8, zIndex: 3,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, color: 'rgba(100,90,70,0.6)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', display: 'inline-block', flexShrink: 0 }} />
          MV
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, color: 'rgba(100,90,70,0.6)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', flexShrink: 0 }} />
          Utespelare
        </span>
      </div>
    </div>
  )
}
