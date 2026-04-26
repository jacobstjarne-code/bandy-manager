# H-fact Backfill — 2026-04-26

## Sammanfattning

- Findings processade: 36
- Hypotesförslag: 97
- Findings utan identifierade hypoteser: 0

## Opus-instruktioner

För varje H-förslag nedan:
- **Behåll** om det är en genuin hypotes som finding presenterar
- **Förkasta** om det är en överöversättning (observation → hypotes)
- **Kombinera** om två förslag är samma hypotes formulerad olika

Kuraterade H-facts skrivs sedan till `docs/findings/hypotheses/` av Code.

## Förslag per finding

### Finding 001 — Halvtidsledning i bandy

**H-förslag 1:**
- Claim: Bandys fria substitution och hörnornas offensiva vikt borde gynna chasande lag (lag som ligger efter)
- Competing: Comebacks är ovanliga (22%) vilket indikerar att dessa mekanismer inte i praktiken gynnar chasande lag tillräckligt för att vända matcherna
- Predicted: Högre comeback-procent än 22% om hypotesen stämmer
- Test: Jämföra comeback-frekvens i bandy mot andra sporttyper med liknande regel-struktur, eller analysera om lag med fler substitutioner/hörnor faktiskt lyckas vända matcher oftare

**H-förslag 2:**
- Claim: Simuleringsmotorns halvtidslogik fungerar korrekt som avsedd
- Competing: Överensstämmelsen mellan motor (77%) och verklighet (78,1%) är slumpmässig eller båda baseras på samma felaktig antagande
- Predicted: Simuleringsmotor och verklig data båda visar ~77-78% halvtidsledning → match
- Test: Testa simuleringsmotorn mot andra matcher-fenomen (inte bara halvtid) för att se om den förutsäger andra observerade mönster korrekt

---

### Finding 002 — Hörnornas värde i bandy

**H-förslag 1:**
- Claim: Regelskillnader mellan bandy och fotboll (ingen försvararbegränsning vid hörna, möjlighet att slå direkt mot mål, variabel slagteknik) förklarar varför hörnor producerar ~25% av målen i bandy
- Competing: Hörnornas höga målproduktion beror på andra faktorer som spelarnas fysiska förutsättningar, bättre bollkontroll generellt, eller att försvarare är mindre organiserade vid hörnor
- Predicted: Hörnor producerar ~25% av målen i bandy (faktor 5 högre än fotboll)
- Test: Jämföra hörnornas målproduktion i ligor med olika hörneregler, eller analysera målfrekvens före/efter regeländringar

**H-förslag 2:**
- Claim: En specialiserad hörnaslagare är ett rationellt val för bandy-lag (inte en lyxlöning) på grund av hörnornas höga målproduktion
- Competing: Hörnaslagare är en kostnadskostnad utan motsvarande målökning, eller målökningen beror på andra faktorer än hörnaslagarens spetskompetenss
- Predicted: Lag med specialiserad hörnaslagare producerar signifikant fler mål från hörnor än lag utan
- Test: Jämföra målfrekvens från hörnor för lag med respektive utan dedicerad hörnaslagare över flera säsonger

**H-förslag 3:**
- Claim: Hörnans utfall påverkas mätbart av spelarens tekniska kapacitet och lagets hörnstrategi (hörnorna är inte ett passivt standardläge)
- Competing: Hörnans utfall är huvudsakligen slumpmässigt eller beror på försvarares tillfälliga positionering snarare än systematisk strategi och teknik
- Predicted: Höga variationer i målfrekvens från hörnor mellan lag, och positiv korrelation mellan hörntraining och målproduktion
- Test: Analysera målfrekvens från hörnor för olika lag, kontrollera för försvarsstyrka, och mät effekten av ändringar i hörnstrategi

---

### Finding 003 — Hemmafördelen i bandy

**H-förslag 1:**
- Claim: En större spelplan (90×65 meter) dämpar hemmalagets press-fördel och ger bortalaget mer utrymme
- Competing: Flygande bytena är den primära faktorn som minskar hemmalagets fördel
- Predicted: Bortalag vinner en större andel matcher i bandy än i fotboll
- Test: Jämför hemmaseger-procent mellan bandy och fotboll, kontrollera om planstorlek korrelerar med reducerad hemmafördelning

**H-förslag 2:**
- Claim: Flygande byten i bandy minskar den konditionsmässiga fördel hemmalaget kan bygga upp
- Competing: Planstorlek är den primära faktorn som förklarar låg hemmafördelning
- Predicted: Trötthet hos bortalag senare i matcher bör vara mindre framträdande i bandy än fotboll
- Test: Analysera målfördelning mellan första och andra halvlek för bortalag, jämför mellan sporten och fotboll

**H-förslag 3:**
- Claim: Lägre genomsnittlig publikstorlek i bandyelitserien reducerar publiktryckets hemmafördelning
- Competing: Planstorlek eller flygande byten förklarar låg hemmafördelning bättre än publikstorlek
- Predicted: Hemmalag vinner en större andel matcher när arenorna är fullsatta
- Test: Korrelera hemmaseger-procent med publikstorlek vid individuella matcher, testa om fullsatta matcher ökar hemmafördelning

---

### Finding 004 — Bandy och mål

**H-förslag 1:**
- Claim: Bandys höga målfrekvens (9,12 mål/match) gör att individuella mål väger mindre statistiskt än i fotboll
- Competing: Högre målfrekvens beror på svagare försvar eller målvaktslek snarare än att målens relativa vikt förändras
- Predicted: Halvtidsledning förklarar 78% av matchutgångar i bandy vs 90%+ i högpoängsporter
- Test: Jämför predictiv kraft för halvtidsledning mellan sportarter med olika målfrekvens; kontrollera för försvarskvalitet

**H-förslag 2:**
- Claim: Bandys målminutfördelning är nästan neutral (54/46 andra/första halvlek) eftersom laget inte 'låser in' ledningar på samma sätt som i fotboll
- Competing: Neutral fördelning beror på att båda lagen har likvärdig energi/tempo hela matchen, snarare än på bytestrategiska faktorer
- Predicted: Målminutfördelning nära 50/50 i andra halva; ingen ökning av mål i slutminuter
- Test: Analysera målminutfördelning stratifierat efter ledningsposition (ledande lag vs förlorande lag); jämför slutminuternas målfrekvens mellan lag med/utan ledning

**H-förslag 3:**
- Claim: Bandys fria byten och högt tempo förklarar varför slutminuter inte är överrepresenterade för målscoring, till skillnad från fotboll
- Competing: Målfördelningen beror på att bandytaktiken inte innefattar defensiv låsning, medan fotbolls låsning är en faktisk strategi
- Predicted: Lagen som leder reducerar inte sitt tempo/anfallsspel i slutminuterna på samma sätt som i fotboll
- Test: Jämför passningsfrekvens, skuttprocent och anfallsintensitet i slutminuter mellan ledande och förlorande lag; kontrastera med fotbolldata

