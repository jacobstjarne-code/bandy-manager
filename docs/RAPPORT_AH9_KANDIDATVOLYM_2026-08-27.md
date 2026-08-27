# Rapport: A-H9 — kandidatvolym innan bygge

2026-08-27. Svar på `DOM_AH9_ARSBOKENS_BESLUT_2026-08-27.md`s två rapportfrågor. Report-only, ingen kod ändrad i produktion.

## Metod-reservation, läs innan siffrorna

Domen definierar kriterierna narrativt ("gjorde valet ont", "pekade två system åt olika håll") — inget datafält i kodbasen bär redan den bedömningen. Mätningen nedan approximerar med tre generiska proxies mot `EventEffect`-schemat:

- **Namngiven person:** effekten (eller en `multiEffect`-subEffect) refererar `targetPlayerId`/`removePlayerId`/`targetMecenatId`/`bidId` som faktiskt går att slå upp ett namn för.
- **Irreversibelt:** effekttypen är en av `acceptTransfer`, `releasePlayer`, `patronWithdrawn`, `rejectTransfer`, `hallProcess`, eller `removePlayerId` är satt.
- **Spänning (proxy, medveten underskattning):** effekten har ett negativt numeriskt värde, eller en person förlorades/ett bud refuserades. Detta fångar INTE alla fall där ett val "gjorde ont" narrativt utan sifferkostnad — en riktig implementation kräver samma per-källa-läsning som `contentContract.ts`s egen dom redan konstaterat inte går att gissa sig igenom.

Choice-valet i mätningen är **slumpmässigt** (samma seedade harness som `eventGuardInstrument.ts`), inte en spelare som aktivt undviker kostnader — sannolikt en ÖVERSKATTNING av hur många kostsamma/irreversibla val en försiktig spelare faktiskt skulle göra.

## Fråga 1: hur många beslut per säsong kvalificerar (≥2 av 3 kriterier)?

6 seeds × 3 säsonger, `scripts/ah9-kandidatvolym-matning-2026-08-27.ts`:

| | |
|---|---|
| Min | 2 |
| Max | 7 |
| Snitt | 4,6 |
| Säsonger med NOLL kvalificerande (fallback-texten skulle synas) | 0/18 |

**Svar: inte tjugo.** Spannet 2–7 per säsong är en rimlig kandidatpool för `pickSeasonDecision` att rangordna EN vinnare ur — inte en flod. Kriteriet är inte för brett baserat på denna mätning.

**Öppen fråga jag inte besvarar åt dig:** 0/18 säsonger gav noll kandidater i den slumpmässiga simuleringen — fallback-texten ("Inget beslut stack ut i vintras.") kan alltså vara sällsynt i praktiken, ELLER bara sällsynt när valen slumpas snarare än görs av en spelare som aktivt VÄLJER BORT kostsamma alternativ. En riktig spelare som konsekvent tar det billiga/säkra valet kan mycket väl se fler nollsäsonger än denna mätning visar — det är precis den skillnaden statistiken inte kan svara på åt dig.

## Fråga 2: bär `resolvedChoices` tillräckligt, eller krävs en uppslagning mot händelsedefinitionen?

**Svar: `resolvedChoices` bär INTE tillräckligt.** Dagens fält (`SaveGame.ts:336`):

```ts
resolvedChoices?: Array<{ eventId: string; choiceId: string; label: string }>
```

Tre strängar. Ingen `targetPlayerId`, ingen effekttyp, inget kriterium-facit. `recordResolvedChoice` (`eventResolver.ts:27-28`) skriver dessa tre fält på RESOLUTION-tillfället — samma ställe där `captureSystemDecision`s BUILDERS redan har tillgång till `gameBefore`/`gameAfter`/hela `event`-objektet (`seasonDecisionCaptureService.ts`). Efter resolution finns varken det fulla `event`-objektet eller gameBefore/gameAfter-paret sparat någonstans — bara `{eventId, choiceId, label}` överlever i `game.resolvedChoices` (capped 200 poster).

**Konsekvens för bygget:** en post-hoc-rekonstruktion vid säsongsslut (leta upp eventet igen via `eventId` och räkna ut kriterierna då) fungerar INTE — händelsen är borta ur `pendingEvents` sedan länge, och en spelare kan redan vara såld/pensionerad när säsongsslutet inträffar (samma H3-lärdom som redan finns dokumenterad i filen: "spelaren kan redan vara borttagen ur truppen vid säsongsslut om han sålts"). Kriterierna måste beräknas och PERSISTERAS vid resolution-tillfället, inte härledas i efterhand — samma mönster `captureSystemDecision` redan använder, bara generaliserat till ALLA lösta val istf de sealed åtta.

**Konkret väg framåt (inte ett beslut, bara vad datan kräver):** antingen (a) utöka `resolvedChoices`s lagrade form med de tre kriterierna + `sentence` vid skrivtillfället (kräver att `recordResolvedChoice`s anropsställen får tillgång till en generisk klassificerare, inte bara BUILDERS sealed-lista), eller (b) håll en separat `seasonDecisionCandidates`-logg (samma mönster som `narrativeBeatLog`) skriven parallellt med `resolvedChoices` på samma ställe. Vilketdera är en designfråga, inte en datafråga — datan finns bara vid resolution, aldrig efteråt.

## Sammanfattning

- Kandidatvolymen (2–7/säsong) verkar hanterbar — kriteriet är inte för brett.
- `resolvedChoices` måste utökas ELLER kompletteras med en ny logg skriven VID RESOLUTION — ingen efterhandslösning är möjlig med dagens datamodell.
- Mätningens "spänning"-proxy är en medveten underskattning byggd för att svara på VOLYMFRÅGAN, inte en färdig implementation av kriterium 3 — det kräver samma käll-för-källa-läsning som `contentContract.ts` redan varnat för att gissa sig igenom.

Väntar på din dom om (a)/(b) ovan, eller annan riktning, innan bygge.
