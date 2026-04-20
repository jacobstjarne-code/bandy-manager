# Sprint Stress Test — audit

## Punkter i spec

- [x] §1 Infrastruktur: `scripts/stress-test.ts` med arg-parsing (`--seeds`, `--seasons`, `--bail-on-crash`) — verifierat: kör via `npm run stress`, args parsas korrekt
- [x] §2 Gitignore: `scripts/stress/failures/*.json` gitignorerat, `.gitkeep` committad — verifierat: `scripts/stress/failures/` är listad i `.gitignore`
- [x] §3.1 `createHeadlessGame(seed)` — verifierat: skapar SaveGame med `managedClubId`, lineup kan sättas
- [x] §3.2 `autoSelectLineup(game)` — verifierat: sätter `managedClubPendingLineup` innan varje advance (krävs eftersom roundProcessor rensar fältet per omgång)
- [x] §3.3 `autoResolvePendingScreen(game)` — verifierat: löser alla kända PendingScreen-värden (`SeasonSummary`, `BoardMeeting`, `PreSeason`, `HalfTimeSummary`, `PlayoffIntro`, `QFSummary`); returnerar `unresolvable=true` för okända värden
- [x] §4 Invarianter (12 st): `tableSum`, `fixtureCount`, `playerAges`, `squadSize`, `positionCoverage`, `finance`, `cupBracket`, `playoffBracket`, `noUndefined`, `matchdayMonotonic`, `pendingScreenConsistency`, `saveGameSize` — verifierat: alla exporteras från `invariants.ts`, `INVARIANT_NAMES` konstant finns
- [x] §4.2 fixtureCount: playoff-fixtures (roundNumber > 22) korrekt exkluderade — verifierat: lade till `&& f.roundNumber <= 22` i filtret efter smoke test avslöjade false-fire
- [x] §5 Ring buffer (10 entries) för `lastActions` — verifierat: `makeRingBuffer()` implementerad
- [x] §6 Failure dumps: `writeDump()` skriver till `scripts/stress/failures/seed{N}-season{S}-round{R}.json` med `seed, season, round, error, stack, gameSnapshot, lastActions` — verifierat: dumps skrevs korrekt i baseline-körningen
- [x] §6.1 Progress-output per seed: format `[seed 1/10] season 1 ✓ season 2 ✗ <reason>` — verifierat: stämmer med baseline-output
- [x] §6.2 Slutrapport: sections Crashes + Invariant breaks + Per-invariant summary — verifierat: stämmer med baseline-output
- [x] §7 `npm run stress`-alias i `package.json` — verifierat: `"stress": "node_modules/.bin/vite-node scripts/stress-test.ts"` finns
- [x] §8 Baseline-körning 10 seeds × 5 säsonger genomförd — se `SPRINT_STRESS_TEST_BASELINE.md`
- [x] §9 Inga bug-fixar i denna sprint — verifierat: BUG-STRESS-01 är loggad, ej fixad

## Observerat under körning

Körde `npm run stress -- --seeds=10 --seasons=5`. Infrastrukturen fungerar korrekt:
- Progress visas per seed i realtid
- Slutrapporten formatteras korrekt
- Failure dumps skrivs till rätt plats med rätt struktur
- `--bail-on-crash`-flaggan implementerad men ej testad (avsiktligt, testar i nästa sprint)

## Ej levererat (med orsak)

- CI-integration: Utelämnad per Jacobs beslut — "CI senare, inte denna sprint. Spec §10 gäller."

## Nya lärdomar till LESSONS.md

BUG-STRESS-01 är ny: `playerDevelopmentService.getArchetypeMultiplier(p)` antar `p.attributes` alltid definierat — håller inte efter säsongsreset. Mönstret (`undefined`-access på attribut-objekt i service-lager) bör läggas till i LESSONS.md som: "Kontrollera alltid att `player.attributes` är definierat i development-/simulation-services — spelare kan existera i `game.players` utan initierade attribut (t.ex. efter transfer eller säsongsreset)."
