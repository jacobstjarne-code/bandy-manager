# Bandy Manager — audit av spelglädje, stickiness, systemförståelse och visuell kvalitet

**Datum:** 2026-08-29  
**Granskad källrevision:** `7d9bf8c74d796ff3ed3b1738afa2b9ba266cba6d`  
**Fryst arbetskopia:** `e20174966fad72c4504056c0f4e65fba7a573455af7bbabc5d11d6995e0556cb`  
**Live-sajtens visade deploy-hash vid kontroll:** `5c9a7a8`  
**Viktigt:** live och den senaste lokala revisionen var inte samma revision. Själva långspelet nedan kördes mot en byggd, fryst kopia av den lokala revisionen `7d9bf8c…`, inte mot den äldre live-hashen.

**Testmiljö:** mobil, 390 × 844 px.  
**Byggstatus:** produktionsbygget gick igenom. Design- och innehållsguards gick igenom. 3 185 tester i 313 filer passerade. Testkommandot fick ändå exitkod 1 därför att Vitest inte fick skriva sin cache genom den skrivskyddade `node_modules`-länken i den frysta kopian; inget produkttest misslyckades. Vite varnade för en stor bundle, cirka 2,25 MB / 691 kB gzip.

---

## Kort dom

Bandy Manager är roligt i början och kan bli mycket fängslande när matchdramat, klubbidentiteten och säsongens press råkar haka i varandra. Jag skulle fortsätta efter första timmen. Säsong två var testets starkaste del: cupfinal, fem raka förluster, styrelsepress, räddningsseger och en kvartsfinalserie som gick till fem matcher skapade en riktig berättelse som spelet inte behövde skriva åt mig.

Men i nuvarande skick tappar spelet förtroende snabbare än det tappar innehåll. Tre fel är särskilt skadliga: cupmatcher delas ut som falska SM-guld, cupsegerns huvudscen går inte att lämna och konditions-/laguttagningsloopen kan låsa truppen i ett läge där den rekommenderade elvan fortsätter starta spelare på 0–20 procent. När årsboken dessutom säger att en sparkad tränare "överträffade alla förväntningar" blir spelarens egen historia mindre trovärdig än det som just hände.

Min samlade känsla:

- **Första timmens spelglädje: 8/10.** Platsen, tonen och matchdramat bär.
- **Viljan att spela en säsong till efter säsong 1: 7,5/10.** Jag hade en klubb att bry mig om.
- **Stickiness under säsong 2: 8/10.** Testets bästa emergenta båge.
- **Stickiness efter säsong 3: 5/10.** Repetition, konditionsspiral och minnesfel börjar väga tyngre än nyfikenheten.
- **Systembredd: 8/10. Systemförståelse: 5/10.** Jag ser många system men förstår inte alltid orsak, verkan eller prioritet.
- **Visuell identitet: 8/10. Visuell konsekvens/polish: 6/10.** Stark och egen art direction, men flera tydliga hål och mobilkrockar.
- **Word of mouth:** hög potential. Jag skulle gärna återberätta 0–4-vändningen och annandagsderbyt, men jag skulle inte rekommendera bygget utan reservation förrän förtroendeblockerarna är fixade.

## Vad som faktiskt spelades

Målet var fem hela säsonger i en karriär. Spelet avslutade karriären naturligt efter tre säsonger genom avsked. Det går inte att ta en ny klubb efteråt; alternativen är att se karriären eller börja om. Jag fortsatte därför med en ny Forsbacka-karriär för att testa om omstarten kändes ny och om början höll en andra gång. Den omstarten omfattade onboarding, hela cupen och de tre första ligamatcherna. Jag räknar den **inte** som två påhittade hela säsonger.

### Karriär 1 — Maja Lind, Lesjöfors

- **2026/27:** 4:a, 26 poäng (11–4–7), cupkvartsfinal, slutspelskvartsfinal. Kassa 320 → 571 tkr.
- **2027/28:** 7:a, 21 poäng (8–5–9), cupfinal, slutspelskvartsfinal förlorad i match fem mot Gagnef. Kassa 571 → 545 tkr. Värmestuga byggd.
- **2028/29:** 8:a, 17 poäng (7–3–12), cupkvartsfinal, utslagen 0–3 av Forsbacka. Kassa 545 → 239 tkr. Östra läktaren byggd. Avskedad efter säsongen.

### Karriär 2 — Forsbacka

Ny onboarding, cupkvartsfinal 9–3 mot Slottsbron, semifinal 6–6 med avancemang, cupfinal 4–2 mot Målilla och därefter tre ligamatcher: 4–0, 3–3, 3–1. Omstarten avbröts när cupsegerns dashboardscen visade sig vara permanent återtriggande; Match-fliken gick att använda som tillfällig omväg men Hem förblev låst.

---

## Huvudfråga 1 — är början rolig nog för att få spelaren att fortsätta?

**Ja.** Början är fortfarande spelets bästa försäljningsyta.

