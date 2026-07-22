/**
 * Release-svepet 2026-07-22 (Block 3a) — HALLNODE_SUBS-platshållare fyllda med
 * riktiga värden (formatHallNodeSub), konsumerad av FacilityTree.tsx:s nod-
 * undertext och HallProvningScreen.tsx (H·1-hubben).
 */
import { describe, it, expect } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { formatHallNodeSub } from '../hallProcessService'
import type { HallTrial } from '../../../entities/Community'
import type { SaveGame } from '../../../entities/SaveGame'

function withTrial(trial?: HallTrial): SaveGame {
  const base = createNewGame({ managerName: 'T', clubId: 'club_forsbacka', season: 2025, seed: 3 })
  return { ...base, currentSeason: 2025, facilityState: { builtNodeIds: [], hallTrial: trial } }
}

describe('formatHallNodeSub', () => {
  it('vilande: ingen platshållare att fylla, texten går rakt igenom', () => {
    expect(formatHallNodeSub(withTrial(undefined))).toBe('Öppnar prövningen — förankring krävs ›')
  })

  it('forankring: {n} ersätts med trial.support', () => {
    const trial: HallTrial = { stage: 'forankring', support: 42, startedSeason: 2025, stageStartedRound: 5 }
    expect(formatHallNodeSub(withTrial(trial))).toBe('Förankring pågår · stöd 42')
  })

  it('krav: {x} räknar uppfyllda krav via computeKravStatus (0 här — inget kapital/underlag/styrelse-underlag)', () => {
    const trial: HallTrial = { stage: 'krav', startedSeason: 2025, stageStartedRound: 20 }
    const result = formatHallNodeSub(withTrial(trial))
    expect(result).toMatch(/^Krav \d\/3 uppfyllda$/)
  })

  it('bygge: {season} blir "omg {etaMatchday}", inte ett gissat årtal', () => {
    const trial: HallTrial = { stage: 'bygge', startedSeason: 2025, stageStartedRound: 30 }
    const game = { ...withTrial(trial), facilityState: { builtNodeIds: [], hallTrial: trial, activeProject: { nodeId: 'matchhall', startedMatchday: 30, etaMatchday: 50 } } }
    expect(formatHallNodeSub(game)).toBe('Bygge · klar omg 50')
  })

  it('nedlagd: {season} ersätts med trial.cooldownUntilSeason', () => {
    const trial: HallTrial = { stage: 'nedlagd', startedSeason: 2025, stageStartedRound: 10, cooldownUntilSeason: 2027 }
    expect(formatHallNodeSub(withTrial(trial))).toBe('Nedlagd · vilar till 2027')
  })

  it('klar: {year} ersätts med trial.completedSeason (fryst vid stage→klar)', () => {
    const trial: HallTrial = { stage: 'klar', startedSeason: 2025, stageStartedRound: 10, completedSeason: 2026 }
    expect(formatHallNodeSub(withTrial(trial))).toBe('Byggd 2026')
  })

  it('klar: faller tillbaka på currentSeason om completedSeason saknas (gammalt save)', () => {
    const trial: HallTrial = { stage: 'klar', startedSeason: 2025, stageStartedRound: 10 }
    expect(formatHallNodeSub(withTrial(trial))).toBe('Byggd 2025')
  })

  it('bordlagd: ingen platshållare, texten går rakt igenom', () => {
    const trial: HallTrial = { stage: 'bordlagd', startedSeason: 2025, stageStartedRound: 10 }
    expect(formatHallNodeSub(withTrial(trial))).toBe('Bordlagd · kan väckas igen')
  })
})
