import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { buildSeasonCalendar } from '../../../domain/services/scheduleGenerator'
import { migrateSaveGame } from '../saveGameMigration'

describe('migrateSaveGame — ClubMemory-källor till eventLedger', () => {
  it('backfyller bara strukturerat verifierbara prio 1-händelser och är idempotent', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 4, seed: 9 })
    const player = game.players.find(item => item.clubId === game.managedClubId)!
    const raw = JSON.parse(JSON.stringify({
      ...game,
      eventLedger: undefined,
      players: game.players.map(item => item.id === player.id ? {
        ...item,
        promotedFromAcademy: true,
        promotionSeason: 3,
        promotionRound: 6,
        firstNationalTeamCallupSeason: 4,
        firstNationalTeamCallupMatchday: 10,
        diary: [{
          season: 4, matchday: 11, type: 'milestone',
          semanticKey: 'career_games_100',
          text: 'Match nummer 100 i A-laget. Lojalitet och uthållighet lönar sig.',
        }],
      } : item),
      facilityState: {
        builtNodeIds: ['kiosk'],
        builtSeasons: { kiosk: 3 },
        unseenCompletedFacilities: [{ nodeId: 'kiosk', season: 3, matchday: 7 }],
      },
      scandalHistory: [{
        id: 'legacy_scandal', season: 3, triggerRound: 8, type: 'match_fixing',
        affectedClubId: game.managedClubId, isResolved: true,
      }],
      activeScandals: [],
      clubLegends: [{
        playerId: 'retired_player', name: 'Test Veteran', position: 'FWD',
        seasons: 8, totalGoals: 40, totalAssists: 20, titles: [], retiredSeason: 3,
      }],
      storylines: [{
        id: 'resolved_story', type: 'underdog_season', season: 3, matchday: 6,
        clubId: game.managedClubId, description: 'Historisk rad', displayText: 'Historisk rad', resolved: true,
      }, {
        id: 'active_story', type: 'workplace_bond', season: 4, matchday: 8,
        clubId: game.managedClubId, description: 'Pågående rad', displayText: 'Pågående rad', resolved: false,
      }],
    }))

    const once = migrateSaveGame(raw)
    const twice = migrateSaveGame(JSON.parse(JSON.stringify(once)))
    const migratedTypes = ['academy_promotion', 'national_team_callup', 'player_milestone', 'facility_built', 'scandal', 'retirement', 'storyline_resolution']

    for (const type of migratedTypes) {
      expect(once.eventLedger?.filter(entry => entry.type === type), type).toHaveLength(1)
    }
    const storylineEntry = once.eventLedger?.find(entry => entry.type === 'storyline_resolution')
    expect(storylineEntry).toMatchObject({
      semanticKey: 'storyline_resolution:underdog_season:resolved_story',
      season: 3,
      matchday: buildSeasonCalendar(3).find(slot => slot.type === 'league' && slot.leagueRound === 6)?.matchday,
      subject: { kind: 'club', id: game.managedClubId },
    })
    expect(once.eventLedger?.some(entry => entry.semanticKey.includes('active_story'))).toBe(false)
    expect(twice.eventLedger).toEqual(once.eventLedger)
  })

  it('gissar inte uppflyttningssäsong när en äldre save saknar promotionSeason', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 4, seed: 10 })
    const player = game.players.find(item => item.clubId === game.managedClubId)!
    const migrated = migrateSaveGame({
      ...game,
      eventLedger: undefined,
      players: game.players.map(item => item.id === player.id
        ? { ...item, promotedFromAcademy: true, promotionRound: 6, promotionSeason: undefined }
        : item),
    })

    expect(migrated.eventLedger?.some(entry => entry.type === 'academy_promotion' && entry.subject?.id === player.id)).toBe(false)
  })
})
