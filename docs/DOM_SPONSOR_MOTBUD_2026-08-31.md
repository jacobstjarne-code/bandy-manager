# DOM — SPONSOR-MOTBUD: nedsidan som gör det till ett val

**Datum:** 2026-08-31 · **Av:** Opus · **Beslut:** Jacob (bygg motbud) · **Grundad i:** `Sponsor.ts` (weeklyIncome × contractRounds, personality local/regional/foundation), sponsorerbjudandet som accept/reject-event (`sponsorEvents.ts`/eventResolver).

## Varför en dom före ett bygge

Ett motbud utan nedsida är den dominanta strategin "kräv alltid mer" — en gratis optimering utan sting, samma tandlöshet vi just la dagar på att fixa i anspåk 4. Så motbudet byggs INTE som en tredje knapp först; det byggs runt en risk. Det här är den risken.

## Domen — motbudet är ett SPEL, inte en förhandling

Ett sponsorerbjudande har idag fasta villkor (X kr/omg × N omgångar) och två utgångar: acceptera, avslå. Motbudet lägger till: **kräv bättre villkor — och riskera att sponsorn drar sig ur helt.**

Tre utfall på ett motbud, avgjorda av budet mot sponsorns dolda reservationsnivå:
1. **Sponsorn accepterar** de bättre villkoren. Du vann.
2. **Sponsorn står fast** vid sitt ursprungserbjudande — motbudet avvisat, men originalet ligger kvar, du kan fortfarande acceptera det. Ingen förlust, ingen vinst.
3. **Sponsorn drar sig ur.** Erbjudandet är borta, helt. Det är nedsidan.

**Det som gör det till ett val:** utfall 3:s sannolikhet stiger med hur aggressivt motbudet är. Ett modest motbud (strax över reservationen) lyckas nästan alltid för en liten vinst. Ett aggressivt motbud (långt över) ger stor vinst om det tar — men hög risk att sponsorn går. Spelaren väger vinst mot risk att förlora affären. Bägge sidor svider: pressa för hårt → tappa avtalet; spela säkert → knappt någon vinst.

### Mekanik (Code)
- **Reservationsnivå per sponsor**, härledd ur det som redan finns: personlighet (local = lojal, grund ficka, låg reservation men går sällan; regional = djupare ficka, högre tak men går lättare; foundation = kalibreras), plus klubbens läge (hög CS / framgång = du har hävstång, sponsorer bjuder högre och går mer sällan). Ingen ny sanning uppfunnen — allt ur befintliga fält.
- **Motbudet är ETT tal** (kräv Y kr/omg, Y > originalets X). Enkelrunda: motbud → sponsorns slutbesked (accepterar / står fast / drar sig ur). Ingen oändlig prutning.
- **Utdragschansen** = funktion av (Y − reservation). Under reservationen: accepteras. Strax över: står fast. Långt över: drar sig ur, sannolikhet stigande med avståndet. Kurvan kalibreras + D-fact.
- **Läsbar disposition:** sponsorns personlighet ska ge spelaren en hint om hur hårt den tål att pressas — en local tål lite, en regional mer men bryter tvärt. Inte en dold tärning; en avläsbar motpart.

### SKYDDAT
- **Originalet överlever ett avvisat motbud** (utfall 2) — annars är varje motbud en all-in-satsning och ingen skulle våga. Risken ska ligga i utfall 3 (aggressivt bud), inte i att våga kräva alls.
- **Ingen ny intäktsaxel** — motbudet höjer bara ETT befintligt erbjudandes villkor, inget nytt kr-flöde utanför sponsormodellen.

### GODKÄNT NÄR (mätt)
1. Motbud är ett genuint spel, inte "kräv alltid mer"-dominant: ett aggressivt motbud förlorar affären tillräckligt ofta att spelaren tvekar.
2. Ett modest motbud lyckas oftast, för en liten vinst — spaken är värd att dra ibland, inte alltid.
3. Sponsorns personlighet är avläsbar nog att informera budet (local tål lite, regional mer men bryter).
4. Ingen freebie: förväntat värde av "kräv alltid maximalt" är NEGATIVT mot "acceptera originalet" för de flesta sponsorer.
Magnitud (reservation per personlighet, utdragschans-kurvan) via mätning. **D-fact innan commit.**

## Text (Opus, skrivs när Code:s struktur står)
- Motbudets inramning ("kräv mer — men de kan gå").
- Sponsorns tre svar: accepterar de bättre villkoren, står fast vid originalet, drar sig ur. Tre register per personlighet är för mycket för v1 — en per utfall, personlighets-neutral, räcker.

## Ägarskap
Code: bygg reservation + enkelrunda + de tre utfallen + utdragschans-kurvan → mät 1–4 → D-fact → commit. UI:t rider `BidModal`-mönstret (konfigurera-sen-bekräfta finns redan för transferbud). Opus: texten när strukturen står; dömer mätningen om utdragschansen hamnar i gråzon (för snäll = freebie, för hård = ingen vågar). Jacob: mandatet givet; nästa gång du behövs är om reservation-per-personlighet blir en balanskall.
