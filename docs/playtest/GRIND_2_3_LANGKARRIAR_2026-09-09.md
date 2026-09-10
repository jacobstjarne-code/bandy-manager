# Grind 2/3 — långkarriär, pågående speltest

**Datum:** 2026-09-09  
**Kör:** Codex i riktig lokal browserkarriär, 390 px  
**Version vid start:** `64b5e7a6`  
**Klubb:** Västanfors  
**Manager:** Grindtest 2  
**Status:** Pågående — fyra av minst åtta säsonger spelade; säsong 5 är vid halvtid. Opus domar grindarna efter färdig leverans.

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

## Huvudkarriär — säsong 5, 2030/31 (halvtidskontroll)

- Cupen slutade i semifinal efter 1–5 borta mot Forsbacka; kvartsfinalen mot Heros vanns med 6–1.
- Serien efter fem omgångar: segrar mot Slottsbron (7–3), Lesjöfors (11–5), Karlsborg (5–1) och Söderfors (9–6), förlust mot Gagnef (2–5). Västanfors ligger trea inför omgång 6.
- `Gym` stod färdigt 2029 och var korrekt byggt efter säsongsskiftet. `Belysning träningsplan` startades i omgång 6 med Anna Johansson som medfinansiär: 144 tkr ur klubbkassan, sex omgångars byggtid. Därmed är säsongens personliga anläggningsmål faktiskt aktiverat.
- Säsongens primära handling är fortfarande tydlig: cupen landade innan serien tog över, och portalens matchväg har varit obruten genom de fem första serieomgångarna.
- Den gamla sparningen innehöll redan tre kopior av `Anna Johansson hotar`: två samtidigt efter cupsemifinalen och ytterligare en kvar i den uppskjutna kön inför omgång 6. De är restdata från före dedupe-fixen och har nu konsumerats. Kön har samtidigt sjunkit från fyra beslut vid seriestarten till ett inför omgång 6; ingen ny identisk community-eventkopiera har hittills genererats efter den centrala fixen.

## Fortsättning

### Checkpoint 2026-09-10 — säsong 5 fram till semifinal

- Huvudkarriären i browsern nådde semifinal mot Skutskär efter kvartsfinalsegrar mot Karlsborg: 8–3, 7–5 och 7–2 (3–0 i matcher). Grundserien slutade med förstaplats, 35 poäng, 17–1–4 och +64.
- Omgång 13–22 kördes med spelets ordinarie **Simulera resterande säsong**. Detta är inte en manuell kontroll av varje val: inga slutsatser om frånvaro av pivotal repetition dras för de överhoppade omgångarna.
- Ekonomiska val före snabbspolningen: Bertil Holmgren förlängdes ett år med oförändrad lön 19 tkr/månad i stället för tre år med 23 tkr/månad; två community-förnyelser à 34 tkr avböjdes. Detta är år 5, inte grindens efterfrågade år-8-val.
- Två fynd registrerade i MASTER: klackkonflikten återkom i omgång 10 efter resolution i omgång 8; Granska visade nästa series 0–0 efter avgjord kvartsfinal. Den första observationen bevisar ännu inte nygenerering — befintlig uppskjuten kö måste skiljas från nya event.
- Spelklientens byggfot visade `5f4dada3` medan lokala filer uppdaterades med HMR. Git-HEAD `145a9274` är därför inte ett säkert versionsbevis för hela spelpasset.
- En separat diagnostisk browserprofil användes också. Dess burnout-ceiling-val räknas **inte** in i huvudkarriärens journal. Huvudkarriären visade burnout-relief i omgång 10, med valet att låta assistenten ta pressen.
- Säsong 5 är inte avslutad. Åtta säsonger, fullständigt anläggningsträd och år-8-val återstår. Ingen av Grind 2/3 är godkänd här.

### Fixkontroll 2026-09-10 — avgjord serie

