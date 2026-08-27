import { describe, it, expect } from 'vitest'
import { generatePostAdvanceEvents } from '../postAdvanceEvents'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import { FixtureStatus } from '../../../enums'
import type { SaveGame } from '../../../entities/SaveGame'

/**
 * H1-uppföljning (människoupplevelse-audit 7024f8a, 2026-08-24). Ersätter
 * captainRallyGuard.test.ts (raderad samma pass) — den testade reconciliering
 * mellan captainSpeech och arcService.ts:s ledare_crisis (nu borttagen,
 * Jacobs dom: captainSpeech är kanon). Kvarvarande verkligt beteende att
 * skydda: matchday-sorteringen (H2-fixet) och säsongsscopad dedup via
 * alreadyQueued (pendingEvents+resolvedEventIds), inte längre en separat
 * guard-fil.
 */
function makeGameWithLossStreak(overrides: { cupLossesInstead?: boolean } = {}): SaveGame {
  const template = CLUB_TEMPLATES[0]
  const game = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
  const managedLeagueFixtures = game.fixtures.filter(
    f => f.leagueId && (overrides.cupLossesInstead ? f.isCup : !f.isCup)
      && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
  ).slice(0, 3)

  const lostFixtures = managedLeagueFixtures.map((f, i) => {
    const managedIsHome = f.homeClubId === game.managedClubId
    return {
      ...f,
      status: FixtureStatus.Completed,
      matchday: i + 1,
      homeScore: managedIsHome ? 0 : 3,
      awayScore: managedIsHome ? 3 : 0,
    }
  })

  const captain = game.players.find(p => p.clubId === game.managedClubId)!
  return {
    ...game,
    fixtures: [
      ...game.fixtures.filter(f => !lostFixtures.some(lf => lf.id === f.id)),
      ...lostFixtures,
    ],
    players: game.players.map(p =>
      p.id === captain.id ? { ...p, morale: 80, age: 28, currentAbility: 60 } : p
    ),
    captainPlayerId: captain.id,
  }
}

describe('captainSpeech — säsongsdedup och matchday-ordning (H1-uppföljning)', () => {
  it('triggar på 3 ligaförluster i rad', () => {
    const game = makeGameWithLossStreak()
    const events = generatePostAdvanceEvents(game, [], 4, () => 0.99)
    expect(events.some(e => e.type === 'captainSpeech')).toBe(true)
  })

  it('triggar INTE om samma säsongs event redan är resolvat', () => {
    const game = makeGameWithLossStreak()
    const gameWithSpeechDone: SaveGame = {
      ...game,
      resolvedEventIds: [...(game.resolvedEventIds ?? []), `event_captain_speech_s${game.currentSeason}`],
    }
    const events = generatePostAdvanceEvents(gameWithSpeechDone, [], 4, () => 0.99)
    expect(events.some(e => e.type === 'captainSpeech')).toBe(false)
  })

  it('triggar INTE på 3 cupförluster (räknar bara liga, samma som !f.isCup-filtret)', () => {
    const game = makeGameWithLossStreak({ cupLossesInstead: true })
    const events = generatePostAdvanceEvents(game, [], 4, () => 0.99)
    expect(events.some(e => e.type === 'captainSpeech')).toBe(false)
  })
})
