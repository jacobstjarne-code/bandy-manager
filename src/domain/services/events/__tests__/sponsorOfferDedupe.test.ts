import { describe, it, expect } from 'vitest'
import { generatePostAdvanceEvents } from '../postAdvanceEvents'
import { resolveEvent } from '../eventResolver'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import type { SaveGame } from '../../../entities/SaveGame'
import type { GameEvent } from '../../../entities/GameEvent'

/**
 * Medium 1 (Skutskär-auditen, docs/incoming/bandy-manager-skutskaer-audit-52009671-2026-08-20.md):
 * två sponsorerbjudanden ("Bygg AB Nordin", "Skrot & Metall Nordin") kunde
 * ligga direkt efter varandra — activeSponsors räknade bara ACCEPTERADE
 * avtal, ett obesvarat erbjudande spärrade inte ett nytt.
 */

function makeGame(): SaveGame {
  const template = CLUB_TEMPLATES[0]
  return createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
}

function pendingSponsorOffer(): GameEvent {
  return {
    id: 'event_sponsor_existing',
    type: 'sponsorOffer',
    title: 't', body: 'b',
    choices: [
      { id: 'accept', label: 'Acceptera', effect: { type: 'acceptSponsor', sponsorData: '{}' } },
      { id: 'reject', label: 'Avslå', effect: { type: 'noOp' } },
    ],
    resolved: false,
  }
}

function seededRand(seed: number) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

describe('generatePostAdvanceEvents — Medium 1: sponsordedupe', () => {
  it('genererar aldrig ett nytt sponsorOffer-event när ett obesvarat redan ligger i kön', () => {
    const game: SaveGame = { ...makeGame(), pendingEvents: [pendingSponsorOffer()], sponsors: [] }
    for (let i = 0; i < 200; i++) {
      const events = generatePostAdvanceEvents(game, [], 8 + (i % 4), seededRand(i * 7919 + 13))
      expect(events.some(e => e.type === 'sponsorOffer')).toBe(false)
    }
  })

  it('kan fortfarande generera ett sponsorOffer-event när kön är tom', () => {
    const game: SaveGame = { ...makeGame(), pendingEvents: [], sponsors: [] }
    let sawOffer = false
    for (let i = 0; i < 200 && !sawOffer; i++) {
      const events = generatePostAdvanceEvents(game, [], 8 + (i % 4), seededRand(i * 7919 + 13))
      if (events.some(e => e.type === 'sponsorOffer')) sawOffer = true
    }
    expect(sawOffer).toBe(true)
  })

  it('ett REDAN RESOLVAT sponsorOffer-event i pendingEvents spärrar inte ett nytt', () => {
    const resolved = { ...pendingSponsorOffer(), resolved: true }
    const game: SaveGame = { ...makeGame(), pendingEvents: [resolved], sponsors: [] }
    let sawOffer = false
    for (let i = 0; i < 200 && !sawOffer; i++) {
      const events = generatePostAdvanceEvents(game, [], 8 + (i % 4), seededRand(i * 7919 + 13))
      if (events.some(e => e.type === 'sponsorOffer')) sawOffer = true
    }
    expect(sawOffer).toBe(true)
  })
})

/**
 * MEDIUM 15 (audit 2026-08-29): "sponsorernas motbud återställer förhandlingen".
 * Observerat: Granska visade valet som löst, men nästa dashboardcykel gav samma
 * ursprungliga 45-tkr-erbjudande igen. Först ett senare accepterande avslutade det.
 *
 * Rotorsak, i två led:
 *   1. sponsorOffer/riskySponsorOffer resolveras via FYRA tidiga returer i
 *      resolveEvent som går förbi den kanoniska skrivvägen — det enda ställe som
 *      skriver `resolvedEventIds`. Ett besvarat erbjudande lämnade alltså inget
 *      spår som generatorn kunde se.
 *   2. Generatorns enda grind var `hasOpenSponsorOffer` mot `pendingEvents`. När
 *      resolutionen plockade bort eventet därifrån öppnade grinden igen, och
 *      eftersom seeden är deterministisk per matchdag återskapades ett
 *      byte-identiskt erbjudande (samma `sponsor_${round}_${n}`-id) på
 *      managed-matchens andra pass.
 */
