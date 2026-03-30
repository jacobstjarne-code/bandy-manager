# AKUT FIX: Återställ laguppställning + korrigera offside + vaden

Kör FÖRE den stora FIXSPEC_PLAYTEST_R2.md.

---

## 🔴 A. Återställ fungerande laguppställning

### Problem
Codes implementering bytte ut den fungerande `LineupFormationView` (SVG-plan med klick-tilldelning) mot `SlotLineupView` (trasig listvy) och `PitchLineupView` (trasig drag-and-drop). Varken den ena eller andra fungerar ordentligt.

### Fix: Återställ gamla LineupStep

I `src/presentation/components/match/LineupStep.tsx`:

1. **Ta tillbaka importen av LineupFormationView:**
```typescript
import { LineupFormationView } from './LineupFormationView'
```

2. **Rendera LineupFormationView som default** (ta bort lista/planvy-toggle, eller gör LineupFormationView till "lista"-läget):

Enklast: ta bort togglen helt och rendera bara `LineupFormationView` + spelarlistan under, precis som det var innan. `LineupFormationView` visar redan planvyn med klick-tilldelning, nummer, namn och positioner.

3. **Spelarlistan under planen** — den gamla koden hade en grupplista per position (MV, B, H, M, F). Varje spelare var en rad med namn, CA, form, start/bänk-knapp. Klick på en spelare när en slot var vald → tilldelade spelaren.

Om den gamla spelarlistan är borta ur LineupStep → återskapa den. Den ska visa:
- Spelare grupperade per position
- Varje rad: nummer, namn, CA, form, "START"/"BÄNK" toggle
- Om en slot är vald (selectedSlotId) → klick på spelare → tilldela via `onAssignPlayer`
- Om ingen slot vald → klick togglear start/bänk

4. **Behåll "Generera bästa elvan"-knappen** under spelarlistan.

5. **Ta bort SlotLineupView från renderingen** (filen kan stå kvar men ska inte renderas).

### Vad som ska finnas i LineupStep (uppifrån och ner):
```
[OpponentInfoCard]
[OpponentAnalysisCard]
[LineupFormationView — SVG-plan med klickbara slots]
 "Väljer spelare till: HB — klicka på en spelare nedan" (om slot vald)
[Generera bästa elvan-knapp]
[Spelarlista grupperad per position]
  MV: Ville Karlsson #17 · 56 · Form 66 [START]
  B:  Erik Gran #5 · 63 · Form 58 [START]
  ...osv
[Välj taktik →]
```

### Props som LineupStep behöver (redan finns):
- `selectedSlotId` + `onSlotClick` → för klick-tilldelning i LineupFormationView
- `onTogglePlayer` → för start/bänk-toggle
- `onAssignPlayer` → för att koppla spelare till slot

### Filer
- `src/presentation/components/match/LineupStep.tsx` — revert till LineupFormationView + spelarlista

---

## 🔴 B. Offside FINNS i bandy — ta inte bort

### Problem
Föregående spec sa "ta bort offside-kommentaren — ingen offside i bandy." Det var FEL. Offside finns i bandy (spelare får inte befinna sig i motståndarnas halva utan boll bakom mittlinjen).

### Fix
I `FIXSPEC_PLAYTEST_R2.md` punkt #12 (terminologi):
- **Ta INTE bort** raden `"En lång boll, ett offside — spelet börjar om från målgårdsavstamp."`
- **Ta bort "offside" från grep-sökningen** — det är korrekt bandyterminologi

---

## 🔴 C. "vadden" → "vaden"

### Fix
I `src/domain/data/matchCommentary.ts`, save-arrayen:
```
VAR: "{goalkeeper} räddar med vadden! Vilken reflex!"
BLI: "{goalkeeper} räddar med vaden! Vilken reflex!"
```

### Filer
- `src/domain/data/matchCommentary.ts`

---

## ORDNING
1. Återställ LineupFormationView (#A) — `fix: revert lineup to working formation view`
2. Fixa "vadden" (#C) — ingår i terminologi-commit
3. Kör sedan FIXSPEC_PLAYTEST_R2.md (men UTAN offside-borttagning)