Introduktionen etablerar en verklig plats och en särskild sorts klubb innan den ber spelaren optimera siffror. Onboardingen lär dessutom genom handling: välj en elva, sätt hörnroller, spela match. Det är mycket bättre än en manual och passar mobilrytmen.

Den första hela cupmatchen gav testets tydligaste "en match till"-ögonblick. Lesjöfors låg under med 0–4 i halvtid. Ett aggressivt snack, ett sent val att stänga matchen och en vändning till 7–6 blev en berättelse jag fortfarande kan återge utan att öppna Historik. Samma sak hände i ett derby mot Slottsbron: underläge i minut 83, mål i minut 84 och 86, seger 8–7. Det här är kärnan som konkurrenterna har svårt att kopiera: inte bara resultat, utan lokal bandykultur runt resultatet.

Det som hotar början är visuella tomrum och felaktiga löften. Den första stora matchladdningen visar en stor mörk cirkel med en nästan osynlig platshållare för en illustration. `Hoppa över introduktionen` hoppar bara över ankomstscenen och tvingar ändå en återvändande spelare genom lag- och hörnövningarna. Och i den nya karriären förvandlades en cupsemifinal felaktigt till SM-final och SM-guld. Ett så stort fel tidigt gör att spelaren börjar misstro resten.

## Huvudfråga 2 — finns stickiness över flera säsonger?

**Ja, men den kommer mer från emergent matchdrama än från systemens långsiktiga återkoppling.**

Säsong två var starkare än säsong ett, vilket är ett mycket gott tecken. Cupfinalen följdes av fem raka ligaförluster, styrelsen gick från press till ultimatum, en seger räddade hoppet och slutspelet gick till avgörande match fem. Jag ville veta vad som skulle hända. Spelet hade en stigande båge utan att behöva visa ett manus.

Säsong tre höll spänningen genom nedre tabellen och styrelseultimatumet, men spelmotorn började kännas mindre rättvis. Truppen gick in i matcher med extremt låg kondition trots långvarig återhämtningsträning, och `Fyll bästa elvan` fortsatte använda spelare med nästan tomma mätare. När resultaten då försämrades kändes avskedet delvis som en följd av ett trasigt återhämtnings-/rekommendationssystem, inte av mina beslut.

Avskedsvägen var däremot inte en överraskning. UI gick från **Under press** till **Ultimatum** under lång tid. Det är bättre än förut. Men ultimatumet angav bara `Sluta topp 6`, inte en deadline eller ett synligt tålamodsvärde. Efter en återhämtning till åttonde plats och ett slutspel kom avskedet ändå. Game Over var tydlig, men karriären tog slut helt. För en spelare som just har investerat tre säsonger är det en stark anledning att sluta snarare än att börja om.

Efter två till tre säsonger slits framför allt textpoolerna: identiska pressfrågor, identiska akademidebuter och burnout-varningar som inte förändrar situationen. Den nya klubben hade en annan lokaltidning och delvis annan röst, vilket gav viss replay-fräschör, men de centrala mallarna återkom omedelbart.

## Huvudfråga 3 — förstår man vilka system som finns utan att framåtrörelsen dör?

**Man ser bredden, men man förstår inte alltid modellen.**

Systemen fungerar bäst när ett aktivt problem gör dem relevanta. En svår skadekris i slutspelet lämnade tio tillgängliga spelare och öppnade en konkret akademikallelse. Då förstod jag både varför akademin finns och vad den kan göra. Ett personligt sommarmål ledde på samma sätt naturligt till anläggningsbygget. Rivalitet, senaste mötet, derbyhistorik och publiktoppar lärs genom att de påverkar nästa match.

Systemen fungerar sämst när de presenteras som passiv katalog. Klubben har sex flikar, Scouting innehåller en stor lista, och dashboarden hade under säsong tre regelbundet sju till nio uppskjutna beslut samt `Tryck: Hög`. Många hann aldrig ytan innan säsongen nollställdes. Spelaren lär sig då systemens namn, inte deras orsakskedjor. Burnout är ett tydligt exempel: varningen låg kvar i nästan tre säsonger, men det fanns ingen begriplig mätare, återhämtningsplan eller konsekvenskedja jag kunde följa.

Bra produktprincip framåt: **låt system bli synliga när spelaren får ett problem som systemet kan lösa.** Behåll den stora Match-CTA:n och den snabba säsongsrörelsen. Sänk visuell vikt och frekvens på kort som bara säger att ytterligare ett system existerar.

---

# Prioriterade fynd

## BLOCKER 1 — cupsegerns huvudscen går inte att lämna

**Reproducerbarhet:** 1/1 på Forsbackas cupseger; permanent efter omladdning.

**Reproduktion**

1. Vinn cupfinalen.
2. Gå till Hem och öppna cupsegerns scen.
3. Tryck `Pokalen står i klubbhuset →`.
4. Upprepa eller ladda om spelet.

