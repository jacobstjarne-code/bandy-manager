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
  // Explicit opt-out: ingen tidspress (övningsläge). Default = false → timern kör
  // som vanligt. "timer saknas = av" undviks medvetet (skulle tyst släcka live-paneler).
  untimed?: boolean
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
  phase, outcome, onTimeout, untimed,
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

  // Timer — only runs in 'choosing' phase (Lærdom #3 pattern). untimed = övningsläge: kör aldrig.
  useEffect(() => {
    if (phase !== 'choosing' || untimed) {
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
  }, [phase, totalSeconds, untimed])

  const timerFraction = timeLeft / totalSeconds

  // Tag timer color for legacy style
  const tagColor = timerFraction > 0.5
    ? 'var(--led-amber)'
    : timerFraction > 0.25
    ? 'var(--led-red)'
    : 'var(--led-red)'

  return (
    <div className="interaction-root">
      {/* Fold-hint */}
      <div className="interaction-fold-hint">
        <span className="interaction-fold-hint-arrow">▲</span>
        <span className="interaction-fold-hint-label">HÄNDELSE KRÄVER SVAR</span>
      </div>

      <div className="interaction-panel">
        {/* Event head */}
        <div className="interaction-head">
          {/* LED tag */}
          <div className="interaction-led-tag">{icon}</div>

          <div className="interaction-title-row">
            <div className="interaction-title-inner">
              <span className="interaction-title">{title}</span>
              <span className="interaction-minute">{minute}&apos;</span>
            </div>
          </div>

          {/* Timer — tag or ring. Släckt i untimed (övningsläge). */}
          {phase === 'choosing' && !untimed && (
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
          <div className="interaction-stats-strip">{stats}</div>
        )}

        {/* Pitch panel */}
        <div className={`interaction-pitch-panel${phase === 'locked' ? ' locked' : ''}`}>
          {pitch}
        </div>

        {/* Sub-choices (new API — monospace buttons) */}
        {subChoices && phase === 'choosing' && (
          <div className="interaction-sub-choices">{subChoices}</div>
        )}

        {/* Legacy actions */}
        {actions && phase === 'choosing' && (
          <div className="interaction-actions">{actions}</div>
        )}

        {/* Readout */}
        {readout && (
          <div className="interaction-readout">
            <span className="interaction-readout-label">VAL: </span>
            <span className="interaction-readout-value">{readout.label}</span>
            <span className="interaction-readout-pct">{readout.pct}%</span>
          </div>
        )}

        {/* Risk row (last-minute only) */}
        {riskRow && riskRow.length > 0 && (
          <div className="interaction-risk-row">
            {riskRow.map((r, i) => (
              <span key={i} className="interaction-risk-tag">{r}</span>
            ))}
          </div>
        )}

        {/* Coach tip */}
        {coachTip && coach && phase === 'choosing' && (
          <div className="interaction-coach-tip">
            <div className="interaction-coach-avatar">
              <span className="interaction-coach-initials">{coach.initials}</span>
            </div>
            <span className="interaction-coach-text">{coachTip}</span>
          </div>
        )}

        {/* New CTA button */}
        {cta && phase === 'choosing' && (
          <button
            onClick={cta.onClick}
            className={cta.variant === 'danger' ? 'interaction-cta-danger' : 'interaction-cta-copper'}
          >
            {cta.label}
          </button>
        )}

        {/* Locked state */}
        {phase === 'locked' && (
          <div className="interaction-locked-state">
            <span className="interaction-locked-dots">· · ·</span>
          </div>
        )}

        {/* Outcome */}
        {phase === 'revealed' && outcome && (
          <div className="interaction-outcome">{outcome}</div>
        )}
      </div>
    </div>
  )
}
