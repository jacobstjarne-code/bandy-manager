# DOM — PRESSBÅGEN STEG 2–3: journalisten minns förra gången

**Datum:** 2026-09-02 · **Av:** Opus · **Utlöst av:** kodläsning av `journalistVisibilityService.ts` (committad `769ff627`, byggare okänd — dömer koden, inte vem som skrev den) inför GPT-omtestet. Tredje bågen, samma trestegsmodell som burnout + årsboken.

## Grundat i koden — pressbågen är steg 1 + halva steg 3, INTE steg 2

`appendJournalistRelationshipStoryline` fryser en tröskelövergång (relation bryts <20 / läks >75) till en storyline. Kodläst:
- **Steg 1 (lagras): GJORT, rent.** Kanonisk detektor (`detectRelationshipEvent`), dual-write-disciplin (relationen förblir sanningen, storylinen är historik), dedup på id. Föredömligt.
- **Halva steg 3 (används): GRATIS.** Storylinen bär `type: 'journalist_feud'`/`'journalist_redemption'`, och årsbokens DIN SÄSONG-tidslinje renderar redan storylines per typ (`storylineEmoji`-switchen har `journalist_feud`). Så en bruten relation SYNS i årsboken. En riktig konsumtion.
- **Steg 2 (hittas historiken): SAKNAS.** `detectRelationshipEvent` läser `lastTriggeredRelationship` — det är RECENCY ("korsade tröskeln just nu"), inte HISTORIK ("har brutits förr"). Ingenting läser tidigare `journalist_feud`-storylines. Och `getJournalistRelationshipStoryText` returnerar ORDAGRANT samma text varje gång: "Relationen är bruten. Det krävs tid och ärlighet för att vända." Andra gången relationen bryts säger den exakt vad första gången sa.

**Det är EXAKT samma brist burnout HADE** innan återfallsdomen: datan finns (storylines bär historiken), nästa beat läser den inte, texten vet inte att det är andra gången. Pressbågen är committad men halv.

## Domen — en återfallsläsning + eskalerad text (samma mönster som burnout)

Bygg steg 2–3 för pressbågen, ordagrant samma form som `isBurnoutRelapse` + `BURNOUT_MARK_RELAPSE`:

### Steg 2 (Code) — historik-läsning
En `isJournalistFeudRelapse(game)`: har en tidigare `journalist_feud`-storyline funnits en TIDIGARE säsong? (Läs `game.storylines`, samma över-säsongsgräns-fråga som burnout.) Samma spegling skriv/läs: `appendJournalistRelationshipStoryline` grenar på återfall vs första gången, `getJournalistRelationshipStoryText` väljer eskalerad text när återfall. Samma för `journalist_redemption` (en relation som läks EN GÅNG TILL efter att ha brutits förr är en annan sak än första försoningen).

### Steg 3 (Opus) — den eskalerade texten
SAMTLIGA fyra rader ordagrant (feud + redemption, första gång + återfall). `{efternamn}` = `journalist.name.split(' ').pop()`, redan i scope i `getJournalistRelationshipStoryText`.

- **Feud, första gången** (behåll, finns): "Relationen är bruten. Det krävs tid och ärlighet för att vända."
- **Feud, återfall:** "Bruten igen. {efternamn} har sett det förr, och den här gången sitter det djupare."
- **Redemption, första gången** (behåll, finns): "{efternamn} är på er sida nu. Det håller så länge du är lika öppen tillbaka."
- **Redemption, återfall:** "{efternamn} kommer tillbaka, men inte hela vägen. En relation som brustit en gång läks aldrig riktigt blint igen."

Skepsis i redemption-återfallet utan melodram: försoningen sker, journalisten är inte lika godtrogen som första gången. Callback-principen (samma som burnout-återfallet) — texten VET att det hänt förr.

## SKYDDAT
- **Relationen förblir sanningen.** Storylinen är historik, aldrig en parallell relations-state (koden har detta rätt — bevara det). Återfallsläsningen läser storylines, ändrar inte relationen.
- **Ingen ny lagring.** Steg 2 är en läsning av `game.storylines`, samma som burnout läser diaryn. Inget nytt fält.
- **Skala:** storylinens `matchday` sätts via `getCurrentLeagueRound` (redan i koden) — om årsboken visar den går den genom samma roundLabel som resten. Verifierat konsekvent.
- **Recency-detektorn (`lastTriggeredRelationship`) rörs inte** — den gör sitt jobb (fånga en färsk korsning). Återfallsläsningen är en ANDRA fråga ovanpå, inte en ersättning.

## GODKÄNT NÄR (GPT-omtestet, alla tre bågar)
1. En relation som bryts ANDRA gången (efter att ha brutits en tidigare säsong) ger eskalerad text som refererar förra gången — inte ordagrant samma rad som första.
2. Första gången är oförändrad.
3. Redemption-återfall bär skepsis (en försoning som svikits förr).
4. Storylinen syns fortfarande i årsboken (steg 3, redan gratis).
5. GPT: känns andra intervjun/tröskeln som att journalisten MINNS er historia, eller som första mötet igen?

## ÄGARSKAP
Code: `isJournalistFeudRelapse` + grena `appendJournalistRelationshipStoryline`/`getJournalistRelationshipStoryText` på återfall (samma spegling skriv/läs som burnout). Opus: den eskalerade återfallstexten (feud + redemption). GPT: omtest på alla TRE bågar när detta landat — burnout, årsbok, press, alla hela.

## LEVERANSSTATUS 2026-09-02

**BYGGD + TEXT KLAR.** `isJournalistFeudRelapse` och den speglade redemption-läsningen söker tidigare säsongers club-förankrade storylines; recency-detektorn och relationens live-state är orörda. `appendJournalistRelationshipStoryline` fryser rätt första-/återfallstext och samma historikkontext går till JournalistSecondary/journalist_relationship-scenen. Förstagångsraderna är oförändrade, båda återfallsraderna är Opus ordagranna leverans. Regressioner täcker tidigare säsong, samma säsong, annan relationstyp och annan klubb.
