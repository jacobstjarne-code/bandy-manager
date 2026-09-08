# Avskedskalibrering — formell 10 000-seedsverifiering 2026-09-07

**Status:** GODKÄND

**Formell revision:** `3b78737eff06b6106d55529f83b748cb08b31fe0`

**Aktuell HEAD-kontroll:** `1bb4c172` — det lilla kontrollpasset är bitidentiskt

## Slutsats

Den oförändrade avskedsmodellen klarar samtliga låsta mål:

- Heros: **59,00 %** mot målintervallet 55–65 %.
- Söderfors: **28,78 %** mot kravet under 50 %.
- Lesjöfors: **33,61 %** mot kravet under 50 %.

Alla 40 000 karriärer var giltiga. Körningen gav noll krascher och noll avsked med okänd orsak. Ingen produktionsparameter ändrades för att nå utfallet.

Forsbacka ingick som referensprofil och landade på **34,96 %**. Något låst acceptansintervall fanns inte för den klubben; utfallet ska därför inte efterhandsbedömas som godkänt eller underkänt i denna mätning.

## Omfattning och reproduktion

- 10 000 seeds per klubb, fyra klubbar, högst sex säsonger per karriär.
- Seedintervall: 90 000–99 999 för varje klubb.
- Klubbar: Heros, Söderfors, Lesjöfors och Forsbacka.
- Totalt: 40 000 sexsäsongskarriärer.
- Shardstorlek: 20 seeds; åtta parallella workers; 2 000 checkpointfiler.
- Körtid: cirka 10 timmar och 20 minuter.
- Formell arbetskatalog var en fryst worktree på `3b78737e`; pågående ändringar i huvudrepot kunde därför inte påverka senare shards.
- Kommando:

  `npm run calibrate:firing:sharded -- --seeds=10000 --seasons=6 --seed-start=90000 --shard-size=20 --workers=8 --output-dir=/private/tmp/bandy-firing-formal-3b78737e`

Den aggregerade originalutskriften ligger i `docs/matningar/AVSKEDSKALIBRERING_FORMELL_10000_2026-09-07.json`.

## Resultat

| Klubb | Profil | Avsked | Frekvens | Låst mål | Dom |
|---|---|---:|---:|---:|---|
| Heros | survive | 5 900/10 000 | 59,00 % | 55–65 % | Godkänd |
| Söderfors | midTable | 2 878/10 000 | 28,78 % | <50 % | Godkänd |
| Lesjöfors | midTable | 3 361/10 000 | 33,61 % | <50 % | Godkänd |
| Forsbacka | winLeague | 3 496/10 000 | 34,96 % | Referens, inget intervall | Ej dömd |

## Frusna avskedsorsaker

| Klubb | boardPatience | consecutiveFailures | licenseDenied | bankruptcy | unknown |
|---|---:|---:|---:|---:|---:|
| Heros | 2 | 4 119 | 1 779 | 0 | 0 |
| Söderfors | 1 518 | 0 | 1 360 | 0 | 0 |
| Lesjöfors | 2 047 | 1 | 1 313 | 0 | 0 |
| Forsbacka | 66 | 0 | 3 430 | 0 | 0 |

Orsakerna visar att Heros fortfarande kan falla genom både sportslig misslyckandetrappa och licens, medan mittklubbarnas avsked delas mellan styrelsetålamod och licens. De två vägarna har inte dolts bakom en sammanslagen efterhandsklassificering.

## Avsked per säsong

| Klubb | 2026 | 2027 | 2028 | 2029 | 2030 | 2031 |
|---|---:|---:|---:|---:|---:|---:|
| Heros | 0 | 0 | 2 007 | 1 983 | 586 | 1 324 |
| Söderfors | 137 | 430 | 367 | 1 129 | 160 | 655 |
| Lesjöfors | 175 | 573 | 612 | 1 190 | 158 | 653 |
| Forsbacka | 19 | 29 | 5 | 2 016 | 2 | 1 425 |

## Rotorsak till den röda diagnostiken

Den tidigare 20-seedsdiagnostiken visade 100 % för Heros och 65 % för båda mittklubbarna. Det såg ut som en för hård modell, men den verkliga roten låg i kalibreringsspelaren:

- `pendingScreen` löstes, men `pendingEvents` lämnades obesvarade;
- bland annat licensnämndens handlingsplan låg därför kvar utan spelarbeslut;
- mätningen beskrev en passiv ”zombiepolicy”, inte stressharnessens definierade minimipolicy.

Commit `afa52a86` låter kalibreringsspelaren lösa väntande beslut med en separat deterministisk RNG, så matchmotorns seedföljd inte flyttas. Commit `3b78737e` tillför en återupptagningsbar shard-runner utan att ändra spelregler eller seedmängd.

Experiment med licensmagnitud och boardPatience-multiplikator gjordes bara diagnostiskt och återställdes. De hade dessutom brutit låst licenskadens respektive vänt förväntansstegen åt fel håll. Den formella mätningen kördes på de ursprungliga produktionsvärdena.

## Kontroll mot senare HEAD

Efter den formella checkpointen landade flera refaktorer på `main`, bland annat i rund- och eventhantering. Därför kördes samma lilla pass igen på `1bb4c172` den 8 september:

| Klubb | Avsked | Frekvens | Orsaker |
|---|---:|---:|---|
| Heros | 11/20 | 55 % | 8 consecutiveFailures, 3 licenseDenied |
| Söderfors | 4/20 | 20 % | 2 boardPatience, 2 licenseDenied |
| Lesjöfors | 9/20 | 45 % | 7 boardPatience, 2 licenseDenied |
| Forsbacka | 6/20 | 30 % | 6 licenseDenied |

Detta är bitidentiskt med det lilla passet på `3b78737e`: samma totalsiffror, orsaker och avskedssäsonger. Det bevisar att de senare ändringarna inte skapade drift för dessa kontrollseeds. Den formella 10 000-siffran ska ändå alltid citeras med sin faktiska revision `3b78737e`.

## Dom för fortsatt arbete

Den beslutade avskedskalibreringen är klar. Det finns inget belägg för att röra `licenseRiskScore`-magnituderna eller `RUNNING_LOSS_EXPECTATION_MULTIPLIER` för att nå de tre låsta målen. Eventuella framtida mål för Forsbacka eller andra klubbprofiler är en ny produktdom och ska inte bakas in retroaktivt i denna acceptans.
