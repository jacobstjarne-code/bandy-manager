# H-fact Backfill — 2026-04-26

## Sammanfattning

- Findings processade: 46
- Hypotesförslag: 128
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
- Claim: Halvtidsledning är ett bra filter för att identifiera det överlägsna laget i en match
- Competing: Halvtidsledning är bara ett tillfälligt försprång som inte nödvändigtvis indikerar överlägsenhet, eftersom 22% comebacks visar att det laget kan förloras
- Predicted: 78% av matcher där ett lag leder vid halvtid vinner även matchen
- Test: Jämför andelen halvtidsledningar som resulterar i seger med andra mätningar av lagkvalitet

**H-förslag 2:**
- Claim: Bandys fria substitution och hörnornas offensiva vikt borde teoretiskt gynna chasande lag
- Competing: Dessa regler gynnning eller påverkar inte chasande lag på ett meningsfullt sätt
- Predicted: Comebacks skulle vara mer frekventa än 22% om regeln hade en signifikant effekt
- Test: Jämför comeback-frekvensen i bandy med comeback-frekvensen i andra lagsporter utan liknande regler

**H-förslag 3:**
- Claim: Simuleringsmotorns halvtidslogik fungerar som avsett
- Competing: Överensstämmelsen mellan simulering (77%) och verklighet (78,1%) är en slump och motorn innehåller systematiska felaktigigheter
- Predicted: Simulering och verklighet bör ge liknande resultat (77% respektive 78,1%)
- Test: Köra simuleringsmotorn flera gånger och jämföra variansen; testa motorns andra komponenter mot verklighetsdata

---

### Finding 002 — Hörnornas värde i bandy

**H-förslag 1:**
- Claim: Regelskillnader mellan bandy och fotboll (ingen försvararbegränsning vid hörna, möjlighet att slå hårt direkt mot mål) förklarar varför bandy producerar ~5x fler mål från hörnor än fotboll
- Competing: Skillnaden beror på andra faktorer såsom spelares atletiska förmåga, målvakternas reflexer, eller historiska taktiska val snarare än regelstrukturen
- Predicted: Om regelskillnader är orsaken skulle en kontrollerad regel-jämförelse mellan regelidentiska matcher (men med/utan försvararbegränsning) producera signifikant skillnad i hörnmål
- Test: Experimentell regeltest eller statistisk jämförelse av liknande lig med varierande hörneregler

**H-förslag 2:**
- Claim: Bandyspelares slagsteknik möjliggör svårare att förutsäga leveranser jämfört med fotbollshörnor
- Competing: Hörnorna är lika förutsbara, men bandy-försvarare är generellt sämre på att läsa och positionera sig vid hörnor
- Predicted: Slagvariationen (vinklar, hastighet, rotation) är statistiskt större i bandy än fotboll hörnor
- Test: Biomechanisk analys eller videokodning av hörnslags-variation mellan sporterna

**H-förslag 3:**
- Claim: En specialiserad hörnaslagare är rationell specialisering eftersom hörnor producerar ~25% av alla mål
- Competing: Hörnaslagare-specialisering är irrationell och återspeglar bara tränares bias eller tradition, inte faktisk effekt
- Predicted: Lag med dedikerad hörnaslagare har signifikant högre hörnmål-konverteringsfrekvens än lag utan specialisering
- Test: Jämförande statistik mellan lag med/utan hörnaslagare-specialisering, kontrollerat för andra variabler

---

### Finding 003 — Hemmafördelen i bandy

**H-förslag 1:**
- Claim: En större spelplan (90×65 meter) dämpar hemmalagets press-fördel och ger bortalaget mer utrymme att spela strukturerat
- Competing: Flygande byten är den primära faktorn som reducerar hemmalagsfördelen genom att minska konditionsmässig uttröttning
- Predicted: Hemmalags vinstprocent korrelerar negativt med planstorlek; en mindre plan bör ge högre hemmaseger
- Test: Jämför hemmalagsvinstprocent mellan bandyserier/länder med olika planstorhetsstandard

**H-förslag 2:**
- Claim: Flygande byten reducerar hemmalagsfördelen genom att båda lagen kan rotera fritt och undvika konditionell trötthet
- Competing: Lågt publikgenomsnitt (många matcher spelade inte inför fullsatt läktare) är den primära faktorn som reducerar hemmalagsfördelen
- Predicted: Hemmalagsvinstprocent bör vara högre i matcher med fler åskådare och lägre i matcher med få åskådare
- Test: Korrelera publik-storlek per match med hemmalags vinstresultat; jämför matcher innan/efter kapacitetsökning

**H-förslag 3:**
- Claim: Lågt genomsnittligt publikgenomsnitt (200–3 000 åskådare, många matcher inte fullsatta) försvagar hemmalagsfördelen
- Competing: Publiktrycket är faktiskt inte en avgörande faktor; de strukturella egenskaperna hos spelet (stor plan + flygande byten) är tillräcklig förklaring
- Predicted: Publikstorlek bör förklara en signifikant del av variansen i hemmasegervinstprocent
- Test: Kontrollera för publikstorlek i en regressionsanalys av hemmalagsfördel; testa om effekten kvarstår när plan-storlek och bytesregler hålls konstant

---

### Finding 004 — Bandy och mål

**H-förslag 1:**
- Claim: Bandys höga målfrekvens (9,12 mål/match) gör att individuella mål väger statistiskt lättare än i fotboll
- Competing: Målfrekvensen påverkar inte målens statistiska vikt — det är endast ett större absolutantal som förändrar matchdynamiken
- Predicted: Halvtidsledningsavgörande ligger på 78% i bandy versus 90%+ i högt poängsättande sporter
- Test: Jämföra Half-Time Lead Win Probability mellan bandy och andra sporter med olika målfrekvenser; kontrollera om sambandet är linjärt eller tröskelberoende

**H-förslag 2:**
- Claim: Bandys fria byten och högt tempo förhindrar lag från att 'låsa in' en ledning i slutminuterna
- Competing: Målminutfördelningen (54/46 andra/första halvlek) beror på att båda lagen är jämnt starka eller på slumpmässiga variationer, inte på ett strukturellt drag vid byten
- Predicted: Målminuterna bör visa en nästan neutral fördelning mellan halvlekar (nära 50/50)
- Test: Analysera målminutfördelning stratifierat efter ledningsposition vid minutmarkörerna; jämför hur ofta lag som leder försöker konservera resultat genom defensiv taktik

**H-förslag 3:**
- Claim: En 2–0-ledning efter 30 minuter är ett normalt, icke-avgörande spelläge i bandy på grund av den höga målfrekvensen
- Competing: En 2–0-ledning är icke-avgörande på grund av andra faktorer (lag-styrka-fördelning, slump i tidiga mål, eller matchlängd)
- Predicted: Lag med 2–0-ledning efter 30 minuter bör vinna ungefär 78% av matcherna (enligt Finding 001:s halvtidsledningsanalys)
- Test: Beräkna Win Probability för 2–0-ledning vid 30-minutersmärket; jämför med samma lednings Win Probability i fotboll för att isolera effekten av målfrekvens

---

### Finding 005 — Mål faller inte jämnt

**H-förslag 1:**
- Claim: Slutminuters-klustret förklaras av att lag under press tar risker och öppnar upp spelet
- Competing: Slutminuters-klustret kan förklaras av andra faktorer såsom taktiska förändringar eller motståndarnas defensiva sammanbrottande
- Predicted: Fler mål i båda riktningarna under slutminuter än andra perioder
- Test: Jämför målfrekvensen slutminuter versus övriga matchdelar; analysera måltyper och angreppssekvenser

**H-förslag 2:**
- Claim: Halvtidsgräns-klustret (min 40–50) förklaras av att hemmalag pressar hårdare innan halvtid och fortsätter efter
- Competing: Halvtidsgräns-klustret kan förklaras av att lag med ledning pressar, eller att försvar blir oorganiserat kring växlingen mellan halvlekar
- Predicted: 11,8% av alla mål inträffar i minut 40–50, mer än andra 10-minutersintervall utom slutminut
- Test: Analysera målsättares taktik och positioner; jämför pressmönster före/efter halvtid; kontrollera för ledningsläge

**H-förslag 3:**
- Claim: Bandys fria substitution motverkar effektivt trötthet som prestandafaktor under matchens mitt
- Competing: Frånvaron av trötthetsdipp beror på att lag löser ut nya spelare planmässigt eller på andra faktorer än substitutionssystemet
- Predicted: Ingen observerad nedgång i målproduktion under minut 25–35
- Test: Jämför trötthetsmönster i bandy (fria substitutioner) med lag i samma sport utan detta system; analysera substitutionsmönster och prestanda

---

### Finding 006 — Slutspelet: färre mål, starkare ledningar

**H-förslag 1:**
- Claim: Målreduktionen i slutspelet (9,12 till 8,55 mål/match) orsakas av att slutspelslag möts i bättre förberedda matchups och tränare prioriterar defensiv struktur
- Competing: Målreduktionen orsakas av att lag utan ledning i slutspelet drar sig inte tillbaka lika villigt som i grundserien när alla tre poäng inte är i spel
- Predicted: 0,57 färre mål per match i slutspelet
- Test: Jämföra målskillnad mellan lag med ledning versus lag utan ledning i grund- och slutserie separat

