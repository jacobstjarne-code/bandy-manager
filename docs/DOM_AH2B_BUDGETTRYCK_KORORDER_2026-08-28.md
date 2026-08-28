# DOM + KÖRORDER — A-H2b BUDGETTRYCK (ersätter marginalmåttet)

**Datum:** 2026-08-28 · **Av:** Opus
**Ersätter:** de tre kalibreringspassen `anspark1-condition2-boardexpectation-`, `anspark1-condition2-absolut-` och `anspark1-villkor-omdesign-matning-2026-08-28.ts`. Alla tre pensioneras. Ingen av dem mätte rätt sak.
**Grund:** `DOM_FRAMGANGSKURVAN_2026-08-27.md`, anspåk 1 ("Truppen vill ha det den är värd — du kan inte betala alla").

---

## Domen först, så att mätningen inte glider igen

Tre pass har jagat en **sällsynt individhändelse** — "finns det en spelare exceptionell nog att kräva mer" — och tunat mot ett fire-rate på ~50 % för dominant klubb. Det är fel mål, och det strider mot framgångskurvans dom.

Domen beskriver inte en sällsynt spelare. Den beskriver en **mängd**: flera spelare som var för sig är betalbara, men tillsammans inte ryms i lönebudgeten samma sommar. Anspråket är inte "en man är gisslan". Anspråket är "väljer du toppskytten kan du inte hålla halvbacken". Pluraliteten ÄR mekaniken.

Marginalmåttet (gap mot egen tvåa) är dessutom antikorrelerat med dominans by construction, inte av en seed-slump: en dominant klubb är femstjärnorsklubben, och den har per definition ingen ensam som sticker ut. Mätning 3 bekräftade det (dominant median-gap 0, 68 % exakt 0; mittenlag median 0,022). Släpp marginalen. Den kommer aldrig peka rätt håll.

**Villkor 1 upphör att vara en grind.** Det finns inget tröskeltal på en enskild spelare. Bidraget kommer ur `computeContractMinSalary`-formeln som redan finns: en spelare som överpresterat får `performanceFactor > 1` och kräver mer vid förlängning. Ingen ny tröskel.

**Anspråket kommer ur summan, inte ur triggern.** Mät hur många av truppens egna förstalagsspelare som kräver en höjning samma sommar, och om de ryms i lönebudgeten samtidigt.

---

## Steg 0 — obligatoriskt, annars mäter vi taket igen

Dominant-simuleringen i alla tre tidigare script (+30 CA på HELA truppen, klampat 99) är förgiftad för varje individmått nedströms. En likformig boost trycker halva truppen mot `performanceFactor`-taket 1.40 samtidigt (`PERFORMANCE_FACTOR_MAX`, economyService.ts). Det gör inte bara marginalmåttet meningslöst — det snedvrider `computeContractMinSalary` för samma spelare, eftersom prestationsfaktorn mättas för alla på en gång. En budgettrycksmätning på den truppen mäter klampningen, inte lönekraven.

**Byt dominant-konstruktionen.** Två alternativ, Code väljer det som ger en icke-mättad prestationsfördelning och rapporterar vilket:

1. En verkligt stark BEFINTLIG klubb i världen (ingen konstgjord boost) — kör en seed-scan, plocka den klubb vars trupp naturligt dominerar ligan över 10 säsonger utan att röra CA. Renast, men kräver att en sådan klubb finns i seedrymden.
2. En boost som INTE klampar: höj truppens CA så att laget vinner ligan, men verifiera i en förkörning att inte fler än ~2–3 spelare når `performanceFactor`-taket en normal säsong. Om +30 klampar halva truppen, prova +10/+15 och rapportera fördelningen.

Rapportera prestationsfaktor-fördelningen för den valda dominant-truppen (hur många spelare per säsong i taket 1.40) som första utskrift, så att vi ser att den inte är mättad innan något annat läses.

---

## Metriken — budgettryck per säsong

Vid varje säsongsslut (`preRollover`-läget, samma som föregångarscripten läser truppen i), för den styrda klubben:

**Förstalagsspelare** = `game.players` filtrerade på `clubId === managedClubId` OCH `seasonStats.gamesPlayed >= MIN_LEAGUE_GAMES_FOR_PERFORMANCE_FACTOR` (5). Samma grind som formeln.