---

### Finding 005 — Mål faller inte jämnt

**H-förslag 1:**
- Claim: Slutminuters-klustret orsakas av desperation-mönster där lag som ligger under tar risker och öppnar upp spelet
- Predicted: Fler mål i båda riktningarna under slutminuterna
- Test: Jämför målfrekvens slutminuterna mellan lag som ligger under vs lag som leder

**H-förslag 2:**
- Claim: Halvtidsgräns-klustret (40-50 min) orsakas av att lag som vill in i halvtid med ledning pressar hårdare, vilket exponerar motståndarna mer
- Competing: Samma press fortsätter efter halvtid när lag vill etablera kontroll tidigt, vilket tillsammans förklarar klustret
- Predicted: 11,8% av alla mål förekommer i minuterna 40-50
- Test: Separera målfrekvensen innan halvtid (40-45 min) från efter halvtid (45-50 min) för att se om pressmönstret skiljer sig åt mellan perioderna

**H-förslag 3:**
- Claim: Bandys fria substitution effektivt motverkar kondition som faktor under matchens mitt, därför finns ingen trötthetsdipp i minut 25-35
- Competing: Minuterna 25-35 är normala av andra skäl än substitutioner (t.ex. matchens naturliga rytm eller taktisk stabilitet)
- Predicted: Ingen signifikant minskning av målfrekvens i minut 25-35 jämfört med omkringliggande perioder
- Test: Jämför målfrekvens och substitutionsmönster i minut 25-35 mot lag med olika substitutionsregler, eller analysera om höga substitutionsfrekvenser korrelerar med frånvaro av trötthetsdipp

---

### Finding 006 — Slutspelet: färre mål, starkare ledningar

**H-förslag 1:**
- Claim: Målminskningen i slutspelet (0,57 mål/match) förklaras av att slutspelslag möts i bättre förberedda matchups med prioriterad defensiv struktur
- Competing: Målminskningen förklaras av att lag utan ledning drar sig tillbaka mindre villigt i slutspelet jämfört med grundserien
- Predicted: 9,12 mål/match i grundserien mot 8,55 i slutspelet
- Test: Analysera försvarsmönster och pressintensitet per match; jämför återhållenhet mellan led och icke-ledande lag i slutspel respektive grundserie

**H-förslag 2:**
- Claim: Högre hållfastighet för halvtidsledningar i slutspelet (85,3% mot 78,1%) förklaras av att ledande lag väljer att låsa matchen istället för att pressa vidare
- Competing: Högre hållfastighet kan förklaras av att slutspelslag generellt är defensivt bättre förberedda och mindre benägna att ta risker
- Predicted: 85,3% hållfastighet i slutspel mot 78,1% i grundserie
- Test: Jämför pressfrekvens och offensiva försök från ledande lag mellan slutspel och grundserie; analysera målchancer förlorat efter halvtid

**H-förslag 3:**
- Claim: Högre målantal i kval/playoff (9,33 mål/match) förklaras av desperationsanfall från underläget lag som skapar öppet spel
- Competing: Högre målantal kan förklaras av att båda lag tar större risker när allt står på spel, oavsett vilken lag som är underläget
- Predicted: 9,33 mål/match i kval/playoff mot 9,12 i grundserien
- Test: Analysera måltyper och tempo; jämför risknivå mellan båda lagens spelstil i kval/playoff kontra andra spelsituationer

---

### Finding 007 — Dam vs herr: lika mål, men olika dynamik

**H-förslag 1:**
- Claim: Större lagstyrke-spridning i damserien förklarar varför halvtidsledningar håller bättre (89,1% vs 78,1%)
- Competing: Halvtidsledningen är starkare i damserien på grund av andra faktorer än spridning, såsom olika taktik, matchkontroll eller spelstil
- Predicted: Om spridning är större i damserien bör topplagens vinstprocent vara högre och bottenlagen ha lägre vinstprocent än motsvarande i herrserien
- Test: Mäta standardavvikelse i lagstyrka/Elo-ranking för varje serie och korrelera med halvtidsledningarnas hållbarhet

**H-förslag 2:**
- Claim: Slagteknik och kraft i hörnexekveringen gör hörnor mindre effektiva i damserien (15,4% vs 22,2%)
- Competing: Hörnornas lägre effektivitet beror på försvarstekniker, position eller taktisk anpassning snarare än exekveringskvalitet
- Predicted: Hörnmål utgör en betydligt mindre andel av totala mål i damserien än herrserien
- Test: Analysera hörnmålens andel av samtliga mål per serie och undersöka exekveringshastighet/placering på hörnor

**H-förslag 3:**
- Claim: Hemmaplansfördelen är svagare i damserien (47,6% hemmaseger) och detta kan vara slumpmässig variation
- Competing: Hemmaplansfördelen är genuint svagare i damserien på grund av faktorer som mindre hemmaorienterad publik, mindre skilda spelförhållanden eller andra strukturella skillnader
- Predicted: Med större urval (>376 matcher) skulle hemmasegerandelen stabilisera sig antingen mot 50% eller visa ett konsistent mönster under 50%
- Test: Öka urvalsstorlek och testa om 47,6% är statistiskt signifikant skilt från 50% eller från herrseriens hemmafördelssiffra

---

### Finding 008 — Klustret 40–50 är jämnt fördelat

**H-förslag 1:**
- Claim: Periodslutet skapar en förhöjd målfrekvens under hela avslutningsfasen (40-50 minuter) snarare än en spike vid en enstaka minut
- Competing: Periodslutet skapar en tydlig spike vid en enstaka minut (t.ex. minut 45)
- Predicted: Jämn fördelning över tioминuterspannet (49,6 vs 50,4 procent) istället för koncentration vid en punkt
- Test: Analysera målfördelningens standardavvikelse inom 40-50 minutersintervallet och jämför med normalfördelning

**H-förslag 2:**
- Claim: Marginell övervikt för 46-50 minuter speglar matcher som drar ut på perioden eller har oregelbundna avbrott
- Competing: Den marginella övervikten (10 mål över 1 124 matcher) är slumpmässig variation utan systematisk förklaring
- Predicted: Statistiskt signifikant skillnad mellan 40-45 och 46-50 om oregelbundna avbrott är en verklig faktor
- Test: Signifikansprövning av skillnaden (10 mål = ~0,9 procent) mot chisquare-test eller binomialtest

---

### Finding 009 — Mål faller tidigare i jämna matcher

**H-förslag 1:**
- Claim: I jämna matcher orsakas tidiga mål av att lagen är välmatchade och det initiala spelet är intensivt och öppet
- Competing: Tidiga mål i jämna matcher beror på något annat faktor än välmatchning (t.ex. taktiska val, slump eller fysisk prestationsvariation)
- Predicted: Högt antal mål i minut 0-9 för jämna matcher
- Test: Analysera matchernas taktiska setup, lagstyrka och fysiska toppform vid matchstart för jämna matcher och jämför med öppna matcher

