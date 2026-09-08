import { describe, expect, it } from 'vitest'
import type { Fixture } from '../../../../domain/entities/Fixture'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import { createNewGame } from '../../createNewGame'
import { processCommunityStandingPress } from '../mediaProcessor'

function makeGame(): SaveGame {
  const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2026, seed: 17 })
  return {
    ...game,
    currentMatchday: 8,
    journalist: {
      name: 'Karin Bergström',
      outlet: 'Lokaltidningen',
      persona: 'analytical',
      style: 'neutral',
      relationship: 50,
      memory: [],
      pressRefusals: 0,
    },
    lastCSPressMatchday: undefined,
  }
}

function homeCleanSheet(game: SaveGame): Fixture {
  const player = game.players.find(candidate => candidate.clubId === game.managedClubId)!
  const opponent = game.clubs.find(club => club.id !== game.managedClubId)!
  return {
    id: 'fixture_cs_press',
    homeClubId: game.managedClubId,
    awayClubId: opponent.id,
    homeScore: 2,
    awayScore: 0,
    isCup: false,
    isKnockout: false,
    status: 'completed',
    matchday: 8,
    roundNumber: 8,
    season: game.currentSeason,
    homeLineup: { startingPlayerIds: [player.id] } as never,
  } as Fixture
}

describe('mediaProcessor — community-standing press', () => {
  it('queues the clean-sheet press question and stamps its cooldown matchday', () => {
    const game = makeGame()
    const fixture = homeCleanSheet(game)
    const result = processCommunityStandingPress(game, fixture, 8, () => 0)

    expect(result.pendingCSPress).toMatchObject({
      id: `csPress_${fixture.id}`,
      type: 'csPress',
      relatedFixtureId: fixture.id,
    })
    expect(result.lastCSPressMatchday).toBe(8)
    expect(result.fixtures).toBe(game.fixtures)
  })

  it('keeps state unchanged while the four-round cooldown is active', () => {
    const game = { ...makeGame(), lastCSPressMatchday: 6 }
    const fixture = homeCleanSheet(game)
    expect(processCommunityStandingPress(game, fixture, 8, () => 0)).toBe(game)
  })

  it('keeps state unchanged for away and cup fixtures', () => {
    const game = makeGame()
    const home = homeCleanSheet(game)
    const away = {
      ...home,
      homeClubId: home.awayClubId,
      awayClubId: game.managedClubId,
      homeScore: 0,
      awayScore: 2,
    }
    expect(processCommunityStandingPress(game, away, 8, () => 0)).toBe(game)
    expect(processCommunityStandingPress(game, { ...home, isCup: true }, 8, () => 0)).toBe(game)
  })
})
