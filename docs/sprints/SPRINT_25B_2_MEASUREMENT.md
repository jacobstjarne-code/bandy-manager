# Sprint 25b.2 — Mätrapport

**Datum:** 2026-04-21
**Stress-körning:** 10 seeds × 5 säsonger = 7518 matcher (5958 grundserie)
**Commits:** 595a9ef (wFoul), 56736d8 (foulThreshold)

---

## Sektion A — Grundserie-aggregat

```
✅ goalsPerMatch              9.55    (mål 9.12 ±1.5, diff +0.43)   ← sänkt från 10.02
✅ homeWinPct                 46.0%   (mål 50.2% ±5, diff -4.2pp)
✅ drawPct                    9.8%    (mål 11.6% ±3, diff -1.8pp)
❌ awayWinPct                 44.3%   (mål 38.3% ±5, diff +6.0pp)
❌ cornerGoalPct              26.8%   (mål 22.2% ±3, diff +4.6pp)
✅ penaltyGoalPct             3.4%    (mål 5.4% ±2, diff -2.0pp)
✅ avgCornersPerMatch         16.76   (mål 17.72 ±3, diff -0.96)
✅ avgSuspensionsPerMatch     3.23    (mål 3.77 ±1, diff -0.54)    ← SPRINT-MÅL
✅ avgHalfTimeGoals           4.47    (mål 4.19 ±0.5, diff +0.28)
❌ htLeadWinPct               82.8%   (mål 46.6% ±5, diff +36.2pp)
✅ goalsSecondHalfPct         53.2%   (mål 54.2% ±3, diff -1.0pp)
```

---

## Sektion F — Utvisningar × spelläge

```
               Minuter    Utvisn   Per 1kmin   Referens     Diff
──────────────────────────────────────────────────────────────
Ledning         505983     10331       20.42       22.5    -2.08
Jämnt           341274      4562       13.37       19.6    -6.23
Underläge       505983      8769       17.33       22.5    -5.17

Snitt utvisningar/match: 3.15 (bandygrytan: 3.77, diff -0.62)
```

Spellägesordning korrekt: Ledning > Underläge > Jämnt.
Ledning nu på 20.42/kmin (referens 22.5) — 91% av target.
Jämnt fortfarande lägst gap: 13.37 vs 19.6 (68% av target).

---

## Spec-jämförelse (Sprint 25b.2-tabellen)

| Mått | Före (25b.1) | Target | Acceptabelt | Utfall | Status |
|---|---|---|---|---|---|
| `avgSuspensionsPerMatch` | 0.82 | 3.77 | 3.3–4.3 | **3.23** | ⚠️ (±1 ✅, tighter 3.3 ej nått) |
| `penaltyGoalPct` | 3.7% | 5.4% | 3.5–5.5% | **3.4%** | ⚠️ (±2 ✅, tighter 3.5 ej nått) |
| `goalsPerMatch` | 10.02 | 9.12 | 9.3–10.2 | **9.55** | ✅ |
| `cornerGoalPct` | ~26% | 22.2% | 23–27% | **26.8%** | ✅ |
| `htLeadWinPct` | 83.2% | 46.6% | 70–82% | **82.8%** | ⚠️ (0.8pp över) |
| Comeback −1 | 18.2% | 24.5% | 19–24% | **18.0%** | ⚠️ (marginellt under) |

Spec-villkoret för 25b.2.2 (< 2.5 utvisningar/match) är INTE uppfyllt.
3.23 är inom ±1 toleransen men 0.07 under spec:ens tighter 3.3-gräns.

---

## Sid-effekter observerade

- `goalsPerMatch` sänkt 10.02 → 9.55 (+0.43 från target) — fler foul-sekvenser ger
  färre attack/corner-sekvenser, naturlig effekt av wFoul-ökning.
- `penaltyGoalPct` 3.7% → 3.4% — marginellt lägre, inom tolerans. Separat trigger
  påverkas inte av foul-mekaniken men minskat attack-share ger något lägre chanceQuality.
- `awayWinPct` 45% → 44.3% — oförändrat i praktiken.
- `htLeadWinPct` 83.2% → 82.8% — nästan oförändrat. PP-effekten på comebacks är svag
  med denna kalibrering.

---

## Nästa steg

Avgörs av Jacob:
- **25b.2.2 (finjustering):** Höj multiplikator 1.25 → ~1.46 för att nå ~3.7/match.
  Skulle kosta 0.1-0.2pp på goalsPerMatch och marginellt mer på penaltyGoalPct.
- **25d direkt:** Acceptera 3.23 (±1 ✅) och gå vidare till fas-konstanter.
