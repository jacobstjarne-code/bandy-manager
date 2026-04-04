import { useState } from 'react'

interface TutorialOverlayProps {
  managerName: string
  clubName: string
  onDone: () => void
}

const STEPS = (managerName: string, clubName: string) => [
  {
    emoji: '🏒',
    title: `Välkommen, ${managerName}!`,
    body: `Du är ny tränare för ${clubName}. En hel säsong väntar — 22 omgångar, 11 mot lag som vill ta dina poäng.`,
  },
  {
    emoji: '👥',
    title: 'Sätt din startelva',
    body: 'Gå till Trupp-fliken och välj 11 startspelare plus avbytare. Utan en satt lineup kan du inte spela matcher.',
  },
  {
    emoji: '⚡',
    title: 'Välj din taktik',
    body: 'Under Match-fliken väljer du taktik: mentalitet, tempo, press och mer. Taktiken påverkar hur laget spelar.',
  },
  {
    emoji: '▶',
    title: 'Tryck Fortsätt',
    body: 'När lineup och taktik är redo — tryck FORTSÄTT på dashboarden för att spela nästa omgång. Lycka till!',
  },
]

export function TutorialOverlay({ managerName, clubName, onDone }: TutorialOverlayProps) {
  const [step, setStep] = useState(0)
  const steps = STEPS(managerName, clubName)
  const current = steps[step]
  const isLast = step === steps.length - 1

  function handleNext() {
    if (isLast) {
      onDone()
    } else {
      setStep(s => s + 1)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 300,
      background: 'rgba(0,0,0,0.92)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 20px',
    }}>
      <div style={{
        maxWidth: 340,
        width: '100%',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}>
        {/* Emoji */}
        <div style={{ fontSize: 48, marginBottom: 16, lineHeight: 1 }}>
          {current.emoji}
        </div>

        {/* Title */}
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
          {current.title}
        </h2>

        {/* Body */}
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 28 }}>
          {current.body}
        </p>

        {/* Step dots */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {steps.map((_, i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: i === step ? 'var(--accent)' : 'transparent',
                border: i === step ? '1px solid var(--accent)' : '1px solid var(--border)',
              }}
            />
          ))}
        </div>

        {/* Next / Done button */}
        <button
          onClick={handleNext}
          style={{
            width: '100%',
            padding: '13px',
            background: 'var(--accent)',
            color: 'var(--text-light)',
            borderRadius: 'var(--radius)',
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          {isLast ? 'Börja spela!' : 'Nästa →'}
        </button>
      </div>
    </div>
  )
}
