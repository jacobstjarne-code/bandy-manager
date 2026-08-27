import type { ManagerProfile } from '../entities/ManagerProfile'
import type { SaveGame } from '../entities/SaveGame'
import type { GameEvent } from '../entities/GameEvent'
import type { OpponentAnalysis } from './opponentAnalysisService'
import { getBurnoutZone } from './managerProfileService'
import { BURNOUT_ZONE_LABELS } from '../data/managerKaraktarText'
import { mulberry32 } from '../utils/random'
import { pickPoolIndexAvoidingCooldown } from './narrativeLogService'

export const BURNOUT_QUOTE_PREFIX = 'burnout_quote_'
export const BURNOUT_HELPER_PREFIX = 'burnout_helper_'

/**
 * A-H4a (SEXSÄSONGSAUDITEN 2026-08-26): no-repeat INOM säsongen (minSeasonsApart=1
 * — en post från INNEVARANDE säsong räknas som cooldown, en från en tidigare
 * säsong gör det inte, så poolen är fri igen varje ny säsong). Detta var
 * redan den dokumenterade målbilden i managerKaraktarText.ts (rad 38-40),
 * bara aldrig byggd — BurnoutMark.tsx läste tidigare `round % quotes.length`.
 */
export function pickBurnoutQuoteIndex(game: Pick<SaveGame, 'currentSeason' | 'currentMatchday' | 'narrativeBeatLog'>, zone: 'markbar' | 'hog', poolLength: number): number {
  return pickPoolIndexAvoidingCooldown(game as SaveGame, game.currentSeason, poolLength, `${BURNOUT_QUOTE_PREFIX}${zone}_`, game.currentMatchday, 1)
}

export function pickBurnoutHelperIndex(game: Pick<SaveGame, 'currentSeason' | 'currentMatchday' | 'narrativeBeatLog'>, zone: 'markbar' | 'hog', poolLength: number): number {
  return pickPoolIndexAvoidingCooldown(game as SaveGame, game.currentSeason, poolLength, `${BURNOUT_HELPER_PREFIX}${zone}_`, game.currentMatchday * 7, 1)
}

/**
 * O4 (DOM_BURNOUT_2026-08-17.md, Jacobs dom 2026-08-23 — D1 var blockeraren,
 * nu klar i sin helhet). Burnoutkortet visades varje säsong men hade ingen
 * gameplay-effekt — mätaren blev bakgrundsbrus. Domen: EN effekt
 * (informationskvalitet, inte prestation) + TRE handlingar med verkliga
 * priser.
 *
 * "Rapportera först" (domens egen instruktion) gav fyra spårade konsumenter,
 * varav TVÅ visade sig obyggbara i detta pass:
 * - Motståndaranalysens detaljnivå ("farliga forwards" istf namn+siffror):
 *   domens EGEN exempelfras är sedan `BANDYSPRAK_KALLASNING_2026-08-19.md`
 *   (B4, OpponentAnalysisCard.tsx:98-100) uttryckligen underkänd som
 *   speltext — "inte 'de har farliga forwards'". Ingen ersättningstext
 *   finns. Byggs inte förrän Opus skriver den.
 * - "Inkorgens sammanfattning slutar prioritera": mekanismen domen
 *   förutsätter (en dailyBriefingService-liknande sammanfattning) finns
 *   inte i kodbasen — InboxScreen.tsx sorterar rakt på datum, ingen
 *   prioriteringslogik att gradera ned. Byggs inte utan ett nytt system.
 * - "Spelarbetygen visas med en dags fördröjning": Granska saknar ett
 *   "dagar sedan match"-begrepp separat från omgångstakten — tvetydigt hur
 *   det ska modelleras utan en UX-tolkning. Byggs inte i detta pass.
 *
 * Byggt: taktikrekommendationens uteblivande (gradeable, ingen ny text
 * behövs — badgen försvinner bara) + de tre handlingarna (all text låst
 * ordagrant i domen).
 */

const BURNOUT_TACTIC_SUPPRESS_CHANCE: Record<'markbar' | 'hog', number> = {
  markbar: 0.25,
  hog: 0.5,
}

/** Delad seed-formel — TaktikScreen.tsx och SquadScreen.tsx monterar båda
 *  TacticBoardCard och härleder var för sig samma opponentAnalysis; utan en
 *  GEMENSAM seed (samma formel på båda ställena, inte var sin) skulle de
 *  kunna landa på olika svar samma omgång. */
export function burnoutEffectSeed(game: Pick<SaveGame, 'currentSeason' | 'currentMatchday'>): number {
  return game.currentSeason * 1000 + game.currentMatchday
}

