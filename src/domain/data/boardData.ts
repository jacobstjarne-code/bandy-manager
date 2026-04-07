export const BOARD_PROFILES = [
  // Ordförande (8 st — olika personligheter)
  { first: 'Bengt', last: 'Karlsson', role: 'ordförande' as const, personality: 'supporter' as const },
  { first: 'Karin', last: 'Lindström', role: 'ordförande' as const, personality: 'modernist' as const },
  { first: 'Stig', last: 'Johansson', role: 'ordförande' as const, personality: 'traditionalist' as const },
  { first: 'Anita', last: 'Persson', role: 'ordförande' as const, personality: 'ekonom' as const },
  { first: 'Lars', last: 'Berglund', role: 'ordförande' as const, personality: 'supporter' as const },
  { first: 'Margareta', last: 'Ek', role: 'ordförande' as const, personality: 'traditionalist' as const },
  { first: 'Håkan', last: 'Forslund', role: 'ordförande' as const, personality: 'ekonom' as const },
  { first: 'Birgitta', last: 'Nyström', role: 'ordförande' as const, personality: 'modernist' as const },

  // Kassör (6 st)
  { first: 'Karin', last: 'Holm', role: 'kassör' as const, personality: 'ekonom' as const },
  { first: 'Ulf', last: 'Bergström', role: 'kassör' as const, personality: 'ekonom' as const },
  { first: 'Marianne', last: 'Norberg', role: 'kassör' as const, personality: 'supporter' as const },
  { first: 'Tomas', last: 'Larsson', role: 'kassör' as const, personality: 'modernist' as const },
  { first: 'Lennart', last: 'Dahlgren', role: 'kassör' as const, personality: 'ekonom' as const },
  { first: 'Agneta', last: 'Sjöberg', role: 'kassör' as const, personality: 'traditionalist' as const },

  // Ledamöter (12 st)
  { first: 'Rolf', last: 'Svensson', role: 'ledamot' as const, personality: 'traditionalist' as const },
  { first: 'Eva', last: 'Gustafsson', role: 'ledamot' as const, personality: 'supporter' as const },
  { first: 'Per', last: 'Andersson', role: 'ledamot' as const, personality: 'modernist' as const },
  { first: 'Gunilla', last: 'Nilsson', role: 'ledamot' as const, personality: 'traditionalist' as const },
  { first: 'Lars', last: 'Wikström', role: 'ledamot' as const, personality: 'supporter' as const },
  { first: 'Ingrid', last: 'Forsberg', role: 'ledamot' as const, personality: 'ekonom' as const },
  { first: 'Mikael', last: 'Sandberg', role: 'ledamot' as const, personality: 'modernist' as const },
  { first: 'Berit', last: 'Hedman', role: 'ledamot' as const, personality: 'traditionalist' as const },
  { first: 'Tommy', last: 'Engström', role: 'ledamot' as const, personality: 'supporter' as const },
  { first: 'Siv', last: 'Lundkvist', role: 'ledamot' as const, personality: 'ekonom' as const },
  { first: 'Anders', last: 'Moberg', role: 'ledamot' as const, personality: 'modernist' as const },
  { first: 'Inga-Britt', last: 'Hägg', role: 'ledamot' as const, personality: 'traditionalist' as const },
]

export type BoardPersonality = 'supporter' | 'ekonom' | 'traditionalist' | 'modernist'
export type BoardRole = 'ordförande' | 'kassör' | 'ledamot'

