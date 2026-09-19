# Åtgärder efter beta- och matchtextauditerna

Datum: 2026-09-19. Codex. Lokalt arbetsläge med bas-HEAD `35e00c44`; parallella ändringar finns. Inte ett godkännande av en publicerad release.

## Beta

- **Push och tillträde separerade.** Den nya klienten använder `DELETE /api/notifications/push/:installationId`. Båda lagringsadaptrarna raderar pushprenumeration, snapshot, kandidater, leveranser och notishistorik men behåller installationsidentitet, betaåtkomst och separat användningsstatistik. Gränssnittets förklaring är uppdaterad. Den äldre endpointens uttryckliga helradering är bevarad för äldre klienters raderingskontrakt.
- **Använd kod förblir använd även efter helradering/gallring.** `redeemedAt` hindrar återinlösen när ägarkopplingen blivit null. Minnesadaptern och PostgreSQL beter sig nu lika. Fel token kan inte tysta någon annan installation.
- **Långa spelpass godtas.** Heltalslängder 0–86 400 sekunder accepteras; negativa värden, bråktal och längre pass avvisas. Det oavsiktliga 1 000-sekunderstaket är borta.
- **Admin- och utvecklingsvyer startar inte spelstatistik.** Övergång från spel till dessa ytor avslutar spelpasset. Reacts StrictMode-repetition av effekter ska inte skapa ett extra spelpass.
- **Låsning invalidierar pågående adminsvar.** Sena svar från statistik, inbjudan, återkallande och kopiering får inte återöppna vyn eller skriva tillbaka känsliga uppgifter. Detta avbryter inte en mutation som servern redan har tagit emot.
- **Synkront dubbelklicksskydd för inbjudningar**, kompletterat med upptagen knapp.

### Förtydligande av auditens populationskontroll

Adminbesöket var ett verkligt fel vid klientkällan och är åtgärdat. API:t kan däremot inte avgöra om ett godkänt generiskt `session_start` kom från admin eller spel. Att filtrera bort alla installationer utan inbjudan skulle också kasta bort legitimt spelande före betaaktiveringen. Diagnostikskriptets tidigare sådana förväntan är därför korrigerad; klientfelet har ett separat verkligt webbläsarprov. Statistikvyn anger nu uttryckligen att spelmåtten omfattar alla som tillåter statistik och att inbjudna redovisas separat.

## Matchkommentarer och matchmotor

- Händelsetext skyddas från halvtids-/domarpresentation samt situations- och publiktext. Räddningen behåller sin händelserad; mål/utvisning/räddning i schemalagda textsteg får en riktig händelsetext, inte etiketten MÅL ovanpå en pausmening.
- Valbara texter styrs av målsumma, cupomgång, kalenderdata och hallstatus. En vunnen kvartsfinal lovar inte en kvartsfinal till. En kvartsfinal kallas inte final. Oktobertext väljs inte utan oktoberdata. Även en ytterligare oktoberrad i cupens atmosfärpool fångades av regressionstestet.
- Neutrala sekvenser och missade hörnor får inte slumpa fram skott-/räddningspåståenden som saknar motsvarande statistik. Inga skott har lagts till för att rättfärdiga texten.
- Repetitionsminnet använder stabila innehållsnycklar och faktisk exkludering, inklusive för nyfiltrerade arrayer. Upp till sex senaste val undviks när poolens storlek medger det. Minnet följer med över halvtid och de båda regenereringsvägarna i livevyn. Äldre matchtillstånd utan minnet fungerar fortfarande. Även traittexter använder rotationsminnet.

### Text och spel har nu separata slumpströmmar

Uppföljningsmätningen visade att den tidigare delade strömmen var ett verkligt motorfel: ett referatval kunde flytta alla efterföljande spelutfall. Dessutom valdes domarstil olika i snabb- och liveläge, och tre presentationsgrenar hämtade spelarnamn genom den spelmekaniska målskyttsväljaren.

Texturvalet har nu en egen deterministisk ström. Domarstilens fallback är lägesoberoende och separat från spelströmmen. Kommentarsgrenarna för spelardueller, offside och frisparksläge använder textströmmen även när de väljer ett namn. Det är inte längre möjligt för fler eller färre textrader att ändra matchresultatet.

Formell jämförelse: **3 168 av 3 168** identiskt seedade matcher gav samma slutresultat i snabb- och liveläge; radvis mismatch **0**.

### Resultatfördelning och låst referens

Referensen är samma **1 124 Elitserien-herrgrundseriematcher** som i Fas 2–3. Två grindar ligger nu bredvid målsnittet:

- minst 15 mål: högst ±1,5 procentenheter från referensens 5,43 %,
- högst 4 mål: högst ±1,5 procentenheter från referensens 5,87 %.

Jämförelsen mellan `408f72f1` (före K) och `355c0723` (efter K, före denna fix), med exakt samma frön, friar K:

- 15+ i snabbläge: 10,07 % → 9,85 %,
- 15+ i liveläge: 7,70 % → 7,73 %.

Svansen fanns alltså redan. Rotorsaken var en för bred profil-/matchvariation i kombination med den delade lägesslumpen, inte konditionshöjningen. I grundserien är matchprofilerna smalare men finns kvar, och en liten lagneutral tempokorrigering dämpar matcher som löper långt över referenstakten samt hjälper ovanligt målfattiga matcher. Den ändrar inte vilket lag som gynnas och läser inte ledningens riktning. Cup och slutspel behåller sin separat kalibrerade profilfördelning och omfattas inte av tempokorrigeringen.

Slutmätning, samma 24 världar och 3 168 seriematcher per läge:

