import type { SaveGame } from '../entities/SaveGame'
import type { SeasonSummary } from '../entities/SeasonSummary'
import type { Fixture } from '../entities/Fixture'
import { ClubExpectation, FixtureStatus, MatchEventType, PlayoffRound } from '../enums'
import { summarizeSignature } from './seasonSignatureService'
import { seededPick, fixtureSeed } from '../utils/random'
import { ordinal } from '../utils/numberFormat'
import { deriveFixtureOutcome, countGoalsByPlayer, findLateWinnerGoal, isComeback } from './matchUtils'
import { formatRating } from '../format'
import { computeSeasonVerdictRating, expectationVerdictFromRating } from './boardService'

/**
 * @cites Player.promotedFromAcademy, Player.seasonStats.gamesPlayed, Player.seasonStats.averageRating, Player.seasonStats.goals, Player.careerMilestones, Player.diary, Player.isInjured
 */
function generateStoryTriggers(game: SaveGame): SeasonSummary['storyTriggers'] {
  const managedClubId = game.managedClubId
  const managedPlayers = game.players.filter(p => p.clubId === managedClubId)
  const triggers: NonNullable<SeasonSummary['storyTriggers']> = []

  // 1. Academy star: promoted from academy, ≥10 games, avgRating ≥7.0
  const academyStar = managedPlayers.find(p =>
    p.promotedFromAcademy === true &&
    p.seasonStats.gamesPlayed >= 10 &&
    p.seasonStats.averageRating >= 7.0
  )
  if (academyStar) {
    triggers.push({
      type: 'academyStarBorn',
      headline: `Akademistjärna: ${academyStar.firstName} ${academyStar.lastName}`,
      body: `${academyStar.firstName} ${academyStar.lastName} klev fram ur akademin och spelade ${academyStar.seasonStats.gamesPlayed} matcher med ett snittbetyg på ${formatRating(academyStar.seasonStats.averageRating)}.`,
      relatedPlayerId: academyStar.id,
    })
  }

  // 2. Hat trick hero: careerMilestones with type 'hatTrick' this season
  if (triggers.length < 3) {
    const hatTrickHero = managedPlayers.find(p =>
      (p.careerMilestones ?? []).some(m => m.type === 'hatTrick' && m.season === game.currentSeason)
    )
    if (hatTrickHero) {
      triggers.push({
        type: 'hatTrickHero',
        headline: `Hattrick: ${hatTrickHero.firstName} ${hatTrickHero.lastName}`,
        body: `${hatTrickHero.firstName} ${hatTrickHero.lastName} satte hattrick under säsongen. Det pratas fortfarande om den kvällen.`,
        relatedPlayerId: hatTrickHero.id,
      })
    }
  }

  // 3. Comeback king: was injured this season (actual diary entry,
  // not injuryProneness — det är en benägenhets-egenskap, inte historik),
  // came back, ≥5 goals, ≤15 games
  if (triggers.length < 3) {
    const comebackKing = managedPlayers.find(p =>
      p.isInjured === false &&
      (p.diary ?? []).some(e => e.type === 'injury' && e.season === game.currentSeason) &&
      p.seasonStats.goals >= 5 &&
      p.seasonStats.gamesPlayed <= 15 &&
      p.seasonStats.gamesPlayed > 0
    )
    if (comebackKing) {
      triggers.push({
        type: 'comebackKing',
        headline: `Comebackkung: ${comebackKing.firstName} ${comebackKing.lastName}`,
        body: `Trots skadebekymmer kämpade ${comebackKing.firstName} ${comebackKing.lastName} sig tillbaka och satte ${comebackKing.seasonStats.goals} mål på bara ${comebackKing.seasonStats.gamesPlayed} matcher.`,
        relatedPlayerId: comebackKing.id,
      })
    }
  }

  return triggers.length > 0 ? triggers : undefined
}

type MomentWithScore = NonNullable<SeasonSummary['keyMoments']>[number] & { score: number }

/**
 * PÅSTÅENDEKARTAN (2026-08-24, fixat samma dag): namnuppslag för hattrick/
 * sent avgörande mål läser game.players (ofiltrerad) — inte den klubb-
 * filtrerade managedPlayers-parametern — så en spelare som gjorde målet men
 * SÅLDES senare under säsongen hittas fortfarande, se kommentarerna vid
 * game.players.find nedan.
 *
 * Rotorsak (SEXSÄSONGSAUDITEN 2026-08-26, "bästa match och tidslinje
 * använde olika omgångsnummer i ett fall"): moments taggades tidigare med
 * `round: f.roundNumber` (per-tävling — ligarond 1-22 ELLER cuprond 1-4,
 * satt en gång i cupService.ts), medan "Säsongens match"-kortet i
 * SeasonSummaryScreen.tsx och storylineItems (samma tidslinje, se
 * DIN SÄSONG-mergen längre ned i screen-filen) redan använde `matchday`
 * (global spelordning). Samma fixture kunde alltså visas med två olika
 * "Omgång"-nummer beroende på VILKEN yta som renderade den. CLAUDE.md:s
 * hårda regel: all rond-identitet ska använda matchday, aldrig roundNumber.
 *
 * @cites game.players, clubFixtures, Fixture.matchday
 */