**Förväntat:** scenen markeras som klar och spelaren återgår till nästa del av säsongen.  
**Faktiskt:** varje tryck byter bara Birger-citat. Scenen öppnas omedelbart igen. Omladdning + Fortsätt återvänder till samma scen. Match-fliken är en omväg men Hem förblir låst.

**Säker kodorsak:** `CupFinalVictoryScene` skickar CTA:n korrekt till `completeScene`, men specialgrenen för `cup_final_victory` i `src/presentation/store/actions/gameFlowActions.ts:750` loggar bara citatet. Den lägger aldrig scen-id:t i `shownScenes`, till skillnad från standardgrenen på rad 783. Direkt därefter körs `detectSceneTrigger`. `src/domain/services/sceneTriggerService.ts:107` blockerar scenen endast om `shownScenes` redan innehåller `cup_final_victory`, så den triggas på nytt.

**Rekommenderad fix:** markera båda engångsscenerna `sm_final_victory` och `cup_final_victory` som visade innan nästa triggerdetektion, samtidigt som citatloggen behålls. Lägg ett end-to-end-test som vinner cupfinalen, klickar CTA:n, verifierar dashboard/ligastart och laddar om. Hem ska fortfarande vara fritt.

## CRITICAL 2 — cupsemifinal och cupfinal delas ut som SM-final och SM-guld

**Reproducerbarhet:** bekräftat över två klubbar och tre cupmatcher.

**Reproduktion**

1. Nå cupsemifinal eller cupfinal på neutral plan.
2. Spela matchen och avancera/vinn.

**Förväntat:** Cupsemifinal respektive cupfinal; cupmästare endast efter finalseger.  
**Faktiskt:** livehuvudet visar `SM-FINAL` och segeröverlägget säger `SVENSKA MÄSTARE! Vi vann SM-guld 2026/2027!`. För Lesjöfors inträffade detta redan i semifinalen, trots att nästa match var den riktiga cupfinalen. För Forsbacka hände det i både semifinal och final. Den senare cupscenen kallade korrekt segern `Cupmästare`, så ytorna motsäger varandra.

**Säker kodorsak:** `src/presentation/screens/match/MatchLiveScreen.tsx:145` sätter `isSmFinal = fixture?.isNeutralVenue === true`. Cupens slutmatcher är också neutrala. SM-ceremonin på rad 1779 vinner därefter över cupceremonin, som uttryckligen kräver `!isSmFinal` på rad 1763.

**Rekommenderad fix:** härled SM-final från `!fixture.isCup` plus faktisk finalmedlemskap i playoff-bracket/finaldag. Neutral plan är en egenskap, inte en tävlingstyp. Lägg regressionsfall för cupsemifinal och cupfinal, inklusive vinst, förlust, oavgjort avancemang och straffar. Ingen cupmatch får rendera SM-ceremoni.

## CRITICAL 3 — kondition, återhämtning och rekommenderad elva bildar en dödsspiral

**Reproducerbarhet:** återkommande under alla tre Lesjöfors-säsongerna och synlig tidigt även med Forsbacka.

**Reproduktion**

1. Spela tätt matchprogram och använd `Fyll bästa elvan`.
2. Byt träning till Vila/Återhämtning när konditionen faller.
3. Fortsätt genom cup + liga och över en sommar.
4. Granska startelvan och eftermatchanalysen.

**Förväntat:** rekommendationen roterar bort utmattade spelare när alternativ finns, återhämtning ger en begriplig förbättring och sommaren återställer truppen till rimlig matchberedskap.  
**Faktiskt:** säsong två inleddes kring 40 procent trots offseason. Under matcherna valdes upprepade gånger spelare på 0–34 procent, flera på 0–3. Eftermatchen flaggade dem som `Startade trött`. Vila låg kvar som träningsval genom flera år men laget föll ändå till 4–15 procent och fyra till sex skador, inklusive två 33-veckorsskador. Forsbackas första ligamatch gav också flera startspelare på 23–37 procent.

**Sannolik kodorsak:** `src/presentation/utils/lineupNudge.ts:42–79` prioriterar spelare över ett golv på 22, men fyller alltid från gruppen under golvet om färre än elva finns. Startare tappar 15–25 konditionspoäng per match, multiplicerat av taktik/väder/position, i `src/application/useCases/processors/playerStateProcessor.ts:170–180`. Bänk får bara +5 och vilande spelare återhämtar sig under ett `seasonForm`-tak. Med tunn trupp och tätt schema kan alla hamna under golvet, varpå autofyllnaden fortsätter reproducera samma startare. Träningsåterhämtning och periodisering finns, men den observerade nettoloopen blev negativ över säsongs- och sommargränser.

**Rekommenderad fix:** gör ett simulerat uthållighetstest med 18–20-mannatrupp över cup + 22 ligaomgångar. Sätt ett produktkrav, till exempel att normal rotation + Vila inte får lämna majoriteten under 25 procent. Autofyllnaden bör varna och föreslå akademikallelse/formation eller kräva bekräftelse när den måste använda spelare under golvet. Visa dessutom prognosen `efter nästa match / tillgänglig igen` så att spelaren kan förstå återhämtningen.

