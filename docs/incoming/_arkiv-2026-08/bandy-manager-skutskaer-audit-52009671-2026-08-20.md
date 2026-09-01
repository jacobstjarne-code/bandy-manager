# Bandy Manager — ny Skutskär-audit

**Deploy/revision:** `520096718506e5f4895b7142eaae021164729a10` (`52009671` i UI)  
**Kodparent:** `d654ecb7dc1be9e64aae730cdc8b514277a60c68`  
**Beställd bas:** `e2e39b66`, verifierad som anfader till den testade revisionen  
**Testdatum:** 20 augusti 2026  
**Format:** mobil, 390 × 844 px  
**Klubb:** Skutskär, SVÅR  
**Omfattning:** en hel säsong 2026/27, hela slutspelet till uttåg, årsbok, sommar och starten av 2027/28

## Kort dom

**Ja: Skutskär kan nu misslyckas sportsligt utan sabotage.** Jag spelade normalt och kompetent, utan att tanka matcher, och laget slutade åtta på 18 poäng med 7–4–11, målskillnad 82–100 och en fem matcher lång förlustsvit. Truppslitage, positionsviktad utmattning, skador och en tunn 16-mannatrupp skapade en verklig nedåtspiral.

**Nej: testet bevisar fortfarande inte att man kan misslyckas som manager utan sabotage.** Trots båda styrelseuppdragen markerade som hotade, fem raka förluster och kamp vid slutspelsstrecket stod styrelsen kvar på **Stabilt**. Årsboken sade sedan **Styrelsen är mer än nöjd**, eftersom åttonde plats räknas som ett maximalt överträffande av Skutskärs låga grundförväntan. Jag blev därför inte sparkad och post-avskedsflödet kunde inte retestas naturligt.

Den viktigaste produktsanningen är alltså: **spelet kan numera göra ont på planen, men det förklarar inte trovärdigt hur den smärtan hänger ihop med jobbet, styrelsen och risken att förlora karriären.**

Severity:

- Blocker: 0
- Critical: 0
- High: 6
- Medium: 7
- Low: 2

## Bevisnivåer

- **SÅG:** inträffade i den riktiga, sparade genomspelningen.
- **KODBEVIS:** följer direkt av aktuell produktionskod.
- **INTRÄFFADE INTE:** var möjligt men drogs inte i detta frö eller denna säsong.
- **KAN INTE:** den efterfrågade vägen är mekaniskt onåbar i aktuell wiring.

## Testmetod och säsongsfacit

Jag använde rekommenderad/default formation, fyllde bästa elvan, ändrade till rekommenderade formationer när truppen krävde det, valde vila i periodiseringen, tog rimliga ekonomiska och mänskliga beslut och snabbspelade matcherna. Jag valde inte medvetet dålig taktik, fel spelare eller negativa beslut för att pressa ned styrelsens tålamod.

Resultat:

- Svenska cupen: seger 5–3 mot Rögle, därefter 4–10 mot Västanfors i kvartsfinal.
- Serien: 8:e plats, 18 poäng, 7 vinster, 4 oavgjorda, 11 förluster.
- Mål: 82–100.
- Längsta vinstsvit: 3 matcher.
- Längsta förlustsvit: 5 matcher.
- Slutspel: utslagen 1–3 i matcher av Västanfors i kvartsfinal.
- Ekonomi: 270 tkr vid start, 159 tkr vid slut.
- Lokalstöd vid slut: 74.
- Styrelseuppdrag: publikens humör till 70 och kassan +100 tkr; båda visades som i fara.
- Styrelsens säsongsdom: **mer än nöjd**.
- Säsong två startade med **Styrelsen: Stabilt**.

## Prioriterade fynd

### High 1 — Spelarens misslyckande och styrelsens dom beskriver två olika säsonger

**Bevis:** SÅG + KODBEVIS  
**Reproducerbarhet:** hög med Skutskär om laget landar runt plats 8

