# Rapport: H4-utredningen — offerSelectionService, matchmotorns styrka, och formelns tak

2026-08-25. Jacobs order efter fjärde mätningen: "leta i offerSelectionService och i vad som driver förlusterna, inte i styrelsemodellen." Ren utredning (bakgrundsagent), inget byggt.

## (a) offerSelectionService — ren kosmetik, och den ljuger om Rögle

`difficulty` konsumeras bara på fyra ställen, alla i `src/presentation/components/clubselection/` (`OfferCard.tsx`, `OffersView.tsx`, `DifficultyTag.tsx`, `ClubExpandedCard.tsx`). Ingen träff i `src/application` eller i matchmotor/ekonomi. Etiketten styr ingenting spelbart — bara vilken tagg som visas på klubbvalskortet. Bekräftat.

Men den ljuger på ett konkret sätt. `computeDifficultyScore` kört mot alla tolv `CLUB_TEMPLATES`:

```
Heros    rep=45 exp=survive     fin/wage=3.81 score=35.0 -> hard    (korrekt)
Rögle    rep=50 exp=avoidBottom fin/wage=4.17 score=50.0 -> medium  (FEL)
Skutskär rep=52 exp=avoidBottom fin/wage=4.20 score=52.0 -> medium  (tveksam)
```

Rögle landar exakt på gränsvärdet 50 (tröskeln är `score >= 50` → medium) och etiketteras "medium" — trots att Rögle ligger på **100% avskedsfrekvens**, precis som Heros (se `RAPPORT_FJARDE_MATNINGEN_2026-08-25.md`). En spelare som väljer Rögle för att den ser ut som ett rimligt medelsvårt uppdrag möter i praktiken samma strukturellt olösliga situation som Heros ("hard"). Gapet finns för att `computeDifficultyScore` bara läser reputation + boardExpectation-gap + finansmarginal — ingen koppling till matchmotorns faktiska styrkegap eller uppmätt avskedsfrekvens. Inte bara kosmetiskt overksam — kosmetiskt missvisande för exakt den klubb H4 handlar om.

## (b) Vad som faktiskt driver förlusterna — och den canoniska siffran stämmer

Grundattribut sätts i `worldGenerator.ts:534`:
```ts
const base = clamp(reputation * 0.7 + rng.float(-10, 10), 20, 95)
```
Heros (rep 45) → bas ≈ 21,5–41,5 (snitt 31,5). Forsbacka (rep 85) → bas ≈ 49,5–69,5 (snitt 59,5). Nästan dubbelt så starka attribut, rakt av. Detta matas i princip oförändrat vidare: `squadEvaluator.ts` (`offensePlayerScore`/`defensePlayerScore`, rad 83–106) viktar attributen till `offenseScore`/`defenseScore` (0–100), och `matchCore.ts:426–427` sätter `homeAttack = offenseScore * modifier / 100` — rakt proportionellt. Gapet i grundgenereringen är den faktiska källan till Heros svaghet, inte otur.

Körning av `scripts/h4-heros-avskedsfrekvens.ts` mot nuvarande kod (med `RUNNING_LOSS_EXPECTATION_MULTIPLIER` redan aktiv): fortfarande **20/20 (100%) avsked**, ingen full 4-säsongskarriär spelbar. Ett engångs-instrumenteringsskript (kört, raderat) aggregerade faktiska säsong 1-utfall över 20 seeds: **459 matcher, V 21,1% / O 14,8% / F 64,1%**. Ligger inom/vid toppen av det citerade canoniska intervallet (14–23% vinstandel) — **den canoniska siffran är verifierad mot verklig kod, inte en stale dokumentsiffra.**

## (c) Aritmetiken — formeln har ett tak, och det är redan nått

Monte Carlo (200 000 simulerade säsonger, ingen matchmotor, ren `updateRunningBoardPatience`-formel) mot Heros uppmätta fördelning (21,1/14,8/64,1%), 22 omgångar:

- **Bas-termen** (`RUNNING_PATIENCE_DELTA`, redan Survive-skalad 0,4×): **-2,2 patience/säsong** — nästan neutral. H4-fixet gjorde precis vad det var tänkt att göra.
- **Förlustsvit-surchargen** (`losingStreakSurcharge`, **fortfarande OSKALAD**): **-16,1 patience/säsong** — över **7×** större än bas-termen.
- **Total löpande term: -18,3/säsong.**

