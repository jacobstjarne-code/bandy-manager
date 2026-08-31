import { describe, it, expect } from 'vitest'
import { resolveEvent } from '../eventResolver'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import type { GameEvent } from '../../../entities/GameEvent'

/**
 * 2.5 (choice-label-svepet, 2026-08-17) — throw-guard-instrumentets förarbete.
 * Innan instrumentet (en simulerad flersäsongskörning som resolvar varje
 * val och fångar throws) kan "fånga hela no-op-klassen mekaniskt" måste
 * vakten själv täcka mer än de fyra ursprungliga fälten (targetPlayerId på
 * boostMorale/makeFullTimePro, targetClubId på teamBoostMorale). Denna svit
 * verifierar var och en av de ~20 nytillagda vakterna en och en — samma
 * "obligatoriskt fält saknas → kasta, inte tystna"-princip, bredare yta.
 * Se docs/CHOICE_LABEL_SVEP_2026-08-17.md och LESSONS.md #45.
 */
function makeGame() {
  const template = CLUB_TEMPLATES[0]
  return createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
}

function pendingWith(effect: unknown, eventOverrides: Partial<GameEvent> = {}): GameEvent {
  return {
    id: 'test_guard_event',
    type: 'test',
    title: 't', body: 'b',
    choices: [{ id: 'go', label: 'Go', effect: effect as never }],
    resolved: false,
    ...eventOverrides,
  }
}

function expectThrows(effect: unknown, pattern: RegExp, eventOverrides: Partial<GameEvent> = {}) {
  const game = { ...makeGame(), pendingEvents: [pendingWith(effect, eventOverrides)] }
  expect(() => resolveEvent(game, 'test_guard_event', 'go', undefined, true)).toThrow(pattern)
}

describe('vakt-svepet — transferbud-effekter kräver bidId', () => {
  it('acceptTransfer utan bidId kastar', () => expectThrows({ type: 'acceptTransfer' }, /bidId/))
  it('rejectTransfer utan bidId kastar', () => expectThrows({ type: 'rejectTransfer', targetPlayerId: 'p1' }, /bidId/))
  it('rejectTransfer utan targetPlayerId kastar', () => expectThrows({ type: 'rejectTransfer', bidId: 'b1' }, /targetPlayerId/))
  it('counterOffer utan bidId kastar', () => expectThrows({ type: 'counterOffer' }, /bidId/))
  it('raiseBid utan bidId kastar', () => expectThrows({ type: 'raiseBid' }, /bidId/))
})

describe('vakt-svepet — spelareffekter kräver targetPlayerId', () => {
  it('extendContract utan targetPlayerId kastar', () => expectThrows({ type: 'extendContract' }, /targetPlayerId/))
  it('rejectContract utan targetPlayerId kastar', () => expectThrows({ type: 'rejectContract' }, /targetPlayerId/))
  it('playThroughInjury utan targetPlayerId kastar', () => expectThrows({ type: 'playThroughInjury' }, /targetPlayerId/))
  // O1 kandidat 2 (Jacobs dom 2026-08-24): extendContract fick en multiEffect-
  // subEffect-gren (veteran_farewell behöver kombinera den med supporterMood)
  // — samma vaktprincip som mecenatHappiness-paret ovan.
  it('multiEffect-subEffect extendContract utan targetPlayerId kastar', () =>
    expectThrows({ type: 'multiEffect', subEffects: JSON.stringify([{ type: 'extendContract', contractYears: 1 }]) }, /targetPlayerId/))
})

describe('vakt-svepet — sponsor/patron-effekter kräver payload + nyckelfält efter parsning', () => {
  it('acceptSponsor utan sponsorData kastar', () => expectThrows({ type: 'acceptSponsor' }, /sponsorData/))
  it('acceptSponsor med sponsorData utan id kastar', () =>
    expectThrows({ type: 'acceptSponsor', sponsorData: JSON.stringify({ name: 'X' }) }, /id/))
  it('acceptSponsor med trasig JSON kastar INTE (parse-fel tystas)', () => {
    const game = { ...makeGame(), pendingEvents: [pendingWith({ type: 'acceptSponsor', sponsorData: '{not json' })] }
    expect(() => resolveEvent(game, 'test_guard_event', 'go', undefined, true)).not.toThrow()
  })
  it('spawnPatron utan patronData/sponsorData kastar', () => expectThrows({ type: 'spawnPatron' }, /patronData/))
  it('spawnPatron med data utan name/business kastar', () =>
    expectThrows({ type: 'spawnPatron', patronData: JSON.stringify({ influence: 50 }) }, /name\/business/))
})

describe('vakt-svepet — community/mecenat/hall-effekter kräver identifierare', () => {
  it('setCommunity utan communityKey kastar', () => expectThrows({ type: 'setCommunity' }, /communityKey/))
  it('mecenatHappiness utan targetMecenatId kastar', () => expectThrows({ type: 'mecenatHappiness' }, /targetMecenatId/))
  it('multiEffect-subEffect mecenatHappiness utan targetMecenatId kastar', () =>
    expectThrows({ type: 'multiEffect', subEffects: JSON.stringify([{ type: 'mecenatHappiness', amount: 5 }]) }, /targetMecenatId/))
  it('hallProcess utan hallProcessData kastar', () => expectThrows({ type: 'hallProcess' }, /hallProcessData/))
})

describe('vakt-svepet — övriga case-specifika obligatoriska fält', () => {
  it('resolveEconomicCrisis med crisisPhase sold_star utan removePlayerId kastar', () =>
    expectThrows({ type: 'resolveEconomicCrisis', crisisPhase: 'sold_star', value: 350000 }, /removePlayerId/))
  it('resolveEconomicCrisis med crisisPhase loan (inget removePlayerId krävs) kastar INTE', () => {
    const game = { ...makeGame(), pendingEvents: [pendingWith({ type: 'resolveEconomicCrisis', crisisPhase: 'loan', value: -300000 })] }
    expect(() => resolveEvent(game, 'test_guard_event', 'go', undefined, true)).not.toThrow()
  })
  it('refereeRelationship utan refereeId kastar', () => expectThrows({ type: 'refereeRelationship', value: 1 }, /refereeId/))
  it('setLegendRole utan legendRole kastar', () =>
    expectThrows({ type: 'setLegendRole' }, /legendRole/, { relatedPlayerId: 'p1' }))
  it('setLegendRole utan event.relatedPlayerId kastar', () =>
    expectThrows({ type: 'setLegendRole', legendRole: 'scout' }, /relatedPlayerId/))
  it('saveBandyLetter utan replyText kastar INTE (arkivera-utan-svar är ett giltigt val)', () => {
    const game = { ...makeGame(), pendingEvents: [pendingWith({ type: 'saveBandyLetter' })] }
    expect(() => resolveEvent(game, 'test_guard_event', 'go', undefined, true)).not.toThrow()
  })
})
