# FIXSPEC: Coach Marks — OMSKRIVNING

## Vad som är fel

Nuvarande CoachMarks renderar tooltip-innehållet som ett INLINE element i DashboardScreens renderträd. Det finns ingen overlay, ingen dim, ingen spotlight. Texten klipps av under BottomNav. Hela poängen med coach marks — att peka på ett specifikt UI-element med en spotlight — saknas.

## Krav (se docs/mockups/onboarding_mockup.html)

Komponenten ska vara en **position: fixed overlay som täcker HELA skärmen**, inklusive BottomNav. Bakom overlayet finns en mörk dim. I dimman finns ett "hål" (spotlight) som visar det faktiska UI-elementet under. Bredvid hålet visas en tooltip med förklaring.

## Exakt implementation

### CoachMarks.tsx — ny komponent (ERSÄTT nuvarande helt)

```tsx
import { useState, useEffect } from 'react'

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
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.65)' }} />
    )
  }

  const spaceBelow = window.innerHeight - targetRect.bottom
  const tooltipBelow = spaceBelow > 280
  const pad = 8

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
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

      <style>{`
        @keyframes coachPulse {
          0%, 100% { box-shadow: 0 0 0 4000px rgba(0,0,0,0.65), 0 0 0 0px rgba(196,122,58,0.3); }
          50% { box-shadow: 0 0 0 4000px rgba(0,0,0,0.65), 0 0 0 8px rgba(196,122,58,0.15); }
        }
      `}</style>
    </div>
  )
}
```

### DashboardScreen — data-coach-id attribut

Lägg till på tre element:
- CTA-knappen: `data-coach-id="cta-button"`
- Orten-cellen: `data-coach-id="orten-card"`
- Klacken-sektionen: `data-coach-id="klacken-card"`

### DashboardScreen — rendera CoachMarks

INTE inne i scroll-containern. Som syskon UTANFÖR:

```tsx
return (
  <>
    <div className="screen-enter" style={{ ... }}>
      {/* hela dashboarden */}
    </div>
    {!game.coachMarksSeen && <CoachMarks onDone={markCoachMarksSeen} />}
  </>
)
```

### Ta bort
- TutorialOverlay.tsx
- `{!game.tutorialSeen && <TutorialOverlay />}` i DashboardScreen
- `markTutorialSeen` i gameStore (ersätts av `markCoachMarksSeen`)

### Verifiering
```bash
grep -n "position.*fixed" src/presentation/components/CoachMarks.tsx  # MÅSTE finnas
grep -n "4000px" src/presentation/components/CoachMarks.tsx           # MÅSTE finnas
grep -rn "TutorialOverlay" src/                                       # ska ge 0
```
