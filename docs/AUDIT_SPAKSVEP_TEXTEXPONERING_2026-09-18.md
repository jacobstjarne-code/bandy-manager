# AUDIT — spakkänslighet och textexponering, 2026-09-18 (Fable, Cowork)

Två mätningar som inte gjorts förut, körda headless på Jacobs Mac via Cowork-sandlådan (inte via Code). Frågan var inte "vad är trasigt" utan "vilka spakar gör skillnad, och vad läser spelaren egentligen". Rådata, skript och körlogg ligger i `docs/matningar/spaksvep_2026-09-18/` och `scripts/lever-sweep.ts`, `scripts/text-exposure.ts`.

## Kort dom

Spelet har en dominerande strategi som ingen audit hittills mätt: lätt träning (eller återhämtning) plus offensiv mentalitet slår allt annat på varje mätaxel samtidigt, och periodisering, budgetprioritet, kontraktskrav och anläggningsbygge gör i praktiken ingen skillnad på tre säsonger. Kondition och moral är den enda kanalen som räknas; nästan alla andra spakar är antingen döda eller proxies för den. Samtidigt är standardbanan ekonomiskt nedåt: 75 % av klubbarna ligger på minus från säsong 2 under normalt spel.

Textmässigt läser spelaren ~100 ord per omgång mellan matcherna, men 77 % av inkorgstexterna i en karriär är mallupprepningar, och tre mekaniska mallar (Nemesis, Rivalmöte, Karriärsmilstolpe) står för 48 av 63 styrelseinkorgsposter per säsong och växer för varje säsong. Omgång 28–36 är nästan tysta.

Tre harnessfynd är viktigare än enskilda siffror: alla headless-mätningar sedan augusti har körts utan besvarade beslutskort, utan kontraktskrav och utan röstintroduktioner, eftersom de tillståndsövergångarna bor i presentationslagret.

---

## 1. Metod

**Spaksvep.** `scripts/lever-sweep.ts`. 36 konfigurationer, en spak i taget mot en gemensam baslinje, parade seeds (samma seed = samma klubb, samma värld, samma matchslump). Baslinjen är harnessens standard: bästa elvan, billigaste anläggningsnod när kassan tillåter, `noOp`-svar på beslutskort, klubbens standardtaktik, träning Physical/Normal, ingen periodisering, ingen budgetprioritet.

Två körningar: 12 seeds × 1 säsong (432 säsonger) och 24 seeds × 3 säsonger (2 499 säsonger efter dedup). Per säsong mäts tabellplacering, poäng, målskillnad, kassa, boardPatience, fanMood, communityStanding, avsked, nya skador, snittkondition, snittmoral. Effekter redovisas som parad differens mot baslinjen; `*` = |medel| > 2 standardfel.

**Textexponering.** `scripts/text-exposure.ts`. Sju seeds × upp till fem säsonger (28 säsonger, fem karriärer slutade med avsked). Loggar varje ny inkorgspost, varje nytt beslutskort (rubrik, brödtext, valens etiketter), matchhändelsers `description` för den egna klubbens matcher, säsongssammanfattningens strängar. 33 859 textrader.

**Vad metoden inte ser.** Livekommentar (MatchStep.commentary) kastas när matchen är klar och kan inte fångas headless. Allt som renderas i presentationslagret ur tillstånd (portalen, kafferummet, scenerna, journalistrubriker) syns inte heller. Se §4.

---

## 2. Spaksvepet — fynd

### 2.1 Effekttabell (3 säsonger, 24 seeds, parad differens mot baslinje)

