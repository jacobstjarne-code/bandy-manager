# SPEC_LIVEMATCH_REFACTOR

**Datum:** 2026-05-04
**Författare:** Opus
**Mottagare:** Code
**Estimat:** 2-3 dagar
**Status:** Spec-klar
**Beroende:** Inget. Ingen ny feature-utveckling parallellt.

---

## VARFÖR NU

Tre buggar i samma fil i samma session:
- P1.A — cap kringgicks i interaktiva paths
- P4 — portal-event dubbelrendering
- Scoreboard-desync — race mellan timer-effekt och handler-timeouts

Plus två nyupptäckta i playtest 2026-05-04:
- Halvtidsmodalen visades inte (recovery-vakten triggade i ren commentary-mode)
- P1.B per-spelare-cap kringgås — David Eklund gjorde 12 mål i en match där laget gjorde 7

Samtliga lever i samma kluster: `MatchLiveScreen.tsx` (51 KB, ~1900 rader) + `matchCore.ts` (89 KB) interaktioner. Recovery-vakten i commit `9b7526a` är en plåster som maskerar — inte fixar — race-conditionen. Vid varje ny feature-fix förvärras situationen.

**Stop-the-line.** Ingen ny feature-spec, ingen ny bugfix-spec, inget Sprint 28-C, ingen EventCardInline-integration förrän denna refactor är levererad och 30-match-verifierad utan recovery-warnings.

---

## VAD SOM SKA GÖRAS

### Mål 1 — En sanning för match-state

Idag finns `homeScore`/`awayScore`/`playerGoals` i två separata closures + handler-state:

- `simulateMatchCore`-generatorn i `matchCore.ts` har sin egna closure med `homeScore`, `awayScore`, `playerGoals`, `shotsHome`, `shotsAway`, `cornersHome`, `cornersAway`, suspensions etc.
- `MatchLiveScreen.tsx` har sina egna React useState för `currentStep` + härledda värden från `steps[currentStep]`
- De fyra interaktiva handlers (corner/penalty/counter/freekick) skriver direkt till React state via `setSteps`, sen kallar `regenerateRemainderWithUpdatedScore` som startar om matchCore-generatorn med uppdaterad poäng

**Detta är källan till P1.B-bypassen.** När handlers ger spelaren mål går `homeScore` upp i React state, men `playerGoals` i den ursprungliga matchCore-closuren bryr sig inte. Vid regenerate startas en ny generator som börjar om från `playerGoals = {}`. Så Eklund kan ha gjort 4 mål via auto-generator → triggat regenerate → nya generatorn ger honom 4 mål till → triggat regenerate igen → ytterligare 4 mål. P1.B-cap (`if (goalsThisMatch >= 5) return 0`) kollar bara mot den aktuella generatorns räknare, inte det globala state.

**Lösning:** Lyfta match-state till en enda källa. Två alternativ:

**A. Reducer i MatchLiveScreen** (mindre risk, snabbare):
```ts
type MatchState = {
  homeScore: number
  awayScore: number
  playerGoals: Record<string, number>      // global över hela matchen
  playerAssists: Record<string, number>
  playerRedCards: Record<string, number>
  playerSaves: Record<string, number>
  shotsHome: number
  shotsAway: number
  onTargetHome: number
  onTargetAway: number
  cornersHome: number
  cornersAway: number
  homeActiveSuspensions: number
  awayActiveSuspensions: number
}

type MatchAction =
  | { type: 'STEP_DELTA', delta: Partial<MatchState> }      // från generator
  | { type: 'INTERACTIVE_GOAL', clubId: string, playerId: string, isPenalty: boolean }
  | { type: 'INTERACTIVE_SAVE', playerId: string }
  | { type: 'INTERACTIVE_CORNER', clubId: string }
  | { type: 'RESET_FROM_HALFTIME', state: SecondHalfInput }
```

Reducer-state är enda källan. matchCore-generatorn returnerar **deltas**, inte absolut state. Handlers dispatchar interaktiva events. Reducerns cap-logik sitter i ETT ställe — den kollar `playerGoals[id] >= 5` innan den applicerar `INTERACTIVE_GOAL`.

**B. Zustand-slice** (renare, mer arbete): Match-state i gameStore som en match-slice. Generator yield + handlers dispatchar genom store-actions. Bättre för testbarhet men ökar surface-arean.

**Rekommendation: A.** Vi har inte tid att designa ny store-slice. Reducer i MatchLiveScreen löser problemet med minimal risk. Kan lyftas till store senare om behov uppstår.

