/**
 * BoardMeeting säsong 2+ — copy-pooler per A/B/C-tillstånd.
 * Opus-text 2026-05-31. Bandysvensk understatement.
 *
 * State resolveras av boardMeetingStateResolver:
 *  A · Första gången   — säsong 2 (oavsett utfall)
 *  B · Efter bra säsong — säsong 3+, måluppfyllelse ≥ 80%
 *  C · Efter dålig säsong — säsong 3+, måluppfyllelse < 50%
 *  Mellansäsonger (50–80%) → B eller C baserat på närmast utfall
 *
 * Code slumpar utan upprepning per pool (no-repeat-tracker per spelinstans).
 */

export type BoardMeetingState = 'A' | 'B' | 'C'

interface StatePool {
  settings: string[]      // rumsprolog (Georgia italic)
  titles: string[]        // scen-titel (Georgia)
  speakerLines: string[]  // ordförandens huvudtal
}

export const BOARD_MEETING_COPY: Record<BoardMeetingState, StatePool> = {
  A: {
    settings: [
      'Kommunalhusets möteslokal. Kaffe i termos. Ordföranden har tagit av sig kavajen.',
      'Bygdens samlingssal. Stolarna är de gamla från 80-talet. Ordföranden plockar fram en mapp.',
      'Klubbstugans bakre rum. Lukt av nymålat. Någon har ställt fram glas och vatten.',
      'Bandyhallens kontor, vid skrivbordet. Det är torsdag eftermiddag, allt är lugnt.',
      'Ordförandens kök. Hon har plockat fram tre stolar runt köksbordet. Kaffe på spisen.',
      'Hembygdsgården. Ordföranden ber alla skriva under deltagarlistan innan de börjar.',
      'Klubbstugan, andra våningen. Genom fönstret syns isbanan, helt tom.',
      'Skolans matsal — uthyrd för kvällen. Trasmattor på golvet, korkstolar runt bordet.',
    ],
    titles: [
      'Ett år bakom oss.',
      'Hur långt har vi kommit?',
      'Dags att börja bygga.',
      'Andra året.',
      'Foten har vi hittat.',
      'Vi vet rutinen nu.',
      'Bygga vidare.',
      'Året två börjar här.',
    ],
    speakerLines: [
      'Vi vet hur det funkar nu. Första året var att hitta foten. Andra är att börja bygga.',
      'Inget revolutionerande — vi gör mer av det som funkade och mindre av det som inte gjorde det.',
      'Plats sju är plats sju. Det är okej. Frågan är hur vi tar ett steg upp.',
      'Truppen är intakt. Det är värt något. Nu är det inte bara nya namn att lära sig.',
      'Folk är ute i bygden. Vi syns. Det är en grund att stå på.',
      'Vi ska inte slå knut på oss. Andra året handlar om kontinuitet.',
      'Henriksson har fått fart. Det är där akademin ska visa sig.',
      'Vi ska höja oss en hyfsad bit. Men inte sikta på månen.',
    ],
  },
  B: {
    settings: [
      'Samma lokal, men någon har tagit med bakelser. Ordföranden ler innan hon säger något.',
      'Bygdens samlingssal — den fina, med scenen. Någon har tänt två ljusstakar.',
      'Kommunalhusets stora rum. Ordföranden har lånat det av kommunalrådet personligen.',
      'Klubbstugan, men med rosenbuketten från säsongsavslutningsbanketten kvar på bordet.',
      'Förbundskontoret, det riktiga sammanträdesrummet. Vatten i karaffer, inte plastflaska.',
      'Klubbens egen sal — den nyrenoverade. Den invigdes med samma styrelsemöte.',
      'Hembygdsgården, men med kaffe i porslin. Margaretas mamma har bakat.',
      'Bandyhallens VIP-rum, lånat av sponsorerna en kväll. Lyxigt, lite för lyxigt.',
    ],
    titles: [
      'Det gick bättre än vi vågade hoppas.',
      'Silvret sitter i.',
      'Ett oväntat år.',
      'Vi gjorde det.',
      'Slutspelet — och mer.',
      'Bra. Riktigt bra.',
      'Folket kom ihåg oss.',
      'Året som höjde ribban.',
    ],
    speakerLines: [
      'Silvret sitter i. Men vi ska inte bli mätta. Ett år till på den nivån — då pratar vi om något.',
      'Vi gjorde det vi sa. Inte bara nått målen — vi överträffade dem. Nu är frågan: vad nu?',
      'Folk är stolta. Tröjor säljs. Sponsorerna ringer i förväg, inte tvärtom.',
      'Det är farligt nu. Allt kan kännas som om det räcker. Det gör det inte.',
      'Vi har bevisat något. Frågan är om vi orkar bevisa det igen.',
      'Henriksson — han var bättre än vi trodde. Och han är bara 20. Match-vinnare i fem år till.',
      'Pengarna räcker till tre nya tröjor och två förstärkningar. Vi får välja.',
      'Det är inte tid att gå försiktigt. Det är tid att se vart det leder.',
    ],
  },
  C: {
    settings: [
      'Lokalen är kall — värmen var avstängd över helgen. Ordföranden bläddrar i pärmen lite för länge.',
      'Kommunalhusets minsta rum. Termosen står oöppnad. Ordföranden börjar utan att hälsa.',
      'Klubbstugans bakre rum, ingen i köket. Ordföranden öppnar mötet utan välkomstord.',
      'Bandymuseets källare. Tonen är att inte synas mer än nödvändigt.',
      'Förbundskontorets korridor, eftersom ingenting annat var ledigt på kort varsel.',
      'Bandyhallen, sittande på läktaren. Ordföranden ville se isen medan de pratade.',
      'Hembygdsgårdens kök. Ordföranden tar kaffekoppen själv. Ingen annan dricker.',
      'Klubbstugans loft. Det luktar damm. Ingen har varit där sedan i somras.',
    ],
    titles: [
      'Vi måste prata om året som gick.',
      'Allvarssamtal.',
      'Tid att backa.',
      'Säsongen som inte blev av.',
      'Det blev inte som vi tänkt.',
      'Tillbaka till basics.',
      'Tuff säsong, tuffa beslut.',
      'Sanningens minut.',
    ],
    speakerLines: [
      'Ingen sitter här och letar syndabockar. Men siffrorna är siffror. Vi får dra ner och bygga om.',
      'Vi nådde inte målen. Det är ingen tolkningsfråga.',
      'Det är inte slut. Men vi måste vara ärliga om var vi står.',
      'Pengarna har försvunnit snabbare än vi trodde. Det är allvar.',
      'Vi sålde inte. Vi måste börja sälja.',
      'Spelarna är inte sämre än förra året. Vi har inte gjort vårt jobb tillräckligt bra.',
      'Folkets förväntningar har sänkts. Det är inte en lättnad — det är ett varningstecken.',
      'Tio är inte slutet. Men det är inte heller riktningen vi vill ha.',
    ],
  },
}

