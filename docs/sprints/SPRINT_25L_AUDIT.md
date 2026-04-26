# Sprint 25-L — Audit

**Datum:** 2026-04-26  
**Scope:** Kompensera mål/match-fall i KVF/SF efter cornerGoalMod-sänkning (Sprint 25-K)

---

## Implementerade ändringar

### `src/domain/services/matchUtils.ts` — PHASE_CONSTANTS

| Fas | goalMod före (25-K) | goalMod efter (25-L) |
|-----|---------------------|----------------------|
| Regular | 1.000 | 1.000 (oförändrat) |
| KVF | 0.966 | **0.995** |
| SF | 0.920 | **0.965** |
| Final | 0.768 | 0.768 (oförändrat) |

Monotonitet bibehållen: 1.000 > 0.995 > 0.965 > 0.768 ✅

Inga andra värden rörda — cornerGoalMod, cornerTrailingMod, homeAdvDelta, suspMod alla oförändrade.

---

## Per-fas-mätningar

### Baseline (post-25-K, stresstest section H)

| Fas | mål/match | Target | Status |
|-----|-----------|--------|--------|
| Regular | 9.34 | 9.12 ±1.5 | ✅ |
| KVF | 8.29 | 8.81 ±0.5 | 🔶 (−0.52) |
| SF | 7.76 | 8.39 ±0.6 | 🔶 (−0.63) |
| Final | 7.38 | 7.00 ±1.5 | ✅ |

### Post-25-L (stresstest section H, 10×3 säsonger)

| Fas | mål/match | Target | Gap | cornerGoalPct | Status |
|-----|-----------|--------|-----|---------------|--------|
| Regular | 9.32 | 9.12 ±1.5 | +0.20 | 22.9% | ✅ |
| KVF | **8.38** | 8.81 ±0.5 | −0.43 | 23.1% | ✅ |
| SF | **8.33** | 8.39 ±0.6 | −0.06 | 22.9% | ✅ |
| Final | 8.59 | 7.00 ±1.5 | +1.59 | 24.9% | 🔶 (n=29) |

KVF 8.38 ∈ [8.31, 8.81] ✅  
SF 8.33 ∈ [7.89, 8.39] ✅

### Förbättring KVF/SF

| Fas | Före 25-L | Efter 25-L | Förändring |
|-----|-----------|------------|------------|
| KVF | 8.29 | 8.38 | +0.09 |
| SF | 7.76 | 8.33 | +0.57 |

---

## cornerGoalPct — ska stå still

| Fas | Post-25-K | Post-25-L | Target | Kommentar |
|-----|-----------|-----------|--------|-----------|
| Regular | 23.0% | 22.9% | 22.2% ±3 | ✅ stabil |
| KVF | 22.9% | 23.1% | 20.0% ±3 | 🔶 stabil (minor +0.2pp) |
| SF | 22.6% | 22.9% | 18.8% ±3 | 🔶 stabil (+0.3pp) |
| Final | 27.6% | 24.9% | 16.7% | 🔶 n=29, ej tillförlitlig |

Att goalMod-höjning ger minimal cornerGoalPct-ökning är förväntat: cornerBase = 0.105 × phaseGoalMod × phaseCornerMod, så både täljare och nämnare i cornerGoalPct-bråket stiger proportionellt. Andelen förblir nästan konstant. ✅

---

## Iteration

Ingen iteration nödvändig. Initialvärdena (KVF 0.995, SF 0.965) gav önskat resultat direkt.

---

## homeWin% — ska vara oförändrat från 25-J

| Fas | Post-25-J | Post-25-L | Target |
|-----|-----------|-----------|--------|
| Regular | 46.3% | 46.2% | 50.2% ±5 |
| KVF | 52.5% | 53.3% | 60.3% ±5 |
| SF | 54.0% | 54.6% | 57.9% ±5 |

Inga signifikanta rörelser — goalMod-förändring påverkar inte hemma/borta-balansen. ✅

---

## Build + tester

```
Build: ✅ (npm run build — inga TS-fel)
Tests: ✅ 1895/1895 (165/165 filer)
Stresstest: 0 kraschar, 0 invariantbrott (10×3 säsonger)
```

---

## Slutgiltiga PHASE_CONSTANTS (post-25-L)

```ts
regular:     { goalMod: 1.000, homeAdvDelta: 0.00, suspMod: 1.00, cornerTrailingMod: 1.11, cornerLeadingMod: 0.90, cornerGoalMod: 1.00 }
quarterfinal:{ goalMod: 0.995, homeAdvDelta: 0.06, suspMod: 0.84, cornerTrailingMod: 1.05, cornerLeadingMod: 0.81, cornerGoalMod: 0.78 }
semifinal:   { goalMod: 0.965, homeAdvDelta: 0.05, suspMod: 0.94, cornerTrailingMod: 0.93, cornerLeadingMod: 0.86, cornerGoalMod: 0.75 }
final:       { goalMod: 0.768, homeAdvDelta: 0.00, suspMod: 1.08, cornerTrailingMod: 0.58, cornerLeadingMod: 1.24, cornerGoalMod: 0.92 }
```

---

## Kvarstående

- **KVF cornerGoalPct 23.1%** (target 20.0%): Strukturellt kvarstående från 25-K. Kräver cornerGoalMod-sänkning men det riskerar att åter sänka totalmålen — 25-L-25-K-cykeln. Accepterat som 🔶 tills vidare.
- **Final mål/match 8.59**: n=29, statistiskt brus. Isolerat test stämmer med target.
- **Final cornerGoalPct 24.9%**: n=29, ej tillförlitlig.

---

## Notering

Den ursprungliga spec-uppskattningen (KVF 8.54, SF 8.14 med de föreslagna värdena) underskattade effekten för SF markant — faktiskt utfall 8.33 vs estimerat 8.14. Kompenseringsmekanismen var effektivare för SF än förväntat.
