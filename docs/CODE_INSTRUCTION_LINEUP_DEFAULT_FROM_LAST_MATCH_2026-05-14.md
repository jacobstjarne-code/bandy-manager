# CODE_INSTRUCTION — LINEUP DEFAULT FROM LAST MATCH 2026-05-14

Plan-fliken ska börja med spelarna från förra matchen istället för att auto-fylla med top 11 varje gång. Skadade/avstängda spelare lämnar TOMMA slots — vilket gör "Fyll bästa elvan"-knappen meningsfull (fyller bara tomma slottar).

---

## FIX-50 — Lineup default = förra matchens elva

**Var:**
- `src/presentation/components/tactic/FormationView.tsx` (default-fall för `lineupSlots`)
- `src/presentation/components/match/LineupStep.tsx` (defensive useEffect)
- `src/presentation/components/match/PitchLineupView.tsx` (rendering av tomma slots)

**Idag:**
```ts
const lineupSlots = tactic.lineupSlots ?? autoAssignFormation(template, players)
```
Om `tactic.lineupSlots` saknas auto-fylls med top 11 sorterat på ability. Resultatet: Plan-fliken är ALLTID fylld → "Fyll bästa elvan" gör ingen visuell skillnad.

**Nytt beteende:**

1. **`tactic.lineupSlots` sparas mellan matcher** — det är redan implementerat. Spelar-ID:n stannar kvar i samma slots från match till match.

2. **Vid Plan-fliks-rendering:** Om en spelare i `lineupSlots` nu är `isInjured === true` ELLER `suspensionGamesRemaining > 0`, sätt dens slot till `null` (tom).

3. **"Fyll bästa elvan"-knappen omdefinierad:** Fyller BARA tomma slots med bästa tillgängliga spelare för respektive position. Rör inte placerade spelare.

4. **Första gången användaren spelar (inget `lineupSlots` sparat ännu):** Auto-fyll med top 11 som idag.

---

## IMPLEMENTATIONS-SPEC

### A. FormationView.tsx — default-fall

```ts
// Idag
const lineupSlots = tactic.lineupSlots ?? autoAssignFormation(template, players)

// Nytt
const rawLineupSlots = tactic.lineupSlots ?? autoAssignFormation(template, players)
// Töm slots för otillgängliga spelare
const lineupSlots: Record<string, string | null> = {}
for (const [slotId, playerId] of Object.entries(rawLineupSlots)) {
  if (!playerId) {
    lineupSlots[slotId] = null
    continue
  }
  const player = players.find(p => p.id === playerId)
  if (!player) {
    lineupSlots[slotId] = null
    continue
  }
  if (player.isInjured || player.suspensionGamesRemaining > 0) {
    lineupSlots[slotId] = null
    continue
  }
  lineupSlots[slotId] = playerId
}
```

Samma logik behövs i `LineupStep.tsx` om `lineupSlots` läses där.

### B. PitchLineupView.tsx — render tomma slots tydligare

Tomma slots ska visuellt nudga användaren att fylla. Pulse-animation finns redan (`pitchSlotPulse`) — den triggas när `isEmpty && selection !== null`. Lägg till en mildare pulse även när tomma slots OCH ingen selection — då signalerar planen "fyll mig".

Eller minst tydligt: ändra texten i tomma slots från position-label (`GK`, `DEF`) till `+`-tecken. Det signalerar "lägg till" tydligare.

Förslag CSS:
```css
@keyframes pitchSlotPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.9; }
}
```
Animationen körs alltid när tom, inte bara när selection finns.

### C. handleAutoFill i FormationView.tsx — fyll bara tomma slots

```ts
function handleAutoFill() {
  const available = players.filter(p => !p.isInjured && p.suspensionGamesRemaining <= 0)
  const placedIds = new Set(Object.values(lineupSlots).filter(Boolean) as string[])
  const sorted = [...available]
    .filter(p => !placedIds.has(p.id))
    .sort((a, b) => b.currentAbility - a.currentAbility)
  
  const newLineupSlots = { ...lineupSlots }
  const emptySlots = template.slots.filter(s => !newLineupSlots[s.id])
  
  // Try to fill empty slots with position-matched players first
  for (const slot of emptySlots) {
    const matchIdx = sorted.findIndex(p => p.position === slot.position)
    if (matchIdx >= 0) {
      newLineupSlots[slot.id] = sorted[matchIdx].id
      sorted.splice(matchIdx, 1)
      continue
    }
    // Fallback: any available player
    if (sorted.length > 0) {
      newLineupSlots[slot.id] = sorted[0].id
      sorted.shift()
    }
  }
  
  onChange({ ...tactic, lineupSlots: newLineupSlots })
  setSelectedSlotId(null)
}
```

Detta fyller endast TOMMA slots, inte rör befintliga. Position-medvetenhet: en målvakts-slot får helst en målvakt.

### D. Edge case — första matchen

Om `tactic.lineupSlots` är `undefined` ELLER tom dictionary, kör nuvarande `autoAssignFormation` för att börja med en full elva. Användaren har då en startpunkt och kan anpassa.

---

## ACCEPTANSKRITERIER

1. Spela en match. Skada en spelare. Spela nästa match. Den skadade spelarens slot ska vara TOM i Plan-fliken.
2. Klick på "Fyll bästa elvan" fyller bara tomma slots, behåller övriga.
3. Knappens "✓ Uppdaterad"-feedback visas fortfarande (oförändrad).
4. Ny användare (ingen `lineupSlots` sparad) — fylld med top 11 från start.
5. Om "manuellt" tas bort en spelare — den slotten är tom, klick på knappen fyller den.

---

## VAD SKA INTE ÄNDRAS

- `autoAssignFormation` i Formation entity — fortfarande använd som första-gång-default
- Mekanik kring `currentAbility`-sortering — oförändrad
- Save-format för `lineupSlots` — oförändrad

---

## RAPPORTERING

Per acceptanskriterium med ✅ / ⚠️ / ❌ + en mening. Säg specifikt:
- Var validation triggas (kollas `isInjured` på rätt ställe?)
- Edge case: vad händer om alla 11 är skadade samtidigt (extremt scenario)?
- Behöver `tacticState.lineupSlots` migreras för existerande save-games?
