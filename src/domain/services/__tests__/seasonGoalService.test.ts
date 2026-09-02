import { describe, it, expect } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { FixtureStatus } from '../../enums'
import type { SeasonSummary } from '../../entities/SeasonSummary'
import { resolveEvent } from '../events/eventResolver'
import {
  getSeasonGoalOffers,
  evaluateSeasonGoal,
  deriveGoalOutcomeLine,
  deriveSeasonPersonChange,
  derivePersonChangeLine,
  deriveRivalryStanding,
  deriveRivalryLine,
  deriveEraChangeLine,
  shouldShowEraChangeLine,
  checkSeasonGoalHalfwayEvent,
} from '../seasonGoalService'

function baseGame(clubId = 'club_forsbacka') {
  return createNewGame({ managerName: 'Test', clubId, season: 2025, seed: 42 })
}

function fakeSummary(overrides: Partial<SeasonSummary>): SeasonSummary {
  return {
    season: 2024, clubId: 'x', clubName: 'X',
    finalPosition: 6, points: 30, wins: 10, draws: 2, losses: 10,
    goalsFor: 90, goalsAgainst: 90, goalDifference: 0,
    playoffResult: null,
    boardExpectation: 'avoidBottom' as SeasonSummary['boardExpectation'],
    metExpectation: true, expectationVerdict: 'met',
    topScorer: null, topAssister: null, topRated: null, mostImproved: null, youngPlayer: null,
    totalGoals: 90, totalAssists: 60, totalCornerGoals: 20, totalCleanSheets: 3,
    longestWinStreak: 3, longestLossStreak: 3, biggestWin: null, worstLoss: null,
    homeRecord: { wins: 5, draws: 1, losses: 5 }, awayRecord: { wins: 5, draws: 1, losses: 5 },
    firstHalfPoints: 15, secondHalfPoints: 15, formTrend: 'stable',
    totalInjuries: 5, mostInjuredPlayer: null,
    startFinances: 100000, endFinances: 100000, financialChange: 0,
    youthIntakeCount: 2, bestYouthProspect: null,
    roundPoints: [], narrativeSummary: 'x',
    communityStandingStart: 50, communityStandingEnd: 50, communityHighlights: [],
    ...overrides,
  }
}

