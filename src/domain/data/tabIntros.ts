/** Tab intro-texter — ALL text = // OPUS_COPY. Opus skriver tabellen. */

export interface TabIntroEntry {
  icon: string
  text: string
}

// Klub-flikar (ClubScreen)
export const CLUB_TAB_INTROS: Record<string, TabIntroEntry> = {
  orten:     { icon: '🏘️', text: '// OPUS_COPY' },
  ekonomi:   { icon: '💰', text: '// OPUS_COPY' },
  faciliteter: { icon: '🏗️', text: '// OPUS_COPY' },
  historia:  { icon: '📖', text: '// OPUS_COPY' },
}

// Trupp-flikar (SquadScreen)
export const SQUAD_TAB_INTROS: Record<string, TabIntroEntry> = {
  trupp:     { icon: '👥', text: '// OPUS_COPY' },
  arc:       { icon: '📈', text: '// OPUS_COPY' },
  tranare:   { icon: '👔', text: '// OPUS_COPY' },
  kontrakt:  { icon: '📋', text: '// OPUS_COPY' },
  varvning:  { icon: '🎯', text: '// OPUS_COPY' },
}

// Värvning-flikar (TransfersScreen)
export const TRANSFER_TAB_INTROS: Record<string, TabIntroEntry> = {
  marknad:   { icon: '🛒', text: '// OPUS_COPY' },
  scouting:  { icon: '🔍', text: '// OPUS_COPY' },
  freeagents: { icon: '🆓', text: '// OPUS_COPY' },
  sell:      { icon: '📤', text: '// OPUS_COPY' },
}