**H-förslag 2:**
- Claim: I öppna matcher är det tidiga skedet handelsefattigt fram till att ett lag bryter igenom, varefter målen ökar i takt
- Competing: Det låga andelen tidiga mål i öppna matcher beror på att ett lag redan från start är klart överlägset men behöver tid att finna målchanserna
- Predicted: 0,5% av målen i minut 0-9 för öppna matcher
- Test: Jämför bollinnehav, skott och målchanser i matchens första 9 minuter mellan jämna och öppna matcher

**H-förslag 3:**
- Claim: Tidiga ledningar i jämna matcher leder inte till lika tydlig dominans som i öppna matcher
- Competing: Tidiga ledningar i jämna matcher leder till samma dominans men lagen lyckas återhämta sig tack vare närmare matchnivå
- Predicted: Motmål förekommer oftare efter tidiga ledningar i jämna matcher jämfört med öppna matcher
- Test: Analysera frekvensen av motmål och målskillnad efter tidiga ledningar i jämna kontra öppna matcher

---

### Finding 010 — Hörnmål toppar mitten, öppet spel slutet

**H-förslag 1:**
- Claim: Försvararnas riskbenägenhet ökar sent i täta matcher, vilket leder till fler regelbrott i farliga lägen och därmed fler straffar
- Competing: Domarna uppfattas som mer benägna att döma straff när resultatet är öppet och pressen är hög
- Predicted: Straffsanktioner ökar från 80–89 (16,0 %) till 90–99 (2,1 %), totalt drygt 18 % i matchens sista tio minuter
- Test: Analysera videoupptagningar för att räkna regelbrott i försvar under olika matchfaser och jämför med domares straffdomsbeslut; kontrollera om regelbrott eller domarbeslut förklarar strafftillökningen

**H-förslag 2:**
- Claim: Det finns en generell strukturell faktor — möjligen trötthet mot halvtid eller taktiska omställningar — som höjer målfrekvensen oberoende av måltyp
- Competing: Höjningen kring 40–49 är specifik för varje måltyp och beror inte på en gemensam strukturell faktor
- Predicted: Gemensam höjdpunkt kring 40–49 för samtliga måltyper (hörnmål, öppet spel, straffar)
- Test: Testa om toppen vid 40–49 är statistiskt signifikant för alla måltyper och undersök om den korrelerar med kända trötthet- eller taktiska omställningsmönster mellan halvtiderna

**H-förslag 3:**
- Claim: Hörnmål uppstår relativt konstant under hela matchen eftersom de inte är ett utpräglat sen-matchfenomen
- Competing: Hörnmål visar en svag topp i mittfas (40–59) och sekundär topp i 80–89, vilket indikerar att även hörnmål påverkas av matchfas
- Predicted: Hörnmål distribueras jämnare än andra måltyper utan dramatiska utslag i något matchskede
- Test: Jämför variansen i hörnmålsfördelning mellan matchskeden med variansen för öppet spel och straffar; testa om hörnmålstoppen vid 40–59 är statistiskt signifikant

---

### Finding 011 — Halvledning förutsäger seger — men olika starkt

**H-förslag 1:**
- Claim: Styrkesskillnaderna mellan lagen är märkbara i kvartsfinalen, vilket gör att starka lag tar täten tidigt och håller den
- Competing: Det höga vinnandet för halvtidsledande lag i kvartsfinalen beror på att matchernas utgång är slumpmässig och 9 av 10 är en statistisk slump
- Predicted: Halvtidsledande lag vinner 9 av 10 gånger (90%)
- Test: Testa om resultatet avviker signifikant från en binomialfördelning med p=0,5

**H-förslag 2:**
- Claim: De åtta kvarvarande lagen i semifinalen är mer jämnt matchade än i kvartsfinalen
- Competing: Nedgången från 90% till 75% vinnande för halvtidsledande lag beror på att taktiska justeringar eller slumpmässig variation i andra halvlek, inte på jämnare lagkvaliteter
- Predicted: Halvtidsledande lag vinner 3 av 4 gånger (75%)
- Test: Jämför lagstyrkor/ranking före semifinal med före kvartsfinalen för att bedöma om märkbar skilnad existerar

**H-förslag 3:**
- Claim: Halvtidsledningens prediktiva kraft är starkast när lagskillnaderna är större och avtar när de jämnaste lagen möts
- Competing: Det observerade mönstret över faserna beror på slumpmässig variation och konfidensintervallet är för brett för att dra slutsatser
- Predicted: Halvtidsledningens vinnandeprocent sjunker från kvartsfinalen (90%) genom semifinalen (75%) till finalen (87,5%)
- Test: Utför en trendanalys över de tre faserna och testa signifikans med kontroll för urvalsstorlek

---

### Finding 012 — Damserien omvandlar hörnor till mål mer sällan

**H-förslag 1:**
- Claim: Lägre hörnkonvertering i damserien beror på fysiska förutsättningar som kroppsstyrka och hopphöjd vid luftdueller och nickdueller
- Competing: Lägre hörnkonvertering beror på taktiska försvarssystem (zona eller tätt personförsvar) som är mer konsekvent tillämpade i damserien
- Predicted: Hörnkonverteringsgrad ≈5,8% för damserien vs högre för herrserien
- Test: Detaljerad videoanalys av hörnförsvarsformationer och träffpunkter på kropp/huvud vid nicksituationer; jämföra fysiska attribut hos spelare mot konverteringsdata

**H-förslag 2:**
- Claim: Damserien skapar sina mål i högre utsträckning via spelmönster, pressing och övergångsspel än via hörnor
- Competing: Skillnaden i målskapning beror på att herrserien helt enkelt spelar fler hörnor totalt, vilket absorberar en större del av målen genom volym snarare än relativ effektivitet
- Predicted: Andel mål via hörna lägre i damserien trots högre konverteringsgrad per hörna
- Test: Jämföra andel mål från hörnor (%) mot absolut antal hörnor per match; kontrollera för totalvolym hörnor

---

### Finding 013 — Dam och herr visar likartad målminutsfördelning

**H-förslag 1:**
- Claim: Herrserien har en högre andel mål i 80–89 minuter (13,3 %) på grund av fler täta matcher där slutskedet avgör
- Competing: Skillnaden är statistiskt brus eftersom damserien är betydligt mindre i storlek
- Predicted: Herrserien innehåller en högre andel av täta matcher (där resultat avgjordes sent) jämfört med damserien
- Test: Analysera matchresultatdata för båda serierna; beräkna andelen täta matcher och korrelera med målfördelningen i 80–89 minuter

