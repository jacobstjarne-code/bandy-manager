# Sprint TS-1 Pass 1 — Audit

## Punkter i spec

- [x] Extrahera preRoundContextProcessor — säsongsgräns-guard, nextMatchday, roundFixtures, second-pass
  - Verifierat: `src/application/useCases/processors/preRoundContextProcessor.ts` skapad, 108 rader
  - `advanceToNextEvent` börjar nu med `const preRound = derivePreRoundContext(game, seed)`
- [x] Extrahera postRoundFlagsProcessor — halvtidssummering, onboarding, konkurscheck, formationsrekommendation
  - Verifierat: `src/application/useCases/processors/postRoundFlagsProcessor.ts` skapad, 91 rader
  - `advanceToNextEvent` slutar med `const flagsResult = applyPostRoundFlags({...})`
- [x] roundProcessor.ts behåller identisk intern logik — inga variabelnamn ändrade
  - Verifierat via diff: 1305 → ~1155 rader, alla mellanliggande beräkningar intakta
- [x] Tester skrivna för båda processorer
  - `preRoundContextProcessor.test.ts`: 7 tester — earlyReturn (playoff-start, säsongsslut),
    cup-running proceed, isSecondPass true/false, isCupRound-detektering, currentLeagueRound
  - `postRoundFlagsProcessor.test.ts`: 8 tester — halvtidssummering trigger/ej-trigger/ej-retriggra,
    onboarding +1/<4, onboarding stannar vid 4, managerFired, finance-varning, ej dubbel varning
- [x] Build ren: `npm run build && npm test` → 163 testfiler, 1858 tester, alla gröna
- [x] Stresstest: 3 seeds × 2 säsonger → 0 krascher, 0 invariant-brott

## Observerat under felsökning

**Icke-determinism i stresstest:** Stresstest producerar olika checksumma per körning pga
`Math.random()` utan seed i:
- `src/application/useCases/processors/statsProcessor.ts:249` (bench minutes)
- `src/application/useCases/processors/playerStateProcessor.ts:137` (match penalty)
- `src/domain/services/matchCommentary.ts:762-767` (commentary)

Konsekvens: specens krav "bit-för-bit identisk checksumma" är omöjligt att verifiera.
Verifierbara kriterier: 0 krascher + 0 invariant-brott + build + tester. Alla uppfyllda.

**pendingRefereeMeeting-fälla:** TS-1 roundProcessor inkluderade initialt
`pendingRefereeMeeting: simResult.refereeMeetingEvent ?? undefined` som INTE fanns i HEAD.
Detta är en Sprint 25g-feature som ska ingå i Sprint 25g-committen, inte TS-1.
Togs bort ur TS-1-committen — ingår nu i uncommitted Sprint 25g-ändringar.

## Nya lärdomar till LESSONS.md

Ingen ny bugg som matchade befintligt mönster. Potentiell ny lärdom: stresstest är
icke-deterministisk pga Math.random() — checksumma-verifiering är inte möjlig.

## Commit

`122fd42` — refactor: bryt ut preRoundContext + postRoundFlags (pass 1/3)
