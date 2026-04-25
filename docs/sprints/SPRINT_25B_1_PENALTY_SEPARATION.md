# SPRINT 25b.1 — Separera straff till egen trigger

**Datum:** 2026-04-21 (förmiddag)
**Trigger:** Sprint 24.2-mätning visar motorn genererar 0.14 straffar/kmin (0.25% av mål) mot bandygrytans 2.7 straffar/kmin (5.4% av mål). 19x gap. Rotorsak: straff genereras idag som bi-produkt av `seqType === 'foul'` med 42% av alla fouls som straff — vilket är orimligt högt. Straff är i verkligheten ett separat fenomen, chans-drivet snarare än discipline-drivet.

**Scope:** EN fil, två mekanism-ändringar. `src/domain/services/matchCore.ts`.

**Detta är del 1 av två i Sprint 25b-serien:**
- **25b.1** (denna): Separera straff från foul-sekvens → egen trigger i attack/corner-sekvenser
- **25b.2**: Höj basfrekvens för utvisningar (efter 25b.1 när foul-mekanismen är ren)

---

## BAKGRUNDSSIFFROR (SCORELINE_REFERENCE.md)

**Straff-frekvens per spelläge (bandygrytan):**
- Ledning: 3.04 straffar/kmin
- Jämnt: 2.57 straffar/kmin  
- Underläge: 2.53 straffar/kmin
- **Snitt: ~2.7 straffar/kmin ≈ 0.24 straffar per 90-minutersmatch**
- Med 70% konvertering: ~0.17 straffmål/match → 5.4% av 9.12 mål = 0.49 straffmål/match

**Periodfördelning:**
- 0-14: 8.8%
- 15-29: 14.2%
- 30-44: 14.4%
- 45-59: 17.3%
- 60-74: 15.6%
- **75-89: 22.5%** (1.35x baseline)
- 90+: 7.3%

**Motorn idag (stress-mätning):** 0.14 straffmål/kmin = 0.013/match. 19x för låg.

---

## ROTORSAKSANALYS

Nuvarande kod (matchCore.ts, `seqType === 'foul'`-blocket):

```ts
if (seqType === 'foul') {
  const foulProb = attDiscipline * 0.4 + defDiscipline * 0.3
  const foulThreshold = foulProb * 0.55 * phaseConst.suspMod 
                      * SUSP_TIMING_BY_PERIOD[period] * derbyFoulMult * activeFoulMult
  
  if (r < foulThreshold) {
    const isAttackZoneFoul = rand() < 0.70      // 70% fouls i attack-zon
    const isPenalty = isAttackZoneFoul && rand() < 0.60  // 60% av dem blir straff
    
    if (isPenalty) { /* straff */ }
    else { /* utvisning */ }
  }
}
```

**Fel 1:** Straff är kopplat till utvisnings-mekaniken. Höjer vi foul-frekvensen 9x för att nå utvisnings-target, höjs straff också 9x. Mekaniken är sammankopplad när den borde vara separat.

**Fel 2:** 42% straff-andel (70% × 60%) är orimligt. Bandygrytan säger straff är ~5.4% av mål och utvisning är ~3.77/match → straff utgör ~13% av alla utvisnings-liknande incidenter, inte 42%.

**Fel 3:** Straff triggas bara i foul-sekvens (8% av steps). I verkligheten kommer straff primärt i attack- och corner-sekvenser där målchans redan finns.

---

## ÄNDRINGAR

### Ändring 1 — Ta bort straff ur foul-sekvensen

**Fil:** `src/domain/services/matchCore.ts`, `seqType === 'foul'`-blocket.

```ts
// FÖRE:
if (r < foulThreshold) {
  const isAttackZoneFoul = rand() < 0.70
  const isPenalty        = isAttackZoneFoul && rand() < 0.60
  
  if (!isFast && isAttackZoneFoul && !isPenalty && interactiveFreeKicksUsed < 1 && rand() < 0.15) {
    // Free kick interaction logic (behåll)
  }
  
  if (isPenalty) {
    /* hela straff-blocket — ta bort helt */
  } else {
    /* utvisnings-block (behåll) */
  }
}

// EFTER:
if (r < foulThreshold) {
  const isAttackZoneFoul = rand() < 0.70
  
  if (!isFast && isAttackZoneFoul && interactiveFreeKicksUsed < 1 && rand() < 0.15) {
    // Free kick interaction logic (behåll oförändrad)
  }
  
  // Alla fouls här blir nu utvisningar — straff hanteras separat i attack/corner
  {
    /* utvisnings-block (behåll oförändrat) */
  }
}
```

**Netto-effekt:** Alla fouls i foul-sekvensen blir nu utvisningar. Utvisnings-andelen av seqType='foul' går från 30% till 100%. Det **tredubblar** effektivt utvisningsfrekvensen — viktigt att komma ihåg för 25b.2-kalibrering.

