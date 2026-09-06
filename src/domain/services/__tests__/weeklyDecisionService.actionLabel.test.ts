/**
 * overlamning2-weeklydecision-boardmeeting-konsolidering (DOM Opus 2026-09-06):
 * weeklyDecisionService skrev redan en `decision`-liggarpost (buildWeeklyDecisionLedgerEntry),
 * men saknade `actionLabel` — seasonDecisionCaptureService.ts's composeGenericDecisionSentence()
 * kräver BÅDE actionLabel OCH moneyAmount, så ett veckobeslut som faktiskt flyttade pengar
 * kunde ändå aldrig bli "säsongens beslut" i årsboken. Ingen resolver-merge — bara luckan täppt.
 */
import { describe, it, expect } from 'vitest'
import { buildWeeklyDecisionLedgerEntry, type WeeklyDecision } from '../weeklyDecisionService'
import { composeSeasonDecisionSentence } from '../seasonDecisionCaptureService'
import type { SaveGame } from '../../entities/SaveGame'

const decision: WeeklyDecision = {
  id: 'test_decision',
  category: 'community',
  question: 'test',
  optionA: { label: 'Satsa på ismaskinen', effect: '-10 tkr', effectColor: 'danger' },
  optionB: { label: 'Vänta', effect: 'ingenting', effectColor: 'muted' },
}

function makeGame(finances: number): SaveGame {
  return {
    currentSeason: 2025,
    currentMatchday: 5,
    managedClubId: 'c1',
    players: [],
    clubs: [{ id: 'c1', finances }],
  } as unknown as SaveGame
}

describe('buildWeeklyDecisionLedgerEntry — actionLabel', () => {
  it('bär optionA/B:s label som actionLabel', () => {
    const before = makeGame(100_000)
    const after = makeGame(90_000)
    const entry = buildWeeklyDecisionLedgerEntry(
      decision, 'A', [{ type: 'finances', delta: -10_000 }], before, after, 5,
    )
    expect(entry.actionLabel).toBe('Satsa på ismaskinen')
    expect(entry.moneyAmount).toBe(10_000)
  })

  it('composeSeasonDecisionSentence kan nu bygga en mening ur ett veckobeslut som flyttade pengar', () => {
    const before = makeGame(100_000)
    const after = makeGame(90_000)
    const entry = buildWeeklyDecisionLedgerEntry(
      decision, 'A', [{ type: 'finances', delta: -10_000 }], before, after, 5,
    )
    expect(composeSeasonDecisionSentence(entry, after)).toBe('Satsa på ismaskinen. Kostade 10 tkr nu.')
  })

  it('ett veckobeslut utan finansiell effekt saknar fortfarande moneyAmount — ingen mening (by design)', () => {
    const before = makeGame(100_000)
    const after = makeGame(100_000)
    const entry = buildWeeklyDecisionLedgerEntry(decision, 'B', [], before, after, 5)
    expect(entry.actionLabel).toBe('Vänta')
    expect(entry.moneyAmount).toBeUndefined()
    expect(composeSeasonDecisionSentence(entry, after)).toBeNull()
  })
})
