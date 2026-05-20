/**
 * Transfer-response — spelarens egen reaktion på bud, samt rivalry- och
 * dream_club-specialcases.
 *
 * Tonregister: bandysvensk understatement. Bruksort-narrativ. Inga utropstecken,
 * inga "AJAJ"-reaktioner, ingen Hollywood. Konkret bild med specifika detaljer
 * (sex år på bruket, pojken som spelar pojkar 11, Sture som granne).
 *
 * Plockas av transferService.playerAcceptsTransfer och relaterade UI.
 */

export type PersonalityType = 'homebound' | 'ambitious' | 'family' | 'dream_club' | 'default'
export type RivalryIntensity = 1 | 2 | 3

/**
 * Vägran-strängar per personlighetstyp. Visas i TransferBidResult inbox-item
 * när spelaren tackat nej efter klubb-accept.
 */
export const PERSONALITY_REFUSAL: Record<PersonalityType, string[]> = {
  homebound: [
    'Han trivs där han är. Hemma.',
    'Birgitta vill inte flytta. Inte han heller.',
    'Han har Sture som granne sen barndomen. Det räknas.',
  ],
  ambitious: [
    'Han väntar på något större. Det är inte här.',
    'Klubben var bra. Men inte den bra.',
    'Han vill klättra, inte sidleds.',
  ],
  family: [
    'Han har jobbat sex år på bruket. Det går inte att packa ihop.',
    'Pojken börjar gymnasiet till hösten. Det blir inte nu.',
    'Han växte upp femhundra meter från klubbhuset. Hans pappa spelade här.',
    'Hans dotter har precis börjat skolan. Inte i år.',
    'Han har just byggt klart altanen. Det säger han själv.',
  ],
  dream_club: [
    'Han väntar på en annan klubb. Han säger inte vilken.',
    'Det är inte fel klubb. Det är fel klubb för honom.',
    'Han har bestämt sig sen länge. Det här var inte den.',
  ],
  default: [
    'Han kände sig inte redo.',
    'Det blev inte rätt nu.',
    'Han avböjde utan att ge skäl.',
  ],
}

/**
 * Godkänn-strängar per personlighetstyp. Visas i TransferBidResult inbox-item
 * när spelaren accepterat. Tonen varierar — homebound är reluktant, ambitious
 * är entusiastisk, default är neutralt.
 */
export const PERSONALITY_ACCEPTANCE: Record<PersonalityType, string[]> = {
  homebound: [
    'Det är inte vad han ville. Men formen har vänt nedåt och han vet det.',
    'Han skrev på i tystnad. Birgitta körde honom till stationen.',
    'Sista träningen var i tisdags. Han hängde lite kvar i omklädningsrummet.',
  ],
  ambitious: [
    'Han skrev på direkt. Sa "äntligen" till sin agent.',
    'Det här är vad han väntat på. Han åker imorgon.',
    'Han packade samma kväll. Det märks att han redan flyttat i huvudet.',
  ],
  family: [
    'Han skrev på. Det kommer kosta honom mer än lönen.',
    'Han åker. Familjen stannar tills sommaren. Det blir tunga månader.',
    'Han sa ja efter två dagars samtal. Med Birgitta, inte agenten.',
  ],
  dream_club: [
    'Inte rätt klubb, men rätt summa. Han tackade ja motvilligt.',
    'Han skrev på. Drömklubben kom inte. Den här gjorde.',
    'Det var pengarna som avgjorde. Han säger det rakt ut.',
  ],
  default: [
    'Han skrev på. Inga särskilda ord.',
    'Bud accepterat. Spelare accepterat. Klart.',
    'Han åker nästa vecka. Han packade i lugn och ro.',
  ],
}

/**
 * Dream_club specialcase — när buyer === player.dreamClubId.
 * Magisk ton. Ett ögonblick av "drömmen kommer på riktigt".
 */
export const DREAM_CLUB_MAGIC: string[] = [
  'Han väntat på det här samtalet. Det märks i tystnaden innan han svarar.',
  'Han säger "tack" tre gånger på två minuter. Det är inte tränaren han tackar.',
  'Han packade redan när nyheten kom. Han hade ridit på det.',
]

/**
 * Rivalry-warning i BidModal — visas innan spelaren skickar bud till en
 * rivaliserande klubb. Intensity styr ton-styrkan.
 *
 * Plockas via getRivalry().intensity (1-3).
 */
export const RIVALRY_WARNING_PER_INTENSITY: Record<RivalryIntensity, string[]> = {
  1: [
    'Klacken hörs på avstånd. De vet redan.',
    'Det blir prat i kafferummet. Inget värre.',
    'Vi har spelat dem flera gånger. Det här blir noterat.',
  ],
  2: [
    'Klacken kommer inte att gilla det här.',
    'Det är en rivalitet. Spelare som går dit minns det länge.',
    'Det stannar inte vid klubben. Hela bygden får veta.',
  ],
  3: [
    'Det är den klubben. Klacken kommer inte att glömma.',
    'Banderoller blir måleri i veckan. Han blir ihågkommen.',
    'Det stannar i klubben i tio år. Sture pratar fortfarande om Lindgren-affären 02.',
  ],
}

/**
 * Player-reaktioner vid rival-sälj — visas i TransferBidResult inbox-item
 * när spelare faktiskt såldes till rival. Annorlunda ton än vanliga acceptans.
 */
export const PLAYER_REACTION_RIVAL_SALE: string[] = [
  'Han bytte tröja men inte stad. Det blir avstånd ändå.',
  'Han säger att det inte spelar någon roll. Klacken vet annorlunda.',
  'Han åkte med sista bussen. Ingen vinkade från läktaren.',
]

/**
 * Kafferum-pool när rival-sälj sker — gubbarnas röst, befintliga klacken-/
 * kafferumssystemet plockar från denna pool nästa omgång.
 */
export const RIVAL_SALE_KAFFERUM: string[] = [
  '"Hörde du om Henriksson?" "Hörde det." Sen drack de kaffe.',
  'Birger sa inget. Han stod bara och rörde i koppen i tio minuter.',
  'Magnus sa "det är affärer". Ingen trodde honom.',
  'Tre gubbar gick hem tidigare än vanligt. Det är väl vad det är.',
  'Han nämndes inte vid namn. Inte en gång. Det säger något.',
]

/**
 * Klack-pool när rival-sälj sker — Birger-röst, plockas i klack-pool nästa
 * omgång(ar) tills decay räcker.
 */
export const RIVAL_SALE_KLACK: string[] = [
  'Han säljs till dem. Vi pratar inte om det. Vi minns det.',
  'Klacken målade banderoller. Vi tog inte med dem till matchen.',
  'Det är en spelare mindre att sjunga för. Vi sjunger ändå.',
  'Han kommer att möta oss två gånger om året. Vi vet vart vi sitter.',
  'Hans tröja hänger inte längre i klubbhuset. Det räcker.',
]
