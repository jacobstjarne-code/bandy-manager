import { describe, expect, it } from 'vitest'
import { createNewGame } from '../createNewGame'
import { handleSeasonEnd } from '../seasonEndProcessor'

describe('handleSeasonEnd — sommarkullen i liggaren', () => {
  it('registrerar den enda P19-kullen utan att smyga in den i A-truppen', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
    const result = handleSeasonEnd({ ...game, youthTeam: undefined, eventLedger: [], youthIntakeHistory: [] }, 1).game

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

    const summary = result.seasonSummaries.at(-1)!
    expect(summary.season).toBe(game.currentSeason)
    expect(summary.youthIntakeCount).toBe(summerEntries[0].youthIntake!.count)
    expect(summary.bestYouthProspect?.name).toBeTruthy()

    const intakeIds = new Set(result.youthTeam?.players.map(player => player.id) ?? [])
    const seniorIds = new Set(result.clubs.find(club => club.id === game.managedClubId)?.squadPlayerIds ?? [])
    expect([...intakeIds].some(id => seniorIds.has(id))).toBe(false)
    expect(result.players.some(player => player.id.startsWith(`player_${game.managedClubId}_youth_`))).toBe(false)

    // Retire-last: den äldre historikfickan speglar samma P19-kull.
    expect(result.youthIntakeHistory.some(record =>
      record.clubId === game.managedClubId && record.season === game.currentSeason
    )).toBe(true)
  })
})
