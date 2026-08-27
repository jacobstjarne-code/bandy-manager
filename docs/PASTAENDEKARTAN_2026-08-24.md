# PÅSTÅENDEKARTAN — varför samma fel återkommer

**Datum:** 2026-08-24 · **Av:** Opus
**Skriven efter att fjorton enskilda fixar behandlats som fjorton problem.**

---

**⚠️ TILLÄGG 2026-08-24, VARV 1 (samma dag): en NÄR-klass hittades som tesen nedan inte namngav.**

Efter att PÅSTÅENDEGRINDEN nivå 1+2 byggts och körts mot de fynd som faktiskt går att klassificera med fältprecision (15 av 55 — se VARV 2 nedan för varför bara 15) visade det sig att en del av de klassificerbara fynden inte är citat-av-fel-fält, mönstret den här filen diagnosticerar, utan påståenden som citerar RÄTT fält vid FEL TILLFÄLLE (`take_loan`: ingen gameAfter-koll; `smWinnerSentence`: rätt fält, läst efter att rollover nollställt det; milstolpar: ingen idempotenskoll).

**⚠️ TILLÄGG 2026-08-24, VARV 2 (samma dag, ännu senare): VARV 1 korrigerade för hårt åt andra hållet — fyra arter, inte två, och VAR-tesen höll bättre än VARV 1 antog.**

En fältprecis genomgång av de 15 klassificerbara fynden (Jacobs egen granskning) visade: NÄR-fynden är inte EN klass utan minst FYRA olika arter (mutation, rollover, fönsterbredd, fasslutförande) — och **7 av 15 (47 %) är fortfarande rena VAR-buggar** (proxy-fält, fel entitet, saknad gate) som den ORIGINALA tesen nedan redan täcker korrekt. VARV 1:s "NÄR, inte VAR" var självt en överkorrigering: den ursprungliga kartan höll bättre än VARV 1:s omdiagnos antog.

**En femte, egen art hittades under byggandet av fixen för mutationsklassen (4 av 15):** i `seasonDecisionCaptureService.ts` tog VARJE byggare redan emot både `gameBefore` och `gameAfter` (arkitektonisk åtkomst fanns) — det som saknades var att byggaren faktiskt LÄSTE `gameAfter` för sin egen verifiering. **Sanningen låg framme och ingen läste den** — inte samma fel som "sanningen fanns inte nedskriven" (den ursprungliga tesen) och inte samma fel som "fel tidpunkt" (VARV 1:s tes). En fjärde/femte art: ÅTKOMST FANNS, ANVÄNDNING SAKNADES. Mekaniskt löst som en grind (`tests/grind/mutationVerificationGate.ts`), inte en körtidsfunktion — se SLUTTEST_KO.md post 67.

**⚠️ TILLÄGG 2026-08-24, VARV 3 (samma dag, sista): 15 av 55 är inte en giltig grund för NÅGON populationsslutsats.**

40 av de 55 fynden kommer från en agentrapport (runda 2-svepet, 43 fynd, 18 agenter, 282 ytor) som INTE FINNS KVAR i läsbar form — bara en aggregerad räkning i SLUTTEST_KO.md post 59, inte de enskilda fynden. Varje slutsats ovan (fyra arter, VAR höll bättre, en femte art) vilar alltså på EN FJÄRDEDEL av populationen, inte hela. Samma mönster som 2.5-svepet (40 fynd, 18 itemiserade, 22 förlorade i kontexten) — en regel om att skriva fynd till fil medan de hittas fanns redan och tillämpades inte här. **Åtgärdat:** svepet körs om med fast utdataformat till fil per agent, se SLUTTEST_KO.md post 68. Ingen mer taxonomi byggs förrän den siffran finns.

**⚠️ TILLÄGG 2026-08-24, VARV 4 (samma dag, komplett population — omsvepets resultat): en SJÄTTE/femte art är huvudfyndet, och den är den enda ingen citat-grind kan fånga.**

Omsvepet (SLUTTEST_KO.md post 68, `docs/pastaende_sweep_2026-08-24/MASTER.md`) mätte hela populationen — 85 mekaniskt genererade kandidat-funktioner, alla granskade i faktisk källkod, skrivna till fil per agent. 25 konkreta Proxy/Delvis-fynd. Fördelning av de 23 nya (2 redan kända sedan tidigare): **SANNINGEN-SAKNAS 7 (störst grupp)**, ÅTKOMST-FANNS-ANVÄNDES-INTE 5, NÄR-mutation 3, VAR-fel-entitet 2, NÄR-idempotens 1, NÄR-fönster 1, VAR-fel-fält 1, ANNAT 3.