**H-förslag 2:**
- Claim: Damserien är relativt starkare i 40–49 minuter (12,8 % mot 12,2 %) på grund av olika taktiska eller fysiska faktorer
- Competing: Skillnaden är slumpmässig variation eftersom damserien är betydligt mindre än herrserien
- Predicted: Om damserien växes till samma storlek skulle avvikelsen försvinna eller minska signifikant
- Test: Utför statistisk signifikanstestning (t-test eller chi-två) för att bedöma om skillnaden är statistiskt säkerställd eller inom normalvariationen

**H-förslag 3:**
- Claim: Intervallet 30–39 visar dams lägsta andel (9,1 %) på grund av seriespecifika taktiska mönster eller bytesfrekvenser
- Competing: Skillnaden är statistiskt brus givet att damserien är betydligt mindre än herrserien
- Predicted: Specifika taktiska data eller bytesfrekvenser skulle förklara varför damserien har en depresserad målfrekvens i detta intervall
- Test: Samla in data om taktiska förändringar och spelarbyten per serie kring 30–39 minuter och korrelera med målfrekvensen

---

### Finding 014 — Bortalagets hörnor konverteras lika ofta

**H-förslag 1:**
- Claim: Hemmalaget slår fler hörnor för att de har mer bollinnehav och tryck framåt
- Competing: Hörnorna beror på andra faktorer såsom motspelarnas defensiva stil eller slumpmässig variation
- Predicted: Hemmalag ska ha högre andel bollinnehav när hörnorna uppstår
- Test: Analysera bollinnehav-statistik för hemma- och bortalag under motsvarande tidperioder

**H-förslag 2:**
- Claim: Bortalaget är mer beroende av standardsituationer för att ta sig in på resultattavlan
- Competing: Hörnornas större andel av bortalagets mål beror på skillnader i matchkontext eller motståndarkvalitet snarare än bortalagens egen målskapningsförmåga
- Predicted: Hörnmål utgör ≥22,7% av bortalagets totala målskapning
- Test: Separat analys av bortalagets totala målskapande uppdelat efter öppet spel versus standardsituationer

**H-förslag 3:**
- Claim: Hemmaeffekten i bandyhörn är kvantitativ snarare än kvalitativ
- Competing: Hemmaeffekten är kvalitativ och hemmalaget är skickligare på att konvertera hörnor, men skillnaden är för liten för att detekteras statistiskt
- Predicted: Konverteringsgrad hemmalag högre än bortalag med >0,3 procentenheters skillnad
- Test: Större datamaterial eller längre observationsperiod för att detektera om skillnaden är systematisk snarare än slumpmässig

---

### Finding 015 — Större halvtidsledning ger dramatiskt högre vinst

**H-förslag 1:**
- Claim: Den låga förlustandelen på 4 % vid 3+–0 beror på statistisk brus, extremt ovanliga matcher eller registreringsfel
- Competing: Den låga förlustandelen reflekterar ett verkligt mönster där tregålsledning vid halvtid faktiskt är nästan garanterad seger
- Predicted: Om det är brus/fel: förlustandelen borde variera kraftigt mellan olika tidsperioder eller ligrer; om det är verkligt: förlustandelen borde vara konsistent låg
- Test: Stratifiera datamaterialet efter tidsperiod, ligdivision eller registreringskälla och jämför förlustandelen

**H-förslag 2:**
- Claim: Höga matchvolymen i kategorin 3+–0 (322 matcher) förklaras av spelets höga poängtakt jämfört med fotboll
- Competing: Höga matchvolymen i denna kategori förklaras av faktorer som det ledande lagets defensiva sammanbrott, taktiska förändringar eller motspelarnas ökade motivation
- Predicted: Om poängtakten är orsaken: andra högscoringspel borde ha liknande frekvens av stora halvtidsledningar; om andra faktorer: mönstret borde skilja sig mellan olika typer av lag eller matchsituationer
- Test: Jämför frekvensen av 3+–0-ledningar i bandy med motsvarande stora ledningar i andra högscoringssporter; analysera om vissa lagtyper når denna ledning oftare

**H-förslag 3:**
- Claim: Den relativ jämna gradienten (16–18 procentenheter per mål) indikerar en konsekvent mekanisk effekt av målskillnaden på vinstchansen
- Competing: Den jämna gradienten är en artefakt av olika psykologiska eller motivationsmässiga trösklar vid olika ledningar, men effekterna förstärks eller döljs på sätt som producerar linjäritet
- Predicted: Om mekanisk effekt: gradienten borde vara stabil över tid och mellan olika lagtyperner; om psykologisk effekt: gradienten borde variera mellan olika matchsituationer eller lagkombinationer
- Test: Stratifiera data efter lagklass, matchtyp (slutspel vs regular season) och motspelarnas kvalitet; testa om gradienten förblir 16–18 procentenheter

---

### Finding 016 — Hemmaled vid halvtid vinner oftare

**H-förslag 1:**
- Claim: Hemmalag konverterar sin halvtidsledning oftare än bortalag på grund av gynnsamma förhållanden (publikstöd, känd planyta)
- Competing: Bortalag i ledning möter motstånd från hemmalag som höjer sig, tar fler risker och får omgivningens stöd för att vända matchen
- Predicted: Hemmalag konverterar ledning oftare än bortalag (observerat: 80% vs 75%)
- Test: Jämföra konverteringsfrekvens för hem- och bortalag med halvtidsledning, samt analysera matchdynamik och risktagande i andra halvlek

**H-förslag 2:**
- Claim: Hemmalag leder vid halvtid oftare totalt sett på grund av att hemmalag presterar starkare under matchernas första del
- Competing: Skillnaden i antal halvtidsledningar mellan hem- och bortalag (528 vs 379) kan förklaras av andra faktorer än prestation i första halvlek
- Predicted: Hemmalag leder vid halvtid i fler matcher totalt (observerat: 528 vs 379 fall)
- Test: Analysera första halvlekens målskillnader, skuddfördelning och possession för hem- och bortalag över ett större urval

**H-förslag 3:**
- Claim: Halvtidsledning är en starkare prediktor för slutseger än hemmafördelens övriga faktorer
- Competing: Skillnaden på 4,9 procentenheter mellan hem- och bortalag kan förklaras av hemmafördelens andra aspekter snarare än av något inneboende i halvtidsledningen själv
- Predicted: Halvtidsledning väger tyngre än hemma/bortastatus för slutseger
- Test: Kontrollera för hemmafördelens andra faktorer och mät halvtidsledningens oberoende effekt på vinnarchansen

---

### Finding 017 — Comebacks startar tidigare i andra halvlek

**H-förslag 1:**
- Claim: Tidiga reduceringsmål i andra halvlek (96–100 min) orsakar ökad sannolikhet för comeback genom att ge laget tid att spela om matchen och sänka motståndaren
- Competing: Lag som gör tidiga 2H-mål är generellt starkare eller har bättre tempo, och denna styrka driver både det tidiga målet och comebacken parallellt — målet är inte själva orsaken
- Predicted: Comeback-andel 27 % vid 96–100 minuter, sjunkande därefter
- Test: Jämföra comeback-rate för lag som gör tidiga mål med comeback-rate för lag med motsvarande styrka som inte gör tidiga mål; eller analysera matchdynamik före och efter det tidiga målet

