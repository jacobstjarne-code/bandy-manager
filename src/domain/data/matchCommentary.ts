import type { Player } from '../entities/Player'

export type CommentaryTemplate = string

export const commentary = {
  kickoff: [
    "Domaren blåser igång matchen! {team} tar emot på hemmaplan.",
    "Avslag! {team} möter {opponent} i kvällens match.",
    "Och så drar det igång! {opponent} inleder matchen.",
    "Domaren blåser igång matchen. En hel säsong kan avgöras i kväll.",
    "Och vi är igång! Spelarna har värmt upp, publiken är på plats, nu kör vi.",
  ],

  halfTime: [
    "Halvtid! Spelarna drar mot omklädningsrummet. Ställningen just nu: {score}.",
    "Domaren blåser för halvtidsvila. {score} efter 45 spelade minuter.",
    "Halvtid! Det har varit en {intensity} halvlek. {score}.",
    "Paus. Tränarna väntar i omklädningsrummet. {score} och många frågor att besvara.",
    "45 minuter spelade. Nu lite andrum. Ställning: {score}.",
  ],

  fullTime: [
    "SLUTSIGNAL! Domaren blåser av matchen. Slutresultat: {score}.",
    "Det är slut! {score} — {team} tar med sig {result} hem.",
    "Domaren blåser. Matchen är över. {score} efter 90 rafflande minuter.",
    "SLUT! En dramatisk match är nu färdigspelad. {score}.",
    "Det var det hela! {score}. Spelarna skakar näve efter en tuff match.",
    "FULLTID! En match som gav publiken det de kom för. {score}.",
    "Domaren blåser av. Det är klart. {score}. Spelarna tackar varandra.",
    "Slutspelat. {team} kan andas ut. {score}. Nu är det färdigt.",
  ],

  goal: [
    "MÅÅÅL! {player} lägger in bollen bakom målvakten! {score}!",
    "MÅÅÅL! Strålande avslut av {player}. {team} firar! {score}!",
    "NÄTRASSEL! {player} var på rätt plats. {score}!",
    "MÅÅÅL! {player} placerar in bollen från långt håll! {score}!",
    "Den sitter! {player} pangar in bollen vid bortre stolpen. {score}!",
    "MÅÅÅL FÖR {team}! {player} är iskall och sätter dit den! {score}!",
    "MÅÅÅL! Vilken match! {player} sätter dit {score}!",
    "{player} kommer sopren med målvakten och gör inga misstag. {score}!",
    "Den sitter! {player} med ett fint avslut efter en snabb omställning. {score}.",
    "MÅÅÅL! {player} står för en drömmatch! {score}!",
    "Det går snabbt i bandy. {player} bryter uppspel och gör {score}!",
  ],

  goalOpener: [
    "1–0! Dagens första mål görs av {player} för {team}!",
    "Nollan är bruten! {player} sätter dit det första målet! {score}!",
    "LEDNING! {player} levererar första målet med ett vasst avslut! {score}!",
  ],
  goalLead: [
    "LEDNING! {player} slår till! Vilket avslut! {score}!",
    "Nu leder {team}! {player} hittar nätet! {score}!",
    "{player} ger {team} ledningen! Publiken jublar! {score}!",
  ],
  goalEqualizer: [
    "KVITTERING! {player}! Helt galet! {score}!",
    "Och där kommer kvitteringen! {player} jämnar ut! {score}!",
    "Allt i balans igen! {player} kvitterar för {team}! {score}!",
  ],
  goalReducing: [
    "{player} dundrar in reducering! Plötsligt liv i matchen! {score}!",
    "Reducering av {player}! Matchen lever fortfarande för {team}! {score}!",
    "{player} ger {team} hopp med en reducering! {score}!",
    "REDUCERAT! {player} vägrar ge upp! {score} — plötsligt är det match igen!",
    "{player} lägger upp bollen i nättaket. Det är inte över än! {score}!",
  ],

  goalLate: [
    "SENT MÅL! {player} slår till i slutminuterna! {score}!",
    "DRAMA! {player} gör {score} sent i matchen!",
    "I SISTA STUND! {player} ser till att det inte slutar här! {score}!",
    "Klockan tickar men {player} bryr sig inte! Ett sent mål ger oss {score}!",
    "RAFFLANDE AVSLUTNING! {player} bjuder på en läckerbit! {score}!",
  ],
  goalExtend: [
    "{player} utökar ledningen! {score}, nu känns det under kontroll!",
    "MÅÅÅL! {player} skapar andrum för {team}! {score}!",
    "{team} drar ifrån! {player} med {score}!",
  ],

  cornerGoal: [
    "NUUU BLEV DET MÅÅÅL! {player} pangar in {score} på hörna!",
    "HÖRNMÅL! {player} med en dräpare i högra krysset! {score}!",
    "MÅÅÅL! {player} klipper till på hörna och gör {score}!",
    "HÖRNA! MÅL! Det går fort i bandy. {player} gör {score} på hörna!",
    "HÖRNMÅL! {player} missar nästan bollen, men den sitter ändå! {score}!",
    "MÅÅÅL! Lång hörna på {player} som drar in den. {score}!",
    "{team} utnyttjar hörnan. {player} med ett ruggigt skott. {score}!",
    "HÖRNMÅL! Den hade man inte velat haft i bröstet. {player} gör {score}!",
  ],

  save: [
    "{goalkeeper} räddar med benskyddet! Vilken reflex!",
    "Igenspikat! {goalkeeper} får sträcka på sig. Strålande räddning!",
    "NEJ! {goalkeeper} står i vägen!",
    "{goalkeeper} styr ut bollen nere vid stolproten. Det är inte möjligt!",
    "Räddning! {goalkeeper} väljer rätt håll. Den där läste han i gårdagens.",
    "Alla lösa går om, skrockar {goalkeeper} och kastar ut bollen igen.",
    "Strålande insats av {goalkeeper}. Han höll {team} kvar i matchen där!",
    "JÄTTERÄDDNING! {goalkeeper} stoppar friläge. Publikens favorit i dag.",
    "{goalkeeper} med en reflexräddning! Det där gick undan.",
    "Ett sus går genom publiken när {goalkeeper} får jobba! Otrolig räddning.",
  ],

  miss: [
    "OOOOUUH! Bollen går över ribban. En bra chans, ändå.",
    "Skott strax utanför stolpen. Nära nu för {team}.",
    "Avslut som går precis utanför. Vi är centimetrar från ett mål.",
    "I STOLPEN! Bollen studsar ut. {team} hade tur.",
    "Inte riktigt nära med det avslutet. Målvakten får börja om.",
    "I RIBBAN! Frustrerat nu i {team}.",
    "Bollen seglar lååååångt över. Inte spelarens bästa dag, direkt.",
    "Nära — men inte tillräckligt! Ribban vibrerar men resultattavlan står still.",
  ],

  suspension: [
    "{player} får 10 minuter för bentackling! {team} får spela med en man mindre.",
    "Utvisning! Domaren lyfter armen. {player} får vila i 10 minuter.",
    "Sent brytningsförsök av {player}. Solklar utvisning!",
    "{player} protesterar, men domaren är bestämd. Tio minuter.",
    "Hårt spelat. {player} skickas till botbänken. Kritiskt läge för {team}.",
    "Domaren hade inget val. {player} var inte i närheten av bollen. Utvisning.",
    "Tuffa tag kostar {team}. {player} får sätta sig på utvisningsbänken.",
    "Utvisning! Läktaren reagerar starkt. {team} måste försvara sig ordentligt nu.",
  ],

  corner: [
    "Hörna till {team}. Slås in alldeles för löst. Rensas av försvaret.",
    "Hörna för {team}. Skott på mål, men enkelt undan.",
    "Hörna till {team}. En variant! Kort spel med skott i dödvinkel. Långt utanför!",
    "{team} får hörna. Lång boll på sista skytten, men ingen lycka den här gången.",
    "Hörna {team}. Boll på tredjeskytten som skjuter i stolpen!",
    "Ny hörna till {team}. Förstaskytt lägger den i burgaveln.",
    "{team} får hörna. En bra inslagen boll som resulterar i ett skott låååångt över.",
    "Hörna för {team}. Men inget kommer ut av det.",
    "{team} får hörna. Bollen studsar lite, men det blir ändå till ett skott i ruset.",
    "Hörna för {team}. Tredje hörnan på kort tid. Hårt tryck nu.",
    "{team} med ännu en hörna. De styr spelet nu.",
    "Hörna. Inslagen mot tredjeskytt, som skjuter rakt i {opponent}s rus.",
  ],

  powerPlayGood: [
    "{team} utnyttjar utvisningen och trycker på nu.",
    "{team} styr spelet nu, men {opponent} försvarar sig bra.",
    "Utvisningen skapar lite mer utrymme. {team} försöker hitta läget.",
    "{team} söker det avgörandet. {opponent} försvarar sig med näbbar och klor.",
    "{team} trycker på med en man mer!",
  ],

  neutral: [
    "Trevande spel från alla håll. Båda lagen söker öppningar.",
    "{team} vänder ur. Och vänder ur. Och vänder ur.",
    "Högt tempo just nu. Lite hawaii över detta.",
    "Fint spel av {team}, men {opponent} ligger bra i sin defensiv.",
    "Fajt på mitten. Ingen vill ge bort bollen.",
    "{team} håller bollen, vänder ur och söker öppningar.",
    "Intensivt mittfältsspel. Det är tätt här.",
    "Bra drag på publiken idag Det ekar över isen.",
    "{opponent} pressar högt och {team} stressas.",
    "{team} vänder ur för att hitta ett nytt angreppssätt.",
    "Spelet flödar fram och tillbaka utan att något konkret uppstår.",
    "Snyggt uppspel av {team}, men {opponent} är välorganiserade.",
    "Tränarna på båda bänkarna ger instruktioner. Taktiken justeras.",
    "{team} vinner bollen på mittplan och drar igång ett anfall.",
    "Lång boll hemåt. {team} startar om.",
    "Nästan! En bra tanke av {team}, men bollen fastnar på mittplan.",
    "Matchen flödar. Spelet är öppet och snabbt.",
    "Båda lagen vill framåt. Intensivt tempo just nu.",
    "En stund av lugn innan nästa storm. {team} samlar sig.",
    "Spelarna verkar spara lite på krafterna. Ingen vill ta onödiga risker.",
    "{team} spelar tillbaka till liberon som håller i bollen och ger laget andrum.",
    "Friläge! Men avslutet går rakt på målvakten. Vilken chans.",
    "Domaren blåser för offside. {team} tappar initiativet.",
    "Publiken suckar. Spelet har tappat tempo de senaste minuterna.",
    "Klockan tickar. Båda lagen verkar nöjda med att vänta ut varandra.",
    "En lång boll som blir avblåst för offside.",
    "Bollen studsar oberäkneligt. Ingen kan styra spelet just nu.",
    "{team} vänder ur och letar efter ett hål i {opponent}s välorganiserade försvar.",
    "Halvchans för {team}, men för dåligt avslut för att hota på riktigt.",
  ],

  weather_heavySnow: [
    "Snön faller ymnigt nu. Bollen försvinner stundtals.",
    "Svårt att se handen framför sig i det här snöfallet.",
    "Snön lägger sig i högar på isen. Det blir mycket lyror nu.",
    "Bollen saktar in i snön. Teknikerna har det svårt ikväll.",
    "En plogbil borde egentligen köra in på planen nu.",
    "Vintermagi! Eller vinterkaos. Beror på vem du frågar.",
  ],
  weather_thaw: [
    "Isen är seg och blöt. Få passningar går fram.",
    "Bollen fastnar i slushen. Det här är vad som gör bandyn vacker!",
    "Tövädret gör isen trög. Fysiska lag har fördel.",
    "Vattnet sprutar upp vid varje skär. Vilken dag.",
    "Vattenpolo. Spelarnas värsta mardröm.",
    "Bollen lyder inte på den här isen. Tekniska spelare har det svårt.",
  ],
  weather_cold: [
    "Minus tjugo och andedräkten syns som dimma. Kort passningsspel dominerar.",
    "Kylan biter. Spelarna värmer händerna på bänken.",
    "Kylan gör isen stenhård. Bollen studsar som en flipperkula.",
    "De som klarat uppvärmningen är redan vinnare i den här kylan.",
    "Publiken kurar under filtar. Men de är här. Respekt.",
  ],
  weather_fog: [
    "Dimman ligger tät. Publiken kan nog inte se bortre målet.",
    "Spöklik stämning. Spelarna dyker upp ur dimman som skuggfigurer.",
    "Sikten är begränsad. Långa passningar blir ett lotteri.",
    "Dimman sväljer ljudet. Man hör bara skridskor och klubbor.",
  ],
  weather_clear: [
    "Stjärnklart och knivskarpt. Perfekt bandyväder.",
    "Strålkastarna lyser upp en kall, stjärnklar kväll. Det är ruta.",
    "Kyligt och klart. Precis som det ska vara.",
  ],

  weatherCold: [
    "Bollen går trögt i kylan. Spelarna stampar för att hålla värmen.",
    "Minusgraderna biter — fingrarna domnar i handskarna.",
    "Iskallt ikväll. Spelarna har det inte bättre ute på isen.",
  ],
  weatherSnow: [
    "Snöflingorna yr — sikten börjar bli besvärlig.",
    "Bollen studsar oberäkneligt i snömodden.",
    "Snön vräker ner — underhållspersonalen har fullt upp.",
  ],
  weatherMild: [
    "Ovanligt milt för säsongen — isen är blöt och tung.",
    "Plusgraderna sätter spår. Bollen skär igenom vattnet på ytan.",
    "Mildvädret gör isen svårspelad — inte de bästa förhållandena.",
  ],
  weatherFog: [
    "Dimman ligger tät. Svårt att se mittplanen härifrån.",
    "Sikten är begränsad — passningarna blir chansartade.",
    "Dimman gör spelet oförutsägbart ikväll.",
  ],
  weatherGood: [
    "Perfekta förhållanden ikväll — klar luft och fin is.",
    "Strålande bandyväder. Isen ligger som ett golv.",
    "Fint väder, bra is — inga ursäkter idag.",
  ],
  weather_miss_heavySnow: [
    "Bollen slirar bort i snön — avslutet hamnar helt fel.",
    "Omöjligt att sikta i det här! Skottet flyger iväg.",
    "Snön spelar sitt spratt — bollen svänger i sista stund.",
  ],
  weather_miss_thaw: [
    "Bollen fastnade i en vattenpöl — avslutet dog innan det nådde mål.",
    "Slushig is äter farten. Halvchansen rann ut i intet.",
    "Teknisk miss — men det är svårt att skylla spelaren på den här isen.",
  ],
  weather_miss_fog: [
    "Skottet försvinner in i dimman — och passerar mål med god marginal.",
    "Såg spelaren ens målet? Svårt att avgöra i den här sikten.",
  ],
  weather_goal_heavySnow: [
    "MÅÅÅL TROTS SNÖSTORMEN! {player} hittar nätet ändå! {score}!",
    "I snökaoset hittar {player} en springa! {score}!",
  ],
  weather_goal_thaw: [
    "PÅ DEN HÄR ISEN! {player} tvingar in den! {score}!",
    "Trots slushisen — {player} får in bollen! {score}!",
  ],

  playoff_kickoff: [
    "SLUTSPEL! Intensiteten är en annan nu. Allt står på spel.",
    "Det luktar slutspel. Spelarna är fokuserade, publiken elektrisk.",
    "Slutspelsbandy. Vinna eller försvinna. Varje mål är livsviktigt.",
  ],

  final_kickoff: [
    "SM-FINALEN! Det här är vad alla har väntat på. Sveriges Superbowl.",
    "Domaren blåser igång SM-finalen! Vilken stämning!",
    "Det största ögonblicket i svensk idrott. SM-final i bandy. Avslag!",
  ],

  final_goal: [
    "MÅÅÅL I SM-FINALEN! {player} skriver historia! {score}!",
    "SM-GULDET HÄGRAR! {player} med ett fint mål! {score}!",
    "FINALMÅL! {player}! Publiken exploderar! {score}!",
  ],

  final_fullTime_win: [
    "SLUTSIGNAL! {team} ÄR SVENSKA MÄSTARE! Vilken säsong! {score}!",
    "GULD! {team} tar hem SM-guldet! Spelarna kastar sig i en hög på isen! {score}!",
    "SVENSKA MÄSTARE {season}! {team} har gjort det! {score}!",
  ],

  final_fullTime_loss: [
    "Slutsignal. {opponent} tar guldet. En tung förlust, men en stark säsong.",
    "Det räckte inte hela vägen. {opponent} är svenska mästare. {score}.",
  ],

  playoff_general: [
    "Slutspelstempot är något helt annat. Varje duell är på liv och död.",
    "Playoffbandy. Hårdare dueller, mer intensitet, högre insatser.",
    "Det märks att det är slutspel. Spelarna ger allt de har.",
  ],

  derby_kickoff: [
    "DERBY! {rivalry}! Det är drag på läktaren. Den här matchen betyder mer än två poäng.",
    "DERBYDAGS! {team} mot {opponent} — {rivalry}. Rivalerna möts igen!",
    "{rivalry} är igång! Publiken har väntat på det här länge.",
    "Det är derby ikväll! {team} mot {opponent}. Stämningen är elektrisk!",
    "Avslag i {rivalry}! Spelarna har väntat på den här matchen hela säsongen.",
  ],

  derby_goal: [
    "{player}! {rivalry} har fått sitt första mål! {score}!",
    "MÅÅÅL I DERBYT! {player}! Publiken är i extas! {score}!",
    "{player} med derbymålet! {team}-fansen exploderar! {score}!",
  ],

  derby_suspension: [
    "Utvisning i derbyt! {player} gick in för hårt. Känslorna tar över!",
    "Domaren hade inget val — derby-intensiteten resulterade i utvisning för {player}.",
    "Det är för hett! {player} får kyla ner sig på utvisningsbänken. Typiskt derbytempo.",
  ],

  derby_neutral: [
    "Derbyintensiteten märks i varje duell. Ingen viker en centimeter.",
    "Publiken lever. Det här är vad {rivalry} handlar om.",
    "Stämningen går inte att ta fel på. Det här är ett derby rakt igenom.",
    "Hårda men rättvisa dueller. Spelarna vill verkligen vinna det här.",
    "Derbytempot gör att misstagen blir fler. Men också chanserna.",
  ],

  derby_fullTime: [
    "Slutsignal i {rivalry}! {score}. En match det kommer pratas om länge.",
    "{rivalry} är över för den här gången. {score}. Återstår att se vem som skrattar sist.",
  ],

  cornerVariant: [
    "VILKEN HÖRNVARIANT! Bollen kommer i brösthöjd och {player} nyper till på volley! {score}",
    "Ny hörnvariant… och den funkar! {player} bryter tidigt och lägger in bollen!",
    "Det här har de tränat på hela veckan! Kort hörna, fint inspel, MÅL!",
    "Variant på hörnan! {player} kommer obevakad vid bortre! {score}!",
  ],

  secondHalf: [
    "Isen är nyspolad och andra halvlek drar igång.",
    "Tillbaka efter paus. Isen är bättre nu när ismaskinen gjort sitt.",
    "Isen kan bli lite annorlunda den här halvleken.",
    "Andra halvlek i gång. Det syns att laget har kämpat hårt.",
  ],

  iceDeterioration_snow: [
    "Underhållspersonalen har inte hunnit med. Isen är full av snö.",
    "Snön lägger sig allt tjockare. Andra halvlek är en annan match.",
    "Isen är i dåligt skick nu. Passningarna dör i snön.",
  ],

  iceDeterioration_thaw: [
    "Vattenpölarna växer. Den här matchen avgörs av vilja, inte teknik.",
    "Isen är i katastrof nu — spelarna glider på vatten.",
    "Blötare och blötare för varje minut. Konditionen avgör nu.",
  ],

  overtimeStart: [
    'FÖRLÄNGNING! Ytterligare 30 minuter avgör. Spelarna samlar sig.',
    'Det blir förlängning! Benen är tunga men viljan finns där.',
    'Oavgjort efter ordinarie tid! Nu avgörs allt i förlängningen.',
  ],

  overtimeGoal: [
    'MÅÅÅL I FÖRLÄNGNINGEN! {player} har avgjort det! {score}!',
    'DÄR SITTER DEN! {player} i förlängningen! {score}!',
    'MATCHVINNAREN! {player} slår till i förlängningen! {score}!',
  ],

  overtimeEnd: [
    'Förlängningen är slut. Fortfarande {score}.',
    '30 minuter till — ingen lyckades avgöra. {score}.',
  ],

  overtimeNoGoal: [
    '{team} driver på men hittar ingen väg fram.',
    'Desperat spel av båda lagen — det är öppet.',
    'Trötta ben men intensiv match. Vem avgör?',
    'En ny chans, men den brinner — läktaren håller andan.',
    'Desperation. {team} trycker men muren håller.',
  ],

  penaltyStart: [
    'STRAFFAR! Fortfarande oavgjort! Nu avgör straffarna!',
    'Det blir straffar! Nerverna är på sin yttersta spets.',
    'Ingen lyckades avgöra på 120 minuter. Det slutliga avgörandet: straffar.',
  ],

  penaltyWinHome: [
    '{team} VINNER STRAFFARNA {penHome}-{penAway}! Vilken dramatik!',
    'Det är avgjort! {team} tar det på straffar! {penHome}-{penAway}!',
  ],

  penaltyWinAway: [
    '{team} VINNER STRAFFARNA {penAway}-{penHome}! Vilken dramatik!',
    'Det är avgjort! {team} tar det på straffar! {penAway}-{penHome}!',
  ],
}

