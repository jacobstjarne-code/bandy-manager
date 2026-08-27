/**
 * M12 (2026-07-02) — comebackKing-triggern läste p.injuryProneness > 0
 * (en statisk 0-100-benägenhetsegenskap) istf faktisk skadehistorik.
 * Nästan vilken spelare som helst hade kunnat kvalificera trots att hen
 * aldrig varit skadad. Låser: kräver en verklig 'injury'-post i
 * diary denna säsong.
 */
import { describe, it, expect } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { generateSeasonSummary } from '../seasonSummaryService'

const base = createNewGame({ managerName: 'T', clubId: 'club_forsbacka', season: 2025, seed: 7 })

function withCandidate(diary: NonNullable<import('../../entities/Player').Player['diary']>) {
  const candidateId = base.players.find(p => p.clubId === base.managedClubId)!.id
  return {
    ...base,
    players: base.players.map(p => p.id === candidateId
      ? {
          ...p,
          isInjured: false,
          injuryProneness: 40,
          diary,
          seasonStats: { ...p.seasonStats, goals: 6, gamesPlayed: 10 },
        }
      : p),
  }
}

describe('comebackKing-trigger — faktisk skadehistorik, inte benägenhet', () => {
  it('triggar INTE för en spelare som aldrig varit skadad, trots injuryProneness > 0', () => {
    const game = withCandidate([])
    const summary = generateSeasonSummary(game)
    expect(summary.storyTriggers?.some(t => t.type === 'comebackKing') ?? false).toBe(false)
  })

  it('triggar för en spelare med verklig skadepost denna säsong', () => {
    const game = withCandidate([
      { season: 2025, matchday: 3, type: 'injury', text: 'Skadad — beräknad frånvaro 21 dagar.' },
    ])
    const summary = generateSeasonSummary(game)
    expect(summary.storyTriggers?.some(t => t.type === 'comebackKing') ?? false).toBe(true)
  })

  it('triggar INTE om skadeposten är från en tidigare säsong', () => {
    const game = withCandidate([
      { season: 2024, matchday: 3, type: 'injury', text: 'Skadad — beräknad frånvaro 21 dagar.' },
    ])
    const summary = generateSeasonSummary(game)
    expect(summary.storyTriggers?.some(t => t.type === 'comebackKing') ?? false).toBe(false)
  })
})