**H-förslag 2:**
- Claim: Halvtidsledningar håller bättre i slutspelet (85,3% mot 78,1%) för att det ledande laget väljer att låsa matchen snarare än att fortsätta pressa
- Competing: Halvtidsledningar håller bättre i slutspelet för att det ledande laget nöjer sig med ett mindre måls marginal medan grundserislag pressar för övertygande seger
- Predicted: 85,3% håller i slutspelet mot 78,1% i grundserien
- Test: Analysera skillnader i aggressiv speeltid efter målet mellan lag ledande med 1–0 respektive större marginal

**H-förslag 3:**
- Claim: Högre målantal i kval/playoff (9,33 mål/match) orsakas av desperationsanfall från undre lag och öppet spel när matcher avgör om ett lag åker ur eller stannar kvar
- Competing: Högre målantal kan orsakas av påverkad defensiv fokus när konsekvenserna är högre, snarare än ökat offensivt tryck
- Predicted: 9,33 mål per match i kval/playoff
- Test: Jämföra målfördelning mellan lag som leder respektive ligger under i kval/playoff-matcher

---

### Finding 007 — Dam vs herr: lika mål, men olika dynamik

**H-förslag 1:**
- Claim: Större lagstyrke-spridning i damserien förklarar den starkare halvtidsledningen (89,1% vs 78,1%)
- Competing: Skillnaden beror på andra faktorer som spelarnas mentala motståndskraft, taktiska anpassningar eller regelskillnader mellan serierna
- Predicted: Om spridningen är större i damserien bör standardavvikelsen för poängskillnad vid halvtid vara högre för dam- än herrserien
- Test: Beräkna standardavvikelse för poängskillnad vid halvtid i båda serierna och jämför. Korrelera lagstyrke-spridning mot ledningsbevaringsgrad

**H-förslag 2:**
- Claim: Slagteknik och kraft i hörnexekveringen förklarar varför hörnor är mindre effektiva i damserien (15,4% vs 22,2%)
- Competing: Skillnaden beror på defensiv taktik, målvakternas positionering eller att damlagen inte prioriterar hörnspel lika högt
- Predicted: Hörnmål per hörnkast bör vara lägre i damserien om exekveringskraften är begränsande faktor
- Test: Analysera hörnmål per hörnkast och hörnkvalitet (klassificera hörnorna efter avslutningskvalitet). Jämför även defensiv taktik mellan serierna vid hörnor

**H-förslag 3:**
- Claim: Det svagare hemmafördelsmönstret i damserien (47,6%) är slumpmässig variation på grund av litet urval
- Competing: Hemmaplansfördelen är genuint svagare i damserien än herrserien på grund av systematiska skillnader
- Predicted: Om det är slumpmässig variation bör 47,6% ligga inom konfidensintervallet för en null-hypotes om 50% hemmaseger
- Test: Utför binomialtest eller chi-två-test för hemmasegrar i damserien (376 matcher). Beräkna 95%-konfidensintervall och jämför med herrserien motsvarande period

---

### Finding 008 — Klustret 40–50 är jämnt fördelat

**H-förslag 1:**
- Claim: Periodslutet skapar en förhöjd målfrekvens under hela avslutningsfasen (40-50 minuter) snarare än en spike vid en enstaka minut
- Competing: Periodslutet skapar en tydlig spike vid en enskild minut (runt minut 45)
- Predicted: Jämn fördelning över intervallet (49,6 vs 50,4 procent) kontra koncentrerad topp vid minut 45
- Test: Jämför målfrekvens per minut inom intervallet 40-50; testa om fördelningen är signifikant skild från uniform distribution

**H-förslag 2:**
- Claim: Den marginella övervikten för 46-50 minuter (10 mål skillnad över 1 124 matcher) förklaras av slumpen/normala variationer
- Competing: Den marginella övervikten för 46-50 minuter speglar ett reellt fenomen som matcher som drar ut på perioden eller oregelbundna avbrott
- Predicted: Skillnaden på 10 mål är för liten för att vara statistiskt signifikant
- Test: Utför signifikanstest (t-test eller chi-square) på skillnaden mellan 40-45 och 46-50 minuter

---

### Finding 009 — Mål faller tidigare i jämna matcher

**H-förslag 1:**
- Claim: I jämna matcher beror det tidiga målmönstret på att lagen är välmatchade, vilket skapar intensivt och öppet spel med tidiga målchanser
- Competing: Det tidiga målmönstret i jämna matcher beror på att båda lagen använder aggressiv öppningsstrategi oavsett matchbalans
- Predicted: Målfrekvens högre under minut 0-30 i jämna matcher (högre än genomsnitt)
- Test: Jämför målfrekvens i tidiga skeden för jämna matcher mot matched-up-matcher med olika taktik; analysera lagstyrkor före match

**H-förslag 2:**
- Claim: I öppna matcher avgörs matchen genom successiv dominans från ett lag, inte genom tidig chock
- Competing: Det finns en tidig avgörande händelse (mål eller skada) som skapar psykologisk fördel som sedan konverteras till dominans senare i matchen
- Predicted: Mycket låg andel tidiga mål i öppna matcher (0,5 % i minut 0-9, vilket bekräftas av texten)
- Test: Analysera motsatta matchresultat när tidiga mål förekommer; granska om lag som gör tidigt mål i öppna matcher sedan ökar målfrekvensen eller om dominansen utvecklas gradvis ändå

**H-förslag 3:**
- Claim: Tidiga ledningar i jämna matcher leder inte till lika tydlig dominans som i öppna matcher, vilket håller matcherna täta
- Competing: Tidiga ledningar i jämna matcher väcker defensiv respons från motsatta lag som effektivt återetablerar balans
- Predicted: Låg korrelation mellan tidigt mål och slutlig marginal i jämna matcher
- Test: Jämför målspridningen efter tidiga mål (minut 15-45) mellan jämna och öppna matcher; analysera andelen jämna matcher som förblir täta efter 1-0 ledning

---

### Finding 010 — Hörnmål toppar mitten, öppet spel slutet

**H-förslag 1:**
- Claim: Straffar ökar sent i matchen på grund av att försvararnas riskbenägenhet ökar när matcher är täta
- Competing: Domare är mer benägna att döma straff när resultatet är öppet och pressen är hög
- Predicted: 16,0 % av straff i period 80–89
- Test: Jämföra strafffrekvens i täta matcher (liten målskillnad) mot matcher med stort målskillnad i samma tidsperiod, eller analysera domares straffbeslut kontrollerat för faktisk regelöverträdelseseveritet

**H-förslag 2:**
- Claim: Höjdpunkten kring 40–49 för samtliga måltyper förklaras av en generell strukturell faktor som trötthet mot halvtid
- Competing: Höjdpunkten beror på taktiska omställningar mellan halvtider
- Predicted: Målfrekvensen har en topp omkring minut 40–49
- Test: Analysera om målfrekvensen korrelerar med faktisk fysisk trötthet (via accelerationsmätningar, sprintfrekvens) eller om den snarare korrelerar med kända taktiska mönster och lagets inbytesmönster

**H-förslag 3:**
- Claim: Öppet spels sluttryck (13,6 % i 80–89) förklaras av att defensivt tryck lättar när lag trycker för utjämning
- Competing: Öppet spels sluttryck förklaras av att lag tappar koncentration sent i matchen
- Predicted: 13,6 % av öppna mål i period 80–89
- Test: Jämföra målfrekvens i 80–89 mellan matcher där hemmalagets försvar är under press (ligger under) kontra matcher där hemmalaget ligger före, för att isolera effekten av defensiv insats från koncentrationsförlust

---

### Finding 011 — Halvledning förutsäger seger — men olika starkt

**H-förslag 1:**
- Claim: Styrkesskillnaderna mellan lagen är märkbara i kvartsfinalen, vilket gör att starka lag tar täten tidigt och håller den
- Competing: Det höga vinnandeprocenten för halvtidsledande lag i kvartsfinalen beror på slumpen eller matchningsstrukturen snarare än på strukturella lagskillnader
- Predicted: 9 av 10 halvtidsledande lag vinner i kvartsfinalen
- Test: Jämför halvtidsledarnas vinnandeprocent i kvartsfinalen med en slumpmässig förväntning och kontrollera om det är statistiskt signifikant

**H-förslag 2:**
- Claim: De åtta kvarvarande lagen i semifinalen är mer jämnt matchade än i kvartsfinalen, vilket förklarar varför halvtidsledning är mindre prediktiv
- Competing: Minskningen i vinnandeprocent för halvtidsledande lag i semifinalen beror på andra faktorer än lagstyrka, exempelvis taktiska justeringar eller utmattning
- Predicted: 3 av 4 halvtidsledande lag vinner i semifinalen (75%)
- Test: Analysera lagsammanställningar, spelarkvalitet och fysiska markörer mellan kvartsfinalen och semifinalen för att bekräfta om matchningen är jämnare