**H-förslag 2:**
- Claim: Det kritiska tidsfönstret för comeback är de första tio minuterna av andra halvlek — reducering då möjliggör comeback, medan senare reducering inte gör det
- Competing: Det är inte tiden i sig utan matchdynamiken och motståndarlaget som orsakar minskningen i comeback-sannolikhet — senare i matchen är motståndaren redan mentalt säker och spelar defensivare
- Predicted: Drammatisk skillnad i comeback-sannolikhet mellan minut 96–100 och minut 101–120
- Test: Analysera motståndarlags defensiva positionering, bollinnehav och pressintensitet före och efter första 10-minutersintervallet i andra halvlek

**H-förslag 3:**
- Claim: Sena mål (från minut 121 och framåt) reducerar underskuddet men lämnar inte tillräckligt med tid för fortsatt press och comeback
- Competing: Lag som är efterslänkande efter minut 121 är redan så psykologiskt och taktiskt svagade att de inte kan skapa comeback-möjligheter oavsett tid kvar
- Predicted: Comeback i princip obefintligt från minut 121 framåt
- Test: Jämföra comeback-rate för lag som reducerar vid minut 121+ med comeback-rate för lag som redan var ikapp vid samma tidspunkt

---

### Finding 018 — VSK och Nässjö: hörnamål jämfört

**H-förslag 1:**
- Claim: VSK:s högre konverteringsgrad (12,7 %) och fler hörnor per match (10,4) under 'Västerås SK'-perioden beror på ett effektivare uppspel eller avslut från hörnor
- Competing: Skillnaden beror på spelstil, spelarunderlag eller periodval snarare än på teknisk effektivitet
- Predicted: VSK skulle bibehålla höga värden på båda parametrar över flera säsonger om effektiviteten är den primära orsaken
- Test: Jämföra 'Västerås SK'-periodens resultat med säsongsnivå-data och analysera om skillnaden är konsekvent eller säsongsberoende

**H-förslag 2:**
- Claim: Namnbytet från 'Västerås SK' till 'Västerås SK/BK' reflekterar en faktisk förändring i lag eller spel (sammanslagning eller datastöd) som förklarar prestandafallet
- Competing: Namnbytet är administrativt och speglar inte en reell prestandaförändring; skillnaden kan bero på datakvalitetsproblem eller slumpmässig variation
- Predicted: Om sammanslagning inträffade skulle andra prestandamätvärden (skottal, lagsammansättning) också visa brister eller förändringar vid namnbytet
- Test: Granska datakvalitet, spelarlistor och administrativa poster för perioderna runt namnbytet

**H-förslag 3:**
- Claim: Vetlanda BK:s stabila värden över 158 matcher (11,6 % konvertering) gör dem mer tillförlitliga än VSK:s disparata värden
- Competing: VSK:s spridning mellan perioder kan återspegla verklig prestandaförändring snarare än dataproblem, och skulle därför representera två distinkta spelperioder snarare än ett enskilt underskattat värde
- Predicted: Om VSK hade spelarbyten eller taktiska skift mellan perioderna skulle andra mätvärden visa motsvarande skiljelinjer
- Test: Analysera spelarlistor, tränarutbyten och taktiska förändringar mellan 'Västerås SK'- och 'Västerås SK/BK'-perioderna

---

### Finding 019 — Målen klustrar tydligt i herrbandy

**H-förslag 1:**
- Claim: Tidig målproduktion i täta matcher beror på att ledande lag ändrar taktik efter att ha tagit ledning
- Competing: Tidig målproduktion beror på att lag som håller tätt i inledningen svarar snabbt på mål
- Test: Analysera målsekvenser i täta matcher: undersöka om ledande lags målfrekvens minskar efter första målet (taktikförändring) eller om målskyttefarten bibehålls (snabb respons)

**H-förslag 2:**
- Claim: Spelmönstret med målklustring i slutminuter är detsamma i dambandy som i herrbandy på grund av strukturell likhet
- Competing: Spelmönstret skiljer sig åt i dambandy på grund av skillnader i spelarstyrka, lagdjup, taktisk mognad, täthetsfrekvens eller konditionsprofil
- Test: Analysera dammatchdata med samma metod som herrdata och jämför målfördelningen över matchens olika faser

**H-förslag 3:**
- Claim: Det icke-linjära målmönstret i öppna matcher förklaras enbart av standardspellogik (ledande lag spelar ut tid, förlorande lag tar risker)
- Competing: Målmönstret i slutminuter kan också förklaras av andra faktorer som bytesfrekvens och konditionsprofil som kan påverka målbilden annorlunda i dambandy
- Test: Testa dammatchdata för att se om samma målklustringmönster uppstår eller om det varierar baserat på mätbara skillnader i bytesfrekvens och kondition

---

### Finding 020 — Dammatchdata saknas för jämförelse

**H-förslag 1:**
- Claim: Det inverterade mönstret i herrbandy förklaras av matchdynamik där ledande lag sänker defensivt fokus sent i matchen
- Competing: Mönstret skulle kunna förklaras av andra faktorer såsom systematiska skillnader i lagstyrka mellan jämna och öppna matcher, eller artefakter i datainsamlingen
- Predicted: Jämna matcher har fler mål i första halvan, öppna matcher har fler mål i andra halvan
- Test: Tidsanalys av målfördelning för herrserien uppdelat på jämna vs öppna matcher

**H-förslag 2:**
- Claim: Samma matchdynamiska mekanismer som förklarar herrbandy gäller även i dambandy
- Competing: Dambandy har olika speltempo, fysiska förutsättningar och taktiska konventioner som gör att samma tidsprofil inte uppstår
- Predicted: Damserien visar samma inverterade mönster som herrserien (jämna matcher front-loaded, öppna matcher back-loaded)
- Test: Samma tidsanalys genomförd på damseriedata med målminut, match-id och slutresultat

---

### Finding 021 — Mellankategorin: måldistribution vid 2–3 måls marginal

**H-förslag 1:**
- Claim: Mellankategorin (2–3 mål) uppvisar en flackare, mer jämnt fördelad kurva som är en kompromiss mellan jämna och öppna matcher
- Competing: Mellankategorin är heterogen och blandar två distinkta beteendemönster (matcher avgjorda gradvis vs matcher avgjorda tidigt), vilket skapar en artificiellt jämn fördelning
- Predicted: Hypotes 1: en gradvis lutande kurva utan extrema toppar. Hypotes 2: en multimodal eller bimodal distribution när rådata granskas på matchnivå
- Test: Analysera rådata på matchnivå för 2–3 målsmatchers målfördelning över tid, samt använd klassificeringsmetoder (clustering) för att identifiera distinkta mönster inom kategorin

