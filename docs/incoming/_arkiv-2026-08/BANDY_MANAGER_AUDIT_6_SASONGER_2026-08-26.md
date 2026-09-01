# Bandy Manager — speltest och audit över sex säsonger

**Datum:** 2026-08-26  
**Viewport:** 390 × 844 px, mobilbredd under hela genomspelningen  
**Deployhash på live:** `5c9a7a8`  
**Testad kod:** `5c9a7a8` plus den lokala arbetskopian från 2026-08-26  
**Fingerprint för testad snapshot:** `9b9238e5513dbafc712676d7625ad5e7cff5a9ea`

## Kort dom

Bandy Manager har blivit märkbart bättre på **misslyckande**: jag spelade Lesjöfors normalt, utan sabotage, fick en begriplig eskalering från *Stabilt* till *Under press* och *Ultimatum*, och blev sparkad efter en tredje svag säsong. Avskedet kändes orsakat av mina resultat, inte slumpmässigt.

Det stora kvarvarande problemet är den motsatta kurvan. Med Forsbacka vann jag serien tre år i rad, tog två raka SM-guld och ökade kassan från 450 tkr till 2,3 mkr. Trötthet, skador, burnout och kostnader syntes, men stoppade mig inte. Vid tredje framgångsåret var spelet fortfarande trivsamt och lokalt — men inte längre spänt. Jag fortsatte främst för att mäta spelet, inte för att jag behövde veta vad som skulle hända.

Min sammanfattning som spelare:

- **Första säsongens dragningskraft:** stark. Orten, personerna och de små besluten ger spelet identitet.
- **Misslyckandekurvan:** nu trovärdig och förvarnad.
- **Framgångskurvan:** fortfarande för lätt, för rik och för repetitiv.
- **Tilliten till berättelsen:** skadas allvarligt av felaktiga styrelsekrav, kontraktsår, derbyrepliker och årsboksdomar.
- **Sexsäsongs-stickiness:** otillräcklig. Spelet har mycket innehåll men för lite verklig förändring i makt, ekonomi och vardagsrytm.

## Vad som faktiskt spelades

Testet omfattade sex avslutade säsonger fördelade på två karriärer. Det gick inte att göra alla sex i samma karriär eftersom Lesjöfors-karriären slutade med avsked efter säsong tre och spelet inte erbjuder en ny klubb efteråt.

### Karriär A — Lesjöfors, MEDEL

- **2026/27:** 7:a, 21 poäng, 10–1–11. Kvartsfinal, förlust 0–3. Cupomgång 1. Ekonomi 340 → 54 tkr.
- **2027/28:** 7:a, 21 poäng, 9–3–10. Kvartsfinal, förlust 0–3. Cupsemifinal. Ekonomi 54 → −318 tkr.
- **2028/29:** 9:a, 14 poäng, 5–4–13. Missade slutspel. Sparkad inför 2029/30.

### Karriär B — Forsbacka, LÄTT

- **2026/27:** 1:a, 38 poäng, 18–2–2. SM-silver och cupsilver. Ekonomi 450 tkr → 1,0 mkr.
- **2027/28:** 1:a, 38 poäng, 18–2–2. SM-guld och cupsemifinal. Ekonomi 1,0 → 1,6 mkr.
- **2028/29:** 1:a, 42 poäng, 20–2–0. SM-guld och cupsemifinal. Ekonomi 1,6 → 2,3 mkr.

I Forsbackas tredje år blev slutspelet 3–0 i kvartsfinal, 3–0 i semifinal och 5–4 mot Västanfors i finalen.

De första tolv ligamatcherna per framgångssäsong spelades via spelets snabbläge. Resterande liga spelades med den synliga funktionen **Simulera resterande säsong**. Hela slutspelet spelades match för match i snabbläge. Fullt matchläge försöktes i två separata karriärer men blockerades i halvtid; se Critical 1.

## Blocker

### B1. Den aktuella arbetskopian går inte att produktionsbygga

**Reproducerbarhet:** 1/1.

**Steg:** Kör projektets produktionsbygge mot den testade snapshoten.

