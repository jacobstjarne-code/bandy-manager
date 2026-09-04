# RAPPORT — Händelseliggarens konsumentkarta (RÅ, mekanisk)

Genererad 2026-09-03. Rent kartläggningssvep av `EventLedgerType`
(`src/domain/entities/Narrative.ts:159-194`) och `game.eventLedger`
(`SaveGame.ts:584`, `EventLedgerEntry[]`, valfritt fält). Ingen tolkning.
Metod: grep + läsning av träffens fil (inte bara grep-raden), enligt
CLAUDE.md:s verifieringsprotokoll. Testfiler (`__tests__`, `.test.ts`)
exkluderade genomgående utom där explicit noterat.

Central skrivfunktion: `src/domain/services/eventLedgerService.ts:logEvent()`
— enda append-funktionen, tar `game` + färdig `EventLedgerEntry`, returnerar
ny array. Vissa producenter bygger entries som sedan slås ihop via
`src/domain/services/momentLedgerService.ts:appendMomentsAndEntriesToLedger`
(inte `logEvent` direkt) innan de hamnar i `game.eventLedger`.

Viktig strukturell observation som påverkar hela Tabell 1: `EventLedgerType`
delar 16 strängliteraler med en ÄLDRE, separat union `MemoryEventType`
(`src/domain/services/clubMemoryService.ts:19-23`). De 6 literalerna
`season_finish`/`cup_final`/`sm_final`/`derby_result`/`big_win`/`big_loss`
konstrueras ENDAST som `MemoryEvent`-objekt (typed `MemoryEventType`) av
`clubMemoryEventBuilders.ts:buildEventFromFixture` — beräknade live ur
`game.fixtures`, aldrig skrivna till `game.eventLedger` som
`EventLedgerEntry`. De räknas därför som NOLL PRODUCENTER för
`EventLedgerType` trots att strängen "produceras" i en annan, likbenämnd
union.

---

## Tabell 1 — Per EventLedgerType (34 medlemmar totalt)

