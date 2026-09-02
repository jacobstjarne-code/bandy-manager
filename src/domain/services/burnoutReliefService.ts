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
export const BURNOUT_RELAPSE_QUOTE_PREFIX = 'burnout_relapse_quote_'
export const BURNOUT_RELAPSE_HELPER_PREFIX = 'burnout_relapse_helper_'

/**
 * Återfalls-poolens repetitionsskydd är MEDVETET annorlunda än intro-poolens
 * nedan (pickBurnoutQuoteIndex/pickBurnoutHelperIndex, minSeasonsApart=1,
 * säsongsscopat — ett dokumenterat, accepterat mål för INTRO-poolen). Ett
 * återfall kan ligga flera säsonger ifrån föregående; minSeasonsApart=1 hade
 * gjort exakt samma upprepning möjlig som redan observerats i intro-poolen
 * (samma "Konsum"-citat kom tillbaka året därpå, eftersom cooldownen där
 * nollställs varje ny säsong). 50 är "inom en hel karriär, i praktiken
 * aldrig" utan att vara oändligt (fallback till hela poolen om allt är på
 * cooldown, samma golv som pickPoolIndexAvoidingCooldown redan har).
 */
const BURNOUT_RELAPSE_MIN_SEASONS_APART = 50

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

/** Återfalls-varianterna — samma primitiv, säsongsöverskridande cooldown (se BURNOUT_RELAPSE_MIN_SEASONS_APART). */
export function pickBurnoutRelapseQuoteIndex(game: Pick<SaveGame, 'currentSeason' | 'currentMatchday' | 'narrativeBeatLog'>, zone: 'markbar' | 'hog', poolLength: number): number {
  return pickPoolIndexAvoidingCooldown(game as SaveGame, game.currentSeason, poolLength, `${BURNOUT_RELAPSE_QUOTE_PREFIX}${zone}_`, game.currentMatchday, BURNOUT_RELAPSE_MIN_SEASONS_APART)
}

export function pickBurnoutRelapseHelperIndex(game: Pick<SaveGame, 'currentSeason' | 'currentMatchday' | 'narrativeBeatLog'>, zone: 'markbar' | 'hog', poolLength: number): number {
  return pickPoolIndexAvoidingCooldown(game as SaveGame, game.currentSeason, poolLength, `${BURNOUT_RELAPSE_HELPER_PREFIX}${zone}_`, game.currentMatchday * 7, BURNOUT_RELAPSE_MIN_SEASONS_APART)
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
 *   speltext — "inte 'de har farliga forwards'". **Ersättningstext skriven
 *   2026-08-31 (BURNOUT_OPPONENT_READ nedan) — vagheten som managerns ERKÄNNANDE
 *   att förberedelsen uteblev, inte som en falsk-säker generik. Code wirar in
 *   den i OpponentAnalysisCard:s burnout-väg (ersätter detaljraden).**
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

/**
 * Deterministisk per omgång (seedad, inte Math.random) — se burnoutEffectSeed.
 *
 * `forceFullSuppression` — DOM_BURNOUT_TAK_2026-09-02 (C), "assistenten tar
 * några omgångar (du tappar kontroll, laget driver)". Under "Kliv tillbaka"s
 * återhämtningsfönster (game.burnoutCeilingRecoveryUntilRound) är detta
 * ALLTID sant, oavsett zon eller seed — den probabilistiska markbar/hog-
 * chansen nedan är den VANLIGA burnout-effekten, inte takets pris. Callern
 * (SquadScreen.tsx/TaktikScreen.tsx) avgör flaggan ur samma game-objekt.
 */
export function getBurnoutTacticSuppression(profile: ManagerProfile | undefined, seed: number, forceFullSuppression = false): boolean {
  if (forceFullSuppression) return true
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

/**
 * Den degraderade motståndarläsningen (O4, äntligen skriven — se docstringen
 * ovan om varför den saknades). När managern är utbränd byts den SKARPA
 * motståndaranalysen (B4:s namn+egenskap+konsekvens) mot en TUNN läsning: inte
 * en falsk-säker generik ("de har farliga forwards", underkänd av BANDYSPRAK),
 * utan managerns ärliga erkännande att förberedelsen uteblev. Vagheten ÄR
 * kostnaden. Code wirar in den i OpponentAnalysisCard när burnoutzonen är
 * markbar/hog (ersätter detaljraden, inte hela kortet), vald via
 * pickPoolIndexAvoidingCooldown så den inte upprepas.
 */
export const BURNOUT_OPPONENT_READ: Record<'markbar' | 'hog', string[]> = {
  markbar: [
    'Du hann skumma deras senaste matcher. Inte mer.',
    'Du vet ungefär vad de vill. Detaljerna fick vänta.',
    'Något om deras främre femma. Du gick aldrig till botten med det.',
  ],
  hog: [
    'Du öppnade aldrig rapporten om dem. Det blir att lita på ögonen idag.',
    'De har säkert någon farlig. Du hann inte ta reda på vem.',
    'Vad de har? Du borde veta det bättre än så här.',
  ],
}

export const BURNOUT_OPPONENT_READ_PREFIX = 'burnout_oppread_'

/**
 * Läses per-match (OpponentAnalysisCard.tsx), inte per-zon-inträde som
 * quote/helper ovan — matchdagen är den naturliga variationsaxeln (en
 * flerveckors utbrändhetsperiod ska inte visa exakt samma rad varje match).
 * Samma pickPoolIndexAvoidingCooldown-primitiv som quote/helper; ingen ny
 * narrativeBeatLog-skrivning läggs till här (ren läsning, som BurnoutMark.tsx
 * redan gör för sina två pooler) — om en framtida runda vill hård-garantera
 * cooldown krävs en logNarrativeBeat-skrivning i roundProcessor.ts, samma
 * ställe som BURNOUT_QUOTE_PREFIX/BURNOUT_HELPER_PREFIX redan loggas.
 */
export function pickBurnoutOpponentReadIndex(game: Pick<SaveGame, 'currentSeason' | 'currentMatchday' | 'narrativeBeatLog'>, zone: 'markbar' | 'hog', poolLength: number): number {
  return pickPoolIndexAvoidingCooldown(game as SaveGame, game.currentSeason, poolLength, `${BURNOUT_OPPONENT_READ_PREFIX}${zone}_`, game.currentMatchday, 1)
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
