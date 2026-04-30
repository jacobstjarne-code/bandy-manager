# Diagnos: SPEC_BESLUTSEKONOMI — Steg 1

**Datum:** 2026-04-30
**Syfte:** Tre faktarapporter som underlag för Steg 2-spec. Inga kodändringar.

---

## Rapport A — Varför triggar inte söndagstränings-scenen?

### Steg 1: Är `scenesEnabled` satt till `true` på nya saves?

❌ **Fältet finns inte.**

`createNewGame.ts` skapar inget fält som heter `scenesEnabled`. Det finns inte i `SaveGame`-entityn (`src/domain/entities/SaveGame.ts:62`) och det finns ingen migration som sätter det. Spec-dokumentet refererade till `game.scenesEnabled` men det har aldrig implementerats.

Däremot finns `shownScenes?: SceneId[]` (rad 65 i `SaveGame.ts`), och `shouldTriggerSundayTraining` använder `game.shownScenes ?? []` korrekt. Det saknade fältet `scenesEnabled` är alltså inte rotorsaken — scen-systemet använder en annan guard.

### Steg 2: Anropas `detectSceneTrigger(game)` i `roundProcessor`?

✅ **Ja, anropas.**

`roundProcessor.ts:26` importerar `detectSceneTrigger`. `roundProcessor.ts:1215` anropar den som:

```typescript
const sceneId = detectSceneTrigger(updatedGame)
```

Villkoret är `if (!updatedGame.pendingScene)` (rad 1214) — triggas alltså bara om det inte redan finns en väntande scen.

### Steg 3: Returnerar `detectSceneTrigger` `'sunday_training'` för rätt säsong/omgång?

❌ **Bryter — `game.currentMatchday` är aldrig satt vid triggtillfället.**

`shouldTriggerSundayTraining` i `sceneTriggerService.ts:41-47` kontrollerar:

```typescript
export function shouldTriggerSundayTraining(game: SaveGame): boolean {
  if (game.currentSeason !== 1) return false
  const matchday = game.currentMatchday ?? 0   // rad 43
  if (matchday > 2) return false
  if ((game.shownScenes ?? []).includes('sunday_training')) return false
  return true
}
```

`game.currentMatchday` är ett optional fält (`SaveGame.ts:62`). Det sätts **aldrig** i `roundProcessor.ts` på `updatedGame`-objektet — det saknas helt i det stora spread-objektet (rad 982-1099). Fältet finns alltså som `undefined` på alla saves, vilket ger `matchday = 0`.

Villkoret `matchday > 2` passeras (`0 > 2 = false`), och `currentSeason` är 1 om man är i säsong 1. Tekniskt sett *borde* scenen trigga — men se steg 4 nedan.

Detsamma gäller `shouldTriggerSeasonSignature` (rad 33): `if (game.currentMatchday !== 1) return false` — med `currentMatchday = undefined` evalueras `undefined !== 1` till `true`, vilket blockerar den scenen.

**Notera:** `shouldTriggerCoffeeRoom` använder `game.currentMatchday ?? 0` (rad 81) och jämför mot `lastCoffeeSceneRound`. `completeScene` i `gameFlowActions.ts:403` sätter `lastCoffeeSceneRound = updatedGame.currentMatchday ?? 0` — d.v.s. alltid 0 — vilket gör att cooldown aldrig fungerar korrekt.

### Steg 4: Sätts `game.pendingScene` korrekt?

⚠️ **Villkorligt korrekt, men körs troligen aldrig.**

`roundProcessor.ts:1214-1226`:

```typescript
if (!updatedGame.pendingScene) {
  const sceneId = detectSceneTrigger(updatedGame)
  if (sceneId) {
    const isRecurring = sceneId === 'coffee_room'
    const alreadyShown = (updatedGame.shownScenes ?? []).includes(sceneId)
    if (isRecurring || !alreadyShown) {
      updatedGame = {
        ...updatedGame,
        pendingScene: { sceneId, triggeredAt: updatedGame.currentDate },
      }
    }
  }
}
```

Om `detectSceneTrigger` returnerar ett värde sätts `pendingScene` korrekt. Men eftersom `shouldTriggerSundayTraining` returnerar `true` (med `currentMatchday = 0`) borde scenen faktiskt trigga i säsong 1, omgång 1-2.

