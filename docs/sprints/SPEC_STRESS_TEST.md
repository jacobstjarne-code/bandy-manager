# SPEC — Headless Season Stress-Test

**Ägare:** Code (Sonnet via Claude Code)
**Granskning:** Opus efter leverans (läser failure-dumpar + rapport)
**Rotorsak för existens:** Appen har aldrig spelats igenom 100 säsonger av en människa. Edge-cases som uppstår runt säsongsslut, cup+slutspel-krockar, kontraktsutgångar i kedja, pensioner, tom kassa-spiraler är osannolikt upptäckta i 2-3 säsongers playtest. Pure-TypeScript-domänen gör detta billigt att automatisera.

---

## 1. MÅL

Ett Node-script som kör `advanceToNextEvent` i loop över N säsonger, med K parallella seeds, och rapporterar alla crashes + invariant-brott utan att öppna en browser.

**Inte scope:** UI. Visuella regler. Spelupplevelse. Lineup-AI-optimering (vi använder autoselectlineup eller senaste lineup).

---

## 2. FILSTRUKTUR

```
scripts/
├── stress-test.ts             — entry-point, kör seeds + säsonger
├── stress/
│   ├── invariants.ts          — alla invariant-checks
│   ├── fixtures.ts            — setup av SaveGame, auto-lineup
│   ├── reporter.ts            — formatering av slutrapport
│   └── failures/              — gitignoreras, dumpar per failure
│       └── .gitkeep
```

Kör med: `node_modules/.bin/vite-node scripts/stress-test.ts [--seeds=10] [--seasons=5] [--bail-on-crash]`

Lägg till `npm run stress` i `package.json` som alias.

`scripts/stress/failures/` läggs till i `.gitignore`.

---

## 3. EXEKVERING

### 3.1 Per-seed-loop
```ts
for (const seed of seeds) {
  const game = createInitialGame(seed)          // från createNewGame
  autoSetLineup(game)                            // välj startelva första gången
  for (let season = 1; season <= maxSeasons; season++) {
    while (!isSeasonDone(game)) {
      try {
        advanceToNextEvent(game, { auto: true })
      } catch (e) {
        recordCrash(seed, season, game, e)
        break  // gå till nästa seed
      }
      checkInvariants(game, seed, season)
      autoResolveAnyPendingScreen(game)          // presskonferens, event, trupp-val
    }
    if (!isSeasonDone(game)) break
    advanceSeason(game)
  }
}
```

### 3.2 Auto-resolvning av pending screens
`advanceToNextEvent` kan returnera ett state där spelaren förväntas fatta ett beslut (presskonferens, event-val, kontraktsförlängning). Scriptet ska **auto-välja** enligt dessa regler:

- Presskonferens: välj alltid index 0 (första alternativet)
- Event med val: välj första icke-destruktiva alternativet. Om det inte går att avgöra → välj index 0.
- Kontraktsförlängning: acceptera om lön < budget, annars avvisa
- Transferbud: acceptera om summa > marketValue, annars avvisa
- Styrelsemöte: bekräfta alltid (fortsätt)

Om en pending screen inte kan auto-resolvas (okänd typ) → logga som `unresolvableScreen`-invariant och hoppa över seeden.

### 3.3 Lineup
Anropa `setLineup` med `autoSelectLineup` från existerande service. Om den inte finns: välj 11 bästa tillgängliga (ej skadade, ej avstängda) i rätt positioner via enkel sortering på `currentAbility`.

---

## 4. INVARIANTS

Varje invariant = funktion `(game: SaveGame) => InvariantFinding[]`. Körs efter varje `advance`.

### 4.1 `tableSum`
Summan av `wins + draws + losses` för varje lag ska vara lika för alla 12 lag efter varje komplett omgång. Diff > 1 = crash.

### 4.2 `fixtureCount`
Varje lag ska ha exakt 22 ligamatcher i säsongen (11 hemma + 11 borta). Verifiera vid säsongsstart genom att räkna fixtures per clubId.

### 4.3 `playerAges`
Alla spelare: `age >= 16` och `age <= 42`. Avvikelse = crash med player.id + namn.

### 4.4 `squadSize`
Varje klubb: `squad.length >= 14` och `<= 30`. Under 14 = crash (kan inte spela match). Över 30 = warn (gäller kanske inte — verifiera kravnivå i CLUB_TEMPLATES eller facilityService).

### 4.5 `positionCoverage`
Varje klubb måste ha minst: 1 MV, 2 B, 2 Half, 2 Forward i trupp. Annars crash.

### 4.6 `finance`
- `cash` får bli negativt, men aldrig < -1 000 000 kr (då ska konkurs-flaggan triggas — om den inte triggats = crash)
- `cash > 50 000 000` = warn (orealistisk ekonomi, möjlig incomeService-bug)
- `weeklyIncome` ska vara positivt tal

### 4.7 `cupBracket`
Om `cupRound` aktiv: antal fixtures = `expectedCount` per runda (8, 4, 2, 1). Ej matchande = crash.

### 4.8 `playoffBracket`
Om `isPlayoff`: samma som ovan (4 kvartsfinalpar = 4 fixtures, sen 2, sen 1).

