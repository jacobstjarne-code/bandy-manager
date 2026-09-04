import type { CommunityActivities, Sponsor, StandingRow, SaveGame } from '../entities/SaveGame'
import type { Club } from '../entities/Club'
import type { Player } from '../entities/Player'
import type { Fixture } from '../entities/Fixture'
import { generateVolunteerRoster, getActiveVolunteerBonus } from './volunteerService'
import type { Volunteer } from './volunteerService'
import { CUP_FINAL_VENUE } from '../data/specialDateStrings'
import { getRivalry } from '../data/rivalries'
import { getJournalistAttendanceModifier } from './journalistVisibilityService'
import { FixtureStatus, PlayerPosition } from '../enums'
import { safeStandingPosition } from './standingsService'
import { getOrtFreshnessFactor, getSeasonsActive } from './communityRenewalService'
import { getActivityStalenessMultiplier, getCsDiminishingFactor, getMatchRevenueRepDampFactor } from './communityStandingScaling'
import { FACILITY_NODE_DEFS } from '../data/facilityNodes'

// ── Finance log types ─────────────────────────────────────────────────────────

export type FinanceReason =
  | 'wages'
  | 'match_revenue'
  | 'weekly_base'
  | 'arena_maintenance'
  | 'sponsorship'
  | 'community_round'
  | 'cup_prize'
  | 'league_prize'
  | 'patron'
  | 'mecenat'
  | 'kommunbidrag'             // säsongsstart, economyService.ts (rykte+CS)
  | 'kommunbidrag_politiker'   // säsongsslut, politicianService.ts (CS+ungdom+agenda+relation) — DOM_FRAMGANGSEKONOMIN_UPPSIDAN_2026-08-31.md: två avsiktliga källor, skilda etiketter så en framtida reason-aggregering inte konflaterar dem
  | 'kommunstod'               // engångsbidrag, contextualSponsorService.ts (kontinuerlig CS-skala, tak 80k, en gång/säsong) — TREDJE oberoende kommun-mekanismen, hittad via financelog-gap-diagnos-2026-09-01.ts, tidigare helt olöggad
  | 'board_objective'          // förtroendepott, boardObjectiveService.ts (62 500 kr vid två raka flagship-mål) — hittad via financelog-gap-diagnos-2026-09-01.ts, tidigare helt olöggad
  | 'facility_upkeep'
  | 'budget_priority'
  | 'transfer_in'
  | 'transfer_out'
  | 'scout'
  | 'academy'
  | 'event'
  | 'contract_extension'
  | 'national_team_bonus'

export interface FinanceEntry {
  round: number
  amount: number      // positive = income, negative = cost
  reason: FinanceReason
  label: string       // human-readable, e.g. "Matchintäkt hemma vs Västerås"
}

export const FINANCE_LOG_MAX = 50

// ── Central mutation function ─────────────────────────────────────────────────

/**
 * Pure function — the single place where Club.finances is mutated.
 * All callers must go through this instead of writing { ...c, finances: c.finances + x }.
 */
export function applyFinanceChange(
  clubs: Club[],
  clubId: string,
  amount: number,
): Club[] {
  return clubs.map(c =>
    c.id === clubId ? { ...c, finances: c.finances + amount } : c
  )
}

// ── Bankruptcy thresholds ─────────────────────────────────────────────────────

export type FinanceStatus =
  | { status: 'healthy' }
  | { status: 'warning' }
  | { status: 'license-denial' }
  | { status: 'game-over' }

/**
 * Maps managed club cash to a finance status tier.
 * Call site is responsible for deduplication (once-per-season logic).
 */
export function evaluateFinanceStatus(finances: number): FinanceStatus {
  if (finances < -2_000_000) return { status: 'game-over' }
  if (finances < -1_000_000) return { status: 'license-denial' }
  if (finances < -500_000) return { status: 'warning' }
  return { status: 'healthy' }
}

/**
 * Appends a FinanceEntry to the log, capping it at FINANCE_LOG_MAX entries.
 */
export function appendFinanceLog(
  log: FinanceEntry[],
  entry: FinanceEntry,
): FinanceEntry[] {
  const updated = [...log, entry]
  return updated.length > FINANCE_LOG_MAX
    ? updated.slice(updated.length - FINANCE_LOG_MAX)
    : updated
}

/**
 * Härleder kassasaldo per omgång ur transaktionsloggen (C-SY2 Våg 4).
 * Ingen dedikerad tidsserie finns — vi rekonstruerar bakåt från nuvarande saldo:
 * saldo efter senaste loggade omg = currentBalance, sen subtraheras varje omgs netto.
 * Returnerar saldon i kronologisk ordning (äldst först). Tom array om loggen är tom.
 */
export function deriveKassaHistory(log: FinanceEntry[], currentBalance: number): number[] {
  if (log.length === 0) return []
  const rounds = [...new Set(log.map(e => e.round))].sort((a, b) => a - b)
  const netByRound = new Map<number, number>()
  for (const e of log) netByRound.set(e.round, (netByRound.get(e.round) ?? 0) + e.amount)

  const balances = new Array<number>(rounds.length)
  balances[rounds.length - 1] = currentBalance
  for (let i = rounds.length - 1; i > 0; i--) {
    balances[i - 1] = balances[i] - (netByRound.get(rounds[i]) ?? 0)
  }
  return balances
}

// ── Weather attendance (wirar in WeatherEffects.attendanceModifier — SYSTEMKARTA fynd 1) ──

/**
 * Publikandelen (0-1), delad av calcRoundIncome (intäkt) och calcAttendance
 * (den siffra spelaren faktiskt ser) — var tidigare duplicerad, oberoende,
 * identisk formel på två ställen (samma klass av risk som "två licenssystem",
 * RAPPORT_LICENSNEKAN_MEKANIK_OCH_RADDNINGSBARHET_2026-08-25.md).
 *
 * communityStanding-termen (Jacobs dom 2026-08-25, RAPPORT_MATCHINTAKT_VIKT_
 * OCH_COMMUNITYSTANDING_2026-08-25.md): "en klubb som betyder något för orten
 * fyller läktaren". Tidigare läste attendanceRate BARA fanMood (matchhumör,
 * strukturellt lågt för en förlorande klubb) + rykte — communityStanding
 * skickades in men användes ALDRIG i matchintäktskedjan, bara i kommunbidraget.
 * Ny vikt gör communityStanding till den DOMINERANDE termen (0,45 mot
 * fanMoods 0,25) medvetet: fanMood kan aldrig rädda en Survive-klubb (det
 * FÖRUTSÄTTER goda resultat), communityStanding är ortogonal mot resultat
 * och exakt den spak Survive-kontraktet ska ge spelaren. Golvet sänkt
 * (0,35→0,20): att ignorera orten kostar nu mer än att bara missa den gamla
 * neutrala baslinjen. moodWeight (calcAttendances neutrala-cupfinal-dämpning)
 * appliceras på BÅDA fanMood- och communityStanding-termerna av samma skäl
 * som redan gällde fanMood: på en neutral plan är ingen "hemma", varken i
 * matchhumör eller lokal lojalitet.
 */
const ATTENDANCE_FLOOR = 0.20
const ATTENDANCE_MOOD_WEIGHT = 0.25
const ATTENDANCE_STANDING_WEIGHT = 0.45
const ATTENDANCE_CAP = 0.95