describe('getSeasonGoalOffers', () => {
  it('säsong 1 (ingen historik) — erbjuder aldrig slutspel/etablera', () => {
    const game = baseGame()
    const offers = getSeasonGoalOffers(game)
    expect(offers.some(o => o.type === 'playoff' || o.type === 'establish')).toBe(false)
  })

  it('förra säsongen missade slutspel — erbjuder "slutspel", inte "etablera"', () => {
    const game = { ...baseGame(), seasonSummaries: [fakeSummary({ playoffResult: 'didNotQualify' })] }
    const offers = getSeasonGoalOffers(game)
    expect(offers[0]).toEqual({ type: 'playoff', choiceText: 'Ta oss till slutspel.' })
    expect(offers.some(o => o.type === 'establish')).toBe(false)
  })

  it('förra säsongen nådde slutspel — erbjuder "etablera", inte "slutspel"', () => {
    const game = { ...baseGame(), seasonSummaries: [fakeSummary({ playoffResult: 'quarterfinal' })] }
    const offers = getSeasonGoalOffers(game)
    expect(offers[0]).toEqual({ type: 'establish', choiceText: 'Etablera oss där. Två år i rad, inte ett.' })
  })

  it('rival — plockar högst intensitet när klubben har flera rivaler (club_soderfors)', () => {
    const game = { ...baseGame('club_soderfors'), seasonSummaries: [fakeSummary({ playoffResult: 'didNotQualify' })] }
    const offers = getSeasonGoalOffers(game)
    const rivalOffer = offers.find(o => o.type === 'rival')
    expect(rivalOffer?.referenceId).toBe('club_skutskar')   // Upplandsderbyt, intensitet 3 > Forsderbyt intensitet 1
  })

  it('håll ihop truppen — bara när 3+ kontrakt går ut den kommande säsongen', () => {
    let game = { ...baseGame(), seasonSummaries: [fakeSummary({ playoffResult: 'didNotQualify' })] }
    const managed = game.players.filter(p => p.clubId === game.managedClubId).slice(0, 3)
    game = {
      ...game,
      // Neutraliserar andra typers slumpmässiga träffbarhet (club_forsbacka
      // har en verklig rival OCH kan råka ha en spelare som redan matchar
      // playerCarry-tröskeln i den slumpade truppen) — testet ska isolerat
      // verifiera 3+-villkoret, inte konkurrera med MAX_OFFERS-taket.
      players: game.players.map(p => {
        const base = { ...p, potentialAbility: Math.min(p.potentialAbility, 40) }
        return managed.some(m => m.id === p.id) ? { ...base, contractUntilSeason: game.currentSeason } : base
      }),
      facilityState: { builtNodeIds: [] as string[] },
    }
    const offers = getSeasonGoalOffers(game)
    const keepSquad = offers.find(o => o.type === 'keepSquad')
    expect(keepSquad?.trackedPlayerIds?.sort()).toEqual(managed.map(m => m.id).sort())
  })

  it('max fyra erbjudanden totalt', () => {
    let game = { ...baseGame('club_soderfors'), seasonSummaries: [fakeSummary({ playoffResult: 'didNotQualify' })] }
    const managed = game.players.filter(p => p.clubId === game.managedClubId)
    // Gör en spelare "bär laget"-värdig
    const carryCandidate = managed[0]
    game = {
      ...game,
      players: game.players.map(p =>
        p.id === carryCandidate.id ? { ...p, age: 20, potentialAbility: 80 } : p
      ),
      facilityState: { builtNodeIds: [] },
    }
    const expiring = managed.slice(1, 4)
    game = {
      ...game,
      players: game.players.map(p =>
        expiring.some(e => e.id === p.id) ? { ...p, contractUntilSeason: game.currentSeason } : p
      ),
    }
    const offers = getSeasonGoalOffers(game)
    expect(offers.length).toBeLessThanOrEqual(4)
  })
})

