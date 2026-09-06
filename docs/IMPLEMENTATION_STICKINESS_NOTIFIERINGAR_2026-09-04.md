# Implementation — stickiness och notifieringar

**Datum:** 2026-09-04  
**Status:** Etapp 1A + Berättaren steg 1–9 + agenda→push-adapter lokalt verifierade
**Beslutad produktstrategi:** `docs/incoming/RAPPORT_STICKINESS_NOTIFIERINGAR_PWA_2026-09-04.md`

## Genomfört

### PWA-bas

- Behöll repots befintliga `vite-plugin-pwa`/Workbox-upplägg och `registerType: prompt`.
- Kompletterade manifesten med stabilt `id`, `scope`, riktiga ikoner, beskrivning, färger och portrait-orientering.
- Bytte Apple touch icon från SVG till befintlig PNG.
- Laddar en separat notifierings-service-worker i den genererade Workbox-service-workern.
- Undantar `/api/*` från SPA-navigationens offline-fallback.

### Attention Engine

- Lade en kanaloberoende, ren domänmodell i `src/domain/attention/`.
- Modellerade `OpenLoop`, `NotificationCandidate`, `AttentionEvaluation`, state-version, källreferenser, voice, importance, dedupe, score och livscykeltider.
- Den rena state-loopen för oavslutad matchförberedelse är den enda självständigt aktiva kandidatfamiljen.
- De tidigare prototyperna som härledde kalenderankare, säsongsläge och narrativ återkomst direkt ur `SaveGame` är borttagna. De får återkomma först som adaptrar från Berättarens `redaktoren()`/`ledgerTold`-agenda.
- Kandidater genereras från aktuellt `SaveGame` och har exakta, allowlistade deep links.
- En löst laguppställning tar bort matchförberedelse-loopen vid nästa snapshot.

### Berättarens gemensamma grund

- Lade till `currentChronology(game)` som enda samlade källa för säsong, global matchdag, spelad ligaomgång och säsongsfas. Cupveckor blandar därmed inte ihop matchdag och ligaomgång.
- Lade till save-fältet `ledgerTold` och en ren, idempotent skrivväg för ytorna Portal, Efterklang, press, årsbok, Granska, kafferum och push. Save-schemat är nu 0.3.10; legacy-saves får både ett tomt told-register och säkert härledda `managerId`-stämplar.
- Lade till `redaktoren(game, chronology)` som ren agenda över kanoniska liggarposter. Den räknar `significance × freshness × relation × untoldness`, returnerar ytspecifika vikter och skapar ingen copy.
- Relationsvikterna följer Opus dom: personer och relationer/pengar ×1,4, beslut/epok och anläggning ×1,0, match ×0,8.
- Färskheten har två explicita köer: senaste fyra matchdagarna (1,0→0,5) och k2:s gemensamma årsdagsregel (1,0); övrigt är bakgrund (0,2).
- Samma-yta är 0,3, annan redan använd yta 0,7 och en högre eskalering med samma semanticKey-stam blir 1,0 igen.
- Krönikan och Moment-läsaren går nu genom samma strikta `clubId`-läsare. Subject-heuristiken är retirerad enligt `DOM_LIGGARE_CLUBID`; migreringen använder säsongssummering eller managerens klubbperioder och märker sista-utvägens fallback som `clubIdInferred`.
- Grundpasset aktiverade inga ytkonsumenter; Portal-kopplingen nedan byggdes och verifierades först efter att steg 1–2 var gröna, enligt specens ordning.

### Portalens första agendakonsument

- Lade till `memory_card` i Portalens secondary-tier med den låsta vikten 55.
- Kortet väljer högst ett ämne: otalt `SEDAN SIST` med redaktionell vikt minst 60 eller `FÖR ETT ÅR SEDAN` med vikt minst 70.
- Texten skapas inte på nytt utan kommer ordagrant ur k1/Krönikans befintliga liggar-dispatch.
- Kortet visas aldrig när ett aktivt beslut väntar och faller automatiskt bort ur Portalens befintliga endgame-kurering.
- När kortet faktiskt finns bland de renderade secondary-korten skrivs ett idempotent `surface: portal`-kvitto. Samma post hålls stabil resten av matchdagen och blir nedviktad först nästa matchdag.
- Push är fortsatt inaktiv som narrativ konsument; adaptern nedan kan se Portalens kvitto men släpper ingen kandidat utan godkänd copy.

### Push som Berättaryta