**H-förslag 3:**
- Claim: Finaler är generellt jämna matcher där vändningar förekommer
- Competing: Finaldatan är för begränsad (tolv matcher) för att dra några slutsatser om ett strukturellt mönster
- Predicted: 87,5% vinnandeprocent för halvtidsledande lag i finalen
- Test: Samla in data från fler finaler för att få ett större underlag och testa om 87,5% är stabilt eller variabelt

---

### Finding 012 — Damserien omvandlar hörnor till mål mer sällan

**H-förslag 1:**
- Claim: Lägre hörnkonvertering i damserien beror på fysiska förutsättningar såsom kroppsstyrka och hopphöjd som är avgörande för luftdueller och nickdueller
- Competing: Lägre hörnkonvertering beror på att damserieteam försvarar hörnor mer konsekvent med zona eller tätt personförsvar
- Predicted: Damserien skulle visa låg konverteringsgrad per hörnor på grund av fysiska skillnader mellan könens spelare
- Test: Detaljerad data över hörnkonvertering uppdelat på typ av målsituation (luftduel vs rörelse) och försvarsformation under hörnor

**H-förslag 2:**
- Claim: Damserieteam försvarar hörnor mer effektivt genom zona eller tätt personförsvar vilket pressar ner konverteringsgraden
- Competing: Lägre konvertering beror på fysiska förutsättningar snarare än taktisk försvarsstyrka
- Predicted: Damserien skulle visa låg hörnkonvertering på grund av överlägsna försvarsmönster snarare än spelarnas individuella kvalitet
- Test: Videoannotation av försvarsformation under hörnor och analys av försvarsluckor jämfört med herrserien

**H-förslag 3:**
- Claim: Damserien skapar sina mål via spelmönster, pressing och övergångsspel i högre utsträckning än via stillastående situationer jämfört med herrserien
- Competing: Skillnaden i målskapande vägar förklaras av taktiska försvarsjusteringar snarare än högre produktivitet i öppet spel
- Predicted: Damserien skulle visa högre andel mål från öppet spel (motsatt till herrserien som är högre för hörnor)
- Test: Kategorisering av alla mål efter ursprung (hörnor, fasta situationer, öppet spel) och jämförelse mellan serierna

---

### Finding 013 — Dam och herr visar likartad målminutsfördelning

**H-förslag 1:**
- Claim: Herrserien har högre målandel i 80–89 minuter (13,3 %) på grund av fler täta matcher där slutskedet är avgörande
- Competing: Skillnaden är ett statistiskt brus förklarbart av att damserien är mindre (cirka en tredjedel av herrseriens storlek)
- Predicted: Herrserien bör ha signifikant högre målandel i slutminuterna om täta matcher är drivande; damserien bör följa samma mönster om det är bara slumpmässig variation
- Test: Analysera matchresultatdata för att identifiera täta matchserier i herr versus dam; jämför målfördelning i slutskedet mellan täta och spridda matchscheman

**H-förslag 2:**
- Claim: Damserien är svagare i intervallet 30–39 minuter (9,1 %, avvikelse −1,2 pp) på grund av skilda taktiska mönster eller bytesfrekvens
- Competing: Skillnaden är ett statistiskt brus förklarbart av att damserien är betydligt mindre än herrserien
- Predicted: Om taktiska faktorer spelar roll bör damserien ha systematiskt lägre målfrekvens i 30–39 minuter över många säsonger; om det är brus bör avvikelsen försvinna eller variera slumpmässigt
- Test: Granska bytesfrekvens och taktiska skift per serie under 30–39 minuter; utför signifikanstestning givet seriestorleksskillnaden

**H-förslag 3:**
- Claim: Strukturella krafter (trötthet, taktiska öppningar, desperation) verkar på likartat sätt i båda serierna
- Competing: Likheterna är överdrivna; skillnaderna kan indikera att dessa faktorer verkar olika mellan serierna trots liknande kurvform
- Predicted: Båda serier bör visa samma percentuella toppar och dalar på motsvarande tidpunkter; en närmast identisk kurva
- Test: Jämför målfördelning serie för serie över flera säsonger; testa om avvikelserna är statistiskt signifikanta eller inom förväntad slumpmässig variation

---

### Finding 014 — Bortalagets hörnor konverteras lika ofta

**H-förslag 1:**
- Claim: Hemmalagsfördelen i hörnor är kvantitativ (fler hörnor) snarare än kvalitativ (högre konverteringsgrad)
- Competing: Hemmalagsfördelen är kvalitativ, dvs hemmalaget är skickligare på att omvandla hörnor till mål
- Predicted: Hemmalagskönverteringsgrad signifikant högre än bortalagskönverteringsgrad
- Test: Statistisk signifikanstestning av konverteringsgraddifferensen (0,3 procentenheter) med confidentintervall

**H-förslag 2:**
- Claim: Bortalaget är mer beroende av standardsituationer (hörnor) för målskapande än hemmalaget
- Competing: Bortalaget har samma målskapande fördelning mellan öppet spel och standardsituationer, och skillnaden är slumpmässig
- Predicted: Hörn utgör 22,7% av bortalagsmål versus 21,8% för hemmalaget
- Test: Separat analys av total målfördelning mellan öppet spel och standardsituationer för båda lagen

**H-förslag 3:**
- Claim: Hemmalaget får fler hörnor på grund av bredare hemmaeffekt (mer bollinnehav, tryck framåt)
- Competing: Skillnaden i hörnantal förklaras av andra faktorer än hemmaeffekt (t.ex. lagstyrka, spelarskicklighet eller slump)
- Predicted: 794 fler hörnor för hemmalaget under perioden
- Test: Jämföring av bollinnehavsstatistik och offensiv press mellan hem- och bortalagsuppgifter

---

### Finding 015 — Större halvtidsledning ger dramatiskt högre vinst

**H-förslag 1:**
- Claim: Förlustandelen på 4 % vid 3+–0 kan förklaras av statistisk brus, extremt ovanliga matcher eller registreringsfel
- Competing: Förlustandelen på 4 % vid 3+–0 representerar en verklig spelmekanisk fenomen (t.ex. psykologiska faktorer, truppsammanställning eller taktiska justeringar) som gör att ledande lag faktiskt förlorar i denna situation
- Predicted: Förlustandelen vid 3+–0 är antingen ~0 % (om brus/fel är förklaringen) eller 4+ % stabil över tid (om det är verkligt fenomen)
- Test: Validera data på registreringsfel; replikera analysen på annan datasätt eller senare säsong; undersök om förlustandelen är konsistent eller fluktuerande

**H-förslag 2:**
- Claim: Den höga matchvolymen i kategorin 3+–0 (322 matcher) är ett utslag av spelets höga poängtakt jämfört med fotboll
- Competing: Den höga matchvolymen beror på andra faktorer såsom utvecklingen av spelets taktik, lagstyrka-obalans i serien eller särskilda matchningar mellan starka och svaga lag
- Predicted: Om höga poängtakt är förklaringen: tregålsledningar vid halvtid bör korrelera direkt med genomsnittligt poängantal per match; andra ligaformat med olika poängtakt bör visa motsatt mönster
- Test: Jämför frekvensen av 3+–0-ledningar över olika ligastarter/säsonger; korrelera med genomsnittlig poängtakt; jämför med andra lagsport med olika genomsnittlig målfrekvens

**H-förslag 3:**
- Claim: Sambandet mellan måldifferens vid halvtid och vinstprobabilitet är en konsekvent gradient (~16–18 procentenheter per mål) snarare än ett tröskelvärde
- Competing: Det finns ett eller flera dolda tröskellägen som inte framgår av denna aggregering men som träder fram vid finkornig analys (t.ex. skillnad mellan 1–0 och 2–1)
- Predicted: Gradienten är jämn (16–18 procentenheter per ytterligare mål) utan större avvikelser mellan olika måldifferenser
- Test: Analysera vinstprobabilitet för varje enskild måldifferens (1–0, 1–1, 2–0, 2–1, osv.) separat; visualisera fördelningen; testa statistisk signifikans för divergenser från den linjära modellen

---

### Finding 016 — Hemmaled vid halvtid vinner oftare

**H-förslag 1:**
- Claim: Hemmalag konverterar sin halvtidsledning oftare än bortalag på grund av gynnsamma förhållanden (publik, känd planyta) som de kan fortsätta utnyttja
- Competing: Bortalag i ledning möter ett hemmalag som höjer sig, tar fler risker och får stöd av omgivningen för att vända matchen
- Predicted: Hemmalag: ~80% (4/5), Bortalag: ~75% (3/4)
- Test: Analysera om hemmalags prestation förändras mindre mellan halvlek jämfört med bortalags prestation när de leder vid halvtid

**H-förslag 2:**
- Claim: Skillnaden i konverteringsgrad mellan hemma- och bortalag förklaras av urvalstorleksskillnaden (528 vs 379 fall)
- Competing: Skillnaden på 4,9 procentenheter är ett verkligt mönster som återspeglar faktisk skillnad i prestation mellan hem- och bortalag
- Predicted: Om denna hypotes stämmer bör skillnaden minska när urvalsstorlekarna normaliseras
- Test: Statistisk signifikanstest med kontroll för urvalsstorlek eller slumpmässig undersampling av den större gruppen

