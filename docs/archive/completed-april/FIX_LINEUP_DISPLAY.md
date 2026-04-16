# FIX: Laguppställning — planvy + oplacerade spelare

## 1. Lista-fliken: visa nummer i cirklar direkt

I LineupStep.tsx / LineupFormationView.tsx (lista-läget):

När spelare är markerade som START i spelarlistan, visa deras nummer och namn i planvyns cirklar — exakt som efter "Generera bästa elvan". Problemet är att startingIds finns men positionAssignments saknas (spelarna har ingen slot-koppling).

**Fix:** Om en spelare finns i startingIds men INTE har en positionAssignment, auto-matcha den till närmast lediga slot baserat på spelarens position. Alternativt: kör autoAssignFormation() automatiskt när startingIds ändras och positionAssignments är tomma.

I LineupFormationView: kontrollera att `slotToPlayer`-mappningen uppdateras korrekt — om 11 spelare har START men inga assignments → cirklarna är tomma. Lösning: auto-assign vid rendering om assignments saknas.

## 2. Plan-fliken: position på oplacerade spelare

I PitchLineupView.tsx (eller motsvarande drag-and-drop-vy):

De oplacerade spelarchipsen visar: `[nummer] Namn CA`
Ska visa: `[nummer] Namn POSITION CA`

Exempel:
```
VAR:  [19] Kronqvist 53
BLI:  [19] Kronqvist MV 53
      [5]  Engberg DEF 25
      [1]  Grahn HALF 43
```

Lägg till positionslabel (MV/DEF/HALF/FWD) mellan namn och CA.

## Filer
- LineupStep.tsx eller LineupFormationView.tsx — auto-assign vid START
- PitchLineupView.tsx — position på oplacerade chips
