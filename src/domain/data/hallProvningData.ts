/**
 * hallProvningData — matchhall-prövningens textpooler (06-12-modellen).
 * Källa: TEXTPOOLER_PROVNING_2026-06-12.md (Opus, 2026-06-12).
 * Integrera ordagrant — dessa strängar redigeras av Opus, inte Code.
 */

import type { HallTrialStage } from '../entities/Community'

// §A Kafferum & klack per processteg
export const PROVNING_AMBIENT: Partial<Record<HallTrialStage, { kafferum: string[]; klack: string[] }>> = {
  forankring: {
    kafferum: [
      'Hallfrågan är uppe igen. Hälften vid bordet tycker. Andra hälften tiger.',
      '"Tak", sa någon vid kaffet. Det räckte för en halvtimmes diskussion.',
      'Kassören har börjat dricka kaffe med oss. Han har siffror med sig.',
      'Ingen säger hall rakt ut längre. Alla vet ändå vad som menas.',
    ],
    klack: [
      'Birger samlar Västra Sidan efter matchen. Ingen banderoll än — bara samtal.',
      'Klacken sjöng den gamla vinterramsan extra länge i dag. Det var inget sammanträffande.',
    ],
  },
  krav: {
    kafferum: [
      'Papper på bordet i klubbhuset nu. Förbundet vill se siffror, inte känslor.',
      'Publiksiffrorna räknas på riktigt i år. Varje termos på läktaren är ett argument.',
      'Kassören sover dåligt, säger hans fru på Konsum.',
    ],
    klack: [
      'Klacken vet att den räknas i kravlistan. Den sjunger därefter.',
    ],
  },
  forhandling: {
    kafferum: [
      'Kommunalrådet var på matchen i lördags. Satt kvar hela andra halvlek. Folk noterade.',
      'Det förhandlas i stadshuset nu. Gubbarna gissar olika om utgången — alla med samma säkerhet.',
    ],
    klack: [
      'Västra Sidan har skickat ett eget brev till kommunen. Birger skrev under först.',
    ],
  },
  bygge: {
    kafferum: [
      '"Snart spelar vi inomhus", sa någon. Det blev tyst vid bordet en stund.',
      'Pålarna syns från landsvägen nu. Folk saktar in när de kör förbi.',
    ],
    klack: [
      'Kranen står där den står. Klacken har inte bestämt vad den tycker om den än.',
      'Sture går förbi bygget varje morgon. Han säger inget. Han går dit ändå.',
    ],
  },
}

export const PROVNING_RESOLUTION = {
  bordlagd: 'Medlemsmötet sköt på frågan. Den ligger kvar i en pärm i klubbhuset — och i bakhuvudet på alla.',
  nedlagd_fall: 'Hallfrågan föll. Birger bjöd på kaffe efteråt. Han var storsint nog att inte le.',
  nedlagd_egen: 'Du la ner frågan själv. Västra Sidan noterade det. Sånt glöms inte — på det bra sättet.',
}

// §B Förankringens tre decisions
export const PROVNING_DECISIONS_FORANKRING = [
  {
    id: 'medlemsmotet',
    title: 'Medlemsmötet i klubbhuset',
    body: 'Fullsatt i klubblokalen, kaffet räcker inte. Hallfrågan står sist på dagordningen men det är den alla väntat på. Ordet är ditt när du vill ta det.',
    choiceA: { label: 'Lyssna färdigt — låt medlemmarna äga kvällen', hint: 'Tryggt. Stödet växer långsamt.' },
    choiceB: { label: 'Ta ordet — lägg fram hela kalkylen', hint: 'Vågat. Kan vinna rummet eller tappa det.' },
  },
  {
    id: 'birger_mote',
    title: 'Birger vill ses',
    body: 'Han väntar vid kiosken efter träningen, mössan i händerna. Västra Sidan har frågor, säger han. Inga banderoller än — men det beror på det här samtalet.',
    choiceA: { label: 'Ta mötet nu', hint: 'Klacken hörs. Det märks.' },
    choiceB: { label: 'Be honom vänta till efter helgens match', hint: 'Birger väntar inte gärna.' },
  },
  {
    id: 'enkaten',
    title: 'Lokaltidningen ringer',
    body: 'De gör en enkät om hallfrågan. Journalisten vill ha klubbens linje — inte styrelsens protokoll, din röst. Det hamnar på förstasidan oavsett vad du svarar.',
    choiceA: { label: 'Svara öppet — hela resonemanget', hint: 'Öppenhet bygger. Och binder.' },
    choiceB: { label: 'Avböj — frågan ägs av medlemmarna', hint: 'Tystnad tolkas. Ibland fel.' },
  },
] as const

