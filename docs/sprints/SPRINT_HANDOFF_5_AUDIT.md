# HANDOFF #5 — Button system — Audit 2026-05-05

Spec: `design-system/preview/components-buttons.html`
Implementation: `src/styles/global.css`
Kanonisk bas: `design-system/preview/_base.css`

Headless-miljö — inga browser-screenshots. Alla värden verifierade mot källkod och mock-HTML numeriskt.

---

## Punkter i spec

- [x] **Hover-state** — `.btn:hover` + variant-specifika hover-regler
- [x] **Loading-variant** — `.btn-loading` + `::before` spinner + `@keyframes spin`
- [x] **Focus-ring** — `.btn:focus-visible`
- [x] **Disabled copper** — `.btn-primary:disabled` + `.btn-cta:disabled` uppdaterade
- [x] **Hit-target 44 px** — `.btn-icon-lg` tillagd
- [x] **Segmented toggle** — `.btn-segmented` wrapper + child-regler
- [x] **Ghost danger** — befintligt mönster (`.btn-ghost` + `color: var(--danger)` inline) — ingen ny klass behövs, dokumenterat i mock

---

## Kod-verifiering per ändring

### Hover-states (global.css)

| Selector | Värden | Match mot mock |
|----------|--------|---------------|
| `.btn:hover` | `translateY(-1px)`, `brightness(1.05)` | ✅ |
| `.btn-primary:hover` | `translateY(-1px)`, `box-shadow: 0 5px 14px rgba(162,88,40,0.45)`, `brightness(1.05)` | ✅ exakt mock rad 24 |
| `.btn-secondary:hover` | `translateY(-1px)`, `brightness(1.05)`, `box-shadow: 0 4px 10px rgba(196,122,58,0.35)` | ✅ |
| `.btn-danger:hover` | `translateY(-1px)`, `brightness(1.05)`, `box-shadow: 0 5px 14px rgba(176,80,64,0.45)` | ✅ |

### Active-states (filter tillagd)

| Selector | Nytt värde | Tidigare |
|----------|------------|----------|
| `.btn:active` | `filter: brightness(0.95)` | saknades |
| `.btn-primary:active` | `filter: brightness(0.95)` | saknades |

Transition uppdaterad: `box-shadow 0.15s, transform 0.1s, filter 0.15s`

### Focus-visible

`.btn:focus-visible` → `outline: 2px solid var(--accent); outline-offset: 2px` ✅

### Disabled copper

`.btn-primary:disabled` → `background: #B8A48C; opacity: 0.5; box-shadow: none; cursor: not-allowed`
`.btn-cta:disabled` → Samma (`#B8A48C`, `opacity: 0.5`) — ersätter tidigare `var(--border)` / `var(--text-muted)`

UX-notes i mock explicit: "bleka copper, inte grå border". ✅

### Spinner + loading

`@keyframes spin { to { transform: rotate(360deg); } }` — tillagd i animationssektionen.

`.btn-loading`:
- `font-style: italic`
- `gap: 8px`
- `cursor: wait`
- `::before`: `10×10px`, `border: 1.5px solid currentColor`, `border-top-color: transparent`, `border-radius: 50%`, `animation: spin 0.8s linear infinite` ✅ exakt mock rad 28

### Icon-only

`.btn-icon` → `padding: 7px; width: 34px; height: 34px` — sekundär yta ✅
`.btn-icon-lg` → `padding: 11px; width: 44px; height: 44px` — primär yta (BottomNav/FAB) ✅

### Segmented toggle

`.btn-segmented` → `display: inline-flex; border: 1px solid var(--border); border-radius: 8px; overflow: hidden`
`.btn-segmented > .btn` → `border-radius: 0; border: none; box-shadow: none`
`.btn-segmented > .btn.active` → `background: var(--accent); color: var(--text-light)` ✅ exakt mock rad 47-48

---

## Befintliga klasser — inga regressioner

| Klass | Status | Verifiering |
|-------|--------|-------------|
| `.btn-primary` — gradient, färg, shadow | Oförändrad | ✅ |
| `.btn-outline` — border accent, bakgrund transparent | Oförändrad | ✅ |
| `.btn-ghost` — bg-surface, border-dark | Oförändrad | ✅ |
| `.btn-secondary` — accent bakgrund | Oförändrad | ✅ |
| `.btn-danger` — danger gradient | Oförändrad | ✅ |
| `.btn-copper` / `.btn-copper:active` | Oförändrade (legacy, behålls) | ✅ |
| `.btn-cta` — storlek, typografi | Oförändrad | ✅ |
| `.btn-pulse` | Oförändrad | ✅ |

Befintliga `.btn-primary`-användningar (Dashboard CTA, EventCardInline) får hover/active/focus gratis — ingen kodbas-ändring krävs.

---

## Ej levererat (utanför scope)

- `SegmentedToggle`-komponent som `.tsx` — spec explicit: "ej i denna sprint"
- `loading`-prop på Button-komponent — spec explicit: "klassen räcker"

---

## Pixel-jämförelse

Headless-miljö — inga browser-screenshots möjliga. Awaiting browser-playtest av Jacob.
Numerisk verifiering: alla värden kopierade bokstavligt från mock-HTML (rad-referenser ovan).

---

## Build + test

```
tsc --noEmit → rent (0 fel)
```

CSS-only ändringar påverkar inga TypeScript-typer.