// DOM_AH2_BASEKONOMI_INTAKT_2026-08-28, knapp 1: den gamla termen var binär
// (position<=3 → +0.08, annars 0) — en trea och en fyra skildes åt av ett
// stup, en fyra och en tia inte alls. Ersatt med en kontinuerlig, linjär
// funktion av tabellplaceringen över HELA ligan (12 klubbar, se CLAUDE.md):
// etta ger full TOP_POSITION_BONUS_MAX, tolva ger 0, allt däremellan
// interpolerat rakt av. D033 (design_principles) har den mätta motiveringen
// för TOP_POSITION_BONUS_MAX-värdet.
const LEAGUE_SIZE = 12
const TOP_POSITION_BONUS_MAX = 0.25

/**
 * ANSPRÅK 4, spak 3 — VÄG C (Jacobs beslut 2026-08-31,
 * DOM_ANSPAK4_TREDJE_SPAK_NYHET_2026-08-29.md §"VÄG C"). `freshnessFactor` är
 * klubbens `getOrtFreshnessFactor` (communityRenewalService.ts): hur färskt
 * ortsprogrammet är, ∈ [ORT_FRESHNESS_FLOOR, 1]. Default 1 = ingen påverkan,
 * vilket gäller varje anropare som inte är den hanterade klubben (AI-klubbar
 * har ingen staleness-mekanik — den ska inte uppfinnas åt dem).
 *
 * Multipliceras in i den FÄRDIGKLAMPADE raten, inte i summan innan taket. Det
 * är avsiktligt och är hela skillnaden mellan att mekaniken syns och inte: en
 * dominant klubb ligger ofta ÖVER ATTENDANCE_CAP i råsumman, så en freshness
 * inuti min() hade absorberats av taket precis för den klubbklass domen handlar
 * om. Faktorn klampas till [0, 1] så den aldrig kan lyfta raten över taket —
 * "inom det befintliga ATTENDANCE_CAP", domens ord.
 */
export function computeAttendanceRate(
  fanMood: number,
  communityStanding: number,
  position: number,
  moodWeight = 1,
  freshnessFactor = 1,
): number {
  const clampedPosition = Math.max(1, Math.min(LEAGUE_SIZE, position))
  const positionTerm = TOP_POSITION_BONUS_MAX * (LEAGUE_SIZE - clampedPosition) / (LEAGUE_SIZE - 1)
  const cappedRate = Math.min(
    ATTENDANCE_CAP,
    ATTENDANCE_FLOOR
      + (fanMood / 100) * ATTENDANCE_MOOD_WEIGHT * moodWeight
      + (communityStanding / 100) * ATTENDANCE_STANDING_WEIGHT * moodWeight
      + positionTerm * moodWeight,
  )
  return cappedRate * Math.max(0, Math.min(1, freshnessFactor))
}

/**
 * Effektiv väderpublikfaktor. weatherService beräknar attendanceModifier per match
 * (snöstorm 0.60 … klart 1.0) men den konsumerades aldrig före 2026-06-12.
 * - Inomhusarena: alltid 1.0 (vädret når inte läktaren).
 * - Stora tillfällen (final/annandag): dippen HALVERAS — finalpublik kommer ändå
 *   (jfr 3×30-finalen 2010: fullsatt i snöstorm).
 */
export function effectiveWeatherAttendance(
  rawModifier: number | undefined,
  hasIndoorArena: boolean | undefined,
  isBigOccasion: boolean,
): number {
  if (hasIndoorArena) return 1.0
  const mod = rawModifier ?? 1.0
  return isBigOccasion ? (mod + 1.0) / 2 : mod
}

// ── Canonical round income calculation ───────────────────────────────────────

export interface RoundIncomeBreakdown {
  weeklyBase: number             // 3000 + reputation × 50
  sponsorIncome: number          // active sponsors' weeklyIncome
  matchRevenue: number           // ticket/gate revenue for a home match (0 if away/no match)
  communityMatchIncome: number   // kiosk/vipTent/functionaries/bandySchoolBasic per home match, net
  communityRoundIncome: number   // lottery/bandySchoolBasic/bandySchool/socialMedia/bandyplay per round, net
  volunteerIncome: number        // active volunteers, role-based income (avg 340/vol) per round
  kommunBidrag: number           // reputation × communityStanding-based bidrag (once at round 1)
  weeklyWages: number            // monthly salary total / 4
  weeklyArenaCost: number        // arenaCapacity × 5 per round
  weeklyLegendCost: number       // 500 kr/omgång per aktiv legend (youth_coach | scout)
  facilityUpkeep: number         // O5 kraft 2: summa upkeepCost för byggda noder (once at round 1)
  municipalLoanCost: number      // kommunlånets årskostnad / 22 serieomgångar
  busContractCost: number        // låst resekostnad per omgång under bussavtalet
  netPerRound: number            // sum of all income − wages − arena cost
}

export interface CalcRoundIncomeParams {
  club: Club
  players: Player[]
  sponsors: Sponsor[]
  communityActivities: CommunityActivities | undefined
  volunteers?: string[]
  volunteerRoster?: Volunteer[]    // role-based roster (same seed as OrtenTab); falls back to flat avg
  sponsorNetworkMood?: number      // 0-100; multiplies sponsor income: 1 + (mood - 50) * 0.0086
  fanMood: number
  isHomeMatch: boolean
  matchIsKnockout: boolean
  matchIsCup: boolean
  matchHasRivalry: boolean
  standing: StandingRow | null
  rand: () => number
  communityStanding?: number     // 0-100, used for kommunBidrag calculation
  isFirstRound?: boolean         // true only at matchday 1 — triggers kommunBidrag payout
  legendSalaryCost?: number      // 500 kr × antal aktiva legendroller (youth_coach | scout)
  journalistAttendanceModifier?: number  // from journalistVisibilityService (0.95 / 1.0 / 1.10)
  weatherAttendanceModifier?: number     // from MatchWeather.effects via effectiveWeatherAttendance (1.0 om frånvarande)
  builtFacilityUpkeepCosts?: number[]    // O5 kraft 2: upkeepCost för varje byggd nod (FacilityState.builtNodeIds → FACILITY_NODE_DEFS)
  /** Påståendekartan, byggnodernas löften (2026-08-27): FacilityState.builtNodeIds
   *  rakt av, så kiosk-noden kan höja kioskens sqrt-rate och stralkastare-noden
   *  kan höja sponsorintäkten — de två löften i facilityNodes.ts som var
   *  BILLIGA att wira mot en redan existerande mekanism (se RAPPORT_
   *  BYGGNODLOFTEN_2026-08-27.md för alla nio nodernas genomgång). */
  builtNodeIds?: string[]
  /** Åskådarekonomin v2 (2026-08-27): den FAKTISKA publiksiffran för
   *  hemmamatchen, läst direkt från `Fixture.attendance` (satt av
   *  matchSimProcessor.ts:s calcAttendance()-anrop — SAMMA tal, inte en ny
   *  beräkning). Saknas för display-estimat-anropare (EkonomiTab/
   *  EkonomiSecondary) som inte har en simulerad fixture än — dessa faller
   *  tillbaka till den lokala capacity×attendanceRate-uppskattningen (samma
   *  tal matchRevenue redan använder). */
  matchAttendance?: number
  /** ANSPRÅK 4, spak 3 / väg C: den hanterade klubbens `getOrtFreshnessFactor`.
   *  Multipliceras in i publikandelen (computeAttendanceRate) och därmed i BÅDE
   *  matchRevenue och den publikberoende communityMatchIncome. Utelämnad ⇒ 1
   *  (ingen påverkan). */
  freshnessFactor?: number
  /** Bandyplay-streamingens egen staleness. Påverkar bara den additiva
   * sponsorbonusen; aktivitetens produktionskostnad fortsätter tills den
   * stängs av. Utelämnad ⇒ ny/färsk satsning (1). */
  streamingFreshnessMultiplier?: number
  municipalLoanAnnualCost?: number
  busContractRoundCost?: number
}

