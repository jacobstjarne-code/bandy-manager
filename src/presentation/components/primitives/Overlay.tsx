import { createPortal } from 'react-dom'
import { useEffect, useRef, type ReactNode } from 'react'
import { Z } from '../../utils/zIndices'

interface OverlayProps {
  onClose: () => void
  children: ReactNode
  /** 'sheet' = docked bottom sheet (facility/finance decisions). 'modal' = centered card (ceremonies, system messages). */
  variant?: 'sheet' | 'modal'
  /** Required — role="dialog" needs an accessible name, and there's no visible <h2> guaranteed in every caller. */
  ariaLabel: string
  maxWidth?: number
  zIndex?: number
  /** Inset on the backdrop flex container — keeps a centered modal off screen edges on small viewports. */
  backdropPadding?: string
}

const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

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
 * fungerar oavsett React-version. Overlayn själv ligger UTANFÖR #root
 * (portalerad till body), så den påverkas aldrig av sin egen inert-flagga.
 */
export function Overlay({ onClose, children, variant = 'modal', ariaLabel, maxWidth = 440, zIndex = Z.overlay, backdropPadding }: OverlayProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null
    const root = document.getElementById('root')
    root?.setAttribute('inert', '')

    const focusables = contentRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ;(focusables?.[0] ?? contentRef.current)?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
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
      root?.removeAttribute('inert')
      previouslyFocused.current?.focus?.()
    }
  }, [onClose])

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      style={{
        position: 'fixed', inset: 0, zIndex,
        background: variant === 'sheet' ? 'color-mix(in srgb, var(--bg-dark) 70%, transparent)' : 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: variant === 'sheet' ? 'flex-end' : 'center',
        justifyContent: 'center',
        ...(backdropPadding ? { padding: backdropPadding } : {}),
      }}
      onClick={onClose}
    >
      <div
        ref={contentRef}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth,
          ...(variant === 'sheet'
            ? { background: 'var(--bg-surface)', borderRadius: 'var(--radius) var(--radius) 0 0', borderTop: '1px solid var(--border)' }
            : {}),
        }}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
