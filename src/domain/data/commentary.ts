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
    "Och det var det! {score}. Spelarna skakar hand efter ett hårt kämpad match.",
  ],

  goal: [
    "MÅÅÅL! {player} sätter en precis avslutning förbi målvakten! {score}!",
    "MÅÅÅL! Strålande avslut av {player} — {team} jublar! {score}!",
    "IN I NÄTET! {player} var på rätt plats i rätt tid. {score}!",
    "LEDNING! {player} slår till! Vilket avslut! {score}!",
    "MÅÅÅL! {player} placerar in det med vänsterpinnen! {score}!",
    "Det sitter! {player} nuddar in bollen vid bortre stolpen. {score}!",
    "MÅÅÅL FÖR {team}! {player} är iskall och sätter dit den! {score}!",
    "{player} dundrar in reducering! Plötsligt liv i matchen! {score}!",
    "KVITTERING! {player}! Helt galet! {score}!",
    "1-0! Första målet faller — {player} öppnar målskyttet för {team}!",
    "MÅÅÅL! Vad en match det har blivit! {player} sätter dit {score}!",
    "{player} tar emot, vänder och skjuter — inget som kan stoppa det! {score}!",
    "Avslut — inne! {player} med ett kontrat avslut. {score}.",
    "MÅÅÅL! {team} exploderar i jubel! {player} med en drömmatch! {score}!",
    "Det händer snabbt i bandy — {player} bryter och sätter dit {score}!",
  ],

  cornerGoal: [
    "MÅÅÅL DIREKT PÅ HÖRNA! {player} slår in bollen i perfekt kurva! {score}!",
    "HÖRNMÅL! {player} styr in vid främre stolpen efter en vasst insvängd hörna! {score}!",
    "MÅÅÅL! Hörnan slås in hårt, {player} är framme och styr — {score}!",
    "HÖRNVARIANT SOM SLUTAR I MÅL! {player} var fri på bakvakten! {score}!",
    "Insvängd hörna — INNE! {player} nickar — nej, styr med pinnen — in! {score}!",
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
    "Hörna till {team}. Slås in hårt — nickas undan av försvaret.",
    "Hörna för {team}. Bollen kurvar in men målvakten boxar ut den i sista stund.",
    "Hörna till {team}. Kort variant — tillbaka till hörnläggaren som skjuter! Utanför.",
    "{team} får hörna. Hög boll in framför mål — rensning av {opponent}.",
    "Hörna {team}. Insvingad direkt mot mål — stolpe! Nära att sitta.",
    "Ny hörna till {team}. Kort uppspel, passning tillbaka, skott! Blockerat.",
    "{team} tar hörna. Bollen snurrar in mot bortre stolpen men seglar över.",
    "Hörna till {team}. Spelarna trängs framför målet — domaren blåser för regelbrott.",
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
    "Bollen är svår att kontrollera i den här kylan.",
    "{team} vinner bollen i mittfältet och drar igång ett anfall.",
    "Lång boll bakåt — {team} startar om.",
    "Nästan! En bra rörelse av {team}, men bollen fastnar.",
    "Matchen flödar. Spelet är öppet och snabbt.",
    "Båda lagen vill framåt — spelet är intensivt i dag.",
    "En stund av lugn innan nästa storm. {team} samlar sig.",
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
}

// Helper to fill in a template
export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`)
}

// Pick a random item from an array deterministically
export function pickCommentary(arr: CommentaryTemplate[], rng: () => number): CommentaryTemplate {
  return arr[Math.floor(rng() * arr.length)]
}
