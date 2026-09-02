import { describe, it, expect, beforeEach } from 'vitest'
import { buildPortal, makeSeed, computeCardStaleTracking } from '../domain/services/portal/portalBuilder'
import { setCardBag } from '../domain/services/portal/dashboardCardBag'
import type { DashboardCard } from '../domain/services/portal/dashboardCardBag'
import type { SaveGame } from '../domain/entities/SaveGame'
import { InboxItemType, PlayoffStatus } from '../domain/enums'

// ─── Mock komponenter ─────────────────────────────────────────────────────────
const MockPrimary = () => null
const MockDerby = () => null
const MockSecondary1 = () => null
const MockSecondary2 = () => null
const MockSecondary3 = () => null
const MockSecondary4 = () => null
const MockMinimal1 = () => null
const MockMinimal2 = () => null
const MockMinimal3 = () => null
const MockMinimal4 = () => null
const MockMinimal5 = () => null

// ─── Enkel game-factory ───────────────────────────────────────────────────────
function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'test',
    managerName: 'Test',
    managedClubId: 'club_a',
    currentDate: '2026-10-15',
    currentSeason: 2026,
    currentMatchday: 7,
    clubs: [],
    players: [],
    league: { id: 'l1', name: 'Test', clubs: [] } as never,
    fixtures: [],
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

// ─── Testbag ──────────────────────────────────────────────────────────────────
function makeTestBag(): DashboardCard[] {
  return [
    // Primary cards
    {
      id: 'primary_derby',
      tier: 'primary',
      weight: 80,
      triggers: [(game) => (game as SaveGame & { _isDerby?: boolean })._isDerby === true],
      Component: MockDerby as never,
    },
    {
      id: 'primary_default',
      tier: 'primary',
      weight: 10,
      triggers: [() => true],
      Component: MockPrimary as never,
    },
    // Secondary cards (4 total — cap är 3)
    { id: 'sec1', tier: 'secondary', weight: 80, triggers: [() => true], Component: MockSecondary1 as never },
    { id: 'sec2', tier: 'secondary', weight: 70, triggers: [() => true], Component: MockSecondary2 as never },
    { id: 'sec3', tier: 'secondary', weight: 60, triggers: [() => true], Component: MockSecondary3 as never },
    { id: 'sec4', tier: 'secondary', weight: 50, triggers: [() => true], Component: MockSecondary4 as never },
    // Minimal cards (5 total — cap är 4)
    { id: 'min1', tier: 'minimal', weight: 60, triggers: [() => true], Component: MockMinimal1 as never },
    { id: 'min2', tier: 'minimal', weight: 50, triggers: [() => true], Component: MockMinimal2 as never },
    { id: 'min3', tier: 'minimal', weight: 40, triggers: [() => true], Component: MockMinimal3 as never },
    { id: 'min4', tier: 'minimal', weight: 30, triggers: [() => true], Component: MockMinimal4 as never },
    { id: 'min5', tier: 'minimal', weight: 20, triggers: [() => true], Component: MockMinimal5 as never },
  ]
}

