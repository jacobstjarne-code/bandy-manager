import React from 'react'

export function BandyBallSVG({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#D32F2F"/>
      <circle cx="12" cy="12" r="10" fill="none" stroke="#B71C1C" strokeWidth="0.5"/>
      <circle cx="9" cy="10" r="1.5" fill="#B71C1C" opacity="0.5"/>
      <circle cx="15" cy="10" r="1.5" fill="#B71C1C" opacity="0.5"/>
      <circle cx="12" cy="15" r="1.5" fill="#B71C1C" opacity="0.5"/>
      <ellipse cx="10" cy="9" rx="2" ry="1" fill="white" opacity="0.15" transform="rotate(-20 10 9)"/>
    </svg>
  )
}

export function BandyStickSVG({ size = 24, color = 'var(--accent)' }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      {/* Shaft */}
      <rect x="10" y="2" width="3" height="16" rx="1.5" fill={color} opacity="0.9"/>
      {/* Blade curve */}
      <path d="M10,16 Q6,18 4,20 Q8,22 12,20" fill={color} opacity="0.85"/>
    </svg>
  )
}

export function TrophySVG({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="trophy-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F5D060"/>
          <stop offset="100%" stopColor="#A07830"/>
        </linearGradient>
      </defs>
      {/* Cup body */}
      <path d="M10,4 L22,4 L20,18 Q20,22 16,22 Q12,22 12,18 Z" fill="url(#trophy-gold)"/>
      {/* Left handle */}
      <path d="M10,6 Q5,8 5,13 Q5,18 10,18" fill="none" stroke="url(#trophy-gold)" strokeWidth="2"/>
      {/* Right handle */}
      <path d="M22,6 Q27,8 27,13 Q27,18 22,18" fill="none" stroke="url(#trophy-gold)" strokeWidth="2"/>
      {/* Stem */}
      <rect x="14" y="22" width="4" height="5" fill="url(#trophy-gold)"/>
      {/* Base */}
      <rect x="10" y="27" width="12" height="2" rx="1" fill="url(#trophy-gold)"/>
      {/* Shine */}
      <path d="M13,6 Q15,5 17,7" stroke="white" strokeWidth="1" fill="none" opacity="0.4"/>
    </svg>
  )
}

export function SnowParticles({ count = 20, style }: { count?: number; style?: React.CSSProperties }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    size: 1 + Math.sin(i * 2.3) * 0.8,
    left: (i * 7.3) % 100,
    delay: (i * 0.4) % 8,
    duration: 4 + (i % 5),
    opacity: 0.3 + (i % 4) * 0.1,
  }))
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', ...style }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            top: '-10px',
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: 'white',
            opacity: p.opacity,
            animation: `snowfall ${p.duration}s ${p.delay}s infinite linear`,
          }}
        />
      ))}
    </div>
  )
}

export function FloodlightGlow({ side = 'top' }: { side?: 'left' | 'right' | 'top' }) {
  const styles: Record<string, React.CSSProperties> = {
    left: {
      position: 'absolute', top: '-20px', left: '-20px', width: 200, height: 200,
      background: 'radial-gradient(circle, rgba(180,210,255,0.06) 0%, transparent 70%)',
      pointerEvents: 'none', zIndex: 0,
    },
    right: {
      position: 'absolute', top: '-20px', right: '-20px', width: 200, height: 200,
      background: 'radial-gradient(circle, rgba(180,210,255,0.05) 0%, transparent 70%)',
      pointerEvents: 'none', zIndex: 0,
    },
    top: {
      position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 300, height: 150,
      background: 'radial-gradient(ellipse, rgba(180,210,255,0.07) 0%, transparent 70%)',
      pointerEvents: 'none', zIndex: 0,
    },
  }
  return <div style={styles[side]} />
}