/** Goal-motiveringar per objektiv-typ och state — italic-sub under goal-card. */
export const GOAL_MOTIVATIONS: Record<string, string[]> = {
  // A · försiktig höjning
  'A:sporting': [
    'Ett steg upp. Rimligt med samma trupp.',
    'Höja oss men inte sikta för långt.',
    'Andra året är inget hopp — det är ett kliv.',
  ],
  'A:academy': [
    'Akademin ska börja synas.',
    'En egenfostrad i startelvan. Det är vad år två handlar om.',
  ],
  'A:economic': [
    'Hålla budget. Inga drömkalkyler.',
    'Kassan i fred. Bygg inget på lösa pengar.',
  ],
  'A:community': ['Synas mer i bygden. Vi ska finnas mellan matcherna också.'],
  'A:identity': ['Bygga en spelidé folk känner igen.'],
  // B · bekräfta nivån
  'B:sporting': [
    'Bekräfta att silvret inte var en tillfällighet.',
    'Hänga kvar på nivån. Folk förväntar sig det nu.',
    'Stretch. Styrelsen vågar säga ordet i år.',
    'Vi var nära. Nu går vi hela vägen.',
  ],
  'B:academy': [
    'Två egenfostrade i startelvan, inte bara en.',
    'Akademin ska leverera ett namn till år tre.',
  ],
  'B:economic': [
    'Vi har råd att höja löner — men inte alla. Välja klokt.',
    'Sponsorpengar in. Inte allt direkt ut.',
  ],
  'B:community': ['Bygden står bakom oss. Förvalta det.'],
  'B:identity': ['En spelidé som blivit vår signatur. Fördjupa den.'],
  // C · överlevnad + humility
  'C:sporting': [
    'Inget mer. Bort från strecket först.',
    'Trygg mitten. Det är vad vi har råd med.',
    'Kvar i serien, säkrat tidigt. Allt annat är bonus.',
  ],
  'C:economic': [
    'Positiv kassa till sommaren. Sälj om det krävs.',
    'Inga nya stora löner. Förlängningar bara där det måste.',
    'Pengarna före placeringen.',
  ],
  'C:academy': ['Akademin pausad i prio. Förstärkningar utifrån behövs först.'],
  'C:community': ['Håll kontakten med bygden även när det är tungt.'],
  'C:identity': ['Tillbaka till basics. En enkel spelidé som håller.'],
}

/** Deterministiskt val ur en pool via seed (ingen Date.now/Math.random). */
export function pickFromPool<T>(pool: T[], seed: number): T {
  if (pool.length === 0) throw new Error('pickFromPool: empty pool')
  return pool[Math.abs(seed) % pool.length]
}
