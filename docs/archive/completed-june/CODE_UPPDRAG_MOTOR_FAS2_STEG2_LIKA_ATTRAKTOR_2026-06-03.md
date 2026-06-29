# CODE-uppdrag: Motor-kalibrering Fas 2 — steg 2: lika-attraktorn i 2H-modellen

**Skapad:** 2026-06-03
**Beställare:** Jacob (Opus) — klartecken givet
**Förutsättning:** Fas 2 steg 1 (post-paus) levererat. Detta adresserar rotorsaken bakom tre strukturgap.

---

## Rotorsaksfyndet (varför detta uppdrag finns)

Tre strukturgap visade sig vara **ett** problem:
- Comeback för låg (motor ~15 % vid +1 mot verkligt 24 %)
- Oavgjorda för många (motor 18,7 % mot verkligt 10,7 %)
- Hemvinst för låg (motor 43 % mot verkligt ~51 %)

Diagnos: hemmafördelens **magnitud är nästan rätt** (ren harness +11,3 pp mot verkligt +12,5 pp). Hemvinsten trycks ner av de överflödiga ~8 pp oavgjorda. Och de överflödiga oavgjorda kommer från en **lika-attraktor i 2H-modellen**: när det jagande laget kvitterar nollställs det direkt till even_battle, momentum dör, och matchen fastnar lika i stället för att comebacken fullbordas.

Det är därför konstant-tuning inte fungerar — comeback och draws drar åt motsatt håll via en konstant (mer comeback-kraft → fler kvitteringar → fler draws). En symmetrisk even_battle-boost prövades och rörde draws försumbart (18,7→18,1 %); den är återställd, ingen död konstant kvar.

## Ändringen — modellera orsaken

Inför momentum-efter-kvittering: ett lag som just kvitterat **behåller momentum** i stället för att omedelbart falla till even_battle. Då springer det förbi kvitteringen mot ledning i stället för att stanna vid lika. Detta trycker comeback upp OCH draws ner i **samma** riktning — till skillnad från en konstant.

Det kräver en ny tillståndsvariabel i 2H-loopen (t.ex. en avtagande "nyss kvitterat"-flagga för det kvitterande laget). Spec och verifiera i ett svep — kranka inte live.

## Framgångssignatur (viktigast att vakta)

Om diagnosen stämmer ska **hemvinsten självkorrigera mot ~51 % när draws faller — utan att hemmafördelens magnitud rörs.** Det var de överflödiga draws som höll ner den. Det starkaste kvittot är alltså: en mekanism → draws ner → comeback upp → hemvinst reser sig på köpet. Tre gap, en fix.

**Reser sig inte hemvinsten när draws faller är kopplingshistorien ofullständig — gräv i det innan du ropar seger.** Rör INTE hemmafördelens magnitud för att kompensera; det vore att maskera ett kvarstående fel.

## Mål

- Draws → ~10,7 %
- Comeback → ~13,3 % bas / ~24 % vid +1
- Hemvinst → ~51 % (som sidoeffekt, ej via hemmafördels-magnitud)

## Kalibreringsdisciplin (anti-överfit)

En momentum-parameter ska flytta både comeback och draws materiellt åt rätt håll — det bevisar att det är rätt spak. Men förvänta dig inte att en enda ratt träffar båda målen exakt. **Kräver det att du trycker comeback förbi 24 % för att få draws ända ner till 10,7 %, landa i den bästa gemensamma punkten och rapportera den — lägg inte till en andra epicykel för att tvinga fram exakthet.** Hellre "båda klart bättre, inget perfekt" än en överfit. Samma logik som fick dig att stanna på post-paus.

## Regressionsregel

Efter ändringen, verifiera att inget brutits:
- **Klustringsträffen (cluster_freq ≈ 0,754)** — oförändrad genom hela passet hittills, är regressionstest.
- Marginalerna (findings 047–050) — oförändrade.
- Testsviten — grön (var 1078/1078).

Backa om något bryts.

## Vad Code INTE ska göra

- Inte kranka hemmafördelens magnitud (diagnosen säger att den inte är problemet).
- Inte återinföra konstanta even_battle-boostar.
- Inte överfitta ett mål på ett annats bekostnad — landa i bästa gemensamma punkt.
- Inte använda `minute >= 46`.

## Output

Mekanismen som infördes (tillståndsvariabeln, inte vilken siffra som träffades), före/efter på alla fyra metriker (comeback, draws, hemvinst, klustring) plus marginaler och testantal, och explicit bekräftelse av framgångssignaturen: reste sig hemvinsten när draws föll, utan att hemmafördelen rördes? Om inte — rapportera det som ett resultat och gräv vidare.
