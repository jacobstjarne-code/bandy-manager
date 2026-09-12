# POST-LAUNCH — medvetet uppskjutet till efter mjuk release

**Startad 2026-09-07 (Opus + Jacob, beslutskö-passet).** Rader som är verkliga och
värda att göra, men medvetet uppskjutna till EFTER lansering — så MASTER_OPPET bara
bär det som är i spel nu, och den här listan skyddar idéerna utan att blåsa upp
release-räkningen. Flyttas hit från MASTER när beslutet "inte före release" fattas;
plockas härifrån när det finns luft efter mjuk release.

Regeln: en rad här har vad / varför-uppskjuten / underlag. Inget "senare utan skäl".

---

## Transfers

### scout-shortlist-transferfonster
**Vad:** när transferfönstret stänger kan en shortlist-markerad spelare som fortfarande är tillgänglig ge en kort, världssann notis. **Varför uppskjuten:** shortlisten är medvetet tyst i nuvarande produkt, och källraden säger uttryckligen att notisen ska byggas först när transferytorna ändå rörs — ingen sådan ytrörelse pågår i releasearbetet. **Underlag:** `docs/archive/historiska-statuskallor/BACKLOG.md` L3/`scout-shortlist-transferfonster`. **När:** i nästa samlade transfer-ytepass; använd den befintliga shortlistmarkeringen, inte ett parallellt bevakningssystem.

## Världens liv (AI-klubbarna över tid)

### varldsbilds-sektion (världsbildsfasen, pausad)
**Vad:** AI-klubbarnas liv över säsonger — hur de elva andra klubbarna rör sig,
rustar, stiger och faller över tid, så ligan känns levande och inte som en statisk
tabell. **Underlag:** `RAPPORT_LIGARORELSER_ELVA_KLUBBAR` (om filen återskapas — den
saknades vid flytten 2026-09-07, sök i git-historik/incoming). **Varför uppskjuten:**
en HEL fas, inte en rad — att återuppta den före release vore att öppna ett stort
nytt spår när arbetet ska stänga. Jacob: "viktigt att klubbarna får liv" — bevarad,
inte dödad. **När:** efter mjuk release, som ett eget fördjupningspass. Positionstrend
+ AI-transferlogg finns redan som byggda byggstenar (`getClubPositionTrend`,
`deriveBoardLeagueContext`) att bygga vidare på.

## Relationssystem

### mecenat-patron-cs-happiness
**Vad:** en kontinuerlig happiness-/drift-logik som läser `communityStanding`, så
mecenat/patron-relationen driver med orten över tid (inte bara ett binärt avhopp).
**Varför uppskjuten:** det katastrofala fallet är redan täckt — eviction-on-drop
finns (relationen bryts när CS faller under gränsen). En kontinuerlig drift är ett
helt nytt relationssystem för en subtil effekt spelaren knappt märker — polish, inte
release. **När:** post-launch, om relationsdjupet visar sig värt det i speltest.

### ai-tranarbyten-anlaggningar (världens liv, forts.)
**Vad:** AI-klubbarna byter tränare och bygger anläggningar över tid, så världen
förändras utan spelaren (Slottsbron bygger en hall, Heros byter tränare mellan
säsonger). **Varför uppskjuten:** samma spår som `varldsbilds-sektion` — AI-klubbarnas
liv över tid, en hel fas. En anläggnings-proxy prövades och avvisades som falsk siffra;
en äkta modell kräver världsbilds-fasen. **När:** post-launch, ihop med världsbilden.

## Landslag / press

