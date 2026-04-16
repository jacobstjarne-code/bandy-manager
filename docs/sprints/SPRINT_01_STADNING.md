# SPRINT 01 — STÄDNING

**Tid:** ~2h · **ATGARDSBANK:** BUG-005, BUG-006, BUG-007, VIS-007, VIS-008, VIS-003, VIS-004

Visuell hygien. Samma sort av ingrepp på flera filer.

---

## BUG-005 — Hårdkodade hex i interaktions-SVG

Plats: `src/presentation/components/match/{CornerInteraction,PenaltyInteraction,CounterInteraction,FreeKickInteraction}.tsx`

Ersätt hårdkodade hex (`#E8E4DC`, `#2C2820`, `#B05040`, `#3a3530`) med CSS-variabler via `style={{ fill: 'var(--bg-surface)' }}`.

Verifiering: `grep -rn '#[0-9a-fA-F]\{6\}' src/presentation/components/match/` → 0 färger i komponentkod.

---

## BUG-006 — PenaltyInteraction blandad gradient

Plats: `PenaltyInteraction.tsx:168`

Lägg till `--danger-dark: #8B3E30` i CSS-tokens. Ersätt:
```tsx
// FÖRE: 'linear-gradient(135deg, var(--danger), #8B3E30)'
// EFTER: 'linear-gradient(135deg, var(--danger), var(--danger-dark))'
```

---

## BUG-007 — GoldConfetti färger

Sök: `grep -rn "FFD700" src/`. Om finns: `#FFD700` → `var(--accent)`, `#F5F1EB` → `var(--bg)`. Om inte finns: rapportera ❌.

---

## VIS-007 — Z-index tokens

Definiera i CSS-tokens:
```css
--z-dropdown: 100;
--z-modal: 300;
--z-overlay: 400;
--z-interaction: 500;
--z-toast: 600;
```

Ersätt:
- EventOverlay, HalftimeModal, SubstitutionModal, TacticQuickModal → `var(--z-modal)`
- CornerInteraction, PenaltyInteraction, CounterInteraction, FreeKickInteraction, LastMinutePress → `var(--z-interaction)`

Verifiering: `grep -rn "zIndex:" src/ --include="*.tsx" | grep -v "var(--z-"` → 0 rader.

---

## VIS-008 — paddingBottom token

`--scroll-padding-bottom: 120px`. Ersätt alla hårdkodade `paddingBottom`-värden i scroll-ytor.

Verifiering: `grep -rn "paddingBottom:" src/presentation/screens/ | grep -v "var(--"` → 0 rader.

---

## VIS-003 — Enhetlig SectionLabel

Skapa/harmonisera `src/presentation/components/SectionLabel.tsx`:
```tsx
export function SectionLabel({ children, emoji, style }: { children: React.ReactNode; emoji?: string; style?: React.CSSProperties }) {
  return (
    <p style={{
      fontSize: 8, fontWeight: 600, letterSpacing: '2px',
      textTransform: 'uppercase', color: 'var(--text-muted)',
      fontFamily: 'var(--font-body)', margin: 0, ...style,
    }}>{emoji && `${emoji} `}{children}</p>
  )
}
```

Ersätt inline-varianter i: DashboardScreen, GranskaScreen, SeasonSummaryScreen, ClubScreen, KlubbTab. Ta bort LABEL-konstanten i DashboardScreen.

---

## VIS-004 — Knapphierarki

Definiera fyra CSS-klasser:
- `.btn-primary` — gradient, `var(--accent-dark)` → `var(--accent-deep)`. Max 1/skärm.
- `.btn-secondary` — solid `var(--accent)`.
- `.btn-ghost` — bg-elevated + border. För val i listor/modals.
- `.btn-outline` — transparent + border. Neutrala/avbryt.

Lägg regel i `docs/DESIGN_SYSTEM.md` under "Knapphierarki". Ingen massersättning denna sprint.

---

## SLUT

`npm run build && npm test`

Rapportera per ID + BUILD/TEST-status.
