# SPEC — Klack-matchreaktion (kartfynd 8a)

**Datum:** 2026-06-14 · **Av:** Opus · **För:** Code (Sonnet, RC-polish-tier) · **Storlek:** liten, en plats
**Verifierat:** `supporterGroup.mood` startar 60, ändras ENBART av supporter-events (tifo, Sture/Elin, Tommys brev, bortaresa). Saknar matchreaktion → ligger parkerad på 60 för en sim-spelare (Designs observation). Setter `adjustSupporterMood(group, delta)` finns i supporterService. Pulsen (communityProcessor `processCommunity`) har redan matchreaktionsmönstret att kopiera.

---

## Problemet i en mening
Klacken reagerar på hur du behandlar KLACKEN, men inte på hur LAGET spelar. En signaturmätare ligger död för den som inte petar i sidoevents.

## Fixen — mata `adjustSupporterMood` på matchutfall i communityProcessor

I `processCommunity`, i `justCompletedManagedFixture`-blocket (där pulsens csBoost redan beräknas ur won/lost/bigWin/bigLoss/derby), lägg en PARALLELL klack-delta. Klacken har EGEN profil — inte en kopia av pulsens magnitud:

```ts
// Klack-matchreaktion (kartfynd 8a): klacken lever med laget, inte bara med relationen.
// Profil skild från pulsen: känsligare på derby (klackens hjärtefråga),
// mindre på rena tabellresultat (klacken bryr sig om kamp/stolthet > poäng).
let klackDelta = 0
if (bigWinCs)       klackDelta = 4
else if (wonCs)     klackDelta = 2
else if (bigLossCs) klackDelta = -5
else if (lostCs)    klackDelta = -3
// Derby väger tungt för klacken — dubbel vikt mot pulsens ±2
if (matchRivalryCs && wonCs)  klackDelta += 4
if (matchRivalryCs && lostCs) klackDelta -= 4
```

Applicera via setter:n (klamras 0–100 där):
```ts
if (game.supporterGroup && klackDelta !== 0) {
  adjustSupporterMood(game.supporterGroup, klackDelta)
}
```

## Kalibrering — varför dessa tal
- **Mindre än pulsen på rena resultat** (klack ±2/±3/±4/±5 vs puls ±2/±4/±5/±6): pulsen är hela bygden, klacken är de redan hängivna — de överger inte laget på en förlust lika lätt, men de tänds av kamp.
- **Mer än pulsen på derby** (klack ±4 vs puls ±2): derbyt ÄR klackens identitet. Ett derbyresultat ska kännas hårdare i klacken än i bygden i stort.
- **Ingen mean reversion på klacken** (till skillnad från pulsen): klacken har inget naturligt "mitten" — den är antingen tänd eller sur. Men: verifiera över en säsong att den inte fastnar i golv/tak. Om den driftar extremt, lägg en svag reversion mot 50 (0.05/omg), INTE pulsens 3%.

## Vad detta INTE är
- Inte fanMood (8b, publiken/biljettintäkt — separat fynd, väntar på Opus-kurva mot speltestdata).
- Inte en omskrivning av supporter-events — de befintliga deltan (tifo +5 etc.) lever kvar OFÖRÄNDRADE. Detta ADDERAR matchreaktionen de saknade.

## Verifiering
Spela en säsong med bara sim-matcher, rör inga supporter-events. Förväntat EFTER: klack-mood rör sig med resultaten (stiger på vinstsvit, dyker på derbyförlust) istället för att ligga på 60. Det var exakt det Design saknade.

## Ordning
Code: en sammanhängande ändring i communityProcessor + import av `adjustSupporterMood`. Diff till Opus om kalibreringen känns fel mot pulsen. Commit: `feat: klack-matchreaktion — supporterGroup.mood reagerar på resultat (kartfynd 8a)`.

— Opus, 2026-06-14
