# Bandy Manager — Reference

Denna fil innehåller **referensmaterial** för Bandy Manager: arkitektur, bandy-specifika regler, key files, kalibreringsdata och Bandy-Brain-kunskapsbasen. Slå upp vid behov.

**Arbetsregler och principer** finns i `CLAUDE.md`. Denna fil dikterar inte beteende — den dokumenterar fakta du behöver känna till för att arbeta i kodbasen.

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
- weeklyBase: `3000 + reputation * 50`
- Matchintäkter BARA vid hemmamatch (`isHomeMatch = true`)
- Derby/slutspel/cup ger bonus (1.4x / 1.5x / 1.25x)
- Lönebudget (`wageBudget`) VARNAR vid överskridning men BLOCKERAR ALDRIG kontraktsförlängningar

### Transfers
- Max 3 samtidiga utgående bud (`createOutgoingBid` i `transferService.ts`)
- Scouting: 0-2 omgångar beroende på region/om man mött laget
- Budrespons: 1 omgång
- Spelarens egen vilja: `playerAcceptsTransfer` i `transferService.ts` — kollar personlighet, geografi, rivalitet (se `transferResponseText.ts` för textpool)

---

## Bandyspecifika regler (VIKTIGT)

### Spelets värld
12 fiktiva klubbar på riktiga bruksorter. Alla klubbnamn, arenanamn och klacknamn är PÅHITTADE — inga riktiga föreningar. Definerade i `CLUB_TEMPLATES` i `worldGenerator.ts`. Arena- och klacknamn är required fält.

Rivalry-par mellan fake-klubbar definierade i `src/domain/data/rivalries.ts` med `intensity: 1-3` per par (Upplandsderbyt, Bruksderbyt, Daladerbyt, etc.).

### Matchmotor-kalibrering
Kalibrerad mot 1124 Elitseriematcher (bandygrytan.se, 2019-26). Data i `docs/data/bandygrytan_detailed.json (1124 matcher, 6 säsonger)`. Nyckeltal:
- 9.12 mål/match (target), 22.2% hörnmål, 5.4% straffmål
- 50.2% hemmaseger, 11.6% oavgjort
- 54.2% av mål i 2:a halvlek

Verifieringsskript: `scripts/calibrate.ts` (varierad lagstyrka, 200 matcher).
Säsongsanalys: `scripts/analyze-stress.ts` — jämför stress-test-loggen mot bandygrytan-targets (säsongsnivå, inte per-match).

### Bandy-vokabulär — alltid använd
- **Offside FINNS i bandy** — ta aldrig bort offside-kommentarer
- **Inga gula kort** — bandy har 10 min utvisning, inte gula/röda kort
- **2 poäng för vinst** — inte 3 som i fotboll
- **Termer:** "avslag" (inte avspark), "brytning" (inte tackling), "frislag" (inte frispark), "vaden" (inte vadden)
- **Positioner:** MV, DEF (backar), HALF (halvbackar), FWD (forwards). Midfielder = Half i bandy.
- **Hörnor** = centralt offensivt vapen
- **Flygande byten** som i ishockey (inga begränsade byten)
- 🏒 (INTE ⚽) i all UI
- **"Plan"** — ALDRIG "rink". Bandy spelas på plan, inte rink. Rink = ishockey.

---

## Verifiering efter design-ändring

```bash
grep -rn "C9A84C\|c9a84c\|201,168,76\|#22c55e\|#f59e0b\|#ef4444\|#0a1520\|#0D1B2A\|#0a1e3a\|#0c2440\|#3b82f6\|#1a2e47\|234,179,8" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules
```
Måste returnera 0 resultat.

---

## Tech Stack
- React + TypeScript + Vite
- PWA deployed on Render (auto-deploy from git push)
- CSS in `src/styles/global.css` — all design tokens defined there
- No CSS modules, no Tailwind — inline styles + global CSS classes
- Server: Express (server.js) med Bandydoktorn-proxy till Anthropic API

