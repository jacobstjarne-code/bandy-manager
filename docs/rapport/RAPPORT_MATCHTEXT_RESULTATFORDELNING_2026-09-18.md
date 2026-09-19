# Audit 2 — matchkommentarer och resultatfördelning

Datum: 2026-09-18. Granskare: Codex.

Uppföljning: åtgärder och nya prov redovisas i [RAPPORT_AUDIT_ATGARDER_2026-09-19.md](RAPPORT_AUDIT_ATGARDER_2026-09-19.md). Fynden nedan är den ursprungliga före-mätningen. Referensen och toleranserna har därefter låsts i uppföljningen.

## Dom

**Ja, kommentarsflödet behöver mer arbete — men inte enbart fler texter.** Det finns reproducerade sanningsfel och händelser vars beskrivningar skrivs över. Rotationsskyddet är också ofullständigt.

**Ja, resultatfördelningen är värd en egen kontroll.** Ett målsnitt på 9,08 kan samexistera med nästan dubbelt så stor andel matcher med minst 15 mål som i spelets sexsäsongsreferens. Detta är en mätbar avvikelse, men ännu inte ett bevis för vilken motorkonstant som är fel. Referensperiod, lagstyrkor och simuleringstyp spelar roll.

Ingen produktkod eller svensk spelcopy ändrades i denna audit. Motorarbetet som pågick parallellt har inte skrivits över.

## Underlag

Fryst arbetskopia med bas-HEAD `843613cecb0e93b44b017c512575bebb43cb90ef`, inklusive dåvarande ocommittade ändringar. Inte ett releasegodkännande av en ren commit. Arbetsrepot hade senare avancerat till `71be084c`; dessa senare ändringar ingår **inte** i siffrorna nedan.

1. Befintligt kommentarsprov: 1 000 matcher som orientering. Det har ett enda lagpar, lämnar spelarinteraktioner olösta, för inte över matchProfile och seedar inte traittexternas Math.random. Därför används det inte som slutlig kalibreringsmätning.
2. Utökat kommentarsprov: **2 400 matcher, 147 866 textrader, 21 885 målhändelser**. Tolv världar × fem kontexter × 40 matchfrön. Serie, verkliga rivalpar, cupkvartsfinal, cupfinal och inomhusmatch med snö utanför. Alla lag kommer från spelet. Fullt kommentarsläge, automatisk upplösning för båda lagen; inga olösta användarval. Matchprofil förs mellan halvlekar. Även traittexternas globala slump seedas.
3. Resultatprov: **3 168 seriematcher per simuleringsläge**, 24 världar med spelets faktiska dubbelmöten och bästa tillgängliga elva. Snabbläge respektive fullt kommentarsläge. Ett lika stort känslighetsprov använder hashade matchfrön.
4. Karriärprov: **12 karriärer × 3 säsonger**, 36/36 avslutade, **5 998 matcher**, inga krascher eller rapporterade invariantbrott. **4 751 loggade seriematcher** används för fördelningsjämförelsen.
5. **35/35** befintliga riktade text-/flödestester gröna. De täcker inte de nya kombinationerna nedan.

Råresultat: [kommentarer](audit-2026-09-18/match-depth.json), [fördelningar, histogram, exakta resultat och känslighetsprov](audit-2026-09-18/score-distribution.json), [karriärlogg](audit-2026-09-18/career-run.log). Källkontrollsummor finns i [match-input-sha256.txt](audit-2026-09-18/match-input-sha256.txt).

Detta är motorns genererade flöde och dess presentationskoppling, inte 2 400 manuellt genomspelade livevyer. Interaktiva hörn-/straffval, pausändringar, återupptagning och varje legend-/klackbåge är inte fullständigt genomspelade här.

## M1 — P1: halvtid och atmosfär skriver över händelsens text

I provet fick **358 målrader** en halvtidsbeskrivning. Exempel: regular, seed 700004, minut 45, ställning 4–0:

> Halvtid! Det har varit en intensiv halvlek. 4–0.

Steget innehåller samtidigt ett mål. Vyn ger det MÅL-etikett, men visar meningen ovan utan målskytt. Samma halvtidsproblem hittades för **156 utvisningsrader**. Ytterligare **406 räddningssteg** fick någon av de snävt kontrollerade halvtids-, situations- eller speakerraderna; detta är inte ett uttömmande mått på alla felaktiga räddningstexter.

**Rotorsak:** i `matchCore.ts` väljs `step === 30` före mål-/räddnings-/utvisningsgrenarna. Dessutom skyddar vissa efterföljande situations-/publiköverskrivningar mål och utvisning men inte räddning. I `MatchLiveScreen.tsx` sätts etiketten från eventtypen; `deriveEventText.ts` litar sedan på all icke-tom commentary och kommer aldrig till händelsens korrekta description.

