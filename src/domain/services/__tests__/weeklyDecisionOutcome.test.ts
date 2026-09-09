/**
 * DOM_O12_VECKOBESLUT_2026-09-09 — regressionstester (Codex punkt 5): attribut,
 * moral+kondition, clampad supporter-/ortseffekt, pengar+annan resurs,
 * slumpad lotto, noop. Testar de rena funktionerna direkt (`captureResolved
 * ChoiceOutcome`/`formatWeeklyDecisionOutcome`) — ingen store behövs, samma
 * mönster som eventChoiceReceiptService.test.ts.
 */
import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../worldGenerator'
import { captureResolvedChoiceOutcome } from '../eventChoiceReceiptService'
import { formatWeeklyDecisionOutcome, type WeeklyDecisionEffect } from '../weeklyDecisionService'
import type { SaveGame } from '../../entities/SaveGame'

function baseGame(): SaveGame {
  const template = CLUB_TEMPLATES[0]
  return createNewGame({ managerName: 'O12-veckobeslut', clubId: template.id, seed: 12 })
}

describe('DOM_O12_VECKOBESLUT_2026-09-09 — captureResolvedChoiceOutcome utökad', () => {
  it('fångar cornerSkill- och cornerRecovery-attribut per spelare (Codex p5: attribut)', () => {
    const before = baseGame()
    const target = before.players[0]
    const after: SaveGame = {
      ...before,
      players: before.players.map(p =>
        p.id === target.id
          ? { ...p, attributes: { ...p.attributes, cornerSkill: p.attributes.cornerSkill + 3, cornerRecovery: (p.attributes.cornerRecovery ?? 50) + 2 } }
          : p,
      ),
    }
    const rows = captureResolvedChoiceOutcome(before, after)
    expect(rows).toContainEqual({ resource: 'cornerSkill', delta: 3, subjectName: `${target.firstName} ${target.lastName}` })
    expect(rows).toContainEqual({ resource: 'cornerRecovery', delta: 2, subjectName: `${target.firstName} ${target.lastName}` })
  })

  it('fångar moral OCH kondition på samma spelare i samma diff (Codex p5: moral+kondition)', () => {
    const before = baseGame()
    const target = before.players[0]
    const after: SaveGame = {
      ...before,
      players: before.players.map(p =>
        p.id === target.id ? { ...p, morale: p.morale + 5, fitness: p.fitness - 1 } : p,
      ),
    }
    const rows = captureResolvedChoiceOutcome(before, after)
    expect(rows).toContainEqual({ resource: 'morale', delta: 5, subjectName: `${target.firstName} ${target.lastName}` })
    expect(rows).toContainEqual({ resource: 'fitness', delta: -1, subjectName: `${target.firstName} ${target.lastName}` })
  })

  it('rapporterar den verkliga KLAMPADE deltan, inte det deklarerade effektbeloppet (Codex p5: clampad supporter-/ortseffekt)', () => {
    const before = baseGame()
    // Simulerar precis vad gameFlowActions.ts:s Math.max(0, Math.min(100, ...))
    // producerar när ett +8-effekt appliceras nära taket: verkligt utfall +2.
    const afterSupporter: SaveGame = {
      ...before,
      supporterGroup: before.supporterGroup ? { ...before.supporterGroup, mood: 100 } : before.supporterGroup,
    }
    const withNearCapBefore: SaveGame = {
      ...before,
      supporterGroup: before.supporterGroup ? { ...before.supporterGroup, mood: 98 } : before.supporterGroup,
    }
    const rows = captureResolvedChoiceOutcome(withNearCapBefore, afterSupporter)
    expect(rows).toContainEqual({ resource: 'supporterMood', delta: 2 })

    const afterCommunity: SaveGame = { ...before, communityStanding: 0 }
    const withNearFloorBefore: SaveGame = { ...before, communityStanding: 3 }
    const rowsFloor = captureResolvedChoiceOutcome(withNearFloorBefore, afterCommunity)
    expect(rowsFloor).toContainEqual({ resource: 'communityStanding', delta: -3 })
  })
})

describe('DOM_O12_VECKOBESLUT_2026-09-09 — formatWeeklyDecisionOutcome', () => {
  it('formaterar pengar tillsammans med en annan resurs (Codex p5: pengar+annan resurs)', () => {
    const effects: WeeklyDecisionEffect[] = [{ type: 'finances', delta: -3000 }, { type: 'supporterMood', delta: 8 }]
    const deltas = [
      { resource: 'finances' as const, delta: -3000 },
      { resource: 'supporterMood' as const, delta: 8 },
    ]
    expect(formatWeeklyDecisionOutcome(effects, deltas)).toBe(`Kassan −${(3000).toLocaleString('sv-SE')} kr · Klackens stämning +8`)
  })

  it('slumpad lotto: kvittot visar det faktiska rullade utfallet, inte förhandstextens "kan slå åt bägge håll" (Codex p5: slumpad lotto)', () => {
    const upside: WeeklyDecisionEffect[] = [{ type: 'finances', delta: 5_000 }, { type: 'supporterMood', delta: 3 }]
    const upsideDeltas = [
      { resource: 'finances' as const, delta: 5_000 },
      { resource: 'supporterMood' as const, delta: 3 },
    ]
    expect(formatWeeklyDecisionOutcome(upside, upsideDeltas)).toBe(`Kassan +${(5000).toLocaleString('sv-SE')} kr · Klackens stämning +3`)

    const downside: WeeklyDecisionEffect[] = [{ type: 'finances', delta: -1_000 }]
    const downsideDeltas = [{ resource: 'finances' as const, delta: -1_000 }]
    expect(formatWeeklyDecisionOutcome(downside, downsideDeltas)).toBe(`Kassan −${(1000).toLocaleString('sv-SE')} kr`)
  })

  it('noop-effekt utan deltas visar "Ingen effekt" (Codex p5: noop)', () => {
    expect(formatWeeklyDecisionOutcome([{ type: 'noop' }], [])).toBe('Ingen effekt')
  })

  it('scoutNextOpponent har ingen numerisk resurs i diffen — faller tillbaka på den låsta kvalitativa frasen', () => {
    expect(formatWeeklyDecisionOutcome([{ type: 'scoutNextOpponent' }], [])).toBe('du får läsa nästa motståndare')
  })
})