**H-förslag 2:**
- Claim: Matcher som slutar med 2–3 måls marginal inleds jämnt men avgörs gradvis
- Competing: Matcher i mellankategorin är avgjorda tidigt men klassificeras inte som öppna matcher på grund av slutresultatet
- Predicted: Hypotes 1: måltäthet är högre i senare delen av matchen. Hypotes 2: måltäthet är högre i tidigare delen men slutresultatet är ändå 2–3 mål
- Test: Jämför målfördelningskurvor för 2–3 målsmatchers mot båda extremkategorierna; analysera tidpunkt för matchavgörande relative till slutresultat

---

### Finding 022 — Hörnmål slås in lika ofta hemma som borta

**H-förslag 1:**
- Claim: Hemmalags högre hörnkonvertering beror på att de får hörnor i mer gynnsamma lägen
- Competing: Hemmalags högre konvertering beror på bättre teknisk/taktisk skicklighet i hörnasituationer snarare än lägets kvalitet
- Predicted: Hemmalag konverterar ~11,6% av hörnorna
- Test: Analysera hörnornas utgångspunkt och motsånd för att kontrollera om lägeskvaliteten skiljer sig mellan hemma/bort

**H-förslag 2:**
- Claim: Bortalags högre hörnmålsprocent (andel av totala mål) speglar att de gör färre mål totalt
- Competing: Bortalag är faktiskt bättre eller mer fokuserade på att exploatera hörnor trots svårare speläge
- Predicted: Hörnmål utgör större andel av bortalags målproduktion än hemmalags
- Test: Jämför trenderna över tid eller mellan lag för att se om vissa bortalag konsistent är beroende av hörnor

**H-förslag 3:**
- Claim: Liknande konverteringsfrekvens (11,6% vs 11,3%) indikerar att hörnornas selection är likartad mellan hemma och bort
- Competing: Den lika konverteringsfrekvensen beror på att båda lagens försvar är lika effektivt mot hörnor, inte på att hörnorna är likvärdiga
- Predicted: Konverteringsfrekvenser skulle skilja sig mer om selection av hörnor skilde sig
- Test: Analysera försvarsresultat vid hörnor eller hörnornas placering/förutsättningar separat

---

### Finding 023 — Damernas målfördelning saknar tillräcklig data

**H-förslag 1:**
- Claim: Tomma serier i damernas data beror på att matchprotokollen saknar tidsstämplar på mål
- Competing: Datakällan täcker inte damelitserien alls, eller ett tekniskt fel uppstod i hämtningen
- Test: Manuell granskning av källdatan och protokollets struktur; teknisk felsökning av hämtningsprocessen

**H-förslag 2:**
- Claim: Om dambandy uppvisar liknande sluttryck som herrbandy är fenomenet strukturellt kopplat till matchens dynamik
- Competing: Om sluttrycket saknas eller är svagare i damserien beror det på skillnader i energinivåer, taktiska val eller matchrytm mellan könen
- Predicted: Samma eller liknande sluttrycksmönster mellan herr- och damserien
- Test: Jämförelse av målstatistik från slutminuterna mellan herr- och damelitserien när data är tillgänglig

---

### Finding 024 — Vändningar sker i 16 % av matcher

**H-förslag 1:**
- Claim: Halvtidsledningen är som mest sårbar direkt efter paus (91-100 minuter)
- Competing: Sårbarhetsmönstret är jämnt fördelat över andra halvlek, och koncentrationen av mål 91-100 beror på slumpmässig variation
- Predicted: 61,8% av vändningsmål inom första 10 minuter av andra halvlek
- Test: Chi-två-test eller binomialtest för att kontrollera om 61,8% är signifikant högre än förväntat 11,1% (10/90 minuter)

**H-förslag 2:**
- Claim: Ett tidigt mål från jagande laget sätter psykologisk press som triggerar vändningen
- Competing: Laget som leder med större marginal satsar aktivare offensivt efter paus, vilket gör det lättare för jagande laget att skapa målchanser genom försvar
- Predicted: Tidiga mål i andra halvlek korrelerar med vändning
- Test: Jämföra målfördelningen för jagande lag som mål direkt (91-100) mot senare målpoäng

**H-förslag 3:**
- Claim: Lag som inte vänd innan ungefär 120 minuter gör det sällan alls (bara 2 av 123 efter)
- Competing: Efter 120 minuter spelar jagande lag mer defensivt för att undvika nederlag när tiden rinner ut, inte för att vändningen är omöjlig
- Predicted: Endast 1,6% av vändningsmål efter 120 minuter
- Test: Analysera ändringar i jagande lags taktik och skudfördelning före och efter 120-minutersmärket

---

### Finding 025 — Halvtidsledning avgör mindre i semifinal

**H-förslag 1:**
- Claim: Jämnheten mellan lag ökar när de svagaste lagen sållas bort i turneringen
- Competing: Halvtidsledning är mindre prediktiv i semifinal på grund av andra faktorer än ökad jämnhet (tex förändrad taktik eller psykologiska effekter)
- Predicted: Låg konvertering av halvtidsledning till seger i semifinal (70%) jämfört med kvartsfinal (88%)
- Test: Jämför lagstyrkeindex eller målskillnad mellan opponenter i kvartsfinal vs semifinal

**H-förslag 2:**
- Claim: Jämnare matcher leder till färre mål på grund av defensiv press och färre öppna lägen
- Competing: Det lägre målsnittet i semifinal förklaras av andra orsaker (tex defensiva instruktioner från tränare eller målvaktsförbättringar)
- Predicted: Målsnitt sjunker från kvartsfinal till semifinal (0,42 mål mindre per match)
- Test: Kontrollera målsnitt korrelation med ett oberoende mått på matchjämnhet

**H-förslag 3:**
- Claim: Topplag dominerar finaler även när poängmässigt jämnare, vilket håller halvtidsledningens träffsäkerhet hög
- Competing: Högre träffsäkerhet i finalen (87,5%) trots lågt målsnitt förklaras av mindre urval-bias eller lagspecifika faktorer snarare än dominans-fenomenet
- Predicted: Halvtidsledning konverteras till seger 87,5% i finalen med endast 8 matcher
- Test: Expandera finaldataset och analysera målskillnad mellan lag i finaler vs semifinaler

---

### Finding 026 — Hemmafördel stärker halvtidsledningens prediktiva kraft

**H-förslag 1:**
- Claim: Hemmafördelen och halvtidsledning interagerar så att bortalag som leder vid halvtid möter hårdare motreaktion i andra halvlek
- Competing: Skillnaden beror på systematiska skillnader i motståndets kvalitet mellan situationer där hemmalag respektive bortalag leder vid halvtid
- Predicted: Bortalags konverteringsfrekvens är lägre när de leder i halvtid jämfört med hemmalags konverteringsfrekvens när de leder
- Test: Jämför konverteringsfrekvenser för bortalag vs hemmalag när båda leder vid halvtid, kontrollerat för motspelarnas styrka

