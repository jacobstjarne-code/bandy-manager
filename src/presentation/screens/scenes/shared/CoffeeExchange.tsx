/**
 * CoffeeExchange — en samtals-utbyte i kafferummet.
 * Två rader: speakerA till vänster, speakerB till höger (höger = row-reverse).
 *
 * Pixel-värden från docs/mockups/kafferummet_mockup.html. Justera inte.
 */

const FADE_KEYFRAMES = `
@keyframes scene-fade-in-exchange {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
`

interface SpeakerRowProps {
  initial: string
  speakerName: string
  text: string
  align: 'left' | 'right'
}

function SpeakerRow({ initial, speakerName, text, align }: SpeakerRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        flexDirection: align === 'right' ? 'row-reverse' : 'row',
        textAlign: align,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'var(--bg-dark-elevated)',
          border: '1px solid var(--bg-leather)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Georgia, serif',
          fontSize: 13,
          color: 'var(--text-light-secondary)',
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        {initial}
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <div
          style={{
            fontSize: 9,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            fontWeight: 600,
          }}
        >
          {speakerName}
        </div>
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 13,
            color: 'var(--text-light-secondary)',
            lineHeight: 1.5,
            fontStyle: 'italic',
          }}
        >
          {'"' + text + '"'}
        </div>
      </div>
    </div>
  )
}

interface Props {
  exchange: [string, string, string, string]
  delay: number
}

export function CoffeeExchange({ exchange, delay }: Props) {
  const [speakerA, textA, speakerB, textB] = exchange
  const initialA = speakerA.charAt(0).toUpperCase()
  const initialB = speakerB.charAt(0).toUpperCase()

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        opacity: 0,
        animation: 'scene-fade-in-exchange 0.6s ease-out forwards',
        animationDelay: `${delay}ms`,
      }}
    >
      <style>{FADE_KEYFRAMES}</style>
      <SpeakerRow initial={initialA} speakerName={speakerA} text={textA} align="left" />
      <SpeakerRow initial={initialB} speakerName={speakerB} text={textB} align="right" />
    </div>
  )
}
