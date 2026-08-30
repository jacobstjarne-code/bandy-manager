/**
 * HIGH 7 (SEXSÅSONGERSAUDITEN, docs/incoming/
 * BANDY_MANAGER_AUDIT_5_SASONGER_KUL_STICKINESS_VISUELL_2026-08-29.md):
 * press- och eventtext kunde väljas UTAN att kontrollera att den faktiskt
 * matchade matchen/säsongen som just hände — derby-copy efter icke-derby,
 * "vi förlorade hemma" efter en bortaförlust, slutspelscopy efter avslutad
 * serie. Rotorsak enligt auditen: eligibility (får den här mallen
 * överhuvudtaget visas just nu) var inte separerat från textval (vilken
 * specifik rad, bland de behöriga, som väljs) — mallar valdes via
 * kategori/pool utan en hård, strukturell kontroll av att mallens EGNA
 * deklarerade kontextkrav (tävlingstyp, hemma/borta, säsongsfas, faktiskt
 * resultat) matchade den verkliga situationen.
 *
 * Den här filen är den generiska eligibility-kontrollen: valfri innehålls-
 * pool (pressfrågor, pressvarssvar, post-match-citat, …) kan deklarera
 * dessa fält per mall och köra `isTemplateEligible`/`filterEligible` INNAN
 * slumpmässigt/viktat urval sker. Den ersätter INGET befintligt
 * kontextsystem (t.ex. pressConferenceService.ts:s TAG_DEFS/isGenericMatch,
 * som redan är exakt facit-testat i pressConferenceGeneric.table.test.ts)
 * — den lägger ett STRUKTURELLT extra lager ovanpå, för de fall där en
 * malls EGEN TEXT är smalare än den bucket/tag den råkar tillhöra (t.ex.
 * en "hemmaförlust"-replik som klassificerats i den bredare
 * 'loss'-bucketen och därför kunde läcka in efter en bortaförlust).
 *
 * Cooldown hanteras INTE här — narrativeLogService.ts (isOnCooldown,
 * logNarrativeBeat, pickPoolIndexAvoidingCooldown) är den redan etablerade
 * mekanismen för "har vi visat det här nyligen", och den här filen bygger
 * inte en parallell variant av den.
 */

export type CompetitionEligibility = 'league' | 'cup' | 'playoff' | 'any'
export type HomeAwayEligibility = 'home' | 'away' | 'any'
/**
 * 'in_season'  — en tävling (den som `competition` pekar på, eller ligan
 *                generellt om `competition` är 'any') pågår fortfarande.
 * 'season_over'— säsongen/tävlingen är avslutad (t.ex. slutspelet är över,
 *                eller det är sommaruppehåll). Detta är fältet som stänger
 *                "slutspelscopy efter avslutad serie"-bugklassen.
 * 'any'        — ingen fasrestriktion (default när fältet utelämnas).
 */
export type SeasonPhaseEligibility = 'in_season' | 'season_over' | 'any'
export type ResultEligibility = 'win' | 'loss' | 'draw' | 'any'
/** 'required' = mallen kräver att matchen var ett derby. 'excluded' = mallen
 *  får ALDRIG visas efter ett derby (reserverat för framtida bruk — inga
 *  nuvarande mallar i den här kodbasen sätter detta). 'any' = ingen
 *  derbyrestriktion. */
export type DerbyEligibility = 'required' | 'excluded' | 'any'

/**
 * Eligibility-metadata en enskild mall (fråga, svar, citat, …) deklarerar.
 * Alla fält är valfria — ett fält som utelämnas tolkas som 'any' (ingen
 * restriktion på den axeln). En mall utan `eligibility` alls är eligible
 * överallt (bakåtkompatibelt med opool-mallar som ännu inte retrofit:ats).
 */
export interface TemplateEligibility {
  competition?: CompetitionEligibility
  homeAway?: HomeAwayEligibility
  phase?: SeasonPhaseEligibility
  result?: ResultEligibility
  derby?: DerbyEligibility
  /** true = mallen förutsätter att DEN HÄR matchen var en faktisk final
   *  (SM-final/cupfinal), inte "vilken slutspelsmatch som helst". Utelämnat
   *  eller false = ingen finalrestriktion. Eget fält, inte en `competition`-
   *  variant, eftersom en icke-final slutspelsmatch fortfarande är
   *  `competition: 'playoff'` — "är det HELA slutspelet" och "är det just
   *  finalen" är två olika frågor. Tillagt konkret för cl27 ("SM-finalen på
   *  Studenternas..."), som annars kunde visas efter en kvarts-/semifinal-
   *  vinst — samma bucket-läcka som cup_win/playoff_win, en nivå smalare. */
  finalOnly?: boolean
}

/**
 * Den faktiska situationen en mall bedöms mot. Byggs EN gång per
 * urvalstillfälle (per match/event), inte per mall.
 */
export interface EligibilityContext {
  competition: 'league' | 'cup' | 'playoff'
  homeAway: 'home' | 'away'
  phase: 'in_season' | 'season_over'
  result: 'win' | 'loss' | 'draw'
  isDerby: boolean
  /** Var DEN HÄR matchen den faktiska finalen (SM-final/cupfinal)? Se
   *  TemplateEligibility.finalOnly. */
  isFinal: boolean
}

/**
 * Den hårda strukturella kontrollen. Körs FÖRE slump/vikt — en mall som
 * inte klarar den här funktionen ska aldrig nå urvalspoolen, oavsett hur
 * den viktas.
 */
export function isTemplateEligible(
  eligibility: TemplateEligibility | undefined,
  ctx: EligibilityContext,
): boolean {
  if (!eligibility) return true
  if (eligibility.competition && eligibility.competition !== 'any' && eligibility.competition !== ctx.competition) {
    return false
  }
  if (eligibility.homeAway && eligibility.homeAway !== 'any' && eligibility.homeAway !== ctx.homeAway) {
    return false
  }
  if (eligibility.phase && eligibility.phase !== 'any' && eligibility.phase !== ctx.phase) {
    return false
  }
  if (eligibility.result && eligibility.result !== 'any' && eligibility.result !== ctx.result) {
    return false
  }
  if (eligibility.derby === 'required' && !ctx.isDerby) return false
  if (eligibility.derby === 'excluded' && ctx.isDerby) return false
  if (eligibility.finalOnly && !ctx.isFinal) return false
  return true
}

/**
 * Bekvämlighetsfunktion för pooler som vill filtrera en hel array i ett
 * steg. `getEligibility` läser ut `eligibility`-fältet ur mallen (fältnamnet
 * varierar per pool, därför en accessor-funktion i stället för ett hårdkodat
 * `.eligibility`).
 */
export function filterEligible<T>(
  items: readonly T[],
  getEligibility: (item: T) => TemplateEligibility | undefined,
  ctx: EligibilityContext,
): T[] {
  return items.filter(item => isTemplateEligible(getEligibility(item), ctx))
}
