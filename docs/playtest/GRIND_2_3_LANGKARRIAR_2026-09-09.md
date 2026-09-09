# Grind 2/3 — långkarriär, pågående speltest

**Datum:** 2026-09-09  
**Kör:** Codex i riktig lokal browserkarriär, 390 px  
**Version vid start:** `64b5e7a6`  
**Klubb:** Västanfors  
**Manager:** Grindtest 2  
**Status:** Pågående — fyra av minst åtta säsonger spelade; säsong 5 är startad. Opus domar grindarna efter färdig leverans.

## Avbruten kontrollkörning — Forsbacka

En första karriär med Forsbacka slutade med att managern fick sparken efter säsong 2. Den körningen används bara som kontrollbevis, inte som den åtta säsonger långa huvudkarriären.

- Säsong 1: 2:a i serien, 31 poäng (14–3–5, +38), kvartsfinaluttåg 2–3 mot Lesjöfors, cupsemifinal. Kassa cirka 460→539 tkr. Burnout-val: kliv tillbaka. Rune Rydén såld för 100 tkr.
- Säsong 2: 6:a, 21 poäng (10–1–11, −13), kvartsfinaluttåg 0–3 mot Söderfors. Värmestuga startades i omgång 4 med kommunal finansiering och blev färdig i omgång 13. Managern fick därefter sparken.
- Årsboken visade samma `Derby-triumf mot Gagnef` tre gånger. Huvudkarriären nedan reproducerar samma klass av fel med Söderfors, vilket gör att fyndet inte bedöms som save-specifikt.

## Huvudkarriär — säsong 1, 2026/27

### Utfall

- Seriesegrare: 1:a, 34 poäng, 16–2–4, målskillnad +50.
- Cupvinnare efter 8–2 mot Målilla i finalen.
- Kvartsfinaluttåg 1–3 mot Hälleforsnäs. Säsongslandningen löd att vallen tystnade fort och att resten åkte hem i bussen.
- Ekonomi: 430 tkr vid start, 1,1 mkr vid slut, +715 tkr.
- Styrelsen: förstaplatsen överträffade målet.

### Grind 3-observation

- Primär handling: matchförberedelsen var konsekvent huvudväg; eventval låg efter match i Granska och konkurrerade normalt inte med `Redo — spela`.
- Nästa olösta fråga: efter seriesegern var slutspelet tydlig krok; efter kvartsfinaluttåget blev frågan om laget kunde omsätta dominansen i slutspelsresultat nästa år.
- Landning: tydlig. Årsboken höll ihop cupguldet, seriesegern, burnout-valet och ekonomin till ett begripligt år.

### Grind 2-observation

- Anläggningar är medvetet låsta första säsongen. Trädet kunde därför inte startas ännu.
- Burnout-brytpunkten `Det går inte att köra så här längre` visades i både omgång 9 och omgång 10 trots att det irreversibla valet `Kliv tillbaka en period` gjordes första gången. Det är en faktisk upprepad pivotal scen och innebär att Grind 2 inte kan passera i nuvarande version.

## Huvudkarriär — säsong 2, 2027/28

### Utfall

- Grundserie: 5:a, 26 poäng, 12–2–8.
- Cupvinnare efter 10–4 mot Skutskär i finalen.
- Semifinaluttåg 1–3 mot Gagnef efter att kvartsfinalen mot Målilla avgjordes 3–2 på straffar i match 5.
- Ekonomi: cirka 1,1 mkr vid både start och slut, −48 tkr över säsongen.
- Styrelsen: femteplatsen låg under målet att vinna ligan.

### Anläggningsträdet

- `Kiosk & servering` byggdes på fyra omgångar med Anna Johansson som medfinansiär.
- `Akademinivå 2` byggdes därefter på åtta omgångar, också med Anna Johansson som medfinansiär.
- `Träningshall (ungdom)` startades därefter; 14 omgångar återstod vid start. Den ska följas över säsongsskiftet innan rollover-domen kan anses speltestad.
- Det separata community-eventet `Kioskfrågan` (`Starta enkel kiosk`, 3 tkr) dök upp samtidigt som det permanenta kioskbygget pågick. Kodläsning visar två olika state-system: `communityActivities.kiosk` respektive anläggningsnoden `kiosk`. Det behöver en uttrycklig produktbedömning innan det kallas bugg, men är en tydlig kandidat till parallell specialmekanism.