describe('evaluateSeasonGoal', () => {
  function withStanding(game: ReturnType<typeof baseGame>, position: number) {
    return {
      ...game,
      standings: game.standings.map(s => s.clubId === game.managedClubId ? { ...s, position } : s),
    }
  }

  it('playoff — met när plats <= 8', () => {
    const game = withStanding(baseGame(), 4)
    const record = evaluateSeasonGoal(game, { type: 'playoff' }, { contractExpiredIds: new Set(), retiredPlayerIds: new Set() })
    expect(record.outcome).toBe('met')
  })

  it('playoff — close när plats 9-10', () => {
    const game = withStanding(baseGame(), 9)
    const record = evaluateSeasonGoal(game, { type: 'playoff' }, { contractExpiredIds: new Set(), retiredPlayerIds: new Set() })
    expect(record.outcome).toBe('close')
  })

  it('playoff — not när plats >= 11', () => {
    const game = withStanding(baseGame(), 12)
    const record = evaluateSeasonGoal(game, { type: 'playoff' }, { contractExpiredIds: new Set(), retiredPlayerIds: new Set() })
    expect(record.outcome).toBe('not')
  })

  it('playerCarry — met/close/not efter antal matcher', () => {
    const game = baseGame()
    const player = game.players.find(p => p.clubId === game.managedClubId)!
    const withGames = (n: number) => ({
      ...game,
      players: game.players.map(p => p.id === player.id ? { ...p, seasonStats: { ...p.seasonStats, gamesPlayed: n } } : p),
    })
    expect(evaluateSeasonGoal(withGames(16), { type: 'playerCarry', referenceId: player.id }, { contractExpiredIds: new Set(), retiredPlayerIds: new Set() }).outcome).toBe('met')
    expect(evaluateSeasonGoal(withGames(12), { type: 'playerCarry', referenceId: player.id }, { contractExpiredIds: new Set(), retiredPlayerIds: new Set() }).outcome).toBe('close')
    expect(evaluateSeasonGoal(withGames(2), { type: 'playerCarry', referenceId: player.id }, { contractExpiredIds: new Set(), retiredPlayerIds: new Set() }).outcome).toBe('not')
  })

  it('rival — met vid minst en vinst, close vid oavgjort utan vinst, not annars', () => {
    const game = baseGame('club_soderfors')
    const rivalId = 'club_skutskar'
    const template = game.fixtures[0]
    function withFixture(homeScore: number, awayScore: number) {
      return {
        ...game,
        fixtures: [
          ...game.fixtures,
          { ...template, id: 'test_rival_fx', season: game.currentSeason, isCup: false, status: FixtureStatus.Completed,
            homeClubId: game.managedClubId, awayClubId: rivalId, homeScore, awayScore },
        ],
      }
    }
    expect(evaluateSeasonGoal(withFixture(3, 1), { type: 'rival', referenceId: rivalId }, { contractExpiredIds: new Set(), retiredPlayerIds: new Set() }).outcome).toBe('met')
    expect(evaluateSeasonGoal(withFixture(2, 2), { type: 'rival', referenceId: rivalId }, { contractExpiredIds: new Set(), retiredPlayerIds: new Set() }).outcome).toBe('close')
    expect(evaluateSeasonGoal(withFixture(0, 3), { type: 'rival', referenceId: rivalId }, { contractExpiredIds: new Set(), retiredPlayerIds: new Set() }).outcome).toBe('not')
  })

  it('facility — met när noden är byggd', () => {
    const game = { ...baseGame(), facilityState: { builtNodeIds: ['varmestuga'] } }
    const record = evaluateSeasonGoal(game, { type: 'facility', referenceId: 'varmestuga' }, { contractExpiredIds: new Set(), retiredPlayerIds: new Set() })
    expect(record.outcome).toBe('met')
  })

  it('facility — not när inget bygge påbörjats', () => {
    const game = { ...baseGame(), facilityState: { builtNodeIds: [] } }
    const record = evaluateSeasonGoal(game, { type: 'facility', referenceId: 'varmestuga' }, { contractExpiredIds: new Set(), retiredPlayerIds: new Set() })
    expect(record.outcome).toBe('not')
  })

  it('keepSquad — met/close/not efter antal förlängda av tre spårade', () => {
    const tracked = ['p1', 'p2', 'p3']
    const game = baseGame()
    expect(evaluateSeasonGoal(game, { type: 'keepSquad', trackedPlayerIds: tracked }, { contractExpiredIds: new Set(), retiredPlayerIds: new Set() }).outcome).toBe('met')
    expect(evaluateSeasonGoal(game, { type: 'keepSquad', trackedPlayerIds: tracked }, { contractExpiredIds: new Set(['p1', 'p2']), retiredPlayerIds: new Set() }).outcome).toBe('close')
    expect(evaluateSeasonGoal(game, { type: 'keepSquad', trackedPlayerIds: tracked }, { contractExpiredIds: new Set(['p1', 'p2', 'p3']), retiredPlayerIds: new Set() }).outcome).toBe('not')
  })
})

