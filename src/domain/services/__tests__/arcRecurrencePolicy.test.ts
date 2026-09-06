import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import type { SaveGame } from '../../entities/SaveGame'
import type { Fixture } from '../../entities/Fixture'
import type { EventLedgerEntry, ArcType, StorylineType } from '../../entities/Narrative'
import type { TransferBid } from '../../entities/GameEvent'
import { FixtureStatus, MatchEventType } from '../../enums'
import { detectArcTriggers, progressArcs } from '../arcService'

function baseGame(): SaveGame {
  const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2026, seed: 17 })
  return {
    ...game,
    activeArcs: [],
    eventLedger: [],
    players: game.players.map(player => ({ ...player, trait: undefined })),
  }
}

function playerResolution(
  game: SaveGame,
  type: StorylineType,
  playerId: string,
  ordinal: number,
  idSuffix = 'resolved',
): EventLedgerEntry {
  return {
    type: 'storyline_resolution',
    semanticKey: `storyline_resolution:${type}:story_${type}_${playerId}_${ordinal}_${idSuffix}`,
    season: game.currentSeason - ordinal,
    matchday: 8,
    subject: { kind: 'player', id: playerId },
    subject2: { kind: 'club', id: game.managedClubId },
    significance: 50,
  }
}

function withHistory(
  game: SaveGame,
  type: StorylineType,
  playerId: string,
  count: number,
  idSuffix = 'resolved',
): SaveGame {
  return {
    ...game,
    eventLedger: Array.from({ length: count }, (_, index) =>
      playerResolution(game, type, playerId, index + 1, idSuffix)
    ),
  }
}

interface TriggerSetup {
  game: SaveGame
  fixture?: Fixture
  playerId: string
}

function expectIntroVariantSkip(
  setup: () => TriggerSetup,
  arcType: ArcType,
  resolutionType: StorylineType,
  idSuffix = 'resolved',
): void {
  const detect = (historyCount: number) => {
    const current = setup()
    const game = withHistory(current.game, resolutionType, current.playerId, historyCount, idSuffix)
    return detectArcTriggers(game, current.fixture).find(arc => arc.type === arcType)
  }

  expect(detect(0)?.data?.recurrence).toBeUndefined()
  expect(detect(1)?.data?.recurrence).toBe('variant')
  expect(detect(2)).toBeUndefined()
}

function hungrySetup(): TriggerSetup {
  const base = baseGame()
  const target = base.players.find(player => player.clubId === base.managedClubId)!
  const lineup = { startingPlayerIds: [target.id], benchPlayerIds: [] } as NonNullable<Fixture['homeLineup']>
  const fixtures = [3, 4, 5].map((matchday, index) => ({
    ...base.fixtures[index],
    id: `hungry_${matchday}`,
    homeClubId: base.managedClubId,
    awayClubId: 'club_soderfors',
    status: FixtureStatus.Completed,
    matchday,
    homeLineup: lineup,
    events: [],
  }))
  return {
    game: {
      ...base,
      currentMatchday: 5,
      fixtures,
      players: base.players.map(player => player.id === target.id
        ? { ...player, trait: 'hungrig', age: 22 }
        : player),
    },
    fixture: fixtures[2],
    playerId: target.id,
  }
}

function jokerSetup(): TriggerSetup {
  const base = baseGame()
  const target = base.players.find(player => player.clubId === base.managedClubId)!
  const fixture = {
    ...base.fixtures[0],
    id: 'joker_suspension_recurrence',
    homeClubId: base.managedClubId,
    awayClubId: 'club_soderfors',
    status: FixtureStatus.Completed,
    matchday: 5,
    events: [{
      type: MatchEventType.Suspension,
      minute: 44,
      clubId: base.managedClubId,
      playerId: target.id,
    }],
  }
  return {
    game: {
      ...base,
      currentMatchday: 5,
      fixtures: [fixture],
      players: base.players.map(player => player.id === target.id
        ? { ...player, trait: 'joker' }
        : player),
    },
    fixture,
    playerId: target.id,
  }
}

