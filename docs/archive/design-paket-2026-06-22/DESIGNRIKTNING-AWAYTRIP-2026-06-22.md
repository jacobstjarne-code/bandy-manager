# DESIGNRIKTNING — awayTrip: dödmarkera logistiken, behåll känslan

**Datum:** 2026-06-22 · **Av:** Fable / Design · **Till:** Code + Opus
**Gäller:** Code-audit prio 3 ("awayTrip — bygg färdigt eller dödmarkera"). Jag läste koden. Här är domen.

## Det finns TVÅ away-trip-system — blanda inte ihop dem

1. **Klack-ritualet** (`supporterGroup.awayTripSeason/awayTripMatchday`) — fyrar som supporter-event, konsumeras av `klackPresenter` + `getAwayTripNarrative`. **Detta fungerar. Rör det inte.**
2. **Manager-logistiken** (`game.awayTrip`: hotell-tier, extraMeal, mikrobeslut → fräschhet sent i match) — genereras i `roundProcessor`, men: hotell alltid `pensionat`, mikrobeslut alltid `null`, ingen besluts-UI, och `AWAY_ROUTINE_OUTCOMES` (managerKvittoText.ts:41) importeras aldrig. **Detta är stubben Code hittade.**

## Dom: dödmarkera logistik-mikrobeslutet — men rädda dess enda goda idé

**Bygg INTE färdigt hotell-bokningsloopen.** Skäl:
- Den duplicerar ekonomi-/beslutsytan ni redan har, och lägger en mikro-beslutspunkt till — rakt emot `decisionBudgetService`/`decisionFatigueService` som ni medvetet byggt för att *minska* beslutsbrus. En hotellbokning före varje bortamatch är precis den sortens lågvärdes-friktion budgeten ska skydda mot.
- Fräschhets-payoffen finns redan konceptuellt i konditionssystemet; en parallell väg dit via hotell-tier är dubbelarbete.

**Men behåll den äkta känslan:** *en bortamatch i vinter är tung.* Det är en riktig spelkänsle-krok, och `weatherWarning` ("Snöoväder — 2h extra restid") bär den redan. Flytta den till en **lågmäld pre-match context-rad** (callback-familjen, killer-app #1) i stället för ett beslut:

> 🚌 "Lesjöfors borta. Snöoväder — laget åker kvällen innan, trötta ben."

Ingen bokning, inget val — bara en kontext-beat som färgar mötet. Om ni senare vill ha en *konsekvens* kan den läsa väder + restid och ge en liten fräschhets-debuff, men det är då en automatisk effekt, inte ett mikrobeslut.

## Order
- **Dödmarkera:** `game.awayTrip` (logistik-objektet), `HOTEL_NAMES`, `RESOLVED_TEXTS`, `AWAY_ROUTINE_OUTCOMES`, `generateAwayTrip`-anropet i `roundProcessor`. Ta bort, inte kommentera ut.
- **Behåll:** klack-ritualet (system 1) orört.
- **Valfritt (liten):** `weatherWarning`-texten återföds som en pre-match context-rad i bortamatcher. Designen ärver callback-anatomin — ingen ny komponent.

Detta är "bygg om i rätt läge" snarare än "finish the stub" — känslan överlever, halv-loopen försvinner.
