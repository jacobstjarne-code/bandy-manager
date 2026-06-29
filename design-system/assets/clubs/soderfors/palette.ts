// Söderfors BK — låst klubbpalett.
// Källa: CLUB-BRIEF.md (stålblå + creme + svart).
//
// DETTA är den enda sanningen för Söderfors färg. CLUB_BADGES i
// ClubBadge.tsx anger marinblå + guld (#1a237e/#E8D080) — legacy-placeholder,
// används INTE. Både märket (ankare) och scenen matas från denna rad.
// Stålblå är en KALL färg → cremerand bryter den så den läser mot paletten.

export const soderforsPalette = {
  primary: '#3a5a78',       // stålblå
  secondary: '#E8DCC8',     // creme — randen som får blått att läsa
  outline: '#14100e',       // järnsvart kontur
  textOnPrimary: '#E8DCC8',
} as const
