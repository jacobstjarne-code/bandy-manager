export function formatArenaName(stadium: string): string {
  // arenaName är ett egennamn i världsmodellen, inte ett ortnamn som behöver
  // typbeteckning. Automatiskt suffix gav "Planlunden arena", "Ässjan arena"
  // och liknande konstruktioner som stred mot all etablerad klubbcopy.
  return stadium.trim()
}
