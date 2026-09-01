import { createPortal } from 'react-dom'
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { Z } from '../../utils/zIndices'

interface OverlayProps {
  onClose: () => void
  children: ReactNode
  /** 'sheet' = docked bottom sheet (facility/finance decisions). 'modal' = centered card (ceremonies, system messages). */
  variant?: 'sheet' | 'modal'
  /** Required — role="dialog" needs an accessible name, and there's no visible <h2> guaranteed in every caller. */
  ariaLabel: string
  maxWidth?: number
  zIndex?: CSSProperties['zIndex']
  /** Inset on the backdrop flex container — keeps a centered modal off screen edges on small viewports. */
  backdropPadding?: string
  /** Escape/backdrop may be disabled for blocking flows that can only close through their own actions. */
  closeOnEscape?: boolean
  closeOnBackdrop?: boolean
  /** Lokala dockar får inte inaktivera hela appens matchrot. */
  inertBackground?: boolean
  trapFocus?: boolean
  autoFocus?: boolean
  /** Lokala matchdockar måste stanna i sin stacking-context och ärver då förälderns pointer-events. */
  portal?: boolean
  backdropClassName?: string
  contentClassName?: string
  backdropStyle?: CSSProperties
  contentStyle?: CSSProperties
}

const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
let inertOverlayCount = 0

/**
 * M4 (audit 5c9a7a8, 2026-08-24): "Facility-sheeten är generic utan dialog/
 * aria-modal/fokusfälla." Delad primitiv för alla helskärms-overlays/
 * bottensheets i appen — innan denna fanns samma "position:fixed + inset:0 +
 * onClick-backdrop"-struktur duplicerad i minst sex komponenter
 * (FacilityScreen.tsx x2, CallupModal.tsx, SaveConflictModal.tsx,
 * EfterklangThreadModal.tsx, BidModal.tsx), ingen med fokusfälla, Escape
 * eller inert bakgrund.
 *
 * Portal till document.body (samma mönster som EfterklangThreadModal.tsx
 * redan använde, av samma skäl: en overlay som renderas INNE i en
 * .screen-enter-stacking context ärver den lokala stacking-ordningen —
 * portalen undviker det).
 *
 * inert sätts på #root via ren DOM-API (setAttribute/removeAttribute), inte
 * en JSX-prop — React < 19 har ingen inbyggd inert-prop, och plain DOM-API
 * fungerar oavsett React-version. Overlayn portaleras normalt UTANFÖR #root
 * och påverkas då aldrig av sin egen inert-flagga. Lokala dockar kan välja
 * portal={false} och inertBackground={false} för att behålla sin stacking-context.
 */
export function Overlay({
  onClose,
  children,
  variant = 'modal',
  ariaLabel,
  maxWidth = 440,
  zIndex = Z.overlay,
  backdropPadding,
  closeOnEscape = true,
  closeOnBackdrop = true,
  inertBackground = true,
  trapFocus = true,
  autoFocus = true,
  portal = true,
  backdropClassName,
  contentClassName,
  backdropStyle,
  contentStyle,
}: OverlayProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null
    const root = document.getElementById('root')
    if (inertBackground) {
      inertOverlayCount++
      root?.setAttribute('inert', '')
    }

    const focusables = contentRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    if (autoFocus) (focusables?.[0] ?? contentRef.current)?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && closeOnEscape) {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !trapFocus) return
      const els = contentRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      if (!els || els.length === 0) return
      const first = els[0]
      const last = els[els.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      if (inertBackground) {
        inertOverlayCount = Math.max(0, inertOverlayCount - 1)
        if (inertOverlayCount === 0) root?.removeAttribute('inert')
      }
      if (autoFocus) previouslyFocused.current?.focus?.()
    }
  }, [autoFocus, closeOnEscape, inertBackground, onClose, trapFocus])

  const overlay = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      className={backdropClassName}
      style={{
        position: 'fixed', inset: 0, zIndex,
        background: variant === 'sheet' ? 'color-mix(in srgb, var(--bg-dark) 70%, transparent)' : 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: variant === 'sheet' ? 'flex-end' : 'center',
        justifyContent: 'center',
        ...(backdropPadding ? { padding: backdropPadding } : {}),
        ...backdropStyle,
      }}
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        ref={contentRef}
        tabIndex={-1}
        className={contentClassName}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth,
          ...(variant === 'sheet'
            ? { background: 'var(--bg-surface)', borderRadius: 'var(--radius) var(--radius) 0 0', borderTop: '1px solid var(--border)' }
            : {}),
          ...contentStyle,
        }}
      >
        {children}
      </div>
    </div>
  )

  return portal ? createPortal(overlay, document.body) : overlay
}
