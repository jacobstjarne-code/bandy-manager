# SPRINT 25d — Fas-konstanter vs slutspelsdata

**Datum:** 2026-04-21 (eftermiddag, efter 25b.2-leverans)
**Trigger:** Efter 25b-serien har motorn rimlig kalibrering för grundserien (goalsPerMatch 9.55, suspensions 3.23, penalties 3.4%). Men stress-testets siffror blandar alla faser. Vi behöver verifiera att `PHASE_CONSTANTS` i matchUtils.ts producerar rätt beteende per fas (grundserie/KVF/SF/final) mot bandygrytan-data.

**Scope:** Primärt **mätning och analys**. Eventuell kodändring till `PHASE_CONSTANTS` om avvikelser hittas. En fil: `src/domain/services/matchUtils.ts`.

---

## BAKGRUNDSSIFFROR — MÅL (ANALYS_SLUTSPEL.md)

| Mått | Grundserie | KVF | SF | Final |
|---|---|---|---|---|
| goalsPerMatch | 9.12 | 8.81 | 8.39 | 7.00 |
| hemmaseger% | 50.2% | 60.3% | 57.9% | 50.0% |
| avgSuspensions | 3.77 | 3.18 | 3.55 | 4.08 |
| cornerGoalPct | 22.2% | 20.0% | 18.8% | 16.7% |
| Comeback −1 HT | 24.5% | 13.6% | 33.3% | 0.0% |
| Comeback −2 HT | 11.0% | 0.0% | 25.0% | 25.0% |

**Mönster att verifiera:**
- Målsnittet sjunker monotont 9.12 → 7.00
- Hemmafördel starkare i KVF/SF, neutral i final
- Utvisningar: dip i KVF (3.18), upp igen i SF, mest i final (4.08)
- Hörnmål: sjunker monotont 22.2% → 16.7%
- KVF är brutalt slutgiltigt (0% comeback från −2)
- SF är överraskande öppet (25% från −2)
- Final: n=12, 0% från −1, 25% från −2 — statistiskt osäkert

---

## NUVARANDE PHASE_CONSTANTS (matchUtils.ts)

```ts
regular:      { goalMod: 1.000, homeAdvDelta: 0.00, suspMod: 1.00, cornerTrailingMod: 1.11, cornerLeadingMod: 0.90 }
quarterfinal: { goalMod: 0.966, homeAdvDelta: 0.03, suspMod: 0.84, cornerTrailingMod: 1.20, cornerLeadingMod: 0.81 }
semifinal:    { goalMod: 0.920, homeAdvDelta: 0.05, suspMod: 0.94, cornerTrailingMod: 1.05, cornerLeadingMod: 0.86 }
final:        { goalMod: 0.768, homeAdvDelta: 0.00, suspMod: 1.08, cornerTrailingMod: 0.58, cornerLeadingMod: 1.24 }
```

---

## VERIFIERING — STEG 1: PER-FAS MÄTNING

Kör stress-test och analyze-stress med fas-uppdelning. Om `analyze-stress.ts` inte redan har per-fas-sektion behöver den utökas.

**Expected output (tänkt format):**

```
GRUNDSERIE (n=X matcher)
  goalsPerMatch:    X.XX  vs target 9.12  (diff)
  avgSusp:          X.XX  vs target 3.77
  cornerGoalPct:    XX%   vs target 22.2%
  homeWin%:         XX%   vs target 50.2%

KVARTSFINAL (n=Y matcher)
  goalsPerMatch:    X.XX  vs target 8.81
  avgSusp:          X.XX  vs target 3.18
  cornerGoalPct:    XX%   vs target 20.0%
  homeWin%:         XX%   vs target 60.3%

SEMIFINAL (n=Z matcher)
  goalsPerMatch:    X.XX  vs target 8.39
  avgSusp:          X.XX  vs target 3.55
  cornerGoalPct:    XX%   vs target 18.8%
  homeWin%:         XX%   vs target 57.9%

FINAL (n=W matcher)
  goalsPerMatch:    X.XX  vs target 7.00
  avgSusp:          X.XX  vs target 4.08
  cornerGoalPct:    XX%   vs target 16.7%
  homeWin%:         XX%   vs target 50.0%
```

Kontrollera om `analyze-stress.ts` redan kan göra detta. Om inte — utöka den. `phase`-fältet finns redan i stats-modellen (`'regular' | 'playoff_qf' | 'playoff_sf' | 'playoff_final'`).

**n per fas i stress-test:**
- Grundserie: 10 seeds × 5 säsonger × 132 matcher = 6600
- KVF: 10×5×10 = 500 (ligger nära target-tolerans)
- SF: 10×5×6 = 300
- Final: 10×5×2 = 100

Final n=100 är minsta urvalet men tillräckligt för rimlig bedömning.

---

## VERIFIERING — STEG 2: TOLKA UTFALL

**Acceptabelt intervall per fas** (baserat på slumpvariation + urvalsstorlek):