describe('deriveGoalOutcomeLine — text låst av Opus, ordagrann', () => {
  const game = baseGame()

  it('inget mål valt', () => {
    expect(deriveGoalOutcomeLine(undefined, game)).toBe('Du lovade ingenting i somras. Det höll du.')
  })

  it('slutspel — uppfyllt/nästan/inte', () => {
    expect(deriveGoalOutcomeLine({ type: 'playoff', outcome: 'met' }, game)).toBe('Du sa slutspel i somras. Du gjorde det.')
    expect(deriveGoalOutcomeLine({ type: 'playoff', outcome: 'close' }, game)).toBe('Du sa slutspel i somras. Det saknades inte mycket.')
    expect(deriveGoalOutcomeLine({ type: 'playoff', outcome: 'not' }, game)).toBe('Du sa slutspel i somras. Det blev inte så.')
  })

  it('playerCarry med okänd/borttagen spelare degraderar graciöst', () => {
    const line = deriveGoalOutcomeLine({ type: 'playerCarry', referenceId: 'does_not_exist', outcome: 'met' }, game)
    expect(line).toBe('Du sa att en ung spelare skulle bära laget i somras. Du gjorde det.')
    expect(line).not.toContain('undefined')
    expect(line).not.toContain('{')
  })
})

describe('deriveSeasonPersonChange — prioritetsordning', () => {
  it('legend som slutade vinner över allt annat', () => {
    const retired = [{ playerId: 'legend1', name: 'Sven Lund', seasons: 8, isLegend: true }]
    const game = baseGame()
    const change = deriveSeasonPersonChange(game, retired)
    expect(change).toEqual({ kind: 'retired', playerId: 'legend1', name: 'Sven Lund', seasons: 8 })
    expect(derivePersonChangeLine(change!)).toBe('Sven Lund la av efter 8 säsonger.')
  })

  it('ingen kandidat — undefined, ingen påtvingad rad', () => {
    const game = baseGame()
    const change = deriveSeasonPersonChange(game, [])
    expect(change).toBeUndefined()
  })

  it('akademigenombrott — text', () => {
    expect(derivePersonChangeLine({ kind: 'breakthrough', playerId: 'p1', name: 'Torsten Ek' }))
      .toBe('Torsten Ek kom upp och blev kvar.')
  })

  it('reserv till given — text', () => {
    expect(derivePersonChangeLine({ kind: 'establishedStarter', playerId: 'p1', name: 'Erik Berg' }))
      .toBe('Erik Berg gick från reserv till given.')
  })

  // PÅSTÅENDEKARTAN (2026-08-24): establishedStarter jämförde tidigare bara
  // mot FÖREGÅENDE säsong (prevGames <= 8) — en redan etablerad ordinarie som
  // fick en skadedrabbad säsong och sen återhämtade sig fick "bragden"
  // påstådd igen. Nu krävs, som breakthrough redan gör, att spelaren aldrig
  // haft en säsong med >= 15 matcher tidigare.
  it('spelaren var redan etablerad två säsonger tillbaka: ingen ny "reserv till given"', () => {
    // PÅSTÅENDEKARTAN topScorer-familjens fix (2026-08-25): samma event-
    // sourcing som testet nedan — bygger riktiga completed fixtures så att
    // spelaren FAKTISKT når >=15 event-sourcade matcher denna säsong, annars
    // testar detta bara "0 matcher, ingen kandidat" vilket är sant oavsett
    // seasonHistory-kollen den ska verifiera.
    const game = baseGame()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const playerId = club.squadPlayerIds[0]
    const template = game.fixtures.find(f => f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)!
    const seasonFixtures = Array.from({ length: 20 }, (_, i) => ({
      ...template,
      id: `everest_f${i}`,
      season: game.currentSeason,
      isCup: false,
      roundNumber: i + 1,
      status: FixtureStatus.Completed,
      homeClubId: game.managedClubId,
      awayClubId: template.homeClubId === game.managedClubId ? template.awayClubId : template.homeClubId,
      homeScore: 2, awayScore: 1,
      homeLineup: { startingPlayerIds: [playerId], benchPlayerIds: [], tactic: {} as never },
      awayLineup: { startingPlayerIds: [], benchPlayerIds: [], tactic: {} as never },
      report: { playerRatings: { [playerId]: 6.5 } } as never,
    }))
    const gameWithHistory = {
      ...game,
      fixtures: [...game.fixtures, ...seasonFixtures],
      players: game.players.map(p => p.id === playerId ? {
        ...p,
        seasonHistory: [
          { season: 2023, goals: 5, assists: 3, games: 22, rating: 6.5, clubId: p.clubId }, // redan etablerad då
          { season: 2024, goals: 1, assists: 0, games: 4, rating: 6.0, clubId: p.clubId },  // skadedrabbad säsong (prevGames <= 8)
        ],
      } : p),
    }
    const change = deriveSeasonPersonChange(gameWithHistory, [])
    expect(change?.playerId).not.toBe(playerId)
  })

  it('spelaren ALDRIG haft >=15 matcher förut: räknas som genuin "reserv till given"', () => {
    // PÅSTÅENDEKARTAN topScorer-familjens fix (2026-08-25): deriveSeasonPersonChange
    // läser inte längre p.seasonStats.gamesPlayed (kan divergera efter en
    // försäljning) — den räknar event-sourcat ur game.fixtures direkt (lineup +
    // en registrerad rating = en riktig matchappearance). Testet måste därför
    // bygga riktiga completed fixtures med spelaren i startelvan och ett
    // ratingvärde, inte bara sätta seasonStats-fältet.
    const game = baseGame()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const playerId = club.squadPlayerIds[0]
    const template = game.fixtures.find(f => f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)!
    const seasonFixtures = Array.from({ length: 15 }, (_, i) => ({
      ...template,
      id: `est_f${i}`,
      season: game.currentSeason,
      isCup: false,
      roundNumber: i + 1,
      status: FixtureStatus.Completed,
      homeClubId: game.managedClubId,
      awayClubId: template.homeClubId === game.managedClubId ? template.awayClubId : template.homeClubId,
      homeScore: 2, awayScore: 1,
      homeLineup: { startingPlayerIds: [playerId], benchPlayerIds: [], tactic: {} as never },
      awayLineup: { startingPlayerIds: [], benchPlayerIds: [], tactic: {} as never },
      report: { playerRatings: { [playerId]: 6.5 } } as never,
    }))
    const gameWithHistory = {
      ...game,
      fixtures: [...game.fixtures, ...seasonFixtures],
      players: game.players.map(p => p.id === playerId ? {
        ...p,
        seasonHistory: [
          { season: 2024, goals: 1, assists: 0, games: 4, rating: 6.0, clubId: p.clubId },
        ],
      } : p),
    }
    const change = deriveSeasonPersonChange(gameWithHistory, [])
    expect(change?.kind).toBe('establishedStarter')
    expect(change?.playerId).toBe(playerId)
  })
})