describe('generatePostAdvanceEvents — MEDIUM 15: ett besvarat erbjudande återuppstår inte', () => {
  it('genererar inte om ett erbjudande vars id ligger i resolvedEventIds', () => {
    const base = makeGame()
    const clean: SaveGame = { ...base, pendingEvents: [], sponsors: [], resolvedEventIds: [] }

    // Hitta ett (matchdag, seed)-par som faktiskt producerar ett erbjudande.
    let offerId: string | null = null
    let round = 0
    let seed = 0
    for (let i = 0; i < 200 && !offerId; i++) {
      const r = 8 + (i % 4)
      const s = i * 7919 + 13
      const events = generatePostAdvanceEvents(clean, [], r, seededRand(s))
      const offer = events.find(e => e.type === 'sponsorOffer')
      if (offer) { offerId = offer.id; round = r; seed = s }
    }
    expect(offerId).not.toBeNull()

    // Determinismen är själva mekanismen: samma matchdag + samma seed ger
    // samma id igen. Före fixen räckte det för att kortet skulle komma tillbaka.
    const repeat = generatePostAdvanceEvents(clean, [], round, seededRand(seed))
    expect(repeat.find(e => e.type === 'sponsorOffer')?.id).toBe(offerId)

    // Med id:t i resolvedEventIds (som resolutionen numera skriver) spärras det.
    const afterResolve: SaveGame = { ...clean, resolvedEventIds: [offerId!] }
    const again = generatePostAdvanceEvents(afterResolve, [], round, seededRand(seed))
    expect(again.some(e => e.type === 'sponsorOffer')).toBe(false)
  })

  it('ett erbjudande undanträngt till deferredDecisions spärrar ett nytt', () => {
    const game: SaveGame = {
      ...makeGame(),
      pendingEvents: [],
      deferredDecisions: [pendingSponsorOffer()],
      sponsors: [],
    }
    for (let i = 0; i < 200; i++) {
      const events = generatePostAdvanceEvents(game, [], 8 + (i % 4), seededRand(i * 7919 + 13))
      expect(events.some(e => e.type === 'sponsorOffer')).toBe(false)
    }
  })
})

/**
 * MEDIUM 15, led 1 isolerat: resolutionen måste lämna ett spår i resolvedEventIds.
 * De fyra sponsorreturerna i resolveEvent gick förbi den kanoniska skrivvägen.
 */
describe('resolveEvent — sponsorbesluten skriver resolvedEventIds', () => {
  const sponsorData = JSON.stringify({
    id: 'sponsor_8_123', name: 'Testbolaget', category: 'bygg',
    weeklyIncome: 4500, contractRounds: 10, signedRound: 8,
  })

  function gameWith(event: GameEvent): SaveGame {
    return { ...makeGame(), pendingEvents: [event], sponsors: [], resolvedEventIds: [] }
  }

  function offerEvent(type: 'sponsorOffer' | 'riskySponsorOffer'): GameEvent {
    return {
      id: `event_sponsor_${type}_x`,
      type, title: 't', body: 'b',
      sponsorData: type === 'sponsorOffer' ? sponsorData : undefined,
      choices: [
        { id: 'accept', label: 'Acceptera', effect: { type: 'acceptSponsor', sponsorData } },
        { id: 'reject', label: 'Avslå', effect: { type: 'noOp' } },
      ],
      resolved: false,
    } as GameEvent
  }

  for (const type of ['sponsorOffer', 'riskySponsorOffer'] as const) {
    for (const choiceId of ['accept', 'reject'] as const) {
      it(`${type} / ${choiceId} lämnar eventets id i resolvedEventIds`, () => {
        const event = offerEvent(type)
        const after = resolveEvent(gameWith(event), event.id, choiceId, () => 0.99, true)
        expect(after.resolvedEventIds ?? []).toContain(event.id)
        expect((after.pendingEvents ?? []).some(e => e.id === event.id)).toBe(false)
      })
    }
  }
})
