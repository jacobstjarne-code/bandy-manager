---
name: bandy-manager-design
description: Use this skill to generate well-branded interfaces and assets for Bandy Manager — a Swedish elite-bandy club management PWA — either for production or throwaway prototypes/mocks. Contains colors, typography, iconography rules, writing voice (Swedish, terse, heritage), component primitives, and a mobile UI kit.
user-invocable: true
---

# Bandy Manager Design Skill

Read `README.md` first — it carries the product context, the full palette and type scale, the Swedish copywriting voice, the emoji map, the iconography system (Lucide + emoji), and the hard visual rules.

Then explore:

- `colors_and_type.css` — paste into any artifact to get the full token set (`--bg`, `--bg-surface`, `--bg-dark`, `--bg-leather`, `--accent`, `--accent-dark`, `--accent-deep`, `--success`, `--danger`, `--ice`, `--font-display`, `--font-body`, seasonal gradients `--bg-october` → `--bg-april`, match-weather bg `--match-bg-rain/snow/cold/fog/wind`, LED scoreboard `--led-*`, archetype badge colors `--arch-*`). Also defines semantic type roles: `.h-display-xl/lg/md/sm`, `.h-card`, `.h-body`, `.h-label`, `.h-quote`, `.h-cta`.
- `preview/` — small HTML specimen cards for colors, type, spacing, shadows, buttons, tags, cards, CTA, phase indicator, bottom nav. Good reference for copy-paste snippets.
- `ui_kits/bandy-manager-pwa/` — a high-fidelity React recreation of the mobile app with component JSX (`GameHeader`, `PhaseIndicator`, `BottomNav`, `NextMatchCard`, `SectionLabel`, `CardSharp`, `CardRound`, `ClubBadge`, `FormDots`, `CtaButton`, `DiamondDivider`) and a click-thru `index.html`. Copy components out; they are simplified cosmetic versions of the real app.
- `assets/` — primary logo (`bandymanager-logo.png`), app icons, intro background.

## Default rules when designing

- **Mobile-first**, 375–430 px wide. No desktop layouts.
- **Swedish copy** everywhere. Terse, factual voice; italic Georgia for atmospheric quotes.
- **One `.btn-primary` per screen.** All CTAs that close a screen use `.btn .btn-primary .btn-cta`.
- **Two card primitives only.** `.card-sharp` (8 px radius, data) or `.card-round` (14 px radius, narrative).
- **Section labels**: 8 px / 600 / +2 px letter-spacing / UPPERCASE / emoji prefix (e.g. `🏒 MATCHEN`).
- **Icons**: emoji for categories, `lucide-react` at 1.8 stroke for chrome. Never mix in other icon libraries.
- **Colors via CSS vars only.** No hex literals in component code.
- **Bandy vocabulary**: 🏒 only (never ⚽), "plan" (never "rink"), 2 pts for a win, 10-min penalty (no yellow/red cards), positions MV/B/YH/MF/A.

## Sync with the code project

This design system is the **source of truth** for all UI decisions. Before making any UI change in the `bandy-manager` codebase, read:

- `HANDOFF.md` — current outstanding design-to-code tasks (changelog-style, per-file)
- `SYNC.md` — two-way status manifest (which tokens/components/assets are in sync)
- the relevant `preview/*.html` card for the thing you're touching

When a task in `HANDOFF.md` is done in code, update its status to `[x]` and flip the matching row in `SYNC.md` from `⚠` to `✓`.

**Three areas are explicitly blocked pending design work** and must not be "fixed" ad-hoc in code:
1. Custom 24-piktogram serie (replaces `EMOJI_MAP`)
2. Custom 6-ikons BottomNav set
3. 12 researchade klubbmärken (ersätter placeholder-SVGs i `ClubBadge.tsx`)

## When invoked

If the user invokes this skill with no guidance, ask what they want to build (onboarding flow, new screen, marketing asset, slide, print handout) and act as an expert Bandy Manager designer. Output static HTML artifacts for mocks/prototypes, or production React code if they indicate they're working in the codebase.

If creating visual artifacts, copy assets out of this skill's `assets/` folder and write self-contained HTML files for the user to view. If working in production code, read these rules and lift tokens directly from `colors_and_type.css`.