- målsnitt **9,20** mot referens **9,12**,
- 15+ mål **6,09 %** mot **5,43 %**,
- högst 4 mål **6,06 %** mot **5,87 %**,
- varians **10,59** mot **10,52**,
- snabb/live: exakt identiska resultat.

Alla fyra grindar passerar. `scripts/audit-score-distribution.ts --assert-gates` fäller körningen vid avvikelse, och ett permanent Vitest-prov kör 2 112 produktmatcher i båda lägena. Motorversionen är därför bumpad från 1.2.0 till 2.0.0.

### Den påstått saknade matchposten

Fyndet reproducerades exakt: seed 8, säsong 1, serieomgång 3 har fem färdigspelade matcher. Ingen färdigspelad match tappas dock mellan lager. Den sjätte fixturen fick `FixtureStatus.Postponed` eftersom isen ställde in matchen; spelets uttryckliga säsongsregel räknar både `Completed` och `Postponed` som avgjorda för serieschemat, medan karriärstatistiken med rätta bara loggar faktiskt spelade matcher.

Detta är alltså **inte ett loggfel**. 4 751 färdigspelade + 1 inställd = de förväntade 4 752 serie-fixturerna i provet. Ingen falsk resultatpost ska läggas till. Stressloggen redovisar i stället inställda fixturer separat i `postponedMatches`, så hela schemat kan stämmas av utan att resultatfördelningen förorenas. Den äldre rapportens datakvalitetsreservation är därmed stängd.

## Verifiering

- Helkörning: **603 testfiler, 5 369 tester gröna**. Första helkörningen hade ett fall i bevarandelistan medan det parallella textarkiveringsarbetet pågick; både isolerad omkörning och den efterföljande hela sviten passerade. Inga ändringar gjordes här i bevarandetestet för att få det grönt.
- **Produktionsbygge, TypeScript och samtliga bygganknutna design-/innehållskontroller passerade.** Befintliga baslinjeanmärkningar kvarstår; detta är inte ett påstående om noll designskuld.
- Efter sista serverförtydligandet (även personliga pushinställningar återställs, separat statistikval behålls) kördes de berörda lagrings-/livscykeltesterna igen: **39/39 gröna**, samt nytt API-prov **34/34**. Helkörningen är alltså inte ett bevis mot en fryst releasehash.

### Beta

- 34/34 lokala API-kontroller godkända (PostgreSQL-adapter med pg-mem, inte drift-PostgreSQL).
- 11/11 webbläsarkontroller godkända; inga sidfel. Inlösen, omladdning, återkallande, nätverksfel/återförsök, admin utan speltelemetri, dubbelklick och låsning under fördröjt svar.
- Nya permanenta tester för båda lagringsadaptrarnas push-/inbjudningslivscykel, sessionsgränser och bevarad klientidentitet vid tystning.

### Matchtext

Samma 2 400 matcher före och efter: 12 världar × 5 kontexter × 40 frön; 147 866 textrader, 21 885 mål.

- Mål med halvtidstext: **358 → 0**.
- Utvisning med halvtidstext: **156 → 0**.
- Uppmätta räddningar med fel situations-/paus-/speakertext: **406 → 0**.
- Falskt första derbymål: **431 → 0**.
- Kvartsfinal kallad cupfinal: **143 → 0**.
- Vunnen kvartsfinal lovar kvartsfinal: **35 → 0**.
- Kvartsfinalinledning med fel oktoberpåstående: **40 → 0**.
- ”Första målet” efter att mål redan gjorts: **29 → 0**.
- Hörntext om skott utan skottökning: **6 879 → 0**.
- Den konkreta neutrala friläges-/räddningsraden utan motsvarande händelse: **1 348 → 0**.
- Identiska intilliggande kommentarer: **19 → 0**.
- Återkomster inom sex rader: **556 → 145**, cirka 74 procent färre. Inte ett löfte om noll återanvändning i en hel match eller mellan matcher.

Den breda snöregexen ger fortfarande 108 kandidater. De sparade exemplen är den legitima hallraden ”Utanför faller snön. Den får falla ifred numera.” De ska inte bokföras som 108 nya väderfel.

Kontrollsumman för samtliga stegs minut, händelser, resultat och skottstatistik var identisk under den rena textfixfasen:

`e172b98e030449f491507de9edd151b45fea48e1e4d02162a028c548e1f1ea26`

Den efterföljande, uttryckligt beställda fördelningskalibreringen ändrar däremot matchresultat och har därför en ny motorversion samt egna grindar ovan. Den gamla kontrollsumman ska inte användas som förväntat värde efter motorversion 2.0.0.

Nya permanenta regressioner omfattar rotation, JSON-överföring av minne, oförändrad slumpförbrukning och 120 matcher med sanningsvillkor. Testet använder också domarpresentationen, som kan krocka med en händelse tidigt i matchen.

Underlag: `audit-2026-09-19/match-depth-before-fixes.json`, `match-depth-after-fixes.json`, `score-distribution-408f72f1.json`, `score-distribution-355c0723.json`, `score-distribution-after-fixes.json`, `beta-contracts-after-fixes.json`, `audit-beta-browser.json` och `audit-beta-admin.png`.

## Kvar / inte gjort

- Ingen betaaktivering, deployment, commit eller push i detta pass.
- Ingen generell utökning eller stilomskrivning av svenska textpooler. Rotation/sanningsvillkor är rättade först; riktad textputs och eventuellt fler sanningsenliga hörnvarianter kan nu bedömas mot det nya underlaget.
- Mätningen gäller de identifierade klasserna och provkontexterna, inte en garanti att all matchprosa i spelet nu är sann.
