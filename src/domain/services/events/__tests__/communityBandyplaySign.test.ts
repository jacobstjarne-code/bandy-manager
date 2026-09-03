import { describe, it, expect } from 'vitest'
import { generateCommunityActivitiesEvents } from '../communityActivitiesEvents'
import { resolveEvent } from '../eventResolver'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'

/**
 * 2.5 (choice-label-svepet, 2026-08-17) — community_bandyplay 'start' hade
 * omkastat tecken: texten lovar en kostnad ("💰 -5 tkr"), koden gav en vinst
 * (amount: 6000 → +6000 kr). Se LESSONS.md och CHOICE_LABEL_SVEP_2026-08-17.md.
 */
describe('community_bandyplay — tecknet ska matcha texten (kostnad, inte vinst)', () => {
  it("'start'-valets effekt är en kostnad (negativt belopp), inte en vinst", () => {
    const template = CLUB_TEMPLATES[0]
    const game = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
    const events = generateCommunityActivitiesEvents(game, 2, new Set(), () => 0.5)
    const bandyplayEvent = events.find(e => e.id === 'community_bandyplay')!
    const startChoice = bandyplayEvent.choices.find(c => c.id === 'start')!

    expect(startChoice.effect.amount).toBeLessThan(0)
  })

  it("att resolva 'start' drar av pengar från klubbkassan, höjer den inte", () => {
    const template = CLUB_TEMPLATES[0]
    let game = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
    const events = generateCommunityActivitiesEvents(game, 2, new Set(), () => 0.5)
    const bandyplayEvent = events.find(e => e.id === 'community_bandyplay')!
    game = { ...game, pendingEvents: [bandyplayEvent] }

    const clubBefore = game.clubs.find(c => c.id === game.managedClubId)!
    game = resolveEvent(game, bandyplayEvent.id, 'start', undefined, true)
    const clubAfter = game.clubs.find(c => c.id === game.managedClubId)!

    expect(clubAfter.finances).toBeLessThan(clubBefore.finances)
    expect(game.communityActivities?.bandySchoolBasic).toBe(true)
    expect(game.communityActivities?.bandyplay).toBe(false)
  })
})
