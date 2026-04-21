# Sprint 25a — Mätning (efter implementation)

**Datum:** 2026-04-21  
**Körning:** `npm run stress` (10 seeds × 5 säsonger) → `npm run analyze-stress`  
**Resultat:** 50 säsonger, 7175 matcher, 0 krascher, 3 invariant-varningar (non-crash)

---

## Full rapport

```
══════════════════════════════════════════════════════════════
  STRESS-ANALYS — 10 seeds × 5 säsonger
  Totalt 7175 matcher (varav 5700 grundserie)
  Genererad: 2026-04-21 10:52:45
══════════════════════════════════════════════════════════════

A. GRUNDSERIE-AGGREGAT (jämförelse med bandygrytan 9.12 mål/match)
──────────────────────────────────────────────────────────────
  ✅ goalsPerMatch              10.26   (mål 9.12 ±1.5, diff +1.14)
  ✅ avgHomeGoals               5.18   (mål 4.88 ±1, diff +0.30)
  ✅ avgAwayGoals               5.08   (mål 4.24 ±1, diff +0.84)
  ✅ homeWinPct                 47.1%   (mål 50.2% ±5, diff -3.1pp)
  ❌ drawPct                    7.0%   (mål 11.6% ±3, diff -4.6pp)
  ❌ awayWinPct                 45.8%   (mål 38.3% ±5, diff +7.5pp)
  ❌ cornerGoalPct              25.8%   (mål 22.2% ±3, diff +3.6pp)
  ❌ penaltyGoalPct             0.2%   (mål 5.4% ±2, diff -5.2pp)
  ✅ avgCornersPerMatch         18.05   (mål 17.72 ±3, diff +0.33)
  ❌ avgSuspensionsPerMatch     0.47   (mål 3.77 ±1, diff -3.30)
  ❌ avgHalfTimeGoals           4.87   (mål 4.19 ±0.5, diff +0.68)
  ❌ htLeadWinPct               86.5%   (mål 46.6% ±5, diff +39.9pp)
  ✅ goalsSecondHalfPct         52.5%   (mål 54.2% ±3, diff -1.7pp)

B. MÅLMINUTS-FÖRDELNING (regular season)
──────────────────────────────────────────────────────────────
  ✅ 0-10      8.0%   (target  9.7%,  diff -1.7pp)
  ✅ 10-20    10.2%   (target  9.8%,  diff +0.4pp)
  ❌ 20-30    12.0%   (target  9.8%,  diff +2.2pp)
  ✅ 30-40    11.7%   (target   10%,  diff +1.7pp)
  ✅ 40-50    11.9%   (target 11.8%,  diff +0.1pp)
  ❌ 50-60    14.2%   (target 10.9%,  diff +3.1pp)
  ❌ 60-70    12.7%   (target 10.5%,  diff +2.2pp)
  ✅ 70-80     9.1%   (target 10.7%,  diff -1.6pp)
  ❌ 80-90    10.2%   (target 12.9%,  diff -2.7pp)
         90+       0.0%   (target  3.9%, informativt)

C. SLUTSPEL VS GRUNDSERIE
──────────────────────────────────────────────────────────────
  ✅ regular          10.26 mål/match  (mål 9.12, n=5700, diff +1.14)
  ✅ playoff_qf       9.84 mål/match  (mål 8.81, n=646, diff +1.03)
  ✅ playoff_sf       9.69 mål/match  (mål 8.39, n=310, diff +1.30)
  ❌ playoff_final    8.69 mål/match  (mål 7, n=42, diff +1.69)

D. COMEBACK-FREKVENS (halvtidsunderläge → vinst)
──────────────────────────────────────────────────────────────
  ❌ −1 mål i halvlek         16.5%   (mål 24.5%, n=1748, diff -8.0pp)
  ✅ −2 mål i halvlek          7.7%   (mål 11%, n=1316, diff -3.3pp)
  ✅ −3 mål i halvlek          1.7%   (mål 3.7%, n=823, diff -2.0pp)
  ✅ −4+ mål i halvlek         0.7%   (mål 1.3%, n=899, diff -0.6pp)

E. HEMMAFÖRDEL PER PERIOD (andel mål av hemmalaget)
──────────────────────────────────────────────────────────────
  0-10     51.3%
  10-20    50.2%
  20-30    49.8%
  30-40    50.4%
  40-50    50.8%
  50-60    49.8%
  60-70    51.2%
  70-80    50.1%
  80-90    50.9%
```

---

## Jämförelse Sprint 24 → Sprint 25a

| Mått | Sprint 24 | Sprint 25a | Target | Δ |
|---|---|---|---|---|
| htLeadWinPct | 87.4% | **86.5%** | 46.6% | −0.9pp |
| drawPct | 7.1% | **7.0%** | 11.6% | −0.1pp |
| awayWinPct | 45.3% | **45.8%** | 38.3% | +0.5pp |
| goalsPerMatch | 10.10 | **10.26** | 9.12 | +0.16 |
| cornerGoalPct | 26.0% | **25.8%** | 22.2% | −0.2pp |
| avgSuspensionsPerMatch | 0.45 | **0.47** | 3.77 | +0.02 |
| Comeback −1 | 15.2% | **16.5%** | 24.5% | +1.3pp |
| Comeback −2 | 5.6% | **7.7%** | 11.0% | +2.1pp |
| Comeback −3 | 1.0% | **1.7%** | 3.7% | +0.7pp |

---

## Kritisk observation

`htLeadWinPct` rörde sig bara 0.9pp trots tre justeringar. Rotorsak: `secondHalfGoalMod`/`secondHalfFoulMod` i `getSecondHalfMode()` appliceras **enbart** vid `managedIsHome !== undefined` (rad 515 i matchCore.ts) — dvs bara för managerns eget lag i live-matcher. I stress-testet är `managedIsHome` alltid `undefined` → dessa mods kör aldrig → headless-mätningen fångar inte ändring 1 och 3.

`trailingBoost` (ändring 2) kör däremot på **båda lag** utan villkor — det förklarar de 1-2pp förbättringarna i comeback-frekvens.

**Implikation:** Ändringarna har en reell effekt i live-matcher men är inte synliga i stress-mätningen. Sprint 25b behöver antingen (a) en headless-mätbar mekanism, eller (b) komplettera `trailingBoost`-logiken som gäller globalt.
