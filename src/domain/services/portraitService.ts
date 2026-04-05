function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash)
}

export function getPortraitPath(playerId: string, age: number): string {
  const cat = age <= 21 ? 'young' : age <= 27 ? 'mid' : age <= 32 ? 'exp' : 'vet'
  const idx = (simpleHash(playerId) % 8) + 1
  return `/assets/portraits/portrait_${cat}_${idx}.png`
}
