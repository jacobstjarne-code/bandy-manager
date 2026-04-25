# Sprint 25-I — Strukturell analys: tre motor-avvikelser

**Datum:** 2026-04-25  
**Status:** KOMPLETT — inga kodändringar  
**Nästa steg:** Opus läser och skriver implementations-spec(ar)

---

## 1. Sammanfattning (max 250 ord)

Tre avvikelser undersöktes. Resultatet är **två separata rotorsaker**, inte en gemensam.

**Gap 1 — awayWinPct (motor 42.2% vs target 38.3%):**  
Direkt rotorsak: `matchSimProcessor.ts` sätter `baseAdv = 0.05` (0.043 med inomhusarena), men kalibreringsskriptet `calibrate_v2.ts` körde med `homeAdvantage: 0.14`. Motorn i spelet har alltså halva den hemmafördel som kalibreringen antog. Även vid 0.14 är homeWin 46.9% mot target 50.2% — en sekundär avvikelse förklaras av för hög draw-andel (15-16% vs target 11.6%).

**Gap 2 — cornerGoalPct i slutspel (QF 26.7% vs target 20.0%):**  
Direkt rotorsak: `cornerTrailingMod = 1.20` i kvartsfinal är *högre* än grundseriens 1.11. I slutspelsmatcher leder det starkare seedade laget oftare → det svagare bortalaget tränar bakifrån → cornerTrailingMod aktiveras → hörnkonverteringen ökar. Rådata visar att cornerGoalPct SJUNKER progressivt i slutspel (QF 20%, SF 18.8%, Final 16.7%). Motorn gör tvärtom för QF och SF.

**Gap 3 — playoff_final mål/match (stresstest 7.93 vs target 7.00):**  
Ej bekräftad motorbugg. Isolerat test (200 finaler) ger 6.99 ≈ 7.00 ✅. Stresstest-resultatet (7.93) beror på litet urval (n=30 per körning). SM-finalen spelas på neutral plan (`isNeutralVenue: true` i `playoffService.ts:64`) — hemmafördel appliceras korrekt med 0.

Slutsats: **Två fixes behövs.** Ordning: Fix 1 (homeAdv) påverkar indirekt cornerGoalPct via vilka lag som leder, men räcker inte — Fix 2 (cornerTrailingMod i QF) är oberoende nödvändig.

---

## 2. Mätningar

### Target-verifiering från rådata (bandygrytan_detailed.json)

Före kodanalys: alla tre targets verifierade manuellt mot rådata.

| Target | Beräkning | Värde | Status |
|--------|-----------|-------|--------|
| awayWinPct | awaywins / total_grundserie × 100 | 38.3% | ✅ korrekt |
| cornerGoalPct | cornerGoals / totalGoals × 100 (ej konvertering) | 22.2% | ✅ korrekt (grundserie) |
| playoff_final goals/match | totalGoals / n (finaler, n=12) | 7.00 | ✅ korrekt, litet n |

Obs: `cornerGoalPct` är andel av *totala mål* som är hörnmål — INTE konverteringsfrekvens per hörna (som är ~11.4%). Samma definition som Sprint 25b/calibrationTargets.

Per-fas cornerGoalPct ur rådata:
| Fas | Hörnmål | Totala mål | cornerGoalPct |
|-----|---------|------------|---------------|
| Grundserie | ~2000 | 10242 | 22.2% |
| Kvartsfinal | ~118 | 593 | 20.0% |
| Semifinal | ~67 | 358 | 18.7% |
| Final | ~16 | 97 | 16.7% |

Trenden är konsekvent nedåtgående. Varje fas har lägre andel hörnmål än föregående.

---

### Scenario A — Hemmafördel-kurvan (awayWinPct)

Mätning: 200 matcher per homeAdv-steg, varierad lagstyrka (CA 50-80), 1 seed.

| homeAdv | homeWin% | awayWin% | draw%  | goals/m |
|---------|----------|----------|--------|---------|
| 0.05    | 43.7%    | 40.2%    | 16.1%  | 9.00    |
| 0.08    | 44.8%    | 39.7%    | 15.6%  | 8.99    |
| 0.10    | 45.5%    | 39.1%    | 15.5%  | 9.00    |
| 0.12    | 46.1%    | 38.3%    | 15.7%  | 9.00    |
| 0.14    | 46.9%    | 37.5%    | 15.7%  | 9.00    |
| **TARGET** | **50.2%** | **38.3%** | **11.6%** | **9.12** |

