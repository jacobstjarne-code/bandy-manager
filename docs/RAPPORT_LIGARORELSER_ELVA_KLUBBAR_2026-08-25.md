# RAPPORT — vad finns om de andra elva klubbarna, per klubb och per säsong

**2026-08-25.** Fråga 3 i `DOM_FORUTSATTNINGSFASEN_2026-08-24.md`, den Jacob själv kallade "viktigaste frågan" — kan exempelraderna i designleveransens 1b-variant ("Lesjöfors köpte Nyström", "Skutskär och Målilla bytte tränare", "Heros tappade sin målvakt") beläggas ur faktisk data?

**Kontext för när detta läses:** Jacob beslöt samma dag att pausa den nya fasen till förmån för att bygga ut `generatePreSeasonMessage` (se `BACKLOG.md`). Den här rapporten är alltså inte längre en förutsättning för ett pågående bygge — den är underlaget för NÄSTA beslut, den dag världsbilds-sektionen tas upp igen. Skopet den utreddes mot inkluderar det som byggdes i samma pass (reputation/boardExpectation nu dynamiska för alla tolv klubbar).

---

## Svar i korthet

**Ingen av de tre exempelraderna kan beläggas ordagrant i dag.** En svagare, sann version av transferraden går att bygga billigt. Tränarbytesraden går inte att bygga alls utan ny simulering. Placeringshistorik är den enda kategorin som redan är fullt spårbar, för alla tolv klubbar, obegränsat bakåt.

---

## 1. AI-klubbars transfers — "Lesjöfors köpte Nyström från Rögle"

**Delvis, och bara grovt.** En rik, attribuerad post ("spelare, köpande klubb, säljande klubb, avgift") beräknas i minnet varje säsong men kastas bort — sparas aldrig som strukturerad, sökbar data.

- `aiTransferService.ts:6-115` (`processAITransfers`, körs EN gång per säsong, säsongsslut) bygger faktiskt en fullt attribuerad post: `{ playerId, playerName, fromClubId, fromClubName, toClubId, toClubName, fee }`. I beräkningsögonblicket existerar alltså exakt den tupel raden skulle behöva.
- **Rör aldrig hanterade klubben** — kandidater exkluderar uttryckligen `p.clubId === managedClubId`. AI↔AI och AI↔hanterad klubb är två helt separata system.
- **Hela `transfers`-arrayen sparas inte.** Efter beräkning filtreras den till `notableTransfers = ...filter(fee > 50000).slice(0,3)` och blir EN friformad inboxtext utan `relatedClubId`/`relatedPlayerId` — prosa, inte strukturerad data. Avgifter under 50 000 kr och gratisövergångar lämnar inget spår alls. Inboxposten är dessutom föremål för `MAX_INBOX=50`-utrensning över flera säsonger.
- **Ingen `Transfer`-entitet/logg finns.** `Player` har inget `previousClubId`/`transferHistory`-fält. `CareerMilestone` har ingen transfer-typ, och populeras ändå bara för hanterade klubbens spelare.
- **Det som FAKTISKT överlever, svagt:** `Player.seasonHistory` (`{season, clubId, ...}`) skrivs VARJE säsong för ALLA spelare (inte bara hanterade klubbens), kapat till 10 säsonger bakåt. Eftersom entryn för säsong N fångar `clubId` FÖRE samma säsongs AI-transferpass, och säsong N+1:s entry fångar den NYA klubben, går det att beräkna: "spelaren tillhörde Rögle säsong N, Lesjöfors säsong N+1" → alltså bytte han klubb. **Detta är riktig, spelarspecifik, klubböverskridande, flersäsongsdata.**
- Men det är tunnare än påståendestilen kräver: det säger VAR spelaren var, inte att ett KÖP (avgift, initiativ) skedde. "Nyström spelade för Rögle i fjol och Lesjöfors i år" går att belägga. "Lesjöfors KÖPTE Nyström" (antyder avgift/affär) går inte, ur detta fält ensamt — samma signal hade producerats av en gratisövergång eller av truppfyllnadssystemet.

**Dom:** en specifik spelare + köpande klubb + säljande klubb går att rekonstruera för INNEVARANDE säsong, transient, via den kasserade-utom-topp-3-inboxtexten (ej maskinläsbar) eller genom att jämföra `Player.seasonHistory[].clubId` mellan två säsonger. En varaktig, strukturerad, sökbar logg finns inte. "Köpte X från Y" kan inte beläggas ur befintlig data; "X flyttade från Y till Z" kan, för valfri spelare, max 10 säsonger bakåt.

---

## 2. AI-klubbars tränarbyten — "Skutskär och Målilla bytte tränare"

**Bekräftat frånvarande, omverifierat.** Ingen AI-klubb-tränare-avsked/anställning/ersättningsmekanism finns någonstans i kodbasen.