**Reproduktion**

1. Starta Skutskär och spela normalt.
2. Missa båda styrelseuppdragen.
3. Hamna vid slutspelsstrecket med negativ målskillnad och en lång förlustsvit.
4. Läs portalens styrelsestatus och årsbokens dom.

**Expected:** Styrelsen bör antingen reagera på den upplevda krisen, eller tydligt förklara att tabellmålet väger tyngre än de missade uppdragen och den negativa trenden.

**Actual:** Portalen sade **Stabilt / Styrelsen har inget att invända** medan två uppdrag samtidigt låg under rubriken **STYRELSEUPPDRAG I FARA**. Årsboken höjde sedan domen till **Styrelsen är mer än nöjd**.

**Sannolik kodorsak:** `computeSeasonVerdictRating()` i `src/domain/services/boardService.ts:187` ger betyg 5 för `AvoidBottom` när placeringen är `<= totalTeams - 4`; med tolv lag betyder det plats 8 eller bättre. `computeBoardPatienceUpdate()` i samma fil runt rad 247 låter plats 8 lämna tålamodet oförändrat. Missade delmål kostar bara fem poäng vardera i `src/application/useCases/seasonEndProcessor.ts:941`, vilket inte räcker för att lämna zonen Stabilt från startvärdet 70. En fem matcher lång förlustsvit påverkar inte den synliga zonen.

**Rekommenderad fix:** Gör styrelsedomen sammansatt och förklarad: grundförväntan, trend, delmål, ekonomi och eventuell nedflyttningsrisk ska visas som separata faktorer i samma besked. Låt dålig trend skapa en temporär presszon under säsongen, även om slutplaceringen senare räddar jobbet. Visa varför slutdomen blev positiv: exempelvis “Plats 8 överträffade målet, men två uppdrag missades”.

### High 2 — Utmattningen biter sent, men 0 % är för spelbart och auto-valet hjälper inte spelaren

**Bevis:** SÅG + KODBEVIS  
**Reproducerbarhet:** hög med Skutskärs tunna trupp

**Reproduktion**

1. Spela samma starka elva och använd **Fyll bästa elvan**.
2. Följ konditionen genom cup och serie.
3. Fortsätt när flera spelare når 0 %.

**Expected:** 0 % bör betyda att en spelare i praktiken inte är spelklar, eller åtminstone att automatiken tydligt roterar bort honom och att matchutfallet visar en omedelbar, begriplig kostnad.

**Actual:** Flera spelare startade på 0 %. Eftermatchtexter sade ofta “ingen påverkan” eller “gjorde sitt”, och spelare på 0 % kunde fortfarande göra flera mål eller bli bäst på plan. Senare kom många skador och en verklig resultatsvacka, så systemet har konsekvens — men den kommer sent och känns mer slumpmässig än styrbar.

**Sannolik kodorsak:** `spelklarhet()` i `src/presentation/utils/lineupNudge.ts:21` väger current ability 70 %, form 20 % och fitness bara 10 %. Själva matchvärderingen i `src/domain/services/squadEvaluator.ts:41` väger fitness hårdare, men spelaren får då en elva som UI:t kallar “bäst” trots att den är sportsligt oklok. Form kan samtidigt fortsätta stiga med höga matchbetyg i `src/application/useCases/processors/playerStateProcessor.ts:154`. Positionsvikten finns och fungerar, men återhämtningen räcker inte för en tunn trupp.

**Rekommenderad fix:** Inför en spelklarhetsgrind under exempelvis 20–25 %, eller en kraftigt icke-linjär fitnessvikt. Låt **Fyll bästa** optimera för faktisk matchvärdering och tillgänglig ersättare, inte främst CA. Byt copy vid 0 % från neutrala resultat till ett tydligt riskutfall. Visa “bästa nu” och “bästa om du skyddar säsongen” som två val.