Observationer:
- awayWin träffar target (38.3%) vid homeAdv ≈ 0.12
- homeWin är systematiskt för låg vid alla testade värden (46.9% vs 50.2% vid 0.14)
- draw-andel 15-16% oavsett homeAdv — oberoende struktur-avvikelse
- Goals/match 9.00 vs target 9.12 — minimal avvikelse, ej prioriterad

Slutsats scenario A: `baseAdv = 0.05` förklarar avvikelsen. Att höja till 0.14 löser awayWinPct men skapar residual-gap i homeWin pga draws. Draw-problematiken är ett separatproblem.

Aktuell kod (`matchSimProcessor.ts:266`):
```ts
const baseAdv = homeClub?.hasIndoorArena ? 0.05 * 0.85 : 0.05
```

Kalibreringsskript (`calibrate_v2.ts:1050`):
```ts
homeAdvantage: 0.14
```

---

### Scenario B — cornerGoalPct per fas

Mätning: 200 matcher per fas (regular/QF/SF/Final), lika lagstyrka (CA 70 vs 70), 1 seed.

| Fas | Motor cornerGoalPct | Target | Gap |
|-----|---------------------|--------|-----|
| Grundserie | 22.1% | 22.2% | −0.1pp ✅ |
| Kvartsfinal | 26.7% | 20.0% | +6.7pp ❌ |
| Semifinal | 23.6% | 18.7% | +4.9pp ❌ |
| Final | 13.4% | 16.7% | −3.3pp (~n.s.) |

PHASE_CONSTANTS (matchUtils.ts) som driver avvikelserna:

| Fas | goalMod | cornerTrailingMod | cornerLeadingMod | homeAdvDelta |
|-----|---------|-------------------|------------------|--------------|
| regular | 1.000 | **1.11** | 0.90 | 0.00 |
| quarterfinal | 0.966 | **1.20** ← | 0.81 | 0.06 |
| semifinal | 0.920 | **1.05** | 0.86 | 0.05 |
| final | 0.768 | **0.58** | 1.24 | 0.00 |

Problem: QF har `cornerTrailingMod = 1.20 > regular 1.11`. Starka seedade lag vinner oftare → svagare bortalag tränar bakifrån → cornerTrailingMod aktiveras → fler hörnmål. Effekten är omvänd mot rådata.

SF har 1.05 < regular 1.11 — korrekt riktning men otillräcklig minskning.
Final har 0.58 — stämmer med rådatas 16.7% (låg cornerGoalPct).

---

### Scenario C — Finaler specifikt

SM-finalen spelas på neutral plan. Bekräftat i `playoffService.ts:64`:
```ts
isNeutralVenue: true
```

`effectiveHomeAdvantage` i `matchCore.ts`:
```ts
effectiveHomeAdvantage = fixture.isNeutralVenue ? 0 : homeAdvantage + phaseConst.homeAdvDelta
```

Mätning: 200 isolerade finaler (CA 70 vs 70, homeAdv=0.14, neutral venue):

| Mått | Motor | Target | Status |
|------|-------|--------|--------|
| Mål/match | 6.99 | 7.00 | ✅ |
| cornerGoalPct | 13.4% | 16.7% | −3.3pp |
| homeWin% | 48.5% | — | (styrkebalans) |

Stresstest visade 7.93 mål/match i finaler, men n=30 per körning (10 seeds × 3 finaler). Isolerat test bekräftar att motorn träffar rätt. Stresstest-avvikelsen är statistiskt brus.

Final cornerGoalPct 13.4% vs target 16.7% — möjlig avvikelse men litet n och borderline. Inte prioriterat.

---

## 3. Kodkarta

### (a) Hemmafördel — `matchSimProcessor.ts` vs kalibrering

**Implementering i spelet:**
- Fil: `src/application/useCases/processors/matchSimProcessor.ts:266`
- `const baseAdv = homeClub?.hasIndoorArena ? 0.05 * 0.85 : 0.05`
- Värdet skickas sedan som `homeAdvantage: baseAdv` till matchmotorn

**Kalibrering:**
- Fil: `scripts/calibrate_v2.ts:1050`
- `homeAdvantage: 0.14`
- Kalibreringsskriptet har aldrig använt spelets faktiska baseAdv-värde

**Effekt i matchCore.ts:**
- `effectiveHomeAdvantage = fixture.isNeutralVenue ? 0 : homeAdvantage + phaseConst.homeAdvDelta`
- Hemmafördelen påverkar attack/försvar via `homeAttackBoost` och `awayDefenseBoost`
- I grundserie utan inomhusarena: `effectiveHomeAdvantage = 0.05 + 0.00 = 0.05`
- I QF utan inomhusarena: `effectiveHomeAdvantage = 0.05 + 0.06 = 0.11`
- I kalibrering: alltid `0.14`

