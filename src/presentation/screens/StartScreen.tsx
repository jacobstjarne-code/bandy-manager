import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'

declare const __GIT_HASH__: string

function NightSceneSVG() {
  return (
    <svg
      viewBox="0 0 320 200"
      width="320"
      height="200"
      aria-hidden="true"
      style={{ display: 'block', margin: '0 auto' }}
    >
      <defs>
        {/* Floodlight glow left */}
        <radialGradient id="glow-left" cx="25%" cy="20%" r="40%">
          <stop offset="0%" stopColor="#b8d4f0" stopOpacity="0.47" />
          <stop offset="100%" stopColor="#0D1B2A" stopOpacity="0" />
        </radialGradient>
        {/* Floodlight glow right */}
        <radialGradient id="glow-right" cx="75%" cy="15%" r="35%">
          <stop offset="0%" stopColor="#c8dff5" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#0D1B2A" stopOpacity="0" />
        </radialGradient>
        {/* Ice surface gradient */}
        <radialGradient id="ice-surface" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#1e4a6e" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#0a1828" stopOpacity="0.6" />
        </radialGradient>
      </defs>

      {/* Sky background (transparent — parent provides gradient) */}

      {/* Stars / snow particles — 30 total */}
      {[
        [18, 12, 1.2], [42, 8, 0.8], [70, 20, 1.5], [95, 6, 0.6], [130, 15, 1.0],
        [160, 4, 0.8], [190, 18, 1.2], [220, 9, 0.7], [255, 14, 1.0], [290, 7, 0.8],
        [305, 22, 0.5], [10, 35, 1.2], [58, 40, 0.8], [115, 28, 1.5], [175, 32, 0.6],
        [240, 25, 1.0], [280, 38, 0.8], [300, 44, 0.5], [50, 55, 1.2], [200, 50, 0.8],
        [25, 60, 1.0], [80, 48, 0.7], [145, 52, 1.5], [215, 42, 0.6], [265, 58, 0.9],
        [312, 32, 1.1], [35, 22, 0.7], [100, 38, 1.3], [185, 8, 0.8], [245, 34, 1.0],
      ].map(([x, y, r], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={r}
          fill="white"
          opacity={0.12 + (i % 5) * 0.05}
        />
      ))}

      {/* Village silhouette — barely visible dark shapes */}
      {/* Buildings */}
      <rect x="0" y="110" width="30" height="40" fill="#061018" opacity="0.7" />
      <rect x="25" y="120" width="20" height="30" fill="#061018" opacity="0.7" />
      <rect x="40" y="105" width="25" height="45" fill="#061018" opacity="0.65" />
      <rect x="60" y="115" width="18" height="35" fill="#061018" opacity="0.65" />
      {/* Church steeple */}
      <rect x="240" y="100" width="22" height="50" fill="#061018" opacity="0.7" />
      <polygon points="240,100 251,78 262,100" fill="#061018" opacity="0.75" />
      <rect x="248" y="78" width="6" height="10" fill="#061018" opacity="0.8" />
      {/* More buildings right side */}
      <rect x="268" y="118" width="28" height="32" fill="#061018" opacity="0.65" />
      <rect x="292" y="112" width="28" height="38" fill="#061018" opacity="0.65" />
      {/* Trees silhouette */}
      <polygon points="85,148 92,118 99,148" fill="#061018" opacity="0.6" />
      <polygon points="100,150 109,122 118,150" fill="#061018" opacity="0.6" />
      <polygon points="200,148 208,120 216,148" fill="#061018" opacity="0.6" />
      <polygon points="215,150 224,124 233,150" fill="#061018" opacity="0.6" />

      {/* Floodlight glow overlays */}
      <rect x="0" y="0" width="320" height="200" fill="url(#glow-left)" />
      <rect x="0" y="0" width="320" height="200" fill="url(#glow-right)" />

      {/* Floodlight pole left */}
      <rect x="55" y="55" width="4" height="90" fill="#1a2e40" opacity="0.8" />
      <rect x="42" y="52" width="30" height="5" rx="2" fill="#1e3a50" opacity="0.8" />
      <ellipse cx="57" cy="54" rx="12" ry="4" fill="#b8d4f0" opacity="0.4" />

      {/* Floodlight pole right */}
      <rect x="261" y="48" width="4" height="97" fill="#1a2e40" opacity="0.8" />
      <rect x="248" y="45" width="30" height="5" rx="2" fill="#1e3a50" opacity="0.8" />
      <ellipse cx="263" cy="47" rx="12" ry="4" fill="#c0dcf5" opacity="0.35" />

      {/* Ice surface */}
      <ellipse cx="160" cy="185" rx="160" ry="22" fill="url(#ice-surface)" />
      <ellipse cx="160" cy="184" rx="130" ry="10" fill="#1a3a5c" opacity="0.25" />
      {/* Ground-level fog */}
      <ellipse cx="160" cy="186" rx="155" ry="8" fill="white" opacity="0.025"/>

      {/* Bandy stick silhouette — gold */}
      {/* Shaft */}
      <rect
        x="148" y="100"
        width="7" height="62"
        rx="3"
        fill="#C9A84C"
        opacity="0.9"
        transform="rotate(-18, 152, 131)"
      />
      {/* Blade */}
      <polygon
        points="126,158 148,152 154,165 132,171"
        fill="#8B6914"
        opacity="0.95"
      />
      {/* Ball / puck */}
      <circle cx="118" cy="168" r="7" fill="#C9A84C" opacity="0.85" />
      <circle cx="116" cy="166" r="2" fill="#0D1B2A" opacity="0.4" />
      <circle cx="121" cy="167" r="2" fill="#0D1B2A" opacity="0.4" />

      {/* Speed lines */}
      <line x1="100" y1="150" x2="125" y2="148" stroke="#C9A84C" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />
      <line x1="96" y1="158" x2="120" y2="157" stroke="#C9A84C" strokeWidth="1" opacity="0.15" strokeLinecap="round" />

      {/* Left audience */}
      <rect x="0" y="140" width="60" height="20" fill="#040e18" opacity="0.6"/>
      {([8, 16, 24, 32, 40, 50] as number[]).map((x, i) => (
        <circle key={`al${i}`} cx={x} cy={140} r={4} fill="#040e18" opacity="0.8"/>
      ))}
      {/* Right audience */}
      <rect x="260" y="140" width="60" height="20" fill="#040e18" opacity="0.6"/>
      {([268, 277, 286, 295, 305, 314] as number[]).map((x, i) => (
        <circle key={`ar${i}`} cx={x} cy={140} r={4} fill="#040e18" opacity="0.8"/>
      ))}

      {/* Player silhouette - skating pose, centered */}
      {/* body leaning forward */}
      <ellipse cx="160" cy="165" rx="7" ry="9" fill="#0a1520" opacity="0.95"/>
      {/* head with helmet */}
      <circle cx="160" cy="153" r="6" fill="#0a1520" opacity="0.95"/>
      {/* helmet brim */}
      <rect x="154" y="150" width="12" height="4" rx="2" fill="#0a1520" opacity="0.95"/>
      {/* stick arm extended */}
      <line x1="157" y1="163" x2="143" y2="175" stroke="#0a1520" strokeWidth="3" strokeLinecap="round" opacity="0.95"/>
      <line x1="143" y1="175" x2="137" y2="185" stroke="#0a1520" strokeWidth="2" strokeLinecap="round" opacity="0.9"/>
      {/* blade */}
      <line x1="130" y1="184" x2="145" y2="185" stroke="#0a1520" strokeWidth="3" strokeLinecap="round" opacity="0.9"/>
      {/* back arm */}
      <line x1="163" y1="163" x2="170" y2="170" stroke="#0a1520" strokeWidth="3" strokeLinecap="round" opacity="0.9"/>
      {/* legs - skating stride */}
      <line x1="156" y1="174" x2="150" y2="186" stroke="#0a1520" strokeWidth="4" strokeLinecap="round" opacity="0.95"/>
      <line x1="164" y1="174" x2="172" y2="182" stroke="#0a1520" strokeWidth="4" strokeLinecap="round" opacity="0.95"/>
      {/* skates */}
      <line x1="144" y1="187" x2="157" y2="187" stroke="#0a1520" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
      <line x1="167" y1="183" x2="178" y2="183" stroke="#0a1520" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
      {/* gold edge highlight on player */}
      <ellipse cx="160" cy="165" rx="7" ry="9" fill="none" stroke="#C9A84C" strokeWidth="0.5" opacity="0.25"/>
    </svg>
  )
}

