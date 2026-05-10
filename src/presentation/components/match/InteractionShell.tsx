/**
 * InteractionShell.tsx — Stålvallen event-panel shell
 *
 * BATCH B-01. Shared shell for all 5 event panels.
 * Backward-compatible: legacy consumers (CornerInteraction etc) that
 * pass timerSeconds/stats/actions still work. New consumers can use
 * the structured riskRow + timer.style='ring' API.
 *
 * Lärdom #3 (LESSONS.md): useRef for callback dep — onTimeout never in dep array.
 * Lärdom #7: don't put state written inside effect into deps.
 */
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { AssistantCoach } from '../../../domain/entities/AssistantCoach'

export type InteractionPhase = 'choosing' | 'locked' | 'revealed'

interface TimerConfig {
  seconds: number
  style: 'tag' | 'ring'
}

interface Props {
  icon: string
  title: string
  minute: number
  // Legacy API — still works
  timerSeconds?: number
  // New API — structured timer with ring support for last-minute
  timer?: TimerConfig
  stats?: ReactNode
  pitch: ReactNode
  coachTip?: string
  coach?: AssistantCoach
  actions?: ReactNode
  // New structured sub-choice buttons (rendered separately from legacy actions)
  subChoices?: ReactNode
  readout?: { label: string; pct: number }
  riskRow?: string[]
  phase: InteractionPhase
  outcome?: ReactNode
  onTimeout: () => void
  // New CTA variant
  cta?: { label: string; variant: 'copper' | 'danger'; onClick: () => void }
}

