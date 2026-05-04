export const STAR_PERFORMANCE_VARIANTS: readonly string[] = [
  `{NAME} ställde fram klubban i stället, lade tröjan i tvättkorgen. Nickade till Sture på vägen ut. Rating: {RATING}.`,
  `Materialaren bad {NAME} om hjälp att bära ut näten. Han var en av få som var kvar i hallen. Rating: {RATING}.`,
  `{NAME} var med på allt som hade betydelse. Det är inte vanligt. Rating: {RATING}.`,
  `Sture klappade {NAME} på axeln på väg in i omklädningsrummet. Mer blev det inte sagt. Rating: {RATING}.`,
  `{NAME} gick i baracker tre, tog en kaffe, satte sig vid fönstret. Ingen störde. Rating: {RATING}.`,
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
  `{CAPTAIN} knackar på dörren. Vattenflaska i handen.\n\n"Är det okej om jag säger något till killarna före matchen? Inget längre."\n\nLaget har förlorat tre raka.`,
  `{CAPTAIN} ställer sig vid dörrposten. Tar av sig kepsen.\n\n"Jag har funderat. Det är dags."\n\nLaget har förlorat tre raka.`,
  `{CAPTAIN} sätter sig i stolen mittemot. Sitter tyst en stund.\n\n"Vi behöver vända det här. Jag tänkte säga något i omklädningsrummet. Du får säga ifrån om det är fel."\n\nLaget har förlorat tre raka.`,
  `{CAPTAIN} kommer förbi efter morgonträningen.\n\n"Grabbarna behöver höra det från någon i laget. Är det okej om det blir jag?"\n\nLaget har förlorat tre raka.`,
  `{CAPTAIN} står kvar när alla andra gått hem. Klubban i handen.\n\n"Jag tar några ord på fredag. Bara så du vet."\n\nLaget har förlorat tre raka.`,
]

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

export function pickStarPerformanceText(
  player: { id: string; firstName: string; lastName: string },
  rating: number,
  roundNumber: number,
): string {
  const variant = pickVariant(STAR_PERFORMANCE_VARIANTS, `${player.id}_${roundNumber}`)
  return variant
    .replace(/\{NAME\}/g, `${player.firstName} ${player.lastName}`)
    .replace(/\{RATING\}/g, rating.toFixed(1))
}

export function pickPlayerPraiseText(
  praiser: { id: string; firstName: string; lastName: string },
  praised: { id: string; firstName: string; lastName: string },
): string {
  const variant = pickVariant(PLAYER_PRAISE_VARIANTS, `${praiser.id}_${praised.id}`)
  return variant
    .replace(/\{A\}/g, `${praiser.firstName} ${praiser.lastName}`)
    .replace(/\{B\}/g, `${praised.firstName} ${praised.lastName}`)
    .replace(/\{LASTNAME_B\}/g, praised.lastName)
}

export function pickCaptainSpeechText(
  captain: { id: string; firstName: string; lastName: string },
  season: number,
): string {
  const variant = pickVariant(CAPTAIN_SPEECH_VARIANTS, `${captain.id}_s${season}`)
  return variant.replace(/\{CAPTAIN\}/g, `${captain.firstName} ${captain.lastName}`)
}
