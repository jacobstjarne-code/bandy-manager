// ═══════════════════════════════════════════════════════════════════════════
// TAB-INTROS — en rad per flik, funktionellt-först
// ───────────────────────────────────────────────────────────────────────────
// Enda sanningskälla för flikarnas intro-/hjälptext (Korrvända 2 · C3/B3/C2).
// Redaktionell linje (bekräftad 2026-06-23): säg först VAD DU GÖR här. Lägg en
// systemisk svans bara där kopplingen till resten av spelet är icke-uppenbar
// (intensitet→skada, röda siffror→styrelse, puls→hemmaplansfördel). Ingen svans
// där fliken förklarar sig själv (Minne, Akademi, Trupp).
//
// Konsumeras av TabIntro-komponenten (shared/TabIntro.tsx): { icon, label, text }.
// Komponenten renderar icon + text; label finns för wiring/överblick. Ersätter
// `tabDescriptions` + ad-hoc FirstVisitHint-texterna i ClubScreen/SquadScreen/
// TransfersScreen. Nycklarna matchar varje skärms activeTab-id exakt.
// ═══════════════════════════════════════════════════════════════════════════

export interface TabIntroEntry {
  icon: string
  label: string
  text: string
}

export const TAB_INTROS = {
  // ── Klubb (ClubScreen) ───────────────────────────────────────────────────
  training: {
    icon: '🏃',
    label: 'Träning',
    text: 'Sätt träningsfokus och intensitet inför nästa omgång. Hårt sliter — trötta ben skadar sig lättare.',
  },
  ekonomi: {
    icon: '💰',
    label: 'Ekonomi',
    text: 'Kassa, budget och intäkter. Röda siffror tär på styrelsens tålamod och skrämmer sponsorer.',
  },
  orten: {
    icon: '🏘️',
    label: 'Orten',
    text: 'Bygdens stöd — frivilliga, mecenater, kommun och föreningsaktiviteter. Hög puls ger hemmaplansfördel och lockar sponsorer.',
  },
  akademi: {
    icon: '🎓',
    label: 'Akademi',
    text: 'Ungdomslaget och talangutvecklingen. Lyft spelare till A-laget när de är redo.',
  },
  minne: {
    icon: '📖',
    label: 'Minne',
    text: 'Klubbens historia — legender, ögonblick och årsdagar.',
  },
  tranare: {
    icon: '📋',
    label: 'Tränare',
    text: 'Din tränarprofil — karriär, belastning och rivaliteter. Hög belastning för länge sliter ut dig.',
  },

  // ── Trupp (SquadScreen) ──────────────────────────────────────────────────
  nu: {
    icon: '🔔',
    label: 'Nu',
    text: 'Det som kräver dig nu — skador, avstängningar, låg moral och kontrakt på väg ut.',
  },
  trupp: {
    icon: '👥',
    label: 'Trupp',
    text: 'Hela truppen. Sortera, filtrera och välj laguppställning inför match.',
  },
  taktik: {
    icon: '♟️',
    label: 'Taktik',
    text: 'Formation och spelplan. Ställ in laget mot nästa motståndare.',
  },
  // Nyckel 'värvning' = SquadScreens Kontrakt-flik (ej Transfers-skärmen nedan)
  värvning: {
    icon: '✍️',
    label: 'Kontrakt',
    text: 'Spelarnas kontrakt. Förläng i tid — annars lämnar de som fria agenter.',
  },

  // ── Värvning (TransfersScreen) ───────────────────────────────────────────
  marknad: {
    icon: '🏷️',
    label: 'Marknad',
    text: 'Spelare som andra klubbar säljer just nu. Lägg bud — svar kommer nästa omgång.',
  },
  scouting: {
    icon: '🔭',
    label: 'Scouting',
    text: 'Skicka ut en scout för att hitta spelare du annars inte ser. Rapporten tar några omgångar.',
  },
  freeagents: {
    icon: '📄',
    label: 'Fria',
    text: 'Spelare utan kontrakt. Fria att värva — ingen övergångssumma, bara lön.',
  },
  sell: {
    icon: '💸',
    label: 'Sälj',
    text: 'Din trupp. Lägg ut en spelare till salu när du vill frigöra lön eller pengar.',
  },
} satisfies Record<string, TabIntroEntry>

export type TabIntroKey = keyof typeof TAB_INTROS
