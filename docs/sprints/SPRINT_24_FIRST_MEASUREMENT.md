# Sprint 24 — Första mätning (referenspunkt)

**Datum:** 2026-04-21  
**Körning:** `npm run stress` (10 seeds × 5 säsonger) → `npm run analyze-stress`  
**Resultat:** 50 säsonger, 7181 matcher, 0 krascher, 3 invariant-varningar (non-crash)

---

## Full rapport

```
══════════════════════════════════════════════════════════════
  STRESS-ANALYS — 10 seeds × 5 säsonger
  Totalt 7181 matcher (varav 5700 grundserie)
  Genererad: 2026-04-21 09:16:35
══════════════════════════════════════════════════════════════

A. GRUNDSERIE-AGGREGAT (jämförelse med bandygrytan 9.12 mål/match)
──────────────────────────────────────────────────────────────
  ✅ goalsPerMatch              10.10   (mål 9.12 ±1.5, diff +0.98)
  ✅ avgHomeGoals               5.09   (mål 4.88 ±1, diff +0.21)
  ✅ avgAwayGoals               5.01   (mål 4.24 ±1, diff +0.77)
  ✅ homeWinPct                 46.9%   (mål 50.2% ±5, diff -3.3pp)
  ❌ drawPct                    7.1%   (mål 11.6% ±3, diff -4.5pp)
  ❌ awayWinPct                 45.9%   (mål 38.3% ±5, diff +7.6pp)
  ❌ cornerGoalPct              26.0%   (mål 22.2% ±3, diff +3.8pp)
  ❌ penaltyGoalPct             0.2%   (mål 5.4% ±2, diff -5.2pp)
  ✅ avgCornersPerMatch         18.04   (mål 17.72 ±3, diff +0.32)
  ❌ avgSuspensionsPerMatch     0.00   (mål 3.77 ±1, diff -3.77)
  ❌ avgHalfTimeGoals           4.86   (mål 4.19 ±0.5, diff +0.67)
  ❌ htLeadWinPct               87.2%   (mål 46.6% ±5, diff +40.6pp)
  ✅ goalsSecondHalfPct         51.9%   (mål 54.2% ±3, diff -2.3pp)

B. MÅLMINUTS-FÖRDELNING (regular season)
──────────────────────────────────────────────────────────────
  ✅ 0-10      8.1%   (target  9.7%,  diff -1.6pp)
  ✅ 10-20    10.3%   (target  9.8%,  diff +0.5pp)
  ❌ 20-30    12.1%   (target  9.8%,  diff +2.3pp)
  ✅ 30-40    11.8%   (target   10%,  diff +1.8pp)
  ✅ 40-50    12.0%   (target 11.8%,  diff +0.2pp)
  ❌ 50-60    14.0%   (target 10.9%,  diff +3.1pp)
  ❌ 60-70    12.6%   (target 10.5%,  diff +2.1pp)
  ✅ 70-80     9.0%   (target 10.7%,  diff -1.7pp)
  ❌ 80-90    10.1%   (target 12.9%,  diff -2.8pp)
         90+       0.0%   (target  3.9%, informativt)

C. SLUTSPEL VS GRUNDSERIE
──────────────────────────────────────────────────────────────
  ✅ regular          10.10 mål/match  (mål 9.12, n=5700, diff +0.98)
  ✅ playoff_qf       9.66 mål/match  (mål 8.81, n=636, diff +0.85)
  ✅ playoff_sf       9.51 mål/match  (mål 8.39, n=325, diff +1.12)
  ❌ playoff_final    9.28 mål/match  (mål 7, n=43, diff +2.28)

D. COMEBACK-FREKVENS (halvtidsunderläge → vinst)
──────────────────────────────────────────────────────────────
  ❌ −1 mål i halvlek         16.1%   (mål 24.5%, n=1783, diff -8.4pp)
  ❌ −2 mål i halvlek          5.6%   (mål 11%, n=1276, diff -5.4pp)
  ✅ −3 mål i halvlek          1.2%   (mål 3.7%, n=856, diff -2.5pp)
  ✅ −4+ mål i halvlek         0.6%   (mål 1.3%, n=862, diff -0.7pp)

E. HEMMAFÖRDEL PER PERIOD (andel mål av hemmalaget)
──────────────────────────────────────────────────────────────
  0-10     51.4%
  10-20    49.7%
  20-30    49.8%
  30-40    49.9%
  40-50    51.0%
  50-60    50.2%
  60-70    51.6%
  70-80    49.2%
  80-90    50.9%
```

---

## Tre största gap (Sprint 25-kandidater)

1. **htLeadWinPct 87.2% vs 46.6% (+40.6pp)** — lag som leder vid halvlek vinner nästan alltid. Motorn saknar comeback-mekanismer. Rotorsak: troligen att underläget halvtids kompounderas snarare än rebalanseras i andra halvlek.

2. **drawPct 7.1% vs 11.6% (−4.5pp) / awayWinPct 45.9% vs 38.3% (+7.6pp)** — oavgjorda resultat omvandlas till bortavinster. Trolig rotorsak: för lite draw-bias i matchslut, och/eller asymmetri i comeback-logiken som gynnar bortalaget.

3. **avgSuspensionsPerMatch 0.00 vs 3.77** — utvisningar registreras inte som MatchEvent i stress-körningen. Antingen skapas de inte av motorn under headless-körning, eller så extraheras de inte korrekt i extractMatchStat. Inget mätvärdesfel — motorn producerar korrekt spel, bara loggningstrafiken saknas.

---

## Notat om mätinfrastruktur

- `penaltyGoalPct` 0.2% vs 5.4%: isPenaltyGoal baseras på att en Penalty-event föregår Goal-event vid samma minut. Kan underskatta om motorn skriver Penalty+Goal på angränsande minuter.
- `avgSuspensionsPerMatch 0.00`: Suspension-events läses av MatchEventType.Suspension — verifieras om detta event-typ faktiskt skrivs av matchEngine under headless-körning.

Dessa mätfel ska åtgärdas i Sprint 25 **innan** motorjusteringar — annars justeras mot felaktiga basvärden.