**SANNINGEN-SAKNAS är inte en läsfelsklass — det är frånvaron av något att läsa.** `boardObjectiveService.cupRun`s hårdkodade "15 år", `weeklyDecisionService`s ismaskin-"tre vintrar", `arcService`s veteran-dagboksrader: inget fält finns nedskrivet för dessa påståenden att citera rätt ELLER fel. Varken VAR-tesen (fel fält) eller NÄR-omdiagnosen (rätt fält, fel tid) beskriver detta — det är en egen, femte art, och den enda av alla arter som INGEN grind (citat-krav, tidsfönster-krav, hur sofistikerad än) strukturellt kan fånga, eftersom grinden kräver ett fält att kontrollera mot och inget sådant fält existerar. Jacobs dom: standardåtgärden är att skriva om texten så den blir sann utan ett nytt fält (att bygga bokföring för att rädda en enskild replik är fel riktning) — men prövas fall för fall, se SLUTTEST_KO.md post 69 för de sju fallen en och en.

Nästa person: läs den här filen för VAR-tesen (håller bättre än väntat, 7/15 bekräftat) OCH för SANNINGEN-SAKNAS (huvudfyndet, den enda arten ingen grind kan fånga). Läs SLUTTEST_KO.md post 66-69 för NÄR-arterna, omsvepets fulla resultat, och de sju SANNINGEN-SAKNAS-fallens status.

---

**⚠️ TILLÄGG 2026-08-26: en SJÄTTE art, egen och distinkt från NÄR-mutation och NÄR-fönster — LÄST-FÖRE-INITIERING.**

De två kända NÄR-arterna förutsätter att fältet HAR ett meningsfullt värde — mutation betyder fel värde (fältet ändrades efter att sanningen citerades), fönster betyder rätt värde vid fel tidpunkt (för brett eller för smalt intervall). **LÄST-FÖRE-INITIERING är ett tredje, eget fall: fältet har ALDRIG fått ett meningsfullt värde än när det läses.** `standing.position` är inte "fel" eller "vid fel tid" vid matchday 0 — det är odefinierat i alla praktiska avseenden (alla klubbar på 0 poäng), och en tom/odifferentierad struktur faller tillbaka på en godtycklig sorteringsordning (alfabetisk, bekräftat i `calculateStandings`s tie-break) snarare än att signalera "inget värde än".

Tre bekräftade instanser:
1. **`GRIND1_STRESSTEST_RESULTAT_2026-08-23.md`** — stresstest-skript läste `standing.position` EFTER `seasonEndProcessor.ts`s överskrivning med nästa säsongs tomma tabell, fick varje klubbs alfabetiska rang ("Heros alltid 4:a, Skutskär alltid 9:a").
2. **`cupProcessor.ts:49`** — "Baserat på er ranking (X:a)" i cupbye-inboxtext, beräknad under försäsongens cupfönster (matchday 1-4) INNAN någon ligamatch spelats — garanterat alfabetiskt skräp varje säsong.
3. **`trainerArcService.ts`s `bestFinish`** (2026-08-26, `RAPPORT_FYRA_UTREDNINGAR_2026-08-26.md`) — `updateTrainerArc()` körs varje omgång och läser `standing.position` redan vid DEN ALLRA FÖRSTA körningen (matchday 0, noll spelade matcher). Eftersom `bestFinish` bara någonsin minskar (aldrig återställs) blev den alfabetiska spökpositionen PERMANENT — allvarligare än instans 1-2 (som är momentant missvisande) eftersom denna FÖRORENAR bestående state för klubbens hela existens.

**Regeln:** ett fält som fylls av SPELADE MATCHER (poäng, position, målskillnad — allt som `calculateStandings` beräknar ur resultat) får inte läsas som om det vore meningsfullt förrän minst en match i den aktuella säsongen faktiskt är spelad. En kontroll av `played > 0` (eller motsvarande) innan ett sådant fält citeras, muteras till persistent state, eller renderas som fakta — inte bara vid säsongsslut-överskrivningen (redan känd), utan även vid varje säsongs FÖRSTA omgång.