| Spak | Placering | Poäng | Kassa | boardPatience | Kondition | Moral | Avsked/24 karriärer |
|---|---|---|---|---|---|---|---|
| baseline (Physical/Normal, standardtaktik) | 7,1 | 20,3 | −137k | 51 | 61 | 74 | 4 (17 %) |
| **tr_light** (Physical/Light) | −1,54* | +4,47* | +161k* | +19,0* | +9,0* | +21,8* | 1 |
| **tr_recovery** | −1,47* | +4,42* | +143k* | +19,4* | +8,6* | +18,2* | 0 |
| tr_shooting | −0,40* | +0,62* | +18k | +4,6* | −0,6* | 0 | 1 |
| tr_defending / tr_tactical | ~0 | ~0 | ~0 | ~0 | −0,4* | 0 | 5 / 4 |
| tr_matchprep | +0,35* | −1,22* | −108k* | −6,1* | −5,2* | +21,3* | 8 |
| **tr_extreme** | +2,23* | −7,58* | −242k* | −29,4* | −20,6* | −65,4* | 21 (88 %) |
| **ment_off** | −1,28* | +3,17* | +90k* | +12,9* | −0,3 | +0,2 | 1 |
| ment_def | +0,41* | −1,41* | −99k* | −5,4* | +0,4* | −0,2* | 6 |
| tempo_low | −0,27 | +0,77 | −15k | +3,1 | +3,8* | 0 | 5 |
| tempo_high | +0,30 | −1,00 | −94k* | −5,0* | −4,4* | −0,6* | 6 |
| width_wide | −0,36* | +0,89* | +11k | +5,3* | −0,1 | −0,1 | 3 |
| width_narrow | +0,12 | −0,33 | +2k | +0,4 | −0,1 | −0,1 | 5 |
| pass_direct / pass_safe | −0,14 / +0,23 | +0,42 / −0,61 | −10k / −22k | +1,0 / −0,4 | — | — | 7 / 6 |
| corner_aggr | −0,33* | +0,71* | +6k | +2,6 | −0,1 | 0 | 4 |
| pk_passive / pk_aggr | −0,23 / +0,09 | +0,53 / −0,69* | +18k / −35k* | +1,3 / −0,7 | +0,2 / −1,0* | — | 4 / 5 |
| per_hall | **0,00** | **0,00** | **0** | **0,00** | **0,00** | **0,00** | 4 |
| per_toppa | +0,59* | −2,07* | −107k* | −6,8* | +1,4* | −0,3* | 9 |
| per_bygg | +0,32 | −1,43* | −94k* | −9,2* | −4,5* | −0,4* | 8 |
| per_vila | +0,24 | −0,75* | −67k* | −1,5 | +1,5* | −0,1 | 6 |
| bud_youth | **0,00** | **0,00** | **0** | **0,00** | **0,00** | **0,00** | 4 |
| bud_squad | +0,03 | −0,06 | −3k | −0,1 | 0 | 0 | 4 |
| con_meetNone | **0,00** | **0,00** | **0** | **0,00** | **0,00** | **0,00** | 4 |
| fac_none | +0,08 | −0,32* | +87k* | −1,7* | 0 | 0 | 4 |
| ev_first (alltid första valet) | −0,15 | +0,24 | +178k* | −5,9* | +0,4* | +1,2* | 4 |
| ev_last (alltid sista valet) | −0,06 | +0,19 | −11k | −30,6* | −0,5* | −4,7* | 18 (75 %) |
| ev_ignore (svarar aldrig) | −0,04 | −0,22 | +17k | +0,4 | −0,7* | −6,9* | 5 |
| lu_neverRotate (samma elva hela säsongen) | 0,00 | −0,41 | −41k | −0,3 | −1,2* | −0,2 | 5 |
| lu_rosterOrder | +0,91* | −3,00* | −146k* | −12,2* | −1,1* | −0,9* | 9 |
| lu_weakest | +2,21* | −6,85* | −287k* | −28,5* | −1,3* | −0,3 | 19 (79 %) |

Baslinjens spridning mellan seeds: placering sd 3,5, poäng sd 9,4, kassa sd 398k. Träningseffekten på 4,5 poäng är alltså ungefär en halv klubbskillnad.

### 2.2 Dominerande strategi: lätt träning + offensiv (HIGH)

Physical/Light ger +9 kondition, +22 moral, −2 skador per säsong, +4,5 poäng, +161k i kassa och tar avskedsrisken från 17 % till 4 %. Recovery ger samma sak. Det finns ingen mätaxel där Light förlorar mot Normal. Extreme är katastrof (88 % avsked, moral 7,6 i snitt). Effekten på moral är den avslöjande: baslinjens 74 blir 96 med lätt träning, alltså nära tak. Träningsintensitet är i praktiken en moral- och konditionsratt utan motstående kostnad; färdighetsutveckling (det som skulle vara priset för att träna lätt) syns inte i tre säsongers resultat.

Offensiv mentalitet är dominerande på samma sätt: +3,2 poäng, −1,3 placeringar, +90k, +13 boardPatience, avsked 4 % mot 17 %. Defensiv förlorar på allt. Tolvan klubbar, tolv seeds-klubbar, samma svar. Mentalitetsaxeln är därmed inte en avvägning utan ett rätt svar. Samma riktning, svagare: bred, aggressiva hörnor, lågt tempo (via kondition).