**Förväntat:** Bygget slutförs.

**Faktiskt:** TypeScript stoppar på en oanvänd import: `safeStandingPosition`.

**Sannolik kodorsak:** `src/domain/services/opponentAnalysisService.ts:6` importerar funktionen utan att använda den.

**Rekommenderad fix:** Ta bort importen eller återinför den avsedda användningen. Lägg byggkommandot som obligatorisk CI-gate. Detta är en liten kodfix men en blockerande releaseegenskap.

## Critical

### C1. Full match går inte att fortsätta efter halvtid i mobilbredd

**Reproducerbarhet:** 2/2, i två separata karriärer och på två separata lokala origins.

**Steg:**

1. Sätt viewport till 390 × 844.
2. Starta en match i **Full**.
3. Snabbspola till halvtid.
4. Välj ett paussnack.
5. Tryck **ANDRA HALVLEK →**.

**Förväntat:** Halvtidsmodalen stängs och andra halvlek börjar.

**Faktiskt:** Trycket registreras visuellt men matchen ligger kvar i halvtid. Även **PAUSSNACK →**, *Stäng*, omladdning och tillfällig desktopbredd lämnade matchen blockerad. Enda praktiska vägen vidare var att överge sparningen/originen och spela snabbläge.

**Sannolik kodorsak:** Halvtidsmodalen ligger på `--z-modal` (300), medan matchens peek-dock och fångstyta ligger på 400/399 och block-docken på 500. Den högre docken kan fånga input ovanpå modalens CTA. Matchskärmen bygger dessutom en synlig **PAUSSNACK →**-stamp med en avsiktlig tom `onClick`, under antagandet att modalens lager alltid täcker den.

**Rekommenderad fix:** När `showHalftime` är sant ska samtliga docks stängas och göras `pointer-events: none`; alternativt ska halvtidsmodalen ligga på interaktionslagrets högsta nivå. Ta bort den döda stamp-CTA:n. Lägg ett riktigt 390 × 844-test som spelar från avslag, väljer paussnack och verifierar att minut 46 nås.

## High

### H1. Årsbok och historik bedömer säsongen mot fel styrelsekrav

**Reproducerbarhet:** flera säsonger i båda karriärerna.

**Exempel:**

- Lesjöfors hade synligt mål **Sluta topp 6**, men 7:e plats beskrevs som bättre än förväntad mittentabell.
- Säsongen jag blev sparkad efter 9:e plats skrev historiken att placeringen *uppfyller styrelsens krav på att hålla mittentabellen*.
- Forsbackas onboarding visade topp 6, medan årsbok/sommar bedömde samma säsong mot *vinna ligan*.
- Årsbok 2028/29 skrev: *Förstaplatsen överträffade det de bad om., men ett uppdrag missades.*

**Förväntat:** Samma frysta mål ska användas i dashboard, styrelsevarning, säsongsdom, årsbok och historik.

**Faktiskt:** Ytorna berättar olika sanningar. I värsta fallet säger historiken att kravet uppfylldes samtidigt som samma resultat utlöste avsked.

**Sannolik kodorsak:** `seasonEndProcessor` stegar klubbens `boardExpectation` för nästa säsong innan `generateSeasonSummary` körs. `seasonEndGameView` får `clubsAfterLicense`, och sammanfattningen läser därefter klubbens redan muterade förväntan. Nästa säsongs krav bedömer alltså den avslutade säsongen.

**Rekommenderad fix:** Frys `seasonStartBoardExpectation` i säsongsstarts-snapshoten och låt alla retrospektiva ytor läsa exakt det fältet. Generera sammanfattningen före förväntansstegringen eller skicka en explicit avslutad-säsong-förväntan. Regressionstesta hela kedjan mål → resultat → patience → avsked → årsbok → historik.

### H2. Framgångsekonomin blir fortfarande irrelevant

**Reproducerbarhet:** 3/3 Forsbacka-säsonger.

**Sett i UI:** Kassan växte 450 tkr → 1,0 mkr → 1,6 mkr → 2,3 mkr. Enskilda matcher kunde ge +113, +192 och +195 tkr. Val på 5–20 tkr slutade snabbt att kännas som val. Jag kunde kontraktera en spelare med 91 i förmåga för 10 tkr/mån utan att känna risk.

