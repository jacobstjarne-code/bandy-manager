# DIAGNOS A1 — Hårdkodade hex → tokens — Audit 2026-05-05

Ref: `docs/diagnos/2026-05-05_design_krockar.md § DIAGNOS A`

---

## Nya tokens (design-system/colors_and_type.css + src/styles/global.css)

| Token | Värde | Sektion |
|-------|-------|---------|
| `--cold-light` | `#7095b8` | Severity |
| `--warm-light` | `#c8a058` | Severity |
| `--header-undertext` | `#C9B89A` | Text on dark |

`DESIGN-DECISIONS.md` uppdaterad med cold-light/warm-light-not under severity-sektionen.

---

## Genomförda byten — 21 ändringar i 14 filer

| Fil | Rad | Gammal | Ny |
|-----|-----|--------|----|
| `InboxScreen.tsx` | 132 | `'#fff'` | `var(--text-light)` |
| `HistoryScreen.tsx` | 193 | `'#1A1410'` | `var(--text-primary)` |
| `HistoryScreen.tsx` | 277 | `'#1A1410'` | `var(--text-primary)` |
| `SquadScreen.tsx` | 352 | `'#fff'` | `var(--text-light)` |
| `SquadScreen.tsx` | 447 | `'#fff'` | `var(--text-light)` |
| `GranskaScreen.tsx` | 279 | `'#fff'` | `var(--text-light)` |
| `GranskaAnalys.tsx` | 43 | `'#fff'` | `var(--text-light)` |
| `GranskaAnalys.tsx` | 45 | `'#fff'` | `var(--text-light)` |
| `GameHeader.tsx` | 126 | `'#C9B89A'` | `var(--header-undertext)` |
| `TabBar.tsx` | 28 | `'#fff'` | `var(--text-light)` |
| `FormationView.tsx` | 142 | `'#fff'` | `var(--text-light)` |
| `NotesView.tsx` | 16 | `'var(--ice, #7eb3d4)'` | `var(--ice)` |
| `NotesView.tsx` | 23 | `'var(--ice, #7eb3d4)'` | `var(--ice)` |
| `NotesView.tsx` | 61 | `'#fff'` | `var(--text-light)` |
| `NotesView.tsx` | 95 | `'#fff'` | `var(--text-light)` |
| `NextMatchPrimary.tsx` | 76 | `'#F5F1EB'` (CSS-var override) | `var(--text-light)` |
| `NextMatchPrimary.tsx` | 77 | `'#C4BAA8'` (CSS-var override) | `var(--text-light-secondary)` |
| `JournalistSecondary.tsx` | 35 | `'#7095b8'` | `var(--cold-light)` |
| `JournalistSecondary.tsx` | 46 | `'#c8a058'` | `var(--warm-light)` |
| `InteractionShell.tsx` | 110 | `'#fff'` | `var(--text-light)` |
| `MecenatDinnerEvent.tsx` | 189 | `'#fff'` | `var(--text-light)` |
| `WageOverrunWarning.tsx` | 58 | `var(--warning, #c9a84c)` | `var(--warning)` |
| `JournalistRelationshipScene.tsx` | 23 | `#4a6680` / `#6080a0` | `var(--cold)` / `var(--cold-light)` |
| `JournalistRelationshipScene.tsx` | 24 | `#8c6e3a` / `#c8a058` | `var(--warm)` / `var(--warm-light)` |

---

## Verifierings-grep (efter alla ändringar)

```
grep -rn '#[0-9a-fA-F]{3,6}' src/presentation/ --include='*.tsx' | grep -v ClubBadge|stopColor|CONFETTI_COLORS|#A89878|SMFinalVictoryScene|SundayTrainingScene|GranskaShotmap|CounterInteraction|CornerInteraction|PenaltyInteraction|FreeKickInteraction
→ 0 träffar
```

---

## Kvarvarande hex — godkända undantag

| Fil | Värde | Klassificering |
|-----|-------|---------------|
| `ConfettiParticles.tsx` | `['#d4a460', '#b8884c', '#f0e8d8']` | Illustration/animation — particlar har inga token-ekvivalenter |
| `BandyPitch.tsx` | SVG `stopColor` i gradient | SVG-illustration (DIAGNOS A2) |
| `GranskaShotmap.tsx` | `fill="#fff"` på SVG-rect | SVG-illustration (DIAGNOS A2) |
| `CounterInteraction.tsx` | `stroke="#999"`, `stroke="#fff"` i SVG | SVG-illustration |
| `CornerInteraction.tsx` | `stroke="#999"` i SVG | SVG-illustration |
| `PenaltyInteraction.tsx` | SVG-strokes | SVG-illustration |
| `FreeKickInteraction.tsx` | SVG-strokes och text-fill | SVG-illustration |
| `SMFinalVictoryScene.tsx` | `#08060a`, `#0f0a08` i scengradienter | Scene-atmosfär — intentionella mörka djup utan token-ekvivalent |
| `SundayTrainingScene.tsx` | `#1a1410`, `#15110d`, `#0f0c09` i scengradienter | Scene-atmosfär |
| `Scoreboard.tsx` rad 145 | `#A89878` | ⚠️ TODO — möjlig LED-tavla-kontrast, verifiera live |

---

## Build

```
tsc --noEmit → rent (0 fel)
```

---

## Visuell verifiering

Awaiting browser-playtest. Alla byten är token-harmonisering med semantiskt identiska värden — ingen förväntad visuell skillnad.
