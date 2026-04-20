# Bandy Manager — Project Instructions for Claude Code

## LÄS VID SESSIONSTART — OBLIGATORISKT

1. **`docs/LESSONS.md`** — återkommande buggmönster. Känn igen innan du fixar. Om en ny bugg matchar ett mönster där, använd lärdomen först.
2. **`docs/DECISIONS.md`** — arkitekturbeslut.
3. **`docs/DESIGN_SYSTEM.md`** — visuell grund.
4. **Aktuell sprintfil** i `docs/sprints/`.

---

## ROTORSAK FÖRE FIX — OBLIGATORISKT

Innan kod ändras för att fixa en bugg, formulera i EN mening VARFÖR buggen uppstod. Om du inte kan formulera det — läs mer kod innan du rör något.

Commit-meddelande ska innehålla rotorsaken:

**Rätt:**
```
fix: shotmap prickar klumpade — rot: nextPos('goal') y-range var
20-70 istf 10-90 så alla skott hamnade i målområdet
```

**Fel:**
```
fix: shotmap prickar klumpade — justerade koordinater
```

---

## SJÄLVAUDIT EFTER VARJE SPRINT — OBLIGATORISKT

Ingen sprint får markeras klar utan `docs/sprints/SPRINT_XX_AUDIT.md`.

Mall:

```markdown
# Sprint XX — audit

## Punkter i spec
- [x] 22A Spelarkort-modal scroll — verifierat i: PlayerModal öppnad från Trupp-vy, scrollade hela vägen till EGENSKAPER
- [x] 22B Porträtt-koordinater — verifierat i: Trupp-vy (22px cirklar) + PlayerModal (stor version), ansikten centrerade
- [ ] 22C Trupp-flikar — INTE LEVERERAD, orsak: [beskrivning]
- ...

## Observerat i UI
Öppnade appen som ny manager i Målilla. Navigerade:
- Dashboard → syns normalt
- Trupp → filter + flikar (Startelva/Bänken/Reserv) synliga, klickbart
- PlayerModal → öppnar korrekt som overlay, scrollar till botten
- ...

## Ej levererat (med orsak)
[punkter som inte gick att slutföra — VARFÖR, inte vad]

## Nya lärdomar till LESSONS.md
[om någon bugg i denna sprint matchade ett mönster som borde loggas]
```

"Verifierat i" ska vara en konkret observation i appen, inte "komponenten finns i filen".

---

## ÅTERKOMMANDE BUGG — UPPDATERA LESSONS.md

Om en bugg uppträder 2+ gånger, eller om en ny bugg matchar ett mönster som redan finns i `docs/LESSONS.md` — uppdatera `LESSONS.md` innan fixen committeras. Lägg till under "Historik" i relevant lärdom, eller skapa ny lärdom om mönstret är nytt.

---

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

## SPEC-LYDNAD — OBLIGATORISKA REGLER (Code)

### 1. KOPIERA BOKSTAVLIGT
När en spec ger kod att kopiera — kopiera den EXAKT.
Ändra INGENTING utan att explicit fråga först.
Om koden inte kompilerar, beskriv felet och föreslå
en minimal ändring — men gör den inte själv utan godkännande.

### 2. ÄNDRA ALDRIG SPEC-GIVNA VÄRDEN
ALDRIG ändra spec-givna värden (px, färger, texter, props).
`padding: 14px 16px` betyder 14px 16px, inte 12px 14px.
`fontSize: 11` betyder 11, inte 12.
Om ett värde skapar ett problem — rapportera problemet,
ändra inte värdet.

### 3. INGA "FÖRBÄTTRINGAR" AV SPEC-KOD
Spec-kod ska inte "förbättras", "städas" eller "optimeras".
Om specen ger props — behåll dem även om de verkar oanvända.
Om specen ger en text — kopiera den bokstavligt, omformulera inte.
Om TypeScript klagar på spec-kod — fixa typfelet, ta inte bort koden.

### 4. DIFF-VERIFIERING EFTER VARJE EDIT
Efter varje edit: visa exakt diff av vad du ändrade.
Om diffen inte matchar specen — STOPPA och fråga.
Gör ALDRIG flera edits utan att visa diff emellan.

---

## KVALITETSPORTAR — OBLIGATORISKT FÖRE COMMIT

Dessa steg är INTE valfria. De körs efter VARJE deluppgift,
inte bara i slutet. Att skippa dem = att leverera trasig kod.

### PORT 1: Build + Test (efter varje ändring)
```bash
npm run build && npm test
```
OM build failar: FIXA OMEDELBART. Commit aldrig broken build.
OM test failar: FIXA eller förklara varför testet är felaktigt.
ALDRIG kommentera bort eller ta bort ett test för att det failar.

