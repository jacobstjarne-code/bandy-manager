# SPRINT 25b.2 — Höj utvisnings-basfrekvens

**Datum:** 2026-04-21 (förmiddag)
**Trigger:** Sprint 25b.1 separerade straff från utvisningar. Alla foul-sekvens-fouls blir nu utvisningar. Resultatet blev `avgSuspensionsPerMatch` 0.47 → 0.82 — bekräftar att motorn nu producerar utvisningar korrekt men basfrekvensen är ~4.6x för låg mot target 3.77. Rotorsak: `foulProb * 0.55`-multiplikatorn och/eller `wFoul = 12`-vikten i sequence-viktningen är kalibrerade för ett förutspel där straff tog 42% av utslagen. Nu när 100% blir utvisningar måste basfrekvensen justeras.

**Scope:** EN fil. `src/domain/services/matchCore.ts`. Två kandidatknappar att skruva på: `wFoul` i `buildSequenceWeights` och/eller `0.55`-multiplikatorn i `foulThreshold`-beräkningen.

---

## BAKGRUNDSSIFFROR

**Bandygrytan (SCORELINE_REFERENCE.md):**
- Genomsnitt: 3.77 utvisningar/match
- Normaliserat: 22.5/kmin ledning, 22.5/kmin underläge, 19.6/kmin jämnt (nästan jämnt)
- Tidsberoende: 12/kmin tidigt → 27/kmin sent (redan kalibrerat via `SUSP_TIMING_BY_PERIOD`)

**Motorn (efter 25b.1):**
- `avgSuspensionsPerMatch` = 0.82
- Gap till target: 4.6x
- Alla triggers sker via `seqType === 'foul'` med sannolikhet `foulProb * 0.55 * suspMod * SUSP_TIMING * derbyFoulMult * activeFoulMult`

**Referens — hur mycket av matchen är foul-sekvenser:**
Sequence-viktning i `buildSequenceWeights`:
```
wAttack = 40    (+ press/tempo/mentality-mods)
wCorner = 40
wTransition = 15
wFoul = 12      ← denna
wHalfchance = 10
wLostball = 8
wPlayerDuel = 6
wFreekick = 5
wAtmosphere = 5
wTacticalShift = 4
wOffside = 4
```
Total ≈ 149. wFoul = 12 = **8% av stegen är foul-sekvenser**.

Över 60 steg per match = ~4.8 foul-sekvenser/match. Av dessa blir ca 17% till faktiska utvisningar (0.82 / 4.8). Resten faller genom p.g.a. `foulProb < threshold`.

---

## VAL AV STRATEGI

**Två kandidater, olika egenskaper:**

### Strategi A — Höj `wFoul` från 12 till ~52

**Effekt:** Fyrdubblar antalet foul-sekvenser per match. Konverterings-andelen (17%) förblir samma. Utvisningsfrekvens 0.82 × 4.5 ≈ 3.7.

**Risk:** Rubbar sequence-viktningen i matchen. Färre attacks/corners/transitions relativt sett. Kan påverka `goalsPerMatch`, `cornerGoalPct`, shots-per-match.

### Strategi B — Höj `foulThreshold`-multiplikatorn från 0.55 till ~2.53

**Effekt:** Konverterings-andelen går från 17% till ~76%. Antalet foul-sekvenser oförändrat. Utvisningsfrekvens 0.82 × 4.5 ≈ 3.7.

**Risk:** Vid samma antal sekvenser men mycket högre konvertering blir utvisningstajming mer klumpad. Varje foul-sekvens blir en nära-säker utvisning. Mindre slumpmässighet.

### Strategi C (REKOMMENDERAD) — Dela mellan båda

Höj `wFoul` 12 → 24 (2x) OCH höj multiplikator 0.55 → 1.25 (2.27x). Total effekt: 2 × 2.27 = 4.54x ≈ target.

**Motivation:** Balanserar mellan att öka matchens foul-aktivitet (fler sekvenser att observera) och att göra varje sekvens mer betydelsefull. Mindre störning på andra måttvärden än ren A eller ren B.

---

## ÄNDRINGAR

### Ändring 1 — `wFoul` i `buildSequenceWeights`

Ungefär rad 950 i matchCore.ts.

```ts
// FÖRE:
let wFoul         = 12

// EFTER:
let wFoul         = 24
```

### Ändring 2 — `foulThreshold`-multiplikator

Ungefär rad 1005 i matchCore.ts, i `seqType === 'foul'`-blocket.

