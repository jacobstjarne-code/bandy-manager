import { describe, it, expect } from 'vitest'
import { buildSponsorOfferEvent } from '../postAdvanceEvents'
import { resolveEvent } from '../eventResolver'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import type { Sponsor } from '../../../entities/SaveGame'
import type { SaveGame } from '../../../entities/SaveGame'

/**
 * O1 (SLUTTEST_KO.md, DOM_VARSLET_SOM_SYSTEMMALL_2026-08-17.md) —
 * "sponsorn med ett problem". Den vanliga sponsorOffer-händelsen (accept =
 * ren vinst, reject = noOp) blir en konfliktvariant när den nya sponsorn
 * konkurrerar med en redan aktiv sponsor i samma kategori: accept lägger
 * till den nya OCH avslutar rivalen OCH kostar communityStanding.
 */

function baseGame(): SaveGame {
  const template = CLUB_TEMPLATES[0]
  return createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
}

function makeSponsor(overrides: Partial<Sponsor> = {}): Sponsor {
  return {
    id: 'sponsor_rival',
    name: 'Rivalen AB',
    category: 'Bygg',
    weeklyIncome: 800,
    contractRounds: 10,
    signedRound: 1,
    ...overrides,
  }
}

describe('buildSponsorOfferEvent — konfliktdetektering', () => {
  it('ingen rival i samma kategori → plain-varianten, ingen konfliktkostnad', () => {
    const offer = makeSponsor({ id: 'sponsor_new', category: 'Mat' })
    const event = buildSponsorOfferEvent(offer, [makeSponsor({ category: 'Bygg' })], 'Testklubben')

    expect(event.terminateSponsorId).toBeUndefined()
    expect(event.communityStandingDelta).toBeUndefined()
    expect(event.title).toBe(`Sponsorerbjudande — ${offer.name}`)
    expect(event.choices.find(c => c.id === 'accept')!.label).toMatch(/^Acceptera/)
    expect(event.choices.find(c => c.id === 'reject')!.label).toBe('Avslå')
  })

  it('rival i samma kategori → konfliktvarianten, terminateSponsorId pekar på rivalen och texten interpolerar båda namnen', () => {
    const rival = makeSponsor({ id: 'sponsor_rival', category: 'Bygg', name: 'Rivalen AB' })
    const offer = makeSponsor({ id: 'sponsor_new', category: 'Bygg', name: 'Nykomlingen AB', weeklyIncome: 1500 })
    const event = buildSponsorOfferEvent(offer, [rival], 'Testklubben')

    expect(event.terminateSponsorId).toBe('sponsor_rival')
    expect(event.communityStandingDelta).toBeLessThan(0)
    expect(event.title).toBe('Nykomlingen AB vill in')
    expect(event.body).toContain('Nykomlingen AB')
    expect(event.body).toContain('Rivalen AB')
    const accept = event.choices.find(c => c.id === 'accept')!
    const reject = event.choices.find(c => c.id === 'reject')!
    expect(accept.label).toBe('Ta avtalet')
    expect(accept.subtitle).toBe('Rivalen AB var med när det var tunnare än nu. · ⭐ Anseende -6 · Platsen är er i 10 omgångar. Kommer något bättre i vinter får ni tacka nej.')
    expect(reject.label).toBe('Tacka nej')
    expect(reject.subtitle).toBe('Ni behåller det ni har.')
  })

  it('inte systemhandelse — 4/5, inte 5/5 (punkt 2, spelare/funktionär, ouppfylld)', () => {
    const rival = makeSponsor({ id: 'sponsor_rival', category: 'Bygg' })
    const offer = makeSponsor({ id: 'sponsor_new', category: 'Bygg' })
    const event = buildSponsorOfferEvent(offer, [rival], 'Testklubben')

    expect(event.systemhandelse).toBeUndefined()
  })

  it('flera aktiva sponsorer, bara en matchande kategori → rätt rival vald', () => {
    const other = makeSponsor({ id: 'sponsor_other', category: 'Mat' })
    const rival = makeSponsor({ id: 'sponsor_rival', category: 'El' })
    const offer = makeSponsor({ id: 'sponsor_new', category: 'El' })
    const event = buildSponsorOfferEvent(offer, [other, rival], 'Testklubben')

    expect(event.terminateSponsorId).toBe('sponsor_rival')
  })
})