// O5 kraft 1 — löneinflation med rykte (Jacobs dom 2026-08-17,
// DOM_FRAMGANGSEKONOMIN_2026-08-17.md, byggd 2026-08-23 efter Grind 1
// passerade). Samma kurva som kommunbidragets repFactor nedan
// (0.5–1.5 över rykte 0-100) — en sanning, ett ställe, återanvänd här
// istf en andra oberoende gissning. rep 50 (ligans mitt) ≈ 1.0x
// (oförändrat golv), rep 90 ≈ 1.4x, rep 45 ≈ 0.95x.
export function reputationSalaryMultiplier(reputation: number): number {
  return 0.5 + (reputation / 100) * 1.0
}

// ── O5 kraft 1, prestationsfaktor på lönekravet (Jacobs dom 2026-08-27,
// DOM_FRAMGANGSKURVAN_2026-08-27.md, anspråk 1 — "Truppen vill ha det den
// är värd"). Rykte skalade redan lönekravet (ovan); denna faktor lägger
// SÄSONGSPRESTATION ovanpå — en skyttekung ska kosta mer än en reserv med
// samma currentAbility. Formeln (och trösklarna) var duplicerad på tre
// ställen (transferActions.ts, ContractsTab.tsx, transferService.ts) —
// bruten ut hit, EN SANNING, ETT STÄLLE.
//
// Minsta stickprov: under 5 ligamatcher denna säsong är signalen för
// svag för att få slå igenom på lönekravet (tidig-säsong-brus) — då
// faller spelaren tillbaka till performanceFactor = 1 (ren ability/
// rykte-formel). Samma tröskel exkluderar cameo-spelare ur själva
// LIGASNITTET, så att en handfull minuter för en djupbänkad spelare
// inte drar ner positionens snitt mot noll.
export const MIN_LEAGUE_GAMES_FOR_PERFORMANCE_FACTOR = 5

export interface LeaguePositionAverage {
  avgRating: number
  avgGoals: number
  avgAssists: number
}

/**
 * Ligasnitt per position, denna säsong, ÖVER ALLA KLUBBAR — inte bara den
 * hanterade. `player.seasonStats` (Player.ts) är redan en genuint liga-
 * bred, kumulativ per-spelare-räknare (statsProcessor.ts:s
 * `updatePlayerMatchStats` itererar VARJE simulerad omgångs alla fixtures,
 * hemma- och bortalag, oavsett klubb — inte bara den hanterade klubbens
 * matcher) och nollställs vid säsongsrollover (seasonEndProcessor.ts).
 * Det gör att detta INTE behöver skanna `game.fixtures`/events själv —
 * samma mönster som `seasonSummaryService.ts`s countSeasonGoalsByPlayer/
 * countSeasonAssistsByPlayer/computeSeasonRatings löser klubb-scopat,
 * men här är källan redan aggregerad på spelaren och äkta liga-bred.
 *
 * @cites Player.seasonStats.gamesPlayed, Player.seasonStats.averageRating,
 * Player.seasonStats.goals, Player.seasonStats.assists, Player.position
 */
export function computeLeaguePositionAverages(game: SaveGame): Record<PlayerPosition, LeaguePositionAverage> {
  const sums: Record<PlayerPosition, { rating: number; goals: number; assists: number; count: number }> = {
    [PlayerPosition.Goalkeeper]: { rating: 0, goals: 0, assists: 0, count: 0 },
    [PlayerPosition.Defender]: { rating: 0, goals: 0, assists: 0, count: 0 },
    [PlayerPosition.Half]: { rating: 0, goals: 0, assists: 0, count: 0 },
    [PlayerPosition.Midfielder]: { rating: 0, goals: 0, assists: 0, count: 0 },
    [PlayerPosition.Forward]: { rating: 0, goals: 0, assists: 0, count: 0 },
  }

  for (const player of game.players) {
    const stats = player.seasonStats
    if (!stats || stats.gamesPlayed < MIN_LEAGUE_GAMES_FOR_PERFORMANCE_FACTOR) continue
    const bucket = sums[player.position]
    bucket.rating += stats.averageRating
    bucket.goals += stats.goals
    bucket.assists += stats.assists
    bucket.count += 1
  }

  const result = {} as Record<PlayerPosition, LeaguePositionAverage>
  for (const pos of Object.values(PlayerPosition)) {
    const bucket = sums[pos]
    result[pos] = bucket.count > 0
      ? { avgRating: bucket.rating / bucket.count, avgGoals: bucket.goals / bucket.count, avgAssists: bucket.assists / bucket.count }
      : { avgRating: 6.0, avgGoals: 0, avgAssists: 0 }
  }
  return result
}

// Klamp på prestationsfaktorn (Jacobs dom): 0.85–1.40. En extrem
// underprestation kan bara sänka lönekravet 15% under den rena
// ability/rykte-formeln; en extrem toppsäsong kan höja det 40% däröver.
const PERFORMANCE_FACTOR_MIN = 0.85
const PERFORMANCE_FACTOR_MAX = 1.40

function clampPerformanceFactor(value: number): number {
  return Math.max(PERFORMANCE_FACTOR_MIN, Math.min(PERFORMANCE_FACTOR_MAX, value))
}

/**
 * Enda källan till ett spelarkontrakts minimilönekrav — ersätter de tre
 * dubblerade inline-formlerna i transferActions.ts (renewContract),
 * ContractsTab.tsx (display + handleRenew), och transferService.ts
 * (createOutgoingBid). Bas + rykte var redan delad väg (reputationSalary-
 * Multiplier ovan); prestationsfaktorn är ny (O5 kraft 1, denna commit).
 *
 * @cites Player.currentAbility, Player.dayJob, Player.seasonStats, Club.reputation
 */
export function computeContractMinSalary(
  player: Player,
  club: Club,
  leagueAverages: Record<PlayerPosition, LeaguePositionAverage>,
): number {
  const isFullTimePro = !player.dayJob
  const repFactor = reputationSalaryMultiplier(club.reputation)
  const base = isFullTimePro ? player.currentAbility * 200 * 0.80 : player.currentAbility * 80 * 0.80

  const stats = player.seasonStats
  let performanceFactor = 1
  if (stats && stats.gamesPlayed >= MIN_LEAGUE_GAMES_FOR_PERFORMANCE_FACTOR) {
    const positionAverage = leagueAverages[player.position]
    const ratingDelta = stats.averageRating - positionAverage.avgRating
    const goalsDelta = stats.goals - positionAverage.avgGoals
    const assistsDelta = stats.assists - positionAverage.avgAssists
    performanceFactor = clampPerformanceFactor(
      1 + ratingDelta * 0.08 + goalsDelta * 0.015 + assistsDelta * 0.012,
    )
  }

  return Math.round((base * repFactor * performanceFactor) / 500) * 500
}