**Trolig verklig orsak till att scenen inte syns:** Se steg 5.

### Steg 5: Plockar AppRouter upp `pendingScene` och renderar `SceneScreen`?

✅ **Ja, mekanismen finns — men blockeras av `EventOverlay`.**

`AppRouter.tsx:74`:

```typescript
if (game?.pendingScene) return <SceneScreen />
```

Denna kontroll sitter i `DashboardOrPortal` — den renderas när spelaren navigerar till `/game/dashboard`.

**Men:** `EventOverlay` är monterat i `GameShell` (rad 54) och renderar som ett fullskärmsoverlay *ovanpå* allt. `EventOverlay` kontrollerar inte `pendingScene`. Den visar alla oavklarade `pendingEvents` en och en — och blockerar hela skärmen tills de är klara.

**Kedjan:** Match avslutas → `advance(true)` körs → roundProcessor genererar events till `pendingEvents` OCH sätter `pendingScene` → MatchLiveScreen navigerar till `/game/review` → spelaren klickar "Granska" → navigerar till `/game/dashboard` → `DashboardOrPortal` försöker rendera `<SceneScreen />` — men `GameShell`-mountad `EventOverlay` tar hela skärmen med alla oavklarade events → spelaren ser aldrig scenen förrän alla events är klickade igenom.

**Dessutom:** `GranskaScreen` (review) hanterar `pendingEvents` direkt i sin vy (rad 203-330 i GranskaScreen.tsx). Om spelaren klickar igenom events i GranskaScreen och sedan navigerar till dashboard — är events lösta och `pendingScene` borde visas. Men om spelaren hoppar direkt till `/game/dashboard` blockerar `EventOverlay` scenen.

### Sammanfattning Rapport A

| Steg | Status | Fil:rad |
|------|--------|---------|
| 1. `scenesEnabled`-flagga | ❌ Finns inte — inte rotorsaken | `SaveGame.ts` — saknar fält |
| 2. `detectSceneTrigger` anropas | ✅ | `roundProcessor.ts:1215` |
| 3. `shouldTriggerSundayTraining` | ⚠️ Returnerar `true` men `currentMatchday` sätts aldrig | `sceneTriggerService.ts:41-47` / `roundProcessor.ts:982-1099` |
| 4. `pendingScene` sätts | ✅ Om trigger returnerar värde | `roundProcessor.ts:1220-1225` |
| 5. `AppRouter` renderar SceneScreen | ❌ Blockeras av `EventOverlay` | `GameShell.tsx:54` / `AppRouter.tsx:74` |

**Rotorsak:** `EventOverlay` har ingen kännedom om `pendingScene` och blockerar hela skärmen med events tills alla är klickade. Scenen renderas aldrig av spelaren för att den döljs bakom event-överlägget. Sekundärt: `currentMatchday` sätts aldrig på `updatedGame` i roundProcessor, vilket gör att cooldowns och trigger-villkor som använder det fältet inte fungerar korrekt.

---

## Rapport B — Vad händer exakt mellan match-slut och Portal-rendering?

Numrerad kedja med filnamn:radnummer.

1. **Match simuleras klart i `MatchLiveScreen`** (`src/presentation/screens/MatchLiveScreen.tsx:209-276`). `useEffect([matchDone])` körs när `matchDone` blir true.

2. **`saveLiveMatchResult(...)` anropas** (`MatchLiveScreen.tsx:270-274`). Sparar matchresultat och statistik på fixture-objektet i store.

3. **`advance(true)` anropas** (`MatchLiveScreen.tsx:275`). `suppressMatchNavigation = true`.

4. **`advanceToNextEvent(game)` körs** i `gameFlowActions.ts:45` (som re-exporteras från `roundProcessor.ts`). Hela `roundProcessor` körs synkront:
   - Simulerar AI-matcher för omgången
   - Kör `eventProcessor` → genererar events till `allNewEvents` (se Rapport C)
   - Kör `playoffProcessor`, `youthProcessor` → kan lägga fler events i `allNewEvents`
   - Kör `mecenatService` → kan lägga fler events
   - Kör `arcService` → kan lägga events i `pendingEvents` via `arcResult.newEvents`
   - Sätter `pendingScene` om `detectSceneTrigger` returnerar något (rad 1213-1226)
   - Genererar inbox-items från: träning, match-sim, skador, suspensioner, scouts, narrativ, playoff, cup, derby-notiser, board, sponsorer, transfers, market values, arcs, journalist-relationer, follow-ups

