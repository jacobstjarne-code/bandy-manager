# Brett tvåsäsongsprov — Grind 2 återprov, Codex/Astra

**Datum:** 2026-09-11  
**Produktpinne:** `27da71b32016d4af4f5fc05080bccf8ce9f631b2`  
**Körning:** ny karriär, Gagnef, MEDEL, två hela säsonger i riktig browser  
**Metod:** dubbelspår enligt `TESTINSTRUKTION_GRIND2_ATERPROV_2026-09-10.md`, utvidgat med text-, flödes-, sannings-, bild- och grafiksvep.

## Dom

**Grind 2: UNDERKÄND. Releasekandidaten är inte redo att kallas färdig.**

Den tidigare hårda köblockern är däremot löst i den spelade karriären: båda säsongssluten gick att passera, beslutskorten gick att öppna och lösa, den aktiva budgeten översteg aldrig tre och inget löst event-id återkom. Under samma körning bröts dock tre av de uttryckliga långtidsinvarianterna: kafferumsreplik, galan och klackkonflikten återkom efter sina respektive spärrar/resolutioner. Burnout-taket nåddes inte och är därför otäckt, inte godkänt.

Det breda provet hittade dessutom två kodverifierade sanningsfel i säsongsmodellen — direkt ungdomsintag till A-truppen och ofullständigt/urvalsskevt årsboksbetyg — samt flera nådda text- och kontextfel. Ingen matchbalansering eller kalibreringsparameter har ändrats eller omvärderats i detta prov.

## Spelad karriär

### Säsong 2026/27

- Serien: 8:a, 21 poäng, 9–3–10, målskillnad −1.
- Svenska cupen: semifinal.
- SM-slutspel: final, förlust mot Västanfors.
- Burnout pressades med hårt belastade elvor och valet ”Be styrelsen om andrum”.

### Säsong 2027/28

- Serien: 3:a, 32 poäng, 15–2–5, målskillnad +40.
- Svenska cupen: kvartsfinal.
- SM-slutspel: utslagen 1–3 i kvartsfinal mot Hälleforsnäs.
- Klackkonflikten uppstod naturligt och löstes.

Spelkurvan bar känslomässigt: första säsongens oväntade SM-final blev en tydlig landning och andra säsongens ligalyft gav en annan, begriplig huvudhandling. Beslutskön kändes märkbart lättare än i föregående prov. Problemet är inte längre att karriären stannar, utan att berättaren och säsongsbokslutet fortfarande kan motsäga sitt eget minne.

## Spår A — invariantresultat

### Beslutskön — PASS i den naturliga körningen

- 1 035 passiva checkpoints.
- 128 unika köevent och 106 registrerade beslut.
- Högsta antal samtidiga öppningsbara beslut, inklusive aktiv scen: 3.
- Högsta uppskjutna kö: 3.
- Noll detekterade dubbla event-id:n, återvändande lösta id:n eller budgetöverskridanden.
- Båda säsongssluten, nästa säsongsstart, slutspelsintro och årsbok nåddes utan hårt stopp.

Vid slutet låg `licenseHandlingsplan_2027` och `event_gala_2027` fortfarande olösta efter att säsongsnumret redan rullat vidare. Det stoppade inte denna karriär, men barriärkontraktet behöver avgöra om de ska öppnas eller uttryckligen pensioneras före rollover.

### Kafferum — FAIL

Två exakta repriser återkom inom det uttalade tvåsäsongersfönstret:

- `victory_echo_blowout_2`: ”Materialaren räknade klubborna två gånger …” visades i säsong 2026, omgång 7, och igen i säsong 2027, omgång 16.
- ”Publiken sjöng hela vägen ut. Länge sen sist.” visades i säsong 2026, omgång 26, och igen i säsong 2027, omgång 21.

Checkpointpar: `00163-s2026-d7` → `00835-s2027-d16` och `00415-s2026-d26` → `00902-s2027-d21`.

### Bandygalan — FAIL

`event_gala_2026` löstes med ”Gå på galan” vid checkpoint `00644-s2027-d1`. Efter nästa rollover skapades `event_gala_2027` på nytt vid `01030-s2028-d0`. Produktkoden ger galan ett säsongsbundet id, medan provinvarianten kräver att den inte återkommer efter resolution.

### Klackkonflikten — FAIL

