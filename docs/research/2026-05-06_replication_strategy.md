# PM 2 — Replikeringsstrategi: hur forskningen landar i motorn

**Datum:** 2026-05-06 (uppdaterad med fulltext-data)
**Föregångare:** `2026-05-06_sirius_uppsats_pm.md`
**Companion:** `bandy_research_targets.json` (v0.2 med fulltext)

---

## Status efter fulltext-genomgång (2026-05-06)

Fulltext har lästs för:
- van den Tillaar 2023 (herr+dam) → `2026-05-06_van_den_tillaar_pm.md`
- Petré 2022 → `2026-05-06_petre_pm.md`
- Johansson 2021 → `2026-05-06_johansson_pm.md`
- Persson 2023 (junior, NY källa) → `2026-05-06_persson_junior_pm.md`

Syntes: `2026-05-06_research_synthesis.md`

Alla `physical_targets` i JSON är nu uppgraderade från `confidence: low` till `high/medium`. De viktigaste fynden är:

1. **Trötthetsmodell (Johansson 2021):** trötthet i bandy reducerar event-FREKVENS, inte event-KVALITET. Hög-intensiva accelerationer/decelerationer bevaras genom hela matchen. Detta motsäger naiv quality-degradation-modell. Se Nivå 1B nedan.

2. **Position differentierar via aerob kapacitet, inte sprint/styrka (Petré 2022):** stamina-attribut ska skilja position, skating/acceleration ska INTE.

3. **Junior-progression (Persson 2023):** kalibrerad utvecklingskurva 16.8 → 26.7 år. Junior-spelare position-neutrala, position-specialisering kommer i senior-åren.

4. **Sprint-skating-baselines (van den Tillaar 2023):** senior elit peak velocity 10.83 m/s = rating 90, junior elit 10.24 m/s = rating 80, allt däremellan kalibrerat.

`match_analytics_targets`-sektionen (Sirius-uppsatsen) är fortfarande den primära källan för spelmodell-fynd (skotttyper, hörnor, ute/inne, predictors).

---

## Tre nivåer av replikering

Sirius-fynd kan implementeras på tre nivåer beroende på vad du vill ha ut:

### Nivå 1 — Motor producerar samma fördelningar (instrumentering + targets)

Idag har vi `calibrate_v2.ts` med 5 targets. Vi vet att motorn ger:
- 9.12 mål/match ✅
- 22.2% hörnmål-andel ✅
- 50.2% hemmaseger ✅
- 11.6% oavgjort ✅
- 60.7% mål i andra halvlek (motor 52.6%, gap)

Men vi mäter inte:
- **Skotttypsfördelning** (vad simulerar motorn för shot mix?)
- **Frislagsmål-andel** (Sirius: 0/143. Motor: ?)
- **Hörnsida-fördelning** (vänster vs höger)
- **Skott på mål vs skottförsök** (Sirius: skott på mål 90% vinst-prediktor)

För att kunna lägga targets för dessa måste motorn **instrumenteras**. Två steg:

**Steg A — Lägg till tracking i matchCore.ts:**
```typescript
// I MatchEvent eller separat counter
type ShotType = 'freeRunning' | 'rebound' | 'cross' | 'centralAttack' 
              | 'dribble' | 'fixedSituation' | 'longShot'

// Vid varje skott-event, klassificera enligt vägen som ledde dit:
// - corner-rutten   → fixedSituation
// - freekick-rutten → fixedSituation (med subtype)
// - penalty-rutten  → fixedSituation (med subtype)
// - transition      → freeRunning (om snabbomställning) eller centralAttack
// - attack          → centralAttack / dribble / cross / longShot beroende på buildPattern
// - rebound-väg     → rebound
```

Estimat: 4-6h för instrumentering, plus refaktor av attack-vägen för att skilja på sub-types.

**Steg B — Utöka calibrate_v2.ts targets:**
```typescript
const TARGETS = {
  // existing...
  shotTypeFreqLongShot:   { target: 0.383, tolerance: 0.05 },
  shotTypeFreqFixed:      { target: 0.277, tolerance: 0.05 },
  shotTypeGoalLongShot:   { target: 0.059, tolerance: 0.02 },
  shotTypeGoalFreeRun:    { target: 0.471, tolerance: 0.10 },
  freeKickGoalShare:      { target: 0.000, tolerance: 0.02 },  // STRIKT!
  cornerLeftGoalRate:     { target: 0.168, tolerance: 0.05 },
  cornerRightGoalRate:    { target: 0.090, tolerance: 0.05 },
}
```

