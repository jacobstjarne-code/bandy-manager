# RAPPORT — vad krävs för att en AI-klubb ska förändras sant mellan säsonger

**2026-08-25.** Byggd ovanpå `docs/RAPPORT_LIGARORELSER_ELVA_KLUBBAR_2026-08-25.md` (läst och omverifierad, inte bara tagen på förtroende — en omverifiering avslöjade en bugg den ursprungliga rapporten inte flaggade, se §2). Fråga: inte "vad finns", utan "vad skulle KRÄVAS" — en konstruktiv genomförbarhetsanalys, ingen UI/feature-design, inget byggt.

---

## 1. Transfers — billigast, redan halvbyggt

Den kompletta, attribuerade tupeln beräknas redan varje säsong i minnet; kastas i dag bort utom en förlustfylld topp-3-textrad.

**Nuvarande flöde:** `aiTransferService.ts:6-115` returnerar redan `transfers: [{playerId, playerName, fromClubId, fromClubName, toClubId, toClubName, fee}]` — VARJE AI↔AI/AI↔fri agent-övergång, inte bara de anmärkningsvärda. `seasonEndProcessor.ts:1118-1126` behåller bara de muterade spelarna/klubbarna, sparar aldrig arrayen strukturerat. Filtreras till `fee>50000`, topp 3, blir EN friformad inboxtext utan `relatedClubId`/`relatedPlayerId`.

**Minimal ändring:**
1. Ny typ `TransferRecord` — exakt samma shape `aiTransferService.ts` redan producerar. Namnge ärligt (`aiTransferLog`, inte `transferLog`) — täcker ALDRIG den hanterade klubbens egna affärer (hårt exkluderad i källan), ett namn som antyder annat vore vilseledande.
2. Nytt `SaveGame`-fält: `aiTransferLog: TransferRecord[]`, samma mönster som `seasonSummaries`/`scandalHistory`.
3. Append-ställe: direkt efter `processAITransfers`-anropet, samma plats `seasonSummaries` redan appendas.
4. Nytt-spel-default + migrationsdefault (`[] `), samma mönster som `seasonSummaries` redan har.

**~5 filer, 6-7 diskreta edits.** Ingen befintlig konsument behöver ändras.

**Migrationsfråga, redan besvarad av projektets egen policy:** gamla saves får `aiTransferLog=[]`, ingen bakåtfylld historik. Det är INTE en lucka att laga — `docs/CODE_INSTRUKTION_LANGSPEL_10SASONGER_2026-08-17.md:30`: *"Gissa inte bakåt — de åren är borta och ska förbli borta."*

**Beslutsfråga (data-lager, inte UI):** logga ALLT (inklusive avgift=0/gratisövergångar) och låt >50k-filtret vara en ren berättar-yta-fråga, i stället för att bara logga det redan-filtrerade — annars förlorar loggen poängen med att vara strukturerad.

---

## 2. Rykte/ekonomi-trend — utöka `standingsSnapshot`, men en verklig ordningsbugg väntar

**`SeasonSummary.standingsSnapshot`** (`{clubId, position, points}`, en rad per klubb, redan i den obegränsade `seasonSummaries`-arrayen) är RÄTT plats att utöka — inte en ny parallell `clubTrajectorySnapshots`-array. Att lägga till `reputation`/`finances` i samma `.map()` är mekaniskt trivialt eftersom `generateSeasonSummary` redan har hela `game`-objektet i scope.

**Men — en dold, verklig kostnad hittad genom att spåra det faktiska dataflödet, inte antagen:**

`generateSeasonSummary` anropas mot `seasonEndGameView = {...game, clubs: updatedClubs}`. `updatedClubs` FÅR säsongsslutets reputation-delta och boardExpectation-stegning (alla tolv, båda korrekta där). Men den FÅR INTE AI-transfer-avgifternas ekonomiska rörelse — de apploceras via `applyFinanceChange` på en SEPARAT array (`clubsAfterLicense`), som `updatedClubs` aldrig synkas tillbaka mot. Den array som FAKTISKT sparas för nästa säsong (`game.clubs: clubsAfterLicense`) är EN ANNAN än den `generateSeasonSummary` läser.