### High 3 — Uttåg ur slutspelet flyttar världen flera veckor och redovisar det som en oförklarad −100 tkr-rad

**Bevis:** SÅG + KODBEVIS  
**Reproducerbarhet:** hög efter tidigt slutspelsuttåg

**Reproduktion**

1. Förlora sista matchen i en kvartsfinalserie.
2. Öppna Granska.
3. Läs **SEDAN SIST** och nästa-match-texten.

**Expected:** Granska ska beskriva matchen som just spelades. Ekonomin ska visa matchens eller den tydligt namngivna periodens poster. Världen bör inte upplevas ha gått vidare innan spelaren stängt matchen.

**Actual:** Granska visade **Ekonomi −100 tkr** utan förklaring. Samtidigt sade en omvärldsrad att Västanfors väntade borta, trots att Skutskär precis hade slagits ut och säsongen var slut.

**Sannolik kodorsak:** `advance()` auto-loopar genom matchdagar utan manager-match i `src/presentation/store/actions/gameFlowActions.ts:68–107`. `financesBefore` tas före hela loopen och `financesAfter` efter den, medan Granska fortfarande visar den senast spelade managermatchen. Därmed kan flera löne- och världsticks summeras till en enda “Sedan sist”-rad. Sponsor- och andra event kan också genereras under de dolda passen.

**Rekommenderad fix:** Frys och visa Granska direkt efter uttåget. Kör återstående slutspel först när spelaren lämnar Granska, eller lagra ett separat summary per auto-loop. Om flera veckor verkligen ska passera måste UI:t säga “Under de följande fem veckorna” och visa en klickbar ekonomispecifikation.

### High 4 — Pressminnet är fortfarande den största sanningsrisken

**Bevis:** SÅG + KODBEVIS  
**Reproducerbarhet:** hög över en hel säsong

**Reproduktion**

1. Skapa eller lös en kontrakts-/arbetslivsbåge.
2. Spela flera matcher efter att storyn lösts.
3. Besvara presskonferenserna.

**Expected:** En löst båge ska få en eller ett fåtal relevanta efterspel, sedan vila. Svarsalternativen ska stämma med den nya staten.

**Actual:** Samma kontraktsfråga återkom i sex raka ligamatcher. Kaptenfrågan återkom ungefär åtta gånger. Efter att Mikael Lindström slutat sitt jobb för heltidsbandy erbjöds svaret **“Han går till jobbet klockan sex. Sen tränar han.”**

**Sannolik kodorsak:** `generatePressConference()` väljer storyline-overrides på nytt varje match i `src/domain/services/pressConferenceService.ts:716–755`; ingen historik över nyligen använda frågor eller story-beats finns. `went_fulltime_pro` föredrar fortfarande svar-id `tp_liv1` på rad 741, och den svarstexten på rad 287 beskriver uttryckligen ett kvarvarande dagjobb.

**Rekommenderad fix:** Spara `recentPressQuestionKeys` och `storylinePressBeatsUsed` per säsong. Begränsa en storyline-fråga till en huvudfråga och högst en uppföljning. Lägg state-gates på varje prefer-id och gör ett tabelltest som förbjuder dagjobbsvar när `isFullTimePro === true`.

### High 5 — Det avsedda postmatch-paret kan inte nå BatchStack

**Bevis:** KAN INTE + KODBEVIS  
**Reproducerbarhet:** 100 % för den nu avsedda fanLetter/opponentQuote-vägen

**Reproduktion**

1. Spela en match med minst tre måls marginal så att både insändare och motståndarquote kan skapas.
2. Låt båda få samma `triggerGroupId`.
3. Följ eventrenderingen i portalen.

**Expected:** Det aktiva kortet visas under Primary i en `BatchStack`, med korrekt “En till”/“2 till”-räknare.

**Actual:** Jag såg ingen sådan stapel under säsongen. Koden visar att den avsedda vägen inte kan nå den.

