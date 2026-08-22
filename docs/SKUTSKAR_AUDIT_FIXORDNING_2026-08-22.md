# Skutskär-auditens fixordning — genomförande (2026-08-22)

Jacobs order: kör auditens egna fixordning (`docs/incoming/bandy-manager-skutskaer-audit-52009671-2026-08-20.md`, "Rekommenderad fixordning"), punkt 1 och 3–7. Punkt 2 (styrelsens enhetliga dommodell) redan gjord i tidigare session (Grind 1-passet + sex koefficientrundor). Exakt byggordning och scope enligt Jacobs egen numrerade lista i beställningen — High 5 (BatchStack) och Medium 2 (mecenatpoolen) INTE med i den listan, alltså inte byggda i detta pass.

## 1. High 4 — Pressminnet (fixordning punkt 1, del 1) — KLAR

**Rot:** `generatePressConference()`s sex storyline-överlagringar (kaptenstal, kontraktsdrama, heltidsproffs, m.fl.) hade ENDA spärren en per-match slumpchans — ingen räkning av hur många gånger DEN HÄR storylinen redan fått sin fråga. Kaptenfrågan återkom ~åtta gånger, kontraktsfrågan sex raka matcher.

**Byggt:**
- `storylineBudgetOk(story)` i `pressConferenceService.ts` — läser `game.narrativeLog` (Jacobs order: "den byggdes för detta"), max två poster (`press_storyline_${story.id}`) per säsong = en huvudfråga + en uppföljning.
- `GameEvent.storylinePressKey` (nytt fält) — satt av `generatePressConference()` när en storyline-fråga faktiskt väljs. Callern (`roundProcessor.ts`, direkt efter `applyRiskySponsorMaturation`) skriver narrativeLog-posten NÄR FRÅGAN VISAS, inte vid resolution.
- State-gate: `tp_liv1` ("Han går till jobbet klockan sex...") exkluderas helt ur svarspoolen (alla tre slots + fallback, inte bara preferIds) när frågans spelare är `isFullTimePro === true`. `buildPressResponses()` tar nu en `excludedResponseIds`-parameter.

**Tester:** `pressConferenceStoryMemory.test.ts` — 5 tester (dagjobbs-gate positiv/negativ, budget frisk/uttömd/ny-säsong).

## 2. High 6 — Skadekortet (fixordning punkt 1, del 2) — KLAR

**Rot:** `playThroughInjury`-eventet bar redan `relatedPlayerId` OCH en titel med spelarens efternamn (`eventProcessor.ts`) — men `EventCardInline.tsx` renderade bara titeln för `hallDebate`-events. Flera samtidiga skadekort gick inte att skilja åt.

**Byggt:** `getInjuryTag(event, players)` — ren, exporterad funktion i `EventCardInline.tsx`. Bygger `"Förnamn Efternamn · [Mjuk/Mild] skada · N dagar kvar"` från `getInjurySeverity()` + `injuryDaysRemaining`, samma tag-pill-stil som `EventOverlay.tsx`s spelar-tagg (accent-ton, återanvänd, inte omritad).

**Tester:** `EventCardInlineInjuryTag.test.ts` — 5 tester (namn+dagar, mjuk/mild-gräns, två spelare ger två urskiljbara taggar, ingen tagg för andra typer/saknad spelare).

## 3. Medium 6 — Domarcitatet (fixordning punkt 1, del 3) — KLAR

**Rot:** `REFEREE_MEETING_QUOTES.inconsistent` innehöll "Bandy är marginaler. Idag föll de åt er. Ibland inte." — en vinst-fras, vald slumpmässigt OAVSETT matchresultat. Auditen fångade den efter en 3–4-förlust.

**Byggt:** `REFEREE_MEETING_QUOTES_INCONSISTENT` delad i `{ win, loss, neutral }`. `getRefereeMeetingQuotePool(style, outcome)` — neutral-raderna gäller alltid, win/loss läggs bara till för sitt eget utfall, oavgjort får bara neutral. `strict`/`lenient` oförändrade (inga outcome-hävdande rader hittades vid genomläsning) men går genom samma funktion för enhetlig kontrakt. Callern (`matchSimProcessor.ts`) räknar faktiskt utfall från `result.fixture`.

**Text-lucka, ärligt flaggad:** `loss`-hinken har ingen riktig rad — `'[Opus]'`-platshållare. CLAUDE.md:s hårda regel (Code skriver aldrig citat) gäller även här; en förlust-variant av domarcitatet väntar Opus.

