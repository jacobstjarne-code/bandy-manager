# Sprint 25-K — cornerTrailingMod monoton avtagande genom slutspelet

**Status:** READY TO IMPLEMENT
**Estimat:** 1-2h Code (kort impl, längre verifiering)
**Förutsätter:** Sprint 25-J levererad och verifierad
**Risk:** Medel — påverkar match-dramaturgi i QF/SF, kräver mätning per fas efter fix

---

## ROTORSAK

`PHASE_CONSTANTS` i `matchUtils.ts` har följande nuvarande serie:

| Fas | cornerTrailingMod | cornerLeadingMod |
|-----|-------------------|------------------|
| regular | 1.11 | 0.90 |
| quarterfinal | **1.20** ← högsta | 0.81 |
| semifinal | 1.05 | 0.86 |
| final | 0.58 | 1.24 |

QF har den **högsta** cornerTrailingMod-multiplikatorn av alla faser. Designintentionen
var troligen "baksträvande lag i slutspel kämpar hårdare på hörnor" — men rådata
visar motsatt: hörnmål-andelen sjunker konsekvent från grundserie till final.

**Rådata-trend (verifierad i Sprint 25-I från `bandygrytan_detailed.json`):**

| Fas | cornerGoalPct |
|-----|---------------|
| Grundserie | 22.2% |
| Kvartsfinal | 20.0% |
| Semifinal | 18.7% |
| Final | 16.7% |

Motorn bryter trenden i QF (26.7% mot target 20.0%, +6.7pp) och delvis SF
(23.6% mot target 18.7%, +4.9pp). Final är ungefär rätt (13.4% mot 16.7%).

---

## ÄNDRING

### Fil: `src/domain/services/matchUtils.ts` — PHASE_CONSTANTS

**Princip:** cornerTrailingMod ska avta monotont från grundserie till final.

**Före:**
```ts
export const PHASE_CONSTANTS = {
  regular:     { goalMod: 1.000, homeAdvDelta: 0.00, suspMod: 1.00, cornerTrailingMod: 1.11, cornerLeadingMod: 0.90 },
  quarterfinal:{ goalMod: 0.966, homeAdvDelta: 0.06, suspMod: 0.84, cornerTrailingMod: 1.20, cornerLeadingMod: 0.81 },
  semifinal:   { goalMod: 0.920, homeAdvDelta: 0.05, suspMod: 0.94, cornerTrailingMod: 1.05, cornerLeadingMod: 0.86 },
  final:       { goalMod: 0.768, homeAdvDelta: 0.00, suspMod: 1.08, cornerTrailingMod: 0.58, cornerLeadingMod: 1.24 },
}
```

**Efter:**
```ts
export const PHASE_CONSTANTS = {
  regular:     { goalMod: 1.000, homeAdvDelta: 0.00, suspMod: 1.00, cornerTrailingMod: 1.11, cornerLeadingMod: 0.90 },
  quarterfinal:{ goalMod: 0.966, homeAdvDelta: 0.06, suspMod: 0.84, cornerTrailingMod: 1.05, cornerLeadingMod: 0.81 },
  semifinal:   { goalMod: 0.920, homeAdvDelta: 0.05, suspMod: 0.94, cornerTrailingMod: 0.93, cornerLeadingMod: 0.86 },
  final:       { goalMod: 0.768, homeAdvDelta: 0.00, suspMod: 1.08, cornerTrailingMod: 0.58, cornerLeadingMod: 1.24 },
}
```

**Det är hela ändringen.** Endast två värden:
- QF cornerTrailingMod: `1.20` → `1.05`
- SF cornerTrailingMod: `1.05` → `0.93`

Övriga värden bibehålls. cornerLeadingMod, goalMod, homeAdvDelta, suspMod är inte
berörda av denna fix.

---

## FÖRVÄNTAD EFFEKT

Från analysens mätningar:

| Fas | Före | Efter (förväntat) | Target |
|-----|------|-------------------|--------|
| Grundserie | 22.1% | 22.1% (oförändrat) ✅ | 22.2% |
| Kvartsfinal | 26.7% | ~22% | 20.0% |
| Semifinal | 23.6% | ~19-20% | 18.7% |
| Final | 13.4% | 13.4% (oförändrat) | 16.7% |

