# Sprint 22.9 — audit

## Punkter i spec

- [x] `evaluateFinanceStatus()` i `economyService.ts` — verifierat: exporterad, tre trösklar (-500k/−1M/−2M)
- [x] `financeWarningGivenThisSeason?: boolean` i `SaveGame.ts` — verifierat: tillagt efter `licenseWarningCount`
- [x] Per-round bankruptcy-check i `roundProcessor.ts` — verifierat: insatt precis före final return, läser `updatedGame.clubs` post-processning
- [x] `financeWarningGivenThisSeason: false` reset i `seasonEndProcessor.ts` — verifierat: i det returnerade game-objektet
- [x] Invariant `checkFinance` uppdaterad i `invariants.ts` — ny threshold: −2M utan `managerFired` = crash; −2M med `managerFired` = warn; −1M till −2M = warn
- [x] Stress-test loop hanterar `managerFired: true` — verifierat: `if (result.seasonEnded || result.game.managerFired) seasonDone = true`
- [x] `npm run build && npm test` — grönt: 124 test files, 1451 tests

## Stress-test 10×10 efter fix

```
Completed: 99 seasons out of 100 attempted
Crashes: 1
```

Per-invariant:
- `finance: 0 crashes` ← BUG-STRESS-05 eliminerad
- `finance: 8 warnings` — omgångar i −1M till −2M-zonen (inbox skickad, spelet fortsätter korrekt)
- `cupBracket: 1 crash` ← BUG-STRESS-04 (kvarstår, ej del av denna sprint)
- `saveGameSize: 3 warnings` (icke-krasch)

| Seed | Resultat |
|---|---|
| 1 | ✓×10 |
| 2 | ✓×10 |
| 3 | ✓×10 |
| 4 | ✓×10 |
| 5 | ✓×9, ✗ säsong 10 (cupBracket) |
| 6 | ✓×10 |
| 7 | ✓×10 |
| 8 | ✓×10 |
| 9 | ✓×10 |
| 10 | ✓×10 |

## Förbättring per sprint

| Sprint | 10×10 completed | finance crashes | cupBracket crashes |
|---|---|---|---|
| 22.8 (dubbel trigger) | 79/85 (93%) | 4 | 2 |
| **22.9 (bankruptcy)** | **99/100 (99%)** | **0** | **1** |

## Arkitektur: graduerad konkurs

`evaluateFinanceStatus(finances)` returnerar `healthy / warning / license-denial / game-over`. Call site i `roundProcessor` hanterar deduplikering via `financeWarningGivenThisSeason` — funktionen exponerar bara trösklarna, inte once-per-season-logiken. Det gör funktionen testbar i isolation.

Game-over mekaniken: `managerFired: true` (inte `PendingScreen.GameOver` — det enum-värdet existerar ej). UI navigerar till `/game/game-over` när `managerFired` är satt, via befintlig logik i `SeasonSummaryScreen` och `DashboardScreen`.

## Kvarvarande buggar

### BUG-STRESS-04: cupBracket — 0 scheduled cup fixtures @ round 3
Konsekvent trigger: cup R1 (matchday 3) i sena säsonger (säsong 10). Kräver separat diagnos — ej del av stress-ekonomi-spåret.
