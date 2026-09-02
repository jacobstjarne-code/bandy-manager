import { describe, expect, it } from 'vitest'
import {
  CS_PRESS_CAUSE_QUESTIONS,
  csPressCauseIsRelevant,
  pickCSPressQuestionSelection,
} from '../csPressEventText'

const player = { id: 'player_1', firstName: 'Bo', lastName: 'Berg' }
const memory = {
  season: 2026,
  matchday: 8,
  questionId: 'cs_neutral_2',
  answerId: 'team',
} as const

describe('C-SY1 Pilot 2 — csPress orsakskrok', () => {
  it('kräver samma säsong, färskhet och både fråge- och svarsidentitet', () => {
    expect(csPressCauseIsRelevant(memory, 2026, 9)).toBe(true)
    expect(csPressCauseIsRelevant(memory, 2026, 16)).toBe(true)
    expect(csPressCauseIsRelevant(memory, 2026, 17)).toBe(false)
    expect(csPressCauseIsRelevant(memory, 2027, 9)).toBe(false)
    expect(csPressCauseIsRelevant({ ...memory, questionId: undefined }, 2026, 9)).toBe(false)
    expect(csPressCauseIsRelevant({ ...memory, answerId: undefined }, 2026, 9)).toBe(false)
  })

  it('doserar den strukturerade återkopplingen till ungefär 35 procent', () => {
    let causeCount = 0
    for (let index = 0; index < 1000; index++) {
      const selection = pickCSPressQuestionSelection(
        player,
        `fixture_${index}`,
        50,
        2026,
        12,
        memory,
      )
      if (selection.referencesPreviousAnswer) causeCount++
    }

    expect(causeCount).toBeGreaterThanOrEqual(320)
    expect(causeCount).toBeLessThanOrEqual(380)
  })

  it('återkopplar till det verkliga föregående svaret och bär egen frågeidentitet', () => {
    const fixtureId = Array.from({ length: 100 }, (_, index) => `cause_fixture_${index}`)
      .find(id => pickCSPressQuestionSelection(player, id, 50, 2026, 12, memory).referencesPreviousAnswer)
    expect(fixtureId).toBeDefined()

    const selection = pickCSPressQuestionSelection(player, fixtureId!, 50, 2026, 12, memory)
    expect(selection.id).toMatch(/^cs_cause_team_/)
    expect(CS_PRESS_CAUSE_QUESTIONS.team).toContain(selection.text)
  })

  it('äldre minnesposter utan identiteter ger alltid vanlig relationsstyrd fråga', () => {
    for (let index = 0; index < 100; index++) {
      const selection = pickCSPressQuestionSelection(
        player,
        `legacy_fixture_${index}`,
        50,
        2026,
        12,
        { season: 2026, matchday: 8 },
      )
      expect(selection.referencesPreviousAnswer).toBe(false)
      expect(selection.id).toMatch(/^cs_neutral_/)
    }
  })
})
