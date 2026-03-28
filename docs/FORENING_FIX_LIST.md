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

## 5. Ekonomi-tab fixes
- Remove leather-bars from Kassaöversikt, Sponsorer, Övriga intäkter → use card-sharp + card-label pattern
- Tighten spacing in kassaöversikt table (reduce padding/margins)
- Patron + Kommunbidrag: add brief explainer text showing HOW they are earned:
  - Patron: "Dyker upp vid hög lokal ställning (>60). Donerar en gång per säsong."
  - Kommunbidrag: "Baseras på lokal ställning och ungdomsverksamhet."
  - Use `font-size: 11px; color: var(--text-muted); font-style: italic;` under each row

## 6. Merge Budget into Ekonomi tab
The Budget screen (`BudgetScreen.tsx`) is currently a separate route only reachable via a button on the Ekonomi tab. This is confusing.

**Solution:** Move the budget content (Klubbkassa summary, Arena, Transferbudget slider) directly INTO the Ekonomi tab on ClubScreen, replacing the "Budget & transferbudget →" button. Remove the separate BudgetScreen route.

The Ekonomi tab should show (top to bottom):
1. 💰 Kassaöversikt (card-sharp, card-label)
2. 🏟️ Arena (card-sharp)
3. 📊 Transferbudget with slider (card-sharp)
4. 🤝 Sponsorer (card-sharp)
5. 🏘️ Övriga intäkter — Patron + Kommunbidrag with explainers (card-sharp)
6. 📋 Föreningsaktiviteter overview (card-sharp)

## 7. Klubb-tab
- Remove leather-bars from Faciliteter, Förväntan & Profil, Tabellposition → card-sharp + card-label
- Tabellposition: replace ugly 2-row grid with a cleaner single card-sharp showing key stats inline
  - Example: `12:e · 0p · 1S 0V 0O 1F · MS -4` on one line, not a grid of boxes
- Faciliteter progress bars: tighten spacing

## 8. Akademi-tab
- Remove leather-bars from Akademinivå, Pojklaget (P17), Mentorskap → card-sharp + card-label
- Player names in P17 list: add `fontFamily: 'var(--font-display)'` (Georgia)
- P17 stats line `0V 0O 0F · GM 0 · GM mot 0 · Plats 5` → wrap in a small card-sharp for clarity
- Star ratings (★★★★): use `color: var(--accent)` for filled, `color: var(--border)` for empty
- Tighten overall spacing between sections

## 9. Akademi explainer
- Add brief intro text under Akademinivå card explaining the system:
  - "Akademin utvecklar unga spelare. Uppgradera nivån för bättre rekrytering och utveckling."
- Add explainer under Pojklaget:
  - "P17-laget spelar egna matcher. Talanger kan lyftas till A-laget."
- Add explainer under Mentorskap:
  - "Para ihop en senior med en junior för snabbare utveckling."
- Use `fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 10` for all explainers

## 10. Light header consistency
Screens with light headers (Trupp, Match, Tabell, Transfers, Inkorg) feel "naked" compared to Dashboard/Förening's dark header. Fix:
- Add `borderBottom: '1px solid var(--border)'` and `paddingBottom: 12` to the header area on these screens
- Ensure all headings use `fontFamily: 'var(--font-display)'`
- This does NOT mean adding dark headers — the distinction between "club identity" screens (dark) and "functional" screens (light) is intentional

## 11. Verification
```bash
grep -rn "shooting\|workRate\|cornerSkill\|acceleration\|defending" src/presentation/ --include="*.tsx" | grep -v "import\|enum\|interface\|type " | head -20
# Should return 0 display-facing hits (only data/logic references)
```
