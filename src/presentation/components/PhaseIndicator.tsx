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
      {phases.map((phase, i) => {
        const state = i < currentIdx ? 'done' : i === currentIdx ? 'current' : 'upcoming'
        return (
          <Fragment key={phase.key}>
            {i > 0 && (
              /* Connector: heavy (2px) when bridging done→current, thin (1px) when upcoming */
              <div style={{
                flex: '0 0 20px',
                height: i <= currentIdx ? 2 : 1,
                background: i <= currentIdx ? 'rgba(201,122,58,0.55)' : 'rgba(255,255,255,0.12)',
                margin: '0 2px',
              }} />
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center' }}>
              {/* Step node */}
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: state === 'done' ? 'rgba(201,122,58,0.25)'
                  : state === 'current' ? 'rgba(201,122,58,0.35)'
                  : 'transparent',
                border: `1.5px solid ${state === 'upcoming' ? 'rgba(255,255,255,0.18)' : 'rgba(201,122,58,0.65)'}`,
                /* Halo only on current */
                boxShadow: state === 'current' ? '0 0 0 3px rgba(201,122,58,0.12)' : 'none',
              }}>
                {/* Checkmark for done steps */}
                {state === 'done' && (
                  <svg width="5" height="4" viewBox="0 0 5 4" fill="none">
                    <polyline points="0.5,2 2,3.5 4.5,0.5" stroke="rgba(201,122,58,0.8)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span style={{
                fontSize: 9,
                fontWeight: state === 'current' ? 700 : 400,
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                /* Only active step gets full copper — done gets muted copper, upcoming fades */
                color: state === 'current' ? 'var(--accent)'
                  : state === 'done' ? 'rgba(201,122,58,0.55)'
                  : 'rgba(255,255,255,0.28)',
              }}>
                {phase.label}
              </span>
            </div>
          </Fragment>
        )
      })}
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
