# Playalong — releasebygge `2bd333e4`, 2026-09-13

## Upplägg

- Jacob spelar i den skarpa Vercel-byggnaden och gör valen.
- Codex/Astra följer samma vy, dokumenterar observationerna och kodläser
  rötterna utan att ändra produktkod under pågående spel.
- Fokus är spelkänsla, flöde, grafik, svenska och sanningsenliga påståenden.

## Klubbvalet

### 1. Expanderat klubbkort hamnar utanför vyn

**Observerat:** När en klubb långt ned på kartan/listan väljs renderas
detaljkortet under den valda raden. Vyn följer inte med, så spelaren måste
själv scrolla för att hitta det som valet öppnade.

**Verifierad rot:** `AllClubsView.handlePillClick` byter bara
`selectedClubId`. Det expanderade `ClubExpandedCard` har varken ref,
`scrollIntoView` eller fokushantering. Den yttre klubbvalsskärmen är en egen
scrollcontainer, vilket gör att browsern inte automatiskt flyttar vyn.

**Rekommenderad åtgärd:** Scrolla det nyöppnade kortet till närmaste synliga
läge efter layout och flytta tangentbordsfokus till kortet eller dess
"Ta över"-knapp. Ingen scroll ska göras när samma klubb stängs.

### 2. Klubbtexterna utgår från en inaktuell naturismodell

**Observerat:** Hälleforsnäs beskrivs med naturis och som att konstfrusen bana
fortfarande saknas, trots att alla lag i spelets aktuella serie spelar på
konstfrusen is. Flera andra klubbar använder samma premiss.

**Verifierad rot:** `clubExtendedInfo.ts` dokumenterar uttryckligen den gamla
regeln "naturis/opålitlig is → åkande". Samma `arenaNote` visas både i
klubbvalet och i motståndarkortet på bortamatcher. Felet återkommer därför
under hela karriären, inte bara vid starten.

**Omfattning som måste rättas samlat:**

- Aktuella naturispåståenden: Forsbacka, Söderfors, Hälleforsnäs, Lesjöfors
  och Slottsbron.
- Rögle definieras i onödig kontrast till naturis trots att konstfruset är
  seriens gemensamma nutid.
- Forsbackas ankomstreplik och Forsbacka/Slottsbron-vinjetterna fortsätter
  samma premiss på andra ytor.
- Historiska sjöisminnen kan finnas kvar sparsamt, men måste tydligt vara
  dåtid och får inte beskriva dagens arena eller matchvillkor.
- Spelstilarna ska bevaras som klubbarnas tränings- och speltraditioner;
  deras nuvarande balansvärden ska inte räknas om på grund av textfixen.

### 3. Konkreta språk- och logikfel i samma material

- Hälleforsnäs: `Järnbrukets fackstark` är ingen begriplig roll. Föreslagen
  ersättning: `Brukets tidigare fackordförande`.
- Skutskär: "Vi förlorade 9–2. Sen dess har vi vunnit lite oftare än så"
  blandar förlustmarginal med vinstfrekvens. Citatet bör i stället låta
  premiärförlusten mynna ut i klubbens uthållighet.
- Skutskärs citatpool motsäger sig själv: herrguldet anges som 1959 i ett
  citat, medan ett annat 2018 säger att det var trettio år sedan herrarna
  vann. Det senare årtalet måste bort eller räknas om.
- Slottsbrons `briefDescription` innehåller `storarna av stämning`, ett
  uppenbart skrivfel.
- Gagnefs `skridskors-kultur` ska vara `skridskokultur`.
- Forsbackas citat nämner verkliga `Mariehov`, trots källkontraktet att bara
  spelets fiktiva arenanamn får visas.
- Heros-citatet kallar laget som föll genom isen i Forsbacka för
  "motståndarna", trots att det var en separat match samma dag.

## Samlad textregel inför åtgärd

1. **Nutid:** Alla seriearenor har konstfrusen is. Väder får påverka ytan,
   sikten, snöröjningen och publiken, men inte om isen över huvud taget finns.
2. **Dåtid:** Sjöis och naturis får användas som ett uttryckligt historiskt
   minne, högst sparsamt så att det inte blir varje klubbs enda identitet.
3. **Spelstil:** `spelande`/`åkande` behålls, men motiveras av träningskultur,
   spelartradition och taktisk identitet — aldrig av dagens kylsystem.
