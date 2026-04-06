# STATUSGENOMGÅNG & VISION — 6 april 2026

---

## DEL 1: VAD FUNKAR

### 🟢 Spelkärnan är solid
Matchflödet (lineup → taktik → pep-talk → live/snabbsim → resultat → omgångssammanfattning → dashboard) fungerar end-to-end. Matchen har steg-för-steg-kommentarer med 100+ svenska texter. Hörnor är ett offensivt vapen. Flygande byten ger bänkspelare speltid. Halvtidsbyte med taktikjustering. Pep-talk med atmosfär som varierar med derby/cup/väder. Allt detta känns som Bandy Manager.

### 🟢 Ekonomisystemet
Single source of truth via `calcRoundIncome()`. Transaktionslogg med spårbarhet. Capacity kalibrerad för svensk bandy (200-700 åskådare). Sponsorer, kommunbidrag, mecenater — alla kopplade. EkonomiTab ger spelaren full insyn. Lönebudget varnar men blockerar inte. Detta är robustare än de flesta indie-managerspel.

### 🟢 Tabellskärmen
Expanderbara rader med H2H, nästa möte, karriärstatistik. Positionspilar mot förra omgången. Zonindelning (slutspel/nedflyttning). Formguide med tap-tooltip. Statistik-flik med toppskyttar. Cup-flik med bracket. Allt i en konsekvent tab-switcher.

### 🟢 Designsystemet
Heritage-tema (parchment/copper/leather) genomfört. CSS-variabler utan hårdkodade färger. card-sharp som standard. 22 dokumenterade designregler. Konsekvent emoji-konvention. Det visuella språket är unikt och igenkänningsbart.

### 🟢 Trainer arc
Narrativ båge som rör sig genom newcomer → honeymoon → grind → questioned → crisis → redemption → established → legendary. Stämningstext på dashboard. Transition-reasons visas. Det ger en känsla av att spelet "ser" hur det går för dig.

### 🟢 Världsbyggnad
12 klubbar med unika SVG-emblem. Regionalt anpassade arbetsgivare (Sandvik, ABB, BillerudKorsnäs). Namngivna styrelsemedlemmar med personligheter. Lokal tidning. Funktionärer med citat. Väder via SMHI-regiondata. Rivalrier med derbynamn. Det är inte en abstrakt liga — det är Bergslagen, Dalarna, Norrland.

### 🟢 Dubbelliv-systemet
Spelare med dagsjobb (mekaniker, lärare, snickare). Flexibility-procent som påverkar träning. Varsel-events kopplade till lokala arbetsgivare. Erbjud heltidskontrakt. Befordran vs bandyn. Det här ÄR spelets USP — och det funkar mekaniskt.

---

## DEL 2: VAD SOM INTE FUNKAR (ÄN)

### 🔴 Cupen
Lottningen parar lag mot sig själva. winnerId sätts innan match spelats. Bracket visar 0-0 för ospelade matcher. Grundfunktionaliteten (cup-logik, fixturer, bracket-vy) finns men initialiseringen är trasig. Sprint 0-bugg.

### 🔴 Bakgrundssimulering
Managed match kan simuleras utan spelarinput. Batch-sim visar "44 matcher kvar" istf omgångar. Det skapar en känsla av att spelet tappar kontrollen.

### 🟡 Storylines — tomt löfte
Datamodellen är komplett (15 StorylineTypes). De skapas vid varsel, heltidserbjudande, kaptenens tal. Men de REFERERAS aldrig i matchkommentarer, presskonferenser eller säsongssammanfattningar. Det är som att skriva i en dagbok som ingen läser.

### 🟡 Journalisten — fasad
Namngivna journalister med persona och memory. Vägra presskonferens finns. Men: journalistens ton påverkar inte frågorna. Memory ger inga konsekvenser. Headlines saknas i inbox. Spelaren vet inte ens att journalisten har en relationship.

### 🟡 Mecenat-systemet — 20% implementerat
Grunddata (namn, business, happiness, bidrag, happiness-bar) visas i Orten-tabben. Men: inga sociala events (jakt, middag, bastu). Inget silent shout. Inga krav. Inga konflikter mellan mecenater. Regionspecifik generering saknas. Det som gör FEATURE_ORTENS_MAKTSPEL.md briljant — maktspelet — existerar inte i koden.

### 🟡 Anläggningsprojekt — olåst
FacilityProject-typen finns på SaveGame. Pågående projekt visas i UI. Men spelaren kan aldrig STARTA nya projekt. Knappen finns inte. Projektlistan finns inte. Det är en bil utan ratt.

