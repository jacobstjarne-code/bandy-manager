import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { OpponentVignetteScene } from '../OpponentVignetteScene'

describe('OpponentVignetteScene', () => {
  it('wirar den levererade Gagnef-bilden med webp-sökvägen', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_malilla', seed: 9 })
    const opponent = game.clubs.find(club => club.id === 'club_gagnef')
    const fixture = game.fixtures.find(candidate =>
      candidate.homeClubId === opponent?.id || candidate.awayClubId === opponent?.id,
    )

    expect(opponent).toBeDefined()
    expect(fixture).toBeDefined()

    const html = renderToStaticMarkup(
      <OpponentVignetteScene
        game={game}
        opponent={opponent!}
        fixture={fixture!}
        isHome={fixture!.homeClubId === game.managedClubId}
        onContinue={() => {}}
      />,
    )

    expect(html).toContain('src="/assets/illustrations/intro-gagnef.webp"')
    expect(html).not.toContain('illustration på väg')
  })
})
