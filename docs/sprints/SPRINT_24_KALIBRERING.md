# SPRINT 24 — Kalibrering: säsongsaggregat vs bandygrytan

**Datum:** 2026-04-20 (kväll)
**Trigger:** Playtest visar 13–14 mål/match. `calibrate.ts` mäter 10.3 på neutral lab-motor och är dessutom sönder (fel enum-värden). Gap mellan motorn i isolering och motorn med alla modifiers är inte mätt. `bandygrytan_detailed.json` (1124 matcher) finns men används inte för att verifiera spelets säsongsbeteende.
**Scope:** scripts/calibrate.ts (fix), scripts/calibrate_v2.ts (fix), scripts/stress-test.ts (logg), ny scripts/analyze-stress.ts, package.json (npm-script)

---

## MÅLBILD

Efter sprinten ska det gå att köra:

```bash
npm run stress            # kör 10×5 säsonger, loggar season_stats.json
npm run analyze-stress    # jämför logg mot bandygrytan targets
```

Output: en rapport som visar om live-motorn (med alla modifiers) producerar realistiska säsongsmönster. Då kan kalibrering ske med siffror istället för magkänsla.

---

## DEL 1 — Fixa calibrate.ts (10 min)

**Fil:** `scripts/calibrate.ts`

**Rotorsak:** Skriptet skrevs före enum-refaktoreringen. `PlayerArchetype.ShotStopper` och `.BallPlayer` finns inte längre. `tempo: 'medium'` matchar ingen TacticTempo-enum-value. Skriptet går troligen inte att bygga mot nuvarande types.

**Ändringar:**

1. Archetype-ersättning:
   - `PlayerArchetype.ShotStopper` → `PlayerArchetype.ReflexGoalkeeper`
   - `PlayerArchetype.BallPlayer` → `PlayerArchetype.TwoWaySkater`

2. Tactic-enum-värden (hela `defaultTactic`-objektet):
   ```ts
   const defaultTactic = {
     mentality: 'balanced' as const,
     tempo: 'normal' as const,        // var: 'medium'
     press: 'medium' as const,         // OK (TacticPress har Medium)
     passingRisk: 'safe' as const,
     width: 'normal' as const,         // var: 'medium'
     attackingFocus: 'mixed' as const, // SAKNAS idag — lägg till
     cornerStrategy: 'standard' as const,
     penaltyKillStyle: 'active' as const, // SAKNAS idag — lägg till
   }
   ```

3. Target-justering. Gamla: `goalsPerMatch: 10.0`. Nytt (från `bandygrytan_detailed.json`): `9.12`.

4. `homeAdvantage: 0.035` → `homeAdvantage: 0.14` (verkligt värde enligt calibrationTargets).

**Verifiera:** `node_modules/.bin/vite-node scripts/calibrate.ts` ska köra utan build-fel. Rapport ska visa 5 rader (goalsPerMatch, cornerGoalShare, homeWinRate, drawRate, secondHalfShare).

---

## DEL 2 — Fixa calibrate_v2.ts (5 min)

**Fil:** `scripts/calibrate_v2.ts`

Samma fix som Del 1 — skriptet har identiska fel i sin motorsimuleringssektion (del 7).

**Exakt rad 216-219** i nuvarande fil:
```ts
const defaultTactic = {
  mentality: 'balanced' as const, tempo: 'medium' as const, press: 'medium' as const,
  width: 'medium' as const, cornerStrategy: 'standard' as const, passingRisk: 'safe' as const,
}
```

Ersätt med samma objekt som i Del 1 (med `normal` istället för `medium`, plus `attackingFocus` och `penaltyKillStyle`).

**Rad 234** (homeAdvantage i simulateMatch-anropet):
```ts
const result = simulateMatch({ ..., homeAdvantage: 0.035, seed: i * 1337 })
```
→ `homeAdvantage: 0.14`

**TARGETS-objektet rad 237** — uppdatera:
```ts
const TARGETS = {
  goalsPerMatch:   { target: 9.12,  tolerance: 1.5  },   // var: 10.0
  cornerGoalShare: { target: 0.222, tolerance: 0.03 },   // var: 0.232
  homeWinRate:     { target: 0.502, tolerance: 0.05 },   // var: 0.507
  drawRate:        { target: 0.116, tolerance: 0.03 },   // var: 0.090
  secondHalfShare: { target: 0.542, tolerance: 0.03 },   // var: 0.543
}
```