| EventLedgerType | Producenter (fil:funktion) | Konsumenter (fil:funktion) | UI-yta |
|---|---|---|---|
| `season_finish` | ⚠ NOLL PRODUCENTER — deklarerad men aldrig konstruerad som `EventLedgerEntry`. Strängen konstrueras bara som `MemoryEvent` (annan union) i `clubMemoryEventBuilders.ts` (lokal funktion, ingen exporterad namngiven byggare för denna gren — inline i `buildEventFromFixture`, aldrig anropad). | ⚠ NOLL KONSUMENTER | ingen |
| `cup_final` | ⚠ NOLL PRODUCENTER (samma mönster, `clubMemoryEventBuilders.ts:buildEventFromFixture`, `MemoryEvent` inte `EventLedgerEntry`) | ⚠ NOLL KONSUMENTER | ingen |
| `sm_final` | ⚠ NOLL PRODUCENTER (samma) | ⚠ NOLL KONSUMENTER | ingen |
| `derby_result` | ⚠ NOLL PRODUCENTER (samma) | ⚠ NOLL KONSUMENTER | ingen |
| `big_win` | ⚠ NOLL PRODUCENTER (samma) | ⚠ NOLL KONSUMENTER | ingen |
| `big_loss` | ⚠ NOLL PRODUCENTER (samma) | ⚠ NOLL KONSUMENTER | ingen |
| `player_milestone` | `clubHistoryLedgerService.ts:buildPlayerMilestoneLedgerEntry` — anropad från `statsProcessor.ts:updatePlayerMatchStats` och `clubHistoryLedgerService.ts:backfillClubHistoryLedger` (save-migreringens strangler-backfill) | `clubMemoryService.ts:buildMemoryEventFromLedger` (switch-gren `case 'player_milestone'`) | `ClubMemoryView.tsx` (renderad från `ClubScreen.tsx` och `HistoryScreen.tsx`) |
| `academy_promotion` | `clubHistoryLedgerService.ts:buildAcademyPromotionLedgerEntry` — anropad från `academyActions.ts` (store-action, `logEvent`-anrop rad 348) och `backfillClubHistoryLedger` | `clubMemoryService.ts:buildMemoryEventFromLedger` | `ClubMemoryView.tsx` |
| `retirement` | `clubHistoryLedgerService.ts:buildRetirementLedgerEntry` — anropad från `seasonEndProcessor.ts:handleSeasonEnd` och `backfillClubHistoryLedger` | `clubMemoryService.ts:buildMemoryEventFromLedger` | `ClubMemoryView.tsx` |
| `facility_built` | `clubHistoryLedgerService.ts:buildFacilityBuiltLedgerEntry` — anropad från `roundProcessor.ts:advanceToNextEvent` och `backfillClubHistoryLedger` | `clubMemoryService.ts:buildMemoryEventFromLedger` (+`getFacilityNodeIdFromLedger`) | `ClubMemoryView.tsx` |
| `transfer_signed` | ⚠ NOLL PRODUCENTER — literal finns bara i unionsdefinitionerna (`Narrative.ts`, `clubMemoryService.ts`'s `MemoryEventType`), ingen konstruktion någonstans | ⚠ NOLL KONSUMENTER | ingen |
| `transfer_sold` | ⚠ NOLL PRODUCENTER (samma) | ⚠ NOLL KONSUMENTER | ingen |
| `patron_change` | ⚠ NOLL PRODUCENTER — literal finns bara i unionsdefinitionerna, ingen konstruktion. (Not: den faktiska anskaffnings-/uttågshändelsen bär typerna `patron_emerge`/`patron_withdrawal` istället, se Narrative.ts:176-183 kommentar) | ⚠ NOLL KONSUMENTER | ingen |
| `storyline_resolution` | `storylineLedgerService.ts:buildStorylineResolutionLedgerEntry` (byggare) + `appendNewlyResolvedStorylines` (skrivväg, `logEvent`) — anropad från `roundProcessor.ts:advanceToNextEvent`, `seasonEndProcessor.ts:handleSeasonEnd`, `journalistVisibilityService.ts:appendJournalistRelationshipStoryline`, `eventResolver.ts:resolveEvent`; även `clubHistoryLedgerService.ts:backfillClubHistoryLedger` | `storylineLedgerService.ts:getStorylineResolutionEntries`/`getResolvedStorylineProjections`/`hasPriorStorylineResolution` | Bredast spridda typen: `SeasonSummaryScreen.tsx`, `SquadScreen.tsx`, `MatchLiveScreen.tsx` (via `useMatchGenerator.ts`), `pressConferenceService.ts` → presskonferens-yta, `clubMemoryService.ts` → `ClubMemoryView.tsx`, `journalistVisibilityService.ts` → `JournalistRelationshipScene.tsx`/`JournalistSecondary.tsx` (Portal) |
| `scandal` | `clubHistoryLedgerService.ts:buildScandalLedgerEntry` — anropad från `eventProcessor.ts:processScandals` och `backfillClubHistoryLedger` | `clubMemoryService.ts:buildMemoryEventFromLedger` | `ClubMemoryView.tsx`. Osäkert/notabelt: `coffeeRoomService.ts` (kafferum) läser INTE `eventLedger` alls (0 träffar, verifierat) — en ev. kafferums-koppling till skandaler går i så fall via en annan datakälla (`game.activeScandals`/`scandalHistory` direkt), utanför liggaren. |
| `national_team_callup` | `clubHistoryLedgerService.ts:buildNationalTeamCallupLedgerEntry` — anropad från `nationalTeamService.ts` (callup-funktionen, `ledgerEntries`-fält) via `roundProcessor.ts:advanceToNextEvent`, samt `backfillClubHistoryLedger` | `clubMemoryService.ts:buildMemoryEventFromLedger` | `ClubMemoryView.tsx` |
| `decision` | Flera: `eventResolver.ts:resolveEvent` (interna hjälpare `appendSeasonDecisionLedgerEntry`, `appendDecisionConsequenceLedgerEntry`, `appendBurnoutDecisionLedgerEntry`, samt en inline-konstruktion för `burnoutCeiling` ~rad 2508); `weeklyDecisionService.ts:buildWeeklyDecisionLedgerEntry` (skrivs i `gameFlowActions.ts:resolveWeeklyDecision`); `seasonDecisionCaptureService.ts:buildDecisionLedgerEntry` (skrivs i `gameStore.ts:startFacilityBuildNode` och `gameFlowActions.ts:completeScene`); `burnoutReliefService.ts:buildBurnoutDecisionLedgerEntry`; `orsakVerkanService.ts:captureDecisionRipple`/`buildSystemRippleLedgerEntry` | `seasonDecisionCaptureService.ts:pickSeasonDecisionFromLedger`/`composeSeasonDecisionSentence`/`pickMostImportantDecisionText`; `burnoutReliefService.ts:getBurnoutSeasonMemory` (filtrerar `decision`+`manager_burnout`); `orsakVerkanService.ts:getLatestDecisionConsequence` — **ingen produktionsanropare hittad, bara `orsakVerkanService.test.ts`** | `SeasonSummaryScreen.tsx` (fältet `mostImportantDecision`, via `seasonEndProcessor.ts:handleSeasonEnd` → `pickMostImportantDecisionText`) och `managerSeason`-sektionen (via `getBurnoutSeasonMemory`). `getLatestDecisionConsequence`: ingen UI-yta (osäkert om avsiktligt orphanad eller ofärdig — inget produktionsanrop hittat). |
| `star_injury` | Moment-konstruktion i `roundProcessor.ts:advanceToNextEvent` (`source: 'star_injury'`) + parallell `orsakVerkanService.ts:buildSystemRippleLedgerEntry`-post, sammanslagna av `momentLedgerService.ts:appendMomentsAndEntriesToLedger` | `momentLedgerService.ts:getRecentMomentsFromLedger` (typfilter via `MOMENT_LEDGER_TYPES`); `clubMemoryService.ts:momentKind` (→ `'scar'`) | `ClubMemoryView.tsx` |
| `derby_win` | `roundProcessor.ts:advanceToNextEvent` (Moment `source: 'derby_win'`) + `buildSystemRippleLedgerEntry` | samma som `star_injury` (`momentKind` → `'triumph'`) | `ClubMemoryView.tsx` |
| `captain_crisis` | `playerStateProcessor.ts:applyCaptainMoraleCascade` (Moment), konsumerad in i `roundProcessor.ts:advanceToNextEvent` | `getRecentMomentsFromLedger`; `momentKind` → `'scar'` | `ClubMemoryView.tsx` |
| `nemesis_signed` | `transferProcessor.ts:executeAcceptedTransfers` (Moment `source: 'nemesis_signed'`) | `getRecentMomentsFromLedger`; `momentKind` → `'tension'` | `ClubMemoryView.tsx` |
| `rival_sale` | `transferProcessor.ts:executeAcceptedTransfers` | `getRecentMomentsFromLedger`; `momentKind` → `'scar'` | `ClubMemoryView.tsx` |
| `sponsor_positive` | `transferProcessor.ts:executeAcceptedTransfers` OCH `contextualSponsorService.ts:checkContextualSponsors` (tre konstruktionsställen i samma funktion) | `getRecentMomentsFromLedger`; `momentKind` → `'triumph'` | `ClubMemoryView.tsx` |
| `sponsor_negative` | `transferProcessor.ts:executeAcceptedTransfers` | `getRecentMomentsFromLedger`; `momentKind` → `'scar'` | `ClubMemoryView.tsx` |
| `mecenat_costshare` | `transferProcessor.ts:executeAcceptedTransfers` | `getRecentMomentsFromLedger`; `momentKind` → default `'neutral'` (ingen explicit case) | `ClubMemoryView.tsx` |
| `transfer_story` | `transferProcessor.ts:executeAcceptedTransfers` | `getRecentMomentsFromLedger`; `momentKind` → `'scar'` | `ClubMemoryView.tsx` |
| `season_highlight` | `seasonEndProcessor.ts:handleSeasonEnd` (Moment `source: 'season_highlight' as const`) | `getRecentMomentsFromLedger`; `momentKind` → `'triumph'` | `ClubMemoryView.tsx` |
| `era_shift` | `roundProcessor.ts:advanceToNextEvent` (Moment `source: 'era_shift'`) | `getRecentMomentsFromLedger`; `momentKind` → `'triumph'` | `ClubMemoryView.tsx` |
| `mecenat_withdrawal` | `orsakVerkanService.ts:buildSystemRippleLedgerEntry` — anropad från `roundProcessor.ts:advanceToNextEvent` (rad ~1048, `mecenat_left`-ripplen). Ingen motsvarande Moment (`mecenat_withdrawal` ingår INTE i `MomentSource`/`MOMENT_LEDGER_TYPES`) | ⚠ NOLL KONSUMENTER — ingen `entry.type === 'mecenat_withdrawal'`-träff någonstans utanför unionsdefinitionen | ingen |
| `patron_emerge` | `eventResolver.ts:resolveEvent` (inline-konstruktion, ~rad 910, villkorat `madeByPlayer`) | ⚠ NOLL KONSUMENTER | ingen |
| `patron_withdrawal` | Två ställen: `eventResolver.ts:resolveEvent` (hjälpfunktion `applyPatronHappiness`, `logEvent`-anrop rad 162) OCH `roundProcessor.ts:advanceToNextEvent` (inline, CS-evictionsvägen, rad ~1500). `patronWithdrawalService.ts:applyPatronHappinessTransition` bygger `.ledgerEntry`-kandidaten som `eventResolver.ts` sedan skriver — men `eventProcessor.ts`'s anrop av samma funktion (rad 443, patronkravs-uppföljning) LÄSER INTE `.ledgerEntry`-fältet, så den vägen skriver ingen post | ⚠ NOLL KONSUMENTER | ingen |
| `referee_feud` | `eventResolver.ts:resolveEvent` (inline, tröskelkorsning `clubReaction === -2`) | ⚠ NOLL KONSUMENTER | ingen |
| `referee_trust` | `eventResolver.ts:resolveEvent` (inline, tröskelkorsning `clubReaction === 2`) | ⚠ NOLL KONSUMENTER | ingen |
| `manager_burnout` | `burnoutReliefService.ts:buildBurnoutBeatLedgerEntry` — anropad tre gånger i `roundProcessor.ts:advanceToNextEvent` (mark/relief/close) | `burnoutReliefService.ts:hasPriorBurnoutEpisode`/`getBurnoutSeasonMemory`; `managerProfileService.ts:isBurnoutRelapse` | `BurnoutMark.tsx` (Portal, via `isBurnoutRelapse`); `SeasonSummaryScreen.tsx` `managerSeason`-sektion (via `getBurnoutSeasonMemory` → `seasonSummaryService.ts:generateSeasonSummary`) |

**Sammanräkning av ⚠-flaggor i Tabell 1:**
- NOLL PRODUCENTER: `season_finish`, `cup_final`, `sm_final`, `derby_result`, `big_win`, `big_loss`, `transfer_signed`, `transfer_sold`, `patron_change` — 9 st.
- NOLL KONSUMENTER (oavsett om de har producent): samma 9 ovan + `mecenat_withdrawal`, `patron_emerge`, `patron_withdrawal`, `referee_feud`, `referee_trust` — 14 st totalt.

---

## Tabell 2 — Per läsfunktion

Bas: `grep -rln "eventLedger" src/ --include="*.ts" --include="*.tsx" | grep -v __tests__ | grep -v ".test.ts"` gav 26 filer. Nedan varje funktion i dessa filer som faktiskt LÄSER `eventLedger` (filtrerar/itererar), inte bara skriver eller nämner det i kommentar/dokumentationssträng.

| Fil:funktion | Filtrerar på typer (lista) eller "läser alla generiskt" | UI-yta den matar | Producerar spelarsynlig sträng? |
|---|---|---|---|
| `clubMemoryService.ts:buildMemoryEventFromLedger` | `academy_promotion`, `national_team_callup`, `scandal`, `facility_built`, `retirement`, `player_milestone` (switch, `default: null`) | `ClubMemoryView.tsx` | ja (bygger `MemoryEvent.text`) |
| `clubMemoryService.ts:ledgerEntryBelongsToManagedClub` | läser alla generiskt (filtrerar på `subject`/`subject2`, inte på `type`) | `ClubMemoryView.tsx` (hjälpfunktion till ovan) | nej (bool) |
| `clubMemoryService.ts:momentKind` | de 11 `MomentSource`-typerna (`era_shift`, `rival_sale`, `star_injury`, `derby_win`, `captain_crisis`, `nemesis_signed`, `season_highlight`, `transfer_story`, `mecenat_costshare`, `sponsor_negative`, `sponsor_positive`) | `ClubMemoryView.tsx` | nej (returnerar `ActiveMemoryKind`, inte text) |
| `clubMemoryService.ts:collectSeasonEvents` (via `getResolvedStorylineProjections`) | `storyline_resolution` (indirekt) | `ClubMemoryView.tsx` | ja |
| `momentLedgerService.ts:getRecentMomentsFromLedger` | de 11 `MomentSource`-typerna (samma lista, `MOMENT_LEDGER_TYPES`) | `ClubMemoryView.tsx` | nej (returnerar rå entries, `ClubMemoryView`/`MOMENT_VIEW_TEMPLATES` gör texten) |
| `clubHistoryLedgerService.ts:backfillClubHistoryLedger` | skriver (inte läsning i konsumentmening) — dedupar mot `academy_promotion`/`national_team_callup`/`retirement`/`facility_built`/`scandal`/`player_milestone`/`storyline_resolution` via `CLUB_HISTORY_TYPES` | ingen (kedjan slutar i tjänstelager — migreringssteg, körs vid save-load) | nej |
| `clubHistoryLedgerService.ts:getPlayerMilestoneCodeFromLedger` | `player_milestone` | `ClubMemoryView.tsx` (via `clubMemoryService`) | nej (returnerar kod, inte text) |
| `clubHistoryLedgerService.ts:getFacilityNodeIdFromLedger` | `facility_built` | `ClubMemoryView.tsx` (via `clubMemoryService`) | nej (returnerar id) |
| `storylineLedgerService.ts:getStorylineTypeFromLedger` / `getStorylineIdFromLedger` | `storyline_resolution` | se `getResolvedStorylineProjections` nedan | nej (returnerar typ/id) |
| `storylineLedgerService.ts:getStorylineResolutionEntries` | `storyline_resolution` | se nedan | nej (rå entries) |
| `storylineLedgerService.ts:getResolvedStorylineProjections` | `storyline_resolution` | `SeasonSummaryScreen.tsx`, `SquadScreen.tsx`, `MatchLiveScreen.tsx`/`useMatchGenerator.ts`, `pressConferenceService.ts`, `clubMemoryService.ts`, `seasonSummaryService.ts`, `seasonDecisionsService.ts`, `seasonEndProcessor.ts`, `matchSimProcessor.ts` | ja (returnerar `StorylineEntry.displayText`) |
| `storylineLedgerService.ts:hasPriorStorylineResolution` | `storyline_resolution` (typparametrerad, `journalist_feud`/`journalist_redemption` i praktiken) | `journalistVisibilityService.ts` → `JournalistRelationshipScene.tsx`/`JournalistSecondary.tsx` | nej (bool) |
| `orsakVerkanService.ts:getLatestDecisionConsequence` | `decision` | **ingen produktionsanropare** (bara `orsakVerkanService.test.ts`) | n/a |
| `seasonDecisionCaptureService.ts:pickSeasonDecisionFromLedger` | tar redan förfiltrerad `entries`-lista (anroparen filtrerar på `type==='decision'`, se `pickMostImportantDecisionText`) | `SeasonSummaryScreen.tsx` | nej (returnerar entry) |
| `seasonDecisionCaptureService.ts:composeSeasonDecisionSentence` | `decision` (läser fälten på en given entry) | `SeasonSummaryScreen.tsx` | ja |
| `seasonDecisionCaptureService.ts:pickMostImportantDecisionText` | `decision` (filtrerar `game.eventLedger` explicit, rad 814: `e.type === 'decision' && e.season === season`) | `SeasonSummaryScreen.tsx` (`mostImportantDecision`) | ja |
| `burnoutReliefService.ts:hasPriorBurnoutEpisode` | `manager_burnout` | `BurnoutMark.tsx` (indirekt, via `managerProfileService.isBurnoutRelapse` — se not) | nej (bool) |
| `burnoutReliefService.ts:getBurnoutSeasonMemory` | `manager_burnout` + `decision` (prefixfilter `burnoutRelief:`) | `SeasonSummaryScreen.tsx` (`managerSeason`) | ja |
| `managerProfileService.ts:isBurnoutRelapse` | `manager_burnout` (prefixfilter `manager_burnout:mark:`) | `BurnoutMark.tsx` | nej (bool, styr vilken textmall `BurnoutMark.tsx` väljer) |
| `journalistVisibilityService.ts:hasPreviousSeasonRelationshipStory` → `isJournalistFeudRelapse`/`isJournalistRedemptionRelapse` | `storyline_resolution` (indirekt via `hasPriorStorylineResolution`) | `JournalistRelationshipScene.tsx`, `JournalistSecondary.tsx` | nej (bool) |
| `journalistVisibilityService.ts:appendJournalistRelationshipStoryline` | skriver, inte läsning (producent av `storyline_resolution`) | — | — |
| `eventResolver.ts:appendBurnoutDecisionLedgerEntry` | läser `entry.type === entry.type` för dedup (rad 139-142, jämför mot befintlig `type`+`semanticKey`+`season`+`matchday`) — dedup-läsning, inte typfilter i konsumentmening | ingen egen UI, skrivväg | nej |
| `eventResolver.ts:resolveEvent` (burnoutCeiling-grenen) | `decision` (dedup-check `entry.type === 'decision'`, rad 2501) | skrivväg, se `decision` i Tabell 1 | nej |
| `momentLedgerService.ts:appendMomentsAndEntriesToLedger`/`sameLedgerEvent` | läser alla generiskt (matchar på `type`+`season`+`matchday`+`subject`, oavsett vilken typ) för dedup/merge vid skrivtillfället | skrivväg | nej |
| `saveGameMigration.ts` (anropar `backfillClubHistoryLedger`) | se ovan | migreringssteg | nej |

**Explicit avstämning mot namngivna tjänster/ytor i uppdraget:**
- `clubMemoryService` — läser (se rader ovan).
- `momentLedgerService` — läser (se rader ovan).
- `clubHistoryLedgerService` — läser (backfill + två hjälpfunktioner), primärt en SKRIVtjänst.
- `storylineLedgerService` — läser (se rader ovan).
- `seasonSummaryService` — läser INDIREKT: `generateSeasonSummary` anropar `getResolvedStorylineProjections(game, ...)` och `getBurnoutSeasonMemory(game.eventLedger, ...)`. Ingen egen `.type ===`-filtrering i filen.
- `seasonDecisionCaptureService` — läser (se rader ovan), och är själv producenten för `decision`.
- `pressConferenceService` — läser INDIREKT ENDAST: filen innehåller inte strängen `eventLedger` (föll inte ut i grep-basen), men anropar `getResolvedStorylineProjections(game)` (rad 938) som i sin tur läser `game.eventLedger`. Ingen egen typfiltrering.
- journalist-tjänsterna (`journalistVisibilityService.ts`, `journalistService.ts`, `narrativeCoordinatorService.ts`, m.fl. — grep "journalist" gav 27 filer i `src/domain/services`) — av dessa läser bara `journalistVisibilityService.ts` faktiskt `eventLedger` (indirekt via `storylineLedgerService`). `journalistService.ts` konstruerar `'big_win'`/`'big_loss'`-liknande `ResultBucket`-strängar men det är en LOKAL union för rubriktext, inte `EventLedgerType` — läser inte `game.eventLedger`.
- `HistoryScreen.tsx` — läser INDIREKT: filen nämner inte `eventLedger` direkt, men importerar `buildBlodslinje` från `ClubMemoryView.tsx`, som anropar `clubMemoryService.ts:getClubMemory(game)`, som i sin tur läser `game.eventLedger` via `buildMemoryEventFromLedger` m.fl. Två lager indirektion.
- `boardService.ts` — **läser inte `eventLedger` alls** (0 träffar, verifierat direkt i filen). Referens i uppdragstexten till boardService som ledger-läsare är alltså felaktig, om en sådan förväntan fanns.
- portal-kortgeneratorer (`src/domain/services/portal/*.ts`, sökt på `[Cc]ard`) — `initCardBag.ts`, `dashboardCardBag.ts`, `portalBuilder.ts`, `pickEfterklang.ts`, `inboxToPortal.ts`, `seasonPhaseBias.ts` gav träffar på "journalist"/"card" men **ingen av dem innehåller strängen `eventLedger`** (verifierat via samma grep-bas — ingen av portal-filerna fanns i 26-filerslistan). Portalen läser alltså INTE händelseliggaren direkt någonstans i nuvarande kod.
- `coffeeRoomService.ts` (kafferum) — **läser inte `eventLedger` alls** (0 träffar, verifierat direkt i filen).

---

## Tabell 3 — Meningslagren

### MOMENT_VIEW_TEMPLATES
Definition: `src/domain/data/momentViewTemplates.ts:41`, typad
`Record<MomentSource, MomentTemplate>` — TypeScript tvingar exakt en nyckel
per `MomentSource`-medlem, varken fler eller färre.

**Har mall (11 st, identiska med `MomentSource`-unionen i `Moment.ts`):**
`derby_win`, `star_injury`, `mecenat_costshare`, `captain_crisis`,
`nemesis_signed`, `sponsor_positive`, `sponsor_negative`, `transfer_story`,
`season_highlight`, `era_shift`, `rival_sale`.

**Saknar mall (23 av 34 `EventLedgerType`-medlemmar — alla utanför `MomentSource`):**
`season_finish`, `cup_final`, `sm_final`, `derby_result`, `big_win`,
`big_loss`, `player_milestone`, `academy_promotion`, `retirement`,
`facility_built`, `transfer_signed`, `transfer_sold`, `patron_change`,
`storyline_resolution`, `scandal`, `national_team_callup`, `decision`,
`mecenat_withdrawal`, `patron_emerge`, `patron_withdrawal`, `referee_feud`,
`referee_trust`, `manager_burnout`.

### momentKind-mappning
Definition: `src/domain/services/clubMemoryService.ts:383`, funktion
`momentKind(source: MomentSource): ActiveMemoryKind`. Signaturen accepterar
ENDAST `MomentSource` (11 värden) — de övriga 23 `EventLedgerType`-medlemmarna
kan inte ens skickas in, de faller utanför funktionens definitionsmängd helt.

**Mappning (explicita `case`-grenar):**
- `'triumph'`: `derby_win`, `sponsor_positive`, `era_shift`, `season_highlight`
- `'scar'`: `star_injury`, `rival_sale`, `captain_crisis`, `sponsor_negative`, `transfer_story`
- `'tension'`: `nemesis_signed`
- `'neutral'` (default-gren, ingen explicit `case`): `mecenat_costshare` — enda `MomentSource`-medlemmen utan egen `case`-rad, faller igenom till `default: return 'neutral'`.

**Utanför mappningen helt (kan inte anropa funktionen med dessa — 23 st, samma lista som "saknar mall" ovan):**
`season_finish`, `cup_final`, `sm_final`, `derby_result`, `big_win`,
`big_loss`, `player_milestone`, `academy_promotion`, `retirement`,
`facility_built`, `transfer_signed`, `transfer_sold`, `patron_change`,
`storyline_resolution`, `scandal`, `national_team_callup`, `decision`,
`mecenat_withdrawal`, `patron_emerge`, `patron_withdrawal`, `referee_feud`,
`referee_trust`, `manager_burnout`.

---

## Sammanfattning

```
Antal EventLedgerType: 34
Antal med ≥1 konsument: 20
Antal skriv-bara (≥1 producent): 25
Antal utan producent: 9
Antal utan vymall (MOMENT_VIEW_TEMPLATES): 23
```
