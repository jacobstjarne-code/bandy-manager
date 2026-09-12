# DOM — Grind 2 återprov (Opus), 2026-09-11

**Underlag:** tvåsäsongers Lesjöfors-körning på pinnad commit `5d78cc14`, isolerad origin, Jacobs save orörd, ingen styrning av motor/balans/save. Dual-spår (A logik / B känsla) som speccat.

## Verdikt: Grind 2 EJ passerad

Återprovet bevisade sitt eget värde — det hittade ett konkret invariantbrott som regressionstesterna missade. Det är precis varför villkoret fanns.

### Brottet (Spår A #2) — kafferum återkommer

`HÄLLEFORSNÄS ÅKTE HEM` upprepas (00415 → 00811) och `Materialarens fyra flaskor` (00879 → 00992). Rot: `derby_win` och `big_derby_win` saknar `coffeeSemanticKey`/cooldown i `postVictoryNarrativeService`. Den tidigare fixade `playoff_win`-grenen höll — **fixen var partiell, bara en gren fick skyddet.** Produktens selektor bekräftar samma texter ur savarna. Det är Grind 2:s tredje krav (ingen upprepad pivotal scen) som failar. Underkänner ensamt.

### Oprövat, inte pass (Spår A #4) — supporter_conflict

Scenen fyrade aldrig (missat slumpfönster inom tifo-villkoret). Den är alltså varken bevisad eller motbevisad. Musikmedling/öppna brevet ersätter inte scenprovet. Räknas som saknad täckning, inte pass.

### Höll

- **Burnout-taket:** exakt ett terminalt val/säsong (step_back 2026, push_through 2027), inga återkomster trots press. MEN återfallstexten år 2 motsäger faktiskt val — "Förra gången höll jag ut" trots `stepped_back` (00689). Narrativ sanningsbugg, separat från reprisen.
- **Galan:** löst, återkom aldrig; nästa år är ny upplaga.
- **Kön:** max 10 deferred / 3 aktiva, inga dubbla olösta id, inga återkomster av terminalt lösta id, alla 63 deferred nådde pending, fruset Granska lösbart.

## Spår B bar frukt precis som designen sa

Logg-spåret ser aldrig det här, men det är samma förtroende-klass:

- **Burnout-textmotsägelsen** (ovan) — B fångade den, A loggade bara att taket höll.
- **"Spelet ljuger"-klustret:** fel tabellposition före QF5, hemseger blir "en poäng borta", tabellpoäng läcker in i slutspel, buss hem efter hemmamatch, Henriksson i landslaget men startar i klubben, fel mecenatnamn, januari före december, obeställt formationspåstående, Granska förnekar det interaktiva hörnmålet. Var för sig små, som klass samma sak som reprisen: spelet påstår något som motsäger sitt eget state.
- **Galan kändes tunn** som enbart textval — exakt "gjorde fixen scenen tam"-regressionen jag sa att känslo-spåret skulle fånga. Ett event kan sluta upprepas och samtidigt tappa vikt; logiken ser bara det första.

## Åtgärder

1. **Code — kafferum:** ge `derby_win` + `big_derby_win` samma `coffeeSemanticKey` + cooldown som `playoff_win` redan har. Det blockerande.
2. **Code — burnout-text:** återfallstexten måste läsa faktiskt tidigare val (`stepped_back`), inte anta "höll ut".
3. **Återprov:** kör om de två säsongerna styrt så supporter_conflict OCH derby-kafferum faktiskt fyrar. Rent → Grind 2 passerar, grindraderna arkiveras.
4. **Triage (egen utredning):** "spelet ljuger"-klustret — state-mot-narrativ, inte balans. Egna rader, prioriteras separat. Kvalitetsskuld, inte alla release-blockerande.

## Grind 3

Står kvar passerad. Rytmen är tekniskt bättre (tom inkorg vid nystart, max 3 aktiva) — portalhierarkin och åldersviktningen lyfte reservationen. Men "spelet ljuger"-klustret är en ny skavning i samma lager; det upphäver inte domen men är kvalitetsarbete.

## Kredit

Rapporten flaggade sin egen `newLedger`-id-bugg och dömde mot fulla snapshots, och verifierade att main är oförändrad från pinnen. Den rigorösa ärligheten är varför det negativa utfallet är att lita på.
