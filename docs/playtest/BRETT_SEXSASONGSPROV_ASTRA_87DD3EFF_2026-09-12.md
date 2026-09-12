# Brett sexsäsongsprov — Astra på `87dd3eff`, 2026-09-12

## Dom

**UNDERKÄND SOM RELEASELÅS.** Produktkoden hölls helt låst under provet.

Pinnad commit: `87dd3eff24939bbc35b2502329d3472b96884ada`  
Samma hash låg på `origin/main` och i Vercels produktionsdrift när provet startade.

Den låsta versionen är stabil i själva matchsimuleringen och håller den nya
målkalibreringen. Det breda långtidsprovet hittade däremot fyra systemiska
releasefynd: säsongsslut kan överskrida beslutstaket, den kanoniska
klackkonflikten startar om över senare säsonger, flera lösta eventidentiteter
återkommer, och AI:s ungdomsintag placerar 15-åriga `Player`-objekt direkt i
seniortrupper trots domäninvarianten 16–42. Parallell granskning hittade också
två synliga kvalitetsblockerare: kafferummets fyrfältmodell förstör treparts-
dialog och sena målkommentarer kan ljuga om matchläget.

## Metod och omfattning

- Ren detached worktree på exakt pinne; Jacobs save och localhost orörda.
- 12 deterministiska karriärer, en per klubb, mål sex säsonger per karriär.
- 44 hela säsonger fullföljdes innan naturliga avsked; Västanfors, Gagnef,
  Hälleforsnäs och Lesjöfors nådde sex hela säsonger. Övriga åtta karriärer
  slutade genom styrelseavsked, inte krasch.
- 7 310 simulerade matcher och 64 943 mål.
- Riktig onboardingsemantik användes: `seedTilltradeVoices` +
  `queueRosterVoiceIntroductions`, samma tillstånd som
  `markOnboardingComplete` skapar.
- Alla synliga event löstes som spelarval (`madeByPlayer=true`); transferbud
  avvisades, övriga kort tog första framåtdrivande val. Kafferummet besöktes
  och kvitterades 1 231 gånger med narrativa nycklar loggade på samma sätt som
  produktens `completeScene`.
- Alla ordinarie domäninvarianter kördes efter varje steg. Den föråldrade
  åldersspärren dokumenterades men undantogs diagnostiskt endast för exakt
  15-åriga AI-intag med `_youth_`-id, så resten av provet kunde slutföras.
- Parallellt: read-only grafisk genomgång av dev-scener samt statisk svensk
  text-/kontextgranskning mot samma pinne.

Detta är ett brett headless långtidsprov med UI-/textgranskning, inte ett nytt
manuellt känslospel. Det ger stark logisk och ytmässig täckning men gör inga
anspråk på en ny subjektiv sexsäsongsjournal.

## Matchmotor och långtidskurvor

### Målkalibrering — PASS

Målsnittet blev **8,884 mål/match** över 7 310 matcher. Det ligger vid det
förväntade ankaret omkring 8,98 efter utvisningstimerfixen och har inte glidit
tillbaka till 9,39.

### Veteraner — PASS med avgränsning

Den beständiga 31+-kohorten tappade i snitt **0,956 CA per säsongspar** i det
breda provet. Det riktade testet för den nya attributnedgången passerade
12/12 på pinnen och bevarar den tidigare uppmätta jämförbarheten: cirka 0,95
attributpoäng för managed mot 1,01 för AI på identiska 34-åringar över tre
säsonger. Det råa breda attributmedlet (+0,015) blandar klubbar, åldrar,
skador och urval och används därför inte som regressionsdom; CA-kurvan och det
kontrollerade paret är de giltiga måtten.

### Driftstabilitet — PASS

Efter det explicit avgränsade åldersundantaget gav provet inga runtimekrascher,
deadlocks, NaN-/undefined-brott, trasiga tabeller, felaktigt fixtureantal eller
stale kontrakt. Alla tolv karriärer slutade antingen med sex säsonger eller ett
ordinarie avsked.

## Logikfynd

### 1. Beslutsbudgeten bryts vid säsongsslut — BLOCKER

Kanoniska `getActiveDecisionCount` nådde **4** trots max 3 vid fyra
säsongsövergångar:

- Forsbacka 2028 och 2029,
- Målilla 2028,
- Lesjöfors 2028.