### 4.9 `noUndefined`
Alla fixtures måste ha `homeClubId`, `awayClubId`, `matchday`. Alla players måste ha `id`, `clubId`, `position`. Missing = crash med path till fältet.

### 4.10 `matchdayMonotonic`
Inom en säsong: fixture.matchday ska vara strikt ökande när spelade. Ingen fixture med `matchday < currentMatchday` får ha status `Scheduled`.

### 4.11 `pendingScreenConsistency`
Om `game.pendingScreen` är satt, motsvarande data måste finnas (t.ex. `game.pendingPress` finns om `pendingScreen === 'pressConference'`). Annars crash.

### 4.12 `saveGameSize`
`JSON.stringify(game).length` ska vara < 10 MB efter 10 säsonger. Större = memory-leak i narrativeLog eller liknande. Warn.

---

## 5. FAILURE-DUMPAR

Vid crash eller invariant-brott:
```
scripts/stress/failures/seed{N}-season{S}-round{R}.json
```
Innehåll:
```json
{
  "seed": 7,
  "season": 4,
  "round": 11,
  "error": "invariant:squadSize — Västanfors has 12 players, minimum 14",
  "stack": "...",
  "gameSnapshot": { /* hela SaveGame */ },
  "lastActions": [ /* sista 10 advance-anropen som array */ ]
}
```

Behåll `lastActions` via en ring-buffer i scriptet.

---

## 6. REPORTER

### 6.1 Progress (stdout under körning)
```
[seed 1/10] season 1 ✓  season 2 ✓  season 3 ✗ invariant:squadSize @ round 17
[seed 2/10] season 1 ✓  season 2 ✓  ...
```

### 6.2 Slutrapport
```
═══ STRESS TEST ═══
Seeds: 10
Max seasons: 5
Completed: 37 seasons out of 50 attempted

Crashes: 2
  - seed 3 season 3 round 17: invariant:squadSize
  - seed 7 season 2 round 8: TypeError in cupService.generateNextCupRound

Invariant breaks (non-crash warns): 15
  - saveGameSize: 3
  - finance.cashHigh: 12

Per-invariant summary:
  tableSum: 0 violations
  fixtureCount: 0 violations
  playerAges: 0 violations
  squadSize: 2 violations (crashes)
  finance: 12 warnings
  ...

Failure dumps: scripts/stress/failures/
```

### 6.3 Exit code
- 0 om inga crashes
- 1 om någon crash (även om invariant warns finns)
- `--bail-on-crash` → exit(1) direkt vid första crash utan att köra resterande seeds

---

## 7. IMPLEMENTATIONSORDNING

1. `stress-test.ts` skeleton: parse args, loop över seeds, anropa `createNewGame`, kör advance tills någon fixture är spelad. Bekräfta att infrastrukturen kompilerar och kör.
2. Auto-lineup + pending screen resolver. Kör 1 komplett säsong utan invariants. Verifiera att det går igenom.
3. Lägg till invariants en och en i ordningen 4.1–4.12. Efter varje: kör 3 säsonger × 3 seeds, verifiera att inga false positives.
4. Failure-dump + reporter.
5. `npm run stress` alias + `.gitignore` för `scripts/stress/failures/`.
6. Initial baseline-körning: 10 seeds × 5 säsonger. Dokumentera hittade buggar i `docs/sprints/SPRINT_STRESS_TEST_BASELINE.md`. Dessa fixas INTE i denna sprint — de loggas och prioriteras separat.

---

## 8. LEVERANSKRITERIER

- [ ] `npm run stress` körbart
- [ ] Default: 10 seeds × 5 säsonger kör igenom på < 2 min på Jacobs Mac
- [ ] Alla 12 invariants implementerade
- [ ] Failure-dumpar skrivs till rätt plats
- [ ] Slutrapport matchar §6.2 bokstavligt
- [ ] Exit-kod korrekt enligt §6.3
- [ ] `.gitignore` uppdaterad
- [ ] `docs/sprints/SPRINT_STRESS_TEST_BASELINE.md` skapad med lista av hittade buggar, kategoriserade som *crash* / *invariant-warn* / *unresolvable*
- [ ] `SPRINT_STRESS_TEST_AUDIT.md` per CLAUDE.md-mall

---

## 9. REGLER MOT "FÖRBÄTTRINGAR"

- Fixa inte hittade buggar i denna sprint. Logga dem. Separat prioritering.
- Kör inte över 100 seeds för att få "bättre statistik". 10 seeds × 5 säsonger = 50 säsonger = tillräckligt för baseline. Större sweeps när infrastrukturen är stabil.
- Ändra ingen domänkod för att "få testet att passera". Om ett test failar genuint → det är en riktig bugg som ska loggas.

## 10. ANSLUTNING TILL ÖVRIG INFRA

Passar in bredvid `scripts/calibrate.ts` och `scripts/calibrate_v2.ts`. Kör samma vite-node-runner. Använder samma domänservices.

Framtida utbyggnad (inte denna sprint):
- CI-integration (GitHub Actions)
- Scenario-matris (§3 "Nivå 3" i Opus-förklaring) — tom kassa, skadad trupp, etc.
- Browser-koppling (window.__autoPlay) som återanvänder samma invariants från runtime
