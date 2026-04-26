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

  kickoff_home_arena: [
    '{homeClubName} har publik i ryggen. {arenaName} ekar.',
    '{arenaName} är full — och de vet vad de kom för.',
    'Klacken har kommit tidigt till {arenaName}. Det kommer att märkas.',
    'Det är {weather} på {arenaName}. Spelarna skakar liv i lederna.',
  ],

  counter_after_corner_slow: [
    '{defenderName} hinner inte tillbaka! Öppen yta och motståndarna kontrar!',
    'Vår defensiv var uppflyttad på hörnan. Nu är vi exponerade.',
    '{defenderName} springer för livet men det räcker inte — kontringen är ute på isen.',
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

  quarterfinal_kickoff: [
    "KVARTSFINAL! En match avgör allt. Vinna eller åka hem.",
    "Det är här säsongen antingen lever vidare eller dör. Kvartsfinal.",
    "Inga omgångar kvar att gömma sig bakom. Kvartsfinal — på med allvaret.",
  ],

  semifinal_kickoff: [
    "SEMIFINAL! En match ifrån finalen. Det går knappt att föreställa sig pressen.",
    "SM-finalen är en match bort. Semifinal — det här är varför man spelar.",
    "Fyra lag kvar. Bara ett tar guldet. Semifinalen börjar nu.",
  ],

  final_kickoff: [
    "SM-FINALEN! Det här är vad alla har väntat på. Sveriges Superbowl.",
    "Domaren blåser igång SM-finalen! Vilken stämning!",
    "Det största ögonblicket i svensk idrott. SM-final i bandy. Avslag!",
  ],

  semifinal_goal: [
    "SEMIFINALMÅL! {player}! Det kan bli avgörande! {score}!",
    "MÅL! {player} sätter dit den i semifinalen! {score}!",
    "NÄSTAN FRAMME! {player} ger {team} ledningen i semifinalen! {score}!",
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
    '{team} vinner hörnor men kan inte ta hem det.',
    'Närkamperna hårdnar. Domaren låter spelet flyta.',
    'Långa passningar, öppna ytor — men ingen fullträff.',
    'Skottet går utanför — sekunderna tickar.',
    '{team} pressar högt men det ser ändå ut att räcka för motståndarna.',
    'Inga mål men intensiteten är enorm. Publiken knappt andas.',
    'En brytning, kontra, avslutat — utanför stolpen. Dramatik.',
    'Båda kedjor har gett allt. Det här kan inte hålla länge till.',
    'Skott efter skott — men målvakten svarar varje gång.',
    'Isen börjar kännas tung under skridskorna.',
    'Straffarna väntar om ingen avgör snart.',
    '{team} hittar utrymme men avslutningen saknar precision.',
    'Hörnorna haglar — men fortfarande lika.',
    'Fri genombrytning — men skottet går en decimeter utanför.',
    'Spelet går fram och tillbaka. Ingen vill ge sig.',
    '{team} har tryckt in motståndarna i sin zon — men fortfarande noll.',
    'Matchen är helt öppen. En detalj avgör.',
    'Spelarna kastar sig i varje läge. Inget är klart.',
    'Målvakterna är kyliga när spelarna inte är det. Båda håller.',
    'Planen börjar bli tung. Kondition mot vilja.',
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

  // ── Situationella kommentarer (Sprint A) ─────────────────────────────────

  situational_dominating: [
    '{team} håller bollen som en katt med en mus. Det här går bara åt ett håll.',
    'Total kontroll. {team} spelar runt {opponent} som koner på träningen.',
    '{opponent} har knappt rört bollen de senaste minuterna.',
    'Det börjar bli generande nu. {team} gör vad de vill.',
    '{team} styr. {opponent} jagar skuggor.',
  ],

  situational_under_pressure: [
    '{team} trycker ihop sig. Allt handlar om att överleva just nu.',
    'Det är kanoneld mot {team}s mål. Målvakten jobbar övertid.',
    '{opponent} vädrar blod. Våg efter våg.',
    'Nu ska vi se vad {team} är gjorda av. Det pumpas in bollar.',
    '{team} har inte rört bollen på minuter. Alarmerande.',
  ],

  situational_tight: [
    'Jämnt som tusan. Ingen vill göra det första felet.',
    'Det här är schack på is. Båda lagen respekterar varandra.',
    'Försiktigt nu. Ingen vill släppa in det första målet.',
    'Millimeterbandy. Varje detalj kan avgöra.',
  ],

  situational_opened_up: [
    'Nu har matchen öppnat sig! Det går fram och tillbaka!',
    'Helt öppen match nu. Försvaret har glömt var det bor.',
    'Det är hög underhållning — men någon tränare gråter bakom glaset.',
    'Bollen rör sig fort. Båda lag vill ha mer.',
  ],

  // ── Säsongskontext ────────────────────────────────────────────────────────

  context_season_opener: [
    'Säsongspremiär. Ny termos, nya förhoppningar, samma gamla läktare.',
    'Första matchen. Alla lag är lika bra i september. Sen visar verkligheten sig.',
    'Premiärnerverna märks. Ingen har kommit in i säsongsrytmen ännu.',
  ],

  context_title_race: [
    'Tabelltoppen. Allt hänger på de sista omgångarna. {team} vet vad som krävs.',
    'Det här kan vara matchen som avgör var guldet hamnar.',
    'Poängkampen i toppen. Varje detalj räknas nu.',
  ],

  context_relegation: [
    'Nederst i tabellen. Varje poäng väger som guld.',
    'Desperation på bänken. {team} kan inte tappa fler poäng.',
    'Krisläge. {team} behöver poäng — och de behöver dem nu.',
  ],

  context_cup_final: [
    'Cupfinal. Alla ögon på {team}. Nerver av stål krävs.',
    'En match. En chans. Inget mer. Cupfinalen har börjat.',
    'Titeln hägrar. {team} är en match ifrån att lyfta bucklan.',
  ],

  context_comeback_chasing: [
    '{team} jagar. Klockan tickar. Publiken trycker på.',
    'Tränaren pekar framåt. {team} måste chansa nu.',
    'Allt framåt. {team} har inget att förlora i slutminuterna.',
  ],

  context_protecting_lead: [
    '{team} drar ner tempot. Erfarenhet framför finess nu.',
    'Klockan är {team}s bästa vän. Minuterna rinner iväg.',
    '{team} spelar kontroll. Säkert framför spektakulärt.',
  ],

  // ── Spelarkontext ─────────────────────────────────────────────────────────

  context_player_hot_streak: [
    '{player} igen! Tredje målet på två matcher. Han kan inte sluta göra mål.',
    '{player} — den hetaste spelaren i serien just nu.',
    'Ingen kan stoppa {player}. Det är fjärde omgången i rad med poäng.',
    '{player} är i en zon. Allt han rör sitter.',
  ],

  context_player_drought: [
    'Äntligen! {player} bryter torkan. Det var ett tag sedan sist.',
    '{player} har kämpat. Men den här gången sitter den. Lättnad.',
    'Länge väntat för {player}. Nu äntligen belönat.',
  ],

  context_captain_moment: [
    'Kaptenen kliver fram. © på armen, ansvar i blicken.',
    'Det är därför han har bindeln. {player} gör det som krävs.',
    'Kaptensmål! {player} tar ansvar när det behövs som mest.',
  ],

  context_fan_favorite: [
    'Klackens favorit! {player} får läktarna att sjunga!',
    '{player} — publiken ÄLSKAR honom. Och det är inte svårt att förstå varför.',
    'Publikfavoriten slår till! {player} — det var det de kom för att se.',
  ],

  // ── Utvisningskontext ─────────────────────────────────────────────────────

  context_suspension_frustration: [
    '{player} kokar av frustration. 10 minuter — och det vid {score}.',
    'Onödigt. Helt onödigt. {player} visas ut när laget behöver varenda man.',
    'Temperamentet tar över. {player} får betala priset.',
  ],

  context_suspension_tactical: [
    'Taktisk utvisning? {player} stoppade en farlig kontra. Värt priset, kanske.',
    '{player} tar straffet. Ibland måste man offra sig.',
    'Kalkylerat av {player}. Stoppar anfallet — men betalar med 10 minuter.',
  ],

  context_shorthanded_surviving: [
    '{team} överlever! 10 man i 10 minuter och nollan hålls!',
    '{player} är tillbaka. {team} andas ut — utvisningen kostade ingenting.',
    'Kollektiv insats av {team}. Inga insläppta i undertalet.',
  ],

  context_shorthanded_conceding: [
    'Där kom det. Med en man mindre hade {team} ingen chans.',
    'Utvisningen straffar sig. {opponent} utnyttjar överskottet iskallt.',
    '{team} håller inte emot i undertalet. Kostsamt.',
  ],

  // ── Momentum ──────────────────────────────────────────────────────────────

  momentum_swing_home: [
    'Helt plötsligt är det {team}s match! Momentum har svängt!',
    '{team} rullar! Tre raka chanser. {opponent} kan inte få stopp.',
    'Publiken reser sig. Något är på gång.',
    '{team} tar över. Det märks i varje situation.',
  ],

  momentum_swing_away: [
    '{opponent} har tagit över. {team} ser vilsna ut.',
    'Det har vridits helt. {opponent} dikterar tempot nu.',
    'Tyst på hemmaplan. {opponent} kontrollerar matchen.',
    '{team} tappar tråden. {opponent} utnyttjar varje yta.',
  ],

  // ── Händelsevariation (Sprint D) ──────────────────────────────────────────

  tactical_shift: [
    '{opponent} byter formation. Ser ut som en tre-fem-tvåa nu.',
    'Omställning borta. Tränaren har reagerat efter målet.',
    '{opponent} drar sig tillbaka. Defensivt nu.',
    'Nytt mönster hos {opponent}. Forwarden spelar bredare.',
    '{team} märker det — {opponent} har ändrat uppställning.',
  ],

  player_duel: [
    '{player} och deras mittback har gått på varandra hela matchen. Personligt.',
    'Hård duell vid sargen! {player} reser sig, borstar av knäna och kör vidare.',
    '{player} vinner brottningen — tredje gången i rad. Dominerar sin yta.',
    'Kroppsspråket säger allt. {player} har hittat sin motståndare.',
  ],

  atmosphere: [
    'En stund av stillhet. Bara isens knastrande hörs.',
    'Publiken stampar i läktarplankorna. Det ekar över hela vallen.',
    'Dimman lättar lite. Nu ser man hela planen igen.',
    'En termos öppnas på läktaren. Ångan stiger. Minus femton, men ingen klagar.',
    'Fåglarna har slutat sjunga. Det är bara bandy nu.',
    'Vaktmästaren nickar nöjt från sin bänk. Isen håller.',
    'Ljuset från strålkastarna glittrar i isen. Det är vackert.',
    'Kosan luktar choklad och kyla. Äkta bandykväll.',
  ],

  offside_call: [
    'Offside! Flaggan går upp. {team} ville ha frispark men domaren säger nej.',
    'Linjedomaren flaggar. Offside. {player} var steget för tidigt.',
    'Offside. Bra bevakning av {opponent}. Backlinjen sitter.',
    'Anfallet bryts. Offside — men det var en fin rörelse av {player}.',
  ],

  freekick_danger: [
    'Frislag! {player} ställer sig vid bollen. 25 meter rakt in...',
    'Farligt läge. Frislag strax utanför. {team} samlar sig i muren.',
    'Frislagschans! {player} slår — MEN rakt i muren. Inget mer.',
    'Frislag. {player} väljer att slå kort. Besvikna röster från klacken.',
    '{player} med frislag. Hög boll över muren — men utanför.',
  ],

  referee_strict: [
    'Domaren har plockat fram armen tidigt. Nolltolerans ikväll.',
    'Ännu en utvisning. Det här är en domare som inte kompromissar.',
    'Pipa! Frislagsdömning igen. Spelarna skakar på huvudet.',
    'Hårt hållen match av domaren. Inga gratisdueller idag.',
  ],

  referee_lenient: [
    'Domaren viftar vidare. Den gick igenom — men det var nära.',
    'Ingen pipa. Domaren låter spelet flöda. Det uppskattas på planen.',
    'Fri duell. Domaren låter det hållas. Spelarna tack.',
  ],

  referee_inconsistent: [
    'Domaren blåser FÖR? Den verkade ren. Spelarna förstår inte.',
    'Ibland pipa, ibland inte. Inkonsekvent linje idag.',
    'Spelarna vet inte vad som gäller. Domarens linje är svår att läsa.',
  ],

  // Supporter-klack commentary — triggas vid matchstart, halvtid, sent i matchen
  supporter_kickoff: [
    '🎵 {leader} drar igång välkomstsången. {members} röster — inte mycket, men dom hörs.',
    '📣 {leader} och {members} i klacken laddar upp inför avslaget. Stämningen är i sin linda.',
    '📯 Trumman går igång. {leader} ser till att läktarensidan lever från start.',
    '🎵 Klacken är här. {members} personer, ett mål. Det är vad det handlar om.',
  ],

  supporter_halfTime: [
    '📣 {leader} uppmanar sina till nya insatser. "En halvlek kvar — håll i."',
    '🎵 Klacken sjunger under pausen. {members} som vägrar tiga still.',
    '📯 Trumman ekade fortfarande när spelarna gick in i omklädningsrummet.',
    '{leader} samlar klacken. "Vi ger dem allt vi har i andra halvlek."',
  ],

  supporter_late_home: [
    '📣 {leader} piskar upp stämningen. Läktaren lever med laget i slutet!',
    '🎵 Klacksången ekar över planen. {members} som inte ger sig.',
    '📯 Trumman slår hårdare nu. Det märks att det händer något.',
    '{leader} viftar med flaggan. Stämningen är ELEKTRISK i det här slutskedet!',
  ],

  supporter_late_silent: [
    '📣 Tyst på läktaren efter det senaste insläppta. {leader} trummar ensam.',
    '{members} i klacken sjunger fortfarande — men det hörs inte lika långt.',
    '📯 Trumman spelar. Men sångerna dör ut. Laget behöver ett mål.',
    '{leader} envisas. Publiken är tyst, men klacken ger inte upp.',
  ],

  supporter_goal_home: [
    '🎵 {leader} drar igång sången! {members} röster — inte mycket, men de HÖRS!',
    '📯 Trumman ekar! Klacken exploderar!',
    '📣 {leader} kastar sig framåt! Klacken sjunger ut!',
    '🎵 Hör det! {members} i klacken ger allt de har!',
  ],

  supporter_goal_conceded: [
    'Tyst från hemmasidan. {leader} klappar händerna — försöker dra igång.',
    '📣 {leader} håller flaggan uppe. Men tystnad svarar.',
    '{members} i klacken sitter stilla. {leader} försöker men orken är slut.',
  ],

  supporter_attendance_low: [
    '{members} modiga har kommit trots allt. {leader} gör sitt bästa.',
    '📯 Trumman ekar lite ensamt i kvällen. {members} som höll ord.',
    '{leader} spelar för det lilla gänget. De som alltid kommer.',
  ],

  supporter_scandal_recent: [
    '📯 {leader} börjar slå trumman tidigt. Ramsorna kommer inte med på första försöket.',
    '📣 "Hejsan alla är ni klara?" Svaret kommer från halva läktaren. {leader} drar den en gång till.',
    '🎵 Växelramsan tappar i bortre sektionen. {leader} tittar dit, tar i lite mer.',
    '📯 Trumslagen kommer i takt. Sångerna ligger ett halvt slag efter.',
    '{leader} går runt arenan ändå. Tunn tröja, bara handskar — som alltid. Som om ingenting hade hänt.',
    '📣 "Öka takten sista kvarten" — fjärde gången idag. {leader} hittar inte rätt timing ikväll.',
    '🎵 {members} på läktaren. Ljudtopparna är där. Bottnarna är längre än vanligt.',
    '📯 Trumman går. Flaggorna går. Det går — men det knaggar i synkningen.',
  ],

  // Sprint 28-B: Legend commentary
  legend_goal: [
    'Den där killen igen. {seasons} säsonger. Han har gjort det här tusen gånger.',
    '{lastName} hittar nätet. Som han alltid gjort.',
    '{minute}:e minuten — och det är {lastName}. Naturligtvis.',
    'Klacken sjunger {lastName}s namn innan bollen ens lämnat klubban.',
    'Tröjan är gammal. Skotten är nya. {lastName} är fortfarande {lastName}.',
    'Han skulle ha slutat förra säsongen, sa de. {lastName} har annat på gång.',
    '{totalGoals} mål för klubben nu. Han räknade aldrig själv.',
    'Det är som att se ett gammalt fotografi röra sig. {lastName} skjuter, bollen går in.',
    'Pensionärer i klacken minns hans första mål. Ungdomar lär sig av det här.',
    'Nya nummer på tröjan, samma kille under. {lastName} igen.',
    'Bortalaget visste vad som väntade. Det hjälpte inte. {lastName} hittade vägen.',
    'En generation har gått sedan {lastName} kom till klubben. Han är fortfarande här.',
  ],

  legend_assist: [
    '{lastName} ser passningen. Som han alltid sett dem.',
    'En sån passning gör inte vem som helst. {lastName} gör dem i sömnen.',
    'Han hade kunnat skjuta själv. {lastName} valde att ge bort den. Som vanligt.',
    'Bollen kommer från ingenstans — fast vi vet att det var {lastName}. Det är alltid {lastName}.',
  ],

  legend_gk_save: [
    '{lastName} står där. {seasons} säsonger på samma plats. Han vet vart bollen ska.',
    'Räddning av {lastName}. Klacken har sett tusen sådana. De jublar ändå.',
    'Den räddningen — den var av en spelare som varit här länge. {lastName} läser spelet.',
  ],

  legend_late: [
    '{minute}:e minuten. Det är {lastName}. Det är så det ska vara.',
    'En match att minnas. {lastName} avgör — som han gjort sedan han var ung.',
    'Sista minuterna. {lastName} hittar utrymmet. Ingen är förvånad. Alla jublar ändå.',
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
      `Den hungriga forwarden slår igenom! ${name} har väntat på det här.`,
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