- Rot: Granskas mitt-i-serien-text läste nästa aktiva serie utan den granskade matchens id. Fixture-bindning införs i befintlig selector; ingen ny svensk text eller parallell state.
- Regressionstestet reproducerade exakt felaktig 0–0-text före fix. Efter fix: avgjord kvart med ny semifinal → ingen mitt-i-serien-text; pågående serie → befintlig 1–0-text. 56 riktade tester gröna, `npm run build` grönt inklusive dess grindar.
- Full `npm test`: 550/550 filer, 4 989/4 989 tester gröna. Karriärminnestestet med 20 säsonger stod för den sista långkörningen; processen avslutades med kod 0.
- Browserkontrollen i det delade trädet blockerades av parallellt pågående `AnalyticsBridge`/`analyticsLifecycle`, som läste dev-savens saknade `seasonSummaries`. Telemetriägarens filer lämnades orörda. I stället verifierades en isolerad kopia av `8a348696` med endast seriesfixen på port 5175: `granska-slutspel` (390 px) visade ordagrant den befintliga 1–0-texten; därefter ändrades enbart kopians fixture till avgjord kvart med ny semifinal. Resultatvyn renderades och ingen falsk 0–0-rad fanns. Ingen testfixture ändrades i huvudrepot eller i den riktiga karriärsparningen.

- Spela säsong 5–8 i samma save.
- Rollover för `Träningshall (ungdom)` är verifierad; fortsätt bygga resten av anläggningsträdet.
- `Akademinivå 3` är färdig; fortsätt med övriga möjliga noder.
- Dokumentera ett faktiskt ekonomiskt avvägningsval runt säsong 8.
- Efter full körning lämnas Grind 2/3 till Opus för dom; de arkiveras inte av testaren.

### Rapportåtgärder 2026-09-10 — köreparation och dev-scen

**Senare återöppning lyckades (`e1c8776f`):** karriärbytet använder nu den gemensamma sparvägens konfliktdialog. Dialogens Ladda om hämtade den senaste sparningen; därefter öppnades Grindtest 2 utan import eller tvångsskrivning. Browsern nådde kvartsfinalsammanfattningen: Västanfors–Karlsborg 3–0, nästa semifinal mot Skutskär. Inga ytterligare matcher spelades. Felet var saknad konflikthantering vid byte, inte en verifierad migrationsglugg; gamla versionsstämplar 0.1.0/0.3.11 migreras i separata regressionstester. Full verifieringsnot: `SPARNINGSBYTE_KONFLIKT_2026-09-10.md`. Nedanstående misslyckade försök är den tidigare observationen, inte kvarvarande blockerarstatus.

**Återupptagningsförsök efter B1-fixen:** på port 5173 `/saves` finns Grindtest 2 kvar: Västanfors 2030/31, 1:a, nästa hemma mot Skutskär, sparad 10 september. Öppning misslyckades två gånger med reload emellan: versionskonflikt (annan flik har sparat nyare). Ingen import/överskrivning gjord. `sparningsbyte-konflikt-efter-reload` registrerad i MASTER. Kodläst: `switchToSave` försöker spara den UTGÅENDE karriären före laddning och avbryter om det misslyckas; därmed bevisar felmeddelandet inte att Grindtest-sparningen är skadad. Aktiva från-sparningen visades som äldre Edsbyn/Jacob Stjärne, inte Grindtest. Ingen ytterligare säsong spelad.