/** Nästa säsongs transferutrymme räknas från den färdiga sommarkassan. */
export function deriveSeasonTransferBudget(finances: number): number {
  return Math.max(0, Math.round(finances * 0.15))
}

export interface RoundIncomeParamsForNextFixture {
  isHomeMatch: boolean
  matchIsKnockout: boolean
  matchIsCup: boolean
  matchHasRivalry: boolean
  communityStanding: number | undefined
  journalistAttendanceModifier: number
  weatherAttendanceModifier: number
  isFirstRound: boolean
  /** ANSPRÅK 4, spak 3 / väg C. calcRoundIncome anropas bara för den hanterade
   *  klubben (economyProcessor.ts; AI-klubbar har en egen flat uppskattning),
   *  så den här är alltid den hanterade klubbens. */
  freshnessFactor: number
  streamingFreshnessMultiplier: number
  volunteers: string[]
  volunteerRoster: Volunteer[]
  sponsorNetworkMood: number | undefined
  legendSalaryCost: number
  builtFacilityUpkeepCosts: number[]
  builtNodeIds: string[]
  municipalLoanAnnualCost: number
  busContractRoundCost: number
}

/**
 * Preview-mönstret, "samma funktion, samma indata" (2026-08-26,
 * RAPPORT_FYRA_UTREDNINGAR_2026-08-26.md, andra bekräftade instansen).
 * `EkonomiTab.tsx` och `EkonomiSecondary.tsx` anropade `calcRoundIncome()`
 * med `isHomeMatch: true` HÅRDKODAT — oavsett om klubbens nästa faktiska
 * match är hemma eller borta — och utelämnade communityStanding/väder/
 * journalist-modifierarna helt. Spelaren såg en "veckointäkt" som
 * beskrev en påhittad genomsnittsmatch, inte den verkliga kommande
 * omgången. Denna funktion härleder samma parametrar `economyProcessor.ts`
 * (den riktiga mutationen) skulle använt för klubbens NÄSTA schemalagda
 * match — samma sanning, en delad väg dit.
 *
 * Om ingen match är schemalagd (säsongsuppehåll, mellan säsonger):
 * `isHomeMatch: false` är korrekt — "ingen match denna omgång" är ett
 * riktigt svar, inte ett saknat värde att gissa bort.
 */
export function buildRoundIncomeParamsForNextFixture(game: SaveGame): RoundIncomeParamsForNextFixture {
  const managedId = game.managedClubId
  const club = game.clubs.find(c => c.id === managedId)
  const nextFixture = game.fixtures
    .filter(f => f.status === FixtureStatus.Scheduled && (f.homeClubId === managedId || f.awayClubId === managedId))
    .sort((a, b) => (a.matchday ?? 0) - (b.matchday ?? 0))[0]
  const rivalry = nextFixture ? getRivalry(nextFixture.homeClubId, nextFixture.awayClubId) : null
  const volunteerSeedNum = managedId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + game.currentSeason * 17
  const builtNodeIds = game.facilityState?.builtNodeIds ?? []

  return {
    isHomeMatch: nextFixture?.homeClubId === managedId,
    matchIsKnockout: !!nextFixture?.isKnockout,
    matchIsCup: !!nextFixture?.isCup,
    matchHasRivalry: !!rivalry,
    communityStanding: game.communityStanding,
    journalistAttendanceModifier: getJournalistAttendanceModifier(game),
    weatherAttendanceModifier: effectiveWeatherAttendance(
      game.matchWeathers?.find(mw => mw.fixtureId === nextFixture?.id)?.effects.attendanceModifier,
      club?.hasIndoorArena,
      Boolean(nextFixture?.isFinaldag || nextFixture?.isAnnandagen || (nextFixture?.matchday ?? 0) > 22),
    ),
    isFirstRound: nextFixture?.matchday === 1,
    freshnessFactor: club ? getOrtFreshnessFactor(game, club.reputation) : 1,
    streamingFreshnessMultiplier: club
      ? getActivityStalenessMultiplier(
          getSeasonsActive(game.communityActivitiesSince, 'bandyplay', game.currentSeason),
          club.reputation,
        )
      : 1,
    volunteers: game.volunteers ?? [],
    volunteerRoster: generateVolunteerRoster(volunteerSeedNum, 4),
    sponsorNetworkMood: game.sponsorNetworkMood,
    legendSalaryCost: ((game.clubLegends ?? [])
      .filter(l => l.role === 'youth_coach' || l.role === 'scout').length) * 500,
    builtFacilityUpkeepCosts: builtNodeIds.map(id => FACILITY_NODE_DEFS.find(def => def.id === id)?.upkeepCost ?? 0),
    builtNodeIds,
    municipalLoanAnnualCost: game.currentSeason < (game.municipalLoanUntilSeason ?? 0)
      ? (game.municipalLoanAnnualCost ?? 0)
      : 0,
    busContractRoundCost: game.currentSeason < (game.busContractUntilSeason ?? 0)
      ? (game.busContractRoundCost ?? 0)
      : 0,
  }
}

/**
 * Single canonical income calculation.
 * Used by roundProcessor for the actual finance mutation,
 * and by EkonomiTab (with rand: () => 0.5) for display estimates.
 *
 * Community income is split into two parts:
 *   communityMatchIncome — events tied to a home match (kiosk, VIP-tält, etc.)
 *   communityRoundIncome — per-round regardless of home/away (lottery, schools, socialMedia, Bandyplay production)
 *
 * bandySchoolBasic appears in both: per-match deltagaravgifter + per-round
 * bandyskola-drift. Bandyplay is streaming and affects sponsors plus a flat
 * production cost — never a fabricated rights-income row.
 */
// Lotteriets hemmabonus (Jacobs order: "Lotter säljs i bygden, mest på
// match"): bara försäljningsdelen skalar upp på hemmamatch-omgångar — den
// flata driftskostnaden (800/500) är opåverkad, samma logik som kioskens
// golv (overhead ändras inte av matchdag). Mätt, säker — skalar inte med
// attendance, bara med isHomeMatch (binärt), ingen explosionsrisk.
const LOTTERY_HOME_MULT = 1.5

// Åskådarekonomin v2 (2026-08-27, Jacobs dom efter mätning — RAPPORT_
// ASKADAREKONOMIN_V2_MATNING_2026-08-27.md). Första kandidaten (linjär
// kr/huvud) kastades — exploderade 27-34× för starka klubbar över ett
// attendance-spann på >10× (Heros ~172, Forsbacka ~1859). Denna skalar med
// sqrt(publik) istf linjärt — komprimerar samma spann till ~3,3×, en
// avtagande marginalintäkt (fler åskådare ger fortfarande mer kiosk-
// intäkt, men inte proportionellt mer).
//
// Golvet är en ANDEL av driftskostnaden (50%), inte ett fritt valt
// kronbelopp — samma golv-mot-kostnad-relation oavsett tier, så det inte
// blir en ny gissning per magnitud. Jacobs uttryckliga ord efter mätning:
// "Höj inte golvet för Heros... Golvet relativt driftskostnaden är rätt
// konstruktion — att skruva det tills en klubb går plus är att kalibrera
// mot ett symptom." Heros (kanoniskt sämst, Survive-kontraktet) SKA kunna
// gå back på den dyraste anläggningsnivån — det är inte en bugg, det är
// kontraktet ("överlever om orten kommer, inte att den blir lönsam").
// DOM_AH2_BASEKONOMI_INTAKT_2026-08-28, knapp 2: matchintäktens formBonus
// (multiplikator på baseRevenue för hemmamatch, position i tabellen).
// Gamla spannet (1.15/1.05/0.88/1.0) var för smalt för att själva bära
// framgångens intäktssvar — vidgat efter mätning (D033).
const FORM_BONUS_TOP3 = 1.35
const FORM_BONUS_TOP6 = 1.15
const FORM_BONUS_BOTTOM3 = 0.72