QF-effekten är ungefärlig. Faktiskt utfall beror på exakt hur ofta cornerTrailingMod
aktiveras i typ-matcher. Mät efter fix.

---

## VERIFIERING

### Steg 1: Build + tester
```bash
npm run build && npm test
```
Förväntat: 1895/1895 grönt.

### Steg 2: Per-fas-mätning (KRITISK)

Kör 200 matcher per fas isolerat (samma metodik som Sprint 25-I scenario B):

```bash
# Exakt skriptanrop beror på vilket verktyg Code använder för
# isolerad fas-mätning. Sprint 25-I scenario B körde 200 matcher
# per fas med CA 70 vs 70.
```

För varje fas, mät:
- cornerGoalPct (ska vara nära target)
- goals/match (ska vara oförändrat utöver brus)
- avgCornersPerMatch (ska vara oförändrat — vi ändrar konvertering, inte frekvens)

**Acceptanskriterier:**
- QF cornerGoalPct: `[17%, 23%]` (target 20% ± 3pp)
- SF cornerGoalPct: `[16%, 22%]` (target 18.7% ± 3pp)
- Grundserie cornerGoalPct: oförändrat (~22%)
- Final cornerGoalPct: oförändrat (~13-14%)
- goals/match per fas: oförändrade (utöver brus)

### Steg 3: Stresstest
```bash
npm run stress -- --seeds=10 --seasons=3
npm run analyze-stress
```
Verifiera att:
- Aggregerad cornerGoalPct är inom tolerans
- awayWinPct och homeWinPct INTE har rört sig signifikant från 25-J
- Inga andra targets brutits

---

## EFTER LEVERANS

`docs/sprints/SPRINT_25K_AUDIT.md` med:
- Per-fas-mätningar före/efter (kritiskt — visa alla fyra faser)
- Stresstest-output med fokus på cornerGoalPct
- Bekräftelse att inga andra targets brutits
- Bekräftelse 1895/1895

---

## COMMIT

```
fix: cornerTrailingMod monoton avtagande genom slutspel (Sprint 25-K)

Rotorsak: PHASE_CONSTANTS QF cornerTrailingMod=1.20 var högre än grundseriens
1.11. Designintention "baksträvande lag kämpar hårdare i slutspel" motsade
rådata-trenden där cornerGoalPct sjunker progressivt från grundserie till
final (22.2% → 20.0% → 18.7% → 16.7%).

Ändring: monoton serie reg 1.11 → QF 1.05 → SF 0.93 → Final 0.58.

Effekt: QF cornerGoalPct 26.7% → ~22%. SF 23.6% → ~19%. Grundserie och
final oförändrade.

Tester: 1895/1895.
```

---

## VAD SOM INTE INGÅR

- **cornerLeadingMod-justering.** Värdena (0.90, 0.81, 0.86, 1.24) är inte
  berörda av denna fix. Final har redan rätt riktning (1.24 hög = ledande
  lag konverterar bättre i jämna finaler).
- **Fortsatt finkalibrering av QF/SF.** Värdena 1.05 och 0.93 är initiala
  förslag. Om mätning visar QF behöver 1.00 eller SF behöver 0.95 — det
  är finkalibrering inom samma sprint, inte ny sprint.
- **Final cornerGoalPct-gap.** 13.4% mot target 16.7% är inom brus och
  inte prioriterat.
- **Fas-konstanters andra värden** (goalMod, homeAdvDelta, suspMod) — orörda.

---

## OBSERVATION FÖR FRAMTIDEN

Trenden i rådata (22.2% → 20.0% → 18.7% → 16.7%) är värd att dokumentera
som **Bandy-Brain Finding**. Det är en empirisk observation om elitseriebandy
som ingen annan har publicerat. Ska skrivas EFTER 25-K är verifierad — då
har vi både rådata och motormätning som visar samma trend.

(Skrivs separat av Opus när 25-K-audit kommer in.)
