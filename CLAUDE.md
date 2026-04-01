# Bandy Manager — Project Instructions for Claude Code

## DESIGN SYSTEM — LÄS FÖRST

**`docs/DESIGN_SYSTEM.md`** — Komplett designsystem. LÄS DENNA INNAN du gör NÅGON visuell ändring. Reglerna är:
- Tight layout (padding 10px 14px, margin 8px, gap 6-8px)
- `card-sharp` för alla kort — INTE inline borderRadius
- Emojis på alla sektionslabels (💰 EKONOMI, 🏒 MATCHEN, etc.)
- Inga rubriker på BottomNav-skärmar
- CSS-variabler ENBART — inga hårdkodade färger
- Events som overlay (zIndex 300) — INTE egna routes

## ARCHITECTURE OVERVIEW

### Matchday-systemet (refaktorerat mars 2026)
Fixture-ordningen styrs av `fixture.matchday` — ett heltal som bestämmer global spelordning. Sätts EN gång vid fixture-generering. Ingen beräkning behövs vid runtime.

- **Liga:** matchday 1-22 (motsvarar ligaomgång 1-22)
- **Cup:** inflikas mellan ligarunder via `CUP_AFTER_LEAGUE_ROUND` i `scheduleGenerator.ts`:
  - Cup R1 (förstarunda) → matchday 3
  - Cup R2 (kvartsfinal) → matchday 8
  - Cup R3 (semifinal) → matchday 13
  - Cup R4 (final) → matchday 19
- **Slutspel:** matchday 27+ (genereras dynamiskt vid playoffTransition)
  - Kvartsfinal: matchday 27-31
  - Semifinal: matchday 32-36
  - Final: matchday 37+
- `buildSeasonCalendar()` i `scheduleGenerator.ts` returnerar hela säsongens matchdagsordning
- `advanceToNextEvent()` i `roundProcessor.ts` sorterar på `fixture.matchday`
- **VIKTIGT:** Använd ALDRIG `effectiveRound()` eller `roundNumber - 100`. All ordning via `matchday`.

### Ekonomi
- `calcRoundIncome()` i `economyService.ts` — enda stället för intäktsberäkning
- Capacity: `reputation * 7 + 150` (anpassat för svenska bandyklubbar, 200-700 åskådare)
- weeklyBase: `reputation * 120`
- Matchintäkter BARA vid hemmamatch (`isHomeMatch = true`)
- Derby/slutspel/cup ger bonus (1.4x / 1.5x / 1.25x)
- Lönebudget (`wageBudget`) VARNAR vid överskridning men BLOCKERAR ALDRIG kontraktsförlängningar

### Transfers
- Max 3 samtidiga utgående bud (`createOutgoingBid` i `transferService.ts`)
- Scouting: 0-2 omgångar beroende på region/om man mött laget
- Budrespons: 1 omgång

## Bandyspecifika regler (VIKTIGT)

- **Offside FINNS i bandy** — ta aldrig bort offside-kommentarer
- **Inga gula kort** — bandy har 10 min utvisning, inte gula/röda kort
- **2 poäng för vinst** — inte 3 som i fotboll
- **Termer:** "avslag" (inte avspark), "brytning" (inte tackling), "frislag" (inte frispark), "vaden" (inte vadden)
- **Positioner:** MV, DEF (backar), HALF (halvbackar), FWD (forwards). Midfielder = Half i bandy.
- **Hörnor** = centralt offensivt vapen
- **Flygande byten** som i ishockey (inga begränsade byten)
- 🏒 (INTE ⚽) i all UI

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
- Server: Express (server.js) med Bandydoktorn-proxy till Anthropic API

## Architecture
- `src/domain/` — game logic, entities, services (pure TypeScript, no React)
- `src/domain/data/` — statisk data (matchCommentary, rivalries, playerNames, politicianData)
- `src/domain/services/` — spellogik (matchSimulator, economyService, cupService, playoffService, etc)
- `src/domain/services/events/` — event-generering (politicianEvents, communityEvents, etc)
- `src/application/useCases/` — orkestrering (roundProcessor, seasonEndProcessor, playoffTransition)
- `src/presentation/` — React components, screens, navigation
- `src/presentation/screens/` — one file per screen
- `src/presentation/components/` — delade komponenter
- `src/presentation/components/dashboard/` — NextMatchCard, LastResultCard, etc
- `src/presentation/components/match/` — LineupStep, LineupFormationView, MatchDoneOverlay, etc
- `src/presentation/navigation/BottomNav.tsx` — bottom navigation

## Key Files
- `roundProcessor.ts` — HJÄRTAT: advance-logiken, ekonomi, scouting, transfers, allt per matchdag
- `economyService.ts` — intäkts/kostnadsberäkning (calcRoundIncome)
- `scheduleGenerator.ts` — buildSeasonCalendar, generateSchedule, getRoundDate
- `cupService.ts` — cup-bracket, generateNextCupRound
- `playoffService.ts` — slutspelsserier, advancePlayoffRound
- `matchSimulator.ts` — AI-matcher (snabbsim)
- `matchStepByStep.ts` — live-matcher (steg för steg)
- `transferService.ts` — bud, signering, executeTransfer
- `scoutingService.ts` — scoutrapporter, ARCHETYPE_STRENGTHS
- `matchCommentary.ts` — alla matchkommentarer (i src/domain/data/)

## Active Documentation
- `docs/DESIGN_SYSTEM.md` — designregler, mönster, konventioner
- `docs/DESIGN_BUGG_SPRINT.md` — aktuell design-sprint (15 fixar)
- `docs/RESTLISTA.md` — gameplay-buggar och teststatus

## Commit Convention
```
fix: [short description]
feat: [short description]
design: [short description]
refactor: [short description]
```
