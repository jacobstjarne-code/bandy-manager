# Klippkontroll communityStanding 70/71 — 2026-09-08

**Status:** den gamla 95 % → 10 %-klippan är stale och kan inte reproduceras mot dagens kod.

## Varför den gamla mätningen inte längre beskriver spelet

Den ursprungliga sjunde mätningen kördes innan två senare rättelser:

- `404176f6` pensionerade det parallella `licenseReview`-systemet, inklusive dess absoluta −200 000-kronorströskel. Den kanoniska `licenseStatus`-vägen äger nu licenskonsekvenserna.
- `afa52a86` rättade kalibreringsspelaren så att `pendingEvents` faktiskt besvaras med en separat deterministisk RNG. Tidigare låg bland annat licensnämndens handlingsplan obesvarad genom karriären.

Den formella 10 000-seedskörningen i `AVSKEDSKALIBRERING_FORMELL_10000_2026-09-07.md` visade därefter Heros på 59,00 %, inom det låsta intervallet 55–65 %, utan ändrade produktionsparametrar.

## Direkt reproduktionsförsök

`scripts/h5-communitystanding-raddning.ts` har uppdaterats till samma moderna pending-event-policy och körts med 20 parade seeds, fyra säsonger, där communityStanding pinnades inför varje omgång.

| Klubb | CS 70 | CS 71 |
|---|---:|---:|
| Heros | 10/20 avsked (50 %) | 10/20 avsked (50 %) |
| Rögle | 10/20 (50 %) | 11/20 (55 %) |
| Slottsbron | 7/20 (35 %) | 8/20 (40 %) |
| Skutskär | 6/20 (30 %) | 6/20 (30 %) |

Heros gav identiskt utfall och identisk orsaksmix på båda sidor om den gamla gränsen: sex `boardPatience` och fyra `licenseDenied`. Övriga klubbar visar högst ett utfalls skillnad i detta lilla stickprov, inte den gamla regimväxlingen.

## Slutsats

Det finns ingen kvarvarande produktbugg att rotorsaksfixa under id `sluttest-klippan-rotorsak`. Den gamla observationen hörde till en pensionerad licensarkitektur och en ofullständig testspelare. Framtida misstanke om en ny communityStanding-klippa måste öppnas som en ny rad med en aktuell, reproducerbar mätning.
