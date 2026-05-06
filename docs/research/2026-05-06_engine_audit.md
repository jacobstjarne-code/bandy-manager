# PM — Motor-utredning 2026-05-06: Fatigue + Position-baseringar

**Datum:** 2026-05-06
**Trigger:** Forsknings-syntes (`2026-05-06_research_synthesis.md`) flaggade två områden för verifiering: trötthetsmodell och position-baserade attribut. Detta PM rapporterar fynden från lokal kod-utredning.

**Status:** Spår 1 klart (ingen omskrivning krävs). Spår 2 har kritiska fynd som kräver åtgärd.

---

## Spår 1 — Fatigue-implementation: ingen quality-degradation hittad

**Genomgångna filer:**
- `src/domain/services/matchCore.ts` (~2900 rader)
- `src/domain/services/matchEngine.ts`
- `src/domain/services/squadEvaluator.ts`

**Sökt efter:** `chanceQuality *= (1 - fatigue)`, `goalThreshold *= (1 - step)`, eller liknande step-baserade quality-multipliers.

**Resultat:** **Ingen sådan modell finns.** `chanceQuality` definieras separat per sequence-typ (attack, transition, corner, halfchance) och påverkas inte av step-position. Step-baserade modifierare som finns påverkar mål-RATE eller RESULTAT-tendenser, inte sprint-kvalitet:

| Modifier | Funktion | Strider mot Johansson? |
|---|---|---|
| `SECOND_HALF_BOOST = 1.19` | Höjer mål-rate H2 (matchar verklig 54.3%) | Nej — frekvens-baserad |
| `iceDeg` | Sänker `stepGoalMod` över tid pga is-nedbrytning, bottnas 0.60 | Nej — fysiskt motiverat (verkligheten har också detta) |
| `getSecondHalfMode()` | chasing/cruise → modulerar attack-styrka per lag | Nej — taktiskt, inte fatigue |
| `trailingBoost` / `leadingBrake` | Resultat-baserad attack-modulering | Nej — strategiskt, inte fatigue |
| `GOAL_TIMING_BY_PERIOD[period]` | Tids-period-baserad mål-rate | Nej — frekvens-baserad |
| `lastMinutePressData.fatigueLevel` | Beräknad från `morale`, bara för UI | Inte i spelmotor |

**Slutsats Spår 1:** Bandy Managers trötthetsmodell är **redan Johansson-trogen**. Frekvens- och resultat-baserade modifierare, inte quality-degradation. Ingen omskrivning krävs.

**Reservation:** `iceDeg`-blocket sänker `stepGoalMod` över tid p.g.a. is-nedbrytning. Detta är fysiskt korrekt (isen försämras objektivt) men kunde teoretiskt missuppfattas som "trötthet". Värdet bottnas vid 0.60 vilket innebär max 40% nedgång — det är generöst skyddande. Stress-test rekommenderas men inte kritiskt.

---

## Spår 2 — Position-baserade attribut: KRITISKA AVVIKELSER FRÅN FORSKNING

Två platser i koden där position påverkar attribut. Båda har avvikelser.

### Plats A: `worldGenerator.ts` → archetype-bonusar (världs-generering)

```ts
TwoWaySkater:    +15 skating, +15 stamina, +10 defending, +10 workRate
Finisher:        +15 acceleration, +20 shooting, +10 decisions, +10 positioning
Dribbler:        +15 acceleration, +5 skating, +20 dribbling, +15 ballControl
DefensiveWorker: +20 defending, +15 workRate, +10 stamina, +10 positioning
```

`pickArchetype()` distribuerar archetypes per position:
- Half: TwoWaySkater 40%, Playmaker 30%, DefensiveWorker 30%
- Forward: Finisher 40%, Dribbler 30%, Playmaker 20%, RawTalent 10%
- Defender: DefensiveWorker 50%, TwoWaySkater 30%, CornerSpecialist 20%

**Effekt på position-genomsnitt:**
- Halvor: 40% chans till +15 skating + 15 stamina (TwoWaySkater)
- Forwards: 70% chans till +15 acceleration (Finisher + Dribbler)
- Backar: 30% chans till +15 skating (TwoWaySkater)

**Mot forskning:**
- van den Tillaar 2023 (n=111): **Inga signifikanta position-skillnader i sprint** för herr
- Petré 2022 (n=25): inga signifikanta skillnader i 15m, 30m, 15m flying mellan positioner
- Persson 2023 (n=16): inga signifikanta position-skillnader hos juniorer