**H-förslag 3:**
- Claim: Läget på tavlan vid halvtid väger tyngre än hemmaförhållandeför att förklara slutresultat
- Competing: Hemmafördelen är en separate faktor som signifikant påverkar konvertering av halvtidsledning
- Predicted: Hemma- och bortalags konverteringsgrader bör vara nära varandra (~77-79%) om läget väger tyngst
- Test: Jämför konverteringsgrader direkt mellan hem- och bortalag när andra variabler kontrolleras

---

### Finding 017 — Comebacks startar tidigare i andra halvlek

**H-förslag 1:**
- Claim: Tidiga reduceringsmål i andra halvlek (96–100 min) orsakar comebacks genom att ge laget tid att spela om matchen och sänka motståndaren
- Competing: Lag som gör tidiga 2H-mål är generellt starkare eller har bättre tempo — målet är en markör för lagstyrka, inte orsaken till comeback
- Predicted: Comeback-sannolikhet bör vara 27% vid 96–100 min om tidigt mål är kausalt, men kan vara 0% om det är endast en korrelation med starkare lag
- Test: Kontrollera för lagstyrka/ELO-rating och jämför comeback-frekvens mellan starka och svaga lag vid samma tidsintervall

**H-förslag 2:**
- Claim: Matchdynamiken driver båda variablerna (tidiga mål och comebacks) parallellt, snarare än att det ena orsakar det andra
- Competing: Det tidiga målet i sig är den direkta orsaken till ökad comeback-sannolikhet
- Predicted: Om matchdynamik är drivande bör andra indikatorer på matchmomentum (skott, bollinnehav, passningsackuratess) predicera comeback lika väl som tidiga mål
- Test: Analysera om andra aktivitetsmått i 90–100 min korrelerar med comeback-frekvens oberoende av målen

**H-förslag 3:**
- Claim: Den kritiska perioden för comeback är de första tio minuterna av andra halvlek — efter minut 110 är comeback praktiskt taget omöjligt
- Competing: Tidsintervallerna reflekterar endast att matchens totala varaktighet är begränsad; sent reduceringsmål är statistiskt osannolikt oavsett effekt
- Predicted: Comeback-frekvens efter minut 121 är nästan 0% enligt materialet
- Test: Jämför comeback-frekvens mellan olika tidsintervall och kontrollera för återstående matchminuter för att isolera tidseffekten från intervalleffekten

---

### Finding 018 — VSK och Nässjö: hörnamål jämfört

**H-förslag 1:**
- Claim: VSK:s högre konverteringsgrad (12,7 %) under 'Västerås SK'-perioden beror på effektivare uppspel eller avslut från hörna
- Competing: Skillnaden beror på spelstil, spelarunderlag eller periodval snarare än på hörnkvalitet
- Predicted: VSK skulle ha högre målkonvertering från hörnor även under andra säsonger/perioder om hypotesen är korrekt
- Test: Jämför VSK:s konverteringsgrad mellan olika säsonger med kontroll för spelarsamansättning och taktisk setup

**H-förslag 2:**
- Claim: Den stora spridningen mellan VSK-perioderna (konvertering 12,7 % vs 9,4 %) förklaras av datakvalitetsproblem eller metodologiska skillnader mellan perioderna
- Competing: Spridningen återspeglar faktiska prestationsskillnader mellan olika säsonger eller lagsammansättningar
- Predicted: Om datakvalitet är problemet skulle VSK:s värden normaliseras när data valideras; om det är faktiska skillnader skulle de vara stabila över tid
- Test: Validera datakvalitet för båda perioder och kontrollera om namn-ändringen korrelerar med säsongsgränser eller lagfusioner

**H-förslag 3:**
- Claim: VSK:s större hörnfrekvens (10,4 per match under 'Västerås SK') beror på att laget skapar fler situationer som leder till hörnor
- Competing: Skillnaden kan bero på opponenternas försvarsstil, matchkontextkvalitet eller motspelarnas strategi snarare än VSK:s egen spelstil
- Predicted: VSK skulle ha konsistent högre hörnfrekvens mot olika motståndare om hypotesen är korrekt
- Test: Analysera VSK:s hörnfrekvens uppdelat per motståndare för att se om mönstret är konsistent eller varierar beroende på opposition

---

### Finding 019 — Målen klustrar tydligt i herrbandy

**H-förslag 1:**
- Claim: Tidig målproduktion i täta matcher beror på att tidigt ledande lag ändrar taktik
- Competing: Tidig målproduktion beror på att lag som håller tätt i inledningen ofta svarar snabbt på mål
- Test: Analysera taktiska förändringar och motsvar-mål-mönster i herrdata; jämför målfrekvens efter tidigt mål mellan lag som spelar tätt vs öppet

**H-förslag 2:**
- Claim: Herrdata visar ett linjärt mönster som är representativt för dambandy på grund av strukturella likheter
- Competing: Dammatcher följer ett annat mönster än herrdata på grund av skillnader i spelarstyrka, lagdjup, taktisk mognad, matchtäthet eller bytesfrekvens
- Test: Analysera dambandy-dataset med samma struktur som herrdata och jämför målklustermönster mellan könen

**H-förslag 3:**
- Claim: Slutminuternas målbild påverkas likadant i dam- och herrbandy
- Competing: Slutminuternas målbild påverkas annorlunda i dambandy på grund av konditionsprofil och bytesfrekvens som skiljer sig från herrar
- Test: Jämför målfrekvens i slutminuter mellan dam- och herrbandy för att identifiera skillnader i slutspelets intensitet

---

### Finding 020 — Dammatchdata saknas för jämförelse

**H-förslag 1:**
- Claim: Matchdynamiken — där ledande lag sänker defensivt fokus — förklarar det inverterade mönstret i herrbandy (jämna matcher front-loaded, öppna matcher back-loaded)
- Competing: Andra faktorer som skiftande taktik, spelarens utmattning eller regelförändringar under match förklarar fördelningen lika väl
- Predicted: I herrbandy: fler mål sent i öppna matcher, färre mål sent i jämna matcher
- Test: Analysera målfördelning över matchminut stratifierat efter slutresultat-marginal i herrbandy

**H-förslag 2:**
- Claim: Samma matchdynamiska mekanismer gäller i dambandy som i herrbandy
- Competing: Dambandy har olika speltempo, fysiska förutsättningar och taktiska konventioner som producerar en annan tidsprofil för marginalklasser
- Predicted: Dambandy visar samma inverterade mönster som herrbandy (jämna matcher front-loaded, öppna matcher back-loaded)
- Test: Jämför målminutfördelning mellan herr- och damserier med identisk datastruktur (målminut, match-id, slutresultat)

---

### Finding 021 — Mellankategorin: måldistribution vid 2–3 måls marginal

**H-förslag 1:**
- Claim: Mellankategorin (2–3 mål) uppvisar en flackare, mer jämnt fördelad kurva som kompromiss mellan de två extremerna
- Competing: Mellankategorin är heterogen och blandas två beteendemönster: matcher som avgjorts gradvis respektive matcher som avgjorts tidigt men inte tillräckligt öppna
- Predicted: Homogen kategori skulle visa en smooth, monoton kurva; heterogen kategori skulle visa en bimodal eller mer varierande fördelning
- Test: Analysera matchnivådata för mellankategorin för att identifiera om kurvan är unimodal eller multimodal, eller segmentera kategorierna vidare för att separera undergrupper

**H-förslag 2:**
- Claim: Jämna matcher (0–1 mål) domineras av tidiga mål: nästan en femtedel av alla mål görs under första tio minuter
- Competing: Det observerade mönstret beror på att matcherna är så täta att en tidig målgivare redan definierar matchtypen, snarare än att tidigt tempo är orsaken
- Predicted: Cirka 20% av mål i första 10 minuter för 0–1-kategori, motsatt trend i senare matcher för 4+-kategori
- Test: Kontrollera tempofördelningen före respektive efter första målet i jämna matcher för att separera orsak från konsekvens

**H-förslag 3:**
- Claim: Öppna matcher (4+ mål) karakteriseras av dominans i slutfasen, särskilt 80–89 minuter med 20,3%
- Competing: Höga målantal kan föra med sig en förändring i spieltid eller regelförhållanden senare i match, vilket påverkar målfördelningen oberoende av ett underliggande spelmönster
- Predicted: 20,3% av mål i 80–89 minuter för 4+-matcher; motsatt distribution för 0–1-matcher
- Test: Jämför målfördelning per tidsintervall mellan matcher stratifierade på samma målsumma men olika matchkontext (liga, serien)

---

### Finding 022 — Hörnmål slås in lika ofta hemma som borta

**H-förslag 1:**
- Claim: Hemmalags högre hörnkonvertering beror på att de får hörnor i gynnsamma lägen genom offensiv dominans
- Competing: Hemmalags högre konvertering beror på andra faktorer än hörnornas kvalitet, såsom bättre skytteteknik eller psykologisk fördel
- Predicted: Hemmalags konverteringsfrekvens bör vara högre än bortalags (11,6% vs 11,3%)
- Test: Klassificera hörnor efter lägestyp och kontrollera om hemmalag får hörnor från bättre positioner; jämför även skyttstyrka oberoende av hörnkvalitet

