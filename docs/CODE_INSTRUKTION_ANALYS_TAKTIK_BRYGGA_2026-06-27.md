# Code-instruktion — Analys→Taktik-bryggan

Källa: Överlämning fil 4 (yta 3) + prototyp 6. Grundad av Opus 2026-06-27 mot
`GranskaAnalys.tsx`, `TaktikScreen.tsx`, `AppRouter.tsx`. Min audit kallade den
vassast och billigast: två befintliga ytor, en koppling.

## Vad som redan finns (ingen plumbing att bygga)
- `GranskaAnalys` (i `GranskaScreen`, route `/game/review`) visar coach-citat, händelse-
  tidslinje, formspelare, **nyckelinsikter** — och dör sedan. Ingen väg ut.
- `TaktikScreen` (route `/game/taktik`) läser REDAN `getNextManagedFixture(game)` →
  `game.opponentAnalyses?.[oppId]` och matar `TacticBoardCard` med `opponentAnalysis` +
  `nextOpponentName`. Motståndaranalysen landar alltså redan på taktiktavlan.

Kopplingen som saknas är en enda navigering: från analysen av matchen du nyss spelat,
in i att ställa laget mot nästa motståndare.

## Bygget
1. **CTA i botten av `GranskaAnalys`**, efter NYCKELINSIKTER-kortet: navigera till
   `/game/taktik`.
2. **Wiring:** `GranskaAnalys` är presentationell (ingen `useNavigate` idag). Två vägar,
   välj den som passar resten av Granska-flödet: antingen en `onGoToTaktik`-callback från
   `GranskaScreen` (håller komponenten ren), eller `useNavigate` direkt i `GranskaAnalys`.
   Inte global-navigate — det är för icke-komponentkontext.
3. **Grinda på nästa match:** visa CTA:n bara när `getNextManagedFixture(game)` finns —
   det är då det finns en motståndare att ställa in laget mot. Säsongsslut / inget nästa →
   ingen CTA.
4. **Copy:** knyt den till nästa motståndare, eftersom analysen redan gör det. T.ex.
   "Ställ laget mot {nextOpponentName} →" (`nextOpponentName` härleds precis som i
   `TaktikScreen`: opp via `getNextManagedFixture`, `shortName ?? name`). Faller namnet
   bort, "Förbered nästa match →".
5. **Styling:** sekundär/outline (`btn-outline`), INTE avancera-CTA:ns gradient + puls —
   den behandlingen är reserverad för omgångsavancering. Bryggan är en navigering, inte
   ett ceremoniellt avslut.

## Acceptanskriterier
- Från Granska-Analys efter en spelad match tar ett tryck dig till Taktik, med nästa
  motståndares analys redan inläst på `TacticBoardCard` (verifiera — datan finns, bara
  navigeringen är ny).
- Ingen CTA när det inte finns en nästa managed-fixture.
- Tester gröna, build grön.

## Inte i denna ticket
- Ingen ändring i `TacticBoardCard` eller `opponentAnalyses`-datan. Den fungerar; bryggan
  rör den inte. Bara länken in.