## HIGH 4 — årsboken motsäger avskedet och de faktiska styrelsekraven

**Reproducerbarhet:** säsong två och tre i samma karriär.

**Reproduktion**

1. Få ett synligt styrelsekrav `Sluta topp 6`.
2. Sluta sjua/åtta, gå genom årsboken och bli senare avskedad.
3. Öppna Historik.

**Förväntat:** årsdom, styrelsekrav och Game Over kan ha olika ton men måste beskriva samma fakta.  
**Faktiskt:** säsong tre säger att Lesjöfors på åttonde plats `överträffade alla förväntningar` och att styrelsen bara väntade sig mittentabell. Game Over säger att avskedet kom efter ihållande besvikelser. Säsong två kallades också över förväntan trots det synliga topp 6-målet.

**Sannolik kodorsak:** `src/domain/services/seasonSummaryService.ts:468–473` dömer mot `seasonStartBoardExpectation`, en grov enum som `MidTable`, medan portalens konkreta säsongsmål/ultimatum och avskedslogik lever i andra fält och boardPatience. Kodkommentaren visar att årsdom och löpande styrelserelation avsiktligt är separata axlar, men copy gör ingen sådan distinktion för spelaren.

**Rekommenderad fix:** en gemensam sanningsmodell för tre saker: säsongens uttalade mål, utfallet och relationens slutläge. Årsboken kan skriva: `Ni missade topp 6 med två placeringar. Tidigare resultat gav fortfarande visst förtroende.` Game Over ska länka samma snapshot. Testa hela kedjan, inte tre separata komponenter.

## HIGH 5 — match-/omgångsnumren beskriver olika verkligheter

**Reproducerbarhet:** återkommande i liga, slutspel och årsbok.

**Faktiskt observerat:** ett derby kallades Omgång 4 i portalen men `OMG 8` live. Annandagen kallades Omgång 10 respektive `OMG 14`. Årsboken visade derby Omgång 8, annandagen 14, simulation 26 och offseason 33. En slutspelsmatch visades som Omgång 28.

**Förväntat:** tävling och fas anges begripligt: `Liga · omgång 4`, `Cup · semifinal`, `Kvartsfinal · match 5`.  
**Sannolik kodorsak:** ytorna blandar tävlingsspecifik `roundNumber` med global kalenderordning `matchday`. Nyare årsbokskod har medvetet standardiserats på `matchday`, men för spelaren är en global intern matchdag inte samma sak som en begriplig omgång.

**Rekommenderad fix:** behåll `matchday` för sortering men rendera ett separat, tävlingsspecifikt label-objekt. Förbjud råa heltal i UI. Snapshot-testa portal, live, rapport och årsbok för samma fixture.

## HIGH 6 — årsbokens beslutsminne missar säsongens verkliga beslut

**Reproducerbarhet:** båda färdiga årsböckerna före avskedet.

**Faktiskt:** säsong ett innehöll heltidskontrakt och kaptensmöte; säsong två innehöll Värmestuga, fabrikskris, kaptensval, mecenatkonflikt och cup-/slutspelsbåge. Båda fick `Inget beslut stack ut i vintras.`

**Kodobservation:** rankningen i `src/domain/services/seasonDecisionCaptureService.ts:327` är numera klokt ordnad efter namngiven person, irreversibilitet och spänning före systemantal och pengar. Det observerade problemet tyder därför främst på att de beslut som spelaren möter inte fångas som kandidater, snarare än att vinnaren rankas fel.

**Rekommenderad fix:** instrumentera varje löst DecisionCard med beslutskandidat eller uttryckligen dokumenterad exkludering. Säsongstest: bygg en anläggning, välj sida i en personkonflikt och betala en kostnad; årsboken måste välja en av dem och återge både handling och pris.

## HIGH 7 — press och event upprepar sig eller saknar matchkontext

**Reproducerbarhet:** hög över säsong två och tre.

**Observerat:** samma supporterbesvikelse och formfrågor återkom många gånger. Exakt ekonomifråga kom i två raka slutspelsmatcher. `Derby vinner man med hjärtat` dök upp efter icke-derby. `Att förlora hemma` erbjöds efter bortaförlust. Cupens utslagsmatch summerades med `En poäng som känns`/`tog två poäng`. Efter playoffeliminering lovade teasern ännu en match mot samma motståndare.

**Rekommenderad fix:** separera eligibility från textval. Varje mall bör deklarera tävling, hemma/borta, fas, resultatslag och cooldown. Kör kontrakttester som genererar 1 000 matchkontexter och förbjud semantiskt omöjliga kombinationer. Lägg en per-säsong-cooldown för hela frågefamiljer, inte bara exakt rad.

## HIGH 8 — akademidebuten återanvänds tills den slutar betyda något