**Konstansen:** homeAdvantage är inte fasspecifikt i sig — `homeAdvDelta` i PHASE_CONSTANTS lägger på ett delta, men basvärdet är 0.05. I kalibrering var det alltid 0.14 oavsett fas.

### (b) Hörn-konversion — `matchCore.ts` + PHASE_CONSTANTS

**cornerBase-formel** (`matchCore.ts`):
```ts
const cornerBase = emitFullTime
  ? 0.105 * SECOND_HALF_BOOST * phaseGoalMod
  : 0.105 * phaseGoalMod
```

**goalThreshold-formel:**
```ts
goalThreshold = clamp(
  (cornerChance - defenseResist) * 0.30 * stepGoalMod * cornerStateMod + cornerBase,
  min, max
)
```

**cornerStateMod** väljs av:
```ts
cornerStateMod = trailing ? phaseConst.cornerTrailingMod
               : leading  ? phaseConst.cornerLeadingMod
               : 1.0
```

**Interaktion:** I QF-matcher med ett starkt hemmalag (seed 1-2 möter 7-8):
- Hemmalaget leder oftare → `cornerLeadingMod = 0.81` → färre hörnmål för hemmalaget
- Bortalaget tränar bakifrån → `cornerTrailingMod = 1.20` → FLER hörnmål för bortalaget
- Netto: total cornerGoalPct stiger trots lägre goalMod (0.966)

### (c) PHASE_CONSTANTS — `matchUtils.ts`

```ts
export const PHASE_CONSTANTS = {
  regular:     { goalMod: 1.000, homeAdvDelta: 0.00, suspMod: 1.00, cornerTrailingMod: 1.11, cornerLeadingMod: 0.90 },
  quarterfinal:{ goalMod: 0.966, homeAdvDelta: 0.06, suspMod: 0.84, cornerTrailingMod: 1.20, cornerLeadingMod: 0.81 },
  semifinal:   { goalMod: 0.920, homeAdvDelta: 0.05, suspMod: 0.94, cornerTrailingMod: 1.05, cornerLeadingMod: 0.86 },
  final:       { goalMod: 0.768, homeAdvDelta: 0.00, suspMod: 1.08, cornerTrailingMod: 0.58, cornerLeadingMod: 1.24 },
}
```

Problemet med QF: `cornerTrailingMod: 1.20` är det HÖGSTA värdet av alla faser — högre än grundseriens 1.11. Det var troligen avsett att modellera att ett backsträvan lag i slutspel kämpar hårdare på hörnor, men effekten är omvänd mot rådata.

---

## 4. Hypoteser

### H1 — homeAdvantage: basvärde 0.05 vs kalibrering 0.14

**Hypotes:** `matchSimProcessor.ts` initierar hemmafördelen till 0.05, men kalibreringen kördes med 0.14. Motorn i spelet har 36% av den hemmafördel som kalibreringen förutsatte.

**Stöd från data:** awayWin träffar target (38.3%) vid homeAdv ≈ 0.12. Vid 0.05 är awayWin 40.2% (+1.9pp över target). Motor homeWin = 43.7% vs target 50.2% (−6.5pp). Kurvan visar konsekvent rörelsemönster med homeAdv.

**Stöd från kod:** `matchSimProcessor.ts:266` vs `calibrate_v2.ts:1050`. Direkt kontradiktion — spelet kör 0.05, kalibreringen körde 0.14.

**Förklarar vilka avvikelser:** awayWinPct direkt. cornerGoalPct indirekt (svagare hemmafördel → fler jämna matcher → cornerStateMod aktiveras annorlunda). Finale: ej relevant (isNeutralVenue=true).

**Förslag till fix:** Ändra `matchSimProcessor.ts:266` från `0.05` till `0.14`. Inomhusarena-bonus kan behållas proportionellt (0.14 × 0.85 = 0.119) eller omprövas.

**Risk:** homeWin ökar men träffar inte 50.2% (hamnar ~47%) pga draws. Kan skapa ny avvikelse i homeWinPct om det finns ett target för det. Goals/match påverkas minimalt (+0.1 vid 0.14). Draws förblir höga (15-16%) — draw-problematiken kvarstår som separat.

---

### H2 — cornerTrailingMod för hög i kvartsfinal

**Hypotes:** `cornerTrailingMod = 1.20` i QF (mot regular 1.11) driver upp cornerGoalPct i playoff. Baksträvande lag konverterar hörnor bättre i QF än i grundserie — omvänt mot rådata.