**Sannolik kodorsak:** Båda eventen skapas med `choices: []` i `src/domain/services/postMatchEventService.ts:25–70`. De klassas därför som ambienta. `PortalEventSlot` returnerar `AmbientEventRow` på `src/presentation/components/portal/PortalEventSlot.tsx:45–49` innan batchlogiken på rad 59–67 nås. Komponenttesterna använder syntetiska events med val och bevisar bara kromet, inte produktionsvägen.

**Rekommenderad fix:** Bestäm först den avsedda UX-modellen. Om reaktionerna ska vara ambienta behöver `BatchStack` kunna batcha ambienta rader före early return. Om de ska “betas av” måste de få en explicit dismiss-action. Lägg ett integrationstest från `generatePostMatchEvents()` hela vägen genom `PortalEventSlot`.

### High 6 — En skadad spelares beslutskort döljer vem beslutet gäller

**Bevis:** SÅG + KODBEVIS  
**Reproducerbarhet:** hög när flera milda skador finns

**Reproduktion**

1. Få en spelare med mild skada.
2. Vänta på “Han vill spela”.
3. Försök avgöra om just den spelaren ska vila eller spela.

**Expected:** Namn, skada och återstående tid ska stå på beslutet.

**Actual:** Portalen visade den generiska kroppen “Han vill spela …” och valen **Han spelar / Han vilar**, utan synligt spelarnamn. Flera sådana kort kunde ligga i samma portal.

**Sannolik kodorsak:** Eventet har korrekt titel och `relatedPlayerId` i `src/application/useCases/processors/eventProcessor.ts:497–507`. Men `EventCardInline` visar bara `event.title` för `hallDebate` i `src/presentation/components/portal/EventCardInline.tsx:139–144`, och använder inte `relatedPlayerId` som namn-tag.

**Rekommenderad fix:** Låt inlinekortet alltid visa en meningsfull titel när den finns och återanvänd samma player-tag som `EventOverlay`. Lägg snapshot-/DOM-test för två samtidiga `playThroughInjury`-kort med olika spelare.

## Medium

### Medium 1 — Vanliga sponsorer staplas under dolda auto-loopar och har ett dominant val

**Bevis:** SÅG + KODBEVIS

Efter säsongsslutet låg två sponsorerbjudanden direkt efter varandra: Bygg AB Nordin och Skrot & Metall Nordin. Båda gav pengar utan synlig kostnad; “Acceptera” dominerade “Avslå”. `postAdvanceEvents.ts:603–646` kan skapa ett nytt erbjudande varje pass så länge den gamla sponsorn ännu inte accepterats och därmed inte räknas som aktiv. Auto-looparna förstärker problemet.

**Fix:** Dedupe på “öppet sponsorerbjudande”, max ett samtidigt. Ge vanliga avtal åtminstone löptid, exklusivitet, kategorikrock eller lokal värderingskostnad. Flytta säsongsslutets erbjudanden efter årsboken.

### Medium 2 — Mecenatens sociala pool känns tom under första säsongen

**Bevis:** SÅG + KODBEVIS

Samma bastuinbjudan dök upp ungefär sju gånger. Kodens enda spärr är minst fyra omgångar per mecenat och 35 % dragchans (`eventProcessor.ts:134–145`); flera mecenater har separata minnen och inget gemensamt minne per eventtyp.

**Fix:** Max två sociala mecenatbeats per säsong totalt, undvik samma typ två gånger samma säsong och låt relationens utveckling byta text och insats.

### Medium 3 — “Form 98” läses som resultatkurva men är spelarnas attributsnitt

**Bevis:** SÅG + KODBEVIS

Portalen visade **Form 94–98** under en lång förlustsvit och samtidigt som flera spelare låg på 0 % kondition. `FormStatusMinimal.tsx:6–34` visar medelvärdet av `player.form`, inte lagets senaste resultatform. För en spelare betyder etiketten rimligen “hur går laget just nu”.

