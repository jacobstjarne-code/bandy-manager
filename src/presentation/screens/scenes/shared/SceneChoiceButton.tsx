/**
 * SceneChoiceButton — val-knapp i en scen.
 * Pil + label + valfri effect-text på rad 2.
 *
 * Pixel-värden från training-mockup .choice. Hover-effekt via
 * onMouseEnter/Leave eftersom vi använder inline styles.
 */

import { useState } from 'react'

interface Choice {
  id: string
  label: string
  effectDescription?: string
}

interface Props {
  choice: Choice
  onClick: (id: string) => void
}

export function SceneChoiceButton({ choice, onClick }: Props) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onClick(choice.id)}
      style={{
        background: hover ? 'rgba(184,136,76,0.10)' : 'rgba(34,29,24,0.7)',
        border: `1px solid ${hover ? 'var(--accent)' : 'var(--bg-leather)'}`,
        color: hover ? 'var(--text-light)' : 'var(--text-light-secondary)',
        padding: '12px 14px',
        borderRadius: 6,
        textAlign: 'left',
        cursor: 'pointer',
        fontSize: 12,
        fontFamily: 'Georgia, serif',
        lineHeight: 1.4,
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        width: '100%',
        transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
      }}
    >
      <span>
        <span style={{ color: 'var(--accent)', marginRight: 8 }}>→</span>
        {choice.label}
      </span>
      {choice.effectDescription && (
        <span
          style={{
            display: 'block',
            fontSize: 9,
            color: 'var(--text-muted)',
            marginTop: 3,
            fontFamily: '-apple-system, system-ui, sans-serif',
            fontStyle: 'italic',
          }}
        >
          {choice.effectDescription}
        </span>
      )}
    </button>
  )
}