### lobbypress-mekanik (LOBBY_PRESS som spelbar mekanik)
**Vad:** managern lobbar aktivt för att få en spelare uttagen i landslaget; `LOBBY_PRESS`-
texten (landslagText.ts) finns redan skriven. **Status nu:** nedgraderad till FLAVOUR
(Jacob 2026-09-07) — texten lever som en pressrad (journalisten nämner att managern
lobbar), ingen mekanik spelaren styr. **Post-launch-kandidaten:** den fulla lobby-
mekaniken (spelaren lägger en handling, påverkar uttagningssannolikheten) — texten är
redan skriven, det som saknas är spelvärlden bakom. **När:** post-launch om landslags-
djupet prioriteras. Ny spec behövs som definierar uttagningsmekaniken.

## Arkitektur / identitet

### c-o1sp1-kontextuella-sponsorer
**Vad:** skilj entitetens stabila id från dess rollmedlemskap, så en kontextuell
sponsor kan vara både sponsor och antagonist utan att låtsas vara en klubb eller
få en parallell identitet. **Underlag:**
`docs/dom/DOM_C_O1SP1_SPONSOR_NAMNRYMD_2026-09-08.md`. **Varför uppskjuten:** den riktiga
lösningen korsar sponsor-, rival- och liggarsubjektens namnrymder och har bred blast
radius; O1 behöver inte refaktorn före release. En eventuell framtida O1-genväg får
bara vara en riktad läsning av sponsorns befintliga stabila id, inte en ny
specialmodell. **När:** post-launch, som ett eget identitetsrefaktor-pass.

## Spelupplevelse / burnout

### sluttest-o4-fordrojda-betyg (fördröjda spelarbetyg vid burnout)
**Vad:** en utbränd spelares matchbetyg hålls tillbaka/fördröjs en tid — spelaren
ser inte direkt hur han presterade, en dimma som speglar att en utbränd spelares
form är opålitlig. **Varför uppskjuten:** nytt system som kräver ny mekanik +
designbeslut (hur länge fördröjt, vad som visas under tiden). Burnout-bågen fungerar
utan det; §10-linjen (inga fler system före release). **Underlag:**
`burnoutReliefService.ts:47-50` ("Byggs inte i detta pass"). **När:** post-launch om
burnout-djupet prioriteras. Jacob 2026-09-08.

## Tillväxt / delbarhet

### stickiness-apple-native-epic (Apple-native Fas 2)
**Vad:** WidgetKit/ActivityKit, Live Activities, Dynamic Island och App Groups ovanpå samma `AttentionItem` som webbpassets notifieringar. **Varför uppskjuten:** native-ytorna är ett eget plattformsspår och får öppnas först när Fas 1 har mätt retention med deterministisk holdout; före det finns varken effektbevis eller skäl för en ny distributionsyta. Ingen separat native-minnesbank får skapas. **Underlag:** stickiness-rapportens §14 Etapp 2 och `IMPLEMENTATION_STICKINESS_NOTIFIERINGAR_2026-09-04.md`. **När:** post-launch efter analyserad holdout.

### sluttest-o10-bestinclass (best-in-class-ekosystemet, utom seed-i-länk)
**Vad:** O10:s fulla tillväxtekosystem — bandyarkivet, vägskäl, bruksligor,
skaparekosystem. **Status nu:** seed-i-länk-skivan (`o10-queryparam-clubselection`,
useSearchParams på ClubSelectionScreen) är byggd före release. Den verkliga
länkskaparen/delningskortet är däremot parkerad med resten av ekosystemet; därför
följer även `sluttest-grind4` med hit och körs först från en verkligt producerad
spelarlänk. Ingen handkonstruerad testväg får ersätta den. Texten är redan låst
(`o10-delningskort-text`). Resten av ekosystemet är post-launch.
**Varför uppskjuten:** ett helt tillväxtspår, inte en gap-täckare;
§10-linjen. **När:** post-launch, som eget ekosystem-pass. Jacob 2026-09-08.

