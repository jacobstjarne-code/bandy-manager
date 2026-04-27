// specialDateStrings.ts — ren datafil
// Inga imports, inga logikfunktioner (utom inbox-generatorer som är datageneratorer).
// All logik (substitute, pickVariant, briefing-helpers, pickSpecialDateCommentary)
// lever i specialDateService.ts.

// ── Arena-konstanter ──────────────────────────────────────────────────────────

export const SM_FINAL_VENUE = {
  arenaName: 'Studenternas IP',
  shortName: 'Studan',
  city: 'Uppsala',
}

export const CUP_FINAL_VENUE = {
  arenaName: 'Sävstaås IP',
  city: 'Bollnäs',
}

// ── Lore-data ─────────────────────────────────────────────────────────────────

export const STUDAN_FACTS = {
  inaugurated: '21 mars 1909',
  totalFinals: 23,
  rank: 'näst flest efter Stockholms Stadion (47)',
  attendanceRecord: 25_560,
  attendanceRecordYear: 2010,
  attendanceRecordMatch: 'Hammarby IF 3–1 Bollnäs GIF',
  attendanceRecordContext: 'Den enda SM-final som spelats i 3×30 minuter — pga ymnigt snöfall',
  location: 'Vid Fyrisån, intill Stadsträdgården i centrala Uppsala',
  reconstruction: 'Ombyggd 2017–2020 av White Arkitekter',
  finalsPeriod1: '1991–2012',
  finalsPeriod2: '2018–2023',
  iconicMatches: [
    {
      year: 2010,
      teams: 'Hammarby–Bollnäs',
      score: '3–1',
      story: '3×30 minuter pga snöfall. "Grisbandy" första två perioderna, "riktig bandy" sista. Hammarbys första SM-guld på 105 år.',
    },
    {
      year: 2011,
      teams: 'SAIK–Bollnäs',
      score: '6–5 (sudden death)',
      story: 'SAIK-ikonen Daniel "Zeke" Eriksson sköt avgörande mål via frislag i sin allra sista match.',
    },
    {
      year: 1999,
      teams: 'Västerås–Falu BS',
      score: '3–2',
      story: 'Falu BS hela vägen till final — första laget med ryska spelare (Sergej Obuchov + Valerij Gratjev).',
    },
  ],
}

export const SAVSTAAS_FACTS = {
  inaugurated: '1973–1974 (säsongen)',
  artificialIce: 1984,
  homePeriod: 'Bollnäs hemmaplan 1974–2022',
  attendanceRecord: 8_151,
  attendanceRecordDate: '26 december 2000',
  attendanceRecordMatch: 'Bollnäs–Edsbyn (annandagen)',
  attendanceRecordContext: 'Publikrekordet är från en annandagsmatch — det är inget tomt sammanträffande',
  atmosphere: {
    supporters: 'Flames — en gång rankad som Sveriges fjärde bästa supporterklubb (alla sporter, Aftonbladet)',
    inmarchSong: 'Dans på Sävstaås',
    fireworks: 'Nisses fyrverkerier innan match',
    flagSize: 'Jumboflaggor 4×4 meter',
    standsSouth: 'Träläktare med murkna brädor, blåaktigt rostigt räcke',
    standsEast: 'Hela långsidan, 25–30 trappsteg hög, inget tak',
    standsMain: 'Tak, störst, nyast — där Flames står',
    iceHall: 'Ishallen bredvid där folk värmer fingrar i halvtid + köper korv',
    smell: 'Kväljande cigarettrök, korv, glögg',
  },
  ghost: 'Sirius vann ingen bortamatch på Sävstaås 1983–2018. 23 raka förluster på 35 år.',
  bollnasFinals: [1943, 1951, 1956, 2010, 2011, 2017],
  bollnasGold: [1951, 1956],
}

// ── SpecialDateContext ────────────────────────────────────────────────────────

export interface SpecialDateContext {
  isHomePlayer: boolean
  homeClubName: string
  awayClubName: string
  arenaName: string
  venueCity: string
  isDerby?: boolean
  rivalryName?: string
  tipoffHour?: string   // e.g. "13:00"
  isUnderdog?: boolean
  hasJourneyToFinal?: boolean
  isPlayerInFinal?: boolean          // ny — är spelarens lag i finalen?
  weather?: {
    tempC: number
    condition: string
    matchFormat?: '2x45' | '3x30' | 'cancelled'
  }
}

// ── ANNANDAGSBANDY ────────────────────────────────────────────────────────────

export const ANNANDAGSBANDY_COMMENTARY: string[] = [
  'Annandag jul. Klubbhuset doftar fortfarande av igårkvällens skinka.',
  'Det är 26 december. Halva publiken har julgrans-barr på jackorna.',
  'Familjeråd före match: morfar tog tåget hit i morse, brorsan hade fått ledigt från jobbet i Stockholm. Hela släkten är på plats.',
  'Annandagsbandy. Termosen är fylld med kaffe från frukosten, smörgåsen ligger kvar i fickan från 11-fikat.',
  'Det luktar tända marschaller och pepparkaka. Klacken har dragit igång den första sången redan i kön till entrén.',
]