**Förväntat:** Senast när kassan passerar två miljoner ska löner, drift, anläggningar och styrelsen skapa val där båda alternativen kostar något viktigt.

**Faktiskt:** Jag såg inget beslut år tre där båda alternativen sved. Det fanns kostnader i loggen, men de förändrade inte beteendet. Ett koddefinierat investeringskrav finns vid 2 mkr, men det visades inte under testets observerade säsong och dess evaluator kan inte bli sämre än `active` så länge kassan är över taket.

**Rekommenderad fix:** Mät faktisk investering, inte bara saldo. Låt framgång skapa återkommande lönebud, agentkrav, truppstatus, drift och styrelsekrav som konkurrerar med varandra. Kalibrera mot en accepterad 8-årskurva där en dominant klubb inte kan ackumulera pengar utan minst ett minnesvärt avstående per säsong.

### H3. Utmattning och burnout syns men förändrar inte framgångskurvan

**Reproducerbarhet:** tydlig i alla tre Forsbacka-säsonger.

**Sett i UI:** Startspelare låg ofta på 0–10 kondition; i finalen startade fyra spelare trötta på 22–34 procent. Granska beskrev *tunga ben* och individuella utfall. Managerns burnout-repliker eskalerade och lättnadsval återkom.

**Faktiskt spelutfall:** Forsbacka vann ändå 18–2–2, 18–2–2 och 20–2–0 samt två SM-guld. Burnout-citaten började upprepas och blev tapet snarare än ett hot.

**Rekommenderad fix:** Gör trötthet bindande genom fler skador, sämre beslutsinformation, taktisk felmarginal och krav på rotation. Ge burnout ett tydligt före/efter-kvitto och en faktisk återhämtningskurva. Spelaren ska kunna koppla en missad rekommendation eller ett dåligt resultat till sin tidigare prioritering.

### H4. Innehållspoolerna känns tömda redan efter två säsonger

**Reproducerbarhet:** hög.

**Sett:**

- `[Opus]` syntes varje sommar.
- Samma Anna Hedlund-reportage om Ludvig Nieminen dök upp flera gånger under Forsbacka-karriären, inklusive i två raka slutspelsmatcher.
- Samma Birger-uppladdning till finalen användes i två raka finaler.
- Samma burnout-, akademi- och kafferumsrader återkom.
- Efterklang visade bland annat *omg 0* och *Relation Relation*.

**Kodbelägg:** Journalist-eventets kommentar lovar *once per season per player*, men dedupen söker bara samma `roundPlayed`; event-ID saknar dessutom säsong. Den väljer alltid lagets högst rankade friska spelare, vilket förstärker repetitionen.

**Rekommenderad fix:** Inför semantiska content-ID:n med karriär- och säsongscooldown. För journalistreportaget: högst en gång per säsong totalt och inte samma spelare igen förrän poolen har roterat. Gör ett automatiskt 6-årstest som räknar exakta och semantiskt likvärdiga repetitioner. Releasebygget ska också förbjuda synliga `[Opus]`.

### H5. Presskonferensen erbjuder falska derbyrepliker

**Reproducerbarhet:** minst tre gånger.

**Steg/exempel:** Vinn eller spela oavgjort i en icke-derbymatch, inklusive SM-final Forsbacka–Västanfors. Öppna presskonferensen.

**Förväntat:** Endast repliker vars premiss är sann för matchen.

**Faktiskt:** **Derby vinner man med hjärtat...** erbjöds efter en derby-oavgjord, en vanlig 6–2-seger och SM-finalen. I finalen var den felaktiga repliken dessutom bäst belönad, +8 moral.

**Sannolik kodorsak:** Frågor om ekonomi och publik inkluderar `cl07` i `preferIds`. `buildPressResponses` tar preferred-ID:n utan att kontrollera deras `TAG_DEFS.matches(ctx)`, så den annars korrekta derby-gaten kringgås.

