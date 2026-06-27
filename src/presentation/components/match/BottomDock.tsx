import type { ReactNode } from 'react'

/**
 * BottomDock — delad primitiv för SIFFROR-lådan (peek) och interaktionspaneler (block).
 *
 * Positioneras absolut inom .lf-root { position: relative } så att den
 * stannar i 430px-matchkolumnen, inte viewporten (ej fixed).
 *
 * peek  → z-index 400 (--z-overlay).  Pull-handtag. Ingen scrim.
 * block → z-index 500 (--z-interaction). Scrim på z 499. Stängs programmatiskt.
 *
 * CSS: src/presentation/styles/ledger.css (.lf-dock, .lf-dock-scrim, m.fl.)
 */

interface BottomDockProps {
  open: boolean
  variant: 'peek' | 'block'
  /** Obligatorisk för peek — anropas av pull-handtag. Block stängs programmatiskt. */
  onClose?: () => void
  /** Pixlar. Default 280 för peek, auto för block. */
  height?: number
  children?: ReactNode
}

export function BottomDock({ open, variant, onClose, height, children }: BottomDockProps) {
  const resolvedHeight = height ?? (variant === 'peek' ? 280 : undefined)

  return (
    <>
      {/* Fokus-dim för block-varianten — z 499, precis under docken */}
      {variant === 'block' && (
        <div
          className={`lf-dock-scrim${open ? ' open' : ''}`}
          aria-hidden="true"
        />
      )}

      {/* Dock-panel */}
      <div
        className={`lf-dock lf-dock--${variant}${open ? ' open' : ''}`}
        style={resolvedHeight !== undefined ? { height: resolvedHeight } : undefined}
        role={variant === 'block' ? 'dialog' : undefined}
        aria-modal={variant === 'block' ? true : undefined}
      >
        {variant === 'peek' && onClose && (
          <button
            className="lf-dock-handle"
            onClick={onClose}
            aria-label="Stäng"
          />
        )}
        <div className="lf-dock-content">
          {children}
        </div>
      </div>
    </>
  )
}