**Tester:** `refereeMeetingQuoteOutcome.test.ts` — 16 tester, kontexttabell över alla tre stilar × tre utfall (aldrig tom pool, aldrig fel riktning hävdad, strict/lenient outcome-invarianta).

## Kvalitetsportar (steg 1–3, gemensam batch)

Stash-test-cykel körd (23 nya test-failures mot återställd kod, alla tre delfynd). 2366/2366 gröna (full svit), build ren, stress 10×5 — 0 krascher, 0 invariant-brott.

## 4. High 3 — Playoff-barriären (fixordning punkt 3) — KLAR

**Rot:** `advance()`s auto-loop (`gameFlowActions.ts`) fortsatte genom RESTEN av slutspelet (andra klubbars matcher) direkt efter att den hanterade klubben slogs ut. Granska visade fortfarande den just spelade elimineringsmatchen, men flera veckors löner/världshändelser hade redan summerats till en oförklarad "Ekonomi −100 tkr"-rad, och en omvärldsrad kunde påstå att nästa motståndare väntade trots att säsongen var slut för spelaren.

**Byggt:**
- `shouldStopAutoLoopForPlayoffElimination(gameBefore, gameAfter)` — ren funktion, diff mot pre-advance-snapshotet (inte bara "är satt", eftersom `lastPlayoffElimination` ligger kvar satt hela resten av säsongen efter elimineringen — nollställs först i `seasonEndProcessor.ts`). Auto-loopen stoppar samma omgång elimineringen faktiskt inträffar; nästa `advance()`-anrop (spelaren lämnar Granska) kör igenom resten av slutspelet normalt, exakt som auditens rekommenderade fix.
- `buildMultiWeekPeriod(autoLoops, firstRound, lastRound, financeLog)` — namnger perioden när auto-loopen (i ANDRA scenarier, t.ex. cuprundor mitt i säsongen) faktiskt hoppar över fler än en omgång. Ny `RoundSummaryData.multiWeekPeriod`-fält, filtrerar samma `financeLog`-poster ekonomifliken redan visar.
- `GranskaOversikt.tsx`s "💰 Ekonomi"-rad visar nu `(omgång X–Y)` när perioden täcker mer än en omgång — raden var redan klickbar (navigerar till ekonomifliken), det som saknades var att veta VILKEN period siffran gällde.

**Tester:** `playoffEliminationBarrier.test.ts` — 11 tester (elimineringsdiff korrekt/inkorrekt i tre lägen, multiWeekPeriod byggd/tom/filtrerad).

**Kvalitetsportar:** stash-test (7 failures mot återställd kod), 2373/2373 gröna, build ren, stress 10×5 0 krascher.

## 5. Medium 5 (säsongsslutsbarriär) + Medium 1 (sponsordedupe) + Low 1 (next-action) — KLAR

### Medium 1 — Sponsordedupe

**Rot:** `activeSponsors` räknade bara ACCEPTERADE avtal — ett redan genererat men obesvarat erbjudande räknades inte som "aktivt", så ett nytt kunde skapas ovanpå varje omgång ("Bygg AB Nordin" och "Skrot & Metall Nordin" direkt efter varandra).

**Byggt:** ny gate i `postAdvanceEvents.ts` — `hasOpenSponsorOffer` (obesvarat `sponsorOffer`-event i `pendingEvents`) spärrar generering av ett nytt, oavsett auto-loopar. Tester: `sponsorOfferDedupe.test.ts`, 3 tester (spärrat, tillåtet när kön är tom, ett REDAN resolvat event spärrar inte).

### Low 1 — Next-action efter eliminering

**Rot:** `getNextActionCue()` (Portal-dashboardens "Vad nu?"-rad) föll tillbaka på "Näst på tur: spela omgången" så fort inga schemalagda matcher fanns för den NÄRMASTE omgången — men kollade aldrig om det var DEN HANTERADE KLUBBEN specifikt som saknade matcher (utslagen ur slutspelet) mot att bara andra klubbars serier fortsatte.

**Byggt:** ny `hasManagedClubFutureFixture(game)` — kollar klubbens EGNA schemalagda matcher, inte "finns någon match schemalagd någonstans". Ny gren i `getNextActionCue`: `!hasManagedClubFutureFixture` → "Säsongen är slut för er del — avsluta säsongen." istf den motsägande "spela omgången". **Två befintliga tester uppdaterade** (de kodade tidigare den buggiga förväntan som "rätt" — nu uppdaterade till den korrekta, auditbekräftade texten).