- Lade till en ren agenda→push-adapter. Den läser endast `redaktoren(game, currentChronology(game))`, använder ytans egen rankning och väljer högst en post; den skapar ingen parallell berättelse från rå save-state.
- Färsk post kräver pushvikt minst 60, årsdag minst 70 och bakgrundsposter släpps inte till kanalen. Årsdag mappas till kalenderankare, beslut/epok till säsongsläge och övriga kvalificerade poster till narrativ återkomst.
- Kandidaten bär en exakt liggarreferens och den kronologi där ämnet valdes. Samma referens följer leveransen genom backend utan att hela sparfilen skickas.
- Narrativ aktivering är strukturellt spärrad: `evaluateAttention` kräver ett injicerat copy-resolverresultat. Produktionsklienten tillhandahåller inget resolver förrän Opus-raden `stickiness-copy-roster` finns, så bara matchförberedelse kan skickas i nuläget.
- När pushleverantören har accepterat en narrativ leverans skapar backend ett internt leveranskvitto. Klienten hämtar kvittot nästa gång rätt save öppnas, skriver idempotent `surface: push` i samma `ledgerTold` och kvitterar sedan synken. Det är ingen synlig pushhistorik och skapar inget nytt narrativt register.

### Berättaren steg 5 — callbacks

- `decision` och `manager_burnout` stämplas nu med save-spelets `managerId`. Personliga spelarmål får samma ägarskap när säsongsövergången passeras; legacy-summeringar backfylls idempotent där belägget är entydigt.
- Årets spelare fryses som en global `player_milestone` i liggaren innan nästa säsong startar. Det gör sambandet mellan ett tidigare managerägt mål och en senare utmärkelse i en annan klubb möjligt utan att läsa flyktigt UI-state.
- Granska väljer högst en callback i prioriteringen ex-spelare mot klubben, första återkomst till en tidigare klubb, därefter utvecklad spelare som blivit årets spelare. Valet går genom klubbavgränsad agenda/liggare och skrivs som `surface: review` när en liggarpost finns.
- Ex-spelarens mål kräver att försäljningen skedde samma sommar; annars används den låsta matchens-spelare-raden när den är sann, eller ingen rad alls. Positionen översätts till den låsta svenska formen.
- Första återkomsten använder en gemensam domänfunktion i både Portalens förmatch och Granska. Den hävdar bara ”första gången” när nuvarande klubbperiod och tillgängliga fixtures faktiskt kan bevisa det, och visas inte igen efter en tidigare spelad match mot klubben.
- Årsutmärkelsen blir synlig vid nästa Granska, eftersom rollover saknar en egen Granska-yta. Kvittot gör att den därefter inte återkommer.

### Berättaren steg 6 — Efterklang på agendan

- `pickEfterklang` tar nu kanoniska årsdagar, kritiska ekonomibeslut, rivalförsäljningar och journalistens feud/redemption ur `redaktoren(..., efterklang)` i stället för att ranka dessa historiska fakta direkt från separata fickor.
- Varje agendatråd behåller sin exakta liggarpost genom presentationen och kvitteras som `surface: efterklang` först när Efterklang-kortet faktiskt ingår i Portalens renderade layout.
- En kvitterad tråd hålls stabil resten av samma matchdag, så React-omrenderingen inte byter ämne under spelaren. Nästa matchdag verkar redaktörens vanliga 0,3-otaldhet och ett färskare ämne kan ta plats.
- Samma liggarpost kan inte visas både som årsdag och ämnestråd i samma kort. `clubId`-läsningen hindrar samtidigt en annan klubbs historia från att läcka in.
- Klackens känslotillstånd, journalistrelation/minnescache, brev och nemesisläge ligger kvar som live-/presentationsstate enligt gränsdomen. `activeAnniversaries`, ekonomisk kris och rivalförsäljningsfickan används bara som retire-last-fallback när en säker liggarpost saknas. Styrelsemålsfickan behålls tills en kanonisk motsvarighet finns; ingen ny liggartyp uppfanns i detta steg.
- Befintliga premiss- och eko-pooler återanvänds oförändrade. Ingen ny spelartext eller ny minneslagring har lagts till.

### Berättaren steg 7 — pressens liggarfråga

