# Audit 1 — betans tillträde och datakedja

Datum: 2026-09-18. Granskare: Codex. **Dom: aktivera inte betagrinden ännu.**

Uppföljning: åtgärder och nya prov redovisas i [RAPPORT_AUDIT_ATGARDER_2026-09-19.md](RAPPORT_AUDIT_ATGARDER_2026-09-19.md). Fynden nedan är den ursprungliga före-mätningen, inte dagens kvarlista. Driftaktivering återstår fortfarande.

## Underlag och avgränsning

Fryst arbetskopia från HEAD `843613cecb0e93b44b017c512575bebb43cb90ef`, **inklusive dåvarande ocommittade betaändringar**. Detta är alltså inte ett godkännande av en viss releasecommit. Kontrollsummor: [input-sha256.txt](audit-2026-09-18/input-sha256.txt). Kopian ligger vid granskningen i `/private/tmp/bandy-audit-20260918.nKKTqJ`.

Ingen produktionsdata, verklig inbjudan eller hemlighet användes. Ingen produktkod ändrades av denna audit. Jag testade API, lagringsadapter, klientens händelsekedja och verkligt renderad React-vy i Chromium, 390 × 844. Webbläsarprovet använde den lokala minnesadaptern; databasprovet använde produktionsadaptern med pg-mem. pg-mem är inte verklig PostgreSQL och bevisar inte dess samtidighets-/driftegenskaper. Dubbel initialisering kunde inte provas i emulatorn på grund av dess SQL-planerarbegränsning; det räknas inte som produktfel.

## Resultat

- Befintliga tester: **53/53 gröna**, tio testfiler.
- Utökade kontraktskontroller: **25/33 uppfyllda**. Åtta avvikelser, inte åtta separata buggar.
- Webbläsarkontroller: **8/11 uppfyllda**, inga ohanterade sidfel.
- Sammanlagt **fem åtgärdsområden** nedan. Gröna äldre tester fångade inte korskopplingarna.

Råresultat: [API/databas](audit-2026-09-18/beta-contracts.json), [webbläsare](audit-2026-09-18/beta-browser.json).

## B1 — P1: stänga av notiser förstör betatillträdet och frigör använd kod

**Reproduktion:** lös in kod för installation A, stäng av klubbnotiser, kontrollera åtkomst. Databasadaptern svarar false. Lös därefter samma kod på B före dess inlösningsfrist: API svarar **204**, trots att koden redan är använd.

**Rotorsak:** `unsubscribeFromClubNotifications` i `attentionClient.ts` raderar installationen via subscription-DELETE och tar bort den lokala identiteten. `PostgresAttentionStore.removeSubscription` tar bort installationsraden. `beta_invites.redeemed_installation_id` har `ON DELETE SET NULL`; inlösningsvillkoret tolkar null som oanvänd, utan att kontrollera att `redeemed_at` redan är satt. Betans identitet har därmed samma livscykel som push.

Minnesadaptern skiljer sig dessutom: dess radering lämnar inbjudans gamla installationskoppling kvar. Därför kan ett rent minnesprov ge falsk trygghet.

**Åtgärdsprincip:** skilj betatillträde från push-prenumerationens livscykel. Avstängda notiser får varken avsluta en betainbjudan eller radera oberoende statistik. Behåll ett beständigt ”förbrukad”-tillstånd även när en installationskoppling raderas av integritetsskäl. Synka kontraktet mellan adaptrarna.

**Godkännandekrav:** inlösen → notiser av → omladdning behåller åtkomst; koden kan aldrig byta ägare; separat uttrycklig radering får en definierad effekt. Prova även verklig PostgreSQL.

## B2 — P1 för mätningen: sessioner över 16:40 kastas bort

**Reproduktion:** session_end med durationSeconds 1000 godkänns; 1001, 1800, 3600 och 86400 avvisas. En 30-minuterssession får HTTP **400**.

**Rotorsak:** `validAnalyticsEvent` använder `nonNegativeInt` som har max 1000, och kontrollerar därefter det avsedda dygnstaket. Dygnskontrollen kan aldrig släppa igenom ett värde över 1000. Klienten producerar däremot upp till 86400.

**Konsekvens:** långa spelsessioner saknas från avslut och median. Det är systematiskt urvalsbortfall, inte bara det redan dokumenterade osäkra pagehide-anropet.

**Åtgärd:** separat heltalsvalidator med korrekt sessionsintervall. Regressionstest för 1000, 1001, 1800, 86400, 86401, negativa tal och decimaler.

## B3 — P2: adminbesök räknas som spelare