**Verifiera:** `node_modules/.bin/vite-node scripts/calibrate_v2.ts` ska köra hela rapporten (7 sektioner) utan fel och producera både bandygrytan-analys och motorsimulering.

---

## DEL 3 — Logg-infrastruktur i stress-test (1 timme)

**Fil:** `scripts/stress-test.ts`

**Mål:** Stress-testet kör redan 10×5 säsonger via `advanceToNextEvent` som är den riktiga motorn. Alla modifiers (weather, trait, arc, chemistry, home advantage 0.14) är aktiva. Det som saknas är loggning av statistik — varje match som spelas ska registreras i en fil som sedan kan analyseras.

### 3.1 Ny datastruktur

Skapa ny interface i stress-test.ts (eller i en ny fil `scripts/stress/stats.ts`):

```ts
export interface MatchStat {
  seed: number
  season: number
  round: number
  phase: 'regular' | 'cup' | 'playoff_qf' | 'playoff_sf' | 'playoff_final'
  homeClubId: string
  awayClubId: string
  homeScore: number
  awayScore: number
  halfTimeHome: number
  halfTimeAway: number
  goals: Array<{
    minute: number
    team: 'home' | 'away'
    isCornerGoal: boolean
    isPenaltyGoal: boolean
  }>
  suspensions: Array<{
    minute: number
    team: 'home' | 'away'
  }>
  cornersHome: number
  cornersAway: number
  shotsHome: number
  shotsAway: number
  attendance: number
  weather?: string  // condition-enum-värdet om tillgängligt
}

export interface SeasonStats {
  seed: number
  season: number
  matches: MatchStat[]
}
```

### 3.2 Extrahera stats från fixture

Efter varje `advanceToNextEvent`-anrop — kolla vilka fixtures som blev completed denna omgång. För varje completed fixture, bygg en `MatchStat`:

```ts
// Efter result = advanceToNextEvent(game, stepSeed++)
// Samla alla fixtures som bytte till 'completed' under denna advance.
const newlyCompleted = result.game.fixtures.filter(f =>
  f.status === 'completed' &&
  !previouslyCompletedIds.has(f.id)
)
for (const fix of newlyCompleted) {
  const stat = extractMatchStat(fix, result.game, seedIdx, season)
  seasonStats.matches.push(stat)
}
previouslyCompletedIds = new Set(result.game.fixtures.filter(f => f.status === 'completed').map(f => f.id))
```

`extractMatchStat` läser `fix.events` (MatchEvent[]) och aggregerar goals/suspensions/corners/shots. Halvtidsställning finns i steg 30-stepet om `fix.steps` finns sparad — annars approximera genom att räkna mål med `minute < 45`.

**Om `halfTimeHome`/`Away` inte kan extraheras från fixture-eventsen** — räkna dem från goals-arrayen (mål med `minute < 45` per team). Det är vad `calibrate_v2.ts` redan gör.

**Phase-bestämning:**
- `fix.isCup === true` → `'cup'`
- `fix.roundNumber > 26 && fix.matchday <= 31` → `'playoff_qf'`
- `fix.roundNumber > 26 && fix.matchday <= 36` → `'playoff_sf'`
- `fix.roundNumber > 26 && fix.matchday > 36` → `'playoff_final'`
- annars → `'regular'`

### 3.3 Skriv fil efter körning

Efter main-loopen, innan `printFinalReport`:

```ts
const statsFile = resolve(__dirname, 'stress/season_stats.json')
writeFileSync(statsFile, JSON.stringify({
  _meta: {
    seeds,
    seasonsPerSeed: seasons,
    totalMatches: allSeasonStats.flatMap(s => s.matches).length,
    generatedAt: new Date().toISOString(),
  },
  seasons: allSeasonStats,
}, null, 2))
console.log(`\nSkriven ${statsFile} (${allSeasonStats.flatMap(s => s.matches).length} matcher)`)
```

**Krav:** Filen ska skrivas även om någon seed kraschar. Bara kastas som sista steg innan `process.exit`. Crashed-seeds bidrar med de matcher som hann spelas innan kraschen.

