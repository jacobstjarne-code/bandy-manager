# HELHETSGENOMGÅNG — BANDY MANAGER, 2026-09-04

**Av:** Opus · **Beställd av:** Jacob ("grundlig genomgång av hela spelet: tekniskt, logiskt, speltekniskt, känslomässigt, rolighet, kommersiell utveckling") · **Underlag:** kodläsning under veckan (matchmotor, liggare, Berättaren, förhandling, hallprövning, akademi, formationer, portal, attention), sju GPT-speltest 2026-09-03/04 (taktik, transfer, minne/slutprov, akademi, styrelse/licens, systemaudit, 10-säsongsjournalen pågående), två Claude Design-granskningar (111 states + flödet), MASTER_OPPET (≈600 rader), LESSONS #1–56, extern research (källor i löptext, hämtade 2026-09-04).
**Vad detta inte är:** en ny lista över buggar — de står i ÖPPET. Det här är domen över vad spelet *är*, var det står, och vad som avgör om det blir något.

---

## 0. Domen i tio rader

1. Spelet har ett **minne** nu och är på väg att få en **berättare**. Det är den enskilt största förändringen på ett halvår, och den har verifierats av spelare (GPT) i skarpa karriärer: "spelet har gått från att nästan sakna minne till att ibland skapa övertygande fleråriga berättelser."
2. Det som bär är **personer och relationer**: burnout-bågen, mecenaten, brevarkivet, Kristoffers personliga mål, Jari som gjorde mål mot sin gamla klubb. Dragkraften kommer inte från siffror. Det är rätt spel att ha byggt.
3. Det som inte bär än är **redaktionen**: parallella sanningar mellan ytor, systemhändelser som skrivs men inte berättas, attribution som saknas ("vem blev bättre av vad"). Tre rapporter i rad säger samma sak. Berättaren är lösningen, halva är byggd.
4. **Matchkärnan är rolig när dramatiken är hög** (cup, slutspel, derbyn, halvtidsvändningar) och administrativ i serievardagen. Taktiken har mer djup än den kommunicerar — B12 och formationerna V2 är svaret, det ena specat, det andra byggt.
5. Tekniskt är det ett **moget, välvaktat repo** — 4 400+ tester, fem grindar, textsanning som princip, en liggare med schema-domar per fält. Skulden bor i F-vägarna (egna projektioner), i dev-fixturer som inte speglar spel, i tre agenter i samma träd, och i en röd CI ingen läser.
6. **En SVÅR klubb var deterministiskt omöjlig att sparka sportsligt.** Det upptäcktes i går. Kalibreringsrundan har fel baslinje sedan augusti. Rätta först, mät sen.
7. Marknaden är **liten och lojal**. Elitserien ökar publik mot strömmen, webbsändningarna växer, förbundet blöder pengar. Det finns ingen bandymanager. Det finns Hattrick — svenskt, textbaserat, 200 000 användare i 28 år. Det är förebilden, inte Football Manager.
8. **PWA utan app store** är rätt väg för det här spelet och den här marknaden: ingen 30 %-avgift, ingen granskning, en länk. iOS kostar friktion (Safari, manuell hemskärm), men EU-stödet står och push fungerar.
9. Den kommersiella risken är inte konkurrens — det är **att inte bli hittad** och att **släppa vid fel tidpunkt**. Bandy har en säsong. Den börjar i november. Annandagen är julafton.
10. Vägen till release är kort i innehåll och lång i disciplin: **inga fler system**. Berättaren färdig, kalibreringen gjord, ortbilderna in, en spelare som kan säga "det var mitt val" efter fyra säsonger. Sedan tolv riktiga människor i december.

---

## 1. Tekniskt

### Vad som står
Astro/React-SPA med domän–applikation–presentation, deterministisk matchmotor (seedad, kalibrerad mot Bandygrytan), local-first saves med versionerad migrering (0.3.10), en händelseliggare som kanon med per-fält-domar (`result`, `clubId`, `managerId`; `subjectSnapshot` dömd). 465 testfiler, 4 432 tester, tsc, build, fyra lintgrindar (design, content, facility, text) + dubblettvakt + påståendegrind + forbudslista. Textsanning som arkitekturprincip: ingen sträng utan deklarerat state-underlag. Det är ovanligt disciplinerat för ett indieprojekt av den här storleken.

