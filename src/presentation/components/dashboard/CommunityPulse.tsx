import type { SaveGame } from '../../../domain/entities/SaveGame'
import { getFunctionaryQuote } from '../../../domain/services/functionaryQuoteService'

interface Props {
  game: SaveGame
  currentRound: number
  onNavigate?: () => void
}


export function CommunityPulse({ game, currentRound, onNavigate }: Props) {
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
    <div className="card-sharp card-stagger-5" style={{ margin: '0 12px 10px' }}>
      <div style={{ padding: 14 }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
            🏘️ Bygdens puls
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Metric plate */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 7px' }}>
              <span style={{ fontSize: 11, color: cs > (prevCs ?? cs) ? 'var(--success)' : cs < (prevCs ?? cs) ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: 600 }}>
                {cs > (prevCs ?? cs) ? '↗' : cs < (prevCs ?? cs) ? '↘' : '→'}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{cs}</span>
            </div>
            {onNavigate && (
              <button onClick={(e) => { e.stopPropagation(); onNavigate() }} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: 4, flexShrink: 0, background: 'transparent', border: '1px solid var(--border)', color: 'var(--accent)', fontSize: 12, lineHeight: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.03)', cursor: 'pointer' }}>›</button>
            )}
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