5. **Auto-advance loop** (`gameFlowActions.ts:51-63`): Om managed club saknar fixture på nästa matchday, körs `advanceToNextEvent` igen automatiskt (max 10 loopar). Varje loop kan generera fler events.

6. **State sparas** (`gameFlowActions.ts:165`): `set({ game: gameToSave, ... })` — `pendingEvents` innehåller nu alla ackumulerade events.

7. **Navigation sker inte** från `gameFlowActions` eftersom `suppressMatchNavigation = true` (rad 174 i `gameFlowActions.ts` — blocket hoppas över).

8. **`MatchLiveScreen` visar "Klart"-knapp** via `CommentaryFeed` (`MatchLiveScreen.tsx:1067`). Spelaren klickar `onNavigateToReview` → navigerar till `/game/review`.

9. **`GranskaScreen` renderas** (`src/presentation/screens/GranskaScreen.tsx`). Här visas: matchstatistik, poängtabell, inbox-preview. `pendingEvents` visas inline i GranskaScreen (rad 330) som klickbara kort — *utöver* att `EventOverlay` också är aktivt.

10. **Spelaren navigerar till `/game/dashboard`** (via BottomNav eller knapp).

11. **`DashboardOrPortal` körs** (`AppRouter.tsx:60-76`):
    - Kontrollerar `game.pendingScreen` → om satt, navigerar till BoardMeeting/PreSeason/HalfTime/PlayoffIntro/QFSummary/SeasonSummary
    - Om `pendingScene` är satt → renderar `<SceneScreen />`
    - Annars → renderar `<PortalScreen />`

12. **`EventOverlay` körs parallellt** (`GameShell.tsx:54`). Om `pendingEvents` har oavklarade events och spelaren inte är på `/game/match/live`, `/game/match`, `/game/match-result`, eller `/game/review` — täcker `EventOverlay` hela skärmen med events.

13. **Portal/SceneScreen syns inte** förrän alla `pendingEvents` är lösta och `EventOverlay` returnerar `null` (`EventOverlay.tsx:46`).

**Anmärkningsvärt:** Det finns inget hårdkodat max för antal events i `EventOverlay`. Den visar alla oavklarade events, en åt gången, med räknaren "X händelser kvar". Ingen timeout, ingen automatisk dismissal (förutom auto-resolve av pressConference utan journalist, rad 38-43).

**`pendingScreen` vs `pendingEvents` vs `pendingScene`:** Tre parallella mekanismer som inte koordineras:
- `pendingScreen` (enum) → navigerar till dedikerad skärm via `DashboardOrPortal` useEffect
- `pendingEvents` (array) → visas via `EventOverlay` som fullskärmsoverlay
- `pendingScene` → renderas via `DashboardOrPortal` istf PortalScreen

Dessa tre konkurrerar utan prioritetsordning.

---

## Rapport C — Alla event-typer som genereras idag

### Kategori 1: `pendingEvents` (visas via `EventOverlay` som overlay-stack)

Källfiler och ungefärlig frekvens per säsong (22 liga-omgångar + cup + eventuellt slutspel).