- Presskonferensen väljer nu högst en post ur `redaktoren(..., press)`: samma säsong, högst tre matchdagar gammal, redaktionell vikt minst 70 och ännu inte frågad på pressytan.
- De sju låsta Opus-stammarna är kopplade till domarfejd, patron-/mecenatuttåg, patronens ankomst, epokskifte, lång skada, utmärkt såld spelare och skandal. Namn löses ur samma strukturerade subjects som övriga berättarytor; skandalämnet återanvänder skandalsystemets befintliga rubrik.
- Påståendet att en såld spelare ”gör mål varje vecka” kräver mål i båda hans två senaste matcher för den nya klubben. Om den grinden eller ett nödvändigt namn saknas provar redaktören nästa säkra agendapost.
- Liggarfrågan ersätter bara frågetexten. Pressens redan kontextgrindade svar, moralpåverkan, journalistminne och relationseffekt är oförändrade.
- Den exakta postnyckeln följer presshändelsen. Rundprocessorn skriver ett idempotent `surface: press`-kvitto först efter att presskortet överlevt den gemensamma surfacing-budgeten.

### Berättaren steg 8 — kafferummets agendaeko

- Kafferummets befintliga scenurval och alla dess live-/reaktionskällor är orörda. Efter urvalet dekoreras scenen med högst en post ur `redaktoren(..., coffee_room)` med redaktionell vikt minst 60.
- Kandidaten måste ha ett namn som den gemensamma subject-resolvern kan belägga, tillhöra den managerade klubben och vara otald på kafferumsytan. Om topposten inte går att uttrycka prövas nästa säker kandidat.
- Den enda nya spelarraden är den låsta Opus-texten ”Det pratas om {Namn}.”. Den renderas liten, kursiv och sist i sceninnehållet, efter ordinarie repliker och eventuell fråga.
- Exakt liggarpost följer scenmodellen. Det riktiga scenavslutet skriver ett idempotent `surface: coffee_room`-kvitto; en scen som aldrig blev synlig räknas därmed inte som berättad.
- Ingen ny minneslagring, copybank eller liggartyp har lagts till.

### Berättaren steg 9 — återfall ersätter intro

- `semanticKeyStem` är flyttad till en gemensam domäntjänst. Storyline-liggaren kan nu räkna en viss persons tidigare resolutioner före aktuell kronologi, över säsongsgränser och fortsatt strikt inom managerad klubb.
- `hungrig_breakthrough`, `joker_redemption`, `veteran_farewell`, `lokal_hero` och `contract_drama` följer domen normal första gång, ordagrant låst återfallsvariant andra gång och tyst skip från tredje gången. Joker kräver en tidigare verklig vindikation; veteranens andra förlängning är ett år; kontraktsdrama kräver en tidigare faktiskt applicerad `extend_now`-markör.
- Derbyresolutioner bär nu strukturerad motpart och rått utfall i samma kanoniska liggarpost. Nästa derby mot samma motståndare samma säsong kan därför uttrycka revansch, dubbel seger eller dubbel förlust utan att tolka presentationstext. Derbybågen hoppas aldrig.
- Skolkonfliktens befintliga en-gång-per-spelare-och-säsong-grind är kvar. En ny säsong får händelsen igen, men samma elev får den låsta prefixmeningen ”Samma samtal som förra året.”.
- Ingen Apple-native-kod eller ny parallell minnesbank har införts.

### Klient och browserytor

- Lade till ett opt-in-API/hook för Web Push. Ingen permission-prompt visas automatiskt.
- iOS-flödet kan skilja ut kravet att först lägga PWA:n på hemskärmen.
- Installationer får ett lokalt slumpat id och en separat token; hela sparfilen skickas aldrig.
- Efter uttrycklig opt-in synkas en minimal attention-snapshot vid nya save-versioner.
- App Badging API speglar lokalt antal olästa inboxposter, med progressiv fallback.
- Service workern visar push, sätter badge och öppnar/fokuserar exakt tillåten spelroute.
- Deep links märks med delivery/candidate-id för öppningsattribution och rensas sedan ur URL:en.
- En värdebaserad pre-prompt är kopplad till Portal efter den första färdigspelade veckan: spelaren har besökt Granska och nästa laguppställning är fortfarande öppen. Den visas bara när backend/VAPID är konfigurerat.
- iOS-varianten förklarar Lägg till på hemskärmen innan browserpermission kan begäras.
- Den separata lokala pushhistoriken och `FRÅN KLUBBEN`-listan är borttagna enligt domen. Narrativ historik ska senare vara Portalens story-slot/`memory_card` över samma liggarposter.
- Badge speglar den kanoniska inkorgens olästa poster; service workern kan fortsatt sätta ett progressivt badge vid en ny push tills appens sanna state tar över.

### Backendgrund