**Konsekvens:** en naiv `finances: club.finances`-läsning i `standingsSnapshot` skulle vara inaktuell med exakt en säsongs AI-transfer-kassaflöde, för potentiellt alla elva AI-klubbar, varje säsong. Rykte har INTE detta problem (färdigt innan uppdelningen). Ekonomi har det specifikt.

Detta är precis den "ser litet ut, producerar ibland fel data"-fällan projektets egen disciplin finns för att fånga. Inte svårt att fixa (trä in det AI-transfer-inkluderande klubb-arrayet, eller flytta läsningen till efter `clubsAfterLicense` finns) — men en ordnings-/parameteromkastningsändring, inte ett rent "lägg till ett fält"-jobb.

**"Ingen baslinje att jämföra mot"-problemet löser sig gratis** när rätt värde väl fångas rätt — en "trend" är bara att diffa `seasonSummaries[i-1]` mot `seasonSummaries[i]` för samma klubb-id. Ingen ny diff-funktion finns än (~10-20 rader att skriva), men ingen ny lagrad state utöver det ovan.

**Nettodom:** ryktestrend billig och säker exakt som beskrivet. Ekonomitrend har samma billiga FORM men en verklig, icke-uppenbar ordningsbugg i vägen — förtjänar att nämnas separat, inte klumpas ihop med rykte som "lika billigt."

---

## 3. AI-tränarbyten — ärlig uppdelning, INTE enhetligt litet

**Bekräftat noll infrastruktur**, omverifierat oberoende (6 filer refererar `opponentManager`, alla bekräftat läs-bara).

**Liten version — genuint liten, en återanvändbar signal finns:** `seasonEndProcessor.ts:223-230` beräknar redan `computeSeasonVerdictRating` för ALLA TOLV klubbar varje säsong, bara för att kasseras efter reputation-deltat. En minimal "avsked efter N raka dåliga säsonger"-trigger kan återanvända EXAKT den loopen, men behöver EN genuint ny sak: en per-AI-klubb rak-dålig-säsong-räknare (`consecutiveFailures` finns bara som en enda skalär för HANTERAD klubb, måste bli klubb-indexerad). Konkret: utöka samma loop, tracka/inkrementera en svit, vid tröskel återkalla `generateOpponentManager` och nollställ.

**Men en verklig begränsning:** detta ger ett tränarBYTE, inte en tränarAVSKEDSHÄNDELSE med en orsak spelet kan berätta. "Skutskär bytte tränare" går att säga; "Skutskär sparkade sin tränare efter tre svaga säsonger" kräver att sviten-passerade-tröskeln-ögonblicket SPARAS (inte bara den nya tränaren) — annars har en spelare som senare kollar klubbhistorik inget register över VARFÖR. Samma klass problem som ryktets saknade historik i §2. En `coachHistory`-post (`{clubId, season, outgoingName, incomingName, reason}`) behövs vid bytesögonblicket — litet, men ett TILLÄGG ovanpå "bara regenerera fältet"-versionen, inte inkluderat i den.

**Full version — ärligt stor, inte liten:** den närmaste motsvarigheten till en RIKTIG anställnings-/avskedssimulering är hanterade klubbens egen boardPatience-apparat (patiens, consecutiveFailures, meritbuffert, per-tier-lutningstabeller, objektivspårning, en hel avskedsbeslutsväg). Hundratals rader sammanflätad formel/state för EN klubb. Att replikera något jämförbart grundat för elva AI-klubbar (trovärdig ny-tränare-generering matchad mot rykte/förväntan, personakontinuitet, en riktig "varför" kopplad till faktiska säsongsutfall snarare än en bar räknare, historiskt register) är ett materiellt större bygge — inte en variant av den lilla versionen. Skopa och uppskatta separat; låt inte "en liten MVP finns" antyda att hela systemet också är nästan gratis.

---

## 4. AI-anläggningar/truppstyrka — en är billig, en ser bara billig ut

**Anläggningar — bekräftat noll simulering, och "billig proxy"-frestelsen är en FÄLLA här, inte en genväg.**

Varenda muteringsplats för `Club.facilities` är hårdspärrad till hanterad klubb (4 ställen, alla omverifierade). Den rikare `FacilityState`-strukturen är ETT enda, icke-klubb-indexerat fält — det finns bokstavligen bara ETT anläggningsträd i hela sparfilen.

