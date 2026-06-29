# CODE-LEVERANS — Match-flöde, krom-unifiering (Design Del 3)

**Datum:** 2026-06-10
**Källa:** Claude Design, visuell audit Del 3 (match-flödet) + Opus-verifiering av `GameShell.tsx` och routern.
**Karaktär:** Konkreta wiring-/färg-fixar som Design's renderade audit hittade. INTE stratum-migreringen (separat svep), INTE Granska (för-gaffel).

## A. 🟥 Dubbel krom på `match/live` (huvudfyndet)
**Bekräftat:** `GameShell.tsx` renderar `<GameHeader />` + `<PhaseIndicatorAuto />` ovillkorligt för alla `/game`-routes. På `match/live` har skärmen (`screens/match/MatchLiveScreen.tsx`) redan sin egen `LedgerFrame`-masthead + RPS-strip. Resultat: fyra staplade header-band, och GameHeaderns rond-meta ("Omg 1") motsäger LedgerFrame-mastheadens "OMG. 2" (`fixture.roundNumber`) — två krom-generationer med skilda datakällor på samma skärm.

**Fix:** i `GameShell`, undertryck `<GameHeader />` + `<PhaseIndicatorAuto />` när routen är `match/live`. Skärmen äger sin krom via LedgerFrame. Använd det befintliga route-villkors-patternet (`isMatchRoute`/`sceneActive` finns redan i filen) — lägg ett `isLedgerOwnedChrome = location.pathname.includes('/match/live')` och rendera header + fas-strip bara när `!isLedgerOwnedChrome`. En masthead, en rond-källa → motsägelsen försvinner med.

**ENDAST `match/live`.** Rör INTE `/game/match` (förmatch, gammal inline, för-gaffel) eller `/game/review` (Granska, för-gaffel — se C).

## B. Halvtidsmodal — LED-rött score → Georgia
Halvtidsmodalens resultat (`ht-score`, `led`-klass) renderas i LED-rött (6—0) — det läcker ut ur tavlans reservat. LED-paletten är reserverad för live-scoreboardet (README + DESIGN-DECISIONS). Halvtids-scoren ska vara **Georgia** (`.h-display-*` / paper-numerals), inte LED. Allt annat i modalen är godkänt (Design: bäst i klassen) — rör bara score-färg/typsnitt, inget annat.

## C. Granska — RÖR INTE
Granska är **för-gaffel**. CTA:n "KLAR — NÄSTA OMGÅNG →" slår ihop exakt de två CTA:er som gaffelbeslutet (§LF, Granska-children) håller isär. Den ersätts av recut, lappas inte i delar. Lämna helt tills fork-beslut + recut-mock finns.

## D. Död dubblett — radera
`src/presentation/screens/MatchLiveScreen.tsx` (toppnivå) är **oimporterad** — routern (`AppRouter.tsx`) använder `screens/match/MatchLiveScreen`. Toppnivå-filen är en pre-refactor-kvarleva (gammal `Scoreboard` + `CommentaryFeed`, ingen LedgerFrame). Radera den.
Verifiera sen om `components/match/Scoreboard.tsx` + `components/match/CommentaryFeed.tsx` (de gamla, importerades bara av den döda filen) är föräldralösa: `grep -rn "from.*['\"].*\(Scoreboard\|CommentaryFeed\)['\"]" src --include=*.tsx`. Radera bara det som har **noll** andra importer. Grep först, radera sen.

## INTE i scope
- Inline-stratum-migreringen (Taktik m.fl.) — separat svep, väntar grep-kartan.
- De två systemklasserna Design bekräftade i tredje domänen — "struktur utan innehåll" (tomma TABELL/FORM-kort med "—") och "semantisk färg utan legend" (Nyckelmoment-namn) — väntar Designs steg-3-regelförslag. Patcha dem inte styckevis nu.

## Acceptans
- `match/live`: EN masthead (LedgerFrame), ingen GameHeader/fas-strip ovanför, ingen rond-motsägelse.
- Halvtids-score i Georgia, inte LED.
- Granska orörd.
- Toppnivå-`MatchLiveScreen.tsx` borta; orphaned `Scoreboard`/`CommentaryFeed` borta endast om grep visar noll andra importer.
- `npx tsc --noEmit` + alla tester gröna.

---

**Till Code (Sonnet, VS Code):**

Läs `docs/CODE-LEVERANS-MATCH-KROM-2026-06-10.md`. Fyra punkter från Designs renderade audit av match-flödet.

1. **🟥 A — dubbel krom:** i `GameShell.tsx`, undertryck `<GameHeader />` + `<PhaseIndicatorAuto />` på `match/live` (skärmen äger sin krom via `LedgerFrame`). Använd befintliga route-villkors-patternet. **Endast `match/live`** — rör inte `/game/match` eller `/game/review`.
2. **B — halvtidsmodal:** score från LED-rött → Georgia (`.h-display-*`). Bara score-färg/typsnitt, inget annat i modalen.
3. **C — Granska:** RÖR INTE. För-gaffel, recut ersätter den.
4. **D — död kod:** radera oimporterade `src/presentation/screens/MatchLiveScreen.tsx`. Grep:a sen om gamla `Scoreboard`/`CommentaryFeed` är föräldralösa — radera bara med noll andra importer.

**Rör INTE:** stratum-migreringen, de tomma TABELL/FORM-korten, Nyckelmoment-färgerna (väntar steg-3-regler).

**Klart =** match/live med en masthead utan rond-motsägelse · halvtids-score i Georgia · Granska orörd · död dubblett borta · tsc + tester gröna.

**Rapportera: hur du villkorade kromen i GameShell, och grep-resultatet för Scoreboard/CommentaryFeed innan radering.**
