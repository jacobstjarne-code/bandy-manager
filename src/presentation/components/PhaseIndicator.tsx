import { Fragment } from 'react'
import { useLocation } from 'react-router-dom'

interface PhaseIndicatorProps {
  currentPhase: 'prepare' | 'play' | 'review'
}

export function PhaseIndicator({ currentPhase }: PhaseIndicatorProps) {
  const phases = [
    { key: 'prepare', label: 'Förbered' },
    { key: 'play', label: 'Spela' },
    { key: 'review', label: 'Granska' },
  ] as const

  const currentIdx = phases.findIndex(p => p.key === currentPhase)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '6px 20px 8px',
      background: 'var(--bg-dark)',
    }}>
      {phases.map((phase, i) => (
        <Fragment key={phase.key}>
          {i > 0 && (
            <div style={{
              flex: '0 0 20px', height: 1.5,
              background: i <= currentIdx ? 'var(--accent)' : 'rgba(255,255,255,0.15)',
              margin: '0 2px',
            }} />
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center' }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: i < currentIdx ? 'var(--accent)'
                : i === currentIdx ? 'rgba(139,115,50,0.3)'
                : 'transparent',
              border: `1.5px solid ${i <= currentIdx ? 'var(--accent)' : 'rgba(255,255,255,0.2)'}`,
              boxShadow: i === currentIdx ? '0 0 0 3px rgba(139,115,50,0.1)' : 'none',
            }} />
            <span style={{
              fontSize: 9, fontWeight: i === currentIdx ? 700 : 400,
              letterSpacing: '0.8px', textTransform: 'uppercase',
              color: i === currentIdx ? 'var(--accent)' : i < currentIdx ? 'var(--accent)' : 'rgba(255,255,255,0.35)',
            }}>
              {phase.label}
            </span>
          </div>
        </Fragment>
      ))}
    </div>
  )
}

function getCurrentPhase(pathname: string): 'prepare' | 'play' | 'review' {
  if (pathname.includes('/match')) return 'play'
  if (pathname.includes('/review') || pathname.includes('/round-summary') || pathname.includes('/match-result')) return 'review'
  return 'prepare'
}

const HIDE_PHASE_INDICATOR = ['/champion', '/pre-season', '/season-summary', '/board-meeting', '/game-over']

export function PhaseIndicatorAuto() {
  const location = useLocation()
  if (HIDE_PHASE_INDICATOR.some(p => location.pathname.includes(p))) return null
  return <PhaseIndicator currentPhase={getCurrentPhase(location.pathname)} />
}
