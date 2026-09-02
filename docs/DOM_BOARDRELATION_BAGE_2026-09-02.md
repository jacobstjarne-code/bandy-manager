# DOM — BOARD-RELATIONEN SOM BÅGE: styrelsen minns förloppet (steg 2–3)

**Datum:** 2026-09-02 · **Av:** Opus · **Utlöst av:** Code:s utredning (byggt-men-siled bekräftad) — fjärde steg-2-3-bågen efter burnout/årsbok/press. Samma trestegsmodell.

## Grundat i Code:s utredning — steg 1 GRATIS, steg 2:s maskineri FINNS

**Steg 1 (lagras): komplett, noll nya fält.** `game.seasonSummaries[]` är append-only (aldrig trunkerad, låst av `careerMemory.test.ts:52`), varje post bär en fryst `boardTruth: SeasonBoardTruth` (`buildSeasonBoardTruth`, boardService.ts:866) med tre axlar per säsong: `statedGoal`, `outcome` (verdict/rating/finalPosition), `relationship` (`boardPatienceAfter`, `zone`, `consecutiveFailuresAfter`). En `.map()` över arrayen ÄR hela karriärens board-kurva idag.

**Steg 2 (hittas): SAKNAS, men maskineriet finns.** Ingen läser mer än en säsong (`GameOverScreen` slice(-1), `SeasonSummaryScreen` läser inte boardTruth alls, `boardMeetingStateResolver` single-season). MEN `HistoryScreen:339` har redan `JourneyGraph` — en flerårs-SVG-kurva som plottar `finalPosition`, redan wirad till `seasonSummaries`. Renderingsmaskineriet finns och är bevisat; board-datan matas bara inte in. `getClubPositionTrend()` (oanvänd) är mönster-precedenten.

**Steg 3 (berättas): SAKNAS helt.** `consecutiveExpectationMisses` (Club.ts) skrivs varje säsong men läses BARA av ladder-demoteringen — ingen yta säger "andra året i rad". Eskaleringen SPÅRAS men TALAS aldrig. Exakt burnout-bristen: datan vet, ytan är tyst.

## Domen — board-förloppet som en berättad båge

### Steg 2 (Code): `getBoardRelationshipTrend()`
Parallell till `getClubPositionTrend` (seasonSummaryService.ts) — läser `boardTruth.relationship` + `outcome` över ALLA säsonger, returnerar kurvan. Mata in i `JourneyGraph` (eller en syskonkurva bredvid positionskurvan), så board-förloppet SYNS visuellt: patience-zon per säsong, utfall mot statedGoal. Ingen ny lagring, ingen ny renderare — koppla befintlig data till befintlig kurva.

### Steg 3 (Opus text): den TALADE eskaleringen
Det som får bågen att bita. När `consecutiveExpectationMisses >= 2` (räknaren tröghet-domen redan skriver), en rad som SÄGER historiken. Startförslag (jag skriver mot Code:s struktur, placering avgörs då):
- 2 säsonger under förväntan: "Andra året i rad under vad de hoppats. Styrelsen säger det inte rakt ut, men mötena är kortare nu."
- 3+: "Tredje året topp-fyra, aldrig guld. De har slutat säga det högt. Du hör det ändå."
Board-motsvarigheten till burnout-återfallet: systemet talar sin egen historik tillbaka. Callback-principen (samma som `BURNOUT_MARK_RELAPSE`) — texten VET att det hänt förr.

## GRÄNS mot befintliga domar (så nästa läsare inte tror dubblett)
- **`DOM_BOARDEXPEKTAN_TROGHET_2026-08-31` / `DOM_BOARD_TALAMOD_SYSTEM`** ÄNDRAR förväntan (demoterar efter 2 misses). Denna dom BERÄTTAR förloppet. Samma räknare (`consecutiveExpectationMisses`), olika syfte: tröghet recalibrerar, detta ytar. INTE en utökning av tröghet — en egen läsande/berättande båge ovanpå samma data.
- **`DOM_FRAMGANGSKURVAN_2026-08-27`** är EKONOMISK (löner/bud/investSurplus), orelaterad (Code bekräftade).
- **`DOM_LIGGARE_COOLDOWN_GRANS`**: board-förloppet läses ur `seasonSummaries` (redan kanon-lagring), INTE narrativeBeatLog. Rätt lager.

## SKYDDAT
- **Noll nya fält, noll ny lagring.** boardTruth-kurvan finns fryst. Om domen frestar någon att lägga till ett fält — stanna, datan finns redan i `seasonSummaries[].boardTruth`.
- **Den talade raden yter BARA vid faktisk eskalering** (`>= 2`). En klubb som möter sin förväntan får ingen "styrelsen undrar"-rad — ingen påhittad oro. Samma golv som årsbokens managersektion (tom = visas inte).
- **Positionskurvan (`JourneyGraph` finalPosition) rörs inte** — board-kurvan är ett TILLÄGG bredvid, inte en ersättning.

## GODKÄNT NÄR (GPT-omtest när byggt)
1. En karriär med 2+ säsonger under förväntan visar board-förloppet visuellt (JourneyGraph-kurvan) OCH en talad eskaleringsrad.
2. En klubb som möter förväntan får ingen eskaleringsrad.
3. Raden refererar historiken ("andra året", "tredje året"), inte bara nuläget.
4. GPT: känns det som att styrelsen MINNS din väg, eller bara reagerar på i år?

## ÄGARSKAP
Code: `getBoardRelationshipTrend()` + mata JourneyGraph, mall `[Opus]` för den talade raden. Opus: eskaleringstexten (2 / 3+ säsonger) mot Code:s struktur + placeringsdom (årsbok vs board-möte vs kurv-bildtext) när strukturen står. Jacob: inget beslut väntar — mönstret är bevisat (burnout/press), datan finns, detta är samma trestegs-avslut på board.