**H-förslag 2:**
- Claim: Bortalags högre hörnmålsprocent (andel av totalt mål) beror på att de är mindre offensivt dominanta och därmed mer beroende av standardsituationer
- Competing: Bortalags högre hörnmålsprocent beror på att de skjuter effektivare från hörnor när de väl får dem, inte på mindre offensiv dominans
- Predicted: Hörnmål utgör större andel av bortalags målproduktion än hemmalags
- Test: Analysera om bortalags skyttefrekkvens från hörnor är högre än hemmalags, kontrollerat för hörnantal

**H-förslag 3:**
- Claim: Liknande konverteringsfrekvenser (11,6% vs 11,3%) tyder på att selektion av hörnor är likartad oavsett hemma/bortaroll
- Competing: Likartade konverteringsfrekvenser kan bero på att skillnader i hörnkvalitet motverkas av skillnader i skyttstyrka mellan hemma- och bortalag
- Predicted: Konverteringsfrekvens hemma och borta skiljer sig mindre än 0,5 procentenheter
- Test: Kontrollera högörnarnas genomsnittliga lägespoäng för hemma respektive borta; analysera om högre lägespoäng för hemmalag motvägs av bättre bortalagsskyttar

---

### Finding 023 — Damernas målfördelning saknar tillräcklig data

**H-förslag 1:**
- Claim: Datasetet returnerar tomma serier på grund av att damernas matchprotokoll saknar tidsstämplar på mål
- Competing: Datakällan täcker inte damelitserien alls, eller ett tekniskt fel uppstod i hämtningen
- Test: Kontrollera källdatafilen för tidsstämplar och verifica om damelitserien ingår i datakällan

**H-förslag 2:**
- Claim: Dambandy uppvisar ett liknande sluttryck som herrbandy, vilket indikerar att fenomenet är strukturellt kopplat till matchens dynamik
- Competing: Sluttrycket saknas eller är svagare i damserien, vilket pekar på skillnader i energinivåer, taktiska val eller matchrytm mellan könen
- Predicted: Liknande sluttryckmönster mellan dam- och herrserien versus svagare eller frånvarande sluttryck i damserien
- Test: Jämför målfrekvens och målfördelning över matchens slutfas mellan dam- och herrelitserien när korrekt data finns tillgänglig

---

### Finding 024 — Vändningar sker i 16 % av matcher

**H-förslag 1:**
- Claim: Halvtidsledningen är som mest sårbar direkt efter paus (91-100 minuter)
- Competing: Sårbarhetens maxpunkt ligger senare i andra halvlek, eller är jämnt fördelad över tiden
- Predicted: 61,8% av avgörande mål i vändningsmatcher faller inom 91-100 minuter
- Test: Jämför målfördelningen per minutintervall i andra halvlek för vändningsmatcher; testa om 61,8% är signifikant högre än andra intervalls andel

**H-förslag 2:**
- Claim: Ett lag som inte vänd ställningen innan cirka 120-minutersmarkeringen gör det sällan eller aldrig
- Competing: Vänd-målens fördelning efter 120 minuter är jämförbar med tidigare perioder, eller ökar senare
- Predicted: Endast 2 av 123 vändningsmål (1,6%) föll efter minut 120
- Test: Analysera andelen vänd-mål efter 120 minuter; testa om denna andel är statistiskt signifikant lägre än före 120 minuter

**H-förslag 3:**
- Claim: Lag som lyckas vända matcher sätter in sitt tryck tidigare och lyckas omsätta det till mål redan i inledningen av andra halvlek
- Competing: Lag som vänd matcher lyckas omsätta sitt tryck till mål senare i andra halvlek, eller tiden för trycksättning skiljer sig inte mellan vänd- och icke-vändningsmatcher
- Predicted: Första målet i andra halvlek för vändningsmatcher inträffar tidigare (55,7 min) än för icke-vändningsmatcher (62,1 min)
- Test: Jämför genomsnittlig tid för första mål i andra halvlek mellan vänd- och icke-vändningsmatcher; testa om skillnaden är statistiskt signifikant

---

### Finding 025 — Halvtidsledning avgör mindre i semifinal

**H-förslag 1:**
- Claim: Jämnheten ökar när de svagaste lagen sållats bort, vilket förklarar lägre konvertering av halvtidsledning i semifinal jämfört med kvartsfinal
- Competing: Andra faktorer än ökad jämnhet (t.ex. taktiska anpassningar, utmattning, psykologiska faktorer) förklarar skillnaden i konverteringsgrad
- Predicted: Halvtidsledning konverteras till seger i 71% av kvartsfinaler men endast 53% av semifinaler
- Test: Analysera lagstyrkefördelning (spridning/varians) bland motståndare i kvarts- respektive semifinal; jämför även andra variabler som förändring i målsnittet och matchkvalitet

**H-förslag 2:**
- Claim: Lägre målsnitt i semifinal jämfört med kvartsfinal förklaras av defensiv pressing när matcherna jämnas ut
- Competing: Lägre målsnitt beror på andra faktorer såsom förbättrad målvaktsprestation, mer konservativ taktik eller mindre tid för öppna lägen på grund av intensivare tempo
- Predicted: Målsnittet sjunker från kvartsfinal till semifinal med 0,42 mål per match
- Test: Jämför skuddstal, skuddar på mål och possessionsmönster mellan kvarts- och semifinaler; analysera tidsmönstret för målskördar

**H-förslag 3:**
- Claim: Finalen bryter mönstret eftersom topplag dominerar även i jämnare matcher poängmässigt
- Competing: Det lilla underlaget (8 matcher) gör att finalen inte representativ, eller så finns andra faktorer som hemmalagsfördel, motivationsskillnader eller slumpvariation
- Predicted: Halvtidsledning konverteras till seger i 87,5% av finaler trots lägsta målsnittet
- Test: Öka stickprovsstorlek för finaler; analysera topplagens prestationsskillnad mot övriga lag; kontrollera för hemmalagsfördel

---

### Finding 026 — Hemmafördel stärker halvtidsledningens prediktiva kraft

**H-förslag 1:**
- Claim: Hemmafördelen och halvtidsledning interagerar genom att bortalag som leder möter hårdare motreaktion under andra halvleken
- Competing: Skillnaden i konverteringsfrekvens mellan hemma- och bortalag i ledande position beror på systematiska skillnader i motståndets kvalitet mellan grupperna, inte på interaktionseffekten
- Predicted: Bortalag i ledande position vid halvtid har 4,9 procentenheter lägre konverteringsfrekvens än hemmalag i samma position
- Test: Kontrollera för motståndets genomsnittliga styrka/ranking när hemmalag respektive bortalag leder vid halvtid; om skillnaden försvinner när man justerar för motståndskvalitet, stödjer det alternativhypotesen

**H-förslag 2:**
- Claim: Bortalag väljer defensivare upplägg för att försvara en halvtidsleaning, vilket reducerar konverteringsfrekvensen
- Competing: Reducerad konverteringsfrekvens för bortalag beror på att hemmalaget helt enkelt spelar mer offensivt för att vända underläget, inte på bortalagets defensiva strategi
- Predicted: Bortalag i ledande position visar lägre skuddantal eller lägre bollinnehav än hemmalag i motsvarande situation
- Test: Analysera bollinnehav, passeringskartor och skuddstatistik för bortalag kontra hemmalag när de leder vid halvtid

**H-förslag 3:**
- Claim: Den asymmetriska fördelningen av matcher (379 borta-ledningar mot 528 hemma-ledningar vid halvtid) kan påverka jämförelsen om motståndskvaliteten systematiskt skiljer sig
- Competing: Skillnaden i matchantal reflekterar enbart hemmafördelen på aggregerad nivå och påverkar inte jämförbarheten av de två gruppernas konverteringsfrekvenser
- Predicted: Motståndets genomsnittliga styrka skiljer sig systematiskt mellan matcher där hemmalag leder och matcher där bortalag leder vid halvtid
- Test: Jämför motspelarnas ranking/rating mellan de två gruppmatcherna; regressionsanalys med motståndskvalitet som kontrollvariabel

---

### Finding 027 — Data saknas för taktisk hörnanalys

**H-förslag 1:**
- Claim: Tomheten i datasetet beror på att hörntyper aldrig kodats i källdata
- Competing: Tomheten beror på ett tekniskt fel i datapipelinen eller att data ännu inte insamlats
- Test: Kontrollera källdata direkt för hörnkodningar; verifiera datapipelinens funktionalitet; kontrollera om datainsamlingen är slutförd

**H-förslag 2:**
- Claim: Systematiska skillnader i hörnytter mellan serier (Elitserien vs Division 1) beror på skillnader i taktisk mognad
- Competing: Skillnaderna beror på tränarpreferenser eller skillnader i spelarresurser mellan serierna
- Test: Jämför hörnytter mellan serier när data är tillgänglig; kontrollera för tränarpreferenser och spelarresurser som kovariater