### PORT 2: Manuell verifiering (efter varje UI-ändring)
För VARJE UI-ändring, gör denna checklista i terminalen:
```bash
# 1. Inga hårdkodade färger
grep -rn '#[0-9a-fA-F]\{3,8\}' src/ --include="*.tsx" | grep -v node_modules | grep -v ClubBadge | grep -v global.css | grep -v SVG
# Ska returnera 0 relevanta resultat (exkludera badges, SVG, global.css)

# 2. Inga "rink" kvar
grep -rni 'rink' src/ --include="*.ts" --include="*.tsx" | grep -v node_modules
# Ska returnera 0

# 3. Import-verifiering: alla nya imports används
# Kör build — TypeScript fångar unused imports
```

### PORT 3: Render-flöde (efter varje ny komponent)
Innan du säger att en komponent är klar:
1. Hitta PARENT-filen som renderar den
2. Bekräfta att props skickas korrekt
3. Bekräfta att ingen ANNAN komponent renderar samma information
4. Visa: "Parent: X.tsx → renderar <MyComponent prop1={a} prop2={b} />"

### PORT 4: Dupliceringskontroll (efter varje sprint)
```bash
# Sök efter duplicerad logik
grep -rn 'getFormGuide\|getFormResults\|recentForm' src/ --include="*.tsx" --include="*.ts" | grep -v node_modules
# Varje utility ska ha EN källa
```
För varje ny feature: kolla om samma sak redan implementeras
någon annanstans. Om ja — ÅTERANVÄND, skapa inte dubblett.

### PORT 5: Textgranskning (efter varje ny svensk text)
Alla nya svenska strängar → `docs/textgranskning/TEXT_REVIEW_{feature}_{datum}.md`
En fil per feature. Inte optional.

### KONSEKVENSER VID SKIP
Om en port skippas och buggen hittas i playtest:
- Buggen går FÖRST i nästa sprint (före nya features)
- En "post-mortem" rad läggs till i commit:
  `fix: [bugg] — missad av port X, orsak: [förklaring]`

---

## LÖPANDE KVALITET — OBLIGATORISKT

Utöver spec-lydnad och kvalitetsportar finns fyra löpande discipliner som körs kontinuerligt, inte per sprint.

### 1. TESTRYTM

Design-audit (`window.__designAudit`) och stress-test (`npm run stress`) är projektets två runtime-verifieringsverktyg.

**Vid commit av UI-ändring:**
- Kör `window.__designAudit({ format: 'text' })` mot den ändrade skärmen lokalt.
- Nya findings > 0 = motivera eller fixa innan commit.
- Klistra rapporten i commit-meddelandet om findings fanns (så historiken visar).

**Vid sprint-slut (i SPRINT_XX_AUDIT.md):**
- Design-audit på fyra nyckelskärmar: `/game/dashboard`, `/game/board-meeting`, `/game/squad`, `/game/match`. 
- `npm run stress` med default 10×5. Nya invariants-brott loggas i auditen.
- Jämför total findings mot föregående sprint. Ska gå ner eller ligga still. Uppgång = rotorsaksanalys i auditen.

**Innan playtest-release:**
- Full design-audit över alla skärmar spelaren planerar besöka.
- `npm run stress` 20×5.
- Båda rapporterna summeras som "fixat sedan senast" + "fortfarande öppet" till Jacob.

### 2. REFACTOR-DISCIPLIN

Om Code eller Opus ändrar > 2 filer **utöver** vad specen listade: **pausa, rapportera, fortsätt bara efter bekräftelse från Jacob i chatten**.

Commit-meddelandet ska då innehålla:
- Filer specen listade
- Filer som faktiskt ändrades
- Rotorsak till avvikelsen

**Rätt:**
```
fix: styrelsemöte padding — rot: samma template duplicerad i BoardMeetingScreen
spec-scope: 1 fil (BoardMeetingScreen.tsx)
faktisk-scope: 3 filer — utökning: TacticStep.tsx, StartStep.tsx hade samma
  padding-värden p.g.a. shared template för säsongs-kort
```

**Fel:**
```
fix: fixade padding på några skärmar
```

Rotorsak till regeln: Sprint 22.3 expanderade 2 → 5 filer självständigt. Utfallet blev bra, men utan rapport tappar Jacob överblick och kan inte bedöma om scope-expansion är sund eller slapp.

### 3. ARKITEKTURLOGGBOK (`docs/DECISIONS.md`)

Arkitekturbeslut loggas som en kort post **när beslutet tas**, inte efteråt. Gäller: ny service, ny entity-form, ny store-struktur, ny arbetsmetod, ny CSS-primitiv, ny mapp-struktur.

