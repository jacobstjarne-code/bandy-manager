# SPRINT 25a — Comeback-dynamik i andra halvlek

**Datum:** 2026-04-20 (sent)
**Trigger:** Sprint 24-mätning visar `htLeadWinPct` 87.4% vs bandygrytan 46.6%. Halvtidsledare vinner nästan alltid. `drawPct` 7.1% vs 11.6% och `awayWinPct` 45.3% vs 38.3% hänger ihop: motorn är deterministisk i 2:a halvlek — leder man vid pausen vinner man.

**Scope:** EN fil, TRE justeringar. `src/domain/services/matchCore.ts`.

**Detta är del 1 av 3 i Sprint 25-serien:**
- **25a** (denna): Comeback-dynamik (gap 1+2)
- **25b**: Utvisningsfrekvens (gap 3+5 — kontextkänslig, inte bara 8x)
- **25c**: Hörnmål-finjustering (gap 4) — eventuellt ej nödvändig efter 25a/b

---

## BAKGRUNDSSIFFROR (bandygrytan, ANALYS_MATCHMONSTER.md §1)

| HT-underläge | Vänder | Kryssar | Förlorar |
|---|---|---|---|
| −1 | **24.5%** | 13.9% | 61.6% |
| −2 | 11.0% | 9.0% | 80.0% |
| −3 | 3.7% | 3.1% | 93.3% |
| −4+ | 1.3% | 0.0% | 98.7% |

Motorn idag ger ~5% comeback totalt sett (baserat på 87% htLeadWinPct). Vi måste öka comeback-sannolikheten utan att över-rotera — vi vill hamna på 24.5% vid −1 och 11% vid −2, inte 40% vid −1.

---

## ROTORSAKSANALYS

Tre platser i `matchCore.ts` driver för-stark determinism i 2:a halvlek. Code ska läsa alla tre och verifiera att siffrorna stämmer innan ändring.

### A. `getSecondHalfMode()` tröskel är för snäll mot ledande lag

Nuvarande (runt rad 170):
```ts
function getSecondHalfMode(
  managedScore: number, opponentScore: number,
  step: number,
  matchPhase: MatchPhaseContext = 'regular',
): SecondHalfMode {
  const diff = managedScore - opponentScore
  const chasingThreshold = matchPhase === 'quarterfinal' ? -1 : -2
  if (diff <= chasingThreshold) return 'chasing'
  if (diff >= 3)                return 'cruise'
  if (diff >= 1 && step > 45)   return 'controlling'
  return 'even_battle'
}
```

**Problem:** Ett lag nere 1 mål i 2:a halvlek får `even_battle`-mode (neutral). De får inte `chasing`-boosten (+8% mål, +15% fouls) förrän de är nere 2. Bandygrytan säger nere 1 i HT → 24.5% vänder — kräver aktiv "chasing"-mekanik från −1.

### B. `trailingBoost` är för svag

Nuvarande (runt rad 300):
```ts
const trailingBoost = (diff: number) => diff < 0 ? Math.min(-diff, 3) * 0.07 : 0
```

7% per måls underläge, capat vid 3. Max 21% boost räcker inte för den comeback-dynamik verklig data visar.

### C. `controlling`-mode dämpar för hårt

```ts
if (mode === 'controlling') {
  secondHalfGoalMod = 0.92   // 8% sänkning
}
```

Ledande lag "stängs ner" så mycket att HT-ledningen konserveras. 0.96 skulle dämpa mjukare.

---

## ÄNDRINGAR

### Ändring 1 — `chasingThreshold = -1` (alla matchPhase)

`src/domain/services/matchCore.ts`, funktionen `getSecondHalfMode`:

```ts
// FÖRE:
const chasingThreshold = matchPhase === 'quarterfinal' ? -1 : -2

// EFTER:
// Bandygrytan: 24.5% comeback vid -1 i HT kräver aktiv chasing från -1
const chasingThreshold = -1
```

**Regression-risk:** `cruise` och `controlling` oförändrade. Bara `even_battle` → `chasing` för −1 fallen.

### Ändring 2 — `trailingBoost` 0.07 → 0.11

```ts
// FÖRE:
const trailingBoost = (diff: number) => diff < 0 ? Math.min(-diff, 3) * 0.07 : 0

// EFTER:
const trailingBoost = (diff: number) => diff < 0 ? Math.min(-diff, 3) * 0.11 : 0
```

**Effekt:** Nere 1 → 11% boost (var 7%). Nere 2 → 22% (var 14%). Nere 3 → 33% capat (var 21%).