### 🟡 Event-konsekvenser — osynliga
Events ger val (acceptera/avvisa) men spelaren ser aldrig vad valen kostar. Ingen subtitle med "💰 -50 tkr · 🤝 +15 relation". Spelaren gissar. Det gör events till irriterande avbrott istf strategiska beslut.

### 🟡 Spelarkort — overlay-problem
Stängknapp och spelarsamtal-knappar hamnar utanför kortet. Feedback-text syns inte. Porträttet centreras dåligt. Det är den vy spelaren ser VARJE gång de klickar på en spelare.

### 🟡 Omgångssammanfattningen — tunn
Visar matchresultat + tabell + form + orten + ekonomi. Men: inga presskonferens-highlights. Inga andra matcher (konkurrenternas resultat). Inga transfernyheter. Inga events. Det borde vara den vy som gör att man tänker "fan, en omgång till" — nu är det en passiv checklist.

---

## DEL 3: FANTASIN — DRÖMVERSIONEN

Här tänker jag fritt. Vad skulle göra Bandy Manager till det spel som ingen annan gör?

### 🌟 1. ORTEN LEVER

Spelet handlar inte om 11 spelare på is. Det handlar om en förening i ett litet samhälle. Den mekaniken FINNS redan i embryo — bygdens puls, mecenater, kommun, funktionärer. Men den behöver bli LEVANDE:

**Ortens kalender.** Mellan matchdagarna händer saker. Kioskvolontären Rolf har sjunkit ihop efter en stroke — vem tar över? Kommunen diskuterar en ny rondell som blockerar parkeringen vid planen. Mecenaten bjuder på julbord. Ungdomslaget vann sin turnering och lokalpressen skriver om det. Dessa händer inte bara som events — de syns i en "Ortens liv"-feed på Orten-tabben.

**Mecenatens middag.** Du sitter mitt emot Karl-Erik Hedin i hans kök i Leksand. Han häller upp whisky och säger: "Jag hörde att Sandviken har en forward som vill bort. Jag kan tänka mig att bidra." Det är ett val: ta hans pengar (och hans inflytande) eller tacka nej och behålla friheten. Nästa säsong kanske han drar sig tillbaka. Eller kanske han börjar prata med styrelsen bakom din rygg.

**Kommunvalet.** Var fjärde säsong är det val. Din kontakt Anna (S) som älskade ungdomssatsning ersätts av Per (M) som vill se balanserad ekonomi. Relationen nollställs. Du börjar om. Men kanske Per gillar bandy — hans son spelar i ungdomslaget.

### 🌟 2. MATCHEN ÄR EN BERÄTTELSE

Just nu är matchkommentarerna bra men generiska. De vet inte att målskytten nästan förlorade jobbet förra månaden. Eller att det här derbyt har pågått i 40 år. Eller att det är -22 och 47 åskådare.

**Storyline-kommentarer.** "MÅL! Martinsson — mannen som nästan förlorade allt vid varslet på Sandvik. Nu gör han säsongens viktigaste mål!" Det här kräver att vi kopplar ihop storylines (som REDAN finns i koden) med matchStepByStep.ts. Data finns. Rendering saknas.

**Publikannonsering.** Minut 72: "Publiksiffran annonseras: 347 åskådare på Hällefors IP." Det är exakt så det låter i P4-sändningar. Datan beräknas redan — den visas bara inte.

**Halvtidsanalys.** Istf bara taktikjustering: visa momentumgraf, bollinnehav, hotfullaste spelaren. "Deras #7 har stått för 4 av 6 skott. Täck upp." Gör halvtid till ett strategiskt moment, inte en modal.

### 🌟 3. SÄSONGEN HAR EN RYTM

Oktober: Första frost. Truppen samlas. Alla är fräscha. November: Mörkret faller. Schemakonflikter med dagsjobben. December: Julturneringen. Mecenatens julbord. Ungdomslaget har intag. Januari: Transferfönstret. Köpslå. Februari: Slutstriden. Mars: Slutspel.

Det här borde KÄNNAS. Inte bara genom att dato ändras — utan genom att speletsrytm förändras. Vintern borde ha en annan känsla än hösten. Slutspelet en annan energi. Just nu passerar säsongen som en jämn ström av identiska omgångar.

**Säsongsfaser.** Fördefinierade faser (pre-season, early, mid, endgame, playoff) som påverkar: vilka events som genereras, hur journalisten frågar, vad styrelsen säger, hur ortens energi rör sig. seasonPhases.ts finns redan men används bara för funktionärscitat.

### 🌟 4. PRESSEN ÄR EN KARAKTÄR

Journalisten borde vara spelets antagonist/allierad — inte en popup med slumpade frågor.

