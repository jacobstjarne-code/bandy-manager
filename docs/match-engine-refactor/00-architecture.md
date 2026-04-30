# Matchmotor-refactor — Arkitektur

## Utgångsläge: var befintlig motor anropas

**Snabbsim (AI-matcher och managed clubs headless):**

```
roundProcessor.ts:148
  → simulateRound()          (processors/matchSimProcessor.ts:42)
    → simulateMatch()        (domain/services/matchSimulator.ts:11 → matchEngine.ts:20)
      → simulateFirstHalf()  (matchCore.ts:1657)
      → simulateSecondHalf() (matchCore.ts:1668)
```

`matchSimProcessor.ts` rad 256 sätter `baseAdv`:
```ts
const baseAdv = homeClub?.hasIndoorArena ? 0.14 * 0.85 : 0.14
```
Rad 270–286 anropar `simulateMatch` med fullständigt input-objekt.

**Live-match (MatchLiveScreen):**

```
MatchLiveScreen.tsx:162
  → simulateMatchStepByStep()  (matchSimulator.ts:13 → matchCore.ts:simulateFirstHalf)
  → simulateSecondHalf()       (matchSimulator.ts:13 → matchCore.ts:simulateSecondHalf)
  → simulateFromMidMatch()     (matchSimulator.ts:13 → matchCore.ts:simulateFromMidMatch)
```

**Nuvarande exports från `matchSimulator.ts`:**
```ts
export { simulateMatch } from './matchEngine'
export { simulateFirstHalf as simulateMatchStepByStep, simulateSecondHalf, simulateFromMidMatch } from './matchCore'
```

`matchSimulator.ts` är re-export-nod. Konsumentfiler (`matchSimProcessor.ts`,
`MatchLiveScreen.tsx`) importerar alltid därifrån. Refactorn rör inte
dessa konsumenter.

---

## Tre lager

