# Diagnos: Scoreboard fastnar på 0–0 / 0' — matchDone sätts aldrig

**Datum:** 2026-05-04  
**Fil:** `src/presentation/screens/MatchLiveScreen.tsx`  
**Symptom:** Live-match (commentary-läge) kör kommentarsfeed till 90' med slutsignal, men scoreboard visar 0–0 / 0', och matchDone sätts aldrig till true. Navigering blockeras för alltid.

---

## Hypoteser — utfall

| Hypotes | Status |
|---------|--------|
| H1: `regenerateRemainderWithUpdatedScore` returnerar kortare array, `currentStep` pekar utanför | Delvis felaktigt — funktionen returnerar korrekt `[...slice(0, currentStep+1), ...newRemainder]`. Inte rotorsaken. |
| H2: `setSteps` i handler returnerar array där `currentStep` hamnar utanför bounds | Inte direkt — men indirekt, se H3. |
| H3: Dubbel-inkrement — timer-effekten + handler's externa setTimeout båda ökar `currentStep` från samma bas | **BEKRÄFTAD ROTORSAK** |

---

## Rotorsak

**En rad:** Det externa `setTimeout(() => setCurrentStep(prev => prev + 1), 50ms)` i varje interaktiv handler (handleCornerChoice, handlePenaltyChoice, handleCounterChoice, handleFreeKickChoice) körs parallellt med timer-effektens eget `setCurrentStep`, och den tidiga vaktkontrollen `if (currentStep >= steps.length) return` på rad 287 förhindrar att `setMatchDone(true)` någonsin anropas när `currentStep` skjuter förbi `steps.length - 1`.

---

## Exakt felsekvens

**Förutsättning:** Commentary-läge (50ms delays). Interaktiv händelse (t.ex. hörna) inträffar nära matchslut — t.ex. `currentStep = steps.length - 2`.

1. **Timer-effektens `setTimeout` (25ms)** körs: `currentStep + 1 < steps.length` → `setCurrentStep(prev => prev + 1)`. `currentStep` = `steps.length - 1`.

2. React re-renderar. Timer-effekten re-kör (deps `[currentStep, steps]` ändrades), cancellar gamla timern, sätter ny 25ms-timer från `currentStep = steps.length - 1`.

3. Auto-resolve av interaktiv händelse har skett: handler kallar `setSteps(...)` och schemalägger `setTimeout(() => setCurrentStep(prev => prev + 1), 50ms)`. Det externa setTimeout-et är **inte** kopplat till effektens cleanup — det cancellas aldrig.

4. `setSteps` triggar ny re-render. Timer-effekten re-kör igen (deps ändrades). Ny timer startas.

5. **Ny timer (25ms)** körs: `currentStep + 1 >= steps.length`? Troligtvis `steps.length - 1 + 1 = steps.length`, dvs. ja → `setMatchDone(true)` borde sättas... men detta kan preemptas av nästa steg.

6. **Handlers externa setTimeout (50ms)** körs: `setCurrentStep(prev => prev + 1)`. Nu är `currentStep = steps.length` (ett steg förbi slutet).

7. Timer-effekten re-kör med `currentStep = steps.length`. **Rad 287:** `if (currentStep >= steps.length) return` — returnerar omedelbart. Ingen timer sätts. `setMatchDone(true)` anropas aldrig.

8. **Stuck state:** `currentMatchStep = null` (rad 969: `currentStep >= steps.length`), `homeScore = 0`, `awayScore = 0`, `currentMinute = 0`. `matchDone = false`. Feeden visade sista steget innan overshooten — inklusive fulltime-kommentaren — men UI låses.

---

## Var i koden buggen uppstår

**Rad 287–288** (timer-effektens vaktkontroll):
```ts
if (currentStep < 0 || currentStep >= steps.length) return
```

Denna vaktkontroll är korrekt och nödvändig för normala tillstånd, men blir en fälla när `currentStep` via dubbel-inkrement hamnar på exakt `steps.length` (ett steg förbi). Det finns ingen recovery-path därifrån — varken för `setMatchDone(true)` eller för `setCurrentStep`.

**Sekundär lokus — varje interaktiv handler (exemplet från handleCornerChoice, rad 578–582):**
```ts
setTimeout(() => {
  setActiveCorner(null)
  setCornerOutcome(null)
  setCurrentStep(prev => prev + 1)  // ← ej cancellbar, konkurerar med timer-effekten
}, isFastForward || isCommentaryMode ? 50 : 1500)
```

Varje handler har exakt samma mönster. I commentary-läge är 50ms tillräckligt kort för att timer-effektens cleanup inte hinner cancella det externa timeout-et.

---

## Scoreboard 0–0 / 0' — förklaring

`homeScore`, `awayScore`, och `currentMinute` beräknas på rad 972–973 från `currentMatchStep`:
```ts
const currentMatchStep = currentStep >= 0 && currentStep < steps.length ? steps[currentStep] : null
const homeScore = currentMatchStep?.homeScore ?? 0
const awayScore = currentMatchStep?.awayScore ?? 0
```

När `currentStep = steps.length`, är `currentMatchStep = null`, och `?? 0` ger 0–0 och 0'. Det är inte ett separat scoreboard-state — det är ett direkt symptom av att `currentStep` är utanför bounds.

---

## Hypotes 1 — varför den inte stämmer

`regenerateRemainderWithUpdatedScore` (rad 458–498) returnerar `newRemainder` (steg från `atStep+1` till matchslut). Alla handlers kombinerar korrekt:
```ts
return [...updatedCurrent.slice(0, currentStep + 1), ...newRemainder]
```

Det totala antalet steg minskar inte. `currentStep` är fortfarande ett giltigt index i den nya arrayen omedelbart efter `setSteps`. Buggen uppstår inte vid array-konstruktionen, utan i timing-konkurrensen efteråt.

**Kantsfall:** Om en interaktion sker precis på steg 60 (full-time-steget), anropar `regenerateRemainderWithUpdatedScore` `simulateFromMidMatch` med `fromStep = 61, endStep = 60` — noll iterationer i main-loopen, men `emitFullTime = true` genererar ett extra full-time-steg. Resultatet är ett duplikat steg 60 i arrayen (index `currentStep` och `currentStep+1` har båda `step: 60`). Det är en separat, mjukare bugg, men inte rotorsaken till 0–0-symtomet.

---

## Föreslagen fix (implementera inte här)

Lägg till en recovery-effekt som triggas när `currentStep >= steps.length` och `!matchDone`: sätt `matchDone(true)` direkt, eller kläm `currentStep` till `steps.length - 1`.

Alternativt: ta bort det externa `setTimeout(() => setCurrentStep(prev => prev + 1))` ur alla fyra handlers och låt timer-effekten ta hand om steget naturligt — handlers sätter bara `setActive[Interaction](null)` och `setIsPaused(false)`, timern fortsätter sedan av sig själv.
