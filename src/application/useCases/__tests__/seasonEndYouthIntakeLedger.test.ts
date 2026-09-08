import { describe, expect, it } from 'vitest'
import { createNewGame } from '../createNewGame'
import { handleSeasonEnd } from '../seasonEndProcessor'

describe('handleSeasonEnd — sommarkullen i liggaren', () => {
  it('samlar direktintag och ny P19-påfyllnad i en post som årsboken fryser', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
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

    const summary = result.seasonSummaries.at(-1)!
    expect(summary.season).toBe(game.currentSeason)
    expect(summary.youthIntakeCount).toBe(summerEntries[0].youthIntake!.count)
    expect(summary.bestYouthProspect?.name).toBeTruthy()

    // Retire-last: den äldre fickan dual-writas tills alla sparmigreringar är klara.
    expect(result.youthIntakeHistory.some(record =>
      record.clubId === game.managedClubId && record.season === game.currentSeason
    )).toBe(true)
  })
})