**Fix:** Byt namn till **Spelarform** eller **Dagsform**, och visa separat resultatrad V/O/F. Alternativt koppla formdriften tydligare till lagets faktiska prestation och utmattning.

### Medium 4 — Den kritiska kanalen är globalt tom, inte bara lugn i detta frö

**Bevis:** KAN INTE i aktuell registerstatus + KODBEVIS

Jag såg inget event som kändes felaktigt litet enbart på grund av saknad `whyNow`; mecenatens sociala inbjudningar mådde snarare bra av lugnare presentation. Men `getEffectivePriority()` i `src/domain/services/eventQueueService.ts:46–65` nedgraderar alla raw-critical events utan registerrad, och `contentContract.ts` dokumenterar att samtliga fyra nu kritiska typer saknar sådan data. Därför finns ingen verklig pivotal overlay-väg för `mecenatEvent`, `economicStress`, `playerUnhappy` eller `criticalEconomy`.

**Fix:** Prioritera per undertyp/instans, inte bara `GameEventType`. En bastu är normal; ett irreversibelt stjärnsälj eller ett faktiskt ultimatum är pivotal. Lägg kontraktstest som kräver minst en nåbar critical-produktionsinstans.

### Medium 5 — Säsongsfinalens rytm kapas av gammal beslutsskuld

**Bevis:** SÅG

Efter uttåget behövde jag först stänga klubbögonblicket och hantera spelar-/sponsorkort innan årsboken kunde öppnas. Det gör att “säsongen är slut” inte landar rent, trots att själva årsboken är stark.

**Fix:** Inför en säsongsslutsbarriär: avsluta match, visa årsbok, behandla därefter övergångsbeslut i sommarflödet. Rensa eller konvertera daterade erbjudanden före ceremonin.

### Medium 6 — Resultatberoende domartext används som neutral domarröst

**Bevis:** SÅG + KODBEVIS

Efter en 3–4-förlust sade domaren **“Idag föll de åt er. Ibland inte.”** Texten ligger i den generella poolen för inkonsekventa domare (`src/domain/services/refereeService.ts:40–43`) utan utfallsparameter.

**Fix:** Dela citat i vinst/förlust/neutralt eller skriv om raden till “Idag föll de åt ett håll”. Lägg kontexttabelltest.

### Medium 7 — Hård omladdning av en intern speladress återgår till titelskärmen

**Bevis:** SÅG

En direkt omladdning av `/game/history` visade titelskärmen trots giltig sparning. **FORTSÄTT** återställde rätt Skutskär-save, så data gick inte förlorad, men avsedd route gick förlorad och spelaren hamnade på dashboard.

**Fix:** Vänta på save-rehydrering innan route-guard avgör startskärm och bevara requested path genom återupptagning.

## Low

### Low 1 — Säsongen är slut men dashboarden säger “Näst på tur: spela omgången”

**Bevis:** SÅG

Efter kvartsfinaluttåget stod både “Säsongen är slut” och “Näst på tur: spela omgången” på samma vy. Nästa steg var egentligen **Avsluta säsongen**.

**Fix:** Låt next-action-resolvern känna till `seasonEnded` och playoff-eliminering.

### Low 2 — PWA-uppdateringen saknar ett begripligt versionsskifte för återvändande testare

**Bevis:** SÅG

Den första öppna tabben låg kvar på `a0df4c1`, trots att ny nätverksladdning gav `5200967`. `vite.config.ts` använder `registerType: 'autoUpdate'`, men en redan öppen app kan alltså fortsätta visa gammal kod utan synlig signal.

**Fix:** Visa “Ny version finns — ladda om” och logga aktiv respektive väntande service-worker-version. Detta är särskilt viktigt under begränsad release när buggrapporter måste knytas till rätt commit.

## De fem nya områdena

### Multi-slot — godkänd

