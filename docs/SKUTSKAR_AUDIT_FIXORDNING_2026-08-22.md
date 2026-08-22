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

## Återstår (fixordning punkt 6–7)

6. High 2 — Utmattningen (RAPPORT innan kalibrering, inte byggd)
7. Medium 4 (critical per instans) + Medium 3 (Form-etiketten)
8. Medium 7 (deep-link) + Low 2 (PWA-versionsskifte)