Konsekvens för spelaren: den som "lär sig spelet" hittar en knapp som löser allt; den som inte gör det blöder. Det är den motsatta svagheten mot illusion av val, men samma resultat: spakarna bildar inget landskap.

Relaterat: CRITICAL 3 i augustiauditen (konditionsdödsspiral) och HIGH 12 (ekonomin ger sällan smärtsamma val). Båda är samma fenomen sett från andra hållet.

### 2.3 Döda spakar (HIGH)

Tre spakar ger exakt noll skillnad på alla elva mätaxlar över 72 säsonger:

- **Periodisering `hall`** är identisk med ingen periodisering alls (väntat om hall är default; bekräftar att baslinjen är hall). Men `toppa`, `bygg` och `vila` är alla sämre än hall på poäng, kassa och boardPatience. Det finns ingen situation i svepet där det lönar sig att lämna hall. En spak med fyra lägen där ett läge dominerar är en död spak med extra text.
- **Budgetprioritet `youth`** gör ingenting på tre säsonger. Koden (`seasonEndProcessor.ts:631–647`) skalar `transferBudget` ×0,7 och höjer `club.youthQuality` +3 per säsong; `squad` skalar ×1,2 och sänker `club.facilities` −1. `transferBudget` används inte i headless (inga köp), `youthQuality` matar bara akademins PA-fördelning, och `club.facilities` är det gamla 0–100-talet som lever parallellt med `facilityState` (läses fortfarande av `politicianService.ts:32`, `o1SystemEvents.ts:47`, `eventResolver.ts:1206/1224/1469`). Två anläggningsbegrepp i samma spel.
- **Kontraktskrav `meetNone`** = `meetAll` exakt. Se §2.6, det är ett harnessfynd.

Nästan döda: `bud_squad`, `pass_*`, `width_narrow`, `pk_*`, `tr_defending`, `tr_tactical`. Ingen av dem flyttar poäng eller kassa signifikant. Att träna försvar eller taktik i tre säsonger ger −0,4 kondition och inget annat mätbart.

### 2.4 Att spela spelar roll, rotation gör det inte (MEDIUM)

Svagaste elvan ger +2,2 placeringar sämre och 79 % avsked; truppordningselvan +0,9 placeringar. Laguttagningen är den spak som betyder mest, och det är bra. Men samma elva hela säsongen utan rotation (skadade tvingas in via harnessens fallback) kostar bara −1,2 kondition och 0,4 poäng, inte signifikant. Konditionshantering via rotation, det som Squad Pulse och periodiseringen är byggda för, gör alltså ingen mätbar skillnad på resultatet; det gör träningsintensiteten.

### 2.5 Eventpolicy: sista valet dödar, ignorera höjer kommunstatus (MEDIUM, en öppen fråga)

Alltid sista valet på beslutskorten ger −31 boardPatience och 75 % avsked utan att påverka poängen. Första valet ger +178k i kassa och +7 communityStanding men −6 boardPatience. Det betyder att korten som klass har stark och konsekvent riktning: förstavalet är "ja/pengar", sistavalet är "nej/dyrt för styrelsen". Pairwise dominance-auditen (O2) tittade per kort; svepet visar aggregatet.

Oförklarat: **att aldrig svara** på ett kort ger +17 communityStanding över tre säsonger, mer än att svara ja på allt (+7). Reproducerat på seed 3 med `diag-cs`: differensen uppstår i omgång 11–12 och vid säsongsslut (noOp tappar 4 CS där ignore inte gör det). Rotorsaken är inte lokaliserad; kandidater är att `noOp`-valen på community-/klackkort bär en CS-kostnad som ett obesvarat kort slipper, och att säsongsslutets CS-justering läser något som svaren rör. Detta är ett Code-jobb med mätbar reproduktion.

### 2.6 Harnessfynd: headless spelar ett spel utan onboarding (HIGH för alla tidigare mätningar)

Tre tillståndsövergångar som avgör vad simuleringen alls prövar bor i presentationslagret och inträffar aldrig headless:

