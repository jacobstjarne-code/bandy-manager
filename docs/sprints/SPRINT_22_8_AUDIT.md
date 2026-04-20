# Sprint 22.8 — audit

## Punkter i spec

- [x] Fix BUG-STRESS-03: dubbel trigger `needsMore || needsRebalance` i replenishment-loopen — verifierat: kod implementerad
- [x] `needed = max(size-shortfall, position-shortfall)` — verifierat
- [x] `npm run build && npm test` — grönt: 124 test files, 1451 tests
- [x] LESSONS.md §13 tillagd — verifierat
- [x] DECISIONS.md position-aware-posten uppdaterad med resolution — verifierat

## Stress-test 10×10

```
Completed: 79 seasons out of 85 attempted (93%)
Crashes: 6
```

Per-invariant:
- `positionCoverage: 0 violations` ← BUG-STRESS-03 eliminerad
- `finance: 4 violations (crashes)` ← BUG-STRESS-05 (kvarstår)
- `cupBracket: 2 violations (crashes)` ← BUG-STRESS-04 (kvarstår)
- `saveGameSize: 2 warnings` (icke-krasch)

| Seed | Resultat |
|---|---|
| 1 | ✓×10 |
| 2 | ✓×9, ✗ säsong 10 (finance) |
| 3 | ✓×10 |
| 4 | ✓×10 |
| 5 | ✓×9, ✗ säsong 10 (cupBracket) |
| 6 | ✓×10 |
| 7 | ✓×3, ✗ säsong 4 (finance) |
| 8 | ✓×3, ✗ säsong 4 (cupBracket) |
| 9 | ✓×8, ✗ säsong 9 (finance) |
| 10 | ✓×7, ✗ säsong 8 (finance) |

## Förbättring per sprint

| Sprint | 10×5 completed | 10×10 completed | positionCoverage |
|---|---|---|---|
| Baseline | 7/17 (41%) | — | — |
| 22.6 (TwoWaySkater) | 16/26 (62%) | — | — |
| 22.7 (safety-net + rebalance) | 45/47 (96%) | 71/78 (91%) | 4 crashes |
| **22.8 (dubbel trigger)** | — | **79/85 (93%)** | **0 violations** |

## Kvarvarande buggar

### BUG-STRESS-04: cupBracket — 0 scheduled cup fixtures @ round 3
Konsekvent trigger: cup R1 (matchday 3) i sena säsonger (säsong 4, 10). Sannolikt: `generateCupFixtures` genererar ej korrekt fixture för alla omgångar när säsongen är hög, eller bracket markeras ej completed när det borde. Kräver diagnos.

### BUG-STRESS-05: finance — konkurs ej triggar vid < −1 MSEK
Managed club når −1 003 602 till −1 158 124 kr utan att konkurs-mekanismen triggar. Troligtvis saknas floor-check i `roundProcessor`/`economyService`. Kräver diagnos.

### BUG-STRESS-06: saveGameSize warnings (2 st, icke-krasch)
`SaveGame is X.XX MB (möjlig memory leak i narrativeLog e.dyl.)`. Icke-kritisk, loggas för framtida uppföljning.
