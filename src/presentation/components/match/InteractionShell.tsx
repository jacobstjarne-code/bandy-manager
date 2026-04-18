import { useEffect, useRef, useState } from 'react'
import type { AssistantCoach } from '../../../domain/entities/AssistantCoach'

export type InteractionPhase = 'choosing' | 'locked' | 'revealed'

interface Props {
  icon: string
  title: string
  minute: number
  timerSeconds?: number
  stats?: React.ReactNode
  pitch: React.ReactNode
  coachTip?: string
  coach?: AssistantCoach
  actions?: React.ReactNode
  phase: InteractionPhase
  outcome?: React.ReactNode
  onTimeout: () => void
}

export function InteractionShell({
  icon, title, minute, timerSeconds = 5,
  stats, pitch, coachTip, coach, actions, phase, outcome, onTimeout,
}: Props) {
  const [timeLeft, setTimeLeft] = useState(timerSeconds)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timedOut = useRef(false)

  // Timer — only runs in 'choosing' phase
  useEffect(() => {
    if (phase !== 'choosing') {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          if (!timedOut.current) {
            timedOut.current = true
            onTimeout()
          }
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase, onTimeout])

  const timerFraction = timeLeft / timerSeconds
  const timerColor = timerFraction > 0.5 ? 'var(--accent)' : timerFraction > 0.25 ? 'var(--warning)' : 'var(--danger)'

  return (
    <div style={{ margin: '6px 0' }}>
      <div style={{
        background: 'var(--bg-dark)',
        borderRadius: 12,
        padding: 16,
        border: '1.5px solid rgba(196,122,58,0.3)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      }}>
        {/* Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent)', margin: 0 }}>
            {icon} {title} — {minute}. min
          </p>
          {phase === 'choosing' && (
            <span style={{ fontSize: 12, fontWeight: 700, color: timerColor, fontFamily: 'var(--font-display)' }}>
              {timeLeft}s
            </span>
          )}
        </div>

        {/* Timer bar */}
        {phase === 'choosing' && (
          <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, marginBottom: 10, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${timerFraction * 100}%`,
              background: timerColor,
              borderRadius: 2,
              transition: 'width 1s linear, background 0.3s',
            }} />
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: 'var(--bg-dark-surface)', borderRadius: 4, marginBottom: 10 }}>
            {stats}
          </div>
        )}

        {/* Pitch */}
        <div style={{ opacity: phase === 'locked' ? 0.7 : 1, transition: 'opacity 0.3s' }}>
          {pitch}
        </div>

        {/* Coach tip */}
        {coachTip && coach && phase === 'choosing' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(196,122,58,0.08)', borderRadius: 6, marginBottom: 8, border: '1px solid rgba(196,122,58,0.2)' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>{coach.initials}</span>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontStyle: 'italic', color: 'var(--text-light-secondary)', flex: 1 }}>
              {coachTip}
            </span>
          </div>
        )}

        {/* Actions (buttons etc) */}
        {phase === 'choosing' && actions}

        {/* Locked state */}
        {phase === 'locked' && (
          <div style={{ padding: '8px 0', textAlign: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '1px' }}>· · ·</span>
          </div>
        )}

        {/* Outcome */}
        {phase === 'revealed' && outcome && (
          <div style={{
            padding: '8px 10px', borderRadius: 6, marginTop: 8,
            opacity: 1,
            transition: 'opacity 0.4s ease',
          }}>
            {outcome}
          </div>
        )}
      </div>
    </div>
  )
}