Det reproducerande tillståndet hade `season_summary`, ett veckoval och tre
eventkort samtidigt, till exempel
`licenseHandlingsplan_2027`, `event_gala_2027` och
`event_mecenat_retire_mecenat_ingrid_2026_2027`. Max uppskjuten kö var 5.
Rotfrågan är övergångsbarriärens ordning: säsongens skärm/veckoval reserveras
inte innan rollover-eventen ytas och budgeten slutpartitioneras.

### 2. Klackkonflikten saknar durabel karriärspärr — BLOCKER

Den riktiga `supporter_conflict_<season>` nåddes i 10/12 karriärer. I 7 av
dem skapades en ny säsongsinstans efter att tidigare konflikt lösts:

- Forsbacka: 2026, 2028, 2029,
- Västanfors: 2027, 2030,
- Målilla: 2026, 2027, 2028,
- Gagnef: 2026, 2027, 2031,
- Hälleforsnäs: 2028, 2029,
- Lesjöfors: 2028, 2029, 2031,
- Heros: 2027, 2028.

Roten finns i producenten: den grindar bara på
`supporterGroup.conflictSeason !== currentSeason` och ger varje år ett nytt
id. Den läser ingen durabel semantisk resolution ur liggaren.

### 3. Lösta eventidentiteter återkommer — BLOCKER

Nio återkomster observerades. De viktigaste exemplen är:

- `politician_inclusion_2029` återkom 2030,
- spelarparets `event_praise_...` och `event_bond_...` återkom,
- samma `event_bid_bid_18_...` återkom efter svar,
- `community_fikakväll` återkom tre globaldagar i samma säsongsfönster,
- `event_star_<player>_13` återkom i en senare säsong.

Detta är inte nio separata textlappar. Producenterna blandar osäsongade fasta
id:n, beräknade säsongs-id:n som inte faktiskt förs vidare till eventet och
återkommande aktiviteter utan separat instans-/semantic-id. Fixen ska gå på
gemensam långtidsidentitet genom pending, deferred, receipt och ledger.

### 4. AI-intaget bryter Player-kontraktet — BLOCKER/TYDLIGT VÄGVAL

Ordinarie stresstest stannade omedelbart efter första rollover eftersom
`gameInvariants.playerAges` uttryckligen kräver 16–42 men
`generateYouthIntake` skapar AI-klubbarnas seniora `Player`-objekt som 15–19
och lägger dem direkt i både `game.players` och `club.squadPlayerIds`.
Det diagnostiska provet observerade 297 karriärlokala 15-åriga AI-intag.

Rekommenderad releasefix: managed P19 får fortsatt vara 15–19 i `YouthTeam`,
men AI:s abstrakta intag som materialiseras direkt som senior `Player` ska
vara 16–19. Ändra inte domäninvarianten för att gömma skillnaden.

## Invarianter som höll

- **Burnout:** terminalscenen nåddes i 11/12 karriärer. Med riktiga
  spelarresolutioner fick ingen säsong fler än ett terminalval och inga
  motstridiga slutval skrevs.
- **Kafferumscooldown:** 1 231 besök, noll återkomst av de spårade fasta
  `narrativeKeys` inom den definierade tvåsäsongsspärren.
- **Bandygalan:** nåddes i alla 12 karriärer, en årsinstans per säsong och
  ingen löst årsinstans återkom.
- **Kärnflöde:** fyra fulla sexsäsongskarriärer gick från start till avslut
  utan runtimefel eller olösbar säsongsbarriär.

## Grafisk granskning

### Verifierade fel

1. **Hög:** taktikvalens etiketter överlappar redan vid 375 px, även vid
   360/320 px. `BALANSERAD` går in i grannvalen. Rot: fast 78 px-kolumn i
   `TacticBoardCard.tsx` tillsammans med versaler och teckenavstånd.
2. **Medel:** portalens fasta CTA/scrollindikering och bottenband begränsas
   inte till spelets 390–430 px-kolumn på desktop. `BottomNav` har redan rätt
   maxbreddsmönster att återanvända.
3. **Låg:** burnoutbildens sekundärtypografi är 8 px respektive 10,5 px med
   låg opacitet, läsbar men nära mobilgränsen.

### Bildstatus — PASS

- Alla 12 föreningsbilder laddar och beskärs rimligt, inklusive Målilla och
  Hälleforsnäs.
