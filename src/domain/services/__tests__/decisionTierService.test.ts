/**
 * decisionTierService — HIGH 11 (DOM_HIGH11_DASHBOARD_NIVAER_2026-08-29.md).
 *
 * Tabelldrivet: varje GameEventType enumereras explicit här, mot den
 * dokumenterade klassificeringen. Poängen med dubbleringen är att en
 * omklassificering i servicen ska KRÄVA ett medvetet motsvarande beslut i
 * testet — måste-medlemskapet är Jacobs dom, inte en refaktor-detalj.
 */

import { describe, it, expect } from 'vitest'
import type { GameEvent, GameEventType, DecisionTier, DecisionMode } from '../../entities/GameEvent'
import type { SaveGame } from '../../entities/SaveGame'
import { GAME_EVENT_TYPE_IDS } from '../../data/contentContract'
import {
  getDecisionTier,
  getEventDecisionTier,
  isMustDecision,
  getDecisionMode,
  getEffectiveDecisionMode,
  selectDashboardDecisions,
  getUpcomingMustDeadlines,
  getSeasonDeadlineMatchday,
  FALLBACK_SEASON_DEADLINE_MATCHDAY,
  MUST_DEADLINE_WARNING_ROUNDS,
} from '../decisionTierService'

// ── Dokumenterad klassificering ─────────────────────────────────────────────

const EXPECTED_TIER: Record<GameEventType, DecisionTier> = {
  // MÅSTE — stängd lista (Jacobs dom): kontraktsdeadline + licenskrav.
  // Utökad 2026-09-02 (DOM_BURNOUT_TAK, MUST-TIER-BESLUT) med burnoutCeiling.
  contractRequest: 'must',
  licenseHandlingsplan: 'must',
  burnoutCeiling: 'must',

  // MÅNAD
  sponsorOffer: 'month',
  riskySponsorOffer: 'month',
  icaMaxiEvent: 'month',
  spoksponsor: 'month',
  patronEvent: 'month',
  patronInfluence: 'month',
  patronWithdrawal: 'month',
  mecenatEvent: 'month',
  mecenatInteraction: 'month',
  mecenatDinner: 'month',
  mecenatWithdrawal: 'month',
  hallDebate: 'month',
  hallProcess: 'month',
  kommunMote: 'month',
  politicianEvent: 'month',
  gentjanst: 'month',
  academyEvent: 'month',
  academyDecision: 'month',
  economicStress: 'month',
  criticalEconomy: 'month',
  varsel: 'month',
  transferBidReceived: 'month',
  bidWar: 'month',
  hesitantPlayer: 'month',
  playerUnhappy: 'month',
  detOmojligaValet: 'month',
  playoffEvent: 'month',
  burnoutRelief: 'month',
  // ANSPRÅK 4, spak 3: statiskt 'month'. Den villkorade måste-eskaleringen i
  // domen är INTE byggd (måste-listan är stängd, tier saknar per-instans-
  // åsidosättande) — se decisionTierService.ts.
  communityActivityRenewal: 'month',

  // BAKGRUND
  pressConference: 'background',
  csPress: 'background',
  journalistExclusive: 'background',
  playerMediaComment: 'background',
  communityEvent: 'background',
  supporterEvent: 'background',
  fanLetter: 'background',
  bandyLetter: 'background',
  opponentQuote: 'background',
  starPerformance: 'background',
  playerPraise: 'background',
  captainSpeech: 'background',
  playerArc: 'background',
  dayJobConflict: 'background',
  schoolAssignment: 'background',
  refereeMeeting: 'background',
  retirementCeremony: 'background',
  seasonGoalHalfway: 'background',
  playThroughInjury: 'background',
}

const EXPECTED_MODE: Record<GameEventType, DecisionMode> = {
  licenseHandlingsplan: 'brytpunkt',
  criticalEconomy: 'brytpunkt',
  detOmojligaValet: 'brytpunkt',
  varsel: 'brytpunkt',
  mecenatWithdrawal: 'brytpunkt',
  patronWithdrawal: 'brytpunkt',
  retirementCeremony: 'brytpunkt',
  burnoutCeiling: 'brytpunkt',

  contractRequest: 'dilemma',
  transferBidReceived: 'dilemma',
  bidWar: 'dilemma',
  hesitantPlayer: 'dilemma',
  playerUnhappy: 'dilemma',
  sponsorOffer: 'dilemma',
  riskySponsorOffer: 'dilemma',
  icaMaxiEvent: 'dilemma',
  spoksponsor: 'dilemma',
  patronEvent: 'dilemma',
  patronInfluence: 'dilemma',
  mecenatEvent: 'dilemma',
  mecenatInteraction: 'dilemma',
  mecenatDinner: 'dilemma',
  hallDebate: 'dilemma',
  hallProcess: 'dilemma',
  kommunMote: 'dilemma',
  politicianEvent: 'dilemma',
  gentjanst: 'dilemma',
  academyDecision: 'dilemma',
  economicStress: 'dilemma',
  playThroughInjury: 'dilemma',
  burnoutRelief: 'dilemma',
  communityActivityRenewal: 'dilemma',
  dayJobConflict: 'dilemma',

  pressConference: 'notis',
  csPress: 'notis',
  journalistExclusive: 'notis',
  playerMediaComment: 'notis',
  communityEvent: 'notis',
  supporterEvent: 'notis',
  fanLetter: 'notis',
  bandyLetter: 'notis',
  opponentQuote: 'notis',
  starPerformance: 'notis',
  playerPraise: 'notis',
  captainSpeech: 'notis',
  playerArc: 'notis',
  schoolAssignment: 'notis',
  refereeMeeting: 'notis',
  seasonGoalHalfway: 'notis',
  academyEvent: 'notis',
  playoffEvent: 'notis',
}