Format: 4-5 rader per post.

```
## 2026-04-20 — .btn-cta istället för fyra inline-CTA:er
Problem: 4 skärmar, 4 olika CTA-implementeringar. DESIGN_SYSTEM.md saknade stor CTA-klass.
Beslut: Ny .btn-cta i global.css. Alla 4 skärmar migrerade.
Alternativ övervägt: Tre storlekar (medveten hierarki) — avvisat, ingen tydlig regel för vilken som är störst.
Konsekvens: Ny inline-CTA är regression. Alla framtida skärm-avslutande CTA:er ska använda .btn-cta.
```

**Vem skriver:** Opus vid tillfället beslutet tas. Inte retroaktivt.
**Vem läser:** Code + Opus vid sessionstart, tillsammans med LESSONS.md.

Syftet är inte formalism. Syftet är att om 6 månader ha ett svar på "varför gjorde vi så här?" som inte är "det bara blev så".

### 4. KOD-GRANSKNING FÖR NYA FILER

Innan Code skapar en ny fil i något av dessa mönster:
- `src/domain/services/*.ts` (ny service)
- `src/domain/entities/*.ts` (ny entity)
- `src/presentation/components/*/[StoreKomponent].tsx` (ny större UI-komponent)
- `.btn-X`, `.card-X`, `.tag-X` i `global.css` (ny CSS-primitiv)

**Code ska:**
1. Söka efter liknande befintlig funktionalitet (`grep -r "nyckelord" src/`, läs relevanta filer)
2. Rapportera till Opus: "jag tänker skapa X, har hittat dessa liknande: Y, Z. Anledning till att de inte passar: ..."
3. Fortsätta bara efter Opus-bekräftelse att dublett inte finns

Rotorsak: `.btn-copper` skapades trots att `.btn-primary` redan existerade med identisk CSS. Ingen granskning fångade det. Dubletten upptäcktes först 4 månader senare vid Sprint 22.5-granskning.

---

## ÅTERKOMMANDE BUGGAR — ESKALERINGSPOLICY

Om samma bugg rapporteras IGEN efter att den "fixats":
1. Skriv FÖRST ett test som reproducerar buggen
2. Kör testet — bekräfta att det FAILAR
3. Fixa buggen
4. Kör testet — bekräfta att det PASSERAR
5. Commit med: `fix: [bugg] — REGRESSION, added test`

Exempel: "Utvisningar centrerade" har rapporterats 4 gånger.
Nästa fix MÅSTE ha ett test som verifierar sidoplacering.

---

## OPUS-REGLER (granskning + spec-skrivning)

### 1. FIX DIREKT OM DU KAN
Om du har workspace:edit_file — skriv koden själv.
Skriv aldrig en spec för något du kan fixa direkt.
En spec som Code halvimplementerar är värre än en
direkt edit som fungerar.

### 2. ALDRIG YTFIXAR
Om problemet är strukturellt, lös det strukturellt.
"Sätt margin X på alla element" är fel svar —
"skapa en CSS-klass som hanterar spacing" är rätt svar.
Fråga dig: "kommer detta problem tillbaka nästa gång
någon lägger till ett element?" Om ja — lösningen är fel.

### 3. VERIFIERA DINA EGNA VERKTYG
create_file ≠ workspace:write_file. Kontrollera att
filen hamnade rätt innan du säger att den är klar.
Använd workspace:get_file_info efter skrivning.

### 4. EN SANNING, ETT STÄLLE
Matchinfo ska inte definieras i MatchScreen OCH
MatchHeader. Väder ska inte renderas i MatchHeader
OCH StartStep. Hitta dubbleringen INNAN du skriver
specen — att skapa en spec som INTE adresserar
dubblering är ett misslyckande.

---

## ARBETSFÖRDELNING: OPUS vs CODE

Opus (claude-opus-4-6) drar mer kvot per meddelande.
Code (claude-sonnet-4-6 via Claude Code) drar mindre.
Fördela arbetet medvetet:

**Opus fixar direkt** (via workspace:edit_file):
- Kirurgiska fixar (< ~50 rader, 1-3 filer)
- Textändringar, CSS-justeringar, prop-fixar
- Saker som tar längre att beskriva än att göra

**Opus skriver spec för Code:**
- Nya features (ny komponent, ny service)
- Refactors som berör > 5 filer
- Arkitekturella ändringar (nytt mönster, ny klass)
- Allt som kräver npm run build && npm test-iteration

**Defaultregel:** Om Opus har workspace-åtkomst och
ändringen är < 50 rader — gör den direkt.
Om Opus skriver en spec — säg VARFÖR den inte
fixades direkt ("berör 8 filer", "kräver test-iteration").

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