4. **Fiktion:** Verkliga arenanamn och exakta verkliga meriter ska inte läcka
   in där spelets eget faktakontrakt säger att de är researchunderlag.

## Ankomsten

### 4. Toppnavigationen saknar stabil kontrast mot bilden

**Observerat på Karlsborg i mobilbredd:** `Hoppa över` går att läsa efter den
senaste justeringen, men `ANKOMSTEN` och de fyra stegmarkörerna passerar över
både mörk rök och nästan vit himmel. Samma färg fungerar därför inte över hela
ordet/indikatorn; delar ser urtvättade ut och andra sjunker in i bilden.

**Verifierad rot:** Den tillagda `arrival-scrim` är en kort, ljus gradient med
54 procents högsta opacitet. Rubrik och indikator har fortfarande genomskinlig
bakgrund och förlitar sig dessutom på en ljus textgloria. Kombinationen ger
ingen garanterad kontrastyta när illustrationen växlar snabbt i luminans.

**Rekommenderad åtgärd:** Gör de översta cirka 110–140 pixlarna till en verklig
sammanhållen läsbarhetszon med betydligt mer täckande neutral scrim som tonas
ut mjukt. Låt rubrik, steg och `Hoppa över` använda samma mörka färgfamilj och
ta bort den ljusa gloria som får de tunna bokstäverna att se urtvättade ut.
Kontrollera mot samtliga tolv ankomstbilder, inte bara Karlsborg.

### 5. Samma kontrastfel fortsätter i Tillträdet

**Observerat:** Tillträdet upplevs i övrigt som mycket snyggt, men rubriken
`TILLTRÄDET` och stegindikatorn i toppen tappar kontrast mot samma bildfamilj.

**Verifierad rot:** Tillträdet återanvänder `.arrival-scene`,
`.arrival-scrim` och `.h-scene-genre`, men inte ens Ankomstens lokala ljusa
gradient följer med. Den delade `.arrival-scrim` har `background: none`, så
Tillträdets topp saknar ett eget läsbarhetsskydd. Det är samma designrot i två
scener, inte ett nytt bildfel.

**Rekommenderad åtgärd:** Flytta topp-scrimmen och kontrastreglerna till en
gemensam onboardingvariant som används av både Ankomsten och Tillträdet.
Ankomsten ska inte bära en lokal speciallösning. Kontrollera Tillträdets alla
fyra steg och samtliga tolv klubbbilder i samma visuella matris.

### 6. Hörnövningens bekräftelse är för ljus mot isbilden

**Observerat:** Efter den övade hörnan ligger assistentens bekräftelse
(`Så funkar det ...`) i tunn, ljus kursiv direkt över bildens ljusa isyta.
Texten går att avkoda men inte att läsa bekvämt.

**Verifierad rot:** Bekräftelsen har bara `rgba(0,0,0,0.3)` som bakgrund och
använder den nedtonade färgen `--text-quote-light`. Trettioprocentig svärta
kan inte bära ljus brödtext när den underliggande illustrationen är nästan
vit. Problemet ligger i bekräftelserutans egna kontrakt och löses inte enbart
av topp-scrimmen.

**Rekommenderad åtgärd:** Ge bekräftelserutan en stabilt mörk yta i samma
familj som övningens övriga kort, höj texten till ordinarie ljus textfärg och
behåll kopparlinjen som hierarkisk accent. Verifiera mot hörnans samtliga
utfall samt de ljusaste och mörkaste klubbillustrationerna.

## Första portalen

### 7. "Lugnare första veckan" motsägs av den faktiska belastningen

**Observerat:** Portalen visar samtidigt cupmatchens förberedelse, ett
inkommande övergångsbud med tre handlingar, Veckans beslut,
Norrskensklacken och Drömrundan. Räknaren visar två aktiva beslut. Ovanför
detta säger kassören: `Lugnare första veckan. En fråga åt gången — resten
ligger och väntar tills du hittat rytmen.`

**Verifierad rot:** Texten visas enbart därför att karriären är i sin första
matchdag och minst ett aktivt beslut finns. Villkoret påverkar inte portalens
urval, beslutskön, övergångsbuden, atmosfärslagret eller säsongssignaturen.
Det är alltså ett löfte utan enforcement. Max tre i den globala
beslutsbudgeten är inte samma sak som onboardingens utlovade en fråga.

