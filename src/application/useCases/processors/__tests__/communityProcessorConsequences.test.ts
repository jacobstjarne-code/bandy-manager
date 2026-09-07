import { describe, expect, it } from 'vitest'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import { createNewGame } from '../../createNewGame'
import { applyCommunityConsequences } from '../communityProcessor'

describe('communityProcessor — post-round consequences', () => {
  it('applies match mood before the delayed Annandagen supporter boost', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2026, seed: 17 })
    const game: SaveGame = {
      ...base,
      supporterGroup: { mood: 50 } as SaveGame['supporterGroup'],
      pendingAnnandagsMediaRubrik: { val: 'B', triggerRound: 7 },
      pendingAnnandagsKlack: { val: 'B', triggerRound: 7 },
    }

    const result = applyCommunityConsequences(game, 7, 2)

    expect(result.supporterGroup?.mood).toBe(57)
    expect(result.inbox[0]).toMatchObject({
      id: `inbox_annandagen_media_${game.currentSeason}`,
      type: 'community',
    })
    expect(result.pendingAnnandagsMediaRubrik).toBeUndefined()
    expect(result.pendingAnnandagsKlack).toBeUndefined()
  })

  it('keeps delayed consequences pending while applying this round’s match reaction', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2026, seed: 17 })
    const game: SaveGame = {
      ...base,
      supporterGroup: { mood: 50 } as SaveGame['supporterGroup'],
      pendingAnnandagsMediaRubrik: { val: 'C', triggerRound: 8 },
      pendingAnnandagsKlack: { val: 'C', triggerRound: 9 },
    }

    const result = applyCommunityConsequences(game, 7, -3)

    expect(result.supporterGroup?.mood).toBe(47)
    expect(result.pendingAnnandagsMediaRubrik).toEqual(game.pendingAnnandagsMediaRubrik)
    expect(result.pendingAnnandagsKlack).toEqual(game.pendingAnnandagsKlack)
  })
})
