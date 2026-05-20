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

/**
 * 15 frågor, 5 per severity-nivå. Plockas baserat på journalist.relationship.
 * {NAME} ersätts med spelarens fullnamn vid rendering.
 */
export const CS_PRESS_QUESTIONS: Record<PressSeverity, readonly string[]> = {
  provocative: [
    `Var det helt enkelt tur idag, eller är något på riktigt på väg att hända?`,
    `Tre noll mot ett lag som inte är direkt världsklass. Är vi imponerade?`,
    `Vad krävs för att det här ska räknas på riktigt? Just nu känns det tunt.`,
    `{NAME} höll noll. Men ni har varit svaga försvarsmässigt hela hösten. Bluff eller vändning?`,
    `Skulle du säga att klubben har fattat något, eller är det här bara väderomslag?`,
  ],
  neutral: [
    `Hur ska vi tolka det här? Är det här laget på riktigt, eller en bra dag?`,
    `{NAME} höll noll mot ett gott motstånd. Är det en spelare som sticker ut just nu?`,
    `Vad var skillnaden idag mot förra mötet?`,
    `Ni har spelat enklare bandy de senaste veckorna. Är det en plan eller en följd?`,
    `Skulle du säga att försvarsspelet är där ni vill ha det?`,
  ],
  friendly: [
    `{NAME} stänger ned ett bra anfallslag. Hur mycket av det är hans förtjänst?`,
    `Tre poäng utan baklängesmål. Det är vad som krävs i nedflyttningsstriden, eller?`,
    `Vad ser du som mest givande just nu — försvarsspelet, formen eller stämningen?`,
    `Du har sagt förut att försvaret kommer i form sent. Är det det vi ser nu?`,
    `Hur viktigt är det att {NAME} får det här erkännandet just idag?`,
  ],
}

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
    `"Han ser det innan andra gör det." {COACH_LASTNAME} om {NAME} efter trepoängaren.`,
  ],
  team: [
    `{COACH_LASTNAME}: "Vi försvarar tillsammans." — kort om matchen i {OUTLET}`,
    `Ingen enskild lyfts fram efter trepoängaren. Det är en plan, säger {COACH_LASTNAME}.`,
    `{COACH_LASTNAME} fördelar äran: "Det är elva man som löser det här."`,
  ],
  system: [
    `{COACH_LASTNAME} talar systemiskt: "Det är inte personer. Det är hur vi spelar."`,
    `Klubbens tränare svarar {JOURNALIST} med taktik, inte med namn.`,
    `"Strukturen håller. Det är det vi har byggt." {COACH_LASTNAME} efter trepoängaren.`,
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
  individual: 'Coach hyllade {NAME} efter CS mot {OPPONENT}',
  team: 'Coach valde lagrespons om CS mot {OPPONENT}',
  system: 'Coach gav systemiskt svar om CS mot {OPPONENT}',
  silent: 'Coach avstod kommentar om CS mot {OPPONENT}',
}

/**
 * Pick-funktioner enligt mönstret i eventCardInlineStrings.ts.
 * Deterministisk seed så samma matchspel ger samma fråga vid återbesök.
 */
function pickVariant<T extends string>(
  variants: readonly T[],
  seedString: string,
): T {
  let hash = 0
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash * 31 + seedString.charCodeAt(i)) | 0
  }
  return variants[Math.abs(hash) % variants.length]
}

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
  const severity = getSeverityFromRelationship(relationship)
  const variant = pickVariant(CS_PRESS_QUESTIONS[severity], `${player.id}_${fixtureId}`)
  return variant.replace(/\{NAME\}/g, `${player.firstName} ${player.lastName}`)
}

export function pickCSPressPublishedQuote(
  choice: PressChoice,
  coach: { lastName: string },
  player: { firstName: string; lastName: string },
  journalist: { firstName: string; lastName: string; outlet: string },
  fixtureId: string,
): string {
  const variant = pickVariant(
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
