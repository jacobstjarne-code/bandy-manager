# Grind 1 v3 — utredning + koefficientdom, 2026-08-23

Svar på Jacobs Grind 1-dom: två utredningskrav FÖRE koefficientrundan, sedan tak-domen + omkörning med full fördelning.

## 1. Vad `consecutiveLosses` faktiskt mäter — verifierat i kod, inte gissat

Läst `trainerArcService.ts` rad för rad:

- **Exkluderar cup.** `!f.isCup`-filter (rad 35, 41) på både "senaste matchen"-uppslaget och det (ej längre använda) 8-matchers-fönstret. Cup-matcher rör aldrig sviten.
- **Inkluderar slutspel.** Slutspelsmatcher har `isCup` false/undefined och `roundNumber` 23+ (kontinuerligt efter ligans 22, `playoffTransition.ts:36`) — de passerar samma `!f.isCup`-filter och räknas in i sviten. Ingen särbehandling.
- **Nollställs vid oavgjort.** Rad 55-58: `else { consecutiveWins = 0; consecutiveLosses = 0 }` — ett oavgjort river båda räknarna, inte bara den ena.
- **Nollställs vid säsongsslut.** `checkSeasonEndArc` (rad 166) sätter `consecutiveLosses = 0`, och anropas garanterat vid varje säsongsövergång (`seasonEndProcessor.ts:1440`, del av samma objekt-konstruktion som resten av säsongsslutet).
- **Spänner ALDRIG över säsongsgränsen.** `game.fixtures` byts ut helt vid säsongsslut (`seasonEndProcessor.ts:1324`, nya id:n `fixture_${nextSeason}_r...`), så "senaste matchen"-jämförelsen (`last.id !== lastCountedFixtureId`) kan aldrig råka plocka upp en match från förra säsongen.

**Den egentliga upplösningen av paradoxen ("16-matchers svit + 4:e plats"):** `managerFired` sätts på EXAKT två ställen i kodbasen (grep bekräftat), med olika tidsupplösning:
- `seasonEndProcessor.ts:971/982` — boardPatience≤15, consecutiveFailures≥3, licenseDenial. Utvärderas **en gång per säsong, vid säsongsslut**, med det säsongsslutliga `boardPatience`-värdet (som redan innehåller hela säsongens ackumulerade löpande deltan).
- `postRoundFlagsProcessor.ts:38` — konkurs (`finances < -2 000 000`). Utvärderas **varje omgång, hela säsongen**.

I den här körningen klassificerades **0 avsked som bankruptcy** (se avskedsorsak-fördelningen nedan) — samtliga var `boardPatience<=15`, vilket betyder att **varje sparkad körning spelade en HELT säsong**, aldrig avbröts mitt i. En lång svit och en hög sluttabellplats kan alltså samexistera helt legitimt: en klubb kan bygga en poängbuffert tidigt, sedan kollapsa i en lång svit sent, och ändå landa nära buffertens position vid säsongens slut om sviten inte räcker till för att helt äta upp den. Det är inget läckande system — det är en dubbel round-robin över 22 omgångar som absorberar en enskild dålig sträcka olika mycket beroende på var i säsongen den ligger och hur stor buffert som fanns innan.

## 2. Positionsvarians — en verklig mätbugg hittades och fixades

Den ursprungliga "Skutskär alltid 9:a, Heros alltid 4:a"-observationen (v2-scriptet) var **inte** ett fynd om matchmotorns varians. Det var en mätbugg i stresstest-selen:

`game.standings` skrivs över av `seasonEndProcessor.ts` med `calculateStandings(updatedClubs.map(c => c.id), [])` som en del av NÄSTA säsongs (ospelade, tomma) tabell. När alla lag har 0 poäng sorterar det underliggande tabellbygget dem **alfabetiskt**. v1- och v2-scripten läste `standing.position` EFTER att säsongsloopen brutit — alltså efter denna överskrivning — och fick därför varje klubbs alfabetiska rang, inte dess verkliga slutplacering. Forsbacka, Gagnef, Hälleforsnäs, **Heros** (4:a), Karlsborg, Lesjöfors, Målilla, Rögle, **Skutskär** (9:a), Slottsbron, Söderfors, Västanfors — matchar exakt de "alltid samma plats"-siffrorna som väckte misstanken.

**Fix:** läs `SeasonSummary.finalPosition` istället — satt i `seasonEndProcessor.ts:1391` från standings-arrayet som skickades IN till funktionen (`game.standings`, dvs. det verkliga slutresultatet), innan överskrivningen sker. Nytt script: `scripts/grind1-boardpatience-sim-v3.ts`.

**Med fixet: verklig varians, som förväntat.** Se fördelningarna nedan — matchmotorn är inte deterministisk för dessa klubbar, mätningen var det.

## 3. Koefficientdomen — tak på fem omgångar per svit

Implementerad i `boardService.ts`s `losingStreakSurcharge()`: tillägget (-3 vid svit≥3, -8 vid svit≥5) betalas ut precis som förut för omgång 3, 4 och 5 av en enskild svit, sedan **0 för varje ytterligare omgång samma svit fortsätter** (`consecutiveLosses > 5 → 0`). Ingen engångskostnad (eskaleringen -3→-8 finns kvar), inga sänkta magnituder. Ingen extra state behövs — `consecutiveLosses` nollställs redan vid ny svit, så gränsen på indata-värdet räcker.

