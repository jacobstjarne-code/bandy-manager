import type { ReactNode } from 'react'
import { Overlay } from '../primitives/Overlay'

const NOOP = () => {}

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
  if (!open) return null

  return (
    <>
      {variant === 'block' && <div className="lf-dock-scrim open" aria-hidden="true" />}
      <Overlay
        onClose={onClose ?? NOOP}
        variant="sheet"
        ariaLabel={variant === 'peek' ? 'Matchsiffror' : 'Matchbeslut'}
        maxWidth={430}
        zIndex={variant === 'peek' ? 'var(--z-overlay)' : 'var(--z-interaction)'}
        closeOnEscape={variant === 'peek' && !!onClose}
        closeOnBackdrop={variant === 'peek' && !!onClose}
        inertBackground={false}
        trapFocus={variant === 'block'}
        autoFocus={variant === 'block'}
        portal={false}
        backdropStyle={{ position: 'absolute', background: 'transparent' }}
        contentStyle={{ background: 'transparent', border: 'none' }}
      >
        <div
          className={`lf-dock lf-dock--${variant} open`}
          style={{
            ...(resolvedHeight !== undefined ? { height: resolvedHeight } : {}),
            position: 'relative',
          }}
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
      </Overlay>
    </>
  )
}