**Rekommenderad åtgärd:** Gör första veckan till en riktig presentationsgate.
Visa matchens primära handling och högst ett separat beslut. Övriga
beslutsbara kort ska behålla sina kanoniska id:n men ligga uppskjutna tills
spelaren gjort det första valet eller spelat första matchen. Ett enda kort
från klacken kan möjligen finnas kvar som ren atmosfär, men inte konkurrera
visuellt med handlingarna. Testa även att inget uppskjutet bud hinner löpa ut
eller dupliceras.

### 8. Drömrundan kallas tendens innan någon tendens finns

**Observerat:** Före en enda spelad seriematch visas `DRÖMRUNDAN ·
SÄSONGSTENDENS` och `Ingen klar favorit i år. Serien känns öppen på ett sätt
den sällan är.` Det finns ännu inget spelutfall som stödjer påståendet.

**Verifierad rot:** `createSeasonSignature` väljer `dream_round` redan när
saven skapas och lägger förhandstexten i fältet `observedFacts`. Det fältet
innehåller alltså inte observerade fakta. Portalkortets trigger kräver bara
att signaturen finns och inte är `calm_season`; inget krav finns på spelade
matcher, registrerade skrällar eller annan evidens. Den avsedda funktionen
`recordSignatureFact` är inte kopplad till produktflödet. Samma modell kan
också ge årsboken en förhandsutsaga som om den vore säsongens facit.

**Rekommenderad åtgärd:** Behåll den dolda signaturen och dess redan
kalibrerade matchmodifierare, men skilj premiss från observation. Starta
`observedFacts` tomt eller inför ett separat prognosfält. Visa Drömrundan som
säsongstendens först när riktiga resultat passerat ett uttryckligt golv och
minst en faktisk skräll/öppen-serie-indikation registrerats. Använd samma
evidens i portalen och årsboken. Om en signatur ska visas före dess ska den
heta `Förhandsbild`, inte `Säsongstendens`; Jacobs spelkänslodom här är dock
att Drömrundan ska vänta på en verklig tendens.

### 9. Headerns verktyg och långa matchlabel tränger bort identiteten

**Observerat:** Bok, inkorg och inställningar ligger glest i en stor inramad
grupp. När omgångssigillet säger exempelvis `CUP · KVARTSFINAL` kapas
klubbnamn, manager och säsong längst till vänster.

**Verifierad rot:** `GameHeader` använder kolumnerna `44px 1fr auto`.
Högerkolumnens `auto` innehåller både den fulla variabla matchlabeln och tre
separata 30-pixelsknappar i en cirka 98 px bred behållare. Den kolumnen får
därför sitt fulla innehåll och pressar mittkolumnen till ellips. Den nuvarande
ramen grupperar ikonerna visuellt men minskar inte deras layoutbredd.

**Rekommenderad åtgärd:** Ersätt de tre permanenta ikonerna med en kompakt
verktygsingång som öppnar en meny med tydligt namngivna rader för
Klubbpärmen, Inkorg och Inställningar. Visa inkorgens röda indikator även på
den samlade knappen så att olästa meddelanden inte göms. Behåll
`CUP · KVARTSFINAL` läsbart i stället för att lösa trängseln med kryptisk
förkortning. Lägg samtidigt ett uttalat breddtak på matchlabeln och ge
klubbidentiteten en minsta läsbar bredd vid 320–430 px. Menyns rader ska ha
minst 44 px tryckyta och korrekta aria-etiketter.

### 10. Fortsättnings-CTA:n försvinner utan att orsaken framgår

**Observerat:** På första portalen syns ingen CTA för att gå vidare. Spelaren
måste själv dra slutsatsen att Veckans beslut behöver lösas först.

**Verifierad rot:** `PortalScreen` renderar uttryckligen inte den fasta CTA:n
när `pendingWeeklyDecision` finns. Grinden är avsiktlig och skyddar dessutom
beslutets nedersta svar från att täckas av en fixerad knapp, men inget nära
den plats där CTA:n brukar finnas förklarar varför den är borta.