En "billig proxy" (t.ex. knuffa AI-klubbars `facilities`-tal baserat på en ryktes-/ekonomitrend, utan att bygga den riktiga nod-träds-ekonomin) är FRESTANDE men INTE ärligt billig — eftersom `Club.facilities` redan har en riktig, bärande betydelse kopplad till pengar och tid för hanterad klubb. Att tyst höja AI-klubbarnas tal baserat på en proxy-signal, utan någon underliggande orsak spelet någonsin kan citera, återskapar EXAKT den SANNINGEN-SAKNAS-felklass revisionen och PÅSTÅENDEGRINDEN finns för att förhindra — ett tal som rör sig utan citerbar anledning är VÄRRE än ett tal som ärligt står stilla. **Det starkaste "ser litet ut, är det inte"-fallet i hela rapporten.**

**Truppstyrka — FAKTISKT billig, av en specifik strukturell anledning: kräver ingen ny LEVANDE simulering alls, bara en ögonblicksbild av data som redan finns.** `Player.caHistory`/`seasonHistory` finns redan för alla spelare, alla klubbar, 10 säsonger. `opponentAnalysisService.ts:254-256` beräknar redan ett snitt-CA — bara för nästa motståndare, aldrig sparat. Truppstyrka behöver INGEN ny simulering för att växa annorlunda för AI-klubbar — de befintliga systemen (transfers, truppfyllnad, utveckling) rör redan CA för AI-klubbar kontinuerligt. Det som saknas är RENT en ÖGONBLICKSBILD: kör samma snittlogik en gång per klubb vid säsongsslut, skriv in i samma `standingsSnapshot`-utökning som §2. Billigt eftersom det är läsning över data som redan existerar och redan ändras av rätt anledningar — ingen parallell "AI-anläggningsekonomi" behöver uppfinnas som för anläggningar.

---

## 5. Tvärsnitt — den minsta datagrunden för EN sann rad per säsong

**"Minst en transfer hände + placeringar ändrades" är nästan gratis, men asymmetriskt:**

- **Placeringsändring:** kräver NOLL ny lagrad state. `standingsSnapshot` finns redan, alla tolv klubbar, obegränsad historik, ingen spärr, INGEN ordningsrisk (position/poäng är färdigberäknade när ögonblicksbilden tas, ingen "före/efter AI-transfers"-uppdelning som för ekonomi). Enda jobbet: en diff-funktion, ren härledning.
- **Transfer hände:** kräver §1:s ändring — litet, men ett genuint schema-tillägg med en genuin (om trivial) migrationsberättelse.

Kombinerat: fortfarande klart billigast av de fem kategorierna. Undviker §2:s ekonomi-ordningsbugg helt (rör inte ekonomi), undviker §3 och §4 helt (inga tränar-/anläggningspåståenden), återanvänder projektets mest mogna, minst spärrade data plus en redan-halvbyggd beräkning.

**Vad denna MVP uttryckligen INTE kan påstå ärligt:** vilken specifik spelare en klubb "sålde" mot förlorade till fri agent/truppfyllnad (bara `aiTransferLog` kan skilja det, och bara från det ögonblick den börjar spela in); något om rykte/ekonomi-riktning (kräver §2:s ordningsfix); något om tränare (§3, noll infrastruktur); något om anläggningar (§4 — en proxy vore aktivt oärlig, inte bara svag).

**Infrastrukturnot:** `PÅSTÅENDEGRINDEN` (`pastaendeGrindNiva1.test.ts`, bekräftat aktiv, refererar redan `opponentManagerService.ts` bland sex annoterade filer) kräver att narrativgenererande funktioner bär `@cites`-taggar mot det verkliga fältet bakom påståendet. Bra nyheter för MVP-skopet ovan (både `standingsSnapshot` och en ny `aiTransferLog` är förstahandsfakta, lätta att citera ärligt) — och ytterligare ett argument mot §4:s anläggningsproxy (ett tal knuffat av en orelaterad signal har inget legitimt att citera).

---

## Inget byggt. Väntar på Jacobs dom om riktning och prioritering.