### Skulden, ärligt
- **F-vägarna.** Ytor som läser egna fickor/projektioner i stället för redaktören: Granskas nästa-match, headerns slutspelskontext, managersektionen, Efterklang (nyss migrerad), "omgång 4"-stämpeln. Varje parallell läsning har varit en bugg GPT hittat. Omspårningen listar dem; migrering pågår.
- **Dev-fixturer som inte speglar spel.** Designgranskningens fem-av-tio "fel" var fixturer. Krönikans matchminne testades grönt mot ett tillstånd spelet inte kan producera (fixtures nollställs). Lånetester provade heltal i följd, inte cupkalender. Mönster: #50 i LESSONS, fem instanser. Fixen är metod — bygg testtillstånd via rollover/liggare, inte för hand — och en dumpsvit som täcker riktiga speltillstånd (mitt-i-säsong, flersäsong).
- **Tre agenter i ett träd.** Code, Codex, Opus (+ Jacobs illustrationer) skriver samtidigt. Lanes räckte inte när alla legitimt jobbade i liggaren; kollisionen upprepades tre gånger på två dagar. Regeln nu: Jacob sekvenserar, ingen väntar ut någon. Det är en processkostnad, inte en kodskuld — men den kostar timmar varje dag den inte följs.
- **CI röd.** 109 visuella baselines okvitterade sedan augusti. "Grönt" betyder lokala sviter. En permanent röd CI gör att ingen ser nästa riktiga röda. Det är en Jacob/Design-rad som blivit infrastruktur.
- **Enums och skript som överlevt sina system.** `TacticPress` kvar för 26 testfiler; tre skript utanför tsconfig refererar gamla formationer och ger fel svar tyst. Städas när kalibreringen ändå rör dem.
- **Backend finns nu, i teorin.** Attention Engine har Express-rutter, VAPID, in-memory store — körbart lokalt, driftsatt ingenstans. Första gången spelet har server-state. Det är ett arkitekturbeslut som väntar (§6).

### Dom
Tekniken är inte flaskhalsen. Den är bättre än produkten förtjänar just nu, i den meningen att grindarna vaktar text och design hårdare än speltestarna hittar fel i dem. Det som ska rättas är metod (fixturer, lanes, CI), inte stack.

---

## 2. Logiskt — sanningen i spelet

### Det som håller
Kanon (`BANDY_KANON`) är nu byggd på tre källfamiljer (förbund, tränare, forskning) och koden följer den: femman bak, formationen som höjdläge, zonförsvar, hörnor och utvisningsspel som bandyns egna axlar. Regler (offside, byten, 2 p vinst) stämmer. Textsanning vaktas mekaniskt. Liggaren är kanon för "vad som hände" och varje fält har en dom.

### Det som inte höll
- **Survive-undantaget.** Survive-tier kunde inte sparkas sportsligt — ett explicit kodundantag med ett test som krävde immunitet. Heros "100 % avsked" var 100 % licensnekan. Fyra fixar letade i fel kedja. Tre SVÅR-karriärer utan avsked bevisade gaten, inte balansen. Codex öppnade en väg (tre miss + tålamod ≤ 15); Jacob kvitterar. Detta är veckans viktigaste logikfynd och det säger något om metoden: **en assertion som kräver att något aldrig händer är en dom, och domar ska stå i DOMLOGG, inte bara i en testfil.**
- **Styrelsen talar ur fyra munnar.** boardObjectives, boardPatience, ClubExpectation, årsbokens boardTruth — inget skrivs till kanon. "Ordföranden frågade hur jag mår" bredvid "Stabilt". `board_verdict` (dömd) gör kontraktet till en post alla läser.
- **Licensen är osynlig i kanon.** Varning, poängavdrag, handlingsplan lämnar inget spår; årsboken kallade licensstatus för "Dina val". `license_event` (dömd).
- **Två klockor.** Global matchdag och ligaomgång blandades i UI. `currentChronology` byggd; migreringen av producenter pågår.
- **Formationen påverkade motorn åt fotbollshållet** medan kanon sa "påverkar inte". Rättat i går, V2 byggd samma dag.