export const BOARD_QUOTES: Record<BoardPersonality, string[]> = {
  supporter: [
    '"Vilken match igår! Publiken var fantastisk."',
    '"Vi måste satsa! Köp den där forwarden."',
    '"Stämningen på planen var magisk i helgen."',
    '"Jag stod i snön i två timmar. Värt varje minut."',
    '"Folk pratar om oss i affären. Det händer grejer!"',
    '"Vi behöver fler sådana kvällar."',
    '"Min granne frågade om biljetter. Det har aldrig hänt förr."',
    '"Jag tog med grabben på matchen. Han är fast nu."',
    '"Vi har den bästa publiken i serien. Ingen kan säga annat."',
    '"Sälj fler bufféar! Folk vill ha korv och kaffe."',
    '"Det är inte bara resultat som räknas. Folk ska vilja komma."',
    '"Jag hörde att ungdomslaget vann också. Det gör mig glad."',
    '"Min fru sa att jag pratar mer om bandyn än om henne. Hon har rätt."',
    '"Tre generationer på läktaren i söndags. Så bygger man en klubb."',
  ],
  ekonom: [
    '"Vi blöder pengar. Vi måste prata lönekostnader."',
    '"Budgeten håller inte om vi fortsätter så här."',
    '"Jag vill se en handlingsplan för kostnaderna."',
    '"Vi kan inte köpa spelare — kassan tillåter det inte."',
    '"Sponsorintäkterna måste öka."',
    '"Jag sov inte i natt. Siffrorna oroar mig."',
    '"Kan vi frysa lönerna nästa säsong?"',
    '"Vi har råd med korv men inte kaviar. Tänk på det."',
    '"Varje krona vi spenderar på transfers är en krona vi inte har till driften."',
    '"Har vi kollat vad andra klubbar betalar i snittlön? Vi ligger högt."',
    '"Mecenater är bra, men vi kan inte bygga verksamheten på dem."',
    '"Om vi inte får in fler sponsorer snart blir det tufft."',
    '"Jag har gjort en kalkyl. Vi klarar nio omgångar till med den här lönesumman."',
    '"Vet ni vad elen kostar för planen en vinter? Jag vet. Och det är för mycket."',
  ],
  traditionalist: [
    '"Varför spelar vi med fyra backar? Det har vi aldrig gjort."',
    '"Förr utvecklade vi egna spelare."',
    '"Den här nya taktiken... jag vet inte."',
    '"Vi är en 3-3-4-klubb. Alltid varit, alltid ska vara."',
    '"I mina 30 år i styrelsen har vi aldrig..."',
    '"Ungdomarna spelade bättre bandy på min tid."',
    '"Det var bättre förr. Då kom folk för bandyns skull."',
    '"Vi ska inte försöka vara Sandviken. Vi ska vara oss själva."',
    '"Hörnspelet! Där vinner man matcher. Inte med datorer."',
    '"Fokusera på grunderna. Skridskoteknik och passningsspel."',
    '"Vi har alltid klarat oss med spelare härifrån. Varför ändra?"',
    '"Tränaren ska vara på isen, inte framför en skärm."',
    '"Min far stod på läktaren 1974. Vi spelade samma system då. Det fungerade."',
    '"Köpa spelare? Vi har aldrig köpt spelare. Vi fostrar dem."',
  ],
  modernist: [
    '"Vi behöver tänka nytt. Sociala medier, sponsorpaket."',
    '"Har ni sett vad Edsbyn gör med sin marknadsföring?"',
    '"Vi borde streama alla matcher. Det är 2025."',
    '"En ny hemsida skulle göra skillnad."',
    '"Kan vi göra en Instagram åtminstone?"',
    '"Data och analys — det är framtiden."',
    '"Vi borde ha en app. Alla lag har appar numera."',
    '"Hört talas om xG? Vi borde mäta det."',
    '"Vi borde samarbeta med skolan. Rekrytera yngre."',
    '"Jag läste att Västerås har en hel analysstab. Vi har noll."',
    '"Sponsor-lounger vid planen. Det skulle dra in pengar."',
    '"Vi måste nå nya målgrupper. Familjer, studenter."',
    '"Jag var på en konferens om digitalisering i idrotten. Vi ligger efter."',
    '"Om vi kan få lokaltidningen att göra en podcast om oss..."',
  ],
}

