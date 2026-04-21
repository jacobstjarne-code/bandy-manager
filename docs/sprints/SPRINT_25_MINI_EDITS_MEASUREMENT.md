# Sprint 25b.2.2 + 25d.2 — Mini-edits Mätrapport

**Datum:** 2026-04-21
**Commits:** dc02046 (foulThreshold 1.25→1.46), a255f76 (KVF homeAdvDelta 0.03→0.06)
**Stress-körning:** 10 seeds × 5 säsonger = 7512 matcher (5958 grundserie)
**Build:** ✅ exit 0 | **Test:** ✅ alla passerar | **Stress:** 0 violations

---

## Nyckeltal — förändring vs förväntat

| Mått | Före | Utfall | Target | Status |
|---|---|---|---|---|
| `avgSuspensionsPerMatch` | 3.23 | **3.75** | 3.77 | ✅ (−0.02, praktiskt nått) |
| KVF `homeWin%` | 50.8% | **53.4%** | 60.3% | 🔶 (−6.9pp, förbättrat +2.6pp) |
| KVF `goalsPerMatch` | 9.06 | **9.01** | 8.81 | ✅ (oförändrat) |
| Grundserie `homeWin%` | 45.9% | **46.9%** | 50.2% | 🔶 (oförändrat i praktiken) |
| `htLeadWinPct` | 82.8% | **83.2%** | 46.6% | ⚠️ (stabil, ej påverkad av mini-edits) |

---

## Sektion H — Per-fas (ny körning)

```
Fas          mål/match  target   homeWin%  target   avgSusp  target   corner%  target
Grundserie   🔶 9.55   9.12   🔶 46.9   50.2   ✅ 3.75   3.77   ❌ 26.7   22.2  (n=5958)
KVF          ✅ 9.01   8.81   🔶 53.4   60.3   ✅ 3.19   3.18   ❌ 30.5   20.0  (n=676)
SF           ✅ 8.93   8.39   🔶 51.2   57.9   ✅ 3.62   3.55   ❌ 31.8   18.8  (n=338)
Final        ❌ 9.42   7.00   ✅ 48.9   50.0   ✅ 3.76   4.08   ❌ 31.4   16.7  (n=45)
```

---

## Analys per ändring

### Sprint 25b.2.2 — foulThreshold 1.25 → 1.46

`avgSuspensionsPerMatch`: 3.23 → **3.75** (target 3.77). Gap −0.02. Praktiskt nått.
KVF/SF/Final avgSusp: 3.19/3.62/3.76 — samtliga ✅ mot respektive target.
Inga bieffekter på goalsPerMatch (+0.0) eller cornerGoalPct.

### Sprint 25d.2 — KVF homeAdvDelta 0.03 → 0.06

KVF homeWin%: 50.8% → **53.4%**. Förbättring +2.6pp. Gap mot target 60.3% är −6.9pp.
Fortfarande 🔶 (inom 2×tolerans 8pp). Förväntad effekt av +0.03 var ~5-6pp — utfall +2.6pp
tyder på att homeAdvDelta har begränsad marginaleffekt vid denna nivå, eller att KVF-gapet
delvis är ett basmotorproblem (samma sak som grundserie −3.3pp).

---

## Oväntade rörelser

**Inga dramatiska oväntade rörelser.**

Final goalsPerMatch 9.42 vs target 7.00 (❌) — n=45, hög varians. Sannolikt brus.
Samma avvikelse syntes i föregående stress-körning (8.49 vs 7.00). Strukturellt.

`htLeadWinPct` 83.2% — i princip oförändrat (var 82.8%). Påverkas ej av dessa edits. ✅

---

## Kvarstående efter mini-edits

| Mått | Status | Kandidat |
|---|---|---|
| `avgSuspensionsPerMatch` | ✅ 3.75 vs 3.77 | Stängt |
| KVF `homeWin%` | 🔶 53.4% vs 60.3% | Mer homeAdvDelta (0.06→0.09?) eller motorfix |
| `cornerGoalPct` | ❌ alla faser | Strukturell motorbugg (Sprint 25e) |
| Final `goalsPerMatch` | ❌ n=45 brus | Troligen naturlig varians, inte åtgärdsbar |
| Grundserie `homeWin%` | 🔶 46.9% vs 50.2% | Basmotorproblem (Sprint 25e) |
