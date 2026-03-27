import { CSSProperties, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SHIELD_PATH = 'M32 2 L58 12 V32 C58 46 46 54 32 60 C18 54 6 46 6 32 V12 Z'

/** ms each slide is visible before cross-fading to the next. S4 has no auto-advance. */
const TIMINGS = [2800, 2600, 2800, 3500]

function SnowParticles() {
  const particles = [
    { left: 8,  delay: 0,   dur: 8   },
    { left: 22, delay: 1.5, dur: 10  },
    { left: 38, delay: 0.7, dur: 9   },
    { left: 53, delay: 2.3, dur: 7.5 },
    { left: 67, delay: 0.3, dur: 11  },
    { left: 80, delay: 1.8, dur: 8.5 },
    { left: 92, delay: 3.2, dur: 10  },
  ]
  return (
    <>
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: -8,
            left: `${p.left}%`,
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: 'rgba(245,241,235,0.35)',
            animation: `snow ${p.dur}s ${p.delay}s linear infinite`,
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  )
}

function VillageSVG() {
  return (
    <svg viewBox="0 0 390 200" width="100%" aria-hidden style={{ display: 'block' }}>
      {/* Spotlight cones */}
      <polygon points="80,0 5,200 160,200"   fill="rgba(212,184,100,0.06)" />
      <polygon points="310,0 230,200 390,200" fill="rgba(212,184,100,0.06)" />
      <polygon points="80,0 55,200 105,200"   fill="rgba(212,184,100,0.04)" />
      <polygon points="310,0 285,200 335,200" fill="rgba(212,184,100,0.04)" />

      {/* Buildings — left cluster */}
      <rect x="0"   y="148" width="42"  height="52" fill="#1A1610" />
      <rect x="38"  y="136" width="38"  height="64" fill="#1A1610" />
      <polygon points="38,136 57,118 76,136" fill="#1A1610" />

      {/* Mid-left house */}
      <rect x="100" y="130" width="58" height="70" fill="#1A1610" />
      <polygon points="100,130 129,110 158,130" fill="#1A1610" />

      {/* Church — center */}
      <rect x="165" y="108" width="62" height="92" fill="#1A1610" />
      <polygon points="165,108 196,86 227,108" fill="#1A1610" />
      <rect x="188" y="56"  width="16" height="34" fill="#1A1610" />
      <polygon points="188,56 196,40 204,56"  fill="#1A1610" />

      {/* Mid-right house */}
      <rect x="232" y="124" width="62" height="76" fill="#1A1610" />
      <polygon points="232,124 263,104 294,124" fill="#1A1610" />

      {/* Right cluster */}
      <rect x="298" y="140" width="42" height="60" fill="#1A1610" />
      <rect x="335" y="148" width="55" height="52" fill="#1A1610" />
      <polygon points="298,140 319,122 340,140" fill="#1A1610" />

      {/* Warm windows */}
      <rect x="48"  y="152" width="11" height="9"  rx="1" fill="#E8A050" opacity="0.65" />
      <rect x="110" y="148" width="11" height="9"  rx="1" fill="#E8A050" opacity="0.60" />
      <rect x="130" y="148" width="11" height="9"  rx="1" fill="#E8A050" opacity="0.50" />
      <rect x="175" y="128" width="13" height="11" rx="1" fill="#E8A050" opacity="0.58" />
      <rect x="207" y="128" width="13" height="11" rx="1" fill="#E8A050" opacity="0.58" />
      <rect x="242" y="140" width="11" height="9"  rx="1" fill="#E8A050" opacity="0.60" />
      <rect x="268" y="140" width="11" height="9"  rx="1" fill="#E8A050" opacity="0.50" />
      <rect x="306" y="155" width="10" height="8"  rx="1" fill="#E8A050" opacity="0.55" />
      <rect x="347" y="160" width="10" height="8"  rx="1" fill="#E8A050" opacity="0.55" />

      {/* Ground */}
      <rect x="0" y="196" width="390" height="4" fill="#1A1610" />
    </svg>
  )
}

export function IntroSequence() {
  const navigate = useNavigate()
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    let elapsed = 0
    const timers: ReturnType<typeof setTimeout>[] = []
    TIMINGS.forEach((ms, i) => {
      elapsed += ms
      timers.push(setTimeout(() => setCurrentSlide(i + 1), elapsed))
    })
    return () => timers.forEach(clearTimeout)
  }, [])

  const slide = (n: number): CSSProperties => ({
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 36px',
    opacity: currentSlide === n ? 1 : 0,
    transition: 'opacity 500ms ease',
    pointerEvents: currentSlide === n ? 'auto' : 'none',
  })

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#0E0D0B', overflow: 'hidden' }}>
      <SnowParticles />

      {/* Persistent floodlight glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: [
          'radial-gradient(ellipse 65% 45% at 18% 0%, rgba(196,122,58,0.13) 0%, transparent 60%)',
          'radial-gradient(ellipse 55% 40% at 82% 0%, rgba(196,122,58,0.10) 0%, transparent 60%)',
        ].join(', '),
      }} />

      {/* S0 — Logo + "presenterar" */}
      <div style={slide(0)}>
        <img
          src="/buryfen-logo-transparent.png"
          alt="Bury Fen"
          style={{
            width: 120,
            filter: 'invert(1) brightness(.85) sepia(.15)',
            marginBottom: 20,
          }}
        />
        <p style={{
          fontSize: 12,
          letterSpacing: '4px',
          color: 'rgba(245,241,235,0.50)',
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          margin: 0,
        }}>
          presenterar
        </p>
      </div>

      {/* S1 — Village silhouette + tagline */}
      <div style={{ ...slide(1), justifyContent: 'flex-end', paddingBottom: 80 }}>
        <div style={{ width: '100%', marginBottom: 32 }}>
          <VillageSVG />
        </div>
        <p style={{
          fontSize: 18,
          color: '#F5F1EB',
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          textAlign: 'center',
          lineHeight: 1.6,
          margin: 0,
        }}>
          En liten by. Ett lag. En hel värld.
        </p>
      </div>

      {/* S2 — Title card */}
      <div style={slide(2)}>
        <p style={{
          fontSize: 11,
          letterSpacing: '5px',
          textTransform: 'uppercase',
          color: 'rgba(196,122,58,0.75)',
          marginBottom: 22,
          fontFamily: 'system-ui, sans-serif',
          fontWeight: 700,
          margin: '0 0 22px',
        }}>
          Säsongen 2026/2027
        </p>
        <h1 style={{
          fontSize: 34,
          fontWeight: 400,
          letterSpacing: '7px',
          color: '#F5F1EB',
          textTransform: 'uppercase',
          fontFamily: 'Georgia, serif',
          margin: '0',
          lineHeight: 1.1,
          textAlign: 'center',
        }}>
          BANDY MANAGER
        </h1>
        <h2 style={{
          fontSize: 22,
          fontWeight: 400,
          letterSpacing: '9px',
          color: 'rgba(196,122,58,0.85)',
          textTransform: 'uppercase',
          fontFamily: 'Georgia, serif',
          margin: '8px 0 0',
        }}>
          SIMULATOR
        </h2>
      </div>

      {/* S3 — Flavor text */}
      <div style={{ ...slide(3), gap: 24 }}>
        <p style={{
          fontSize: 15,
          color: 'rgba(245,241,235,0.82)',
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          lineHeight: 1.75,
          textAlign: 'center',
          margin: 0,
        }}>
          "Strålkastarna tänds. Isen ligger klar.<br />Det doftar korv från kiosken."
        </p>
        <p style={{
          fontSize: 12,
          color: 'rgba(196,186,168,0.55)',
          fontFamily: 'system-ui, sans-serif',
          lineHeight: 1.85,
          textAlign: 'center',
          letterSpacing: '0.3px',
          margin: 0,
        }}>
          12 lag. 22 omgångar. Slutspel. Final. Cup.<br />
          Sponsorer. Kommunpampar. Ungdomsakademi.
        </p>
        <p style={{
          fontSize: 15,
          color: '#F5F1EB',
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          textAlign: 'center',
          margin: 0,
        }}>
          En ny tränare kliver in.
        </p>
      </div>

      {/* S4 — Choose club CTA */}
      <div style={{
        ...slide(4),
        justifyContent: 'space-between',
        paddingTop: 100,
        paddingBottom: 60,
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}>
          <svg width="76" height="76" viewBox="0 0 64 64" aria-hidden>
            <path d={SHIELD_PATH} fill="rgba(196,122,58,0.10)" stroke="rgba(196,122,58,0.35)" strokeWidth="1.5" />
            <text
              x="32" y="34"
              textAnchor="middle"
              dominantBaseline="central"
              fill="rgba(196,122,58,0.65)"
              fontSize="28"
              fontFamily="Georgia, serif"
              fontStyle="italic"
            >
              ?
            </text>
          </svg>
          <p style={{
            fontSize: 11,
            letterSpacing: '4px',
            textTransform: 'uppercase',
            color: 'rgba(245,241,235,0.50)',
            fontFamily: 'system-ui, sans-serif',
            fontWeight: 600,
            margin: 0,
          }}>
            Välj din klubb
          </p>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
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
              animation: 'pulseCTA 2.5s ease-in-out infinite',
            }}
          >
            STARTA KARRIÄREN
          </button>
          <img
            src="/buryfen-logo-transparent.png"
            alt="Bury Fen"
            style={{
              width: 56,
              filter: 'invert(1) brightness(.85) sepia(.15)',
              opacity: 0.35,
            }}
          />
        </div>
      </div>
    </div>
  )
}
