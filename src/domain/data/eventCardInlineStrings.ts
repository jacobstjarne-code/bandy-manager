export const STAR_PERFORMANCE_VARIANTS: readonly string[] = [
  `{NAME} ställde fram klubban i stället, lade tröjan i tvättkorgen. Nickade till Sture på vägen ut. Rating: {RATING}.`,
  `Materialaren bad {NAME} om hjälp att bära ut näten. Han var en av få som var kvar på vallen. Rating: {RATING}.`,
  `{NAME} var med på allt som hade betydelse. Det är inte vanligt. Rating: {RATING}.`,
  `Sture klappade {NAME} på axeln på väg in i omklädningsrummet. Mer blev det inte sagt. Rating: {RATING}.`,
  `{NAME} satt kvar i omklädningsrummet ett tag. Ingen frågade vad han tänkte på. Rating: {RATING}.`,
  `{NAME} satte sig sist på bussen. Det blev tyst där bak — på det bra sättet. Rating: {RATING}.`,
]

export const PLAYER_PRAISE_VARIANTS: readonly string[] = [
  `{A} till Bandypuls om {B}:\n\n"Han ser det innan jag ser det. Sen är bollen där."`,
  `{A} efter morgonträningen, om {B}:\n\n"Han gör mitt jobb hälften så svårt."`,
  `{A} när någon frågade om kemin med {B}:\n\n"Vi spelade inte ihop som juniorer. Synd."`,
  `Sture i kafferummet:\n\n"{A} och {B} hittar varandra på planen. Konstigt nog."`,
  `{A} i bussen hem, om {B}:\n\n"{LASTNAME_B} måste sluta. Han får mig att se bra ut."`,
  `{A} till lokaltidningen om {B}:\n\n"Han vinner brytningar jag inte ens visste fanns."`,
]

export const CAPTAIN_SPEECH_VARIANTS: readonly string[] = [
  `{CAPTAIN} knackar på dörren. Vattenflaska i handen.\n\n"Är det okej om jag säger något till killarna före matchen? Inget längre."\n\nFörlusterna har börjat stapla sig.`,
  `{CAPTAIN} ställer sig vid dörrposten. Tar av sig kepsen.\n\n"Jag har funderat. Det är dags."\n\nFörlusterna har börjat stapla sig.`,
  `{CAPTAIN} sätter sig i stolen mittemot. Sitter tyst en stund.\n\n"Vi behöver vända det här. Jag tänkte säga något i omklädningsrummet. Du får säga ifrån om det är fel."\n\nFörlusterna har börjat stapla sig.`,
  `{CAPTAIN} kommer förbi efter morgonträningen.\n\n"Grabbarna behöver höra det från någon i laget. Är det okej om det blir jag?"\n\nFörlusterna har börjat stapla sig.`,
  `{CAPTAIN} står kvar när alla andra gått hem. Klubban i handen.\n\n"Jag tar några ord på fredag. Bara så du vet."\n\nFörlusterna har börjat stapla sig.`,
]

import { seededPick } from '../utils/random'

export function pickStarPerformanceText(
  player: { id: string; firstName: string; lastName: string },
  rating: number,
  roundNumber: number,
): string {
  const variant = seededPick(STAR_PERFORMANCE_VARIANTS, `${player.id}_${roundNumber}`)
  return variant
    .replace(/\{NAME\}/g, `${player.firstName} ${player.lastName}`)
    .replace(/\{RATING\}/g, rating.toFixed(1))
}

export function pickPlayerPraiseText(
  praiser: { id: string; firstName: string; lastName: string },
  praised: { id: string; firstName: string; lastName: string },
): string {
  const variant = seededPick(PLAYER_PRAISE_VARIANTS, `${praiser.id}_${praised.id}`)
  return variant
    .replace(/\{A\}/g, `${praiser.firstName} ${praiser.lastName}`)
    .replace(/\{B\}/g, `${praised.firstName} ${praised.lastName}`)
    .replace(/\{LASTNAME_B\}/g, praised.lastName)
}

export function pickCaptainSpeechText(
  captain: { id: string; firstName: string; lastName: string },
  season: number,
): string {
  const variant = seededPick(CAPTAIN_SPEECH_VARIANTS, `${captain.id}_s${season}`)
  return variant.replace(/\{CAPTAIN\}/g, `${captain.firstName} ${captain.lastName}`)
}