**Reproducerbarhet:** fyra eller fler gånger under säsong tre; återkom i nya karriären.

**Faktiskt:** samma struktur `I debuten mot X. Minut Y. 17 år gammal... mest hungrige på träning i två år` återkom flera gånger, ibland i nära anslutning. I Forsbacka användes samma akademispråk om en 21-åring.

**Sannolik kodorsak:** `src/application/useCases/processors/youthProcessor.ts:155–185` tillåter alla spelare upp till 21 år med högst tre registrerade matcher. Event-id:t innehåller både spelare och `nextMatchday`, vilket gör samma spelare berättigad på nytt nästa omgång om statistikvillkoret fortfarande håller. `break` begränsar bara till ett event per omgång.

**Rekommenderad fix:** permanent `breakthroughShownPlayerIds` eller ett spelarbaserat event-id utan matchdag. Kräv verklig första seniormatch + första mål, och skilj akademiprodukt från ung extern spelare. Gör copy unik för debut, första mål och etablering.

## HIGH 9 — skadad-spela-vidare-kort kan visa en frisk spelare

**Observerat:** flera gånger stod `Felix Skog · Frisk` eller `Ole Ekgren · Frisk` över texten `Han vill spela... jag säger att det inte gör det`, med valen Spelar/Vilar. Ett kort kom efter säsongsslut när ingen match fanns.

**Kodobservation:** generatorn i `src/application/useCases/processors/eventProcessor.ts:569–611` filtrerar korrekt på `isInjured` och kommande match. Det talar för att ett redan köat event renderas efter att spelarens tillstånd hunnit ändras eller efter att kalendern passerat dess fixture.

**Rekommenderad fix:** validera eventets precondition igen vid render/resolution och kasta eller konvertera inaktuella events. Fryst eventcopy får gärna säga `hade 4 dagar kvar när doktorn frågade`, men handlingen får inte tillämpas på frisk spelare.

## HIGH 10 — burnout blir permanent bakgrundsbrus

**Reproducerbarhet:** från säsong ett, omgång fyra, till avskedet efter säsong tre.

**Faktiskt:** `Maja Lind är trött` låg kvar genom återhämtningsträning, somrar och flera val. Textvarianterna upprepades. Det gick inte att läsa ett mått, se en återhämtningsplan eller koppla ett senare utfall till ett tidigare val. `Låt assistenten ta pressen` stoppade ibland nästa press, ibland tycktes pressen redan ligga kvar i kön.

**Rekommenderad fix:** gör burnout till en båge med början, eskalering, konkret mekanisk kostnad, aktiv återhämtning och slut. Visa kvalitativ nivå och orsak (`hög efter 5 pressveckor i rad`). Om tillståndet inte förändras under en hel säsong ska texten inte fortsätta presenteras som en ny händelse.

## HIGH 11 — bredden blir en skuldhög på dashboarden

**Observerat:** sju till nio uppskjutna beslut, `Tryck: Hög`, samtidigt som match-CTA:n driver tiden vidare. Många beslut försvann vid säsongsövergång utan att jag såg dem.

**Förväntat:** brådskande val bryter framåtrörelsen; övriga system väntar begripligt eller arkiveras med konsekvens.  
**Rekommenderad fix:** tre nivåer i stället för en kö: `måste före nästa match`, `denna månad`, `bakgrund`. Visa högst ett primärt och ett batchat sekundärt kort. Vid rollover ska obesvarade händelser antingen få ett dokumenterat defaultutfall eller uttryckligen sägas ha runnit ut.

## HIGH 12 — ekonomin börjar kosta men ger sällan smärtsamma val

**Observerat:** kassan gick +251 tkr, −26 tkr och −306 tkr över de tre säsongerna. En läktare för 180 tkr gjorde faktiskt skillnad och slutkassan 239 tkr kändes inte oändlig. Men de flesta löpande val hade en dominant sida: stöd spelarna gav moral utan tydlig kostnad, sponsor gav fri inkomst, golf kostade bara 6 tkr, julmarknad 15 tkr gav stor nytta och fri entré gav +25 community direkt.

**Dom:** ekonomin är inte längre kosmetisk, men den skapar ännu sällan ett val där båda alternativen svider.

**Rekommenderad fix:** färre men större åtaganden med framtida följder: femårig drift, förlorad sponsor, löneprecedens, publikpris kontra kassa. Visa kostnaden över tid, inte bara engångsbeloppet.

## MEDIUM 13 — anläggningsbygge saknar trygg commit och begriplig tid

**Faktiskt:** val av finansieringskälla startade bygget direkt utan slutlig bekräftelse. `8 omgångar`/`12 omgångar` räknade globala cup- och kalendersteg, så Värmestugan blev färdig ungefär vid ligaomgång fem.

**Rekommenderad fix:** sammanfattningssheet med `Bygg`, `Årlig drift`, relationseffekt och förväntat datum. Rendera datum eller `efter cirka 5 ligamatcher`, inte intern matchdag.