### Dom
Logiken är sund där den är *en*. Felen är alla av samma slag: två sanningar om samma sak. Berättaren och de sex nya liggartyperna gör sanningen till en. Efter det finns inget system som inte skriver och ingen yta som läser vid sidan av.

---

## 3. Speltekniskt — loopen och systemen

### Veckoloopen
Portal → laguttagning → match → Granska → Portal. Fungerar. GPT: "Halvtidsförändringar kan skapa stark känsla av tränaragens." Svagheter: Granska är tonlös där tonen betyder mest (hero-score dömd, mock finns), autofyllet var administration (tre lägen dömda), loopen andas inte (tysta ytor får bilder).

### Säsongsbågen
Premiär → serie → cup → slutspel → årsbok → sommar. Strukturen finns; orden följde inte utfallet (fixtur-artefakt, produktionen var rätt). Årsboken väljer nu både beslut och person. Sommaren fick nyss kontraktskrav med tänder (fem lönekrav, åtta avgångar) — "ekonomin bet på riktigt".

### Systemen, ett i taget
- **Taktik:** åtta axlar → sju + uppställning (V2). Motorn räknar B12-samband som ingen visar — specat. Offensiv stapling för dominant i serien — kalibreringsrundan C2. Efter B12 + V2 + C2 är taktiken både sann och läsbar; före det är den sann men stum.
- **Transfer/kontrakt:** budkedjan, fria agenter, budget, facit — allt fixat den här veckan. Djupet som saknas (handpenning, boende, jobb, ansikte) är specat som en pass. Bruksbandyns förhandling, inte fotbollens.
- **Akademi:** "simuleringssystem, inte spelberättelse". Åtta liggartyper dömda, attribution ur sparade tal, junioren som fyller 20 väntar Jacobs kall. Två test, samma fynd.
- **Orten/CS:** bandyskola och streaming separerade och balanserade. CS-vändningar är inte händelser — `community_shift` dömd. Hallprövningen byggd med tre nej-vägar; kommun-nej görs nåbart.
- **Ekonomi:** biter nu — GPT tackade nej till tifo, kunde inte bygga, tog kommunlån. Två frågor kvar: tvåsäsongssolvens med Satsning (D2) och om ekonomin förklarar sig (akademiraden i årsboken).
- **Styrelse/licens:** logiken i §2. Spelmässigt: Survive-A gör att svåra klubbar kan förlora sportsligt utan att det blir godtyckligt.
- **Klacken/Orten/Brev/Patron/Mecenat:** de system GPT berömde. De skriver till liggaren (utom brev) och läses nu via Berättaren.

### Dom
Systemen finns, rör sig och gör ont på rätt ställen. Det som saknas är inte ett system till — GPT sa det ordagrant, två gånger — utan att systemen *berättar* vad de gjorde. Det är Berättaren, B12, attribution. Innehållsmässigt är spelet nästan klart. Redaktionellt är det halvvägs.

---

## 4. Känslomässigt

### Vad spelarna kände (GPT, tre karriärer)
"Jag mindes Pontus Olofsson, Robert Sjölund, Patrik Berglund, Johan Moberg, Gunilla Nilsson och mecenaten utan att läsa tabellerna." · "Jag byggde upp Kristoffer i Hälleforsnäs, slet ut mig, tog laget till två slutspel men fick ändå sparken. Efter ett år utanför tog jag över ett skuldsatt Slottsbron, blev beroende av brukets mecenat, sålde Jari och tog senare ett kommunalt lån för att slippa sälja Ulf." · "Dragkraften kom från personer och relationer, inte från att optimera siffror."

Det är ett managerspel där spelaren berättar sin karriär som ett liv. Det gör inte Football Manager — recensenterna av FM26 saknade exakt det: berättandet som fick dem att älska serien har krympt till "en tidning läst genom brevlådan". Bandy Manager har det, i liten skala, på riktigt.