Befintlig `matchCore.ts` blandar fysik, event-emission och narrativ i en
generator. Det är rotorsaken till managed-gating (LESSONS.md #15), fel
hävstång (LESSONS.md #23) och tracking-förlust (LESSONS.md #19, #20).
Refactorn separerar dem i existerande filer.

```
┌─────────────────────────────────────────────────────┐
│  narrativ-lager                                     │
│  matchCommentary, matchMoodService, interaktion     │
│  — kan läsa motorns output, skriver ingen fysik     │
│  — FÅR vara managed-gated                           │
└────────────────────────┬────────────────────────────┘
                         │ läser MatchEvent[]
┌────────────────────────▼────────────────────────────┐
│  event-lager                                        │
│  emitterar MatchEvent med PERSISTENT/TRANSIENT-     │
│  taggning (LESSONS.md #20)                          │
│  — yield aldrig hoppas över med continue (LESSONS   │
│    #19)                                             │
└────────────────────────┬────────────────────────────┘
                         │ PhysicsStep → events
┌────────────────────────▼────────────────────────────┐
│  fysik-lager                                        │
│  frekvenser, mål, hörnor, utvisningar, straffar     │
│  — ren TypeScript, inga bieffekter                  │
│  — INGA managed-gates (LESSONS.md #15)              │
│  — per-lag-beräkningar, inte per-match              │
└─────────────────────────────────────────────────────┘
```

---

## Refactor-sekvens: vad som flyttas vart, i vilken ordning

Allt sker i existerande filer. Inga nya motorfiler skapas förutom
`matchConstants.ts` i etapp 04.

### Etapp 01 — Fysikfunktioner extraheras ur generatorn

`simulateMatchCore` i `matchCore.ts` är en generator som idag kör allt
i ett flöde. Etapp 01 lyfter ut fysiklogiken till separata funktioner i
samma fil.

**Flytta ut:**

```
matchCore.ts::simulateMatchCore  (generator, idag ~400 rader)
  → ny funktion: computeStepPhysics(step, homeState, awayState, rng): StepPhysicsResult
      — sekvensfrekvenser, chansberäkning, mål-resolution
      — inga managed-gates
      — tar homeState och awayState som separata argument, inte managed/opponent
  → ny funktion: applySecondHalfMode(score, opponentScore, step, phase): SecondHalfMode
      — ersätter det managed-gatade blocket (LESSONS.md #15)
      — anropas för hemmalaget OCH bortalaget separat
```

`simulateMatchCore`-generatorn anropar de nya funktionerna men ansvarar
inte längre för fysiken — den orkestrerar.

**Managed-gate-check efter etapp 01:**
```bash
grep -n "managedIsHome" src/domain/services/matchCore.ts
# Ska ge 0 träffar i computeStepPhysics och applySecondHalfMode
# Träffar i generatorns narrativ-del är acceptabla tills etapp 03
```

### Etapp 02 — Event-lagret städas

Fortfarande i `matchCore.ts`, men nu med fokus på event-emissionen.

**Åtgärder:**

- Lägg till `PERSISTENT_EVENTS` och `TRANSIENT_EVENTS` som konstanter
  i `matchCore.ts` (eller importera från `matchUtils.ts`)
- Identifiera varje `continue`-sats i generatorn och ersätt med
  flagga-mönster (LESSONS.md #19) så att `yield` alltid nås
- Verifiera att stats-tracking enbart läser flaggor på persistenta events
  (`ev.isPenaltyGoal`, `ev.isCornerGoal`) — inte Penalty/Corner/Assist-events
  direkt (LESSONS.md #20)

**Verifiering:**
```bash
grep -n "continue" src/domain/services/matchCore.ts
# Ska ge 0 träffar i generator-loopen efter etapp 02
```

### Etapp 03 — Narrativ-lager separeras

Commentary-anrop och matchMoodService-anrop lyfts ur fysikloopen.

**Flytta ut:**

```
matchCore.ts::simulateMatchCore
  → ny funktion: resolveStepNarrative(physicsResult, matchContext, managedIsHome): StepNarrative
      — plockar commentary-texter baserat på physics-output
      — anropar matchMoodService
      — FÅR vara managed-gated (det är narrativ, inte fysik)
```

Generatorn anropar `resolveStepNarrative` efter `computeStepPhysics` och
innan `yield`. Yield-objektet innehåller både physics-events och narrativ-output.

**Verifiering:**
```bash
grep -n "matchCommentary\|matchMoodService\|getCommentary" src/domain/services/matchCore.ts
# Träffar ska bara finnas i resolveStepNarrative, inte i computeStepPhysics
```

### Etapp 04 — Delad konstantfil

Ny fil: `src/domain/services/matchConstants.ts`

```ts
// matchConstants.ts
export const HOME_ADVANTAGE_BASE = 0.14
export const HOME_ADVANTAGE_INDOOR_FACTOR = 0.85
// ... övriga motorparametrar som kalibreringsskriptet idag hårdkodar
```

`matchCore.ts` och `matchSimProcessor.ts` importerar från `matchConstants.ts`.
`calibrate_v2.ts` importerar från `matchConstants.ts`.

Hårdkodade värden i kalibreringsskriptet raderas. Divergens ger
kompileringsfel innan kalibreringen körs.

---

## Invarianter med grep-kommandon (uppdateras per etapp)

**Inga managed-gates i fysikfunktioner (gäller från etapp 01):**
```bash
grep -n "managedIsHome\|managedClubId" src/domain/services/matchCore.ts
# Träffar accepterade i: resolveStepNarrative, generator-orkestrering
# Träffar INTE accepterade i: computeStepPhysics, applySecondHalfMode
```

**Ingen `continue` före `yield` i generator (gäller från etapp 02):**
```bash
grep -n "continue" src/domain/services/matchCore.ts
# Ska returnera 0 i generator-loopen
```

**Narrativ separerat från fysik (gäller från etapp 03):**
```bash
grep -n "matchCommentary\|getCommentary\|matchMoodService" src/domain/services/matchCore.ts
# Träffar enbart i resolveStepNarrative
```

**Konstanter inte hårdkodade i kalibreringsskript (gäller från etapp 04):**
```bash
grep -n "homeAdvantage\s*[=:]\s*0\.\|baseAdv\s*=" scripts/calibrate_v2.ts
# Ska returnera 0 — värdet importeras från matchConstants.ts
```

---

## Formulastruktur (oförändrad genom refactorn)

```
goalThreshold = clamp(
  (cornerChance - defenseResist) * 0.30 * stepGoalMod * cornerStateMod + cornerBase,
  clampMin, clampMax
)
```

`cornerBase` dominerar i normalfallet. `cornerStateMod` multiplicerar bara
delta-termet — fel hävstång (LESSONS.md #23). Om `cornerGoalMod` införs som
direktskalar på `cornerBase` görs det i etapp 01 som en del av
`computeStepPhysics`, inte som en separat pass.

Innan ny modifierare specas: logga delta-term vs `cornerBase` för 100
slumpmässiga hörnsituationer och kontrollera vilket som dominerar.

---

## Kalibreringspipeline (oförändrad struktur)

```
matchEngine.ts::simulateMatch (headless, via matchSimulator.ts)
  → kör ≥1000 matcher
  → producerar season_stats.json
  → analyze-stress.ts jämför mot bandygrytan_detailed.json (sektioner A–G)
  → rapport: docs/match-engine-refactor/calibration_etapp_NN.md
```

Efter etapp 04 importerar `calibrate_v2.ts` konstanter från
`matchConstants.ts`. Skriptet och motorn kör med identiska värden.
