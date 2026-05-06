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
      'Tillbaka imorgon om det håller.',
      'Sista dagen på bänken.',
    ], playerId + 'inj1')
  }
  return pick([
    `${days} dagar till comeback.`,
    `Borta ${days} dagar till.`,
    `Ska vara redo om ${days} dagar.`,
    `${days} dagar på bänken.`,
  ], playerId + `inj${days}`)
}

export function getSuspensionText(matches: number, playerId: string): string {
  if (matches === 1) {
    return pick([
      'Sitter av sista matchen.',
      'En match kvar på sin avstängning.',
      'Tillbaka nästa omgång.',
    ], playerId + 'sus1')
  }
  return pick([
    `${matches} matcher kvar på avstängningen.`,
    `Utvisad i ytterligare ${matches} matcher.`,
    `${matches} matcher borta.`,
  ], playerId + `sus${matches}`)
}

export function getMoraleText(morale: number, lowMoraleDays: number | undefined, playerId: string): string {
  const days = lowMoraleDays ?? 0
  if (days > 5) {
    return pick([
      `Låg moral i ${days} omgångar.`,
      `${days} omgångar med sjunkande moral.`,
      `Har inte hittat gnistan på ${days} omgångar.`,
    ], playerId + `md${days}`)
  }
  if (days > 2) {
    return pick([
      `Moral nere på ${morale} — tredje omgången.`,
      `Fortsätter nedåt. ${morale}/100.`,
      `Trenden är fel. Moral ${morale}.`,
    ], playerId + `md${days}`)
  }
  if (morale < 25) {
    return pick([
      `Moral ${morale}/100. Kritiskt låg.`,
      `Nere på ${morale}. Behöver prat.`,
      `Moral på botten — ${morale}/100.`,
    ], playerId + 'very_low')
  }
  return pick([
    `Moral ${morale}/100.`,
    `Inte på topp — ${morale}/100.`,
    `Moral under 45. Håll koll.`,
  ], playerId + 'low')
}

export function getContractText(contractUntilSeason: number, currentSeason: number, playerId: string): string {
  if (contractUntilSeason < currentSeason) {
    return pick([
      'Kontrakt löpt ut.',
      'Spelar utan kontrakt.',
      'Fri agent — inget skrivit.',
    ], playerId + 'expired')
  }
  return pick([
    'Kontrakt löper ut i sommar.',
    'Sista säsongen på nuvarande kontrakt.',
    'Kontraktet går ut. Beslut behövs.',
    'Fri att förhandla med andra från nästa år.',
  ], playerId + 'expiring')
}
