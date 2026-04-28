/**
 * VictoryQuote — citat med vänsterkant-streck (Birger Karlsson).
 * Pixel-värden från victory-mockup .victory-quote.
 */

interface Props {
  quote: string
  attribution: string
}

export function VictoryQuote({ quote, attribution }: Props) {
  return (
    <div
      style={{
        borderLeft: '2px solid var(--match-gold)',
        padding: '8px 0 8px 14px',
        margin: '0 auto 36px',
        textAlign: 'left',
        maxWidth: 320,
        fontFamily: 'Georgia, serif',
        fontSize: 13,
        color: 'var(--text-light-secondary)',
        fontStyle: 'italic',
        lineHeight: 1.5,
      }}
    >
      "{quote}"
      <span
        style={{
          display: 'block',
          fontSize: 10,
          color: 'var(--text-muted)',
          marginTop: 6,
          fontStyle: 'normal',
        }}
      >
        — {attribution}
      </span>
    </div>
  )
}