// KARRIÄRBANA-SOLVENSMÄTNING 2026-08-29 (D033 uppföljning, docs/DOM_AH2_BASEKONOMI_INTAKT_2026-08-28.md
// öppen fråga): D033s -4988 kr/omgång kontroll-residual visade sig, mätt över
// 10-12 säsonger istf 3, vara en STEADY-STATE-siffra som döljer ett bimodalt
// utfall — de flesta kontrollklubbar återhämtar sig (rykte växer, blir plus),
// men en betydande minoritet (3/11 seeds, 27%) föll i en självförstärkande
// ryktekollaps (upprepade bottenplaceringar → rykte mot 0 → weeklyBase/kapacitet
// mot golvet → nya förluster → rykte kvar på 0) som slutade i FAKTISKT
// finansiellt game-over (< -2M, managerFired). Detta är INSOLVENT per
// uppdragets definition. Flat höjning av weeklyBase-golvet (oberoende av
// placering/rykte) valdes eftersom den (till skillnad från positions-/
// formBonus-knapparna) ger de ryktekollapsade klubborna (rep≈0) MER golv utan
// att röra den skyddade communityStanding-vikten eller löneformeln.
// scripts/ah2-karriarbana-solvens-matning-2026-08-29.ts + D033 har full mätning.
//
// ── OMHÄRLEDD 2026-08-31 (den konsoliderade baskonomi-omhärledningen,
// DOM_ANSPAK4_TREDJE_SPAK_NYHET_2026-08-29.md §"Ägarskap & timing"). ─────────
// Lyftet 3000 → 8000 vilade HELT på ryktekollaps-fyndet i stycket ovan
// (3/11 seeds till finansiellt game-over). Det fyndet reproducerar inte längre:
// D033:s ommätning 2026-08-30 spårade hela skiftet till 765fdcb7 (konditions-
// spiralens fix), inte till lyftet, och konstaterade "lyftet köper nu marginal,
// inte överlevnad". Omkört på HEAD 2026-08-31 med samma script och samma elva
// seeds, med nyhetstretmillen på plats:
//   8000: 0/11 game-over, 0/11 licensnekande, sämsta seed +1 905 447 vid säsong 12
//   3000: 0/11 game-over, 0/11 licensnekande, sämsta seed −259 553 (status
//         healthy — över warning-tröskeln −500 000), inga nya avsked
// Spiralen är alltså borta med eller utan lyftet. Vad lyftet däremot gjorde var
// att göra VARJE mittenlagsseed rik (+1,9 M till +7,7 M efter tolv säsonger);
// utan det ligger spannet −0,26 M till +5,6 M och pengar är återigen en variabel.
// Lyftet drev också D033:s egen kriterium 1-överskjutning (kontrollklubben
// +212 tkr/säsong för att inte göra någonting) med ~130 tkr/säsong.
// Återställt till Sprint 26b:s kalibrerade värde — ingen ny gissad tredje siffra.
// Se D033:s omhärledningsnotering 2026-08-31.
const WEEKLY_BASE_FLAT = 3000

const KIOSK_SQRT_RATE_BASIC = 75
const KIOSK_SQRT_RATE_UPGRADED = 150
const VIP_SQRT_RATE = 150
const FLOOR_SHARE_OF_RUNNING_COST = 0.5
const KIOSK_RUNNING_COST_BASIC = 1500
const KIOSK_RUNNING_COST_UPGRADED = 2500
const VIP_RUNNING_COST = 2000

/** SPEC_BANDYPLAY_STREAMING_OCH_BANDYSKOLA_2026-09-03, val C.
 * 4 % ligger under den ratificerade flaggskepps-skalan (~5 %), medan 100 kr
 * i produktion per omgång gör satsningen nära noll för en liten sponsorportfölj
 * och svagt positiv först när klubben faktiskt har exponering att sälja. */
export const BANDYPLAY_ACTIVATION_COST = 5000
export const BANDYPLAY_RUNNING_COST = 100
export const BANDYPLAY_SPONSOR_BONUS_MAX = 0.04
export const BANDY_SCHOOL_BASIC_RUNNING_COST = 1000
export const BANDY_SCHOOL_BASIC_SPONSOR_COST_SHARE = 0.25

// Påståendekartan, byggnodernas löften (2026-08-27, Jacobs dom per nod —
// RAPPORT_BYGGNODLOFTEN_2026-08-27.md): facilityNodes.ts's "Kiosk &
// servering" lovade "Ekonomi ↑" utan att någon kod läste vilka noder som
// var byggda. Kiosk-noden höjer nu kiosk-sqrt-raterna — en investering i
// den fysiska anläggningen höjer försäljningen per besökare. Strålkastarens
// "+10% sponsorintäkt" DÖMDES ATT STRYKAS, inte wiras (rent påhitt, samma
// klass som matchhallens tv-avtal) — se facilityNodes.ts för den strukna
// texten. Ingen sponsor-bonus här.
const KIOSK_NODE_SALES_BONUS_MULT = 1.25

