export const VOLUNTEER_FIRST_NAMES = [
  'Britt-Marie', 'Göte', 'Rune', 'Ingegerd', 'Bengt-Åke',
  'Solveig', 'Leif', 'Maj-Britt', 'Stig-Arne', 'Barbro',
  'Torbjörn', 'Gunnel', 'Ove', 'Eivor', 'Ingemar',
  'Birgitta', 'Karl-Erik', 'Margit', 'Nils-Göran', 'Gerd',
  'Tord', 'Inga-Lill', 'Börje', 'Siv', 'Lennart',
  'Dagny', 'Åke', 'Elsa', 'Per-Olof', 'Hjördis',
  'Rolle', 'Berit', 'Hasse', 'Märta', 'Gunnar',
  'Lasse', 'Annika', 'Bosse', 'Carina', 'Tommy',
  'Monica', 'Sune', 'Ulla', 'Christer', 'Kerstin',
]

export const LOCAL_PAPER_NAMES = [
  'Norrlands-Posten', 'Allehanda', 'Folkbladet', 'Nya Tidningen',
  'Kuriren', 'Dagbladet', 'Länstidningen', 'Lokalbladet',
  'Hälsinge-Kuriren', 'Västmanlands Nyheter', 'Sörmlands-Posten',
  'Gefle Dagblad', 'Dala-Demokraten', 'Norra Västerbotten',
  'Arbetarbladet', 'Sundsvalls Tidning', 'Hudiksvalls Tidning',
]

/** Lokalpressen är en beständig del av klubbens persongalleri. Den får
 * varieras inom rätt område, men aldrig väljas ur en nationell pool. */
export const LOCAL_PAPER_NAMES_BY_REGION: Record<string, readonly string[]> = {
  Gästrikland: ['Gefle Dagblad', 'Arbetarbladet'],
  Hälsingland: ['Hälsinge-Kuriren', 'Hudiksvalls Tidning'],
  Uppland: ['Länstidningen', 'Lokalbladet'],
  Västmanland: ['Västmanlands Nyheter'],
  Norrbotten: ['Norrlands-Posten', 'Kuriren'],
  Västerbotten: ['Norra Västerbotten', 'Folkbladet'],
  Småland: ['Nya Tidningen', 'Lokalbladet'],
  Dalarna: ['Dala-Demokraten', 'Länstidningen'],
  Södermanland: ['Sörmlands-Posten'],
  Värmland: ['Länstidningen', 'Nya Tidningen'],
  Skåne: ['Lokalbladet', 'Dagbladet'],
}

export function getLocalPaperNames(region: string): readonly string[] {
  // En okänd region får aldrig en slumpad tidning från andra änden av landet.
  return LOCAL_PAPER_NAMES_BY_REGION[region] ?? ['Lokaltidningen']
}

// DOM_DÖDA_TEXTPOOLER_2026-09-18: KIOSK_FLAVORS, LOTTERY_FLAVORS och EVENT_FLAVORS är ARKIVERADE, inte strukna —
// texten är bra, ytan finns inte. Raderna ligger ordagrant i
// docs/archive/textpooler/ortsaktiviteternas-volontarvardag.md, med villkoret för när de plockas.