describe('deriveRivalryStanding / deriveRivalryLine', () => {
  it('ingen rivalklubb finns — undefined', () => {
    // Alla 12 riktiga klubbar har minst en rivalitet i RIVALRIES — simulerar
    // "ingen rival" med ett managedClubId som inte finns i listan alls.
    const game = { ...baseGame(), managedClubId: 'club_does_not_exist' }
    expect(deriveRivalryStanding(game)).toBeUndefined()
  })

  it('rivalklubb finns men inga matcher spelade denna säsong — undefined', () => {
    const game = baseGame('club_soderfors')
    expect(deriveRivalryStanding(game)).toBeUndefined()
  })

  it('räknar V-O-F korrekt och formaterar raden', () => {
    const game = baseGame('club_soderfors')
    const rivalId = 'club_skutskar'
    const template = game.fixtures[0]
    const withRival = {
      ...game,
      fixtures: [
        ...game.fixtures,
        { ...template, id: 'rf1', season: game.currentSeason, isCup: false, status: FixtureStatus.Completed, homeClubId: game.managedClubId, awayClubId: rivalId, homeScore: 3, awayScore: 1 },
        { ...template, id: 'rf2', season: game.currentSeason, isCup: false, status: FixtureStatus.Completed, homeClubId: rivalId, awayClubId: game.managedClubId, homeScore: 2, awayScore: 2 },
      ],
    }
    const standing = deriveRivalryStanding(withRival)
    expect(standing).toEqual({ rivalClubId: rivalId, rivalName: expect.any(String), wins: 1, draws: 1, losses: 0 })
    expect(deriveRivalryLine(standing!)).toBe(`${standing!.rivalName}: 1–1–0 den säsongen.`)
  })
})