function veteranSetup(): TriggerSetup {
  const base = baseGame()
  const target = base.players.find(player => player.clubId === base.managedClubId)!
  return {
    game: {
      ...base,
      currentMatchday: 15,
      players: base.players.map(player => player.id === target.id
        ? { ...player, trait: 'veteran', age: 32, contractUntilSeason: base.currentSeason }
        : player),
    },
    playerId: target.id,
  }
}

function localSetup(): TriggerSetup {
  const base = baseGame()
  const target = base.players.find(player => player.clubId === base.managedClubId)!
  const fixture = {
    ...base.fixtures[0],
    id: 'local_derby_recurrence',
    homeClubId: base.managedClubId,
    awayClubId: 'club_gagnef',
    status: FixtureStatus.Completed,
    matchday: 5,
    events: [{
      type: MatchEventType.Goal,
      minute: 19,
      clubId: base.managedClubId,
      playerId: target.id,
    }],
  }
  return {
    game: {
      ...base,
      currentMatchday: 5,
      fixtures: [fixture],
      players: base.players.map(player => player.id === target.id
        ? { ...player, trait: 'lokal' }
        : player),
    },
    fixture,
    playerId: target.id,
  }
}

function contractSetup(): TriggerSetup {
  const base = baseGame()
  const target = base.players.find(player => player.clubId === base.managedClubId)!
  const bid: TransferBid = {
    id: 'contract_recurrence_bid',
    playerId: target.id,
    buyingClubId: 'club_soderfors',
    sellingClubId: base.managedClubId,
    offerAmount: 100000,
    offeredSalary: 10000,
    contractYears: 2,
    direction: 'incoming',
    status: 'pending',
    createdRound: 10,
    expiresRound: 16,
  }
  return {
    game: {
      ...base,
      currentMatchday: 10,
      transferBids: [bid],
      players: base.players.map(player => player.id === target.id
        ? { ...player, form: 70, contractUntilSeason: base.currentSeason }
        : player),
    },
    playerId: target.id,
  }
}