/** SVG count-down ring for last-minute press */
function CountDownRing({ timeLeft, total, color = 'var(--led-red)' }: { timeLeft: number; total: number; color?: string }) {
  const fraction = Math.max(0, timeLeft / total)
  const circumference = 2 * Math.PI * 16
  const dash = fraction * circumference
  return (
    <svg
      className="event-timer-ring"
      viewBox="0 0 36 36"
      width={36}
      height={36}
      style={{ display: 'block', flexShrink: 0 }}
    >
      {/* Background circle */}
      <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
      {/* Progress circle */}
      <circle
        cx="18" cy="18" r="16" fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference}`}
        strokeDashoffset={circumference * 0.25}  /* start at top */
        style={{
          animation: 'pulse 0.9s ease-in-out infinite',
          transition: 'stroke-dasharray 1s linear',
        }}
      />
      {/* Time label */}
      <text x="18" y="22" textAnchor="middle" fill={color} fontSize="9" fontWeight="700" fontFamily="monospace">
        {timeLeft}
      </text>
    </svg>
  )
}

export function InteractionShell({
  icon, title, minute,
  timerSeconds,
  timer,
  stats, pitch, coachTip, coach, actions,
  subChoices, readout, riskRow, cta,
  phase, outcome, onTimeout,
}: Props) {
  // Resolve timer config — timer prop takes precedence over legacy timerSeconds
  const totalSeconds = timer?.seconds ?? timerSeconds ?? 5
  const timerStyle: 'tag' | 'ring' = timer?.style ?? 'tag'

  const [timeLeft, setTimeLeft] = useState(totalSeconds)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timedOut = useRef(false)
  const timeLeftRef = useRef(totalSeconds)
  const onTimeoutRef = useRef(onTimeout)
  useEffect(() => { onTimeoutRef.current = onTimeout }, [onTimeout])

  // Timer — only runs in 'choosing' phase (Lærdom #3 pattern)
  useEffect(() => {
    if (phase !== 'choosing') {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timeLeftRef.current = totalSeconds
    setTimeLeft(totalSeconds)
    timedOut.current = false
    timerRef.current = setInterval(() => {
      timeLeftRef.current -= 1
      setTimeLeft(timeLeftRef.current)
      if (timeLeftRef.current <= 0) {
        clearInterval(timerRef.current!)
        if (!timedOut.current) {
          timedOut.current = true
          onTimeoutRef.current()
        }
      }
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase, totalSeconds])

  const timerFraction = timeLeft / totalSeconds

  // Tag timer color for legacy style
  const tagColor = timerFraction > 0.5
    ? 'var(--led-amber)'
    : timerFraction > 0.25
    ? 'var(--led-red)'
    : 'var(--led-red)'

  return (
    <div style={{
      position: 'relative',
      margin: '0',
    }}>
      {/* Fold-hint */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '6px 12px 4px',
        background: 'var(--bg-leather-dk)',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>▲</span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700,
          letterSpacing: '2px', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase',
        }}>
          HÄNDELSE KRÄVER SVAR
        </span>
      </div>

      <div style={{
        background: 'var(--bg-leather-dk)',
        borderTop: '1px solid rgba(196,122,58,0.25)',
        padding: '0 12px 12px',
      }}>
        {/* Event head */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 0 8px',
        }}>
          {/* LED tag */}
          <div style={{
            background: 'rgba(255,42,24,0.12)',
            border: '1px solid rgba(255,42,24,0.3)',
            borderRadius: 3,
            padding: '3px 7px',
            fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700,
            letterSpacing: '1.5px', color: 'var(--led-red)', textTransform: 'uppercase',
            flexShrink: 0,
          }}>
            {icon}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                color: 'var(--paper-warm)', letterSpacing: '1px',
              }}>
                {title}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 9,
                color: 'rgba(245,241,235,0.4)',
              }}>
                {minute}&apos;
              </span>
            </div>
          </div>

          {/* Timer — tag or ring */}
          {phase === 'choosing' && (
            timerStyle === 'ring' ? (
              <CountDownRing timeLeft={timeLeft} total={totalSeconds} />
            ) : (
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
                color: tagColor,
                background: `rgba(255,170,0,${timerFraction < 0.3 ? 0.15 : 0.08})`,
                border: `1px solid rgba(255,170,0,0.25)`,
                borderRadius: 3, padding: '3px 7px',
                flexShrink: 0,
              }}>
                {timeLeft}s
              </span>
            )
          )}
        </div>

        {/* Stats strip (legacy) */}
        {stats && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 8px',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 4, marginBottom: 8,
          }}>
            {stats}
          </div>
        )}

        {/* Pitch panel */}
        <div style={{
          background: 'linear-gradient(180deg, #1A2628 0%, #0E1518 100%)',
          borderRadius: 6,
          overflow: 'hidden',
          marginBottom: 8,
          opacity: phase === 'locked' ? 0.7 : 1,
          transition: 'opacity 0.3s',
        }}>
          {pitch}
        </div>

        {/* Sub-choices (new API — monospace buttons) */}
        {subChoices && phase === 'choosing' && (
          <div style={{ marginBottom: 8 }}>
            {subChoices}
          </div>
        )}

        {/* Legacy actions */}
        {actions && phase === 'choosing' && (
          <div style={{ marginBottom: 8 }}>
            {actions}
          </div>
        )}

        {/* Readout */}
        {readout && (
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(245,241,235,0.55)',
            padding: '4px 0', marginBottom: 6,
          }}>
            <span style={{ color: 'rgba(245,241,235,0.35)' }}>VAL: </span>
            <span style={{ color: 'var(--led-green)' }}>{readout.label}</span>
            <span style={{ color: 'rgba(245,241,235,0.35)', marginLeft: 8 }}>
              {readout.pct}%
            </span>
          </div>
        )}

        {/* Risk row (last-minute only) */}
        {riskRow && riskRow.length > 0 && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8,
          }}>
            {riskRow.map((r, i) => (
              <span key={i} style={{
                fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700,
                color: 'rgba(255,42,24,0.8)',
                background: 'rgba(255,42,24,0.08)',
                border: '1px solid rgba(255,42,24,0.2)',
                borderRadius: 3, padding: '2px 6px',
              }}>{r}</span>
            ))}
          </div>
        )}

        {/* Coach tip */}
        {coachTip && coach && phase === 'choosing' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px',
            background: 'rgba(196,122,58,0.08)',
            borderRadius: 5, marginBottom: 8,
            border: '1px solid rgba(196,122,58,0.2)',
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: 'var(--copper-deep)',
              border: '1px solid rgba(196,122,58,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{
                color: 'var(--paper-warm)', fontSize: 8, fontWeight: 700,
                fontFamily: 'var(--font-mono)',
              }}>{coach.initials}</span>
            </div>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 11,
              fontStyle: 'italic', color: 'rgba(245,241,235,0.65)', flex: 1,
            }}>
              {coachTip}
            </span>
          </div>
        )}

        {/* New CTA button */}
        {cta && phase === 'choosing' && (
          <button
            onClick={cta.onClick}
            style={{
              width: '100%',
              padding: '12px',
              background: cta.variant === 'danger' ? 'var(--led-red)' : 'var(--copper)',
              border: 'none',
              borderRadius: 6,
              color: cta.variant === 'danger' ? '#fff' : 'var(--bg-leather-dk)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12, fontWeight: 700,
              letterSpacing: '1px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              boxShadow: cta.variant === 'danger'
                ? '0 2px 12px rgba(255,42,24,0.4)'
                : '0 2px 8px rgba(196,122,58,0.3)',
            }}
          >
            {cta.label}
          </button>
        )}

        {/* Locked state */}
        {phase === 'locked' && (
          <div style={{ padding: '8px 0', textAlign: 'center' }}>
            <span style={{
              fontSize: 11,
              color: 'var(--copper)',
              letterSpacing: '1px',
              fontFamily: 'var(--font-mono)',
            }}>· · ·</span>
          </div>
        )}

        {/* Outcome */}
        {phase === 'revealed' && outcome && (
          <div style={{
            padding: '8px 10px', borderRadius: 5, marginTop: 8,
            background: 'rgba(255,255,255,0.04)',
          }}>
            {outcome}
          </div>
        )}
      </div>
    </div>
  )
}
