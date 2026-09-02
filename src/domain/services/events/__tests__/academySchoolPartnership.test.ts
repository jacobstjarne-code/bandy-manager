import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { processYouth } from '../../../../application/useCases/processors/youthProcessor'
import { generateAcademySchoolPartnershipEvent } from '../../academySchoolPartnershipService'
import { getDecisionTier, getEffectiveDecisionMode } from '../../decisionTierService'
import { getRolloverPolicy } from '../../deferredRolloverService'
import { classifyEventNature } from '../../granskaEventClassifier'
import { resolveEvent } from '../eventResolver'

function gameWithAdvancedBandySchool() {
  const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2026, seed: 17 })
  return {
    ...game,
    currentMatchday: 15,
    communityStanding: 60,
    communityActivities: {
      ...game.communityActivities!,
      bandySchool: true,
    },
  }
}

function queuedDecision() {
  const game = gameWithAdvancedBandySchool()
  const event = generateAcademySchoolPartnershipEvent(game, 16, 123)!
  return { game: { ...game, pendingEvents: [event] }, event }
}

describe('C-T6 bandyskola → P19', () => {
  it('skapar ett årligt beslut med tre frysta kandidater bara för aktiv avancerad bandyskola', () => {
    const game = gameWithAdvancedBandySchool()
    const event = generateAcademySchoolPartnershipEvent(game, 16, 123)

    expect(event?.schoolIntakeCandidates).toHaveLength(3)
    expect(event?.schoolIntakeCandidates?.every(player => player.id.startsWith('youth_bandy_school_2026_'))).toBe(true)
    expect(getDecisionTier(event!.type)).toBe('month')
    expect(getEffectiveDecisionMode(event!)).toBe('dilemma')
    expect(classifyEventNature(event!)).toBe('critical')
    expect(getRolloverPolicy(event!.type)).toBe('expire')
    expect(generateAcademySchoolPartnershipEvent(game, 15, 123)).toBeNull()
    expect(generateAcademySchoolPartnershipEvent({
      ...game,
      communityActivities: { ...game.communityActivities!, bandySchool: false },
    }, 16, 123)).toBeNull()
    expect(generateAcademySchoolPartnershipEvent({
      ...game,
      resolvedEventIds: [event!.id],
    }, 16, 123)).toBeNull()
  })

  it('är wirat i den ordinarie P19-processorn på matchdag 16', () => {
    const game = gameWithAdvancedBandySchool()
    const result = processYouth(game, game.players, 16, '2026-12-01', 900, () => 0.9)

    expect(result.gameEvents.some(event => event.id === 'event_academy_school_partnership_2026')).toBe(true)
  })

  it('alla tre lägger exakt kandidaterna i P19 och debiterar 8 tkr', () => {
    const { game, event } = queuedDecision()
    const beforeCount = game.youthTeam!.players.length
    const beforeFinances = game.clubs.find(club => club.id === game.managedClubId)!.finances

    const result = resolveEvent(game, event.id, 'take_all', () => 0, true)

    expect(result.youthTeam!.players).toHaveLength(beforeCount + 3)
    expect(result.youthTeam!.players.slice(-3).map(player => player.id))
      .toEqual(event.schoolIntakeCandidates!.map(player => player.id))
    expect(result.clubs.find(club => club.id === result.managedClubId)!.finances).toBe(beforeFinances - 8_000)
    expect(result.financeLog.at(-1)?.amount).toBe(-8_000)
  })

  it('de två bästa väljer högst potential ur den frysta trion och debiterar 5 tkr', () => {
    const { game, event } = queuedDecision()
    const beforeCount = game.youthTeam!.players.length
    const expectedIds = [...event.schoolIntakeCandidates!]
      .sort((a, b) => b.potentialAbility - a.potentialAbility || b.currentAbility - a.currentAbility)
      .slice(0, 2)
      .map(player => player.id)

    const result = resolveEvent(game, event.id, 'take_best', () => 0, true)

    expect(result.youthTeam!.players).toHaveLength(beforeCount + 2)
    expect(result.youthTeam!.players.slice(-2).map(player => player.id)).toEqual(expectedIds)
    expect(result.financeLog.at(-1)?.amount).toBe(-5_000)
  })

  it('grannklubben ger engångsersättning och sänker CS utan att lägga till P19-spelare', () => {
    const { game, event } = queuedDecision()
    const beforeCount = game.youthTeam!.players.length
    const beforeFinances = game.clubs.find(club => club.id === game.managedClubId)!.finances

    const result = resolveEvent(game, event.id, 'send_neighbor', () => 0, true)

    expect(result.youthTeam!.players).toHaveLength(beforeCount)
    expect(result.clubs.find(club => club.id === result.managedClubId)!.finances).toBe(beforeFinances + 8_000)
    expect(result.communityStanding).toBe(55)
    expect(result.financeLog.at(-1)?.amount).toBe(8_000)
  })
})