export function calcRoundIncome(params: CalcRoundIncomeParams): RoundIncomeBreakdown {
  const { club, players, sponsors, communityActivities, volunteers, volunteerRoster,
    sponsorNetworkMood, fanMood, isHomeMatch,
    matchIsKnockout, matchIsCup, matchHasRivalry, standing, rand,
    communityStanding, isFirstRound, legendSalaryCost, journalistAttendanceModifier,
    weatherAttendanceModifier, matchAttendance, builtNodeIds, freshnessFactor,
    streamingFreshnessMultiplier } = params
  const hasKioskNode = (builtNodeIds ?? []).includes('kiosk')

  // ── Wages ─────────────────────────────────────────────────────────────────
  const totalSalary = players.reduce((sum, p) => sum + p.salary, 0)
  const weeklyWages = Math.round(totalSalary / 4)

  // ── Weekly base (reputation) ───────────────────────────────────────────────
  // Sprint 26b: 3000 + rep × 50 (was 2000). Raises floor for mid-table clubs (Sprint 26b).
  // 2026-08-29: flat-termen höjdes 3000→8000 mot ett INSOLVENT-fynd i
  // karriärbane-mätningen. 2026-08-31: omhärledd och ÅTERSTÄLLD till 3000 —
  // fyndet reproducerar inte längre och lyftet gjorde bara varje mittenlag rikt.
  // Se WEEKLY_BASE_FLAT-konstanten ovan för hela mätningen.
  const weeklyBase = Math.round(WEEKLY_BASE_FLAT + club.reputation * 50)

  // ── Sponsors ──────────────────────────────────────────────────────────────
  // 0.0086 ratificerat 2026-06-23 (Opus-balansbeslut): flaggskepp×3 ≈ +5% säsongsintäkt,
  // miss×3 ≈ −3.3% — kännbart men inneslutet. Mät-script: scripts/mat-sponsorgunst.ts.
  const streamingSponsorBonus = communityActivities?.bandyplay
    ? BANDYPLAY_SPONSOR_BONUS_MAX * Math.max(0, Math.min(1, streamingFreshnessMultiplier ?? 1))
    : 0
  const sponsorMoodMultiplier = 1 + ((sponsorNetworkMood ?? 50) - 50) * 0.0086 + streamingSponsorBonus
  const activeSponsors = sponsors.filter(s => s.contractRounds > 0)
  const sponsorIncome = Math.round(activeSponsors
    .reduce((sum, s) => sum + s.weeklyIncome, 0) * sponsorMoodMultiplier)
  // BandyKul-modellen: en befintlig aktiv sponsor kan bära en avgränsad del
  // av buss-/driftskostnaden. Det är ingen separat sponsorbank och aldrig en
  // intäkt — skolan förblir en kostnad även vid högsta deltagaravgift.
  const bandySchoolBasicRunningCost = Math.round(
    BANDY_SCHOOL_BASIC_RUNNING_COST
      * (activeSponsors.length > 0 ? 1 - BANDY_SCHOOL_BASIC_SPONSOR_COST_SHARE : 1),
  )

  // ── Match revenue (home only) ─────────────────────────────────────────────
  let matchRevenue = 0
  let communityMatchIncome = 0

  if (isHomeMatch) {
    const capacity = club.arenaCapacity ?? Math.round(club.reputation * 7 + 150)
    const position = standing?.position ?? 8
    const attendanceRate = computeAttendanceRate(fanMood, communityStanding ?? 50, position, 1, freshnessFactor ?? 1)
    const ticketPrice = 50 + Math.round((club.reputation ?? 50) * 0.3)
    const baseRevenue = Math.round(capacity * attendanceRate * ticketPrice * (journalistAttendanceModifier ?? 1.0) * (weatherAttendanceModifier ?? 1.0))

    // DOM_AH2_BASEKONOMI_INTAKT_2026-08-28, knapp 2: vidgat spann mot det
    // gamla (1.15/1.05/0.88/1.0) — skarpare belöning i toppen, skarpare
    // straff i botten. D033 har den mätta motiveringen för spannet.
    const formBonus = position <= 3 ? FORM_BONUS_TOP3 : position <= 6 ? FORM_BONUS_TOP6
      : position >= 10 ? FORM_BONUS_BOTTOM3 : 1.0
    const eventBonus = matchIsKnockout ? 1.40 : matchIsCup ? 1.20 : 1.0
    const derbyBonus = matchHasRivalry ? 1.25 : 1.0
    // VÄG A (Jacobs beslut 2026-09-01, D041/D042): arenaCapacity fryses vid
    // world-gen och omräknas aldrig från levande rykte, så match_revenue är
    // PLATT i praktiken — men platt och stort håller saldot lika uppe som
    // växande hade gjort. Dämpar SUMMAN vid högt rykte istf att låtsas
    // kapaciteten är den rörliga delen. Se communityStandingScaling.ts.
    const repDampFactor = getMatchRevenueRepDampFactor(club.reputation)

    matchRevenue = Math.round(
      baseRevenue * formBonus * eventBonus * derbyBonus * repDampFactor + rand() * 2000
    )

    // Community income tied to a home match
    //
    // Åskådarekonomin, kandidat 2 (2026-08-27, Jacobs dom): kandidat 1
    // (linjär kr/huvud) kastades — exploderade 27-34x för starka klubbar
    // (RAPPORT_ASKADAREKONOMIN_MATNING_2026-08-26.md). Kandidat 2 mättes och
    // godkändes som den är (RAPPORT_ASKADAREKONOMIN_V2_MATNING_2026-08-27.md):
    // kiosk/VIP skalar med sqrt(publik) istf linjärt, golvet är en ANDEL av
    // driftskostnaden (50%) istf ett fritt kronbelopp. Heros går fortsatt
    // sämre på dyraste tiern (5472→2173) — det är MEDVETET, inte en bugg:
    // Heros Survive-kontrakt garanterar överlevnad, inte lönsamhet, och ett
    // golv skruvat tills Heros går plus vore en specialregel för en enskild
    // klubb (samma felklass som de fem oberoende cs=70-trösklarna). Golvet
    // ska inte justeras per klubb.
    if (communityActivities) {
      const attendanceForCommunity = matchAttendance ?? Math.round(capacity * attendanceRate)
      const sqrtAttendance = Math.sqrt(Math.max(0, attendanceForCommunity))
      // Byggträdets "Kiosk & servering"-nod (facilityNodes.ts, id 'kiosk')
      // höjer försäljningsraten — den fysiska investeringen i anläggningen
      // gör att SAMMA publik köper mer per besök. Golvet (kostnadsrelativt,
      // se ovan) får INTE bonusen — det är en säkerhetsspärr mot
      // driftskostnaden, inte en försäljningssiffra att multiplicera.
      const kioskSalesMult = hasKioskNode ? KIOSK_NODE_SALES_BONUS_MULT : 1
      if (communityActivities.kiosk === 'upgraded') {
        communityMatchIncome += Math.max(
          FLOOR_SHARE_OF_RUNNING_COST * KIOSK_RUNNING_COST_UPGRADED,
          Math.round(KIOSK_SQRT_RATE_UPGRADED * kioskSalesMult * sqrtAttendance),
        )
      } else if (communityActivities.kiosk === 'basic') {
        communityMatchIncome += Math.max(
          FLOOR_SHARE_OF_RUNNING_COST * KIOSK_RUNNING_COST_BASIC,
          Math.round(KIOSK_SQRT_RATE_BASIC * kioskSalesMult * sqrtAttendance),
        )
      }
      communityMatchIncome += communityActivities.functionaries ? 1000 : 0
      communityMatchIncome += communityActivities.bandySchoolBasic
        ? 250 + Math.round(rand() * 250) : 0
      if (communityActivities.vipTent) {
        communityMatchIncome += Math.max(
          FLOOR_SHARE_OF_RUNNING_COST * VIP_RUNNING_COST,
          Math.round(VIP_SQRT_RATE * sqrtAttendance),
        )
      }

      // Running costs per home match
      let runningCost = 0
      if (communityActivities.kiosk === 'upgraded') runningCost += KIOSK_RUNNING_COST_UPGRADED
      else if (communityActivities.kiosk === 'basic') runningCost += KIOSK_RUNNING_COST_BASIC
      if (communityActivities.bandySchoolBasic) runningCost += bandySchoolBasicRunningCost
      if (communityActivities.vipTent) runningCost += VIP_RUNNING_COST
      communityMatchIncome -= runningCost
    }
  }

  // ── Per-round community income (lottery, bandySchool, socialMedia) ─────────
  let communityRoundIncome = 0
  if (communityActivities) {
    const lotteryHomeMult = isHomeMatch ? LOTTERY_HOME_MULT : 1.0
    if (communityActivities.lottery === 'intensive') {
      communityRoundIncome += Math.round((1500 + Math.round(rand() * 1000)) * lotteryHomeMult) - 800
    } else if (communityActivities.lottery === 'basic') {
      communityRoundIncome += Math.round((500 + Math.round(rand() * 750)) * lotteryHomeMult) - 500
    }
    if (communityActivities.bandySchoolBasic) {
      // Per-round participant fees minus operational cost
      communityRoundIncome += (250 + Math.round(rand() * 500)) - bandySchoolBasicRunningCost
    }
    if (communityActivities.bandyplay) {
      communityRoundIncome -= BANDYPLAY_RUNNING_COST
    }
    if (communityActivities.socialMedia) {
      communityRoundIncome -= 500  // cost only; reputation bonus handled separately
    }
    if (communityActivities.bandySchool) {
      communityRoundIncome += 1000
    }
  }

  const volunteerIncome = getActiveVolunteerBonus(volunteers ?? [], volunteerRoster).weeklyIncome

  // ── Arena-underhåll (fast kostnad per omgång) ─────────────────────────────
  const arenaCapacity = club.arenaCapacity ?? Math.round(club.reputation * 7 + 150)
  const weeklyArenaCost = Math.round(arenaCapacity * 5)  // Sprint 26b: 8 → 5 (−37.5%, broms spiral för medelklubbar)

  // ── Kommunbidrag (utbetalas en gång per säsong, omgång 1) ─────────────────
  let kommunBidrag = 0
  if (isFirstRound) {
    const kommunBase = 60000
    const repFactor = reputationSalaryMultiplier(club.reputation)   // 0.5–1.5
    // Sprint 26: kvadratisk csFactor — belönar hög puls, straffar låg (var linjär 0.7–1.3)
    const csNormalized = 0.3 + ((communityStanding ?? 50) / 100) * 0.7  // 0.3–1.0
    const csFactor = csNormalized * csNormalized                         // 0.09–1.0
    // DOM_FRAMGANGSEKONOMIN_UPPSIDAN_2026-08-31.md, DIAGNOS REVIDERAD
    // (2026-09-01): Sprint 26:s kvadratiska csFactor är KONVEX — den
    // ACCELERERAR vid högt CS istf att avta, vilket kombinerat med rep-
    // skalningen gjorde kommunbidraget till en av de två verkliga
    // framgång→rikedom-länkarna (mätt ~2,7× tillväxt över en 3-säsongskarriär,
    // se scripts/framgangsekonomin-kommunbidrag-matning-2026-09-01.ts).
    // Återanvänder D031:s redan ratificerade getCsDiminishingFactor (samma
    // "dämpa positiva CS-boostar vid högt CS"-primitiv som communityProcessor.ts
    // redan kör) istf att uppfinna en ny kurva — konsekvent med den andra
    // kommunbidrags-mekanismen (politicianService.calculateKommunBidrag).
    // repFactor rörs INTE (delad med lönernas reputationSalaryMultiplier,
    // SKYDDAD av domen — "Lönerna/A-H2b rörs inte").
    kommunBidrag = Math.round(kommunBase * repFactor * csFactor * getCsDiminishingFactor(communityStanding ?? 50))
  }

  const weeklyLegendCost = legendSalaryCost ?? 0

  // ── Anläggningsdrift (O5 kraft 2, utbetalas en gång per säsong, omgång 1) ──
  // Samma rytm som kommunbidraget — en synlig post, inte en dold veckoläcka.
  const facilityUpkeep = isFirstRound
    ? (params.builtFacilityUpkeepCosts ?? []).reduce((sum, c) => sum + c, 0)
    : 0

  const municipalLoanCost = Math.round((params.municipalLoanAnnualCost ?? 0) / 22)
  const busContractCost = params.busContractRoundCost ?? 0

  const netPerRound = weeklyBase + sponsorIncome + matchRevenue + communityMatchIncome
    + communityRoundIncome + volunteerIncome + kommunBidrag - weeklyWages - weeklyArenaCost
    - weeklyLegendCost - facilityUpkeep - municipalLoanCost - busContractCost

  return {
    weeklyBase,
    sponsorIncome,
    matchRevenue,
    communityMatchIncome,
    communityRoundIncome,
    volunteerIncome,
    kommunBidrag,
    weeklyWages,
    weeklyArenaCost,
    weeklyLegendCost,
    facilityUpkeep,
    municipalLoanCost,
    busContractCost,
    netPerRound,
  }
}