## MEDIUM 14 — `Hoppa över introduktionen` hoppar inte över onboardingen

**Reproduktion:** starta en andra karriär och välj `Hoppa över introduktionen`.  
**Faktiskt:** ankomstscenen försvinner, men laguppställning och hörnroller måste göras igen.  
**Fix:** döp om till `Hoppa över ankomsten` eller låt återvändande spelare välja `Snabbstart` som skapar en giltig rekommenderad elva och hörnuppställning.

## MEDIUM 15 — sponsorernas motbud återställer förhandlingen

**Observerat:** jag krävde 60 tkr på ett erbjudande om 45. Granska visade valet som löst, men nästa dashboard gav samma ursprungliga 45-tkr-erbjudande igen. Först ett senare accepterande avslutade det.

**Fix:** motbud måste landa i accepterat, nekat eller ett nytt explicit belopp. Samma event får inte återställas med samma text.

## MEDIUM 16 — kontrakt löper ut utan att spelet prioriterar varningen

Sommaren berättade att Gabrielsson och Hellström lämnat därför att ingen ringde i tid. Samtidigt hade dashboarden en stor beslutskö men inget kontraktsärende som faktiskt trängde igenom.

**Fix:** kontraktsdeadline är en blockerande eller tidsmärkt uppgift, inte ett vanligt brus-kort. Om auto-default används ska portalen visa `2 kontrakt löper ut om 3 omgångar`.

---

# Visuell granskning, mobil 390 × 844

## Det visuella som fungerar mycket bra

- **Identiteten är egen.** Mörkt läder, ljust papper, dämpade färger och varm orange accent känns som bandy, bygdegård och protokoll snarare än generiskt sportspel.
- **Matchvyn är immersiv.** Ledger-/protokollkänslan, typografin och halvtidsmodalen ger matchen fysisk tyngd.
- **Tabellen är utmärkt på mobil.** Brytlinjer, formprickar och hierarki är lätta att skanna utan att sidan känns som ett kalkylblad.
- **Slutspelsintroduktionen är föredömlig.** 4 mot 5 och bäst av fem förstås direkt.
- **Annandagen känns särskild.** Publik och kontext förstärker eventet: 884 jämfört med 303 i närliggande match säsong ett, 1 046 säsong två och 1 719 med fri entré säsong tre.
- **Årsboken är en belöning.** Den är visuellt stark och ger ett emotionellt stopp mellan säsonger, även när dess data/copy behöver rättas.
- **Sommaren har en fungerande temperaturkurva.** Svalt läder, ljusare pappersblock och en varmare framåtrörelse-CTA ger faserna olika ton.
- **Längre kafferumsscener fungerar.** När flera personer och repliker finns är hierarkin vacker och läsbar.
- **Game Over och Historik är tydliga.** Problemet är sanningen i texten, inte den visuella presentationen.

## Visuella inkonsekvenser och fel

### HIGH — den första matchillustrationen är i praktiken tom

`src/presentation/screens/scenes/IllustrationScene.tsx` renderar bokstavligen `illustration på väg`. På mobil blir resultatet en stor mörk cirkel med nästan osynligt innehåll i ett ögonblick som ska bygga förväntan.

**Fix:** leverera en riktig illustration eller ta bort bildytan tills den finns. Ett medvetet typografiskt helskärmsögonblick är bättre än en uppenbar placeholder.

### HIGH — kort kafferumsscen blir nästan helt tom

En kort `I DETTA ÖGONBLICK · Kafferummet`-scen visade titel och knapp men repliken var visuellt osynlig. Det reproducerades i den nya Forsbacka-karriären. Längre kafferumsscen fungerade.

**Fix:** testfixture för 1, 2 och 4 repliker på 390 × 844. En ensam replik måste få primär typografisk vikt och inte kunna döljas av kontrast/layout.

### HIGH — fast CTA krockar med innehåll längst ned

Dashboardens primära matchknapp ligger över status och beslutstryck på den lilla viewporten. Det förstärker känslan att systeminformation finns men inte är läsbar.

**Fix:** reservera faktisk safe-area-höjd i scrollcontainern och snapshot-testa kortaste/största enheter med nio köade beslut.

### MEDIUM — Orten-volontärer går horisontellt sönder

Namn klipps eller flyter ihop. Använd två-radslistor eller wrap med konsekvent avstånd; inte en horisontell rad som antar mer bredd.

### MEDIUM — skottkartan överlappar etiketter nära målet

Täta skottpunkter och etiketter blir oläsliga. Klustra eller visa detaljer vid tryck; behåll översikten ren.

### MEDIUM — årsbokens guld-pill överlappar ram/text

`SÄSONGENS MATCH`-etiketten kolliderar visuellt med kortets övre kant. Lägg etiketten i dokumentflödet eller reservera höjd.

### MEDIUM — språk och facktermer läcker

