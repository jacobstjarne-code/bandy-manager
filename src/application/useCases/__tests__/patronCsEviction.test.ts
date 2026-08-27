/**
 * "Takmodellen", patronens del (Jacobs dom 2026-08-26, RAPPORT_FYRA_
 * UTREDNINGAR_2026-08-26.md punkt 4): relationen var enkelriktad —
 * communityStanding avgjorde bara ANKOMST, aldrig AVHOPP. Om ortstödet
 * faller under PATRON_EMERGE_CS medan en patron är aktiv ska den lämna.
 */
import { describe, it, expect } from 'vitest'
import { createNewGame } from '../createNewGame'
import { advanceToNextEvent } from '../roundProcessor'
import { autoAssignFormation, FORMATIONS } from '../../../domain/entities/Formation'
import type { FormationType } from '../../../domain/entities/Formation'
import { TacticMentality, TacticTempo, TacticPress, TacticPassingRisk, TacticWidth, TacticAttackingFocus, CornerStrategy, PenaltyKillStyle } from '../../../domain/enums'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { TeamSelection } from '../../../domain/entities/Fixture'
import type { Patron } from '../../../domain/entities/Community'

function withAutoLineup(game: SaveGame): SaveGame {
  const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId && !p.isInjured && p.suspensionGamesRemaining === 0)
  const formation = (game.clubs.find(c => c.id === game.managedClubId)?.activeTactic.formation ?? '3-3-4') as FormationType
  const lineupSlots = autoAssignFormation(FORMATIONS[formation], managedPlayers)
  const startingIds = Object.values(lineupSlots).filter(Boolean) as string[]
  const benchIds = managedPlayers.filter(p => !startingIds.includes(p.id)).map(p => p.id).slice(0, 6)
  const lineup: TeamSelection = {
    startingPlayerIds: startingIds,
    benchPlayerIds: benchIds,
    captainPlayerId: startingIds[0] ?? undefined,
    tactic: {
      mentality: TacticMentality.Balanced, tempo: TacticTempo.Normal, press: TacticPress.Medium,
      passingRisk: TacticPassingRisk.Safe, width: TacticWidth.Normal, attackingFocus: TacticAttackingFocus.Central,
      cornerStrategy: CornerStrategy.Safe, penaltyKillStyle: PenaltyKillStyle.Passive, formation, lineupSlots,
    },
  }
  return { ...game, managedClubPendingLineup: lineup }
}

function makePatron(overrides: Partial<Patron>): Patron {
  return {
    name: 'Test Testsson', business: 'AB Test', influence: 50, happiness: 80,
    contribution: 200000, isActive: true, hasBeenWarned: false, goodwill: 80,
    totalContributed: 0, demands: [],
    ...overrides,
  } as Patron
}

describe('patron cs-driven avhopp — roundProcessor', () => {
  it('communityStanding under PATRON_EMERGE_CS med aktiv patron: patronen lämnar, patronWithdrawnSeason sätts', () => {
    let game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 3 })
    game = withAutoLineup(game)
    game = { ...game, communityStanding: 40, patron: makePatron({ isActive: true }) }

    const result = advanceToNextEvent(game, 1)

    expect(result.game.patron?.isActive).toBe(false)
    expect(result.game.patronWithdrawnSeason).toBe(game.currentSeason)
    const evictionEvent = result.pendingEvents.find(e => e.id.startsWith('patron_cs_eviction_'))
    expect(evictionEvent).toBeDefined()
  })

  it('communityStanding över tröskeln: patronen påverkas inte', () => {
    let game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 3 })
    game = withAutoLineup(game)
    game = { ...game, communityStanding: 90, patron: makePatron({ isActive: true }) }

    const result = advanceToNextEvent(game, 1)

    expect(result.game.patron?.isActive).toBe(true)
    expect(result.game.patronWithdrawnSeason).toBeUndefined()
  })

  it('ingen aktiv patron: ingen avhoppshändelse skapas trots lågt cs', () => {
    let game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 3 })
    game = withAutoLineup(game)
    game = { ...game, communityStanding: 30, patron: undefined }

    const result = advanceToNextEvent(game, 1)

    const evictionEvent = result.pendingEvents.find(e => e.id.startsWith('patron_cs_eviction_'))
    expect(evictionEvent).toBeUndefined()
  })
})
