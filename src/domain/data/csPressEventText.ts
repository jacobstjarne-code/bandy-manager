/**
 * CS-villkorad pressfråga — när hemmaklubben hållit noll i seriematch och
 * journalisten ber tränaren kommentera.
 *
 * Frågans tonalitet skiftar med game.journalistRelationship (0-100):
 * - <= 33: provocative (kall relation, hon testar)
 * - 34-66: neutral (vanlig press)
 * - >= 67: friendly (varm relation, vänlig nyfikenhet)
 *
 * Tonregister: bandysvensk understatement. Inga utropstecken. Specifika
 * detaljer (Sture, materialaren, kafferummet, bussen hem).
 *
 * Plockas av postMatchProcessor + csPressEventService. Följer mönstret från
 * eventCardInlineStrings.ts (pickVariant + seed).
 */

export type PressSeverity = 'provocative' | 'neutral' | 'friendly'
export type PressChoice = 'individual' | 'team' | 'system' | 'silent'

export interface CSPressQuestionSelection {
  id: string
  text: string
  referencesPreviousAnswer: boolean
}

export interface CSPressCauseMemory {
  season: number
  matchday: number
  questionId?: string
  answerId?: string
}

/**
 * 15 frågor, 5 per severity-nivå. Plockas baserat på journalist.relationship.
 * {NAME} ersätts med spelarens fullnamn vid rendering.
 */
export const CS_PRESS_QUESTIONS: Record<PressSeverity, readonly string[]> = {
  provocative: [
    `Var det helt enkelt tur i dag, eller är något på riktigt på väg att hända?`,
    `Hållen nolla, javisst. Men är vi imponerade?`,
    `Vad krävs för att det här ska räknas på riktigt? Just nu känns det tunt.`,
    `Nollan hölls, den här gången. Bluff eller vändning?`,
    `Skulle du säga att klubben har fattat något, eller är det här bara väderomslag?`,
  ],
  neutral: [
    `Hur ska vi tolka det här? Är det här laget på riktigt, eller en bra dag?`,
    `{NAME} stod för en stark insats där bak. Är det en spelare som sticker ut just nu?`,
    `Vad var skillnaden i dag?`,
    `Ni spelar enklare bandy nu. Är det en plan eller en följd?`,
    `Skulle du säga att försvarsspelet är där ni vill ha det?`,
  ],
  friendly: [
    `Ingenting gick in i dag. Hur mycket av det är {NAME}s förtjänst?`,
    `Hållen nolla på hemmaplan. Hur mycket är den värd i omklädningsrummet?`,
    `Vad ser du som mest givande just nu — försvarsspelet, formen eller stämningen?`,
    `Man brukar säga att försvar kommer i form sent. Är det det vi ser nu?`,
    `Hur viktigt är det att {NAME} får det här erkännandet just i dag?`,
  ],
}

/**
 * C-SY1 Pilot 2 — inflätade återkopplingar till det verkliga föregående
 * csPress-svaret. Precis som Pilot 1 är detta en parallell pool, inte en
 * mekanisk wrapper runt en vanlig fråga.
 */
export const CS_PRESS_CAUSE_QUESTIONS: Record<PressChoice, readonly string[]> = {
  individual: [
    `Sist gav du en spelare hela äran efter nollan. Vem bär mest av det här i dag?`,
    `Förra gången lyfte du fram en enskild spelare. Ser du den här nollan på samma sätt?`,
  ],
  team: [
    `Sist gav du hela laget äran. Är det samma svar efter ännu en hållen nolla?`,
    `Förra gången talade du om elva man. Var det kollektivet som bar er i dag också?`,
  ],
  system: [
    `Du talade om systemet sist. Är det strukturen som håller fortfarande?`,
    `Förra gången gav du arbetssättet äran. Var det planen som höll nollan i dag också?`,
  ],
  silent: [
    `Sist blev det ingen kommentar. Säger du mer om den här nollan?`,
    `Du avstod från att svara förra gången. Vad vill du säga efter nollan i dag?`,
  ],
}

export const CS_PRESS_CAUSE_PREFIX_THRESHOLD = 0.35
export const CS_PRESS_CAUSE_MAX_AGE = 8

/**
 * Knapptexter för spelarens fyra val. Tre kärnval + ghost-val.
 * Ghost-valet renderas något dämpat i UI (mindre kontrast).
 */
export const CS_PRESS_CHOICE_BUTTONS: Record<PressChoice, string> = {
  individual: 'Han har varit avgörande',
  team: 'Hela laget försvarar',
  system: 'Det är systemet',
  silent: 'Ingen kommentar',
}

/**
 * Publicerade citat — visas som notification-card nästa omgång.
 * Varierar med val. {COACH_LASTNAME} = tränarens efternamn, {NAME} = spelarens
 * fullnamn, {JOURNALIST} = journalistens fullnamn, {OUTLET} = journalist.outlet.
 */