### Medium 5 — Säsongsslutsbarriären

**Rot (ingen KODBEVIS i auditen, bara SÅG):** "Efter uttåget behövde jag hantera spelar-/sponsorkort innan årsboken kunde öppnas." Ett kvarstående sponsorerbjudande lovar veckointäkt över omgångar som inte längre kommer att spelas.

**Byggt (den konkreta, kodbara delen av auditens rekommendation — "rensa daterade erbjudanden före ceremonin"):** ny `clearDatedOffersAtSeasonEnd()` i `gameFlowActions.ts` — tar bort obesvarade `sponsorOffer`-event ur kön så fort `!hasManagedClubFutureFixture` (samma villkor som Low 1, delad funktion), i stället för att vänta på nästa faktiska säsongsrollover (`seasonEndProcessor.ts` gör redan en wholesale-clear DÅ, men det är för sent — spelaren har redan sett/hanterat kortet på vägen dit). Rör ALDRIG andra event-typer eller redan resolvade poster.

**Inte byggt (kräver mock, princip 4):** en dedikerad "säsongsslutsbarriär"-SKÄRM (avsluta match → visa årsbok → sommarflödets övergångsbeslut som EGEN sekvens) — det var auditens fulla förslag, men har ingen KODBEVIS-plats och är en visuellt/interaktivt ny yta. Den byggda dedupe-/rensnings-fixen adresserar den KONKRETA friktionen (kort att hantera) utan att bygga om hela sekvensen.

**Tester:** `playoffEliminationBarrier.test.ts` utökad — 10 nya tester (`hasManagedClubFutureFixture` × 3, `clearDatedOffersAtSeasonEnd` × 4, plus tidigare High 3-tester kvar). Filen har nu 24 tester totalt.

**Kvalitetsportar:** stash-test (10 failures mot återställd kod). 2383/2383 gröna, build ren, stress 10×5 0 krascher.

## 6. High 2 — Utmattningen — KLAR (Jacobs dom 2026-08-22)

Se `docs/HIGH2_UTMATTNINGEN_FORSLAG_2026-08-22.md` för förslaget — Jacob dömde Alternativ A (hård grind, inte den icke-linjära kurvan) plus tre tillägg som inte fanns i förslaget: sorteringsformeln själv, en dubblerad tredje kopia av urvalslogiken, och copy-kopplingen till Granska.

**Rot (bekräftad i förslaget, adresserad nu):** `spelklarhet()` (Fyll bästa-sorteringen, lineupNudge.ts) vägde fitness 10% i en LINJÄR summa med currentAbility — motsatt riktning mot `playerModifier()`/`evaluateSquad()` (squadEvaluator.ts, matchmotorns faktiska värdering), som väger fitness/form 60% MULTIPLIKATIVT. "Fyll bästa elvan" kunde därför välja en elva spelklarheten ansåg stark, men som matchmotorn värderade mycket lägre.

**Byggt:**
- **Sorteringen (den verkliga fixen):** ny `getSelectionScore(player) = currentAbility × playerModifier(player)` (squadEvaluator.ts) — samma multiplikativa mönster `evaluateSquad()` redan använder, CA som positions-agnostisk proxy. `spelklarhet()` RADERAD, inte lämnad som en andra sanning (se BACKLOG.md "Två läsare, en sanning", raden nu STÄNGD).
- **En tredje, dold kopia hittad och konsoliderad:** utöver `lineupNudge.ts`s `buildNudgeLineup` fanns EN TREDJE oberoende "bästa 11"-implementation i `useLineupEditor.ts`s `handleAutoFill` — troligen den FAKTISKA "Fyll bästa elvan"-knappen auditens repro pekade på. Ny delad `pickBestEleven()` (lineupNudge.ts) — bägge konsumenterna anropar samma funktion, ingen egen tredje formel kvar.
- **`SPELKLARHET_FITNESS_FLOOR = 22`** (lineupNudge.ts) — mirror av det etablerade `AI_FITNESS_FLOOR = 40`-mönstret (matchSimProcessor.ts). Spelare under golvet nedprioriteras i urvalet men kastas aldrig — en tunn trupp (Skutskär-scenariot) väljer ändå NÅGON via fallback-poolen. Alternativ B (icke-linjär kurva) avvisad: fitness räknades två gånger (multiplikativt OCH additivt), svårare att resonera om.
- **Copy-kopplingen:** `GranskaOversikt.tsx`s `started_tired`-utfallstext hade ett oanvänt `cond`-fält (historisk fitness) — spelaren kunde få en good/neutral-rad ("Höll måttet, ingen påverkan") trots att fitness låg under golvet. Ny `getStartedTiredDirection()` (extraherad till `granska/helpers.ts` för testbarhet) tvingar `'bad'` hårt under golvet, ingen fjärde riktning — `bad`-poolen (STARTED_TIRED_OUTCOMES) fanns redan och säger rätt sak.
- **Byggt INTE:** "Bästa nu" vs "skydda säsongen" (Jacobs dom: UI-förändring, kräver mock — med sorteringen fixad är "Fyll bästa" redan det skyddande valet).

