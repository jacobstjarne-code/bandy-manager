import type { CommunityActivities, Sponsor, StandingRow } from '../entities/SaveGame'
import type { Club } from '../entities/Club'
import type { Player } from '../entities/Player'
import { getActiveVolunteerBonus } from './volunteerService'
import type { Volunteer } from './volunteerService'
import { CUP_FINAL_VENUE } from '../data/specialDateStrings'

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
  | 'kommunbidrag'
  | 'budget_priority'
  | 'transfer_in'
  | 'transfer_out'
  | 'scout'
  | 'academy'
  | 'event'

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
  communityMatchIncome: number   // kiosk/vipTent/functionaries/bandyplay per home match, net
  communityRoundIncome: number   // lottery/bandySchool/socialMedia per round, net
  volunteerIncome: number        // active volunteers, role-based income (avg 340/vol) per round
  kommunBidrag: number           // reputation × communityStanding-based bidrag (once at round 1)
  weeklyWages: number            // monthly salary total / 4
  weeklyArenaCost: number        // arenaCapacity × 5 per round
  weeklyLegendCost: number       // 500 kr/omgång per aktiv legend (youth_coach | scout)
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

/**
 * Single canonical income calculation.
 * Used by roundProcessor for the actual finance mutation,
 * and by EkonomiTab (with rand: () => 0.5) for display estimates.
 *
 * Community income is split into two parts:
 *   communityMatchIncome — events tied to a home match (kiosk, VIP-tält, etc.)
 *   communityRoundIncome — per-round regardless of home/away (lottery, bandySchool, socialMedia)
 *
 * bandyplay appears in both: per-match deltagaravgifter + per-round bandyskola-drift.
 * This matches the existing roundProcessor behaviour and is preserved intentionally.
 */
export function calcRoundIncome(params: CalcRoundIncomeParams): RoundIncomeBreakdown {
  const { club, players, sponsors, communityActivities, volunteers, volunteerRoster,
    sponsorNetworkMood, fanMood, isHomeMatch,
    matchIsKnockout, matchIsCup, matchHasRivalry, standing, rand,
    communityStanding, isFirstRound, legendSalaryCost, journalistAttendanceModifier,
    weatherAttendanceModifier } = params

  // ── Wages ─────────────────────────────────────────────────────────────────
  const totalSalary = players.reduce((sum, p) => sum + p.salary, 0)
  const weeklyWages = Math.round(totalSalary / 4)

  // ── Weekly base (reputation) ───────────────────────────────────────────────
  // Sprint 26b: 3000 + rep × 50 (was 2000). Raises floor for mid-table clubs (Sprint 26b).
  const weeklyBase = Math.round(3000 + club.reputation * 50)

  // ── Sponsors ──────────────────────────────────────────────────────────────
  // 0.0086 ratificerat 2026-06-23 (Opus-balansbeslut): flaggskepp×3 ≈ +5% säsongsintäkt,
  // miss×3 ≈ −3.3% — kännbart men inneslutet. Mät-script: scripts/mat-sponsorgunst.ts.
  const sponsorMoodMultiplier = 1 + ((sponsorNetworkMood ?? 50) - 50) * 0.0086
  const sponsorIncome = Math.round(sponsors
    .filter(s => s.contractRounds > 0)
    .reduce((sum, s) => sum + s.weeklyIncome, 0) * sponsorMoodMultiplier)

  // ── Match revenue (home only) ─────────────────────────────────────────────
  let matchRevenue = 0
  let communityMatchIncome = 0

  if (isHomeMatch) {
    const capacity = club.arenaCapacity ?? Math.round(club.reputation * 7 + 150)
    const position = standing?.position ?? 8
    const attendanceRate = Math.min(0.90, 0.35 + (fanMood / 100) * 0.40 + (position <= 3 ? 0.08 : 0))
    const ticketPrice = 50 + Math.round((club.reputation ?? 50) * 0.3)
    const baseRevenue = Math.round(capacity * attendanceRate * ticketPrice * (journalistAttendanceModifier ?? 1.0) * (weatherAttendanceModifier ?? 1.0))

    const formBonus = position <= 3 ? 1.15 : position <= 6 ? 1.05 : position >= 10 ? 0.88 : 1.0
    const eventBonus = matchIsKnockout ? 1.40 : matchIsCup ? 1.20 : 1.0
    const derbyBonus = matchHasRivalry ? 1.25 : 1.0

    matchRevenue = Math.round(
      baseRevenue * formBonus * eventBonus * derbyBonus + rand() * 2000
    )

    // Community income tied to a home match
    if (communityActivities) {
      const moodMult = 0.7 + (fanMood / 100) * 0.6
      const kioskBase = communityActivities.kiosk === 'upgraded' ? 2500
        : communityActivities.kiosk === 'basic' ? 1250 : 0
      communityMatchIncome += Math.round(kioskBase * moodMult)
      communityMatchIncome += communityActivities.functionaries ? 1000 : 0
      communityMatchIncome += communityActivities.bandyplay
        ? 250 + Math.round(rand() * 250) : 0
      if (communityActivities.vipTent) {
        communityMatchIncome += 1250 + Math.round(rand() * 2500)
      }

      // Running costs per home match
      let runningCost = 0
      if (communityActivities.kiosk === 'upgraded') runningCost += 2500
      else if (communityActivities.kiosk === 'basic') runningCost += 1500
      if (communityActivities.bandyplay) runningCost += 1000
      if (communityActivities.vipTent) runningCost += 2000
      communityMatchIncome -= runningCost
    }
  }

  // ── Per-round community income (lottery, bandySchool, socialMedia) ─────────
  let communityRoundIncome = 0
  if (communityActivities) {
    if (communityActivities.lottery === 'intensive') {
      communityRoundIncome += (1500 + Math.round(rand() * 1000)) - 800
    } else if (communityActivities.lottery === 'basic') {
      communityRoundIncome += (500 + Math.round(rand() * 750)) - 500
    }
    if (communityActivities.bandyplay) {
      // Per-round participant fees minus operational cost
      communityRoundIncome += (250 + Math.round(rand() * 500)) - 1000
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
    kommunBidrag = Math.round(kommunBase * repFactor * csFactor)
  }

  const weeklyLegendCost = legendSalaryCost ?? 0

  const netPerRound = weeklyBase + sponsorIncome + matchRevenue + communityMatchIncome
    + communityRoundIncome + volunteerIncome + kommunBidrag - weeklyWages - weeklyArenaCost - weeklyLegendCost

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
}): number {
  const { club, awayClub, isNeutralVenue, fanMood, position, isKnockout, isCup, isDerby, isFinal, isSemiFinal, isAnnandagen, fixtureMonth, journalistAttendanceModifier, weatherAttendanceModifier, hasIndoorArena } = params
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
  const attendanceRate = Math.min(0.95, 0.35 + (fanMood / 100) * 0.40 * moodWeight + (position <= 3 ? 0.08 * moodWeight : 0))
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

