import { describe, it, expect } from 'vitest'
import { createNewGame } from '../createNewGame'
import { switchManagedClub } from '../switchManagedClub'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'

/**
 * DOM_MANAGER_ATERKOMST_2026-09-08: karriärhändelsen "du tar en klubb du
 * tränat förr" hör i liggaren (skedde vid signeringen), inte som ett
 * state-undantag pushadaptern läser direkt. Producent: switchManagedClub.ts.
 */
function makeGame(seed = 1) {
  const club = CLUB_TEMPLATES[0]
  return { ...createNewGame({ managerName: 'Test Manager', clubId: club.id, seed }), pendingScreen: null }
}

describe('switchManagedClub — manager_return-liggarpost', () => {
  it('vanligt klubbyte till en ALDRIG tidigare tränad klubb skriver ingen manager_return-post', () => {
    const game = makeGame()
    const [, second] = CLUB_TEMPLATES
    const switched = switchManagedClub(game, second.id)
    expect(switched.eventLedger?.some(e => e.type === 'manager_return')).toBe(false)
  })

  it('återkomst till en tidigare tränad klubb skriver en manager_return-post med subject=klubben', () => {
    const game = makeGame()
    const first = CLUB_TEMPLATES[0]
    const second = CLUB_TEMPLATES[1]
    const away = switchManagedClub(game, second.id)
    const back = switchManagedClub(away, first.id)

    const entry = back.eventLedger?.find(e => e.type === 'manager_return')
    expect(entry).toBeDefined()
    expect(entry).toMatchObject({
      type: 'manager_return',
      clubId: first.id,
      managerId: game.id,
      season: back.currentSeason,
      matchday: 0,
      subject: { kind: 'club', id: first.id },
    })
    expect(entry?.semanticKey).toBe(`manager_return_${first.id}_s${back.currentSeason}`)
    expect(typeof entry?.significance).toBe('number')
  })

  it('ett tredje klubbyte till en klubb som aldrig tränats förr skriver INTE en manager_return-post', () => {
    const game = makeGame()
    const first = CLUB_TEMPLATES[0]
    const second = CLUB_TEMPLATES[1]
    const third = CLUB_TEMPLATES[2]
    const away = switchManagedClub(game, second.id)
    const back = switchManagedClub(away, first.id)
    const elsewhere = switchManagedClub(back, third.id)

    const newEntries = (elsewhere.eventLedger ?? []).filter(e => e.type === 'manager_return')
    // Bara den tidigare återkomsten (till `first`) finns kvar — inget nytt tillkommer för `third`.
    expect(newEntries).toHaveLength(1)
    expect(newEntries[0].clubId).toBe(first.id)
  })

  it('saknar managerProfile (legacy save) — kraschar inte, skriver ingen post', () => {
    const game = { ...makeGame(), managerProfile: undefined }
    const second = CLUB_TEMPLATES[1]
    expect(() => switchManagedClub(game, second.id)).not.toThrow()
    const switched = switchManagedClub(game, second.id)
    expect(switched.eventLedger?.some(e => e.type === 'manager_return')).toBe(false)
  })
})

describe('switchManagedClub — manager_appointed-liggarpost (DOM_STYRELSEMOTE_NY_KLUBB_2026-09-10, tillstånd N)', () => {
  it('varje klubbyte skriver en manager_appointed-post, oavsett om klubben tränats förr', () => {
    const game = makeGame()
    const second = CLUB_TEMPLATES[1]
    const switched = switchManagedClub(game, second.id)

    const entry = switched.eventLedger?.find(e => e.type === 'manager_appointed')
    expect(entry).toMatchObject({
      type: 'manager_appointed',
      clubId: second.id,
      managerId: game.id,
      season: switched.currentSeason,
      matchday: 0,
      subject: { kind: 'club', id: second.id },
    })
    expect(entry?.semanticKey).toBe(`manager_appointed_${second.id}_s${switched.currentSeason}`)
  })

  it('en återkomst skriver BÅDA posterna — manager_appointed OCH manager_return', () => {
    const game = makeGame()
    const first = CLUB_TEMPLATES[0]
    const second = CLUB_TEMPLATES[1]
    const away = switchManagedClub(game, second.id)
    const back = switchManagedClub(away, first.id)

    const appointed = back.eventLedger?.filter(e => e.type === 'manager_appointed' && e.clubId === first.id)
    const returned = back.eventLedger?.filter(e => e.type === 'manager_return' && e.clubId === first.id)
    expect(appointed).toHaveLength(1)
    expect(returned).toHaveLength(1)
  })
})
