# Sprint 25b.1 — Mätrapport

**Datum:** 2026-04-21
**Stress-körning:** 10 seeds × 5 säsonger = 7974 matcher (6336 grundserie)
**Commit:** 5861cb8

---

## Sektion A — Grundserie-aggregat

```
✅ goalsPerMatch              10.02   (mål 9.12 ±1.5, diff +0.90)
✅ homeWinPct                 45.4%   (mål 50.2% ±5, diff -4.8pp)
✅ drawPct                    9.6%    (mål 11.6% ±3, diff -2.0pp)
❌ awayWinPct                 45.0%   (mål 38.3% ±5, diff +6.7pp)
❌ cornerGoalPct              26.2%   (mål 22.2% ±3, diff +4.0pp)
✅ penaltyGoalPct             3.7%    (mål 5.4% ±2, diff -1.7pp)   ← SPRINT-MÅL
✅ avgCornersPerMatch         17.91   (mål 17.72 ±3, diff +0.19)
❌ avgSuspensionsPerMatch     0.82    (mål 3.77 ±1, diff -2.95)    ← 25b.2
❌ avgHalfTimeGoals           4.83    (mål 4.19 ±0.5, diff +0.64)
❌ htLeadWinPct               83.2%   (mål 46.6% ±5, diff +36.6pp)
✅ goalsSecondHalfPct         51.8%   (mål 54.2% ±3, diff -2.4pp)
```

---

## Sektion G — Straff × spelläge

```
Totala straffmål: 2979 (3.76% av mål)
Estimerat antal straffar (÷ 0.70): ~4256

               Minuter    Straff   Per 1kmin   Referens     Diff
──────────────────────────────────────────────────────────────
Ledning         542860      1351       2.489       3.04   -0.551
Jämnt           349600       632       1.808       2.57   -0.762
Underläge       542860       996       1.835       2.53   -0.695
```

Spellägesordning korrekt: Ledning > Underläge > Jämnt (matchar bandygrytan-referens).
Absoluta nivåer ~82% av referens i ledning, ~70% i jämnt/underläge.

---

## Spec-jämförelse

| Mått | Före sprint | Target | Acceptabelt | Utfall | Status |
|---|---|---|---|---|---|
| `penaltyGoalPct` | 0.25% | 5.4% | 3.0–7.0% | **3.7%** | ✅ |
| Straffmål/match | ~0.013 | ~0.49 | 0.13–0.20 | **0.470** | ✅ (över spec:s intervall men matchar referensen) |
| `avgSuspensionsPerMatch` | 0.47 | 3.77 | 1.3–1.5 | **0.82** | ❌ (som förväntat — 25b.2) |
| `goalsPerMatch` | 10.13 | 9.12 | 10.0–10.3 | **10.02** | ✅ |

---

## Kalibreringsnot

Spec:ens sanity check antog 150 steps/match (60 attack-sekvenser).
Faktisk motor kör 60 steps/match (~24 attack-sekvenser, ~12 med chanceQuality > 0.40).
Kräver 10× högre base-sannolikhet: 0.012 → 0.13 (justerat efter diagnostisk körning).

Diagnostisk körning (500 matcher, jämstarka lag): 5.34% penaltyGoalPct.
Stress-körning (varierad lagstyrka, defensiva profiler): 3.7% — mer konservativt eftersom
defensiva matcher genererar lägre chanceQuality och triggar straff mer sällan.

---

## Nästa steg

- **Sprint 25b.2:** Höj foul-basfrekvens. `avgSuspensionsPerMatch` 0.82 → 3.77.
  Nuläget (0.82) beror på att alla fouls nu ger utvisning (x2 från före), men
  absolutnivån är fortfarande ~5× för låg. Rotorsak: `foulProb`-beräkningens
  `0.55`-multiplikator.
