/**
 * Styrelsemöte-citat — kurerat bibliotek.
 * Skrivna manuellt för svensk bandy-Sverige-ton (parkeringar, understatement,
 * konkret vardag). Får EJ "förbättras", omformuleras eller utökas av Code.
 * Nya tillägg kommer från separat kurerings-session.
 */

export type BoardCharacterId = 'lennart' | 'mikael' | 'rune' | 'tommy'

export interface BoardCharacter {
  id: BoardCharacterId
  name: string
  role: string
  archetype: string
}

export const BOARD_CHARACTERS: Record<BoardCharacterId, BoardCharacter> = {
  lennart: { id: 'lennart', name: 'Lennart Dahlgren', role: 'kassör', archetype: 'ekonom' },
  mikael:  { id: 'mikael',  name: 'Mikael Sandberg', role: 'ledamot', archetype: 'modernist' },
  rune:    { id: 'rune',    name: 'Rune Eriksson',   role: 'ledamot', archetype: 'traditionalist' },
  tommy:   { id: 'tommy',   name: 'Tommy Lindqvist', role: 'supporter-rep', archetype: 'klack' },
}

export type BoardSituation = 'tight' | 'purchase' | 'good' | 'investment' | 'general'

export interface BoardQuote {
  character: BoardCharacterId
  situation: BoardSituation
  quote: string
}

/**
 * Öppningsrader. Tillståndsneutrala. Slumpas fritt vid mötesöppning.
 * Format: berättande tredje person om vad som hände strax innan mötet.
 */
export const MEETING_OPENERS: string[] = [
  "Mötet startade fem minuter sent. Sandberg behövde parkera om.",
  "Mötet öppnat klockan 18:34. Kerstin kom sent.",
  "Mötet öppnat. Värmen gick på klockan fem.",
  "Mötet startade efter att Lennart hittat en extra stol i städskrubben.",
  "Mötet öppnat. Kaffet var slut.",
  "Tommy ringde och sa att han kom sent men inte hur sent.",
  "Mötet startade i köket. Ungdomssektionen hade bokat stora salen.",
  "Mötet började tio över. Älg på Bergsvägen.",
  "Mötet öppnat. Runes bil ville inte starta.",
  "Mötet öppnat. Någon hade lämnat hockeyklubbor i omklädningsrummet igen.",
  "Mötet öppnat. Bommen vid parkeringen krånglade.",
]

/**
 * Karaktärscitat per situation. Två slumpas in vid mötet,
 * matchade mot aktuell spel-situation.
 */
export const BOARD_QUOTES: BoardQuote[] = [
  // === LENNART — kassör ===

  // tight (dålig ekonomi)
  { character: 'lennart', situation: 'tight', quote: "Jag fick betala bollarna ur kaffekassan förra veckan." },
  { character: 'lennart', situation: 'tight', quote: "Elbolaget ringde och sa hej på det där sättet man säger hej när man vill bli betald." },
  { character: 'lennart', situation: 'tight', quote: "Jag tog med eget kaffe idag — tolka det som ni vill." },

  // purchase (spelarköp övervägs)
  { character: 'lennart', situation: 'purchase', quote: "Jag kan sträcka mig till den där siffran men inte högre — då lägger vi in sillen själva i sommar." },
  { character: 'lennart', situation: 'purchase', quote: "Persson behöver fundera en vecka, så tre alltså." },
  { character: 'lennart', situation: 'purchase', quote: "Budgeten har en rad som heter 'oförutsett' och den är redan använd." },

  // good (bra läge, pengar kommer in)
  { character: 'lennart', situation: 'good', quote: "Nu vill till och med svärmor ha gratisbiljetter och jag har svårt att hålla mot." },
  { character: 'lennart', situation: 'good', quote: "Persson betalade i förskott för första gången sen jag var ny." },
  { character: 'lennart', situation: 'good', quote: "Jag räknade en gång och slutade där." },

  // investment (ny investering diskuteras)
  { character: 'lennart', situation: 'investment', quote: "Det kostar att göra det och det kostar att låta bli." },
  { character: 'lennart', situation: 'investment', quote: "Om vi gör det här nu blir det ingen julmiddag för styrelsen i år." },
  { character: 'lennart', situation: 'investment', quote: "Min fru frågade varför jag ligger vaken, och när jag sa anläggningsfrågan sa hon inget." },

  // === MIKAEL — modernist ===

  { character: 'mikael', situation: 'tight', quote: "Ranhult på kommunen sa att breddsatsning är villkoret. Han sa det två gånger." },
  { character: 'mikael', situation: 'tight', quote: "Om vi drar ner på akademin blir vi det vi inte vill vara." },
  { character: 'mikael', situation: 'purchase', quote: "Han är bra. Men han har nollat vår klubb fem gånger på Instagram." },
  { character: 'mikael', situation: 'purchase', quote: "Hellre två halvbra som stannar än en stjärna vi förlorar på sommaren." },
  { character: 'mikael', situation: 'good', quote: "Min dotter frågade varför vår hemsida ser ut som en Word-fil." },
  { character: 'mikael', situation: 'good', quote: "Jag tog med en sån där Aeropress från jobbet." },
  { character: 'mikael', situation: 'general', quote: "Jag messade Ranhult på kommunen igår kväll. Han svarade klockan halv tolv." },
  { character: 'mikael', situation: 'general', quote: "Jag var på en konferens förra veckan och alla pratade om 'community'." },
  { character: 'mikael', situation: 'general', quote: "Vi har ingen LinkedIn-sida. Jag kollade." },
  { character: 'mikael', situation: 'investment', quote: "Jag vill bygga. Men inte om det betyder att vi tar från ungdomssidan igen." },

  // === RUNE — traditionalist ===

  { character: 'rune', situation: 'tight', quote: "På 80-talet hade vi inte sponsorer. Vi hade bingolotto och det räckte." },
  { character: 'rune', situation: 'tight', quote: "Bengtsson hade aldrig släppt igenom det där budgetförslaget. Han läste innan han skrev på." },
  { character: 'rune', situation: 'purchase', quote: "Man pratar om 'spelarvård' nu. Förr hette det att någon åkte hem med Bengtsson i lastbilen." },
  { character: 'rune', situation: 'good', quote: "Det går bra nu. Det brukar göra det innan det går dåligt." },
  { character: 'rune', situation: 'good', quote: "Jag minns 1994. Då trodde vi också att vi var nåt." },
  { character: 'rune', situation: 'investment', quote: "Vi byggde om klubbhuset 1987. Det räckte då, borde räcka nu." },
  { character: 'rune', situation: 'investment', quote: "Det låter som pengar jag inte sett förrän jag sett dem." },
  { character: 'rune', situation: 'investment', quote: "Jag har inget emot nya idéer. Jag har sett dom förut." },
  { character: 'rune', situation: 'general', quote: "Jag spelade för klubben när hemmamatch betydde att man gick till hallen." },

  // === TOMMY — supporter-rep ===

  { character: 'tommy', situation: 'general', quote: "Någon har börjat skrika 'send it' när vi får hörna." },
  { character: 'tommy', situation: 'general', quote: "Klacken vill att vi byter slutsång." },
]
