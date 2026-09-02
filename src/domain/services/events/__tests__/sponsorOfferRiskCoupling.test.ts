/**
 * O2 lager 3 (Jacobs dom 2026-08-24).
 *
 * Plain sponsorOffer (ingen rival) hade tidigare NOLL nedsida — mekaniskt
 * gratis pengar varje gång (O2_PAIRWISE_DOMINANCE_AUDIT_2026-08-23.md).
 * 8% risk (mitten av Jacobs 5–10%-spann) att avtalet ändå visar sig vara
 * riskabelt, samma mognadsmekanik som redan finns för den uttalat riskabla
 * sponsorvarianten (riskySponsorContract/applyRiskySponsorMaturation).
 *
 * communityStanding och kontraktslängd (redan beräknade data) syns nu i
 * accept-subtitlen för båda varianterna.
 */
import { describe, it, expect } from 'vitest'
import { buildSponsorOfferEvent } from '../postAdvanceEvents'
import { resolveEvent } from '../eventResolver'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import type { Sponsor, SaveGame } from '../../../entities/SaveGame'

function baseGame(): SaveGame {
  const template = CLUB_TEMPLATES[0]
  return createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
}

function makeSponsor(overrides: Partial<Sponsor> = {}): Sponsor {
  return {
    id: 'sponsor_new',
    name: 'Nykomlingen AB',
    category: 'Bygg',
    weeklyIncome: 800,
    contractRounds: 10,
    signedRound: 1,
    ...overrides,
  }
}

describe('buildSponsorOfferEvent — synlighetsraden i accept-subtitlen (plain)', () => {
  it('visar totalsumma och den låsta synlighetsraden (normalfall)', () => {
    const offer = makeSponsor({ weeklyIncome: 1000, contractRounds: 12 })
    const event = buildSponsorOfferEvent(offer, [], 'Testklubben', 6)
    const accept = event.choices.find(c => c.id === 'accept')!
    expect(accept.subtitle).toContain('Platsen är er i 12 omgångar. Kommer något bättre i vinter får ni tacka nej.')
  })

  it('sista lediga platsen (maxSponsors nås av detta accept) → "Sista platsen"-varianten', () => {
    const offer = makeSponsor({ weeklyIncome: 1000, contractRounds: 12 })
    const active = [makeSponsor({ id: 'other', category: 'Mat' })]
    const event = buildSponsorOfferEvent(offer, active, 'Testklubben', 2)
    const accept = event.choices.find(c => c.id === 'accept')!
    expect(accept.subtitle).toContain('Sista platsen. Efter det här är det fullt fram till våren.')
  })

  it('maxSponsors utelämnad (bakåtkompatibelt) → normalfallets rad, aldrig "sista platsen"', () => {
    const offer = makeSponsor({ weeklyIncome: 1000, contractRounds: 12 })
    const event = buildSponsorOfferEvent(offer, [], 'Testklubben')
    const accept = event.choices.find(c => c.id === 'accept')!
    expect(accept.subtitle).toContain('Platsen är er i 12 omgångar.')
  })
})

describe('eventResolver — plain sponsorOffer riskkoppling', () => {
  it('under 8%-tröskeln: sätter riskySponsorContract med riskMaturityRound = currentMatchday + 6', () => {
    let game = baseGame()
    const offer = makeSponsor()
    game = {
      ...game,
      sponsors: [],
      riskySponsorContract: undefined,
      pendingEvents: [{
        id: 'event_sponsor_risk',
        type: 'sponsorOffer',
        title: 't', body: 'b',
        choices: [
          { id: 'accept', label: 'Acceptera', effect: { type: 'acceptSponsor', sponsorData: JSON.stringify(offer) } },
          { id: 'reject', label: 'Avslå', effect: { type: 'noOp' } },
        ],
        resolved: false,
        sponsorData: JSON.stringify(offer),
      }],
    }
    game = resolveEvent(game, 'event_sponsor_risk', 'accept', () => 0.01, true)

    expect(game.riskySponsorContract).toBeDefined()
    expect(game.riskySponsorContract!.sponsorId).toBe('sponsor_new')
    expect(game.riskySponsorContract!.riskMaturityRound).toBe(game.currentMatchday + 6)
  })

  it('över 8%-tröskeln: ingen riskySponsorContract sätts', () => {
    let game = baseGame()
    const offer = makeSponsor()
    game = {
      ...game,
      sponsors: [],
      riskySponsorContract: undefined,
      pendingEvents: [{
        id: 'event_sponsor_norisk',
        type: 'sponsorOffer',
        title: 't', body: 'b',
        choices: [
          { id: 'accept', label: 'Acceptera', effect: { type: 'acceptSponsor', sponsorData: JSON.stringify(offer) } },
          { id: 'reject', label: 'Avslå', effect: { type: 'noOp' } },
        ],
        resolved: false,
        sponsorData: JSON.stringify(offer),
      }],
    }
    game = resolveEvent(game, 'event_sponsor_norisk', 'accept', () => 0.5, true)

    expect(game.riskySponsorContract).toBeUndefined()
  })

  it('ett redan pågående riskykontrakt skrivs inte över', () => {
    let game = baseGame()
    const offer = makeSponsor()
    const existing = { sponsorId: 'other_sponsor', riskMaturityRound: 99, acceptedRound: 1, season: game.currentSeason }
    game = {
      ...game,
      sponsors: [],
      riskySponsorContract: existing,
      pendingEvents: [{
        id: 'event_sponsor_already',
        type: 'sponsorOffer',
        title: 't', body: 'b',
        choices: [
          { id: 'accept', label: 'Acceptera', effect: { type: 'acceptSponsor', sponsorData: JSON.stringify(offer) } },
          { id: 'reject', label: 'Avslå', effect: { type: 'noOp' } },
        ],
        resolved: false,
        sponsorData: JSON.stringify(offer),
      }],
    }
    game = resolveEvent(game, 'event_sponsor_already', 'accept', () => 0.01, true)

    expect(game.riskySponsorContract).toEqual(existing)
  })

  it('dedikerade riskySponsorOffer-eventet (annan väg, sätter redan sitt eget kontrakt) dubbel-rullar inte risken', () => {
    let game = baseGame()
    const offer = { ...makeSponsor({ id: 'sponsor_risky', tier: 'risky' as never }), riskMaturityRound: game.currentMatchday + 6 }
    game = {
      ...game,
      sponsors: [],
      riskySponsorContract: undefined,
      pendingEvents: [{
        id: 'event_risky_sponsor',
        type: 'riskySponsorOffer',
        title: 't', body: 'b',
        choices: [
          { id: 'accept', label: 'Acceptera', effect: { type: 'acceptSponsor', sponsorData: JSON.stringify(offer) } },
          { id: 'reject', label: 'Avböj', effect: { type: 'noOp' } },
        ],
        resolved: false,
      }],
    }
    // riskySponsorOffer-eventet hanteras via sitt eget specialfall (event.type
    // === 'riskySponsorOffer') INNAN effect-switchen når 'acceptSponsor' —
    // 8%-grenen i case 'acceptSponsor' körs aldrig för denna väg.
    game = resolveEvent(game, 'event_risky_sponsor', 'accept', () => 0.01, true)

    expect(game.sponsors!.find(s => s.id === 'sponsor_risky')).toBeTruthy()
  })
})