// §C Förhandlingens decisions + fördyringseventet
export const PROVNING_DECISIONS_FORHANDLING = [
  {
    id: 'kommunens_villkor',
    title: 'Kommunens villkor',
    body: 'Kommunalrådet lägger papperet på bordet: medfinansiering mot ungdomstimmar — hallen ska vara full av ortens unga på vardagarna. Det är ett rimligt krav. Det är också en kostnad varje vecka, året om.',
    choiceA: { label: 'Acceptera ungdomstimmarna', hint: 'Ungdom ↑ · drift −/säsong' },
    choiceB: { label: 'Föreslå delad drift istället', hint: 'Lägre uppsida · högre ja-odds' },
  },
  {
    id: 'patronens_erbjudande',
    title: '{patron} bjuder in till kontoret',
    body: 'Kaffet serveras i porslin. Han har läst kalkylen bättre än kommunen gjort, säger han. Han kan stå för borgen — eller mer. Sen tittar han ut genom fönstret och låter erbjudandet ligga kvar på bordet.',
    choiceA: { label: 'Ta emot borgen', hint: 'Kravet löst. Patronen glömmer inte.' },
    choiceB: { label: 'Tacka nej — klubben bär det själv', hint: 'Respekt. Och hela kassakravet kvar.' },
  },
] as const

export const PROVNING_EVENT_FORDYRING = {
  title: 'Beskedet från bygget',
  body: 'Byggledaren ringer före åtta. Grunden bär inte som beräknat — det blir dyrare, och det blir det nu. Han behöver besked före helgen.',
  choiceA: { label: 'Skjut till — bygget fortsätter', hint: 'Kassa −20 % av byggsumman' },
  choiceB: { label: 'Pausa en säsong', hint: 'Kassan andas. Bygget står.' },
}

// §D Hall-atmosfären — ersättningspoolen (Själ-priset i språket)
export const HALL_ATMOSPHERE: string[] = [
  'Sorlet studsar i taket. Det tar några matcher att vänja örat.',
  'Termosarna blir färre — kaffet köps varmt vid kiosken innanför entrén. Kön är densamma.',
  'Plus fem och vindstilla, varje match. Någon på läktaren saknar att ha något att klaga på.',
  'Konstljuset är jämnt över hela isen. Inga skuggor att skylla på längre.',
  'Barnen står närmast sargen nu. Det gick inte i tjugo minus.',
  'Det luktar fortfarande skrapad is. Det följde med in.',
  'Mössorna åker av inne i hallen. Folk ser varandras ansikten på ett nytt sätt.',
  'Utanför faller snön. Den får falla ifred numera.',
]

export const HALL_KLACK_BASE: string[] = [
  'Klacken har hittat sin nya kortsida. Ekot gör ramsorna större än de är.',
  'Västra Sidans flaggor hänger i taket nu istället för på vallen. Någon ordnade det utan att fråga.',
]

// §E Stödmätarens lägen + trädnodens stage-rader
export const STOD_LABELS = {
  low: 'Stödet sviktar. Bygden är inte med.',
  mid: 'Bygden väger fram och tillbaka. Inget är avgjort.',
  high: 'Bygden lutar åt ja. Mötet närmar sig.',
}

export const HALLNODE_SUBS: Record<HallTrialStage, string> = {
  vilande: 'Öppnar prövningen — förankring krävs ›',
  forankring: 'Förankring pågår · stöd {n}',
  krav: 'Krav {x}/3 uppfyllda',
  forhandling: 'Förhandling med kommunen pågår',
  bygge: 'Bygge · klar {season}',
  bordlagd: 'Bordlagd · kan väckas igen',
  nedlagd: 'Nedlagd · vilar till {season}',
  klar: 'Byggd {year}',
}

