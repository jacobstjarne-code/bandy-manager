// Forsbacka BK — låst klubbpalett.
// Källa: CLUB-BRIEF.md (Forsbacka jernverk → djup mörkröd + creme + järnsvart).
//
// DETTA är den enda sanningen för Forsbackas färg. CLUB_BADGES i
// ClubBadge.tsx anger blå (#1e4d8c) — det är legacy-placeholder och ska
// INTE användas. Både märket och scenen matas från denna rad. När Code
// migrerar bort från CLUB_BADGES är det denna fil som gäller.

export const forsbackaPalette = {
  primary: '#7a1620',       // djup mörkröd — järnverkets glöd
  secondary: '#E8DCC8',     // creme
  outline: '#14100e',       // järnsvart kontur
  textOnPrimary: '#E8DCC8',
} as const