// ── Attendance calculator (exported for UI display) ──────────────────────────

// SLUTTEST RUNDA 4 (2026-08-08, punkt 1): finalhelgens neutral-evenemangsfaktor.
// "Publiken som inte följer något av lagen" — folk som kommer för själva
// evenemanget (cupfinalhelg i Bollnäs), utöver de två klubbarnas egna
// anhängare. Rapporterat värde, ej kalibrerat mot verklig data (finns inget
// att kalibrera mot — det är ett spelvärde). Verifierat med scripts/tmp-körning
// innan commit: två små klubbar (rep ~45-48) fyller INTE CUP_FINAL_VENUE.capacity
// (7000), två stora (rep ~78-85) stannar INTE på ett golv kring 900 — se
// commit-meddelandet för de faktiska talen.
const NEUTRAL_EVENT_FACTOR = 1.5

export type AttendanceParams = Parameters<typeof calcAttendance>[0]

/**
 * PÅSTÅENDEKARTAN, preview-mönstret (2026-08-26, RAPPORT_ASKADAREKONOMIN_
 * MATNING_2026-08-26.md + RAPPORT_FYRA_UTREDNINGAR_2026-08-26.md, "Fixa —
 * samma funktion, samma indata"). Innan denna fanns TVÅ separata
 * härledningar av calcAttendance-parametrar: matchSimProcessor.ts:s
 * auktoritativa (facit, satt på `fixture.attendance` efter simulering) och
 * MatchScreen.tsx:s FÖRHANDSVISNING (Sätt Laget-kortet + live-matchstart) —
 * de senare utelämnade `communityStanding`, hårdkodade `isDerby: false`,
 * och utelämnade `fixtureMonth`. Spelaren kunde se ett annat publiktal
 * FÖRE matchen än det som faktiskt registrerades efteråt. En delad
 * byggfunktion eliminerar det strukturellt — samma härledning, kan inte
 * glida isär igen av misstag.
 *
 * `isFinal`/`isSemiFinal` läses ur `game.playoffBracket` (matchar
 * matchSimProcessor.ts:s ursprungliga härledning exakt). `isAnnandagen`
 * läses direkt av `fixture.isAnnandagen` (ett riktigt Fixture-fält) istf
 * en separat kalenderslot-uppslagning — samma sanning, en enklare väg dit,
 * ingen kalenderarray behöver trådas till anropsställena.
 */