- `supporter-konflikt-resolved-dedup`: den centrala budgetpartitioneringen filtrerar nu redan lösta id:n och behåller en kopia per id över båda köerna. FIFO och olika event-id:n bevaras. Ingen ny minnesbank eller ändrad spelartext. Två regressionstester var röda före fixen; 27 budgettester är gröna efteråt. Ett integrationstest med riktig klackkonflikt, resolution och köpromotion verifierar att humör/klackeffekt ges en gång och den gamla kökopian försvinner (5 supporter-tester gröna). Det bevisar köfelet, inte den ursprungliga browserinstansens fullständiga köhistorik.
- `analytics-dev-scen-sasongshistorik`: saknad seasonSummaries kraschade både AnalyticsBridge och analyticsLifecycle. Konsumenterna tolererar nu saknad historik utan att ändra sparningen. Regressionstestet var rött före fix, samtliga 4 lifecycle-tester är gröna efteråt.
- Browser: aktuell huvudarbetskopia på port 5176, `granska-slutspel`, 390 px. Före korrigeringen: error boundary med läsning av undefined.length. Efter reload: resultatvyn öppnar och visar seriens korrekta 1–0-rad samt nästa-knappen. Detta är ett dev-scenprov, inte ytterligare spelade karriärsäsonger.
- Fullsvit avslutad GRÖNT: 552/552 filer, 5 002/5 002 tester, exit 0 (26 minuter, två workers). Kodcommit `1d0bd36b`. De två åtgärdsraderna arkiveras; aktuell räknare 34→32 inklusive parallella agenters förändringar. Grind 2/3 står fortsatt vid säsong 5:s semifinal; återstående långkarriärkrav är oförändrade.
- Ytterligare browserprov: `portal-interruption-budget`, 390 px. Två separata sponsorbeslut avböjdes via ordinarie knappar; uppskjuten kö gick 2 → 1 → 0 och kommunbeslutet blev synligt. Fixturen har uttryckligen olika id:n för de två sponsorbesluten; fixen behåller dem trots samma text.
- Slutbygget i gemensamma trädet stoppade på fyra `rule13_semantic_color`-träffar i parallellt ändrade FormationView/TacticBoardCard/GameOverScreen. Dessa filer lämnades orörda. Isolerat `c7b4b12e` plus enbart de sex ändrade kod-/testfilerna byggde GRÖNT inklusive TypeScript och alla fem grindar. Ingen baseline ändrad; byggfoten i arkivkopian är avsiktligt `unknown` eftersom kopian saknar .git.

### Fortsatt semifinalspel 2026-09-10

- Semifinal mot Skutskär: 5–1 hemma, 1–6 borta, 3–4 hemma och 3–0 borta. Serien står 2–2 inför avgörandet.
- Före första semifinalen löstes `Anna Johansson hotar` med `Vi lyssnar — vad vill du?`. Exakt samma hotkort visades igen efter semifinal 4, tre omgångar senare. Detta är nygenerering i den aktuella körningen, inte kvarvarande ködata från före dedupe-fixen.
- Kodläsning bekräftar att silentShout-generatorns fyra varianter använder `Date.now()` i id:t. Därmed får varje ny generation ett nytt id och kan inte kännas igen av `pendingEvents + deferredDecisions + resolvedEventIds`.
- Samma submits underrad säger `silentShout ökar`, medan valets enda deklarerade effekt är `mecenatHappiness +20`. Den observerade texten och state-kontraktet motsäger alltså varandra.
- Beslutskön växte från fyra poster inför semifinal 1 till sju inför semifinal 3 och nio inför semifinal 4. Det återkomna hotkortet lämnas olöst tills fyndet är registrerat och dess state-kontrakt avgjort.
- Fixverifiering: silentShout använder nu en enda producent, stabilt variant-id och den befintliga kanoniska köns minne; äldre tidsstämplade id:n känns igen via samma variantprefix. Submit-underradens obelagda `silentShout ökar` är struket. 23 riktade tester och full produktionsbuild med TypeScript samt fem grindar gröna. Det redan köade legacy-kortet i sparningen kan fortfarande lösas, men kan inte längre följas av en ny kopia av samma variant.

### Säsong 5 — landning

- Västanfors vann den avgörande semifinalen hemma mot Skutskär med 1–0 och serien med 3–2. SM-finalen mot Forsbacka förlorades 0–2.
- Primär handling: förstaplatsen i serien bar laget till en avgörande semifinal och en andra raka SM-final. Nästa olösta fråga landade rent i finalen: kunde Västanfors försvara titeln? Svaret blev nej.
- Årsboken bar förstaplats, SM-silver, cupsemifinal, +399 tkr och säsongens burnout-avlastning som en egen säsong. Den femte säsongens landning är därmed dokumenterad.
- Det äldre tidsstämplade `Anna Johansson hotar`-kortet låg kvar i kön och kom fram i finalgranskningen. Det löstes med samma val som tidigare; den nya dedupen känner igen legacy-prefixet och ska hindra att samma variant produceras igen.

### Säsong 6 — start

