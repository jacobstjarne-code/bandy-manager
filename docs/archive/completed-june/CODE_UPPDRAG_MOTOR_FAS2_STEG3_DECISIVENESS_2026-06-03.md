# CODE-uppdrag: Motor-kalibrering Fas 2 — steg 3: decisiveness i jämna sena lägen

**Skapad:** 2026-06-03
**Beställare:** Jacob (Opus) — klartecken givet
**Förutsättning:** Steg 2 (momentum-efter-kvittering) levererat. Detta är dess saknade andra halva.

---

## Varför detta uppdrag finns (resultatet från steg 2)

Momentum-efter-kvittering visade sig vara rätt spak för comeback (7,6→9,2 %, fönster 8,7→11,0 %) men **inte** för draws (stod still på 18,5 %) eller hemvinst (44,4 %). Per anti-överfit-regeln betyder det att spaken är rätt för det ena gapet men inte det andra — och dig-in visade varför:

- 71 % av motorns draws är "ledde vid HT → slutade lika".
- HT-ledarens utfall i motorn: **draw 17 % mot verkligt ~8 %, förlust 8,6 % mot verkligt ~13 %.**
- Mekanismen: post-paus + momentum hjälper fler underlägeslag att *nå* lika i ungefär samma takt som momentumet konverterar lika→vinst. Inflöde ≈ utflöde → netto noll på draws.

Rotorsaken sitter ett steg upp: **motorn löser inte upp jämna sena lägen decisivt nog.** even_battle är för lågvarians — den väger i stället för att avgöras. Verkliga jämna sena lägen löses upp (någon vinner) eftersom 2-poängsincitamentet får båda lagen att öppna upp för segern.

## Synteser — detta är steg 2:s andra halva, inte en ersättning

Steg 2 gav det kvitterande laget momentum, men matade in det i ett tillstånd som inte löser sig. Momentum säger *vem* som vinner en jämn upplösning; ingenting säger att den jämna situationen ska **upplösas**. Det här uppdraget lägger till upplösningen. Tillsammans: comebacken fullbordas, draws faller, hemvinsten självkorrigerar.

## Ändringen — modellera orsaken

I jämna sena lägen (tied eller inom räckhåll, sen regulationstid) ska båda lagen **öppna upp för segern** — ett högvarianstillstånd där någon faller ut som vinnare — i stället för att sitta i ett balanserat lågvarianstillstånd. Upplösningen ska **respektera momentum**: laget som nyss kvitterat är favorit att vinna den. Det är en frekvens-/variansändring i det jämna sena tillståndet, inte en konstant ovanpå.

Fitta INTE draw-siffran direkt. Inför mekanismen (öppna-upp-för-segern → högre varians → upplösning) och låt draws falla ut.

## Framgångssignatur — den direkta diagnostiken

Den här gången har vi ett skarpt mått att vakta: **HT-ledarens utfallsfördelning.** Mekanismen ska flytta den mot verkligheten — draw 17 → ~8 %, förlust 8,6 → ~13 %. Rör den fördelningen är det rätt spak. Och då ska:
- draws → ~10,7 %
- hemvinst → ~51 % (självkorrigerande — rör INTE hemmafördelens magnitud)

## Vakt-punkt (motsatt steg 2:s)

**Comebacken får inte tryckas ner igen.** Den ligger på 9,2 % och är på rätt väg. Risken med att göra jämna lägen mer decisiva är att ledningar blir för svåra att vända. Samkalibrera: decisiveness ska få situationen att *avgöras*, men momentum ska låta det kvitterande laget vinna sin beskärda del (verkligheten: HT-ledaren förlorar 13 %). Verifiera att comeback ligger kvar på 9,2 %+ efter ändringen.

## Verifiera fem saker samtidigt
- Draws → ~10,7 %
- HT-ledarens fördelning → draw ~8 %, förlust ~13 %
- Hemvinst → ~51 % (utan att hemmafördelen rörs)
- Comeback **kvar** på 9,2 %+
- Klustringen (0,758) oförändrad + marginaler (047–050) + testsviten grön

## Vad Code INTE ska göra
- Inte kranka hemmafördelens magnitud.
- Inte hjälpa underlägeslag *mer* (fel spak — skapar fler kvitteringar, inflödesproblemet igen).
- Inte göra ledningar oövervinnerliga (trycker ner comeback).
- Inte fitta draw-siffran direkt — mekanism, inte konstant.
- Inte använda `minute >= 46`.

## Output
Mekanismen som infördes (tillståndsändringen, inte vilken siffra som träffades), före/efter på alla fem måtten ovan, och explicit svar på: rörde sig HT-ledarens fördelning mot verkligheten, och reste sig hemvinsten av sig själv när draws föll? Om en enda parameter inte når alla mål — landa i bästa gemensamma punkt och rapportera, ingen andra epicykel.
