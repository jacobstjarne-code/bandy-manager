# Code-instruktioner — Forsknings-baserade attribut-edits

**Datum:** 2026-05-06
**Föregångare:** `2026-05-06_engine_audit.md`
**Status:** Redo för Claude Code (Sonnet) terminal. Två separata edits i två separata commits.

**Edit 1 är säker.** Påverkar bara nya promotion-händelser, ingen retroaktiv påverkan på existerande spelare, ingen påverkan på match-engine-kalibrering.

**Edit 2 är strukturell.** Ändrar squadEvaluator-vikter som matar in i matchCore. Kräver stress-test mot bandygrytan-targets och eventuellt rekalibrering av GOAL_RATE_MOD. **Gör Edit 1 först, verifiera, push. Sedan Edit 2 i separat session.**

---

## EDIT 1 — Petré-kalibrera promotion-attribut

**Fil:** `src/presentation/store/actions/academyActions.ts`
**Funktion:** `generateAttributes` (lokal funktion inuti `promoteYouthPlayer`)
**Forskning:** Petré 2022 — VO₂max forwards 60, midfielders 57, halvor ~54, defenders 53 mL/kg/min. van den Tillaar 2023 + Petré — inga signifikanta position-skillnader i sprint för herr.

### Code-instruktion

```
Hej Code,

Jag har gjort en forskningsbaserad granskning av Bandy Managers position-attribut-system. Detaljer i:
docs/research/2026-05-06_engine_audit.md

Edit som ska göras: src/presentation/store/actions/academyActions.ts, funktion `generateAttributes` inuti `promoteYouthPlayer`.

Två problem med nuvarande kod:
1. Forwards får +38% skating/acceleration över backar (high vs mid). Forskningen säger 0%.
2. Forwards har samma stamina-band (mid) som backar och målvakter. Petré 2022 visar forwards har 13% högre VO₂max än backar.

Lös genom att:
- Sätta forward-skating och forward-acceleration till mid (samma som övriga utespelare)
- Differentiera stamina per position via nya konstanter

EDIT-INSTRUKTION:

I funktionen `generateAttributes` (omkring rad 290 i academyActions.ts), ersätt hela funktionsblocket med:

      function generateAttributes(position: PlayerPosition, ca: number) {
        const base = Math.round(ca * 0.6)
        const high = Math.round(ca * 1.1)
        const low = Math.round(ca * 0.4)
        const mid = Math.round(ca * 0.8)

        // Petré 2022 — position-specifik stamina via VO₂max
        // Forwards 60 mL/kg/min, midfielders 57, halvor ~54, defenders 53
        const staminaForward = Math.round(ca * 0.95)
        const staminaMid     = Math.round(ca * 0.85)
        const staminaHalf    = Math.round(ca * 0.78)
        const staminaDef     = Math.round(ca * 0.75)

        if (position === PlayerPosition.Goalkeeper) {
          return { skating: mid, acceleration: base, stamina: mid, ballControl: low, passing: low, shooting: low, dribbling: low, vision: mid, decisions: mid, workRate: mid, positioning: mid, defending: mid, cornerSkill: low, goalkeeping: high, cornerRecovery: mid }
        } else if (position === PlayerPosition.Defender) {
          return { skating: mid, acceleration: mid, stamina: staminaDef, ballControl: base, passing: base, shooting: low, dribbling: low, vision: base, decisions: mid, workRate: high, positioning: high, defending: high, cornerSkill: base, goalkeeping: low, cornerRecovery: high }
        } else if (position === PlayerPosition.Half) {
          return { skating: mid, acceleration: mid, stamina: staminaHalf, ballControl: mid, passing: mid, shooting: base, dribbling: base, vision: mid, decisions: mid, workRate: high, positioning: mid, defending: mid, cornerSkill: base, goalkeeping: low, cornerRecovery: mid }
        } else if (position === PlayerPosition.Midfielder) {
          return { skating: mid, acceleration: mid, stamina: staminaMid, ballControl: mid, passing: high, shooting: base, dribbling: mid, vision: high, decisions: high, workRate: mid, positioning: mid, defending: base, cornerSkill: base, goalkeeping: low, cornerRecovery: mid }
        } else {
          // Forward — INGEN skating/acceleration-bonus (van den Tillaar + Petré: ingen signifikant position-skillnad)
          // MEN högst stamina (Petré: forwards VO₂max högst)
          return { skating: mid, acceleration: mid, stamina: staminaForward, ballControl: mid, passing: base, shooting: high, dribbling: high, vision: mid, decisions: mid, workRate: mid, positioning: high, defending: low, cornerSkill: base, goalkeeping: low, cornerRecovery: base }
        }
      }

VERIFIERINGS-STEG:

1. Kör: git diff src/presentation/store/actions/academyActions.ts
   Förvänta: bara ändringar i generateAttributes-funktionen, ungefär 4-5 rader nya konstanter och 2 rader ändringar i Forward-grenen (skating/acceleration high → mid).

2. Kör: npm run build
   Förvänta: inga TypeScript-fel.

3. Kör: npm test
   Förvänta: alla tester passerar. Eventuella fail i akademi-relaterade tester ska analyseras.

4. Om allt grönt, commit + push:

   git add src/presentation/store/actions/academyActions.ts
   git commit -m "rot: petré-kalibrera promotion-attribut

   - Forward-skating/acceleration: high → mid
     (van den Tillaar 2023, Petré 2022: inga sig. position-skillnader i sprint herr)
   - Position-baserad stamina via Petré 2022 VO₂max-data
     forward 0.95 / mid 0.85 / half 0.78 / def 0.75 av CA
   - Påverkar bara nya promotion-händelser, ingen retroaktiv ändring

   Källor: docs/research/2026-05-06_petre_pm.md
            docs/research/2026-05-06_engine_audit.md"

   git push origin main

5. Verifiera i Vercel-deploy.

INGA andra ändringar i denna commit. Övriga forskningsrelaterade fynd (squadEvaluator, worldGenerator archetype-bonusar) hanteras separat.

Kör steg 1-3 först, rapportera, vänta på go-ahead innan commit.
```