- Lade till Express-rutter för installation, subscription, snapshot, leveranskvitton, telemetri, VAPID-public-key och skyddad scheduler-körning.
- Lade till verklig Web Push-leverans via `web-push` och VAPID.
- Revaliderar kandidatens state-version mot senaste snapshot före utskick.
- Bevarar första `availableAfter` för samma open loop vid nya saves, så synk inte skjuter fram kandidaten för evigt.
- Kandidater försvinner när de inte längre finns i senaste snapshot.
- Implementerade högst en leverans per dygn, högst tre per rullande vecka, quiet hours 21.30–08.00 lokal tid och deterministisk 10-procentig holdout.
- Responsmodellen härleder utfallet ur verkliga leveranser: explicit öppning/meningsfull handling, implicit återbesök inom sex timmar, väntande första dygnet eller ignorerad efter ett dygn.
- Kategori-affinitet justerar kandidatordningen deterministiskt (+8 vid respons, −12 vid ignorering, med fasta tak). Det är en kanalvikt ovanpå Berättarens agenda — den ändrar inte liggarens eller redaktörens sanning.
- Efter två raka ignorerade leveranser gäller tre dygns kraftig backoff. En kandidat markerad `major` får bryta denna vanliga cooldown och dygnstaket, men aldrig quiet hours eller det hårda veckotaket.
- Installationstoken verifieras med konstant-tidsjämförelse. Cron-endpointen kräver `ATTENTION_CRON_SECRET`.
- Utgångna push-subscriptions (404/410) kopplas bort.

### Instrumentering

Eventkontrakt finns för:

- permission prompted/granted/denied,
- subscription created/removed,
- snapshot synced,
- candidate selected,
- delivery attempted/succeeded/failed,
- push received,
- notification clicked/opened,
- app opened,
- meaningful action.

Leverans-event från service workern autentiseras med en unik delivery-token. Browser-event med installationstoken får bara attribueras till en leverans som tillhör samma installation. De fyra beslutade meningsfulla handlingarna är kopplade: laguppställning bekräftad, match spelad, spelarbeslut löst och säsongsövergång passerad. `app_opened` räknas uttryckligen inte som meningsfull handling, men ett självmant återbesök inom sex timmar används som svag, implicit positiv respons.

Avregistrering raderar hela installationens serverstate i referenslagringen — subscription, snapshot, kandidater och leveransnycklar — samt lokal installationsidentitet och attribution. Samma kontrakt ska gälla för en framtida persistent adapter.

## Miljövariabler för en körbar backend

```text
VAPID_SUBJECT=mailto:driftansvarig@example.com
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
ATTENTION_CRON_SECRET=...
ALLOWED_ORIGINS=https://bandy-manager.example
```

VAPID-nyckelparet ska genereras en gång och förvaras i hostingmiljöns secrets. Privatnyckeln får aldrig exponeras som `VITE_*` eller checkas in.

## Återstår innan skarp push

1. Välj driftarkitektur för API:t. Nuvarande Render-konfiguration och `vercel.json` publicerar en statisk app, medan de nya API-rutterna lever i `server.js`.
2. Ersätt `InMemoryAttentionStore` med hållbar lagring. Vercel/Render-instansminne får inte behandlas som databas.
3. Koppla en extern scheduler/cron till `POST /api/attention/run`.
4. Koppla det nu låsta `STICKINESS_COPY_REGISTER_2026-09-04.md` till produktionssnapshotten och kör textgrinden. Adaptern och det leveransbekräftade `surface: push`-kvittot finns; narrativ aktivering är avsiktligt av tills resolvern är inkopplad. Berättarens steg 1–9 är klara.
5. Bygg kategori-/quiet-hour-inställningar efter Designs mock. Den kontextuella pre-prompten och iOS-installationshjälpen finns nu, men förblir avsiktligt osynliga tills backend rapporterar giltig VAPID-konfiguration.
6. Lägg till integrationsprov mot en riktig push-provider i en stagingmiljö med HTTPS och verklig service worker.
7. Lås dataskyddstext och gallring innan lagringen görs beständig. Raderingskontraktet finns nu, men policy och spelartext väntar på Jacob/Opus.

## Blockerare och avgränsningar

