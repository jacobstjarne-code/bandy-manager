import { useState, useEffect } from 'react'
import { Z } from '../utils/zIndices'

interface CoachStep {
  targetId: string
  emoji: string
  title: string
  body: string
  footnote?: string
  lastStepLabel?: string
}

const STEPS: CoachStep[] = [
  {
    targetId: 'cta-button',
    emoji: '👆',
    title: 'Det här är din viktigaste knapp',
    body: 'Tryck här för att spela nästa match. Men först — se till att du har en startelva. Utan spelare på isen vinner ingen.',
    footnote: '(Oroa dig inte, vi påminner dig.)',
  },
  {
    targetId: 'orten-card',
    emoji: '🏘',
    title: 'Det här är inte bara ett lag',
    body: 'Det är en förening. Frivilliga säljer korv. Kommunen ger bidrag. Klacken sjunger. Allt hänger ihop.\n\nBygdens puls påverkar din ekonomi, ditt rykte och din hemmaplansfördel.',
  },
  {
    targetId: 'klacken-card',
    emoji: '📐',
    title: 'Klacken och hörnorna',
    body: 'Fyra personer med åsikter. De sjunger, bråkar och älskar laget. Håll dem glada — de ger hemmabonus.\n\nI bandy avgörs matcher vid hörnor. Du får välja zon och leverans.',
    footnote: 'Birger trummar redan. Dags att börja.',
    lastStepLabel: 'Kör igång! 🏒',
  },
]

interface Props {
  onDone: () => void
}

export function CoachMarks({ onDone }: Props) {
  const [step, setStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  useEffect(() => {
    const el = document.querySelector(`[data-coach-id="${current.targetId}"]`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const timer = setTimeout(() => {
      setTargetRect(el.getBoundingClientRect())
    }, 400)
    return () => clearTimeout(timer)
  }, [step, current.targetId])

  function handleNext() {
    if (isLast) { onDone(); return }
    setTargetRect(null)
    setStep(s => s + 1)
  }

  if (!targetRect) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: Z.coachmarks, background: 'rgba(0,0,0,0.65)' }} />
    )
  }

  const spaceBelow = window.innerHeight - targetRect.bottom
  const tooltipBelow = spaceBelow > 280
  const pad = 8

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: Z.coachmarks }}>
      {/* Spotlight med box-shadow som dim */}
      <div style={{
        position: 'absolute',
        top: targetRect.top - pad,
        left: targetRect.left - pad,
        width: targetRect.width + pad * 2,
        height: targetRect.height + pad * 2,
        borderRadius: 12,
        boxShadow: '0 0 0 4000px rgba(0,0,0,0.65)',
        zIndex: 1,
        animation: 'coachPulse 2s ease-in-out infinite',
      }} />

      {/* Tooltip */}
      <div style={{
        position: 'absolute',
        left: 20, right: 20, zIndex: 2,
        ...(tooltipBelow
          ? { top: targetRect.bottom + pad + 16 }
          : { bottom: window.innerHeight - targetRect.top + pad + 16 }),
      }}>
        {/* Pil */}
        <div style={{
          position: 'absolute', width: 14, height: 14,
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          transform: 'rotate(45deg)',
          ...(tooltipBelow
            ? { top: -7, left: 30, borderRight: 'none', borderBottom: 'none' }
            : { bottom: -7, left: 30, borderLeft: 'none', borderTop: 'none' }),
        }} />

        {/* Tooltip-kort */}
        <div style={{
          background: 'var(--bg)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '16px 18px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
        }}>
          <span style={{ fontSize: 28, marginBottom: 8, display: 'block' }}>{current.emoji}</span>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, fontFamily: 'var(--font-display)' }}>{current.title}</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: current.footnote ? 6 : 14, whiteSpace: 'pre-line' }}>{current.body}</p>
          {current.footnote && (
            <p style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--text-muted)', marginBottom: 14 }}>{current.footnote}</p>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: i === step ? 'var(--accent)' : 'transparent',
                  border: `1px solid ${i === step ? 'var(--accent)' : 'var(--border)'}`,
                }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {!isLast && (
                <button onClick={onDone} style={{ fontSize: 10, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                  Hoppa över
                </button>
              )}
              <button onClick={handleNext} style={{
                padding: isLast ? '10px 28px' : '8px 20px', borderRadius: 8,
                fontSize: isLast ? 13 : 12, fontWeight: 600, border: 'none',
                background: 'var(--accent)', color: 'var(--text-light)', cursor: 'pointer',
              }}>
                {isLast ? (current.lastStepLabel ?? 'Klar!') : 'Nästa →'}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
