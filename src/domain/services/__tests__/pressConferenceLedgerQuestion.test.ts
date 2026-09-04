import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { FixtureStatus, MatchEventType } from '../../enums'
import type { Fixture } from '../../entities/Fixture'
import type { EventLedgerEntry } from '../../entities/Narrative'
import type { SaveGame } from '../../entities/SaveGame'
import { ledgerPostKey, markLedgerPostTold } from '../ledgerToldService'
import { generatePressConference } from '../pressConferenceService'

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
  return {
    ...base,
    currentMatchday: 4,
    eventLedger: [],
    ledgerTold: {},
    ...overrides,
  }
}

function makeFixture(game: SaveGame, overrides: Partial<Fixture> = {}): Fixture {
  const opponent = game.clubs.find(club => club.id !== game.managedClubId)!
  return {
    id: 'press-ledger-fixture',
    leagueId: game.league.id,
    season: game.currentSeason,
    roundNumber: 4,
    matchday: 4,
    homeClubId: game.managedClubId,
    awayClubId: opponent.id,
    status: FixtureStatus.Completed,
    homeScore: 2,
    awayScore: 1,
    events: [],
    ...overrides,
  }
}

function post(
  game: SaveGame,
  value: Partial<EventLedgerEntry> & Pick<EventLedgerEntry, 'type' | 'semanticKey' | 'significance'>,
): EventLedgerEntry {
  return {
    season: game.currentSeason,
    matchday: 3,
    clubId: game.managedClubId,
    ...value,
  }
}

describe('generatePressConference — Berättaren steg 7', () => {
  it('väljer agendans högst viktade byggbara post och bär dess exakta kvittonyckel', () => {
    let game = makeGame()
    const referee = game.referees?.[0]
    expect(referee).toBeDefined()
    const era = post(game, { type: 'era_shift', semanticKey: 'era_shift:s2025:m3', significance: 85 })
    const feud = post(game, {
      type: 'referee_feud',
      semanticKey: `referee_feud:${referee!.id}:s2025:m3`,
      significance: 65,
      subject: { kind: 'referee', id: referee!.id },
    })
    game = { ...game, eventLedger: [era, feud] }

    const event = generatePressConference(makeFixture(game), game, () => 0)

    expect(event?.body).toBe(
      `"Det sägs att ni och ${referee!.firstName} ${referee!.lastName} inte kommer överens. Är det domaren eller er som är problemet?"`,
    )
    expect(event?.pressLedgerPostKey).toBe(ledgerPostKey(feud))
    expect(event?.choices).toHaveLength(4)
  })

  it('frågar inte om samma post igen och låter nästa agendapost ta plats', () => {
    let game = makeGame()
    const era = post(game, { type: 'era_shift', semanticKey: 'era_shift:s2025:m3', significance: 85 })
    const injuryPlayer = game.players.find(player => player.clubId === game.managedClubId)!
    const injury = post(game, {
      type: 'star_injury',
      semanticKey: `star_injury:${injuryPlayer.id}:s2025:m3`,
      significance: 70,
      subject: { kind: 'player', id: injuryPlayer.id },
    })
    game = {
      ...game,
      eventLedger: [era, injury],
      ledgerTold: markLedgerPostTold({}, injury, 'press', { season: game.currentSeason, matchday: 3 }),
    }

    const event = generatePressConference(makeFixture(game), game, () => 0)

    expect(event?.body).toBe('"Det pratas om en ny epok i klubben. Är det ni eller tabellen som bestämmer det?"')
    expect(event?.pressLedgerPostKey).toBe(ledgerPostKey(era))
  })

  it('avvisar fel klubb, äldre än tre matchdagar och vikt under 70', () => {
    const game = makeGame()
    const player = game.players[0]
    const invalid = [
      post(game, {
        type: 'era_shift', semanticKey: 'other-club', significance: 100, clubId: 'club_other',
      }),
      post(game, {
        type: 'era_shift', semanticKey: 'too-old', significance: 100, matchday: 0,
      }),
      post(game, {
        type: 'star_injury', semanticKey: 'too-light', significance: 49,
        subject: { kind: 'player', id: player.id },
      }),
    ]

    const event = generatePressConference(makeFixture(game), { ...game, eventLedger: invalid }, () => 0)

    expect(event?.pressLedgerPostKey).toBeUndefined()
  })

  it('återanvänder skandalens befintliga rubrik som låst `{ämne}`', () => {
    let game = makeGame()
    const scandal = {
      id: 'scandal-press-topic',
      season: game.currentSeason,
      triggerRound: 3,
      type: 'sponsor_collapse' as const,
      affectedClubId: game.managedClubId,
      resolutionRound: 3,
      isResolved: true,
    }
    const scandalPost = post(game, {
      type: 'scandal', semanticKey: scandal.id, significance: 70,
      subject: { kind: 'club', id: game.managedClubId },
    })
    game = { ...game, scandalHistory: [scandal], eventLedger: [scandalPost] }

    const event = generatePressConference(makeFixture(game), game, () => 0)

    expect(event?.body).toBe('"Vi måste fråga om Borgvik Bygg drar sig ur — söker ny sponsor. Vad hände egentligen?"')
    expect(event?.pressLedgerPostKey).toBe(ledgerPostKey(scandalPost))
  })

  it('använder försäljningsfrågan bara när den sålda spelaren faktiskt gjort mål i båda senaste matcherna', () => {
    const base = makeGame()
    const managedClubId = base.managedClubId
    const otherClub = base.clubs.find(club => club.id !== managedClubId)!
    const soldPlayer = base.players.find(player => player.clubId === otherClub.id)!
    const sale = post(base, {
      type: 'transfer_sold',
      semanticKey: `transfer_sold:${soldPlayer.id}:s2025:m1`,
      matchday: 1,
      significance: 80,
      subject: { kind: 'player', id: soldPlayer.id },
      subject2: { kind: 'club', id: otherClub.id },
    })
    const recentFixture = (matchday: number, scored: boolean): Fixture => ({
      ...makeFixture(base),
      id: `other-${matchday}`,
      matchday,
      homeClubId: otherClub.id,
      awayClubId: base.clubs.find(club => club.id !== otherClub.id)!.id,
      events: scored ? [{
        minute: 10,
        type: MatchEventType.Goal,
        clubId: otherClub.id,
        playerId: soldPlayer.id,
        description: 'Mål.',
      }] : [],
    })
    const game = {
      ...base,
      eventLedger: [sale],
      fixtures: [...base.fixtures, recentFixture(2, true), recentFixture(3, true)],
    }

    const event = generatePressConference(makeFixture(game), game, () => 0)
    const withoutStreak = generatePressConference(
      makeFixture(game),
      { ...game, fixtures: [...base.fixtures, recentFixture(2, true), recentFixture(3, false)] },
      () => 0,
    )

    expect(event?.body).toBe(
      `"${soldPlayer.firstName} ${soldPlayer.lastName} gör mål varje vecka — för någon annan. Ångrar ni försäljningen?"`,
    )
    expect(event?.pressLedgerPostKey).toBe(ledgerPostKey(sale))
    expect(withoutStreak?.pressLedgerPostKey).toBeUndefined()
  })
})