Stash-testat: reverterad kod gav 60.5 för en 16-omgångarssvit (förväntat 68.5 med taket) — bekräftat fel utan fixet, korrekt med. 42/42 tester gröna.

## 4. Omkörning med taket — full fördelning, inte medelvärde

100 seedade körningar × 3 säsonger, `scripts/grind1-boardpatience-sim-v3.ts` (korrekt positionsläsning + taket).

### club_skutskar (rykte 52, AvoidBottom, ankare 9)

```
Sparkad inom 3 säsonger: 50/100 (var 57/100 utan taket — mätt med samma, tidigare felaktiga positionsläsning, så själva avskedsfrekvensen är jämförbar rakt av)
Positionsfördelning, ALLA sampel (1-12): 1:0 2:1 3:10 4:21 5:27 6:28 7:27 8:45 9:41 10:33 11:26 12:16
Positionsfördelning, sparkade säsonger:   1:0 2:0 3:0 4:0 5:0 6:1 7:2 8:9 9:6 10:11 11:11 12:10
Positionsfördelning, ej sparkade:         1:0 2:1 3:10 4:21 5:27 6:27 7:25 8:36 9:35 10:22 11:15 12:6
Snitt W/D/L, sparkade säsonger: W=5.8 D=3.1 L=14.0
Snitt W/D/L, ej sparkade:       W=9.0 D=3.9 L=12.0
Max förlustsvit/säsong: min=1 max=12 median=4
```

Verklig variation, tyngdpunkt nära ankaret (9), sparkade säsonger tydligt sämre (fler 10-12:or) än överlevda — mekaniken diskriminerar meningsfullt. 50 % inom tre säsonger är fortfarande högre än "icke-noll men rimlig", men ett rimligt läge att fortsätta finjustera från — inte längre ett mättekniskt haveri.

### club_heros (rykte 45, AvoidBottom — SAMMA förväntan som Skutskär, inte ChallengeTop)

```
Sparkad inom 3 säsonger: 100/100 (oförändrat)
Positionsfördelning, ALLA sampel (1-12): 1:0 2:0 3:0 4:1 5:1 6:2 7:2 8:6 9:27 10:23 11:40 12:87
Positionsfördelning, sparkade säsonger:   1:0 2:0 3:0 4:0 5:0 6:0 7:0 8:2 9:5 10:7 11:21 12:65
Positionsfördelning, ej sparkade:         1:0 2:0 3:0 4:1 5:1 6:2 7:2 8:4 9:22 10:16 11:19 12:22
Snitt W/D/L, sparkade säsonger: W=3.2 D=2.6 L=16.2
Snitt W/D/L, ej sparkade:       W=5.1 D=3.5 L=13.8
Max förlustsvit/säsong: min=2 max=19 median=7
```

**Nytt fynd, inte samma fråga som taket:** Heros vinner i snitt 3-5 matcher av 22 (14-23 % vinstandel) och landar på plats 12 i 46 % av alla säsongssampel (87/189) — även UTAN avsked är medianplaceringen botten av tabellen. Det är redan **inom** AvoidBottom-ankaret (9) i strikt mening att landa på 10-12, så säsongsslutstermen straffar rimligt (gap −1 till −3, delta −4 till −12) — men den löpande bas-termen (14-16 förluster × −1.5 ≈ −21 till −24/säsong) plus förlustsvitens tillägg (fortfarande upp till −14/svit, taket träffar nästan varje säsong eftersom mediansviten är 7) summerar till ett underskott ingen enskild säsong hinner återhämta från innan nästa. Taket löste INTE Heros — det var aldrig primärt ett svit-längd-problem för den här klubben, det är en klubb som strukturellt vinner för få matcher för att någon boardPatience-formel realistiskt ska hålla den kvar tre säsonger.

**Flaggat, bygger inget — men delvis besvarat:** `docs/findings/facts/world_data/W012` säger uttryckligen "Heros är fiktiv dalaklubb och svagast i ligan" — klubbens svaghet är alltså kanonisk, inte en oavsiktlig kalibreringsmiss i trupp/matchmotor. Kvarstående fråga för Jacob: är "ligans svagaste klubb är i praktiken osparkbar längre än en säsong" en accepterad designkonsekvens av att vara "svagast i ligan" (hårt läge, medvetet), eller ska den svagaste klubben ändå ha en rimlig chans att överleva tre säsonger under en kompetent spelare? Det avgör om något alls ska göras här, och i så fall vad (lägre boardExpectation för just Heros, en längre patience-runway för klubbar under en rykte-tröskel, eller inget — det är tänkt att vara svårt). Utanför boardService.ts:s koefficient-scope oavsett svar.

## 5. BACKLOG — "Två läsare, en sanning"

Tillagd: tre oberoende vägar till avsked (boardPatience, consecutiveFailures, konkurs) med olika tidsupplösning (säsongsslut vs. varje omgång), ingen yta i spelet förklarar för spelaren VILKEN väg som utlöstes eller varför.