describe('buildPortal', () => {
  beforeEach(() => {
    setCardBag(makeTestBag())
  })

  it('returnerar alltid exakt 1 primary', () => {
    const game = makeGame()
    const layout = buildPortal(game, makeSeed(game))
    expect(layout.primary).toBeDefined()
    expect(typeof layout.primary.id).toBe('string')
  })

  it('secondary är max 3', () => {
    const game = makeGame()
    const layout = buildPortal(game, makeSeed(game))
    expect(layout.secondary.length).toBeLessThanOrEqual(3)
  })

  it('minimal är max 4', () => {
    const game = makeGame()
    const layout = buildPortal(game, makeSeed(game))
    expect(layout.minimal.length).toBeLessThanOrEqual(4)
  })

  it('är deterministisk — samma seed ger samma layout', () => {
    const game = makeGame()
    const seed = makeSeed(game)
    const layout1 = buildPortal(game, seed)
    const layout2 = buildPortal(game, seed)
    expect(layout1.primary.id).toBe(layout2.primary.id)
    expect(layout1.secondary.map(c => c.id)).toEqual(layout2.secondary.map(c => c.id))
    expect(layout1.minimal.map(c => c.id)).toEqual(layout2.minimal.map(c => c.id))
  })

  it('väljer primary_derby när derby-trigger är true', () => {
    const game = makeGame({ _isDerby: true } as never)
    const layout = buildPortal(game, makeSeed(game))
    expect(layout.primary.id).toBe('primary_derby')
  })

  it('väljer primary_default (fallback) när inga specialtriggers triggat', () => {
    const game = makeGame()
    const layout = buildPortal(game, makeSeed(game))
    expect(layout.primary.id).toBe('primary_default')
  })

  it('exkluderar kort vars triggers returnerar false', () => {
    setCardBag([
      { id: 'never', tier: 'secondary', weight: 100, triggers: [() => false], Component: MockSecondary1 as never },
      { id: 'always', tier: 'secondary', weight: 10, triggers: [() => true], Component: MockSecondary2 as never },
      { id: 'prim', tier: 'primary', weight: 10, triggers: [() => true], Component: MockPrimary as never },
    ])
    const game = makeGame()
    const layout = buildPortal(game, makeSeed(game))
    const secIds = layout.secondary.map(c => c.id)
    expect(secIds).not.toContain('never')
    expect(secIds).toContain('always')
  })

  it('sorterar secondary per weight (högst först)', () => {
    setCardBag([
      { id: 'low', tier: 'secondary', weight: 10, triggers: [() => true], Component: MockSecondary1 as never },
      { id: 'high', tier: 'secondary', weight: 90, triggers: [() => true], Component: MockSecondary2 as never },
      { id: 'mid', tier: 'secondary', weight: 50, triggers: [() => true], Component: MockSecondary3 as never },
      { id: 'prim', tier: 'primary', weight: 10, triggers: [() => true], Component: MockPrimary as never },
    ])
    const game = makeGame()
    const layout = buildPortal(game, makeSeed(game))
    expect(layout.secondary[0].id).toBe('high')
    expect(layout.secondary[1].id).toBe('mid')
    expect(layout.secondary[2].id).toBe('low')
  })
})

describe('makeSeed', () => {
  it('ger ett nummer', () => {
    const game = makeGame()
    expect(typeof makeSeed(game)).toBe('number')
  })

  it('är deterministiskt för samma season + matchday', () => {
    const game1 = makeGame({ currentSeason: 2026, currentMatchday: 14 })
    const game2 = makeGame({ currentSeason: 2026, currentMatchday: 14 })
    expect(makeSeed(game1)).toBe(makeSeed(game2))
  })

  it('ger olika värden för olika matchdays', () => {
    const game1 = makeGame({ currentSeason: 2026, currentMatchday: 1 })
    const game2 = makeGame({ currentSeason: 2026, currentMatchday: 10 })
    expect(makeSeed(game1)).not.toBe(makeSeed(game2))
  })
})

describe('computeCardStaleTracking', () => {
  it('nytt kort får firstShownAt = currentMatchday', () => {
    const result = computeCardStaleTracking({}, ['card_a'], 7)
    expect(result['card_a'].firstShownAt).toBe(7)
    expect(result['card_a'].lastShownAt).toBe(7)
  })

  it('sekventiellt kort behåller firstShownAt men uppdaterar lastShownAt', () => {
    const tracking = { card_a: { firstShownAt: 5, lastShownAt: 6 } }
    const result = computeCardStaleTracking(tracking, ['card_a'], 7)
    expect(result['card_a'].firstShownAt).toBe(5)  // bevarad
    expect(result['card_a'].lastShownAt).toBe(7)   // uppdaterad
  })

  it('gap (lastShownAt !== matchday-1) halverar firstShownAt (B9 T2B)', () => {
    // lastShownAt=5, currentMatchday=7 → gap → firstShownAt halveras halvvägs (ej nollställs)
    // Math.floor((3 + 7) / 2) = 5
    const tracking = { card_a: { firstShownAt: 3, lastShownAt: 5 } }
    const result = computeCardStaleTracking(tracking, ['card_a'], 7)
    expect(result['card_a'].firstShownAt).toBe(5)  // halvvägs, ej nollställt
    expect(result['card_a'].lastShownAt).toBe(7)
  })

  it('bevarar tracking för kort som INTE visas denna omgång', () => {
    const tracking = { card_a: { firstShownAt: 5, lastShownAt: 6 }, card_b: { firstShownAt: 4, lastShownAt: 6 } }
    const result = computeCardStaleTracking(tracking, ['card_a'], 7)
    // card_b inte i shownCardIds men bevaras (lastShownAt=6 visar den saknades)
    expect(result['card_b']).toEqual({ firstShownAt: 4, lastShownAt: 6 })
  })
})

