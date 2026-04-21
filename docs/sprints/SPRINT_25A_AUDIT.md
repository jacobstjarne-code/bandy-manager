# Sprint 25a — audit (Comeback-dynamik)

## Punkter i spec

- [x] **Ändring 1 — chasingThreshold = -1** (commit bbd3833). `matchPhase === 'quarterfinal' ? -1 : -2` → konstant `-1`. Lag nere 1 mål i 2:a halvlek fick nu 'chasing' istf 'even_battle'. Bonusfix: oanvänd `matchPhase`-parameter prefixad `_matchPhase` (commit 8cc6f3e) efter build-fel.
- [x] **Ändring 2 — trailingBoost 0.07 → 0.11** (commit 8438f21). Nere 1: 11% boost (var 7%). Nere 2: 22% (var 14%). Nere 3: 33% cap (var 21%).
- [x] **Ändring 3 — chasing/controlling goalMod** (commit af5a065). chasing: 1.08→1.14, foulMod 1.15→1.20. controlling: 0.92→0.96.
- [x] **npm run build && npm test** — 124 test files, 1451 tests, exit code 0.
- [x] **npm run stress** — 7175 matcher, 0 krascher, 3 non-crash invariant-varningar.
- [x] **npm run analyze-stress** — fullständig rapport.
- [x] **SPRINT_25A_MEASUREMENT.md** — skriven med fullständig rapport och jämförelsetabell.

## Commits

| Hash | Beskrivning |
|---|---|
| bbd3833 | feat(matchCore): chasing threshold -2 → -1 for bandygrytan realism |
| 8438f21 | feat(matchCore): trailingBoost 0.07 → 0.11 for stronger comeback |
| af5a065 | feat(matchCore): chasing 1.08→1.14, controlling 0.92→0.96 — softer 2H determinism |
| 8cc6f3e | fix: matchCore — prefix unused matchPhase param with _ after threshold simplification |

## Sektion A — jämförelse (7 mått)

| Mått | Före (S24) | Efter (S25a) | Target | Δ |
|---|---|---|---|---|
| htLeadWinPct | 87.4% | 86.5% | 46.6% | −0.9pp |
| drawPct | 7.1% | 7.0% | 11.6% | −0.1pp |
| awayWinPct | 45.3% | 45.8% | 38.3% | +0.5pp |
| goalsPerMatch | 10.10 | 10.26 | 9.12 | +0.16 |
| cornerGoalPct | 26.0% | 25.8% | 22.2% | −0.2pp |
| avgSuspensionsPerMatch | 0.45 | 0.47 | 3.77 | +0.02 |

## Sektion D — comeback-jämförelse

| HT-underläge | Före | Efter | Target | Δ |
|---|---|---|---|---|
| −1 | 15.2% | 16.5% | 24.5% | +1.3pp |
| −2 | 5.6% | 7.7% | 11.0% | +2.1pp |
| −3 | 1.0% | 1.7% | 3.7% | +0.7pp |
| −4+ | 0.6% | 0.7% | 1.3% | +0.1pp |

## Oväntad bieffekt — kritisk observation

`htLeadWinPct` rörde sig 0.9pp av de 40.8pp som krävs. Rotorsak: `secondHalfGoalMod`/`secondHalfFoulMod`-blocket (rad 515) körs **enbart** när `managedIsHome !== undefined`. I headless stress-körning är `managedIsHome` aldrig satt → ändring 1 och 3 är osynliga i mätningen.

Ändring 2 (`trailingBoost`) körs globalt på båda lag utan `managedIsHome`-villkor — det enda som faktiskt syns i mätningen (+1.3pp vid −1, +2.1pp vid −2).

**Konsekvens för Sprint 25b:** Antingen behöver comeback-mekaniken delas ut ur `managedIsHome`-grinden till att gälla båda lag (som `trailingBoost`), eller behöver `htLeadWinPct`-problemet adresseras på ett annat sätt. Ändringarna i 25a har troligen reell effekt i faktiska live-matcher — men kan inte bekräftas via stress-mätning i nuvarande arkitektur.

## Ej levererat

Inget. Alla spec-punkter levererade. Ändringarna är kirurgiskt genomförda som specad.

## Nya lärdomar till LESSONS.md

`managedIsHome`-grinden i matchCore.ts är osynlig i stress-test. Modifierare innanför detta block syns inte i `analyze-stress`-mätningar. Framtida motorjusteringar som ska vara mätbara via stress-test måste ligga utanför detta block (se `trailingBoost` som referens).
