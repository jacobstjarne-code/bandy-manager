# Sprint 25d — Audit

**Datum:** 2026-04-21
**Commit:** 89dff94 (Section H i analyze-stress.ts)

---

## Punkter i spec

- [x] **Kontrollera om analyze-stress.ts har per-fas-sektion** — saknades. Tillagt som Sektion H (90 rader, sist i filen).
  Verifierat: `scripts/analyze-stress.ts` läser `phaseStats` ur stress-loggen och skriver ut tabell med ✅/🔶/❌.

- [x] **npm run stress** — kördes. 10×5 = 7518 matcher. Commit 89dff94.

- [x] **npm run analyze-stress** — kördes. Sektion H visas i output.

- [x] **Jämförelse mot targets** — gjord. Se SPRINT_25D_PHASE_MEASUREMENT.md.

- [x] **STOPP vid ❌** — villkoret uppfyllt. Inga PHASE_CONSTANTS ändrades.

---

## ❌-celler — orsaksanalys

### cornerGoalPct ❌ i ALLA faser (eskalerande mot slutspel)

| Fas | Utfall | Target | Gap |
|---|---|---|---|
| Grundserie | 26.7% | 22.2% | +4.5pp |
| KVF | 30.7% | 20.0% | +10.7pp |
| SF | 29.8% | 18.8% | +11.0pp |
| Final | 37.0% | 16.7% | +20.3pp |

Rotorsak: `cornerInteractionService` returnerar en fast konverteringssannolikhet som INTE
påverkas av `goalMod`. När `goalMod` sänker reguljära mål i slutspel bibehålls hörnmålsfrekvensen
absolut → andel hörnmål av totala mål stiger. Eskalering bekräftar: ju lägre `goalMod`, desto
större relativ övertäckning. Strukturell motorbugg — kräver fix i cornerInteractionService
eller hörnsekvensens sannolikhet (Sprint 25e-kandidat, INTE PHASE_CONSTANTS).

### homeWin% ❌ Grundserie och KVF

| Fas | Utfall | Target | Gap |
|---|---|---|---|
| Grundserie | 45.9% | 50.2% | −4.3pp |
| KVF | 50.8% | 60.3% | −9.5pp |

Grundserie-gapet (−4.3pp) verkar vara ett basmotorproblem — `homeAdvDelta` gäller hela
säsongen men hemmafördelens grad kanske är undervärderad i grundmotorn.
KVF-gapet (−9.5pp) är troligen PHASE_CONSTANTS: `homeAdvDelta: 0.03` för kvartsfinal
är alldeles för litet. Referensdata visar 60.3% hemmaseger i KVF (nästan som Final: 50%).
Sprint 25d.2-kandidat: `homeAdvDelta` KVF 0.03 → 0.06.

---

## Inte levererat (med orsak)

- **PHASE_CONSTANTS-ändringar** — ej gjorda per spec. Villkoret "STOPP vid ❌" stoppade
  alla konstant-ändringar. Beslutet om åtgärd delegeras till Jacob.

---

## Kvarstående prioritetsordning (för Jacob)

1. **cornerGoalPct** — strukturell bugg i motorn. Kräver Sprint 25e (nytt sprintspår).
2. **homeWin% KVF** — sannolikt PHASE_CONSTANTS-fix. Snabb: `homeAdvDelta` 0.03 → 0.06.
   Kan göras som Sprint 25d.2 om Jacob vill.
3. **avgSusp** — Sprint 25b.2.2 (multiplikator 1.25 → ~1.46) fortsatt aktuellt.
4. **homeWin% Grundserie** — basmotorproblem. Svårare att isolera. Sprint 25e-kandidat.

---

## Commit

| Hash | Beskrivning |
|---|---|
| 89dff94 | feat(analyze-stress): add Section H per-phase breakdown for Sprint 25d |