Och printa ut motor-värdena för manuell verifiering.

**Värde:** Fångar drift. Om vi senare ändrar `goalThresholdAttack`-formeln så ser vi om skotttyp-fördelningen håller realismen.

---

### Nivå 1B — Trötthetsmodell-omskrivning (NY, Johansson 2021)

Detta är en **strukturell** edit, inte bara kalibrering. Den fysiologiska modellen är fel idag (om motorn sänker `chanceQuality` över tid).

**Steg 1 — Lokalisera fatigue-implementation:**
Sökord i `src/domain/services/`: `fatigue`, `tiredness`, `step / TOTAL_STEPS`, `chanceQuality *=`, `goalThreshold *=`. Sannolika filer: `matchCore.ts`, `matchEngine.ts`. Estimat: 30–60 min.

**Steg 2 — Klassificera nuvarande modell:**
- (a) Quality-degradation (`chanceQuality *= (1 - fatigueFactor)`) → strider mot Johansson → omskrivning krävs
- (b) Frequency-degradation (`sprintProbability *= (1 - fatigueFactor)`) → redan Johansson-trogen → bara kalibrering krävs
- (c) Hybrid → splitta i komponenter och behandla separat

**Steg 3 — Kalibrerings-targets från Johansson H1→H2:**
```typescript
const FATIGUE_TARGETS = {
  totalSkatingReduction:        -0.045,  // -4.5%
  veryFastSkatingReduction:     -0.13,   // -13% (25-30 km/h)
  sprintSkatingReduction:       -0.09,   // -9%  (>=30 km/h)
  lowIntAccReduction:           -0.035,  // -3.5%
  highIntAccReduction:           0.0,    // BEVARAS
  veryHighIntAccReduction:       0.0,    // BEVARAS
  decelerationReduction:         0.0,    // BEVARAS (alla nivåer)
}
```

**Steg 4 — Stress-test:**
- Kör 1000 matcher med ny fatigue-modell
- Verifiera att totala mål/match håller sig vid 9.12 (Bandygrytan-target)
- Verifiera att mål-andel H2 inte sjunker (Sirius/Bandygrytan: 60.7% av mål i H2; motor idag 52.6%)
- Hypotes: Johansson-trogen modell ska *höja* H2-mål-andel eftersom kontringar i 87:e min nu har samma kvalitet som 12:e

**Värde:** Fysiologiskt korrekt modell. Släpp inte chans-kvalitet sent i match — bara frekvens-utfall. Direkt kopplat till Bandy Managers gap mellan motor (52.6% H2-mål) och verklighet (60.7%).

**Risk:** Strukturell ändring i kritisk path. Kräver Code-stress-test med bandygrytan_calibration_targets innan deploy.

---

### Nivå 2 — Använd Sirius-värden för att kalibrera om motorn

Detta kräver Nivå 1 först. Sen iterera på motor-konstanter tills mätvärden landar inom tolerans.

**Kandidater för justering:**

1. **Frislagsmål-frekvens** — om motorn idag ger >2% frislagsmål, sänk `goalThresholdFreekick` tills 0-1%. Sirius: 0/143 = exakt 0%.

2. **Långskott vs centralt** — `goalThresholdAttack` använder en `chanceQuality`-input. Om vi splittar attack-vägen i `attackLongShot` och `attackCentral` kan vi sätta:
   - `goalThresholdAttackLongShot` = 0.058 (Sirius målprocent)
   - `goalThresholdAttackCentral` = 0.227 (Sirius)
   - `goalThresholdAttackFreeRunning` = 0.471 (sällsynt men dödligt)

3. **Hörnsida** — om `cornerInteractionService` idag är symmetrisk, lägg till en sidobaserad multiplikator:
   - vänsterhörna: 1.0
   - högerhörna: 0.54 (= 0.090 / 0.168)
   
   Inte statistiskt säkerställt men trend-konsekvent över båda lag i Sirius-data. Lågrisk.

**Värde:** Realismen i ENSKILDA matcher höjs. Idag ger motorn statistiskt rätt antal mål totalt, men varje match kan ha orealistisk fördelning (för många frislagsmål, för få farliga friställande lägen).

---

### Nivå 3 — Replikera Sirius datainsamlingsmetod för egen data

Sirius-uppsatsens metod är replikerbar utan särskild teknisk kompetens:
- Verktyg: Python-script på GitHub (länk i abstract)
- Tid per match: ~110 min (matchtid + 5-10 min efterarbete)
- Mental belastning: max 2 matcher/dag enligt uppsatsen

