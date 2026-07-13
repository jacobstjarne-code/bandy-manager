import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { SeasonSignatureId } from '../../../domain/entities/SeasonSignature'
import { SIGNATURE_REVEAL_DATA } from '../../../domain/data/scenes/seasonSignatureReveal'
import { SceneCTA } from './shared/SceneCTA'

interface Props {
  game: SaveGame
  onComplete: () => void
}

const ATMOSPHERE_GRADIENTS: Record<SeasonSignatureId, string> = {
  calm_season: 'none',
  cold_winter:
    'radial-gradient(ellipse at 30% 20%, rgba(74,102,128,0.10) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(74,102,128,0.08) 0%, transparent 60%)',
  scandal_season:
    'radial-gradient(ellipse at 50% 30%, color-mix(in srgb, var(--danger) 8%, transparent) 0%, transparent 60%)',
  hot_transfer_market:
    'radial-gradient(ellipse at 60% 40%, color-mix(in srgb, var(--gold) 10%, transparent) 0%, transparent 60%)',
  injury_curve:
    'radial-gradient(ellipse at 40% 50%, rgba(184,136,76,0.06) 0%, transparent 70%)',
  dream_round:
    'radial-gradient(ellipse at 50% 30%, color-mix(in srgb, var(--gold) 12%, transparent) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(184,136,76,0.08) 0%, transparent 60%)',
}

export function SeasonSignatureRevealScene({ game, onComplete }: Props) {
  const sig = game.currentSeasonSignature
  if (!sig || sig.id === 'calm_season') return null

  const data = SIGNATURE_REVEAL_DATA[sig.id]
  const atmosphereGradient = ATMOSPHERE_GRADIENTS[sig.id]

  return (
    <div style={{
      background: 'var(--bg-scene-deep)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Atmosphere overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        background: atmosphereGradient,
      }} />

      {/* Genre tag */}
      <div className="h-label h-label-light" style={{
        textAlign: 'center',
        padding: '28px 0 8px',
        color: 'var(--accent)',
        opacity: 0.7,
        position: 'relative',
        zIndex: 1,
      }}>
        ⬩ I DETTA ÖGONBLICK ⬩
      </div>

      {/* Emoji */}
      <div style={{
        textAlign: 'center',
        fontSize: 64,
        padding: '24px 0 12px',
        opacity: 0.95,
        position: 'relative',
        zIndex: 1,
        filter: 'drop-shadow(0 0 18px color-mix(in srgb, var(--gold) 18%, transparent))',
      }}>
        {data.emoji}
      </div>

      {/* Title */}
      <div style={{
        textAlign: 'center',
        fontFamily: 'Georgia, serif',
        fontSize: 26,
        fontWeight: 800,
        color: 'var(--text-light)',
        letterSpacing: 4,
        padding: '0 24px 8px',
        position: 'relative',
        zIndex: 1,
      }}>
        {data.title}
      </div>

      {/* Subtitle */}
      <div style={{
        textAlign: 'center',
        fontFamily: 'Georgia, serif',
        fontSize: 14,
        fontStyle: 'italic',
        color: 'var(--text-light-secondary)',
        padding: '0 32px 24px',
        lineHeight: 1.4,
        position: 'relative',
        zIndex: 1,
      }}>
        {data.subtitle}
      </div>

      {/* Body — T3 (2026-07-13): fynd under samma svep som BoardMeetingScene/
          CoffeeRoom. Detta är säsongens narrativa huvudtext, aktiv precis nu,
          inget dimmed-tillstånd bakom sig — --text-light, inte -secondary.
          Subtitle ovan är en annan, legitim hierarki (rubrik+underrubrik) och
          rörs inte. */}
      <div style={{
        flex: 1,
        padding: '8px 32px 16px',
        fontFamily: 'Georgia, serif',
        fontSize: 13,
        color: 'var(--text-light)',
        lineHeight: 1.7,
        position: 'relative',
        zIndex: 1,
      }}>
        {data.body}
      </div>

      {/* CTA */}
      <div style={{ padding: '16px 20px 28px', position: 'relative', zIndex: 1 }}>
        <SceneCTA label={data.ctaText} onClick={onComplete} />
      </div>
    </div>
  )
}
