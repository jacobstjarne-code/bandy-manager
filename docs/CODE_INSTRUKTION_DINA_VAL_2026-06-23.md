# CODE-ORDER — Dina val · Utfall (kaptenrad + halvtid + alltid synlig)

**Från:** Opus · **Datum:** 2026-06-23 · **Underlag (varför):** `docs/DIAGNOS-DINA-VAL-LOGG-2026-06-23.md`
Detta är ordern. Diagnosen har resonemanget; här står bara vad du gör.

## 0. Grep först — rapportera innan du rör kod
- Var skrivs kaptenen? `grep -rn "captainPlayerId" src/` → `game.captainPlayerId` eller `setLineup({captainPlayerId})`? Rapportera vilket fält som är den levande sanningen.
- Finns en "snabbsimulera utan att titta"-väg från dashboard som går FÖRBI `saveLiveMatchResult`? `grep -rn "saveLiveMatchResult\|simulateMatch\b" src/presentation` + kolla matchstart-knapparna. Rapportera ja/nej.

## 1. Fix A — persistera halvtidsvalet
**Fil:** `src/presentation/screens/match/MatchLiveScreen.tsx` → `handleApplyTactic`.
Idag skrivs aldrig `game.lastHalftimeDecision`, så `saveLiveMatchResult`-grenen som läser det är död. Härled ett värde och persistera det (egen store-action `setHalftimeDecision`, ELLER tråda in det som argument till `saveLiveMatchResult` — välj det senare om du vill slippa stale state).
Mapping (fast):
- `htTempo === Low` → `'lugna'`
- `htPress === High` || `htMentality === Offensive` → `'pressa'`
- annars → `'prata'`

## 2. Fix B — en kaptenkälla
**Fil:** `src/presentation/store/actions/matchActions.ts` → `saveLiveMatchResult`, captain-grenen i T3-blocket.
Byt `myLineup?.captainPlayerId` → `game.captainPlayerId` (resolva spelaren ur `game.players`). Motor och logg ska läsa SAMMA fält. (Om grepen i steg 0 visar att den levande sanningen är `lineup.captainPlayerId` — gör tvärtom, men EN källa.)

## 3. D1 — sektionen ska alltid byggas för egna matcher
Om grepen i steg 0 hittar en snabbsim-väg som skapar en `report` utan `managerChoiceLog`: bygg loggen där också (kapten + started_tired + bench_fit; halftime utgår när matchen inte spelades live). Går alla egna matcher genom `saveLiveMatchResult` redan → inget att göra här, notera det.

## 4. D2 — ärlig kaptenrad ur CAPTAIN_OUTCOMES
**Fil:** `src/presentation/screens/granska/GranskaOversikt.tsx`, captain-grenen i M15-blocket (idag hårdkodad `stripe:'good'`, `✓`, "Ledarorden satte sig...").
Copyn finns: `CAPTAIN_OUTCOMES` i `src/domain/data/managerKvittoText.ts` (import den). Rewira raden:
- **Kontext** ur fixturen, prioordning: `final` (`fixture.isNeutralVenue` ELLER cup-final) → `slutspel` (`fixture.isKnockout` && ej final) → `derby` (`getRivalry(homeId, awayId)` träffar) → `vardag` (annars).
- **Riktning** ur kaptenens matchrating (samma som started_tired): `rating >= 7 → 'good'`, `<= 5 → 'bad'`, annars `'neutral'`. Saknas rating → falla på resultatet (won/lost/draw).
- Text: `CAPTAIN_OUTCOMES[context][dir]`, deterministiskt index på samma `seed` som de andra raderna.
- `stripe`/`value`(✓/—/✗)/`valueLabel` efter `dir`.
- Ta bort den hårdkodade gröna inline-strängen.

## 5. Verifiera
`npm run build && npm test`. Sedan playtest: spela en live-match med kapten satt + ett halvtidsval → Granska ska visa **Kapten**-rad (ärlig mot resultatet) + halvtidsrad. Spela en förlustmatch → kaptenraden får INTE säga "gav effekt". (Perception-tung yta → manuell playtest krävs, inte bara grön build.)

## 6. Commit
```
fix: Dina val-kvittot — kaptenrad + halvtid loggas, kaptenraden ärlig per resultat
rot: managerChoiceLog captain-gren läste lineup-fält men motorn game-fält;
     halftime-gren läste game.lastHalftimeDecision som live-flödet aldrig skrev;
     kaptenraden hårdkodad grön bröt promise↔consequence
```

---
**Escalera till Opus** om: kontextprioordningen, rating-tröskeln, eller halvtidsmappningen känns fel mot spelkänslan i playtest. Ändra inte copy/mappning tyst.