### Grind 3-observation

- Primär handling: portalens huvudsakliga matchväg var tydlig. Vid några lägen låg veckoval och aktiv matchknapp samtidigt, men den visuella riktningen gick fortfarande att följa.
- Nästa olösta fråga: efter cupguldet blev ligamålet och det pågående anläggningsträdet den tydligaste fortsättningskroken.
- Landning: tydlig sportslig och ekonomisk landning. Årsboken skilde säsongen från den första genom femteplats, cupguld, semifinal och byggkedja.

### Reproducerade fel

1. **Upprepad pivotal burnout-scen.** `Du är vid samma gräns igen` visades i omgång 10 och omgång 12 samma säsong efter att `Kliv tillbaka en period` valts i omgång 10. Tillsammans med säsong 1 är detta tre brytpunktskort på fyra omgångar.
2. **Duplicerade årsboksminnen.** `💔 Derby-förlust mot Söderfors` renderades tre gånger: två `O7`-ankrade poster och en oankrad rad.
3. **Dubbletter i besluts-/eventkön.** `Bandygalan 2027`, `Kioskfrågan` och `Föreningslotten` återkom efter att val redan gjorts. Kodläsning visar att `generateEvents()` bygger `alreadyQueued` av `pendingEvents + resolvedEventIds`, men utelämnar `deferredDecisions`. Under KF3-budgeten kan en undanträngd post därför nygenereras innan den första kopian konsumerats. Det är en gemensam sannolik rotorsak som ska verifieras med fokustest före fix.

## Huvudkarriär — säsong 3, 2028/29

### Utfall

- Grundserie: 2:a, 36 poäng, 17–2–3. Laget hade bland annat sju raka segrar och vann Forsderbyt borta med 6–5.
- Svenska mästare efter 6–2 mot Forsbacka på Studenternas. Kvartsfinalen mot Slottsbron och semifinalen mot Gagnef vanns båda med 3–0 i matcher.
- Cupen slutade i kvartsfinal efter 3–4 hemma mot Hälleforsnäs.
- Ekonomi: cirka 1,1 mkr vid både start och slut, −16 tkr över säsongen. Styrelsens kassauppdrag missades, men SM-guldet gav ett samlat positivt styrelseutfall.
- `Träningshall (ungdom)` stod färdig efter säsongsskiftet. Den återstående byggtiden överlevde alltså rollover och bygget slutfördes i riktig browser-save.
- `Akademinivå 3` startades därefter med Anna Johansson som medfinansiär: 125 tkr ur klubbkassan, 12 omgångars byggtid. Den stod färdig 2028 efter omgång 12. Akademigrenen i anläggningsträdet är därmed komplett.
- `Värmestuga` startades därefter med Anna Johansson som medfinansiär; åtta omgångars byggtid.

### Grind 3-observation

- Primär handling: matchvägen förblev tydlig genom grundserie och slutspel, men portalens köindikator steg från 25 till 44 uppskjutna beslut. Den olösta frågan blev därför ofta kön själv i stället för säsongens sportsliga eller ekonomiska båge.
- Nästa olösta fråga: ligatiteln, SM-guldet och det fortsatta anläggningsträdet var de meningsfulla krokarna, men återkommande patron-, supporter- och burnoutkort trängde visuellt undan dem.
- Landning: tydlig. Årsboken bar andraplatsen, SM-guldet, cupkvartsfinalen, akademin och ekonomin som en egen säsong. Till skillnad från säsong 2 syntes inga tredubbla derbyminnen i denna årsbok.

### Skärpt reproduktion av köfelet

