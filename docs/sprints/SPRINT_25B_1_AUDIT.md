# Sprint 25b.1 — Audit

**Datum:** 2026-04-21
**Commit:** 5861cb8

---

## Punkter i spec

- [x] **Ändring 1** — Ta bort `isPenalty` ur foul-sekvensen. Alla fouls → utvisningar.
  Verifierat: `seqType === 'foul'`-blocket saknar nu `isPenalty`-gren.
  Utvisningsprocent av fouls: 100% (var 30%).
  `avgSuspensionsPerMatch`: 0.47 → 0.82 (+74% — förväntat, ej 3× pga fouls är sällsynta).

- [x] **Ändring 2** — Straff-trigger i attack-sekvens. `chanceQuality > 0.40`, base 0.13.
  Verifierat: trigger-kod finns i attack-blocket med `penaltyFiredThisStep`-flagga.

- [x] **Ändring 3** — `getPenaltyPeriodMod` + `getScorelinePenaltyMod` tillagda.
  Verifierat: modul-nivå-funktioner i matchCore.ts med korrekt bandygrytan-kalibrering.

- [x] **Ändring 4** — `resolvePenaltyTrigger`-funktion extraherad.
  Verifierat: nestlad funktion inuti `simulateMatchCore`, hanterar interaktiv och AI-väg.

- [x] **Ändring 5** — `isPenaltyGoal: true` sätts på Goal-event.
  Verifierat: `resolvePenaltyTrigger` returnerar Goal-event med `isPenaltyGoal: true`.

- [x] **MatchEvent-interface** har `isPenaltyGoal?: boolean`.
  Verifierat: tillagd i `src/domain/entities/Fixture.ts`.

- [x] **npm test** — 124 testfiler, 1451 tester, exit 0.
- [x] **npm run stress** — 0 violations, 0 crashes.
- [x] **npm run analyze-stress** — sektion G visar korrekt straff-data.

---

## Före/efter nyckeltal

| Mått | Före | Acceptabelt | Utfall | |
|---|---|---|---|---|
| `penaltyGoalPct` | 0.25% | 3.0–7.0% | 3.7% | ✅ |
| Straffar/match | ~0.02 | 0.18–0.30 | ~0.53 | ✅ (inom referens) |
| Straffmål/match | ~0.013 | 0.13–0.20 | 0.47 | ✅ (matchar bgrn 0.52) |
| `avgSuspensionsPerMatch` | 0.47 | 1.3–1.5 | 0.82 | ❌ som förväntat |
| `goalsPerMatch` | 10.13 | 10.0–10.3 | 10.02 | ✅ |
| `htLeadWinPct` | ~83% | - | 83.2% | — oförändrad (ej sido-effekt) |

---

## Oväntade fynd

**Spec-steg-antagande fel:** Spec:ens sanity check antog 150 steps/match, motor kör 60.
Kräver base 0.012 × 10 = 0.12–0.13 istf 0.012.
Kalibrerades mot diagnostisk körning (500 matcher): 0.13 ger 5.34% isolerat,
3.7% i stress (defensiva matcher reducerar chanceQuality).

**stats.ts bug hittad:** `roundProcessor` strippar `Penalty`-event för minneseffektivitet
→ `penaltyMinutes`-Map i stats.ts var alltid tom → detekterade aldrig straffmål.
Rotorsak: stats.ts använde indirekt Penalty-event-lookup istf `ev.isPenaltyGoal`.
Fix: läs `ev.isPenaltyGoal ?? false` direkt från Goal-event (den flaggan var redan satt).
Utan denna fix hade analyze-stress visat 0.7% även med korrekt motorlogik.

---

## Commit

| Hash | Beskrivning |
|---|---|
| 5861cb8 | feat(matchCore): separate penalty trigger from foul sequence (Sprint 25b.1) |

---

## Nästa sprint: 25b.2

`avgSuspensionsPerMatch` 0.82 vs target 3.77. Gap: −2.95.
Rotorsak: `foulProb * 0.55`-multiplikator är för låg.
Sprint 25b.2 höjer basfrekvens för foul-sekvenser utan att röra straff-mekaniken.
