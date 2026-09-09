import { describe, it, expect } from 'vitest'
import { generatePostAdvanceEvents } from '../postAdvanceEvents'
import { resolveEvent } from '../eventResolver'
import { generateMecenatKravEvent, MECENAT_KRAV_HAPPINESS_THRESHOLD } from '../../mecenatService'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import type { SaveGame } from '../../../entities/SaveGame'
import type { Mecenat } from '../../../entities/Mecenat'
import type { Player } from '../../../entities/Player'

/**
 * SPEC_O1_MECENATENS_KRAV_2026-09-09 — O1-kandidat 1/4 (varsel-mallens 5/5).
 * Text låst av Opus, kopierad ordagrant i mecenatService.ts.
 */

function makeMecenat(overrides: Partial<Mecenat> = {}): Mecenat {
  return {
    id: 'mec1',
    name: 'Björn Lindqvist',
    gender: 'male',
    business: 'Lindqvist Fastigheter AB',
    businessType: 'it_miljonär',
    wealth: 50,
    personality: 'kalkylator',
    influence: 15,
    happiness: 70,
    goodwill: 60,
    contribution: 100000,
    totalContributed: 0,
    demands: [],
    socialExpectations: [],
    isActive: true,
    arrivedSeason: 1,
    silentShout: 0,
    ...overrides,
  }
}

function makeGameWithVeteranAndMecenat(overrides: { mecenatHappiness?: number; noVeteran?: boolean } = {}): SaveGame {
  const template = CLUB_TEMPLATES[0]
  const game = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
  const veteran = game.players.find(p => p.clubId === game.managedClubId)!
  return {
    ...game,
    mecenater: [makeMecenat({ happiness: overrides.mecenatHappiness ?? MECENAT_KRAV_HAPPINESS_THRESHOLD })],
    players: game.players.map(p =>
      p.id === veteran.id ? { ...p, trait: overrides.noVeteran ? undefined : 'veteran', isInjured: false } : p
    ),
  }
}

describe('generateMecenatKravEvent — struktur', () => {
  it('bygger event med rätt id, systemhandelse-fältet satt av anropsstället, och de två låsta valen', () => {
    const mecenat = makeMecenat()
    const player: Player = { id: 'p1', firstName: 'Anders', lastName: 'Berg' } as Player
    const event = generateMecenatKravEvent(mecenat, player, 5)

    expect(event.id).toBe('event_mecenat_krav_mec1_s5')
    expect(event.type).toBe('mecenatEvent')
    expect(event.title).toBe('Björn Lindqvist har en önskan')
    expect(event.relatedPlayerId).toBe('p1')
    expect(event.choices).toHaveLength(2)
    expect(event.choices[0]).toMatchObject({
      id: 'keep',
      label: 'Behåll honom',
      effect: { type: 'mecenatHappiness', targetMecenatId: 'mec1', amount: 12 },
    })
    expect(event.choices[1].id).toBe('let_go')
    expect(event.choices[1].effect.type).toBe('multiEffect')
    const subEffects = JSON.parse(event.choices[1].effect.subEffects!)
    expect(subEffects).toEqual([
      { type: 'releasePlayer', targetPlayerId: 'p1' },
      { type: 'mecenatHappiness', targetMecenatId: 'mec1', amount: -18 },
    ])
  })

  it('texten är den låsta ordalydelsen', () => {
    const mecenat = makeMecenat()
    const player: Player = { id: 'p1', firstName: 'Anders', lastName: 'Berg' } as Player
    const event = generateMecenatKravEvent(mecenat, player, 5)
    expect(event.body).toBe(
      'Över kaffet säger Björn Lindqvist det rakt ut, utan att göra en grej av det: han skulle vilja se Anders Berg få ett år till. Han var med när det var tunnare än nu, och mecenaten har ett gott öga till honom. Det är inget krav han uttalar — men du förstår ändå. Hans välvilja har en form, och det här är den.'
    )
  })
})

