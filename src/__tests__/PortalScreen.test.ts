/**
 * PortalScreen — integration-tester
 *
 * Verifierar att buildPortal väljer rätt primärkort för tre game-states:
 *  1. Rutinmatch   → NextMatchPrimary
 *  2. Derbymatch   → DerbyPrimary
 *  3. SM-final     → SMFinalPrimary
 *
 * Testar dessutom att seasonal tone-funktionen returnerar korrekta CSS-variabelnamn
 * (de som PortalScreen sätter via document.documentElement.style.setProperty).
 *
 * Kräver inte @testing-library/react — bygger på rena service-anrop.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { buildPortal, makeSeed } from '../domain/services/portal/portalBuilder'
import { initCardBag, resetCardBag } from '../domain/services/portal/initCardBag'
import { getSeasonalTone } from '../domain/services/portal/seasonalTone'
import type { SaveGame } from '../domain/entities/SaveGame'
import type { Fixture } from '../domain/entities/Fixture'

// ── Hjälpfunktioner ──────────────────────────────────────────────────────────

function makeClub(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    name: `Club ${id}`,
    region: 'Uppland',
    reputation: 50,
    arenaName: `Arena ${id}`,
    supporterGroupName: 'Klacken',
    finances: 100000,
    wage: 0,
    wageBudget: 0,
    ...overrides,
  }
}

function makeFixture(overrides: Partial<Fixture>): Fixture {
  return {
    id: 'fix_1',
    homeClubId: 'club_home',
    awayClubId: 'club_away',
    matchday: 5,
    roundNumber: 5,
    season: 2026,
    status: 'scheduled',
    isCup: false,
    isPlayoff: false,
    ...overrides,
  } as Fixture
}

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'test',
    managerName: 'Tränare',
    managedClubId: 'club_home',
    currentDate: '2026-10-15',
    currentSeason: 2026,
    currentMatchday: 5,
    portalEnabled: true,
    clubs: [makeClub('club_home'), makeClub('club_away')] as never,
    players: [],
    league: { id: 'l1', name: 'Test', clubs: [] } as never,
    fixtures: [
      makeFixture({
        homeClubId: 'club_home',
        awayClubId: 'club_away',
        status: 'scheduled',
      }),
    ],
    standings: [],
    inbox: [],
    transferState: {} as never,
    youthIntakeHistory: [],
    matchWeathers: [],
    managedClubTraining: 'balanced' as never,
    trainingHistory: [],
    playoffBracket: null,
    cupBracket: null,
    pendingEvents: [],
    transferBids: [],
    handledContractPlayerIds: [],
    sponsors: [],
    activeTalentSearch: null,
    talentSearchResults: [],
    mentorships: [],
    loanDeals: [],
    academyLevel: 'none' as never,
    scoutReports: {},
    activeScoutAssignment: null,
    scoutBudget: 0,
    seasonSummaries: [],
    version: '1.0',
    lastSavedAt: '2026-10-15T00:00:00',
    ...overrides,
  } as SaveGame
}

// ── Setup ────────────────────────────────────────────────────────────────────

beforeAll(() => {
  // Nollställ bag och initiera med riktiga kort
  resetCardBag()
  initCardBag()
})

// ── Tester ───────────────────────────────────────────────────────────────────

describe('PortalScreen integration — primärkort per game-state', () => {

  it('rutinmatch → väljer next_match (NextMatchPrimary)', () => {
    // Ingen derby-rivalitet, ingen SM-final, inga kritiska events
    const game = makeGame()
    const layout = buildPortal(game, makeSeed(game))

    expect(layout.primary).toBeDefined()
    expect(layout.primary.id).toBe('next_match')
  })

  it('derbymatch → väljer next_match_derby (DerbyPrimary)', () => {
    // club_soderfors vs club_skutskar = Upplandsderbyt i RIVALRIES
    const game = makeGame({
      managedClubId: 'club_soderfors',
      clubs: [
        makeClub('club_soderfors'),
        makeClub('club_skutskar'),
      ] as never,
      fixtures: [
        makeFixture({
          id: 'fix_derby',
          homeClubId: 'club_soderfors',
          awayClubId: 'club_skutskar',
          status: 'scheduled',
        }),
      ],
    })

    const layout = buildPortal(game, makeSeed(game))
    expect(layout.primary.id).toBe('next_match_derby')
  })

  it('SM-final (isFinaldag = true) → väljer next_match_smfinal (SMFinalPrimary)', () => {
    // Enklaste triggern: fixture.isFinaldag = true
    const game = makeGame({
      fixtures: [
        makeFixture({
          id: 'fix_smfinal',
          homeClubId: 'club_home',
          awayClubId: 'club_away',
          status: 'scheduled',
          matchday: 37,
          roundNumber: 37,
          isPlayoff: true,
          isCup: false,
          isFinaldag: true,
        } as never),
      ],
    })

    const layout = buildPortal(game, makeSeed(game))
    expect(layout.primary.id).toBe('next_match_smfinal')
  })

  it('kritisk händelse → väljer event_critical (EventPrimary)', () => {
    const game = makeGame({
      pendingEvents: [
        {
          id: 'evt_1',
          type: 'board_crisis',
          resolved: false,
        } as never,
      ],
    })

    const layout = buildPortal(game, makeSeed(game))
    expect(layout.primary.id).toBe('event_critical')
  })

  it('layout har alltid exakt 1 primary oavsett state', () => {
    const game = makeGame()
    const layout = buildPortal(game, makeSeed(game))
    expect(layout.primary).toBeDefined()
    expect(typeof layout.primary.id).toBe('string')
  })

  it('secondary är max 3 med riktiga kort', () => {
    const game = makeGame()
    const layout = buildPortal(game, makeSeed(game))
    expect(layout.secondary.length).toBeGreaterThanOrEqual(0)
    expect(layout.secondary.length).toBeLessThanOrEqual(3)
  })

  it('minimal är max 4 med riktiga kort', () => {
    const game = makeGame()
    const layout = buildPortal(game, makeSeed(game))
    expect(layout.minimal.length).toBeGreaterThanOrEqual(0)
    expect(layout.minimal.length).toBeLessThanOrEqual(4)
  })

})

describe('PortalScreen — seasonal tone CSS-variabler', () => {

  it('getSeasonalTone returnerar de fyra CSS-var-nycklarna som PortalScreen sätter', () => {
    const tone = getSeasonalTone('2026-10-15')

    // PortalScreen sätter dessa fyra:
    expect(tone.bgPrimary).toMatch(/^#[0-9a-fA-F]{6}$/)
    expect(tone.bgSurface).toMatch(/^#[0-9a-fA-F]{6}$/)
    expect(tone.bgElevated).toMatch(/^#[0-9a-fA-F]{6}$/)
    expect(tone.accentTone).toMatch(/^#[0-9a-fA-F]{6}$/)
  })

  it('vinterdatum är mörkare (lägre RGB-summa) än höstdatum', () => {
    const autumn = getSeasonalTone('2026-10-01')
    const winter = getSeasonalTone('2027-01-01')

    const toRgbSum = (hex: string) => {
      const n = parseInt(hex.slice(1), 16)
      return ((n >> 16) & 0xff) + ((n >> 8) & 0xff) + (n & 0xff)
    }

    expect(toRgbSum(winter.bgPrimary)).toBeLessThanOrEqual(toRgbSum(autumn.bgPrimary))
  })

  it('tone är deterministisk — samma datum ger samma värden', () => {
    const tone1 = getSeasonalTone('2026-11-15')
    const tone2 = getSeasonalTone('2026-11-15')
    expect(tone1.bgPrimary).toBe(tone2.bgPrimary)
    expect(tone1.accentTone).toBe(tone2.accentTone)
  })

})