---

## EDIT 2 — squadEvaluator vikter (KRÄVER STRESS-TEST)

**Fil:** `src/domain/services/squadEvaluator.ts`
**Funktioner:** `offensePlayerScore`, `defensePlayerScore`
**Risk:** Strukturell — påverkar match-engine-output. Kräver stress-test mot bandygrytan-targets och möjlig rekalibrering av GOAL_RATE_MOD.

**Gör i separat session efter Edit 1 är verifierad och pushad.**

### Code-instruktion

```
Hej Code,

Forsknings-baserad ändring av squadEvaluator-vikter. Bakgrund:
docs/research/2026-05-06_engine_audit.md

Två problem:
1. acceleration-attributet är HELT OANVÄND i squadEvaluator. Generering kan ändras hur som helst — match-output påverkas inte.
2. stamina får bara 10% vikt i defensePlayerScore, 0% i offensePlayerScore. Petré 2022 säger stamina/VO₂max är den enda fysiska kapaciteten som differentierar positioner — då bör attributet ha mer vikt.

EDIT-INSTRUKTION:

I src/domain/services/squadEvaluator.ts, ersätt:

  function offensePlayerScore(player: Player): number {
    const a = player.attributes
    return (
      a.passing * 0.20 +
      a.shooting * 0.25 +
      a.dribbling * 0.15 +
      a.vision * 0.20 +
      a.decisions * 0.10 +
      a.skating * 0.10
    )
  }

med:

  function offensePlayerScore(player: Player): number {
    const a = player.attributes
    return (
      a.passing * 0.18 +
      a.shooting * 0.22 +
      a.dribbling * 0.13 +
      a.vision * 0.18 +
      a.decisions * 0.09 +
      a.skating * 0.10 +
      a.acceleration * 0.10
    )
  }

Och ersätt:

  function defensePlayerScore(player: Player): number {
    const a = player.attributes
    return (
      a.defending * 0.30 +
      a.positioning * 0.25 +
      a.workRate * 0.20 +
      a.skating * 0.15 +
      a.stamina * 0.10
    )
  }

med:

  function defensePlayerScore(player: Player): number {
    const a = player.attributes
    return (
      a.defending * 0.28 +
      a.positioning * 0.24 +
      a.workRate * 0.18 +
      a.skating * 0.13 +
      a.stamina * 0.15 +
      a.acceleration * 0.02
    )
  }

KRITISKT — INTE PUSHA UTAN STRESS-TEST:

Detta är en strukturell ändring som påverkar matchmotor-output. Innan commit:

1. git diff src/domain/services/squadEvaluator.ts
   Verifiera exakt två funktioner ändrade, inga andra.

2. npm run build && npm test
   Inga TS-fel, alla tester passerar.

3. KÖR STRESS-TEST mot calibrate_v2:
   Använd det script som genererar 200+ matcher och loggar:
   - Mål per match (target ~9.12 — bandygrytan)
   - Hörnmål-andel (target ~22.2%)
   - Hemmaseger-procent (target ~50%)
   - Oavgjort-procent (target ~12%)
   - Mål i andra halvlek (target ~54.3%)

   Rapportera ALLA fem mätvärden före commit.

4. Om mål per match driftat utanför ±0.30 från 9.12 (dvs <8.82 eller >9.42):
   Justera GOAL_RATE_MOD i matchCore.ts inversproportionellt:
   nytt_GOAL_RATE_MOD = nuvarande_GOAL_RATE_MOD * 9.12 / uppmätt_mål_per_match

   Kör om stress-testet med justerat värde, rapportera.

5. Endast om alla fem targets ligger inom tolerans:

   git add src/domain/services/squadEvaluator.ts
   # om GOAL_RATE_MOD justerats:
   git add src/domain/services/matchCore.ts

   git commit -m "rot: forskningskalibrera squadEvaluator-vikter

   - acceleration nu använd: 10% offense, 2% defense
     (var helt oanvänd, generering kunde ändras utan match-effekt)
   - stamina-vikt höjd 10% → 15% i defense
     (Petré 2022: enda fysiska kapacitet som differentierar position)
   - GOAL_RATE_MOD rejusterad till X.XXX  ← om relevant
     stress-test 200 matcher: A.AA mål/match (target 9.12)

   Källor: docs/research/2026-05-06_petre_pm.md
            docs/research/2026-05-06_engine_audit.md"

   git push origin main

6. Verifiera Vercel-deploy.

OM stress-test driftar mer än ±0.30 även efter GOAL_RATE_MOD-justering:
STOPPA. Rapportera till Jacob och vänta på beslut.

Kör steg 1-3 först, rapportera siffrorna, vänta på go-ahead.
```

---

## Sammanfattning

| Edit | Risk | Stress-test | Tid |
|---|---|---|---|
| 1 — promotion-attribut | Låg | Ingen | ~10 min Code-tid |
| 2 — squadEvaluator-vikter | **Strukturell** | Krävs (200 matcher) | ~30-60 min Code-tid |

**Min rek:** Edit 1 i nuvarande/nästa session, verifiera deploy. Edit 2 i ny session med tom kontext eftersom stress-test-cykeln kan kräva flera iterationer.

---

*Senast uppdaterad: 2026-05-06.*