### Spelets värld
12 fiktiva klubbar på riktiga bruksorter. Alla klubbnamn, arenanamn och klacknamn är PÅHITTADE — inga riktiga föreningar. Definerade i `CLUB_TEMPLATES` i `worldGenerator.ts`. Arena- och klacknamn är required fält.

### Matchmotor-kalibrering
Kalibrerad mot 420 Elitseriematcher (bandygrytan.se, 2024-26). Data i `docs/data/bandygrytan_stats.json`. Nyckeltal:
- 10.0 mål/match, 23.2% hörnmål, 5.1% straffmål
- 50.7% hemmaseger, 9.0% oavgjort
- 54.3% av mål i 2:a halvlek

Verifieringsskript: `scripts/calibrate.ts` (varierad lagstyrka, 200 matcher).

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
- `matchEngine.ts` — snabbsim för AI-matcher (kalibrerad mot Bandygrytan-data)
- `matchStepByStep.ts` — live-matcher (steg för steg, med yield för hörn- och straffinteraktion)
- `matchUtils.ts` — TIMING_WEIGHTS, simulatePenalties, computeWeatherEffects
- `transferService.ts` — bud, signering, executeTransfer
- `scoutingService.ts` — scoutrapporter, ARCHETYPE_STRENGTHS
- `matchCommentary.ts` — alla matchkommentarer (i src/domain/data/)
- `cornerInteractionService.ts` — hörninteraktion (zon + leverans + utfall)
- `penaltyInteractionService.ts` — straffinteraktion (placering + höjd + målvaktsval)
- `worldGenerator.ts` — CLUB_TEMPLATES med alla 12 klubbar (arenaName, supporterGroupName)
- `trainerArcService.ts` — tränarens arc (newcomer → legendary), mood-texter
- `supporterService.ts` — klackgenerering, favoritspelare, stämning
- `matchMoodService.ts` — matchstämning + slutsammanfattning (getFinalWhistleSummary)
- `facilityService.ts` — utbyggnadsprojekt (omklädningsrum → inomhushall)
- `pressConferenceService.ts` — presskonferenser (kontext-triggers + journalist-relation)

## Active Documentation

### Projektguides (läs alltid)
- `CLAUDE.md` — denna fil, kodregler och arbetsfördelning
- `docs/DESIGN_SYSTEM.md` — visuellt designsystem (20 sektioner)
- `docs/CODE_SPRINT_PLAYTEST2.md` — aktuella instruktioner till Code

### Aktuella sprintdokument
- `docs/SPRINT_ALLT_KVAR.md` — **HUVUDDOK** — 15 kvarstående buggar + checklista
- `docs/mockups/sprint_allt_kvar_mockups.html` — 5 mockups (straff, cup-progress, kapten, arena)

### Visionsdokument (långsiktig roadmap)
- `docs/THE_BOMB.md` — narrativ vision: korsreferenser mellan system, milestone-moments, atmosfär, share-images
- `docs/SPEC_KLUBBUTVECKLING.md` — ekonomisk progression: utbyggnadsträd, sponsortillväxt, löneeskalering, inomhushallen
- `docs/SPEC_RIK_MATCHUPPLEVELSE.md` — kontextuell kommentar, narrativ båge, händelsevariation, domartyper
- `docs/FIXSPEC_PARKERAT.md` — fullspecade framtida features: presskonferens-scen, transferdödline, rykte

### Kalibreringsdata
- `docs/data/bandygrytan_stats.json` — 420 Elitseriematcher (2024-26), kalibreringsmål
- `docs/data/SCHEMA_DETAILED.md` — schema för detaljerad per-match-data (v2, 2010-26)
- `docs/FIXSPEC_KALIBRERING.md` — matchmotor-konstanter (implementerat)
- `scripts/calibrate.ts` — kör 200 matcher med varierad lagstyrka, jämför mot targets
- `scripts/calibrate_v2.ts` — 7-sektionsanalys (tidmönster, utvisningar, powerplay, säsongskurvor, hörnvariation, comeback, slutspel) + motorsimulering

### Feature-specar (redan implementerade, behåll som referens)
- `docs/FIXSPEC_NYA_FEATURES.md` — arenanamn, klacknamn, straffar, kapten, hörn-SVG
- `docs/FIXSPEC_COACHMARKS_REWRITE.md` — coach marks (löst via migrering)
- `docs/FIXSPEC_PLAYTEST2.md` — 25 buggar från playtest 2 (de flesta fixade)

## Commit Convention
```
fix: [short description]
feat: [short description]
design: [short description]
refactor: [short description]
```
