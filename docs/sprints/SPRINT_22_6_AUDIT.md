# Sprint 22.6 — audit

## Punkter i spec

- [x] Steg 1: Guard i `getArchetypeMultiplier` — verifierat: `archetypeMap`-check före attr-läsning, defensiv fallback på `getDefaultMultiplier`, console.warn tillagd och sedan borttagen efter rotorsaksfix
- [x] Steg 2: Rotorsaksfix — verifierat: `'TwoWaySkater'` (PascalCase) i `seasonEndProcessor.ts:890` och `matchSimProcessor.ts:35` → `PlayerArchetype.TwoWaySkater`. `PlayerArchetype` importerat i båda filerna
- [x] console.warn borttagen efter fix bekräftad — verifierat: ingen warn-output i ny stress-körning
- [x] LESSONS.md §10 tillagd: "Enum-value ≠ key i map-konstant" — verifierat
- [x] LESSONS.md §11 tillagd: "[PLAYOFF] completedThisRound tom-observation" — verifierat
- [x] DECISIONS.md: Resolution tillagd på BUG-STRESS-01-posten — verifierat
- [x] SPRINT_STRESS_TEST_BASELINE.md: Korrigerad rotorsaksanalys — verifierat

## Ny stress-test 10×5 efter fix

```
Completed: 16 seasons out of 26 attempted
Crashes: 10
```

Ny buggkategori exponerad: squad-depletion. Kraschar på `positionCoverage` och `squadSize` invarianter vid säsong 2-3. Kraschar vid säsongsslut (invariant-check, ej exception).

Breakdown per seed:
- seed 1: season 3 ✗ positionCoverage — Forsbacka: only 1 forwards
- seed 2: season 2 ✗ positionCoverage — Lesjöfors: only 1 forwards
- seed 3: season 3 ✗ positionCoverage — Heros: only 1 forwards
- seed 4: season 3 ✗ positionCoverage — Slottsbron: only 1 forwards
- seed 5: season 3 ✗ squadSize — Målilla has 13 players
- seed 6: season 3 ✗ squadSize — Gagnef has 11 players
- seed 7: season 2 ✗ positionCoverage — Västanfors: only 1 forwards
- seed 8: season 2 ✗ positionCoverage — Hälleforsnäs: only 1 forwards
- seed 9: season 3 ✗ squadSize — Rögle has 7 players
- seed 10: season 2 ✗ squadSize — Slottsbron has 12 players

Mönster: Forward-positionsuttömning är vanligast. Squad-storlek 7-13 (under minimum 14) indikerar att kontraktsutgångar + uttransfers inte kompenseras av tillräcklig spelargenerering. Nästa sprint: undersök `seasonEndProcessor` transferlogik + squad-replenishment.

## Ej levererat (med orsak)

- Inget — alla steg i spec levererade

## Nya lärdomar till LESSONS.md

- §10 tillagd: "Enum-value ≠ key i map-konstant" — nytt mönster, värt att ha i LESSONS
- §11 tillagd: PLAYOFF completedThisRound-observation — låg prio men dokumenterad så den inte tappas
