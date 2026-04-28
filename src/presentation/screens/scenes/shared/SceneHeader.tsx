/**
 * SceneHeader — gemensam toppdel för scen-vyer.
 * Renderar genre-tagg ("⬩ I DETTA ÖGONBLICK ⬩"), valfri emoji,
 * titel (Georgia 28px) och valfri italik subtitle.
 *
 * Pixel-värden från mockup. Justera inte.
 */

interface Props {
  genre: string
  title: string
  subtitle?: string
  emoji?: string
  subtitleMarginBottom?: number
}

export function SceneHeader({ genre, title, subtitle, emoji, subtitleMarginBottom = 36 }: Props) {
  return (
    <div>
      <div
        style={{
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: 4,
          color: 'var(--accent)',
          opacity: 0.7,
          textAlign: 'center',
          textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        {genre}
      </div>
      {emoji && (
        <div
          style={{
            fontSize: 22,
            marginBottom: 8,
            opacity: 0.85,
            textAlign: 'center',
          }}
        >
          {emoji}
        </div>
      )}
      <div
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--text-light)',
          textAlign: 'center',
          lineHeight: 1.1,
          marginBottom: 6,
          letterSpacing: -0.3,
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 11,
            fontStyle: 'italic',
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginBottom: subtitleMarginBottom,
            letterSpacing: 0.5,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  )
}