**Rekommenderad fix:** Filtrera även `preferIds` genom `matchesContext`, med ett uttryckligt undantag endast för verkligt topic-specifika svar. Lägg matristest för derby/icke-derby × vinst/oavgjort/förlust × cup/final.

### H6. SM-guldets CTA lovar en ceremoni som inte kommer

**Reproducerbarhet:** 2/2 SM-guld.

**Steg:** Vinn SM-finalen i snabbläge. Tryck **Fortsätt till ceremonin →**.

**Förväntat:** Pokallyft, medalj/lagbild eller annan separat ceremoniell payoff.

**Faktiskt:** Spelet gick direkt till den generiska övergången *Sommaren kommer*. Segerscenen före knappen var stark, men knapptexten skapade en utlovad andra akt som saknades.

**Sannolik kodorsak:** Snabbläget använder `SMFinalVictoryScene`; dess CTA anropar bara `completeScene`. Den riktiga `CeremonySmFinal` är inkopplad i fullmatchskärmen, inte i scenflödet.

**Rekommenderad fix:** Återanvänd samma ceremoni i båda matchlägena, eller döp CTA:n ärligt till **Fortsätt till sommaren**. Best-in-class-valet är att behålla löftet och bygga den gemensamma payoffen.

### H7. Delningsknappen kan fastna utan återhämtning

**Reproducerbarhet:** 1/1 testad årsbok.

**Steg:** Tryck **Dela din säsong** i mobil årsbok.

**Förväntat:** Native share, nedladdning eller ett tydligt fel med möjlighet att försöka igen.

**Faktiskt:** Knappen låg kvar på *Genererar bild...* / *Sparar...* i mer än sju sekunder och återgick inte.

**Sannolik kodorsak:** UI:t väntar på `navigator.share()` utan timeout. `setSharing(false)` ligger inte i `finally`, och resultatet `failed/cancelled` ger ingen feedback.

**Rekommenderad fix:** `try/finally`, synlig timeout, tydlig cancelled/failed-state och en explicit **Ladda ner PNG**-fallback. Testa både resolved, rejected, AbortError och en share-promise som aldrig avgörs.

### H8. Kontraktskronologin är inte tillförlitlig

**Reproducerbarhet:** observerad flera gånger.

**Sett:** Magnus Lindberg förlängdes ett år i två olika säsonger, men 2028/29 sade en ny förfrågan att avtalet löpte ut efter säsong 2027. En annan spelare försvann i offseason med *Ingen ringde honom i tid* utan att jag mindes en tydlig föregående varning. En nyvärvad 91-spelare fick pensionsval samma säsong.

**Sannolik kodorsak:** Kontraktsfältet är ett startår men presenteras på flera sätt; request-copy skriver rått `contractUntilSeason`, medan vissa spelarkort visar `+1`. Förlängningen sätter `currentSeason + years`, vilket gör ett ettårsavtal lätt att tolka eller presentera som redan utgånget vid nästa säsong.

**Rekommenderad fix:** Definiera en enda semantik: sista spelbara säsong eller slutdatum. Använd en gemensam formatterare på alla ytor och en invariant som förbjuder aktiva kontrakt med slutår före aktuell säsong. Separera också nyvärvning och omedelbart pensionsbeslut om det inte kommuniceras före signering.

### H9. Årsbokens “säsongens beslut” är inte alltid spelarens minne

**Reproducerbarhet:** 2 tydliga fall.

**Sett:** Forsbackas första år tillskrev årsboken mig beslutet att ge varslade heltidskontrakt, trots att det inte var ett medvetet val jag kunde återkalla från den karriären. År två, med många kontrakt/sponsorer/mecenatbeslut, saknades beslutsraden helt. År tre valdes *Du tog budet på Edvin Norén*; det var inte beslutet jag spontant mindes som säsongens viktigaste.

**Förväntat:** Raden ska vara det val spelaren minns och beskriva kostnaden utan att hitta på attribution.

**Faktiskt:** Rangordningen känns mekanisk eller saknas.