describe('eventResolver — sponsorOffer konfliktvariant', () => {
  it('accept: lägger till nya sponsorn, nollställer rivalens contractRounds, kostar communityStanding', () => {
    let game = baseGame()
    const rival = makeSponsor({ id: 'sponsor_rival', category: 'Bygg', contractRounds: 10 })
    const offer = makeSponsor({ id: 'sponsor_new', category: 'Bygg', weeklyIncome: 1200 })
    const startCS = game.communityStanding ?? 50

    game = {
      ...game,
      sponsors: [rival],
      communityStanding: startCS,
      pendingEvents: [{
        id: 'event_sponsor_test',
        type: 'sponsorOffer',
        title: 'Rivalen AB vill in', body: 'Rivalen AB vill synas på tröjan.',
        choices: [
          { id: 'accept', label: 'Acceptera', effect: { type: 'acceptSponsor', sponsorData: JSON.stringify(offer) } },
          { id: 'reject', label: 'Avslå', effect: { type: 'noOp' } },
        ],
        resolved: false,
        sponsorData: JSON.stringify(offer),
        terminateSponsorId: 'sponsor_rival',
        communityStandingDelta: -6,
      }],
    }

    game = resolveEvent(game, 'event_sponsor_test', 'accept')

    const newSponsor = game.sponsors!.find(s => s.id === 'sponsor_new')
    const rivalAfter = game.sponsors!.find(s => s.id === 'sponsor_rival')
    expect(newSponsor).toBeTruthy()
    expect(newSponsor!.weeklyIncome).toBe(1200)
    expect(rivalAfter!.contractRounds).toBe(0)
    expect(game.communityStanding).toBe(startCS - 6)

    const outcomeItem = game.inbox.find(i => i.id === 'inbox_sponsor_conflict_accept_event_sponsor_test')
    expect(outcomeItem?.body).toBe(`${offer.name} är med från nästa match. ${rival.name} svarade inte i telefon.`)
  })

  it('reject: rivalen orörd, ingen ny sponsor, communityStanding oförändrad', () => {
    let game = baseGame()
    const rival = makeSponsor({ id: 'sponsor_rival', category: 'Bygg', contractRounds: 10 })
    const offer = makeSponsor({ id: 'sponsor_new', category: 'Bygg' })
    const startCS = game.communityStanding ?? 50

    game = {
      ...game,
      sponsors: [rival],
      communityStanding: startCS,
      pendingEvents: [{
        id: 'event_sponsor_test2',
        type: 'sponsorOffer',
        title: 'Rivalen AB vill in', body: 'Rivalen AB vill synas på tröjan.',
        choices: [
          { id: 'accept', label: 'Acceptera', effect: { type: 'acceptSponsor', sponsorData: JSON.stringify(offer) } },
          { id: 'reject', label: 'Avslå', effect: { type: 'noOp' } },
        ],
        resolved: false,
        sponsorData: JSON.stringify(offer),
        terminateSponsorId: 'sponsor_rival',
        communityStandingDelta: -6,
      }],
    }

    game = resolveEvent(game, 'event_sponsor_test2', 'reject')

    expect(game.sponsors!.find(s => s.id === 'sponsor_new')).toBeUndefined()
    expect(game.sponsors!.find(s => s.id === 'sponsor_rival')!.contractRounds).toBe(10)
    expect(game.communityStanding).toBe(startCS)

    const outcomeItem = game.inbox.find(i => i.id === 'inbox_sponsor_conflict_reject_event_sponsor_test2')
    expect(outcomeItem?.body).toBe(`${offer.name} tackade artigt och la på. ${rival.name} fick aldrig veta.`)
  })

  it('regression: plain-varianten (utan terminateSponsorId) beter sig exakt som förut', () => {
    let game = baseGame()
    const offer = makeSponsor({ id: 'sponsor_new', category: 'Bygg' })
    const startCS = game.communityStanding ?? 50

    game = {
      ...game,
      sponsors: [],
      communityStanding: startCS,
      pendingEvents: [{
        id: 'event_sponsor_plain',
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

    const inboxLenBefore = game.inbox.length
    game = resolveEvent(game, 'event_sponsor_plain', 'accept')

    expect(game.sponsors!.find(s => s.id === 'sponsor_new')).toBeTruthy()
    expect(game.communityStanding).toBe(startCS)
    // plain-varianten saknar terminateSponsorId → ingen konflikt-utfallstext
    expect(game.inbox.length).toBe(inboxLenBefore)
  })

  it('communityStanding clampas till 0, dras inte under', () => {
    let game = baseGame()
    const rival = makeSponsor({ id: 'sponsor_rival', category: 'Bygg', contractRounds: 10 })
    const offer = makeSponsor({ id: 'sponsor_new', category: 'Bygg' })

    game = {
      ...game,
      sponsors: [rival],
      communityStanding: 3,
      pendingEvents: [{
        id: 'event_sponsor_clamp',
        type: 'sponsorOffer',
        title: 'Rivalen AB vill in', body: 'Rivalen AB vill synas på tröjan.',
        choices: [
          { id: 'accept', label: 'Acceptera', effect: { type: 'acceptSponsor', sponsorData: JSON.stringify(offer) } },
          { id: 'reject', label: 'Avslå', effect: { type: 'noOp' } },
        ],
        resolved: false,
        sponsorData: JSON.stringify(offer),
        terminateSponsorId: 'sponsor_rival',
        communityStandingDelta: -6,
      }],
    }

    game = resolveEvent(game, 'event_sponsor_clamp', 'accept')

    expect(game.communityStanding).toBe(0)
  })
})