Säsongsslutstermen för Survive är i praktiken neutral-till-svagt-positiv (ankaret=12=sistaplats, gap kan aldrig bli negativt). Räknat från startvärde 70: säsong 1 slut ≈ 51–53 (matchar den faktiskt uppmätta banan, 47–53 i spelet), säsong 2 slut ≈ 33–35, säsong 3 slut ≈ 15–17 — exakt det mönster som faktiskt observeras (de flesta sparkade säsong 2–3, orsak `boardPatience<=15`).

**Svar på kärnfrågan: nej.** Ingen rimlig omkalibrering av Survive-konstanterna räddar Heros — bas-termen är redan nästan noll, det finns nästan inget kvar att mjuka där. Orsaken är att förlustsvitsstraffet, medvetet oskalat för att bevara "kollaps är kollaps oavsett tier", bygger på ett falskt antagande för en klubb som förlorar 64% av matcherna: en svit på 3–5 raka förluster är inte en anomali för Heros, det är statistisk rutin. Att skala ner surchargen tillräckligt för att rädda Heros (grovt: till ~0,15–0,2× av nuvarande) skulle göra den i praktiken overksam för just den tier den är tänkt att fånga genuina kollapser i — precis den urholkning Jacob själv flaggat som oacceptabel.

**Formelns tak är nått: styrelsemodellen kan inte lösa detta utan att antingen döda sin egen signal eller lämna Heros/Rögle strukturellt dömda.**

## (d) Rekommendation — hävstången sitter i truppstyrkan, inte i boardService.ts

1. **`worldGenerator.ts:534`** (`generateAttributes`) — bas-formeln (`reputation * 0.7 ± 10`) är den faktiska roten. Reputation 45→bas 31,5 mot reputation 85→bas 59,5 är det strukturella gapet som producerar 64% förlustandel — det tal boardPatience-formeln aldrig kan kompensera för. Detta rör dock den citerade Elitserie-kalibreringen (`scripts/calibrate.ts`, `docs/kunskapsbas/DATA.md`) OCH Heros egna kanon (`W012_heros.yaml`: "svagast i ligan", "det går inte att lyckas, bara att hålla ut") — att höja Heros golv är att medvetet ändra vad Heros ÄR, inte en bugfix. **Jacobs beslut, inte ett Code-jobb att bara göra.**

2. Om Heros faktiska spelstyrka INTE ska röras (den är avsiktligt kanoniskt svag) — då är rätt lösning inte fler koefficienter i `boardService.ts`, utan att fråga om avskeds**mekaniken** för Survive-tier överhuvudtaget ska vara "boardPatience når 15". Koden erkänner redan textmässigt att Heros är ett annat kontrakt ("Styrelsen begär bara att klubben finns kvar nästa år") — men den mekaniska konsekvensen (samma `boardPatience<=15`-tröskel, samma svit-straff, bara mjukare bas-delta) motsäger den texten. Ett genuint annat spelbart kontrakt för Survive (t.ex. ingen automatisk avsked på patience, bara på konkurs/licensnekan; eller en väsentligt längre patience-skala specifikt för denna tröskel) är en designfråga, inte en till kalibreringsrunda.

3. **`offerSelectionService.ts` bör rättas oavsett vilken väg som väljs för Heros/Rögle:** antingen en verklig svårighetssignal (t.ex. ett hårdkodat golv för `CLUB_TEMPLATES`-poster under reputation ~52, eller en facit-tabell istf den formel-approximerade `computeDifficultyScore`), eller en öppen flagga om att etiketten är en ungefärlig proxy. Just nu presenterar den Rögle som ett rimligt val på fel sida av en gräns.

**Filer att gå vidare med, om Jacob ger klartecken:** `worldGenerator.ts` (rad 534, `generateAttributes`), `squadEvaluator.ts` (rad 83–111, offense/defense-viktning), `boardService.ts` (`losingStreakSurcharge`, rad 415–420, om mekaniken ändå ska mjukas), `offerSelectionService.ts` (`computeDifficultyScore`, rad 44–55, Rögle-gapet).

Inget byggt. Väntar på dom.
