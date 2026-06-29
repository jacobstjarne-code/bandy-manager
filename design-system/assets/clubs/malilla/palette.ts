// Målilla BK — låst klubbpalett.
// Källa: CLUB-BRIEF.md (varm gul + grön). Grön = fält, gul = symbol/accent.
//
// DETTA är den enda sanningen för Målillas färg. CLUB_BADGES i
// ClubBadge.tsx anger lila (#4A0080) — legacy-placeholder, används INTE.
// Både märket (termometer) och scenen matas från denna rad.

export const malillaPalette = {
  primary: '#1f5c34',       // djup grön — fält
  secondary: '#E8B23A',     // varm gul — termometern, accenten
  outline: '#14100e',       // järnsvart kontur
  cream: '#E8DCC8',         // creme — ramdetalj
  textOnPrimary: '#E8DCC8',
} as const