- Burnout-, klack- och klackkonfliktbilderna laddar, beskärs väl och håller
  vid 320 px.
- Alla valbara porträttplatser är fyllda: 105 kuraterade porträtt. Granskade
  filer är centrerade, transparenta och 400×400.
- Bildintegritetstestet passerar för 38 illustrationer samt porträtt,
  klubbmärken och varumärkesbilder.
- Ingen saknad eller felwiread produktbild hittades.

### Visuellt testskydd som saknas

De tre nya illustrationsscenerna och galan saknas i visuella
regressionsregistret. Dev-scenen `annandagen` visar ett midvinteranslag, inte
den faktiska matchladdningsbilden. Detta är testskydd, inte ett observerat
bildfel.

### Nästa starka bildlägen

1. `hall-provning` — stort svart tomrum kring ”Inget är förvalt”.
2. `season-signature-reveal` — säsongens avgörande ögonblick behöver tyngd.
3. `sunday-training` — morgonträning på is.
4. `journalist-relationship` — hellre porträtt/avatar än stor illustration.

## Text- och kontextgranskning

### Två rotblockerare

1. **Kafferumsdialogens datamodell:** `CoffeeExchange` renderar exakt två
   talare, men 43 fyrfältstupler har en tredje replik inklistrad i `textB`.
   Resultatet blir talarnamn inne i citatet och trasiga citattecken. Byt till
   en lista av `{speaker, text}`-turer eller dela trepartsutbyten strukturellt;
   radvis interpunktionslagning räcker inte.
2. **Sena målkommentarer väljs före matchläge:** `goalLate` väljs innan koden
   vet om målet kvitterar, reducerar eller utökar. Därför kan ”ser till att
   det inte slutar här” och ”ger oss” visas när motståndaren utökar.
   Klassificera matchläget först och välj sena varianter per kategori.

### Säkra text-/presentationsfel för samma fixpass

- råa formations-id:n (`532_triangel`, `532_tvatoppar`) och gammal
  `3-3-4`-fallback når UI,
- rå sponsor-enum (`local`, `regional`, `foundation`) når UI,
- venuefel: ”{opp} kommer hit slitna”, ”Hemmapubliken tystnar”, ”Pokalen är
  vår” samt neutrala misspoolens ”Vi är centimetrar ...”,
- `draw_any` kan säga ”Tre oavgjorda” efter ett enda kryss,
- `väten`→`vattnet`, `Inget kris`→`Ingen kris`, `om kort`→`inom kort`,
  `varsomhelst`→`var som helst`, `en ny tifo`→`ett nytt tifo`,
  `supportar`→`supporter`,
- `säsongen vi blev SM` och `SM-final-säsongen` behöver sann svensk
  formulering; finalistsvaret måste faktiskt nämna finalen,
- `playoff`→`slutspel`, `nästa hemmagång`→`nästa hemmamatch`,
  `hållhake`→`stadga`,
- `frislags-mål`, `borta-resan`, `korv-pengar` ska vara sammanskrivna,
- pengar och betyg går runt befintlig svensk decimalformatterare på flera
  ytor och visar punkt i stället för komma.

## Rekommenderad åtgärdsordning

1. **Gemensam beslutslivscykel:** säsongsbarriärens reservation/partition,
   durabel semantic-id genom alla köfaser och de konkreta återkomstproducenterna.
   Klackkonflikten ska läsa samma durabla resolution.
2. **AI-intagets kontrakt:** 16–19 för AI:s direktmaterialiserade seniorer;
   P19 lämnas 15–19.
3. **Sann textstruktur:** turbaserad kafferumsmodell och matchlägesklassning
   före sena måltexter. Ta övriga säkra textfel i samma pass.
4. **Mobilgrafik:** taktikknapparnas responsiva layout, portalens maxbredd och
   burnouttypografin.
5. **Visuellt skydd:** registrera de tre nya illustrationerna, galan och den
   riktiga annandagsvyn.

Kör därefter om exakt samma deterministiska population. Ett rent omprov ska
ha: aktiv budget ≤3, noll lösta identiteter tillbaka, högst en kanonisk
klackkonflikt per karriär, ingen 15-årig senior-`Player`, målsnitt fortsatt
kring 8,98 och fortsatt negativ veterankurva.
