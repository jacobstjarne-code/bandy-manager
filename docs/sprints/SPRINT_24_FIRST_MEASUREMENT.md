# Sprint 24 — Första mätning (referenspunkt)

**Datum:** 2026-04-21  
**Körning:** `npm run stress` (10 seeds × 5 säsonger) → `npm run analyze-stress`  
**Resultat:** 50 säsonger, 7179 matcher, 0 krascher, 3 invariant-varningar (non-crash)

**Sprint 24.1:** Fixade suspension-tracking (MatchEventType.RedCard, inte .Suspension).

---

## Full rapport (efter 24.1-fix)

```
══════════════════════════════════════════════════════════════
  STRESS-ANALYS — 10 seeds × 5 säsonger
  Totalt 7179 matcher (varav 5700 grundserie)
  Genererad: 2026-04-21 10:09:52
══════════════════════════════════════════════════════════════

A. GRUNDSERIE-AGGREGAT (jämförelse med bandygrytan 9.12 mål/match)
──────────────────────────────────────────────────────────────
  ✅ goalsPerMatch              10.10   (mål 9.12 ±1.5, diff +0.98)
  ✅ avgHomeGoals               5.10   (mål 4.88 ±1, diff +0.22)
  ✅ avgAwayGoals               4.99   (mål 4.24 ±1, diff +0.75)
  ✅ homeWinPct                 47.5%   (mål 50.2% ±5, diff -2.7pp)
  ❌ drawPct                    7.1%   (mål 11.6% ±3, diff -4.5pp)
  ❌ awayWinPct                 45.3%   (mål 38.3% ±5, diff +7.0pp)
  ❌ cornerGoalPct              26.0%   (mål 22.2% ±3, diff +3.8pp)
  ❌ penaltyGoalPct             0.3%   (mål 5.4% ±2, diff -5.1pp)
  ✅ avgCornersPerMatch         18.08   (mål 17.72 ±3, diff +0.36)
  ❌ avgSuspensionsPerMatch     0.45   (mål 3.77 ±1, diff -3.32)
  ❌ avgHalfTimeGoals           4.86   (mål 4.19 ±0.5, diff +0.67)
  ❌ htLeadWinPct               87.4%   (mål 46.6% ±5, diff +40.8pp)
  ✅ goalsSecondHalfPct         51.8%   (mål 54.2% ±3, diff -2.4pp)

B. MÅLMINUTS-FÖRDELNING (regular season)
──────────────────────────────────────────────────────────────
  ✅ 0-10      8.1%   (target  9.7%,  diff -1.6pp)
  ✅ 10-20    10.3%   (target  9.8%,  diff +0.5pp)
  ❌ 20-30    12.1%   (target  9.8%,  diff +2.3pp)
  ✅ 30-40    11.9%   (target   10%,  diff +1.9pp)
  ✅ 40-50    11.9%   (target 11.8%,  diff +0.1pp)
  ❌ 50-60    14.0%   (target 10.9%,  diff +3.1pp)
  ❌ 60-70    12.6%   (target 10.5%,  diff +2.1pp)
  ✅ 70-80     9.0%   (target 10.7%,  diff -1.7pp)
  ❌ 80-90    10.1%   (target 12.9%,  diff -2.8pp)
         90+       0.0%   (target  3.9%, informativt)

C. SLUTSPEL VS GRUNDSERIE
──────────────────────────────────────────────────────────────
  ✅ regular          10.10 mål/match  (mål 9.12, n=5700, diff +0.98)
  ✅ playoff_qf       9.79 mål/match  (mål 8.81, n=635, diff +0.98)
  ✅ playoff_sf       9.57 mål/match  (mål 8.39, n=325, diff +1.18)
  ❌ playoff_final    9.14 mål/match  (mål 7, n=42, diff +2.14)

D. COMEBACK-FREKVENS (halvtidsunderläge → vinst)
──────────────────────────────────────────────────────────────
  ❌ −1 mål i halvlek         15.2%   (mål 24.5%, n=1759, diff -9.3pp)
  ❌ −2 mål i halvlek          5.6%   (mål 11%, n=1284, diff -5.3pp)
  ✅ −3 mål i halvlek          1.0%   (mål 3.7%, n=858, diff -2.7pp)
  ✅ −4+ mål i halvlek         0.6%   (mål 1.3%, n=866, diff -0.7pp)

E. HEMMAFÖRDEL PER PERIOD (andel mål av hemmalaget)
──────────────────────────────────────────────────────────────
  0-10     51.2%
  10-20    49.9%
  20-30    50.2%
  30-40    50.4%
  40-50    51.1%
  50-60    50.1%
  60-70    51.3%
  70-80    49.5%
  80-90    51.1%
```

---

## Gap-analys (Sprint 25-kandidater, prioritetsordning)

### 1. htLeadWinPct 87.4% vs 46.6% (+40.8pp) — KRITISK
Lag som leder vid halvlek vinner nästan alltid. I verkligheten vänder 24.5% av match vid −1 i underläge. Rotorsak: motorn ger det ledande laget en kompounderad fördel under andra halvlek som inte matchar verkliga comeback-mönster.

### 2. drawPct 7.1% vs 11.6% (−4.5pp) / awayWinPct 45.3% vs 38.3% (+7.0pp)
Hänger ihop med (1) — oavgjorda matcher faller åt bortalaget. Eller: bortalagets comeback-frekvens är för hög relativt hemmalagen.

### 3. avgSuspensionsPerMatch 0.45 vs 3.77 (−3.32) — MOTORPROBLEM
Tracking fungerar nu (RedCard-events läses korrekt). Motorn triggar för sällan utvisning-steg. Varje match borde ha i snitt 3.77 — motorn levererar 0.45. Kräver motorjustering av suspensionOccurred-sannolikheter i matchCore.ts.

### 4. cornerGoalPct 26.0% vs 22.2% (+3.8pp)
För hög andel hörnmål. Kan bero på cornerInteractionService.ts sannolikheter.

### 5. penaltyGoalPct 0.3% vs 5.4% (−5.1pp) — delvis tracking-issue
isPenaltyGoal-detektionen (Penalty-event vid samma minut som Goal-event) är sannolikt underskattning om motorn skriver dem på angränsande minuter. Bör verifieras separat innan motorjustering.

### 6. avgHalfTimeGoals 4.86 vs 4.19 (+0.67)
Något för många mål i första halvlek. Kan hänga ihop med goalsPerMatch +0.98 total.

---

## Notat: hemmafördel (sektion E)
~50-51% hemma-andel per period, jämnt fördelat. Förväntat ~53-55%. Kan indikera att homeAdvantage 0.14 är korrekt på mattnivå (homeWinPct 47.5% vs 50.2%) men att effekten är jämnare fördelad än verkligheten.