// Helper to fill in a template
export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`)
}

// Pick a random item from an array deterministically
export function pickCommentary(arr: CommentaryTemplate[], rng: () => number): CommentaryTemplate {
  return arr[Math.floor(rng() * arr.length)]
}

export function getTraitCommentary(
  playerId: string,
  eventType: 'goal' | 'assist' | 'suspension',
  players: Player[],
): string | null {
  const player = players.find(p => p.id === playerId)
  if (!player?.trait) return null

  const name = player.lastName

  const traitGoals: Record<string, string[]> = {
    hungrig: [
      `Den hungriga forwarden bryter igenom! ${name} har väntat på det här.`,
      `${name} ger sig aldrig. Hungern driver honom framåt.`,
      `Där satt den! ${name} har jagat det här målet i veckor.`,
    ],
    joker: [
      `${name} ur ingenstans! Oförutsägbar som alltid.`,
      `Geni eller galenskap? ${name} bestämde sig för geni ikväll.`,
      `Ingen visste vad ${name} tänkte — inte ens han själv. Men bollen gick in.`,
    ],
    veteran: [
      `Rutin i avgörande läge. ${name} har gjort det här hundra gånger.`,
      `${name} med den gamla vanliga. Klass är permanent.`,
      `Veteranen levererar. ${name} visar vägen.`,
    ],
    lokal: [
      `Hela orten jublar! ${name} — en av deras egna.`,
      `Lokalhjälten ${name}! Det kan inte bli bättre på hemmaplan.`,
      `${name} med ett mål som orten kommer prata om länge.`,
    ],
    ledare: [
      `Kaptenen kliver fram! ${name} tar ansvar när det behövs.`,
      `${name} leder med handling, inte bara armband.`,
      `Ledaren ${name} visar att ord inte räcker — det krävs mål.`,
    ],
  }

  const traitSuspensions: Record<string, string[]> = {
    joker: [
      `${name} gör det igen. Briljant ena sekunden, utvisad nästa.`,
      `10 minuter utanför. ${name}s temperament kostar laget.`,
    ],
    hungrig: [
      `Frustrationen kokar över. ${name} åker ut efter en onödig tackling.`,
    ],
  }

  if (eventType === 'goal') {
    const pool = traitGoals[player.trait]
    if (!pool) return null
    return pool[Math.floor(Math.random() * pool.length)]
  }
  if (eventType === 'suspension') {
    const pool = traitSuspensions[player.trait]
    if (!pool) return null
    return pool[Math.floor(Math.random() * pool.length)]
  }
  return null
}
