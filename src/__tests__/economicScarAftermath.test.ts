/**
 * economicScar resolutions-medveten efterdyning (Code-spec 2026-06-03):
 *  - resolveEconomicCrisis stämplar resolvedMatchday + outcome + soldToSurvivePlayerName
 *    (sold_star fångar namnet FÖRE removePlayerId tar bort spelaren)
 *  - pickEfterklang: resolved inom 10-fönster → vägspecifik premiss; utanför → ingen;
 *    resolved utan resolvedMatchday (gammal save) → ingen efterdyning
 */
import { describe, it, expect } from 'vitest'
import { resolveEvent } from '../domain/services/events/eventResolver'
import { pickEfterklang } from '../domain/services/portal/pickEfterklang'
import { FixtureStatus } from '../domain/enums'
import type { SaveGame } from '../domain/entities/SaveGame'

const MANAGED = 'club_managed'

function leagueFixtures(n: number, season = 8) {
  return Array.from({ length: n }, (_, i) => ({
    id: `lg-${i}`, season, roundNumber: i + 1, matchday: i + 1,
    status: FixtureStatus.Completed, isCup: false,
    homeClubId: MANAGED, awayClubId: 'club_x', events: [],
  }))
}

function makeGame(overrides: Partial<SaveGame> = {}, completedLeague = 14): SaveGame {
  return {
    id: 'test', currentSeason: 8, currentMatchday: 16, currentDate: '2026-01-01',
    managedClubId: MANAGED,
    clubs: [
      { id: MANAGED, name: 'Edsbyn', shortName: 'Edsbyn', squadPlayerIds: ['p_star'] },
      { id: 'club_x', name: 'Söderfors IF', shortName: 'Söderfors', squadPlayerIds: [] },
    ],
    players: [{ id: 'p_star', firstName: 'Viktor', lastName: 'Ahlén', clubId: MANAGED }],
    fixtures: leagueFixtures(completedLeague),
    inbox: [], pendingEvents: [],
    ...overrides,
  } as unknown as SaveGame
}

function crisisResolveEvent(crisisPhase: string, removePlayerId?: string) {
  return {
    id: 'ev_crisis',
    type: 'economicCrisis',
    choices: [{ id: 'pick', label: 'Lös', effect: { type: 'resolveEconomicCrisis', crisisPhase, removePlayerId } }],
  }
}

// ── §1 — stämpling vid resolution ──────────────────────────────────────────────

describe('resolveEconomicCrisis — stämpling', () => {
  const baseCrisis = { startedSeason: 8, startedMatchday: 9, phase: 'decision' as const, eventsFired: [] }

  it('sold_star fångar spelarnamnet FÖRE borttagning + stämplar resolvedMatchday', () => {
    const game = makeGame({
      economicCrisisState: { ...baseCrisis },
      pendingEvents: [crisisResolveEvent('sold_star', 'p_star')] as never,
    })
    const after = resolveEvent(game, 'ev_crisis', 'pick')
    expect(after.economicCrisisState?.phase).toBe('resolved')
    expect(after.economicCrisisState?.outcome).toBe('sold_star')
    expect(after.economicCrisisState?.soldToSurvivePlayerName).toBe('Viktor Ahlén')
    // resolvedMatchday = senaste completed ligamatch (14)
    expect(after.economicCrisisState?.resolvedMatchday).toBe(14)
    // spelaren faktiskt borttagen ur truppen — men namnet fångades före
    expect(after.players.find(p => p.id === 'p_star')?.clubId).toBe('free_agent')
  })

  it('loan/mecenat/natural_recovery stämplar outcome utan spelarnamn', () => {
    for (const path of ['loan', 'mecenat', 'natural_recovery']) {
      const game = makeGame({
        economicCrisisState: { ...baseCrisis },
        pendingEvents: [crisisResolveEvent(path)] as never,
      })
      const after = resolveEvent(game, 'ev_crisis', 'pick')
      expect(after.economicCrisisState?.outcome).toBe(path)
      expect(after.economicCrisisState?.resolvedMatchday).toBe(14)
      expect(after.economicCrisisState?.soldToSurvivePlayerName).toBeUndefined()
    }
  })

  it('okänd crisisPhase faller tillbaka på natural_recovery', () => {
    const game = makeGame({
      economicCrisisState: { ...baseCrisis },
      pendingEvents: [crisisResolveEvent('')] as never,
    })
    const after = resolveEvent(game, 'ev_crisis', 'pick')
    expect(after.economicCrisisState?.outcome).toBe('natural_recovery')
  })
})

// ── §2/§3 — pickEfterklang efterdyning ─────────────────────────────────────────

describe('pickEfterklang — economicScar efterdyning', () => {
  const find = (game: SaveGame) => pickEfterklang(game, 8).find(m => m.type === 'economicScar')
  const resolved = (extra: Record<string, unknown>) => ({
    startedSeason: 8, startedMatchday: 9, phase: 'resolved', eventsFired: [], ...extra,
  })

  it('aktiv kris (A-grenen) oförändrad', () => {
    const game = makeGame({ economicCrisisState: { startedSeason: 8, startedMatchday: 9, phase: 'decision', eventsFired: [] } as never })
    expect(find(game)?.premiss).toBe('Kassan är tom — igen.')
  })

  it('resolved inom fönster → vägspecifik premiss', () => {
    // currentMatchday=16, resolvedMatchday=13 → recency 3
    const soldGame = makeGame({ economicCrisisState: resolved({ outcome: 'sold_star', resolvedMatchday: 13, soldToSurvivePlayerName: 'Viktor Ahlén' }) as never })
    expect(find(soldGame)?.premiss).toBe('Ni sålde Viktor Ahlén för att rädda kassan.')

    const loanGame = makeGame({ economicCrisisState: resolved({ outcome: 'loan', resolvedMatchday: 13 }) as never })
    expect(find(loanGame)?.premiss).toBe('Kommunlånet löper fortfarande.')

    const mecGame = makeGame({ economicCrisisState: resolved({ outcome: 'mecenat', resolvedMatchday: 13 }) as never })
    expect(find(mecGame)?.premiss).toBe('Mecenaten täckte krisen åt er.')

    const natGame = makeGame({ economicCrisisState: resolved({ outcome: 'natural_recovery', resolvedMatchday: 13 }) as never })
    expect(find(natGame)?.premiss).toBe('Ni red ut krisen utan att sälja.')
  })

  it('resolved utanför fönster (>10) → ingen economicScar', () => {
    // currentMatchday=16, resolvedMatchday=4 → recency 12
    const game = makeGame({ economicCrisisState: resolved({ outcome: 'mecenat', resolvedMatchday: 4 }) as never })
    expect(find(game)).toBeUndefined()
  })

  it('resolved utan resolvedMatchday (gammal save) → ingen efterdyning', () => {
    const game = makeGame({ economicCrisisState: resolved({ outcome: 'loan' }) as never })
    expect(find(game)).toBeUndefined()
  })
})
