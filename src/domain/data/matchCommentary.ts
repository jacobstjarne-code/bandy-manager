export type CommentaryTemplate = string

export const commentary = {
  kickoff: [
    "Domaren blåser igång matchen! {team} tar emot på hemmaplan.",
    "Avspark! {team} möter {opponent} i kvällens match.",
    "Och så drar det igång! {opponent} inleder matchen.",
    "Vissling — matchen börjar. En hel säsong kan avgöras i kväll.",
    "Och vi är igång! Spelarna har värmt upp, publiken är på plats, nu kör vi.",
  ],

  halfTime: [
    "Halvtid! Spelarna drar mot omklädningsrummet. Ställningen just nu: {score}.",
    "Domaren blåser igång halvtidspausen. {score} efter 45 spelade minuter.",
    "Halvtidsvissling! Det har varit en {intensity} halvlek. {score}.",
    "Paus. Tränarna väntar i omklädningsrummet. {score} och många frågor att besvara.",
    "45 minuter spelade — nu lite andrum. Ställning: {score}.",
  ],

  fullTime: [
    "SLUTSIGNAL! Domaren avslutar matchen. Slutresultat: {score}.",
    "Det är slut! {score} — {team} tar med sig {result} hem.",
    "Tre visslar — matchen är över. {score} efter 90 engagerade minuter.",
    "Slutvisslat! En dramatisk match når sitt slut. {score}.",
    "Och det var det! {score}. Spelarna skakar hand efter ett hårt kämpat match.",
    "FULLTID! En match som gav publiken det de kom för. {score}.",
    "Tre visslar och det är klart. {score}. Spelarna samlas på mitten.",
    "Slutvisslat. {team} kan andas ut. {score} — allt är sagt.",
  ],

  goal: [
    "MÅÅÅL! {player} sätter en precis avslutning förbi målvakten! {score}!",
    "MÅÅÅL! Strålande avslut av {player} — {team} jublar! {score}!",
    "IN I NÄTET! {player} var på rätt plats i rätt tid. {score}!",
    "MÅÅÅL! {player} placerar in det med vänsterpinnen! {score}!",
    "Det sitter! {player} nuddar in bollen vid bortre stolpen. {score}!",
    "MÅÅÅL FÖR {team}! {player} är iskall och sätter dit den! {score}!",
    "MÅÅÅL! Vad en match det har blivit! {player} sätter dit {score}!",
    "{player} tar emot, vänder och skjuter — inget som kan stoppa det! {score}!",
    "Avslut — inne! {player} med ett kontrat avslut. {score}.",
    "MÅÅÅL! {team} exploderar i jubel! {player} med en drömmatch! {score}!",
    "Det händer snabbt i bandy — {player} bryter och sätter dit {score}!",
  ],

  goalOpener: [
    "1–0! Första målet faller — {player} öppnar målskyttet för {team}!",
    "Nollan är bruten! {player} sätter dit det första målet! {score}!",
    "LEDNING! {player} bryter dödläget med ett vasst avslut! {score}!",
  ],
  goalLead: [
    "LEDNING! {player} slår till! Vilket avslut! {score}!",
    "Nu leder {team}! {player} vänder på steken! {score}!",
    "{player} ger {team} ledningen! Publiken kokar! {score}!",
  ],
  goalEqualizer: [
    "KVITTERING! {player}! Helt galet! {score}!",
    "Och där är kvitteringen! {player} jämnar ut! {score}!",
    "Allt i balans igen! {player} kvitterar för {team}! {score}!",
  ],
  goalReducing: [
    "{player} dundrar in reducering! Plötsligt liv i matchen! {score}!",
    "Reducering av {player}! {team} lever fortfarande! {score}!",
    "{player} ger {team} hopp med en reducering! {score}!",
    "REDUCERING! {player} vägrar ge upp! {score} — plötsligt är det en match igen!",
    "{player} sticker in bollen i hörnet. Det är inte över än! {score}!",
  ],

  goalLate: [
    "SENT MÅL! {player} slår till i slutminuterna! {score}!",
    "DRAMATIK! {player} avgör sent — {score}!",
    "I SISTA STUND! {player} ser till att det inte slutar här! {score}!",
    "Klockan tickar men {player} bryr sig inte! Sent mål — {score}!",
    "DRAMATIK I SLUTFASEN! {player} med ett mål som publiken sent glömmer! {score}!",
  ],
  goalExtend: [
    "{player} utökar ledningen! {score} — nu är det kontroll!",
    "MÅÅÅL! {player} gör det bekvämt för {team}! {score}!",
    "{team} drar ifrån! {player} med {score}!",
  ],

  cornerGoal: [
    "MÅÅÅL DIREKT PÅ HÖRNA! {player} slår in bollen i perfekt kurva! {score}!",
    "HÖRNMÅL! {player} styr in vid främre stolpen! Vass hörna! {score}!",
    "MÅÅÅL! Hörnan slås in hårt, {player} är framme och styr — {score}!",
    "HÖRNVARIANT SOM SLUTAR I MÅL! {player} var fri på bakvakten! {score}!",
    "Insvängd hörna — INNE! {player} styr in den med pinnen! {score}!",
    "MÅÅÅL! Hörnan drillar in i det långt bortre hörnet. {score}!",
    "{team} utnyttjar hörnhörnan perfekt — {player} avslutar kallt. {score}!",
    "HÖRNMÅL! En av bandyns magiska stunder — {player} med en match att minnas! {score}!",
  ],

  save: [
    "{goalkeeper} räddar med vadden! Vilken reflex!",
    "Utanför! {goalkeeper} klockar ut — strålande räddning!",
    "NEJ! {goalkeeper} var i vägen! {team} slipper ifrån!",
    "{goalkeeper} sträcker ut och räddar vid stolpen. Fantastiskt!",
    "Räddning! {goalkeeper} kastar sig åt rätt håll. Han har läst skottet.",
    "Skottet stoppas! {goalkeeper} är helt koncentrerad i dag.",
    "Strålande insats av {goalkeeper} — höll {team} kvar i matchen där!",
    "Jätteräddning! {goalkeeper} hindrar säkert mål. Publikens favorit i dag.",
    "{goalkeeper} med reflexräddningen! Det gick fort som ett ögonblick.",
    "Bollen bränner i kassen — men {goalkeeper} var framme. Klockren teknik.",
  ],

  miss: [
    "Utanför! Bollen far över ribban. Bra chans förstörd.",
    "Skott — vid sidan om. {team} gnider sina händer.",
    "Avslutet gick precis utanför. Centimetrar från mål.",
    "Stolpe! Bollen studsar ut. {team} hade tur.",
    "Inte tillräckligt nördigt placerat — målvakten plockar upp.",
    "Avslut — upp i ribban! Frustrerade ansikten på {team}.",
    "Bollen seglar högt och brett. Inte spelarens bästa dag.",
    "Nära — men inte tillräckligt! Ribban vibrerar men tavlan står stilla.",
  ],

  suspension: [
    "{player} får 10 minuter för sen tackling! {team} spelar med 10 man.",
    "Utvisning! Domaren pekar mot bänken — {player} av isen i 10 minuter.",
    "Sen foul av {player} — ut med honom! {opponent} spelar i numerärt överläge.",
    "{player} protesterar men domaren är bestämd. Tio minuter utanför.",
    "Hårt ingripande — {player} skickas av med utvisning. Kritiskt läge för {team}.",
    "Domaren hade inget val. {player} fick inte bollen — utvisning.",
    "Klippen kostar {team} — {player} tar en lång paus på bänken.",
    "Utvisning! Läktaren reagerar. {team} måste försvara sig de nästa minuterna.",
  ],

  corner: [
    "Hörna till {team}. Slås in hårt — rensas av försvaret.",
    "Hörna för {team}. Bollen kurvar in men målvakten boxar ut den i sista stund.",
    "Hörna till {team}. Kort variant — tillbaka till hörnläggaren som skjuter! Utanför.",
    "{team} får hörna. Hård insvingare framför mål — rensning av {opponent}.",
    "Hörna {team}. Insvingad direkt mot mål — stolpe! Nära att sitta.",
    "Ny hörna till {team}. Kort uppspel, passning tillbaka, skott! Blockerat.",
    "{team} tar hörna. Bollen snurrar in mot bortre stolpen men seglar över.",
    "Hörna till {team}. Spelarna trängs framför målet — domaren blåser för regelbrott.",
    "{team} tar hörna. Bollen slås lågt och hårt — avvärjd av ett ben i sista sekunden.",
    "Hörna för {team}. Tredje hörnan på kort tid — trycket börjar märkas.",
    "{team} med ännu en hörna. De styr spelet nu.",
    "Hörna. Insvingad mot mitten — {opponent}s försvar reder ut det.",
  ],

  powerPlayGood: [
    "{team} utnyttjar numerärt överläge — trycker framåt nu.",
    "5 mot 4! {team} styr spelet men {opponent} försvarar järnhårt.",
    "Utvisningen skapar utrymme — {team} cirklar runt för det rätta läget.",
    "{team} söker det avgörande målet. {opponent} försvarar på knä.",
    "Powerplay för {team}! De har bra hörnspel i numerärt överläge.",
  ],

  neutral: [
    "Bollen rullas runt i mittfältet. Båda lagen söker öppningar.",
    "{team} bygger upp spelet tålmodigt bakifrån.",
    "Högt tempo just nu — bollen far snabbt fram och tillbaka.",
    "Fint spel av {team}, men {opponent} ligger bra i sin defensiv.",
    "Mittfältsstrid. Ingen vill ge bort bollen.",
    "{team} håller bollen, söker kanterna.",
    "Intensivt mittfältsspel. Det är tätt här.",
    "Snabb bana i dag — bollen studsar länge.",
    "{opponent} pressar högt och {team} stressas.",
    "{team} byter om och spelar bakåt för att hitta ett nytt angreppssätt.",
    "Spelet flödar fram och tillbaka utan att något konkret uppstår.",
    "Snyggt kombinationsspel av {team} — men {opponent} är välorganiserat.",
    "Tränarna på båda bänkar ger instruktioner. Taktiken justeras.",
    "{team} vinner bollen i mittfältet och drar igång ett anfall.",
    "Lång boll bakåt — {team} startar om.",
    "Nästan! En bra rörelse av {team}, men bollen fastnar.",
    "Matchen flödar. Spelet är öppet och snabbt.",
    "Båda lagen vill framåt — spelet är intensivt i dag.",
    "En stund av lugn innan nästa storm. {team} samlar sig.",
    "Spelarna verkar spara lite på krafterna — ingen vill ta en onödig risk.",
    "{team} spelar tillbaka till målvakten som håller i bollen och ger laget andrum.",
    "Friläge — men skottet gick rakt på målvakten. Chansen förstörd.",
    "Domaren blåser för hands. {team} tappar initiativet.",
    "Publiken suckar. Spelet har tappat tempo de senaste minuterna.",
    "Klockan tickar. Båda lagen verkar nöjda med att vänta ut varandra.",
    "En lång boll, ett offside — spelet börjar om från målgårdsavstamp.",
    "Bollen studsar oberäkneligt. Ingen kan styra spelet just nu.",
    "{team} byter om och letar efter ett hål i {opponent}s välorganiserade försvar.",
    "Halvchans för {team} — men för svagt placerat för att hota på riktigt.",
  ],

  yellowCard: [
    "Gult kort till {player} efter en hård foul. Varning.",
    "Domaren visar gult mot {player} — tredje gången hen protesterar.",
    "Gult kort! {player} av {team} måste se upp nu.",
    "Varningskort till {player}. Nästa foul kan kosta mer.",
  ],

  weather_heavySnow: [
    "Snön faller ymnigt nu — bollen försvinner i virvlarna.",
    "Svårt att se tio meter framåt i det här snöfallet.",
    "Spelarna skrapar is under skridskorna — snön lägger sig snabbt.",
    "Bollen saktar in i snön. Teknikerna har det svårt ikväll.",
    "En plogbil borde egentligen köra in på planen just nu.",
    "Vintermagi — eller vinterkaos. Beror på vem du frågar.",
  ],
  weather_thaw: [
    "Isen är seg och blöt — varje passning dör lite för tidigt.",
    "Bollen fastnar i slush. Det här är inte bandyväder.",
    "Töväder gör spelet trögt — fysiska lag har fördel.",
    "Vatten sprutar vid varje skridskoslag. Isen lider.",
    "Blidväder i mars — spelarnas värsta mardröm.",
    "Tekniska spelare kämpar — bollen lyder inte på den här isen.",
  ],
  weather_cold: [
    "Minus tjugo och andedräkten syns som dimma. Kort passningsspel dominerar.",
    "Kylan biter. Spelarna klappar händerna under avbrottet.",
    "Perfekt kyla för perfekt is — bollen flyger som en kula.",
    "De som klarat uppvärmningen är redan vinnare i den här kylan.",
    "Publiken kurar under filtar. Men de är här. Respekt.",
  ],
  weather_fog: [
    "Dimman ligger tät — publiken kan knappt se bortre målet.",
    "Spöklik stämning. Spelarna dyker upp ur dimman som skuggor.",
    "Sikten är begränsad — långa passningar blir lotteri.",
    "Dimman sväljer ljudet. Man hör bara skridskor och klubbor.",
  ],
  weather_clear: [
    "Stjärnklart och knivskarpt. Perfekt bandyväder.",
    "Flodljusen lyser upp en iskall, klar kväll. Isen glittrar.",
    "Kyligt och klart — precis som det ska vara.",
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
    "SLUTSPELSMATCH! Intensiteten är en annan nu. Allt står på spel.",
    "Det luktar slutspel. Spelarna är fokuserade, publiken elektrisk.",
    "Playoffbandy — här finns inga andra chanser. Varje mål räknas dubbelt.",
  ],

  final_kickoff: [
    "SM-FINALEN! Det här är vad alla har väntat på. Hela Sverige tittar.",
    "Domaren blåser igång SM-finalen! Vilken stämning!",
    "Det största ögonblicket i svensk bandy. SM-final. Avspark!",
  ],

  final_goal: [
    "MÅÅÅL I SM-FINALEN! {player} skriver historia! {score}!",
    "SM-GULD NÄRMAR SIG! {player} med ett avgörande mål! {score}!",
    "FINALMÅL! {player}! Publiken exploderar! {score}!",
  ],

  final_fullTime_win: [
    "SLUTSIGNAL! {team} ÄR SVENSKA MÄSTARE! Vilken säsong! {score}!",
    "DET ÄR GULD! {team} tar SM-guldet! Spelarna kastar sig på isen! {score}!",
    "SVENSKA MÄSTARE {season}! {team} har gjort det! {score}!",
  ],

  final_fullTime_loss: [
    "Slutsignal. {opponent} tar guldet. En tung förlust, men en stark säsong.",
    "Det räckte inte hela vägen. {opponent} är svenska mästare. {score}.",
  ],

  playoff_general: [
    "Slutspelstempot är något helt annat. Varje duell är på liv och död.",
    "Playoffbandy. Hårdare tacklingar, mer intensitet, högre insatser.",
    "Det märks att det är slutspel. Spelarna ger allt de har.",
  ],

  derby_kickoff: [
    "DERBY! {rivalry}! Det kribblar på läktarna. Den här matchen betyder mer än tre poäng.",
    "DERBYDAGS! {team} mot {opponent} — {rivalry}. Rivalerna möts igen!",
    "{rivalry} är igång! Publiken har väntat på det här länge.",
    "Det är derby ikväll! {team} mot {opponent}. Stämningen är elektrisk!",
    "Avspark i {rivalry}! Spelarna har väntat på den här matchen hela säsongen.",
  ],

  derby_goal: [
    "DERBYMÅL! {player} spränger nätet! {rivalry} har fått sitt första mål! {score}!",
    "MÅÅÅL I DERBYT! {player}! Publiken kokar! {score}!",
    "{player} med derbymålet! {team}-fansen exploderar! {score}!",
  ],

  derby_suspension: [
    "Utvisning i derbyt! {player} gick för hårt in. Hetsen tar över!",
    "Domaren hade inget val — derby-intensiteten resulterade i utvisning för {player}.",
    "Det är för hett! {player} får sitta av. Typiskt derbytempo.",
  ],

  derby_neutral: [
    "Derbyintensiteten märks i varje duell. Ingen ger en centimeter.",
    "Publiken lever. Det här är vad {rivalry} handlar om.",
    "Stämningen går inte att ta miste på. Derby i varje fiber.",
    "Hårda men rättvisa dueller. Spelarna vill verkligen vinna det här.",
    "Derbytempot gör att misstagen blir fler — men också chanserna.",
  ],

  derby_fullTime: [
    "Slutsignal i {rivalry}! {score}. En match som kommer att diskuteras länge.",
    "{rivalry} är över för den här gången. {score}. Återstår att se vem som skrattar sist.",
  ],

  cornerVariant: [
    "HÖRNAVARIANTEN SITTER! Kort uppspel, vägg, skott — inne!",
    "Ny lösning på hörnan — och den fungerar! {player} styr in!",
    "De övade på den hela veckan! Kort hörna, fint uppspel, MÅL!",
    "Direkt variant på hörnan! {player} var ensam framför mål! {score}!",
  ],

  secondHalf: [
    "Andra halvlek börjar. Isen bär spår av 45 intensiva minuter.",
    "Tillbaka efter paus. Isen har förändrats — tyngre att spela nu.",
    "Spelarna möter en annorlunda is den här halvleken.",
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
    'Det blir förlängning! Benen är tunga men viljan stark.',
    'Oavgjort efter ordinarie tid — nu avgörs allt i förlängningen.',
  ],

  overtimeGoal: [
    'MÅÅÅL I FÖRLÄNGNINGEN! {player} kan ha avgjort det! {score}!',
    'DÄR SITTER DEN! {player} i förlängningen! {score}!',
    'STRAFFVINNAREN! {player} slår till i förlängningen! {score}!',
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
    'Det blir straffar! Nerverna är på yttersta spetsen.',
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