describe('buildPortal — stale-bias', () => {
  beforeEach(() => {
    setCardBag([
      { id: 'fresh', tier: 'secondary', weight: 50, triggers: [() => true], Component: MockSecondary1 as never },
      { id: 'stale', tier: 'secondary', weight: 80, triggers: [() => true], Component: MockSecondary2 as never },
      { id: 'prim', tier: 'primary', weight: 10, triggers: [() => true], Component: MockPrimary as never },
    ])
  })

  it('nytt kort (ingen tracking) har bias 1 — ingen dämpning', () => {
    const game = makeGame({ currentMatchday: 7 })
    const layout = buildPortal(game, makeSeed(game))
    // Utan tracking: stale(weight=80) > fresh(weight=50) — stale vinner
    expect(layout.secondary[0].id).toBe('stale')
  })

  it('kort visat 3 omg utan gap (bias=0.125) tappar mot ett lägre nytt kort', () => {
    // stale: weight=80, staleness=3 → effectiveWeight = 80*0.125 = 10
    // fresh: weight=50, ingen tracking → effectiveWeight = 50*1 = 50
    // fresh vinner
    const tracking = {
      stale: { firstShownAt: 4, lastShownAt: 6 },  // visats vid md 4,5,6 → staleness = 7-4=3 → 0.5^3=0.125
    }
    const game = makeGame({ currentMatchday: 7, cardStaleTracking: tracking })
    const layout = buildPortal(game, makeSeed(game))
    expect(layout.secondary[0].id).toBe('fresh')
  })

  it('kort visat 1 omg (bias=0.5) kvar högt nog', () => {
    // stale: weight=80, staleness=1 → effectiveWeight = 80*0.5 = 40
    // fresh: weight=50, ingen tracking → effectiveWeight = 50
    // fresh vinner (50 > 40)
    const tracking = {
      stale: { firstShownAt: 6, lastShownAt: 6 },  // firstShownAt=6, currentMatchday=7 → staleness=1
    }
    const game = makeGame({ currentMatchday: 7, cardStaleTracking: tracking })
    const layout = buildPortal(game, makeSeed(game))
    expect(layout.secondary[0].id).toBe('fresh')
  })

  it('staleBias räknar från firstShownAt — högt-weight-kort med gammal firstShownAt förlorar', () => {
    // stale: firstShownAt=3, lastShownAt=5 → gap (b9 halverar, men tracking AS-IS i buildPortal)
    // staleBias räknar på firstShownAt=3, currentMatchday=7 → consecutive=4 → 0.5^4=0.0625
    // frequencyPenalty=0 (shownCount saknas → 0)
    const tracking = {
      stale: { firstShownAt: 3, lastShownAt: 5 },  // staleness = 7-3=4 → 0.5^4=0.0625
    }
    const game = makeGame({ currentMatchday: 7, cardStaleTracking: tracking })
    const layout = buildPortal(game, makeSeed(game))
    // stale: 80*0.0625=5 < fresh: 50*1=50 → fresh vinner
    expect(layout.secondary[0].id).toBe('fresh')
  })
})