**Rätt åtgärd:** separera händelserad från halvtids-/atmosfärrad. En markör får inte ersätta mål eller utvisning. Regressionstest ska kontrollera både event, text, etikett och ordning för mål/utvisning/räddning precis vid halvtid. Detta är inte löst genom att skriva en bättre halvtidsmening.

## M2 — P2: textpooler påstår ett matchläge som inte gäller

Följande är reproducerade texttillfällen, inte antal unika matcher:

- **431** ”första mål” i derby trots att mål redan gjorts. Seed 701003: ”Upplandsderbyt har fått sitt första mål! 3–1!” Poolen derby_goal används för alla mål utan separat premiärmålsgate.
- **143 av 480 cupkvartsfinaler** fick cupfinalpåstående. Seed 702002, avslag: ”Cupfinal. Alla ögon på Forsbacka.” Kontextinjektionen kontrollerar bara isCup före context_cup_final.
- **35** vunna kvartsfinaler lovade ”Kvarten väntar.” cup_fullTime_win känner inte nästa omgång.
- **40** kvartsfinalinledningar säger ”Oktober”. Cupens andra omgång ligger i augusti enligt cupService:s matchdagsschema.
- **29** rader säger ”Ingen vill släppa in det första målet” efter att ställningen redan blivit 1–0 eller 0–1. Situationen tight tillåter totalt ett mål, men texten kräver noll.

**Rätt åtgärd:** texturvalet behöver uttrycklig tävlingsfas, nästa omgång, faktisk målsumma och kalenderkontext. Generiska varianter får användas när data saknas; inga falska konkreta påståenden. Skriv inte om alla rader till vag text som permanent ersättning för tillståndskopplingen.

## M3 — P2: snö påstås påverka spelet inne i hallen

Med hallInomhus=true och utomhusväder HeavySnow fångades **591 snö-/isrelaterade kandidater** i 480 matcher. Inte alla regexträffar är automatiskt fel; följande konkreta exempel är däremot tydliga:

- Seed 704000, minut 9: ”I snökaoset hittar Jonas Mattsson en springa!”
- Samma match, minut 21: ”Ur snöyran kommer Hedlund och bollen ligger där.”

**Rotorsak:** vissa vädergrenar är hallgatade, men vädervalen i hörnmålsgrenen och senare generiska målgrenar saknar samma skydd. WeatherService lämnar kvar weather.condition även för hallar och ändrar isQuality; därmed kan denna indata uppstå och föras in i livekontexten. Frågan är inte bara ett omöjligt syntetiskt testfall.

Samla hall-/utomhusvillkoret så att det gäller samtliga mål- och atmosfärpooler. Mätningen är inte en separat revision av hallens mekaniska vädereffekter.

## M4 — P2: text beskriver skott som inte finns i statistiken

Det utökade provet hittade **6 879 hörnrader** med konkreta skott-/avslutspåståenden utan ökning av skotträknaren, samt **1 348** av den exakta neutralraden:

> Friläge! Men avslutet går rakt på målvakten. Vilken chans.

Den senare har varken skottökning eller räddningsevent; exempel regular, seed 700004, minut 2, 0–0.

**Rotorsak:** neutrala poolen innehåller egna matchhändelser, och corner_miss väljer ett beskrivande utfall utan att alla sådana utfall motsvaras av motorstatistik. Det tidigare provets bredare regex gav liknande signaler, men siffrorna ovan kommer från det nya provet utan olösta interaktioner.

**Beslut som behövs:** ska motorn verkligen ha modellerat ett skott/räddning här, eller är det bara atmosfär? Rätta den ägande mekaniken eller använd text som är sann om det faktiskt modellerade utfallet. **Lägg inte till skottstatistik enbart för att legitimera en slumpmässigt vald text.**

## M5 — P2/P3: rotationsminnet fungerar inte som ett säkert repetitionsskydd

Mätning:

- **19** identiska texter direkt efter varandra.
- **556** upprepningar inom de senaste sex textraderna: cirka **0,38 procent** av alla rader.
- **2 399 av 2 400 matcher** återanvände minst en exakt rad någon gång under matchen.
- Neutralpoolen har 29 rader, missad hörna 10 och derbymål 3. Den vanligaste exakta generiska raden användes 1 787 gånger över 2 400 matcher.

Den sista matchandelen ska inte ensam betraktas som fel: längre matcher återanvänder naturligt vanliga formuleringar. Täta upprepningar och upprepning över spelarens följd av matcher är viktigare.

**Tre kodorsaker:**