`forward`, `goalkeeper`, `leader`, `veteran`, `Press low`, `18 mål, 0 ass`, `CA` och `4 veckar` förekom. Detta bryter den annars mycket konsekventa svenska rösten.

### MEDIUM — alla klubbar tappar svårighetsinformationen

Föreslagna klubbar visar svårighet, men hela 12-klubbslistan och detaljvyn gör det inte. Det gör ett viktigt karriärval mindre begripligt just när spelaren vill jämföra.

### LOW — övriga polishfynd

- Byggnoder kan märkas `Möjlig` trots att inget nytt bygge får startas förrän nästa säsong.
- Träningshjälpen säger dra, medan onboardingen lär tryck-välj.
- Sponsorjämförelse avrundar till `1k — mer än Holms 1k`.
- Portal, landslagstoast, kafferum och dialog kan staplas direkt efter simulering.
- Många DecisionCards har samma höjd och visuella vikt. Konsolideringen ser sammanhållen ut, men dramatisk hierarki försvinner när allt är samma sorts kort.
- `Kommentar — Följ utan stopp` stannar ändå för halvtid.
- `HL1/HL2` och tidslinjens 15/30/60 för en 90-minutersmatch förklaras inte.
- Ett supporterbrev från `Högbo Bruk` dök upp i Lesjöfors-karriären.
- `2 raka mot X` är oklart: segrar eller möten?
- Årsbokens toppbetyg visade nio matcher trots långt fler framträdanden; sannolikt bara betygsatta matcher, men UI förklarar inte det.

## Har appen blivit likriktad?

Inte helt. Hierarkin finns kvar i de stora växlingarna: ankomst, match, halvtid, slutspel, sommar, årsbok och Game Over har tydligt olika temperatur och rytm. Det är där appen fortfarande känns som en sammanhängande berättelse.

Hierarkin försvinner inne i dashboardens beslutsflöde. När press, sponsor, akademi, skada, burnout och orten använder samma skal och nästan samma höjd uppfattas de som likvärdiga administrativa kort. `DecisionCard`-konsolideringen har skapat konsekvens men inte tillräckligt med semantiska nivåer. Lösningen är inte sex nya handgjorda komponenter; det är 2–3 tydliga lägen i samma system: lågmäld notis, verkligt dilemma och dramatisk brytpunkt.

---

# Vad jag älskade, hatade och blev uttråkad av

## Älskade

- 0–4 till 7–6 i cupen. Spelets bästa argument i en enda match.
- Att annandagen faktiskt gav en annan publik och annan laddning.
- Rivalitetsminnet: senaste mötet, nemesis och derbyhistorik skapar klubbidentitet.
- Säsong tvås organiska båge från cupfinal via kris till avgörande slutspelsmatch.
- Akademikallelsen när truppen verkligen bara hade tio spelare. Systemet blev begripligt därför att jag behövde det.
- Småstadsspråket, kassörens ton och känslan av att klubbens problem också är ortens problem.
- Årsboken som ritual, även när den berättade fel saker.

## Hatade

- Att `Fyll bästa elvan` valde 0-procentsspelare och sedan eftermatchen kritiserade mig för att de startade trötta.
- Falska SM-guld. Det är spelets största möjliga utmärkelse och får aldrig vara opålitlig.
- Att Hem fastnade permanent efter en cupseger.
- Att Historik sa att jag överträffat förväntningarna samtidigt som Game Over sa att jag sparkats för misslyckanden.
- Att avskedet raderade karriärens framåtrörelse. Ingen ny klubb, inget jobberbjudande, bara omstart.

## Blev uttråkad av

- Nästan identiska presskonferenser.
- Akademitränaren som sade samma sak om ännu en debutant.
- Burnout-varningen som låg kvar utan en båge jag kunde påverka.
- Små val där ett alternativ var uppenbart gratis/bättre.
- Playoffcopy som återanvände samma `en match till` även när serien var slut.

---

# Rekommenderad produktordning

## 1. Återställ förtroendet före mer innehåll

Fixa cup/SM-klassningen, cupscenens loop, konditionsspiralen och den gemensamma sanningen mellan styrelsemål, årsbok och Game Over. Dessa fel gör allt nytt innehåll mindre värdefullt eftersom spelaren inte längre tror på utfallet.

## 2. Gör orsak och verkan synlig

Visa varför truppen inte återhämtar sig, vad burnout faktiskt gör, när styrelsens ultimatum mäts och när ett beslut får senare kostnad. Spelaren behöver inte se formler, men måste kunna säga: `Jag valde X, därför kostade Y mig Z två månader senare.`

## 3. Redigera ned repetitionen

Färre event med bättre eligibility och längre cooldown slår fler mallar. Pensionera debutscenen per spelare, filtrera press efter faktisk matchkontext och sluta presentera ett oförändrat tillstånd som en ny händelse.

## 4. Låt bredden uppstå ur behov

Fortsätt med akademikrisen och anläggningsmålet som modell. Skjut undan passiv katalogisering. Ett nytt system bör antingen lösa ett aktuellt problem, skapa ett verkligt dilemma eller vänta.