- `Klara och tifon` löstes i omgång 4 och visades igen med identisk ingress och samma tre val i omgång 5.
- `Du är vid samma gräns igen` löstes i omgång 4 och visades igen ordagrant redan i omgång 5. Det är dessutom samma pivotal som förekom två gånger under säsong 2.
- Patronkortet `Lars-Erik Nordin är missnöjd` med ordalydelsen `Vi kanske tar en paus. Jag behöver tänka.` visades i omgång 6, 8 och 10.
- Portalens uppskjutna beslutsräknare låg på 24 i omgång 9, 22 i omgång 11 och 25 i omgång 12. Det visar att KF3-budgeten begränsar visningen men att källkön inte hålls unik.
- Kön fortsatte därefter växa: 35 poster efter grundserien, 39 inför semifinalen och 44 inför SM-finalen.
- Burnout-pivotalen återkom ännu en gång efter semifinal 3 samma säsong.
- Fynden stärker kodhypotesen att `deferredDecisions` saknas i genereringens dedupe-underlag. Det är en separat funktionell regression, inte bara Grind 2:s kvalitativa underkännande.

## Huvudkarriär — säsong 4, 2029/30

### Utfall

- Grundserie: 2:a, 32 poäng, 16–0–6. Säsongens personliga mål var att färdigställa `Läktare — östra`.
- Svenska mästare efter 3–3 och 5–4 på straffar mot Forsbacka på Studenternas. Kvartsfinalen mot Hälleforsnäs och semifinalen mot Målilla vanns båda med 3–0 i matcher.
- Svenska cupen vanns efter 6–1 mot Lesjöfors; Karlsborg slogs ut 5–4 i kvartsfinalen och Forsbacka 6–4 i semifinalen. Därmed vann Västanfors dubbeln.
- Ekonomi: cirka 1,1 mkr vid start, 1,8 mkr vid slut, +752 tkr.
- `Värmestuga` var färdig vid säsongsstart. `Läktare — östra` byggdes därefter på 12 omgångar med Anna Johansson som medfinansiär och stod färdig 2029 vid halvtid.
- `Strålkastare` startades vid halvtid med Anna Johansson som medfinansiär: 48 tkr ur klubbkassan, fem omgångars byggtid, och stod färdig 2029.
- `Gym` startades därefter med Anna Johansson som medfinansiär: 90 tkr ur klubbkassan, åtta omgångars byggtid. Det ska följas över nästa säsongsskifte om det inte hinner bli klart i slutspelet.
- De 44 uppskjutna besluten från säsong 3 nollställdes till tre vid säsongsskiftet. Vid omgång 13 hade kön redan vuxit till 18 igen. Cursor-resetten fungerar alltså, men dubblettproduktionen fyller på kön på nytt.

### Grind 3-observation

- Primär handling: cupbågen gav en tydlig sekvens kvartsfinal–semifinal–final, följd av serien; slutspelet hade samma tydliga trappa till SM-finalen.
- Nästa olösta fråga: laget återhämtade sig från sjätteplatsen runt omgång 9 och slutade tvåa. Efter dubbeln är nästa fråga om laget kan etablera dominansen och slutföra hela anläggningsträdet.
- Landning: tydlig. Årsboken bar dubbeln, andraplatsen, säsongens beslut, akademin, anläggningsmålet och +752 tkr som en egen säsong. Inga tredubbla årsboksminnen syntes.
- Burnout-pivotalen återkom i omgång 18. Det var minst en sådan visning även denna säsong, trots tidigare irreversibla `Kliv tillbaka`-val.
- Beslutskön stod på 24 efter grundserien. Säsongsskiftet rensar kön, men samma tillväxtmönster återkommer varje år.

## Fortsättning

- Spela säsong 5–8 i samma save.
- Rollover för `Träningshall (ungdom)` är verifierad; fortsätt bygga resten av anläggningsträdet.
- `Akademinivå 3` är färdig; fortsätt med övriga möjliga noder.
- Dokumentera ett faktiskt ekonomiskt avvägningsval runt säsong 8.
- Efter full körning lämnas Grind 2/3 till Opus för dom; de arkiveras inte av testaren.