1. pickCommentary försöker slumpa om högst arr.length gånger och kan därefter ändå returnera det nyligen använda valet. Kontrollerad RNG som alltid ger noll ger ”ett”, ”ett”, trots fyra alternativ.
2. Historiken använder arrayobjekt som nyckel. powerPlayGood.filter(...) skapar en ny array vid stora marginaler; historiken hittar inte tillbaka till samma pool.
3. Historiken skapas inne i halvsimuleringen. Den följer inte med till andra halvlek eller interaktiv regenerering. Traittexter använder dessutom Math.random utan samma rotationsregister.

**Ordning på rättningen:** stabilt pool-id → faktisk exkludering av nyligen använda alternativ → historia som följer matchen → mät igen → utöka utvalda pooler. Neutral-, hörnmiss-, numerärt överläge- och kontextpooler är rimliga första textuppdrag. Ingen generell dubblering av hela textmassan.

## Namn och stil

Efternamnsförändringen finns och dess två tester är gröna, inklusive efternamnskrock mellan lag. I provets referenser till spelare kopplade till stegets event användes efternamn utan förnamn **31 639 gånger**, fullt namn **9 422 gånger**. Detta är ett riktat strängmått, inte fullständig språklig namntaggning; första mål och namnkonflikter motiverar fullständiga namn.

Den tidigare kritiserade ”Assistenten slog ut den…” är ersatt i assistantFFStrings med den levererade passningsraden. Ingen anledning att globalt ta bort alla förnamn.

Kandidater för separat svensk textputs, efter logikrättningen:

- ”Det här är schack på is.”
- ”Försvaret har glömt var det bor.”
- ”Det är hög underhållning — men någon tränare gråter bakom glaset.”
- ”En stund av lugn innan nästa storm.”
- ”Stämningen är elektrisk.”

Det här är tonbedömningar, inte mekaniska fel. De är generiska/fyndiga på det sätt användaren uttryckligen vill undvika. Ingen ny ersättningscopy har lagts in.

## Resultatfördelning: vad som faktiskt mäts redan

`scripts/calibrate.ts` skriver redan mål-/marginalhistogram, vanliga resultat och andelar över 12/15/17/18 mål mot Bandygrytans herrgrundserie. Så kontrollen saknas **inte** helt.

Men dessa fördelningsmått är utskrifter, inte egna accepterade toleranser som stoppar en körning. De vanliga målen för målsnitt, oavgjort och hemmavinst räcker inte för att godkänna hela formen. Den nya mätningen kompletterar med varians, percentiler, målfattig svans, nollor, exakta resultatmatriser, två simuleringslägen och verkliga karriärförlopp.

### Referensen måste anges

Lokalt underlag: `docs/data/bandygrytan_detailed.json`, hämtat 2026-06-03 enligt filens metadata. **1 124 herrgrundseriematcher**, sex säsonger 2019/20–2025/26; **2023/24 saknas**. Ingen ny webbinsamling gjordes. Kval/slutspel uteslöts, match-id deduplicerades och resultat validerades. Detta är det befintliga referensurvalet, inte ett påstående om fullständig täckning av alla verkliga säsonger.

Historisk elitserie jämförs med spelets fiktiva liga av verkliga klubbar. Lagstyrkornas spridning är inte matchad; en avvikelse identifierar därför inte automatiskt ett fel i målformeln.

### Karriärprovet mot hela referensen

Karriärprovet nedan är ett **diagnostiskt spelprov**, inte den formella kalibreringsgrinden. Det följer 12 karriärer genom tre säsonger med väder, säsongsutveckling, beslut, förändrade trupper och den hanterade klubbens särskilda motståndsurval. Därför kan dess 9,09 % matcher med minst 15 mål vara sant samtidigt som den låsta motorgrinden ger 6,09 %. Motorgrinden är `scripts/audit-score-distribution.ts --assert-gates`: 24 frysta världar, spelets 132 faktiska grundseriefixturer per värld och samma starttrupper/frön i snabb- och liveläge, totalt 3 168 matcher per läge. Det är **6,09 % mot referensens 5,43 %** och **6,06 % med högst fyra mål mot 5,87 %** som gäller för toleransen ±1,5 procentenheter. Kommentarsprovet 12 världar × 5 kontexter × 40 frön mäter textsanning och är inte en resultatfördelningsgrind. Om ett nytt karriärprov fortfarande ligger runt 9 % ska avvikelsen därför utredas som en egen spelarkarriärfråga — motståndsurval, taktik och den egna klubbens styrka — inte som bevis för att ligamotorn missar sin kalibrering.

