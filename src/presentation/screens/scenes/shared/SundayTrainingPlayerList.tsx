/**
 * SundayTrainingPlayerList — sex-radig spelarlista i söndagsträningen.
 * Pixel-värden från training-mockup .player-row / .player-icon / .player-text.
 */

import type { SundayTrainingPlayer } from '../../../../domain/data/scenes/sundayTrainingScene'

interface Props {
  players: SundayTrainingPlayer[]
}

export function SundayTrainingPlayerList({ players }: Props) {
  return (
    <div style={{ margin: '24px 0 28px' }}>
      {players.map((p, i) => (
        <div
          key={i}
          style={{
            padding: '10px 0',
            borderBottom: '1px solid rgba(58,50,42,0.5)',
            display: 'flex',
            gap: 14,
            alignItems: 'flex-start',
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'var(--bg-dark-elevated)',
              border: '1px solid var(--bg-leather)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
              fontFamily: 'Georgia, serif',
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
              marginTop: 2,
            }}
          >
            {p.initial}
          </div>
          <div
            style={{
              flex: 1,
              fontSize: 13,
              color: 'var(--text-light-secondary)',
              lineHeight: 1.5,
              fontFamily: 'Georgia, serif',
            }}
            dangerouslySetInnerHTML={{
              __html: `<strong style="color: var(--text-light); font-weight: 700;">${p.name}</strong> ${p.text}`,
            }}
          />
        </div>
      ))}
    </div>
  )
}