export const CS_PRESS_PUBLISHED_QUOTES: Record<PressChoice, readonly string[]> = {
  individual: [
    `{NAME} är klubbens viktigaste spelare — {COACH_LASTNAME} i {OUTLET}`,
    `{COACH_LASTNAME} höjer {NAME}: "Han bär en stor del av det här."`,
    `"Han ser det innan andra gör det." {COACH_LASTNAME} om {NAME} efter nollan.`,
  ],
  team: [
    `{COACH_LASTNAME}: "Vi försvarar tillsammans." — kort om matchen i {OUTLET}`,
    `Ingen enskild lyfts fram efter nollan. Det är en plan, säger {COACH_LASTNAME}.`,
    `{COACH_LASTNAME} fördelar äran: "Det är elva man som löser det här."`,
  ],
  system: [
    `{COACH_LASTNAME} talar systemiskt: "Det är inte personer. Det är hur vi spelar."`,
    `Klubbens tränare svarar {JOURNALIST} med taktik, inte med namn.`,
    `"Strukturen håller. Det är det vi har byggt." {COACH_LASTNAME} efter nollan.`,
  ],
  silent: [
    `{COACH_LASTNAME} avstod kommentar. Det är inte första gången.`,
    `Tystnad från tränarens kontor. {JOURNALIST} fortsätter ändå.`,
    `Inga ord från {COACH_LASTNAME} efter matchen. Det säger något i sig.`,
  ],
}

/**
 * Memory-rader — kortform som skrivs till journalist.memory[] för senare
 * referens av andra press-events. {OPPONENT} = motståndarens klubbnamn.
 */
export const CS_PRESS_MEMORY_TEMPLATES: Record<PressChoice, string> = {
  individual: 'Tränaren hyllade {NAME} efter CS mot {OPPONENT}',
  team: 'Tränaren valde lagrespons om CS mot {OPPONENT}',
  system: 'Tränaren gav systemiskt svar om CS mot {OPPONENT}',
  silent: 'Tränaren avstod kommentar om CS mot {OPPONENT}',
}

/**
 * Pick-funktioner enligt mönstret i eventCardInlineStrings.ts.
 * Deterministisk seed så samma matchspel ger samma fråga vid återbesök.
 */
import { fixtureSeed, seededPick } from '../utils/random'

export function getSeverityFromRelationship(relationship: number): PressSeverity {
  if (relationship <= 33) return 'provocative'
  if (relationship >= 67) return 'friendly'
  return 'neutral'
}

export function pickCSPressQuestion(
  player: { id: string; firstName: string; lastName: string },
  fixtureId: string,
  relationship: number,
): string {
  return pickCSPressQuestionSelection(player, fixtureId, relationship, 0, 0).text
}

export function csPressCauseIsRelevant(
  memory: CSPressCauseMemory | undefined,
  currentSeason: number,
  currentMatchday: number,
): memory is CSPressCauseMemory & { questionId: string; answerId: PressChoice } {
  if (!memory?.questionId || !memory.answerId) return false
  if (!Object.prototype.hasOwnProperty.call(CS_PRESS_CAUSE_QUESTIONS, memory.answerId)) return false
  if (memory.season !== currentSeason) return false
  const age = currentMatchday - memory.matchday
  return age >= 1 && age <= CS_PRESS_CAUSE_MAX_AGE
}

/**
 * Returnerar både texten och dess stabila identitet. Äldre minnesposter utan
 * questionId/answerId kan inte bära en sann återkoppling och faller därför
 * alltid tillbaka till den vanliga relationsstyrda frågepoolen.
 */
export function pickCSPressQuestionSelection(
  player: { id: string; firstName: string; lastName: string },
  fixtureId: string,
  relationship: number,
  currentSeason: number,
  currentMatchday: number,
  previousMemory?: CSPressCauseMemory,
): CSPressQuestionSelection {
  const causeRelevant = csPressCauseIsRelevant(previousMemory, currentSeason, currentMatchday)
  const useCause = causeRelevant
    && fixtureSeed(`${fixtureId}_cs_press_cause`) % 100 < CS_PRESS_CAUSE_PREFIX_THRESHOLD * 100

  if (useCause) {
    const answerId = previousMemory.answerId
    const pool = CS_PRESS_CAUSE_QUESTIONS[answerId]
    const text = seededPick(pool, `${fixtureId}_${answerId}_cause`)
    return {
      id: `cs_cause_${answerId}_${pool.indexOf(text) + 1}`,
      text,
      referencesPreviousAnswer: true,
    }
  }

  const severity = getSeverityFromRelationship(relationship)
  const pool = CS_PRESS_QUESTIONS[severity]
  const template = seededPick(pool, `${player.id}_${fixtureId}`)
  return {
    id: `cs_${severity}_${pool.indexOf(template) + 1}`,
    text: template.replace(/\{NAME\}/g, `${player.firstName} ${player.lastName}`),
    referencesPreviousAnswer: false,
  }
}

export function pickCSPressPublishedQuote(
  choice: PressChoice,
  coach: { lastName: string },
  player: { firstName: string; lastName: string },
  journalist: { firstName: string; lastName: string; outlet: string },
  fixtureId: string,
): string {
  const variant = seededPick(
    CS_PRESS_PUBLISHED_QUOTES[choice],
    `${choice}_${fixtureId}`,
  )
  return variant
    .replace(/\{COACH_LASTNAME\}/g, coach.lastName)
    .replace(/\{NAME\}/g, `${player.firstName} ${player.lastName}`)
    .replace(/\{JOURNALIST\}/g, `${journalist.firstName} ${journalist.lastName}`)
    .replace(/\{OUTLET\}/g, journalist.outlet)
}

export function buildCSPressMemoryEntry(
  choice: PressChoice,
  player: { firstName: string; lastName: string },
  opponent: { name: string },
): string {
  return CS_PRESS_MEMORY_TEMPLATES[choice]
    .replace(/\{NAME\}/g, `${player.firstName} ${player.lastName}`)
    .replace(/\{OPPONENT\}/g, opponent.name)
}
