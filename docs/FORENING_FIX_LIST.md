# Förening/Training Screen — Fix List

## 1. Remove leather-bars from Träningsprojekt and Daglig Träning
Both sections currently use SectionCard with leather-bar headers. Replace with card-sharp + inline card-label pattern:

```tsx
// INSTEAD OF leather-bar:
<div className="card-sharp" style={{ marginBottom: 10, padding: '12px 14px' }}>
  <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
    ⚡ TRÄNINGSPROJEKT
  </p>
  {/* content */}
</div>
```

Same for Daglig Träning: `🏋️ DAGLIG TRÄNING`

## 2. Translate English attribute names to Swedish
In TrainingProjectsCard and TrainingSection, raw attribute keys are shown. Map them:

```typescript
const attributeLabel: Record<string, string> = {
  shooting: 'Skjutning',
  defending: 'Försvar',
  cornerSkill: 'Hörnspel',
  acceleration: 'Acceleration',
  workRate: 'Arbetsinsats',
  skating: 'Skridskoåkning',
  ballControl: 'Bollkontroll',
  passing: 'Passning',
  vision: 'Vision',
  decisions: 'Beslut',
  positioning: 'Positionering',
  dribbling: 'Dribbling',
  stamina: 'Kondition',
}
```

Use this wherever attribute names are displayed: `{attributeLabel[attr] ?? attr}`

## 3. Collapse training projects by default
Show only active projects expanded. Available (not started) projects should show as compact rows:
- Icon + Name + "Starta · X omg" button
- NOT fully expanded with description + risk + intensity options

Only expand when user taps to start.

## 4. Files to edit
- `src/presentation/components/SectionCard.tsx` — check if leather-bar is used
- `src/presentation/screens/ClubScreen.tsx` — main layout
- `src/presentation/components/club/TrainingProjectsCard.tsx` — project display
- `src/presentation/components/club/TrainingSection.tsx` — daily training

## 5. Verification
```bash
grep -rn "shooting\|workRate\|cornerSkill\|acceleration\|defending" src/presentation/ --include="*.tsx" | grep -v "import\|enum\|interface\|type " | head -20
# Should return 0 display-facing hits (only data/logic references)
```
