/**
 * SceneChoiceButton — val-knapp i en scen.
 * Pil + label + valfri effect-text på rad 2.
 *
 * Training-mockupens val med mobilanpassad text och träffyta.
 * Hover-effekt via onMouseEnter/Leave eftersom vi använder inline styles.
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
        background: hover ? 'rgba(184,136,76,0.16)' : 'rgba(44,37,30,0.88)',
        border: `1px solid ${hover ? 'var(--accent)' : 'rgba(184,136,76,0.42)'}`,
        color: 'var(--text-light)',
        padding: '14px 16px',
        borderRadius: 'var(--radius-md)',
        textAlign: 'left',
        cursor: 'pointer',
        fontSize: 15,
        fontFamily: 'Georgia, serif',
        lineHeight: 1.4,
        width: '100%',
        minHeight: 64,
        transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
      }}
    >
      <span style={{ display: 'block', fontWeight: 700 }}>
        <span style={{ color: 'var(--accent)', marginRight: 10 }}>→</span>
        {choice.label}
      </span>
      {choice.effectDescription && (
        <span
          className="h-micro"
          // ds-exempt: system-font override intentional (non-Georgia body)
          style={{
            display: 'block',
            color: 'var(--text-light-secondary)',
            marginTop: 4,
            marginLeft: 22,
            fontFamily: '-apple-system, system-ui, sans-serif',
            fontSize: 12,
            fontStyle: 'italic',
          }}
        >
          {choice.effectDescription}
        </span>
      )}
    </button>
  )
}
