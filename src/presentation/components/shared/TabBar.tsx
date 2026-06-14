import { useRef, useState, useEffect, useCallback } from 'react'
import '../../styles/tabs.css'
import { dotColor } from './Dot'

export interface TabDef {
  id: string
  label: string
  dot?: 'accent' | 'danger' | null
}

interface TabBarProps {
  tabs: TabDef[]
  activeId: string
  onSelect: (id: string) => void
}

export function TabBar({ tabs, activeId, onSelect }: TabBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  // Fade-affordans visas BARA i den riktning där det finns mer innehåll att scrolla
  // (statisk fade ljög: visade gradient även när inget mer fanns). DEL F: "klipps utan affordans".
  const [fade, setFade] = useState({ left: false, right: false })

  const updateFade = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setFade({
      left: scrollLeft > 1,
      right: scrollLeft + clientWidth < scrollWidth - 1,
    })
  }, [])

  useEffect(() => {
    updateFade()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', updateFade, { passive: true })
    window.addEventListener('resize', updateFade)
    return () => {
      el.removeEventListener('scroll', updateFade)
      window.removeEventListener('resize', updateFade)
    }
  }, [updateFade, tabs.length])

  return (
    <div className="tab-bar" role="tablist">
      <div className="tab-bar-scroll" ref={scrollRef}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeId === tab.id}
            onClick={() => onSelect(tab.id)}
            className={`btn ${activeId === tab.id ? 'btn-copper' : 'btn-ghost'} tab-bar-btn`}
          >
            {tab.label}
            {tab.dot && (
              <span className="tab-bar-dot" style={{ background: dotColor(tab.dot) }} />
            )}
          </button>
        ))}
      </div>
      {fade.left && <div className="tab-bar-fade tab-bar-fade-left" />}
      {fade.right && <div className="tab-bar-fade tab-bar-fade-right" />}
    </div>
  )
}