1. **Kontraktskrav.** `PendingScreen.ContractDemands` sätts bara i `gameFlowActions.clearSeasonSummary`. Headless går `season_summary → null`, `pendingContractDemands` ligger kvar obesvarad och tas aldrig upp. A-H2b-policyn i `fixtures.ts` ("meet every qualifying demand") har därför aldrig körts; `npm run stress` har inte övat Leg 2 (moral) eller Leg 3 sedan 2026-08-28, trots kommentaren som säger motsatsen.
2. **Beslutskort.** `stress-test.ts` anropar aldrig `autoResolvePendingEvents`, bara `autoResolvePendingScreen`. Alla GRIND-körningar har en tom beslutskortsekonomi. Mitt svep använder `autoResolvePendingEvents` (noOp) som baslinje, så siffrorna är inte direkt jämförbara med GRIND.
3. **Röstintroduktioner.** `queueRosterVoiceIntroductions` och `seedTilltradeVoices` körs i `markOnboardingComplete` (presentation). Headless introduceras aldrig klackledaren, politikern m.fl. `resolveEvent` returnerar tyst oförändrat spel för ett kort vars röst inte är introducerad (`canEventPassVoiceGate`, `eventResolver.ts:406`). Konkret: `supporter_away_trip_<säsong>` låg obesvarad i pendingEvents från omgång 11 till 37 på seed 3. Alla klack- och politikerkort är döda i varje headless-mätning som gjorts.

Följdfråga för spelet, inte bara harnessen: ett kort med `voiceId` men utan `introducesVoiceId` (bortaresan, O1-klackdilemmat) som genereras innan rösten introducerats blir osynligt och oavgörbart tills introduktionen råkat ske. Om spelaren skjuter upp `voice_intro_klack_leader_*` ligger kortet kvar hela säsongen. Det är klass G i begriplighetsrevisionen (tystnad utan förklaring), fast här är tystnaden ett kort som existerar men inte får visas.

### 2.7 Sponsorerbjudanden var och varannan omgång (MEDIUM)

Med avböjande policy genereras 15–19 distinkta sponsorerbjudanden per säsong (37 omgångar). Slotgrinden (`activeSponsors < maxSponsors`) öppnar ett nytt erbjudande så fort det förra avböjts. För en spelare som av princip säger nej till en sponsor är det ett nag varannan omgång; korten är dessutom textmässigt likadana (37 mallträffar i en karriär, §3.2). O1:s "sponsorn först" motiverar att erbjudanden kommer, inte att de kommer i den takten.

### 2.8 Standardbanan är nedåt (bekräftar Skutskär, nu generellt)

Baslinjen över tre säsonger, 24 klubbar: kassa +113k → −191k → −332k, andel klubbar på minus 25 % → 75 % → 75 %, boardPatience 64 → 49 → 41, placering 6,4 → 7,6 → 7,3. Under normalt spel utan misstag glider tre av fyra klubbar mot konkursgränsen på två säsonger. Skutskär-auditen såg det för en svag klubb; svepet visar att det gäller mitten också. `fac_none` ger +87k, så anläggningsbygget är en del av blödningen men inte hela.

### 2.9 Smått

- `SaveGame.firedReason` sätts bara på konkursvägen (`postRoundFlagsProcessor.ts:41`). De sportsliga avskedsorsakerna hamnar i `SeasonSummary.boardTruth.firedReason` men aldrig på SaveGame. 214 avsked i svepet, 0 med `firedReason`. Fältet läses inte någonstans (bara nollställs i `switchManagedClub`), så det är dött, inte fel; men det ser ut som en datakälla och är det inte.
- Effekterna av träning på placering är större än effekten av att byta från svagaste till bästa elvan minus rotation. Om det är avsikten bör träningsvyn bära den vikten.

---

## 3. Textexponering — fynd

### 3.1 Läsbelastning

Per säsong (snitt över 28 säsonger): 82 inkorgsposter (1 554 ord), 62 beslutskort (2 432 ord), 1 006 matchhändelser (3 198 ord, men det är "Mål av X"-rader), 32 säsongssammanfattningssträngar. Mellan matcherna läser spelaren median 106 ord per omgång, p90 190, max 509. Säsong 1 är lättare (87 ord/omgång) än 2–5 (107–113).

Profilen över säsongen är det intressanta. Snitt ord per omgångsnummer:

```
1:110 2:132 3:123 4:82 5:157 6:137 7:102 8:127 9:111 10:111 11:179 12:157
13:139 14:111 15:180 16:94 17:96 18:156 19:104 20:125 21:106 22:94
23:102 24:109 25:89 26:153 27:92 28:61 29:43 30:34 31:29 32:35 33:32 34:22 35:28 36:9 37:320
```

