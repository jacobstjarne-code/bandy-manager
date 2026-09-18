import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../createNewGame'
import { InboxItemType } from '../../../../domain/enums'
import { processMedia } from '../mediaProcessor'

describe('deadline-notiser', () => {
  it('mediepasset hittar inte på bud under transferfönstrets sista omgångar', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2026, seed: 1 })
    for (const round of [13, 14, 15]) {
      const result = processMedia(game, [], null, round, round, game.currentDate, () => 0)
      expect(result.inboxItems.some(item => item.type === InboxItemType.TransferDeadline)).toBe(false)
      expect(result.resolvedEventIds.some(id => id.startsWith('deadline_bid_') || id.startsWith('deadline_offer_'))).toBe(false)
    }
  })
})