**Reproduktion i ny webbläsarprofil:** öppna /admin/beta, utan inbjudan och utan att ens ange administratörsnyckel. Klienten skickar **install + session_start**. API-provet visar att en oinbjuden installation ökar active7.

**Rotorsak:** adminvägen släpps förbi grinden, men `AnalyticsBridge` monteras också där. Den generella sammanställningen tar samtliga installationers händelser; endast de separata inbjudningsmåtten filtreras på inbjudna.

**Åtgärd:** exkludera administrations-/utvecklingsbesök från speltelemetri och gör populationen tydlig: all spelanvändning respektive inbjuden betakohort. Denna audit antar inte att all historisk, öppen spelanvändning ska raderas eller döljas.

## B4 — P2: ”Lås vyn” kan upphävas av ett sent svar

**Reproduktion:** skapa en inbjudan med fördröjt svar, tryck LÅS VYN innan det kommer. När svarskedjan fortsätter återkommer statistikvyn utan ny inmatad nyckel.

**Rotorsak:** knappens lokala state töms men pågående createInvite/loadInvites/loadStats avbryts inte. De håller den gamla nyckeln i sin closure och skriver tillbaka summary/newCode efter låsningen.

**Åtgärd:** avbryt pågående läsningar och ignorera alla sena resultat från tidigare adminsession. En redan skickad servermutation kan inte ångras genom att avbryta fetch; hantera dess kvitto separat. Ingen serverautentisering har kringgåtts, men den lokala låsfunktionen håller inte sitt löfte.

## B5 — P2: dubbelklick skapar två inbjudningar

**Reproduktion:** fördröj create-svaret 500 ms och dubbelklicka SKAPA INBJUDAN. Två nya serverposter skapas; endast en kod blir kvar i vyn.

**Rotorsak:** knappen spärras först när newCode finns, inte medan anropet pågår.

**Åtgärd:** synkron in-flight-spärr och synligt upptaget tillstånd. Om nätverksåterförsök ska stödjas behövs även serveridempotens; det är ett separat krav från enkel dubbelklicksspärr.

## Det som höll

- Alla fyra adminoperationer avvisar anrop utan nyckel med 401.
- Kodformatet är 192 slumpbitar; listsvaret exponerar varken rå kod, hash eller installations-id.
- Ogiltig token avvisas; två samtidiga inlösningsanrop gav en vinnare i emulatorn.
- Ägarens omförsök är idempotent före utgång; en ny store-instans ser tillträdet.
- Utgången oanvänd kod avvisas; inlösningsfristens slut stänger inte redan tilldelat tillträde.
- Återkallelse fungerar i API och upptäcks vid omladdning.
- Statistik-opt-out respekteras server-side och tar inte i sig bort tillträdet.
- Direktlänk kräver kod; fel kod, nätfel och återförsök har fungerande återkoppling.
- Inga spelhändelser skickas från själva den låsta betagrinden.

## Kvarvarande avgränsningar, inte dolda godkännanden

- Grinden är klientstyrd exklusivitetskontroll, inte skydd för hemligt kodinnehåll. JavaScript och bilder kan fortfarande hämtas.
- Återkallelse kontrolleras inte kontinuerligt i en redan öppen spelvy. Offline-omladdning nekas eftersom serverkontroll krävs. Dessa beteenden måste accepteras eller ändras uttryckligen.
- Session mäter tid mellan sidstart och pagehide, inte aktiv speltid. Bakgrundstid kan ingå. Återkomst via back-forward-cache/pageshow behöver eget prov.
- Milstolpar har lokal deduplicering och installationer är inte personer. Vyn upplyser redan om att tratten inte är en strikt karriärtratt.
- Sparfel dedupliceras per dag/rutt: siffran är rapporterade felhändelser, inte alla misslyckade sparförsök.
- Skarp domän/CORS, Render-kallstart, databasbeständighet efter riktig omstart, Safari/iOS/PWA och verklig PostgreSQL-samtidighet är inte verifierade här. Inte heller juridisk bedömning av statistiken.

## Reproduktion och nästa grind

Kör `node scripts/audit-beta-contracts.mjs` och `node scripts/audit-beta-browser.mjs`. De skriver observationer med pass-fält; de är diagnostiska reproduktioner, inte befintliga CI-spärrar. Webbläsarskriptet använder port 4310/4311 och behöver Playwright Chromium.

Efter rättningar: gör dessa kontrakt till regressionstester, kör åter hela paketet, pinna commit och verifiera riktig deployment med en separat testinbjudan. **Aktiveringsbeslutet är fortfarande separat.**
