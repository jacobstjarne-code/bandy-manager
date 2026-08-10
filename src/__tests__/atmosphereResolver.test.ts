/**
 * atmosphereResolver — PORTAL-TAKREGEL (2026-08-09), reviderad AUDIT DEL 2
 * (2026-08-09).
 *
 * Kärnkravet: budgeten (ATMOSPHERE_CAP) ska gälla atmosfärslagret, i
 * prioritetsordning (anniversary > upptakt > spectator > beat > phasemark >
 * situation), och "demoted" ska bara innehålla marks som FAKTISKT hade något
 * att säga men förlorade mot taket — inte ineligible marks (de syns
 * ingenstans). PhaseMark tillkom i revideringen (Jacobs ruling: den bär
 * redaktionell text och är atmosfär, inte kronologi — RoundMark, som ÄR ren
 * kronologi, flyttades till GameHeader.tsx istället och är inte längre en
 * atmosfärsmark alls).
 */
import { describe, it, expect } from 'vitest'
import {
  hasUpptaktContent, hasAnniversaryContent, hasSpectatorContent, hasPhaseMarkContent,
  selectAtmosphereMarks, ATMOSPHERE_CAP,
} from '../domain/services/portal/atmosphereResolver'
import type { SaveGame } from '../domain/entities/SaveGame'
import type { ActiveAnniversary } from '../domain/services/clubMemoryService'

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'test', managerName: 'Tränare', managedClubId: 'club_home',
    currentDate: '2026-10-15', currentSeason: 2026, currentMatchday: 5,
    clubs: [{ id: 'club_home' } as never, { id: 'club_away' } as never],
    players: [], fixtures: [], standings: [], inbox: [],
    playoffBracket: null, cupBracket: null, pendingEvents: [], transferBids: [],
    sponsors: [], seasonSummaries: [], version: '1.0', lastSavedAt: '2026-10-15T00:00:00',
    ...overrides,
  } as unknown as SaveGame
}

function makeEcho(overrides: Partial<ActiveAnniversary> = {}): ActiveAnniversary {
  return {
    eventId: 'e1', originalSeason: 2023, yearsAgo: 3, matchday: 5,
    type: 'big_win', outcome: 'won', significance: 95, echoSize: 'big',
    originalEventText: 'Stor seger.',
    ...overrides,
  }
}

describe('hasUpptaktContent', () => {
  it('null och mittfalt ger false — resten (sakrat/farozon/bottenstrid) ger true', () => {
    expect(hasUpptaktContent(null)).toBe(false)
    expect(hasUpptaktContent('mittfalt')).toBe(false)
    expect(hasUpptaktContent('farozon')).toBe(true)
    expect(hasUpptaktContent('sakrat')).toBe(true)
    expect(hasUpptaktContent('bottenstrid')).toBe(true)
  })
})

describe('hasAnniversaryContent', () => {
  it('inga activeAnniversaries → false', () => {
    expect(hasAnniversaryContent(makeGame({ activeAnniversaries: [] }))).toBe(false)
  })

  it('big eko med outcome=won → true (WON_MARKS-poolen är aldrig tom)', () => {
    const game = makeGame({ activeAnniversaries: [makeEcho()] })
    expect(hasAnniversaryContent(game)).toBe(true)
  })

  it('bara small/medium eko (inget big) → false', () => {
    const game = makeGame({ activeAnniversaries: [makeEcho({ echoSize: 'medium' })] })
    expect(hasAnniversaryContent(game)).toBe(false)
  })

  it('managed club eliminerad ur slutspel och elim-anslaget inte sett → väntar (false)', () => {
    const game = makeGame({
      activeAnniversaries: [makeEcho()],
      playoffBracket: {
        season: 2026,
        quarterFinals: [{ round: 'quarterFinal', homeClubId: 'other1', awayClubId: 'other2', winnerId: null, fixtures: [], homeWins: 0, awayWins: 0 } as never],
        semiFinals: [], final: null, status: 'active',
      } as never,
      seenAnslag: [],
    })
    expect(hasAnniversaryContent(game)).toBe(false)
  })

  it('managed club eliminerad men elim-anslaget redan sett → visas (true)', () => {
    const game = makeGame({
      activeAnniversaries: [makeEcho()],
      playoffBracket: {
        season: 2026,
        quarterFinals: [{ round: 'quarterFinal', homeClubId: 'other1', awayClubId: 'other2', winnerId: null, fixtures: [], homeWins: 0, awayWins: 0 } as never],
        semiFinals: [], final: null, status: 'active',
      } as never,
      seenAnslag: ['playoff_eliminated_2026'],
    })
    expect(hasAnniversaryContent(game)).toBe(true)
  })
})

