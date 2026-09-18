# DOM — Språksvep 4 (pronomen, historik, tidsspann, absoluta påståenden), 2026-09-12

**Underlag:** Codes fyra svep (A–D), 542 + 20 + 74 + 219 kandidater, 10 K-fynd. Dom och åtgärd per fynd nedan. Textfixarna är Opus och ligger på disk; två strukturella punkter är Code.

## Dom: texten viker, inte mekaniken

Inget av fynden motiverar ny state (räknare för "tidigare tysta svar", skandalhistorik-lookup, tenure-fält). Regeln som gäller: **en replik får inte påstå något om sparfilens historik som ingen kod kontrollerar.** Där kontrollen finns (playoff-"första gången", callback-beats, legend-rekord) står texten. Där den saknas skrivs påståendet bort — samma ton, ingen ny mekanik.

## Åtgärdat på disk (Opus)

| Fynd | Fil | Åtgärd |
|---|---|---|
| A K1 mecenat-krav "han/hans" | `mecenatService.ts` | Pronomenobjekt på `mecenat.gender`, samma mönster som intro-eventet (gjort av parallell Opus-instans) |
| A K2 kris-väg C "kan han täcka" | `economicCrisisService.ts` | `richestMecenat.gender` → hon/han (parallell instans) |
| A latent domare "Han dömde" | `refereeService.ts` | "Det dömdes likadant åt båda hållen." — passiv, inget pronomen |
| B akademigenombrott "två år"/"tre"/"sedan tolv" | `academyBreakthroughText.ts` | Poolen delad: 6 tidsneutrala rader + 3 tidsbundna med `minSeasons`. `academyBreakthroughQuote(playerId, seasonsInAcademy?)` — utan argument bara neutrala |
| D1/D2 "Första segern"/"Första derbyt" | `portalBeats.ts` | Text är funktion: absolut form bara när `seasonSummaries` är tom, annars "Säsongens första …". Trigger och nyckel orörda |
| D3 assistenttränare "igen"/"inte första gången" | `assistantCoachService.ts` | Två grumpy-rader omskrivna utan historikpåstående |
| D4 press "Det är inte första gången" | `csPressEventText.ts` | "{JOURNALIST} noterade det." |
| D5 politikern "inte första gången pengar rinner" | `scandalService.ts` | "Skattepengar ska inte rinna åt fel håll, oavsett vilken klubb det gäller" |
| D6 clubLegends[0] "en av de bästa som någonsin" | `schoolAssignmentService.ts` | Sort på totalGoals (parallell instans) + text "Ingen som lämnat oss har gjort fler." — sant per konstruktion |

## Vändning 2026-09-12 em: raderna återinförda, gatade på academyJoinedSeason

Kedjan var: (1) raderna delades i pool + tenure-gate, (2) verifieringen visade att `joinedClubSeason` sätts till uppflyttningssäsongen → differens alltid 0 → raderna ströks som orräddbara, (3) men samma dag byggde Code fältet **`Player.academyJoinedSeason`** (`academyService.ts:buildPromotedPlayerFromYouth`, `academyJoinedSeason: youthPlayer.joinedSeason ?? currentSeason`) som bevarar P19-inträdet genom uppflyttningen — precis det fält som saknades. Med det finns tenure faktiskt tillgänglig, så de tre raderna är **återinförda** och gatade på den, inte strukna.

`academyBreakthroughQuote(playerId, opts?)` tar nu antingen `{ academyJoinedSeason, currentSeason }` (beräknar tenure internt, på ett ställe) eller en rå siffra (för anropare som redan har talet). Utan uppgift → bara neutrala rader. Ingen väg ger ett falskt tidspåstående. Testet skrivet om till gränsvillkoren (0 → inga tenure-rader; 3 → minSeasons≤3 men inte 4; 4 → alla tre).

### Code (en punkt, kräver anropsstället)

Hitta anropet av `academyBreakthroughQuote` (grep — jag har inte innehållssökning härifrån; det är genombrottseventets producent, fyrar på spelarens första A-lagsmatch, `totalGames === 1`). Byt argumentet till:

```ts
academyBreakthroughQuote(player.id, {
  academyJoinedSeason: player.academyJoinedSeason,
  currentSeason: game.currentSeason,
})
```

`player.academyJoinedSeason` är optional (undefined för äldre saves) — funktionen faller då korrekt tillbaka till neutrala rader, ingen guard behövs på anropssidan. Om anropet idag skickar Codes gamla `seasonsInAcademy`-tal (= 0) fungerar det oförändrat tills du byter det; ingen regression, bara att tenure-raderna förblir stängda tills bytet är gjort. Verifiera efteråt: en akademispelare med ≥2 säsongers `academyJoinedSeason`-differens kan få en tidsbunden rad i genombrottseventet.

Ligger i nästa text-commit med övriga DOM_SPRAKSVEP4-fixar om de inte redan är pushade — annars egen liten commit (`academyBreakthroughText.ts` + testet + anropsstället).

## Inte åtgärdat, medvetet

- `communityNames.ts` korvrekord, `matchCommentary.ts` "första gången för året" (väder), statisk klubblore — ofalsifierbara, som Code redan klassade.
- Journalister/motståndartränare refereras aldrig med tredjepersonspronomen — ingen fix behövs förrän någon skriver en sådan rad. Regel framåt: **ny text om mecenat, domare, journalist eller tränare går alltid via ett pronomenobjekt, aldrig hårdkodat han/hon.** Läggs som lärdom i TEXT-AUDIT-PROTOKOLL av den som nästa gång rör de poolerna.