**Var grinden hör hemma:** i samma förbudslista/grind-mekanism `B12`s "matchhändelserna är sanningen"-princip redan pekar mot (steg 3 i "Vad som ska göras" ovan) — ett fält som `calculateStandings` producerar ska bära information om HUR MÅNGA matcher det bygger på (`played`), och citat av `position`/`points`/`goalDifference` utan att kontrollera `played > 0` först ska fångas mekaniskt, inte hittas via en märklig statistik nästa gång.

**⚠️ TILLÄGG 2026-08-26, UPPFÖLJNING (Fråga 1, fullt svep av alla läsare av `standing.position`): en av tre påstådda instanser höll inte, fem nya hittades, två oberoende döda funktioner hittades på köpet.**

**"RoundSummary-sorteringen" — INTE en levande instans.** `RoundSummaryScreen` är raderad. Den levande efterträdaren (`RoundSummaryData`, renderad av `GranskaOversikt.tsx`) använder redan `getCurrentLeaguePosition()` — en null-vakt som returnerar `null` (inte ett gissat tal) innan någon ligamatch spelats, och UI:t renderar `leaguePosition ?? '—'`. Redan korrekt byggd. Instansen fanns troligen i en tidigare version av koden och är sedan dess åtgärdad, eller var en förväxling med en av de andra tre — under alla omständigheter: kontrollerad och friad, inte en fjärde/femte instans.

**Fem NYA WRITE+nåbara instanser (samma allvarlighetsklass som `bestFinish` — förorenar persistent state, inte bara en visning):**
1. **`matchSimProcessor.ts:453`** — `fixture.attendance` beräknas via `calcAttendance()` mot `game.standings` INNAN den lokala omräkningen (`roundProcessor.ts:301`) hunnit inkludera omgångens egna resultat. Drabbar omgång 1-fixturer (och matcher direkt efter säsongsrollover). Begränsad allvarlighet: bara den specifika fixturens sparade `attendance`-fält, självläkande från omgång 2.
2. **`klackEchoService.ts:41`**, anropad `roundProcessor.ts:729` med en `fixtures`-vy som ännu inte fått den omräknade tabellen — klassificerar matchen (t.ex. "topplagsseger") fel vid omgång 1. Skrivs till `game.klackEcho` (persisterat, men förfaller `0.33`/omgång — bundet, inte permanent).
3. **`gameStore.ts`/`gameFlowActions.ts`** (`requestDetailedAnalysis` + auto-scout) — scoutrapportens `tablePosition` cachas i `game.opponentAnalyses[clubId]` vid omgång 1/säsongsstart, sitter kvar tills klubben scoutas om eller säsongen slutar (`opponentAnalyses: {}` nollställs då).
4. **`gameStore.ts:771`** — politikerns "prestige"-agenda ger `+3` relation om `standing.position<=4`, spelarutlöst, ingen omgångsspärr — nåbart innan omgång 1 är klar. Litet (+3, max 2 ggr/säsong) men verkligt.
5. **`eventProcessor.ts`s `isDemandFulfilled`** (mecenat/patron-krav av typen `league_position`) — läser `preEventGame` som INTE fått den lokala tabellomräkningen sammanslagen. Smalare/osäker frekvens (kräver att en `deadlineRound` råkar falla på en säsongsgräns) — flaggad som ospårad, inte bekräftad.

**Högst synlig EFTERMÄLE-instans (READ, ogated, men ändå värd att notera):** `situationService.ts`s fallback-gren (portalens "OMGÅNG N"-kort) visar `Position X med Y poäng` OGATAD vid omgång 0/1 — till skillnad från grannfunktionerna i samma fil som har en `completedLeague>=4/5`-spärr. Momentant (rättar sig själv omgång 2) men det är ETT AV SPELARENS FÖRSTA KORT, så synligheten är hög trots att det inte förorenar persistent state.

**Två döda funktioner hittade på köpet, oberoende av detta svep:** `pepTalkService.getPepTalk` (noll anropare någonstans i `src/`) och `inboxService.createBoardFeedbackItem` (noll produktionsanropare, körs bara i sitt eget test). TVÅ SORTERS DÖD KOD-bedömning (CLAUDE.md) ej gjord än — okänt om dessa är "superseterad, radera" eller "text-utan-yta, dödmarkera".

