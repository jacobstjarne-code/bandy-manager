# FIXSPEC: Matchmotor-kalibrering mot Bandygrytan-data

Källa: `docs/data/bandygrytan_stats.json` (420 matcher, Elitserien 2024-26)

`npm run build && npm test` efter varje ändring. Kör 100 simuleringar och jämför.

---

## Målvärden (verklighet vs nuvarande motor)

| Mätetal | Verklighet | Nuvarande motor | Åtgärd |
|---------|-----------|-----------------|--------|
| Mål/match | **10.0** | ~6-8 | Höj goalThreshold ~30% |
| Hörnmål | **23.2%** av alla mål | ~35-40% (för högt) | Sänk cornerGoalThreshold |
| Straffmål | **5.1%** av alla mål | 0% (saknas) | Ny feature (FIXSPEC_NYA_FEATURES) |
| Hemmaseger | **50.7%** | ~55-60% (för högt?) | Sänk homeAdvantage 0.05 → 0.035 |
| Oavgjort | **9.0%** | ~5% (för lågt) | Följdeffekt av goal-kalibrering |
| 2:a halvlek | **54.3%** av mål | ~50% (flat) | Lägg till tidsvikter |
| Registrerade fouls | **4.1/match** | ~3 | Öka foulProb marginellt |

---

## STEG 1: Öka mål per match (6-8 → 10)

**Fil:** `matchEngine.ts`

Nuvarande: `goalThreshold = chanceQuality * 0.58 * (1 - defGK * 0.35) * weatherGoalMod`

Motorn har 60 steg. 10 mål / 60 steg = 0.167 mål/steg (båda lag). Per lag: 0.083.

**Problem:** `chanceQuality` maxar runt 0.5-0.7, defGK ~0.5-0.7. Det ger goalThreshold ~0.10-0.20. Med ~40% av steg som genererar shots → ~2-5 mål totalt. För lågt.

**Fix — öka base goal multiplier:**
```typescript
// matchEngine.ts, attack sequence:
const goalThreshold = chanceQuality * 0.72 * (1 - defenderGkStrength * 0.30) * weatherGoalMod
//                                    ^^^^                         ^^^^
//                                  var 0.58                     var 0.35
```

**Fix — transition goals:**
```typescript
const goalThreshold = chanceQuality * 0.35 * (1 - defGK * 0.35) * 1.15 * weatherGoalMod
//                                    ^^^^
//                                  var 0.28
```

**Fix — halfchance goals:**
```typescript
const goalThreshold = chanceQuality * 0.38 * weatherGoalMod
//                                    ^^^^
//                                  var 0.30
```

---

## STEG 2: Sänk hörnmål från ~35% till 23%

**Fil:** `matchEngine.ts`, corner sequence

Nuvarande: `goalThreshold = clamp((cornerChance - defenseResist) * 0.20 + 0.04, 0.05, 0.12)`

23% av 10 mål = 2.3 hörnmål. Nuvarande: ~3-4.

**Fix — sänk corner goal conversion:**
```typescript
const goalThreshold = clamp(
  (cornerChance - defenseResist) * 0.14 * weatherGoalMod + 0.03,
  0.03, 0.09  // var: 0.05-0.12
)
```

**Öka hörnfrekvens i sekvensval:** Fler hörnor men lägre conversion per hörna.
```typescript
// buildSequenceWeights:
let wCorner = 32  // var: 28
```

Detta ger fler hörnor (mer action, mer hörninteraktion) men lägre mål per hörna.

---

## STEG 3: Tidsvikter (mer mål i 2:a halvlek)

**Fil:** `matchEngine.ts`, steg-loopen

Verkligheten: 45.7% mål i 1:a halvlek, 54.3% i 2:a. Plus spik vid 40-49 och 80-89.

**Fix:** Lägg till en tidsberoende multiplier per steg:

```typescript
// Före steg-loopen:
const TIMING_WEIGHTS = [
  // Step 0-29 (1:a halvlek): baseline
  ...Array(10).fill(0.94),  // min 0-14
  ...Array(10).fill(0.97),  // min 15-29
  ...Array(10).fill(1.05),  // min 30-44 (slutet av 1:a = fler mål)
  // Step 30-59 (2:a halvlek): 8% högre
  ...Array(10).fill(1.08),  // min 45-59
  ...Array(10).fill(1.10),  // min 60-74
  ...Array(10).fill(1.15),  // min 75-89 (slutminuterna = mest mål)
]

// I loopen, applicera på varje goalThreshold:
const timingMod = TIMING_WEIGHTS[step] ?? 1.0
goalThreshold *= timingMod
```

---

## STEG 4: Hemmaplansfördel (55% → 51%)

**Fil:** `matchEngine.ts`

Nuvarande: `homeAdvantage = 0.05` (default parameter).

Verkligheten: hemmaseger 50.7%, inte 55%. Och 9% oavgjort.

**Fix:**
```typescript
homeAdvantage = 0.035  // var: 0.05
```

Derby-hemmabonus behåller sin extra multiplikator.

---

## STEG 5: Fouls / utvisningar

Verkligheten: 4.1 registrerade fouls per match. Motorn ger ~3.

**Fix:** Marginell ökning:
```typescript
// foul sequence:
if (r < foulProb * 0.62 * (isPlayoff ? 1.2 : 1.0) * derbyFoulMult) {
//                  ^^^^
//                var 0.55
```

---

## STEG 6: Andra halvlek — is-degradering starkare

Verkligheten: 54% av mål i 2:a halvlek. En del av detta beror på trött is.

**Fil:** `matchStepByStep.ts` (andra halvlek)

Befintlig isdegraderingsmekanism finns men kan vara för svag. Om den inte ökar goal chance tillräckligt → stärk effekten:

```typescript
// Andra halvlek is-degradering:
const iceEffect = weather?.iceQuality === 'poor' ? 1.12 : 
                  weather?.iceQuality === 'moderate' ? 1.06 : 1.02
// Applicera på goalThreshold i 2:a halvlek
```

---

## Verifiering

Skriv ett kalibreringsskript (`scripts/calibrate.ts` eller liknande) som:

1. Kör 200 simuleringar med slumpmässig seed
2. Beräknar snitt: mål/match, hörnmål%, hemma%, oavgjort%
3. Jämför mot `docs/data/bandygrytan_stats.json` calibrationTargets
4. Loggar avvikelser

```typescript
const targets = {
  goalsPerMatch: { target: 10.0, tolerance: 1.5 },
  cornerGoalShare: { target: 0.232, tolerance: 0.03 },
  homeWinRate: { target: 0.507, tolerance: 0.05 },
  drawRate: { target: 0.090, tolerance: 0.03 },
  secondHalfShare: { target: 0.543, tolerance: 0.03 },
}
```

**Kör tills alla targets är inom tolerance.** Justera konstanterna iterativt.

---

## Vad vi INTE ändrar (ännu)

- Straffmål (5.1%) — ny feature, hanteras i FIXSPEC_NYA_FEATURES
- Skottstatistik — osäker dataklassificering, behöver mer analys
- Corner-totaler — type9 vs type23 är fortfarande oklart
- Publiksiffror — ekonomimodellen kalibreras separat
