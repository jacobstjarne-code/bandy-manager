# CODE — FIX-17 · Auto-fyll fungerar inte i Plan-fliken

**Datum:** 2026-05-11
**Författare:** Opus
**Status:** SPEC — felsökning + fix för Plan-fliks Auto-fyll-bug

---

## Problem

I Plan-fliken (PitchLineupView) visas "0/11 — saknas: MV, VB, LIB, ..." trots att `startingIds` innehåller 11 spelare. Klick på "Fyll bästa elvan" (LineupStep-knappen i mittpanelen) verkar inte uppdatera Plan-vyn — pitchen förblir tom.

Lista-vyn fungerar däremot — där visas spelarna korrekt eftersom `LineupFormationView` läser från både `startingIds` och `tacticState.lineupSlots`.

## Rotorsak (mest sannolik)

`PitchLineupView` renderar pitch-slottar **enbart** baserat på `tacticState.lineupSlots` (rad 49 i komponenten):

```ts
const slotToPlayer: Record<string, string> = {}
for (const [slotId, pid] of Object.entries(tacticState.lineupSlots ?? {})) {
  if (pid && startingIds.includes(pid)) slotToPlayer[slotId] = pid
}
```

Om `tacticState.lineupSlots` är tomt (`{}` eller `undefined`) blir `slotToPlayer` tomt och alla 11 cirklar visas som tom-slots. `placedPids` blir tom Set, och `pillPlayers` returnerar HELA truppen som "oplacerade" — vilket matchar Jacobs screenshots.

### Varför händer detta?

I `MatchScreen.tsx` initieras state från `savedLineup` (sparad pending lineup):

```ts
const savedLineup = game?.managedClubPendingLineup
const [startingIds, setStartingIds] = useState<string[]>(() =>
  savedLineup?.startingPlayerIds ?? defaultStarting
)
const [tacticState, setTacticState] = useState<Tactic>(() =>
  savedLineup?.tactic ?? { ... }
)
```

Om `savedLineup.startingPlayerIds` finns med 11 spelare MEN `savedLineup.tactic.lineupSlots` är `{}` eller `undefined` (vilket händer när pending lineup sparas innan auto-assign körts, eller efter en formation-change utan re-fill), så är `startingIds.length === 11` men `lineupSlots` är tomt.

useEffect i MatchScreen triggar inte `handleAutoFill` i detta läge, eftersom villkoret är `startingIds.length < 11`:

```ts
useEffect(() => {
  const hasInvalid = startingIds.some(...)
  if (startingIds.length < 11 || hasInvalid) {
    handleAutoFill()
  }
}, [])
```

Plan-fliken visar tom pitch tills användaren klickar "Fyll bästa elvan" manuellt.

### Varför verkar Auto-fyll-knappen inte hjälpa?

Två möjliga delproblem:

1. **handleAutoFill anropas korrekt** men `updateTactic(newTactic)` persisteras inte synligt — re-render sker men `tacticState` läses från en stale källa
2. **handleAutoFill anropas** men någon spelare i `starters` har position som inte matchar någon slot i `template.slots`, och `autoAssignFormation` returnerar `{}` för alla slottar
3. **Race condition** mellan `setStartingIds` och `setTacticState` (båda är separata useState-hooks, inte batched i alla React-versioner)

## Lösning

### Steg 1: Auto-populate `lineupSlots` vid mount om saknas

I `MatchScreen.tsx`, utöka useEffect-villkoret:

```ts
useEffect(() => {
  const hasInvalid = startingIds.some(id => {
    const p = squadPlayers.find(x => x.id === id)
    return !p || p.isInjured || p.suspensionGamesRemaining > 0
  })

  const lineupSlotsEmpty =
    !tacticState.lineupSlots ||
    Object.keys(tacticState.lineupSlots).length === 0 ||
    Object.values(tacticState.lineupSlots).every(v => v == null)

  if (startingIds.length < 11 || hasInvalid || lineupSlotsEmpty) {
    handleAutoFill()
  }
}, [])
```

Det löser huvudproblemet: när Plan-fliken laddas med 11 startingIds men tomma lineupSlots, triggas auto-fill automatiskt.

### Steg 2: Verifiera handleAutoFill-flödet

Lägg till en `console.log` (tillfälligt) inom `handleAutoFill` för att verifiera att hela kedjan funkar:

```ts
function handleAutoFill() {
  // ... existing logic to compute starters ...

  const formation = tacticState.formation ?? '5-3-2'
  const template = FORMATIONS[formation]
  const newLineupSlots = autoAssignFormation(template, starters)

  // DEBUG (ta bort efter verifiering)
  console.log('[handleAutoFill]', {
    formation,
    starterCount: starters.length,
    slotCount: Object.keys(newLineupSlots).length,
    nonNullSlots: Object.values(newLineupSlots).filter(v => v).length,
  })

  const newTactic = { ...tacticState, lineupSlots: newLineupSlots }
  setTacticState(newTactic)
  updateTactic(newTactic)
  setStartingIds(starters.map(p => p.id))
}
```

Förväntat resultat: `slotCount: 11, nonNullSlots: 11`. Om `nonNullSlots < 11` är `autoAssignFormation` problemet — kolla att alla `starters[].position` matchar någon slot i `template.slots`.

### Steg 3: Säkra atomic update via useReducer (om Race condition är problem)

Om steg 1+2 inte räcker, konvertera `startingIds` + `tacticState` till en useReducer med en `AUTO_FILL`-action som uppdaterar båda samtidigt:

```ts
type State = { startingIds: string[]; tacticState: Tactic }
type Action =
  | { type: 'AUTO_FILL'; starterIds: string[]; lineupSlots: Record<string, string | null> }
  | ...

function lineupReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'AUTO_FILL':
      return {
        startingIds: action.starterIds,
        tacticState: { ...state.tacticState, lineupSlots: action.lineupSlots },
      }
    // ...
  }
}
```

Det säkerställer atomic update — inga rerendrar mellan setStartingIds och setTacticState.

## Acceptanskriterier

- [ ] Plan-fliken visar fyllda cirklar med tröjnummer när 11 spelare är valda
- [ ] Plan-fliken triggar auto-fill vid mount om `lineupSlots` är tomt men `startingIds.length === 11`
- [ ] "Fyll bästa elvan"-knappen funkar i båda flikar — Plan-vyn visar omedelbart fyllda cirklar
- [ ] Console.log visar `slotCount: 11, nonNullSlots: 11` efter Auto-fyll-anrop
- [ ] Befintliga 760 tester gröna

## Vad du INTE ska göra

- **Inte modifiera** `autoAssignFormation`-funktionen — den fungerar enligt sin position-matching-logik
- **Inte ta bort** existerande useEffect-trigger för `startingIds.length < 11` — bara utöka den med `lineupSlotsEmpty`-villkor
- **Inte ändra** PitchLineupView's render-logik — buggen är upstream

## Rapportera

Per steg: ✅ / ⚠️ / ❌ med en mening. En commit räcker.

Flagga också om:
- Steg 1 räcker eller om steg 2+3 också krävs
- `autoAssignFormation` returnerar non-null för alla slottar
- Race condition mellan setStartingIds och setTacticState observeras i din playtest
