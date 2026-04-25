# Sprint 25-J — Audit

**Datum:** 2026-04-25  
**Scope:** Synka spelets baseAdv mot kalibreringen (0.05 → 0.14)

---

## Punkter i spec

- [x] `matchSimProcessor.ts:266` — `baseAdv` ändrad från `0.05` / `0.05 * 0.85` till `0.14` / `0.14 * 0.85`
- [x] Ingen annan logik rörd
- [x] Build grön
- [x] 1895/1895 tester
- [x] Stresstest 10 seeds × 3 säsonger: 0 kraschar, 0 invariantbrott
- [x] awayWinPct inom tolerans

---

## Mätvärden före/efter

| Mått | Före (0.05) | Efter (0.14) | Target | Status |
|------|-------------|--------------|--------|--------|
| awayWinPct | ~42.2% | **40.0%** | 38.3% ±5 | ✅ |
| homeWinPct | ~43.7% | **46.4%** | 50.2% ±5 | ✅ |
| drawPct | ~15.7% | **13.5%** | 11.6% ±3 | ✅ |
| goals/match | 9.00 | **9.32** | 9.12 ±1.5 | ✅ |
| cornerGoalPct | ~22.1% | **22.8%** | 22.2% ±3 | ✅ |

Oväntat positivt: drawPct sjönk spontant från ~15.7% till 13.5% — restaluckan mot target 11.6% krympte utan att vi rörde draw-logiken. homeWinPct steg från ~43.7% till 46.4%.

---

## Stresstest-utdrag (10 seeds × 3 säsonger, 4821 matcher)

```
✅ awayWinPct    40.0%  (mål 38.3% ±5, diff +1.7pp)
✅ homeWinPct    46.4%  (mål 50.2% ±5, diff -3.8pp)
✅ drawPct       13.5%  (mål 11.6% ±3, diff +1.9pp)
✅ goalsPerMatch  9.32  (mål 9.12 ±1.5, diff +0.20)
✅ cornerGoalPct 22.8%  (mål 22.2% ±3, diff +0.6pp)

Crashes: 0
Invariant breaks: 0
```

Alla 13 sektioner (A-G) gröna ✅.

---

## Inga oväntade rörelser

Alla andra mätvärden som htLeadWinPct (77.8%, target 78.1% ✅), penaltyGoalPct (3.7%), avgCornersPerMatch (16.60) är inom tolerans och oförändrade från föregående mätning.

---

## Diff

```diff
- const baseAdv = homeClub?.hasIndoorArena ? 0.05 * 0.85 : 0.05
+ const baseAdv = homeClub?.hasIndoorArena ? 0.14 * 0.85 : 0.14
```

En rad. En siffra. Inga sidoeffekter.

---

## Nya lärdomar till LESSONS.md

Per spec: lägg till entry om att kalibrerings-parametrar måste matcha motorns produktions-defaults. Hanteras av Opus efter sprint.
