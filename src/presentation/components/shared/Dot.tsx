/**
 * Dot — delad severity-/status-prick (CSS, ALDRIG emoji).
 *
 * Ratificerad severity-skala (2026-06-11, rules-severity-skala.html):
 *   0 Lugn        → ingen prick (neutralt = tystnad, rendera inget)
 *   1 Uppmärksamhet → warning  (actionabelt, ej akut)
 *   2 Brådska      → danger    (deadline/risk nu)
 *   3 Kris         → eget band på mörk yta (inte en prick)
 *
 * `accent` (copper) = "nyheter"-spåret i inkorgen. `success`/`neutral` för
 * status. Urgency-dimensionen blandas ALDRIG med relations-dimensionen
 * (--cold/--warm). Ersätter semafor-emoji (🔴🟡⚪) och ad-hoc inline-prickar.
 */

export type DotColor = 'danger' | 'warning' | 'accent' | 'success' | 'neutral'

const DOT_TOKEN: Record<DotColor, string> = {
  danger: 'var(--danger)',
  warning: 'var(--warning)',
  accent: 'var(--accent)',
  success: 'var(--success)',
  neutral: 'var(--border-dark)',
}

/** CSS-färgvärde (token) för en severity/status-färg. För text/border som ska matcha pricken. */
export function dotColor(color: DotColor): string {
  return DOT_TOKEN[color]
}

export function Dot({ color, size = 7 }: { color: DotColor; size?: number }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: DOT_TOKEN[color],
        flexShrink: 0,
      }}
    />
  )
}