**Rubriker i inboxen.** Efter varje match: "GEFLE DAGBLAD: Martinsson räddade poängen" eller "KRISEN FORTSÄTTER: Tredje raka förlusten — hur länge håller tränaren?" Rubriken genereras från journalistens persona × matchresultatet × relationen. En "sensationalist" med dålig relation skriver "KAOS" även efter 1-0-förlust. En "supportive" skriver "Hårfint" efter samma resultat.

**Intervjusekvenser.** Istf att trycka på en knapp i EventOverlay: en kort konversationsvy med journalisten. "Din forward har inte gjort mål på fem matcher. Vad säger du till kritikerna?" Tre svarsalternativ med tydliga konsekvenser för relation, fansupport och spelarmoral.

### 🌟 5. SPELARNAS LIV

Dubbelliv-systemet är USP:n. Det borde synas MYCKET mer.

**Spelarprofiler i PlayerCard.** Inte bara attribut och statistik — en kort bio: "Jonas Sjögren, 24. Mekaniker på Volvo i Eskilstuna. Pendlar 45 min till träning. Drömmer om att bli proffs men sambon väntar deras första barn." Det här genereras från befintliga data (dayJob, traits, storylines).

**Arbetsdagbok.** En liten sektion i PlayerCard: "Senaste 3 matchdagar: Jobbade nattskift → missed training. Var ledig → extra träning. Fick befordran → vill diskutera framtiden." Kopplar dagsjobbet till gameplay-effekter synligt.

**"Livet utanför"-events.** Sambon får jobb i Stockholm. Spelaren funderar på att flytta. Du har tre omgångar att erbjuda heltidskontrakt — eller förlora honom. Mamman är sjuk och han behöver ta ledigt två veckor. Kusinens bröllop krockar med en bortamatch. Verklighet som skapar empati.

### 🌟 6. TAKTIKDJUP MED BANDY-DNA

Bandy har unik taktik. 3-3-4, 4-3-3, 3-4-3. Hörnor som set pieces. Mittplanespel. Kontringar. Pressing. Bollinnehav på stor is.

**Hörnstrategi som spelplan.** Istf "Short/Attack/Safe" → en visuell hörnplanering: vem står var? Vem skjuter? Vem täcker? Med 5-6 förinställda varianter som kan övat på i träning.

**Motståndarscouting som taktikmoment.** "Vi har sett tre matcher. Deras #8 driver alltid in från vänster. Deras MV har svårt med höga skott." → Spelaren kan justera taktiken: "Pressa deras #8" / "Skjut högt". Opponentanalysis-data finns redan.

### 🌟 7. LEGACY OCH MINNE

**Hall of Fame.** HistoryScreen finns men saknar känsla. Det borde vara spelets monument: varje säsong ett kapitel. "2027: Martinssons comeback. Relegationsstriden. Karl-Erik Hedins kontrovers. 6:a — bättre än någon trodde." Narrativen genereras från storylines + seasonSummary.

**Pensionsceremonier.** ClubLegend skapas vid pensionering men det borde vara ett MOMENT: "384 matcher. 127 mål. Publiken reser sig. En legend tackar för sig." En special-overlay med career stats, nyckelögonblick, citat.

**"Jag var där"-screenshots.** Säsongssammanfattningen kan exporteras som en delbar bild (seasonShareImage.ts finns redan). "Skutskär 2027: 3:a i serien, cupvinnare, Martinsson 23 mål."

---

## DEL 4: PRIORITERING — OM JAG FICK VÄLJA TRE SAKER

Om jag bara fick bygga tre saker som gör störst skillnad:

### 1. Storylines → matchkommentarer + press + säsongssammanfattning
**Varför:** Data finns redan. Rendering saknas. Ger mest narrativ payoff per rad kod. Gör att spelet MINNS — och det är det som skapar empati.

### 2. Mecenat-events (jakt, middag, krav) + silent shout
**Varför:** Ortens maktspel-specen är briljant men existerar inte i gameplay. Det gör "Orten"-tabben från en informationsvy till ett SPEL. Mecenaten som bjuder på älgjakt och sedan kräver att du köper hans kompis forward — DET är Bandy Manager.

### 3. Omgångssammanfattning som narrativ höjdpunkt
**Varför:** Det är den vy spelaren ser efter varje omgång. Just nu passiv. Med andra matchers resultat, pressklipp, events, transferrykten och akademi-nyheter blir det den vy som gör att man tänker "en omgång till". FM:s inbox-känsla fast med bandyns själ.

---

*Jacob — allt ovan är tänkbart med den kodbas ni redan har. SaveGame-modellen har plats för allt. Services finns för det mesta. Det som saknas är rendering, kopplingar och innehåll.*