- **Produktionshosting:** appen deployas statiskt i de versionsstyrda hostingfilerna. Backendkoden kan köras lokalt via `server.js`, men är inte skarpt driftsatt av den nuvarande konfigurationen.
- **Hållbar serverstate:** repot har ingen befintlig produktionsdatabas eller användaridentitet. In-memory-adaptern är endast en körbar kontraktsreferens och tappar data vid omstart.
- **Revalideringens auktoritet:** spelets save är local-first. Servern kan endast revalidera mot senaste minimerade snapshot som klienten hunnit skicka, inte läsa spelarens IndexedDB direkt.
- **Berättarkonsumenter:** Portal, Efterklang, årsbok, Granska, press, kafferum och pushens leveranskvittoväg delar nu agenda/told-registret enligt respektive ytas gräns. Endast den rena matchförberedelse-loopen kan fortfarande bli push; narrativ pushaktivering är spärrad tills `stickiness-copy-roster` finns och kopplats in.
- **Managerperspektivet:** klubbperspektivet är strikt `clubId`-avgränsat och callbacks har nu den separata `managerId`-stämpeln för beslut, burnout och personliga mål över klubbgränser. HistoryScreens fulla manager-vy är fortsatt en egen OPPET-rad, inte en callback-blockerare.
- **Permission-ögonblick:** Opus rekommenderade och koden använder första lästa Granska + nästa obekräftade lag. Jacobs slutliga kvittering och speltest återstår innan skarp aktivering.
- **Apple-native:** ingen WidgetKit-, ActivityKit-, Live Activity- eller Dynamic Island-kod har lagts till. Den delen finns enbart som framtida epic i rapporten.

## Verifiering

- `npm exec tsc -- --noEmit` — godkänd.
- Fokuserade Berättaren-/liggare-/save-tester — 87 av 87 godkända.
- Fokuserade Portal-/memory_card-/store-tester — 49 av 49 godkända.
- Fokuserade Attention Engine/store-tester — 15 av 15 godkända.
- Agenda→push/leveranskvitto/responsmodell tillsammans med Berättaren/Portal — 27 av 27 godkända i senaste passet.
- `npm run build` inklusive design-, content- och facility-grindar — godkänd.
- Full `npm test` efter det avslutande respons-/backoff-passet — 456 testfiler och 4 372 tester godkända. Den tidigare samtidiga illustrationskonflikten är därmed borta.
- Full `npm test` efter Berättarens efterföljande årsbokssteg — 456 testfiler och 4 382 tester godkända.
- Full `npm test` efter Berättarens callbacksteg — 458 testfiler och 4 400 tester godkända.
- Efterklangens agenda-/fallback-/kvittokontrakt tillsammans med närliggande Portal- och Berättartester — 58 tester godkända; TypeScript och full build/grindar godkända före helsviten.
- Full `npm test` efter Berättarens Efterklang-steg — 462 testfiler och 4 421 tester godkända. Den direkta `@cites`-deklarationen är också verifierad av påståendegrinden.
- Pressens agenda-, text-, sanningsgrind- och kvittokontrakt tillsammans med rundprocessorn och närliggande presstester — 86 tester godkända; TypeScript och full build/grindar godkända före helsviten.
- Full `npm test` efter Berättarens press-steg — 463 testfiler och 4 427 tester godkända.
- Kafferummets agenda-, gräns-, renderings- och kvittokontrakt tillsammans med rundprocessorn och befintliga fikarumstester — 73 tester godkända; TypeScript och full build/grindar godkända före helsviten.
- Full `npm test` efter Berättarens kafferumssteg — 465 testfiler och 4 432 tester godkända.
- Återfallspolicyns fokussvit — 34 tester godkända; TypeScript, produktionsbuildens samtliga grindar samt text- och dubblettvakterna godkända.
- Full `npm test` efter Berättarens återfallssteg — 466 testfiler och 4 442 tester godkända.
- Genererad Workbox-service-worker verifierad att den importerar `notification-sw.js` och undantar `/api/*` från navigation fallback.
- Lokal server-smoke: health 200, installationsregistrering 204 och VAPID-status 503 när nycklar saknas (förväntat säkert fel).

Builden rapporterar den redan befintliga varningen om en stor huvudchunk och gamla Browserslist-data. Testsviten skriver också sina sedan tidigare förekommande IndexedDB/jsdom-varningar; de påverkade inte resultatet. Efter pushadapter-passet är ny repoövergripande typecheck, full build med samtliga grindar, serverns syntaxkontroll och diffkontrollen gröna.

`npm audit --omit=dev` rapporterar 7 produktionsrelaterade advisories (1 låg, 2 måttliga, 4 höga). Inga träffar gäller den nytillagda `web-push`-kedjan. De direkta befintliga paketen som flaggas är `react-router-dom` (hög) och `express-rate-limit` (måttlig), båda med uppdatering tillgänglig. De uppgraderades inte i denna ändring eftersom router-/rate-limit-uppgraderingar bör verifieras som en separat, repoövergripande dependency-ändring.