export function StartScreen() {
  const navigate = useNavigate()
  const { loadGame, listSaves } = useGameStore()
  const saves = listSaves()
  const hasSave = saves.length > 0

  // No save → skip StartScreen entirely and go straight to intro
  useEffect(() => {
    if (!hasSave) navigate('/intro', { replace: true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleLoadGame() {
    const save = saves[0]
    if (!save) return
    const ok = await loadGame(save.id)
    if (ok) navigate('/game')
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        paddingTop: 'env(safe-area-inset-top, 20px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 20px)',
        background: 'linear-gradient(180deg, #061018 0%, #0D1B2A 40%, #0a1520 100%)',
      }}
    >
      {/* Top spacer */}
      <div style={{ flex: 1 }} />

      {/* Hero section */}
      <div style={{ textAlign: 'center', marginBottom: 44, width: '100%' }}>
        <NightSceneSVG />

        <div style={{ marginTop: 28 }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: 900,
            letterSpacing: '5px',
            color: '#F0F4F8',
            textTransform: 'uppercase',
            lineHeight: 1.1,
            margin: 0,
          }}>
            BANDY MANAGER
          </h1>
          <h1 style={{
            fontSize: 32,
            fontWeight: 900,
            letterSpacing: '5px',
            color: '#C9A84C',
            textTransform: 'uppercase',
            lineHeight: 1.2,
            margin: 0,
          }}>
            SIMULATOR
          </h1>
        </div>

        {/* Gold divider */}
        <div style={{
          width: 60,
          height: 1,
          background: '#C9A84C',
          margin: '14px auto 12px',
          opacity: 0.7,
        }} />

        <p style={{
          color: '#8A9BB0',
          fontSize: 10,
          letterSpacing: '3px',
          textTransform: 'uppercase',
          margin: 0,
        }}>
          UPPLEV ATMOSFÄREN AV SVENSK ELITBANDY
        </p>
      </div>

      {/* Buttons */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          onClick={() => navigate('/intro')}
          style={{
            width: '100%',
            padding: '16px 24px',
            background: '#C9A84C',
            color: '#0D1B2A',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            border: 'none',
            boxShadow: '0 4px 20px rgba(201,168,76,0.3)',
          }}
        >
          NYTT SPEL
        </button>

        <button
          onClick={() => { if (hasSave) navigate('/game') }}
          disabled={!hasSave}
          style={{
            width: '100%',
            padding: '16px 24px',
            background: hasSave ? '#2563EB' : 'transparent',
            color: hasSave ? '#fff' : '#4A6080',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            border: hasSave ? 'none' : '1px solid #1e3450',
            opacity: hasSave ? 1 : 0.5,
            cursor: hasSave ? 'pointer' : 'not-allowed',
          }}
        >
          FORTSÄTT
        </button>

        <button
          onClick={handleLoadGame}
          disabled={!hasSave}
          style={{
            width: '100%',
            padding: '16px 24px',
            background: 'transparent',
            color: hasSave ? '#8A9BB0' : '#4A6080',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 400,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            border: `1px solid ${hasSave ? '#1e3450' : 'transparent'}`,
            opacity: hasSave ? 1 : 0.35,
            cursor: hasSave ? 'pointer' : 'not-allowed',
          }}
        >
          LADDA SPEL
        </button>
      </div>

      {/* Version */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
        <p style={{
          color: '#4A6080',
          fontSize: 11,
          letterSpacing: '1px',
          opacity: 0.6,
        }}>
          v0.1.0 · {__GIT_HASH__}
        </p>
      </div>
    </div>
  )
}