- Personligt mål: `Etablera oss där. Två år i rad, inte ett.`
- Kontraktsval: fem nyckelspelare fick sina lönekrav mötta — Tobias Hård, Bertil Holmgren, Jonas Dahl, Arne Granqvist och Oliver Norberg. Övriga sju behöll nuvarande lön. Det var ett avvägt ekonomiskt beslut för att undvika hela truppens stora löneökning; år-8-valet återstår fortfarande.
- Cupkvartsfinalen mot Lesjöfors vanns 5–4 efter förlängning. Ett bud på reservmålvakten Timo Nordström möttes med motkravet 60 tkr i stället för direkt accept på 45 tkr.
- Säsong 6 står nu inför cupsemifinal mot Forsbacka. Beslutskön låg på fem efter kvartsfinalen; inget nytt Anna-hot har producerats efter att legacy-kortet löstes.

### Säsong 6 — ligastart, fortsatt manuellt prov 2026-09-10

- Samma `Grindtest 2`-save återöppnades utan konflikt. Den stod då i ligans omgång 2; cupfasens mellanliggande utfall är inte återläst här och tillskrivs därför inte provet.
- Omgång 2: Västanfors–Lesjöfors 4–2. Portalens primära väg till matchen var tydlig. Granska gav tabellplats 3, nästa Gagnef hemma och ett konkret kvitto på offensiv hörnstrategi; tre nya skador landade samtidigt inför nästa vecka.
- Omgång 3: Västanfors–Gagnef 5–3 efter att `Bäst för dagens match` fyllde de två tomma platser som skadorna lämnat. Granska gav tabellplats 2, nästa Karlsborg hemma och ett positivt kvitto på den utvilade målvakten.
- Grind 3-fynd: båda veckorna hade en tydlig match-CTA, men den konkurrerade med **10 beslut i kö**, patronkrav, mecenatpåminnelse, burnout-återfall och två Efterklang-trådar. Det är inte flera primära CTA:er, men den redaktionella belastningen är fortsatt hög.
- Mecenatpåminnelsen räknade upp sex olösta önskemål. Två par uttryckte samma underliggande krav (bygg något respektive använd egna unga) med olika ord. Detta är observerad berättelserepetition; ingen ny buggpost skapas innan kö-/state-identiteterna kan jämföras mot koden.
- Browserkontrollen stoppades därefter av att den lokala browserns säkerhetsverifiering tillfälligt inte kunde genomföras. Sparningen hade redan avancerat rent till omgång 4; ingen alternativ eller kringgående browserväg användes.

### Säsong 6 — återimport och omgång 8, 2026-09-10

- Den bevarade säkerhetskopian `bandy-Grindtest_2-s2030.json` verifierades direkt mot aktuell `migrateSaveGame`: `Grindtest 2`, Västanfors, 2030/31. Migreringen var ren; ingen data behövde handredigeras.
- UI-importens frikopplade filfält gjorde först filvalet opålitligt. Efter DOM-förankring, gemensam städväg och avslutad confirm-event-loop importerades samma fil i en riktig browser. Headern visade därefter `Grindtest 2 · 2030/31 · OMG 8`; den tillfälliga testkarriären var ersatt. Punkten `saveimport-filvaljare-opalitlig` stängdes separat.
- Vid omgång 8 visade matchladdningen datumet 17 oktober men samtidigt den faktiska texten `Annandagen. Hela stan är på benen.` Detta är en kalendermotsägelse, registrerad som `annandagsbeat-fel-kalenderlage`; ingen snabb specialfix gjordes under långspelet.
- Inför omgången accepterades ett sponsoravtal på 1,5 tkr/vecka och Alexander Nieminen fick själv bestämma sitt pensionsbeslut. Beslutskön sjönk från fyra till tre. Matchen mot Hälleforsnäs är ännu inte färdigspelad i denna checkpoint.

### Säsong 6 — omgång 8–11, fortsatt prov 2026-09-10