**Rekommenderad fix:** Spara endast explicit bekräftade spelarval med UI-kvitto. Rangordna med en kombination av faktisk ekonomisk effekt, irreversibilitet, namngiven karaktär och spelaren berörda system. Låt spelaren vid årsslut välja mellan de tre högst rankade om algoritmen är osäker.

### H10. Granska kan låsa nästa steg efter slutspelsmatch

**Reproducerbarhet:** 1/1 observerad incident.

**Steg:** Förlora Lesjöfors kvartsfinal samtidigt som ekonomisk kris ligger aktiv.

**Faktiskt:** Granska visade *1 ohanterad händelse*, nästa-knappen var avstängd, men kriskortet hade inga val. Omladdning hoppade i stället vidare till kvartsfinalsammanfattningen.

**Rekommenderad fix:** Varje blockerande review-händelse måste antingen ha ett resolverbart val eller inte räknas som ohanterad. Lägg invariant/test: `unresolvedBlockingCount > 0` innebär minst en synlig enabled action.

## Medium

### M1. “Säsongen är slut” visas före slutspelet

Efter avslutad liga såg även seriesegraren **Säsongen är slut för er del — avsluta säsongen** samtidigt som slutspelet skulle startas. `getNextActionCue` likställer *ingen schemalagd egen fixture just nu* med *säsongen slut*; playoff-fixturerna finns ännu inte. Lägg playofffas/bracketstatus före fixture-gaten.

### M2. Lag som missar slutspel beskrivs som utslaget i kvartsfinal

Lesjöfors som slutade nia fick QF-sammanfattningen **Ni är utslagna. Bra fight.** `managedAdvanced` blir falskt både när laget förlorat en kvartsfinal och när `managedQF` saknas. Skilj `!managedQF` från `managedQF && !managedAdvanced`.

### M3. Tekniska eventnycklar läcker ut till spelaren

Kön visade bland annat `playoffEvent`, `dayJobConflict`, `mecenatInteraction`, `criticalEconomy`, `schoolAssignment`, `bandyLetter` och `contractRequest`. `PortalQueueRail` har bara åtta kända labels och faller annars tillbaka till rå `sourceKey`. Lägg en exhaustiv speltextsmappning och låt okända typer bli en generisk, mänsklig etikett samt telemetri — aldrig rå kod.

### M4. Beslutsbördan säger “Lugn” trots en överfull upplevelse

Forsbacka hade 44–51 inboxnotiser och flera aktiva/köade beslut medan rälsen sade **Beslutsbörda: Lugn**. Även om algoritmen tekniskt mäter något annat blir spelarens tolkning att UI:t förnekar arbetsbördan. Mät obesvarade och nyligen ackumulerade poster, eller döp om måttet till det det faktiskt mäter.

### M5. Ekonomisk räddning kan ske utan begriplig berättelse

Lesjöfors gick från cirka −322 tkr till −35 tkr över sommaren utan att jag kunde härleda varför. Årsbok visar bara start/slut, inte rolloverns räddningsposter. Lägg en offseason-avstämning med varje större post och avsändare.

### M6. Skadeevent kan säga “0 dagar kvar” och samtidigt varna för längre frånvaro

`EventCardInline` skriver rått `injuryDaysRemaining`, även noll. Gata spel-genom-skada-eventet till `> 0` eller skriv *testas i dag* när värdet är noll.

### M7. Personligt mål säger “Halva säsongen kvar” efter säsongsslut

Påminnelsen låg kvar under slutspel/säsongsslut. Texten är hårdkodad för mittsäsong. Gata eventet på kalenderfas och rensa/ersätt det när ligan är färdig.

### M8. Avsked avslutar hela karriären

Efter sparkningen finns bara **Se karriären** och **Ny karriär**. Det är tekniskt konsekvent med nuvarande UI, men det betyder att spelets största konsekvens också avslutar all långsiktig identitet. För ett manager-spel är en klubbmarknad efter avsked en stor stickiness-möjlighet: erbjud 1–3 klubbar utifrån rykte och karriärhistorik, med *avsluta karriären* som eget val.

### M9. Samma finaluppladdning återanvänds ordagrant