// ── Helpers ─────────────────────────────────────────────────────────────────

let idSeq = 0
function evt(type: GameEventType, overrides: Partial<GameEvent> = {}): GameEvent {
  idSeq += 1
  return {
    id: `evt_${idSeq}`,
    type,
    title: 'T',
    body: 'B',
    choices: [{ id: 'c1', label: 'L', effect: { type: 'noOp' } }],
    resolved: false,
    ...overrides,
  }
}

function game(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    pendingEvents: [],
    deferredDecisions: [],
    currentMatchday: 10,
    ...overrides,
  } as unknown as SaveGame
}

// ── Tier ────────────────────────────────────────────────────────────────────

describe('getDecisionTier — täcker varje GameEventType', () => {
  it('klassificerar samtliga typer i contentContracts kanoniska lista', () => {
    for (const id of GAME_EVENT_TYPE_IDS) {
      const type = id as GameEventType
      expect(getDecisionTier(type), `tier saknas/fel för ${type}`).toBe(EXPECTED_TIER[type])
    }
  })

  it('lämnar ingen typ utan nivå', () => {
    for (const id of GAME_EVENT_TYPE_IDS) {
      expect(['must', 'month', 'background']).toContain(getDecisionTier(id as GameEventType))
    }
  })

  it('måste-nivån innehåller EXAKT kontraktsdeadline, licenskrav och burnoutCeiling (Jacobs dom, stängd lista)', () => {
    const musts = GAME_EVENT_TYPE_IDS.filter(id => getDecisionTier(id as GameEventType) === 'must')
    expect([...musts].sort()).toEqual(['burnoutCeiling', 'contractRequest', 'licenseHandlingsplan'])
  })

  it('isMustDecision läser typen, inte prioriteten', () => {
    expect(isMustDecision(evt('contractRequest'))).toBe(true)
    expect(isMustDecision(evt('licenseHandlingsplan'))).toBe(true)
    // criticalEconomy är 'critical' i getEventPriority men inte måste.
    expect(isMustDecision(evt('criticalEconomy'))).toBe(false)
    expect(isMustDecision(evt('fanLetter'))).toBe(false)
  })

  it('getEventDecisionTier speglar typtabellen', () => {
    expect(getEventDecisionTier(evt('sponsorOffer'))).toBe('month')
    expect(getEventDecisionTier(evt('communityEvent'))).toBe('background')
  })
})

// ── Mode ────────────────────────────────────────────────────────────────────

describe('getDecisionMode', () => {
  it('ger dokumenterat typ-default för varje GameEventType', () => {
    for (const id of GAME_EVENT_TYPE_IDS) {
      const type = id as GameEventType
      expect(getDecisionMode(type), `läge saknas/fel för ${type}`).toBe(EXPECTED_MODE[type])
    }
  })

  it('är en SKILD axel från tier — en bakgrund kan vara ett dilemma, en måste ett dilemma', () => {
    expect(getDecisionTier('playThroughInjury')).toBe('background')
    expect(getDecisionMode('playThroughInjury')).toBe('dilemma')
    expect(getDecisionTier('contractRequest')).toBe('must')
    expect(getDecisionMode('contractRequest')).toBe('dilemma')
    expect(getDecisionMode('licenseHandlingsplan')).toBe('brytpunkt')
  })

  it('getEffectiveDecisionMode: per-instans slår typ-default', () => {
    expect(getEffectiveDecisionMode(evt('sponsorOffer'))).toBe('dilemma')
    expect(getEffectiveDecisionMode(evt('sponsorOffer', { mode: 'brytpunkt' }))).toBe('brytpunkt')
    expect(getEffectiveDecisionMode(evt('fanLetter', { mode: 'dilemma' }))).toBe('dilemma')
  })
})

// ── Visningsregeln ──────────────────────────────────────────────────────────

