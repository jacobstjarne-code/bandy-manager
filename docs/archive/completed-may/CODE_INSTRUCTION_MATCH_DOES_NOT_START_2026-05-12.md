# CODE — FIX-29 · Match startar inte (klocka på 00:00, tom commentary)

**Datum:** 2026-05-12
**Författare:** Opus
**Status:** SPEC — kritisk bugg, blockerar all spelbarhet

---

## Problem

Jacob startar en match. UI:t visar:
- Scoreboard: 0-0, klocka på 00:00, HL1
- Paus-knappen är i "active"-state (matchen anses spela)
- Commentary-rubriken finns men feeden är tom
- INTENSIVT-bar och stats syns inte alls
- Klockan tickar aldrig

Matchen har stannat innan första steget och avancerar aldrig.

## Analys

Tre observerade symptom korrelerar med EN rotorsak: `steps`-arrayen är tom.

1. **Klockan står still:** `useMatchTimer` har raden `if (currentStep < 0 || currentStep >= steps.length) return`. Tom `steps` → returnerar direkt, ingen advance.

2. **INTENSIVT-bar och stats osynliga:** `MatchControls` renderar dem bara om `currentMatchStep` är truthy. `currentMatchStep` är `steps[currentStep]` — om `steps` är tom är det `undefined`.

3. **Commentary tom:** `feedRows` byggs från `displayedSteps` (eller motsvarande slice av `steps`). Tom källa → tom feed.

Allt pekar på att antingen:
- **A.** `runInitialGeneration()` i `useMatchGenerator` anropas inte vid mount
- **B.** Den anropas men `simulateMatchStepByStep` returnerar tom array
- **C.** Den anropas, returnerar steps, men `setSteps` får inte de uppdaterade värdena tillbaka till MatchLiveScreen

## Felsökning — steg för steg

### Steg 1: Verifiera att `runInitialGeneration` anropas

Lägg till en logg vid funktionens början i `useMatchGenerator.ts`:

```ts
function runInitialGeneration() {
  console.log('[MatchGenerator] runInitialGeneration called', {
    hasSimulated: hasSimulated.current,
    fixtureId: setup.fixture.id,
  })
  if (hasSimulated.current) return
  // ... resten
}
```

Plus där den anropas (troligen useEffect i MatchLiveScreen):

```ts
useEffect(() => {
  console.log('[MatchLiveScreen] useEffect trigger', { fixtureId: fixture?.id })
  if (!fixture || !homeLineup || !awayLineup) return
  runInitialGeneration()
}, [...])
```

**Förväntat output:** Båda loggar ska visas vid match-start.

### Steg 2: Verifiera att `simulateMatchStepByStep` returnerar steg

Vid generator-anropet:

```ts
const result = simulateMatchStepByStep({ /* ... */ })
console.log('[MatchGenerator] simulator result', {
  stepCount: result.steps?.length ?? 0,
  finalScore: `${result.finalHomeScore}-${result.finalAwayScore}`,
})
setSteps(result.steps)
setCurrentStep(0)
```

**Förväntat output:** `stepCount: ~60` (cirka antal steg för 90-min match).

### Steg 3: Verifiera att `setSteps` triggar re-render

I MatchLiveScreen, lägg till en logg som lyssnar på steps:

```ts
useEffect(() => {
  console.log('[MatchLiveScreen] steps updated', {
    length: steps.length,
    currentStep,
  })
}, [steps, currentStep])
```

**Förväntat output:** En logg vid mount med `length: 0`, sen en med `length: 60+` när generator körts.

### Steg 4: Verifiera att timer reagerar på steps-uppdatering

I `useMatchTimer.ts`, lägg en logg i useEffect:

```ts
useEffect(() => {
  console.log('[MatchTimer] effect run', {
    currentStep,
    stepsLength: steps.length,
    isPaused,
    isFastForward,
    willReturn: currentStep < 0 || currentStep >= steps.length || (isPaused && !isFastForward),
  })
  if (currentStep < 0 || currentStep >= steps.length) return
  // ...
}, [currentStep, isPaused, isFastForward, steps])
```

**Förväntat:** Logg vid mount med `stepsLength: 0, willReturn: true`. Sen en uppdaterad logg med `stepsLength: 60+, willReturn: false` när steps populeras.

## Sannolika rotorsaker

Baserat på vilket steg som faller:

- **Steg 1 fail:** useEffect-villkor (deps) eller location.state är inte komplett. Kolla att fixture, homeLineup, awayLineup alla är truthy vid mount.

- **Steg 2 fail:** Något i `simulateMatchStepByStep` kraschar eller returnerar tom array. Kolla att alla required props skickas (homePlayers, awayPlayers, lineups, etc.). Vanlig orsak: lineups har 0 spelare för att Plan-fliken inte fyllt slots (relaterat till FIX-17).

- **Steg 3 fail:** `setSteps` anropas men prop-drilling till useMatchTimer är trasig. Verifiera att `steps` skickas till useMatchTimer korrekt.

- **Steg 4 fail:** Timer-useEffect har fel deps-array. Den ska ha `[currentStep, isPaused, isFastForward, steps]` enligt nuvarande kod.

## Möjlig koppling till FIX-17 (Auto-fyll Plan-fliken)

Om FIX-17 fortfarande inte funkar — d.v.s. `tacticState.lineupSlots` är tomt när matchen startar — så kan `simulateMatchStepByStep` få lineups med 0 placerade spelare. Det skulle returnera tom steps-array.

Verifiera när du startar match att `homeLineup.startingPlayerIds.length === 11` och `awayLineup.startingPlayerIds.length === 11`. Om det är 0 → FIX-17 är fortfarande otillräcklig och behöver mer eskalering.

## Acceptanskriterier

- [ ] Match startar med klockan tickande efter mount
- [ ] Commentary feed visar atmosphere-rader när matchen rullar
- [ ] INTENSIVT-bar och stats visas i MatchControls
- [ ] Inga "willReturn: true" i timer-loggen efter steg 0 (utom vid pausad match)
- [ ] Befintliga 760 tester gröna

## Vad du INTE ska göra

- **Inte ta bort** de tidigare obearbetade specerna (FIX-22/23/24/25 + FIX-17 eskalering + FIX-27) — denna FIX-29 är prioritet 1 eftersom utan matchstart kan inget testas, men de andra ska också med
- **Inte modifiera** simulateMatchStepByStep logiken — bara verifiera att den anropas korrekt
- **Inte rulla tillbaka** FIX-21 (MatchControls Stålvallen-stilning) — felsök istället

## Rapportera

Vilket steg (1-4) som faller, plus loggvärden. Sen kan vi diagnostisera exakt rotorsak.

Om Steg 2 fail på grund av tomma lineups → vi behöver eskalera FIX-17 ytterligare.