Birgers *Det var förra generationens dröm...* kom inför två raka finaler. Finalen behöver karriärminne: revansch efter silver, regerande mästare, tredje raka finalen och dynasti ska inte låta likadant.

### M10. Matchkommentar kan tillskriva målvakten fel lag

I fullmatchförsöket sades att Forsbackas målvakt *höll Rögle kvar i matchen*. Kontrollera att kommentarsmallen härleder lag från eventets `clubId`, inte hemma/borta-antagande eller motståndarnamn.

## Low och polish

- **Språk:** `1 nästa veckan` ska vara *1 nästa vecka* eller hellre *1 beslut i kö*.
- **Årsbok:** `Match av matchen` ska vara *Matchens spelare*.
- **Dubbel interpunktion:** *det de bad om., men...* och tidigare dubbla punkter.
- **Förbättringsaritmetik:** Lesjöfors visade 43 → 52 som +10.
- **Omgångsidentitet:** Årsbokens bästa match och tidslinje använde olika omgångsnummer i ett fall.
- **Assistdata:** toppskyttar med många mål visades som `0 ass`; verifiera om assists saknas i datan eller i summeringen.
- **Efterklang:** `Relation Relation` och *omg 0* behöver formatterings- och nollvärdesvakt.
- **Multislot:** En nystartad karriär kunde i samma flik få varningen *En annan flik har sparat*. Omladdning återställde läget, men varningen var falsk i användarkontexten.
- **Skandalpåstående:** Årsbok skrev *Skandalsäsongen 2027. 2 skandaler...* trots att jag inte såg någon skandal i spel. Detta är observerad UI-claim, inte bevis för att skandalerna inte fanns i state.

## Det som fungerade bra

- Styrelsens varningskedja är den största förbättringen. *Stabilt → Under press → Ultimatum* plus en konkret väg tillbaka gjorde avskedet begripligt.
- Lesjöfors kunde misslyckas utan sabotage. Två 7:e-platser och en 9:e-plats räckte; jag behövde inte tanka matcher.
- Game-over-skärmen är tydlig och värdig. Karriärstatistiken och historiklänken gör att avskedet landar.
- Ekonomisk nedsida finns på riktigt. Lesjöfors kassa blev negativ och sponsor-/kontraktsval kändes mer laddade än med en lätt klubb.
- Sponsorersättningen var ett av testets mer minnesvärda val eftersom en ny relation konkurrerade med en befintlig.
- Granska visar nu trötta startspelare och följder på ett konkret, läsbart sätt.
- Cup- och slutspelsbågarna är enkla att förstå. Vägen från cupsilver och SM-silver till två raka guld gav en verklig sportslig berättelse.
- Finalresultatets språk — *Det var finalen. Ni tog den.* — fungerar mycket bra.
- Orten känns fortfarande specifik: supporterbrev, tifo, buss, skola, mecenat, lokaltidning och kafferum ger Bandy Manager en egen röst.
- Årsboken och karriärhistoriken är visuellt och strukturellt starka. När fakta blir pålitliga kan de bli spelets viktigaste retention- och delningsyta.
- Mobil dashboard har överlag bra hierarki och spelets snabbläge gör långa karriärer praktiskt möjliga.

## Observerat, kodpåstått och inte inträffat

### Observerat i spelar-UI

- Mobil fullmatch blockerades i halvtid två gånger.
- Lesjöfors blev sparkat efter en tydlig varningskedja.
- Forsbacka dominerade tre säsonger och nådde 2,3 mkr.
- Två SM-guld gick från segerscen direkt till sommaren efter en CTA som lovade ceremoni.
- Råa eventnycklar, `[Opus]`, falska derbyrepliker och felaktiga årsboksdomar syntes.

### Koden påstår, men testet bevisade inte i UI

- Ett investeringskrav finns när kassan passerar 2 mkr.
- Löneinflation med rykte och årlig anläggningsdrift finns i ekonomitjänsten.
- Burnout kan undertrycka taktiska rekommendationer och lättnadsval har systemkostnader.
- Journalistkällan har en kort cooldown.

Dessa mekanismer kan finnas och fungera matematiskt utan att vara märkbara för spelaren. Rapportens spelvärdesdom bygger därför inte på deras existens utan på deras upplevda effekt.