**Bandy Managers archetype-bonusar gör halvor till snabbaste skidåkare och forwards till snabbaste accelererare. Forskningen säger detta är fel.**

### Plats B: `academyActions.ts → promoteYouthPlayer.generateAttributes`

Detta är platsen som körs när en akademi-spelare promotas till A-truppen. Direkt position-baserade band:

```ts
const base = Math.round(ca * 0.6)
const high = Math.round(ca * 1.1)
const mid  = Math.round(ca * 0.8)
const low  = Math.round(ca * 0.4)

Goalkeeper: { skating: mid, acceleration: base, stamina: mid, goalkeeping: high }
Defender:   { skating: mid, acceleration: mid, stamina: mid,  defending: high, positioning: high }
Half:       { skating: mid, acceleration: mid, stamina: high, workRate: high }
Midfielder: { skating: mid, acceleration: mid, stamina: mid,  passing: high, vision: high, decisions: high }
Forward:    { skating: high, acceleration: high, stamina: mid, shooting: high, dribbling: high, positioning: high }
```

**Mot forskning — direkt jämförelse:**

| Attribut | Bandy Manager (forward vs def) | Forskning (forward vs def) |
|---|---|---|
| skating | **+38% (high vs mid)** | **0%** (van den Tillaar, Petré) |
| acceleration | **+38%** | **0%** |
| stamina | **−27% (mid vs mid, men forward har lägst)** | **+13%** (Petré: 60 vs 53 mL/kg/min, FORWARDS HÖGRE) |

**Två avvikelser:**
1. **Forward får +38% skating/acceleration över backar.** Forskningen säger 0%.
2. **Forward har LÄGRE stamina än halvor i Bandy Manager.** Forskningen säger forward ska ha HÖGST stamina.

**Det här är inte en småjustering — det är fundamentalt bakvänt mot empiri.** Bandy Manager belönar forwards för fel saker (skating/acceleration) och bestraffar dem för fel saker (för låg stamina trots att verkligheten visar att de har högst).

### Plats C: `squadEvaluator.ts` — stamina underutnyttjas, acceleration helt oanvänd

```ts
function offensePlayerScore(player) {
  return passing*0.20 + shooting*0.25 + dribbling*0.15 + vision*0.20 + decisions*0.10 + skating*0.10
  // INGEN stamina, INGEN acceleration
}

function defensePlayerScore(player) {
  return defending*0.30 + positioning*0.25 + workRate*0.20 + skating*0.15 + stamina*0.10
  // stamina endast 10%, INGEN acceleration
}
```

**Konsekvenser:**
- `acceleration`-attributet är **helt oanvänd i squadEvaluator** → ändringar där påverkar inte match-output
- `stamina` är bara 10% av defensePlayerScore, 0% av offensePlayerScore → underutnyttjat trots att Petré-fyndet är centralt

---

## Konkreta åtgärder, prioriterade

### Hög-prioritet 1: Petré-kalibrera promotion-attribut

**Fil:** `src/presentation/store/actions/academyActions.ts`, funktion `generateAttributes` inuti `promoteYouthPlayer`.

**Edit:**
```ts
function generateAttributes(position: PlayerPosition, ca: number) {
  const base = Math.round(ca * 0.6)
  const high = Math.round(ca * 1.1)
  const low  = Math.round(ca * 0.4)
  const mid  = Math.round(ca * 0.8)

  // Petré 2022: position-differentiering via VO2max (forwards 60, mid 56,
  // half ~54, def 53 mL/kg/min). 13% spread → ~10 rating-punkters spread.
  const staminaForward = Math.round(ca * 0.95)  // ~elite
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
    // Forward — INTE skating/acceleration-bonus (van den Tillaar + Petré)
    // MEN HÖGST stamina (Petré: VO2max forward 60 mL/kg/min)
    return { skating: mid, acceleration: mid, stamina: staminaForward, ballControl: mid, passing: base, shooting: high, dribbling: high, vision: mid, decisions: mid, workRate: mid, positioning: high, defending: low, cornerSkill: base, goalkeeping: low, cornerRecovery: base }
  }
}
```

**Två ändringar:** (1) Forward får mid skating/acceleration istället för high. (2) Position-baserade stamina-band som speglar Petré-VO₂max.

