import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Overlay } from '../primitives/Overlay'

const NOOP = () => {}

/**
 * BottomDock — delad primitiv för SIFFROR-lådan (peek) och interaktionspaneler (block).
 *
 * Positioneras absolut inom .mf-root { position: relative } så att den
 * stannar i 430px-matchkolumnen, inte viewporten (ej fixed).
 *
 * peek  → z-index 400 (--z-overlay).  Pull-handtag. Ingen scrim.
 * block → z-index 500 (--z-interaction). Scrim på z 499. Stängs programmatiskt.
 *
 * CSS: src/presentation/styles/match-flow.css (.mf-dock, .mf-dock-scrim, m.fl.)
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
  const [rendered, setRendered] = useState(open)
  const [entered, setEntered] = useState(false)
  const lastChildren = useRef(children)
  const resolvedHeight = height ?? (variant === 'peek' ? 280 : undefined)

  useEffect(() => {
    if (open) lastChildren.current = children
  }, [children, open])

  useEffect(() => {
    if (open) {
      setRendered(true)
      const frame = window.requestAnimationFrame(() => setEntered(true))
      return () => window.cancelAnimationFrame(frame)
    }

    setEntered(false)
    const timeout = window.setTimeout(() => setRendered(false), 220)
    return () => window.clearTimeout(timeout)
  }, [open])

  if (!rendered) return null

  const openClass = entered ? ' open' : ''

  return (
    <>
      {variant === 'block' && <div className={`mf-dock-scrim${openClass}`} aria-hidden="true" />}
      <Overlay
        onClose={onClose ?? NOOP}
        variant="sheet"
        ariaLabel={variant === 'peek' ? 'Matchsiffror' : 'Matchbeslut'}
        maxWidth={430}
        zIndex={variant === 'peek' ? 'var(--z-overlay)' : 'var(--z-interaction)'}
        closeOnEscape={variant === 'peek' && !!onClose}
        closeOnBackdrop={variant === 'peek' && !!onClose}
        inertBackground={false}
        trapFocus={variant === 'block' && open}
        autoFocus={variant === 'block' && open}
        portal={false}
        backdropStyle={{ position: 'absolute', background: 'transparent' }}
        contentStyle={{ background: 'transparent', border: 'none' }}
      >
        <div
          className={`mf-dock mf-dock--${variant}${openClass}`}
          style={{
            ...(resolvedHeight !== undefined ? { height: resolvedHeight } : {}),
            position: 'relative',
          }}
        >
          {variant === 'peek' && onClose && (
            <button
              className="mf-dock-handle"
              onClick={onClose}
              aria-label="Stäng"
            />
          )}
          <div className="mf-dock-content">
            {open ? children : lastChildren.current}
          </div>
        </div>
      </Overlay>
    </>
  )
}
