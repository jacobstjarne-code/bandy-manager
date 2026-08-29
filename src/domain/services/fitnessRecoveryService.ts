/**
 * fitnessRecoveryService.ts — A3 (DOM_A3_KONDITIONSSPIRAL_2026-08-29.md), krav 2 + 3.
 *
 * NY FIL — motivering (CLAUDE.md "KOD-GRANSKNING FÖR NYA FILER"):
 * grep på `fitness`-mutationer gav exakt två ägare, båda i APPLICATION-lagret
 * (`playerStateProcessor.ts` per omgång, `seasonEndProcessor.ts` vid rollover)
 * och ingen domän-service alls. Domens krav 3 (synlig prognos) kräver att
 * PRESENTATION räknar samma kurva som motorn — och presentation får inte
 * importera från application. Exakt samma lagerargument som A-H3 använde när
 * `FATIGUE_AVAILABILITY_FLOOR` flyttades till `squadEvaluator.ts`. Alternativet
 * (låta LineupStep skriva av formeln) vore en andra sanning — precis den
 * dubblering `spelklarhet()` redan kostat oss en gång.
 *
 * ── ROTORSAKEN (mätt, inte gissad) ──────────────────────────────────────────
 * scripts/a3-konditionsspiral-matning-2026-08-29.ts, baslinjemätning
 * 2026-08-29: 18-mannatrupp, 2 säsonger, kompetent spel (pickBestEleven).
 * Truppmedianen låg på 12–20 % kondition, 60 % av ALLA starter skedde under
 * golvet 22, och autofyllen tvingades under golvet i 22–25 av ~29 omgångar.
 * Vila GJORDE DET VÄRRE (median 20.1 → 13.3 mellan säsong 1 och 2).
 *
 * Tre samverkande fel, alla i den gamla modellen:
 *
 * 1. `seasonForm`-taket var ingen ÅTERHÄMTNINGSGRÄNS — det var en KLAMP på rå
 *    kondition. `Math.min(seasonForm + 3, fitness + rec)` DRAR NER en spelare
 *    som redan ligger över taket. Och Vila sänker `seasonForm` 1.0/omgång, så
 *    vilo-valet sänkte aktivt klampen och därmed konditionen. Återhämtnings-
 *    spaken var netto-destruktiv. Dessutom var det DUBBELRÄKNAT: samma tak
 *    tillämpas redan på EFFEKTEN i `playerModifier` (squadEvaluator.ts:42) —
 *    som är SKYDDAT i domen och står orört. Taket lever kvar där, på
 *    effektiviteten, precis som Player.ts beskriver det ("tak för
 *    fitness-effektivitet"). Det som togs bort är den andra, odokumenterade
 *    tillämpningen på råvärdet.
 *
 * 2. En startare fick ALDRIG någon återhämtning. Hans omgång var rent
 *    −15..−25. Med 11 av 18 startande varje omgång blev trupploopen
 *    11×(−20) + 5×(+5) + 2×(+7) = −181 per omgång, ≈ −10 per spelare. Ingen
 *    trupp av någon storlek kunde bära det.
 *
 * 3. Modellen var PLATT (additiv). En platt drän mot en platt återhämtning har
 *    ingen inre jämvikt — nettot är antingen negativt (alla faller till 0) eller
 *    positivt (alla ligger i taket). Att "kalibrera" konstanterna hade bara
 *    flyttat kanten, inte tagit bort den. Därför är återhämtningen här
 *    PROPORTIONELL mot gapet till taket: snabb när spelaren är slut, långsam
 *    nära toppen. Det ger en äkta inre jämvikt som skalar med truppdjupet
 *    (fler vilande = högre jämvikt) istället för en knivsegg.
 *
 * Magnituderna är satta av mätningen, inte av magkänsla — se D034 och
 * doktrinens tillägg 2026-08-29.
 */
import { clamp } from '../utils/clamp'

/** Taket rå kondition återhämtar mot. `seasonForm`s tak sitter på EFFEKTEN
 *  (playerModifier, squadEvaluator.ts) — aldrig på råvärdet, se rotorsak 1. */
export const FITNESS_RECOVERY_CEILING = 100

