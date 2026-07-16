/**
 * InteractionShell.tsx — Stålvallen event-panel shell
 *
 * BATCH B-01. Shared shell for all 5 event panels.
 * Backward-compatible: legacy consumers (CornerInteraction etc) that
 * pass timerSeconds/stats/actions still work. New consumers can use
 * the structured riskRow API. T5b/UT-1 (ratificerad 2026-07-16): nedräkningen
 * är ETT element (CountdownIndicator) med två uttryckliga states ägda av
 * TRÖSKELN, inte av anropskoden — badge när timeLeft > 10s, ring när ≤10s.
 * Ingen caller väljer style längre; alla fem paneler har idag totalSeconds
 * ≤ 8, så ringen är i praktiken alltid det synliga läget — badge-grenen är
 * en dokumenterad, avsiktlig gren för framtida längre timers, inte dött kod.
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
}

interface Props {
  icon: string
  title: string
  minute: number
  // Legacy API — still works
  timerSeconds?: number
  // New API — structured timer.
  // T5b (UT-1, CODE_INSTRUKTION_SIDFOT_INTRORAM 2026-07-13/14): ringen (CountDownRing)
  // är nu den ENDA nedräkningsrepresentationen — badge-varianten (.event-timer "tag")
  // tog bort. Alla fem uppgifts-toppar delade tidigare två visuella språk (amber-badge
  // vs. ring) för samma sak; ringen var den starkare, skalar till alla lägen.
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
  // T5c/UT-2 (ratificerad 2026-07-16): fold-hint-mall ägd härifrån — de fem
  // panelerna matar bara in etikett + uppmaning, aldrig egen huvud-styling.
  // Renderas "▲ {foldHintLabel} · {foldHintPrompt}". foldHintLabel default
  // faller tillbaka till title om utelämnad.
  foldHintLabel?: string
  foldHintPrompt: string
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

/**
 * CountdownIndicator — ETT nedräkningselement, två uttryckliga states
 * (T5b/UT-1, ratificerad 2026-07-16). Badge när gott om tid (>10s kvar),
 * ring när det brådskar (≤10s). Tröskeln ägs här, inte av anropskoden.
 */
const BADGE_THRESHOLD_SECONDS = 10

function CountdownIndicator({ timeLeft, total }: { timeLeft: number; total: number }) {
  if (timeLeft > BADGE_THRESHOLD_SECONDS) {
    return (
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
        color: 'var(--led-amber)',
        background: 'rgba(255,170,0,0.08)',
        border: '1px solid rgba(255,170,0,0.25)',
        borderRadius: 3, padding: '3px 7px',
        flexShrink: 0,
      }}>
        {timeLeft}s
      </span>
    )
  }
  return <CountDownRing timeLeft={timeLeft} total={total} />
}

export function InteractionShell({
  icon, title, minute,
  timerSeconds,
  timer,
  stats, pitch, coachTip, coach, actions,
  subChoices, readout, riskRow, cta,
  phase, outcome, onTimeout, untimed,
  foldHintLabel, foldHintPrompt,
}: Props) {
  // Resolve timer config — timer prop takes precedence over legacy timerSeconds
  const totalSeconds = timer?.seconds ?? timerSeconds ?? 5

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
    // B-2: starta nedräkningen EFTER inglidningen (220ms slide, se .lf-dock),
    // så spelaren inte förlorar första sekunden på att panelen glider in.
    const startDelay = setTimeout(() => {
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
    }, 220)
    return () => {
      clearTimeout(startDelay)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase, totalSeconds, untimed])

  return (
    <div className="interaction-root">
      {/* Fold-hint — T5c/UT-2: mall ägd här, panelerna matar bara in etikett+uppmaning */}
      <div className="interaction-fold-hint">
        <span className="interaction-fold-hint-arrow">▲</span>
        <span className="interaction-fold-hint-label">{foldHintLabel ?? title} · {foldHintPrompt}</span>
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

          {/* Nedräkning — CountdownIndicator (T5b/UT-1). Släckt i untimed (övningsläge). */}
          {phase === 'choosing' && !untimed && (
            <CountdownIndicator timeLeft={timeLeft} total={totalSeconds} />
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

        {/* New CTA button. T1 (SF-3, CODE_INSTRUKTION_SIDFOT_INTRORAM 2026-07-13):
            i untimed (practice) sammanfaller diegetisk commit och sidfot — rendera
            sidfotsmallen (.btn .btn-primary .btn-cta), inte den mono/flat/tidsatta
            live-stilen. untimed är i praktiken bara sant för hörnan i introt idag
            (enda konsumenten som sätter practice), så andra interaction-cta-copper-
            ytor (straff/kontring/frislag, alltid live) påverkas inte. */}
        {cta && phase === 'choosing' && (
          <button
            onClick={cta.onClick}
            className={untimed ? 'btn btn-primary btn-cta' : (cta.variant === 'danger' ? 'interaction-cta-danger' : 'interaction-cta-copper')}
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