### Ändring 2 — Lägg till straff-trigger i attack-sekvensen

**Fil:** `src/domain/services/matchCore.ts`, `seqType === 'attack'`-blocket.

Straff triggas innan normal chance-resolution, men bara vid höga `chanceQuality`-värden (nära-målchanser är där fouls i straffområdet sker).

```ts
} else if (seqType === 'attack') {
  const base         = attAttack * 0.6 - defDefense * 0.4 + randRange(rand, -0.2, 0.2)
  const chanceQuality = clamp(base * 1.2 + 0.15 + 0.15 + derbyChanceMult, 0.05, 0.95)

  // NEW: Penalty trigger before shot resolution
  // Targeting 0.24 penalties per 90-min match (bandygrytan 2.7/kmin)
  // With ~20 attack-sequences/match and peak in final period, base = 0.009
  // Period multiplier: late minutes get 1.35x boost
  if (chanceQuality > 0.40) {
    const periodPenaltyMod = getPenaltyPeriodMod(minute)
    const scorelinePenaltyMod = getScorelinePenaltyMod(
      isHomeAttacking ? homeScore - awayScore : awayScore - homeScore
    )
    const penaltyTriggerProb = 0.012 * periodPenaltyMod * scorelinePenaltyMod
    
    if (rand() < penaltyTriggerProb) {
      /* triggra straff-hantering */
      /* återanvänd existerande logik från foul-blocket */
      continue  // hoppa över normal attack-resolution — straffen ersatte chansen
    }
  }

  // (existerande attack-logik fortsätter)
  if (chanceQuality > 0.10) {
    // ... oförändrad
  }
}
```

### Ändring 3 — Period- och spellägeshjälpare

Nya funktioner kalibrerade mot SCORELINE_REFERENCE.md:

```ts
// Tidsbaserad förstärkning — sena minuter har 1.35x frekvens
function getPenaltyPeriodMod(minute: number): number {
  if (minute < 15) return 0.55    // 8.8% / 16.7% average
  if (minute < 30) return 0.89    // 14.2% / 16.0%
  if (minute < 45) return 0.90    // 14.4%
  if (minute < 60) return 1.08    // 17.3%
  if (minute < 75) return 0.98    // 15.6%
  if (minute < 90) return 1.35    // 22.5% — peak
  return 0.73                      // 7.3% overtime
}

// Spellägesbias — ledning ger något fler straffar (defensiva fouls)
// Ledning 3.04 / Snitt 2.71 = 1.12
// Jämnt 2.57 / Snitt 2.71 = 0.95
// Underläge 2.53 / Snitt 2.71 = 0.93
function getScorelinePenaltyMod(diff: number): number {
  if (diff > 0) return 1.12   // leading (attacker perspective)
  if (diff === 0) return 0.95  // tied
  return 0.93                  // trailing
}
```

**Viktigt:** `diff` här är från det **attackerande lagets** perspektiv. Om hemmalaget attackerar och leder → diff > 0. Variabeln `isHomeAttacking` i attack-blocket avgör vilken signal som används.

### Ändring 4 — Straff-hantering som återanvänds

Ta straff-hanterings-blocket som tidigare fanns i `seqType === 'foul'`-blocket (interactive penalty + AI penalty resolution) och bryt ut till en funktion:

```ts
function resolvePenaltyTrigger(
  attackingStarters: Player[],
  defendingStarters: Player[],
  isHomeAttacking: boolean,
  minute: number,
  attackingClubId: string,
  // ... resten av argumenten som straff-blocket använder
): {
  scored: boolean
  scorerPlayerId?: string
  events: MatchEvent[]
  penaltyInteractionData?: PenaltyInteractionData
  penaltyCauseText?: string
} {
  // Befintlig straff-logik, återanvänd 1:1
}
```

**Varför funktion:** Straff triggas nu från minst två platser (attack-sekvens + eventuellt corner-sekvens om vi utvidgar). Dry-koden gör båda konsistenta.

### Ändring 5 — Mål-flagga

I straff-hanterings-blocket, när straffen går in: markera mål-eventet med `isPenaltyGoal: true`. Detta finns som flagga i MatchEvent redan men kolla att det fylls i:

```ts
// FÖRE (troligt):
const ge: MatchEvent = { 
  minute, 
  type: MatchEventType.Goal, 
  clubId: attackingClubId, 
  playerId: shooter.id, 
  description: `Straffmål av ${shooter.firstName} ${shooter.lastName}`
}

// EFTER:
const ge: MatchEvent = { 
  minute, 
  type: MatchEventType.Goal, 
  clubId: attackingClubId, 
  playerId: shooter.id, 
  description: `Straffmål av ${shooter.firstName} ${shooter.lastName}`,
  isPenaltyGoal: true,  // NEW — tracking-flagga
}
```