/**
 * Andel av gapet till taket som återhämtas på en normalvecka (7 dagar),
 * per arbetsbelastning. Satta av uthållighetstest B (se doktrinens tillägg):
 * ger jämvikt ≈ 58 % (18 man) / 64 % (20) / 72 % (24) i mean field, och
 * mätt utfall 61/67/74. En äkta ständig startare (aldrig roterad) landar
 * kring 6 % — trötthet kostar fortfarande, den bara spiralerar inte.
 */
export const RECOVERY_RATE_STARTED = 0.16
export const RECOVERY_RATE_BENCH   = 0.32
export const RECOVERY_RATE_RESTED  = 0.42

/** Sommaren: begriplig återställning till rimlig matchberedskap (domens krav 2).
 *  Mål = BASE + SPAN × (stamina/100) → 78–92. En spelare sänks aldrig av
 *  sommaren; `Math.max` mot hans nuvarande värde. */
export const SUMMER_FITNESS_BASE = 78
export const SUMMER_FITNESS_STAMINA_SPAN = 14

/** `seasonForm` nollställdes ALDRIG mellan säsonger (grep 2026-08-29: sätts
 *  bara i worldGenerator/youthIntake/academy/migration + Vila-driften). Med
 *  Vila −1.0/omgång × ~29 omgångar landade den på 20 i säsong 2 och 0 i
 *  säsong 4 — och eftersom playerModifier klipper EFFEKTEN vid seasonForm+3
 *  spelade hela truppen på 3 % effektivitet för alltid. Sommaren drar tillbaka
 *  mot en försäsongsbaslinje med lite bärighet kvar från förra säsongen. */
export const SUMMER_SEASON_FORM_BASE = 62
export const SUMMER_SEASON_FORM_RETENTION = 0.25

export type FitnessWorkload = 'started' | 'bench' | 'rested'

export function recoveryRateFor(workload: FitnessWorkload): number {
  return workload === 'started'
    ? RECOVERY_RATE_STARTED
    : workload === 'bench'
    ? RECOVERY_RATE_BENCH
    : RECOVERY_RATE_RESTED
}

/** 0.7–1.0. Oförändrad från den gamla modellens `staminaFactor`. */
export function staminaRecoveryFactor(stamina: number | undefined): number {
  return 0.7 + 0.3 * (clamp(stamina ?? 50, 0, 100) / 100)
}

/** Dagar mellan matcher / 7, tak 3.0. Oförändrad från den gamla modellens
 *  `calendarFactor` — men gäller nu ALLA tre arbetsbelastningar, inte bara
 *  "spelade inte". En längre lucka ska ge mer tillbaka även åt den som spelade. */
export function calendarRecoveryFactor(daysBetweenFixtures: number): number {
  return Math.min(3.0, Math.max(0, daysBetweenFixtures) / 7)
}

export interface RecoveryContext {
  stamina?: number
  daysBetweenFixtures?: number
  /** Periodiseringens additiva extrapoäng (VILA_EXTRA_FITNESS_REC /
   *  TOPPA_EXTRA_FITNESS_REC). Additiv med flit — D-SAB-001:s magnituder
   *  behåller sin betydelse ("Vila ger +5 kondition extra per omgång") utan
   *  att behöva härledas om mot den proportionella modellen. */
  modeBonus?: number
}

/**
 * Hur mycket kondition som återvinns denna omgång, GIVET konditionen EFTER
 * matchkostnaden. Proportionell mot gapet till taket (rotorsak 3).
 */
export function recoveryGain(
  fitnessAfterMatchCost: number,
  workload: FitnessWorkload,
  ctx: RecoveryContext = {},
): number {
  const gap = Math.max(0, FITNESS_RECOVERY_CEILING - fitnessAfterMatchCost)
  const cal = calendarRecoveryFactor(ctx.daysBetweenFixtures ?? 7)
  const stam = staminaRecoveryFactor(ctx.stamina)
  const proportional = gap * recoveryRateFor(workload) * cal * stam
  return Math.round(proportional + (ctx.modeBonus ?? 0) * cal)
}

/**
 * Konditionen efter en omgång med given arbetsbelastning. EN sanning för
 * både motorn (playerStateProcessor) och prognosen (LineupStep) — krav 3 i
 * domen kräver att spelaren ser samma tal som motorn kommer räkna.
 *
 * `matchCost` är noll för bench/rested; för `started` är det den redan
 * beräknade förlusten (bas 15–25 × taktik × väder × position + Bygg-tillägg),
 * som ligger kvar oförändrad i playerStateProcessor — A3 rör återhämtningen,
 * inte matchkostnadens magnitud.
 */