**Övrigt sveptresultat:** den överväldigande majoriteten av de ~60 lästa ställena är redan korrekt spärrade (`getCurrentLeaguePosition`, `hasLeagueStarted`/`anyLeagueMatchPlayed`, explicita omgångsspärrar som `currentRound===11` eller `roundNumber>=8/10`) — mönstret är inte "alla läsare är trasiga", det är "fem specifika skrivande konsumenter och ett synligt läsande missade spärren de flesta av deras syskon redan har". Fyra ställen (`clubStandingService.ts:59`, `rippleEffectService.ts:262`, `nextOpponentTeaserService.ts` vid säsongsgräns, samt frekvensen på `eventProcessor.ts`-fyndet ovan) kunde inte klassificeras med säkerhet av statisk läsning — flaggade öppna, inte gissade.

**⚠️ TILLÄGG 2026-08-26, ÅTGÄRD: sex av de fem+en (grindbygget hittade en sjätte, `rippleEffectService.ts`) fixade, en känd bugg medvetet kvarlämnad, en grind byggd.** Jacobs order: "Fixa de fem direkt... bygg in spärren i förbudslistan." Kanonisk fix: `safeStandingPosition(standings, clubId)` (`standingsService.ts`) — `null` vid `played===0`, annars den verkliga positionen. Fixade: `economyService.ts` (`buildAttendanceParams`), `klackEchoService.ts`, `opponentAnalysisService.ts`, `gameStore.ts` (politikerns prestige-boost), `demandEngine.ts` (`league_position`-krav), `communityProcessor.ts`, `nextOpponentTeaserService.ts`. Plus en SJÄTTE, tidigare oupptäckt instans hittad medan grinden byggdes: `rippleEffectService.ts`s derbyvinst-ripple (`gameAfterRipples` bär orörd `game.standings`, aldrig patchad med omgångens omräkning) — samma fix. `seasonContextService.ts` fixad trots att den redan var gated (konsekvens, inte nödvändighet). `seasonSummaryService.ts` verifierad säker (läser en fryst säsongsslut-snapshot) — allowlistad, inte fixad (inget att fixa).

**Medvetet KVARLÄMNAD: `cupProcessor.ts:49`.** Detta ÄR en av de tre ursprungliga instanserna, INTE fixad — ett tidigare Jacob-beslut (BACKLOG.md) säger uttryckligen "bygg inget här utan ett separat beslut" (rätt fix är att läsa `SeasonSummary.finalPosition` istf en live tabellslagning, ett större omtag av hela textens källa). Grinden nedan känner till den och tillåter den explicit, med en anteckning att den är en KÄND bugg, inte en verifierad-säker läsning — förväxla inte de två kategorierna i allowlistan.

**Grinden:** `tests/grind/standingPositionReadGate.ts` + `src/__tests__/standingPositionReadGate.test.ts`. Till skillnad från `forbudslistan.ts` (per-fil, skopad till redan fixade ytor) är denna KODBAS-BRED — mönstret kan dyka upp i vilken ny funktion som helst. Samma konvention som CLAUDE.md:s andra kodbas-breda grep-kommandon: ett fynd UTANFÖR en sluten, granskningsbar undantagslista failar grinden. Undantagslistan är populerad av detta svep — varje post har en verifierad anledning (en omgångsspärr, en `hasLeagueStarted`-vakt, `getCurrentLeaguePosition`, eller "läser efter den lokala omräkningen"), inte en gissning. Nästa (sjunde, åttonde...) instans ska nu failas i CI, inte hittas via en märklig statistik. 293/293 testfiler, 2936/2936 tester, tsc rent.

---

## Vad som faktiskt är fel

Fjorton fynd över tre auditer har rapporterats som separata buggar. De är en bugg.

| Yta | Påstod | Härledde ur | Sanningen fanns |
|---|---|---|---|
| Granska | vilket paussnack du valde | `htTempo`/`htPress`/`htMentality` | `pauseLean` — loggades aldrig |
| Årsboken | "Du sålde {Namn}" | `choiceId` | truppen efter mutationen |
| Styrelsens dom | hur nöjd styrelsen var | position denna säsong | ackumulerad `boardPatience` |
| Kaptenens why-now | "förlusterna staplar sig" | `roundNumber`-sortering | `matchday`-ordning |
| `FormStatusMinimal` | lagets form | snitt av `player.form` | resultaten |
| `condition_0` | trötthet | kondition | tvärtom |
| `contract_drama` | att rykten går | inbox-textmatchning | budstate |
| Matchkommentaren | vem som avgjorde | sen målklassificering | ställning före/efter |
| Pressfrågan | vem som dominerade | grov heuristik | boll och skott |
| Halvtidsrösten | "förra året" | fast replik | ingen historik fanns |
| Objektivraden | publikmål ouppfyllt | `fanMood` | `supporterGroup.mood` |
| Milstolpen | ny bragd | ingen idempotens | att den redan firats |
| Ultimatumet | vad som krävs | statisk tröskel | vad som faktiskt fattas |
| Ekonomiraden | vad perioden kostade | aggregat utan period | de hoppade omgångarna |