## 5. Gör misslyckande till fortsatt karriär, inte raderad karriär

Efter avsked: erbjud 1–3 klubbar utifrån rykte, en period utan jobb eller ett val att avsluta. Det gör nederlag till innehåll och ökar stickiness dramatiskt. Nu är avskedet en slutknapp på spelarens investering.

## 6. Behåll det visuella språket men återinför dramatisk hierarki

Designsystemet är en tillgång. Behåll komponentkonsistensen men ge korten semantiska nivåer. Fixa tomma illustrationer, mobilöverlapp och språkspill innan fler ytor läggs till.

---

# Föreslagen regressionstest-suite

## A. Kritisk tävlingsidentitet

1. Cupsemifinal på neutral plan: aldrig `SM-FINAL`, aldrig SM-ceremoni.
2. Cupfinal vinst/förlust/straffar: korrekt cupceremoni och cupmästare endast vid vinst.
3. SM-final: korrekt SM-ceremoni och ingen cupcopy.
4. CTA efter cupseger: lämnar scenen, håller efter reload och Hem visar nästa fas.

## B. Fem-säsongers uthållighet

1. Kör deterministiskt 5 säsonger med en 18-, 20- och 24-mannatrupp.
2. Spela kompetent med rekommenderad elva och normalt byte mellan träningstyper.
3. Mät median/10:e percentil kondition före varje match, antal starter under 22 procent, skador och antal tillgängliga spelare.
4. Krav: ingen stabil negativ spiral med Vila; offseason måste ge begriplig återställning; autofyllnad får inte välja under golvet utan varning.

## C. Sanning genom hela säsongen

1. Frys uttalat styrelsemål vid säsongsstart.
2. Testa exakt på, en plats över och en plats under målet.
3. Jämför portal, inboxdom, årsbok, Historik och Game Over ord för ord på faktan.
4. Separera `säsongen bedömd` från `relationen efter meritminne`, men låt copy förklara skillnaden.

## D. Tävlingsetiketter och kalender

Samma fixture renderas i portal, lineup, live, rapport, Granska, årsbok och Historik. Förväntade labels är tävlingsspecifika. Inga interna `matchday`-nummer får visas som ligaomgång utan label.

## E. Event-preconditions

1. Akademigenombrott högst en gång per spelare och endast för kvalificerad akademispelare.
2. Skadad-spela-vidare försvinner när spelaren blir frisk eller fixture passerar.
3. Pressmallar matris-testas för hemma/borta, derby/inte derby, liga/cup/slutspel, vinst/oavgjort/förlust och utslagen/vidare.
4. Burnout-event har start, cooldown, eskalering och avslut.
5. Kontrakt med deadline prioriteras före den löper ut.

## F. Årsbokens minne

Lös under en testsäsong minst tre val: personkonflikt, anläggning med stor kostnad och ett irreversibelt spelarbeslut. Verifiera att ett faktiskt kvalificerat val väljs, att meningen säger vad spelaren gjorde och vad det kostade, samt att `Inget beslut stack ut` bara används när kandidatlistan verkligen är tom.

## G. Mobil visuell suite

Snapshot + interaktion på 320 × 568, 390 × 844 och 430 × 932 för:

- dashboard med 0, 2 och 9 köade beslut,
- enradig och flerradig kafferumsscen,
- första matchladdningen,
- tabell med nedflyttnings- och slutspelslinjer,
- Orten med långa namn,
- skottkarta med täta punkter,
- årsbok med lång klubb/spelarnamn,
- cup- och SM-ceremonier,
- systemfontstorlek +200 procent och svenska textlängder.

## H. Replay och karriärfortsättning

1. `Hoppa över introduktionen` gör exakt vad labeln lovar.
2. Ny klubb har korrekt lokal journalist, supporterort och rivalitet.
3. Avsked leder till definierad fortsättning eller uttryckligt karriärslut.
4. Ny karriär får inte ärva pressvar, scenstatus eller cupstate från gammal save.

---

# Slutbedömning

Bandy Manager har redan den svåraste delen: en ton och en värld som går att älska. Jag minns matcherna, människorna och annandagen. Det är mer värdefullt än ytterligare ett stort featuresystem.

Det som håller spelet tillbaka är inte brist på bredd utan brist på redaktionell och kausal skärpa. För många system talar samtidigt, några upprepar sig och de viktigaste sanningsytorna kan motsäga varandra. När det fungerar känns spelet som en liten svensk klubbvärld där varje vinter blir en berättelse. När det inte fungerar känns det som en kö av välskrivna kort ovanpå en simulation man inte kan lita på.

Prioriteringen bör därför vara: **sanning först, orsak/verkan därefter, mindre repetition, sedan mer innehåll.** Om de fyra förtroendeblockerarna löses och avsked blir början på nästa karriärkapitel i stället för slutet, finns det en verkligt stark och berättbar spelkärna här.
