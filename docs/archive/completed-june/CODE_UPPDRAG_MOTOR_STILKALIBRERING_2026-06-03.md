# CODE-uppdrag: Motor — stilkalibrering (klustring dispositionell + hörnextremer komprimerade)

**Skapad:** 2026-06-03
**Beställare:** Jacob (Opus) — klartecken givet
**Förutsättning:** Stil-kontinuum-mätningen (Fas 1 testfall 5) klar. Detta åtgärdar dess två fynd.
**Karaktär:** Första riktiga steget i överflyttningen till spelet — det handlar om hur olika lag *känns att möta*, inte bara om en kalibreringssiffra.

---

## Vad mätningen visade

Riktningen är rätt (omställningsprofiler → fler skurar, färre hörnmål; hörnprofiler tvärtom), men de två axlarna är felkalibrerade åt motsatta håll:

| Axel | Motor | Verkligt | Dom |
|---|---|---|---|
| Hörnmålsandel | 11,9–26,4 % | 19,3–23,6 % | För bred (extremer = karikatyrer) |
| Kluster-frekvens | 0,66–0,98 (1,5×) | 0,57–1,18 (2,1×) | För smal **och icke-monoton** |

## Diagnos

Burst-/momentum-mekaniken är kopplad till matchens **tillstånd** (situationellt — post-paus, kvittering) men inte till lagets **identitet** (dispositionellt). Därför rör tempo/passingRisk/mentality knappt klustringen, och den blir till och med icke-monoton (balanserad 0,73 < hörnlutande 0,90) — den drivs av lagstyrka och slump snarare än av inställning.

## Princip — en mekanik, två ingångar

Momentum byggdes som situationellt. Det som saknas är en **dispositionsingång**: ett högtempolag spelar i skurar *av karaktär*, oavsett ställning. Lägg till den ingången till samma burst-mekanik. Samma maskineri som producerar realistiska comebacks ska producera stilistisk klustring.

## Fix 1 — Klustring (prioritet)

Koppla tempo/passingRisk/mentality till burst-mekaniken som en dispositionsingång. Tre krav:
- **Monotonicitet först.** Högre taktisk aggressivitet → fler skurar, monotont. En spak som inte ens pekar rätt väg är värre än en för svag. Minst lika viktigt som magnituden.
- **Magnitud:** vidga spannet från 1,5× mot verklighetens 2,1×.
- **Avkoppla från styrka.** Klustringen drivs i dag mer av lagstyrka/slump än av inställning. Öka taktikens hävstång *relativt* styrka/brus, så att två lika starka lag med olika taktik visar det verkliga klustringsspannet. Det är taktiken, inte styrkan, som ska differentiera rytmen.

Fitta inte 2,1× direkt — inför dispositionsingången och låt spannet falla ut. Når en enda hävstångsparameter inte både monotonicitet och full magnitud, prioritera monotonicitet + ett materiellt bredare spann och landa i bästa gemensamma punkt.

## Fix 2 — Hörnor (enklare, motriktad)

Komprimera cornerStrategy-extremerna så maxprofiler inte skjuter förbi 19,3–23,6 %. **Mittprofilerna ringar redan in verkligheten — rör dem inte.** Dämpa bara ändarna (en mättande/avtagande respons vid spakens ytterlägen), inte hela spaken.

## Kritisk regressionsvakt

Fixen rör **samma momentum-mekanik som comeback-arbetet.** Dispositionsingången får inte bryta de strukturgap vi just stängde. Verifiera efter ändringen:
- Comeback ≈ 9 %, draws ≈ 13,8 %, hemvinst ≈ 47 %
- Aggregerad klustring ≈ 0,758
- Marginaler (findings 047–050)
- Testsviten (1078/1078)

Backa om något bryts.

## Vad Code INTE ska göra
- Inte fitta klustringssiffran direkt — mekanism (disposition → burst), inte konstant.
- Inte röra hörnornas mittprofiler — bara komprimera extremerna.
- Inte låta klustringen drivas av lagstyrka — det är taktiken som ska differentiera den.
- Inte bryta de strukturella momentum-gapen (comeback/draws/hemvinst).
- Inte använda `minute >= 46`.

## Output

Per axel: nytt spann mot verkligt (hörnmålsandel mot 19,3–23,6, kluster-frekvens mot 0,57–1,18), och för klustringen explicit: **är den nu monoton med taktisk aggressivitet?** Plus full regressionsstatus (strukturgap + marginaler + aggregerad klustring + tester). Och en mening om vad det betyder för spelet: känns ett omställningslag och ett hörnlag nu olika i *rytmen*, inte bara i hur målen kommer?