För varje sådan spelare:
- `minSalaryNew = computeContractMinSalary(player, club, leagueAverages)` (economyService.ts:321, oförändrad).
- `demand = max(0, minSalaryNew - player.salary)`. En spelare vars formelenliga minimilönekrav överstiger nuvarande `salary` kräver mellanskillnaden.

Per säsong, rapportera:
- **Antal kravställare** = antal förstalagsspelare med `demand > 0`. (Rapportera FÖRST rå fördelning av `demand`-belopp innan någon tröskel sätts — samma distribution-först-disciplin som mätning 3. Om en golvtröskel behövs för att sålla bort triviala 500-kr-krav, föreslå den mot den faktiska fördelningen, gissa inte.)
- **Total kravsumma** = `Σ demand` över kravställarna.
- **Lönebudgetutrymme** — se steg 1 för hur det definieras.
- **Lastkvot** = `total kravsumma / max(utrymme, ε)`. Kvot > 1 = klubben kan inte möta alla krav samma sommar. Det är händelsen.

---

## Steg 1 — rapportera lönebudgetens semantik innan kvoten tolkas

`Club.wageBudget` finns (Club.ts:74). Innan lastkvoten betyder något måste Code rapportera, med kodreferens:

1. Är `wageBudget` ett säsongsbelopp eller ett veckobelopp? `Player.salary` returneras av formeln som `CA*200*0.80 * repFactor * performanceFactor` avrundat till 500 — vilken skala är det (år/vecka), och matchar den `wageBudget`?
2. Är `wageBudget` ett hårt tak som förlängningar faktiskt prövas mot någonstans i koden, eller ett rådgivande tal som inget upprätthåller? Sök i `transferActions.ts` (renewContract), `transferService.ts`, `economyService.ts`.
3. Vad ska "utrymme" vara: `wageBudget − Σ nuvarande salary för truppen`, eller mot `Club.finances`? Föreslå det som svarar mot domens "du kan inte betala alla" och motivera.

Om `wageBudget` visar sig vara oanvänt/oupprätthållet i dag: rapportera det rakt. Då är budgettrycket en mekanik som ska BYGGAS ovanpå ett tak som först måste börja betyda något, och det är en större dom — flagga, bygg inte vidare på en fantomresurs.

---

## Villkor 2 — mät om det ens behövs

Den gamla klubbframgångsgrinden (topp-3/titel, `finalPosition <= 3 || playoffResult==='champion' || cupResult==='winner'`) står kvar som mätdimension, men frågan är nu om den är **redundant**.

Hypotes: kravlasten koncentreras redan till framgångsrika säsonger av sig själv, eftersom ett lag som vinner ligan är ett lag där många spelare överpresterat (det är så man vinner) — alltså många `demand > 0` samma år. Om så är fallet gör topp-3/titel-grinden inget arbete och ska strykas.

Mät lastkvot-fördelningen **både** ogated och gated på topp-3/titel. Om gaten inte flyttar fördelningen nämnvärt: rapportera det och rekommendera att villkor 2 stryks helt. En villkorsstruktur där ett villkor gör allt arbete ljuger om sin egen logik.

Föregående säsong läses aldrig (bekräftat i mätning 3: `seasonSummaries[length-1]` räcker). A-M8-kanten är en icke-fråga. Behåll det.

---

## Vad som ska rapporteras (håll det tätt, siffror inte prosa)

1. Prestationsfaktor-fördelning för vald dominant-trupp (antal i taket 1.40/säsong) — beviset att steg 0 gav en omättad trupp.
2. Lönebudgetsemantiken: säsong/vecka, hård/rådgivande, vald utrymmesdefinition, med kodrader.
3. Fördelning per klubbtyp (dominant vs mid-table, huvudkörning + samma robusthetspool som förut): antal kravställare/säsong, total kravsumma, utrymme, lastkvot. Percentiler eller histogram.
4. Andel säsonger med **lastkvot > 1** (kan inte betala alla) per klubbtyp, och andel med **≥2 kravställare** per klubbtyp. Det är de två talen domen bryr sig om.
5. Kommer ordningen ut rätt UTAN någon tuning — dominant oftare över budget än mid-table? Ja/nej med talen.
6. Ändrar topp-3/titel-gaten fördelningen? Om nej: rekommendera att villkor 2 stryks.

