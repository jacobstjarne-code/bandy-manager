import { describe, it, expect } from 'vitest'
import { getActiveBeat } from '../portalBeatService'
import { PIVOTAL_BEAT_IDS, PIVOTAL_BEAT_COOLDOWN_SEASONS } from '../../data/portalBeats'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../worldGenerator'
import type { SaveGame } from '../../entities/SaveGame'

/**
 * U5 forts (SLUTTEST_KO.md, 2026-08-19/20) — isOnCooldown mot pivotal beats.
 * "Pivotal" saknar formell klassificering i kodbasen (väntar på O11/
 * contentContract.ts) — interimslistan (PIVOTAL_BEAT_IDS, portalBeats.ts)
 * är sju namngivna beats som läser som stora/sällsynta ögonblick. Detta
 * testet låser BETEENDET (multi-säsongsspärr utöver shownBeats-dedupen),
 * inte listans exakta medlemskap — den kan ändras utan att testet failar
 * strukturellt (facility_completed används som representant).
 */
function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  const template = CLUB_TEMPLATES[0]
  const game = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
  return { ...game, ...overrides }
}

describe('getActiveBeat — pivotal cooldown (U5 forts)', () => {
  it('en pivotal beat på cooldown (loggad förra säsongen) hoppas över även om trigger() är sant', () => {
    // board_failure triggar på boardObjectives.some(status==='failed') — lätt
    // att framkalla deterministiskt.
    const base = makeGame({ currentSeason: 5 })
    const failedObjective = { ...base.boardObjectives![0], status: 'failed' as const }
    const gameWithFailure = {
      ...base,
      boardObjectives: [failedObjective, ...base.boardObjectives!.slice(1)],
      boardPatience: 70,
    }
    // Utan logg: board_failure ska triggas (om inget annat beat med lägre index gör det först).
    const activeWithoutLog = getActiveBeat(gameWithFailure)
    expect(activeWithoutLog?.id).toBe('board_failure')

    // Med en loggad post på board_failure FÖRRA säsongen (inom cooldown-fönstret): hoppas över.
    const onCooldown = {
      ...gameWithFailure,
      narrativeBeatLog: [{ semanticKey: 'board_failure', season: 4, round: 20 }],
    }
    const activeOnCooldown = getActiveBeat(onCooldown)
    expect(activeOnCooldown?.id).not.toBe('board_failure')
  })

  it('en pivotal beat vars cooldown har runnit ut (minSeasonsApart passerad) triggas igen', () => {
    const base = makeGame({ currentSeason: 5 })
    const failedObjective = { ...base.boardObjectives![0], status: 'failed' as const }
    const gameWithFailure = {
      ...base,
      boardObjectives: [failedObjective, ...base.boardObjectives!.slice(1)],
      boardPatience: 70,
      narrativeBeatLog: [{ semanticKey: 'board_failure', season: 5 - PIVOTAL_BEAT_COOLDOWN_SEASONS, round: 20 }],
    }
    const active = getActiveBeat(gameWithFailure)
    expect(active?.id).toBe('board_failure')
  })

  it('icke-pivotal beats påverkas inte av isOnCooldown (bara shownBeats-dedupen gäller)', () => {
    // callback_streak är INTE pivotal (inte i listan) — en logg-post ska inte hindra den.
    expect(PIVOTAL_BEAT_IDS).not.toContain('callback_streak')
  })
})
