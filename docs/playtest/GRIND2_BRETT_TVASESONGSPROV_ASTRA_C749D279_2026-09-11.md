# Grind 2 — brett tvåsäsongsprov, avgörande omkörning

**Dom:** PASS

**Testad produktpinne:** `c749d2795c4b498ca1d5f9b3d18a45bfeeca4a83`  
**Efterföljande text-only commit:** `86ebe78c` (årsbokens transfermening; 66/66 riktade tester och full build gröna)  
**Utförare:** Codex/Astra  
**Datum:** 2026-09-11  
**Metod:** dubbelspår enligt `TESTINSTRUKTION_GRIND2_ATERPROV_2026-09-10.md`: riktig onboarding, Målilla, medelsvår, två spelade säsonger, kontrollpunkt före och efter varje avgörande resolution samt löpande mobilgranskning i 390×844.

## Sammanfattning

Grind 2 passerar. Karriären gick från ny start genom säsongerna 2026 och 2027 till en spelbar start på 2028. Målilla slutade sexa respektive femma och nådde semifinal båda åren. Första året bar cupsegern och klackbågen; andra året bar den förbättrade ligaplaceringen, ett nytt djupt slutspel och det terminala burnoutvalet. Säsongerna kändes därför besläktade men inte utbytbara.

Inget kärnflöde stannade. Båda årsböckerna och båda säsongsskiftena passerades. Den aktiva beslutskön höll max tre valbara event; uppskjutna val kunde ligga bakom men inga identiteter dubblerades mellan pending/deferred, inget redan löst id återkom och inget val svalt. Efter andra rollover fanns ett nytt, öppningsbart mecenatval i den nya säsongen — inte gammal körest.

## Spår A — logikens golv

### 1. Burnout

PASS. Terminalvalet nåddes naturligt säsong 2027, global matchdag 34: `event_burnout_ceiling_2027_34`, val `push_through`. Exakt ett terminalt val skrevs för säsongen och inget motstridigt slutval följde.

### 2. Kafferummet

PASS. Körningen visade 35 stabila narrativa nycklar över två säsonger. Ingen exakt nyckel återkom inom tvåsäsongersfönstret. Det gäller även fasta victory-echo-grenar; den tidigare felande `victory_echo_blowout_3` förekom bara en gång. Frågor, återbesök och djupt slutspel fungerade utan reprisbrott.

### 3. Bandygalan

PASS. `event_gala_2026` visades vid starten av 2027, löstes med `attend` och pensionerades genom den karriärstabila identiteten `bandy_gala`. Efter andra säsongsslutet skapades ingen ny hållen galascen. Det är avsiktligt: prisutdelningen och eventuella egna vinnare fortsätter årligen som pris-/inkorgsdata, medan den gestaltade galascenen är en karriärbeat. I den här seedens andra år hade Målilla ingen egen pristagare, så inget eget vinnarbrev skulle skapas.

### 4. Klackkonflikten

PASS. Riktig onboarding öppnade klackledarens röst. Den kanoniska bågen nåddes naturligt redan första säsongen: `supporter_tifo_2026` på dag 6 och `supporter_conflict_2026` på dag 11. Konflikten löstes med `both` och startade inte om säsong 2027. De pensionerade generiska producenterna `tifo_contribution` och `supporter_conflict_mediate` förekom inte.

### 5. Beslutskön

PASS. Max tre valbara event låg samtidigt i den aktiva kön. Som mest fanns fem valbara event över aktiv och uppskjuten kö tillsammans, vilket är väntad backlog och inte fem samtidiga aktiva kort. Kontrollpunkterna gav:

- inga dubbla event-id:n över pending + deferred;
- inga redan lösta id:n tillbaka i någon kö;
- båda säsongssluten öppningsbara och passerbara;
- ingen fastnad Granska-vy;
- ingen svält; alla fördröjda val kom fram eller pensionerades enligt livscykeln.

## Säsongssanning

### Ungdomsintag och akademi

PASS. Målilla fick en sommarspelare per rollover. Intake-id:n låg kvar i P19 och inget av dem fanns samtidigt i seniorpopulationen. Årsboken redovisade `1 ny spelare` och `0 uppflyttade` båda åren, vilket matchade state. Det tidigare direkta läckaget till A-truppen återkom inte.

### Årsbokens toppbetyg

PASS. År 1 vann Jukka Berglund på 22 ligamatcher. År 2 vann den senare tillkomne Nils Hård på nio matcher. Alla genomförda egna ligamatcher behöll betygsunderlaget genom komprimeringen; urvalet bestod inte längre bara av derbyn och storsegrar.

### Styrelse- och licenssanning

