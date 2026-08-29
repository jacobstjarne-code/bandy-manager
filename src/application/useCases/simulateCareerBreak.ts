/**
 * O13 / M11 — TRÄNARMARKNADEN, uppehållet (DOM_TRANARMARKNADEN_2026-08-26.md).
 *
 * "Säsongen spelas utan dig. Efter avskedet simuleras resten av säsongen och
 * den påföljande, och du ser vad som hände."
 *
 * Mekanik: `advanceToNextEvent` kan redan köra en hel omgång utan spelaren —
 * det är den vägen `npm run stress` använder, och den enda anledningen till
 * att den STANNAR för spelarens klubb är att `matchSimProcessor` hoppar över
 * en managed fixture utan sparad startelva. Uppehållet fyller därför i en
 * AI-genererad startelva varje omgång (`generateAiLineup`, exakt samma
 * funktion övriga elva klubbar använder) — efterträdaren tar ut laget, inte
 * spelaren. Ingen ny simuleringsmotor byggs.
 *
 * Två avskedsvägar, olika mycket kvar att spela:
 *   • Konkurs mitt i säsongen (postRoundFlagsProcessor) — resten av
 *     `firedAtSeason` PLUS hela nästa säsong.
 *   • Sportsligt/licens vid säsongsslut (seasonEndProcessor) — den säsongen är
 *     redan spelad av spelaren själv, kvar är nästa.
 * Båda uttrycks som samma villkor: kör tills `currentSeason >= firedAtSeason + 2`.
 *
 * Vad som INTE får ackumuleras under uppehållet: managern satt hemma. Hans
 * meritlista, säsongsräknare och årsbok ska inte växa av vad efterträdaren
 * gjorde. `seasonSummaries` kapas därför tillbaka till sin längd före
 * uppehållet, och `managerProfile` återställs (utom ålder, som förstås går) —
 * se `restoreProfileAfterBreak` nedan.
 */

import type { SaveGame } from '../../domain/entities/SaveGame'
import type { Player } from '../../domain/entities/Player'
import type { SeasonSummary } from '../../domain/entities/SeasonSummary'
import type { ManagerProfile } from '../../domain/entities/ManagerProfile'
import { advanceToNextEvent } from './roundProcessor'
import { generateAiLineup } from './processors/matchSimProcessor'
import { generateAICoaches } from '../../domain/services/aiCoachService'
import { mulberry32 } from '../../domain/utils/random'
import { safeStandingPosition } from '../../domain/services/standingsService'
import {
  buildCareerOffers,
  computeManagerRenomme,
  offerCountForRenomme,
  type CareerBreakReport,
  type CareerBreakSeasonLine,
  type CareerBreakState,
} from '../../domain/services/careerBreakService'

/** Säkerhetstak. Två säsonger är ~60 matchdagar; 400 kan bara nås av en bugg. */
const MAX_BREAK_ITERATIONS = 400

/**
 * Hur många advance-anrop i rad som får sakna framsteg innan loopen ger upp.
 * Två i rad är legitimt (ett övergångssteg följt av ett till); tre är en bugg.
 */
const MAX_STALLED_ITERATIONS = 3

/**
 * Allt som räknas som "något hände". Slutspelsstarten flyttar varken säsong
 * eller matchdag — den syns bara på playoffBracket. Se termineringsguarden.
 */
function progressKey(g: SaveGame): string {
  const completed = g.fixtures.reduce((n, f) => n + (f.status === 'completed' ? 1 : 0), 0)
  return [
    g.currentSeason,
    g.currentMatchday,
    completed,
    g.playoffBracket ? g.playoffBracket.status : 'none',
    (g.seasonSummaries ?? []).length,
  ].join('|')
}

/**
 * Vilodygnen räknas som återhämtning: uppehållet sänker utbrändheten till
 * samma golv som säsongsövergångens egen återhämtning siktar mot (30,
 * managerProfileService.applyBurnoutRecoveryAtTransition). Att låta en
 * manager komma tillbaka från ett år utan jobb med oförändrad utbrändhet hade
 * gjort mätaren till en ren straffräknare.
 */
const BURNOUT_FLOOR_AFTER_BREAK = 30

export interface SimulateCareerBreakResult {
  game: SaveGame
  /** Antal advance-anrop som faktiskt kördes — 0 betyder att inget gick att spela. */
  iterations: number
}

/**
 * Ren funktion, exporterad för test: managerns profil efter uppehållet.
 * Meriterna fryses vid avskedet; åldern går; utbrändheten läker.
 */
export function restoreProfileAfterBreak(
  before: ManagerProfile,
  seasonsSimulated: number,
): ManagerProfile {
  return {
    ...before,
    age: before.age + seasonsSimulated,
    burnoutScore: Math.min(before.burnoutScore, BURNOUT_FLOOR_AFTER_BREAK),
  }
}