describe('arcService — återfall enligt kanonisk historik', () => {
  it('hungrig: intro → variant → skip', () => {
    expectIntroVariantSkip(hungrySetup, 'hungrig_breakthrough', 'hungrig_breakthrough')
  })

  it('joker: endast tidigare vindikation ger variant, den tredje skippar', () => {
    expectIntroVariantSkip(jokerSetup, 'joker_redemption', 'joker_vindicated')
  })

  it('veteran: tidigare kvarstannande ger variant, tredje gången pensioneras bågen', () => {
    expectIntroVariantSkip(veteranSetup, 'veteran_farewell', 'veteran_stayed')
  })

  it('lokal hjälte: intro → variant → skip', () => {
    expectIntroVariantSkip(localSetup, 'lokal_hero', 'lokal_hero_moment')
  })

  it('kontraktsdrama: bara tidigare förlängningsmarkör ger variant', () => {
    expectIntroVariantSkip(contractSetup, 'contract_drama', 'contract_drama_resolved', 'extended')
    const setup = contractSetup()
    const priorDeparture = withHistory(setup.game, 'contract_drama_resolved', setup.playerId, 1)
    expect(detectArcTriggers(priorDeparture).find(arc => arc.type === 'contract_drama')?.data?.recurrence)
      .toBeUndefined()
  })

  it('använder de låsta varianttexterna och veteranens ettårsval', () => {
    const hungry = hungrySetup()
    const hungryArc = detectArcTriggers(
      withHistory(hungry.game, 'hungrig_breakthrough', hungry.playerId, 1),
      hungry.fixture,
    ).find(arc => arc.type === 'hungrig_breakthrough')!
    const hungryPeak = progressArcs({ ...hungry.game, activeArcs: [hungryArc] }, 7).newEvents[0]
    expect(hungryPeak).toMatchObject({
      title: expect.stringMatching(/ — igen$/),
      body: expect.stringContaining('Förra gången höll du honom om ryggen'),
    })

    const joker = jokerSetup()
    const jokerArc = detectArcTriggers(
      withHistory(joker.game, 'joker_vindicated', joker.playerId, 1),
      joker.fixture,
    ).find(arc => arc.type === 'joker_redemption')!
    const jokerPeak = progressArcs({ ...joker.game, activeArcs: [jokerArc] }, 7)
    expect(jokerPeak.newInboxItems[0]?.title).toMatch(/ — igen"$/)
    expect(jokerPeak.newEvents[0]?.body).toContain('Du trodde på')

    const veteran = veteranSetup()
    const veteranArc = detectArcTriggers(
      withHistory(veteran.game, 'veteran_stayed', veteran.playerId, 1),
    ).find(arc => arc.type === 'veteran_farewell')!
    const veteranPeak = progressArcs({ ...veteran.game, activeArcs: [veteranArc] }, 17).newEvents[0]
    expect(veteranPeak.title).toMatch(/vill stanna — igen$/)
    expect(veteranPeak.choices.find(choice => choice.id === 'extend_veteran')).toMatchObject({
      label: 'Förläng ett år',
      subtitle: 'Kontrakt +1 år · klackens stämning +6',
      effect: expect.objectContaining({ subEffects: expect.stringContaining('"contractYears":1') }),
    })

    const local = localSetup()
    const localArc = detectArcTriggers(
      withHistory(local.game, 'lokal_hero_moment', local.playerId, 1),
      local.fixture,
    ).find(arc => arc.type === 'lokal_hero')!
    const localPeak = progressArcs({ ...local.game, activeArcs: [localArc] }, 7)
    expect(localPeak.newInboxItems[0]).toMatchObject({
      title: expect.stringMatching(/gjorde det igen"$/),
      body: 'Två derbyn, två mål. Orten har slutat bli förvånad.',
    })

    const contract = contractSetup()
    const contractArc = detectArcTriggers(
      withHistory(contract.game, 'contract_drama_resolved', contract.playerId, 1, 'extended'),
    ).find(arc => arc.type === 'contract_drama')!
    const contractPeak = progressArcs({ ...contract.game, activeArcs: [contractArc] }, 12).newEvents[0]
    expect(contractPeak).toMatchObject({
      title: expect.stringMatching(/möte igen$/),
      body: expect.stringContaining('Förra året förlängde ni ett år.'),
    })
  })

  it('samma säsongs andra derby loss→win blir revansch och sparar motpart + utfall', () => {
    const base = baseGame()
    const opponentId = 'club_gagnef'
    const prior: EventLedgerEntry = {
      type: 'storyline_resolution',
      semanticKey: 'storyline_resolution:derby_echo_resolved:story_prior_derby',
      season: base.currentSeason,
      matchday: 3,
      subject: { kind: 'club', id: base.managedClubId },
      subject2: { kind: 'club', id: opponentId },
      outcome: 'lost',
      significance: 35,
    }
    const fixture = {
      ...base.fixtures[0],
      id: 'derby_revenge',
      homeClubId: base.managedClubId,
      awayClubId: opponentId,
      homeScore: 3,
      awayScore: 1,
      status: FixtureStatus.Completed,
      matchday: 8,
      events: [],
    }
    const game = { ...base, fixtures: [fixture], eventLedger: [prior] }
    const arc = detectArcTriggers(game, fixture).find(candidate => candidate.type === 'derby_echo')!
    const building = progressArcs({ ...game, activeArcs: [arc] }, 8)
    expect(building.newInboxItems[0]).toMatchObject({
      title: expect.stringContaining('Revanschen tog Forsbacka'),
      body: '🏆 Revansch mot Gagnef',
    })
    const resolution = progressArcs({ ...game, activeArcs: building.updatedArcs }, 10).newStorylines[0]
    expect(resolution).toMatchObject({
      relatedClubId: opponentId,
      outcome: 'won',
      description: '🏆 Revansch mot Gagnef',
    })
  })
})