- `Club.opponentManager?: {name, persona, yearsAtClub}` är den ENDA representationen av en AI-klubbs tränare.
- Genereras EN gång, vid världsskapande (`worldGenerator.ts:847` → `generateOpponentManager()`), slumpade namn/persona/`yearsAtClub` ur fasta pooler.
- Varenda annan referens till `opponentManager` i hela kodbasen är en LÄSNING, aldrig en skrivning (citattexterna före/efter match). Full repo-grep bekräftar: 6 filer refererar fältet alls, ingen av dem muterar det.
- `yearsAtClub` sätts en gång, ökas/minskas/nollställs aldrig — statisk smaksättning, ingen simulerad ämbetstid.
- Kontrast: den hanterade klubbens `assistantCoach` är ett eget SaveGame-fält som BARA finns för spelarens egen klubb — det finns alltså inte ens en motsvarande struktur för AI-klubbar att ersätta, inte ens i princip.

**Dom:** raden "Skutskär och Målilla bytte tränare" vore, i dag, ren uppfinning. Ingen fältgissning kan rädda den — fältet finns inte.

---

## 3. AI-klubbars trupp/rykte/ekonomi-bana, per säsong

**Rykte:** `Club.reputation` — bara aktuellt värde, ingen historik lagrad någonstans. Fram till samma dags kodändring rörde sig AI-ryktet ALDRIG utom via skandalsystemet. **Nu byggt** (samma pass som denna rapport, se BACKLOG): reputation-delta körs för alla tolv klubbar varje säsongsslut. Men fortfarande ingen historik att jämföra MOT — "Lesjöfors rykte i år mot i fjol" går fortfarande inte att slå upp, bara "Lesjöfors rykte just nu."

**Truppstyrka:** inget lagrat/beräknat per-klubb-styrketal finns någonstans. De enda träffarna är lokala, engångsberäkningar (t.ex. `opponentAnalysisService.ts:254`, räknar snitt-CA färskt för nästa motståndare, sparas ingenstans). `Player.caHistory` finns per spelare, 10 säsonger bakåt, för alla spelare — en klubbs truppsnitt för en PASSERAD säsong är alltså BERÄKNINGSBAR (full scan över alla spelare vars `seasonHistory[k].clubId` matchar), men inte SPÅRAD som en färdig siffra.

**Slutplacering:** **den enda kategori som redan är fullt och varaktigt spårad.** Varje `SeasonSummary` (en per säsong, ackumuleras för alltid, ingen trimning) bär en HELA LIGAN-`standingsSnapshot` (`{clubId, position, points}` för alla tolv). "Klubb X slutade N:a i år, M platser upp/ner mot i fjol" går att belägga för VILKEN SOM HELST klubb, VILKEN SOM HELST säsong, obegränsat bakåt.

**Anläggningar:** **inte spårat för AI-klubbar, definitivt.** `Club.facilities` fryst vid världsgenerering — VARJE muteringsställe i hela kodbasen är spärrat till `managedClubId`. Den rikare `FacilityState`-strukturen är ett enda, icke-klubb-indexerat fält på hela spelet — det finns bara EN anläggningsträd i hela sparfilen, implicit spelarens egen. "Skutskär byggde ny hall" är okonstruerbart för NÅGON AI-klubb — inte ens ett fält att ha fel om.

**Ekonomi:** `Club.finances` rör sig FAKTISKT för AI-klubbar (löpande sponsring/löner/matchintäkter, ej spärrat till hanterad klubb). Men ingen säsong-till-säsong-bana sparas för AI-klubbar — den plats som beräknar en sådan differens (nybyggd samma pass, `seasonEndProcessor.ts`) nollställer den explicit för alla utom hanterad klubb.

**Nästan-träff värd att känna till:** `clubMemoryService.ts` ser vid första anblicken ut som exakt den sortens aggregator en världsbild vill ha (säsongsvisa `MemoryEvent[]`, deklarerade typer inkluderar `transfer_signed`/`transfer_sold`/`facility_built`) — men är hårdkodad mot `game.managedClubId` genomgående. Visar aldrig AI-klubbshändelser. Värt att känna till som formmall att återanvända, inte som en nuvarande datakälla.

---

## 4. Ärlig inventering — vad går att konstruera i dag

### KAN konstrueras ur riktig, attribuerbar per-klubb-data

