import { useState, useEffect, useRef } from 'react'
import type { Tactic } from '../../../domain/entities/Club'
import { TacticMentality, TacticPress, TacticWidth, TacticAttackingFocus } from '../../../domain/enums'

interface TacticPreviewProps {
  tacticState: Tactic
}

// Base positions as percentages of pitch (5-3-2: GK + 5 DEF + 3 MID + 2 FWD)
const BASE: { x: number; y: number }[] = [
  { x: 50, y: 90 },                                                                                      // 0: GK
  { x: 12, y: 74 }, { x: 30, y: 72 }, { x: 50, y: 70 }, { x: 70, y: 72 }, { x: 88, y: 74 },           // 1-5: DEF
  { x: 24, y: 52 }, { x: 50, y: 48 }, { x: 76, y: 52 },                                                 // 6-8: MID
  { x: 36, y: 28 }, { x: 64, y: 28 },                                                                    // 9-10: FWD
]

const EFFECT_TEXTS: Record<string, Record<string, string>> = {
  mentality: {
    offensive: 'Laget skjuts framåt',
    defensive: 'Kompakt försvar',
    balanced: 'Balanserad formation',
  },
  press: {
    high: 'Högt försvarssätt',
    low: 'Djupt försvar',
    medium: 'Normalt försvar',
  },
  width: {
    wide: 'Bredare spel',
    narrow: 'Smalare formation',
    normal: 'Normal bredd',
  },
  attackingFocus: {
    central: 'Centralt anfall',
    wings: 'Kantanfall',
    mixed: 'Blandat anfall',
  },
}

function calcPositions(t: Tactic): { x: number; y: number }[] {
  const yShift = t.mentality === TacticMentality.Offensive ? -8 : t.mentality === TacticMentality.Defensive ? 8 : 0
  const pressShift = t.press === TacticPress.High ? -5 : t.press === TacticPress.Low ? 5 : 0
  const wScale = t.width === TacticWidth.Wide ? 1.15 : t.width === TacticWidth.Narrow ? 0.75 : 1.0
  const af = t.attackingFocus

  return BASE.map((b, i) => {
    let x = b.x
    let y = b.y

    if (i === 0) return { x, y } // GK stays put

    y += yShift
    if (i <= 5) y += pressShift // defenders shift with press

    x = 50 + (x - 50) * wScale

    if (af === TacticAttackingFocus.Central && i >= 9) x = 50 + (x - 50) * 0.5
    if (af === TacticAttackingFocus.Wings && i >= 9) x = 50 + (x - 50) * 1.4
    if (af === TacticAttackingFocus.Wings && (i === 6 || i === 8)) x = 50 + (x - 50) * 1.2

    return { x: Math.max(5, Math.min(95, x)), y: Math.max(8, Math.min(88, y)) }
  })
}

export function TacticPreview({ tacticState }: TacticPreviewProps) {
  const [effectText, setEffectText] = useState('')
  const [showEffect, setShowEffect] = useState(false)
  const prevRef = useRef({
    mentality: tacticState.mentality,
    press: tacticState.press,
    width: tacticState.width,
    attackingFocus: tacticState.attackingFocus,
  })

  useEffect(() => {
    const prev = prevRef.current
    const checks: [string, string, string][] = [
      ['mentality', prev.mentality, tacticState.mentality],
      ['press', prev.press, tacticState.press],
      ['width', prev.width, tacticState.width],
      ['attackingFocus', prev.attackingFocus, tacticState.attackingFocus],
    ]
    let timer: ReturnType<typeof setTimeout> | undefined
    for (const [key, oldVal, newVal] of checks) {
      if (oldVal !== newVal && EFFECT_TEXTS[key]?.[newVal]) {
        setEffectText(EFFECT_TEXTS[key][newVal])
        setShowEffect(true)
        timer = setTimeout(() => setShowEffect(false), 1500)
        break
      }
    }
    prevRef.current = {
      mentality: tacticState.mentality,
      press: tacticState.press,
      width: tacticState.width,
      attackingFocus: tacticState.attackingFocus,
    }
    return () => { if (timer !== undefined) clearTimeout(timer) }
  }, [tacticState.mentality, tacticState.press, tacticState.width, tacticState.attackingFocus])

  const positions = calcPositions(tacticState)

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: 220,
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 6,
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
        transition: 'all 0.4s ease',
      }}>
        MOTSTÅNDARENS MÅL
      </div>
      <div style={{
        position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        fontSize: 9, color: 'rgba(100,90,70,0.5)', fontWeight: 600,
        letterSpacing: '1px', textTransform: 'uppercase', whiteSpace: 'nowrap',
        transition: 'all 0.4s ease',
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
            background: i === 0 ? '#5a8a4a' : 'var(--accent)',
            border: '2px solid var(--bg)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            transition: 'all 0.4s cubic-bezier(0.25,0.46,0.45,0.94)',
            zIndex: 2,
          }}
        />
      ))}

      {/* Effect text */}
      <div style={{
        position: 'absolute',
        bottom: 8, left: 0, right: 0,
        textAlign: 'center',
        fontSize: 10,
        color: 'var(--accent)',
        fontWeight: 600,
        fontStyle: 'italic',
        opacity: showEffect ? 1 : 0,
        transition: 'opacity 0.3s',
        pointerEvents: 'none',
        zIndex: 3,
      }}>
        {effectText}
      </div>
    </div>
  )
}