**H-förslag 3:**
- Claim: Hörntypsval påverkar hur snabbt ett anfall kan avslutas
- Competing: Hörntypsval påverkar vilken försvarstryck som uppstår, men inte anfallshastigheten
- Test: Analysera korrelation mellan hörnytter (kort spel kontra direktinlägg) och anfallsvaraktighet när data finns tillgängligt

---

### Finding 028 — Hörneffektivitet damserie: data saknas

**H-förslag 1:**
- Claim: De tomma serierna beror på att den underliggande databasen saknar hörnstatistik för damserien
- Competing: Kopplingen mellan Finding 012 och dess datakälla är trasig
- Test: Kontrollera om hörnstatistikdata finns i databasen för damserien; verifiera datakällans innehål oberoende av kopplingen

**H-förslag 2:**
- Claim: De tomma serierna beror på att filtreringen på seriebeteckning inte matchar hur data är märkt
- Competing: Kopplingen mellan Finding 012 och dess datakälla är trasig eller databasen saknar data
- Test: Granska filterkriterierna och jämför med faktisk märkning av data i systemet

**H-förslag 3:**
- Claim: Problemet är ett dataproblem (data saknas eller är felaktigt länkat) snarare än ett strukturproblem
- Competing: Problemet är ett strukturproblem med analysflödet
- Test: Verifiera att objekttypen corner_efficiency_comparison är korrekt konfigurerad; kontrollera sedan om data kan importeras och länkas korrekt

---

### Finding 029 — Mållagens ursprung utanför hörnor i damserien

**H-förslag 1:**
- Claim: Det tomma dataunderlaget för damserien beror på att klassificeringen av aktionstyper inte genomförts
- Competing: Data har inte exporterats korrekt från källsystemet
- Test: Kontrollera klassificeringssystemets loggfiler och verifica exportprocessen från källsystemet

**H-förslag 2:**
- Claim: Den saknade datan förklaras av att manuell kodning utan överenskommet klassifikationsschema blir inkonsekvent
- Competing: Klassificeringen är genomförd men data är inte exporterad korrekt från källsystemet
- Test: Granska kodningsrichtlinjer och konsistensgranskningar för redan kodad data; verifiera exportloggar

---

### Finding 030 — Hörneffektivitet och matchläge: data saknas

**H-förslag 1:**
- Claim: Datakällan är tom på grund av att hörnhändelser saknar koppling till matchställningsdata i databasen
- Competing: Finding 012 kördes mot ett tomt dataurval, eller pipeline-steget som klassificerar matchläge har ett fel som filtrerar bort alla rader
- Test: Kontrollera om hörnhändelser existerar i källdata; verifiera dataurvalet för Finding 012; granska pipeline-loggar för filtreringskriterier

**H-förslag 2:**
- Claim: Matchläget påverkar taktiska val vid hörnexekvering och -besättning i bandy
- Competing: Matchläget har ingen signifikant påverkan på hörnstrategier
- Test: Länka hörnhändelser till exakt matchställning och analysera skillnader i hörnexekvering mellan ledande och underlägsna lägen

**H-förslag 3:**
- Claim: Det är möjligt att dra slutsatser om ledande eller underlägsna lags effektivitet på hörn från detta underlag
- Competing: Slutsatser kan inte dras på grund av granularitetskrav i händelseloggen som inte är uppfyllda
- Test: Verifiera om varje hörnhändelse kan länkas till exakt matchställning med tillräcklig tidsupplösning

---

### Finding 031 — Slutminutstopp: täta resultat eller serienivå?

**H-förslag 1:**
- Claim: Slutminutstoppens målökning i herrbandy förklaras av täta resultat som trigger ökad anfallsfrekvens från förlorande lag och defensivare spel från ledande lag
- Competing: Slutminutstoppens målökning förklaras av serietillhörighet – lägre divisioner har mindre disciplinerade defensiver eller lägre konditionsnivå sent i matcher
- Predicted: Om marginal-hypotesen är korrekt: målökning korrelerar med matchmarginal oavsett serie. Om serie-hypotesen är korrekt: målökning är konsistent inom divisioner oavsett marginal
- Test: Klassificera alla mål efter både den då rådande matchmarginalen och matchens serietillhörighet, sedan analysera vilken variabel som förklarar målökningen bättre

**H-förslag 2:**
- Claim: Databasen saknar den kombination av tidsstämplar och resultatögonblicksbilder per minut som krävs för klassificering
- Competing: Filtreringen i analyspipelinen har inte fungerat som avsett och har exkluderat nödvändiga data
- Test: Verifiera original-datakonstruktionen mot pipeline-koden för att identifiera om problemet ligger i datakällans struktur eller i filterlogiken

---

### Finding 032 — Målminutsfördelning per division: ingen data tillgänglig

**H-förslag 1:**
- Claim: Intensitetsskillnader mellan elitnivå och lägre divisioner påverkar när under matchen mål tenderar att falla
- Competing: Målminutsfördelningen är identisk mellan divisioner oberoende av intensitetsskillnader
- Predicted: Signifikant skillnad i målfördelning över matchminuter mellan divisioner
- Test: Testa målminutsfördelning per division med tillräcklig matchdata och beräkna statistisk signifikans

**H-förslag 2:**
- Claim: Matchdata i källsystemet är inte konsekvent märkt med divisionstillhörighet eller koppling mellan matchhändelser och seriemetadata löst upp felaktigt
- Competing: Ett filterfel har exkluderat alla rader från analysen
- Predicted: Noll rader returneras från datapipelinen
- Test: Inspektera datapipelinens filtreringslogik och verifiera att källsystemets divisionstillhörighet är korrekt mappat

---

### Finding 033 — Hörnmål fördelas jämnt — bortaeffekt syns i konvertering

**H-förslag 1:**
- Claim: Bortalaget har svårare att skapa mål i öppet spel och är därför mer beroende av satta situationer
- Competing: Hemmalaget dominerar öppet spel i tillräcklig utsträckning för att späda ut hörnmålens andel
- Predicted: Bortalaget skulle visa lägre konverteringsgrad i öppet spel än hemmalaget
- Test: Analysera konverteringsgrad för mål från öppet spel separat för hem- och bortalag

**H-förslag 2:**
- Claim: Hemmaeffekten på hörnor är svag totalt sett
- Competing: Hemmaeffekten är koncentrerad till slutskedet av matcher, särskilt tredje period
- Predicted: Om perioddata fanns skulle tredje period visa större hemmaeffekt än första och andra period
- Test: Tidsstämpla varje hörnmål per period och beräkna konverteringsgrad för hem- och bortalag per period

---

### Finding 034 — Bortalagets hörneffektivitet marginellt lägre

**H-förslag 1:**
- Claim: Hemmafördelen tar sig uttryck i hörneffektivitet
- Competing: Hemmafördelen ligger i andra delar av spelet, såsom antal tillfällen eller målchansfrekvens utanför standardsituationer
- Predicted: Hemmalag skulle ha högre konverteringsgrad på hörnor än bortalag
- Test: Jämföra konverteringsgrad på hörnor mellan hem- och bortalag (genomfördes; resultat: 0,3 procentenheter skillnad, vilket bedömdes som liten)

**H-förslag 2:**
- Claim: Bortalag är bättre på att utnyttja hörnor än hemmalag
- Competing: Den högre andelen hörnmål av totalmål hos bortalagen är ett räknetekniskt fenomen: bortalag scorer färre totala mål, vilket gör varje hörnmål viktigare procentuellt
- Predicted: Bortalag skulle ha högre konverteringsgrad på hörnor
- Test: Jämföra konverteringsgrad på hörnor (visar marginell nackdel för bortalag, inte fördel)

**H-förslag 3:**
- Claim: Hörneffektiviteten är jämnt fördelad mellan lag på aggregativ nivå
- Competing: Aggregatdata döljer potentiell heterogenitet: enskilda lag kan ha systematiska hem/borta-skillnader i hörneffektivitet trots att snitten hamnar nära varandra
- Predicted: Snittdata visar liten skillnad, men enskilda lag kan ha olika profiler
- Test: Lagspecifik analys av hörneffektivitet hemma kontra borta för att avslöja potentiell variation mellan enskilda lag

---

### Finding 035 — Hörnkonvertering skiljer knappt mellan hemma och borta

**H-förslag 1:**
- Claim: Defensiv uppställning hos bortalaget har en systematisk dämpande effekt på hemmalagets hörnkonvertering
- Competing: Defensiv uppställning saknar betydelse för hörnkonvertering; den observerade likheten beror på att variationen mellan olika bortalags defensiva formationer tar ut varandra i aggregatet
- Predicted: Ett tydligt gap (större än 0,3 procentenheter) mellan hem- och bortakonvertering om hypotesen är sann
- Test: Analysera konverteringsfrekvens per hörna med kontroll för defensiv formation (antal försvarsspelare bakom bollen, presslinje, formationsval)