### Var känslan bryts
- **Investeringar som försvinner.** Johan Moberg, 19, mentor, landslagssamling — borta utan ett ord. "Spelet förlorar förtroende varje gång en investering försvinner." Akademidomen stänger det.
- **Löften som inte betyder något.** Bussavtalet utan effekt (fixat), kontraktsfacit (fixat), "ingen ska behöva lämna" efter att åtta lämnat (rad).
- **Anonymitet.** Milstolpar utan namn, derbyrader utan motståndare. Fixat i årsboken; `subjectSnapshot` gör det strukturellt.
- **Avslut som inte stänger.** Burnout-taket följt av det vanliga kortet (fixat); måltorkan som återkom som ny (återfallsdomen).
- **Resultatet utan ögonblick.** Granska efter matchen är protokoll, inte känsla. Hero-score dömd, mock klar.

### Det som är rätt och ska försvaras
Understatementet. "Han sa att han förstod." "Kommunen sa nej. Inte till hallen. Till oss." "Ingen tårta den här gången — men han log." Registret är spelets röst och det är sällsynt i genren. Deletion-disciplinen (rör inte det som bär) har hållit i veckan trots fyra agenter.

### Dom
Känslan finns där berättaren finns. GPT:s karriärmening är godkänt-kriteriet: när spelet självt kan skriva den ur årsböcker och Krönika är Berättaren klar. Vi är två steg därifrån (steg 9 + callbacks byggda, de sex nya typerna kvar).

---

## 5. Roligt — var pulsen är

**Hög puls:** cupfinal 1–6 → 9–8; semifinalvändning från 0–3; formationsbytet som vände 0–2 i matcher; juniorens fyra mål i slutspelet; derbyt; ekonomivalet där alla alternativ gjorde ont (lån vs sälja Ulf); avsked → år utanför → ny klubb ("en av spelets bästa fleråriga mekanismer"); att tacka nej till tifo för att kassan sa nej.

**Låg puls:** serievardag med ett offensivt recept som fungerar (C2 fixar); "fyll elvan"-administration (dömd); Granska som protokoll (dömd); Efterklang som stod stilla (fixad); tomma tysta ytor (bilder på väg).

**Det roliga spelet är redan där för den som spelar cup och slutspel.** Det tråkiga spelet är mittsäsongen för mittenlaget. Två saker vänder det: taktiken blir läsbar (B12) så mittenmatcher blir problemlösning, och Berättaren gör att en omgång 11 mot Lesjöfors bär historien från omgång 3 ("Jari i fel tröja").

**Vill spelaren spela en säsong till?** GPT, tre gånger: ja — "för att se om lånet betalar sig, vad mecenaten kräver, om tidigare spelare återkommer". Alla tre skälen är personer och löften. Inget är en siffra. Det är det som avgör om ett spel är roligt på fjärde säsongen, och spelet har det.

---

## 6. Kommersiellt

### Marknaden
Bandy är liten, lojal och — ovanligt — växande. Enligt Svenska Bandyförbundet (pressmeddelande maj 2025) visar Elitserien positiva publiksiffror medan handboll, innebandy, speedway och damfotboll tappat 10–20 % mot före pandemin; webbsändningarna ökar, damernas med 28 % och herrarnas med 8 % mot föregående säsong. Samtidigt (svenskbandy.se, 2026) redovisar förbundet negativt resultat för 2025/2026, med minskat RF-stöd och sponsorintäkter betydligt under budget. Publiksnitten är bruksortsstora: Villa Lidköping kring 2 780 säsongen 2023/24, mittenklubbar 700–1 500 (BandyWorld). Fjorton elitserieklubbar, en cup, ett slutspel med final i mars; VM 2026 i Finland drog 5 398 åskådare på tolv matcher — 450 per match (Wikipedia).

**Läsning:** den adresserbara publiken i Sverige är tiotusentals engagerade, inte miljoner. Men de är exakt den publik som spelar managerspel: äldre, lojala, statistikintresserade, med en stark ortsidentitet. Och de har inget spel. Det finns ingen bandymanager, ingen bandysimulator, ingen konkurrens. Det är en lucka, inte en marknad — och luckor fylls av det första som är bra nog.

