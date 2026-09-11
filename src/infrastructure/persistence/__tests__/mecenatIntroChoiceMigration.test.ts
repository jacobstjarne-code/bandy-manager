import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { generateMecenatIntroEvent } from '../../../domain/services/mecenatService'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'
import { migrateSaveGame } from '../saveGameMigration'

describe('O12 — mecenatintroduktionens verkliga val', () => {
  it('erbjuder acceptera eller avböj, utan ett strikt sämre försiktigt ja', () => {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 7 })
    const mecenat = game.mecenater![0]

    const event = generateMecenatIntroEvent(mecenat, game.managedClubId)

    expect(event.choices.map(choice => choice.id)).toEqual(['welcome', 'decline'])
    expect(event.choices.some(choice => choice.id === 'cautious')).toBe(false)
  })

  it.each(['pendingEvents', 'deferredDecisions'] as const)(
    'migrerar redan köade intro i %s till samma två val',
    queue => {
      const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 8 })
      const mecenat = game.mecenater![0]
      const legacyIntro = generateMecenatIntroEvent(mecenat, game.managedClubId)
      legacyIntro.choices.splice(1, 0, {
        id: 'cautious',
        label: 'Tack, men vi tar det lugnt',
        effect: { type: 'mecenatHappiness', targetMecenatId: mecenat.id, amount: 5 },
      })
      const raw = JSON.parse(JSON.stringify({
        ...game,
        pendingEvents: [],
        deferredDecisions: [],
        [queue]: [legacyIntro],
      })) as Record<string, unknown>

      const migrated = migrateSaveGame(raw)

      expect(migrated[queue][0].choices.map(choice => choice.id)).toEqual(['welcome', 'decline'])
    },
  )
})
