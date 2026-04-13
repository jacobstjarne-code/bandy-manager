import { useEffect, useState } from 'react'

const COACH_STEPS = [
  {
    targetId: 'cta-button',
    emoji: '👆',
    title: 'Det här är din viktigaste knapp',
    body: 'Tryck här för att spela nästa match. Men först — se till att du har en startelva. Utan spelare på isen vinner ingen.',
    footnote: '(Oroa dig inte, vi påminner dig.)',
    position: 'below' as const,
  },
  {
    targetId: 'orten-card',
    emoji: '🏘',
    title: 'Det här är inte bara ett lag',
    body: 'Det är en förening. Frivilliga säljer korv. Kommunen ger bidrag. Klacken sjunger. Allt hänger ihop.\n\nBygdens puls påverkar din ekonomi, ditt rykte och din hemmaplansfördel.',
    position: 'below' as const,
  },
  {
    targetId: 'klacken-card',
    emoji: '📐',
    title: 'Klacken och hörnorna',
    body: 'Fyra personer med åsikter. De sjunger, bråkar och älskar laget. Håll dem glada — de ger hemmabonus.\n\nOch i bandy avgörs matcher vid hörnor. Du får välja zon och leverans. Klackens energi gör skillnad.',
    footnote: 'Birger trummar redan. Dags att börja.',
    isLast: true,
    position: 'below' as const,
  },
]

interface CoachMarksProps {
  step: 0 | 1 | 2
  onNext: () => void
  onSkip: () => void
}

export function CoachMarks({ step, onNext, onSkip }: CoachMarksProps) {
  const [rect, setRect] = useState<DOMRect | null>(null)
  const stepData = COACH_STEPS[step]

  useEffect(() => {
    setRect(null)
    const el = document.querySelector(`[data-coach-id="${stepData.targetId}"]`) as HTMLElement | null
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const timer = setTimeout(() => {
      setRect(el.getBoundingClientRect())
    }, 300)
    return () => clearTimeout(timer)
  }, [step, stepData.targetId])

  if (!rect) return null

  const pad = 8
  const spotTop = rect.top - pad
  const spotLeft = rect.left - pad
  const spotW = rect.width + pad * 2
  const spotH = rect.height + pad * 2
  const tooltipTop = rect.bottom + pad + 12

  return (
    <>
      <style>{`
        @keyframes coachGlow {
          0%, 100% { box-shadow: 0 0 0 4000px rgba(0,0,0,0.65), 0 0 0 3px rgba(196,122,58,0.4), 0 0 16px 4px rgba(196,122,58,0.15); }
          50% { box-shadow: 0 0 0 4000px rgba(0,0,0,0.65), 0 0 0 3px rgba(196,122,58,0.8), 0 0 24px 8px rgba(196,122,58,0.25); }
        }
      `}</style>

      {/* Backdrop click = skip */}
      <div
        onClick={onSkip}
        style={{ position: 'fixed', inset: 0, zIndex: 300 }}
      />

      {/* Spotlight */}
      <div
        style={{
          position: 'fixed',
          top: spotTop,
          left: spotLeft,
          width: spotW,
          height: spotH,
          borderRadius: 8,
          animation: 'coachGlow 2s ease-in-out infinite',
          zIndex: 301,
          pointerEvents: 'none',
        }}
      />

      {/* Tooltip */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: tooltipTop,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--accent)',
          borderRadius: 12,
          padding: '16px',
          maxWidth: 320,
          width: 'calc(100vw - 32px)',
          zIndex: 302,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        {/* Arrow pointing up */}
        <div style={{
          position: 'absolute',
          top: -8,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderBottom: '8px solid var(--accent)',
        }} />

        <p style={{ fontSize: 20, margin: '0 0 8px' }}>{stepData.emoji}</p>
        <p style={{
          fontSize: 14, fontWeight: 700,
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-display)',
          margin: '0 0 8px',
        }}>
          {stepData.title}
        </p>
        <p style={{
          fontSize: 12, color: 'var(--text-secondary)',
          lineHeight: 1.6, whiteSpace: 'pre-line',
          margin: stepData.footnote ? '0 0 8px' : '0 0 16px',
        }}>
          {stepData.body}
        </p>
        {stepData.footnote && (
          <p style={{
            fontSize: 11, color: 'var(--text-muted)',
            fontStyle: 'italic', margin: '0 0 16px',
          }}>
            {stepData.footnote}
          </p>
        )}

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!stepData.isLast && (
            <button
              onClick={onSkip}
              style={{
                fontSize: 11, color: 'var(--text-muted)',
                background: 'none', border: 'none',
                cursor: 'pointer', padding: '8px 4px',
                flexShrink: 0,
              }}
            >
              Hoppa över
            </button>
          )}
          <button
            onClick={onNext}
            style={{
              flex: 1, padding: '10px 16px',
              background: 'linear-gradient(135deg, var(--accent-dark), var(--accent-deep))',
              color: 'var(--text-light)', border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'var(--font-body)',
            }}
          >
            {stepData.isLast ? 'Kör igång! 🏒' : 'Nästa →'}
          </button>
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
          {COACH_STEPS.map((_, i) => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: '50%',
              background: i === step ? 'var(--accent)' : 'var(--border)',
            }} />
          ))}
        </div>
      </div>
    </>
  )
}