### Jämförbara spel — vad nischen tål
- **Cricket Captain** har sålts årligen sedan 1998 av ett litet studio (Childish Things), textbaserat, utan fanfar, till en hängiven publik; Pocket Tactics kallar cricketmanagement "en mycket smal genre" där spelet är oöverträffat i djup. Cricket är en världssport; bandy är det inte. Men mönstret — ett djupt textspel som ägs av sin nisch i decennier — är rätt förebild för hur länge ett sådant spel kan leva.
- **Cricket Director** (cricketdirector.com) — en solo-indie som körs helt i webbläsaren, sparar lokalt och fungerar offline — är tekniskt det spel vi har byggt, för en annan sport. Det bevisar att formen (browser, local-first, ingen store) är gångbar för sportsim.
- **Hattrick** är den viktigaste jämförelsen. Lanserat i Sverige 1997 som ett examensarbete; den långsamma designen har skapat en lojal gemenskap där användare förblir aktiva i decennier (ScienceDirect, 2026). Omkring 200 000 användare stabilt i över fem år; några har skött samma klubb i över tjugo. Gratis, men majoriteten betalar en årlig avgift för extra funktioner (Galaxus, 2024). Svenskt, textbaserat, långsamt, communitydrivet, free + supporter. Det är Bandy Managers släkting — och lärdomen är att *långsamt och personligt* håller längre än *snabbt och belönande*.
- **Football Manager 26** fick över 1 000 mestadels negativa Steam-recensioner inom två timmar (Eneba, 2025), och recensenterna saknade berättandet — Phenixx Gaming: det berättande i FM24 som recensenten blev kär i saknades i FM26; nyheterna läses "genom brevlådan". Marknadsledaren har tappat exakt det Bandy Manager är byggt kring. Det är inte en konkurrent vi ska slå; det är ett bevis på vad genrens publik saknar.

### Retention — vad "sticky" betyder i tal
Industrimedianen ligger kring 26 % dag 1; en realistisk "bra" profil är D1/D7/D30 = 35/15/5 och toppkvartilen klarar 40/20/10 (Playio, juli 2026). Mid-core-titlar startar lägre dag ett men håller 20–21 % vid D7 och 11–12 % vid D30, eftersom metan ger skäl att komma tillbaka (AppFollow, 2026). Prenumerationsappar snittar 14 % D30 mot 5,4 % för övriga (Playio). Bandy Manager är mid-core, local-first, säsongsbundet och berättelsedrivet — allt pekar på hög D30 för en liten grupp snarare än hög D1 för många. GPT:s "vill jag spela en säsong till? ja" är D30-signalen. Den ska mätas kvalitativt tills tolv riktiga spelare finns; U9-mättjänsten är rätt parkerad.

### Distribution — PWA, inte store
Spelet är redan en PWA med push-grund. Det är rätt val: PWA:er slipper App Stores 15–30 % avgift, minskar installationsfriktionen och kräver en kodbas för webb och installerad app (PWA-guider 2026). iOS är priset — ingen auto-prompt, installation bara via Safari, gated web push, lagringsutrensning, ingen App Store-närvaro; Android tar bort friktionen automatiskt, iOS kräver att du guidar den (DeepClick, 2026). EU-frågan är avgjord: Apple återställde hemskärmsappar för EU-användare i iOS 17.4 med alla funktioner inklusive push (mars 2024). Så: en länk, en guidad "Lägg till på hemskärmen" på iPhone, push efter första veckan. Ingen store, ingen granskning, ingen avgift. Codex byggde permission-flödet enligt det.

**Vad PWA kostar oss:** upptäckbarhet. Ingen bläddrar sig till en PWA. Det kräver att spelet hittas via bandyns egna kanaler — och det är där marknaden faktiskt är.

### Kanaler — bandyn har sina egna
Bandyplay (förbundets streaming), Bandypuls, Elitserien.se, klubbarnas Facebook-grupper, bruksorternas lokaltidningar (tolv verkliga orter i spelet — tolv lokaltidningar som gärna skriver "Söderfors i ett dataspel"), SvBF:s nyhetsbrev. Publiken är liten men koncentrerad och nåbar utan annonspengar. Riskerna: förbundets svaga ekonomi gör partnerskap osäkra; klubbar och orter är verkliga men klubbnamnen fiktiva — det ska vara tydligt i all kommunikation.

