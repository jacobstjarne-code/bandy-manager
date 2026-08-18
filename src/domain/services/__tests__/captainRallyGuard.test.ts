import { describe, it, expect } from 'vitest'
import { detectArcTriggers } from '../arcService'
import { generatePostAdvanceEvents } from '../events/postAdvanceEvents'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../worldGenerator'
import { FixtureStatus } from '../../enums'
import type { SaveGame } from '../../entities/SaveGame'
import type { ActiveArc } from '../../entities/Narrative'

/**
 * 4.6 (SLUTTEST_KO.md, 2026-08-17) — "dubbla kaptensevent". postAdvanceEvents.ts:s
 * captainSpeech-event och arcService.ts:s ledare_crisis-arc triggar båda på
 * 3+ förluster i rad och producerar båda en captain_rallied_team-storyline.
 * Byggda oberoende, kunde båda fyra samma säsong. captainRallyGuard.ts är
 * den delade spärren.
 */
function makeGameWithLossStreak(): SaveGame {
  const template = CLUB_TEMPLATES[0]
  const game = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
  const opponent = game.clubs.find(c => c.id !== game.managedClubId)!
  const managedLeagueFixtures = game.fixtures.filter(
    f => f.leagueId && !f.isCup && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
  ).slice(0, 3)

  const lostFixtures = managedLeagueFixtures.map((f, i) => {
    const managedIsHome = f.homeClubId === game.managedClubId
    return {
      ...f,
      status: FixtureStatus.Completed,
      roundNumber: i + 1,
      homeScore: managedIsHome ? 0 : 3,
      awayScore: managedIsHome ? 3 : 0,
    }
  })

  const veteran = game.players.find(p => p.clubId === game.managedClubId)!
  return {
    ...game,
    fixtures: [
      ...game.fixtures.filter(f => !lostFixtures.some(lf => lf.id === f.id)),
      ...lostFixtures,
    ],
    players: game.players.map(p =>
      p.id === veteran.id ? { ...p, trait: 'veteran' as const, morale: 80 } : p
    ),
    captainPlayerId: veteran.id,
    clubs: game.clubs, // opponent unused beyond existence check
  }
}

describe('captainRallyGuard — de två systemen utesluter varandra samma säsong', () => {
  it('ledare_crisis-arcen triggar INTE om captainSpeech redan resolvats denna säsong', () => {
    const game = makeGameWithLossStreak()
    const gameWithSpeechDone: SaveGame = {
      ...game,
      resolvedEventIds: [...(game.resolvedEventIds ?? []), `event_captain_speech_s${game.currentSeason}`],
    }
    const newArcs = detectArcTriggers(gameWithSpeechDone)
    expect(newArcs.some(a => a.type === 'ledare_crisis')).toBe(false)
  })

  it('ledare_crisis-arcen TRIGGAR om inget av systemen engagerats än (kontrollfall)', () => {
    const game = makeGameWithLossStreak()
    const newArcs = detectArcTriggers(game)
    expect(newArcs.some(a => a.type === 'ledare_crisis')).toBe(true)
  })

  it('captainSpeech-eventet triggar INTE om en ledare_crisis-arc redan är aktiv denna säsong', () => {
    const game = makeGameWithLossStreak()
    const arc: ActiveArc = {
      id: 'arc_existing',
      type: 'ledare_crisis',
      playerId: game.players.find(p => p.clubId === game.managedClubId)!.id,
      startedMatchday: 1,
      phase: 'building',
      eventsFired: [],
      decisionsMade: [],
      expiresMatchday: 40,
    }
    const gameWithArc: SaveGame = { ...game, activeArcs: [arc] }
    const events = generatePostAdvanceEvents(gameWithArc, [], 4, () => 0.99)
    expect(events.some(e => e.type === 'captainSpeech')).toBe(false)
  })
})
