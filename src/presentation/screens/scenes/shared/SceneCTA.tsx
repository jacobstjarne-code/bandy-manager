/**
 * SceneCTA — primär CTA-knapp i botten av en scen.
 * Default = mörk neutral CTA (kafferummet-mockup).
 * variant='gold' = guld-gradient (SM-finalsegern).
 */

import { useState } from 'react'

interface Props {
  label: string
  onClick: () => void
  variant?: 'default' | 'gold'
}

export function SceneCTA({ label, onClick, variant = 'default' }: Props) {
  const [hover, setHover] = useState(false)

  if (variant === 'gold') {
    return (
      <button
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={onClick}
        style={{
          background:
            'linear-gradient(135deg, var(--match-gold) 0%, var(--accent) 100%)',
          color: 'var(--bg-dark)',
          border: 'none',
          padding: '14px 28px',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          boxShadow: hover
            ? '0 6px 30px rgba(212,164,96,0.45)'
            : '0 4px 24px rgba(212,164,96,0.30)',
          cursor: 'pointer',
          fontFamily: 'Georgia, serif',
          transition: 'box-shadow 0.2s ease, transform 0.15s ease',
          transform: hover ? 'translateY(-1px)' : 'none',
        }}
      >
        {label}
      </button>
    )
  }

  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        width: '100%',
        padding: 14,
        background: hover ? 'var(--accent-deep)' : 'var(--bg-elevated)',
        color: 'var(--text-light)',
        border: `1px solid ${hover ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'Georgia, serif',
        transition: 'background 0.15s ease, border-color 0.15s ease',
      }}
    >
      {label}
    </button>
  )
}