**Jacobs UX-dom:** Använd samma beteende som i Granska: den stora ordinarie
CTA:n ligger kvar på sin vanliga plats men är gråad tills blockerande beslut
är lösta. En kort varningsrad ovanför talar om vad som återstår. När villkoret
uppfylls blir samma knapp aktiv; ingen layout eller mental målpunkt flyttar
sig.

**Verifierad historik och rekommenderad åtgärd:** Portalen hade tidigare en
synlig låst CTA som kunde scrolla till beslutskortet. Den togs bort i
`d46bd6f4` eftersom den fixerade ytan täckte det nedersta svarsalternativet på
mobil. Portalen har därefter fått dynamisk mätning av CTA-stackens faktiska
höjd och reserverar den höjden i innehållets bottenpadding. Återinför därför
CTA:n som en verkligt `disabled` knapp enligt Granska, kompletterad med
`1 ohanterat beslut — hantera det ovan`, och låt både bottenpadding och
`Visa mer`-markören läsa den uppmätta CTA-höjden även i låst läge. Kontrollera
geometriskt att inget av Veckans besluts svar täcks vid 320–430 px. Detta ska
kombineras med första-veckan-gaten, så vägledningen inte konkurrerar med ett
samtidigt övergångsbud.

## Matchförberedelsen

### 11. Motståndarvinjettens eyebrow är för mörk

**Observerat:** Motståndarvinjetten upplevs som mycket fin, men etiketten
`MOTSTÅNDAREN` är svår att läsa över den mörka nedtoningen av klubbilden.
Klubbnamn, brödtext och CTA håller däremot sin hierarki.

**Verifierad rot:** Etiketten är bara 9 px, har fyra pixlars bokstavsglesning
och använder `var(--accent)` med `opacity: 0.75`. Opaciteten blandar den redan
relativt mörka kopparfärgen med bildens svarta gradient och gör den märkbart
svagare än avsett.

**Jacobs förslag och rekommenderad åtgärd:** Gör etiketten ljusare varmorange
med full opacitet och något högre vikt. Behåll motståndarnamnet vitt och
övrig sekundärtext oförändrad, så etiketten blir en tydlig ingång utan att
konkurrera med klubbnamnet. Kontrollera över alla tolv bilder, särskilt där
skog eller byggnader ligger bakom etikettens position.

### 12. Cupmatchens scener kommer i fel ordning och cupscenen byter bredd

**Observerat:** Efter den välhållna motståndarvinjetten kommer en separat
`CUPEN`-skärm. När den öppnas hoppar hela kompositionen ut i webbläsarens
fulla bredd, medan spelets bottennavigation fortfarande ligger kvar i den
centrerade 430-pixelskolumnen. Cupskärmen är i övrigt visuellt lyckad. Den
dramaturgiska ordningen känns också bakvänd: spelet presenterar först
`MOTSTÅNDAREN · Lesjöfors` och förklarar därefter att sammanhanget är cupen.

**Verifierad rot, ordning:** `MatchScreen` väljer alltid
`OpponentVignetteScene` först när klubbarna möts för första gången. Först i
dess `onContinue` beräknas laddningsscenen och flödet går vidare till
`MatchLaddningScene`. Den uttryckliga kedjan är alltså motståndare →
tillfälle → laguttagning, även när tillfället är en utslagsmatch i cupen.

**Jacobs UX-dom och rekommenderad ordning:** För en cupmatch ska sammanhanget
etableras före personen: `CUPEN` → `MOTSTÅNDAREN · Lesjöfors` →
laguttagning. Cupscenen svarar först på varför matchen betyder något;
motståndarvinjetten gör därefter hotet konkret. Tillämpa samma regel på
fullskaliga tillfällesscener som behöver etablera matchens betydelse, men
låt inte omkastningen återinföra SM-finalens förberedelsescen i full- eller
referatläge, där `shouldShowPreparationLaddningBeat` avsiktligt lämnar plats
åt finalens egen introsekvens. Band-/svitmarkörer är ett separat, mindre
berättargrepp och ska inte slentrianmässigt flyttas av samma ändring.

**Verifierad rot, bredd:** Motståndarvinjetten ligger inuti
`MatchFlowFrame`, vars rot är begränsad av spelets vanliga kolumn.
`MatchLaddningScene` returneras däremot direkt och har `position: fixed;
inset: 0` utan samma 430-pixelsbegränsning. På en bredare webbläsaryta blir
scenbild, textkort och CTA därför bredare än både föregående vy och den
kvarliggande bottennavigationen.

