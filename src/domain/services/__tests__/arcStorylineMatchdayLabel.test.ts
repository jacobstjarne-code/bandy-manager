import { describe, it, expect } from 'vitest'
import { progressArcs } from '../arcService'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../worldGenerator'
import type { ActiveArc } from '../../entities/Narrative'
import { FixtureStatus } from '../../enums'

/**
 * 4.6 (SLUTTEST_KO.md, 2026-08-17) — arc-storylines satte matchday: currentMatchday
 * (den GLOBALA matchday-parametern progressArcs tar emot från roundProcessor.ts,
 * kan bli 27+ under slutspel). SeasonSummaryScreen.tsx renderar storyline.matchday
 * som "O{round}" och antar en ligaomgång (1-22) — en arc-storyline som avgjordes
 * under slutspelet visade "O33" (eller högre) innan denna fix.
 */
describe('progressArcs — storyline.matchday är en ligaomgång, inte det globala matchday-parametervärdet', () => {
  it("ledare_crisis-arcens captain_rallied_team-storyline håller sig inom ligaspannet trots ett slutspels-matchday", () => {
    const template = CLUB_TEMPLATES[0]
    let game = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
    const captain = game.players.find(p => p.clubId === game.managedClubId)!

    // Regelbunden säsong, 22 avklarade ligaomgångar — getCurrentLeagueRound ska ge 22.
    const leagueFixtures = game.fixtures
      .filter(f => f.leagueId && !f.isCup)
      .slice(0, 22)
      .map((f, i) => ({ ...f, status: FixtureStatus.Completed, roundNumber: i + 1, homeScore: 2, awayScore: 1 }))
    game = { ...game, fixtures: [...game.fixtures.filter(f => !leagueFixtures.some(lf => lf.id === f.id)), ...leagueFixtures] }

    const arc: ActiveArc = {
      id: 'arc_ledare_test',
      type: 'ledare_crisis',
      playerId: captain.id,
      subject: `${captain.firstName[0]}. ${captain.lastName}`,
      startedMatchday: 20,
      phase: 'resolving',
      eventsFired: [],
      decisionsMade: [],
      expiresMatchday: 40,
    }
    game = { ...game, activeArcs: [arc] }

    // Slutspelets globala matchday — inte en ligaomgång.
    const GLOBAL_PLAYOFF_MATCHDAY = 33
    const result = progressArcs(game, GLOBAL_PLAYOFF_MATCHDAY, undefined)

    const storyline = result.newStorylines.find(s => s.type === 'captain_rallied_team')
    expect(storyline).toBeTruthy()
    expect(storyline!.matchday).toBe(22)
    expect(storyline!.matchday).not.toBe(GLOBAL_PLAYOFF_MATCHDAY)
  })
})