- Omgång 8 slutfördes med 8–3 borta mot Hälleforsnäs. Granska visade tabellplats 2, nästa Målilla borta och fyra trötta startspelare; beslutskön stod på fyra efter veckans supporterfråga.
- Omgång 9 vanns 3–1 borta mot Målilla. Säkert passningsspel valdes mot snöfallet och standardhörnor gav ett mål. Supporterbrevet från Bertil Karlsson besvarades varmt. I matchflödet låg formuleringen `Det börjar bli generande nu. Målilla gör vad de vill.` samtidigt som Målilla låg klart under; detta är en möjlig resultatsjälvmotsägelse som behöver verifieras mot momentumvillkoret innan en MASTER-rad skapas.
- Omgång 10, annandagsmatch borta mot serieledande Forsbacka, förlorades 2–5. Den särskilda annandagsentrén visades på rätt kalenderpunkt. Två standardhörnor gav båda Västanfors mål. Konflikten i klacken hanterades genom att bjuda in båda parter till ett möte med truppen.
- Omgång 11 vanns 5–2 hemma mot Heros via spelläget `Snabb`. Pekka Westberg och Olof Gran skickades till P19-samlingen och blev otillgängliga i två omgångar. Detta är ett avsiktligt simulerat resultat, inte en manuell kontroll av matchflödet.
- Karriären står nu inför omgång 12 borta mot Slottsbron. Beslutskön har vuxit till tio och belastningen är åter hög. Halvvägs-scenen visades och stängdes korrekt; tre spelare är skadade och två juniorer är på landslagssamling.

### Säsong 2030/31 — avslut och SM-guld, fortsatt prov 2026-09-10

- Grundserien snabbspolades efter omgång 13 med spelets ordinarie `Simulera resterande säsong`: Västanfors slutade etta på 35 poäng, 17–1–4 och +54. De överhoppade omgångarna räknas inte som manuell kontroll av pivotal repetition.
- Slutspelet spelades manuellt i snabbläge. Karlsborg besegrades med 3–0 i kvartsfinalserien. Semifinalen mot Gagnef vändes från 0–2 till 3–2, med straffseger i den avgörande matchen. SM-finalen mot Forsbacka vanns och Västanfors blev svenska mästare.
- Årsboken visade förstaplats, SM-guld, +291 tkr och att assistenten tog pressen tre gånger. Beslutet att sälja Bo Grahn för 110 tkr bars också in i säsongsminnet.
- Burnout-relief återkom under semifinalserien; assistenten fick åter ta pressen. Den ordagranna kafferumsrepliken om tre gamla medlemmar som ringt utan att vilja något visades både före semifinal 1 och semifinal 4. Detta ska kodverifieras som cooldown-/urvalsproblem innan en MASTER-rad skapas.
- SM-finalens laddningssekvens upplevdes två gånger i samma flöde: först matchens `MatchLaddningScene`, därefter livevyns separata finalintro. Finalen gick att slutföra, men dubbleringen ska verifieras mot de två inkopplingspunkterna.

### Säsong 2031/32 — start och omgång 1–2

- Personligt mål: `Håll ihop truppen. Ingen ska behöva gå.` På lönekravsskärmen valdes `Möt alla`; övergångsbud på egna spelare har därefter avslagits i linje med målet.
- Cupkvartsfinalen hemma mot Lesjöfors förlorades 3–4. Efter cuputtåget visades övergångstexten `Cupen är spelad. Pokalen står på en byrå någonstans.` Formuleringen kan läsas som ett eget pokalinnehav trots förlusten och ska kodverifieras innan MASTER-post.
- Inför seriepremiären förnyades Bandyskola för barn för 40 tkr, ett sponsoravtal på 1,5 tkr/vecka accepterades och ett bud på Timo Nordström avslogs. Premiären mot Slottsbron vanns 7–1.
- Omgång 2 mot Lesjöfors förlorades 3–4 efter omfattande trupprotation. Bandygalan besöktes och mecenaten Anna Johansson fick förslag om succession. Föreningslotteriet förnyades inte.
- Beslutskön låg kvar runt 9–10 trots att tre beslut hanterades per portalvecka. Det är fortsatt hög redaktionell belastning, men ingen ny separat MASTER-rad skapas utan kodverifiering.
- Karriären står inför omgång 3 hemma mot Gagnef. Anläggningsträdet och det faktiska år-8-valet återstår.