**Rekommenderad åtgärd:** Låt bakgrundslagret fortsatt kunna täcka
viewporten, men lägg cupscenens synliga bild, text och CTA i exakt samma
centrerade spelkolumn som `#root`/`MatchFlowFrame` (`width: 100%; max-width:
430px; margin: 0 auto`). Breddkontraktet ska gälla hela laddningsscenen, inte
bara bilden. Kontrollera övergången bildruta för bildruta vid både 430 px och
en bredare inbäddad webbläsare: vänster- och högerkant ska vara stilla genom
cup → motståndare → laguttagning.

### 13. Klubbmärket får en oavsiktlig grå passepartout i matchhuvudet

**Observerat:** Uppställning och taktik håller visuellt mycket väl. I deras
gemensamma sidhuvud ser däremot det runda Karlsborgsmärket ut att ligga i en
grå fyrkant innanför kopparramen. Mellanrummet läser som en ofärdig kant i
själva bildfilen.

**Verifierad rot:** Den grå ytan finns inte i klubbmärket. `MatchFlowFrame`
lägger ett 22 px stort `ClubBadge` i `.mf-crest`, som är 26 × 26 px och har
bakgrunden `var(--bg-leather)` samt en kopparfärgad ram. De två pixlarnas
utfyllnad på varje sida syns därför som en gråbrun passepartout runt det
runda märket.

**Rekommenderad åtgärd:** Behåll den diskreta kopparramen men låt
behållarens fond vara transparent eller samma svarta färg som mastheaden.
Öka klubbmärket till cirka 24 px så att det fortfarande får luft utan en
synlig grå krans. Kontrollera samtliga klubbmärken i Förbered, Spela och
Granska; ändringen ska göras i den gemensamma ramen och inte genom att
specialbehandla Karlsborgs bildfil.

## Match live

### 14. Slutresultatets CTA kolliderar med en falsk matchspärr

**Observerat:** Match live upplevs som välgjord, men när slutresultatet
visas hamnar `TILL GRANSKNING` i en trång och delvis skymd bottenstack.
Direkt under CTA:n står samtidigt `MATCH PÅGÅR — SPELA KLART`, trots att
resultatkortet ovan säger `SLUT` och visar Karlsborg 8–3 Lesjöfors. De sista
matchhändelserna kapas precis ovanför den dockade ytan och måste letas fram
med scroll.

**Verifierad rot:** `MatchLiveScreen` äger det riktiga lokala sluttillståndet
`matchDone` och skapar då CTA:n `TILL GRANSKNING`. `BottomNav` känner inte
till detta tillstånd utan sätter både navigationsspärr och texten `Match
pågår — spela klart` enbart därför att sökvägen börjar med
`/game/match/live`. Två oberoende ägare beskriver alltså samma flöde olika.
Låsraden är dessutom `position: fixed` ovanför bottennavigationen, medan
`GameShell` bara reserverar den ordinarie navigationens höjd. Den extra
raden ingår inte i matchramens dockberäkning och kan därför konkurrera med
slut-CTA:n när den tillkommer.

**Rekommenderad åtgärd:** Gör matchens fas (`pågår`/`slut`) till gemensam
källa för både MatchLive och navigationen. Under pågående match är nuvarande
spärr korrekt. Vid `matchDone` ska den lögnaktiga låsraden försvinna;
bottennavigationen kan fortsatt vara inaktiv tills spelaren gått till
Granska, eftersom CTA:n redan förklarar vägen vidare. Låt samma slutläge
reservera CTA:ns faktiska höjd i matchflödet och ge feeden motsvarande
scrollmarginal, så både CTA och sista händelsen kan visas helt utan
överlappning. Verifiera på kort mobilhöjd samt med större text, inte bara på
430-pixelsbredd.

## Granska

### 15. Kaptenens markering kan misstolkas som en målvaktsmarkering

**Observerat:** E. Snabb är ensam om en orange ring runt porträttet och har
en stjärna framför namnet. Eftersom raden samtidigt säger `MV` går det inte
att avgöra om ringen betyder målvakt, kapten eller någon matchutmärkelse.

