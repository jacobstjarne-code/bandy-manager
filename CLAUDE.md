# Bandy Manager — Project Instructions for Claude Code

## CURRENT PRIORITY: Visual Design Implementation

**READ `docs/MOCKUP_IMPLEMENTATION_GUIDE.md` BEFORE writing any visual/styling code.**

HTML mockups exist in `docs/mockups/`. Open them in Chrome to see the target design. They are the source of truth.

## Key Design Rules

1. **Leather-bar ONLY on NextMatchCard** — all other cards use inline `card-label` pattern (9px uppercase muted + emoji)
2. **Every navigable card has a `›` button** — 18×18px, transparent bg, 1px border, copper accent
3. **BandyPitch = white ice** — gradient #F5F1EB→#FAFAF8→#F0ECE4, NOT navy
4. **Player circles on pitch = transparent** — `rgba(255,255,255,0.5)` fill, dark `#1A1A18` text
5. **BottomNav** — NavLink needs `style={{ flex: 1, display: 'flex' }}` for equal tab widths
6. **Dark headers** — only Dashboard, ClubScreen, BoardMeeting, NewGame. All other screens = light.
7. **Träningsprojekt above Daglig träning** on ClubScreen
8. **No hardcoded colors** — use CSS variables from global.css. Zero tolerance for `#C9A84C`, `#22c55e`, `#0a1e3a` etc.

## Verification after ANY design change

```bash
grep -rn "C9A84C\|c9a84c\|201,168,76\|#22c55e\|#f59e0b\|#ef4444\|#0a1520\|#0D1B2A\|#0a1e3a\|#0c2440\|#3b82f6\|#1a2e47\|234,179,8" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules
```
Must return 0 results.

## Tech Stack
- React + TypeScript + Vite
- PWA deployed on Render (auto-deploy from git push)
- CSS in `src/styles/global.css` — all design tokens defined there
- No CSS modules, no Tailwind — inline styles + global CSS classes

## Architecture
- `src/domain/` — game logic, entities, services (pure TypeScript, no React)
- `src/presentation/` — React components, screens, navigation
- `src/presentation/components/SectionCard.tsx` — shared card component with leather-bar
- `src/presentation/screens/` — one file per screen
- `src/presentation/navigation/BottomNav.tsx` — bottom navigation

## Commit Convention
One commit per screen. Push immediately after each commit.
```
Design: [screen name] — mockup implementation
```