/**
 * Ren funktion, exporterad för test. Gamla klubbens placering "när du lämnade
 * den": vid ett avsked mitt i säsongen är det tabellen just då, vid ett
 * avsked efter säsongsslutet är det den säsongens slutplacering.
 */
export function derivePositionUnderPlayer(game: SaveGame, firedAtSeason: number): number {
  const totalTeams = game.clubs.length
  const midSeasonFiring = game.currentSeason === firedAtSeason
  if (midSeasonFiring) {
    // safeStandingPosition (PÅSTÅENDEKARTAN-grinden) returnerar null när
    // klubben inte spelat en enda match — en tabellplacering före seriens
    // första avslag är ingen placering. Faller då tillbaka på sistaplats, som är
    // det pessimistiska antagandet: "sämre kan efterträdaren knappast göra"
    // gör att formerClubDidWorse aldrig blir sant på falska grunder.
    return safeStandingPosition(game.standings, game.managedClubId) ?? totalTeams
  }
  const own = (game.seasonSummaries ?? []).filter(s => s.clubId === game.managedClubId)
  return own[own.length - 1]?.finalPosition ?? totalTeams
}

/**
 * Kör uppehållet och returnerar spelet med `careerBreak` satt (stage
 * 'season' — domens ordning: säsongen först, frågan sedan).
 */