// ── ÅTERUPPLIVAD 2026-08-31, text-utan-yta (bevaranderegeln, BACKLOG-inventeringen) ──
// Fyra pooler raderade av misstag i d0d4d923 (2026-08-17, "radera hallDebateEvents.ts
// + hallDebateService.ts — död kod"). Commit-motiveringen gällde bara HALL_DEBATE_EVENTS
// (korrekt superseterad av PROVNING_*-poolerna ovan) — men samma fil bar dessa fyra
// separata, oberoende dömda pooler, som docs/BEVARANDELISTA.md uttryckligen skyddar
// med "Ingen rad här raderas" och som ALDRIG fick sin egen bedömning innan filen föll.
// M61 (textaudit 2026-07-04): {hallclub} FÅR INTE substitueras med en av spelets tolv
// Elitserieklubbar (de är utomhusklubbar) — {hallclub} är en omvärldsklubb, samma
// mönster som rumorService.ts. Ingen nuvarande yta har en sådan källa. Dödmarkerade
// här igen, ordagrant återställda ur git-historiken — INGEN ny text skriven.
// Väntar på: Opus/Jacob avgör om nyhetspoolen ska väva in en omvärldsklubb-källa
// eller om exporterna ska tas bort permanent (BEVARANDELISTA.md, uppdatera samtidigt).
export const HALL_NEWS_POSITIVE = [
  '{hallclub} rapporterar perfekt is till kvällens match. Inga problem med väder.',
  '{hallclub}s ungdomslag tränar fem dagar i veckan — året runt. Utan hall hade det inte gått.',
  '"Spelarna slipper förfrusna fingrar och stela muskler" — {hallclub}s tränare i {paper}.',
  '{hallclub} genomför alla planerade träningar i januari. Utomhuslagen ställde in tre.',
  '"Rehabiliteringen går snabbare inomhus" — {hallclub}s sjukgymnast.',
  '{hallclub}s akademi lockar talanger. "Träningsmöjligheterna är avgörande" säger 16-åring.',
  '"Jag hade slutat utan hallen. Kunde inte kombinera jobb och träning ute i minus 20" — spelare i {hallclub}.',
  '{hallclub}s damsektion växer — tack vare året-runt-tillgång till is.',
]

export const HALL_NEWS_NEGATIVE = [
  '{hallclub} drog 280 åskådare igår. Hallen rymmer 4 000.',
  'Problem i {hallclub}s hall: kondens i taket droppade på isen under matchen.',
  '{hallclub}s isbädd måste läggas om. Kostnad: 1,8 miljoner.',
  '"Det är som att spela i ett kylskåp" — bortalagets spelare om {hallclub}s arena.',
  '{hallclub}s driftskostnader: 3,2 miljoner per år. Klubben gick back förra året.',
  'Publiken klagar på sikten i {hallclub}s hall. "Stolparna skymmer halva planen."',
  'Paradoxen: {hallclub}s is blev sämre ju fler som kom. Värmen från publiken.',
  '"Stämningen dör i hallen. Det är inte samma sak" — supporter i {paper}.',
  '{hallclub} tvingades stänga hallen en vecka — värmesystemet kollapsade.',
  'Kommunen höjer hyran för {hallclub}s hall. +15% från nästa säsong.',
  'Kondensproblemen i {hallclub}s hall förvärras. Fjärde matchen med droppar.',
  '{hallclub}s elräkning: 890 000 kr bara i januari. Styrelsen sväljer hårt.',
]

export const HALL_NEWS_OUTDOOR_PRIDE = [
  'Ni drog storpublik i snöstorm. {hallclub} hade 290 i sin hall.',
  'Utomhusmatchen mot {opponent} beskrivs som "årets upplevelse" i {paper}.',
  '"Riktig bandy spelas utomhus" — insändare i {paper} efter er seger.',
  'Strålkastarljus, snöfall och två poäng. Publiken gick hem med röda kinder och leenden.',
  'Er match är den mest sedda på Bandyplay den här veckan. "Atmosfären!" kommenterar tittarna.',
  '"Den här kvällen är anledningen till att jag älskar bandy" — supporter på sociala medier.',
  '{paper}: "Utomhusbandyn lever — {club} bevisar det match efter match."',
  'Ungdomslaget spelade sin bästa match i minus 12. Tränaren: "De växer av det."',
]

export const BOARD_HALL_QUOTES = {
  supporter: [
    '"Jag vill ha publik. Publik kommer utomhus, inte i hallar."',
    '"Har du känt stämningen en snökväll med 1 500 på planen? Det kan ingen hall ge."',
    '"Jag tar hellre 2 000 utomhus än 300 i en hall."',
  ],
  ekonom: [
    '"Vet du vad en hall kostar? Räkna. Sen säger du nej själv."',
    '"Driftskostnaderna för en hall: 3 miljoner per år. Minst."',
    '"Kommunen lovar alltid. Sen kommer besparingarna."',
    '"Gubbängens isbädd kostade 1,8 att lägga om. Och den håller max fem år."',
  ],
  traditionalist: [
    '"Bandy. Spelas. Utomhus. Slut på diskussionen."',
    '"Min farfar stod här i minus 25 och tittade på bandy. Hall? Aldrig."',
    '"Det finns ett ord för bandy inomhus. Det heter innebandy."',
    '"Vi har spelat här i 80 år. Jag tänker inte vara den som ger upp."',
  ],
  modernist: [
    '"Hallklubbarna lockar med träningstider året om. Samband med att vi tappar folk? Kanske."',
    '"Ungdomarna slutar. De orkar inte frysa. Vi måste lyssna."',
    '"En hall ger oss träning 12 månader om året istället för 5."',
    '"Jag säger inte att hall är svaret. Men frågan måste ställas."',
  ],
}