**Tester:** `lineupNudge.test.ts` — 2 spelklarhets-specifika tester ersatta med 4 nya (`getSelectionScore`-sortering, CA-vägning kvar, golv-uteslutning, tunn-trupp-fallback), 13 tester totalt i filen. Ny `getStartedTiredDirection.test.ts` — 8 tester (golvkant, fallback, otolkbar kondition).

**Kvalitetsportar:** stash-test (12 failures mot återställd kod — 4 i lineupNudge.test.ts, 8 i getStartedTiredDirection.test.ts). 2406/2406 gröna, build ren (tsc + vite + lint:design-guard), stress 10×5 0 krascher, 0 invariant-brott.

## 7. Medium 4 (critical per instans/undertyp) + Medium 3 (Form-etiketten) — KLAR

### Medium 3 — Form-etiketten (text redan dömd av Jacob)

**Byggt:** `FormStatusMinimal.tsx` — etiketten "Form" → "Spelarform" (säger vad talet faktiskt är: attributsnitt, inte resultatkurva). Ny separat rad "Form: V O F" som återanvänder `getFormResults()`/`FormDots` — samma funktion TabellScreen/GranskaOversikt redan använder, ingen dubblett (PORT 4). Tester: `FormStatusMinimal.test.tsx`, 4 tester.

### Medium 4 — Critical per instans/undertyp

**Rot:** `getEffectivePriority()` läste whyNow-data ENBART per `GameEventType` (`contentContract.ts`, Jacobs D1-dom 2026-08-21) — alla instanser av t.ex. `criticalEconomy` (en trivial bastuinbjudan-nivå-händelse OCH ett irreversibelt stjärnsälj-ultimatum delar samma typ) fick identisk behandling. Ingen typ hade en ifylld whyNow-rad, så ALLA kritiska events nedgraderades till 'normal' — bekräftat i BACKLOG.md sedan tidigare ("Ingen nåbar pivotal-instans finns i produktion").

**Byggt:**
- Nytt `GameEvent.whyNow`-fält — SAMMA fyra former som `contentContract.ts`s typ-nivå-fält (`deadlineLabel`/`whyNowPerson`/`wholeEventIrreversible`/`seasonDefining`), men satt PER INSTANS vid konstruktionsstället.
- `getEffectiveWhyNowLine(event)` (`contentContract.ts`) — läser instansens `whyNow` FÖRST, faller tillbaka på typ-raden. `getWhyNowLine()` själv oförändrad (samma låsta copy, ingen ny text).
- `getEffectivePriority()` och `EventOverlay.tsx` uppdaterade att läsa via `getEffectiveWhyNowLine`.
- **Första nåbara instansen:** `economicCrisisService.ts`s fas 3 ("Två vägar ur krisen" — namngiven ekonomichef, ett av tre val irreversibelt) fick `whyNow: { whyNowPerson: 'Johan Bergstedt' }` — contentContract.ts:s egen tidigare analys pekade redan ut detta som "STARKASTE kandidaten" av de fyra kritiska typerna. Fas 1/2 (samma `GameEventType`, ingen instans-whyNow) förblir korrekt 'normal' — bastu-nivå, inte ultimatum.

**Regressionsstädning:** fyra befintliga testfiler (`eventQueueEffectivePriority`, `eventRenderRouting`, `attentionRouter`, `getBatchSiblings`) mockade tidigare `getContentContractEntry` — ett internt samma-fil-anrop `getEffectiveWhyNowLine` gör som Vitests modul-mock inte fångar. Alla fyra uppdaterade att mocka `getEffectiveWhyNowLine` direkt.

**Tester:** `eventQueueEffectivePriorityInstance.test.ts` — 6 tester, DET kontraktstest auditen efterfrågade ("minst en nåbar critical-produktionsinstans"): riktig `checkEconomicCrisis()`-produktionskod, ingen syntetisk mock, verifierar fas 3 → critical och fas 1/2 → normal.