- **Målsnitt:** spel 9,08; referens 9,12.
- **Oavgjort:** 10,10 %; 11,57 %.
- **Hemmavinst:** 51,55 %; 50,18 %.
- **Minst 12 mål:** 25,26 %; 21,89 %.
- **Minst 15 mål:** 9,09 %; 5,43 %.
- **Minst 20 mål:** 0,72 %; 0,44 %. Få sådana matcher; undvik tvärsäkra slutsatser om denna yttersta svans.
- **Högst 4 mål:** 10,10 %; 5,87 %.
- **Minst en nolla:** 8,48 %; 4,54 %.
- **Ett lag gör minst 10:** 6,15 %; 10,41 %.
- **Segermarginal minst 5:** 23,36 %; 26,42 %.
- **95:e/99:e percentilen totalmål:** spel 16/19; referens 15/17.
- **Varians totalmål:** 14,72; 10,52.

**Tolkning:** spelet är inte bara ”för målrikt”. Det har i denna mätning fler låga och höga totaler, men färre ensidiga tvåsiffriga lagresultat. Att bara sänka alla målchanser vore därför en dåligt underbyggd åtgärd.

### Snabbt respektive fullt kommentarsläge

Med identiska världar, scheman och starttrupper:

- Snabbt: snitt 9,30; minst 15 mål 9,85 %; varians 15,27.
- Full kommentar utan användarinteraktion: snitt 9,37; minst 15 mål 7,73 %; varians 12,53.
- Hashade frön: minst 15 mål 10,45 % snabbt och 9,53 % fullt; varians 15,02 respektive 13,59.

Skillnadens riktning återkommer, men storleken är frökänslig. Det är en uppföljningssignal, inte färdig rotorsaksdiagnos. Lägena förbrukar slump olika och full kommentar är här inte liktydigt med en aktiv spelares val i livevyn. Separera kommentarer från motorns slump innan textpoolers storlek tillåts påverka reproducerade matchförlopp.

### De senaste verkliga säsongerna förändrar tolkningen

2024/25 och 2025/26 omfattar 364 referensmatcher: snitt **10,04**, minst 15 mål **8,79 %**, minst 12 mål **32,42 %**. Det är alltså missvisande att kalla 9,09 % över 15 mål ”orimligt för bandy”. Det avviker från spelets nuvarande samlade referens, men ligger nära just de senare verkliga säsongerna.

Bestäm först om kalibreringsmålet ska vara hela den historiska blandningen, de senaste säsongerna eller en annan uttrycklig målbild. Sätt därefter grindar på flera mått samtidigt, inte enstaka exakta slutresultat.

JSON-underlaget innehåller beskrivande Wilson-intervall per match. Dessa antar oberoende observationer och tar inte hänsyn till lag-/säsongsklustring. Säsongs-/världsvisa resultat redovisas därför också. Formell kalibrering bör använda klusterresampling och en låst valideringsmängd.

### Datakvalitetsnot

Karriärloggen har 4 751 spelade seriematcher och en väderinställd fixtur: seed 8 (loggens nollbaserade id), säsong 1, omgång 3 har fem spelade poster och en post med status `Postponed`. Uppföljningen reproducerade och stängde fyndet; ingen färdigspelad matchpost har tappats. Stressloggens `postponedMatches` redovisar nu inställda fixturer separat, så nästa kontroll kan stämma av hela schemat utan att blanda in ospelade matcher i resultatfördelningen.

## Föreslagen nästa ordning

1. Rätta M1:s händelseprioritet och lägg kombinationstester vid halvtid.
2. Gata M2/M3 på faktisk poängställning, cupfas, kalender och hall.
3. Bestäm ägarskapet för skottbeskrivningar/statistik enligt M4.
4. Laga rotationsmekaniken. Mät om innan beställning av utökad svensk copy.
5. Ge kalibreringsarbetet fördelningsunderlaget och ett explicit referensval; ändra inte målmodellen på målsnittet ensamt.
6. Kör om på gemensam committad kandidat, inklusive interaktiva liveförlopp. Nuvarande körning är **diagnostik på fryst arbetsläge**, inte ersättningen för ett pinnat release-slutprov.

## Reproduktion

- `node_modules/.bin/vite-node scripts/audit-match-depth.ts`
- `node_modules/.bin/vite-node scripts/audit-score-distribution.ts`
- Samma fördelningsskript med `--hashed-seeds` för känslighetsprovet.
- För karriärvarianten: kör `scripts/stress-test.ts --seeds=12 --seasons=3` i isolerad kopia, sedan fördelningsskriptet med `--with-fresh-careers`. Flaggan läser just den nygenererade season_stats-filen.

Kontrollera källhashar och testpolicy vid omkörning. Frön gör inte förändrad kod eller ändrad headless-policy till samma experiment.
