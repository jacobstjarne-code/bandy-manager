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
      <div className="h-scene-genre">{genre}</div>
      {emoji && (
        <div style={{ fontSize: 22, marginBottom: 8, opacity: 0.85, textAlign: 'center' }}>
          {emoji}
        </div>
      )}
      <div className="h-scene-title">{title}</div>
      {subtitle && (
        <div className="h-scene-helper" style={{ marginBottom: subtitleMarginBottom }}>
          {subtitle}
        </div>
      )}
    </div>
  )
}