/** Context-aware quotes selected based on game situation */
export const BOARD_CONTEXT_QUOTES: Record<BoardPersonality, Record<string, string[]>> = {
  supporter: {
    topPosition: [
      '"Vi ligger i toppen! Jag får frossa bara jag tänker på det."',
      '"Alla i stan pratar om oss. Det här är vårt år!"',
      '"Folk köar för biljetter. Så ska det vara!"',
      '"Jag har inte sovit ordentligt på en vecka. Av glädje."',
    ],
    bottomPosition: [
      '"Det är tufft just nu. Men jag tror på laget. Vi vänder det."',
      '"Vi behöver ta två poäng. Det är dags att mobilisera."',
      '"Jag vet att det ser mörkt ut. Men vi ger aldrig upp."',
      '"Min kompis i Sandviken ringer och skrattar. Det får ta slut."',
    ],
    lastSeasonGood: [
      '"Förra säsongen var magisk. Nu gäller det att följa upp."',
      '"Folk förväntar sig samma nivå som förra året. Leverera!"',
      '"Vi visade förra året att vi hör hemma i toppen."',
    ],
    lastSeasonBad: [
      '"Förra året var en mardröm. Det får inte hända igen."',
      '"Vi tappade publik förra säsongen. Det måste vi vinna tillbaka."',
      '"Jag vill glömma förra säsongen. Men jag kan inte förrän vi visar att vi är bättre."',
    ],
  },
  ekonom: {
    goodEconomy: [
      '"Ekonomin ser stabil ut. Klokt av oss att hålla ordning på kassan."',
      '"Siffrorna är bra just nu. Men vi får inte slappna av."',
      '"Vi har byggt en buffert. Det gör mig lugn."',
    ],
    badEconomy: [
      '"Vi måste skära ner. Det finns inget alternativ."',
      '"Kassan krymper för varje vecka. Vi behöver agera nu."',
      '"Om vi inte vänder ekonomin snart riskerar vi hela verksamheten."',
      '"Jag har pratat med banken. De är inte nöjda."',
    ],
    fewSponsors: [
      '"Vi har för få sponsorer. Det borde vara prioritet ett."',
      '"Sponsorintäkterna räcker inte. Vi måste ut och sälja."',
      '"Jag hörde att Forsbacka fick in tre nya sponsorer. Vad gör vi?"',
    ],
    lastSeasonGood: [
      '"Förra årets resultat hjälpte kassan. Men vi kan inte leva på det."',
    ],
    lastSeasonBad: [
      '"Förra säsongen kostade oss. Mindre publik, mindre intäkter."',
      '"Vi gick minus förra året. Det syns i kontot."',
    ],
  },
  traditionalist: {
    nonTraditionalFormation: [
      '"Varför spelar vi med fyra backar? Det har vi aldrig gjort."',
      '"Den här nya taktiken... jag vet inte."',
      '"Tre backar. Tre halvar. Fyra forwards. Svårare är det inte."',
    ],
    traditionalFormation: [
      '"Vi kör 3-3-4 som sig bör. Det är bandyklubbens DNA."',
      '"Bra att vi håller fast vid grunderna. Det lönar sig."',
      '"Min far sa alltid: ändra aldrig en vinnande uppställning."',
    ],
    lastSeasonGood: [
      '"Se där. Det klassiska spelet fungerar fortfarande."',
      '"Förra säsongen visar att man inte behöver uppfinna hjulet."',
    ],
    lastSeasonBad: [
      '"Förra året var dåligt, men lösningen är inte att ändra allt."',
      '"Det var inte taktiken det var fel på förra säsongen. Det var inställningen."',
      '"Vi hade samma system 2018 och det fungerade. Problemet sitter inte i systemet."',
    ],
  },
  modernist: {
    hasCommunityActivities: [
      '"Bandyskolan är ett bra steg framåt. Det är precis sånt vi behöver göra mer av."',
      '"Bra att vi satsar på bredden. Det ger oss spelare om fem år."',
      '"Jag såg att sociala medier-kontot växer. Fortsätt!"',
    ],
    noCommunityActivities: [
      '"Vi gör ingenting utanför planen. Det måste ändras."',
      '"Utan breddverksamhet dör klubben långsamt. Vi behöver engagera samhället."',
      '"Varenda annan klubb har bandyskola. Vi har ingenting."',
    ],
    lastSeasonGood: [
      '"Bra resultat förra året. Nu kan vi investera i utveckling."',
      '"Framgång ger oss utrymme att tänka långsiktigt. Gör det."',
    ],
    lastSeasonBad: [
      '"Förra säsongen visar att vi måste tänka om. Nytt blod, nya idéer."',
      '"Det räcker inte att göra samma sak och hoppas på bättre resultat."',
    ],
  },
}

export const BOARD_MEETING_OPENERS = [
  '{ordförande} öppnar mötet med en kopp kaffe och en bulle.',
  '{ordförande}: "Välkomna. Vi har en del att gå igenom."',
  '{ordförande} ser allvarlig ut. Eller nöjd. Svårt att avgöra.',
  'Mötet börjar fem minuter sent. {kassör} var tvungen att parkera om.',
  '{ordförande}: "Kort möte idag, jag har lovat frun att vara hemma tidigt."',
  '{ordförande} har med sig termos och smörgåsar. Det blir ett längre möte.',
  'Det luktar nybryggat kaffe i klubbstugan. {ordförande} hälsar välkommen.',
  '{kassör} kommer in med en bunt papper under armen. "Jag har siffrorna."',
  '{ordförande} knackar i bordet med pennan. "Vi börjar."',
  'Klubbstugan är kall. Elementet är trasigt igen. {ordförande}: "Vi börjar ändå."',
  'Någon har ställt fram sju kaffekoppar. Det sitter fyra vid bordet.',
  '{kassör}: "Innan vi börjar — nån måste skotta parkeringen imorgon."',
  '{ordförande} har tagit med hembakade kanelbullar. Stämningen lättar.',
  'Det regnar på taket. Droppar i hinken i hörnet. {ordförande}: "Vi behöver prata anläggning."',
  '{kassör} sätter sig ner och suckar. "Jag har goda nyheter och dåliga nyheter."',
]