**H-förslag 2:**
- Claim: Bortalaget är bättre på hörnor än hemmalaget, vilket förklarar deras högre andel hörnmål (22,7 % mot 21,8 %)
- Competing: Bortalaget är inte bättre på hörnor; den högre andelen hörnmål av totala mål beror på att deras övriga anfallsspel genererar färre mål (matchdynamik snarare än hörnkompetens)
- Predicted: Högre andel hörnmål för bortalaget om hypotesen är sann
- Test: Analysera matchdynamik: jämför total målproduktion från öppen spel mellan hem- och bortalag för att isolera effekten av anfallsspelskvalitet från hörneffektivitet

**H-förslag 3:**
- Claim: Hemma- och bortaroller i sig förklarar hörnkonverteringsfrekvensen
- Competing: Hörnkonvertering förklaras inte av hemma/bortarollen utan av andra faktorer som defensiv uppställning eller matchdynamik
- Predicted: Signifikant skillnad i hörnkonvertering mellan hem- och bortalag om hypotesen är sann
- Test: Testa om hörnkonvertering korrelerar med hemma/bortarollen när man kontrollerar för andra variabler som defensiv formation och total målproduktion

---

### Finding 036 — Hemmaledning håller oftare än bortaledning

**H-förslag 1:**
- Claim: Hemmaplansfördelen adderas till det psykologiska läget av att leda vid halvtid
- Competing: Hemmaplansfördelen neutraliseras eller reduceras signifikant när bortalaget leder vid halvtid
- Predicted: Hemmalaget som leder vid halvtid har högre vinstprocent än bortalaget som leder vid halvtid
- Test: Jämföra vinstprocenten för hemmalaget vs bortalaget vid halvtidsledning

**H-förslag 2:**
- Claim: Hemmaplansfördelen kvarstår som en dämpad motkraft under andra halvlek även när bortalaget leder vid halvtid
- Competing: En halvtidsledning för bortalaget är tillräcklig för att helt eller nästan helt neutralisera hemmaplansfördelen
- Predicted: Bortalaget som leder vid halvtid vinner minst 75% av matcherna
- Test: Kontrollera om bortalagets vinstprocent vid halvtidsledning är signifikant lägre än hemmalaggets motsvarande procent

**H-förslag 3:**
- Claim: Halvtidsledningen är en meningsfull prediktiv signal oavsett matchlokal
- Competing: Halvtidsledningens prediktiva kraft varierar dramatiskt beroende på om det är hem- eller bortalag
- Predicted: Både hemmalaget och bortalaget visar klart förhöjda vinstchanser jämfört med basfall
- Test: Jämföra vinstchanser för båda grupperingar mot ett hypotetiskt basfall utan halvtidsledning

---

### Finding 037 — Vändningar sällsynta efter 1–0 i halvtid

**H-förslag 1:**
- Claim: Det bakåtliggande lagets press blir avgörande sent i matchen på grund av ökad risktagning och fysisk nedgång hos det ledande laget
- Competing: Det tidiga insläppet av mål tvingar det ledande laget att omgruppera och öppnar matchbilden, vilket ger det bakåtliggande laget fler chanser
- Predicted: 61,8% av comeback-kvitteringar efter minut 90
- Test: Analyser av passningsspel, pressstatistik och fysiska prestationsindikatorer för båda lagen vid olika matchfaser i comeback-matcher

**H-förslag 2:**
- Claim: Ett tidigt bakslag tvingar det ledande laget att omgruppera och öppnar matchbilden för fler chanser
- Competing: Ett sent insläppt mål möts av ett försvar som lyckas hålla undan utan att matchbilden öppnas upp på samma sätt
- Predicted: Tidigare genomsnittlig tidpunkt för första mål i comebackmatcher (55,7 minuter) jämfört med icke-comebackmatcher (62,1 minuter)
- Test: Jämföra matchbildens öppenhet och antalet chanser före och efter comebackmål samt analysera försvarsstabiliteten i matcher utan tidiga bakslag

**H-förslag 3:**
- Claim: De 662 icke-comebackmatcher innehåller en betydande andel oavgjorda matcher snarare än full vändning från 1-0-ledning
- Competing: De 662 icke-comebackmatcher är i huvudsak matcher där 1-0-ledningen höll fram till slutet utan vändning eller oavgjord
- Predicted: Exakt andel oavgjorda matcher bland de 662 icke-comebacksen är okänd utan granulär data
- Test: Inhämta detaljerad matchdata för alla 662 icke-comebackmatcher för att särskilja slutresultat (vunna vs oavgjorda)

---

### Finding 038 — Större halvtidsledning ger markant högre vinstchans

**H-förslag 1:**
- Claim: Första halvlekens målskillnad har ett direkt orsakssamband med matchutfallet
- Competing: Starka lag tenderar att leda med fler mål vid halvtid och vinner oftare av andra skäl (t.ex. spelarkvalitet, taktik) som är oberoende av första halvlekens resultat
- Predicted: Om direkt orsakssamband: målskillnad påverkar vinstchans genom psykologisk/momentum-effekt; Om alternativ: målskillnad är endast en proxy för lagstyrka
- Test: Kontrollera för lagstyrka (spelarrating, historisk prestation) och undersök om målskillnad vid halvtid fortfarande predikterar slutresultat när man håller lagstyrka konstant

**H-förslag 2:**
- Claim: Ett tvåmålsövertag vid halvtid låser matchbilden betydligt mer än ett ensamt mål
- Competing: Ökningen i vinstchans från 1-0 till 2-0 beror på en icke-linjär effekt där varje mål är värt mindre när ledningen redan är etablerad
- Predicted: Vinstchans ökar med 18,4 procentenheter från 1-0 till 2-0; motsvarar en större relativ ökning än från 0-0 till 1-0
- Test: Jämför vinstchansen vid 0-0, 1-0 och 2-0 ledning; testa om ökningen är konstant per mål eller avtagande

**H-förslag 3:**
- Claim: Comebacks från tre måls underläge vid halvtid är statistiskt sällsynta snarare än omöjliga
- Competing: Comebacks från tre måls underläge är i praktiken så rare att de kan betraktas som nästan omöjliga för analytiska ändamål
- Predicted: Förlorarrisken är 4% vid tre måls ledning (vinstchans 96%)
- Test: Analysera faktiska comeback-frekvenser från 0-3-lägen och jämför med andra idrotter; undersök om 4% förlostarisk är praktiskt meningsfull

---

### Finding 039 — Hemmafördelen håller bättre vid halvtidsledning

**H-förslag 1:**
- Claim: Hemmaplanen ger ett mätbart extra skydd när laget väl tagit halvtidsledningen
- Competing: Skillnaden på 4,9 procentenheter är en artefakt av olika stickprovsstorlekar (528 vs 379 matcher) eller ligger inom felmarginalen
- Predicted: 4,9 procentenheters skillnad är statistiskt signifikant om konfidensintervallet inte överlapper noll
- Test: Beräkna konfidensintervall för skillnaden mellan hemma- och bortalag vid halvtidsledning

**H-förslag 2:**
- Claim: Hemmafördelen är stabil över tid
- Competing: Mönstret är inte stabilt utan växande eller krympande, eller tidiga säsonger hade större differens medan senare säsonger hade mindre
- Predicted: Homogen effektstorlek across all seasons om stabilt; varying trend if unstable
- Test: Dela upp data efter säsong och jämför hemmafördelen mellan säsonger

**H-förslag 3:**
- Claim: Hemmalag spelar med större självförtroende och publiktrycket hindrar bortalag från att ta nödvändiga risker för vändning
- Competing: Den observerade skillnaden kan förklaras av andra faktorer än psykologiska effekter (självförtroende och publiktryck)
- Test: Kontrollera för andra relevanta variabler (kvalitetsskillnad mellan hemma/bortalag, matchkontext) för att isolera psykologiska effekter

---

### Finding 040 — Hemmafördel håller — men bortaledningar är stabila

**H-förslag 1:**
- Claim: Hemmafördelen verkar redan under första halvlek, inte enbart i slutminuterna
- Competing: Hemmafördelen är primärt ett fenomen för slutskede där hemmalag motstår press bättre
- Predicted: 58% av halvtidsledningar innehas av hemmalag (motsäger null-hypotes om 50%)
- Test: Jämför fördelningen av halvtidsledningar mellan hem- och bortalag mot 50/50-fördelning

**H-förslag 2:**
- Claim: En halvtidsledning är den starkaste enskilda matchprediktor (78,1% vinstprocent) och starkare än enbart hemmaplan
- Competing: Hemmaplan är den starkaste prediktorn och halvtidsledningen är sekundär
- Predicted: Halvtidsposition förutsäger 78,1% vinstfrekvens; hemmaplan enbart 80,1% för hemmalag (jämförelse visar halvtid är relativt starkare)
- Test: Regressionsanalys eller prediktorjämförelse av hemmaplan kontra halvtidsposition på vinstutfall

**H-förslag 3:**
- Claim: Bortalag som leder vid paus har brutit hemmalagets momentum och är i gynnsam position statistiskt
- Competing: Bortalag som leder vid paus är inte i statistiskt gynnsam position utan bara tillfälligt framåtspelande
- Predicted: Bortalag med halvtidsledning konverterar till vinst i 75% av fall (3 av 4)
- Test: Jämför vinstfrekvens för bortalag med halvtidsledning mot bortalags genomsnittsvinstfrekvens totalt