### sluttest-412-bildsnapshot (visuell QA för delningsbild)
**Vad:** skapa och visuellt verifiera snapshots för den riktiga delningsbilden när
den finns. **Varför uppskjuten:** delningskortets producent och ekosystem är redan
parkerade här; en snapshot av en ännu opublicerad yta kan varken bevisa produktens
utseende eller blockera release. `SPELTESTKALENDER_2026-09-10.md` klassar uttryckligen
uppgiften som rent visuell QA med låg prioritet. **När:** tillsammans med den verkliga
delningsbilden, eller tidigare endast om Jacob uttryckligen beställer Code-provet.

## Anläggning / UI

### d-o5-avveckla-nod (avveckla en byggd anläggningsnod)
**Vad:** låta spelaren riva/avveckla en redan byggd anläggningsnod. Domänlogiken är trivial. **Varför uppskjuten:** det är en NY interaktiv yta (ett rivnings-flöde) som kräver en egen Design-mock (Princip 4: ingen ny interaktiv yta utan mock), och prioriteten är låg — Jacob: "känns som säsong 10". **När:** post-launch. Bygg inte riv-UI före release. Jacob 2026-09-09.

## Match-interaktioner (berikning)

### inv-3-sprints17-21-four-skipped (fyra skippade interaktions-berikningar)
**Vad:** historisk kontext (H), rika timer-varianter (A), supporter-känsla (B) och beslutskedja (F) i matchinteraktionerna (hörna/straff/kontring/frispark/slutspurt). **Varför uppskjuten:** uttryckligen skippade i april 2026 till "senare sprint" — berikningar av redan fungerande interaktioner, inga gap-täckare. §10. **När:** post-launch. Jacob 2026-09-09.

## Vilande textrester (väntar sina funktioner)

### m14-publikhistorik-token + m50-clubofferquotes
**Vad:** två färdigskrivna textrester som väntar på funktioner som inte finns — publikhistorik-token (M14) och en trofé-/meritskärm (M50, `clubOfferQuotes`). **Varför uppskjuten:** texten kan inte kopplas in före sin funktion, och båda funktionerna är själva post-launch. **När:** post-launch, tillsammans med sina funktioner. Jacob 2026-09-09.

## Kvalitativ spelaruppföljning

### o12-softlaunch-population
**Vad:** slutmät O12:s valvariation per stabil `decisionTemplateKey` på aktuell
version. Den tekniska delen är passerad: domarmötet och mecenatintroduktionen
har verkliga avvägningar, kvittona bär mallidentitet och gamla köade intro
migreras. **Varför uppskjuten:** det enda återstående kravet är population,
inte produktkod. Det tidigare långspelet gav 158 val men från en enda
beslutsfattare och kan därför inte skilja personlig spelstil från systemisk
dominans. **Urval:** minst 20 naturliga val per återkommande mall från minst
fem oberoende karriärer/spelare. Ett alternativ över 80 procent flaggar
mallen för kvalitativ kodläsning; procentsatsen ensam auktoriserar ingen
balansändring. **Särskild bevakning:** `burnoutRelief`,
`communityActivityRenewal` och `burnoutCeiling`. **Underlag:**
`docs/rapport/RAPPORT_O12_NATURLIGT_PROV_2026-09-11.md`. **När:** under soft launch, ihop
med den övriga kvalitativa spelaruppföljningen.

### sluttest-kvalitativ-uppfoljning
**Vad:** sex till åtta riktiga spelare pausas efter omgång 3, 11 och 22 och får fem frågor om vem de bryr sig om, vad de försöker uppnå, vad de riskerar, vilket beslut som ändrade något och vad de vill se nästa säsong. Minst två spelar samma svåra klubb med olika filosofi och markerar när rollspel övergår i mekaniskt val. **Varför uppskjuten:** `SPELTESTKALENDER_2026-09-10.md` skiljer Jacobs enda pre-release-nyspelarkörning från den fulla 6–8-spelarrundan och klassar den senare som post-launch. Den kräver rekryterade externa spelare, inte mer produktkod. **När:** efter mjuk release; bevara svaren per kontrollpunkt och jämför om de blir mer specifika över tid.
