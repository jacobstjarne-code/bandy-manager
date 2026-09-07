# Avskedskalibrering — diagnostisk baslinje 2026-09-07

## Revision och körning

- Gren: `release`
- HEAD: `0a1c8372` (`fix: läs frusen avskedsorsak i kalibreringen`)
- Kommando: `npm run calibrate:firing -- --seeds=20 --seasons=6 --seed-start=90000 --json`
- Omfattning: 20 seeds per klubb, fyra klubbar, högst sex säsonger — 80 karriärer
- Utfallskvalitet: 0 krascher, 0 avsked med okänd orsak
- Körtid: cirka 129 sekunder

Detta är en diagnostisk baslinje. Den är tillräcklig för att hitta stora avvikelser och verifiera mätkedjan, men är **inte** den beslutade formella 10 000-seedsacceptansen.

## Resultat

| Klubb | Profil | Avsked | Frekvens | Frusna orsaker | År för avsked |
|---|---|---:|---:|---|---|
| Heros | survive | 20/20 | 100 % | 10 consecutiveFailures, 10 licenseDenied | 2028: 8, 2029: 9, 2031: 3 |
| Söderfors | midTable | 13/20 | 65 % | 11 boardPatience, 2 licenseDenied | 2028: 1, 2029: 5, 2030: 5, 2031: 2 |
| Lesjöfors | midTable | 13/20 | 65 % | 10 boardPatience, 3 licenseDenied | 2026: 1, 2027: 1, 2028: 4, 2029: 3, 2031: 4 |
| Forsbacka | winLeague | 4/20 | 20 % | 4 boardPatience | 2030: 3, 2031: 1 |

Totalt: 50 avsked. Orsaksfördelning: 25 `boardPatience`, 10 `consecutiveFailures`, 15 `licenseDenied`, 0 `bankruptcy`, 0 `unknown`.

## Dom mot de låsta målen

- Heros: **underkänt** — 100 % mot målet 55–65 %.
- Söderfors: **underkänt** — 65 % mot kravet under 50 %.
- Lesjöfors: **underkänt** — 65 % mot kravet under 50 %.
- Forsbacka: referensvärde 20 %. Den separata deterministiska regeln att en WinLeague-klubb inte sparkas enbart för en tredjeplats prövas inte av detta aggregat.

Avvikelsen är så stor att mer sampling inte behövs för att konstatera att nuvarande modell missar målen. Heros har två lika stora avskedsvägar (`consecutiveFailures` och `licenseDenied`), medan mittklubbarna främst faller på `boardPatience`. Nästa kalibreringspass måste därför mäta och justera en orsakskedja i taget; en gemensam lättnadskonstant riskerar att dölja två skilda problem.

## Mätfelet som rättades före omkörningen

Den första körningen gav samma frekvenser men 50/50 `unknown`. Det var ett fel i kalibreringsverktygets läsare, inte i spelstaten:

- sport- och licensavsked fryses i `SeasonSummary.boardTruth.relationship.firedReason`;
- toppfältet `SaveGame.firedReason` används för terminalt avsked mitt i säsongen, i praktiken konkurs;
- verktyget läste tidigare bara toppfältet.

Commit `0a1c8372` inför en gemensam sanningsläsare med säsongens `boardTruth` först och toppfältet som konkursreserv. Tre regressionstester täcker sportsligt avsked, konkurs och avsaknad av frusen orsak. Verktyget gissar fortfarande aldrig från efterhandsvärden.

## Innan formell 10 000-seedskörning

Den seriella diagnostiken tog cirka 129 sekunder. Samma upplägg med 10 000 seeds per klubb skulle i nuvarande form ta omkring 18 timmar. Den formella körningen bör därför göras först efter orsaksspecifik kalibrering och helst med parallellisering eller checkpointad batchning. Annars betalar vi en lång körning för att bara bekräfta den redan tydliga röda baslinjen.