describe('mecenatens krav — triggern (generatePostAdvanceEvents)', () => {
  it('triggar när en aktiv mecenat har hög happiness och en veteran finns i truppen', () => {
    const game = makeGameWithVeteranAndMecenat()
    const events = generatePostAdvanceEvents(game, [], 4, () => 0.99)
    expect(events.some(e => e.id.startsWith('event_mecenat_krav_'))).toBe(true)
    const kravEvent = events.find(e => e.id.startsWith('event_mecenat_krav_'))!
    expect(kravEvent.systemhandelse).toBe(true)
  })

  it('triggar INTE om mecenatens happiness är under tröskeln', () => {
    const game = makeGameWithVeteranAndMecenat({ mecenatHappiness: MECENAT_KRAV_HAPPINESS_THRESHOLD - 1 })
    const events = generatePostAdvanceEvents(game, [], 4, () => 0.99)
    expect(events.some(e => e.id.startsWith('event_mecenat_krav_'))).toBe(false)
  })

  it('triggar INTE om ingen spelare i truppen har veteran-traiten', () => {
    const game = makeGameWithVeteranAndMecenat({ noVeteran: true })
    const events = generatePostAdvanceEvents(game, [], 4, () => 0.99)
    expect(events.some(e => e.id.startsWith('event_mecenat_krav_'))).toBe(false)
  })

  it('triggar INTE igen samma säsong (redan resolvad)', () => {
    const game = makeGameWithVeteranAndMecenat()
    const firstPass = generatePostAdvanceEvents(game, [], 4, () => 0.99)
    const kravEvent = firstPass.find(e => e.id.startsWith('event_mecenat_krav_'))!
    const gameAfterResolve: SaveGame = { ...game, resolvedEventIds: [...(game.resolvedEventIds ?? []), kravEvent.id] }
    const secondPass = generatePostAdvanceEvents(gameAfterResolve, [], 4, () => 0.99)
    expect(secondPass.some(e => e.id.startsWith('event_mecenat_krav_'))).toBe(false)
  })
})

describe('mecenatens krav — resolution (resolveEvent)', () => {
  it('"Behåll honom": spelaren stannar i truppen, mecenatHappiness +12, inbox-notis', () => {
    const game = makeGameWithVeteranAndMecenat()
    const veteran = game.players.find(p => p.trait === 'veteran')!
    const event = generateMecenatKravEvent(game.mecenater![0], veteran, game.currentSeason)
    const gameWithEvent: SaveGame = { ...game, pendingEvents: [event] }

    const resolved = resolveEvent(gameWithEvent, event.id, 'keep', () => 0, true)

    expect(resolved.players.find(p => p.id === veteran.id)?.clubId).toBe(game.managedClubId)
    // Mecenatens happiness i fixturen är MECENAT_KRAV_HAPPINESS_THRESHOLD (75) + 12.
    expect(resolved.mecenater!.find(m => m.id === 'mec1')?.happiness).toBe(MECENAT_KRAV_HAPPINESS_THRESHOLD + 12)
    const inboxItem = resolved.inbox.find(i => i.id === `inbox_mecenat_krav_accept_${event.id}`)
    expect(inboxItem).toBeDefined()
    expect(inboxItem!.body).toBe('Björn Lindqvist nickar, nöjd på sitt tysta vis. ' + `${veteran.firstName} ${veteran.lastName}` + ' stannar ett år till, och orten noterar vem som fick bestämma.')
  })

  it('"Låt honom gå": spelaren blir free agent och lämnar truppen, mecenatHappiness −18, inbox-notis', () => {
    const game = makeGameWithVeteranAndMecenat()
    const veteran = game.players.find(p => p.trait === 'veteran')!
    const event = generateMecenatKravEvent(game.mecenater![0], veteran, game.currentSeason)
    const gameWithEvent: SaveGame = { ...game, pendingEvents: [event] }

    const resolved = resolveEvent(gameWithEvent, event.id, 'let_go', () => 0, true)

    expect(resolved.players.find(p => p.id === veteran.id)?.clubId).toBe('free_agent')
    const managedClub = resolved.clubs.find(c => c.id === resolved.managedClubId)!
    expect(managedClub.squadPlayerIds).not.toContain(veteran.id)
    // Mecenatens happiness i fixturen är MECENAT_KRAV_HAPPINESS_THRESHOLD (75) − 18.
    expect(resolved.mecenater!.find(m => m.id === 'mec1')?.happiness).toBe(MECENAT_KRAV_HAPPINESS_THRESHOLD - 18)
    const inboxItem = resolved.inbox.find(i => i.id === `inbox_mecenat_krav_reject_${event.id}`)
    expect(inboxItem).toBeDefined()
    expect(inboxItem!.body).toContain('Men något svalnar.')
  })
})
