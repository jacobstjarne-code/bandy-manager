/**
 * seasonDecisionsService — AUDIT DEL 2 A3, uppföljning (2026-08-09).
 *
 * Rot: collectSeasonDecisions() läste game.storylines helt utan dedup mot
 * DIN SÄSONG (SeasonSummaryScreen.tsx), en tredje okoordinerad läsare av
 * samma array upptäckt vid Playwright-verifiering av A3-fixet. Jacobs
 * ruling: behåll storylines i DINA VAL, men dela seenTypes så en storyline-
 * typ bara syns en gång per skärm — excludeStorylineTypes är den mekanismen.
 */
import { describe, it, expect } from 'vitest'
import { collectSeasonDecisions } from '../seasonDecisionsService'
import type { SaveGame } from '../../entities/SaveGame'

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    currentSeason: 8, managedClubId: 'club_home', players: [],
    storylines: [], boardObjectiveHistory: [],
    ...overrides,
  } as unknown as SaveGame
}

describe('collectSeasonDecisions — excludeStorylineTypes', () => {
  it('utan exclude-set: alla säsongens storylines listas (befintligt beteende)', () => {
    const game = makeGame({
      storylines: [
        { id: 's1', type: 'underdog_season', season: 8, matchday: 12, description: '', displayText: 'Ingen trodde på oss.', resolved: true },
      ] as never,
    })
    const decisions = collectSeasonDecisions(game)
    expect(decisions.map(d => d.text)).toContain('Ingen trodde på oss.')
  })

  it('med exclude-set: en storyline-typ som redan claimats av DIN SÄSONG hoppas över', () => {
    const game = makeGame({
      storylines: [
        { id: 's1', type: 'underdog_season', season: 8, matchday: 12, description: '', displayText: 'Ingen trodde på oss.', resolved: true },
        { id: 's2', type: 'gala_winner', season: 8, matchday: 21, description: '', displayText: 'Vann galan.', resolved: true },
      ] as never,
    })
    const claimed = new Set(['underdog_season'])
    const decisions = collectSeasonDecisions(game, claimed)
    expect(decisions.map(d => d.text)).not.toContain('Ingen trodde på oss.')
    expect(decisions.map(d => d.text)).toContain('Vann galan.')
  })

  it('exclude-set påverkar inte icke-storyline-beslut (akademi, styrelse, etc)', () => {
    const game = makeGame({
      players: [{ id: 'p1', clubId: 'club_home', promotedFromAcademy: true, promotionRound: 5, firstName: 'Nils', lastName: 'Berg', age: 17 }] as never,
      boardObjectiveHistory: [{ season: 8, objectiveId: 'topp6', result: 'met' }] as never,
    })
    const decisions = collectSeasonDecisions(game, new Set(['underdog_season']))
    expect(decisions.some(d => d.text.includes('Nils Berg'))).toBe(true)
    expect(decisions.some(d => d.text.includes('topp6'))).toBe(true)
  })
})
