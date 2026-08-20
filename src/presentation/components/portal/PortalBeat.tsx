import { useNavigate } from 'react-router-dom'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { getActiveBeat, getBeatKey } from '../../../domain/services/portalBeatService'
import { useGameStore } from '../../store/gameStore'

interface Props {
  game: SaveGame
}

// Severity → visuell behandling (Förbättring 3-skalan)
// sev 0: plain portal-surface
// sev 1: copper kicker (= tidigare kicker-variant)
// sev 2: danger-tint bg + danger border
// sev 3: mörk yta + kris-band (3px danger top-stripe)
function getSeverityStyles(sev: 0 | 1 | 2 | 3): {
  background: string
  border: string
  topStripe?: string
  kickerColor: string
  textColor: string
} {
  if (sev === 3) return {
    background: 'var(--bg-dark-surface)',
    border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)',
    topStripe: 'var(--danger)',
    kickerColor: 'var(--danger)',
    textColor: 'var(--text-light-secondary)',
  }
  if (sev === 2) return {
    background: 'color-mix(in srgb, var(--danger) 6%, var(--bg-portal-surface))',
    border: '1px solid var(--danger)',
    kickerColor: 'var(--danger)',
    textColor: 'var(--text-light-secondary)',
  }
  if (sev === 1) return {
    background: 'color-mix(in srgb, var(--copper) 8%, var(--bg-portal-surface))',
    border: '1px solid color-mix(in srgb, var(--copper) 25%, transparent)',
    kickerColor: 'var(--copper)',
    textColor: 'var(--text-light-secondary)',
  }
  return {
    background: 'var(--bg-portal-surface)',
    border: 'none',
    kickerColor: 'var(--copper)',
    textColor: 'var(--text-light-secondary)',
  }
}

export function PortalBeat({ game }: Props) {
  const dismissBeat = useGameStore(s => s.dismissBeat)
  const navigate = useNavigate()
  const beat = getActiveBeat(game)
  if (!beat) return null

  const beatText = typeof beat.text === 'function' ? beat.text(game) : beat.text
  const beatSteps = beat.steps ? beat.steps(game) : []
  const kickerText = typeof beat.kicker === 'function' ? beat.kicker(game) : beat.kicker
  const sev: 0 | 1 | 2 | 3 = beat.severity
    ? beat.severity(game)
    : kickerText ? 1 : 0
  const styles = getSeverityStyles(sev)

  const dismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    const key = getBeatKey(beat, game.currentSeason, game)
    dismissBeat(key, beat.id)
  }

  const handleClick = () => {
    if (beat.route) {
      const key = getBeatKey(beat, game.currentSeason, game)
      dismissBeat(key, beat.id)
      navigate(beat.route)
    }
  }

  const isNavigable = !!beat.route
  const showKicker = !!(kickerText && sev >= 1)

  return (
    <div
      onClick={isNavigable ? handleClick : undefined}
      style={{
        marginBottom: 10,
        overflow: 'hidden',
        borderRadius: 'var(--radius-md)',
        border: styles.border,
        cursor: isNavigable ? 'pointer' : 'default',
      }}
    >
      {styles.topStripe && (
        <div style={{ height: 3, background: styles.topStripe }} />
      )}
      <div style={{
        padding: showKicker ? '7px 12px 9px' : '8px 12px',
        background: styles.background,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
      }}>
        <span style={{ fontSize: 18, lineHeight: 1.3, flexShrink: 0, marginTop: showKicker ? 2 : 0 }}>
          {beat.emoji}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          {showKicker && (
            <div style={{
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: styles.kickerColor,
              marginBottom: 3,
            }}>
              {kickerText}
            </div>
          )}
          <div className="h-quote" style={{ color: styles.textColor, lineHeight: 1.55 }}>
            {beatText}
          </div>
          {/* Yta 2 (Audit-syntes, 2026-07-07): kedjan stegvis — label/riktning per rad,
              inte hopplattad i löpmeningen. Bara beats med `steps` visar den här listan;
              övriga beats renderas precis som förut. */}
          {beatSteps.length > 0 && (
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {beatSteps.map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontSize: 11.5 }}>
                  <span style={{ color: step.dir === 'up' ? 'var(--success)' : 'var(--danger)', flexShrink: 0 }}>
                    {step.dir === 'up' ? '↑' : '↓'}
                  </span>
                  <span style={{ color: styles.textColor }}>{step.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {isNavigable && (
          <span style={{
            fontSize: 14,
            color: sev >= 2 ? 'var(--danger)' : 'var(--copper)',
            flexShrink: 0,
            alignSelf: 'center',
            lineHeight: 1,
          }}>
            ›
          </span>
        )}
        <button
          onClick={dismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: 14,
            cursor: 'pointer',
            padding: '0 0 0 4px',
            lineHeight: 1,
            flexShrink: 0,
            alignSelf: 'center',
          }}
          aria-label="Stäng"
        >
          ×
        </button>
      </div>
    </div>
  )
}