### Inträffade inte — men kan inte kallas omöjliga

- Jag såg inte styrelsens investeringskrav efter 2 mkr före säsongsslutet.
- Jag såg inte en sponsor-konflikt som var lika smärtsam i Forsbacka som den ekonomiska krisen i Lesjöfors.
- Jag byggde och avvecklade inte en anläggningsnod i denna genomspelning.
- Jag verifierade inte en fungerande native share; den testade delningen fastnade.
- Jag testade inte fortsatt karriär i ny klubb eftersom UI:t inte erbjuder den vägen.

## Föreslagen regressionstest-suite

### Release gates

1. Produktionsbygget måste vara grönt.
2. Inga synliga strängar får matcha `\[Opus\]`, råa eventtyper eller kända dupliceringar som `Relation Relation`.
3. Alla snapshot-/migrationsvarianter ska klara game invariants.

### Mobil och centrala flöden

1. **390 × 844 fullmatch:** avslag → minut 45 → paussnack → minut 46 → slutsignal → Granska.
2. Kör samma test med Siffror-dock öppen före halvtid och med alla halvtidsflikar/taktikval.
3. Quick, Full, cupfinal och SM-final ska alla nå samma persistenta slutresultat.
4. SM-guld i Quick och Full ska ge samma ceremoniella kedja.
5. Review-invariant: ohanterade blockerare innebär alltid minst en enabled action.

### Sanning och kronologi

1. Frys ett styrelsekrav vid säsongsstart; verifiera samma krav i dashboard, varning, dom, årsbok, historik och game over.
2. Matris för alla förväntansnivåer × placering 1–12 × mästare/inte mästare.
3. Treårsflöde för 1-, 2- och 3-årskontrakt; ingen yta får visa ett förflutet slutår för aktiv spelare.
4. Nyförvärv + pensionsrisk ska antingen avslöjas före signering eller spärras första säsongen.
5. Årsbokens beslut får bara komma från ett explicit resolverat spelarval i samma säsong.

### Sex- och åttasäsongssimulering

Kör minst 50 seedade karriärer per svårighetsgrad och mät:

- sparkningar och föregående varningszon,
- slutplaceringar och mästarspridning,
- kassa, lönekvot och antal val där båda alternativen kostar minst en relevant resurs,
- spelarålder och truppomsättning,
- konditionens korrelation med resultat/skada,
- burnout-nivå, återhämtning och synliga följder,
- antal exakta och semantiskt likvärdiga content-repetitioner,
- antal råa placeholders/eventnycklar,
- årsboks- och historikinvariants.

### Press, kö och delning

1. Pressmatris där varje prefer-ID också måste uppfylla sin state-gate.
2. Varje `GameEventType` måste ha en mänsklig köetikett.
3. Singular/plural för 0, 1 och flera köade beslut.
4. Share: success, cancel, reject, blob-fel och aldrig-resolverande native promise; UI återgår alltid från loading.
5. PNG-generering verifieras med dynamisk höjd och alla optional-rader.

## Rekommenderad ordning

1. **Fixa build och mobil halvtid.** De blockerar release respektive ett centralt spelläge.
2. **Skapa en enda fryst sanning för styrelsekrav och kontraktsår.** Tillit går före mer innehåll.
3. **Gör framgång dyr.** Investering, löner, status och rotation måste skapa smärtsamma avvägningar.
4. **Gör burnout och kondition kausala och begripliga.** Visa vad spelarens tidigare val kostade.
5. **Inför karriär-cooldowns och semantisk dedup.** Två säsonger ska inte tömma berättelsen.
6. **Leverera SM-ceremonin i båda matchlägena.** Framgångens största ögonblick måste få mer, inte mindre, payoff.
7. **Laga delningsvägen och årsbokens fakta.** När sanningen håller har ni en naturlig viral motor.

Den mest kostsamma sanningen från testet är: **spelet kan nu göra förlust begriplig, men det kan ännu inte göra långvarig framgång dyr.** Det är därför den svaga karriären kändes mer levande än dynastin.