describe('hasSpectatorContent', () => {
  it('inget playoffBracket → false (inte i slutspelet alls)', () => {
    expect(hasSpectatorContent(makeGame({ playoffBracket: null }))).toBe(false)
  })

  it('redan sedd (phaseMarksSeen innehåller "spectator") → false', () => {
    const game = makeGame({
      playoffBracket: { season: 2026, quarterFinals: [], semiFinals: [], final: null, status: 'active' } as never,
      phaseMarksSeen: ['spectator'],
    })
    expect(hasSpectatorContent(game)).toBe(false)
  })
})

describe('hasPhaseMarkContent', () => {
  function makeGameAtRound(round: number, overrides: Partial<SaveGame> = {}): SaveGame {
    const fixtures = round > 0 ? [{
      id: 'f1', status: 'completed', isCup: false, roundNumber: round,
      homeClubId: 'club_home', awayClubId: 'club_away', homeScore: 1, awayScore: 0,
    } as never] : []
    return makeGame({ fixtures, standings: [{ clubId: 'club_home', position: 3 } as never], ...overrides })
  }

  it('höststart (runda ≤3) har ingen fasmarkör-text → false', () => {
    expect(hasPhaseMarkContent(makeGameAtRound(2))).toBe(false)
  })

  it('annandagen (runda 7-11) har text och inte sedd → true', () => {
    expect(hasPhaseMarkContent(makeGameAtRound(7))).toBe(true)
  })

  it('annandagen redan sedd (phaseMarksSeen) → false', () => {
    expect(hasPhaseMarkContent(makeGameAtRound(7, { phaseMarksSeen: ['annandagen'] } as never))).toBe(false)
  })
})

describe('selectAtmosphereMarks — prioritet + tak', () => {
  it('helt tomt läge: bara Situation (alltid berättigad, aldrig null)', () => {
    const game = makeGame()
    const selection = selectAtmosphereMarks(game, null)
    expect(selection.shown).toEqual(['situation'])
    expect(selection.demoted).toEqual([])
  })

  it('anniversary + upptakt berättigade, tak=2 → båda visas, situation demoteras (inte försvinner)', () => {
    const game = makeGame({ activeAnniversaries: [makeEcho()] })
    const selection = selectAtmosphereMarks(game, 'farozon')
    expect(selection.shown).toEqual(['anniversary', 'upptakt'])
    expect(selection.demoted).toEqual(['situation'])
  })

  it('demoted innehåller aldrig ineligible marks — bara sådana som faktiskt hade något att säga', () => {
    // Ingen anniversary, inget playoffBracket (spectator ineligible), inget
    // beat (fräscht spel utan board_failure-trigger) — bara upptakt+situation
    // är berättigade, båda ryms inom taket (2), demoted ska vara tom.
    const game = makeGame()
    const selection = selectAtmosphereMarks(game, 'sakrat')
    expect(selection.shown).toEqual(['upptakt', 'situation'])
    expect(selection.demoted).toEqual([])
  })

  it('phasemark rankas mellan beat och situation — anniversary + phasemark berättigade, tak=2 → phasemark vinner över situation', () => {
    const game = makeGame({
      activeAnniversaries: [makeEcho()],
      fixtures: [{
        id: 'f1', status: 'completed', isCup: false, roundNumber: 7,
        homeClubId: 'club_home', awayClubId: 'club_away', homeScore: 1, awayScore: 0,
      } as never],
      standings: [{ clubId: 'club_home', position: 3 } as never],
    })
    const selection = selectAtmosphereMarks(game, null)
    expect(selection.shown).toEqual(['anniversary', 'phasemark'])
    expect(selection.demoted).toEqual(['situation'])
  })

  it('respekterar ATMOSPHERE_CAP (2) — aldrig fler än cap i shown', () => {
    const game = makeGame({ activeAnniversaries: [makeEcho()] })
    const selection = selectAtmosphereMarks(game, 'farozon')
    expect(selection.shown.length).toBeLessThanOrEqual(ATMOSPHERE_CAP)
  })
})