export function projectFitnessAfterRound(
  currentFitness: number,
  workload: FitnessWorkload,
  matchCost: number,
  ctx: RecoveryContext = {},
): number {
  const afterCost = Math.max(0, currentFitness - (workload === 'started' ? matchCost : 0))
  return clamp(afterCost + recoveryGain(afterCost, workload, ctx), 0, FITNESS_RECOVERY_CEILING)
}

/** Sommarens målnivå för en spelare med given uthållighet (78–92). */
export function summerFitnessTarget(stamina: number | undefined): number {
  return Math.round(SUMMER_FITNESS_BASE + SUMMER_FITNESS_STAMINA_SPAN * (clamp(stamina ?? 50, 0, 100) / 100))
}

/** Sommarens `seasonForm`-återställning — mot baslinjen, med kvarvarande bärighet. */
export function summerSeasonForm(previousSeasonForm: number | undefined): number {
  const prev = previousSeasonForm ?? SUMMER_SEASON_FORM_BASE
  return clamp(
    Math.round(SUMMER_SEASON_FORM_BASE + (prev - SUMMER_SEASON_FORM_BASE) * SUMMER_SEASON_FORM_RETENTION),
    0,
    100,
  )
}

/**
 * A3 krav 3 — den genomsnittliga matchkostnaden en startare betalar, använd
 * av prognosen. Motorn slumpar 15–25 per match; prognosen kan inte veta
 * utfallet i förväg och visar därför mittvärdet. Multiplikatorerna (taktik,
 * väder, position) är kända först i rundprocessorn — prognosen är en
 * förväntan, inte ett löfte, och texten måste säga det.
 */
export const EXPECTED_MATCH_FITNESS_COST = 20

export interface FitnessProjection {
  /** Kondition inför NÄSTA match om han startar den här. */
  ifStarting: number
  /** Kondition inför NÄSTA match om han vilas den här omgången. */
  ifRested: number
  /** Skillnaden mellan att vila och att starta — priset för att gå in i dag. */
  costOfStarting: number
  /**
   * Omgångar tills spelaren är valbar igen. 0 = valbar nu. Läser de tre
   * skilda otillgänglighetsorsakerna A-H3 etablerade och tar den längsta —
   * skada mäts i dagar (≈7 per omgång), avstängning och vila i matcher.
   */
  availableInRounds: number
}

/**
 * A3 krav 3 — "Visa `efter nästa match` / `tillgänglig igen` så spelaren kan
 * förstå återhämtningen och planera runt den."
 *
 * Prognosen är en FÖRVÄNTAN, inte ett löfte: matchkostnaden slumpas 15–25 och
 * skalas sedan av taktik/väder/position, vilka inte är kända förrän rundan
 * körs. Den använder mittvärdet (EXPECTED_MATCH_FITNESS_COST) och texten som
 * visar den måste säga "ungefär". Den delar formel med motorn
 * (projectFitnessAfterRound → recoveryGain), aldrig en egen avskrift.
 */
export function getFitnessProjection(
  player: {
    fitness: number
    attributes?: { stamina?: number }
    isInjured?: boolean
    injuryDaysRemaining?: number
    suspensionGamesRemaining?: number
    restGamesRemaining?: number
  },
  daysBetweenFixtures = 7,
): FitnessProjection {
  const ctx: RecoveryContext = { stamina: player.attributes?.stamina, daysBetweenFixtures }
  const ifStarting = projectFitnessAfterRound(player.fitness, 'started', EXPECTED_MATCH_FITNESS_COST, ctx)
  const ifRested = projectFitnessAfterRound(player.fitness, 'rested', 0, ctx)
  const injuryRounds = player.isInjured ? Math.ceil((player.injuryDaysRemaining ?? 0) / 7) : 0
  return {
    ifStarting,
    ifRested,
    costOfStarting: ifRested - ifStarting,
    availableInRounds: Math.max(
      injuryRounds,
      player.suspensionGamesRemaining ?? 0,
      player.restGamesRemaining ?? 0,
    ),
  }
}