**Verifiera** att `MatchEvent`-interface i `Fixture.ts` redan har `isPenaltyGoal?: boolean`. Om inte: lägg till.

---

## VAD SOM INTE RÖRS

- `getSecondHalfMode` — oförändrad
- `trailingBoost`, `chasingThreshold` — oförändrade
- `PROFILE_GOAL_MODS`, `SECOND_HALF_BOOST` — oförändrade
- `wFoul`, `foulProb * 0.55`-multiplikator — ORÖRDA (det är 25b.2)
- `SUSP_TIMING_BY_PERIOD` — orörd
- `cornerBase`, `cornerClampMax` — orörda
- `homeAdvantage = 0.14` — oförändrad
- `matchEngine.ts`, `matchUtils.ts`, `tacticModifiers.ts` — orörda

---

## FÖRVÄNTAT RESULTAT

| Mått | Före (stress) | Target | Acceptabelt efter 25b.1 |
|---|---|---|---|
| `penaltyGoalPct` | 0.25% | 5.4% | **3.0 – 7.0%** |
| Straffar/match | ~0.02 | ~0.24 | **0.18 – 0.30** |
| Straffmål/match | ~0.013 | ~0.49 | **0.13 – 0.20** (70% konvert) |
| `avgSuspensionsPerMatch` | 0.47 | 3.77 | **1.3 – 1.5** (3x från att alla fouls blir utvisning, fortfarande långt från 3.77) |
| `goalsPerMatch` | 10.13 | 9.12 | **10.0 – 10.3** (marginell förändring) |

**Sanity-check på straffsannolikhet:**
- Attack-sekvenser per match ≈ 60 (40% av 150 steps)
- `chanceQuality > 0.40` triggar ≈ 50% av dem → 30 potentiella straff-triggar
- Base 0.012 × snitt-mod 1.0 × snitt-scoreline 1.0 = 0.012
- 30 × 0.012 = 0.36 straffar/match
- Med 70% konvertering = 0.25 straffmål/match
- Target är 0.49 straffmål/match → vi är lite låga, men inom acceptabelt intervall

Om mätningen visar < 0.13 straffmål/match → höj base från 0.012 → 0.018 i 25b.1.2. Om > 0.25 → sänk.

---

## LEVERANSORDNING

1. **Läs och verifiera** matchCore.ts `seqType === 'foul'`-blocket och `seqType === 'attack'`-blocket. Identifiera var straff-hanteringen ligger nu.

2. **Ändring 1** — Ta bort isPenalty-logiken ur foul-sekvensen. Behåll utvisnings-blocket.
   - Commit: `refactor(matchCore): remove penalty from foul sequence`
   - `npm test`

3. **Ändring 4** — Bryt ut straff-hanteringen till `resolvePenaltyTrigger`-funktion.
   - Commit: `refactor(matchCore): extract resolvePenaltyTrigger helper`
   - `npm test`

4. **Ändringar 2+3+5** — Lägg till period/scoreline-hjälpare, trigga straff i attack-sekvensen, sätt isPenaltyGoal-flagga.
   - Commit: `feat(matchCore): standalone penalty trigger in attack sequences`
   - `npm test`

5. **Verifiera MatchEvent-interface** har `isPenaltyGoal?: boolean`. Om inte, lägg till.
   - Commit (om behövs): `feat(Fixture): add isPenaltyGoal flag to MatchEvent`

6. **Kör mätning:**
   ```
   npm run stress
   npm run analyze-stress
   ```

7. **Spara** mätrapporten som `docs/sprints/SPRINT_25B_1_MEASUREMENT.md`.

8. **Audit** `docs/sprints/SPRINT_25B_1_AUDIT.md` med:
   - Före/efter för `penaltyGoalPct`, straffar/match, straffmål/match
   - Förändring på `avgSuspensionsPerMatch` (förväntad: 3x höjning från 0.47 till ~1.4)
   - Förändring på `htLeadWinPct` och comeback-siffror (eventuell sido-effekt)
   - Om straff-siffrorna landar utanför acceptabelt intervall → flagga för 25b.1.2-justering

---

## VIKTIGT

- Straff-triggern i attack-sekvensen ska använda `continue` för att hoppa över normal attack-resolution i den step:en. Annars får vi dubbelt målförsök per step.
- Straff-mål triggar samma tracking som andra mål (`trackGoal(shooter.id)`). Kontrollera att detta sker i `resolvePenaltyTrigger`.
- `isPenaltyGoal: true` måste sättas på Goal-eventet. Annars fångar inte stress-mätningen straffmålen.
- Om straff går miste (missad/räddad): INGEN Goal-event, ingen isPenaltyGoal-flagga.
- Rör inga andra motorkonstanter.