**SÅG:** Jag skapade karriären **Audit Skutskär**, avbröt mitt i tillträdet, skapade **Audit Målilla B**, bytte tillbaka och återupptog Skutskär exakt på `/tilltrade`. Båda sparningarna låg kvar, aktiv karriär var tydligt markerad och **Byt karriär** fungerade.

Mindre friktion: startskärmens knappar går inte att använda förrän introanimationen är färdig, men det lästes som avsiktlig entré, inte blockerande fel.

### Sommaren — visuellt godkänd, rytmiskt delvis godkänd

**SÅG:** De tre nivåerna läser olika:

1. mörkt, svalt läder för “Sommaren 2027” och den personliga återblicken;
2. ljust papper för styrelsens mål och spelarens eget mål;
3. mörk, varm push för säsongen framför dig.

Det är en tydlig temperaturkurva och inte tre likvärdiga rutor. Problemet är i stället placeringen: beslutsskuld före årsboken försvagar landningen.

### Critical utan whyNow — lugnt i det jag såg, men mekaniskt för brett

**SÅG:** Inget observerat socialt eller ekonomiskt kort kändes uppenbart för litet enbart på grund av presentationen.  
**KAN INTE:** Den kritiska kanalen kan samtidigt inte aktiveras för de fyra default-kritiska typerna förrän registret fylls, så ett verkligt krisfall prövades aldrig.

### Postmatch-par/BatchStack — underkänd

**INTRÄFFADE INTE i UI och KAN INTE via avsedd produktionsväg:** fanLetter och opponentQuote blir ambienta före batchkontrollen. Räknaren kunde därför inte bedömas som spelare.

### Kassörens röst — godkänd

**SÅG:** Skutskärs Birgit och Målillas Bertil behöll samma namn mellan ankomst och portal. Första portalraden — “Lugnare första veckan …” — låg nära kassörens konkreta, försiktiga ton från tillträdet och kändes som samma person, inte som systemcopy.

## Tidigare auditfynd — regressionstatus

### Tydligt förbättrat eller löst

- Mobilens primära CTA låg inte längre under bottennavigationen.
- Skutskärs SVÅR-läge skapade nu verklig sportslig nedsida utan tankning.
- Åtta taktiska dimensioner är nedfällda bakom **VISA ALLA ÅTTA**; standardvyn med mentalitet, tempo och press är betydligt mer användbar.
- Rekommenderad formation är synlig och begriplig.
- Sommaren har nu både återhämtning, minne och upptakt.
- Ekonomin spelar roll: kassan gick 270 → 159 tkr och flera beslut på 8–25 tkr kändes reella.
- Årsboken är betydligt starkare: säsongens match, berättelse, tidslinje, spelare, siffror, kurva, ort och ekonomi bildar en riktig säsongsartefakt.
- Granska efter cup/slutspel var renare utan irrelevanta ligasektioner.

### Delvis förbättrat

- Utmattningen har nu positionsvikt och leder till skador/resultatfall, men auto-val och 0 %-semantik behöver kalibreras.
- BoardPatience syns nu som zon, men reagerar inte på förlustsviten och förklarar inte kollisionen med missade uppdrag.
- Besluten har fler faktiska kostnader, men sponsor-, press- och flera ortsval har fortfarande dominanta svar.
- DecisionCard ger visuell sammanhållning, men flera likvärdiga kort i samma portal jämnar fortfarande ut rytmen.
- Burnout har synlig båge och sommaråterhämtning; jag såg “Audit Skutskär är trött”, men ingen spelbar återhämtningshandling eller prestationskonsekvens verifierades.

### Kvarstår tydligt

- Sanningslagret är fortfarande den största kvalitetsrisken: pressvar upphäver världens state och domarcitat motsäger resultatet.
- Repetitionsminnet är för svagt i press och mecenatpool.
- Hård reload/deeplink tappar aktuell undersida, även om sparningen överlever.
- Match-/säsongsövergångar kan visa flera tidsnivåer samtidigt.