---

## Mapp-struktur
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

---

## Key Files
- `roundProcessor.ts` — HJÄRTAT: advance-logiken, ekonomi, scouting, transfers, allt per matchdag
- `economyService.ts` — intäkts/kostnadsberäkning (calcRoundIncome)
- `scheduleGenerator.ts` — buildSeasonCalendar, generateSchedule, getRoundDate
- `cupService.ts` — cup-bracket, generateNextCupRound
- `playoffService.ts` — slutspelsserier, advancePlayoffRound
- `matchEngine.ts` — snabbsim för AI-matcher (kalibrerad mot Bandygrytan-data)
- `matchStepByStep.ts` — live-matcher (steg för steg, med yield för hörn- och straffinteraktion)
- `matchUtils.ts` — TIMING_WEIGHTS, simulatePenalties, computeWeatherEffects
- `transferService.ts` — bud, signering, executeTransfer, playerAcceptsTransfer
- `scoutingService.ts` — scoutrapporter, ARCHETYPE_STRENGTHS
- `matchCommentary.ts` — alla matchkommentarer (i src/domain/data/)
- `cornerInteractionService.ts` — hörninteraktion (zon + leverans + utfall)
- `penaltyInteractionService.ts` — straffinteraktion (placering + höjd + målvaktsval)
- `worldGenerator.ts` — CLUB_TEMPLATES med alla 12 klubbar (arenaName, supporterGroupName, region)
- `regionGeography.ts` — latitud-baserad distans mellan landskap (för transfer-bias)
- `rivalries.ts` — 9 fake-klubb-rivalry-par med intensity 1-3 (i src/domain/data/)
- `trainerArcService.ts` — tränarens arc (newcomer → legendary), mood-texter
- `supporterService.ts` — klackgenerering, favoritspelare, stämning
- `matchMoodService.ts` — matchstämning + slutsammanfattning (getFinalWhistleSummary)
- `facilityService.ts` — utbyggnadsprojekt (omklädningsrum → inomhushall)
- `pressConferenceService.ts` — presskonferenser (kontext-triggers + journalist-relation)

---

## Active Documentation

### Projektguides (läs alltid)
- `CLAUDE.md` — arbetsregler, principer, processer
- `docs/LESSONS.md` — 33 återkommande buggmönster (med kategoriserad TOC)
- `docs/DECISIONS.md` — arkitekturbeslut kronologiskt
- `design-system/` — auktoritativt designsystem. Ingång: `CODE-OPUS-INSTRUCTION.md`, sedan `README.md` + `DESIGN-DECISIONS.md`. `docs/archive/DESIGN_SYSTEM.md` är arkiverad.
- `docs/BACKLOG.md` — enda sanning för specat men ej byggt
- `docs/KVAR.md` — kronologisk leveranslogg
- `docs/STATUS.md` — enda sanning om vad som är byggt
- Senaste `docs/HANDOVER_YYYY-MM-DD.md`

### Visionsdokument (långsiktig roadmap)
- `docs/THE_BOMB.md` — narrativ vision: korsreferenser mellan system, milestone-moments, atmosfär, share-images
- `docs/SPEC_KLUBBUTVECKLING.md` — ekonomisk progression: utbyggnadsträd, sponsortillväxt, löneeskalering, inomhushallen

### Kalibreringsdata
- `docs/data/bandygrytan_detailed.json` — 1242 elitseriematcher (2019-26, inkl slutspel)
- `docs/data/SCORELINE_REFERENCE.md` — utvisningar/straff per spelläge, period, fas — normaliserat
- `docs/data/ANALYS_MATCHMONSTER.md` — hela matchen (comeback, utvisningstid, hemmafördel)
- `docs/data/ANALYS_SLUTSPEL.md` — grundserie vs KVF/SF/Final
- `docs/data/SCHEMA_DETAILED.md` — schema för detaljerad per-match-data

