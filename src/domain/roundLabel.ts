/**
 * roundLabel.ts — EN sanning för frågan "vilken omgång är den här matchen?"
 * när svaret ska visas för spelaren.
 *
 * ROTORSAK (HIGH 5, BANDY_MANAGER_AUDIT_5_SASONGER_..._2026-08-29): samma
 * fixture kunde visas som "Omgång 4" i portalen och "OMG 8" live, för att
 * ytorna läste OLIKA fält med IDENTISK formatering. `Fixture.roundNumber` är
 * tävlingsrelativ (ligaomgång 1–22 ELLER cuprond 1–4), `Fixture.matchday` är
 * global spelordning över hela säsongen (cup 1–4, liga 5–26, slutspel 27+).
 * Båda renderades som `Omgång ${n}` på ~20 ställen utan diskriminant.
 *
 * REGELN, framåt:
 *   - `matchday` = sortering och kronologi ("N omgångar sedan", utgångsfönster,
 *     tidslinjer). Rör inte. Det är rätt fält för det.
 *   - Rond-IDENTITET i UI ("vilken match är detta?") går ALLTID genom
 *     getRoundLabel(). Råa `Omgång ${fixture.roundNumber}`/`Omg ${matchday}`
 *     som fixture-identitet är en regression.
 *
 * Rena räknare är INTE det här problemet och ska inte gå genom funktionen:
 * "3 omgångar kvar till deadline", en träningslogg per omgång, en
 * cooldown-nedräkning. De identifierar ingen match.
 *
 * VARFÖR DOMAIN OCH INTE presentation/utils: samma skäl som `format.ts` —
 * både domänen (seasonSummaryService, matchHighlightService) och
 * presentationslagret behöver etiketten, och domänen får aldrig importera
 * från presentation.
 *
 * VARFÖR EGEN FIL OCH INTE `format.ts`: format.ts är dokumenterat som RENA
 * primitiver med enda beroendet `./enums`. getRoundLabel konsumerar två
 * services (cupService för cupens rondnamn, playoffService för fixture →
 * PlayoffRound) och två entiteter — att lägga det i format.ts hade dragit in
 * halva domänen i den leaf-modul varje `positionShort`-import redan hämtar.
 */

import type { Fixture } from './entities/Fixture'
import type { PlayoffBracket } from './entities/Playoff'
import { PlayoffRound } from './enums'
import { getCupRoundLabel } from './services/cupService'
import { getPlayoffRoundForFixture } from './services/playoffService'

// ── Slutspelsrondens namn ────────────────────────────────────────────
// Konsoliderar sex byte-identiska PlayoffRound→sträng-uppslag som låg
// utspridda i UI:t (ChampionScreen, MatchReportView, AnslagOverlay,
// situationService, GameHeader, NextMatchCard, PortalScreen, MatchScreen).
// Värdena är oförändrade — det här är en sammanslagning, inte en omskrivning.

const PLAYOFF_ROUND_NAME: Record<PlayoffRound, string> = {
  [PlayoffRound.QuarterFinal]: 'Kvartsfinal',
  [PlayoffRound.SemiFinal]: 'Semifinal',
  [PlayoffRound.Final]: 'SM-Final',
}

/** Bestämd form, för prosa-substitution ({rond} i anslagstexter). */
const PLAYOFF_ROUND_DEFINITE: Record<PlayoffRound, string> = {
  [PlayoffRound.QuarterFinal]: 'kvartsfinalen',
  [PlayoffRound.SemiFinal]: 'semifinalen',
  [PlayoffRound.Final]: 'SM-finalen',
}

/** 'Kvartsfinal' | 'Semifinal' | 'SM-Final' — rubriker, chips, kort. */
export function playoffRoundName(round: PlayoffRound): string {
  return PLAYOFF_ROUND_NAME[round] ?? PLAYOFF_ROUND_NAME[PlayoffRound.Final]
}

/** 'KVARTSFINAL' | 'SEMIFINAL' | 'SM-FINAL' — versala etiketter/eyebrows. */
export function playoffRoundNameUpper(round: PlayoffRound): string {
  return playoffRoundName(round).toUpperCase()
}

/** 'kvartsfinalen' | 'semifinalen' | 'SM-finalen' — inuti en mening. */
export function playoffRoundDefinite(round: PlayoffRound): string {
  return PLAYOFF_ROUND_DEFINITE[round] ?? PLAYOFF_ROUND_DEFINITE[PlayoffRound.Final]
}

// ── Rond-etiketten ───────────────────────────────────────────────────

/**
 * `short` = kompakt, för pills/chips där bredden är knapp.
 * `long`  = full form, för meningar och kortrubriker.
 *
 * De skiljer sig BARA för ligamatcher ("Omg 4" vs "Omgång 4") — cupens och
 * slutspelets etiketter är redan ord, inte siffror, och behöver ingen
 * kortform. Att ändå ha två fält är poängen med objektet: anropsstället
 * väljer register, inte formatsträng.
 */
export interface RoundLabel {
  short: string
  long: string
}

/**
 * Gamla snapshots saknar ibland den färdiga tävlingsetiketten. `matchday`
 * kan då bara belägga kronologi, aldrig en ligaomgång — degradera sant.
 */
export function storedRoundLabel(roundLabel: string | undefined, matchday: number): string {
  return roundLabel ?? `Matchdag ${matchday}`
}

/**
 * Tävlingsmedveten rond-etikett för en fixture.
 *
 * - Liga   → `roundNumber` (1–22), det tal spelaren faktiskt tänker i.
 * - Cup    → cupService.getCupRoundLabel (befintlig, korrekt rondnamn­givning).
 * - Slutspel → ALDRIG `roundNumber` (se nextPlayoffStart i playoffService.ts
 *   — talet är bara en fortsättning på ligans räkning och betyder inget för
 *   spelaren). Fasen slås upp i bracketen.
 *
 * @param playoffBracket krävs bara för slutspelsmatcher. Saknas den (gammal
 *   sparfil, eller en yta som inte har game) blir etiketten 'Slutspel' —
 *   sant men ospecifikt, aldrig ett vilseledande tal.
 */
export function getRoundLabel(
  fixture: Pick<Fixture, 'id' | 'roundNumber' | 'isCup' | 'isKnockout'>,
  playoffBracket?: PlayoffBracket | null,
): RoundLabel {
  if (fixture.isCup) {
    const label = `Cup · ${getCupRoundLabel(fixture.roundNumber).toLowerCase()}`
    return { short: label, long: label }
  }

  if (fixture.isKnockout) {
    const round = getPlayoffRoundForFixture(playoffBracket ?? null, fixture.id)
    if (round === null) {
      return { short: 'Slutspel', long: 'Slutspel' }
    }
    if (round === PlayoffRound.Final) {
      const label = playoffRoundName(round)
      return { short: label, long: label }
    }
    const label = `Slutspel · ${playoffRoundName(round).toLowerCase()}`
    return { short: label, long: label }
  }

  return {
    short: `Omg ${fixture.roundNumber}`,
    long: `Omgång ${fixture.roundNumber}`,
  }
}