**Mål (inte ett fire-rate):** dominant klubb ska ha lastkvot > 1 en meningsfull andel säsonger och ofta ≥2 samtidiga kravställare. Mid-table ska sällan ha mer än en kravställare, och den ska rymmas (kvot ≤ 1). Ordningen mellan klubbtyperna är det som avgör om mekaniken bär — inte att någon siffra landar på exakt 50 %.

Filkonvention: `scripts/anspark1-budgettryck-matning-2026-08-28.ts`. MEASUREMENT-ONLY, ingen produktionskod, ingen commit.

---

## Handoff

**Code:** kör steg 0 → 1 → metriken, rapportera enligt ovan. Parallellt med A-H9:s två rapportfrågor (annan fil, inga beroenden).
**Opus:** håller A-H2b-texten tills mätningen visar att mekaniken bär och lönebudgeten är en verklig resurs. Ingen copy skrivs mot en fantombudget.
**Jacob:** inget beslut krävs förrän mätningen är inne — om inte steg 1 visar att `wageBudget` är oupprätthållet, då är det en domfråga (bygga taket först) som kommer tillbaka till dig.

---

## STEG 1-DOM (2026-08-28): wageBudget är rådgivande — mät mot ekonomi, bygg inget hårt tak

**Fyndet, grundat i kod:**
- `renewContract` (transferActions.ts): `computeContractMinSalary` är ett HÅRT golv (förlängning nekas under det). `wageBudget` prövas INTE — förlängningen genomförs oavsett och returnerar bara ett mjukt `wageWarning = projectedWageBill − wageBudget` till UI:t.
- `createOutgoingBid` (transferService.ts): prövar `transferBudget` (hårt) och `minSalary` (hårt), `wageBudget` inte alls.
- `executeTransfer`: prövar `finances` (>−100k) och `transferBudget`, inte `wageBudget`.

→ wageBudget är en visningssiffra med en mjuk varning. Aldrig ett bindande tak.

**Domen:**

1. **Bygg INGET hårt lönetak.** Att göra wageBudget bindande skulle tyst balansera om hela ekonomin — den befintliga "svaga klubbar kan överspendera och blöda"-dynamiken (O5/Skutskär) förutsätter att man KAN gå över. Rör den inte.

2. **Anchor budgettrycket till EKONOMI, inte wageBudget.** Det är dessutom mer troget domen: framgångskurvan säger "anspråk som konkurrerar om SAMMA resurs — ett ja är ett nej någon annanstans." Den resursen är kassan, inte en separat lönepott. Att möta alla lönekrav ska betyda att pengarna inte räcker till anläggning (anspråk 3) eller värvning — precis den konkurrensen.

3. **Metriken byts:** total kravsumma (Σ raise-delta, årsbelopp) jämförs mot klubbens FINANSIELLA utrymme, inte wageBudget. Utrymmet: klubbens säsongsöverskott (`cashGrowth = endFinances − seasonStartFinances` som proxy för vad klubben normalt går plus) — Code väljer och rapporterar den exakta affordability-signalen, men den ska vara ekonomisk. Lastkvot > 1 = att möta alla krav skulle äta hela överskottet, dvs tvinga ett nej någon annanstans.

4. **Bygget kräver ett MOMENT:** lönekraven ska landa TILLSAMMANS vid säsongsslut som ETT beslut (välj vilka du möter), inte dribblas genom individuella `renewContract`-klick. `computeContractMinSalary` är passiv idag (SLUTTEST: "noll rader kod" för själva kravmekaniken) — det är mekaniken som saknas, inte en kalibrering av en befintlig.

**Jacobs confirm (en rad, blockerar INTE mätningen):** OK att INTE införa ett hårt lönetak — budgettrycket blir en ekonomisk avvägning (möta kraven kostar dig annat), inte en fast pott. Vill du hellre ha en fast pott (hårt tak) säger du till, men då balanserar vi om O5/Skutskär-dynamiken.

**Code:** mät mot ekonomiskt utrymme enligt punkt 3, fortsätt steg 0 (fixa dominant-sim) → metrik. Mekaniken (punkt 4) byggs efter mätningen och Jacobs confirm.