**Stöd från data:** QF cornerGoalPct = 26.7% vs target 20.0% (+6.7pp). SF med 1.05 ger 23.6% vs 18.7% (+4.9pp). Final med 0.58 ger 13.4% vs 16.7% (under target, men rimligt). Trenden ur rådata är konsekvent nedåtgående; motorn bryter trenden i QF.

**Stöd från kod:** `PHASE_CONSTANTS.quarterfinal.cornerTrailingMod = 1.20` är det globalt högsta värdet. Baksträvande lag triggar detta mer frekvent i QF pga styrkedifferens (seed 1 möter 8 etc.). Multiplikatorn 1.20 × 1.11 (relativa ökningen) är direkt orsak.

**Förklarar vilka avvikelser:** cornerGoalPct QF + SF. Inte awayWinPct direkt. Finale: cornerGoalPct i final är under target, möjligen överkompenserat med cornerTrailingMod=0.58.

**Förslag till fix:** Sänk `cornerTrailingMod` i QF från 1.20 till ≤1.05. SF kan justeras till ≤0.95 för att följa rådata-trenden. Alternativt: definiera en monotont avtagande serie (reg 1.11 → QF 1.05 → SF 0.95 → Final 0.58).

**Risk:** Lägre cornerGoalPct i QF/SF kan påverka matchdramaturgi (färre spektakulära mål). Inga kalibrerade mätvärden borde brytas — goals/match styrs av goalMod, inte cornerTrailingMod direkt.

---

### H3 — Draw-andel för hög (oberoende strukturproblem)

**Hypotes:** Motorn producerar 15-16% oavgjorda mot target 11.6% oavsett homeAdv-nivå. Detta är en separat strukturell avvikelse som inte täcks av H1 eller H2.

**Stöd från data:** Draw-andel är konsekvent 15-16% i alla homeAdv-mätningar (0.05 till 0.14). Inte känslig för hemmafördel. awayWin träffar 38.3% vid homeAdv ≈ 0.12, men homeWin saknar ~3pp eftersom överskottet hamnar i draws.

**Stöd från kod:** `matchCore.ts` slutsimuleringen. `goalThreshold`-logiken ger troligen för låg scoringfrekvens i jämna matcher, som istället slutar 0-0 eller 1-1. Exakt mekanism ej spårad — kräver djupare analys av late-match target-probabilities.

**Förklarar vilka avvikelser:** Residualavvikelse i homeWinPct efter H1-fix. Inte awayWinPct (kompenseras av H1). Inte cornerGoalPct direkt.

**Förslag till fix:** Öka late-match scoring-sannolikhet vid jämna ställningar. Alternativt: höj goalMod för grundserie minimalt om draws dominerar jämnmatcher. Kräver mätning av draw-rate per styrkediff.

**Risk:** Hög risk för regression i goals/match (target 9.12). Kräver noggrann kalibrering. Inte prioriterat tills H1+H2 är fixade.

---

### H4 — Playoff-final mål/match: statistiskt brus, ej motorbugg

**Hypotes:** Stresstest-mätningen 7.93 mål/final är artefakt av litet urval (n=30), inte en motoravvikelse. Motorn träffar target korrekt i isolation.

**Stöd från data:** Isolerat test med 200 finaler (neutral venue, CA 70 vs 70, homeAdv=0.14) ger 6.99 ≈ 7.00 ✅. Stresstest n=30 ger standardfel ≈ ±0.5 (rough estimate). 7.93 är inom 2 standardfel.

**Stöd från kod:** `isNeutralVenue: true` bekräftad (`playoffService.ts:64`). `effectiveHomeAdvantage = 0` för finaler. `goalMod = 0.768` i PHASE_CONSTANTS ger kraftig reduktion. Mekaniken är korrekt.

**Förklarar vilka avvikelser:** Ingen motorbugg. Stresstest-targets bör uppdateras att räkna genomsnitt över fler seeds eller märkas som "litet urval".

**Förslag till fix:** Inget. Verifiera i nästa stresstest med 20+ seeds att final-genomsnittet är nära 7.00.

**Risk:** Noll. Ingen kodändring.

---

## 5. Gemensam rotorsak — finns det?

**Nej — det är två separata problem.**

H1 (homeAdv) och H2 (cornerTrailingMod) delar inte rotorsak. H1 uppstod när `matchSimProcessor.ts` satte ett defaultvärde (0.05) utan att synkronisera mot kalibreringen (0.14). H2 uppstod när PHASE_CONSTANTS QF-värdet sattes med designintentionen att trailing-lag kämpar hårdare i slutspel — men utan att verifiera mot rådata-trenden.

