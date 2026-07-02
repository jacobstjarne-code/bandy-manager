// Röstrader för assistentens val under snabbspolning (corner/counter/frislag).
// Opus levererar — se CLAUDE.md "SVENSK TEXT — CODE SKRIVER ALDRIG".
// Nästlad struktur: rad väljs på FAKTISKT val (zon/choice), ingen råenum-interpolation.
// Code väljer array via seededPick(ASSISTANT_FF_LINES[typ][val], seed). Tom array
// får aldrig förekomma — varje val har rader.
//
// Rösten: assistenten RAPPORTERAR ett fattat beslut, kort, torrt, bandysvenskt.
// Ingen hurra, ingen förklaring av oddsen — han tog det, du ser utfallet härnäst.

export const ASSISTANT_FF_LINES = {
  corner: {
    near: [
      'Assistenten vinkade in den kort. Nära stolpen.',
      'Kort hörna vid närmaste. Assistentens beslut.',
      'Han tog den nära — trängde ihop det vid första stolpen.',
    ],
    center: [
      'Assistenten lyfte in den framför mål.',
      'Rakt mot mittzonen. Assistenten valde luften.',
      'Han slog den mot straffpunkten. Full pott framför kassen.',
    ],
    far: [
      'Assistenten sökte bortre stolpen.',
      'Lång båge mot bortre. Assistentens val.',
      'Han la den på bakre — sökte den fria mannen där ute.',
    ],
  },
  counter: {
    sprint: [
      'Assistenten vinkade fram löparen. Bara att springa.',
      'Full fart framåt — assistenten släppte loss honom.',
      'Han sa åt dem att dra. Rakt på mål.',
    ],
    build: [
      'Assistenten höll igen. Byggde upp den lugnt.',
      'Ingen brådska — assistenten ville ha ordning först.',
      'Han bromsade kontringen. Sökte rätt läge i stället.',
    ],
    earlyBall: [
      'Assistenten slog den tidigt. Innan de hann back.',
      'Tidig boll framåt — assistenten läste luckan.',
      'Han spelade den direkt. Bakom deras försvar.',
    ],
  },
  freekick: {
    shoot: [
      'Assistenten vinkade fram skytten. Direkt mot mål.',
      'Skott. Assistenten litade på foten.',
      'Han tog det själv, rakt på — inget krångel.',
    ],
    chipPass: [
      'Assistenten lyfte den över muren.',
      'Boll bakom muren — assistenten sökte huvudet där inne.',
      'Han chippade den. Sökte någon på bortre.',
    ],
    layOff: [
      'Assistenten la av den kort. Byggde vidare.',
      'Kort variant — assistenten ville ha ett bättre läge.',
      'Han rullade den i sidled. Ny vinkel mot mål.',
    ],
  },
} as const

export type AssistantFFInteraction = keyof typeof ASSISTANT_FF_LINES