| Mått | Grundserie tol. | KVF tol. | SF tol. | Final tol. |
|---|---|---|---|---|
| goalsPerMatch | ±0.3 | ±0.5 | ±0.6 | ±1.0 |
| avgSusp | ±0.3 | ±0.4 | ±0.5 | ±0.7 |
| cornerGoalPct | ±2pp | ±3pp | ±4pp | ±5pp |
| homeWin% | ±2pp | ±4pp | ±5pp | ±8pp |

**Om alla fyra faser ligger inom tolerans:** 25d är klart, ingen kodändring. Gå vidare till 25e.

**Om någon/flera faser avviker markant:** Se steg 3 (justering).

---

## VERIFIERING — STEG 3: JUSTERING (BARA OM BEHÖVS)

### Scenario A: KVF-goalMod är för högt eller lågt

Nuvarande: `goalMod: 0.966`. Om KVF-mätningen ger goalsPerMatch väsentligt över 8.81, sänk till 0.94. Om under 8.5, höj till 0.99.

### Scenario B: Final-goalMod är fel

Nuvarande: `goalMod: 0.768`. Det är aggressivt — 23% reduktion. Om mätningen ger 7.0 eller nära: bra. Om den ger 8.5+ är multiplikatorn för svag. Om 6.0 är den för stark.

### Scenario C: Hemmafördel stämmer inte

Om KVF-hemmaseger% är ~50% i motorn (medan bandygrytan har 60.3%) → `homeAdvDelta: 0.03` är för lite. Prova 0.06.

Om final-hemmaseger% är 60%+ i motorn (men bandygrytan har 50%) → kolla att `isNeutralVenue` sätts korrekt på final-matcher och noll:ar ut `homeAdvantage + homeAdvDelta`. Detta är tråkigt att utreda men viktigt — finalen ska spelas utan hemmafördel oavsett vilket lag.

### Scenario D: Utvisningar per fas felfördelade

Bandygrytan: 3.77 → 3.18 → 3.55 → 4.08 (dip i KVF, upp i final).
Nuvarande suspMod: 1.00 → 0.84 → 0.94 → 1.08 — matchar mönstret men kan behöva finjustering baserat på hur 25b.2 påverkade totalen.

Viktigt: Grundserien i motorn landade på 3.23, inte 3.77. Alla fas-modifierare multipliceras mot det, så KVF-motorn skulle ligga runt 3.23 × 0.84 = 2.71 (bandygrytan 3.18 → motor 15% lågt). Om det är ett mönster → suspMod-värdena kan vara rätt men basfrekvensen är något låg. Kräver inte nödvändigtvis ändring — 25b.2.2 kunde finjustera basen, men vi beslutade skippa.

### Scenario E: Hörnmål sjunker inte monotont

Om motorn ger 26/24/22/20% (monotont sjunkande) — rätt riktning, kanske för hög bas. Hanteras i framtida corner-sprint.

Om motorn ger 26/22/24/18% (icke-monotont) — `cornerLeadingMod`/`cornerTrailingMod` är möjligtvis fel per fas.

---

## VAD SOM INTE RÖRS

- `SUSP_TIMING_BY_PERIOD` (tidsfördelning) — redan kalibrerat mot grundseriedata
- `GOAL_TIMING_BY_PERIOD` — samma
- `homePenaltyFactor`, `awayPenaltyFactor` (0.75) — misstänkt för milt men hör till Sprint 25e
- `trailingBoost` 0.11 — samma, Sprint 25e
- Alla konstanter utanför `PHASE_CONSTANTS`

---

## LEVERANSORDNING

1. **Verifiera att `analyze-stress.ts` har per-fas-sektion.** Om inte, utöka. (En sektion som grupperar matches på `phase`-fältet och rapporterar samma stats som totalnivån.)

2. **Kör** `npm run stress && npm run analyze-stress`. Spara output som `docs/sprints/SPRINT_25D_PHASE_MEASUREMENT.md`.

3. **Jämför mot bandygrytan-targets** i tabell. Markera per cell: ✅ inom tolerans, 🔶 marginellt utanför, ❌ klar avvikelse.

4. **Om alla celler ✅ eller 🔶:** Dokumentera i audit, rapportera "ingen kodändring behövs". Sprint 25d klar.

5. **Om en eller flera celler ❌:** Rapportera till Opus innan kodändring. Opus bedömer om 25d ska justera `PHASE_CONSTANTS` eller om problemet ligger i basmotorn (och alltså är Sprint 25e-jobb).

6. **Audit** `docs/sprints/SPRINT_25D_AUDIT.md` med fullständig tabell, alla fyra faser × fyra mått, och slutsats.

---

## VIKTIGT

- Primärt mätsprint, inte motor-sprint. Om alla faser ligger inom tolerans är sprinten klar utan kodändring.
- Om `analyze-stress.ts` behöver utökas, gör det som första commit. Commit: `feat(analyze-stress): add per-phase breakdown (regular/KVF/SF/final)`.
- Om `PHASE_CONSTANTS` behöver justeras, en konstant per commit så vi kan spåra effekt.
- **Final n=100** är gränslåg för robust bedömning. Om mätning visar stora avvikelser i enbart final, överväg att flagga för större stress-test (30×5 → final n=300) innan kodändring.
- Rör inget utanför `PHASE_CONSTANTS` och `analyze-stress.ts`.