describe('deriveEraChangeLine', () => {
  it('formaterar med redan skeppad eraLabel-text, inte ny prosa', () => {
    expect(deriveEraChangeLine('Slottsbron BK', 'survival')).toBe('Det här året slutade Slottsbron BK vara i överlevnad.')
    expect(deriveEraChangeLine('Slottsbron BK', 'legacy')).toBe('Det här året slutade Slottsbron BK vara i storhetstid.')
  })
})

// HistoryScreen.tsx (O18 fält 5) — jämför säsongens clubEra mot FÖREGÅENDE
// sparade säsongs, inte mot en frusen etikett. Off-by-one i indexeringen
// (summaries[i+1] i den omvänt sorterade listan) är exakt den klass av fel
// den här testfilen ska fånga innan wiringen görs.
describe('shouldShowEraChangeLine', () => {
  it('epok skiftade — true', () => {
    expect(shouldShowEraChangeLine('fotfaste', 'survival')).toBe(true)
  })
  it('samma epok som föregående säsong — false', () => {
    expect(shouldShowEraChangeLine('fotfaste', 'fotfaste')).toBe(false)
  })
  it('ingen föregående säsong (första i historiken) — false, inget att jämföra mot', () => {
    expect(shouldShowEraChangeLine('fotfaste', undefined)).toBe(false)
  })
  it('äldre save utan clubEra på den här säsongen — false', () => {
    expect(shouldShowEraChangeLine(undefined, 'survival')).toBe(false)
  })
})