Omgång 28–36 ligger på 9–43 ord. 162 av 1 036 omgångar (16 %) har noll nya texter, nästan alla i det spannet. Slutspels-/cupfasen för klubbar som inte är med är en tyst korridor på nio omgångar följd av en 320-ordsdump vid säsongsslut. Det är klass G och klass F (händelse utan efterdyning) i begriplighetsrevisionen, mätt.

### 3.2 Upprepning

| Källa | Exakt upprepning inom en karriär | Mallupprepning (siffror/namn normaliserade) |
|---|---|---|
| Inkorg | 24 % | **77 %** (76 unika mallar av 329 poster) |
| Beslutskort | 20 % | 61 % (97 unika av 250) |
| Säsongssammanfattning | 22 % | 53 % |
| Matchhändelser | 84 % | 100 % (fyra mallar: "N", "N av N") |

Mest upprepade inkorgsmallar, max gånger i EN karriär (3–5 säsonger):

- 107× `Rivalmöte: X dominerar mötet mot Y med N–N i matcher. Dominansen håller i sig.` (`narrativeProcessor.ts:168`)
- 101× `Nemesis: X (Klubb) har nu gjort N mål mot oss. Är det dags att värva honom istället?` (`narrativeProcessor.ts:225`)
- 78× `Karriärsmilstolpe: X satte hattrick och nådde en karriärsmilstolpe!`
- 24× `X har nu N raka förluster mot Y.`
- 17× `Derby nästa omgång …`

Per säsong: Nemesis 21,6, Rivalmöte 13,8, Karriärsmilstolpe 12,8 poster. Tillsammans 48 av 63 poster av typen `boardFeedback` per säsong, alltså 1,3 per omgång. Och de växer: Rivalmöte går från 1,0 per säsong (säsong 1) till 18,0 (säsong 5), eftersom varje dominerad rivalitet triggar vid varje möte och antalet dominerade rivaliteter bara ökar. Nemesis går från 9 till 27 mellan säsong 1 och 2. HIGH 7 och HIGH 8 i augustiauditen ("press och event upprepar sig", "akademidebuten återanvänds tills den slutar betyda något") var rätt iakttagelse; det här är siffran, och den gäller mer än akademidebuten.

Två saker till om de här posterna. De är typade `InboxItemType.boardFeedback` fast de är rivalitets- och milstolpsnotiser, vilket påverkar gallring och filtrering. Och "Är det dags att värva honom istället?" är en retorisk fråga utan handlingsväg 21 gånger per säsong; det är exakt mönstret från promise⇔consequence-auditen (KRÄVER SVAR utan action-path).

Mest upprepade beslutskortsmallar: sponsorerbjudandet 37× i en karriär (§2.7), kontraktsförfrågan 19×, opponentQuote 12× ("N: 'N avvikande utfall. N händer.'"), transferbud 10×, starPerformance 10× (samma "ställde klubban i stället"-scen).

### 3.3 Poolutnyttjande kan inte mätas headless

Jag matchade alla prosalitteraler (≥ 20 tecken) i `src/domain/data/*.ts` mot den fångade texten: 3 581 strängar, 47 träffar (1 %). Metoden fungerar där texten produceras i domänen (`eventCardInlineStrings.ts` 16/16 = 100 %, `eventProcessorStrings.ts` 13/30) och är blind överallt annars: `matchCommentary.ts` 557 strängar 1 träff (livekommentaren kastas när matchen är klar), `journalistHeadlineStrings.ts` 115/0, `boardMeetingCopy.ts` 111/0, `hallProvningData.ts` 110/0, `transferResponseText.ts` 95/0. Det säger inte att de poolerna är döda; det säger att frågan "vilken andel av de 3 581 strängarna ser en spelare på fem säsonger" kräver ett renderande harness (Playwright-selen mot simulerade tillstånd) och inte kan besvaras från domänen. Det är ett eget bygge och troligen det mest värdefulla nästa mätinstrumentet, eftersom textauditen har lagt hundratals timmar på pooler vars faktiska exponering ingen vet.

---

## 4. Vad som inte är visat

