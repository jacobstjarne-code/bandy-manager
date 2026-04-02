export const BOARD_PROFILES = [
  { first: 'Bengt', last: 'Karlsson', role: 'ordförande' as const, personality: 'supporter' as const },
  { first: 'Karin', last: 'Lindström', role: 'ordförande' as const, personality: 'modernist' as const },
  { first: 'Stig', last: 'Johansson', role: 'ordförande' as const, personality: 'traditionalist' as const },
  { first: 'Anita', last: 'Persson', role: 'ordförande' as const, personality: 'ekonom' as const },
  { first: 'Lars', last: 'Berglund', role: 'ordförande' as const, personality: 'supporter' as const },
  { first: 'Karin', last: 'Holm', role: 'kassör' as const, personality: 'ekonom' as const },
  { first: 'Ulf', last: 'Bergström', role: 'kassör' as const, personality: 'ekonom' as const },
  { first: 'Marianne', last: 'Norberg', role: 'kassör' as const, personality: 'supporter' as const },
  { first: 'Tomas', last: 'Larsson', role: 'kassör' as const, personality: 'modernist' as const },
  { first: 'Rolf', last: 'Svensson', role: 'ledamot' as const, personality: 'traditionalist' as const },
  { first: 'Eva', last: 'Gustafsson', role: 'ledamot' as const, personality: 'supporter' as const },
  { first: 'Per', last: 'Andersson', role: 'ledamot' as const, personality: 'modernist' as const },
  { first: 'Gunilla', last: 'Nilsson', role: 'ledamot' as const, personality: 'traditionalist' as const },
  { first: 'Lars', last: 'Wikström', role: 'ledamot' as const, personality: 'supporter' as const },
  { first: 'Ingrid', last: 'Forsberg', role: 'ledamot' as const, personality: 'ekonom' as const },
  { first: 'Mikael', last: 'Sandberg', role: 'ledamot' as const, personality: 'modernist' as const },
  { first: 'Berit', last: 'Hedman', role: 'ledamot' as const, personality: 'traditionalist' as const },
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
  ],
}

export const BOARD_MEETING_OPENERS = [
  '{ordförande} öppnar mötet med en kopp kaffe och en bulle.',
  '{ordförande}: "Välkomna. Vi har en del att gå igenom."',
  '{ordförande} ser allvarlig ut. Eller nöjd. Svårt att avgöra.',
  'Mötet börjar fem minuter sent. {kassör} var tvungen att parkera om.',
  '{ordförande}: "Kort möte idag, jag har lovat frun att vara hemma tidigt."',
  '{ordförande} har med sig termos och smörgåsar. Det blir ett längre möte.',
  'Det luktar nybryggat kaffe i klubbstugan. {ordförande} hälsar välkommen.',
]