export const ANNANDAGSBANDY_COMMENTARY_LORE: string[] = [
  'På Sävstaås 2000 satte Bollnäs publikrekord på annandagen. 8 151 åskådare. Det rekordet ligger som ett spöke över varje annandagsmatch som spelas i bandysverige.',
  'Annandagsbandy är inte vilket schemaläggning som helst. Det är dagen då folk som inte ens följer bandyn under året plötsligt sitter på läktaren.',
]

export const ANNANDAGSBANDY_BRIEFING: string[] = [
  '🎄 Annandagen. {arenaName} ska gå varm i dag.',
  '🎄 26 december. Derbyt mot {opponentName} klockan 13:15. Plogen har gått sedan klockan sex i morse.',
  '🎄 Annandagsbandy mot {opponentName}. Hela bygden samlas, även de som inte brukar gå på match.',
  '🎄 Det är annandag jul. {arenaName} fylls av folk som behöver komma ut ur sina hem.',
  '🎄 Annandagen — {rivalryName}. Året ska ha en till topp innan det är över.',
]

export function annandagsbandyInbox(ctx: SpecialDateContext): { subject: string; body: string } {
  const opponent = ctx.isHomePlayer ? ctx.awayClubName : ctx.homeClubName
  const venue = ctx.isHomePlayer
    ? `hemma på ${ctx.arenaName}`
    : `borta i ${ctx.venueCity}`
  return {
    subject: `Annandagsbandy mot ${opponent}`,
    body: `Den traditionella annandagsmatchen spelas ${venue} klockan 13:15. ${ctx.rivalryName ?? 'Derbyt'} drar i år förmodligen mer folk än vanlig omgångsmatch — räkna med kaffekö i pausen och tidig parkering. Plogen är beställd från klockan sex.`,
  }
}

// ── NYÅRSBANDY ────────────────────────────────────────────────────────────────

export const NYARSBANDY_COMMENTARY: string[] = [
  '31 december. Klockan rinner på, men just nu står den stilla över {arenaName}.',
  'Nyårsafton. Halva publiken har bokat bord till middagen klockan sex. Andra halvan har ingen middag bokad alls.',
  'Det är sista dagen på året. Någon i klacken har redan tänt en tomtebloss.',
  'Nyårsbandy. Lite uppgivet, lite festligt — som året självt vid det här laget.',
  'Sista matchen för året. Domarens visselpipa låter likadant som den ska låta vid midnatt om åtta timmar.',
]

export const NYARSBANDY_BRIEFING: string[] = [
  '🎆 Nyårsafton. Match klockan {tipoffHour}, midnatt klockan tolv. Båda går fort.',
  '🎆 Det är 31 december och det spelas bandy på {arenaName}. Det är inte normalt, men i år är det så.',
  '🎆 Nyårsbandy mot {opponentName}. Folk kommer i jackor och tänker på middagen sen.',
  '🎆 Sista matchen för året. Tabellen ska se ut på ett visst sätt när det nya året börjar.',
  '🎆 Nyårsafton-bandy. Säsongens bisarraste schemaläggning.',
]

// ── SM-FINALDAG ───────────────────────────────────────────────────────────────

export const FINALDAG_COMMENTARY_PLAYING: string[] = [
  'SM-final. Det är vad allt gått ut på. Hela säsongen samlas i de här 90 minuterna.',
  'Tredje lördagen i mars. {arenaName} är finalplats och {homeClubName} är där. Det är inte en vanlig match. Det är inte ens en derby. Det är finalen.',
  'Det är finaldag. Något i benen vet det redan innan domaren blåser igång.',
]

export const FINALDAG_COMMENTARY_SPECTATOR: string[] = [
  'SM-finalen avgörs i dag på Studenternas — {homeClubName} mot {awayClubName}. Inte vår final, men ändå finalen.',
  'På Studan spelas det final i dag. Vi tittar på från andra sidan, som de flesta år.',
]

export const FINALDAG_COMMENTARY_LORE: string[] = [
  'Studenternas IP. Invigd 21 mars 1909. 23 SM-finaler har avgjorts på den här isen. Den 24:e startar nu.',
  'Vi står på samma is där Daniel "Zeke" Eriksson sköt SAIK till guld 2011 — i sin allra sista match. Frislag, sudden death, drömavslut. Alla finaler har sin historia.',
  'På den här planen vann Hammarby sitt första SM-guld på 105 år. Det var 2010. Snön vräkte ner. Matchen spelades i 3×30 minuter — den enda SM-finalen någonsin i det formatet. Idag är det åtminstone klart väder.',
  'Stadsträdgården åt höger, Fyrisån åt vänster. Studan. Det är på de här fem hektaren bandysveriges hela historia ryms.',
]

// 3×30-trigger — BARA för SM-final med weather.matchFormat === '3x30'
export const FINALDAG_COMMENTARY_3X30: string[] = [
  'Andra gången någonsin. Hammarby–Bollnäs 2010 var den första SM-finalen i 3×30 minuter — snöfallet då tvingade fram det. Idag är vi där igen. Studan, snöfall, regelbokens andra utväg.',
  '3×30 minuter i en SM-final. Det har bara hänt en gång förut. På den här planen, för 16 år sedan. Bollen rullade knappt i snön. "Grisbandy", sa kommentatorerna. Vi får se vad det blir i dag.',
]

