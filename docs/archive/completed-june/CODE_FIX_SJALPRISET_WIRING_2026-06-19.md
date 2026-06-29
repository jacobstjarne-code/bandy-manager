# CODE-FIX — Själ-priset: end-to-end-wiring (hall-omarbetet, uppföljning till db6d0e32)

**Datum:** 2026-06-19
**Från:** Opus (verifiering av db6d0e32)
**Problem (ordern var ofullständig — inte utförandet):** Omarbetet (db6d0e32) byggde exakt det `CODE_UPPDRAG_HALLPROVNING_OMARBETE_2026-06-19.md` bad om. Den ordern §5 BESKREV Själ-priset som vad som händer i matchen ("när stage==='klar', byt poolen i matchCore") — alltså konsumentsidan — men specade ALDRIG kedjan som måste producera det: bygge→klar-transitionen, hasIndoorArena-propageringen, hallInomhus-flaggan vid sim-anroparen. Code byggde konsumenten korrekt och hade ingen order att bygga producenten. Luckan är Opus orderns, inte Code:s. Denna fix tillför det ordern saknade.

## Verifierat trasig kedja (mot källan)
1. **`hallProcessService` transitionerar aldrig `bygge → klar`.** `generateHallProcessEvent` case 'bygge' ger BARA `buildFordyringEvent`. Inget gör stage → 'klar'.
2. **`facilityService.advanceFacilityState` sätter inte stage='klar' och inte `hasIndoorArena`.** När matchhall-noden blir klar lägger den till noden i `builtNodeIds` + `lastCompleted` — inget mer. Trial fastnar på 'bygge', klubben får aldrig `hasIndoorArena = true`.
3. **`matchSimProcessor` sätter aldrig `hallInomhus`** i `simulateMatch({...})`-anropet. matchCore läser `input.hallInomhus` i atmosphere-väljaren, men sim-vägen (där de flesta matcher körs) sätter den aldrig → HALL_ATMOSPHERE fyrar aldrig.

(Dessutom oklart: **vem startar `startFacilityBuild('matchhall')`** när stage → 'bygge'? Verifiera — annars byggs noden aldrig och completion-steget nås aldrig.)

## Fix — wira hela kedjan, verifiera varje led mot kod först

### Led A — bygget startar
Verifiera att forhandling-resolutionen (stage → 'bygge' i eventResolver) OCKSÅ anropar `startFacilityBuild('matchhall', facilityState, currentMatchday)`. Om inte: wira det. Utan detta får `advanceFacilityState` aldrig en aktiv matchhall att färdigställa.

### Led B — completion sätter klar + hasIndoorArena
Där facility-completion konsumeras (sannolikt `communityProcessor`/`roundProcessor` som anropar `advanceFacilityState`): när `completedNodeId === 'matchhall'`:
- sätt `facilityState.hallTrial.stage = 'klar'`
- sätt managed-klubbens `hasIndoorArena = true`
(Antingen i advanceFacilityState när noden är hall, eller i anroparen. Välj EN plats, inte båda.)

### Led C — sim-anroparen sätter flaggan
I `matchSimProcessor.simulateRound`, `simulateMatch({...})`-anropet: lägg till
`hallInomhus: isManagedHome && (homeClub?.hasIndoorArena ?? false)`
Så bytet fyrar bara för managed-klubbens HEMMAMATCHER i byggd hall (poolerna är skrivna ur den klubbens perspektiv — "Sorlet studsar i taket"). AI-klubbar med hall ska INTE få poolen (texten är managed-specifik).

### Led D — live-vägen
Verifiera `useMatchGenerator`/`MatchLiveScreen` sätter `hallInomhus` på SAMMA villkor (isManagedHome && hall klar). Om sim och live divergerar blir Själ-priset inkonsekvent.

## Gate
build + test + lint:design. Lägg ett test: managed-klubb med `hasIndoorArena=true` + hemma → `hallInomhus=true` skickas till simulateMatch; borta eller AI-hall → false. Rapportera commit + var varje led (A–D) wirades, eller om något redan var wirat (då: var).

## Sekundär flagga (ej i denna fix — Jacob/playtest avgör)
`buildForhandlingEvent`: båda `kommunens_villkor`-valen (ungdomstimmar/delad drift) går direkt till stage 'bygge'. Kommunen säger alltså alltid ja — 06-12 §3:s relations-gatade NEJ-utfall (cooldown 2, kräver bättre relation) är i praktiken onåbart, och patron-pathen likaså (fh2 nås bara om fh1 ej resolveras). Är det avsiktlig v1-förenkling, eller ska kommunrelationen kunna ge NEJ? Bekräfta innan det cementeras.