### Mål 2 — En källa för steg-progression

Idag finns två setCurrentStep-källor:
- Timer-effekten (loop med 25-50ms delay i commentary, 1500ms normal)
- Fyra handler-`setTimeout`s som hoppar steget framåt efter interaktiv resolution

Det är race conditionen. Recovery-vakten i `9b7526a` plåstrar nedströms men löser inte detta.

**Lösning (refactor B från diagnos 2026-05-04):**

Ta bort handler-timeouts. Handlers sätter bara sitt eget interaction-state (`setActiveCorner(null)`, etc) och låter timer-effekten driva steget framåt. Timer-effekten kollar:

```ts
useEffect(() => {
  if (matchDone || isPaused) return
  if (currentStep >= steps.length) return
  if (activeCorner || activePenalty || activeCounter || activeFreeKick) return  // pause for interaction

  const tick = () => setCurrentStep(prev => prev + 1)
  const delay = isFastForward || isCommentaryMode ? 50 : 1500
  const timer = setTimeout(tick, delay)
  return () => clearTimeout(timer)
}, [currentStep, steps.length, matchDone, isPaused, activeCorner, activePenalty, activeCounter, activeFreeKick, isFastForward, isCommentaryMode])
```

En källa. Inga handler-timeouts som konkurrerar.

### Mål 3 — Splitta MatchLiveScreen.tsx

51 KB / ~1900 rader är för mycket. Mönstret från GranskaScreen-splitten:

```
src/presentation/screens/match/
├── MatchLiveScreen.tsx          ~300 rader — top-level orkestrering, layout
├── matchReducer.ts              ~200 rader — state-reducer + cap-logik
├── useMatchTimer.ts             ~80 rader — steg-progression-hook
├── useMatchGenerator.ts         ~150 rader — generator-loop + delta-yield
├── handlers/
│   ├── cornerHandler.ts         ~80 rader
│   ├── penaltyHandler.ts        ~80 rader
│   ├── counterHandler.ts        ~80 rader
│   └── freeKickHandler.ts       ~60 rader
├── components/
│   ├── MatchHeader.tsx          ~100 rader — scoreboard + meta
│   ├── MatchControls.tsx        ~80 rader — pause/FF/taktik/byten-knappar
│   ├── HalftimeModal.tsx        ~150 rader (befintlig fil, flytta hit)
│   └── MatchFeed.tsx            ~120 rader — commentary-feeden
└── recovery.ts                  ~30 rader — den TEMPORÄRA recovery-vakten, för borttagning efter 30-match-verifiering
```

Importer: `import { MatchLiveScreen } from '../screens/match/MatchLiveScreen'`. Path-uppdateringar i `AppRouter.tsx` och eventuella tester.

### Mål 4 — Cap-logik i en sanning

`canScore` i matchCore.ts (rad 383) och `interactiveCanScore` i MatchLiveScreen.tsx (rad 501) är duplicerade implementationer. Lyft till modulnivå i matchCore.ts som exporterad funktion:

```ts
export function canScoreGate(
  homeScore: number,
  awayScore: number,
  attackingHome: boolean,
  totalCap = MATCH_TOTAL_GOAL_CAP,
  diffCap = MATCH_GOAL_DIFFERENCE_CAP,
): boolean {
  if (homeScore + awayScore >= totalCap) return false
  const newDiff = attackingHome ? homeScore + 1 - awayScore : awayScore + 1 - homeScore
  return Math.abs(newDiff) <= diffCap
}
```

`simulateMatchCore` använder den. `matchReducer.ts` importerar den. P1.B per-spelare-cap (5 hard, ×0.7 soft brake från andra målet) flyttas också till en delad funktion:

```ts
export function getGoalScorerWeight(player: Player, currentGoals: number, baseWeight: number): number {
  if (currentGoals >= 5) return 0  // hard cap
  if (currentGoals >= 2) return baseWeight * Math.pow(0.7, currentGoals - 1)
  return baseWeight
}
```

Används både i matchCore `getGoalScorer` OCH när reducer hanterar `INTERACTIVE_GOAL`. Då kan inte handlers ge en spelare hans 12:e mål — de blir blockerade av samma cap som auto-genereringen.

### Mål 5 — Halvtidsmodal-flow säkrad

