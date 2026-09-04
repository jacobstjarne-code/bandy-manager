# RAPPORT_OMSPARNING_RAW — grep-svar mot §5 (kodläst 2026-09-04)

**Beställd av:** `docs/RAPPORT_OMSPARNING_SYSTEM_2026-09-04.md` §5, körorder till Code. **Utförd av:** Code, tre parallella grep-/läspass. **Innehåll:** rena fakta ur koden — inga kodändringar, inga domar. Källrapporten skrevs tidigare samma dag; flera fynd nedan visar att koden redan hunnit förbi den (andra sessioner har byggt vidare under dagen) — de är märkta **AVVIKELSE** där det gäller.

---

## 1. Per system i §2 — verifiera-cellerna

**A1. Patron — "ingen återfallslogik `[verifiera: patronArc state]`"**
Bekräftat: `grep patronArc` ger noll träffar. `game.patronWithdrawnSeason` är en enkel säsongsspärr (`roundProcessor.ts:1473-1475`, 2 säsongars cooldown innan en NY patron kan dyka upp) — inte ett minne av att avhoppet redan hänt. `patronWithdrawalService.ts:22-77` skriver `patron_withdrawal`-posten men producerar ingen relapse-text och läser aldrig `game.eventLedger`. Jämfört med burnout (`isBurnoutRelapse`, `managerProfileService.ts:477`, läser liggaren och ändrar TEXTEN vid återfall) saknar patron helt motsvarigheten. **Bekräftat som rapporten sa.**

**A2. Klacken — "storylines (tifokonflikt) `[verifiera typ]`"**
**Korrigering:** det finns ingen `StorylineType` för tifokonflikten. Händelsen (`events/supporterEvents.ts:57-90`) är en generisk `GameEvent.type: 'supporterEvent'` — delad med tifo, öppet brev och bortaresa, ingen egen `EventLedgerType` heller. GPT:s "Frida/Birger" är samma händelse med slumpade karaktärsnamn ur `supporterService.ts:9-13` (leader-pool/youth-pool), inte en separat konflikt. Om `supporterMood`-tröskeln nås skrivs en generisk `type: 'decision'`-post (via `captureDecisionRipple`) med semantiknyckel = strängen `'supporterEvent'`, inte tifo-specifik.

**A2b. Klacken — "årsbok? `[verifiera]`"**
**Svar: nej.** Noll träffar på `supporterGroup|klackEcho|Klacken|klack` i `seasonSummaryService.ts`/`SeasonSummaryScreen.tsx`. Både `YEARBOOK_PERSON_TYPES` (11 typer, ingen klack-relaterad) och `computeLedgerKeyMoments` (exkluderar uttryckligen `type: 'decision'`, vilket är klackkonfliktens enda möjliga liggartyp) stänger ute den. Årsboken vet ingenting om klacken.

**A3. Matcher — "Krönikan `[verifiera: läser den liggaren nu, eller fortfarande fixtures för innevarande säsong?]`"**
**Svar: båda, parallellt — inte antingen/eller.** `collectSeasonEvents` (`clubMemoryService.ts:334-386`) loopar `game.fixtures` för ALLA säsonger inklusive innevarande, OCH läser `readClubLedger` som sedan **samma dag** (k9) fått de fem matchresultat-typerna tillagda i `LEDGER_CLUB_MEMORY_TYPES`. Liggarposten skrivs redan vid matchslut (`roundProcessor.ts:764`, samma runda — inte bara vid rollover), så för innevarande säsong producerar BÅDA vägarna identisk text/typ/matchday, och ett dedupfilter (`${type}|${matchday}|${text}`) döljer dubbletten tyst. Fixture-vägen är alltså inte borttagen, bara overshadowad. **För tidigare säsonger** (fixtures byts ut helt vid rollover, `seasonEndProcessor.ts:2012`) är liggaren den ENDA källan som fungerar — fixture-loopen ger noll bidrag där. Rapportens rad kan stängas: källan avgörs av datans livslängd, inte en villkorssats i koden.

**A4. Personliga mål — "player_milestone vid uppfyllt `[verifiera: skrivs målet som satt?]`"**
**Korrigering, tvärtom mot antagandet:** `player_milestone` skrivs vid SÄTT-tillfället (`gameFlowActions.ts:496-521`, `passSeasonTransition`), inte vid uppfyllt — men bara för goal-typen `'playerCarry'` (fem andra `SeasonGoalType`-varianter skriver ingenting). Det som faktiskt SAKNAS är motsatsen: **utfallet** (uppnått/missat) skrivs aldrig till liggaren — `seasonGoalService.ts` beräknar det rent live, noll ledger-koppling. Backfill finns för äldre saves (`clubHistoryLedgerService.ts:276-291`).

---

## 2. Per yta — redaktören, liggaren direkt, eller ficka?