function computeKeyMoments(
  game: SaveGame,
  clubFixtures: Fixture[],
): NonNullable<SeasonSummary['keyMoments']> {
  const moments: MomentWithScore[] = []

  const BIG_WIN_POOL = [
    (margin: number, _opp: string) => `Två poäng och ${margin} mål tillgodo. En sån kväll.`,
    (_margin: number, opp: string) => `${opp} hängde med en halvlek. Sen inte.`,
    (_margin: number, _opp: string) => 'Allt satt. Hörnorna, kontringarna, humöret på läktaren.',
    (margin: number, _opp: string) => `Sådana marginaler vänjer man sig aldrig vid. ${margin} mål.`,
  ] as const

  const BIG_LOSS_POOL = [
    (margin: number, _opp: string) => `${margin} mål åt fel håll. Tyst i omklädningsrummet efteråt.`,
    (_margin: number, _opp: string) => 'Det gick sönder tidigt och lagade sig aldrig.',
    (_margin: number, opp: string) => `Inte mycket att säga. ${opp} var bättre på det mesta.`,
  ] as const

  const COMEBACK_POOL = [
    (_opp: string) => 'Underläge i paus, två poäng vid slutsignal. Sånt bär långt in i veckan.',
    (opp: string) => `${opp} ledde och trodde på det. Sen vände det.`,
    (_opp: string) => 'Vändningen kom när den behövdes. Läktaren glömmer inte sånt.',
  ] as const

  const LATE_WINNER_POOL = [
    (name: string) => `${name} avgjorde när klockan nästan gått ut. Sånt minns en läktare.`,
    (name: string) => `Sent, sent — och sen satt den. ${name}.`,
    (name: string) => `Det satt långt inne. ${name} fick sista ordet.`,
  ] as const

  const HAT_TRICK_POOL = [
    (name: string, goals: number) => `${goals} mål av en och samma man. ${name}s kväll.`,
    (name: string, goals: number) => `${name} satte ${goals}. Bollen åkte hem med honom, enligt traditionen.`,
    (name: string, _goals: number) => `Hattrick av ${name}. Vissa kvällar väljer en spelare.`,
  ] as const

  const DERBY_WIN_POOL = [
    (_opp: string, _score: string) => 'Derbyt. Vårt, den här gången.',
    (_opp: string, _score: string) => 'Halva byn såg det. Andra halvan får höra om det ett tag framöver.',
    (_opp: string, score: string) => `${score} — det räcker som beskrivning häromkring.`,
  ] as const

  const DERBY_LOSS_POOL = [
    (opp: string) => `${opp} tog derbyt. Det kommer på tal på Konsum ett tag.`,
    (_opp: string) => 'Förlorat derby. Vissa matcher väger mer än två poäng.',
    (_opp: string) => 'Tyst efteråt, tyst på måndagen. Derbyn gör så.',
  ] as const

  for (const f of clubFixtures) {
    const { margin, oppName, scoreStr, rivalry, isDerby } = deriveFixtureOutcome(f, game.managedClubId, game.clubs)
    const seed = fixtureSeed(f.id)
    const roundLabel = `Omgång ${String(f.matchday).padStart(2, '0')}`

    // Big win (3+ goal margin)
    if (margin >= 3) {
      const fn = seededPick(BIG_WIN_POOL, seed)
      moments.push({ round: f.matchday, type: 'bigWin', fixtureId: f.id,
        headline: `Stor seger mot ${oppName} (${scoreStr})`,
        body: `${roundLabel}: ${fn(margin, oppName)}`,
        score: margin * 10 + (isDerby ? 20 : 0) })
    }

    // Big loss (3+ goal margin)
    if (margin <= -3) {
      const fn = seededPick(BIG_LOSS_POOL, seed)
      moments.push({ round: f.matchday, type: 'bigLoss', fixtureId: f.id,
        headline: `Tung förlust mot ${oppName} (${scoreStr})`,
        body: `${roundLabel}: ${fn(Math.abs(margin), oppName)}`,
        score: Math.abs(margin) * 8 + (isDerby ? 20 : 0) })
    }

    // Derby result
    if (isDerby && margin !== 0) {
      if (margin > 0) {
        const fn = seededPick(DERBY_WIN_POOL, seed)
        moments.push({ round: f.matchday, type: 'derbyWin', fixtureId: f.id,
          headline: `Derbyvinst! ${rivalry!.name} (${scoreStr})`,
          body: `${roundLabel}: ${fn(oppName, scoreStr)}`,
          score: 35 + margin * 5 })
      } else {
        const fn = seededPick(DERBY_LOSS_POOL, seed)
        moments.push({ round: f.matchday, type: 'derbyLoss', fixtureId: f.id,
          headline: `Derbyförlust — ${rivalry!.name} (${scoreStr})`,
          body: `${roundLabel}: ${fn(oppName)}`,
          score: 25 })
      }
    }

    // Hat trick: 3+ goals by one managed player
    const goalsByPlayer = countGoalsByPlayer(f, game.managedClubId)
    for (const [pid, goals] of Object.entries(goalsByPlayer)) {
      if (goals >= 3) {
        // PÅSTÅENDEKARTAN omsvep (2026-08-24), VAR-fel-entitet: namnet slogs
        // upp i managedPlayers (klubb-filtrerad VID SÄSONGSSLUT) — en spelare
        // som gjorde hattricket men SÅLDES senare under säsongen hittades
        // inte där och blev "Okänd", trots att matchhändelsen (goalsByPlayer,
        // ovan) redan korrekt identifierat VILKEN match/vilket lag det gällde.
        // game.players (ofiltrerad) har spelarens namn oavsett nuvarande
        // clubId — namnet ändras inte av att spelaren bytt klubb.
        const p = game.players.find(pl => pl.id === pid)
        const name = p ? `${p.firstName} ${p.lastName}` : 'Okänd'
        const fn = seededPick(HAT_TRICK_POOL, seed)
        moments.push({ round: f.matchday, type: 'hatTrick', fixtureId: f.id, relatedPlayerId: pid,
          headline: `Hattrick — ${name} mot ${oppName}`,
          body: `${roundLabel}: ${fn(name, goals)}`,
          score: 30 + (goals - 3) * 10 })
        break
      }
    }

    // Late winner: won by 1, scoring goal in minute >= 80
    if (margin === 1) {
      const scorer = findLateWinnerGoal(f, game.managedClubId, 80)
      if (scorer) {
        // Samma fix som hattrick-namnet ovan — game.players, inte den
        // klubb-filtrerade managedPlayers-parametern.
        const p = scorer.playerId ? game.players.find(pl => pl.id === scorer.playerId) : null
        const scorerName = p ? `${p.firstName} ${p.lastName}` : 'Avslutning'
        const fn = seededPick(LATE_WINNER_POOL, seed)
        moments.push({ round: f.matchday, type: 'lateWinner', fixtureId: f.id, relatedPlayerId: scorer.playerId,
          headline: `Sent avgörande mot ${oppName} (${scoreStr})`,
          body: `${roundLabel}: ${fn(scorerName)}`,
          score: 25 + (isDerby ? 20 : 0) })
      }
    }

    // Comeback: we trailed (first goal was opponent's) but won
    if (isComeback(f, game.managedClubId, margin)) {
      const fn = seededPick(COMEBACK_POOL, seed)
      moments.push({ round: f.matchday, type: 'comeback', fixtureId: f.id,
        headline: `Comeback mot ${oppName} (${scoreStr})`,
        body: `${roundLabel}: ${fn(oppName)}`,
        score: 28 + margin * 5 })
    }
  }

  // One moment per fixture (highest score wins), then top 5 chronologically
  const byFixture = new Map<string, MomentWithScore>()
  for (const m of moments) {
    const key = m.fixtureId ?? `${m.round}_${m.type}`
    const existing = byFixture.get(key)
    if (!existing || m.score > existing.score) byFixture.set(key, m)
  }

  return [...byFixture.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .sort((a, b) => a.round - b.round)
    .map(({ score: _s, ...rest }) => rest)
}

export type { SeasonSummary }

/**
 * topScorer/topAssister/topRated/youngPlayer-refaktorn (2026-08-25, Jacobs
 * order: "seasonStats ackumulerar efter försäljning... rapportera ytorna,
 * sedan bygg"). Samma B12-mönster som computeKeyMoments ovan: läs målen/
 * assisten direkt ur clubFixtures's egna MatchEvent-poster (clubId=managerad
 * klubb VID DEN MATCHEN, oberoende av spelarens NUVARANDE clubId) i stället
 * för player.seasonStats, som fortsätter räkna för en köpande klubb efter
 * en försäljning eftersom transferService.ts aldrig nollställer den och
 * statsProcessor.ts uppdaterar ALLA spelare i ALLA fixtures varje omgång.
 * Rating har ingen MatchEvent-motsvarighet — läses istället ur
 * Fixture.report.playerRatings, samma härledning, samma oberoende av
 * NUVARANDE clubId (bara den historiska lineupen för just den matchen
 * avgör vem som räknas).
 *
 * mostImproved är INTE omfattad — currentAbility/startSeasonCA har ingen
 * per-match-händelse-motsvarighet i clubFixtures, en riktig fix kräver en
 * ny lagrad säsongsstarts-trupp-snapshot (vilka spelare var i klubben vid
 * säsongsstart, inte bara vid säsongsslut). Större scope, inte byggt här,
 * se BACKLOG.md.
 */
/**
 * @cites Fixture.events
 */
function countSeasonGoalsByPlayer(clubFixtures: Fixture[], managedClubId: string): Record<string, number> {
  const goals: Record<string, number> = {}
  for (const f of clubFixtures) {
    for (const evt of f.events ?? []) {
      if (evt.type === MatchEventType.Goal && evt.playerId && evt.clubId === managedClubId) {
        goals[evt.playerId] = (goals[evt.playerId] ?? 0) + 1
      }
    }
  }
  return goals
}

/**
 * @cites Fixture.events
 */
function countSeasonAssistsByPlayer(clubFixtures: Fixture[], managedClubId: string): Record<string, number> {
  const assists: Record<string, number> = {}
  for (const f of clubFixtures) {
    for (const evt of f.events ?? []) {
      if (evt.type === MatchEventType.Assist && evt.playerId && evt.clubId === managedClubId) {
        assists[evt.playerId] = (assists[evt.playerId] ?? 0) + 1
      }
    }
  }
  return assists
}

/**
 * @cites Fixture.report.playerRatings
 */
function computeSeasonRatings(clubFixtures: Fixture[], managedClubId: string): Record<string, { sum: number; games: number }> {
  const ratings: Record<string, { sum: number; games: number }> = {}
  for (const f of clubFixtures) {
    const isHome = f.homeClubId === managedClubId
    const lineup = isHome ? f.homeLineup : f.awayLineup
    const playerIds = new Set<string>([
      ...(lineup?.startingPlayerIds ?? []),
      ...(lineup?.benchPlayerIds ?? []),
    ])
    for (const pid of playerIds) {
      const rating = f.report?.playerRatings?.[pid]
      if (rating === undefined) continue
      const entry = ratings[pid] ?? { sum: 0, games: 0 }
      entry.sum += rating
      entry.games += 1
      ratings[pid] = entry
    }
  }
  return ratings
}

/**
 * M8 (audit 5c9a7a8, 2026-08-24) — extraherad ur generateSeasonSummary()
 * (var tidigare inline) så EXAKT samma mening kan byggas om för en gammal,
 * felaktigt migrerad SeasonSummary i saveGameMigration.ts, utan en andra
 * kopia av templaten (EN SANNING, ETT STÄLLE). A5 (2026-08-17) fixade redan
 * VILKEN dom (expectationVerdict) som väljs live — den här funktionen
 * bygger bara MENINGEN från en redan korrekt dom, oavsett var domen kom
 * ifrån (live-generering eller en efterhandsrättad gammal post).
 */
export function buildExpectationVerdictSentence(
  clubName: string,
  expectationVerdict: SeasonSummary['expectationVerdict'],
  finalPosition: number,
  boardExpectation: ClubExpectation,
  isChampion: boolean,
  season: number,
): string {
  // H4 Heros: Survive väntar på Opus-text, se boardService.ts:s BOARD_EXPECTATION_TEXT.
  const expectationText: Record<ClubExpectation, string> = {
    [ClubExpectation.Survive]: 'finnas kvar i serien',
    [ClubExpectation.AvoidBottom]: 'undvika nedflyttning',
    [ClubExpectation.MidTable]: 'hålla mittentabellen',
    [ClubExpectation.ChallengeTop]: 'utmana toppen',
    [ClubExpectation.WinLeague]: 'vinna ligan',
  }
  if (isChampion) {
    return `En historisk säsong! ${clubName} tog SM-guldet ${season + 1} i en strålande slutspelskampanj.`
  }
  if (expectationVerdict === 'exceeded') {
    return `${clubName} överträffade alla förväntningar och slutade på ${ordinal(finalPosition)} plats — styrelsen förväntade sig bara att ${expectationText[boardExpectation]}.`
  }
  if (expectationVerdict === 'met') {
    return `En solid säsong för ${clubName}. ${ordinal(finalPosition)} plats uppfyller styrelsens krav på att ${expectationText[boardExpectation]}.`
  }
  return `En besvikelse. ${clubName} slutade på ${ordinal(finalPosition)} plats — långt ifrån styrelsens mål att ${expectationText[boardExpectation]}.`
}

/**
 * PÅSTÅENDEKARTAN (2026-08-24, uppdaterad 2026-08-25): denna @cites-
 * deklaration täcker MEDVETET bara delmängden av funktionens fält som är
 * verifierad Sanning (placering, slutspel, matchstatistik, ekonomi).
 * topScorer/topAssister/topRated/youngPlayer läser nu clubFixtures's
 * MatchEvent/playerRatings — FIXAT, men via de tre helperfunktionerna ovan
 * (countSeasonGoalsByPlayer/countSeasonAssistsByPlayer/computeSeasonRatings),
 * som är de FAKTISKA verifierarna och bär sina egna @cites-taggar. Denna
 * funktion citerar bara sådant den själv läser direkt.
 * mostImproved beräknas fortfarande över managedPlayers (klubb-filtrerad
 * VID SÄSONGSSLUT) och missar en spelare som förbättrades men SÅLDES under
 * säsongen — känt, INTE fixat, kräver en ny säsongsstarts-trupp-snapshot
 * (BACKLOG.md). Citera inte mostImproved som om den vore källkorrekt.
 *
 * @cites StandingRow.finalPosition, StandingRow.points, StandingRow.wins, StandingRow.draws, StandingRow.losses, StandingRow.goalsFor, StandingRow.goalsAgainst, StandingRow.goalDifference, SaveGame.standings, SaveGame.playoffBracket, SeasonSummary.championClubId, SeasonSummary.eliminatedByClubId, SaveGame.seasonStartBoardExpectation, Club.boardExpectation, Fixture.roundNumber, Club.finances
 */
export function generateSeasonSummary(game: SaveGame, communityStandingEnd?: number): SeasonSummary {
  const managedClubId = game.managedClubId
  const club = game.clubs.find(c => c.id === managedClubId)!
  const managedPlayers = game.players.filter(p => p.clubId === managedClubId)

  // Completed league fixtures for managed club this season (no cup)
  const clubFixtures = game.fixtures.filter(f =>
    f.status === FixtureStatus.Completed &&
    f.season === game.currentSeason &&
    !f.isCup &&
    f.roundNumber <= 22 &&
    (f.homeClubId === managedClubId || f.awayClubId === managedClubId)
  ).sort((a, b) => a.roundNumber - b.roundNumber)

  const standing = game.standings.find(s => s.clubId === managedClubId)
  const finalPosition = standing?.position ?? 12
  const points = standing?.points ?? 0
  const wins = standing?.wins ?? 0
  const draws = standing?.draws ?? 0
  const losses = standing?.losses ?? 0
  const goalsFor = standing?.goalsFor ?? 0
  const goalsAgainst = standing?.goalsAgainst ?? 0
  const goalDifference = standing?.goalDifference ?? 0

  // Playoff result
  const bracket = game.playoffBracket
  let playoffResult: SeasonSummary['playoffResult'] = null
  // 2026-08-17 (Stickiness-audit): fångas HÄR, inte härlett senare ur en
  // bracket som kan vara nollställd/utbytt vid rollover — se SeasonSummary.ts.
  let eliminatedByClubId: string | undefined
  let decidingFixtureId: string | undefined
  let decidingRound: number | undefined
  // PÅSTÅENDEKARTAN (2026-08-24): snapshottas HÄR av samma skäl som
  // eliminatedByClubId — se SeasonSummary.ts. Oavsett om managedClub själv
  // blev mästare, för att smWinnerSentence i SeasonSummaryScreen.tsx ska
  // kunna nämna vinnaren utan att läsa den nollställda live-bracketen.
  const championClubId = bracket?.champion ?? undefined
  if (bracket) {
    if (bracket.champion === managedClubId) {
      playoffResult = 'champion'
    } else if (bracket.final?.homeClubId === managedClubId || bracket.final?.awayClubId === managedClubId) {
      playoffResult = bracket.final?.loserId === managedClubId ? 'finalist' : null
    }
    if (playoffResult === null) {
      const allSeries = [
        ...bracket.quarterFinals,
        ...bracket.semiFinals,
        ...(bracket.final ? [bracket.final] : []),
      ]
      for (const s of allSeries) {
        if (s.loserId === managedClubId) {
          playoffResult = s.round === PlayoffRound.QuarterFinal ? 'quarterfinal'
            : s.round === PlayoffRound.SemiFinal ? 'semifinal'
            : 'finalist'
          eliminatedByClubId = s.winnerId ?? undefined
          // matchday, inte roundNumber — global spelordning, se CLAUDE.md:s
          // arkitekturnot om matchday-systemet.
          const decidingFixture = game.fixtures
            .filter(f => s.fixtures.includes(f.id) && f.status === FixtureStatus.Completed)
            .sort((a, b) => a.matchday - b.matchday)
            .at(-1)
          decidingFixtureId = decidingFixture?.id
          decidingRound = decidingFixture?.roundNumber
          break
        }
      }
    }
    if (playoffResult === null && finalPosition > 8) {
      playoffResult = 'didNotQualify'
    }
  } else if (finalPosition > 8) {
    playoffResult = 'didNotQualify'
  }

  // Board expectation check
  // A5 (LANGSPEL 10 säsonger, 2026-08-17): denna behövde tidigare en EGEN
  // met/exceeded-tröskeltabell, oberoende av den som styr styrelsebetyget
  // i inboxen (generateSeasonVerdict, boardService.ts). De två tabellerna
  // drev isär — samma rot som growFanbase-etikettfyndet i SLUTTEST-audition
  // (två källor som beskriver samma sak). Nu delar båda samma rating via
  // computeSeasonVerdictRating, och expectationVerdictFromRating hanterar
  // WinLeague-specialfallet (binärt mål — "vinna ligan" betyder plats 1,
  // inget "nästan").
  // A-H1 (SEXSÄSONGSAUDITEN 2026-08-26, spår 2 rot a): club.boardExpectation
  // kan redan vara stegad till NÄSTA säsongs krav vid det här anropet —
  // seasonEndProcessor.ts stegar den (rad ~379) INNAN denna funktion anropas
  // (rad ~1332), så `game.clubs`/`club` här är post-stegning. game.
  // seasonStartBoardExpectation är den frusna snapshotten från säsongens
  // START (SaveGame.ts) och är vad årsboken faktiskt ska döma mot. Fallback
  // till club.boardExpectation kvar för gamla saves som saknar fältet
  // (saveGameMigration.ts backfyller inte detta specifikt, men fallbacken
  // gör gamla saves degraderande korrekta snarare än trasiga).
  const boardExpectation = game.seasonStartBoardExpectation ?? club.boardExpectation
  const isChampion = playoffResult === 'champion'

  const seasonVerdictRating = computeSeasonVerdictRating(boardExpectation, finalPosition, game.clubs.length)
  const expectationVerdict: SeasonSummary['expectationVerdict'] =
    expectationVerdictFromRating(boardExpectation, seasonVerdictRating, isChampion)
  // Legacy boolean mirror of expectationVerdict, kept for the (dev-only)
  // consumer that still reads it — derived from the same verdict, not a
  // second computation.
  const metExpectation = expectationVerdict !== 'failed'

  // Player stats — event-sourced (2026-08-25, se helpers ovan): läser
  // clubFixtures direkt, inte player.seasonStats, så en spelare som gjorde
  // poängen men SÅLDES under säsongen räknas fortfarande.
  const seasonGoals = countSeasonGoalsByPlayer(clubFixtures, managedClubId)
  const seasonAssists = countSeasonAssistsByPlayer(clubFixtures, managedClubId)
  const seasonRatings = computeSeasonRatings(clubFixtures, managedClubId)

  function lookupPlayer(playerId: string) {
    const p = game.players.find(pl => pl.id === playerId)
    return p ? `${p.firstName} ${p.lastName}` : 'Okänd'
  }

  const topScorerEntry = Object.entries(seasonGoals).sort((a, b) => b[1] - a[1])[0]
  const topScorer = topScorerEntry && topScorerEntry[1] > 0 ? {
    playerId: topScorerEntry[0],
    name: lookupPlayer(topScorerEntry[0]),
    goals: topScorerEntry[1],
    assists: seasonAssists[topScorerEntry[0]] ?? 0,
  } : null

  const topAssisterEntry = Object.entries(seasonAssists).sort((a, b) => b[1] - a[1])[0]
  const topAssister = topAssisterEntry && topAssisterEntry[1] > 0 ? {
    playerId: topAssisterEntry[0],
    name: lookupPlayer(topAssisterEntry[0]),
    assists: topAssisterEntry[1],
  } : null

  const topRatedEntry = Object.entries(seasonRatings)
    .filter(([, r]) => r.games >= 5)
    .sort((a, b) => (b[1].sum / b[1].games) - (a[1].sum / a[1].games))[0]
  const topRated = topRatedEntry ? {
    playerId: topRatedEntry[0],
    name: lookupPlayer(topRatedEntry[0]),
    avgRating: Math.round((topRatedEntry[1].sum / topRatedEntry[1].games) * 10) / 10,
    games: topRatedEntry[1].games,
  } : null

  // Most improved (using startSeasonCA)
  const improvedCandidates = managedPlayers
    .filter(p => p.startSeasonCA !== undefined && p.startSeasonCA > 0)
    .map(p => ({ p, gain: p.currentAbility - (p.startSeasonCA ?? p.currentAbility) }))
    .filter(x => x.gain > 0)
    .sort((a, b) => b.gain - a.gain)

  // Rotorsak (SEXSÄSONGSAUDITEN 2026-08-26, Lesjöfors "43 → 52" visat som
  // "+10"): caGain räknades tidigare ur RÅA (oavrundade) currentAbility/
  // startSeasonCA-värden, medan startCA/endCA avrundades var för sig.
  // Två oberoende avrundningar kan tappa/vinna 1 mot en avrundning av
  // differensen (t.ex. 42.6→43 och 52.4→52 avrundar var för sig, men
  // differensen 52.4-42.6=9.8 avrundar till 10) — de visade siffrorna
  // 43/52 och den visade deltan +10 hörde då inte ihop. Fix: härled
  // caGain ur de REDAN avrundade start/slut-värdena, aldrig ur råa float.
  const mostImprovedStartCA = Math.round(improvedCandidates[0]?.p.startSeasonCA ?? 0)
  const mostImprovedEndCA = Math.round(improvedCandidates[0]?.p.currentAbility ?? 0)
  const mostImproved = improvedCandidates[0] ? {
    playerId: improvedCandidates[0].p.id,
    name: `${improvedCandidates[0].p.firstName} ${improvedCandidates[0].p.lastName}`,
    caGain: mostImprovedEndCA - mostImprovedStartCA,
    startCA: mostImprovedStartCA,
    endCA: mostImprovedEndCA,
  } : null

  // U21 best player — rating/mål event-sourcede (samma seasonRatings/
  // seasonGoals ovan), men ålder är en levande Player-egenskap utan
  // matchhändelse-motsvarighet, läst ur OFILTRERAD game.players (samma
  // "hittas trots senare försäljning"-mönster som topScorer). Gaten
  // (seasonRatings-post med >=3 matcher) begränsar redan kandidaterna till
  // spelare som faktiskt spelat FÖR managerad klubb denna säsong — samma
  // isHome-lineup-läsning som computeSeasonRatings gör, ingen extra
  // clubId-filtrering behövs.
  const u21Candidates = game.players
    .filter(p => p.age <= 21 && (seasonRatings[p.id]?.games ?? 0) >= 3)
    .map(p => ({ p, ratingEntry: seasonRatings[p.id] }))
    .sort((a, b) => (b.ratingEntry.sum / b.ratingEntry.games) - (a.ratingEntry.sum / a.ratingEntry.games))

  const youngPlayer = u21Candidates[0] ? {
    playerId: u21Candidates[0].p.id,
    name: `${u21Candidates[0].p.firstName} ${u21Candidates[0].p.lastName}`,
    age: u21Candidates[0].p.age,
    goals: seasonGoals[u21Candidates[0].p.id] ?? 0,
    avgRating: Math.round((u21Candidates[0].ratingEntry.sum / u21Candidates[0].ratingEntry.games) * 10) / 10,
  } : null

  // Team stats from fixtures
  let totalGoals = 0, totalCornerGoals = 0, totalCleanSheets = 0
  let homeWins = 0, homeDraws = 0, homeLosses = 0
  let awayWins = 0, awayDraws = 0, awayLosses = 0
  let biggestWin: SeasonSummary['biggestWin'] = null
  let worstLoss: SeasonSummary['worstLoss'] = null
  let maxWinDiff = 0, maxLossDiff = 0

  for (const f of clubFixtures) {
    const isHome = f.homeClubId === managedClubId
    const clubScore = isHome ? f.homeScore : f.awayScore
    const oppScore = isHome ? f.awayScore : f.homeScore
    const oppId = isHome ? f.awayClubId : f.homeClubId
    const oppName = game.clubs.find(c => c.id === oppId)?.shortName ?? oppId

    totalGoals += clubScore
    if (oppScore === 0) totalCleanSheets++

    // Corner goals from events
    const cornerGoals = f.events.filter(e => e.isCornerGoal && e.clubId === managedClubId).length
    totalCornerGoals += cornerGoals

    if (isHome) {
      if (clubScore > oppScore) homeWins++
      else if (clubScore === oppScore) homeDraws++
      else homeLosses++
    } else {
      if (clubScore > oppScore) awayWins++
      else if (clubScore === oppScore) awayDraws++
      else awayLosses++
    }

    const diff = clubScore - oppScore
    if (diff > maxWinDiff) {
      maxWinDiff = diff
      biggestWin = { opponent: oppName, score: `${clubScore}-${oppScore}`, round: f.roundNumber }
    }
    if (diff < -maxLossDiff) {
      maxLossDiff = Math.abs(diff)
      worstLoss = { opponent: oppName, score: `${clubScore}-${oppScore}`, round: f.roundNumber }
    }
  }

  // Total assists from player stats
  const totalAssists = managedPlayers.reduce((sum, p) => sum + p.seasonStats.assists, 0)

  // Streaks
  let currentWinStreak = 0, longestWinStreak = 0
  let currentLossStreak = 0, longestLossStreak = 0

  for (const f of clubFixtures) {
    const isHome = f.homeClubId === managedClubId
    const clubScore = isHome ? f.homeScore : f.awayScore
    const oppScore = isHome ? f.awayScore : f.homeScore

    if (clubScore > oppScore) {
      currentWinStreak++
      currentLossStreak = 0
      longestWinStreak = Math.max(longestWinStreak, currentWinStreak)
    } else if (clubScore < oppScore) {
      currentLossStreak++
      currentWinStreak = 0
      longestLossStreak = Math.max(longestLossStreak, currentLossStreak)
    } else {
      currentWinStreak = 0
      currentLossStreak = 0
    }
  }

  // First/second half points
  let firstHalfPoints = 0, secondHalfPoints = 0
  for (const f of clubFixtures) {
    const isHome = f.homeClubId === managedClubId
    const clubScore = isHome ? f.homeScore : f.awayScore
    const oppScore = isHome ? f.awayScore : f.homeScore
    const pts = clubScore > oppScore ? 2 : clubScore === oppScore ? 1 : 0
    if (f.roundNumber <= 11) firstHalfPoints += pts
    else secondHalfPoints += pts
  }

  const formTrend: SeasonSummary['formTrend'] =
    secondHalfPoints > firstHalfPoints * 1.15 ? 'improving'
    : secondHalfPoints < firstHalfPoints * 0.85 ? 'declining'
    : 'stable'

  // Points per round for chart
  const roundPoints: number[] = []
  let cumulativePoints = 0
  for (let r = 1; r <= 22; r++) {
    const f = clubFixtures.find(fx => fx.roundNumber === r)
    if (f) {
      const isHome = f.homeClubId === managedClubId
      const clubScore = isHome ? f.homeScore : f.awayScore
      const oppScore = isHome ? f.awayScore : f.homeScore
      cumulativePoints += clubScore > oppScore ? 2 : clubScore === oppScore ? 1 : 0
    }
    roundPoints.push(cumulativePoints)
  }

  // Injuries — MatchEventType.Injury is never emitted by the match engine
  const totalInjuries = 0
  const mostInjuredPlayer = null

  // Finances
  const startFinances = game.seasonStartFinances ?? club.finances
  const endFinances = club.finances
  const financialChange = endFinances - startFinances

  // Youth intake for this season
  const youthRecords = game.youthIntakeHistory.filter(
    r => r.season === game.currentSeason && r.clubId === managedClubId
  )
  const youthIntakeCount = youthRecords.reduce((sum, r) => sum + r.playerIds.length, 0)

  const topProspectId = youthRecords.find(r => r.topProspectId)?.topProspectId
  const topProspectPlayer = topProspectId ? game.players.find(p => p.id === topProspectId) : null
  const bestYouthProspect = topProspectPlayer ? {
    name: `${topProspectPlayer.firstName} ${topProspectPlayer.lastName}`,
    position: topProspectPlayer.position,
    potential: Math.round(topProspectPlayer.potentialAbility),
  } : null

  // Cup result
  const cup = game.cupBracket
  let cupResult: SeasonSummary['cupResult'] = null
  if (cup) {
    if (cup.winnerId === managedClubId) {
      cupResult = 'winner'
    } else if (cup.matches.some(m => m.round === 4 && (m.homeClubId === managedClubId || m.awayClubId === managedClubId))) {
      cupResult = 'finalist'
    } else if (cup.matches.some(m => m.round === 3 && (m.homeClubId === managedClubId || m.awayClubId === managedClubId))) {
      cupResult = 'semifinal'
    } else if (cup.matches.some(m => m.round === 2 && (m.homeClubId === managedClubId || m.awayClubId === managedClubId))) {
      cupResult = 'quarter'
    } else {
      cupResult = 'eliminated'
    }
  }

  // Standings snapshot
  const standingsSnapshot = game.standings.map(s => ({
    clubId: s.clubId,
    position: s.position,
    points: s.points,
  }))

  // Narrative summary
  const verdictSentence = buildExpectationVerdictSentence(
    club.name, expectationVerdict, finalPosition, boardExpectation, isChampion, game.currentSeason
  )
  let narrative = verdictSentence

  if (formTrend === 'improving') {
    narrative += ' Formen förbättrades tydligt under säsongens andra halva.'
  } else if (formTrend === 'declining' && finalPosition > 3) {
    // Guard: top-3 finishes shouldn't get a "tung avslutning" narrative
    narrative += ' En stark inledning följdes dessvärre av en tung avslutning.'
  }

  if (topScorer && topScorer.goals >= 5) {
    narrative += ` ${topScorer.name} stod för ${topScorer.goals} mål och var lagets viktigaste offensiva kraft.`
  }

  // Storyline references in narrative
  const seasonStorylines = (game.storylines ?? []).filter(s => s.season === game.currentSeason && s.resolved)
  if (seasonStorylines.length > 0) {
    const storyTexts: string[] = []
    const proStories = seasonStorylines.filter(s => s.type === 'went_fulltime_pro')
    if (proStories.length > 0) {
      storyTexts.push(`${proStories.length} spelare blev heltidsproffs — ett modigt steg.`)
    }
    const varselStories = seasonStorylines.filter(s => s.type === 'rescued_from_unemployment')
    if (varselStories.length > 0) {
      storyTexts.push('Klubben höll ihop trots varslet.')
    }
    const captainStories = seasonStorylines.filter(s => s.type === 'captain_rallied_team')
    if (captainStories.length > 0) {
      storyTexts.push('Kaptenen samlade laget i en svår period.')
    }
    if (storyTexts.length > 0) {
      narrative += ' ' + storyTexts.join(' ')
    }
  }

  // Cup result in narrative
  if (cupResult === 'winner' && isChampion) {
    narrative += ' Dessutom säkrades Svenska Cupen — dubbeln, inget mindre.'
  } else if (cupResult === 'winner') {
    narrative += ' Svenska Cupen vanns — en bedrift som lyser upp säsongen.'
  } else if (cupResult === 'finalist') {
    narrative += ' I cupen nådde laget finalen men fick nöja sig med silver.'
  }

  const storyTriggers = generateStoryTriggers(game)
  const baseKeyMoments = computeKeyMoments(game, clubFixtures)

  // Merge resolved arc storylines into keyMoments (max 7 total, arcs ranked at 80 impact)
  const arcStorylineTypes = new Set([
    'hungrig_breakthrough', 'joker_vindicated', 'veteran_farewell', 'veteran_stayed',
    'lokal_hero_moment', 'captain_rallied_team', 'contract_drama_resolved', 'derby_echo_resolved',
  ])
  const resolvedArcStories = (game.storylines ?? []).filter(
    s => s.season === game.currentSeason && arcStorylineTypes.has(s.type as string) && s.resolved
  )
  type KeyMoment = NonNullable<SeasonSummary['keyMoments']>[number]
  const arcMoments: KeyMoment[] = resolvedArcStories.slice(0, 2).map(arc => ({
    round: arc.matchday,
    // Påståendesvepet #5: 'storyline', inte 'bigWin' — en arc-upplösning kan
    // vara bitter (contract_drama_resolved, veteran_farewell) och ska inte
    // få en ✅-ikon bara för att det var den placeholder som fanns.
    type: 'storyline' as const,
    headline: arc.displayText,
    body: arc.description,
    relatedPlayerId: arc.playerId,
  }))
  const allMoments = [...baseKeyMoments, ...arcMoments]
  const keyMoments = allMoments.slice(0, 7)

  return {
    id: `${game.id}_s${game.currentSeason}_${managedClubId}`,
    season: game.currentSeason,
    clubId: managedClubId,
    clubName: club.name,
    finalPosition,
    points,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    goalDifference,
    playoffResult,
    eliminatedByClubId,
    decidingFixtureId,
    decidingRound,
    championClubId,
    boardExpectation,
    metExpectation,
    expectationVerdict,
    verdictSentence,
    topScorer,
    topAssister,
    topRated,
    mostImproved,
    youngPlayer,
    totalGoals,
    totalAssists,
    totalCornerGoals,
    totalCleanSheets,
    longestWinStreak,
    longestLossStreak,
    biggestWin,
    worstLoss,
    homeRecord: { wins: homeWins, draws: homeDraws, losses: homeLosses },
    awayRecord: { wins: awayWins, draws: awayDraws, losses: awayLosses },
    firstHalfPoints,
    secondHalfPoints,
    formTrend,
    totalInjuries,
    mostInjuredPlayer,
    startFinances,
    endFinances,
    financialChange,
    youthIntakeCount,
    bestYouthProspect,
    roundPoints,
    narrativeSummary: narrative,
    cupResult,
    standingsSnapshot,
    storyTriggers,
    keyMoments: keyMoments.length > 0 ? keyMoments : undefined,
    communityStandingStart: game.communityStanding ?? 50,
    communityStandingEnd: communityStandingEnd ?? game.communityStanding ?? 50,
    communityHighlights: [],
    signatureRubric: game.currentSeasonSignature
      ? (summarizeSignature(game.currentSeasonSignature, game.scandalHistory) ?? undefined)
      : undefined,
  }
}

// ÅRSBOKENS_TVASANNINGSMENING_2026-08-23.md, Placeringsdomen — text låst av
// Jacob 2026-08-24, ordagrant. Betyg 3 säger "vad de väntade sig", INTE
// "precis vad de väntade sig" — "precis" läser som en prestation, och att
// göra det förväntade är ingen.
const PLACERINGSDOM_TEMPLATES: Record<1 | 2 | 3 | 4 | 5, (placering: string) => string> = {
  5: (p) => `${p} överträffade det de bad om.`,
  4: (p) => `${p} var mer än målet.`,
  3: (p) => `${p} var vad de väntade sig.`,
  2: (p) => `${p} låg under målet.`,
  1: (p) => `${p} var långt under det de bad om.`,
}

// Jacobs dom: bestämd form med ordningstal (Åttondeplatsen, Tredjeplatsen,
// Elfteplatsen) — ligan är fast vid 12 lag (CLUB_TEMPLATES.length===12), så
// hela intervallet 1-12 täcks utan att "otymplig"-undantaget (siffra+ändelse,
// "11:e platsen") någonsin behöver användas i praktiken. Fallbacken finns
// ändå ifall totalTeams någon gång skiljer sig i en historisk summary.
const ORDINAL_DEFINITE: Record<number, string> = {
  1: 'Förstaplatsen', 2: 'Andraplatsen', 3: 'Tredjeplatsen', 4: 'Fjärdeplatsen',
  5: 'Femteplatsen', 6: 'Sjätteplatsen', 7: 'Sjundeplatsen', 8: 'Åttondeplatsen',
  9: 'Niondeplatsen', 10: 'Tiondeplatsen', 11: 'Elfteplatsen', 12: 'Tolfteplatsen',
}

export function placeringsdomText(
  boardExpectation: ClubExpectation,
  finalPosition: number,
  totalTeams: number,
): string {
  const rating = computeSeasonVerdictRating(boardExpectation, finalPosition, totalTeams)
  const placering = ORDINAL_DEFINITE[finalPosition] ?? `${finalPosition}:e platsen`
  return PLACERINGSDOM_TEMPLATES[rating](placering)
}

/**
 * ÅRSBOKENS_TVASANNINGSMENING_2026-08-23.md (Jacobs dom): "när
 * placeringsdomen och uppdragsutfallet pekar åt olika håll ska båda stå i
 * samma mening... förbundna med men." Pekar de åt samma håll (eller finns
 * ingen objectiveOutcome-data) returneras null — anroparen visar bara
 * placeringsdomen, som i dag.
 *
 * `placeringsdom` skickas in av anroparen (SeasonSummaryScreen.tsx, byggd
 * med placeringsdomText ovan) — denna funktion väljer bara VILKEN av de
 * fyra formerna som gäller och bygger uppdragshalvan av meningen ur redan
 * känd data (objectiveOutcome). Ordningen (placering först, uppdrag sist)
 * och "men"-kopplingen är domens egen, inte en design här.
 *
 * Namngivning av ett enstaka missat uppdrag (domens "publikmålet nåddes
 * aldrig"-exempel) är INTE byggd — boardObjective-etiketter är imperativ-
 * formulerade ("Håll ekonomin i balans", "Investera överskottet") och kan
 * inte mekaniskt böjas till en grammatisk sats utan att uppfinna ny text.
 * Räkneformen ("ett uppdrag missades") används därför även vid N=1 tills
 * Opus dömer den namngivna formen per uppdragstyp.
 *
 * @cites SeasonSummary.expectationVerdict, SeasonSummary.objectiveOutcome.met, SeasonSummary.objectiveOutcome.atRisk, SeasonSummary.objectiveOutcome.failed
 */
export function seasonTwoTruthsSentence(
  summary: Pick<SeasonSummary, 'expectationVerdict' | 'objectiveOutcome'>,
  placeringsdom: string,
): string | null {
  const outcome = summary.objectiveOutcome
  if (!outcome) return null

  const placeringBra = summary.expectationVerdict !== 'failed'
  const { met, atRisk, failed } = outcome

  // Rotorsak (SEXSÄSONGSAUDITEN 2026-08-26, "det de bad om., men..."):
  // placeringsdom kommer alltid färdigpunkterad från placeringsdomText/
  // PLACERINGSDOM_TEMPLATES ovan. De tre grenarna nedan tejpade tidigare
  // fast en andra skiljetecken direkt efter den punkten (", men" eller ". ")
  // utan att kolla om en redan fanns där — dubbel interpunktion. Strippa
  // en eventuell befintlig sluttpunkt innan ny interpunktion läggs på, så
  // meningen alltid får EN skiljetecken mellan de två halvorna, oavsett
  // vad anroparen skickade in.
  const dom = placeringsdom.endsWith('.') ? placeringsdom.slice(0, -1) : placeringsdom

  if (placeringBra && failed > 0) {
    const missedClause = failed === 1 ? 'ett uppdrag missades' : `${failed} uppdrag missades`
    return `${dom}, men ${missedClause}.`
  }
  if (!placeringBra && failed === 0 && atRisk === 0 && met > 0) {
    return `${dom}. Uppdragen höll ni däremot.`
  }
  if (placeringBra && failed === 0 && atRisk > 0) {
    const atRiskClause = atRisk === 1 ? 'Ett uppdrag hängde löst' : `${atRisk} uppdrag hängde löst`
    return `${dom}. ${atRiskClause} ända in i mars.`
  }
  // Båda pekar åt samma håll (eller ingen av de tre fallen ovan matchar,
  // t.ex. dålig placering + hotade-men-ej-missade uppdrag — domen ger inget
  // fjärde fall för den kombinationen) — ingen tvåsanningsmening.
  return null
}

export interface ClubPositionTrend {
  clubId: string
  positions: number[]   // äldst→nyast, en per säsong som faktiskt har data
  direction: 'rising' | 'falling' | 'stable'
}

/**
 * Positionstrend för EN klubb (hanterad eller AI) över de senaste säsonger
 * denna manager-karriär spelat. Ren härledning ur game.seasonSummaries[].
 * standingsSnapshot — fältet skrivs redan för ALLA tolv klubbar varje
 * säsongsslut (generateSeasonSummary ovan, standingsSnapshot = hela
 * game.standings), bara aldrig LÄST för en AI-klubb förrän nu. Jacobs order
 * 2026-08-25, efter fjärde H4-mätningen: "AI-klubbarnas förändring: bygg
 * transfers och positionstrend, det är billigt och sant." Inget nytt fält,
 * ingen ny simulering — bara en diff över data som redan finns.
 *
 * null om färre än två säsonger har en registrerad position för klubben
 * (ingen trend går att uttala sig om på en enda datapunkt — 'stable' hade
 * varit en gissning förklädd till mätning).
 */
export function getClubPositionTrend(game: SaveGame, clubId: string, lastNSeasons = 3): ClubPositionTrend | null {
  const positions = [...game.seasonSummaries]
    .sort((a, b) => a.season - b.season)
    .slice(-lastNSeasons)
    .map(s => s.standingsSnapshot?.find(c => c.clubId === clubId)?.position)
    .filter((p): p is number => p !== undefined)

  if (positions.length < 2) return null

  const first = positions[0]
  const last = positions[positions.length - 1]
  const direction = last < first ? 'rising' : last > first ? 'falling' : 'stable'
  return { clubId, positions, direction }
}