export function simulateCareerBreak(game: SaveGame): SimulateCareerBreakResult {
  const formerClubId = game.managedClubId
  const formerClub = game.clubs.find(c => c.id === formerClubId)
  const firedAtSeason = game.firedAtSeason ?? game.currentSeason
  const targetSeason = firedAtSeason + 2
  const summariesBefore = (game.seasonSummaries ?? []).length
  const profileBefore = game.managerProfile
  const positionUnderPlayer = derivePositionUnderPlayer(game, firedAtSeason)

  // Efterträdaren. Genereras ur worldSeed + säsong så uppehållet är
  // deterministiskt av samma anledning som resten av världen är det.
  const breakSeed = ((game.worldSeed ?? 42) + firedAtSeason * 7919 + 13337) | 0
  const replacementCoach = generateAICoaches([formerClubId], breakSeed)[formerClubId]
  const rand = mulberry32(breakSeed + 4242)

  let g: SaveGame = {
    ...game,
    aiCoaches: { ...(game.aiCoaches ?? {}), [formerClubId]: replacementCoach },
  }

  const seasonLines: CareerBreakSeasonLine[] = []
  let finalStandings: Array<{ clubId: string; position: number }> = []
  let iterations = 0
  let stalledIterations = 0

  while (g.currentSeason < targetSeason && iterations < MAX_BREAK_ITERATIONS) {
    // Efterträdaren tar ut laget. Utan detta hoppar matchSimProcessor över den
    // gamla klubbens match (managedClubPendingLineup === undefined), matchdagen
    // står still och loopen snurrar utan att någonting spelas.
    const club = g.clubs.find(c => c.id === formerClubId)
    if (!club) break
    const { selection, regenPlayers } = generateAiLineup(club, g.players, rand)
    let players: Player[] = g.players
    let clubs = g.clubs
    if (regenPlayers.length > 0) {
      // Samma persistering som roundProcessorns egen AI-väg gör för klubbar
      // med för tunn trupp — annars refererar startelvan spelare som inte
      // finns i registret.
      players = [...g.players, ...regenPlayers]
      clubs = g.clubs.map(c => c.id === formerClubId
        ? { ...c, squadPlayerIds: [...c.squadPlayerIds, ...regenPlayers.map(p => p.id)] }
        : c)
    }

    g = {
      ...g,
      players,
      clubs,
      managedClubPendingLineup: selection,
      // Ingen spelare finns för att svara på något av detta. Att låta det
      // ligga kvar hade blockerat uppmärksamhetsroutern när spelaren kommer
      // tillbaka i en NY klubb, med kort som gäller den gamla.
      pendingScreen: null,
      pendingScene: undefined,
      pendingEvents: [],
      deferredDecisions: [],
      pendingContractDemands: undefined,
      pendingWeeklyDecision: undefined,
      pendingRetirementDecision: undefined,
      pendingSeasonTransitionEvents: [],
    }

    const progressBefore = progressKey(g)
    const summariesLen = (g.seasonSummaries ?? []).length

    const result = advanceToNextEvent(g)
    g = result.game
    iterations++

    // En säsong tog slut: seasonEndProcessor har genererat en SeasonSummary
    // för den gamla klubben (den är fortfarande `managedClubId`). Den är
    // uppehållets bästa källa till hur det gick — och den ska INTE ligga kvar
    // i spelarens årsbok, så den plockas ut och kapas bort igen nedan.
    const newSummaries = (g.seasonSummaries ?? []).slice(summariesLen)
    for (const s of newSummaries) {
      seasonLines.push(buildSeasonLine(s, g))
      // Sluttabellen måste fångas HÄR, ur säsongens egen frysta snapshot.
      // seasonEndProcessor nollställer game.standings i samma rollover
      // (calculateStandings(ids, [])) — den som läser live-fältet efteråt får
      // en tom tabell, och därmed erbjudanden ur ingenting.
      if (s.standingsSnapshot && s.standingsSnapshot.length > 0) {
        finalStandings = s.standingsSnapshot.map(r => ({ clubId: r.clubId, position: r.position }))
      }
    }

    // Terminering. Rotorsak till att detta inte får vara "säsong eller
    // matchdag rörde sig": slutspelsstarten (handlePlayoffStart, via
    // derivePreRoundContext) är ett ÖVERGÅNGSSTEG som varken spelar en omgång
    // eller flyttar matchdagen — den bygger bara slutspelsträdet. En guard på
    // matchdag ensam bröt därför loopen exakt vid omgång 26 varje gång, och
    // ingen säsong blev någonsin färdigspelad. progressKey räknar därför även
    // spelade matcher och slutspelsträdets läge.
    if (progressKey(g) === progressBefore) {
      stalledIterations++
      if (stalledIterations >= MAX_STALLED_ITERATIONS) break
    } else {
      stalledIterations = 0
    }
  }

  const seasonsSimulated = seasonLines.length
  const bestPositionUnderReplacement = seasonLines.length > 0
    ? Math.min(...seasonLines.map(l => l.formerClubPosition))
    : positionUnderPlayer

  const report: CareerBreakReport = {
    formerClubId,
    formerClubName: formerClub?.name ?? formerClubId,
    positionUnderPlayer,
    bestPositionUnderReplacement,
    seasons: seasonLines,
    replacementCoachName: replacementCoach?.name ?? '',
    // Skärpning 2: högre siffra = sämre placering.
    formerClubDidWorse: bestPositionUnderReplacement > positionUnderPlayer,
    seasonsSimulated,
    // Fallback när ingen säsong hann avslutas (bara möjligt vid en trasig
    // simulering): tabellen som fanns när uppehållet började — men BARA om
    // den faktiskt är spelad. En orörd tabell (played === 0, position 0 på
    // alla rader) hade gett erbjudanden ur ingenting.
    finalStandings: finalStandings.length > 0
      ? finalStandings
      : game.standings.filter(r => r.played > 0).map(r => ({ clubId: r.clubId, position: r.position })),
  }

  // Avskedet räknas NU — renommén ska bära det, och skärpning 3 räknar avsked.
  const firings = (profileBefore?.firings ?? 0) + 1
  const restoredProfile = profileBefore
    ? {
        ...restoreProfileAfterBreak(profileBefore, seasonsSimulated),
        firings,
        careerSeasons: profileBefore.careerSeasons ?? profileBefore.seasonsAtClub,
      }
    : undefined

  // Årsboken tillhör spelaren, inte efterträdaren.
  const seasonSummaries = (g.seasonSummaries ?? []).slice(0, summariesBefore)

  const renomme = computeManagerRenomme(seasonSummaries, firings, g.clubs.length)

  const gameForOffers: SaveGame = { ...g, seasonSummaries, managerProfile: restoredProfile }
  const offers = buildCareerOffers({ game: gameForOffers, report, renomme, firings })

  const careerBreak: CareerBreakState = {
    firedAtSeason,
    stage: 'season',
    report,
    renomme,
    offers,
    // Skärpning 3: "Ingen ringde den här gången." Antingen för att avskeden
    // tagit slut på förtroendet, eller för att ingen klubb faktiskt blev ledig.
    careerOver: offers.length === 0,
  }

  return {
    game: {
      ...gameForOffers,
      seasonSummaries,
      managerProfile: restoredProfile,
      careerBreak,
    },
    iterations,
  }
}

function buildSeasonLine(summary: SeasonSummary, game: SaveGame): CareerBreakSeasonLine {
  const championClubId = summary.championClubId ?? null
  return {
    season: summary.season,
    formerClubPosition: summary.finalPosition,
    championClubId,
    championClubName: championClubId
      ? (game.clubs.find(c => c.id === championClubId)?.name ?? null)
      : null,
  }
}

/**
 * Ren predikatfunktion, exporterad för test och för GameOverScreen: kan den
 * här avskedade managern överhuvudtaget erbjudas ett uppehåll? Nej bara när
 * skärpning 3 redan är avgjord av avskedsräknaren — i alla andra fall spelas
 * säsongen, och att inget samtal kommer är något spelaren får se, inte något
 * som göms undan i förväg.
 */
export function canEnterCareerBreak(game: SaveGame): boolean {
  if (!game.managerFired) return false
  if (game.careerBreak) return false
  const firings = (game.managerProfile?.firings ?? 0) + 1
  // Renommé 100 = bästa möjliga; om inte ens det ger ett samtal är det
  // avskedsräknaren som stängt dörren, och då är karriären slut direkt.
  return offerCountForRenomme(100, firings) > 0
}