| Event-typ | Genereras i | Frekvens/säsong (uppskattad) | Notering |
|-----------|-------------|------------------------------|----------|
| `pressConference` | `pressConferenceService.ts` via `postAdvanceEvents.ts:43` | 8-15 (efter varje managedmatch) | Eget visningsläge via `PressConferenceScene` |
| `transferBidReceived` | `postAdvanceEvents.ts:50-109` | 0-4 | Max 2 per round-körning |
| `contractRequest` | `postAdvanceEvents.ts:114-130` | 1-4 (på runda 5/10/15/20) | |
| `playerUnhappy` | `postAdvanceEvents.ts:134-157` | 0-3 | |
| `starPerformance` | `postAdvanceEvents.ts:161-191` | 0-5 | 50% chans per match med ratings |
| `dayJobConflict` | `postAdvanceEvents.ts:195-226` | 0-3 (15% chans per round) | |
| `hesitantPlayer` | `postAdvanceEvents.ts` | 0-2 | |
| `bidWar` | `postAdvanceEvents.ts` | 0-1 | |
| `sponsorOffer` | `postAdvanceEvents.ts` + `sponsorEvents.ts` | 0-3 | |
| `patronEvent` | `patronEvents.ts` | 1-4 (baserat på patron-relation) | |
| `politicianEvent` | `politicianEvents.ts` | 1-3 | |
| `hallDebate` | `hallDebateEvents.ts` | 0-2 (omg 10+, max var 4:e round) | |
| `communityEvent` | `communityActivitiesEvents.ts` | 2-6 | |
| `supporterEvent` | `supporterEvents.ts` | 1-4 | |
| `playerArc` | `arcService.ts` via `progressArcs` | 0-6 (arcs span 3-8 omgångar) | Läggs direkt i `pendingEvents` |
| `mecenatInteraction` | `mecenatService.ts` | 0-2 | |
| `mecenatEvent` | `eventProcessor.ts:183` | 0-1 (middagshändelse) | Eget visningsläge via `MecenatDinnerEvent` |
| `mecenatWithdrawal` | `eventProcessor.ts:267` | 0-1 | |
| `economicStress` | `eventFactories.ts` via `eventProcessor.ts` | 0-3 | |
| `criticalEconomy` | `economicCrisisService.ts` | 0-2 | |
| `bandyLetter` | `bandyLetterService.ts` | 0-2 | |
| `schoolAssignment` | `schoolAssignmentService.ts` | 0-2 | |
| `riskySponsorOffer` | `eventProcessor.ts:371` | 0-1 | |
| `academyEvent` | `youthProcessor.ts:103-169` | 0-4 | |
| `playoffEvent` | `playoffProcessor.ts:166-171` | 0-2 (om slutspel) | |
| `retirementCeremony` | `retirementService.ts` | 0-2 | |
| `journalistExclusive` | `eventFactories.ts` | 0-2 | |
| `refereeMeeting` | `refereeService.ts` | 0-1 | |
| `varsel` | `eventFactories.ts` | 0-1 | |
| `captainSpeech` | `postAdvanceEvents.ts:368-` | 0-1 per säsong | |
| `playerPraise` | `postAdvanceEvents.ts` | 0-3 | |
| `playerMediaComment` | `postAdvanceEvents.ts` | 0-2 | |

**Totalt uppskattad volym:** 30-80 events per säsong via `pendingEvents`. Inga caps på total längd på kön. `postAdvanceEvents.ts` har lokalt cap på 2 per anrop, men `communityEvents.ts` har inget cap — och alla sex sub-generators (patron, politiker, sponsor, klack, community activities, character players) summeras utan tak.

### Kategori 2: Inbox (visas i `InboxScreen`, aldrig som overlay)

| Vad | Genereras i | Frekvens/säsong |
|-----|-------------|-----------------|
| Matchresultat | `inboxService.ts:createMatchResultItem` | 22+ (varje match) |
| Skador | `roundProcessor.ts:316`, `processors/playerStateProcessor` | 0-6 |
| Suspensioner | `roundProcessor.ts:430` | 0-2 |
| Återhämtning | `roundProcessor.ts:437` | 0-4 |
| Träningsbeskeder | `trainingProcessor.ts:59,96` | 1-5 |
| Scouting-rapport | `scoutProcessor.ts:56,89` | 0-4 |
| Transfersvar | `transferProcessor.ts:85-177` | 0-4 |
| Board-feedback | `roundProcessor.ts:460-475` | 2-6 |
| Cup-meddelanden | `cupProcessor.ts` | 0-4 |
| Derby-notiser | `narrativeProcessor.ts:processUpcomingDerbyNotification` | 0-3 |
| Sponsorbesked | `sponsorProcessor.ts` | 0-6 |
| Marknadsvärdeschanser | `roundProcessor.ts:1103` | 0-4 |
| Journalist-relationsevents | `roundProcessor.ts:1228-1257` | 0-2 |
| Arc-inbox | `arcService.ts` via `arcResult.newInboxItems` | 0-6 |
| Board objectives | `boardObjectiveService.ts` | 0-4 |
| Community/politik | `communityProcessor.ts` | 1-4 |
| Youth-intake | `youthProcessor.ts:68` | 0-2 |
| Ekonomivarningar | `eventProcessor.ts:148-165` | 0-3 |
| Follow-ups | `roundProcessor.ts:1136-1166` | 0-4 |
| Säsongsspecifika (finaldag, annandag) | `roundProcessor.ts:107-169` | 0-2 |
| Journalist-relation | `journalistVisibilityService.ts` | 0-2 |