| Påståendetyp | Fält | Förbehåll |
|---|---|---|
| "Klubb X slutade N:a i år, M platser upp/ner mot i fjol" | `seasonSummaries[i].standingsSnapshot`, alla tolv klubbar, obegränsad historik | Solid. Full historik, alla klubbar, ingen spärr. |
| "Klubb X:s rykte är just nu N" (ögonblicksbild, ingen trend) | `Club.reputation` | Kräver den samma-dags-byggda alla-tolv-utökningen (annars frusen utom vid skandal). Ingen "upp från i fjol"-jämförelse möjlig — ingen historik lagrad. |
| "Spelare X drabbades av en skandal hos klubb Y säsong N" | `game.scandalHistory[]`, `scandal.affectedClubId` | Inte klubbspärrad. Inte djupverifierad i denna passning utöver muteringsställena — värt en riktad läsning om detta blir en påståendetyp. |
| "Spelare X spelade för klubb A säsong N, klubb B säsong N+1" (svag flyttsignal) | `Player.seasonHistory[].{season,clubId}`, alla spelare, 10 säsonger | Ingen avgift, inget "vem tog initiativet", skiljer inte betald övergång från gratisvärvning eller truppfyllnad. Undvik "köpte"/"sålde" i formuleringen. |
| "Några anmärkningsvärda övergångar skedde" (odifferentierad prosa, bara innevarande säsong) | `inbox_ai_transfers_${season}`-postens brödtext | Ostrukturerad, ingen `relatedClubId`, bara topp-3 med avgift>50k, förgänglig (inbox-utrensning), inte programmatiskt filtrerbar per klubb. |

### KAN INTE konstrueras ärligt i dag — kräver ny lagrad state

| Påståendetyp | Varför inte | Vad som skulle krävas |
|---|---|---|
| "Klubb X köpte spelare Y från klubb Z för [avgift]" | Beräknas varje säsongsslut men kastas efter en ostrukturerad, avgift>50k-bara inboxtext | En persisterad, strukturerad `Transfer[]`-logg (playerId/fromClubId/toClubId/fee/season) — beräkningen finns redan, den behöver bara skrivas ner i stället för kastas. |
| "Klubb A och B bytte tränare" / något AI-tränarbyte alls | Ingen AI-klubb-tränare-livscykel finns alls | En full anställnings-/avskedssimulering för AI-tränare, med sparad historik — finns inte i någon form i dag, inte ens en stubbe. |
| "Klubb X:s trupp har blivit starkare/svagare sedan i fjol" | Inget per-klubb-styrketal sparas någonsin | Antingen en per-klubb-per-säsong-CA-ögonblicksbild i `SeasonSummary`, eller en offline-rekonstruktion ur alla spelares `seasonHistory`+`caHistory` (möjlig i dag men inte spårad, kapad 10 säsonger). |
| "Klubb X:s rykte har trendat upp/ner över N säsonger" | Ingen historik lagrad, bara det levande värdet | Bifoga rykte (och helst ekonomi, anläggningar) till den data som redan fångas i `standingsSnapshot`, eller en egen `clubTrajectorySnapshots`-array. |
| "Klubb X byggde [anläggning]" för någon AI-klubb | `Club.facilities` fryst vid världsgenerering för alla elva, varje muteringsställe hanterad-klubb-spärrat | AI-klubbar skulle behöva en egen anläggningssimulering helt — noll simulering finns i dag, inte ens en tärningsrullning. Det starkaste "kan aldrig bli sant"-fallet — det finns inte ens ett fält att ha fel om. |
| "Klubb X:s ekonomi har förbättrats/försämrats sedan i fjol" | `Club.finances` rör sig live men ingen tidigare-säsong-ögonblicksbild sparas för icke-hanterade klubbar; platsen som räknar en differens nollställer den explicit för AI-klubbar | Ett per-klubb `seasonStartFinances`/`seasonEndFinances`-par, analogt med det som redan finns för hanterad klubb, utökat till alla tolv. |
| "Heros tappade sin målvakt till Rögle" (positionsspecifik transfernarrativ) | Samma rotorsak som den generella transferfrågan, plus att positionen aldrig knyts till flytten som ett klubbnivå-faktum | Samma fix som den generella transferloggen, plus att läsa `player.position` vid transfertillfället. |

### Slutsats

Projektets egen PÅSTÅENDEKARTAN-disciplin (`docs/PASTAENDEKARTAN_2026-08-24.md`) säger redan reglen den här sortens sektion måste lyda under: *"Varje yta som påstår något om vad som hänt måste citera en nedskriven händelse. Finns händelsen inte nedskriven är det motorn som ska skriva ner den — inte ytan som ska gissa."* Transfer-, tränarbytes-, ryktestrend-, truppstyrketrend-, anläggnings- och ekonomitrend-gapen ovan är alla instanser av dokumentets egen **SANNINGEN-SAKNAS**-kategori — den enda arten ingen citat-grind kan fånga mekaniskt, och vars föreskrivna botemedel är antingen (a) gör inte påståendet, eller (b) låt motorn skriva ner fakta FÖRST. Placeringshistorik är det enda området där sanningen redan är varaktigt nedskriven och säker att bygga på direkt.