Idag triggas halvtidsmodalen vid `currentStep === 30 && !inSecondHalf`. Recovery-vakten i `9b7526a` kan sätta `matchDone: true` om `currentStep >= steps.length`. Det betyder att om generatorn av någon anledning yieldar färre än 31 steg i första halvlek (eller race-condition driver step förbi 30 utan att modal-effekten hinner trigga), hoppar matchen direkt till slutet.

Lösningen ligger till stor del i mål 2 — utan handler-timeout-konkurrens triggas modalen pålitligt. Men lägg också en explicit guard:

```ts
useEffect(() => {
  if (currentStep >= 30 && !inSecondHalf && !halftimeModalShown) {
    setHalftimeModalShown(true)
    setIsPaused(true)  // pausa timer-effekten tills modal stängs
  }
}, [currentStep, inSecondHalf, halftimeModalShown])
```

Halftimemodalen får sitt eget state. Stängs den utan beslut → resume utan tactic-changes (samma som idag).

---

## ORDNING

1. **Steg 1 — Skapa `matchReducer.ts`.** Skriv reducer + actions + initial state. Ingen UI-koppling än. Skriv 5-10 enhetstester som verifierar:
   - `STEP_DELTA` ackumulerar korrekt
   - `INTERACTIVE_GOAL` blockeras vid `playerGoals[id] >= 5`
   - `INTERACTIVE_GOAL` blockeras vid total cap
   - `INTERACTIVE_GOAL` blockeras vid diff cap
   - `RESET_FROM_HALFTIME` återställer rätt fält men behåller per-spelare-räknare

2. **Steg 2 — Lyft `canScoreGate` och `getGoalScorerWeight` till exports i matchCore.ts.** Refactora `simulateMatchCore` att använda dem. Inga utfallsändringar — endast mekanisk lyft. Verifiera med stress-test att mål/match är oförändrat.

3. **Steg 3 — Splitta `MatchLiveScreen.tsx`.** Ren mekanisk split enligt fil-struktur ovan. Ingen logikändring. Verifiera att appen startar och att en match går igenom.

4. **Steg 4 — Byt MatchLiveScreen state till reducer.** Generator-yields översätts till `STEP_DELTA`. `homeScore`/`awayScore` läses från reducer-state istället för `steps[currentStep]`. Detta är den största ändringen — testa noga.

5. **Steg 5 — Refactor B i timer-progression.** Ta bort handler-timeouts. Timer-effekten ensam driver steget. Handlers sätter bara interaction-state till null + dispatchar reducer-action.

6. **Steg 6 — 30-match-playtest-verifiering.** Spela 30 matcher (kombinera league + cup, med och utan FF, med och utan commentary). Console-log alla recovery-warnings. Kontrollpunkter:
   - Inga "Recovery: currentStep passed steps.length"-warnings
   - Halvtidsmodalen triggas i 100% av matcher (ej i extra-tid/straffar)
   - Ingen spelare gör fler mål än lagets totala mål
   - Ingen spelare gör fler än 5 mål per match
   - Cap-brott (diff > 6) = 0

7. **Steg 7 — Ta bort recovery-vakten i `9b7526a`** efter steg 6 är godkänt. Commit: `chore: remove TS-10 recovery guard — race condition resolved by livematch refactor`.

---

## ROLLBACK-STRATEGI

Hela refactorn på en feature-branch (`refactor/livematch-split`). Mergas till main först efter steg 6. Om något går fel under playtest — revert hela branchen, recovery-vakten finns kvar, vi förlorar bara refactor-tiden, inte spelet.

---

## INTE I SCOPE

- matchCore.ts splittas INTE i denna sprint. Det är TS-9 + TS-11 (eller liknande). Cap-funktionerna lyfts till exports men 89 KB-filen kvarstår.
- Ingen ny commentary-pool, ingen ny event-typ, ingen visuell ändring av MatchLiveScreen UI.
- Ingen ändring av matchEngine.ts (sim-modeen) — den använder samma matchCore men har ingen interaktion, så race condition träffar inte.

---

## EFTER LEVERANS

- Diagnos-fil `docs/diagnos/2026-05-04_player_goal_cap_bypass.md` skriven av Code som del av analysen i steg 1.
- LESSONS.md ny lärdom: "Two-source-of-truth state mellan generator-closure och React state ger cap-bypass + race conditions. EN sanning per state-fält."
- KVAR.md: TS-10 markeras ✅ (recovery-vakten borttagen). TS-9 markeras delvis ✅ (split steg 1, full split parkerad).
- HANDOVER skriven av Code med 30-match-verifierings-resultat.