```ts
// FÖRE:
const foulThreshold = foulProb * 0.55 * phaseConst.suspMod * SUSP_TIMING_BY_PERIOD[period] * derbyFoulMult * activeFoulMult

// EFTER:
const foulThreshold = foulProb * 1.25 * phaseConst.suspMod * SUSP_TIMING_BY_PERIOD[period] * derbyFoulMult * activeFoulMult
```

---

## VAD SOM INTE RÖRS

- `SUSP_TIMING_BY_PERIOD` — redan kalibrerat mot bandygrytan-data
- `phaseConst.suspMod` — slutspels-multiplikator, ligger inom rimligt intervall
- `derbyFoulMult` — rivalitets-logik, oförändrad
- `activeFoulMult` (homeMode/awayModeFoulMult) — 2:a-halvlek-logiken från 25a.2, oförändrad
- `attDiscipline` / `defDiscipline` — spelarspecifika input, oförändrade
- `getDefendingPlayer` — profilviktad selection, oförändrad
- Straff-triggern i attack-sekvensen (Sprint 25b.1) — oförändrad
- Alla andra konstanter i matchCore

---

## FÖRVÄNTAT RESULTAT

| Mått | Före (25b.1) | Target | Acceptabelt efter 25b.2 |
|---|---|---|---|
| `avgSuspensionsPerMatch` | 0.82 | 3.77 | **3.3 – 4.3** |
| `penaltyGoalPct` | 3.7% | 5.4% | **3.5 – 5.5%** (bör vara oförändrat, straff är separat trigger) |
| `goalsPerMatch` | 10.02 | 9.12 | **9.3 – 10.2** (sekvens-omfördelning kan sänka något) |
| `cornerGoalPct` | ~26% | 22.2% | **23 – 27%** (mindre corners-share men inte dramatiskt) |
| `htLeadWinPct` | 83.8% | 46.6% | **70 – 82%** (fler utvisningar → mer PP → comebacks ökar) |
| Comeback −1 | 18.2% | 24.5% | **19 – 24%** |

**Sanity-check:**
- `wFoul` 12 → 24 ger share: 24/(149-12+24) = 14.9% (från 8.1%)
- 60 steps × 14.9% ≈ 8.9 foul-sekvenser/match
- Konverterings-andel: 0.82 / (60 × 0.081) = ~17% i nuläget
- Med multiplikator 1.25/0.55 = 2.27x → konvertering ~38%
- Förväntat: 8.9 × 0.38 = ~3.4 utvisningar/match → inom target-intervallet

**Om mätningen visar:**
- < 2.5 utvisningar/match → höj multiplikator från 1.25 → 1.6 i 25b.2.2
- > 4.5 utvisningar/match → sänk multiplikator från 1.25 → 0.95 i 25b.2.2
- Inom 3.3-4.3 → klart, gå vidare till 25d

---

## LEVERANSORDNING

1. **Läs och verifiera** matchCore.ts — bekräfta att rad-exakta siffrorna i specen matchar faktisk kod (kan ha flyttats efter 25b.1-ändringarna).

2. **Ändring 1** — Höj `wFoul` 12 → 24.
   - Commit: `feat(matchCore): double foul sequence weight for suspension calibration`
   - `npm test`

3. **Ändring 2** — Höj `foulThreshold`-multiplikator 0.55 → 1.25.
   - Commit: `feat(matchCore): raise foul threshold multiplier 0.55 → 1.25`
   - `npm test`

4. **Kör mätning:**
   ```
   npm run build
   npm run stress
   npm run analyze-stress
   ```

5. **Spara** mätrapport som `docs/sprints/SPRINT_25B_2_MEASUREMENT.md`.

6. **Audit** `docs/sprints/SPRINT_25B_2_AUDIT.md` med:
   - Före/efter för alla 6 mått i tabellen ovan
   - Eventuella oväntade sido-effekter (`drawPct`, `awayWinPct`, shots/match)
   - Om resultatet landar utanför acceptabelt intervall → flagga för 25b.2.2-justering

---

## VIKTIGT

- Ändra **bara** dessa två knappar. Andra motorkonstanter ska vara orörda.
- Om testerna faller: STOPP. Rapportera vilka. Tester kan ha testat utvisningsfrekvenser mot tidigare värden — behöver uppdateras.
- Om resultatet blir mycket högre än förväntat (t.ex. 6+ utvisningar/match) — backa båda ändringarna och rapportera innan ny körning.
- Ingen kalibrering ska ske av `wFoul`-mods (tempo/press-additiver runt rad 960) — de är relativa till baseline och följer med automatiskt.
- Flera metrics mäts — viktigaste är `avgSuspensionsPerMatch`. Övriga kan avvika något utan att det är regression så länge `goalsPerMatch` stannar under 10.5.
