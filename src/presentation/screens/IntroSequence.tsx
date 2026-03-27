import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// 23 particles — faster cycles (2–4 s), many negative delays so snow is mid-flight from frame 1
function SnowParticles() {
  const particles = [
    { left: 3,  delay: -1.4, dur: 2.8, size: 3 },
    { left: 8,  delay:  0,   dur: 3.2, size: 4 },
    { left: 11, delay: -0.3, dur: 3.7, size: 3 },
    { left: 16, delay: -1.8, dur: 2.5, size: 4 },
    { left: 21, delay:  0.3, dur: 3.6, size: 3 },
    { left: 26, delay: -0.9, dur: 2.2, size: 5 },
    { left: 31, delay:  0,   dur: 3.0, size: 3 },
    { left: 36, delay: -2.1, dur: 2.7, size: 4 },
    { left: 41, delay:  0.5, dur: 3.5, size: 3 },
    { left: 44, delay: -1.0, dur: 2.4, size: 5 },
    { left: 49, delay:  0,   dur: 3.1, size: 3 },
    { left: 54, delay: -1.6, dur: 2.9, size: 4 },
    { left: 59, delay:  0.2, dur: 3.4, size: 3 },
    { left: 64, delay: -0.7, dur: 2.6, size: 5 },
    { left: 69, delay:  0,   dur: 3.8, size: 3 },
    { left: 73, delay: -2.0, dur: 2.3, size: 4 },
    { left: 77, delay:  0.4, dur: 3.0, size: 3 },
    { left: 81, delay: -1.2, dur: 2.8, size: 5 },
    { left: 85, delay:  0,   dur: 3.5, size: 3 },
    { left: 88, delay: -0.5, dur: 2.6, size: 4 },
    { left: 92, delay:  0.1, dur: 3.2, size: 3 },
    { left: 95, delay: -1.8, dur: 2.4, size: 5 },
    { left: 98, delay:  0.6, dur: 3.0, size: 3 },
  ]
  return (
    <>
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: -6,
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: 'rgba(245,241,235,0.55)',
            animation: `snow ${p.dur}s ${p.delay}s linear infinite`,
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  )
}

export function IntroSequence() {
  const navigate = useNavigate()
  const [slide, setSlide] = useState(0)   // 0 = S0, 1 = S1
  const [s0Phase, setS0Phase] = useState(-1) // drives S0 content stagger

  // S0 internal stagger: logo → presenterar → atmosphere text
  useEffect(() => {
    const t0 = setTimeout(() => setS0Phase(0),  60)   // logo fades in
    const t1 = setTimeout(() => setS0Phase(1),  500)  // "presenterar"
    const t2 = setTimeout(() => setS0Phase(2), 1400)  // atmosphere text
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2) }
  }, [])

  // Advance to S1 after 3500 ms
  useEffect(() => {
    const t = setTimeout(() => setSlide(1), 3500)
    return () => clearTimeout(t)
  }, [])

  const s1 = slide === 1

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#0E0D0B', overflow: 'hidden' }}>
      <SnowParticles />

      {/* Floodlight glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: [
          'radial-gradient(ellipse 65% 45% at 18% 0%, rgba(196,122,58,0.14) 0%, transparent 60%)',
          'radial-gradient(ellipse 55% 40% at 82% 0%, rgba(196,122,58,0.11) 0%, transparent 60%)',
        ].join(', '),
      }} />

      {/* ── S0 ── Logo + "presenterar" + atmosphere text */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 40px', gap: 14,
        opacity: slide === 0 ? 1 : 0,
        transition: 'opacity 500ms ease',
        pointerEvents: slide === 0 ? 'auto' : 'none',
      }}>
        <img
          src="/buryfen-logo-transparent.png"
          alt="Bury Fen"
          style={{
            width: 110,
            filter: 'invert(1) brightness(.85) sepia(.15)',
            opacity: s0Phase >= 0 ? 1 : 0,
            transform: s0Phase >= 0 ? 'none' : 'translateY(8px)',
            transition: 'opacity 700ms ease, transform 700ms ease',
          }}
        />
        <p style={{
          fontSize: 12,
          letterSpacing: '4px',
          color: 'rgba(245,241,235,0.48)',
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          margin: 0,
          opacity: s0Phase >= 1 ? 1 : 0,
          transition: 'opacity 600ms ease',
        }}>
          presenterar
        </p>
        <p style={{
          fontSize: 14,
          color: 'rgba(245,241,235,0.72)',
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          textAlign: 'center',
          lineHeight: 1.75,
          margin: '10px 0 0',
          maxWidth: 280,
          opacity: s0Phase >= 2 ? 1 : 0,
          transition: 'opacity 800ms ease',
        }}>
          Strålkastarna tänds. Isen ligger klar.<br />Det doftar korv från kiosken.
        </p>
      </div>

      {/* ── S1 ── Title + tagline + CTA + credit */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 120, paddingBottom: 60, padding: '120px 40px 60px',
        opacity: s1 ? 1 : 0,
        transition: 'opacity 600ms ease',
        pointerEvents: s1 ? 'auto' : 'none',
      }}>
        {/* Title block */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <h1 style={{
            fontSize: 34,
            fontWeight: 400,
            letterSpacing: s1 ? '9px' : '2px',
            color: '#F5F1EB',
            textTransform: 'uppercase',
            fontFamily: 'Georgia, serif',
            margin: 0,
            textAlign: 'center',
            lineHeight: 1.1,
            opacity: s1 ? 1 : 0,
            transition: 'opacity 1000ms ease, letter-spacing 1400ms ease',
          }}>
            BANDY MANAGER
          </h1>
          <p style={{
            fontSize: 16,
            color: 'rgba(245,241,235,0.60)',
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            textAlign: 'center',
            margin: 0,
            opacity: s1 ? 1 : 0,
            transition: 'opacity 700ms ease',
            transitionDelay: s1 ? '900ms' : '0ms',
          }}>
            En liten by. Ett lag. En hel värld.
          </p>
        </div>

        {/* CTA + credit */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
          <button
            onClick={() => navigate('/new-game')}
            style={{
              width: '100%',
              maxWidth: 300,
              padding: '16px 24px',
              background: 'linear-gradient(135deg, #C47A3A 0%, #A25828 100%)',
              border: 'none',
              borderRadius: 10,
              color: '#F5F1EB',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              fontFamily: 'system-ui, sans-serif',
              cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(196,122,58,0.40)',
              animation: s1 ? 'pulseCTA 2.5s ease-in-out infinite' : 'none',
              opacity: s1 ? 1 : 0,
              transition: 'opacity 700ms ease',
              transitionDelay: s1 ? '1500ms' : '0ms',
            }}
          >
            STARTA KARRIÄREN
          </button>
          <img
            src="/buryfen-logo-transparent.png"
            alt="Bury Fen"
            style={{
              width: 52,
              filter: 'invert(1) brightness(.85) sepia(.15)',
              opacity: s1 ? 0.32 : 0,
              transition: 'opacity 700ms ease',
              transitionDelay: s1 ? '1900ms' : '0ms',
            }}
          />
        </div>
      </div>
    </div>
  )
}