**Verifierad rot:** Ringen styrs av `isCap`, alltså att spelaren är kapten,
och har ingen koppling till målvaktspositionen. Samma rad visar dessutom
exakt samma `⭐` både för kaptenen och för matchens spelare. Om en spelare är
båda renderas två identiska stjärnor. Den visuella grammatiken har därmed
två signaler för kapten men ingen unik etikett som förklarar dem.

**Rekommenderad åtgärd:** Reservera stjärnan för matchens spelare och märk
kaptenen entydigt med en liten `K`-etikett (eller behåll den orange ringen
och komplettera den med tillgänglig text `Kapten`). Använd samma
kaptenmarkering i uppställning, trupp och Granska. Målvakt ska fortsatt
framgå av `MV`, inte av porträttramen. Säkerställ att kombinationen kapten +
matchens spelare ger två olika, begripliga signaler och inte dubbla
stjärnor.

## Tillbaka i portalen

### 16. Klackens andra framträdande saknar både talare och berättelsekoppling

**Observerat:** Efter att Maja från Norrskensklacken introducerat tifot och
spelaren valt `Ja, men håll det enkelt` visar portalen klackkortet:
`Min son vill ha tröja nummer 7. Vet inte vem det är men han är bestämd.`
Det är den andra synliga kontakten med klacken i den här karriären, men
kortet känns varken som en fortsättning eller som en begriplig ny
introduktion. Vem som talar framgår inte, och `vet inte vem det är` har ett
oklart referensobjekt.

**Verifierad rot:** `KlackenSecondary` anropar `getKlackDisplay` utan någon
introduktions- eller kontinuitetsgate. Presenterns standardläge roterar
mekaniskt mellan `leader`, `veteran`, `youth` och `family` efter nästa
fixtures `matchday % 4`; i detta fall valdes en anonym familjereplik.
Portalens kort renderar sedan bara gruppnamnet, repliken, stämningen och
medlemsantalet — inte `character.name` eller rollen som presentern faktiskt
returnerar. Den centrala röstliggaren täcker endast klackledarens `voiceId`.
Maja, veteranen och familjerösten kan alltså tala på den här ytan utan egna
introduktioner, samtidigt som klackledarens separata formella introduktion
kan ligga kvar i kön. Det finns två oförenade modeller för när klacken är
känd.

Det finns även en tidskopplingsrisk i efterklangen: presentern får nästa
schemalagda matchs `matchday`, medan tifots markör skrivs från spelets
aktuella `currentMatchday`. Ett hopp i spelschemat kan därför förbruka
treomgångarsfönstret för `Tifot tar form` innan spelaren fått en naturlig
portalvisning och direkt kasta berättelsen in i den generiska rotationen.

**Ledgerbedömning:** Den generella historiebågsinfrastrukturen är byggd,
men supporterbågen är bara halvt inkopplad. När tifot löses sparas det
konkreta event-id:t, spelarens val i `resolvedChoices`, en grov
`narrativeBeatLog`-post med nyckeln `supporterEvent`, den kanoniska
beslutslivscykeln i `eventLedger` samt `tifoDone/tifoDoneMatchday` i
supporterstate. Det räcker för resolution och dedup. Däremot finns ingen
`StorylineType` för tifo/klackkonflikt och ingen post-resolution-projektion
som gör tifo → efterarbete → konflikt till en sammanhängande båge.
`KlackenSecondary/getKlackDisplay` läser dessutom inget av `eventLedger`,
`resolvedChoices` eller `narrativeBeatLog`. Gapet sitter alltså främst på
liggarens lässida och i den saknade supporter-storyline-projektionen, inte i
själva eventresolutionen.

**Rekommenderad åtgärd:** Gör klackens första event till gruppens kanoniska
introduktion och låt nästa portalbesök prioritera en verklig uppföljning på
det lösta tifovalet (`Tifot tar form`) före generiska röster. Mät
efterklangens ålder på samma kanoniska tidsaxel som markören och garantera
minst en faktisk visning, inte bara ett numeriskt fönster mellan fixtures.
När personrotationen därefter öppnas ska kortet alltid visa namn och roll,
och dess röster ska följa en sammanhållen introduktionsmodell i stället för
att kringgå liggaren. Ersätt den aktuella repliken med exempelvis: `Min son
har bestämt sig för tröja nummer 7. Han vet inte vem som bär den — sjuan ska
det vara.` Bygg inte ännu en fristående klacklogg: projicera bågen ur den
befintliga kanoniska händelseliggaren. Låt tifo-valets exakta identitet och
utfall öppna efterarbetsfasen; låt en senare klackkonflikt läsa samma båge,
och låt portalpresentern konsumera den projektionen före sin generiska
personrotation. Då tjänar samma sanning både dedup, kontinuitet och framtida
årsboks-/klubbminnesytor.