### Kalibreringsskript
- `scripts/calibrate.ts` — kör 200 matcher med varierad lagstyrka, jämför mot targets
- `scripts/calibrate_v2.ts` — 7-sektionsanalys av bandygrytan + motorsimulering + scoreline-extraktion
- `scripts/stress-test.ts` — 10×5 säsonger headless, loggar `stress/season_stats.json`
- `scripts/analyze-stress.ts` — jämför stress-logg mot bandygrytan-targets (sektion A-G)

### Aktuella sprintdokument
Lever kort, arkiveras efter audit.
- `docs/sprints/SPRINT_25B_1_PENALTY_SEPARATION.md` — aktiv spec
- `docs/sprints/SPRINT_25A_2_AUDIT.md` — senast godkänd audit
- `docs/sprints/SPRINT_24_2_AUDIT.md` — senast godkänd audit

Alla äldre sprintdokument och fixspecar ligger i `docs/archive/`.

---

## BANDY-BRAIN — Kunskapsbasen

Bandy-Brain är ett biprojekt som lagrar atomära facts om bandy — regler, statistiska parametrar, designval och världskanon. Det lever i `docs/findings/facts/` och `docs/findings/hypotheses/`. Schemat finns i `docs/findings/SCHEMA.md`.

### Namnrymd

| Prefix | Mapp | Innehåll |
|--------|------|----------|
| R001– | `facts/rules/` | Bandyregler (SBF/FIB) |
| S001– | `facts/stats/` | Bandygrytan-data |
| D001– | `facts/design_principles/` | Spelets designval |
| W001– | `facts/world_canon/` | Fiktiv värld |
| H001– | `hypotheses/` | Öppna frågor |

### Regler för att skriva ett fact

1. **Rotorsak före fact.** Formulera i en mening varifrån värdet kommer och varför du tror det. Vet du inte — slå upp källan.

2. **Verifiera mot källa, inte mot minne.** Innan `verified_at` uppdateras: räkna ut värdet ur rådata eller läs koden. Att ett värde "ser rimligt ut" räcker inte.

3. **Invarianter ska vara sanna vid skrivtillfället.** Skriv inte ett invariant du inte kan verifiera nu. Typ 3 (code-cross-reference) är undantag — märk dem tydligt.

4. **Revision vid meningsfull ändring.** Vardagliga `verified_at`-uppdateringar kräver ingen revision. Värdeändringar, omtolkningar eller metodbyten kräver det.

5. **deprecated, aldrig raderat.** Om ett fact är fel — sätt `status: deprecated` och skapa nytt ID. Gamla ID:n återanvänds inte.

### Regler för att konsultera ett fact

- Slå upp fact-ID:t i rätt mapp (`facts/{kategori}/{id}_*.yaml`)
- Kontrollera `status: active` — deprecated-facts gäller inte längre
- Kolla `verified_at` — är det mer än 6 månader sedan? Verifiera på nytt om beslutet är viktig för pågående arbete
- Cross-fact-invarianter (`value >= S002.value`) är *dokumentation*, inte automatiskt verifierade — kontrollera manuellt

### Pass-struktur

- **Pass 1** — schema + mappstruktur (klar 2026-04-25)
- **Pass 2** — migrering av befintliga kalibreringskonstanter (klar 2026-04-25)
- **Pass 3** — validator-skript (YAML-validering + numeriska invarianter)
- **Pass 4** — Eriks UI (framtida, beslutas separat)

### Verifieringsprotokoll vid pass-slut

Ingen pass får markeras klar utan att dessa steg gjorts:

```
□ Alla nya facts har status: active (inte draft)
□ Alla numeriska invarianter är manuellt verifierade mot källan
□ Cross-fact-invarianter är kontrollerade (S002 + S004 + S005 = 100?)
□ Inga ID:n dubblerade (grep -r "fact_id:" docs/findings/facts/)
□ SCHEMA.md pass-checklista uppdaterad
□ commit: "facts: pass X — [kort beskrivning]"
```
