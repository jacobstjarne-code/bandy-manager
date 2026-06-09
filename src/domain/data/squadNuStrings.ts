// squadNuStrings — pool-utökning 2026-05-08
// Tidigare 3-4 varianter per branch. SquadScreen besöks varje matchday → repetition var
// garanterad. Utökad till 7-8 varianter per branch.

import { SUSPENSION_AVAILABILITY_LABELS } from './suspensionText'

function pick<T>(arr: T[], seed: string): T {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) >>> 0
  }
  return arr[h % arr.length]
}

export function getInjuryText(days: number, playerId: string): string {
  if (days === 1) {
    return pick([
      'En dag till.',
      'Tillbaka i morgon om det håller.',
      'Sista dagen på bänken.',
      'Ett dygn till. Hoppas.',
      'I morgon ska han vara med på lätt löpning.',
      'Sista dagen. Sjukvården nickar.',
      'En till och så är han tillbaka.',
      'Räknar dagar nu. En kvar.',
    ], playerId + 'inj1')
  }
  return pick([
    `${days} dagar till comeback.`,
    `Borta ${days} dagar till.`,
    `Ska vara redo om ${days} dagar.`,
    `${days} dagar på bänken.`,
    `${days} dagar att gå.`,
    `Tillbaka om ${days} dagar — om allt går rätt.`,
    `${days} dagar i rehab.`,
    `Sjukgymnasten säger ${days} dagar till.`,
  ], playerId + `inj${days}`)
}

export function getSuspensionText(
  matches: number,
  playerId: string,
  cause?: { sinceMatchday: number; opponentName: string; matches: number },
): string {
  if (cause) {
    const template = matches > 1
      ? SUSPENSION_AVAILABILITY_LABELS.multi
      : SUSPENSION_AVAILABILITY_LABELS.single
    return template
      .replace('{motståndare}', cause.opponentName)
      .replace('{omg}', String(cause.sinceMatchday))
      .replace('{kvar}', String(matches))
  }
  if (matches === 1) {
    return pick([
      'Sitter av sista matchen.',
      'En match kvar på sin avstängning.',
      'Tillbaka nästa omgång.',
      'En match kvar. Sen tillbaka.',
      'Sista matchen i botbänken.',
      'Sitter av en match till.',
      'En omgång till. Sen är det klart.',
      'En kvar — nästa omgång är han med.',
    ], playerId + 'sus1')
  }
  return pick([
    `${matches} matcher kvar på avstängningen.`,
    `Utvisad i ytterligare ${matches} matcher.`,
    `${matches} matcher borta.`,
    `Avstängd ${matches} matcher till.`,
    `${matches} matcher att stå över.`,
    `Förbundet sa ${matches} matcher.`,
    `${matches} omgångar i botbänken kvar.`,
    `Bort i ${matches} matcher.`,
  ], playerId + `sus${matches}`)
}

export function getMoraleText(morale: number, lowMoraleDays: number | undefined, playerId: string): string {
  const days = lowMoraleDays ?? 0
  if (days > 5) {
    return pick([
      `Låg moral i ${days} omgångar.`,
      `${days} omgångar med sjunkande moral.`,
      `Har inte hittat gnistan på ${days} omgångar.`,
      `${days} omgångar i mörkret.`,
      `Hängande huvud sedan ${days} omgångar.`,
      `${days} omgångar utan att lyfta blicken.`,
      `Inte sig själv på ${days} omgångar.`,
      `${days} omgångar med samma trötta blick.`,
    ], playerId + `md${days}`)
  }
  if (days > 2) {
    return pick([
      `Moral nere på ${morale} — tredje omgången.`,
      `Fortsätter nedåt. ${morale}/100.`,
      `Trenden är fel. Moral ${morale}.`,
      `Moral på ${morale}. Och det rör sig fel håll.`,
      `Tredje omgången med ${morale}-känsla.`,
      `Säger inget i omklädningsrummet. Moral ${morale}.`,
      `${morale}/100 nu. Ledningen behöver agera.`,
      `Tredje omgången på rad — moral ${morale}.`,
    ], playerId + `md${days}`)
  }
  if (morale < 25) {
    return pick([
      `Moral ${morale}/100. Kritiskt låg.`,
      `Nere på ${morale}. Behöver prat.`,
      `Moral på botten — ${morale}/100.`,
      `${morale}/100. Det här är akut.`,
      `Moral ${morale}. Han behöver mer än ett samtal.`,
      `Ute ur sig själv. Moral ${morale}.`,
      `${morale}/100 — sitter ensam i kafferummet.`,
      `Moral ${morale}. Kapten har märkt det. Vi också.`,
    ], playerId + 'very_low')
  }
  return pick([
    `Moral ${morale}/100.`,
    `Inte på topp — ${morale}/100.`,
    `Moral under 45. Håll koll.`,
    `${morale}/100. Inget kris men inget bra.`,
    `Moral ${morale}. Lite trög.`,
    `Inte sin bästa vecka — moral ${morale}.`,
    `${morale}/100. Tränaren har sett det.`,
    `Moral nere på ${morale}. Ej akut.`,
  ], playerId + 'low')
}

export function getContractText(contractUntilSeason: number, currentSeason: number, playerId: string): string {
  if (contractUntilSeason < currentSeason) {
    return pick([
      'Kontrakt löpt ut.',
      'Spelar utan kontrakt.',
      'Fri agent — inget skrivit.',
      'Kontraktet är ute. Inget nytt på bordet.',
      'Fri agent sedan i somras.',
      'Spelar utan papper just nu.',
      'Kontraktet gick ut. Det förhandlades inte fram något.',
      'Sitter utan kontrakt. Tränaren vet om det.',
    ], playerId + 'expired')
  }
  return pick([
    'Kontrakt löper ut i sommar.',
    'Sista säsongen på nuvarande kontrakt.',
    'Kontraktet går ut. Beslut behövs.',
    'Fri att förhandla med andra från nästa år.',
    'Sista året på kontraktet.',
    'Förhandling väntar. Kontraktet löper ut.',
    'Andras agenter har redan ringt — kontraktet går ut.',
    'Klart i juni. Sen ny förhandling.',
  ], playerId + 'expiring')
}