### Inte retestat eller inte utlöst

- Naturligt avsked och post-avskedsflöde.
- Renomméfall; säsongen räknades som överträffad, så nedåteffekten skulle inte aktiveras.
- Licenskris och verkligt `criticalEconomy`-beslut.
- Delningsbildens rendering och mottagarflöde; årsbokens delningsknapp fanns, men delning ingick inte i denna audit.
- Långtidsproblem efter säsong 2, ligans anpassning och anläggningsträdets slutläge.

## Det som fungerade särskilt bra

- **Den sportsliga bågen uppstod utan manus.** Stark start, mittenhopp, skador, fem raka förluster, sista slutspelsplatsen och en ensam kvartsfinalseger gav en trovärdig Skutskär-säsong.
- **Årsboken bär minne.** “Första halvan 12 p / andra halvan 6 p”, säsongens match, derbyminne och ekonomiresan gjorde året möjligt att återberätta.
- **Sommarens temperaturkurva fungerar.** Den har en början, ett beslutslager och en framåtrörelse.
- **Multi-slot känns som en riktig produktfunktion.** Avbrutet tillträde förlorades inte.
- **Kassörens röst håller ihop ytorna.** Det är en liten men viktig karaktärsvinst.
- **Taktiktavlan är mer disciplinerad.** Progressiv disclosure löser mycket av den tidigare kognitiva överlasten.
- **Matchtypsmatrisen i Granska gör cup och slutspel renare.** Tomheten känns främst avsiktlig, inte bortglömd.
- **Ekonomin är inte längre helt dekorativ för en svår klubb.** 25 tkr kunde vara ett faktiskt nej.
- **Mobilflödet höll hela säsongen.** Ingen central navigation eller match-CTA blockerades vid 390 px bredd.

## Rekommenderad fixordning

1. **Sanningslager och minne:** press-state-gates, presscooldown, domarutfall och namngivna skadebeslut.
2. **Styrelsens enhetliga dommodell:** samma faktorer i portal, delmål, boardPatience och årsbok.
3. **Playoff-elimineringens tidsbarriär:** Granska före auto-loop, korrekt ekonomi och next-action.
4. **Utmattningens spelbarhet:** auto-val, 0 %-grind och tydlig konsekvenscopy.
5. **BatchStack från riktig generator till riktig yta.**
6. **Beslutsminne:** sponsordedupe, mecenattyp-cooldown och säsongsslutsbarriär.
7. **Critical per instans/undertyp**, inte globalt per bred eventtyp.

## Föreslagen regressionstest-suite

### P0 — spel- och sanningskontrakt

1. **Skutskär normal-play seed sweep:** kör minst 100 deterministiska säsonger med kompetent policy. Rapportera placering, boardPatience, objectives, sparkning, ekonomi, fitness och skador. Testet ska visa en icke-noll men rimlig naturlig avskedsfrekvens.
2. **Board verdict consistency:** för varje placering/förväntan/objective-kombination ska portalzon, årsboksdom och avskedsrisk ge en gemensamt förklarbar utsaga.
3. **Press memory:** samma storylinefråga får inte visas mer än två gånger per säsong eller i två raka matcher.
4. **Press state truth table:** `went_fulltime_pro` får aldrig erbjuda dagjobbsvar; `rescued_from_unemployment`, kontrakt, transfer och pension får motsvarande state-gates.
5. **Referee outcome table:** inget citat får hävda att marginalerna föll åt klubben efter förlust.
6. **Play-through identity:** varje sådant inlinekort måste innehålla rätt spelares namn, skada och dagar kvar.

### P0 — sekvens och ekonomi