- Spakarna sätts konstant hela karriären. En människa växlar. Svepet mäter ytterlägenas riktning och storlek, inte optimal växling.
- Tre säsonger. Akademi, ungdomskvalitet och anläggningar är byggda för längre horisont; deras nolla här är "ingen effekt inom det spelaren hinner uppleva före soft launch", inte "ingen effekt".
- Ingen transfermarknad i headless (harnessen köper aldrig). `transferBudget`-effekter är därför omätta.
- Baslinjen svarar `noOp` på kort, inte tystnad. Verkliga spelare ligger någonstans mellan ev_first och ev_ignore.
- Voice-gaten gör att klack- och politikerkort inte deltar i någon konfiguration (§2.6). Deras spakar är omätta.

---

## 5. Handoff

**Code, mätbara reproduktioner, ingen designdom behövs:**

1. Harnessen: gör `autoResolvePendingScreen` medveten om `pendingContractDemands` (sätt `contract_demands` när `season_summary` töms och krav finns), anropa `autoResolvePendingEvents` i `stress-test.ts`, och seeda röstintroduktioner i `createHeadlessGame` (kalla samma domänfunktioner som `markOnboardingComplete`, eller flytta dem till `createNewGame`). Verifiera med `diag-rep`-mönstret: inget event-id ska ses i > 1 omgång efter resolve. Utan detta mäter GRIND fel spel.
2. Nemesis/Rivalmöte/Karriärsmilstolpe (`narrativeProcessor.ts` rad ~160–230): inför per-säsong-tak och trösklar som växer (Nemesis vid 3, 6, 10 mål, inte varje mål; Rivalmöte bara när dominansen etableras eller bryts, inte vid varje möte; milstolpe bara för första hattricket per spelare och karriär). Typa om till en rivalitets-/milstolpstyp, inte `boardFeedback`. Mät om med `text-exposure.ts`: målet är < 10 sådana poster per säsong och ingen tillväxt över säsonger.
3. Sponsorgrinden (`postAdvanceEvents.ts` ~rad 990, maxSponsors-gaten): cooldown efter avböjt erbjudande (t.ex. 4 omgångar) och tak per säsong. Mål: ≤ 6 erbjudanden per säsong vid konsekvent nej.
4. `ev_ignore`-CS-anomalin: kör `scripts/diag-cs.ts 3 noop` mot `ignore`, diffa CS-skrivningar per omgång 11–12 och vid säsongsslut, hitta vägen som ger obesvarade kort +CS eller besvarade −CS.
5. `SaveGame.firedReason`: antingen skriv det i `seasonEndProcessor` bredvid `boardTruth.firedReason` eller ta bort fältet.

**Jacob-beslut (design, före bygge):**

6. Träningsintensitet som dominerande strategi. Alternativ: (a) ge Light/Recovery en verklig kostnad i färdighetsutveckling som syns inom en säsong, (b) låt kondition ha avtagande avkastning så att +9 kondition inte ger +4,5 poäng, (c) acceptera att träning är en moralratt och gör det uttalat i UI. Mitt förslag är (b) plus att Extreme får ett tydligt "varför skulle någon välja detta" (kortsiktig toppning inför en enskild match, inte ett säsongsläge).
7. Offensiv mentalitet som rätt svar. Antingen är motorn kalibrerad så att offensiv ger fler mål utan tillräcklig defensiv kostnad, eller så saknas motståndaranpassning (AI-lag som straffar offensiv mot bättre motstånd). Motordiagnos-fråga; jag skulle be Code köra ment_off mot topp-3-motstånd separat innan beslut.
8. Periodisering: tre av fyra lägen är sämre än det fjärde. Antingen tas spaken bort ur UI:t före soft launch, eller så får `toppa`/`bygg` en mätbar poäng när de används rätt (toppa inför slutspel, bygg i försäsong). Just nu är det text utan mekanik.
9. Tysta korridoren omgång 28–36. Vad ska en klubb som är ute ur slutspelet läsa i nio omgångar? Det är ett textuppdrag för mig när du bestämt om korridoren ska fyllas eller kortas.

**Fable (efter Jacobs beslut på 9):** texten för korridoren; omskrivning av Nemesis-raden så den inte ställer en fråga spelaren inte kan svara på.

**Nästa mätinstrument, större bygge (Code, efter soft launch):** ett renderande exponeringsharness som spelar upp simulerade tillstånd genom portal, kafferum, matchlive och scener med Playwright och loggar renderad text, så att §3.3 kan besvaras för alla 93 datafiler.