**Förslag:** En person, 6-10 matcher från olika lag, en månad. Då har vi:
- N från flera lag (inte single-team-bias)
- Konkret kalibrerings-target som matchar svensk Elitserien herr 2026
- Verifiering av om Sirius-fynden generaliserar

Detta är den dyraste nivån men ger den största epistemiska vinsten. **Möjlig framtida koppling: din kontakt med elit-bandycoach.** Klubben kan vara intresserad av att få en gratis säsongsanalys i utbyte mot data-samarbete (bandyklubbar har ingen analys-avdelning enligt uppsatsen).

---

## Konkret första steg — minst risk, störst lärdom

Om du vill testa replikering utan att först bygga ut hela instrumenteringen:

**Quick-win-pass (2-3h):**

1. Lägg till **frislagsmål-räknare** i `calibrate_v2.ts`. Räkna antal mål med `MatchEventType.Goal` där föregångande event är `MatchEventType.FreeKick`. Print andel.
2. Lägg till **andel skott från attack-vägen vs corner/freekick/penalty/transition**. Print fördelning.
3. Kör 1000 matcher (uppskalad sample), inte 200.
4. Jämför mot Sirius-andelar och Bandygrytan-snitt.

Resultat blir en konkret mätning av vad motorn idag genererar. Det avgör om vi behöver hela instrumenteringen i Nivå 1, eller om motorn redan ligger ungefär rätt.

---

## Vad jag inte kan svara på utan mer data

- **Hur ofta ger motorn idag frislagsmål?** Behöver köra calibrate-skript med extra logging.
- **Vad är skotttyps-distributionen i motorn?** Behöver instrumentera först.
- **Är Sirius-värdena representativa för hela ligan?** Single-team, formsvacka. Den 1124-match Bandygrytan-data vi har har inte skotttyper, så vi kan inte triangulera.

---

## Akademiska källor utöver Sirius — fulltext-PM-referenser

Fulltext har lästs för alla fyra peer-reviewed papper plus Persson 2023 (junior-uppsats). Se separata PM:er för detaljer:

- **van den Tillaar 2023 (herr+dam)** → `2026-05-06_van_den_tillaar_pm.md` — sprint-skating-baselines per kön/nivå/position
- **Petré 2022** → `2026-05-06_petre_pm.md` — fysisk profil senior elit, position-VO2max
- **Johansson 2021** → `2026-05-06_johansson_pm.md` — match-data + trötthetsmodell-omskrivning (se Nivå 1B ovan)
- **Persson 2023** → `2026-05-06_persson_junior_pm.md` — junior-elit fysisk profil 16.8 år

Syntes över alla fem källor: `2026-05-06_research_synthesis.md`.

Kalibreringsvärden i strukturerad form: `bandy_research_targets.json` (v0.2).

---

## Sammanfattande plan

**Om du vill ta ett steg framåt nu:**

| Pass | Tid | Värde | Beroenden |
|------|-----|-------|-----------|
| Quick-win mätning (frislagsmål + skotttyp i motor idag) | 2-3h | Vet vi var vi står? | Ingen |
| Lokalisera fatigue-implementation (Nivå 1B Steg 1) | 30-60 min | Förutsatts för trötthetsmodell-fix | Ingen |
| Nivå 1 instrumentering (skotttyper) | 4-6h | Kan börja kalibrera | Quick-win först |
| Trötthetsmodell-omskrivning (Nivå 1B) | **strukturell, omfattning beror på nuvarande modell** | Fysiologiskt korrekt + höjer H2-mål | Lokalisering först |
| Frislagsmål-fix (om motor ger >2%) | 1-2h | Direkt realism-fix | Quick-win |
| Hörnsida-asymmetri | 3-4h | Hög upplevelse-effekt | Granska cornerInteractionService |
| Position-stamina-differentiering (senior) | 2-3h | Kalibrerad position-realism | Granska worldGenerator |
| Junior-spelare position-neutralitet | 2-3h | Persson-trogen akademi | Granska worldGenerator |
| Egen datainsamling (Sirius-metod) | 1-2 mån | Generalisera Sirius-fynd | Coach-kontakt + datasamlare |

Min rek (uppdaterad 2026-05-06): **Quick-win + fatigue-lokalisering parallellt.** Quick-win avslöjar var motorn står på skotttyper. Fatigue-lokalisering avslöjar om vi har quality- eller frequency-degradation idag. Båda är förutsatta för resten.

---

*Senast uppdaterad: 2026-05-06.*