**H-förslag 2:**
- Claim: Den asymmetriska fördelningen mellan matcher (379 bortalag ledande vs 528 hemmalag ledande vid halvtid) reflekterar hemmafördelen på matchnivå
- Competing: Asymmetrin orsakas av systematiska skillnader i motståndets kvalitet snarare än av hemmafördelen per se
- Predicted: Hemmalag som leder vid halvtid bör ha högre vinstfrekvens än bortalag i samma situation
- Test: Analysera vinstfrekvenser för båda grupper och kontrollera om motspelarnas styrka förklarar skillnaden

**H-förslag 3:**
- Claim: Halvtidsledning förblir en stark prediktor för matchresultat oavsett hemma eller borta
- Competing: Halvtidsledningens prediktiva kraft är substantiellt svagare för bortalag än hemmalag på grund av hemmafördelen
- Predicted: Skillnaden på 4,9 procentenheter mellan hemma och borta är dock inte tillräcklig för att vända prediktorns logik
- Test: Beräkna oddskvoten eller prediktiv styrka för halvtidsledning separat för hemma- och bortalag

---

### Finding 027 — Data saknas för taktisk hörnanalys

**H-förslag 1:**
- Claim: Tomhet i dataset beror på att hörntyper aldrig kodats i källdata
- Competing: Tomheten beror på tekniskt fel i datapipelinen eller på att underlaget ännu inte insamlats
- Test: Kontrollera källdata direkt för förekomst av hörnkodningar; granska datapipeline för fel; verifiera insamlingsstatus

**H-förslag 2:**
- Claim: Taktiska val vid hörnor skiljer sig systematiskt mellan Elitserien och Division 1
- Competing: Skillnader i hörnstrategi förklaras av taktisk mognad, tränarpreferenser eller spelarresurser
- Test: Jämför fördelningen av kort spel kontra direktinlägg mellan serierna när data tillgängliggörs; analysera korrelation med tränarfaktorer och spelarresurser

**H-förslag 3:**
- Claim: Hörnstrategi påverkar hur snabbt ett anfall kan avslutas och vilket försvarstryck som uppstår
- Competing: Andra faktorer än hörnstrategi är mer avgörande för attackhastighet och försvarstryck
- Test: Analysera korrelation mellan hörnspelstyp och attacktid respektive försvarspressgrader när data finns tillgängligt

---

### Finding 028 — Hörneffektivitet damserie: data saknas

**H-förslag 1:**
- Claim: Tomma serier beror på att den underliggande databasen saknar hörnstatistik för damserien
- Competing: Kopplingen mellan Finding 012 och dess datakälla är trasig, eller filtreringen på seriebeteckning matchar inte hur data är märkt
- Test: Kontrollera om hörnstatistik existerar i databasen för damserien; verifiera datakällans koppling och filtreringskriterier

**H-förslag 2:**
- Claim: Det är ett dataproblem snarare än ett strukturproblem
- Competing: Det är ett strukturproblem (analysflödet är felaktigt designat)
- Test: Verifiera att objekttypen corner_efficiency_comparison är korrekt implementerad; testa med injicerad testdata för att se om flödet fungerar

**H-förslag 3:**
- Claim: Data är ännu inte inmatad eller korrekt länkad
- Competing: Data existerar men är felmarkerad eller finns i fel datakälla
- Test: Söka i databasen med alternativa märkningar eller datakällor för hörnstatistik i damserien

---

### Finding 029 — Mållagens ursprung utanför hörnor i damserien

**H-förslag 1:**
- Claim: Det tomma dataunderlaget beror på att klassificeringen av aktionstyper inte genomförts för damserien
- Competing: Data har inte exporterats korrekt från källsystemet
- Test: Kontrollera klassificeringsprotokoller för damserien och granska exportloggar från källsystemet

**H-förslag 2:**
- Claim: Manuell kodning av aktionstyper utan överenskommet klassifikationsschema förklarar varför data saknas
- Competing: Gränserna mellan aktionkategorier är så oprecisa att kodare får inkonsistenta resultat även med ett schema
- Test: Implementera klassifikationsschema och testa interrater-reliabilitet; jämför resultat med tidigare adhoc-kodning

---

### Finding 030 — Hörneffektivitet och matchläge: data saknas

**H-förslag 1:**
- Claim: Datakällan är tom på grund av hörnhändelser som saknar koppling till matchställningsdata i databasen
- Competing: Finding 012 kördes mot ett tomt dataurval, eller pipeline-steget som klassificerar matchläge filtrerar bort alla rader
- Test: Kontrollera om hörnhändelser existerar i källdatan men saknar motsvarande matchställningsdata; verifiera dataurvalet för Finding 012; granskaklassificerings-logiken för matchläge

**H-förslag 2:**
- Claim: Matchläget påverkar taktiska val när lag utför och besätter hörn
- Competing: Matchläget har ingen signifikant påverkan på hörnexekveringen trots att det är ett känt fenomen i bollsporter generellt
- Test: Länka varje hörnhändelse till exakt matchställning och jämför hörneffektivitet mellan ledande/underlägsna matchlägen

---

### Finding 031 — Slutminutstopp: täta resultat eller serienivå?

**H-förslag 1:**
- Claim: Slutminutstoppens målökning i herrbandy förklaras av att täta resultat korrelerar med ökad anfallsfrekvens från förlorande lag och defensivare spel från ledande lag
- Competing: Slutminutstoppens målökning förklaras istället av serietillhörighet — lägre divisioner har mindre disciplinerade defensiver eller lägre konditionsnivå sent i matcher
- Predicted: Målfrekvensen i slutminuten ökar när matchmarginalen är liten, oberoende av vilken serie som spelas
- Test: Koppla varje mål till matchögonblickkets marginal och serietillhörighet, analysera om målökning korrelerar med marginal när serietillhörighet kontrolleras för

**H-förslag 2:**
- Claim: Databasen saknar den kombination av tidsstämplar och resultatögonblicksbilder per minut som krävs för att klassificera varje mål efter matchmarginalen
- Competing: Filtreringen i analyspipelinen har inte fungerat som avsett, vilket resulterar i frånvaro av nödvändiga data
- Test: Granska datakällorna och pipelinen för att fastställa vilken länk i kedjan som misslyckades

---

### Finding 032 — Målminutsfördelning per division: ingen data tillgänglig

**H-förslag 1:**
- Claim: Intensitetsskillnader mellan elitnivå och lägre divisioner påverkar när under matchen mål tenderar att falla
- Competing: Målminutsfördelningen skiljer sig inte åt mellan divisioner
- Predicted: Signifikant skillnad i målfördelning över matchens tidsperioder mellan divisioner
- Test: Samla divisionsmärkta matchdata och jämför målminutsfördelning mellan elitnivå och lägre divisioner med statistisk test

