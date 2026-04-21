# Sprint 25a.2 — Mätning

**Datum:** 2026-04-21  
**Körning:** `npm run stress` (10 seeds × 5 säsonger) → `npm run analyze-stress`  
**Resultat:** 50 säsonger, 7525 matcher, 0 krascher, 3 invariant-varningar (non-crash)

---

## Full rapport

```
══════════════════════════════════════════════════════════════
  STRESS-ANALYS — 10 seeds × 5 säsonger
  Totalt 7525 matcher (varav 5958 grundserie)
  Genererad: 2026-04-21 11:09:50
══════════════════════════════════════════════════════════════

A. GRUNDSERIE-AGGREGAT (jämförelse med bandygrytan 9.12 mål/match)
──────────────────────────────────────────────────────────────
  ✅ goalsPerMatch              10.13   (mål 9.12 ±1.5, diff +1.01)
  ✅ avgHomeGoals               5.13   (mål 4.88 ±1, diff +0.25)
  ✅ avgAwayGoals               5.01   (mål 4.24 ±1, diff +0.77)
  ✅ homeWinPct                 47.4%   (mål 50.2% ±5, diff -2.8pp)
  ❌ drawPct                    8.4%   (mål 11.6% ±3, diff -3.2pp)
  ❌ awayWinPct                 44.2%   (mål 38.3% ±5, diff +5.9pp)
  ❌ cornerGoalPct              26.1%   (mål 22.2% ±3, diff +3.9pp)
  ❌ penaltyGoalPct             0.3%   (mål 5.4% ±2, diff -5.2pp)
  ✅ avgCornersPerMatch         18.09   (mål 17.72 ±3, diff +0.37)
  ❌ avgSuspensionsPerMatch     0.47   (mål 3.77 ±1, diff -3.30)
  ❌ avgHalfTimeGoals           4.87   (mål 4.19 ±0.5, diff +0.68)
  ❌ htLeadWinPct               83.8%   (mål 46.6% ±5, diff +37.2pp)
  ✅ goalsSecondHalfPct         52.0%   (mål 54.2% ±3, diff -2.2pp)

B. MÅLMINUTS-FÖRDELNING (regular season)
──────────────────────────────────────────────────────────────
  ✅ 0-10      8.1%   (target  9.7%,  diff -1.6pp)
  ✅ 10-20    10.3%   (target  9.8%,  diff +0.5pp)
  ❌ 20-30    12.1%   (target  9.8%,  diff +2.3pp)
  ✅ 30-40    11.9%   (target   10%,  diff +1.9pp)
  ✅ 40-50    11.8%   (target 11.8%,  diff -0.0pp)
  ❌ 50-60    13.8%   (target 10.9%,  diff +2.9pp)
  ❌ 60-70    12.6%   (target 10.5%,  diff +2.1pp)
  ✅ 70-80     9.0%   (target 10.7%,  diff -1.7pp)
  ❌ 80-90    10.5%   (target 12.9%,  diff -2.4pp)
         90+       0.0%   (target  3.9%, informativt)

C. SLUTSPEL VS GRUNDSERIE
──────────────────────────────────────────────────────────────
  ✅ regular          10.13 mål/match  (mål 9.12, n=5958, diff +1.01)
  ✅ playoff_qf       9.81 mål/match  (mål 8.81, n=685, diff +1.00)
  ✅ playoff_sf       9.52 mål/match  (mål 8.39, n=342, diff +1.13)
  ❌ playoff_final    8.89 mål/match  (mål 7, n=42, diff +1.89)

D. COMEBACK-FREKVENS (halvtidsunderläge → vinst)
──────────────────────────────────────────────────────────────
  ❌ −1 mål i halvlek         18.2%   (mål 24.5%, n=1837, diff -6.3pp)
  ✅ −2 mål i halvlek          9.6%   (mål 11%, n=1345, diff -1.4pp)
  ✅ −3 mål i halvlek          2.3%   (mål 3.7%, n=866, diff -1.4pp)
  ✅ −4+ mål i halvlek         0.3%   (mål 1.3%, n=920, diff -1.0pp)

E. HEMMAFÖRDEL PER PERIOD (andel mål av hemmalaget)
──────────────────────────────────────────────────────────────
  0-10     51.1%
  10-20    50.3%
  20-30    49.5%
  30-40    50.3%
  40-50    51.3%
  50-60    50.1%
  60-70    51.5%
  70-80    49.9%
  80-90    51.4%
```

---

## Jämförelse Sprint 24 → 25a → 25a.2

| Mått | Sprint 24 | Sprint 25a | Sprint 25a.2 | Target | Δ (25a→25a.2) |
|---|---|---|---|---|---|
| htLeadWinPct | 87.4% | 86.5% | **83.8%** | 46.6% | −2.7pp |
| drawPct | 7.1% | 7.0% | **8.4%** | 11.6% | +1.4pp |
| awayWinPct | 45.3% | 45.8% | **44.2%** | 38.3% | −1.6pp |
| goalsPerMatch | 10.10 | 10.26 | **10.13** | 9.12 | −0.13 |
| cornerGoalPct | 26.0% | 25.8% | **26.1%** | 22.2% | +0.3pp |
| avgSuspensionsPerMatch | 0.45 | 0.47 | **0.47** | 3.77 | 0 |
| Comeback −1 | 15.2% | 16.5% | **18.2%** | 24.5% | +1.7pp |
| Comeback −2 | 5.6% | 7.7% | **9.6%** | 11.0% | +1.9pp |
| Comeback −3 | 1.0% | 1.7% | **2.3%** | 3.7% | +0.6pp |

---

## Bedömning

Ändringen fungerade. `htLeadWinPct` gick från 87.4% → 83.8% (−3.6pp totalt sedan S24), `drawPct` ökade från 7.1% → 8.4% (+1.3pp), comeback vid −1 gick från 15.2% → 18.2% (+3pp), comeback vid −2 nådde 9.6% (2.6pp från target).

Återstående gap för Sprint 25c:
- `htLeadWinPct` 83.8% vs 46.6% — fortfarande 37pp över target. Strukturellt problem: motorn är fortfarande deterministisk i form av att leading-lag vinner för ofta. Eventuellt kräver detta en mer fundamental ändring (slumpmässiga momentum-skift oberoende av score) snarare än ytterligare modifierare.
- `drawPct` 8.4% vs 11.6% — 3pp kvar, på rätt spår.
- `avgSuspensionsPerMatch` 0.47 vs 3.77 — oförändrat trots foulMod 1.20x för chasing. Motorns basfrekvens för foul-sekvenser är för låg — separat kalibreringsproblem.