**Totalt uppskattad inbox-volym:** 50-120 items per säsong.

### Kategori 3: Scenes (visas via `SceneScreen` — ersätter PortalScreen)

| Scen | Trigger | Fil | Frekvens |
|------|---------|-----|----------|
| `sunday_training` | Säsong 1, matchday ≤ 2, ej visad | `sceneTriggerService.ts:41` | 1×/karriär |
| `sm_final_victory` | Vann SM/cup-final, ej visad | `sceneTriggerService.ts:49` | 0-1×/karriär |
| `season_signature_reveal` | Matchday 1, ej visad denna säsong | `sceneTriggerService.ts:32` | 0-1×/säsong |
| `coffee_room` | Cooldown ≥3 omgångar sedan sist, eller override-triggers | `sceneTriggerService.ts:77` | 4-8×/säsong |
| `journalist_relationship` | Manuellt via `triggerJournalistScene` | `gameFlowActions.ts:432` | 0-2×/säsong |

### Kategori 4: Pendingscreen (navigerar till dedikerad skärm)

| Skärm | Trigger | Frekvens |
|-------|---------|----------|
| `BoardMeeting` | Säsongsstart | 1×/säsong |
| `PreSeason` | Efter board meeting | 1×/säsong |
| `HalfTimeSummary` | Omgång 11, efter match | 1×/säsong |
| `PlayoffIntro` | Kvartsfinal nådd | 0-1×/säsong |
| `QFSummary` | Kvartsfinalserie klar | 0-1×/säsong |
| `SeasonSummary` | Säsongsslut | 1×/säsong |

### Kategori 5: Portal-beats (visas i PortalScreen som ett kort, inte overlay)

Genereras av `portalBeatService.ts`. Conditions-baserade one-shot-notiser som visas direkt i Portal-vyn. Ingen overlay. Frekvens: 3-8 beats per säsong.

### Kategori 6: Coffee room / kafferum (visas i PortalScreen)

`coffeeRoomService.ts` genererar kafferums-citat som visas antingen via `coffee_room`-scen eller som `coffeeRoomQuote` direkt på Portal-vyn. Frekvens: varje omgång om ingen scen (faller tillbaka på statisk visning).

### Kategori 7: Presskonferens (dubbel implementation)

⚠️ **Oklart, se nedan.**

Det finns två vägar för presskonferenser:
1. `simResult.pressEvent` från `matchSimProcessor` → `roundProcessor.ts:1040` → `pendingPressConference` (visas i GranskaScreen inline)
2. `generatePressConference()` i `postAdvanceEvents.ts:43` → `pendingEvents` → visas via `EventOverlay`

Dessa är troligen separata triggers med olika villkor, men det är oklart om de kan trigga samtidigt. Se `pressConferenceService.ts` och `matchSimProcessor.ts` för fullständig klarhet.

---

## Slutsatser för Steg 2

1. **`currentMatchday` på SaveGame** måste sättas i `roundProcessor.ts` (mappa från `nextMatchday`). Utan det fungerar inte scene-triggers som använder det fältet.

2. **`EventOverlay` och `pendingScene` konkurrerar** utan koordinering. `EventOverlay` bör respektera `pendingScene` (ej visa events när en scen väntar), eller scener bör prioriteras in före events i `DashboardOrPortal`.

3. **Ingen total kö-cap.** `pendingEvents` kan växa till 14+ utan tak. `postAdvanceEvents` har lokalt cap på 2, men `communityEvents` och arc-events har ingen begränsning. En säsong genererar troligen 30-80 events totalt i `pendingEvents`.

4. **Tre parallella mekanismer** (`pendingScreen`, `pendingEvents`, `pendingScene`) koordineras inte. Prioritetsordningen är implicit och opålitlig.
