# CODE — Commentary self-contradiction + Auto-fyll eskalering

**Datum:** 2026-05-12
**Författare:** Opus
**Status:** SPEC — två fixar, FIX-17 eskalering plus FIX-27 commentary-bugg

---

## Sammanfattning

Jacobs playtest efter 0ace170 visade två nya problem:

1. **Auto-fyll funkar fortfarande inte i Plan-fliken.** FIX-17 steg 1+2 (lineupSlotsEmpty-villkor + debug-log) implementerades men problemet kvarstår. Eskalera till steg 3 (useReducer) plus ytterligare trigger.

2. **Commentary self-contradiction:** Corner-events visar två motsägande templates i samma rad:
   > "Hörna för Västanfors. Men inget kommer ut av det. Västanfors utnyttjar hörnan. Pontus Lundqvist med ett ruggigt skott. 0–1!"

Plus en text-bugg som Opus redan fixade inline (FIX-26 nedan, för Code:s referens).

---

## FIX-26 · (REDAN FIXAD AV OPUS — för din kännedom)

**Fil:** `src/domain/data/matchCommentary.ts`

`save:`-templates innehöll en mening med saknat substantiv:
- Före: `"Räddning! {goalkeeper} väljer rätt håll. Den där läste han i gårdagens."`
- Efter: `"Räddning! {goalkeeper} väljer rätt håll. Den där hade han räknat med."`

Du behöver inte göra något med detta — Opus har edit:at filen direkt. Säkerställ bara att din nästa commit inkluderar denna ändring.

---

## FIX-17 · Auto-fyll Plan-fliken — eskalering till steg 3

**Fil:** `src/presentation/screens/match/MatchScreen.tsx` + `src/presentation/components/match/PitchLineupView.tsx`

### Bakgrund

FIX-17 steg 1 (lineupSlotsEmpty-villkor i useEffect) + steg 2 (debug-log i handleAutoFill) implementerades i förra commit-rundan. Jacob rapporterar att Plan-fliken FORTFARANDE visar tom pitch när matchen laddas och knappen "Fyll bästa elvan" verkar inte påverka Plan-vyn.

Vi har två obekräftade hypoteser:

- **A.** Race condition mellan `setStartingIds` och `setTacticState` (steg 3 i ursprungliga specen)
- **B.** `tacticState.lineupSlots` uppdateras men `PitchLineupView` re-renderar inte (referens-equality, memo, eller stale closure)

### Steg 3.1 — useReducer för atomic update

Konvertera `startingIds` + `tacticState` till en useReducer med atomic update via en `AUTO_FILL`-action:

```ts
type LineupState = {
  startingIds: string[]
  benchIds: string[]
  tacticState: Tactic
}

type LineupAction =
  | { type: 'AUTO_FILL'; starterIds: string[]; benchIds: string[]; lineupSlots: Record<string, string | null> }
  | { type: 'SET_TACTIC'; tactic: Tactic }
  | { type: 'TOGGLE_PLAYER'; playerId: string }
  | { type: 'ASSIGN_PLAYER'; slotId: string; playerId: string }
  | { type: 'REMOVE_PLAYER'; slotId: string }
  | { type: 'SWAP_PLAYERS'; slotId1: string; slotId2: string }
  // ... etc

function lineupReducer(state: LineupState, action: LineupAction): LineupState {
  switch (action.type) {
    case 'AUTO_FILL':
      return {
        ...state,
        startingIds: action.starterIds,
        benchIds: action.benchIds,
        tacticState: {
          ...state.tacticState,
          lineupSlots: action.lineupSlots,
        },
      }
    // ... andra cases
  }
}
```

Det säkerställer att startingIds OCH lineupSlots uppdateras i ETT enda render-pass — ingen race-condition möjligt.

### Steg 3.2 — Extra trigger när Plan-fliken aktiveras

Lägg till en useEffect i `LineupStep.tsx` (eller där viewMode-toggling sker) som triggar Auto-fyll om Plan-fliken blir aktiv OCH lineupSlots är tomt:

```ts
useEffect(() => {
  if (viewMode === 'pitch' && Object.keys(tacticState.lineupSlots ?? {}).length === 0 && startingIds.length === 11) {
    // Trigger Auto-fyll automatically when switching to Plan tab with empty slots
    onAutoFill()
  }
}, [viewMode])
```

Det är en defensiv fallback: om savedLineup laddas med startingIds men inga lineupSlots, och användaren växlar till Plan-fliken, så fylls slottarna automatiskt.

### Steg 3.3 — Verifiera re-render av PitchLineupView

Om steg 3.1 + 3.2 inte räcker, kontrollera att PitchLineupView inte är wrap:ad i React.memo med fel comparator. Logga också ut `tacticState.lineupSlots` inom PitchLineupView vid render för att se om den faktiskt får uppdaterad data:

```tsx
console.log('[PitchLineupView render]', {
  slotsCount: Object.keys(tacticState.lineupSlots ?? {}).length,
  nonNullSlots: Object.values(tacticState.lineupSlots ?? {}).filter(v => v).length,
})
```

Om `nonNullSlots: 11` loggas men cirklarna ändå är tomma — det är då en rendering-bugg, inte data-bugg.

### Acceptanskriterier

