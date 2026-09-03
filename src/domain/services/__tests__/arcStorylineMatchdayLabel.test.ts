import { describe, it, expect } from 'vitest'
import { resolveEvent } from '../events/eventResolver'
import { generateCaptainSpeechEvent } from '../events/eventFactories'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../worldGenerator'
import { FixtureStatus } from '../../enums'

/**
 * 4.6 (SLUTTEST_KO.md, 2026-08-17) — arc/event-storylines satte tidigare
 * matchday: currentMatchday (den GLOBALA matchday-parametern, kan bli 27+
 * under slutspel). SeasonSummaryScreen.tsx renderar storyline.matchday som
 * "O{round}" och antar en ligaomgång (1-22).
 *
 * H1-uppföljning (människoupplevelse-audit 7024f8a, 2026-08-24): ursprungs-
 * testet körde arcService.ts:s ledare_crisis-arc (progressArcs, tar emot
 * matchday som parameter). ledare_crisis borttagen (Jacobs dom, captainSpeech
 * är kanon) — samma storyline (`captain_rallied_team`) produceras nu bara av
 * eventResolver.ts:s resolveEvent(), som INTE tar emot matchday som parameter
 * alls: den läser getCurrentLeagueRound(updatedGame) ur game.fixtures direkt,
 * så global-matchday-läckaget är strukturellt uteslutet i den vägen. Testet
 * flyttat hit för att fortsätta bevaka SAMMA konsument (SeasonSummaryScreens
 * "O{round}"-antagande), inte samma mekanism.
 */
describe('resolveEvent — captain_rallied_team-storylinens matchday är en ligaomgång', () => {
  it('håller sig inom ligaspannet trots ett globalt slutspels-currentMatchday', () => {
    const template = CLUB_TEMPLATES[0]
    let game = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
    const captain = game.players.find(p => p.clubId === game.managedClubId)!

    // Regelbunden säsong, 22 avklarade ligaomgångar — getCurrentLeagueRound ska ge 22.
    const leagueFixtures = game.fixtures
      .filter(f => f.leagueId && !f.isCup)
      .slice(0, 22)
      .map((f, i) => ({ ...f, status: FixtureStatus.Completed, roundNumber: i + 1, homeScore: 2, awayScore: 1 }))
    game = { ...game, fixtures: [...game.fixtures.filter(f => !leagueFixtures.some(lf => lf.id === f.id)), ...leagueFixtures] }

    const speechEvent = generateCaptainSpeechEvent(captain, game.managedClubId, game.currentSeason)
    // Slutspelets globala matchday — inte en ligaomgång.
    const GLOBAL_PLAYOFF_MATCHDAY = 33
    game = { ...game, currentMatchday: GLOBAL_PLAYOFF_MATCHDAY, pendingEvents: [speechEvent], captainPlayerId: captain.id }

    const result = resolveEvent(game, speechEvent.id, 'support', () => 0.5, true)

    const storyline = (result.storylines ?? []).find(s => s.type === 'captain_rallied_team')
    expect(storyline).toBeTruthy()
    expect(storyline!.matchday).toBe(22)
    expect(storyline!.matchday).not.toBe(GLOBAL_PLAYOFF_MATCHDAY)
    expect(result.eventLedger?.filter(entry => (
      entry.type === 'storyline_resolution'
      && entry.semanticKey.includes(':captain_rallied_team:')
    ))).toEqual([expect.objectContaining({
      season: game.currentSeason,
      matchday: GLOBAL_PLAYOFF_MATCHDAY,
      subject: { kind: 'player', id: captain.id },
      subject2: { kind: 'club', id: game.managedClubId },
    })])
  })
})