PASS i nådda scener. Placeringarna 6 och 5 låg i linje med den frusna MidTable-domen och årsboken visade ett sammanhängande utfall. Det tidigare exakta topp-6-motsägelsefallet nåddes inte av denna seed, men dess 8:e-platsregression kördes på samma kod och var grön. Inget nått licensbesked motsade ekonomin.

### Skador över sommaren

Ingen spelare var fortfarande skadad exakt vid dessa två naturliga rolloverögonblick, så den grenen fick inget naturligt stickprov. Den explicita rolloverregressionen som startar med kvarvarande skada passerade på slutkoden tillsammans med övriga säsongsskiftstester (19/19).

## Spår B — spelkänslans tak

### Bågen

Första säsongen hade en klar identitet: ny tränare, cupseger, växande klack, konflikt och semifinal. Andra året gav progression utan att bara kopiera triumfen: femteplats och semifinal men ett tydligt pris i form av burnouttaket. Årsböckernas primära handlingar och match-of-the-season-val kändes förankrade i det som faktiskt hänt.

### Rytm och kö

Rytmen är klart bättre än i det underkända provet. Tre aktiva beslut kan fortfarande göra Granska tät, men spelaren möter en begriplig kö som går att tömma. Säsongsslutet konkurrerar inte längre med ett osynligt eller oöppningsbart kort.

Ett brett sidofynd i första slutkörningen var att ett ignorerat annandagsarrangemang kunde ligga kvar efter att matchen spelats. Roten var att producenten bara öppnade valet men aldrig pensionerade ett obesvarat val vid målmatchens slut. Slutpinnen stänger det centralt. I omkörningen syntes kortet endast före annandagen och ingen kontrollpunkt hade `pendingAnnandagsVal` samtidigt som hemmamatchen redan var slutförd.

Språksvepet rättade också `3 till spel` till `3 matcher kvar`, `1 kvar` till `En match kvar` och årsbokens mekaniska transfermening till: `Du accepterade budet på [namn]. Klubben fick [belopp]; [namn] lämnade.`

### Grafik och befintliga bilder

243 granskade UI-lägen gav noll trasiga bildlänkar och noll horisontellt spill. Ankomstens första automatiska screenshot togs mitt i fade-in och är därför inte ett kontrastmått; en separat bild efter 1,8 sekunder mätte `rgb(245, 241, 235)` med cirka 96 procents opacity på `rgba(10, 8, 12, 0.70)`. Texten är läsbar och klubbmotivet lever runt panelen.

Nuvarande illustrationer bär rätt nivåer: ankomst, cup/final, premiär/derby/annandag/nyår, kafferum, press, mecenatmiddag, hall, styrelseultimatum, anläggning och årsbok. Porträttvägen gav inga brutna länkar i de nådda spelar- och Granska-ytorna.

## Bildrekommendation efter genomspelningen

Fler bilder skulle höja upplevelsen, men bara på scener som ska stanna i minnet. Rekommenderad ordning:

1. **Burnouttaket.** Högst värde. Det är karriärens mest personliga och irreversibla val men landar fortfarande visuellt nära ett vanligt beslut. En ensam omklädningsrum-/kontorsbild sent på kvällen skulle ge rätt tyngd.
2. **Klackbågen.** Ett gemensamt bildspråk med två motiv: tifot som byggs och det splittrade klackmötet. Birger och gruppen blir viktigare än ett generiskt supporterobjekt, och konflikten blir lättare att minnas som en fortsättning.
3. **Bandygalan.** Den har egen typografi och scenlogik men skulle vinna på ett återhållsamt prisbord/scenmotiv. Bilden bör stödja både triumf och att vara gäst utan vinnare.

Rutinbud, sponsoravtal, kontraktsförlängningar och vanliga veckobeslut bör förbli bildfria. Om allt får en illustration tappar ovanstående ögonblick sin rang.

## Tekniska kontroller

- Riktade RC-tester före omkörning: 26/26 gröna.
- Rollover/akademi/skada: 19/19 gröna.
- Årsbokstransfertext: 66/66 gröna.
- Full TypeScript-, produktions-, design-, innehålls-, anläggnings- och O12-byggkedja: grön.
- Notis-API gav 500 i den isolerade Vite-miljön eftersom backend medvetet inte kördes. Serverloggen visade `ECONNREFUSED` enbart för `/api/notifications/*`; detta påverkade inte spel-, save- eller bildflödet.

## Slutdom

**PASS — Grind 2:s releaseblockerande frågor är stängda.** De tidigare tre långtidsfelen var verkliga men är inte kvar på slutpinnen: kafferummet håller cooldown, galascenen pensioneras, klackkonflikten återstartar inte, kön passerar två säsongsslut och burnouttaket är naturligt nått utan dubbelresolution.

Bildförslagen är förbättringar av dramatisk rang, inte blockerare och inte symptom på saknade/wirade assets.