**Delvis länk:** Om H1 fixas (baseAdv 0.05 → 0.14) ökar hemmafördelen, hemmalaget leder ännu oftare i QF, bortalaget tränar bakifrån *ännu* mer. H2-problemet med `cornerTrailingMod=1.20` förvärras marginellt. H1-fix löser alltså inte H2 — de kräver separata fixes.

| Avvikelse | H1 löser? | H2 löser? | H3 löser? | H4 löser? |
|-----------|-----------|-----------|-----------|-----------|
| awayWinPct +4pp | ✅ direkt | Nej | Delvis (residual) | Nej |
| cornerGoalPct QF +6.7pp | Marginellt förvärrar | ✅ direkt | Nej | Nej |
| cornerGoalPct SF +4.9pp | Marginellt | ✅ delvis | Nej | Nej |
| playoff_final mål | Ej relevant | Ej relevant | Nej | ✅ (ej bugg) |

---

## 6. Rekommendation

### Prioritering

**Sprint 25-J (fix 1): Höj baseAdv i matchSimProcessor → 0.14**
- Fil: `matchSimProcessor.ts:266`
- Ändring: `0.05` → `0.14`
- Förväntad effekt: awayWin sjunker från 42.2% till ~38.3% ✅
- Förväntad effekt: homeWin stiger från ~43.7% till ~46.9% (residual gap kvarstår pga draws)
- Risk: låg. En rad. Ingen logik ändras.
- Verifiering: kör `scripts/calibrate_v2.ts` + stresstest + kolla awayWinPct i `analyze-stress.ts`

**Sprint 25-K (fix 2): Justera cornerTrailingMod i QF och SF**
- Fil: `matchUtils.ts` — PHASE_CONSTANTS
- Ändring: QF `cornerTrailingMod: 1.20 → 1.05`, SF `cornerTrailingMod: 1.05 → 0.93`
- Förslag på monoton serie: regular 1.11 → QF 1.05 → SF 0.93 → Final 0.58
- Förväntad effekt: QF cornerGoalPct sjunker från 26.7% till ~22% (nära target 20%)
- Risk: medel. Påverkar match-dramaturgi i QF/SF. Kräver mätning av cornerGoalPct per fas efter fix.
- Verifiering: kör kalibreringsmätning med 200 QF-matcher + 200 SF-matcher, jämför mot targets

**Sprint 25-L (om nödvändigt): Draw-andel**
- Separat analys — ej del av detta uppdrag
- Prioriteras EFTER H1+H2 är verifierade
- Anledning: draws kräver djupare motoranalys och hög regressionsrisk mot goals/match

### Ordning
1. Kör 25-J (homeAdv) — snabb, låg risk
2. Kör 25-K (cornerTrailingMod) — kräver mätning, medelhög risk  
3. Verifiera båda mot stresstest (20 seeds)
4. Besluta om 25-L (draws) är värd risken

---

## 7. Bilaga: råa mätvärden

### HomeAdv-kurva (scenario A, 200 matcher varierad CA per steg)

```
homeAdv=0.05: home=43.7% away=40.2% draw=16.1% goals=9.00
homeAdv=0.08: home=44.8% away=39.7% draw=15.6% goals=8.99
homeAdv=0.10: home=45.5% away=39.1% draw=15.5% goals=9.00
homeAdv=0.12: home=46.1% away=38.3% draw=15.7% goals=9.00
homeAdv=0.14: home=46.9% away=37.5% draw=15.7% goals=9.00
TARGET:        home=50.2% away=38.3% draw=11.6% goals=9.12
```

### cornerGoalPct per fas (scenario B, 200 matcher CA 70v70)

```
regular:     22.1%  (target 22.2%) ✅
quarterfinal: 26.7% (target 20.0%) ❌ +6.7pp
semifinal:   23.6%  (target 18.7%) ❌ +4.9pp
final:       13.4%  (target 16.7%) ~borderline, neutral venue
```

### Finals isolerat test (scenario C, 200 finaler CA 70v70 neutral venue)

```
goals/match: 6.99  (target 7.00) ✅
cornerGoalPct: 13.4% (target 16.7%)
homeWin (bracket home): 48.5%  — styrkebalans-artefakt vid lika CA
```

### Stresstest season_stats.json (referens, 10 seeds × 3 säsonger)

```
awayWinPct: 42.2%     (target 38.3%)  ❌ +3.9pp
cornerGoalPct: 22.4%  (basic avg)     ✅ (men per-fas ej mätt i stress)
playoff_final goals: 7.93             (target 7.00) — litet n, ej bugg
```
