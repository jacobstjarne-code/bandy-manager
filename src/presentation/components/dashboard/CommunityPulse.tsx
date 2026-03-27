import type { SaveGame } from '../../../domain/entities/SaveGame'
import { getFunctionaryQuote } from '../../../domain/services/functionaryQuoteService'

interface Props {
  game: SaveGame
  currentRound: number
}

function EkgIcon() {
  return (
    <svg
      viewBox="0 0 24 14"
      width="28"
      height="16"
      style={{ animation: 'heartbeat 2s ease-in-out infinite' }}
    >
      <polyline
        points="0,7 5,7 7,2 9,12 11,5 13,9 15,7 24,7"
        fill="none"
        stroke="#A25828"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function trendTag(cs: number, prevCs: number | undefined) {
  if (prevCs === undefined) return null
  if (cs > prevCs) return <span className="tag tag-green">↑ stigande</span>
  if (cs < prevCs) return <span className="tag tag-red">↓ sjunkande</span>
  return <span className="tag tag-outline">→ stabil</span>
}

export function CommunityPulse({ game, currentRound }: Props) {
  const cs = game.communityStanding ?? 50
  const quote = getFunctionaryQuote(game, currentRound, game.lastCompletedFixtureId)
  const ca = game.communityActivities

  const activeActivities = [
    ca?.kiosk && ca.kiosk !== 'none' ? '🏪 Kiosk' : null,
    ca?.lottery && ca.lottery !== 'none' ? '🎟️ Lotteri' : null,
    ca?.functionaries ? '🤝 Funktionärer' : null,
    ca?.bandyplay ? '🏒 Bandyskola' : null,
  ].filter((x): x is string => x !== null)

  const rolf = game.namedCharacters?.find(c => c.id === 'rolf')
  const birgitta = game.namedCharacters?.find(c => c.id === 'birgitta')
  const characterAlive = rolf?.isAlive !== false
  const character = characterAlive ? rolf : birgitta
  const avatarEmoji = characterAlive ? '🧊' : '🌸'

  // Derive trend from roundSummary if available
  const prevCs = undefined // Could derive from roundSummary if passed in

  return (
    <div className="card-round card-stagger-5" style={{ margin: '0 12px 10px', background: 'rgba(250,247,240,1)' }}>
      <div style={{ padding: 14 }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <p className="bm-label" style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '2.5px',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
              margin: 0,
            }}>
              Bygdens puls
            </p>
            {trendTag(cs, prevCs)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <EkgIcon />
            <span style={{ fontSize: 20, fontWeight: 400, color: '#A25828', fontFamily: 'var(--font-display)' }}>
              {cs}
            </span>
          </div>
        </div>

        {/* Segmented bar */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
          <div style={{
            flex: cs,
            height: 7,
            background: cs > 70 ? 'linear-gradient(90deg, #D4945A, #A25828)' : cs > 40 ? 'linear-gradient(90deg, #C4945A, #A07838)' : 'linear-gradient(90deg, #B05040, #8B3E30)',
            borderRadius: '4px 0 0 4px',
          }} />
          <div style={{
            flex: 100 - cs,
            height: 7,
            background: 'var(--border-dark)',
            borderRadius: '0 4px 4px 0',
          }} />
        </div>

        {/* Activity tags */}
        {activeActivities.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
            {activeActivities.map(a => (
              <span key={a} className="tag tag-outline">{a}</span>
            ))}
          </div>
        )}

        {/* Character quote */}
        {quote && character && (
          <div style={{
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
            borderRadius: 10,
            padding: '10px 12px',
            border: '1.5px solid var(--border)',
            position: 'relative',
          }}>
            {/* Leather corner accent */}
            <div
              className="texture-leather"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 30,
                height: 30,
                borderRadius: '10px 0 10px 0',
                backgroundColor: 'rgba(60,56,48,0.06)',
              }}
            />
            {/* Avatar */}
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              border: '2px solid var(--border-dark)',
              background: 'var(--bg)',
              position: 'relative',
              zIndex: 1,
            }}>
              {avatarEmoji}
            </div>
            {/* Quote */}
            <div>
              <p style={{ fontSize: 12, color: 'var(--bg-leather)', margin: 0, lineHeight: 1.5, fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>
                "{quote.quote}"
              </p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '4px 0 0', fontFamily: 'var(--font-body)' }}>
                {quote.name}, {quote.role}
              </p>
            </div>
          </div>
        )}

        {/* No character fallback */}
        {!quote && !character && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>🧊 Isen håller.</p>
        )}
      </div>
    </div>
  )
}
