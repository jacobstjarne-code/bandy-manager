# Diagnos: P1.B — Per-spelare cap bypass (playerGoals)

**Datum:** 2026-05-04  
**Symptom:** David Eklund (och andra spelare) kunde göra 12 mål i matcher där laget
totalt gjorde 7. Cap-kontrollen `if (goalsThisMatch >= 5) return 0` verkade inte fungera.

---

## Rotorsak: Two-source-of-truth mellan generator-closure och React state

`simulateMatchCore`-generatorn i `matchCore.ts` håller sin egna closure med
`playerGoals: Record<string, number>`. React-sidan håller `steps: MatchStep[]` —
men `MatchStep` innehåller inte `playerGoals` (bara `homeScore`/`awayScore`/events).

### Väg till bypass

1. Auto-generator ger spelare 4 mål (generator-closure: `playerGoals[id] = 4`)
2. Interaktiv hörna triggas — `handleCornerChoice` anropas
3. Handler ser mål-event, kallar `regenerateRemainderWithUpdatedScore(newHome, newAway, atStep)`
4. `regenerateRemainderWithUpdatedScore` startar en **ny generator** med `seed: Date.now()`
5. Nya generatorn börjar med `playerGoals = {}` — nollställt!
6. Ny generator ger spelaren 4 mål till (generator ser bara sin closure)
7. Ännu en interaktion → ytterligare regenerate → ytterligare 4 mål
8. Slutresultat: 4 + 4 + 4 = 12 mål, laget totalt 7

### Varför cap-kontrollen inte hjälpte

Cap-kontrollen i `simulateMatchCore` (rad ~484):
```ts
if (goalsThisMatch >= 5) return 0
```
... kollar mot `goalsThisMatch` i DEN AKTUELLA generatorns closure. Varje ny
generator startar från 0. Kontrollen fungerar korrekt inom varje generator-körning
men inte globalt över hela matchen.

---

## Lösning: matchReducer med global playerGoals (steg 1 + 4)

`matchReducer.ts` håller `playerGoals: Record<string, number>` som bevaras över
hela matchen — inklusive alla regenerate-faser. `INTERACTIVE_GOAL`-action kollar:

```ts
const currentGoals = state.playerGoals[playerId] ?? 0
if (currentGoals >= 5) return state  // hard cap
if (!canScoreGate(...)) return state  // total + diff cap
```

Reducer-state kan inte nollställas av en ny generator. Handlers dispatchar
`INTERACTIVE_GOAL` till reducern som applicerar cap-logiken med global state.

---

## Varför recovery-vakten (commit 9b7526a) inte räckte

Recovery-vakten plåstrade nedströms-symptomet (score-desync efter bypass) men
löste inte grundorsaken. Den satte `matchDone: true` när `currentStep >= steps.length`
men det förhindrade inte att spelaren hade sett 12 mål av en spelare.

---

## Verifiering

`compare-modes.ts` kör 25 matcher med interaktiva events och verifierar:
- `interactiveCanScore logik-fel: 0`
- `Sim-läge cap-brott: 0`
- 4 mål blockerade av cap-logik i stress-scenario (korrekt)

Stress-test 5×1 säsonger: 0 invariant-brott, 0 krascher.

---

## Lärdom

**Two-source-of-truth state mellan generator-closure och React state ger
cap-bypass + race conditions. EN sanning per state-fält.**

Se LESSONS.md — lärdom tillagd i steg 7.