| Yta | Läsväg | Bevis |
|---|---|---|
| Portal (`memory_card`) | **B** | `portal/portalMemoryService.ts:36-42` → `redaktoren`+`agendaForSurface(...,'portal')` |
| Efterklang | **Blandad B/F** (AVVIKELSE mot rapportens "ren ficka") | `pickEfterklang.ts:12,92` anropar agendan. 4/8 kandidattyper agenda-first med ficka som legacy-fallback (anniversary, economicScar, rivalSale, journalist-scoring); 4/8 ren ficka (klackEcho, followUp/bandyLetters, boardObjective, nemesis) |
| Press | **F** | `pressConferenceService.ts` — inget `redaktorenService`-import, matchning via egna `TAG_DEFS`. Bekräftar "k11 läser inte agendan än" |
| Årsbok | **Blandad B/F** | B: `seasonSummaryService.ts:294,386` (`agendaForSurface(...,'yearbook')`) för k6 och `seasonPerson`. F: `boardTruth` läst rakt ur `seasonSummaries[].boardTruth`, ingen agenda-koppling |
| Granska | **Blandad B/F** (AVVIKELSE mot rapportens "väntar managerId, ej byggda") | B: `reviewCallbackService.ts:58` → agendan, wirad i `GranskaOversikt.tsx:249,251` — **redan byggd och wirad**. F: "Det du valde" (k4) läser `game.eventLedger` direkt via `orsakVerkanService.ts`, aldrig via agendan |
| Kafferum | **F** | `coffeeRoomService.ts` — inget agenda-/ledger-import, egna text-pooler mot direkt state |
| Karriärhistorik | **F** | `HistoryScreen.tsx:363,371,438` läser `seasonSummaries` direkt |
| Blodslinjen | **F** | `ClubMemoryView.tsx:48-49` läser `game.mentorshipHistory` direkt — ingen ledger-typ för mentorskap finns |
| Orten-vyn | **F**, rent live state | `OrtenTab.tsx` läser `communityStanding`/`communityActivities`/`boardObjectives` direkt |
| Styrelsemöten | **F** | `boardMeetingStateResolver.ts:69,87` |
| Licensbrev | **F** | `licenseService.ts` skriver bara state, ingen ledger-koppling någonstans |
| Klubbminnet (referens) | **F\*** (läser liggaren men inte via redaktören) | `clubMemoryService.ts:26,201,363` — `readClubLedger` direkt, aldrig `redaktoren()` |

**Fickor med kvarvarande läsare:**
- `journalist.memory` — `pickEfterklang.ts:169`
- `bandyLetters` — `pickEfterklang.ts:232`, `HistoryScreen.tsx:468,475`
- `boardObjectiveHistory` — `pickEfterklang.ts:249`, `boardMeetingStateResolver.ts:69`, `seasonDecisionsService.ts:68`, `portal/boardPatienceZone.ts:72`, `events/hallProcessService.ts:100`
- `nemesisTracker` — `pickEfterklang.ts:270`, `transferService.ts:516-517`
- `economicCrisisState` — `pickEfterklang.ts:296`, `economicCrisisService.ts`, `seasonDecisionCaptureService.ts`
- `lastRivalSale*` — `pickEfterklang.ts:365-417`, `coffeeRoomService.ts:353-355`, `matchCore.ts:1545-1548`
- `youthIntakeHistory` — `seasonSummaryService.ts:825`
- `recentMoments` — **ingen produktionsläsare kvar** (`ClubMemoryView.tsx:79-80` läser explicit `getRecentMomentsFromLedger` "i stället för det cappade `game.recentMoments`"); fältet skrivs dock fortfarande dual-write (`roundProcessor.ts:1724`, `seasonEndProcessor.ts:2263`) — en skriv-utan-läsare-ficka.

---

## 3. `ledgerTold` — vem skriver kvitton, vem visar utan

**Skriver kvitton (5 av 7 `NARRATIVE_SURFACES`):** portal (`PortalScreen.tsx:97`), efterklang (`PortalScreen.tsx:102`), yearbook (`SeasonSummaryScreen.tsx:33`, bara för `seasonPerson`), review (`GranskaOversikt.tsx:251`), push (`gameStore.ts:1302-1319` + `AttentionBridge.tsx:53`).

**Skriver aldrig:** press, coffee_room — konsekvent med att ingen av dem läser agendan än.

**Visar liggarposter utan kvitto:**
1. Granska "Det du valde" (k4) — decision-post renderad direkt, ingen `markLedgerPostTold`. Dämpat av match-scoperingen (samma post = samma match), men uppfyller strikt kriteriet.
2. Årsbokens k6 `computeLedgerKeyMoments` — hämtar upp till två liggarposter via agendan, inget kvitto skrivs (bara `seasonPerson` på samma skärm gör det).
3. Krönikan/Klubbminnet — renderar liggarhärledd text i stor skala, rör aldrig `ledgerTold`. Sannolikt medvetet (permanent arkiv, repetition är poängen där) — men bör namnges explicit så det inte förväxlas med en bugg.

---

## 4. Schemafälts-täckning