// ─── C1: endgame-kurering ───────────────────────────────────────────────────
describe('buildPortal — C1 endgame-kurering', () => {
  const ENDGAME_BAG: DashboardCard[] = [
    { id: 'next_match', tier: 'primary', weight: 10, triggers: [() => true], Component: MockPrimary as never },
    // match-/slutspelsrelevanta — ska överleva
    { id: 'opponent_form', tier: 'secondary', weight: 80, triggers: [() => true], Component: MockSecondary1 as never },
    { id: 'tabell', tier: 'secondary', weight: 70, triggers: [() => true], Component: MockSecondary2 as never },
    // MEDIUM 2: ett redan loggat, synligt bågsteg — ska inte föräldralösas
    // bara för att burnout-takets sena timing sammanfaller med endgame.
    { id: 'burnout_relief_mark', tier: 'secondary', weight: 96, triggers: [() => true], Component: MockSecondary3 as never },
    // distraktioner med HÖGRE weight — utan kurering skulle de annars vinna platserna
    { id: 'coffee_room_card', tier: 'secondary', weight: 99, triggers: [() => true], Component: MockSecondary3 as never },
    { id: 'ekonomi', tier: 'secondary', weight: 90, triggers: [() => true], Component: MockSecondary4 as never },
    { id: 'squad_status', tier: 'minimal', weight: 60, triggers: [() => true], Component: MockMinimal1 as never },
    { id: 'klacken_mood_minimal', tier: 'minimal', weight: 90, triggers: [() => true], Component: MockMinimal2 as never },
  ]
  const completedLeague = (round: number) =>
    ({ id: `f${round}`, status: 'completed', isCup: false, roundNumber: round, homeClubId: 'club_a', awayClubId: 'club_b' })

  beforeEach(() => setCardBag(ENDGAME_BAG))

  it('slutspurt (omg ≥20): döljer icke-match-secondary, behåller match-relevanta trots lägre weight', () => {
    const game = makeGame({ fixtures: [completedLeague(20)] as never })
    const ids = buildPortal(game, makeSeed(game)).secondary.map(c => c.id)
    expect(ids).toContain('opponent_form')
    expect(ids).toContain('tabell')
    expect(ids).toContain('burnout_relief_mark')
    expect(ids).not.toContain('coffee_room_card')
    expect(ids).not.toContain('ekonomi')
  })

  it('slutspel: burnout-lättnaden överlever kureringen och vinner secondary-rankingen', () => {
    const playoffBracket = {
      status: PlayoffStatus.QuarterFinals,
      quarterFinals: [{ homeClubId: 'club_a', awayClubId: 'club_b', fixtures: ['pf1'], winnerId: null, loserId: null, homeWins: 0, awayWins: 0 }],
      semiFinals: [],
      final: null,
    }
    const fixtures = [{ id: 'pf1', status: 'scheduled', isCup: false, isKnockout: true, roundNumber: 27, homeClubId: 'club_a', awayClubId: 'club_b' }]
    const game = makeGame({ fixtures: fixtures as never, playoffBracket: playoffBracket as never })
    const ids = buildPortal(game, makeSeed(game)).secondary.map(c => c.id)

    expect(ids[0]).toBe('burnout_relief_mark')
  })

  it('endgame: döljer icke-match-minimal (klack-pill) trots högre weight', () => {
    const game = makeGame({ fixtures: [completedLeague(21)] as never })
    const ids = buildPortal(game, makeSeed(game)).minimal.map(c => c.id)
    expect(ids).toContain('squad_status')
    expect(ids).not.toContain('klacken_mood_minimal')
  })

  it('utanför endgame (omg 7): distraktioner visas normalt (weight styr)', () => {
    const game = makeGame({ fixtures: [completedLeague(7)] as never })
    const ids = buildPortal(game, makeSeed(game)).secondary.map(c => c.id)
    expect(ids).toContain('coffee_room_card')
    expect(ids).toContain('ekonomi')
  })
})

// ── C1 close-out: storySlot live-stake-gate ──────────────────────────────────
describe('buildPortal — C1 storySlot live-stake-gate', () => {
  beforeEach(() => setCardBag([
    { id: 'next_match', tier: 'primary', weight: 10, triggers: [() => true], Component: MockPrimary as never },
  ]))

  const mediaInbox = [{ id: 'm1', type: InboxItemType.MediaEvent, date: '2026-10-15', title: 'Rubrik', body: 'Text', isRead: false }]
  const completedLeague22 = { id: 'f22', status: 'completed', isCup: false, roundNumber: 22, homeClubId: 'club_a', awayClubId: 'club_b' }

  it('contender omg≥20 (spelar match): storySlot släckt — matchfokus', () => {
    const game = makeGame({ fixtures: [completedLeague22] as never, inbox: mediaInbox as never })
    expect(buildPortal(game, makeSeed(game)).storySlot).toBeNull()
  })

  it('utslagen åskådare omg≥20: storySlot behålls (reflektion)', () => {
    // managed (club_a) är INTE med i bracketen → spectator; annan serie har schemalagd match
    const playoffBracket = {
      status: PlayoffStatus.QuarterFinals,
      quarterFinals: [{ homeClubId: 'club_b', awayClubId: 'club_c', fixtures: ['pf1'], winnerId: null, loserId: null, homeWins: 0, awayWins: 0 }],
      semiFinals: [],
      final: null,
    }
    const fixtures = [completedLeague22, { id: 'pf1', status: 'scheduled', isCup: false, isKnockout: true, roundNumber: 27, homeClubId: 'club_b', awayClubId: 'club_c' }]
    const game = makeGame({ fixtures: fixtures as never, inbox: mediaInbox as never, playoffBracket: playoffBracket as never })
    const layout = buildPortal(game, makeSeed(game))
    expect(layout.storySlot).not.toBeNull()
    expect(layout.storySlot?.kind).toBe('journalistHot')
  })
})