describe('selectDashboardDecisions — ett primärt + ett batchat', () => {
  it('noll väntande beslut → inget kort alls', () => {
    const result = selectDashboardDecisions(game())
    expect(result.primary).toBeNull()
    expect(result.batched).toEqual([])
  })

  it('bara ett månadsbeslut → det blir primärt, inget batchat', () => {
    const a = evt('sponsorOffer')
    const result = selectDashboardDecisions(game({ pendingEvents: [a] }))
    expect(result.primary?.id).toBe(a.id)
    expect(result.batched).toEqual([])
  })

  it('fler än tre månadsbeslut → ETT primärt, resten batchade (aldrig fyra likvärdiga kort)', () => {
    const a = evt('sponsorOffer')
    const b = evt('mecenatEvent')
    const c = evt('kommunMote')
    const d = evt('hallProcess')
    const result = selectDashboardDecisions(game({ pendingEvents: [a, b, c, d] }))
    expect(result.primary?.id).toBe(a.id)
    expect(result.batched.map(e => e.id)).toEqual([b.id, c.id, d.id])
  })

  it('ett måste närvarande → måste tar primärplatsen, HELA månadskön batchas bakom', () => {
    const month = evt('sponsorOffer')
    const must = evt('contractRequest')
    const month2 = evt('mecenatEvent')
    const result = selectDashboardDecisions(game({ pendingEvents: [month, must, month2] }))
    expect(result.primary?.id).toBe(must.id)
    expect(result.batched.map(e => e.id)).toEqual([month.id, month2.id])
  })

  it('två samtidiga måsten → tidigast frist blir primär, den andra trängs inte undan', () => {
    const later = evt('contractRequest', { deadlineRound: 26 })
    const sooner = evt('licenseHandlingsplan', { deadlineRound: 18 })
    const g = game({ pendingEvents: [later, sooner] })
    expect(selectDashboardDecisions(g).primary?.id).toBe(sooner.id)
    // Måsten defereras aldrig — båda ligger kvar i pendingEvents.
    expect((g.pendingEvents ?? []).map(e => e.id)).toEqual([later.id, sooner.id])
  })

  it('bakgrund får ALDRIG ett kort — inte ens som enda väntande beslut', () => {
    const bg1 = evt('communityEvent')
    const bg2 = evt('fanLetter')
    const result = selectDashboardDecisions(game({ pendingEvents: [bg1, bg2] }))
    expect(result.primary).toBeNull()
    expect(result.batched).toEqual([])
  })

  it('bakgrund först i kön hindrar inte månadsbeslutet från att bli primärt', () => {
    const bg = evt('pressConference')
    const month = evt('sponsorOffer')
    const result = selectDashboardDecisions(game({ pendingEvents: [bg, month] }))
    expect(result.primary?.id).toBe(month.id)
  })

  it('event utan val och redan lösta event räknas aldrig som beslut', () => {
    const ambient = evt('seasonGoalHalfway', { choices: [] })
    const done = evt('sponsorOffer', { resolved: true })
    const result = selectDashboardDecisions(game({ pendingEvents: [ambient, done] }))
    expect(result.primary).toBeNull()
  })
})

// ── Frister + förvarning ────────────────────────────────────────────────────

describe('getSeasonDeadlineMatchday', () => {
  it('läser sista matchdagen ur säsongskalendern', () => {
    const g = game({ seasonCalendar: [{ matchday: 1 }, { matchday: 2 }, { matchday: 26 }] as never })
    expect(getSeasonDeadlineMatchday(g)).toBe(26)
  })

  it('faller tillbaka på regelsäsongens längd när kalendern saknas (äldre sparningar)', () => {
    expect(getSeasonDeadlineMatchday(game({ seasonCalendar: undefined }))).toBe(FALLBACK_SEASON_DEADLINE_MATCHDAY)
  })
})

describe('getUpcomingMustDeadlines', () => {
  it('ger måsten inom tröskeln, tidigast frist först', () => {
    const a = evt('contractRequest', { deadlineRound: 24 })
    const b = evt('contractRequest', { deadlineRound: 22 })
    const g = game({ currentMatchday: 21, pendingEvents: [a, b] })
    const result = getUpcomingMustDeadlines(g)
    expect(result.map(d => d.event.id)).toEqual([b.id, a.id])
    expect(result.map(d => d.roundsRemaining)).toEqual([1, 3])
  })

  it('exkluderar frister längre bort än tröskeln', () => {
    const a = evt('contractRequest', { deadlineRound: 26 })
    const g = game({ currentMatchday: 10, pendingEvents: [a] })
    expect(getUpcomingMustDeadlines(g)).toEqual([])
    expect(MUST_DEADLINE_WARNING_ROUNDS).toBe(3)
  })

  it('exkluderar icke-måste, lösta och fristlösa event', () => {
    const g = game({
      currentMatchday: 24,
      pendingEvents: [
        evt('sponsorOffer', { deadlineRound: 25 }),
        evt('contractRequest', { deadlineRound: 25, resolved: true }),
        evt('contractRequest'),  // ingen deadlineRound
      ],
    })
    expect(getUpcomingMustDeadlines(g)).toEqual([])
  })
})
