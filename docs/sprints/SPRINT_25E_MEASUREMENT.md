# Sprint 25e — Mätrapport

**Datum:** 2026-04-24
**Commits:** ff6b0ac, 81a7eb8
**Stress-körning:** 10 seeds × 5 säsonger = 7328 matcher (5826 grundserie)
**Build:** ✅ exit 0 | **Stress:** 0 violations

---

## Nyckeltal — grundserie

| Mått | Före | Utfall | Target | Status |
|---|---|---|---|---|
| `goalsPerMatch` | 9.54 | **9.20** | 9.12 ±1.5 | ✅ |
| `cornerGoalPct` | 26.6% | **22.7%** | 22.2% ±3 | ✅ |
| `avgSuspensionsPerMatch` | 3.74 | **3.74** | 3.77 ±1 | ✅ |
| `homeWinPct` | 45.8% | **45.8%** | 50.2% ±5 | ✅ |
| `htLeadWinPct` | 83.1% | **83.3%** | 46.6% ±5 | ❌ (strukturellt) |

---

## Sektion H — Per-fas

```
Fas          mål/match  target   homeWin%  target   avgSusp  target   corner%  target
Grundserie   ✅  9.20   9.12   ❌  45.8   50.2   ✅  3.74   3.77   ✅  22.7   22.2  (n=5826)
KVF          ✅  8.62   8.81   ❌  51.6   60.3   ✅  3.18   3.18   ❌  26.1   20.0  (n=645)
SF           ✅  8.40   8.39   ✅  54.9   57.9   ✅  3.33   3.55   🔶  25.7   18.8  (n=326)
Final        🔶  8.12   7.00   🔶  39.5   50.0   ✅  4.49   4.08   🔶  25.5   16.7  (n=43)
```

---

## Analys per commit

### ff6b0ac — Strukturfix: phaseConst.goalMod på cornerBase

Applicerade `phaseConst.goalMod` separat på `cornerBase` och `cornerClampMin` i stället för att lyfta allt under `stepGoalMod` (undviker dubbelräkning av SECOND_HALF_BOOST).

**Effekt:**
- Final cornerGoalPct: 37.0% → 32.1% (−4.9pp)
- Grundserie: 26.7% → 26.6% (oförändrat ✓)
- Strukturell bugg fixad: cornerGoalPct eskalerar inte längre med lägre goalMod

### 81a7eb8 — Kalibrering: cornerBase 0.14 → 0.105

Beräkning: 26.6% cornerGoalPct → target 22.2% kräver ~24% minskning i hörnmålsfrekvens.
Nuvarande konvertering ~15.1% → target ~11.5% → cornerBase 0.14 × 0.75 ≈ 0.105.

**Effekt:**
- Grundserie cornerGoalPct: 26.6% → 22.7% ✅
- goalsPerMatch: 9.54 → 9.20 (bättre, hörnmål var en bidragande orsak till övertäckning)
- Playoff cornerGoalPct: fortsatt ❌/🔶 men väsentligt bättre (37% → 25.5% final)

---

## Kvarstående

Playoff cornerGoalPct (KVF ❌ 26.1%, SF 🔶 25.7%, Final 🔶 25.5%) kräver fas-specifik
kalibrering i cornerInteractionService — cornerBase är nu rätt kalibrerad för grundserie,
men slutspelsmatcher har samma konverteringsbasrad oavsett fas. Sprint 25f-kandidat.
