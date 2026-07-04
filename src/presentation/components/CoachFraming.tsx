/** Coach-framing med monogrammcirkel — F2/F3-stil (9px header). Delad mellan
 * TilltradeScreen (F1/F3/F4) och LineupStep i practice-läge (F2, Sätt elvan). */
export function CoachFraming({ initial, quote }: { initial: string; quote: string }) {
  return (
    <div style={{
      margin: '12px 16px',
      background: 'rgba(0,0,0,0.3)',
      borderLeft: '2px solid var(--copper)',
      borderRadius: '0 8px 8px 0',
      padding: '9px 12px',
      display: 'flex', gap: 9, alignItems: 'center',
    }}>
      <span style={{
        flexShrink: 0,
        width: 22, height: 22, borderRadius: '50%',
        background: 'var(--bg-leather)',
        border: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'ui-monospace, monospace', fontSize: 8, fontWeight: 700,
        color: 'var(--accent)',
      }}>
        {initial}
      </span>
      <span style={{
        fontFamily: 'Georgia, serif', fontStyle: 'italic',
        fontSize: 12, color: 'var(--text-quote-light)', lineHeight: 1.35,
      }}>
        {quote}
      </span>
    </div>
  )
}
