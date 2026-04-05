# Bandy Manager — Project Instructions for Claude Code

## DESIGN SYSTEM — LÄS FÖRST

**`docs/DESIGN_SYSTEM.md`** — Komplett designsystem. LÄS DENNA INNAN du gör NÅGON visuell ändring. Reglerna är:
- Tight layout (padding 10px 14px, margin 8px, gap 6-8px)
- `card-sharp` för alla kort — INTE inline borderRadius
- Emojis på alla sektionslabels (💰 EKONOMI, 🏒 MATCHEN, etc.)
- Inga rubriker på BottomNav-skärmar
- CSS-variabler ENBART — inga hårdkodade färger
- Events som overlay (zIndex 300) — INTE egna routes

## VERIFIERINGSPROTOKOLL — OBLIGATORISKT

Gäller ALLA som granskar eller implementerar: Claude Code, 
Opus, eller Jacob. Ingen genväg. Ingen "finns = funkar".

### Vid kodgranskning / audit:

**1. LÄS PARENT FÖRST, INTE CHILDREN.**
Börja ALLTID med skärm-filen (t.ex. MatchScreen.tsx), inte 
komponent-filerna. Följ renderingsflödet uppifrån och ner:
- Vad renderas?
- I vilken ordning?
- Med vilka props?
- Finns redundans (samma info visad två gånger)?

**2. ALDRIG "✅ finns" — ALLTID "✅ renderas korrekt i kontext".**
Att en komponent existerar som fil betyder INGENTING. 
Den måste:
- Importeras i rätt parent
- Få rätt props
- Renderas på rätt plats i DOM-trädet
- INTE dupliceras av en annan komponent som gör samma sak

**3. FÖR UI: FÖLJ VAD SPELAREN SER.**
Tänk: "Om jag öppnar denna skärm, vad ser jag uppifrån 
och ner?" Läs renderingsordningen i JSX:
- Är det dubbel-header? (vanligaste felet)
- Har alla kort samma margin/padding?
- Klipps något av?
- Är visuell hierarki konsekvent?

**4. FÖR SPELLOGIK: TRACESA ETT KOMPLETT FLÖDE.**
Säg aldrig "cupService finns ✅" — tracesa istället:
- Vad händer vid säsongsstart? (scheduleGenerator)
- Vilka fixtures skapas? (logga matchday, isCup, roundNumber)
- Vad händer vid advance()? (roundProcessor)
- I vilken ordning spelas matcher?

Gör detta med PEN OCH PAPPER-logik — följ variablerna 
steg för steg, inte "det ser rätt ut".

**5. VID TVEKSAMHET: VISA KODEN, INTE SLUTSATSEN.**
Om du inte kan verifiera 100% — visa den relevanta koden 
och säg "jag ser X men kan inte bekräfta Y utan att köra". 
ALDRIG "allt ser bra ut" om du inte har tracesat flödet.

**6. CHECKLISTA EFTER VARJE IMPLEMENTATION:**
```
□ Läst PARENT-filen och bekräftat renderingsordning?
□ Kollat att ingen annan komponent renderar samma sak?
□ Kontrollerat margin/padding mot E9 (0 12px page, 14px 16px card)?
□ Bekräftat att alla props skickas korrekt från parent?
□ Kört npm run build && npm test?
□ Verifierat med grep-kommandon (om specen har sådana)?
```

### Vanliga felmönster att ALLTID kolla:

- **Dubbel-header:** Parent renderar matchinfo OCH child-komponent 
  renderar matchinfo → spelaren ser samma info två gånger
- **"finns = funkar":** Service-fil existerar men importeras aldrig 
  eller anropas med fel parametrar
- **Visuell inkonsistens:** Kort på samma skärm har olika margin 
  p.g.a. att de skapats vid olika tillfällen
- **Cup-scheduling:** matchday-nummer måste verifieras genom att 
  LISTA alla fixtures i kronologisk ordning, inte bara "kolla att 
  cupService existerar"
- **Advance-hopp:** roundProcessor.ts anropas ibland dubbelt — 
  kolla alla ställen som anropar advance()

---

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
- **"Plan"** — ALDRIG "rink". Bandy spelas på plan, inte rink. Rink = ishockey.

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
- `docs/VERIFIERAD_RESTLISTA.md` — aktuell restlista (verifierad mot kod)
- `docs/RESTLISTA.md` — gameplay-buggar och teststatus

## Commit Convention
```
fix: [short description]
feat: [short description]
design: [short description]
refactor: [short description]
```
