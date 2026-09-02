import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import { generateCharacterPlayerEvents } from '../../characterPlayerService'
import { generateCommunityActivitiesEvents } from '../communityActivitiesEvents'
import { resolveEvent } from '../eventResolver'

function makeGame() {
  return createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
}

describe('communityEvent — text och deklarerad state-effekt håller ihop', () => {
  it('"Utse till kapten" sätter captainPlayerId och ger utlovat samhällsstöd', () => {
    const base = makeGame()
    const leader = {
      ...base.players.find(player => player.clubId === base.managedClubId)!,
      isCharacterPlayer: true,
      trait: 'ledare' as const,
    }
    const events = generateCharacterPlayerEvents([leader], 2, new Set(), () => 0, undefined)
    const event = events.find(candidate => candidate.id === `captain_${leader.id}`)!
    const beforeStanding = base.communityStanding ?? 50

    const result = resolveEvent({
      ...base,
      captainPlayerId: undefined,
      players: base.players.map(player => player.id === leader.id ? leader : player),
      pendingEvents: [event],
    }, event.id, 'yes', undefined, true)

    expect(result.captainPlayerId).toBe(leader.id)
    expect(result.communityStanding).toBe(Math.min(100, beforeStanding + 2))
  })

  it('fikakvällen kostar 500 kr och ger exakt +8 fanMood som kortet säger', () => {
    const base = { ...makeGame(), fanMood: 50 }
    const event = generateCommunityActivitiesEvents(base, 9, new Set(), () => 0)
      .find(candidate => candidate.id === 'community_fikakväll')!
    const before = base.clubs.find(club => club.id === base.managedClubId)!.finances

    const result = resolveEvent({ ...base, pendingEvents: [event] }, event.id, 'fika', undefined, true)

    expect(event.choices[0].subtitle).toBe('💰 -500 kr · 💛 +8 fanMood')
    expect(result.clubs.find(club => club.id === base.managedClubId)?.finances).toBe(before - 500)
    expect(result.fanMood).toBe(58)
  })

  it('bilbingo ger både 20 000 kr och de +5 fanMood som undertexten lovar', () => {
    const base = { ...makeGame(), fanMood: 50 }
    const event = generateCommunityActivitiesEvents(base, 14, new Set(), () => 0)
      .find(candidate => candidate.id === 'community_bilbingo')!
    const before = base.clubs.find(club => club.id === base.managedClubId)!.finances

    const result = resolveEvent({ ...base, pendingEvents: [event] }, event.id, 'go', undefined, true)

    expect(result.clubs.find(club => club.id === base.managedClubId)?.finances).toBe(before + 20000)
    expect(result.fanMood).toBe(55)
  })

  it('faciliteter kan inte gå under noll när ismaskin eller renoveringsväntan slår', () => {
    const base = makeGame()
    const event = generateCommunityActivitiesEvents(base, 16, new Set(), () => 0)
      .find(candidate => candidate.id === 'community_anlaggning')!
    const game = {
      ...base,
      clubs: base.clubs.map(club => club.id === base.managedClubId ? { ...club, facilities: 2 } : club),
      pendingEvents: [event],
    }

    const result = resolveEvent(game, event.id, 'wait', undefined, true)

    expect(result.clubs.find(club => club.id === base.managedClubId)?.facilities).toBe(0)
  })
})
