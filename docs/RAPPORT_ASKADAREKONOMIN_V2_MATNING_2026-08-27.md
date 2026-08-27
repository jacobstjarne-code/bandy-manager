# Rapport: Åskådarekonomin, andra kandidaten — sqrt(publik) + kostnadsrelativt golv

2026-08-27. Kandidaten mätt, INTE wirad i produktionskod (samma protokoll som förra rundan — `economyService.ts` är oförändrat på gamla moodMult-formeln). Två ändringar mot den kastade kandidaten: `kr/huvud × sqrt(publik)` istf linjär publik, och golvet satt till 50% av driftskostnaden istf ett fritt valt kronbelopp. Script: `scripts/askadarekonomin-matning-v2-2026-08-27.ts`.

## Ingen explosion — den stora vinsten mot förra kandidaten

Förra kandidaten gav Forsbacka 27-34× på sin dyraste tier. Den här ger 7,9-10,5× — fortfarande en stor siffra, men av en ANNAN anledning än förra gången, se nästa avsnitt.

| Klubb | rep | Tier | Gammal | Ny | Kvot |
|---|---|---|---|---|---|
| Forsbacka | 85 | basic | 4 077 | 42 616 | 10,45× |
| Forsbacka | 85 | upgraded+VIP | 19 407 | 153 586 | 7,91× |
| Skutskär | 52 | basic | 434 | 6 544 | 15,08× |
| Söderfors | 55 | basic | 4 206 | 13 153 | 3,13× |

## Varför kvoterna ändå ser stora ut — en mätnyans, inte en ny explosion

**Den gamla formelns NETTO (efter driftskostnad) ligger nära noll för flera klubbar** — Forsbacka basic netto är bara 4 077 kr för HELA säsongen (18 hemmamatcher), eftersom moodMult (0,7-1,3×) knappt täcker den flata driftskostnaden. En kvot räknad mot en nära-noll-nämnare blir stor även vid en måttlig förändring i BRUTTO-intäkten. Jag har INTE räknat ut vad kiosk-tillägget betyder som ANDEL av klubbens totala säsongsekonomi (weeklyBase + sponsorer + biljettintäkt) — det är den kontext som avgör om 42-153k/säsong är litet eller stort i sammanhanget, och jag har inte byggt den jämförelsen i den här mätningen. Om du vill ha den, säg till — enkelt att lägga till.

## Heros — förbättrat, INTE löst

Detta var den konkreta invändningen förra gången: skulle en svag klubb bli SÄMRE på den dyraste tiern. Svaret nu:

| Klubb | Tier | Gammal | Ny | Δ |
|---|---|---|---|---|
| Heros (rep 45) | upgraded+VIP | 5 472 | 2 173 | **−3 299** |

**Fortfarande en försämring, men mindre än förra kandidatens −11 393 (en minskning av problemet med ~71%, inte en lösning av det).** Rotorsak, mätt: vid Heros egen publik (snitt 172, ofta lägre i enskilda matcher) klarar `sqrt(publik)`-termen inte alltid golvet på 50% av driftskostnaden — kiosk+VIP-delen blir själva en nettoförlust som bara delvis kompenseras av lotteriets nya hemmabonus (som INGÅR i totalen ovan och gör att slutsumman inte blir djupare negativ). De tre andra svaga klubbarna (Rögle, Slottsbron, Skutskär) förbättras även på dyraste tiern denna gång — Heros är fortfarande undantaget, konsekvent med förra mätningen.

**Öppen fråga jag inte besvarar åt dig:** räcker 50% golv-andel, eller behöver den vara högre (70-80%) specifikt för att stänga Heros-gapet helt? Jag har inte testat andra golv-andelar — det är nästa mätning om du vill se den, inte en gissning jag gör nu.

## Fullständig tabell, alla tolv

| Klubb | rep | snittpublik | Tier | Gammal | Ny | Δ | Kvot |
|---|---|---|---|---|---|---|---|
| Forsbacka | 85 | 1711 | basic | 4 077 | 42 616 | +38 539 | 10,45× |
| Forsbacka | 85 | 1711 | upgraded+VIP | 19 407 | 153 586 | +134 179 | 7,91× |
| Söderfors | 55 | 436 | basic | 4 206 | 13 153 | +8 947 | 3,13× |
| Söderfors | 55 | 436 | upgraded+VIP | 17 787 | 38 551 | +20 764 | 2,17× |
| Västanfors | 78 | 744 | basic | 4 600 | 22 972 | +18 372 | 4,99× |
| Västanfors | 78 | 744 | upgraded+VIP | 19 828 | 75 951 | +56 123 | 3,83× |
| Karlsborg | 68 | 1143 | basic | 3 799 | 30 944 | +27 145 | 8,15× |
| Karlsborg | 68 | 1143 | upgraded+VIP | 18 225 | 107 837 | +89 612 | 5,92× |
| Målilla | 65 | 600 | basic | −895 | 13 800 | +14 695 | — |
| Målilla | 65 | 600 | upgraded+VIP | 5 709 | 43 932 | +38 223 | 7,70× |
| Gagnef | 63 | 600 | basic | 2 523 | 14 950 | +12 427 | 5,93× |
| Gagnef | 63 | 600 | upgraded+VIP | 13 173 | 47 593 | +34 420 | 3,61× |
| Hälleforsnäs | 60 | 425 | basic | −778 | 11 168 | +11 946 | — |
| Hälleforsnäs | 60 | 425 | upgraded+VIP | 6 568 | 32 491 | +25 923 | 4,95× |
| Lesjöfors | 62 | 313 | basic | −536 | 6 867 | +7 403 | — |
| Lesjöfors | 62 | 313 | upgraded+VIP | 5 804 | 17 149 | +11 345 | 2,95× |
| **Rögle** | 50 | 385 | basic | −558 | 9 420 | +9 978 | — |
| **Rögle** | 50 | 385 | upgraded+VIP | 6 383 | 26 388 | +20 005 | 4,13× |
| Slottsbron | 48 | 289 | basic | −86 | 7 567 | +7 653 | — |
| Slottsbron | 48 | 289 | upgraded+VIP | 7 953 | 18 061 | +10 108 | 2,27× |
| Skutskär | 52 | 255 | basic | 434 | 6 544 | +6 110 | 15,08× |
| Skutskär | 52 | 255 | upgraded+VIP | 8 996 | 13 963 | +4 967 | 1,55× |
| **Heros** | 45 | 172 | basic | −704 | 3 182 | +3 886 | — |
| **Heros** | 45 | 172 | upgraded+VIP | 5 472 | 2 173 | **−3 299** | 0,40× |

## Sammanfattning

- Ingen explosion — de tre andra svaga klubbarna (Rögle, Slottsbron, Skutskär) förbättras nu även på dyraste tiern.
- Heros fortfarande sämre på upgraded+VIP, men problemet krympt med ~71% (−3 299 mot −11 393).
- Kvoterna (2-15×) speglar delvis att den gamla formelns nettomarginal redan låg nära noll — inte nödvändigtvis att bruttovärdena är orimliga. Ingen jämförelse mot klubbens totala säsongsekonomi gjord än.
- Inget byggt i produktionskod. Väntar på din dom: godkänn magnituderna, be om en högre golv-andel för Heros specifikt, eller något annat.