**4a. `clubId`** — **optional i typen** (`Narrative.ts:239`, `clubId?: string`), men funktionellt 100 % täckt i praktiken: två centrala stämplingspunkter (`eventLedgerService.ts` `logEvent`, `momentLedgerService.ts`'s `stamp`) sätter det om det saknas, plus en migrationsbackfill (`clubHistoryLedgerService.ts:201-230`) som stämplar ALLA befintliga poster vid load. Stickprov på 8 skrivande filer: ingen konstruerar en post som undslipper båda stämplingspunkterna.

**4b. `result` — AVVIKELSE mot rapporten.** Det är **fem typer, inte sex**: `cup_final, sm_final, derby_result, big_win, big_loss` (`Narrative.ts:363`, `MATCH_RESULT_LEDGER_TYPES`). `season_finish` är MEDVETET utanför — dess data (`finalPosition`) ackumuleras permanent i `seasonSummaries` och behöver aldrig payloaden.

**4c. `managerId` — AVVIKELSE mot rapporten ("ej byggd").** Fältet finns (`Narrative.ts:247`, optional), skrivs på tre håll (`logEvent`/`stamp` för `decision`/`manager_burnout`-typer automatiskt, plus explicit på `player_milestone` vid `passSeasonTransition`), och har minst en verklig konsument: `reviewCallbackService.ts:86-121` jämför `managerId` för att bygga Kristoffer-callbacken — **exakt den koppling rapporten trodde var omöjlig**.

**4d. `subjectSnapshot`** — noll träffar. Finns inte, ren framtidsplan i §3.

---

## 5. Krönikan — se punkt A3 ovan (sammanslaget, samma svar från två oberoende pass).

---

## 6. Producenter av intro utan prior-check

`hasPriorStorylineResolution` har **exakt en användare i hela kodbasen: journalistbågen** (`journalistVisibilityService.ts:32-54`). `semanticKeyStem` används bara internt av Redaktören själv, ingen producent anropar den för att gata en ny intro.

**Har fungerande prior-check (läser liggaren):** journalist (`hasPriorStorylineResolution`), burnout (`isBurnoutRelapse`, `managerProfileService.ts:477` + `hasPriorBurnoutEpisode`).

**Saknar helt liggarbaserad prior-check** (dedup bara mot innevarande säsongs pending/resolved-state eller en enkel flagga, aldrig mot historiken):

| Producent | Fil | Dagens dedup |
|---|---|---|
| Patron emerge/avhopp | `patronEvents.ts`, `roundProcessor.ts:1473` | 2-säsongers cooldown-tal |
| Mecenat | `mecenatService.ts` | id innehåller säsong |
| Sponsor | `events/sponsorEvents.ts` | live mood-state |
| Domarrelation | `eventResolver.ts:1754-1799` | tröskel-state, flera poster kan samexistera obemärkt |
| Klackkonflikt/tifo | `events/supporterEvents.ts:57-90` | `conflictSeason !== currentSeason` |
| Skolkonflikt | `processors/youthProcessor.ts:103-126` | id scopat till säsong (känt sen tidigare) |
| Måltorka | `arcService.ts:37-103` | bara aktiva arcs kollas, ingen cross-säsong-koll (känt sen tidigare) |
| Kaptenstal | `events/eventFactories.ts:373-403` | en gång/säsong via id |
| Skandal | `scandalService.ts` | ingen ledger-läsning alls |
| Era shift | `roundProcessor.ts:2347-2361` | bara samma-runda-dubblett fångas |
| Akademi | — | inga producenter byggda (rapporten hade rätt: känd, dömd, byggbar) |

Bred sweep: alla åtta generatorfiler i `src/domain/services/events/` gav noll träffar på `eventLedger` överhuvudtaget — ingen läser liggaren för NÅGOT syfte utom journalist/burnout.

---

## Sammanfattning — vad som redan sprungit ifrån källrapporten

Fem punkter i `RAPPORT_OMSPARNING_SYSTEM_2026-09-04.md` var redan inaktuella vid grep-tillfället, sannolikt för att andra sessioner byggde vidare samma dag:

1. **Efterklang** är inte längre ren ficka — halva kandidatuppsättningen är redan agenda-first.
2. **Review-callbacks (Granska k12)** är redan byggda och wirade, inte "väntar managerId".
3. **`managerId`** finns redan, skrivs, och har en verklig konsument.
4. **Matchresultat är FEM typer, inte sex** — `season_finish` har aldrig varit en av dem.
5. **Krönikan läser redan liggaren** för matcher (parallellt med fixtures, dedup döljer dubbletten) — inte "fortfarande bara fixtures".

Två punkter var feltolkade i sak, inte bara föråldrade:
6. **Tifokonflikten har ingen egen `StorylineType`** — den är en generisk `supporterEvent`/`decision`, delad med tre andra klackhändelser.
7. **`player_milestone` skrivs redan vid SÄTT**, inte vid uppfyllt — det är UTFALLET (mål nått/missat) som saknar en skrivväg, tvärtom mot vad rapporten misstänkte.

Allt annat i källrapportens §2-tabell (patron, mecenat, sponsorer, styrelse, licens, domare, orten, hall, akademi, landslag, brev, orsak/verkan, manager/karriär, push) stämmer med koden som den ser ut nu.