**Kvalitetsportar:** stash-test (12 failures mot återställd kod, inkl. de fyra regressionsfixade filerna). 2393/2393 gröna, build ren, stress 10×5 0 krascher.

## 8. Medium 7 (deep-link) + Low 2 (PWA-versionsskifte) — KLAR

### Medium 7 — Deep-link-rehydrering

**Rot:** `GameGuard` (`GameShell.tsx`) läste `game` och redirectade till `/` så fort den var `null` — men Zustand persist-middlewaren laddar `game` ur IndexedDB ASYNKRONT. `game` är alltid `null` under det första ögonblicket efter en hård omladdning, oavsett om en giltig sparning finns. `replace: true` gjorde redirecten permanent — den begärda adressen (`/game/history`) gick förlorad, spelaren hamnade på titelskärmen och fick manuellt trycka FORTSÄTT (som landar på dashboard, inte den ursprungligen begärda undersidan).

**Byggt:** `useHasHydrated()` (`gameStore.ts`) — läser Zustand persist-middlewarens egen hydreringsstatus (`persist.hasHydrated()` + `onFinishHydration`-prenumeration), ingen ny persist-logik. `GameGuard` väntar nu (`if (!hasHydrated) return null`) innan "ingen sparning"-domen fälls. Routen "bevaras" per automatik — väntar man i stället för att redirecta bort finns webbläsaren redan kvar på rätt adress när hydreringen blir klar.

**Medvetet INTE ändrat:** `DashboardOrPortal` (`AppRouter.tsx`) har samma klass av `!game`-koll, men REDIRECTAR inte (renderar bara `<PortalScreen />` inline) — ingen route-förlust, bara en möjlig kort flimmer. Annan severity än den bekräftade auditbuggen, lämnad orörd för att hålla scope till det som faktiskt är bekräftat trasigt.

**Tester:** `useHasHydrated.test.tsx` — 3 tester, riktig DOM-rendering (`react-dom/client` + `act`, inte `renderToStaticMarkup` — hooken har state/effects som kräver en riktig commit-cykel). Verifierar kontraktet mot Zustands persist-API samt false→true-övergången när `onFinishHydration` triggas efter mount.

### Low 2 — PWA-versionsskifte

**Rot:** `registerType: 'autoUpdate'` (vite.config.ts) bytte en redan öppen flik till ny kod i tysthet — ingen synlig signal. En redan öppen flik kunde fortsätta köra en gammal build utan att spelaren visste om det, kritiskt när buggrapporter (`FeedbackButton.tsx`) måste knytas till rätt build-hash.

**Byggt:** `registerType` → `'prompt'` (den enda vägen att få kontroll över UI:t — `'autoUpdate'` aktiverar/kastar den väntande service workern innan appen hinner visa något). Ny `PwaUpdateBanner.tsx` — använder `virtual:pwa-register/react`s `useRegisterSW()`, visar "Ny version finns" + en "Ladda om"-knapp när `needRefresh` blir sant. Loggar aktiv build-hash (`__GIT_HASH__`, samma fält `FeedbackButton` redan rapporterar) vid SW-registrering och när en ny version upptäcks.

**Verifiering:** `npm run build` kompilerar rent med det nya `virtual:pwa-register/react`-beroendet (workbox-window nu i bundeln, tidigare orört). Ingen live-browser-verifiering av det faktiska SW-uppdateringsflödet i denna session — kräver en riktig deploy-till-deploy-cykel, inte något en lokal testkörning kan simulera fullt ut.

**Kvalitetsportar (steg 8, gemensam batch):** stash-test (2 failures mot återställd kod — `useHasHydrated` fanns inte). 2396/2396 gröna, build ren, stress 10×5 0 krascher.

## Sammanfattning — hela ordern klar

Punkt 1, 3, 4, 5, 6, 7, 8 alla levererade (6 byggd 2026-08-22 efter Jacobs dom, se ovan). Punkt 2 (styrelsemodellen) redan gjord innan detta pass. High 5 (BatchStack) — INTE med i Jacobs byggordning, medvetet skippad. Medium 2 (mecenatpoolen) beställd i SAMMA dom som High 2 — separat pass, se HANDOVER.

**Väntar Jacobs dom:**
- Domarcitatets `loss`-hink — `'[Opus]'`-platshållare, en rad text saknas.
