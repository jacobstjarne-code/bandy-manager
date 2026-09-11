// Textsvep (2026-09-11): dessa fem arenanamn är redan självbärande egennamn
// (Bastionen, Slagghögen, Ässjan, Kolbottnen, Planlunden) — "Bastionen arena"
// läser onaturligt på samma sätt som "vallen"/"hallen"/"planen"-suffixen
// redan skyddar mot. Namngiven lista, inte ett mönster, eftersom dessa
// namn inte delar en gemensam ändelse att matcha generiskt mot.
const PROPER_NOUN_ARENA_NAMES = new Set(['bastionen', 'slagghögen', 'ässjan', 'kolbottnen', 'planlunden'])

export function formatArenaName(stadium: string): string {
  if (!stadium) return ''
  const lower = stadium.toLowerCase()
  const alreadyHasSuffix =
    lower.endsWith(' arena') ||
    lower.endsWith('vallen') ||
    lower.endsWith('hallen') ||
    lower.endsWith('planen') ||
    PROPER_NOUN_ARENA_NAMES.has(lower)
  return alreadyHasSuffix ? stadium : `${stadium} arena`
}
