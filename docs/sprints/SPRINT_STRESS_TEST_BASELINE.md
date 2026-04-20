# Stress Test — Baseline (10 seeds × 5 seasons)

**Datum:** 2026-04-20  
**Körning:** `npm run stress -- --seeds=10 --seasons=5`  
**Infra-commit:** stress-test infrastruktur (scripts/stress-test.ts + scripts/stress/*)

---

## Sammanfattning

```
Completed: 7 seasons out of 17 attempted
Crashes: 10 (10/10 seeds crashade)
Invariant breaks (non-crash warns): 0
```

Alla 10 seeds kraschade med identisk feltyp. 7 säsonger slutfördes (seed 1, 2, 3, 6, 7, 9, 10 slutförde säsong 1 innan krasch i säsong 2; seed 4, 5, 8 kraschade redan i säsong 1).

---

## Kategoriserade kraschar

### BUG-STRESS-01 — `p.attributes` är `undefined` i `playerDevelopmentService`

**Frekvens:** 10/10 seeds (100%)  
**Tidpunkt:** Säsongsslut (season-end processing, `roundPlayed=null`)  
**Stacktrace:**
```
TypeError: Cannot read properties of undefined (reading 'skating')
  at getArchetypeMultiplier (playerDevelopmentService.ts:120)
  at developPlayers (playerDevelopmentService.ts:203)
  at applyPlayerStateUpdates (playerStateProcessor.ts:198)
  at advanceToNextEvent (roundProcessor.ts:240)
```

**Mönster:**
- Seeds 1, 2, 3, 6, 7, 9, 10: kraschade i säsong 2 (säsong 1 fullbordad)
- Seeds 4, 5, 8: kraschade i säsong 1 (startar redan vid matchday 26/playoffs)
- Krascharna sker alltid vid `round=null` = season-end processing
- `lastActions` för alla seeds slutar med `advance season=X round=31 seed=...` → säsongsslutprocessorn triggas efter matchday 31 (sista playoff-rund)

**⚠️ Feldiagnostiserad i baseline — korrigering Sprint 22.6:**  
Code diagnostiserade rotorsaken som `p.attributes = undefined`. Opus granskade stacktrace och fann att felet låg ett steg upp: `ARCHETYPE_MULTIPLIERS[archetype]` är undefined, inte `p.attributes`. Rad 120 läser `archetypeMap[attr]` där `archetypeMap = ARCHETYPE_MULTIPLIERS[archetype]` — det är `archetypeMap` som är undefined.

**Korrekt rotorsak:**  
`seasonEndProcessor.ts:890` och `matchSimProcessor.ts:35` satte `archetype: 'TwoWaySkater' as Player['archetype']` — en raw PascalCase-sträng. `PlayerArchetype.TwoWaySkater = 'twoWaySkater'` (camelCase). Mismatch → `ARCHETYPE_MULTIPLIERS['TwoWaySkater']` returnerar `undefined`. Triggar vid säsongsslut för varje spelare med denna archetype (56 160 varningar per 10×5-körning).

**Åtgärd (Sprint 22.6):**  
- Defensiv guard i `getArchetypeMultiplier`: returnerar `getDefaultMultiplier()` om archetype inte finns i mappen
- `seasonEndProcessor.ts` och `matchSimProcessor.ts`: `PlayerArchetype.TwoWaySkater` ersätter `'TwoWaySkater' as Player['archetype']`
- Se `docs/LESSONS.md` §10 och `docs/DECISIONS.md` (2026-04-20 BUG-STRESS-01)

---

## Invariant-status

Alla 12 invarianter var rena (0 violations) under de 7 säsonger som slutfördes:

| Invariant | Violations |
|---|---|
| tableSum | 0 |
| fixtureCount | 0 |
| playerAges | 0 |
| squadSize | 0 |
| positionCoverage | 0 |
| finance | 0 |
| cupBracket | 0 |
| playoffBracket | 0 |
| noUndefined | 0 |
| matchdayMonotonic | 0 |
| pendingScreenConsistency | 0 |
| saveGameSize | 0 |

---

## Övrigt observerat (icke-krash)

- `[MATCHDAY SKIP] last=34 next=37` — loggas från roundProcessor, verkar inte vara ett fel utan en normal lucka i slutspelsschemat
- `[PLAYOFF] Series ... completedThisRound: ` (tom) — loggas upprepat efter att en serie redan är klar (winnerId satt). Möjlig dubbelprocessning av slutförda serier — inga konsekvenser synliga men bör granskas

---

## Failure dumps

Sparade i `scripts/stress/failures/` (gitignorerade):
- `seed1-season1-round0.json` (från smoke test)
- `seed1-season2-round0.json` ... `seed10-season2-round0.json`

Jacob kan bevara en dump manuellt via `git add -f scripts/stress/failures/seedX-seasonY-roundZ.json`.
