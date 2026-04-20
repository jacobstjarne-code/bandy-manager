# Sprint 22.7 — audit

## Punkter i spec

- [x] Steg 1: Instrumentering med `logSquadComposition` (6 faser, STRESS_DEBUG-flag) — verifierat: kördes, data insamlad
- [x] Steg 2: Rotorsaksanalys dokumenterad i `SPRINT_22_7_DIAGNOSTIC.md` — Bug A (managed club skip) och Bug B (position-cycling) identifierade
- [x] Steg 3 Fix A: Managed club safety-net vid 14 spelare (`isManaged ? 14 : 20`) — verifierat: kod implementerad
- [x] Steg 3 Fix B: `pickPositionToFill()` + `POSITION_MINIMUMS` ersätter `replenishPositions`-cycling — verifierat: kod implementerad
- [x] Steg 3 Fix 3: `logSquadComposition` borttagen (inklusive import `Club`, funktionskropp, 6 anrop) — verifierat
- [x] `STRESS_DEBUG=true` borttagen från `scripts/stress-test.ts` — verifierat
- [x] LESSONS.md §12 tillagd — verifierat
- [x] `npm run build && npm test` — grönt: 124 test files, 1451 tests

## Stress-test 10×5 efter fix

```
Completed: 45 seasons out of 47 attempted
Crashes: 2
```

| Seed | Resultat |
|---|---|
| 1–3 | ✓✓✓✓✓ |
| 4 | ✓✓✗ (positionCoverage — Karlsborg FWD:1) |
| 5–7 | ✓✓✓✓✓ |
| 8 | ✓✓✓✗ (cupBracket — 0 scheduled cup fixtures @ round 3) |
| 9–10 | ✓✓✓✓✓ |

## Stress-test 10×10 (långtidsstabilitet)

```
Completed: 71 seasons out of 78 attempted
Crashes: 7
Invariant breaks (non-crash warns): 56
```

Per-invariant crashes:
- `positionCoverage`: 4 crashes (AI-klubbar)
- `cupBracket`: 1 crash
- `finance`: 1 crash (konkurs ej triggad)

## Kvarvarande buggar (loggas — ej fixas i denna sprint)

### BUG-STRESS-03: positionCoverage — forward-depletion via AI-transfers
Replenishment triggas bara om total squad < target (14 för managed, 20 för AI). Om en AI-klubb har 20+ spelare men bara 1 forward (via AI-transfers) triggas aldrig `pickPositionToFill` — den är redan över target. Mönster: Karlsborg/Målilla/Forsbacka/Gagnef tappar GK eller FWD via transfer, hamnar ≥ 20 totalt, inte replenishade per position.

### BUG-STRESS-04: cupBracket — cup bracket active med 0 scheduled fixtures
`invariant:cupBracket — Cup bracket active (completed=false) with 1 unresolved real matches but 0 scheduled cup fixtures @ round 3`. Konsekvent vid round 3. Troligtvis: cup R1 (matchday 3) genereras ej korrekt vid säsongsstart i sena säsonger, eller fixture rensas utan att bracket markeras completed. Kräver separat diagnos.

### BUG-STRESS-05: finance — konkurs ej triggar vid < −1 MSEK
Managed club når −1 098 572 kr och −1 007 043 kr utan att konkurs-mekanismen triggar. Ekonomisk safety-net saknar floor-check i `advanceToNextEvent`.

## Förbättring mot baseline

| Körning | Completed | Crashes |
|---|---|---|
| Baseline (före Sprint 22.6) | 7/17 (41%) | 10/10 seeds |
| Efter Sprint 22.6 | 16/26 (62%) | 10/10 seeds |
| **Efter Sprint 22.7 (10×5)** | **45/47 (96%)** | **2/10 seeds** |
| Efter Sprint 22.7 (10×10) | 71/78 (91%) | 7/10 seeds |

## Ej levererat (med orsak)

- Fullständig 50/50 (10×5): BUG-STRESS-03 (position-cycling via AI-transfers) kvarstår. Kräver ny fix-spec från Opus — se BUG-STRESS-03 ovan.