### Affärsmodell — tre vägar
1. **Gratis + supporter (Hattrick-modellen).** Spelet gratis, en årsavgift (~199–299 kr) för Krönikans fullständiga arkiv, fler saves, tidig tillgång till nya orter/säsonger. Passar local-first (inget konto krävs för att spela), passar publiken (lojal, betalar för sin sport), passar PWA (ingen store). Kräver den backend som redan påbörjats.
2. **Premium engångsköp (Cricket Captain-modellen).** ~99–149 kr, en årsutgåva med nya orter/regler. Enklast, men PWA utan store gör betalväggen till egen infrastruktur, och "årsutgåva" passar sämre ett spel vars styrka är att karriären fortsätter.
3. **Gratis, finansierat av bandyn.** Förbund/Bandyplay/klubbsponsorer betalar för spelet som marknadsföring av sporten. Svårt just nu — förbundet har inte råd — men ett långsiktigt samtal värt att ha, särskilt kring ungdomssidan (bandyskolan i spelet är BandyKuls modell).

**Rek:** väg 1, med väg 3 som samtal. Väg 1 är den enda som växer med spelets egen styrka (tid, minne, karriär) och som fungerar utan store.

### Timing — bandy har en säsong
Serien startar i november, annandagen är sportens julafton, finalen är i mars. Ett bandymanagerspel som släpps i maj är osynligt till november. **Release ska ligga i november 2026, mjuk (tolv riktiga spelare) i oktober**, med push aktiv till annandagen. Det ger ~8 veckor. Det är inte omöjligt givet var spelet står (§8) — men det förutsätter *inga fler system*.

### Risker
- **Att bli klar med redaktionen men inte med kalibreringen** — ett spel som berättar vackert om en klubb som inte kan förlora rätt.
- **Att fixturer fortsätter lura tester** — release på grön svit som inte speglar spel.
- **Backend utan dataskyddsbeslut** — första server-state i ett local-first-spel; besluten (lagring, radering, text) före driftsättning.
- **Tre agenter, ett träd** — dagliga kollisioner äter timmar som behövs för release.
- **Tolv verkliga orter** — trovärdighet är styrkan; en ort som känner sig felbeskriven är en risk. Kanon och `clubExtendedInfo` är väl grundade; ortbilderna gör det ännu mer konkret. Läs varje ort en gång till med ortens ögon före release.

---

## 7. Vad som skiljer det här spelet — positioneringen i en mening

*Ett managerspel som minns dig.* Inte "Football Manager för bandy" — det är att bjuda in en jämförelse spelet förlorar. Utan: det enda sportspelet där klubben är en ort, där varje spelare är en person med ett jobb och en lägenhet, där dina val står i en krönika som läses upp fem år senare, och där du kan berätta din karriär utan att titta på en tabell. Det är sant idag för den som spelar fyra säsonger. Efter Berättaren är det sant för alla.

---

## 8. Vägen till release — prioriterat, utan mantimmar

Ordningen är byggd på beroenden och på vad GPT:s omkörningar ska bekräfta. Ägare i parentes. Beslutspunkter för Jacob markerade ★.

**Block 1 — sanningen en (Code, pågår):** Berättaren steg 9 (återfall, dom står) · sex nya liggartyper (styrelse, licens, orten, hall, brev, personligt mål) efter RAW · F→B-migreringarna (Granska nästa-match, header, managersektionen) · `subjectSnapshot`. ★ Survive-A kvitteras. Godkänt: GPT:s slutprov körs om — karriärmeningen skriven av spelet.

**Block 2 — taktiken läsbar (Code):** B12 Matchens samband · formationsskripten utanför tsconfig · kalibreringsrundan A/B/C med ny baslinje (per avskedsorsak). ★ Heros 60 %-målet kvitteras efter första mätning. Godkänt: GPT:s taktiktest fråga 1 igen.

**Block 3 — personer som stannar (Code):** akademidomens åtta typer + attribution · c-t8 förhandlingstermer · ★ junioren som fyller 20. Godkänt: GPT:s akademitest och transfertest igen.

**Block 4 — känslan (Jacob/Design/Code):** hero-score i Granska (mock klar) · Klubbminnet-redesignen mot enad läsare · de 19 återstående bilderna (tre orter, moment, interiörer) + wiring · Klubb-flikarna (Akademi → Trupp, Bygget in) · ★ 1.4-diffarna kvitterade så CI blir grön.

