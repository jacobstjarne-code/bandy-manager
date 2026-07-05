import { useState } from 'react'

/**
 * IllustrationScene — bild-yta för ÖGONBLICK (ankomst, säsongsstart, ceremoni, final,
 * seger, kris). Aldrig bakom vardagsflöde — kort äger vardagen (domänregel, som guld).
 *
 * Tre lägen (mock 2026-06-05_design_illustrationssystem.html):
 *  - fullbleed: 100% yta, topp- + bottenscrim, text nederst (intro/säsongsstart)
 *  - band:      övre 50% bild, fade ned i portal-mörk, text under (anslag/ceremoni)
 *  - header:    200px band överst, fade till portal, mark över (finalhelg)
 *
 * Bilder ligger i public/assets/illustrations/ → ref /assets/illustrations/{name}.jpg.
 * Saknas bilden (eller 404) → IllustrationPlaceholder, samma dimensioner (inget hoppar
 * när bilden landar). Text aldrig naken på bild — scrim alltid.
 */
export type IllustrationMode = 'fullbleed' | 'band' | 'header'

interface Props {
  mode: IllustrationMode
  /** asset-namn → /assets/illustrations/{name}.jpg + placeholder-etikett */
  name: string
  /** explicit src-override (annars härleds ur name) */
  src?: string
  alt?: string
  /** innehåll (text) som renderas över scrimen */
  children?: React.ReactNode
  style?: React.CSSProperties
  /** yta band/header fadar ned mot (default portal-mörk; t.ex. --bg-portal-surface i anslag-kort) */
  fadeTo?: string
}

const MODE_BOX: Record<IllustrationMode, React.CSSProperties> = {
  fullbleed: { aspectRatio: '390 / 720' },
  band: { height: '50%' },
  header: { height: 200 },
}

const OBJECT_POS: Record<IllustrationMode, string> = {
  fullbleed: 'center',
  band: 'center 30%',
  header: 'center 40%',
}

// band/header fadar ned mot ytan de sitter på (default portal-mörk; override via fadeTo).
const singleScrim = (mode: 'band' | 'header', fadeTo: string) =>
  mode === 'band'
    ? `linear-gradient(180deg, transparent 55%, ${fadeTo} 100%)`
    : `linear-gradient(180deg, rgba(12,14,20,0.35) 0%, transparent 35%, transparent 60%, ${fadeTo} 100%)`

export function IllustrationPlaceholder({ name, style }: { name: string; style?: React.CSSProperties }) {
  // Scen-konst Del 2: fonden är avsiktlig, inte en trasig ruta. En kall is/strålkastar-
  // antydan + svag plan-båge i scen-paletten, så tomrummet läser som "scenen är riggad,
  // bilden kommer" — inte "något saknas". Dimensioner oförändrade (inget hoppar när
  // assetet landar). Token-only (color-mix mot --ice/--bg-portal-surface).
  return (
    <div
      style={{
        position: 'absolute', inset: 0, overflow: 'hidden',
        background: 'radial-gradient(ellipse 120% 80% at 50% 32%, color-mix(in srgb, var(--ice) 10%, var(--bg-portal-surface)) 0%, var(--bg-portal-surface) 68%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
        ...style,
      }}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <ellipse cx="50" cy="64" rx="46" ry="30" fill="none"
          style={{ stroke: 'color-mix(in srgb, var(--ice) 22%, transparent)', strokeWidth: 0.4 }} />
        <line x1="50" y1="34" x2="50" y2="94"
          style={{ stroke: 'color-mix(in srgb, var(--ice) 14%, transparent)', strokeWidth: 0.3 }} />
      </svg>
      <span style={{ position: 'relative', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '1px', color: 'var(--text-muted)' }}>
        ⬩ {name.toUpperCase()} ⬩
      </span>
      <span style={{ position: 'relative', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.5px', color: 'color-mix(in srgb, var(--text-muted) 65%, transparent)' }}>
        illustration på väg
      </span>
    </div>
  )
}

export function IllustrationScene({ mode, name, src, alt, children, style, fadeTo = 'var(--bg-portal)' }: Props) {
  const [failed, setFailed] = useState(false)
  const resolvedSrc = src ?? `/assets/illustrations/${name}.jpg`
  const showImage = !!resolvedSrc && !failed

  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: fadeTo, ...MODE_BOX[mode], ...style }}>
      {showImage ? (
        <img
          src={resolvedSrc}
          alt={alt ?? name}
          onError={() => setFailed(true)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: OBJECT_POS[mode] }}
        />
      ) : (
        <IllustrationPlaceholder name={name} />
      )}

      {/* Scrim — text aldrig naken på bild (DB-8 sanktionerad gradient) */}
      {mode === 'fullbleed' ? (
        <>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '22%', background: 'linear-gradient(180deg, rgba(12,14,20,0.55) 0%, transparent 100%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '62%', background: 'linear-gradient(180deg, transparent 0%, rgba(16,18,24,0.55) 45%, rgba(12,14,20,0.92) 100%)', pointerEvents: 'none' }} />
        </>
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: singleScrim(mode, fadeTo), pointerEvents: 'none' }} />
      )}

      {children && <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>{children}</div>}
    </div>
  )
}
