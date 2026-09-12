import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BURNOUT_MARK_FIRED_KEY } from '../../../../domain/services/managerProfileService'
import { makeBaseGame } from '../../../screens/dev/gameStateFactory'
import { BurnoutMark } from '../BurnoutMark'

describe('BurnoutMark illustration', () => {
  it('bär burnout-ögonblicket i den levererade scenbilden', () => {
    const base = makeBaseGame()
    const currentMatchday = 8
    const game = {
      ...base,
      currentMatchday,
      managerProfile: {
        ...base.managerProfile!,
        burnoutScore: 78,
        lastShownBurnoutZone: 'hog' as const,
        lastBurnoutCause: 'fatigue' as const,
      },
      narrativeBeatLog: [
        ...(base.narrativeBeatLog ?? []),
        {
          semanticKey: BURNOUT_MARK_FIRED_KEY,
          season: base.currentSeason,
          round: currentMatchday,
        },
      ],
    }

    const html = renderToStaticMarkup(<BurnoutMark game={game} />)

    expect(html).toContain('/assets/illustrations/burnout-ceiling.webp')
    expect(html).toContain('Ett tomt omklädningsrum')
  })
})