**Block 5 — utanför spelet (Jacob + Codex):** ★ backend/drift/dataskydd för push · ★ permission-ögonblicket · copy-registret är låst · Etapp 1B aktiveras · Vercel main→preview.

**Block 6 — mjuk release (Jacob):** tolv riktiga spelare (bandyfolk från tolv orter?) i oktober med journalinstruktionen som mall · kanaler: Bandypuls/klubbgrupper/lokaltidningar · supporter-modellens första version.

Blocken 1–3 är Codes/Codex och kan gå parallellt om lanes hålls (liggare / motor / akademi+förhandling). Block 4 är där Jacobs öga behövs. Block 5 är beslut, inte bygge. Inget nytt system i något block.

---

## 9. Vad som ska mätas — före tolv spelare finns
- **Karriärmeningen:** kan spelet skriva den ur årsböcker + Krönika? (Berättaren godkänt-när.)
- **Avsked per orsak:** licens / sportsligt / konkurs, per svårighetsgrad, 10 000 seeds. Heros 55–65 %.
- **Taktisk dominans:** vinner ett balanserat upplägg mot Ultra över 22 omgångar ≥ 50 %?
- **Attribution:** får varje lån, mentorskap och uppflyttning sin "varav"-rad?
- **Told-registret:** säger någon yta samma sak två gånger? Räkna dubbletter per karriär.
- **Tystnad:** hur många omgångar utan ett enda minneskort/eko? Bakgrundsbrus ska vara lågt, men aldrig noll i fyra omgångar.
- **Fixtur-täckning:** hur många av GPT:s reproducerade buggar hade en dev-scen kunnat visa? (Målet: alla.)
Sedan, med spelare: D7/D30 kvalitativt (spelar de säsong två?), journalens fem frågor, och — det enda som räknas — "vill du spela en säsong till, och exakt varför".

---

## 10. Öppna frågor till Jacob (de som avgör riktning, inte detaljer)
1. Survive-A eller B.
2. Junioren som fyller 20 — kortet, tröskeln.
3. Affärsmodell: supporter-modellen — ja, och när börjar backend-passet?
4. Release-fönster: november 2026 med mjuk oktober — är det målet?
5. Kanalerna: vem pratar med Bandypuls/klubbarna, och när?
6. Erik eller Gemini för de fyra momentbilderna.

---

## 11. Slutord

Det här är ett spel om en ort som råkar ha ett bandylag, byggt av någon som förstår att en klubb är människor och att en säsong är ett år av någons liv. Det har den enda sak i genren som inte går att köpa: en röst. Veckan som gick byggde minnet som röster behöver. Det som återstår är att låta rösten tala överallt där den ännu är tyst — och att sluta bygga nya rum tills den gjort det.

Sedan tolv människor i december. Annandagen är julafton.

---

## Källor (externa, hämtade 2026-09-04)
Svenska Bandyförbundet, "Bandy går mot strömmen – publiken ökar i Elitserien" (pressmeddelande via TT, 7 maj 2025; svenskbandy.se) · svenskbandy.se nyheter 2026 (förbundets ekonomiska resultat 2025/2026) · BandyWorld, Elitserielagens publik 2023/24 · Wikipedia, 2026 Bandy World Championship; Elitserien (bandy) · Pocket Tactics, "The best mobile sports manager games" · cricketdirector.com · Wikipedia, International Cricket Captain · ScienceDirect, "Decoding the mechanisms of the Hattrick football manager game" (2026) · Galaxus/Digitec, "Hattrick, the classic online football manager game" (2024) · Wikipedia, Hattrick · Eneba, "Football Manager 26 releases to mostly negative reviews" (2025); AltChar, Phenixx Gaming, Analog Stick Gaming FM26-recensioner · Playio, "D1/D7/D30 Retention Benchmarks for 2026" · AppFollow, "Mobile Game Retention in 2026" · Game Growth Advisor, retention 2026 (metodkritik av genre-tabeller) · DeepClick, "PWA on iOS: Install Guide & Limits 2026" · MagicBell, PWA iOS limitations 2026 · PushAlert/The Register/Silicon, Apples EU-reversering för hemskärmsappar (mars 2024).