/** Deterministisk per omgång (seedad, inte Math.random) — se burnoutEffectSeed. */
export function getBurnoutTacticSuppression(profile: ManagerProfile | undefined, seed: number): boolean {
  const zone = getBurnoutZone(profile?.burnoutScore ?? 0)
  if (zone === 'frisk') return false
  const rand = mulberry32(seed)
  return rand() < BURNOUT_TACTIC_SUPPRESS_CHANCE[zone]
}

/** Strippar bara rekommendationsfälten — feel-prognosen och övrig
 *  opponentAnalysis-data (keyPlayers m.m.) ska stå orörda, det är bara
 *  FÖRESLÅS-badgen som ska utebli. */
export function suppressTacticRecommendation(analysis: OpponentAnalysis | undefined): OpponentAnalysis | undefined {
  if (!analysis) return analysis
  return { ...analysis, suggestedMentality: undefined, suggestedPress: undefined }
}

const BURNOUT_DELEGATE_SCORE_DELTA = -12
const BURNOUT_TRAIN_SCORE_DELTA = -15
const BURNOUT_BOARD_SCORE_DELTA = -25 // "sjunker mest" (domen)
const BURNOUT_DELEGATE_JOURNALIST_DELTA = -10
const BURNOUT_BOARD_PATIENCE_DELTA = -10
const BURNOUT_TRAINING_SLOWDOWN_ROUNDS = 4

/** Kortets text (domen, "Texten"-avsnittet): säger VAD som händer, inte HUR
 *  det känns — det senare är BurnoutMark.tsx:s citat, orört, kvar som
 *  atmosfär. De två ytorna delar samma zon men olika register. */
const BURNOUT_RELIEF_BODY: Record<'markbar' | 'hog', string> = {
  markbar: 'Du hinner inte förbereda som du vill. Det märks på vad du ser.',
  hog: 'Du läser inte rapporterna längre. Du bläddrar förbi dem.',
}

export function generateBurnoutReliefEvent(matchday: number, season: number, zone: 'markbar' | 'hog'): GameEvent {
  return {
    id: `event_burnout_relief_${season}_${matchday}`,
    type: 'burnoutRelief',
    // Titeln återanvänder ENBART redan godkänd text (BURNOUT_ZONE_LABELS,
    // managerKaraktarText.ts) — Code skriver aldrig egen svensk speltext,
    // och en konstruerad rubrik ("Du är utmattad") vore precis det.
    title: BURNOUT_ZONE_LABELS[zone],
    // Inget sender-fält — det här är managerns EGEN situation, ingen
    // avsändare att namnge (att skriva "Du" / "Manager" hade varit precis
    // den typen konstruerad UI-text CLAUDE.md förbjuder Code att skriva).
    body: BURNOUT_RELIEF_BODY[zone],
    choices: [
      {
        id: 'delegate',
        label: 'Låt assistenten ta pressen',
        // Subtitle = domens exakta citat, ordagrant. Ingen egen effekt-
        // beskrivning tillagd (CLAUDE.md: Code skriver aldrig speltext) —
        // konsekvensen syns i inbox/Granska, samma mönster som O1/Medium 2.
        subtitle: 'Han säger det du hade sagt. Ungefär.',
        effect: {
          type: 'multiEffect',
          subEffects: JSON.stringify([
            { type: 'reduceBurnout', amount: BURNOUT_DELEGATE_SCORE_DELTA },
            { type: 'journalistRelationship', amount: BURNOUT_DELEGATE_JOURNALIST_DELTA },
          ]),
        },
      },
      {
        id: 'train',
        label: 'Sänk tempot på träningen',
        subtitle: 'Laget vilar. Utvecklingen väntar.',
        effect: {
          type: 'multiEffect',
          subEffects: JSON.stringify([
            { type: 'reduceBurnout', amount: BURNOUT_TRAIN_SCORE_DELTA },
            { type: 'startTrainingSlowdown', amount: BURNOUT_TRAINING_SLOWDOWN_ROUNDS },
          ]),
        },
      },
      {
        id: 'board',
        label: 'Be styrelsen om andrum',
        subtitle: 'De lyssnar. De räknar också.',
        effect: {
          type: 'multiEffect',
          subEffects: JSON.stringify([
            { type: 'reduceBurnout', amount: BURNOUT_BOARD_SCORE_DELTA },
            { type: 'boardPatience', amount: BURNOUT_BOARD_PATIENCE_DELTA },
          ]),
        },
      },
    ],
    resolved: false,
  }
}
