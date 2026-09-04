import { describe, expect, it } from 'vitest'
import { generateVolunteerRoster, getActiveVolunteerBonus, getVolunteerProfile } from '../volunteerService'

describe('getActiveVolunteerBonus', () => {
  it('ger startgenererade namn en verklig snittroll i stället för noll effekt', () => {
    const roster = generateVolunteerRoster(123, 4)
    const known = roster[0]
    const bonus = getActiveVolunteerBonus([known.name, 'Britt-Marie'], roster)

    const startVolunteer = getVolunteerProfile('Britt-Marie')
    expect(bonus.weeklyIncome).toBe(known.weeklyContrib + startVolunteer.weeklyContrib)
    expect(bonus.csBoostPerRound).toBeCloseTo(known.csBoost / 10 + startVolunteer.csBoost / 10)
  })

  it('klampar den samlade pulsbonusen vid 1,5', () => {
    const bonus = getActiveVolunteerBonus(Array.from({ length: 10 }, (_, i) => `Legacy ${i}`), generateVolunteerRoster(1, 4))
    expect(bonus.csBoostPerRound).toBe(1.5)
  })
})