Samma semantiska beslut registrerades två gånger för samma manager och klubb:

- `weeklyDecision:supporter_conflict_mediate:A`, säsong 2026, resolution synlig från `00304-s2026-d17`.
- Samma semantic key, säsong 2027, resolution synlig från `00816-s2027-d14`.

Den andra konflikten uppstod naturligt i gränssnittet. Det tidigare syntetiska deduptestet räckte alltså inte: års-id:t eller veckobeslutets urval tillåter att samma konfliktberättelse startas om nästa säsong.

### Burnout-taket — EJ TÄCKT

Högsta burnout blev 89,4. Ingen terminal `step_back`/`push_through` skapades. Avlastningsbeslutet hann sänka värdet före taket. En otriggad riskscen är enligt instruktionen saknad täckning, aldrig pass.

## Spår B — bred RC-granskning

### Releasekritiska sannings- och flödesfel

1. **Sommarintaget blandar A-trupp och akademi.** `seasonEndProcessor` lägger varje klubs `generateYouthIntake().newPlayers` direkt i den ordinarie spelarlistan och i `squadPlayerIds`, samtidigt som en separat P19-trupp genereras/bärs vidare. I den spelade karriären hamnade tre spelare med id `player_club_gagnef_youth_2026_*`, 17–19 år, i seniortruppen utan tröjnummer. En av dem kallades senare ”akademi” i ett event, medan årsboken sade **0 uppflyttade** och målet ”Lyft en spelare från akademin” var ouppfyllt. Det är ett kodverifierat modell- och presentationsbrott, inte bara dålig copy.

2. **Årsbokens högsta betyg bygger på en skev restmängd matcher.** Gamla hanterade matcher töms på `report.playerRatings` om de inte är derby, storseger eller sen match. Årsboken räknar sedan `topRated` ur just dessa kvarvarande ratings. Därför visades Riku Skog som 7,1 på 8 matcher respektive 7,9 på 5 matcher, trots 31 och 26 registrerade säsongsframträdanden. Urvalet underrepresenterar vardagsmatcher och gynnar uttryckligen stora marginaler/derbyn.

3. **Skada fryser över sommaren.** Filip Isacsberg avslutade första säsongen med tre veckors skada och började nästa cupsäsong med samma tre veckor kvar. Övrig fitness återställdes, men `rolloverPlayerInjuryRamp` rebaserar bara rampfältet och minskar inte `injuryDaysRemaining`.

4. **Årsbok och styrelse ger motstridiga omdömen.** Efter tredjeplatsen visades både ”Styrelsen fick mer än de bad om” och ”Tredjeplatsen var vad de väntade sig”. Det är samtidigt överträffat och exakt förväntat.

5. **Licenstexten motsäger den synliga ekonomin.** Årsboken visade +183 tkr första säsongen och −793 tkr andra, men licenstexten sade ”Två säsonger med underskott”. Om texten använder ett annat underskottsmått måste det måttet visas och namnges; annars upplever spelaren det som en lögn.

### Kontext, tidsordning och matchlogik

- En oavgjord cupmatch som vanns på straffar summerades som ”En dramatisk seger i slutminuterna”.
- Slutspelsvinster gav mediaraden ”två poäng hem”, trots att slutspel inte delar ut seriepoäng.
- Efter att kvartsfinalställningen redan blivit 1–2 stod ”Förlust ikväll och säsongen är slut”; korrekt tempus är ”En förlust till …”.
- Vid ställningen 2–5 sades att det ledande motståndarlaget ”söker avgörandet”; här ska det jagande laget söka reducering, alternativt det ledande laget döda matchen.
- En finalintro sade ”Det är inte ens en derby” i stället för ”ett derby”.
- Samma final beskrev hård, snabb is och senare att bollen gick trögt i kylan.
- En hemmahändelse placerade Sami Svensson ”i bussen hem”.
- Annandagsbeatet kom den 20 december i första säsongen; annandagen den 26 december fungerade korrekt i andra.
- Ett januarifönster använde fortfarande bildens alt-text/assetidentitet ”annandagen”.
- Milstolpar, förlustsvit och segereko kunde visas flera matcher efter det som orsakat dem, ibland efter ett motsatt färskt resultat och utan ”Gäller match …”-ankare.
- Citat från motståndare saknade ofta klubb/roll och kunde läsas som uttalanden från den egna klubben.