**Risk:** Befintliga akademi-spelare har redan skapats med gamla värden. Detta påverkar bara *nya* promotioner. Inga retroaktiva ändringar.

**Test:** Kör 1000 promotioner och verifiera att forward-attribut-snitt nu liknar def-attribut-snitt på sprint, men differentieras på stamina.

### Hög-prioritet 2: Använd acceleration i squadEvaluator

**Fil:** `src/domain/services/squadEvaluator.ts`

**Edit:**
```ts
function offensePlayerScore(player: Player): number {
  const a = player.attributes
  return (
    a.passing * 0.18 +       // var 0.20
    a.shooting * 0.22 +      // var 0.25
    a.dribbling * 0.13 +     // var 0.15
    a.vision * 0.18 +        // var 0.20
    a.decisions * 0.09 +     // var 0.10
    a.skating * 0.10 +       // oförändrad
    a.acceleration * 0.10    // NY (transition-vägar)
  )
}

function defensePlayerScore(player: Player): number {
  const a = player.attributes
  return (
    a.defending * 0.28 +     // var 0.30
    a.positioning * 0.24 +   // var 0.25
    a.workRate * 0.18 +      // var 0.20
    a.skating * 0.13 +       // var 0.15
    a.stamina * 0.15 +       // var 0.10 — höjd vikt (Petré-fyndet)
    a.acceleration * 0.02    // NY (recovery efter motanfall)
  )
}
```

**Effekt:** acceleration-attributet får praktisk betydelse. Stamina får större vikt i defense (i linje med Petré: backar har låg VO₂max och behöver det de har). Andra vikter justerade så summa förblir 1.0.

**Test:** Kör 200 matcher, verifiera att GOAL_RATE_MOD fortfarande ger ~9.12 mål/match. Eventuell rekalibrering kan behövas (är troligt — detta är en strukturell ändring).

### Medel-prioritet 3: Granska worldGenerator archetype-bonusar

**Fil:** `src/domain/services/worldGenerator.ts`, funktion `generateAttributes`

**Problem:** TwoWaySkater +15 skating, Finisher +15 acceleration, Dribbler +15 acceleration ger position-genomsnitt som strider mot van den Tillaar.

**Tre val:**
- **(a) Behåll archetype-bonusar, ändra archetype-distribution.** Minska TwoWaySkater-frekvens hos halvor (40% → 20%), minska Finisher+Dribbler-andel hos forwards (70% → 40%).
- **(b) Ta bort skating/acceleration-bonusar från archetypes.** Behåll på andra attribut (Finisher behåller +20 shooting; Dribbler behåller +20 dribbling).
- **(c) Acceptera archetype-system som "spelar-typer", inte position-realism.** Argument: archetypes representerar individuella spelar-stilar (en "Finisher" är en specifik typ — inte "alla forwards"), och variation är önskvärd.

**Min rek: (b).** Forskningen är tydlig att skating/acceleration inte ska differentieras. Andra archetype-bonusar (shooting för Finisher, dribbling för Dribbler) är legitima personlighets-skillnader.

**Konsekvens:** Färre spelare med extrema sprint-värden. Spelar-variation behålls via andra attribut.

### Låg-prioritet 4: `iceDeg`-stress-test

Kör 200 matcher och logga `stepGoalMod`-snitt per minutintervall (0-15, 15-30, ..., 75-90). Verifiera att nedgången inte överskrider Johansson-empiriska −4.5% total / H1→H2.

---

## Sammanfattning

| Spår | Status | Åtgärd |
|---|---|---|
| Fatigue-implementation | ✅ OK — Johansson-trogen redan | Ingen åtgärd |
| Promotion-attribut | ❌ Bakvänt mot Petré | **Hög-prio edit** |
| squadEvaluator-vikter | ⚠ Stamina underutnyttjad, acceleration oanvänd | **Hög-prio edit** |
| worldGenerator archetype-bonusar | ⚠ Strider mot van den Tillaar | Medel-prio designval |
| iceDeg | ⚠ Möjlig drift | Låg-prio stress-test |

**Två konkreta hög-prio-edits identifierade:**
1. `academyActions.ts → generateAttributes` — Petré-kalibrera position-band
2. `squadEvaluator.ts` — använd acceleration, höj stamina-vikt

Båda är välavgränsade, koden är tydlig, edit-spec'arna är skrivbara direkt. Klara för Code-engagement vid din go-ahead.

---

*Senast uppdaterad: 2026-05-06.*
