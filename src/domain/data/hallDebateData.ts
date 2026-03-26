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
  'Ni drog 1 400 åskådare i snöstorm. {hallclub} hade 290 i sin hall.',
  'Utomhusmatchen mot {opponent} beskrivs som "årets upplevelse" i {paper}.',
  '"Riktig bandy spelas utomhus" — insändare i {paper} efter er seger.',
  'Floodlight, snöfall och 4-1-seger. Publiken gick hem med röda kinder och leenden.',
  'Er match är den mest sedda på Bandyplay den här veckan. "Atmosfären!" kommenterar tittarna.',
  '"Den här kvällen är anledningen till att jag älskar bandy" — supporter på sociala medier.',
  '{paper}: "Utomhusbandyn lever — {club} bevisar det match efter match."',
  'Ungdomslaget spelade sin bästa match i minus 12. Tränaren: "De växer av det."',
]

export interface HallDebateChoice {
  id: string
  label: string
  effects?: string
  narrative?: string
  effect?: string
}

export interface HallDebateEvent {
  title: string
  bodyVariants: string[]
  choices: HallDebateChoice[]
  traditionalistResponse?: string[]
}

export const HALL_DEBATE_EVENTS = {
  kommunenFrågar: {
    title: '🏛️ Kommunen utreder hallfrågan',
    bodyVariants: [
      '{politiker}: "Andra kommuner bygger hallar. Borde inte vi åtminstone utreda frågan?"',
      '{politiker}: "Vi har fått in en motion om bandyhall. Vad tycker föreningen?"',
      '{politiker}: "Grannkommunen invigde sin hall förra året. Hur ställer ni er?"',
    ],
    choices: [
      {
        id: 'support',
        label: 'Ja, en utredning kan inte skada',
        effects: 'politicianRelationship +8, fanMood -3',
        narrative: 'Kommunen tillsätter en utredning. Den landar i nästa mandatperiod.',
      },
      {
        id: 'defend_outdoor',
        label: 'Vi spelar utomhus. Det är vår identitet.',
        effects: 'fanMood +5, politicianRelationship -5',
        narrative: 'Supportrarna jublar. Traditionalisten i styrelsen nickar.',
      },
      {
        id: 'neutral',
        label: 'Vi har inga starka åsikter',
        effects: '',
        narrative: 'Frågan läggs på is. (Ordvitsen noteras av kassören.)',
      },
    ],
  } as HallDebateEvent,

  styrelseSplittrad: {
    title: '🏒 Styrelsemöte: hallfrågan',
    bodyVariants: [
      '"Vi tappar spelare till hallklubbarna. De kan träna året runt — vi kan inte."',
      '"Ungdomarna fryser. Föräldrarna klagar. Vi måste göra något."',
      '"Tre spelare har frågat om vi planerar bygga hall. Vad svarar jag?"',
    ],
    traditionalistResponse: [
      '"Hall? Bandy spelas utomhus. Punkt."',
      '"I 80 år har vi spelat här. Det tänker jag inte ändra."',
      '"De som inte klarar kylan spelar inte bandy."',
      '"Min farfar stod här i minus 25. Och han klagade inte."',
      '"Har du sett hallklubbens publik? 300 pers i en hal för 4000. Nej tack."',
    ],
    choices: [
      { id: 'side_modern', label: 'Modernisten har en poäng', effects: 'fanMood -2' },
      { id: 'side_tradition', label: 'Vi håller fast vid utomhus', effects: 'fanMood +3' },
      { id: 'acknowledge_both', label: 'Båda har rätt — vi förbättrar det vi har', effects: 'facilitiesUpgrade +1' },
    ],
  } as HallDebateEvent,

  spelarePerspektiv: {
    title: '🏋️ Spelare vill prata',
    bodyVariants: [
      'En av spelarna: "Jag älskar utomhusbandy. Men vi kunde inte träna tre veckor i december."',
      'En av spelarna: "Min kompis i hallklubben tränar varje dag. Jag skottar is."',
      'En av spelarna: "Jag fick köldskador på händerna förra matchen. Är det verkligen värt det?"',
      'En av spelarna: "Ungarna i U15 vill spela — men föräldrarna drar sig för kylan."',
      'En av spelarna: "Jag säger inte hall. Men en uppvärmd bänk vore schysst."',
    ],
    choices: [
      {
        id: 'invest_small',
        label: 'Investera i uppvärmda omklädningsrum',
        effects: 'finances -8000, facilitiesUpgrade +1, morale +3',
      },
      {
        id: 'arrange_indoor',
        label: 'Boka inomhusplan för vinterträning',
        effects: 'finances -3000',
      },
      {
        id: 'tough_love',
        label: '"Det här är bandy. Vi härdar ut."',
        effects: 'morale -2',
      },
    ],
  } as HallDebateEvent,
}

export const BOARD_HALL_QUOTES = {
  supporter: [
    '"Jag vill ha publik. Publik kommer utomhus, inte i hallar."',
    '"Har du känt stämningen en snökväll med 1 500 på planen? Det kan ingen hall ge."',
    '"Jag tar hellre 2 000 utomhus än 300 i en hal."',
  ],
  ekonom: [
    '"En hall kostar 120-200 miljoner. Vi har 350 000 i kassan. Nej."',
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
    '"Tre av fyra semifinallag spelar i hall. Samband? Kanske."',
    '"Ungdomarna slutar. De orkar inte frysa. Vi måste lyssna."',
    '"En hall ger oss träning 12 månader om året istället för 5."',
    '"Jag säger inte att hall är svaret. Men frågan måste ställas."',
  ],
}
