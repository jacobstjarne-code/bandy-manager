# RAPPORT — H5 renommétaket: vad händer säsong 5-6?

**Datum:** 2026-09-01 · **Av:** Code · **Källa:** MASTER_OPPET.md `inv-2-11-h5-renommetak` (INVENTERING_2026-08-31.md:65, "begärt två gånger") · **Mätning:** `scripts/h5-renommetak-matning-2026-09-01.ts`

## Frågan

Klubbens `reputation` klampas vid 100 på åtta ställen i koden (roundProcessor.ts, seasonEndProcessor.ts, economyProcessor.ts, scandalService.ts, eventResolver.ts). Ingen rapport fanns om vad som faktiskt händer en dominant klubb säsong 5-6, efter att taket nåtts.

## Metod

Headless 6-säsongssim, `club_forsbacka` (rep85 vid start) med truppens `currentAbility` höjd +30 (samma "gör klubben dominant"-knep som `framgangskurvan-ansprak3` och `framgangsekonomin-kommunbidrag-matning` — headless harness kan inte styra matchutfall på annat sätt).

## Resultat

| Säsong | Rykte | CS | Placering | boardExpectation |
|---|---|---|---|---|
| 1 | 88 | 63 | 4 | winLeague |
| 2 | 93 | 76 | 2 | winLeague |
| 3 | 98 | 93 | 2 | winLeague |
| 4 | **100** | 77 | 2 | winLeague |
| 5 | — | — | — | **AVSKEDAD mitt i säsongen** |

**Klubben når rykte 100 i säsong 4 och avskedas under säsong 5** — `boardPatience=0`, `firedReason: 'boardPatience'`, zon `'ultimatum'`.

## Svaret på frågan: du sitter aldrig vid taket i säsong 5-6

Reputationstaket i sig är harmlöst — inget krasch, inget bieffekt av klampningen som sådan. Men **samma framgångsbana som når taket triggar en ANNAN, obesläktad spärr som avslutar karriären innan säsong 5-6 hinner observeras**:

`deriveBoardAssessment` (`boardService.ts:670`) ratchetar `boardExpectation` uppåt varje gång klubben finishar topp-2 (`lastSeasonPosition <= 2`), men ratchetar **bara nedåt vid botten-2** (`lastSeasonPosition >= 10`). En klubb som konsekvent finishar 2:a-4:a (precis det en +30-boost producerar) klättrar snabbt till `winLeague` (ankarposition 1, `BOARD_EXPECTATION_ANCHOR_POSITION`) — och **kan aldrig ratcheta tillbaka ner** förrän den faller till botten-två placeringarna.

Väl vid `winLeague` läser styrelsen varje säsong som finishar 2:a (gap=1 mot ankaret) som en delvis missad förväntan (`SLOPE_WIN_LEAGUE_BELOW`-malus i `computeSeasonVerdictRating`), och den ackumulerade `boardPatience` dräneras säsong för säsong tills ultimatum-zonen nås — **oavsett att klubben är objektivt sett mycket framgångsrik** (rykte 100, CS 77-93, tre raka 2:e-4:e-platser i en 12-lagsliga).

## Slutsats

Detta är **inte en bugg i rykte-klampningen**. Det är en strukturell egenskap hos `boardExpectation`-ratcheten: en engångsriktad (bara uppåt förutom vid kollaps) förväntanseskalering som gör "för bra för att vinna ALLT" till en fara snarare än en trygg zon. Reputationstaket och `winLeague`-fällan är två separata system som råkar triggas av samma bana (sammanhållen framgång), vilket är varför frågan "vad händer vid taket" aldrig kunde besvaras separat — svaret ÄR den andra spärren.

Detta är ett designval, inte en kodfix — Code rapporterar, bygger inget. Möjliga vägar (Jacobs/Opus bord, ospecificerat här):
1. Låt `boardExpectation` ratcheta nedåt även vid t.ex. `lastSeasonPosition >= 6` för `winLeague`-tiern specifikt (en "digest, don't just escalate"-broms för den högsta tiern) — mest kirurgiskt.
2. Ge `winLeague` ett bredare "möter förväntan"-band (t.ex. position 1-2 räknas båda som `met`, inte bara position 1) — matchar att "näst bäst i en 12-lagsliga" rimligen INTE ska läsas som misslyckande.
3. Lämna som är — "det är svårt att stanna på toppen" kan vara en avsiktlig speldesign-signal, inte ett fel.

## Körorder

**Jacob/Opus:** avgör om `winLeague`-ratchetens envägsriktning + smala möter-band är avsiktligt eller ska mjukas. Ingen kod ändrad av Code i denna rapport.
