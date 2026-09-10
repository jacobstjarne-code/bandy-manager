import { getPortraitImagePath, getPortraitSvg } from '../../domain/services/portraitService'

interface PlayerPortraitProps {
  playerId: string
  age: number
  position: string
  alt?: string
}

/**
 * One rendering boundary for player portraits. Approved raster art wins when a
 * tier has it; all other players keep the existing deterministic SVG until
 * their own curated tier is complete.
 */
export function PlayerPortrait({ playerId, age, position, alt = '' }: PlayerPortraitProps) {
  const imagePath = getPortraitImagePath(playerId, age)

  if (imagePath) {
    return (
      <img
        data-player-portrait-kind="curated"
        src={imagePath}
        alt={alt}
        width={64}
        height={64}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          // De frilagda porträtten ska kunna återanvändas på mörka ytor utan
          // att mörkt hår försvinner. Medaljongens papper ägs därför av den
          // gemensamma renderingsgränsen, inte av den enskilda bildfilen.
          background: 'var(--bg-surface)',
        }}
      />
    )
  }

  return (
    <span
      data-player-portrait-kind="fallback"
      aria-hidden="true"
      style={{ width: '100%', height: '100%', display: 'block' }}
      dangerouslySetInnerHTML={{ __html: getPortraitSvg(playerId, age, position) }}
    />
  )
}