**H-förslag 2:**
- Claim: Matchdata i källsystemet är inte konsekvent märkt med divisionstillhörighet eller kopplingen mellan matchhändelser och seriemetadata är inte löst korrekt
- Competing: Ett filterfel har exkluderat alla rader från analysen
- Predicted: Manuell granskning av källdata visar antingen saknad divisionstillhörighet eller fel i datakopplingen
- Test: Granska källsystemets datakvalitet och spåra matchhändelser genom analyspipelinen för att identifiera var data försvinner

---

### Finding 033 — Hörnmål fördelas jämnt — bortaeffekt syns i konvertering

**H-förslag 1:**
- Claim: Bortalaget har svårare att skapa mål i öppet spel och är därför mer beroende av satta situationer
- Competing: Hemmalaget dominerar öppet spel i tillräcklig utsträckning för att späda ut hörnmålens andel av totalt målantal
- Predicted: Bortalaget skulle visa lägre konverteringsgrad i öppet spel jämfört med hemmalaget, eller hemmalaget skulle producera signifikant fler mål från öppet spel
- Test: Separat analys av konverteringsgrad för hörnor vs öppet spel för båda lagen, eller jämförelse av målfördelning mellan satta situationer och öppet spel

**H-förslag 2:**
- Claim: Hemmaeffekten vid hörnor är svag och jämnt fördelad över matchens alla perioder
- Competing: Hemmaeffekten är koncentrerad till slutskedet av matcher, men blir omärklig när man aggregerar över hela säsongen
- Predicted: Hemmaeffekten skulle vara större än 0,3 procentenheter när data segmenteras per matchperiod, särskilt i period 3
- Test: Tidsstämpling per hörnmål och period för att beräkna konverteringsgrad hemma/borta i var tredje period separat

---

### Finding 034 — Bortalagets hörneffektivitet marginellt lägre

**H-förslag 1:**
- Claim: Hemmafördelen tar sig uttryck i hörneffektivitet
- Competing: Hemmafördelen ligger i andra delar av spelet, exempelvis antal tillfällen eller målchansfrekvens utanför standardsituationer
- Predicted: Hemmalag skulle ha högre konverteringsgrad på hörnor än bortalag
- Test: Jämför konverteringsgrad på hörnor mellan hem- och bortalag

**H-förslag 2:**
- Claim: Bortalag är bättre på att utnyttja hörnor (baserat på högre andel hörnmål av totalmål)
- Competing: Den högre andelen hörnmål hos bortalag är ett räknetekniskt fenomen — bortalag scorer färre mål generellt, så varje hörnmål väger tyngre procentuellt
- Predicted: Bortalag skulle ha högre konverteringsgrad på hörnor än hemmalag
- Test: Jämför faktisk konverteringsgrad (hörnmål/totala hörnor) mellan lag

**H-förslag 3:**
- Claim: Aggregatdata på lagnivå visar att hem/borta-skillnader i hörneffektivitet är relativt jämna mellan alla lag
- Competing: Aggregatdata döljer potentiell heterogenitet — enskilda lag kan ha vitt skilda profiler trots att snitten hamnar nära varandra
- Predicted: Genomsnittlig skillnad mellan lag bör vara låg när man aggregerar
- Test: Analysera fördelningen av hem/borta-skillnader på individuell lagnivå snarare än aggregerat

---

### Finding 035 — Hörnkonvertering skiljer knappt mellan hemma och borta

**H-förslag 1:**
- Claim: Defensiv uppställning vid hörnor har en systematisk dämpande effekt på hemmalagets konvertering
- Competing: Den observerade likheten i konverteringsfrekvens mellan hemma och bort beror på att variationen i defensiva formationer tar ut varandra snarare än att defensiv uppställning saknar betydelse
- Predicted: Ett tydligare gap (större än 0,3 procentenheter) mellan hemma- och bortakonvertering om hypotesen är sann
- Test: Granulär situationsdata per hörna: antal försvarsspelare bakom bollen, presslinje och formationsval

**H-förslag 2:**
- Claim: Bortalaget är mer effektivt på hörnor än hemmalaget
- Competing: Bortalaget är inte bättre på hörnor, utan deras övriga anfallsspel genererar färre mål, vilket gör dem mer beroende av standardsituationer
- Predicted: Hörnmål utgör en högre andel av bortalags totala målskörd (22,7 % mot 21,8 %)
- Test: Jämföra andelen hörnmål av totala mål för hemma- respektive bortalagets motsatta lag, analysera matchdynamik och öppet spel effektivitet

**H-förslag 3:**
- Claim: Hemma- och bortaroller i sig förklarar hörnkonverteringsfrekvensen
- Competing: Defensiv uppställning (antal försvarsspelare bakom bollen, formationsval) är den faktiska förklarande variabeln, inte själva hemma/bort-rollen
- Predicted: Ingen signifikant skillnad mellan hemma och bort (0,3 procentenheter observerat)
- Test: Kontrollera för specifik defensiv formation och presslinje per hörna för att isolera effekten av dessa taktiska variabler

---

### Finding 036 — Hemmaledning håller oftare än bortaledning

**H-förslag 1:**
- Claim: Hemmaplansfördelen beror på strukturella faktorer (publik, bekant yta, kortare resväg) som adderas till det psykologiska läget av att leda
- Competing: Hemmaplansfördelen är en separat effekt som inte adderas utan interagerar på annat sätt med halvtidsledningen, eller förklaras primärt av psykologiska faktorer snarare än strukturella
- Predicted: Hemmalaget som leder vid halvtid bör ha högre vinstprocent än bortalaget med motsvarande ledning
- Test: Jämför vinstprocent för hemmalag respektive bortalag som leder vid halvtid och analysera om skillnaden motsvarar den kumulativa effekten av identifierade strukturella faktorer

**H-förslag 2:**
- Claim: Halvtidsledning för bortalaget neutraliserar inte hemmaplansfördelen utan denna kvarstår som en dämpad motkraft under andra halvlek
- Competing: Halvtidsledning för bortalaget neutraliserar faktiskt hemmaplansfördelen delvis eller helt, och den observerade skillnaden förklaras av andra faktorer
- Predicted: Bortalagets vinstprocent vid halvtidsledning (75,2%) skulle vara lägre än hemmagets motsvarande procent
- Test: Direkt jämförelse av vinstprocent mellan hemmalag och bortalag som leder vid halvtid; analysera om skillnaden är statistiskt signifikant och konsistent över flera säsonger

**H-förslag 3:**
- Claim: Bortalags halvtidsledning är en meningsfull signal för matchutfall trots hemmaplansfördelen
- Competing: Bortalags halvtidsledning är en svagare signal än hemmalags motsvarande ledning och bör vägas lägre i prediktiva modeller
- Predicted: Bortalags vinstprocent vid halvtidsledning (75,2%) är tillräckligt högt för att betraktas som en reliabel indikator
- Test: Jämför prediktiv kraft för bortalags halvtidsledning mot andra etablerade matchanalys-indikatorer och testa dess oberoende värde i multipel regressionsmodell

---
