import { useCallback, useEffect, useState, type CSSProperties, type RefObject } from 'react'
import { ChevronDown } from 'lucide-react'
import { Icon } from './primitives/Icon'

interface ScrollMoreCueProps {
  scrollRef: RefObject<HTMLElement | null> | null
  style?: CSSProperties
  fadeColor?: string
  accentColor?: string
}

/**
 * Gemensam overflow-signal för vyer där fast chrome gör sidans fortsättning
 * svår att läsa. Komponenten äger ingen scroll — konsumenten skickar den
 * verkliga scrollbehållaren så samma mätning fungerar även över layoutgränser.
 */
export function ScrollMoreCue({
  scrollRef,
  style,
  fadeColor = 'var(--bg)',
  accentColor = 'var(--accent)',
}: ScrollMoreCueProps) {
  const [hasMoreContent, setHasMoreContent] = useState(false)

  const update = useCallback(() => {
    const el = scrollRef?.current
    if (!el) {
      setHasMoreContent(false)
      return
    }
    setHasMoreContent(el.scrollTop + el.clientHeight < el.scrollHeight - 8)
  }, [scrollRef])

  useEffect(() => {
    const el = scrollRef?.current
    if (!el) return

    let frame = requestAnimationFrame(update)
    const scheduleUpdate = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }

    el.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(scheduleUpdate)
    resizeObserver?.observe(el)
    if (el.firstElementChild instanceof HTMLElement) resizeObserver?.observe(el.firstElementChild)

    const mutationObserver = typeof MutationObserver === 'undefined'
      ? null
      : new MutationObserver(scheduleUpdate)
    mutationObserver?.observe(el, { childList: true, subtree: true, characterData: true })

    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      resizeObserver?.disconnect()
      mutationObserver?.disconnect()
    }
  }, [scrollRef, update])

  if (!hasMoreContent) return null

  const scrollForward = () => {
    const el = scrollRef?.current
    if (!el) return
    el.scrollBy({
      top: Math.max(180, el.clientHeight * 0.65),
      behavior: 'smooth',
    })
  }

  return (
    <div
      data-scroll-more-cue
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(to bottom, transparent, ${fadeColor})`,
        pointerEvents: 'none',
        zIndex: 'var(--z-header)',
        ...style,
      }}
    >
      <button
        type="button"
        aria-label="Visa mer"
        onClick={scrollForward}
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: `2px solid ${fadeColor}`,
          background: accentColor,
          color: 'var(--text-light)',
          boxShadow: '0 3px 12px rgba(0,0,0,0.28)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          pointerEvents: 'auto',
        }}
      >
        <Icon icon={ChevronDown} size={24} color="currentColor" />
      </button>
    </div>
  )
}
