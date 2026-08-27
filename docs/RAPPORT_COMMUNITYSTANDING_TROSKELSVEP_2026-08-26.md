# Rapport: alla binära trösklar mot communityStanding — punkt 1, innan resten

2026-08-26. Grep:ade hela `src/domain`, `src/application`, `src/presentation` för `communityStanding` (274 träffar totalt). Klassificerat varje träff: kontinuerlig formel, binär tröskel, eller ren visning. **13 binära trösklar hittade, ingen av dem dokumenterad eller kalibrerad (noll D-facts täcker communityStanding överhuvudtaget).** Sponsortröskeln (redan fixad) var alltså inte ett undantag — den var representativ för ett mönster.

## De 13 trösklarna, viktigast först

**Exakt på samma 70/71-linje som den redan fixade sponsortröskeln** (förstärker misstanken om att gränsen är särskilt läckande):

1. **`communityProcessor.ts:307`** — `diminishingFactor = cs>85 ? 0.25 : cs>70 ? 0.5 : cs>55 ? 0.75 : 1.0`. Gäller VARJE positiv CS-höjande händelse, varje omgång. Vid cs=70 landar en +8-boost som +4.0; vid cs=71 landar SAMMA boost som +2.0 — en diskret halvering av tillväxttakten exakt på gränsen. Generell, ingen scoping.
2. **`reputationMilestoneService.ts:59`** — `cs > 70` ger en engångsmilstolpe (+2 CS). Litet i sig, men förstärker precis samma gräns.
3. **`gameStore.ts:983`** — spelarinitierat politikerbidrag: `cs > 70` ger +10 000 kr rakt av, ingen interpolering. Strukturellt identisk med sponsorbuggen, bara mindre (10k mot 80k) och spelarutlöst istf automatisk.

**Störst i kronor:**

4. **`eventProcessor.ts:474`** — taket för samtidiga mecenater: 1 st under cs=70, 2 st vid cs>=70, 3 st vid cs>=85. Varje mecenat ger 20 000–140 000 kr/SÄSONG, återkommande. En andra mecenatplats (~upp till 140k/säsong) blir nåbar i ett enda steg vid exakt cs=70.
5. **`eventProcessor.ts:478`** — mecenat kan bara alls uppstå vid `cs>=65` (plus rykte>=55, 15% slump). Cs=64 → aldrig; cs=65 → möjligt.
6. **`roundProcessor.ts:1358` / `patronData.ts` `PATRON_EMERGE_CS=60`** — hela Patron-systemet (större, återkommande, säsongsöverskridande) kan bara uppstå vid `cs>=60`.

**Övriga, mindre eller smalare scopeade:**

7. `reputationMilestoneService.ts:45` — `pos<=3 && cs>60` → +3 rykte, engång.
8. `reputationMilestoneService.ts:94` — `pos>=10 && cs<40` → −2 rykte, engång.
9. `clubEraService.ts:17` — `cs>=70` (plus säsongskrav) → "legacy"-era, låser upp unika veckobeslut.
10. `clubEraService.ts:20` — `cs>=50` (plus säsongskrav) → "establishment"-era, samma sorts lås.
11. `postAdvanceEvents.ts:589` — "Det omöjliga valet" (kräver dessutom ekonomisk kris) kräver `cs>60` för att ens kunna triggas; värt 180 000 kr i ena valet.
12–13. `pressConferenceService.ts:833,835` — `cs>75`/`cs<35` väljer bara VILKEN pressfråga som ställs, ingen direkt ekonomisk effekt. Gränsfall, inte flaggat som akut.

## Viktig kontext du bör ha innan du dömer detta

De tre senaste rapporterna i H4-spåret (innan det parkerades) spårade den KVARSTÅENDE avskedsfrekvens-klippan (95%→10% vid cs=70/71, efter att sponsorbuggen redan var borttagen i den mätningen) till ett **helt annat, odokumenterat tröskelvärde**: `seasonEndProcessor.ts`s `licFinances < -200 000` (licenskrisen), inte communityStanding direkt. Det betyder: de 13 trösklarna ovan är **verkliga, ofixade klippor värda att jämna ut på egna meriter** — men de förklarar sannolikt INTE ensamma hela den ursprungliga avskedsklippan. Två separata spår, inte ett.

## Vad detta betyder för punkt 2 och 4

Din instinkt var rätt: det finns fler osynliga kanter, inte bara sponsorn. Mitt förslag: fixa #1–#3 (samma 70/71-linje, billigt att jämna ut, samma mönster som sponsorn) i samma veva som kiosk-arbetet, eftersom de påverkar EXAKT samma mätning (avskedsfrekvens/ekonomi vid cs=70/71) du redan tänkte köra efteråt. #4–#6 (mecenat/patron-trösklarna) är större i kronor men kräver egna beslut om HUR de ska jämnas ut (sannolikhet som skalar? gradvis kapacitetsökning?) — separat runda, inte i vägen för kiosk-mätningen. #7–#13 kan vänta.

Säg till hur du vill prioritera — jag fortsätter under tiden med de andra, orelaterade posterna i din lista (M5, L3, o.s.v.) tills du svarat.
