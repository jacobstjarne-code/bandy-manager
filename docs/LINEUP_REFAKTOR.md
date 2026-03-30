# LINEUP_REFAKTOR.md — Robust ombyggnad av lineup/taktikskärmen

## Rotorsak

`positionAssignments: Record<playerId, FormationSlot>` är **spelarcentrisk**.
Konsekvensen: alla läsare måste invertera mappingen (`slotToPlayer`) och filtrera mot
`startingIds`. Ingenting hindrar att två spelare mappas till samma slot. Desync
mellan `startingIds` och `positionAssignments` är källan till de flesta buggar.

## Ny datamodell

```typescript
// Ersätter positionAssignments i Tactic
lineupSlots: Record<string, string | null>  // slotId → playerId | null
```

**Invarianter:**
- En slot kan ha max en spelare (enforced by design — en nyckel per slot)
- `startingIds` hålls i sync: när en spelare läggs till/tas bort rensas/sätts deras slot
- `autoAssignFormation` returnerar `Record<slotId, string | null>` direkt

## Teststrategi

### Automatisk (efter varje DEL): `npm run build` → 0 TypeScript-fel

### Visuell checklista (körs i dev-server efter DEL C):
- [ ] Formation-selector: byter formation och re-assignar spelare
- [ ] "Generera bästa elvan" fyller alla 11 slots
- [ ] Dra spelare → placeras i närmaste slot, försvinner från bänken
- [ ] Dra spelare från slot till annan → swap sker
- [ ] Dra spelare utanför plan → tas bort från slot, dyker upp i bänk
- [ ] Lista-toggle: spelare läggs till/tas bort ur startelvan
- [ ] Ta bort spelare via lista: deras slot rensas också
- [ ] Byta formation: bevarar spelare i slots som finns i ny formation, auto-assignar resten
- [ ] `startingIds` = exakt de 11 spelare som har en slot

---

## DEL A — Datamodell (Foundation)

Inga views ändras. Bara typer och logik.

### A1. `src/domain/entities/Club.ts`
- Ta bort `import type { FormationSlot }` (behålls om det används någon annanstans, annars bort)
- Byt ut `positionAssignments?: Record<string, FormationSlot>` mot `lineupSlots?: Record<string, string | null>`

### A2. `src/domain/entities/Formation.ts`
- Ändra `autoAssignFormation` att returnera `Record<string, string | null>` (slotId → playerId)
- Intern logik i princip samma men mappingen är inverterad

### A3. `src/domain/services/squadEvaluator.ts`
- `effectivePlayerModifier`: hitta slot via `lineupSlots`, slå upp slot-position i FORMATIONS-template

### A4. `src/presentation/screens/MatchScreen.tsx`
- `handleAutoFill`: sätter `lineupSlots` (inte `positionAssignments`)
- `assignPlayerToSlot`: skriver `lineupSlots[slotId] = playerId`
- `handleFormationChange` (används av views): migration — behåll spelare vars slot-ID finns i ny formation, auto-assign resten

**Build-test:** `npm run build` → 0 fel

---

## DEL B — Views

### B1. `LineupFormationView.tsx`
- `slotToPlayer = tacticState.lineupSlots ?? {}` (direkt, ingen inversion!)
- Ta bort `rawAssignments`, `assignments`, gammal inversion

### B2. `PitchLineupView.tsx`
- `slotToPlayer = tacticState.lineupSlots ?? {}`
- `placedPids = new Set(Object.values(slotToPlayer).filter(Boolean))`
- `pillPlayers`: spelare i `startingIds` men inte i `placedPids`

### B3. `SlotLineupView.tsx`
- `slotToPlayer = tacticState.lineupSlots ?? {}`
- Ta bort `assignments`, gammal inversion

**Build-test:** `npm run build` → 0 fel

---

## DEL C — Sync-fixes & robusthet

### C1. `MatchScreen.tsx` — `togglePlayer`
- När spelare tas bort: rensa `lineupSlots[slotId]` för alla slots den spelaren hade

### C2. `MatchScreen.tsx` — Formation-byte migration
- Nytt: om slot-ID finns i ny formation OCH spelaren finns i `startingIds` → behåll
- Slot-ID saknas i ny formation → spelaren oplacerad, lägg till unplaced-pool
- Fyll kvarstående tomma slots med `autoAssignFormation`

### C3. `gameStore.ts` — Migration av gamla sparfiler
- Om `activeTactic.positionAssignments` finns och `lineupSlots` saknas:
  konvertera `{ playerId: FormationSlot }` → `{ slotId: playerId }`

**Build-test:** `npm run build` → 0 fel

---

## Filer som berörs

| Fil | Ändring |
|-----|---------|
| `src/domain/entities/Club.ts` | `positionAssignments` → `lineupSlots` |
| `src/domain/entities/Formation.ts` | `autoAssignFormation` returnerar ny typ |
| `src/domain/services/squadEvaluator.ts` | Slot-lookup via `lineupSlots` + FORMATIONS |
| `src/presentation/screens/MatchScreen.tsx` | Handlers uppdateras |
| `src/presentation/components/match/LineupFormationView.tsx` | Läser `lineupSlots` |
| `src/presentation/components/match/PitchLineupView.tsx` | Läser `lineupSlots` |
| `src/presentation/components/match/SlotLineupView.tsx` | Läser `lineupSlots` |
| `src/presentation/store/gameStore.ts` | Migration av gamla sparfiler |
