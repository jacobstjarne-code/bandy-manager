# Rapport: communityStanding byggd som räddningsspak — mätt, alla tolv + riktad bevisning

2026-08-25. Uppföljning på `RAPPORT_MATCHINTAKT_VIKT_OCH_COMMUNITYSTANDING_2026-08-25.md`. Byggt, testat, mätt enligt ordern.

## Byggt

Ny delad funktion `computeAttendanceRate(fanMood, communityStanding, position, moodWeight?)` (`economyService.ts`) — ersätter TVÅ tidigare oberoende, identiska `attendanceRate`-formler (`calcRoundIncome` och `calcAttendance` hade var sin kopia, samma buggklass som de två licenssystemen i förra rapporten). Ny viktning:

```
FLOOR=0,20 (var 0,35) · fanMood-vikt=0,25 (var 0,40) · communityStanding-vikt=0,45 (NY) · CAP=0,95 (var 0,90)
```

communityStanding är nu den DOMINERANDE termen — större vikt än fanMood, eftersom fanMood strukturellt inte kan rädda en förlorande Survive-klubb (kräver goda resultat) medan communityStanding är ortogonal mot resultat. Golvet sänkt: att ignorera orten kostar nu mer än den gamla neutrala baslinjen.

Trådat igenom på båda ställena: `calcRoundIncome` (intäkten) och `calcAttendance` (den siffra spelaren faktiskt ser i matchvyn) — samma formel, en källa. Skyddat mot en läckrisk: `matchSimProcessor.ts`s anrop till `calcAttendance` körs för ALLA fixtures i en omgång (även AI-klubbar mot varandra) — `communityStanding` skickas bara igenom när hemmalaget FAKTISKT är hanterad klubb, annars faller det till neutral 50 (en AI-klubb har ingen spårad communityStanding, den hanterade klubbens siffra ska inte läcka in i andra klubbars publiksiffror).

8 nya tester (`economyService.test.ts`) — dominansen, golvet, taket, moodWeight-dämpningen på cupfinalhelg, samt att en Survive-liknande klubb faktiskt får högre matchRevenue/publiksiffra vid hög communityStanding. tsc/vitest (273 filer, 2828 gröna) rena.

## Mätt — alla tolv (standardkörning, communityStanding kvar på default 50)

Stresskriptet manipulerar aldrig communityStanding, så detta är "neutralläget" — ingen spelare som medvetet satsar på orten, ingen som ignorerar den:

| Klubb | Före (fjärde mätn.) | Efter (default 50) |
|---|---|---|
| Rögle | 100% | 100% |
| Slottsbron | 95% | 90% |
| Skutskär | 85% | 80% |
| Heros | 100% | 100% |

Väntat och rätt: vid default communityStanding är den nya formelns effekt nästan neutral (en liten uppgång jämfört med gamla golvet 0,35, syns som Slottsbron/Skutskärs små förbättringar — brus/marginal, inget dramatiskt). **Standardkörningen kan aldrig bevisa den kausala kedjan — den kräver att communityStanding faktiskt RÖR sig, vilket ingen AI-spelad karriär gör av sig själv.**

## Mätt — riktad bevisning (NY, `scripts/h5-communitystanding-raddning.ts`)

Samma harness, men communityStanding TVINGAS till ett fast värde varje säsongsövergång — ett kontrollerat experiment som isolerar effekten. Låg (15) = "ignorerar orten". Hög (90) = "sköter orten". Båda är realistiska målvärden för en spelare som medvetet spelar mot eller för community-engagemang (inte en artificiell siffra utanför spelets range).

| Klubb | LÅG (15) | HÖG (90) | Skillnad |
|---|---|---|---|
| Heros (Survive) | 100% avsked | **5% avsked** | −95pp |
| Rögle (AvoidBottom) | 100% | 40% | −60pp |
| Slottsbron (AvoidBottom) | 100% | 15% | −85pp |
| Skutskär (AvoidBottom) | 100% | 30% | −70pp |

**Kontraktet håller: en klubb som sköter orten överlever, en som ignorerar den går under.** Heros går från garanterat avsked till 19 av 20 fullföljda karriärer. De tre AvoidBottom-klubbarna behåller viss restfrekvens vid hög communityStanding (`boardPatience<=15` dyker upp igen) — förväntat och korrekt: de är INTE Survive-tier, så den sportsliga avskedsvägen är fortfarande aktiv för dem (Survive-undantaget från förra passet gäller bara Heros). Ekonomin är räddad; det sportsliga trycket för icke-Survive-klubbar är en annan, redan känd och medvetet orörd mekanism.

## Vad detta betyder för Rögle-tierfrågan (uppdatering)

Föregående dom (nej, inte Survive) står — men det nya fyndet skärper varför: Rögle/Slottsbron/Skutskär behöver INTE Survive-undantaget för att bli spelbara, de behöver bara att spelaren sköter orten. Det bekräftar att den delade ekonomiska skörheten (inte tier) alltid var rätt diagnos, och att fixen (communityStanding-driven publik) löser den för alla fyra samtidigt — precis den typ av gemensam-rot-fix som är att föredra framför en klubbspecifik specialregel.

Inget mer byggt denna runda. `scripts/h5-communitystanding-raddning.ts` sparad som permanent diagnosverktyg (samma mönster som h4-skriptet).