## Tvärgående berättelsekontroll

### 17. Samma skriv-utan-läs-lucka ska provas i samtliga berättelsebågar

**Jacobs krav:** Klackfyndet får inte lagas som ett specialfall. Varje
berättelse ska granskas som en kedja: introduktion → första handling →
konsekvens → efterklang → avslut. Samma person-/händelseidentitet och det
faktiska utfallet ska bära hela vägen; ett generiskt kort får inte avbryta
en olöst eller nyss löst båge.

**Första kodtvärsnittet:** Felet är inte universellt. Lösta
spelarstorylines projiceras via `getResolvedStorylineProjections` från
`eventLedger` till bland annat press, trupp, klubbminne och årsbok.
Journalistrelationens portal/scen får liggaren som källa, och burnout läser
sin varaktiga återfallsidentitet ur liggaren. De är referensmönster, inte
omskrivningskandidater.

Riskzonen är äldre presentationsvägar med egna fickor. `KlackenSecondary`
går direkt på supporterstate. `ActiveArcsSecondary` läser rå `activeArcs`
(rimligt medan bågen är aktiv, men överlämningen vid resolution måste
provas). `pickEfterklang` har en kanonisk redaktör/`ledgerTold` för delar av
urvalet men läser fortfarande flera specialkällor direkt, bland annat
`klackEcho`, `journalist.memory`, `boardObjectiveHistory`, `nemesisTracker`,
`economicCrisisState` och rivalförsäljningsfält. Kafferummet kombinerar
liggarkvitton med flera egna state- och cooldownvägar. Det betyder inte att
alla dessa är fel; det är den avgränsade mängd där samma kontinuitetsbrott
kan finnas.

**Åtgärds-/provmatris:** För varje namngiven båge ska passet kontrollera:

1. att första personen eller gruppen introduceras före sin första
   substantiella replik på portal, inkorg, Granska, press och kafferum,
2. att producenten skriver ett kanoniskt, semantiskt id och exakt resolution
   på rätt tidsaxel,
3. att nästa berättelsebeat läser samma liggarpost/projektion i stället för
   att återskapa mening ur datum, slump eller ett parallellt statefält,
4. att en konkret uppföljning visas minst en gång innan generisk atmosfär
   får ta plats,
5. att avslutad båge inte återgår till en tidigare fas eller återintroducerar
   samma person,
6. att ett val som avböjs, löper ut eller får ett annat utfall inte ändå
   renderar den positiva standardefterklangen,
7. att samma identitet håller över cupglapp, säsongsskifte, save/reload och
   klubbyte.

Utfallet ska redovisas per båge som `ren`, `skrivs men läses inte`, `läses
från parallell källa` eller `saknar kanonisk resolution`. Endast de tre
senare blir åtgärdsposter. Ingen ny universell storymotor ska byggas ovanpå
den befintliga; fungerande liggarprojektioner återanvänds och gamla fickor
retireras först när deras konsument har flyttats.

## Mecenaten och lokalpressen

### 18. Mecenaten kunde lämna innan spelaren faktiskt hade mött honom

**Observerat:** Tommy Sundbergs första synliga kort i Karlsborgskarriären
var ett avsked: han bad att få träffas `en sista gång` och drog sig ur. UI:t
kallade dessutom både den löpande patronrelationen och den separata
mecenatfunktionen för `Mecenat`, vilket gjorde kronologibrottet extra svårt
att tolka.

**Verifierad rot:** Patronens äldre hjälpfält `introducedSeason` och den
kanoniska röstliggaren kunde motsäga varandra. CS-avskedet och flera
patronproducenter litade på hjälpfältet, medan den faktiska observerade
introduktionen finns i `introducedVoices`. Avskedskorten saknade dessutom
`voiceId`, så presentationsgaten kunde inte stoppa en talare som ännu inte
var känd.

