/**
 * Cup-finalsegern — scen efter att managed klubb vunnit cupfinalen.
 * Tonregister: bygde-bandy-Sverige, vardaglig stolthet, konkreta detaljer.
 * Cupen är pokalen. Inte SM. Och just det är vitsen.
 *
 * All svensk text lever här. Placeholders ({season}, {cupFinalDate},
 * {finalArena}, {arenaCapacity}, {playerName}, {minute}, {promotionSeason},
 * {yearsAgo}) ersätts vid render i useCupFinalData.
 */

import type { BirgerQuote } from './smFinalVictoryScene'

export const CUP_FINAL_VICTORY_TEMPLATES = {
  // Mall — placeholders ersätts vid render baserat på matchdata.
  // Triggas om avgörande mål sattes av en akademispelare som kom upp.
  bodyText:
    '{playerName} satte avgörande målet i {minute}:e. Samme {playerName} som kom upp från P19 säsongen {promotionSeason}. Pokalen i händerna <em>{yearsAgo} år senare</em>.',

  // Fallback om ingen akademi-callback finns för avgörande målet.
  fallbackBodyText:
    'Slutsignalen gick. Pokalen lyftes på isen. Klacken sjöng den där ramsan ni hört tvåtusen gånger — fast i dag tio minuter efter slutsignal. <em>I dag stannade ni och lyssnade.</em>',

  // Birger-citat — slumpas från en pool baserat på säsongs-seed.
  // Annat register än SM-citaten: konkretare, vardagligare, mer hemma.
  birgerQuotes: [
    {
      quote:
        'Jag har sett kanske trettio cup-finaler i tv. Aldrig vår klubb i någon av dem. I dag är det vi.',
      attribution: 'Birger Karlsson, klackledare',
    },
    {
      quote:
        'Pokalen är liten. Men den passar i klubbhuset, och det är där den ska stå.',
      attribution: 'Birger Karlsson, klackledare',
    },
    {
      quote:
        'Jag sa till Birgitta att vi vunnit. Hon frågade om det var SM. Jag sa nej. Hon frågade om jag var glad ändå. Det var jag.',
      attribution: 'Birger Karlsson, klackledare',
    },
  ] as BirgerQuote[],

  meta: {
    genreLabel: 'POKALEN',
    titleText: 'Cupmästare {year}',
    dateText: '{cupFinalDate} · {finalArena}',
    arenaCapacity: '{arenaCapacity} ÅSKÅDARE',
    cta: 'Pokalen står i klubbhuset →',
  },
}