describe('checkSeasonGoalHalfwayEvent — ambient rad (D1)', () => {
  function atHalfway(game: ReturnType<typeof baseGame>) {
    const template = game.fixtures[0]
    return {
      ...game,
      fixtures: [
        ...game.fixtures,
        { ...template, id: 'halfway_marker', roundNumber: 11, isCup: false, status: FixtureStatus.Completed, homeScore: 1, awayScore: 0 },
      ],
    }
  }

  it('inget mål valt — null, ingen rad', () => {
    const game = atHalfway(baseGame())
    expect(checkSeasonGoalHalfwayEvent(game)).toBeNull()
  })

  it('mål valt men inte halva säsongen än — null', () => {
    const game = { ...baseGame(), activeSeasonGoal: { type: 'playoff' as const, chosenSeason: 2025 } }
    expect(checkSeasonGoalHalfwayEvent(game)).toBeNull()
  })

  it('slutspel, positivt läge — "Ni ligger fyra", ingen påminnelse', () => {
    let game = atHalfway(baseGame())
    game = {
      ...game,
      activeSeasonGoal: { type: 'playoff', chosenSeason: game.currentSeason },
      standings: game.standings.map(s => s.clubId === game.managedClubId ? { ...s, position: 4 } : s),
    }
    const event = checkSeasonGoalHalfwayEvent(game)
    expect(event?.body).toBe('Du sa slutspel. Ni ligger fyra.')
    expect(event?.choices).toEqual([])
  })

  it('slutspel, negativt läge — påminnelsen läggs till', () => {
    let game = atHalfway(baseGame())
    game = {
      ...game,
      activeSeasonGoal: { type: 'playoff', chosenSeason: game.currentSeason },
      standings: game.standings.map(s => s.clubId === game.managedClubId ? { ...s, position: 9 } : s),
    }
    const event = checkSeasonGoalHalfwayEvent(game)
    expect(event?.body).toBe('Du sa slutspel. Ni ligger nio. Halva säsongen kvar.')
  })

  it('redan visad denna säsong (resolvedEventIds) — null, ingen dubblett', () => {
    let game = atHalfway(baseGame())
    game = {
      ...game,
      activeSeasonGoal: { type: 'playoff', chosenSeason: game.currentSeason },
      resolvedEventIds: [`event_season_goal_halfway_${game.currentSeason}`],
    }
    expect(checkSeasonGoalHalfwayEvent(game)).toBeNull()
  })

  it('ambient stängning skriver dedup-id så raden inte återkommer nästa omgång', () => {
    let game = atHalfway(baseGame())
    game = {
      ...game,
      activeSeasonGoal: { type: 'playoff', chosenSeason: game.currentSeason },
    }
    const event = checkSeasonGoalHalfwayEvent(game)!
    const resolved = resolveEvent({ ...game, pendingEvents: [event] }, event.id, 'ambient_dismiss', undefined, true)

    expect(resolved.resolvedEventIds).toContain(event.id)
    expect(resolved.resolvedChoices ?? []).toEqual(game.resolvedChoices ?? [])
    expect(checkSeasonGoalHalfwayEvent(resolved)).toBeNull()
  })

  it('kort i deferredDecisions spärrar en samtidig kopia', () => {
    let game = atHalfway(baseGame())
    game = {
      ...game,
      activeSeasonGoal: { type: 'playoff', chosenSeason: game.currentSeason },
    }
    const event = checkSeasonGoalHalfwayEvent(game)!

    expect(checkSeasonGoalHalfwayEvent({ ...game, deferredDecisions: [event] })).toBeNull()
  })

  // A-M7 (SEXSÄSONGSAUDITEN 2026-08-26): gaten var bara en NEDRE gräns
  // (ligaomgång >= 11) — getCurrentLeagueRound planar ut på 22 och stannar
  // där genom hela slutspelet, så om eventet inte hunnit visas kring
  // omgång 11 (t.ex. utkonkurrerad av annat i decision-kön) kunde "Halva
  // säsongen kvar" fortfarande skapas efter att grundserien redan var
  // avslutad. Kalenderfas (getSeasonEndPhase) sätter en övre gräns:
  // bara 'regular_active' godkänns.
  it('grundserien avslutad (omgång 22 spelad) — null, säsongen är inte längre "halva"', () => {
    const base = baseGame()
    const template = base.fixtures[0]
    const game = {
      ...base,
      fixtures: [
        ...base.fixtures,
        { ...template, id: 'round22_marker', roundNumber: 22, isCup: false, status: FixtureStatus.Completed, homeScore: 1, awayScore: 0 },
      ],
      activeSeasonGoal: { type: 'playoff' as const, chosenSeason: base.currentSeason },
      standings: base.standings.map(s => s.clubId === base.managedClubId ? { ...s, position: 9 } : s),
      playoffBracket: null,
    }
    expect(checkSeasonGoalHalfwayEvent(game)).toBeNull()
  })

  it('slutspel pågår (playoffBracket satt) — null, texten "halva säsongen" är inaktuell', () => {
    let game = atHalfway(baseGame())
    game = {
      ...game,
      activeSeasonGoal: { type: 'playoff', chosenSeason: game.currentSeason },
      standings: game.standings.map(s => s.clubId === game.managedClubId ? { ...s, position: 9 } : s),
      playoffBracket: {
        season: game.currentSeason,
        status: 'quarterFinals',
        quarterFinals: [{
          id: 'qf1', round: 'quarterFinal',
          homeClubId: game.managedClubId, awayClubId: 'club_skutskar',
          fixtures: [], homeWins: 0, awayWins: 0, winnerId: null, loserId: null,
        }],
        semiFinals: [], final: null, champion: null,
      } as never,
    }
    expect(checkSeasonGoalHalfwayEvent(game)).toBeNull()
  })
})
