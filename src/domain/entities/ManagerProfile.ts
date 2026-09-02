import type { CoachPersonality } from '../data/managerKaraktarText'
import type { BurnoutZone, BurnoutCause } from '../services/managerProfileService'

export interface CoachRivalry {
  clubId: string
  personality: CoachPersonality
  h2hWins: number
  h2hDraws: number
  h2hLosses: number
}

export interface ManagerNarrativeEntry {
  season: number
  matchday: number
  // 'burnout_scar' — DOM_BURNOUT_TAK_2026-09-02 (D). Skrivs OAVSETT vilken
  // gren som valdes vid taket ('push_through'/'step_back') — se
  // ManagerProfile.burnoutScar för vilken av de två.
  type: 'arrival' | 'burnout_peak' | 'burnout_scar' | 'era_shift' | 'rivalry' | 'milestone'
  text: string
}

/**
 * O13 (DOM_TRANARMARKNADEN_2026-08-26) — en avslutad eller pågående period i
 * en klubb. Skrivs vid klubbyte (switchManagedClub.ts) och är den enda
 * platsen som vet HUR en period tog slut; `seasonSummaries` vet bara vilka
 * säsonger som spelades var.
 */
export interface ManagerClubSpell {
  clubId: string
  clubName: string
  fromSeason: number
  /** Säsongen perioden tog slut. Utelämnad = perioden pågår. */
  toSeason?: number
  endedBy?: 'fired'
}

export interface ManagerProfile {
  firstName: string
  lastName: string
  age: number
  hometown: string
  burnoutScore: number       // 0-100
  burnoutHistory: number[]   // per-round scores, capped at 22 entries
  careerWins: number
  careerDraws: number
  careerLosses: number
  /**
   * Säsonger i NUVARANDE klubb. O13: nollställs till 1 vid klubbyte —
   * fältet hette redan "AtClub" men var i praktiken en karriärräknare
   * eftersom en karriär bara kunde ha en klubb. Ytorna som läser det
   * ("Säsong N i klubben", ClubScreen/TranareTab/SeasonTransitionScene)
   * menade alltid klubben, inte karriären.
   */
  seasonsAtClub: number
  contractUntilSeason: number
  monthlySalary: number      // tkr/month
  coachRivalries: CoachRivalry[]
  // PÅSTÅENDEKARTAN (2026-08-24): döpt om från `narrativeLog` — namnkollision
  // med SaveGame.narrativeBeatLog (gating-logg, ingen text) och Player.diary.
  // Se registerfyndet i SLUTTEST_KO.md post 58.
  diary?: ManagerNarrativeEntry[]

  // ── O13, tränarmarknaden (DOM_TRANARMARKNADEN_2026-08-26) ────────────────
  /**
   * Antal avsked. Domens skärpning 3 ("Karriären ska kunna ta slut") hänger
   * på detta — efter tredje avskedet ringer ingen. Kan inte härledas ur
   * seasonSummaries: de vet vad som hände sportsligt, inte vad styrelsen
   * beslutade. Saknas på gamla saves ⇒ läs som 0.
   */
  firings?: number
  /**
   * Totalt antal säsonger som huvudtränare, ÖVER klubbgränser. Skild från
   * seasonsAtClub, som nollställs vid byte. Saknas på gamla saves ⇒ läs som
   * seasonsAtClub (som då per definition är hela karriären).
   */
  careerSeasons?: number
  /** Klubbperioder, äldst först. Den nuvarande perioden saknar toSeason. */
  clubSpells?: ManagerClubSpell[]

  // ── HIGH 10, burnout som båge (DOM_HIGH10_BURNOUT_BAGE_2026-08-29) ────────
  /**
   * Den zon som SENAST narrerades för spelaren (mark/lättnad/slut). Skiljd
   * från nuvarande zon, som härleds ur burnoutScore: det här fältet är
   * minnet av vad vi redan berättat, och är det som hindrar att ett
   * oförändrat tillstånd återpresenteras som en ny händelse varje omgång.
   * Saknas på gamla saves ⇒ läs som undefined (= ingen beat har visats
   * ännu; ingenting undertrycks och ingenting dubbelfyras).
   */
  lastShownBurnoutZone?: BurnoutZone
  /**
   * Den dominerande press-källan bakom nuvarande nivå, satt av
   * updateManagerBurnout de omgångar det finns en press alls. Saknas på
   * gamla saves ⇒ läs som undefined (ingen orsaksrad visas).
   */
  lastBurnoutCause?: BurnoutCause

  // ── Burnout-taket (DOM_BURNOUT_TAK_2026-09-02) ────────────────────────────
  /**
   * Antal I RAD omgångar burnoutScore legat på taket (100). Nollställs så
   * fort scoret sjunker under 100 — en avbruten svit räknas inte vidare.
   * Skild från burnoutHistory (rullande 22-omgångarsfönster, för volatila
   * beat-kontroller) — den här räknaren mäter EN sammanhängande episod vid
   * exakt taket, som kan sträcka sig längre än historikfönstret.
   */
  roundsAtBurnoutCeiling?: number
  /**
   * Sant från den stund tak-valet erbjudits, tills episoden vid taket tar
   * slut (roundsAtBurnoutCeiling nollställs). Förhindrar att samma episod
   * erbjuder valet om och om igen varje omgång den ligger kvar över tröskeln
   * — samma "stämpla vid beslutet"-princip som lastShownBurnoutZone.
   */
  burnoutCeilingChoiceOffered?: boolean
  /**
   * Det permanenta ärret efter tak-valet — sätts EN gång, tas aldrig bort.
   * 'hardened' = "Kör vidare" (härdad men märkt). 'stepped_back' = "Kliv
   * tillbaka" (bröt mönstret, men det syns att du var där). Matar
   * isBurnoutRelapse-mönstret vidare: en framtida klättring mot taket kan
   * referera att det hänt förr, inte bara att en ZON hänt förr (det gör
   * redan burnout_peak/isBurnoutRelapse — detta är ett djupare lager,
   * specifikt om TAKET).
   */
  burnoutScar?: 'hardened' | 'stepped_back'
}
