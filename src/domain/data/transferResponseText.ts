// C-T1 — Transfer response text pools
// All strings used by the player acceptance system.

export const PERSONALITY_REFUSAL: Record<string, string[]> = {
  homebound: [
    'Han vill inte flytta från orten. Familjen är kvar här och det räcker.',
    'Spelaren tackar nej. Han har byggt ett liv här och ser ingen anledning att flytta.',
    'Han är uppvuxen häromkring. Den banden bryter man inte för ett transferbud.',
    'Nej tack. Han trivs. Det är svaret.',
    'Han har barn i skolan här. Det var skäl nog.',
  ],
  ambitious: [
    'Han tycker budet inte räcker för att motivera ett skifte just nu.',
    'Erbjudandet lockade inte. Han söker en större utmaning.',
    'Han avvaktar. Det här var inte rätt tillfälle.',
    'Spelaren vill se vad marknaden erbjuder till sommaren.',
  ],
  family: [
    'Familjen sätter stopp. Partnern jobbar här och barnen är etablerade.',
    'Han tackade nej på grund av familjesituationen. Inget mer att säga.',
    'Det är inte läge för en flytt. Familjeskäl, enkelt och tydligt.',
    'Han kom hem, pratade med familjen och ringde och tackade nej.',
  ],
  dream_club: [
    'Han väntar på rätt klubb. Det är tydligt att det inte är ni.',
    'Spelaren verkar ha ett mål med sin karriär och det leder inte hit.',
    'Tackar nej. Verkar söka något specifikt som han inte hittat ännu.',
    'Han är inte lockad. Han väntar på något annat.',
  ],
  default: [
    'Spelaren tackade nej. Ibland är det så.',
    'Han var inte intresserad av att flytta just nu.',
    'Tackar nej. Ingen vidare förklaring.',
    'Han valde att stanna.',
  ],
}

export const PERSONALITY_ACCEPTANCE: Record<string, string[]> = {
  homebound: [
    'Han tvekade länge men sa ja. Ni kan tacka lönebudet.',
    'Inte enkelt för honom att lämna, men han bestämde sig. Välkommen.',
    'Tog tid men han kom fram till att det var rätt steg nu.',
  ],
  ambitious: [
    'Snabbt svar. Han såg möjligheten och grep den.',
    'Spelaren var redo. Det här var rätt tidpunkt för honom.',
    'Han sa ja omedelbart. Motiverad och redo för nästa steg.',
    'Det var precis vad han letade efter.',
  ],
  family: [
    'Han pratade med familjen och de backade upp beslutet.',
    'Familjen är med på noterna. Välkommen till klubben.',
    'Tog ett par dagar men familjen är positiva. Han är er.',
  ],
  dream_club: [
    'Han tackade ja utan att blinka. Verkar ha velat hit länge.',
    'Snabbt svar och glad röst i telefon. Bra sign.',
    'Han accepterade direkt. Ni verkar vara vad han sökte.',
  ],
  default: [
    'Spelaren är er. Välkommen.',
    'Han accepterade budet. Klokt beslut av alla parter.',
    'Affären är klar. Han ansluter när pappren är i ordning.',
    'Ja. Det var hans svar.',
  ],
}

export const DREAM_CLUB_MAGIC: string[] = [
  'Han har drömt om det här. Det märks på rösten när han tackar ja.',
  'Det var det här han väntade på. Nu är det klart.',
  'Äntligen, sa han. Sedan lade han på.',
  'Han ringde tillbaka inom tio minuter. "Ja" var allt han sa.',
  'Spelaren har pratat om er i omklädningsrummet. Nu är det hans tur.',
]

export const RIVALRY_WARNING_PER_INTENSITY: Record<1 | 2 | 3, string[]> = {
  1: [
    'Det är lite känsligt att handla av dem. Klacken märker.',
    'Ingen dramatik, men folk kommer att ha åsikter.',
    'Svagt rivalitet. Ingen katastrof, men håll koll på stämningen.',
  ],
  2: [
    'Den här affären väcker reaktioner. Klacken tar notis.',
    'Att hämta spelare från dem är inte okomplicerat.',
    'Fansen gillar det inte. Se till att spelaren levererar direkt.',
  ],
  3: [
    'Det här är ett derby-köp. Klacken glömmer inte.',
    'Varning: det här är fiendeklubben. En spelare därifrån väcker starka känslor.',
    'Spelaren kommer buga från fel håll i fansens ögon. Det tar tid att vinna dem.',
  ],
}

export const PLAYER_REACTION_RIVAL_SALE: string[] = [
  'Han sa hej och lämnade omklädningsrummet. Ingen pratade länge efteråt.',
  'Spelaren valde att gå. Till dem. Det sitter.',
  'Affären är klar. Men det är inte glömt.',
  '"Pengarna är pengarna", sa kassören. Ingen höll med högt.',
  'Han gick. Och klacken vet vart.',
]

export const RIVAL_SALE_KAFFERUM: Array<[string, string, string, string]> = [
  ['Kioskvakten', 'Jag säljer inte korv till honom längre om han spelar för dem.', 'Vaktmästaren', 'Du säljer korv till alla." Kioskvakten: "Det är en principsak.'],
  ['Materialaren', 'Hans tröja hänger fortfarande i korridoren.', 'Kassören', 'Ta ner den." Materialaren: "Inte ännu.'],
  ['Vaktmästaren', 'Folk pratar om det. Även de som inte bryr sig om fotboll.', 'Kioskvakten', 'Bandy." Vaktmästaren: "De vet vad jag menar.'],
  ['Kassören', 'Affären gick igenom. Vi fick pengar. Jag förstår det.', 'Ordföranden', 'Men?" Kassören: "Det finns ett men.'],
  ['Ordföranden', 'Det är business.', 'Kioskvakten', 'Det är rivalerna." Ordföranden: "Business." Kioskvakten: "Ja.'],
]

export const RIVAL_SALE_KLACK: string[] = [
  'Han springer nu för fel lag.',
  'Affären är klar. Det är svårt att säga mer än det.',
  'Kassan plus, stämning minus.',
  '"Business." Det räcker inte som svar.',
  'Vi glömmer inte det här på ett tag.',
]