export function buildAttendanceParams(game: SaveGame, fixture: Fixture): AttendanceParams | undefined {
  const homeClub = game.clubs.find(c => c.id === fixture.homeClubId)
  if (!homeClub) return undefined
  const awayClub = game.clubs.find(c => c.id === fixture.awayClubId)
  const isFinalFixture = fixture.roundNumber > 22 && game.playoffBracket?.final?.fixtures.includes(fixture.id)
  const isSemiFixture = fixture.roundNumber > 22 && game.playoffBracket?.semiFinals.some(s => s.fixtures.includes(fixture.id))
  const fixtureWeather = game.matchWeathers?.find(mw => mw.fixtureId === fixture.id)
  const rivalry = getRivalry(fixture.homeClubId, fixture.awayClubId)

  return {
    club: homeClub,
    awayClub,
    isNeutralVenue: !!fixture.isNeutralVenue,
    fanMood: game.fanMood ?? 50,
    communityStanding: fixture.homeClubId === game.managedClubId ? (game.communityStanding ?? 50) : undefined,
    // ANSPRÅK 4, spak 3 / väg C: samma managed-only-villkor som raden ovan.
    // En AI-klubbs hemmamatch har ingen staleness-klocka att läsa — och ska
    // inte få en påhittad. undefined ⇒ computeAttendanceRate får 1.
    freshnessFactor: fixture.homeClubId === game.managedClubId
      ? getOrtFreshnessFactor(game, homeClub.reputation)
      : undefined,
    // LÄST-FÖRE-INITIERING (PASTAENDEKARTAN, 2026-08-26): safeStandingPosition
    // ger null (→ neutral 6:a) om hemmalaget ännu inte spelat en ligamatch
    // denna säsong, istf en alfabetisk skuggposition från en 0-poängstabell.
    position: safeStandingPosition(game.standings, fixture.homeClubId) ?? 6,
    isKnockout: !!fixture.isKnockout,
    isCup: !!fixture.isCup,
    isDerby: !!rivalry,
    isFinal: !!(isFinalFixture || (fixture.isCup && fixture.roundNumber === 4)),
    isSemiFinal: !!(isSemiFixture || (fixture.isCup && fixture.roundNumber === 3)),
    isAnnandagen: !!fixture.isAnnandagen,
    fixtureMonth: new Date(game.currentDate).getMonth() + 1,
    weatherAttendanceModifier: fixtureWeather?.effects.attendanceModifier,
    hasIndoorArena: (fixture.isCup && fixture.isNeutralVenue) ? CUP_FINAL_VENUE.hallInomhus : homeClub.hasIndoorArena,
  }
}

export function calcAttendance(params: {
  club: { reputation: number; arenaCapacity?: number }
  /** SLUTTEST RUNDA 4 (punkt 1): motståndarens klubb — krävs för att räkna
   *  kombinerat publikunderlag på neutral plan. Oanvänd om isNeutralVenue
   *  inte är satt. */
  awayClub?: { reputation: number }
  /** SLUTTEST RUNDA 4 (punkt 1): matchen spelas på neutral plan (cupens
   *  finalhelg, Bollnäs — eller SM-final). Läses av fixture.isNeutralVenue,
   *  ALDRIG isCupFinalhelgen (presentation, inte mekanik — samma princip som
   *  RUNDA 3 punkt 1:s hemmafördel-fix). */
  isNeutralVenue?: boolean
  fanMood: number
  communityStanding?: number  // 0-100, se computeAttendanceRate — default 50 om saknas
  position: number
  isKnockout: boolean
  isCup: boolean
  isDerby: boolean
  isFinal?: boolean
  isSemiFinal?: boolean
  isAnnandagen?: boolean
  fixtureMonth?: number  // DREAM-004: december bonus
  journalistAttendanceModifier?: number  // from journalistVisibilityService
  weatherAttendanceModifier?: number     // raw MatchWeather.effects.attendanceModifier — dämpas/neutraliseras internt
  hasIndoorArena?: boolean               // arena-golvet: väder påverkar inte inomhuspublik
  /** ANSPRÅK 4, spak 3 / väg C: hemmaklubbens `getOrtFreshnessFactor`. Sätts
   *  bara när hemmalaget ÄR den hanterade klubben (samma villkor som
   *  communityStanding ovan — AI-klubbar har ingen staleness-mekanik).
   *  Utelämnad ⇒ 1. */
  freshnessFactor?: number
}): number {
  const { club, awayClub, isNeutralVenue, fanMood, communityStanding, position, isKnockout, isCup, isDerby, isFinal, isSemiFinal, isAnnandagen, fixtureMonth, journalistAttendanceModifier, weatherAttendanceModifier, hasIndoorArena, freshnessFactor } = params
  const homeBaseCapacity = club.arenaCapacity ?? Math.round(club.reputation * 7 + 150)

  // SLUTTEST RUNDA 4 (punkt 1): neutral plan — bägge lagens publikunderlag
  // summeras som RÄKNEBAS (ingen av dem är "hemma"), men SLUTTAKET är
  // CUP_FINAL_VENUE.capacity — inte den vanliga isFinal/isSemiFinal-
  // expansionen (som bygger på EN klubbs egen kapacitet, fel modell när
  // ingen klubb äger arenan). hasIndoorArena läses av
  // CUP_FINAL_VENUE.hallInomhus (via anropsstället), inte hemmaklubbens.
  //
  // Gate: isCup && isNeutralVenue, INTE bara isNeutralVenue — SM-finalen
  // sätter också isNeutralVenue (Studenternas IP, en helt annan, redan
  // tunad arena) men fick ingen egen kapacitetsdata i den här rundan.
  // Bara isNeutralVenue hade tyst bytt SM-finalens 4x-expansion (upp till
  // 20 000) mot cupens 7000-tak — en oavsiktlig regression på ett system
  // som inte var i scope. isFinal/isSemiFinal-grenarna nedan är därför
  // orörda för SM-finalen.
  const isNeutralCupVenue = isCup && isNeutralVenue
  const awayBaseCapacity = awayClub ? Math.round(awayClub.reputation * 7 + 150) : homeBaseCapacity
  const calcBase = isNeutralCupVenue ? homeBaseCapacity + awayBaseCapacity : homeBaseCapacity
  const capCeiling = isNeutralCupVenue ? CUP_FINAL_VENUE.capacity
    : isFinal ? Math.min(20000, homeBaseCapacity * 4)
    : isSemiFinal ? Math.min(8000, homeBaseCapacity * 2)
    : isAnnandagen ? Math.min(15000, homeBaseCapacity * 2)
    : homeBaseCapacity

  // Klackeffekten (punkt 1): på cupens neutrala finalhelg har ingen sin
  // läktare i Bollnäs — mood/tabellplacerings-boosten (annars en äkta
  // hemmaklacks-effekt) halveras istf att ges fullt till vilken klubb som
  // råkar stå som homeClubId.
  const moodWeight = isNeutralCupVenue ? 0.5 : 1.0
  const attendanceRate = computeAttendanceRate(fanMood, communityStanding ?? 50, position, moodWeight, freshnessFactor ?? 1)
  const eventBonus = isFinal ? 2.5 : isSemiFinal ? 1.8 : isKnockout ? 1.40 : isCup ? 1.20 : 1.0
  const derbyBonus = isDerby ? 1.30 : 1.0
  // Annandagen is the most-attended league match of the year — whole village turns up
  const annandagenBonus = isAnnandagen ? 1.80 : 1.0
  // DREAM-004: december julturneringen — hela familjen på läktaren
  const christmasBonus = (fixtureMonth === 12) ? 1.15 : 1.0
  const neutralEventFactor = isNeutralCupVenue ? NEUTRAL_EVENT_FACTOR : 1.0
  // Väder (SYSTEMKARTA fynd 1): snöstorm tunnar läktaren, finaler/annandagen dämpar dippen
  const weatherFactor = effectiveWeatherAttendance(
    weatherAttendanceModifier,
    hasIndoorArena,
    Boolean(isFinal || isSemiFinal || isAnnandagen),
  )
  const base = Math.round(calcBase * attendanceRate * eventBonus * derbyBonus * annandagenBonus * christmasBonus * neutralEventFactor * weatherFactor * (journalistAttendanceModifier ?? 1.0))
  return Math.min(capCeiling, Math.max(50, base))
}