### Tydliga text- och etikettfel

- ”1 ohanterad händelse — hantera dem …” blandar singular och plural.
- ”DOMARENS LOCKER ROOM” är ett ensamt engelskt sektionsnamn.
- ”Hanna Ekström (Sandviken, 8 år)” ser ut som domarens ålder; skriv exempelvis ”8 år som domare”.
- Kafferumsbekräftelsen visade ”Säg det → →”.
- ”filen och 4–3-segern lever” ska vara ”filten”.
- ”och En yngre supporter” har fel versal mitt i meningen.
- ”höjer fanMood med 8 poäng” och ”Happiness: 39/100” läcker interna/engelska systemord.
- ”Söderforss lönelista” ska vara ”Söderfors lönelista”.
- ”Bra fight”, ”Sätt lineup” och ”Matchprep” bryter den övriga svenska tonen.
- ”vid tjugo” bör vara ”vid tjugo års ålder”.
- ”Akademin: 0 + 72 tkr” är obegripligt utan etiketter för investering och drift.
- ”Bastionen arena”, ”Kolbottnen arena”, ”Slagghögen arena”, ”Ässjan arena” och ”Planlunden arena” blir språkligt onaturliga genom automatiskt suffix.
- Kafferumsrader som redan innehåller citat får dubbla/nästlade citationstecken i komponenten.
- Relationsrubriken ”Bästa jag spelat med” följdes av citatet ”Vi spelade inte ihop som juniorer. Synd.”

### Bild och grafik

- Inga trasiga produktbilder eller porträtt observerades på desktop i den isolerade körningen.
- Motståndarintro, annandagen, final, säsongsslut och akademi laddade med verkliga dimensioner.
- De statiska bild-/porträttkontrollerna passerade.
- Ingen generell klippning eller blockerad CTA sågs på desktop.
- Mobilens toppkontrast och bildutsnitt återprovades inte i denna körning och ska därför inte räknas som passerade.
- Januariscenens annandagsidentitet är ett konkret asset-/semantikfel även om bilden tekniskt laddar.

## Prioriterad åtgärdsordning

### Pass 1 — gemensam långtidsidentitet

Gör galan, klackkonflikten och samtliga kafferumskonsumenter beroende av samma kanoniska semantic key + liggarcooldown. Säsongs-id får vara instans-id men får inte ensam ge rätt att återskapa samma berättelse. Lägg naturliga tvåsäsongsregressioner runt de tre faktiskt reproducerade nycklarna.

### Pass 2 — sann säsongsrollover

Separera P19-intag från A-truppsregistrering; en spelare får bara nå seniortruppen genom en verklig uppflyttning med liggarpost och måluppföljning. Låt sommaren konsumera eller läka skadeveckor. Bestäm samtidigt den explicita barriären för gala/licensplan före rollover.

### Pass 3 — årsboken från komplett underlag

Frys kompletta säsongsbetyg före fixture-komprimeringen, eller lagra ett säsongsaggregat som inte beror på vilka matchrapporter som råkar bevaras. Samla styrelse-, mål- och licensomdöme från samma redovisade sanningsmodell.

### Pass 4 — kontext- och språkgrind

Inför gemensamma axlar för tävling (serie/cup/slutspel), avgörande (ordinarie tid/straffar), venue, tid sedan händelse och talarens klubb/roll. Gör därefter de direkta strängfixarna ovan. Det stoppar hela felklasser i stället för att rätta en kommentar i taget.

### Pass 5 — slutligt återprov

Ny karriär på MEDEL, två obrutna säsonger, desktop + mobil. Burnout måste den här gången nå terminalvalet. Noll invariantbrott och inga nådda sanningsfel krävs innan Grind 2 arkiveras.

## Evidens och verifiering

- Passiv audit: `retest-evidence/audit-summary.json`, `selector-audit.json`, `canonical-ledger.json`, `event-lifetimes.json` i den isolerade provkatalogen.
- 149 riktade kö-, burnout-, kafferums- och säsongsbokslutstester passerade mot pinnen.
- Sex bild-/porträttassertioner passerade; en första lokal körning fick en icke-funktionell cachebehörighetsvarning, varefter samma grind kördes utan cache.
- Testserver och instrumentering låg utanför produktarbetskopian. Ingen spelbalans, save eller produktkod ändrades av provet.
