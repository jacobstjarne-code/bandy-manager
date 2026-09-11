import { describe, expect, it } from 'vitest'
import { createNewGame } from '../createNewGame'
import { handleSeasonEnd } from '../seasonEndProcessor'

describe('handleSeasonEnd — sommarkullen i liggaren', () => {
  it('låter P19 vara enda verkliga intaget och fryser samma kull i liggaren', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
    const game = {
      ...base,
      youthTeam: {
        ...base.youthTeam!,
        players: base.youthTeam!.players.map(player => ({ ...player, age: 19 })),
      },
    }
    const previousYouthIds = new Set(game.youthTeam?.players.map(player => player.id) ?? [])
    const previousSeniorIds = new Set(game.players.map(player => player.id))
    const result = handleSeasonEnd({ ...game, eventLedger: [], youthIntakeHistory: [] }, 1).game

    const summerEntries = result.eventLedger?.filter(entry =>
      entry.type === 'youth_intake'
      && entry.season === game.currentSeason
      && entry.youthIntake?.source === 'summer'
    ) ?? []
    expect(summerEntries).toHaveLength(1)
    expect(summerEntries[0]).toEqual(expect.objectContaining({
      semanticKey: `youth_intake_${game.managedClubId}_s${game.currentSeason}_summer`,
      clubId: game.managedClubId,
      subject: { kind: 'club', id: game.managedClubId },
      significance: expect.any(Number),
      youthIntake: expect.objectContaining({
        count: expect.any(Number),
        topProspectId: expect.any(String),
        academyLevel: expect.any(String),
        source: 'summer',
      }),
    }))
    expect(summerEntries[0].youthIntake!.count).toBeGreaterThan(0)

    const actualP19Intake = result.youthTeam!.players.filter(player => !previousYouthIds.has(player.id))
    expect(summerEntries[0].youthIntake!.count).toBe(actualP19Intake.length)
    expect(summerEntries[0].youthIntake!.topProspectId).toBe(
      actualP19Intake.reduce((best, player) =>
        player.potentialAbility > best.potentialAbility ? player : best
      ).id,
    )
    const newManagedSeniorIds = result.players
      .filter(player => player.clubId === game.managedClubId && !previousSeniorIds.has(player.id))
      .map(player => player.id)
    expect(newManagedSeniorIds).not.toEqual(
      expect.arrayContaining(actualP19Intake.map(player => player.id)),
    )
    expect(newManagedSeniorIds.filter(id => id.includes('_youth_'))).toEqual([])
    expect(result.clubs.find(club => club.id === game.managedClubId)!.squadPlayerIds)
      .not.toEqual(expect.arrayContaining(actualP19Intake.map(player => player.id)))

    const summary = result.seasonSummaries.at(-1)!
    expect(summary.season).toBe(game.currentSeason)
    expect(summary.youthIntakeCount).toBe(summerEntries[0].youthIntake!.count)
    expect(summary.bestYouthProspect?.name).toBeTruthy()

    // Retire-last: den äldre fickan dual-writas tills alla sparmigreringar är klara.
    expect(result.youthIntakeHistory.some(record =>
      record.clubId === game.managedClubId
      && record.season === game.currentSeason
      && record.playerIds.every(id => actualP19Intake.some(player => player.id === id))
    )).toBe(true)
  })
})