---

### Finding 041 — Comebacks sker tidigare än övriga reduceringar

**H-förslag 1:**
- Claim: En tidig reducering (första 10 minuter efter paus) är en nödvändig förutsättning för att vändning ska lyckas.
- Competing: Tidig reducering korrelerar med comeback utan att vara orsakssamband; möjligt att det är ett symptom på att laget redan hade momentum eller bättre utgångsposition.
- Predicted: ~67% av comebacks inleds inom första 10 minuter; lag som reducerar efter minut 110 lyckas nästan aldrig vända
- Test: Kontrollera för andra variabler (t.ex. utgångshemmalag, målskillnad vid halvtid) och analysera om tidiga reduceringar utan uppföljning resulterar i comeback

**H-förslag 2:**
- Claim: Den tidiga reduceringen skapar en självförstärkande effekt (psykologisk eller taktisk) som gynnar vidare målskytte.
- Competing: Reduceringen är en indikatorer på ökad intensitet/tryck snarare än en orsak; laget hade redan förändrat sitt spelsätt effektivt innan målet.
- Predicted: Lag som reducerar tidigt får större målfrekvens i efterföljande period än lag som reducerar sent
- Test: Jämför målfrekvensen före och efter reducering, samt mellan comebacklag och icke-comebacklag inom samma tidsfönster

**H-förslag 3:**
- Claim: Lag med större underläge (2+ mål) behöver reducera ännu tidigare än genomsnittet för att hinna med comeback.
- Competing: Storleken på underläget påverkar inte tidspunkten för reduceringen; det är snarare den totala återstående tiden som är avgörande.
- Predicted: Genomsnittlig reduceringstid för 2+ måls underläge blir betydligt tidigare än för 1 måls underläge
- Test: Dela data efter underlägets storlek vid halvtid och jämför medianreduceringstid mellan grupperna

---

### Finding 042 — Comeback-andelen 96–100 min avviker inte från slumpen

**H-förslag 1:**
- Claim: Mål i intervallet 96–100 minuter är överrepresenterade i comeback-matcher på grund av att lag ökar risktagandet (extra målvakt, offensivare spel) när de ligger under i slutfasen
- Competing: Överrepresentationen orsakas av andra faktorer än taktiska omställningar, till exempel att matcher som går till förlängning naturligt tenderar att ha fler mål i slutminuter oavsett lag-beteende
- Predicted: 27 % av målen i 96–100 minuter ingår i comeback-matcher (p ≈ 0,0024)
- Test: Kontrollera om lag som ligger under signifikant oftare använder extra målvakt eller ökar skuddfrekvensen i 96–100 minuter jämfört med andra tidsfönster; jämför också comeback-andelen för lag som ligger under mot lag som ligger före

**H-förslag 2:**
- Claim: Lagens beteendeförändring accelererar och blir mer uttalad ju närmare matchen kommer sitt slut (taktisk intensifiering)
- Competing: Beteendeförändringen är jämnt fördelad över matchens slutfas, och skillnaden mellan 91–95 och 96–100 minuter beror på randomvariabilitet trots färre observationer i senare intervallet
- Predicted: Intervallet 96–100 visar signifikans (p ≈ 0,0024) medan 91–95 inte gör det, trots fler observationer i senare intervallet
- Test: Analysera comeback-andelen för fler granulära tidsfönster (85–90, 90–95, 95–100 minuter) för att se om trenden är monoton eller variabel

---

### Finding 043 — Tidiga 2H-comeback: lag och spelarstilar

**H-förslag 1:**
- Claim: Halvtidspausen skapar ett fönster för omställning (taktiska justeringar, byte, tempo) som ger undansittande lag ett momentant övertag direkt när matchen återupptas
- Competing: Mönstret drivs av psykologiskt beteende hos det ledande laget: deras benägenhet att sänka intensiteten direkt efter paus är tillräcklig för att förklara klustringen av comebackmål
- Test: Data på individnivå för comeback-målskytt (löpvolym, offensiva inbyten, specialisering) eller lag-nivå-data på press-intensitet per lag i tidiga 2H-minuter

**H-förslag 2:**
- Claim: Mönstret av överrepresenterade comebackmål i minut 91–100 drivs av ett fåtal lag med systematisk press tidigt i halvlekar
- Competing: Mönstret är ett generellt beteende spritt över hela serien, inte koncentrerat till specifika lag
- Predicted: 61,8 % av comeback-inledning sker i minut 91–100 mot 39,6 % för icke-comeback-matcher
- Test: Lag-nivå-analys: identifiera vilka lag initierar comebackmål i detta fönster och jämför fördelningen (koncentrerat vs spritt)

---

### Finding 044 — Bortalag gör fler mål på hörnor

**H-förslag 1:**
- Claim: Bortalag har större andel hörnmål av sitt totala målskörde för att de skapar färre fria målchanser och är mer beroende av dödbollar
- Competing: Bortalag får hörnor i situationer där de annars har svårt att skapa chanser, men är inte bättre på att utnyttja dem än hemmalaget
- Predicted: Bortalag skulle visa högre omvandlingsgrad på hörnor om första hypotesen är sann
- Test: Jämför omvandlingsgrad (hörnmål/antal hörnor) mellan hem- och bortalag kontrollerat för målskapande möjligheter i öppen spel

**H-förslag 2:**
- Claim: Hemmalaget är mer effektivt på hörnkonvertering (11,6% vs 11,3%) på grund av högre självförtroende eller bättre inövade rutiner
- Competing: Hemmalaget är mer effektivt på hörnkonvertering eftersom motståndarna försvarar sämre i bortamatcher
- Predicted: Hemmalagsmatcherna skulle visa högre hörnomvandlingsgrad än bortalagsmatcherna
- Test: Analysera försvarsmönster och ställningsuppbyggnad vid hörnförsvar hem vs borta för båda lag

---

### Finding 045 — VSK och Vetlanda nära ligasnittet i hörnakonvertering

**H-förslag 1:**
- Claim: VSK:s konverteringsökning från 9,4 % till 12,7 % efter namnbytet speglar en faktisk förändring i hur laget arbetar med hörnor
- Competing: Skillnaden är en artefakt av små urvalsstorlekar (76 och 82 matcher) eller en förändring i spelarstyrkans sammansättning
- Predicted: Konverteringsgrad över 12 % under Västerås SK-identiteten
- Test: Kontrollera om skillnaden kvarstår när urvalsstorlek ökas eller jämför spelarsammansättning före och efter namnbyte

**H-förslag 2:**
- Claim: VSK:s hörnkonvertering påverkas av förändring i spelarstyrkans sammansättning efter namnbytet
- Competing: Skillnaden beror på faktiska taktiska förändringar i hörnspelet eller är en statistisk slumpvariation
- Predicted: Specificerad förändring i genomsnittlig spelarstyrka mellan perioderna
- Test: Analysera spelarlistor och skador/transfers före och efter namnbyte, korrelera med konverteringsgrad

**H-förslag 3:**
- Claim: Vetlanda BK:s 11,6 % konverteringsgrad representerar ingen systematisk fördel eller nackdel i hörnspelet
- Competing: En 0,3 procentenhets överskridning kan vara meningsfull trots små marginalers storlek
- Predicted: Konverteringsgrad på cirka 11,6 % fortsätter om matchvolumet ökas
- Test: Utöka datasetet med ytterligare matcher och undersök om hörnkonverteringsgraden stabiliseras runt 11,6 %

---

### Finding 046 — Hörnmålsandelen faller stadigt mot final

**H-förslag 1:**
- Claim: Defensivt orienterat spel i slutspelet minskar hörnmål genom att reducera antalet hörnlägen
- Competing: Selektionseffekten: lag i slutspelet är generellt bättre organiserade defensivt, vilket naturligt producerar färre hörnlägen
- Predicted: Hörnmålsandelen sjunker ju längre in i slutspelet man kommer
- Test: Jämför hörnmålsandel över serieserie, kvart-, semi- och final; kontrollera för lagarnas genomsnittliga försvarsorganisation

**H-förslag 2:**
- Claim: Färre totala mål i slutspelet förklaras av att defensivt spel eliminerar hörnmålstillfällen
- Competing: Minskningen av totala mål och hörnmål är oberoende fenomen orsakade av ökad försvarsstabilitet snarare än specifik mekanisk koppling
- Predicted: Hörnmålsandelen av totala mål minskar med ökande seriestadium
- Test: Analysera korrelationen mellan total målminskning och hörnmålminskning; se om båda är lika starkt kopplade till lagorganisation

**H-förslag 3:**
- Claim: Slumpvariationen är hög för finalmatcherna (16,7% på 14 hörnmål) och kan förklara trenden
- Competing: Trenden från grundserie via kvarts- och semifinal är robust och inte slumpberoende, vilket indikerar en faktisk mekanisk förändring
- Predicted: Hörnmålsandelen i final är mindre tillförlitlig än i tidigare stadier
- Test: Beräkna konfidensintervall för hörnmålsandelen per stadium; kontrollera volymerna och variationen

---