**Mönstret:** varje yta som ska påstå något hämtar det från något som *korrelerar* med sanningen i stället för från sanningen. En proxy.

**Och skälet är alltid detsamma:** sanningen fanns inte lagrad i en form ytan kunde citera. `pauseLean` skrevs aldrig ner. Övergången kontrollerades aldrig. Så ytan sträckte sig efter det närmaste fältet som fanns.

---

## Varför fixarna inte håller

Varje fix har kopplat *en* yta till *en* sanning. Det tar bort symptomet och lämnar mekanismen: nästa gång en yta behöver påstå något som inte är nedskrivet gör den om samma sak.

Bevis på att det redan hänt: `O18` fält 2 byggdes den 23:e mot innehållskontraktet vi själva skrev — och skrev *Du sålde Berg* om någon som stod kvar i truppen. Den nyaste funktionen bröt den nyaste regeln, samma dygn.

---

## Principen finns redan, och vi begränsade den för snävt

`B12` formulerade svaret exakt:

> **Matchhändelserna är sanningen. Referatet är en rendering av sanningen.**

Vi gav den ett scope: matchmotorn. Men varje fynd i tabellen ovan är samma sats om en annan del av spelet — säsongen, styrelsen, truppen, orten, ekonomin.

**Principen ska gälla hela spelet, inte bara matchen.**

---

## Regeln

**Varje yta som påstår något om vad som hänt måste citera en nedskriven händelse. Finns händelsen inte nedskriven är det motorn som ska skriva ner den — inte ytan som ska gissa.**

Tre följdsatser:

**En proxy är aldrig tillräcklig.** Att `htTempo` ändrades när `pauseLean` valdes gör inte `htTempo` till ett kvitto. Korrelation är inte citat.

**Kan påståendet inte beläggas ska det inte göras.** Tystnad är ärligare än en rimlig gissning. Det är samma regel som `D1`:s "därför nu" — kan raden inte sättas är eventet inte pivotal.

**Den som bygger en ny yta ska fråga varifrån varje påstående kommer.** Inte om det ser rätt ut, utan vilket fält det citerar.

---

## Vad som ska göras

### Steg 1 — inventeringen (Code, rapport)

Lista **varje ställe i `src/presentation` och i textgenererande tjänster som påstår något om vad som hänt**. Per rad:

- Ytan och filen
- Vad den påstår (en mening)
- Vilket fält den läser
- **Är fältet sanningen eller en proxy för sanningen?**
- Finns sanningen nedskriven någonstans?

Det är ett grep-drivet arbete, inte en bedömning: leta efter text som innehåller ett verb i preteritum, en siffra som beskriver ett utfall, eller ett namn i en händelsebeskrivning.

**Bygg ingenting under steg 1.** Siffran avgör vad steg 2 är.

### Steg 2 — beslutsloggen

Där sanningen inte finns nedskriven ska den skrivas. Sannolikt en gemensam struktur: vad spelaren valde, vad valet ändrade, när. `managerChoiceLog` finns redan som embryo — `pep_talk`-fältet fanns men konstruerades aldrig, vilket säger att formen var tänkt men aldrig fylld.

Det är samma mekanism `narrativeLog` är för berättelser och `contentContract` är för löften. **Tre register för samma sak, och det är i sig ett fynd** — de bör sannolikt vara ett.

### Steg 3 — grinden

En yta får inte rendera ett påstående utan ett citat. Formen avgörs av steg 1 och 2.

---

## Vad detta inte är

**Inte en anledning att stoppa fixarna.** `C1`, `H1`, `H6`, `H7` ska byggas — de är verkliga fel med verkliga offer.

**Inte V2.** Ingen ny motor, ingen ny simulering. Det handlar om att skriva ner vad som redan händer.

**Inte ett nytt dokument som ersätter kön.** Det här är en diagnos, och den ska leda till poster i `SLUTTEST_KO.md` — inte till en fjärde sanning om vad som ska göras.

---

## Godkänd när

Man kan peka på vilken rad som helst i spelet som säger vad som hänt, och följa den till fältet den citerar.

I dag går det för matchhändelserna efter `B12`. Det går inte för säsongen, styrelsen, truppen eller ekonomin.
