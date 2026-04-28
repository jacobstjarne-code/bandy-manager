/**
 * SM-finalsegern — scen efter att managed klubb vunnit finalen.
 * Centrala texten ska callbacka till en akademispelare som värvades
 * upp och nu satte ett avgörande mål — om sådan finns. Annars fallback.
 *
 * All svensk text lever här. Placeholders ({season}, {finalArena},
 * {promotionSeason}, {yearsAgo}) ersätts vid render.
 */

export interface BirgerQuote {
  quote: string
  attribution: string
}

export const SM_FINAL_VICTORY_TEMPLATES = {
  // Mall — placeholders ersätts vid render baserat på matchdata
  bodyText:
    'Henriksson satte avgörande målet i 87:e. Samme Henriksson som kom upp från P19 säsongen {promotionSeason}. Som du gick ut till på söndagsträningen den där höstmorgonen <em>{yearsAgo} år sedan</em>.',

  // Fallback om ingen akademi-callback finns för spelaren
  fallbackBodyText:
    'Slutsignalen gick. Klacken sjöng. Du stod stilla en sekund och tog in att <em>det här är inte en match till — det här är säsongen som blev allt</em>.',

  // Birger-citat — slumpas från en pool baserat på säsongs-seed
  birgerQuotes: [
    {
      quote:
        'Jag sa det till Birgitta i pausen, jag sa: det här är vår final. Den minns vi när vi är gamla. Och då hade vi inte ens kvitterat än.',
      attribution: 'Birger Karlsson, klackledare',
    },
    {
      quote: 'Förr i tiden sa man att det inte gick att slå storstaden. Sen kom du.',
      attribution: 'Birger Karlsson, klackledare',
    },
    {
      quote:
        'Jag har hängt på den där läktaren i 22 år. Idag fattar jag varför jag aldrig slutade.',
      attribution: 'Birger Karlsson, klackledare',
    },
  ] as BirgerQuote[],

  meta: {
    genreLabel: 'I DETTA ÖGONBLICK',
    titleText: 'Svensk Mästare {season}',
    dateText: 'Tredje lördagen i mars · {finalArena}',
    arenaCapacity: '25 412 ÅSKÅDARE',
    cta: 'Fortsätt till ceremonin →',
  },
}