7. **Playoff elimination barrier:** sista manager-matchen ska visas i Granska innan andra slutspelsrundor simuleras.
8. **RoundSummary finance invariant:** summan i **Sedan sist** ska motsvara synliga financeLog-poster och namngiven tidsperiod.
9. **Next-action state machine:** efter eliminering får ingen text säga att en ny match/omgång väntar.
10. **Season-end queue:** inga daterade sponsorerbjudanden eller andra regular-season-beslut får ligga mellan slutord och årsbok.

### P1 — trupp och utmattning

11. **Auto-fill exhaustion:** en spelare på 0 % ska förlora mot en rimlig ersättare om inte positionsnöd uttryckligen förklaras.
12. **0 %-matchkonsekvens:** simulera identiska elvor vid 100/50/20/0 % och kontrollera monotont fallande förväntad prestation.
13. **Vila-återhämtning:** en tunn trupp med vald Vila ska ha en verifierad men inte gratis möjlighet att bryta spiralen.
14. **Position fatigue:** mittfältare ska slitas mer än halvor utan att lagets totala medelförlust ändras.

### P1 — eventvikt och beslutskö

15. **Produktions-BatchStack integration:** `generatePostMatchEvents()` → `attentionRouter` → `PortalEventSlot`; ett riktigt fanLetter/opponentQuote-par ska nå avsedd presentation och korrekt räknare.
16. **Nåbar pivotal:** minst en verklig, irreversibel produktionsinstans måste ge `getEffectivePriority() === critical` och overlay.
17. **Sponsor dedupe:** högst ett öppet vanligt sponsorerbjudande, även genom tio auto-loopar.
18. **Mecenat variation:** samma sociala typ högst en gång per säsong; total frekvens inom beslutad budget.

### P1 — multi-slot, persistence och mobil

19. **Avbruten onboarding:** skapa A, avbryt varje tillträdessteg, skapa B, byt tillbaka till A och verifiera exakt steg/state.
20. **Deep-link rehydration:** reload på `/game/history`, `/game/match` och `/game/club` ska återställa samma route efter save-load.
21. **390 px säsongsresa:** automatiskt test för CTA/nav-överlapp på onboarding, portal, match, Granska, årsbok och sommar.

### Kvalitativa grindar

22. **Två mänskliga testare per release** spelar samma svåra klubb med olika filosofier och markerar när de börjar välja mekaniskt i stället för rollspela.
23. **Säsongsrecall efter 24 timmar:** spelaren ska kunna återberätta tre händelser, ett dyrt beslut och varför styrelsen är nöjd/orolig.
24. **Copy-truth review:** varje ny storylinereplik måste länkas till exakt state den förutsätter och ett test som visar att staten finns.

## Verifiering

- Ren klon på exakt `520096718506e5f4895b7142eaae021164729a10` byggde färdigt med TypeScript, Vite, PWA och design-guard.
- Produktions-UI visade `52009671`.
- Initialt öppnades en cachelagd PWA på `a0df4c1`; en ny nätverksladdning och den rena lokala byggnaden verifierade aktuell revision.
- 150 riktade assertions för board verdict, boardPatience-zoner, fatigue, lineup-nudge, eventprioritet och BatchStack passerade. Testprocessen fick därefter ett miljöfel när Vitest försökte skriva cache i den read-only symlinkade `node_modules`-katalogen; inga assertioner föll.
- Det lokala användarrepot ändrades inte. Auditen kördes mot en separat ren klon.

## Slutrekommendation

Bygg inte mer bredd först. Den senaste utvecklingen har löst flera av de största strukturella problemen: svår klubb är faktiskt svår, sommaren finns, multi-slot fungerar, taktiken är mer greppbar och årsboken har blivit bra.

Den återstående hävstången är **förtroende**. Spelaren måste kunna tro på att text, state, ekonomi och styrelse beskriver samma värld. Om ni gör styrelsens dom förklarbar, pressen minnesbärande och utmattningen styrbar får Skutskär-säsongen den egenskap som tidigare saknades: misslyckandet känns inte bara möjligt, utan rättvist, personligt och värt att försöka reparera nästa år.
