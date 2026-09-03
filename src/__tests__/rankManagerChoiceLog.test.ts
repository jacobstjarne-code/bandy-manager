/**
 * GPT-fynd 2026-09-03 — Granskas "Dina val" tog tidigare de FÖRSTA fyra
 * managerChoiceLog-posterna i befintlig ordning. I 5–0→7–7-matchen fyllde
 * flera lågprioriterade automatiska started_tired-rader kvoten innan
 * pausbeslutet (halftime_tactic) ens nådde fram — spelaren såg aldrig sitt
 * eget beslut, bara automatiskt härledda konditionsrader.
 *
 * rankManagerChoiceLog rangordnar loggen FÖRE fyra-begränsningen (som körs
 * separat i GranskaOversikt.tsx). Fyra nivåer, Jacobs dom: (1) pausbeslut/
 * aktiva matchbeslut (halftime_tactic/pep_talk), (2) kapten/ledarskap,
 * (3) aktivt vald spelarrotation (bench_fit), (4) automatiska
 * started_tired-rader.
 */
import { describe, it, expect } from 'vitest'
import { rankManagerChoiceLog } from '../presentation/screens/granska/helpers'
import type { ManagerChoiceEntry } from '../domain/entities/Fixture'

function entry(type: ManagerChoiceEntry['type'], playerId?: string): ManagerChoiceEntry {
  return { type, playerId, detail: 'test_detail' }
}

describe('rankManagerChoiceLog', () => {
  it('reproducerar 5–0→7–7-scenariot: pausbeslutet flyttas före started_tired-rader som kom först i loggen', () => {
    const log: ManagerChoiceEntry[] = [
      entry('started_tired', 'p1'),
      entry('started_tired', 'p2'),
      entry('started_tired', 'p3'),
      entry('started_tired', 'p4'),
      entry('halftime_tactic'),
    ]
    const ranked = rankManagerChoiceLog(log)
    // Pausbeslutet ska nu ligga inom de fyra första — inte trängas undan.
    const top4Types = ranked.slice(0, 4).map(e => e.type)
    expect(top4Types).toContain('halftime_tactic')
    expect(ranked[0].type).toBe('halftime_tactic')
  })

  it('prioritetsordning: pausbeslut/pep_talk (0) < kapten (1) < bench_fit (2) < started_tired (3)', () => {
    const log: ManagerChoiceEntry[] = [
      entry('started_tired', 'p4'),
      entry('bench_fit', 'p3'),
      entry('captain', 'p2'),
      entry('pep_talk'),
    ]
    const ranked = rankManagerChoiceLog(log)
    expect(ranked.map(e => e.type)).toEqual(['pep_talk', 'captain', 'bench_fit', 'started_tired'])
  })

  it('bevarar kronologisk (befintlig) ordning INOM samma prioritetsnivå — stabil sortering', () => {
    const log: ManagerChoiceEntry[] = [
      entry('started_tired', 'p1'),
      entry('started_tired', 'p2'),
      entry('started_tired', 'p3'),
    ]
    const ranked = rankManagerChoiceLog(log)
    expect(ranked.map(e => e.playerId)).toEqual(['p1', 'p2', 'p3'])
  })

  it('halftime_tactic och pep_talk delar högsta prioritet, ordnas inbördes efter befintlig ordning', () => {
    const log: ManagerChoiceEntry[] = [
      entry('started_tired', 'p1'),
      entry('pep_talk'),
      entry('halftime_tactic'),
    ]
    const ranked = rankManagerChoiceLog(log)
    expect(ranked.map(e => e.type)).toEqual(['pep_talk', 'halftime_tactic', 'started_tired'])
  })

  it('en managerhandling (kapten) trängs aldrig undan av tre started_tired-rader som kom före den', () => {
    const log: ManagerChoiceEntry[] = [
      entry('started_tired', 'p1'),
      entry('started_tired', 'p2'),
      entry('started_tired', 'p3'),
      entry('captain', 'p4'),
      entry('started_tired', 'p5'),
    ]
    const ranked = rankManagerChoiceLog(log)
    const top4 = ranked.slice(0, 4)
    expect(top4.some(e => e.type === 'captain')).toBe(true)
  })

  it('ursprungslistan muteras inte', () => {
    const log: ManagerChoiceEntry[] = [entry('started_tired', 'p1'), entry('captain', 'p2')]
    const originalOrder = log.map(e => e.type)
    rankManagerChoiceLog(log)
    expect(log.map(e => e.type)).toEqual(originalOrder)
  })

  it('tom logg ger tom logg', () => {
    expect(rankManagerChoiceLog([])).toEqual([])
  })
})