### 3.4 Vad som INTE ska ändras

- Invariant-checkningen är orörd. 
- Ring-buffern för actions är orörd.
- Failure-dumps är orörda.
- Exit code-logik är orörd.

Logginsamlingen är additiv — den ska inte kunna få en passerande körning att failra.

---

## DEL 4 — analyze-stress.ts (1–2 timmar)

**Ny fil:** `scripts/analyze-stress.ts`

**Syfte:** Läs `stress/season_stats.json`, jämför mot `docs/data/bandygrytan_detailed.json` calibrationTargets.herr, producera en rapport.

### 4.1 Struktur

```ts
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const STATS_PATH = resolve(__dirname, 'stress/season_stats.json')
const TARGETS_PATH = resolve(__dirname, '../docs/data/bandygrytan_detailed.json')

// Läs båda filer, kasta tydligt om någon saknas.
// Targets hämtas från raw.calibrationTargets.herr
```

### 4.2 Rapporter att generera

En sektion per jämförelse. Samma format som `calibrate_v2.ts` använder (✅/❌, värde, target ±tolerance, diff). Men beräkningen sker på stress-data.

**Sektion A — grundserie-aggregat**

Filtrera `phase === 'regular'`. Beräkna:
- `goalsPerMatch` (mål totalt / matcher)
- `avgHomeGoals`, `avgAwayGoals`
- `homeWinPct`, `drawPct`, `awayWinPct`
- `cornerGoalPct` (andel av mål som är hörnmål)
- `penaltyGoalPct`
- `avgCornersPerMatch` (summa hemma+borta)
- `avgSuspensionsPerMatch`
- `avgHalfTimeGoals`
- `htLeadWinPct` (lag som leder vid HT, vinner matchen)
- `goalsSecondHalfPct` (mål ≥ 45' / totala mål)

Jämför mot `bandygrytan.calibrationTargets.herr`. Visa ✅/❌ med diff och tolerance.

**Sektion B — målminuts-fördelning**

Per 10-min-bucket (0-9, 10-19, ..., 80-89, 90+). Beräkna andel av totala mål. Jämför mot `goalTimeDistribution.byDecile` i `bandygrytan_calibration_targets.json`.

**Sektion C — slutspel vs grundserie**

Om slutspelsmatcher finns: jämför målsnitt, hemmavinst, hörnmål%, utvisningar/match mellan phase=regular och phase=playoff_*.

Jämför mot `ANALYS_SLUTSPEL.md`-värdena:
- Grundserie: 9.12 mål/match
- Kvartsfinal: 8.81
- Semifinal: 8.39
- Final: 7.00

**Sektion D — comeback-frekvens**

Per halvtidsunderläge (−1, −2, −3, −4+), räkna andel som vände.

Jämför mot `ANALYS_MATCHMONSTER.md` §1:
- −1 → 24.5% vänder
- −2 → 11.0% vänder
- −3 → 3.7% vänder
- −4+ → 1.3% vänder

**Sektion E — hemmafördel per period**

Per 10-min-bucket: % av målen som gjordes av hemmalaget. Jämför mot `ANALYS_MATCHMONSTER.md` §6.

### 4.3 Rapport-output

Human-läsbar text till stdout. Exempel:

```
════════════════════════════════════════════════════════════
  STRESS-ANALYS — 10 seeds × 5 säsonger = 50 säsonger
════════════════════════════════════════════════════════════

A. GRUNDSERIE-AGGREGAT (jämförelse med bandygrytan 1124 matcher)
────────────────────────────────────────────────────────────
  ❌ goalsPerMatch        13.24  (mål 9.12 ±1.5, diff +4.12)
  ✅ cornerGoalPct        0.218  (mål 0.222 ±0.03, diff -0.004)
  ❌ homeWinPct           56.2%  (mål 50.2% ±5.0, diff +6.0)
  ...

B. MÅLMINUTS-FÖRDELNING
────────────────────────────────────────────────────────────
  0-9    9.1%  (target 9.7%)   ✅
  10-19  8.8%  (target 9.8%)   ✅
  ...
  80-89  14.2% (target 12.9%)  ❌  +1.3pp

C. SLUTSPEL VS GRUNDSERIE
  ...
```

### 4.4 Package.json

Lägg till scripts-alias:

```json
{
  "scripts": {
    "analyze-stress": "vite-node scripts/analyze-stress.ts"
  }
}
```

Bekräfta att `npm run stress && npm run analyze-stress` kör pipelinen clean.

---

## DEL 5 — Dokumentation (15 min)

### 5.1 Uppdatera CLAUDE.md

I sektionen "Matchmotor-kalibrering" (runt rad 200 enligt nuvarande CLAUDE.md), byt ut gamla siffror:

- `10.0 mål/match` → `9.12 mål/match (target)`
- `23.2% hörnmål` → `22.2% hörnmål`
- `5.1% straffmål` → `5.4% straffmål`
- `50.7% hemmaseger` → `50.2% hemmaseger`
- `9.0% oavgjort` → `11.6% oavgjort`
- `54.3% av mål i 2:a halvlek` → `54.2% av mål i 2:a halvlek`
- `Data i docs/data/bandygrytan_stats.json` → `Data i docs/data/bandygrytan_detailed.json (1124 matcher, 6 säsonger)`

Uppdatera verifieringsskript-listan:
- Lägg till `scripts/analyze-stress.ts` med beskrivning: "jämför stress-test-loggen mot bandygrytan-targets (säsongsnivå, inte per-match)"

### 5.2 Audit-fil

`docs/sprints/SPRINT_24_KALIBRERING_AUDIT.md` enligt mall i CLAUDE.md:

- Bekräfta att calibrate.ts och calibrate_v2.ts kör utan build-fel
- Kör `npm run stress` → `season_stats.json` skrivs (storlek, antal matcher)
- Kör `npm run analyze-stress` → rapporten visar verkliga siffror från motorn
- Rapportera de första tre gap:en mellan motor och verklighet (ej fixa dem — det är jobb för Sprint 25)

---

## LEVERANSORDNING

1. Fixa `calibrate.ts` — verifiera att det kör och producerar siffror (kvarstår nära 10.3 sannolikt).
2. Fixa `calibrate_v2.ts` — samma.
3. Bygg statslogg i `stress-test.ts` + `scripts/stress/stats.ts` om du bryter ut den.
4. Kör `npm run stress --seeds=3 --seasons=1` (snabb iteration) för att verifiera att filen skrivs.
5. Skriv `analyze-stress.ts`.
6. Kör full pipeline: `npm run stress` + `npm run analyze-stress`. Spar output till `docs/sprints/SPRINT_24_FIRST_MEASUREMENT.md` — det är referenspunkten inför framtida kalibrering.
7. Uppdatera CLAUDE.md och skriv audit.
8. Commit + push.

---

## VIKTIGT

**Sprint 24 ändrar INGA motorkonstanter.** Det är mätinfrastruktur. Att ändra motorvärden utan att ha mätt är precis problemet vi försöker undvika. När analyze-stress körts klart och visar exakt vilka targets som avviker — då är det Sprint 25:s jobb att justera motorn baserat på siffrorna.

**Ingen optimering för snabbhet.** Stress-testet tar redan några minuter att köra. Loggningen får addera ytterligare sekunder — OK. Pipelinen körs manuellt vid behov, inte på varje commit.

---

## FILER

| Fil | Ändring | Typ |
|---|---|---|
| `scripts/calibrate.ts` | Fix enum + targets | Kirurgisk |
| `scripts/calibrate_v2.ts` | Fix enum + targets | Kirurgisk |
| `scripts/stress-test.ts` | Logginsamling | Utökad |
| `scripts/stress/stats.ts` | Ny — MatchStat-extraction | Ny fil (valfri, kan ligga i stress-test.ts) |
| `scripts/analyze-stress.ts` | Ny rapport-generator | Ny fil |
| `package.json` | Nytt npm-script | 1 rad |
| `docs/CLAUDE.md` | Uppdaterade targets | 6 ställen |
| `docs/sprints/SPRINT_24_KALIBRERING_AUDIT.md` | Ny audit | Ny fil |
| `docs/sprints/SPRINT_24_FIRST_MEASUREMENT.md` | Första mätrapporten | Ny fil |