- [ ] Plan-fliken visar fyllda cirklar när 11 spelare är valda
- [ ] Plan-fliken auto-fyller vid mount om lineupSlots är tomt
- [ ] Plan-fliken auto-fyller vid flik-byte (list → pitch) om lineupSlots är tomt
- [ ] "Fyll bästa elvan"-knappen funkar i båda flikar — Plan-vyn visar omedelbart fyllda cirklar efter klick
- [ ] Befintliga 760 tester gröna

### Vad du INTE ska göra

- **Inte ändra** PitchLineupView's render-logik utöver eventuell logg
- **Inte ta bort** debug-loggen från handleAutoFill ännu — den är fortfarande värdefull
- **Inte modifiera** autoAssignFormation

---

## FIX-27 · Commentary self-contradiction (corner events)

**Fil:** `src/domain/data/matchCommentary.ts` + matchSimulator / matchEngine / event-byggar-logik

### Problem

Jacobs screenshot visar event med text:
> "Hörna för Västanfors. Men inget kommer ut av det. Västanfors utnyttjar hörnan. Pontus Lundqvist med ett ruggigt skott. 0–1!"

Detta är två separata templates som konkateneras i samma event:

**Från `corner:`-arrayen (miss-template):**
> "Hörna för {team}. Men inget kommer ut av det."

**Från `cornerGoal:`-arrayen (goal-template):**
> "{team} utnyttjar hörnan. {player} med ett ruggigt skott. {score}!"

Båda renders i samma event-text. Det är logiskt motsägande — eventet är ett mål, så miss-templaten ska inte vara med.

### Rotorsak (sannolik)

Match-eventet för en hörna har TVÅ commentary-strängar:
1. En "setup"-text (alltid från `corner:`-arrayen) — beskriver hörnan
2. En "outcome"-text (från `cornerGoal:` om mål, annars `save:` eller `miss:` eller similar)

Logiken kombinerar båda. Men `corner:`-arrayen innehåller redan miss-textuella varianter ("Men inget kommer ut av det", "Skott på mål, men enkelt undan", etc) — så när miss-template för setup följs av goal-template för outcome blir det självmotsägande.

### Fix

**Två val — välj efter hur match-event-flödet faktiskt fungerar:**

**A. Rensa `corner:`-arrayen så den bara har neutrala/setup-meningar (inte miss-texter):**

```ts
corner: [
  "Hörna till {team}.",
  "Hörna för {team}.",
  "{team} får hörna.",
  "Ny hörna till {team}. Försöker hitta ett läge.",
  "Hörna {team}. Klacken stiger upp.",
],
```

Då fungerar nuvarande logik fortfarande — `corner:` (setup) + outcome-template (`cornerGoal:` ELLER `corner_miss:` ELLER en av miss-varianterna).

**Plus**: lägg till en ny `corner_miss:`-array med dagens miss-varianter från `corner:`:

```ts
corner_miss: [
  "Slås in alldeles för löst. Rensas av försvaret.",
  "Skott på mål, men enkelt undan.",
  "En variant! Kort spel med skott i dödvinkel. Långt utanför!",
  "Lång boll på sista skytten, men ingen lycka den här gången.",
  "Boll på tredjeskytten som skjuter i stolpen!",
  "Förstaskytt lägger den i burgaveln.",
  "En bra inslagen boll som resulterar i ett skott låååångt över.",
  "Men inget kommer ut av det.",
  "Bollen studsar lite, men det blir ändå till ett skott i ruset.",
  "Inslagen mot tredjeskytt, som skjuter rakt i {opponent}s rus.",
],
```

Sen i match-event-byggar-logiken:
- Vid hörna: rendera EN setup-text från `corner:` + EN outcome-text från `corner_miss:` (om miss) eller `cornerGoal:` (om mål).

**B. Skip "setup"-textens när cornerGoal renders:**

Om logiken inte enkelt kan dela upp till setup/outcome, gör så att `cornerGoal:`-templates används ENSAMMA (utan setup-text framför) när det är mål. Det betyder: corner-eventet visar BARA cornerGoal-template, inte setup + cornerGoal.

### Vad behöver Code göra

1. Sök i kodbasen efter var corner-events bygger text-strängar (troligen matchSimulator.ts eller matchCommentaryService eller motsvarande)
2. Identifiera om det är en concat-logik (setup + outcome) eller bara fel template-pickning
3. Implementera lösning A eller B beroende på vad som är enklast

### Acceptanskriterier

- [ ] Corner-events visar EN sammanhängande text — antingen setup+miss ELLER setup+goal ELLER bara goal
- [ ] Ingen self-contradiction (t.ex. "inget kommer ut av det" följt av "och det blev mål")
- [ ] Övriga event-typer (save, suspension, etc) påverkas inte
- [ ] Befintliga 760 tester gröna

### Vad du INTE ska göra

- **Inte ta bort** `cornerGoal:`-templates — de behövs för mål
- **Inte ändra** corner-zone-logik (near/center/far) eller delivery-logik (hard/low/short) i cornerInteractionService

---

## Rapportera

Per fix: ✅ / ⚠️ / ❌ med en mening. Två commits rekommenderat: FIX-17 (Auto-fyll eskalering), FIX-27 (commentary corner).

Flagga:
- Om steg 3.1 (useReducer) är klart och steg 3.2 (mount-trigger) inte behövs
- Om FIX-27 löses med variant A eller B — och i vilken fil match-event-text byggs
- Om någon annan event-typ (save, miss, suspension) har liknande self-contradiction-mönster