**Åtgärdat:** Röstliggaren är nu ensam gate för om patronen är introducerad.
Samtliga tre avskedsvägar bär patronens kanoniska `voiceId`; ett gammalt eller
felaktigt `introducedSeason` kan inte längre öppna ett avsked. Regressionstest
täcker både den normala kedjan och just motsägelsen som speltestet hittade.

### 19. Lokaltidningen valdes nationellt i stället för regionalt

**Observerat:** Karlsborgs journalist Camilla Sandberg arbetade på
`Sörmlands-Posten`. Samma redaktion återkom sedan konsekvent i media och
Efterklang, trots att klubben i spelvärlden ligger längst norrut. Rögle kunde
på motsvarande sätt få en tidning från fel del av landet.

**Verifierad rot:** `setupManagedClub` valde en enda beständig tidning ur en
nationell pool. Det var därför inte flera felaktiga texter utan en felaktig
källa som spreds korrekt över alla ytor.

**Åtgärdat:** Tidningen väljs nu ur klubbregionens pool och behåller samma
beständiga identitet därefter. Save-migreringen rättar även den pågående
Karlsborgssaven vid nästa inläsning och uppdaterar journalistens redaktion
utan att byta ut personen. Södermanlands-Posten bevaras för Hälleforsnäs, där
den är geografiskt rimlig.

## Genomfört åtgärdspass

Samtliga konkreta fynd 1–16 samt rotfynden 18–19 åtgärdades i samma isolerade
pass. Punkt 17 användes som tvärgående kontrollmetod: den hittade patronens
skriv-/läs-konflikt och bekräftade att fungerande liggarprojektioner för
spelarbågar, journalistrelation och burnout inte skulle ersättas.

- Klubbvalet följer och fokuserar det öppnade kortet.
- Alla nutida naturispåståenden och de listade språk-/faktafelen är rättade.
  Det äldre balansfältet för isstandard påverkar fortfarande vädermotorns
  kalibrering, men visas nu sanningsenligt som `Isanläggning: Standard` eller
  `Förstärkt`; alla banor förblir konstfrusna i spelets nutid.
- Ankomsten och Tillträdet delar samma kontrastsäkra toppzon och hörnsvarets
  bekräftelse har en stabil mörk fond.
- Första veckan visar en verklig fokusyta med högst Veckans beslut bredvid
  matchens primära handling. Övrigt väntar utan att id:n eller köposter
  försvinner. Drömrundan visas först efter tre spelade serieomgångar.
- Sidhuvudets tre fasta verktyg är samlade under en meny med olästmarkör;
  klubbidentitet och omgångsetikett har fått uttryckliga breddgränser.
- Portalens ordinarie CTA ligger kvar som `disabled` med orsak när Veckans
  beslut blockerar fortsatt spel.
- Cupens helscen kommer före första motståndarvinjetten och båda håller samma
  spelkolumn. Motståndaretiketten har högre kontrast och klubbmärket saknar
  den grå passepartouten.
- Matchens falska `MATCH PÅGÅR`-rad försvinner när resultatet är sparat, så
  slut-CTA:n får sin avsedda plats.
- Kapten markeras med `K`; stjärnan betyder enbart matchens spelare.
- Tifot introducerar nu den namngivna unga supportern i röstliggaren. Den
  omedelbara portalefterklangen läser faktiskt spelarens val och använder
  samma matchdagsaxel som resolutionen; först därefter får generiska
  klackröster rotera, alltid med namn och roll.
- Patronens kronologi och lokalpressens geografi är rättade vid källan och
  täcks även för befintliga sparningar.

## Verifiering

- TypeScript: godkänd.
- Fokuserade regressioner för patron, klack, lokaltidning och matchscener:
  godkända.
- Hela testsviten: **585 testfiler, 5 246 testfall, noll fel**.
- Produktionsbygge och samtliga inbyggda design-, innehålls- och
  konsekvenskontroller: godkända. Huvudchunk 1 399,40 kB, fortsatt under
  releasegränsen 1,5 MB.

## Status

Playalong pausad efter omgång 2. Alla hittills rapporterade, reproducerbara
fynd är åtgärdade i den isolerade arbetsmiljön. Nästa spelpass ska starta mot
den nya byggnaden så att både första veckans rytm och berättelsekronologin
provas på den kod som faktiskt innehåller rättningarna.