export const FINALDAG_BRIEFING_PLAYING: string[] = [
  '🏆 SM-FINAL. {opponentName}, {arenaName}, klockan 13:15. Hela säsongen är det här.',
  '🏆 Finaldagen. Det finns inte mycket att säga. Spelarna vet vad det är.',
  '🏆 Idag är det final. Bygden har bussat hit. Halva orten är på plats.',
]

// Spectator: only one variant (drop the {N} variant per Jacob's directive)
export const FINALDAG_BRIEFING_SPECTATOR: string[] = [
  '🏆 SM-finalen i dag: {homeClubName} mot {awayClubName}. Vi är inte där. Inte i år.',
]

export function finaldagInboxPlaying(ctx: SpecialDateContext): { subject: string; body: string } {
  const opponent = ctx.isHomePlayer ? ctx.awayClubName : ctx.homeClubName
  const role = ctx.isUnderdog ? 'Underläge på pappret. Allt att vinna.' : 'Favorit på pappret. Inget att förlora?'
  return {
    subject: `SM-final mot ${opponent}`,
    body: `Tredje lördagen i mars. ${ctx.arenaName} är spelplats för bandyårets sista match. ${role} Det är finalen — det går inte att förbereda mer än man redan gjort.`,
  }
}

export function finaldagInboxSpectator(ctx: SpecialDateContext): { subject: string; body: string } {
  return {
    subject: 'SM-finalen avgörs i dag',
    body: `${ctx.homeClubName} mot ${ctx.awayClubName} på ${ctx.arenaName}. Inte vår final i år. Säsongen är över för oss — finalen påminner om det.`,
  }
}

// ── CUP-FINALHELGEN ───────────────────────────────────────────────────────────

export const CUPFINAL_COMMENTARY_PLAYING: string[] = [
  'Cup-final. Säsongens första titel ligger på det här. Det doftar fortfarande sensommar i luften.',
  'Det är oktober och {arenaName} står som finalarena. {homeClubName} är här — det är inte alla år man kan säga det.',
  'Cup-finalen. Tre matcher har lett hit. Den fjärde avgör allt.',
]

export const CUPFINAL_COMMENTARY_SPECTATOR: string[] = [
  'På Sävstaås IP spelas cup-final i dag mellan {homeClubName} och {awayClubName}. Inte vår final, men matchen ger ändå läget i bandysverige.',
  'Cup-finalhelgen rullar på i Bollnäs. Bandyåret är i gång på riktigt nu.',
]

export const CUPFINAL_COMMENTARY_LORE: string[] = [
  'Sävstaås IP. Invigd 1973, konstfryst 1984, Bollnäs hemmaplan i 48 år. Träläktarna doftar fortfarande av tre generationer cigarettrök och korv.',
  'På den här planen satte Bollnäs publikrekord på annandagen 2000. 8 151 åskådare. Den siffran ligger som ett spöke över varje match som spelas här.',
  'Sävstaås. Flames står på huvudläktaren med jumboflaggor på fyra meter. Innan inmarsch spelas Dans på Sävstaås. Nisses fyrverkerier smäller. Det är så det går till.',
  'Sirius vann inte en bortamatch på den här planen i 35 år. 1983 till 2018. 23 raka förluster. "Sävstaås-spöket" är inget skämt — det är en bandyssanning.',
  'Innan ishallen byggdes bredvid kunde du gå in mellan halvlekarna och värma fingrarna med en korv och en glögg. Den traditionen försvann inte — bara att hallen är större nu.',
]

export const CUPFINAL_BRIEFING_PLAYING: string[] = [
  '🏆 Cup-final i dag. {opponentName}, {arenaName}, klockan 14. Säsongens första riktiga match.',
  '🏆 Vi spelar cup-final. Det här är en sån match som folk minns även om de glömmer placeringen i serien.',
  '🏆 Cup-finalen. {journeyLine}',
]

export const CUPFINAL_BRIEFING_SPECTATOR: string[] = [
  '🏆 Cup-finalhelgen pågår. {homeClubName} mot {awayClubName}. Vi följer från sidan i år.',
  '🏆 Det är cup-final i {venueCity}. Bandyåret tar fart utan oss i finalen.',
]

export function cupFinalInboxPlaying(ctx: SpecialDateContext): { subject: string; body: string } {
  const opponent = ctx.isHomePlayer ? ctx.awayClubName : ctx.homeClubName
  const path = ctx.hasJourneyToFinal
    ? 'Tre cup-matcher, tre vinster. Nu finalen.'
    : 'Vi är i cup-finalen.'
  return {
    subject: `Cup-final mot ${opponent}`,
    body: `Cup-finalen spelas på ${ctx.arenaName} klockan 14. ${path} Det är säsongens första titel som står på spel — innan ligan ens börjat.`,
  }
}

// Cup-final spectator inbox: SKIPPED per design — inte relevant att maila
// spelaren om en final som inte berör deras klubb.
