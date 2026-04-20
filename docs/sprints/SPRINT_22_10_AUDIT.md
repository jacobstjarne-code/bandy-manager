# Sprint 22.10 — audit

## Punkter i spec

- [x] Diagnostik: `[CUP-GEN]` i `cupService.ts` — verifierat: kördes, visade 4 fixtures per säsong, konsekvent
- [x] Diagnostik: `[CUP-SEASON-END]` i `seasonEndProcessor.ts` — verifierat: kördes
- [x] Diagnostik: cup-dump i `stress-test.ts` vid cupBracket-invariant — verifierat: `bug04-seed5-s10-cup.json` genererades
- [x] `SPRINT_22_10_DIAGNOSTIC.md` skriven — rotorsak: väderavbokning sätter `Postponed` på cup-fixtures
- [x] Fix: `&& !fixture.isCup` i `matchSimProcessor.ts:198` — verifierat: en rad
- [x] Diagnostik-instrumentering borttagen (cupService, seasonEndProcessor, stress-test) — verifierat
- [x] `STRESS_DEBUG = 'true'` borttagen från stress-test.ts — verifierat
- [x] LESSONS.md §14 tillagd — verifierat
- [x] `npm run build && npm test` — grönt: 124 test files, 1451 tests
- [x] `npm run stress -- --seeds=10 --seasons=10` — **100/100** ✓✓✓

## Stress-test 10×10 efter fix

```
Completed: 100 seasons out of 100 attempted
Crashes: 0
```

Per-invariant:
- `positionCoverage: 0 violations` ← fixad i 22.8
- `finance: 0 crashes, 4 warnings` ← fixad i 22.9 (warnings = club i -1M till -2M, förväntad)
- `cupBracket: 0 crashes` ← fixad i 22.10
- `saveGameSize: 2 warnings` (icke-krasch, känd)

## Förbättring per sprint

| Sprint | 10×10 completed | positionCoverage | finance crashes | cupBracket crashes |
|---|---|---|---|---|
| Baseline | — | — | — | — |
| 22.8 (dubbel trigger) | 79/85 (93%) | 0 | 4 | 2 |
| 22.9 (bankruptcy) | 99/100 (99%) | 0 | 0 | 1 |
| **22.10 (cup-weather)** | **100/100 (100%)** | **0** | **0** | **0** |

## Rotorsak (recap från diagnostic)

`matchWeather.effects.cancelled` satte `status: Postponed` på alla fixture-typer, inklusive cup. Ligamatcher klarar `Postponed` (ingen knockout-krav). Cup-knockoutmatcher måste ha `winnerId` — en postponed cup-match orphanar bracketen permanent. Fix: ett tecken + `!fixture.isCup`.

## Kvarvarande varningar (ej buggar)

- `saveGameSize: 2 warnings` — narrativeLog-tillväxt. Icke-kritisk, loggas BUG-STRESS-06 sedan sprint 22.8.
- `finance: 4 warnings` — managed club i -1M till -2M-zonen under kortvariga omgångar. Förväntad beteende från sprint 22.9-mekaniken.
