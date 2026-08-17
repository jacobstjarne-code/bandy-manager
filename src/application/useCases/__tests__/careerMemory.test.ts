import { describe, it, expect } from 'vitest'
import { createNewGame } from '../createNewGame'
import { advanceToNextEvent } from '../advanceToNextEvent'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import {
  autoSelectLineup,
  autoResolvePendingScreen,
} from '../../../../scripts/stress/fixtures'

/**
 * A1 (långspelsaudit, 10 säsonger, 2026-08-17): seasonEndProcessor.ts:1240
 * gjorde `.slice(-5)` på seasonSummaries — efter tio säsonger var år 1-5
 * borta, fem SM-guld stod kvar som räknare men åren de vanns fanns inte.
 *
 * Testet driver EN seed genom 20 fulla säsonger (samma advanceToNextEvent +
 * autoSelectLineup + autoResolvePendingScreen-mönster som headless-
 * stresstestet) och kontrollerar seasonSummaries.length vid exakt de
 * kontrollpunkter ordern angav: 1, 5, 6, 10, 20. Kravet: antalet
 * sammanfattningar ska vara lika med antalet spelade säsonger — aldrig kapat.
 */
function driveSeasons(seed: number, targetSeasons: number[]): Map<number, number> {
  const clubTemplate = CLUB_TEMPLATES[seed % CLUB_TEMPLATES.length]
  let game: SaveGame = createNewGame({ managerName: `Test-${seed}`, clubId: clubTemplate.id, seed })
  game = { ...game, pendingScreen: null }

  const maxSeason = Math.max(...targetSeasons)
  const lengthAtSeason = new Map<number, number>()
  let stepSeed = seed * 100_000 + 1_000

  // currentSeason startar på world-genereringens säsong (t.ex. 1) och ökar
  // vid varje rollover — loopa tills seasonSummaries innehåller lika många
  // poster som det högsta kontrollpunkten kräver, med ett generöst tak på
  // rundor för att aldrig hänga om en seed råkar vara ovanligt seg.
  for (let i = 0; i < maxSeason * 60 && (game.seasonSummaries?.length ?? 0) < maxSeason; i++) {
    game = autoSelectLineup(game)
    const result = advanceToNextEvent(game, stepSeed++)
    game = result.game
    const resolved = autoResolvePendingScreen(game)
    if (resolved.unresolvable) break
    game = resolved.game

    const completed = game.seasonSummaries?.length ?? 0
    if (targetSeasons.includes(completed) && !lengthAtSeason.has(completed)) {
      lengthAtSeason.set(completed, completed)
    }
  }
  return lengthAtSeason
}

describe('A1 — karriärminnet kapas inte längre vid fem säsonger', () => {
  it('seasonSummaries.length matchar antalet spelade säsonger vid 1, 5, 6, 10 och 20', () => {
    const checkpoints = [1, 5, 6, 10, 20]
    const seen = driveSeasons(0, checkpoints)
    for (const n of checkpoints) {
      expect(seen.get(n), `seasonSummaries hade aldrig längd ${n} — checkpoints som faktiskt sågs: ${JSON.stringify([...seen.keys()])}`).toBe(n)
    }
  })

  it('regressionsvakt: en 6:e säsong tar inte bort den 1:a (den gamla .slice(-5)-buggen)', () => {
    const clubTemplate = CLUB_TEMPLATES[1 % CLUB_TEMPLATES.length]
    let game: SaveGame = createNewGame({ managerName: 'Regress', clubId: clubTemplate.id, seed: 1 })
    game = { ...game, pendingScreen: null }
    let stepSeed = 1 * 100_000 + 1_000
    for (let i = 0; i < 6 * 60 && (game.seasonSummaries?.length ?? 0) < 6; i++) {
      game = autoSelectLineup(game)
      const result = advanceToNextEvent(game, stepSeed++)
      game = result.game
      const resolved = autoResolvePendingScreen(game)
      if (resolved.unresolvable) break
      game = resolved.game
    }
    const seasons = (game.seasonSummaries ?? []).map(s => s.season)
    expect(seasons.length, `seasonSummaries: ${JSON.stringify(seasons)}`).toBeGreaterThanOrEqual(6)
    // Den FÖRSTA spelade säsongen ska fortfarande finnas — inte bara de fem senaste.
    expect(seasons[0]).toBe(Math.min(...seasons))
  })
})