### Ändring 3 — `chasing` 1.08→1.14, `controlling` 0.92→0.96

```ts
// FÖRE:
if (mode === 'chasing') {
  secondHalfGoalMod = 1.08
  secondHalfFoulMod = 1.15
} else if (mode === 'controlling') {
  secondHalfGoalMod = 0.92
  secondHalfFoulMod = 1.0 + (1.0 - managedTD) * 0.25
} else if (mode === 'even_battle') {
  secondHalfGoalMod = step >= 50 ? 1.04 : 1.0
  secondHalfFoulMod = 1.10
}

// EFTER:
if (mode === 'chasing') {
  secondHalfGoalMod = 1.14   // var 1.08
  secondHalfFoulMod = 1.20   // var 1.15
} else if (mode === 'controlling') {
  secondHalfGoalMod = 0.96   // var 0.92 — mjukare dämpning
  secondHalfFoulMod = 1.0 + (1.0 - managedTD) * 0.25
} else if (mode === 'even_battle') {
  secondHalfGoalMod = step >= 50 ? 1.04 : 1.0
  secondHalfFoulMod = 1.10
}
```

---

## VAD SOM INTE RÖRS

- `PROFILE_GOAL_MODS` — oförändrade
- `SECOND_HALF_BOOST = 1.19` — verifierad mot 54.3% mål i 2:a halvlek
- `GOAL_TIMING_BY_PERIOD`, `SUSP_TIMING_BY_PERIOD`
- `wFoul`, `foulProb`, `phaseConst.suspMod` — utvisningar är Sprint 25b
- `cornerBase`, `cornerClampMax`
- `homeAdvantage = 0.14`
- Extra-time, penaltyShootout
- `matchEngine.ts`, `matchUtils.ts`, `tacticModifiers.ts`

---

## LEVERANSORDNING

1. **Läs och verifiera** `matchCore.ts` rad ~170, ~280-300. Om något värde avviker från specen — STOPP, rapportera.

2. **Ändring 1** (chasingThreshold = -1).
   - Commit: `feat(matchCore): chasing threshold -2 → -1 for bandygrytan realism`
   - `npm test`

3. **Ändring 2** (trailingBoost 0.07 → 0.11).
   - Commit: `feat(matchCore): trailingBoost 0.07 → 0.11 for stronger comeback`
   - `npm test`

4. **Ändring 3** (chasing/controlling goalMod-värden).
   - Commit: `feat(matchCore): chasing 1.08→1.14, controlling 0.92→0.96 — softer 2H determinism`
   - `npm test`

5. **Kör mätning:**
   ```
   npm run stress
   npm run analyze-stress
   ```

6. **Spara** hela analyze-stress-outputen som `docs/sprints/SPRINT_25A_MEASUREMENT.md`.

7. **Audit** `docs/sprints/SPRINT_25A_AUDIT.md` enligt CLAUDE.md-mall. Inkludera:
   - Före/efter för `htLeadWinPct`, `drawPct`, `awayWinPct`, `goalsPerMatch`, `cornerGoalPct`, `avgSuspensionsPerMatch`
   - Före/efter för Sektion D (comeback per underläge)
   - Oförväntade bieffekter

---

## FÖRVÄNTAT RESULTAT

| Mått | Före | Target | Acceptabelt efter 25a |
|---|---|---|---|
| `htLeadWinPct` | 87.4% | 46.6% | **≤ 70%** |
| `drawPct` | 7.1% | 11.6% | **≥ 9.0%** |
| `awayWinPct` | 45.3% | 38.3% | **≤ 42%** |
| Comeback vid −1 | ~5% | 24.5% | **≥ 15%** |
| Comeback vid −2 | ~2% | 11.0% | **≥ 6%** |

Vi hamnar sannolikt inte på målet med tre parameterjusteringar. Halvvägs räcker.

- Inom intervallet → Sprint 25b
- Över-rotation → 25a.2 fin-justerar neråt
- Under-prestation → större refaktor krävs (per-lag mode, inte per-match)

---

## VIKTIGT

- Rör INGA andra filer. `matchEngine.ts`, `matchSimulator.ts`, `tacticModifiers.ts`, `matchUtils.ts` — orörda.
- Rör INGA andra motorkonstanter i matchCore.ts.
- Om tester går sönder: STOPP, rapportera vilka och vilka värden. Vissa kan ha hårdkodat gamla trailingBoost-värden och behöver uppdateras, andra är legitima regressioner. Opus avgör.
