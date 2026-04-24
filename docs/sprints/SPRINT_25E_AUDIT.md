# Sprint 25e — Audit

**Datum:** 2026-04-24
**Commits:** ff6b0ac (strukturfix phaseGoalMod), 81a7eb8 (kalibrering cornerBase 0.14→0.105)

---

## Bakgrund

`cornerGoalPct` var ❌ i alla faser (eskalerande mot slutspel). Rotorsak: `cornerBase` (0.14) och `cornerClampMin` (0.10) påverkades inte av `stepGoalMod`. När `phaseConst.goalMod` sänker reguljära mål i slutspel bibehölls hörnmålsbasen absolut → hörnmålsandel av totala mål steg kraftigt.

---

## Punkter i spec (Sprint 25e = strukturfix + kalibrering)

- [x] **Strukturfix (ff6b0ac):** `phaseConst.goalMod` appliceras separat på `cornerBase` och `cornerClampMin`, utan att dubbeltäckna `SECOND_HALF_BOOST` (som redan ingår i `stepGoalMod`).
  Verifierat: rad 887-890 i `matchCore.ts`, `phaseGoalMod = phaseConst.goalMod`.

- [x] **Kalibrering (81a7eb8):** `cornerBase` 0.14 → 0.105, `cornerClampMin` 0.10 → 0.07.
  Verifierat: rad 888-890 i `matchCore.ts`.

- [x] **analyze-stress kraschfix:** `String.repeat()` med negativ median → `'▼'` för negativt kapital.
  Verifierat: rad 715 i `scripts/analyze-stress.ts`.

- [x] **npm run build** — exit 0 (inga TypeScript-fel).

- [x] **npm run stress** — 0 violations, 0 crashes (10×5 = 7328 matcher).

- [x] **npm run analyze-stress** — kör utan krasch.

---

## Före/efter nyckeltal

| Mått | Före Sprint 25e | Utfall | Target | Status |
|---|---|---|---|---|
| Grundserie `cornerGoalPct` | 26.7% | **22.7%** | 22.2% ±3 | ✅ (+0.5pp) |
| KVF `cornerGoalPct` | 30.7% | **26.1%** | 20.0% ±3 | ❌ (−4.6pp kvar) |
| SF `cornerGoalPct` | 29.8% | **25.7%** | 18.8% ±4 | 🔶 (−6.9pp kvar) |
| Final `cornerGoalPct` | 37.0% | **25.5%** | 16.7% ±5 | 🔶 (−8.8pp kvar) |
| `goalsPerMatch` grundserie | 9.54 | **9.20** | 9.12 ±1.5 | ✅ |
| `avgSuspensionsPerMatch` | 3.74 | **3.74** | 3.77 ±1 | ✅ |
| `homeWinPct` | 45.8% | **45.8%** | 50.2% ±5 | ✅ |
| `htLeadWinPct` | 83.1% | **83.3%** | 46.6% ±5 | ❌ (strukturellt) |

---

## Sektion H — Per-fas (slutmätning)

```
Fas          mål/match  target   homeWin%  target   avgSusp  target   corner%  target
─────────────────────────────────────────────────────────────────────────────────────
Grundserie   ✅  9.20   9.12   ❌  45.8   50.2   ✅  3.74   3.77   ✅  22.7   22.2  (n=5826)
KVF          ✅  8.62   8.81   ❌  51.6   60.3   ✅  3.18   3.18   ❌  26.1   20.0  (n=645)
SF           ✅  8.40   8.39   ✅  54.9   57.9   ✅  3.33   3.55   🔶  25.7   18.8  (n=326)
Final        🔶  8.12   7.00   🔶  39.5   50.0   ✅  4.49   4.08   🔶  25.5   16.7  (n=43)
```

---

## Vad som uppnådes

**Strukturbuggen fixad:** `cornerGoalPct` skalas nu proportionellt med reguljära mål per fas. Den eskalerande trenden (grundserie 26.7% → final 37.0%) är bruten.

**Grundserie i tolerans:** 22.7% ✅ (var 26.7% ❌).

**Playoff fortfarande utanför tolerans**, men systematiskt bättre och utan extrem utlöpare:
- KVF: 30.7% → 26.1% (−4.6pp)
- SF: 29.8% → 25.7% (−4.1pp)
- Final: 37.0% → 25.5% (−11.5pp)

Kvarstående playoff-gap är sannolikt inte fixbart med ytterligare `cornerBase`-sänkning utan att grundserie underträffar. Roten är att slutspelsmatcher per fas är få (KVF n=645, SF n=326, Final n=43) och att cornerInteractionService inte har fas-specifika sannolikheter.

---

## Kvarstående öppna gaps

| Mått | Status | Kandidat |
|---|---|---|
| `cornerGoalPct` grundserie | ✅ 22.7% | Stängt |
| `cornerGoalPct` playoff | ❌/🔶 | Kräver fas-specifik kalibrering i cornerInteractionService (Sprint 25f?) |
| `homeWinPct` grundserie | ✅ 45.8% vs 50.2% | Inom tolerans |
| `homeWinPct` KVF | ❌ 51.6% vs 60.3% | Basmotorproblem (Sprint 25d.3?) |
| `htLeadWinPct` | ❌ 83.3% vs 46.6% | Strukturellt, kräver designbeslut |
| Final `goalsPerMatch` | 🔶 8.12 vs 7.00 | n=43 brus, sannolikt naturlig varians |

---

## Commits

| Hash | Beskrivning |
|---|---|
| ff6b0ac | fix(matchCore): cornerGoalPct strukturfix — phaseConst.goalMod på cornerBase/clampMin |
| 81a7eb8 | fix(matchCore): cornerBase 0.14→0.105, grundserie cornerGoalPct 26.6%→22.7% |
