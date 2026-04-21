# Sprint 25b.2 — Audit

**Datum:** 2026-04-21
**Commits:** 595a9ef, 56736d8

---

## Punkter i spec

- [x] **Ändring 1** — `wFoul` 12 → 24. Commit 595a9ef.
  Verifierat: rad 452 i matchCore.ts, `let wFoul = 24`.

- [x] **Ändring 2** — `foulThreshold`-multiplikator 0.55 → 1.25. Commit 56736d8.
  Verifierat: rad 960, `foulProb * 1.25 * ...`.

- [x] **Inga andra motorkonstanter ändrades.**
  Diff bekräftar: enbart de två raderna + test-uppdatering.

- [x] **npm run build** — exit 0.

- [x] **npm test** — 1 test failade initialt (`seasonSimulation.test.ts`, red cards/match > 2).
  Rotorsak: threshold kalibrerad mot förutvalning (< 2), nu är target 3.77/match.
  Fix: `< 2.0` → `< 6.0` med förklarande kommentar. Alla 1451 tester passerar.

- [x] **npm run stress** — 0 violations, 0 crashes.

- [x] **npm run analyze-stress** — sektion A och F visar uppdaterade utvisnings-siffror.

---

## Före/efter nyckeltal

| Mått | Före 25b.1 | Efter 25b.1 | Acceptabelt 25b.2 | Utfall | |
|---|---|---|---|---|---|
| `avgSuspensionsPerMatch` | 0.47 | 0.82 | 3.3–4.3 | 3.23 | ⚠️ |
| `penaltyGoalPct` | 0.25% | 3.7% | 3.5–5.5% | 3.4% | ⚠️ |
| `goalsPerMatch` | 10.13 | 10.02 | 9.3–10.2 | 9.55 | ✅ |
| `cornerGoalPct` | ~26% | ~26% | 23–27% | 26.8% | ✅ |
| `htLeadWinPct` | ~83% | 83.2% | 70–82% | 82.8% | ⚠️ |
| Comeback −1 | — | 18.2% | 19–24% | 18.0% | ⚠️ |

---

## Test-ändring

`seasonSimulation.test.ts` rad 522: `< 2.0` → `< 6.0`.
Rotorsak: testet validerade pre-kalibrerings-beteende. Red cards/match är nu 2.96 (test)
och 3.23 (stress) mot target 3.77. Ny upper bound 6.0 ger utrymme för att kalibrera
upp mot 3.77 utan att testa failar igen.

---

## Kvarstående gapsanalys

`avgSuspensionsPerMatch` 3.23 vs target 3.77: −0.54 (86% av target).
Spec-villkoret för 25b.2.2 trigger är "< 2.5" — ej uppfyllt.
Spec:ens tighter range 3.3-4.3 är 0.07 under lower bound.

Alternativ tolkning: Med natural variation (10 seeds × 5 säsonger är robust),
3.23 är ett stabilt mätvärde. Att nå 3.3 kräver ~7% höjning av multiplikator
(1.25 → ~1.34). Decision om 25b.2.2 behövs delegeras till Jacob.

Spellägesfördelning korrekt: Ledning (20.42/kmin) > Underläge (17.33) > Jämnt (13.37).
Relativisering mot referens: Ledning 91%, Underläge 77%, Jämnt 68%.
Jämnt-utvisningar är fortfarande det svagaste länken (sprint 25c-kandidat).

---

## Commits

| Hash | Beskrivning |
|---|---|
| 595a9ef | feat(matchCore): double foul sequence weight for suspension calibration |
| 56736d8 | feat(matchCore): raise foul threshold multiplier 0.55 → 1.25 |
