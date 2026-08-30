# DOM — ANSPÅK 4: communityStanding dyrare att hålla när klubben växt

**Datum:** 2026-08-29 · **Av:** Opus · **Under:** A-H2 / framgångskurvan (DOM_FRAMGANGSKURVAN_2026-08-27.md). Det sista obyggda av de fyra anspåken, och det som knyter framgångskurvan till ortsystemet.

## Grundning (kodläst, `communityProcessor.ts` + `communityStandingScaling.ts`)

CS ändras per omgång via `csBoost` (summeras i `processCommunity`, appliceras + drift mot 60 i roundProcessor):
- **Matchresultat:** storseger +5, seger +2, storförlust −6, förlust −4; derby ±2. Klack-mood separat.
- **Community-aktiviteter (managerns spak):** kiosk +0,08, lotteri +0,05, bandyplay +0,08, funktionärer +0,05, bandyskola +0,08, sociala medier +0,03, pensionärskaffe +0,10, soppkväll +0,08, skolbesök +0,12. Var och en kostar löpande pengar (economyService community-block) och skolbesök/bandyskola kostar uppmärksamhet.
- **Volontärer:** rosterbaserat, tak +1,5/omg.
- **Placering:** topp-3 +0,2, ≥10 −0,15.
- **Dämpning:** positiva boostar × `getCsDiminishingFactor(cs)` (cs55→1,0, cs100→0,25, D031); negativa (förlust/skandal) orörda.

Aktiviteterna + volontärerna är alltså det managern BETALAR för att hålla CS uppe mot driften och mot resultatsvängningarna. Det är där anspåk 4 sitter.

## Domen

**När klubben vuxit har orten stigit i sina förväntningar: samma insats håller mindre.** En liten klubbs skolbesök är en händelse; en stor klubbs skolbesök är väntat. Alltså ska de positiva CS-boostarna från aktiviteter och volontärer **skalas ned med klubbens storlek** — en stor klubb måste driva FLER aktiviteter / hålla FLER volontärer för att hålla samma CS. Det är den konkurrerande fordran: de extra kronorna och den extra uppmärksamheten är pengar som inte går till lön (anspåk 1), retention (A-H2b) eller investering (anspåk 3). Låter du CS glida i stället tappar du publikintäkt (väg B gjorde CS till attendance-vikt 0,45) OCH utlöser mecenatens/patronens/sponsorns uttåg (den textade trion). Ett namngivbart avstående per säsong.

**Detta är mekaniken som konsumerar dominantöverskottet** (~+175 tkr/säsong) som solvensfixen lämnade. En stor klubb som vill hålla orten nöjd betalar tillbaka överskottet i ökat ortsunderhåll; en som hellre behåller pengarna ser läktaren tunna ut. Loopen från baskonomin sluts här.

### Mekanik (D031-tvingande)

Skala den positiva aktivitets- + volontär-`csBoost`-summan med en kontinuerlig faktor `csUpkeepFactor(reputation)` byggd på `csLinearRamp` — låg rep (liten klubb) → 1,0 (full effekt), hög rep (stor klubb) → reducerad (~0,4–0,5, kalibreras). **Aldrig en binär era-tröskel** (D031: fem system slog redan om på cs=70 av misstag; samma anda gäller era). Reputation är den kontinuerliga storleksaxeln och rätt bärare; `calculateClubEra` är diskret och får inte gata detta.

Bara POSITIVA boostar skalas (samma mönster som `getCsDiminishingFactor` redan följer) — negativ csBoost (förlust, skandal) är orörd, det ska vara lika lätt att falla oavsett storlek.

**Andra knappen, om mätningen kräver den:** en klubb som coastar på segrar får oskalad +2/+5 csBoost och kan undslippa fordran. Om mätningen visar att en vinnande stor klubb aldrig känner kostnaden — lägg till en liten reputation-skalad baslinjedrag (`−expectationDrag(reputation)` via csLinearRamp, rep-golv 0 → rep-tak −X/omg) som biter oavsett resultat. Bygg knapp 1 först, mät, lägg till knapp 2 bara om coasting-hålet är verkligt.

## SKYDDAT — rör inte

- **Holdbarheten.** Faktorgolvet (~0,4–0,5) måste lämna det MÖJLIGT att hålla CS med mer insats — bara dyrare, aldrig omöjligt. En faktor nära noll är samma fel som en hård tröskel gömd bakom en kurva (den klass D031 finns för att stoppa).
- **Interaktionen med `getCsDiminishingFactor`.** Den dämpar redan positiva boostar vid hög CS. En stor klubb vid hög CS träffas av BÅDA (rep-faktor × cs-faktor). Mätningen måste bekräfta att hålla CS fortfarande är uppnåeligt för en stor klubb med rimlig spend — de får inte multipliceras ihop till omöjlighet.
- **Survive-golvet (H4).** En liten/överlevnadsklubb (låg rep) står på faktor 1,0 — opåverkad. Orten är Survive-klubbens spak (Jacobs H4-domar); gör den inte dyrare för dem.
- **Ingen dubbelräkning.** Mecenat/patron/sponsor-uttågen är KONSEKVENSEN av låg CS (redan byggda + textade). Anspåk 4 är TRYCKET som pressar CS nedåt. De får inte räknas två gånger — anspåk 4 sänker inte CS direkt, det gör managerns insats mindre effektiv, och uttågen fyrar som förut när CS faktiskt faller under sina trösklar.

## STEG 0 — före mätning
Samma förgiftade-sim-varning som baskonomin och A3: mät mot en realistisk stor klubb (faktisk hög-rep-klubb ur en genomspelning), inte en syntetisk +CA/+rep-blankett.

## GODKÄNT NÄR (mät över hela säsonger, `npm run stress` före/efter)
1. **En växande/dominant klubb gör ett synligt säsongsval:** finansiera ökat ortsunderhåll eller låta CS glida. Bägge sidor svider (audit HIGH 12:s "val där båda sidor svider").
2. **Att låta CS glida ger en namngivbar konsekvens** inom en säsong eller två: tappad publikintäkt (väg B) + ett mecenat/patron/sponsor-uttåg. Inte en tyst siffra.
3. **Konsumerar överskottet:** en dominant klubb som HÅLLER CS ser sitt nettoöverskott krympa (de extra aktiviteterna kostar) — mät att ~+175 tkr/säsong-överskottet faktiskt äts när orten hålls nöjd.
4. **Liten klubb opåverkad** (faktor 1,0 vid låg rep); Survive-golvet intakt.
5. **Ingen dubbelräkning** mot uttågen; holdbarheten intakt (stor klubb kan hålla CS med mer spend, aldrig omöjligt).

Magnitud (csLinearRamp-ändpunkter, om knapp 2 behövs) = utfallet av 1–5. **D-fact krävs** innan commit.

## Ägarskap
Opus: denna dom. Code: grunda de exakta aktivitets-löpandekostnaderna (economyService community-block) + driftens form i roundProcessor → bygg `csUpkeepFactor(reputation)` (csLinearRamp) på den positiva aktivitets/volontär-boosten → mät 1–5 → D-fact → commit. Timing: basen är nu satt (solvensfixen), så anspåk 4 kalibreras mot en fast bas och konsumerar dess överskott — rätt läge, inte tidigare.

Med anspåk 4 byggt är framgångskurvans fyra anspåk kompletta och bågens godkänt-kriterium (ett namngivbart avstående per säsong för en dominant klubb) mätbart i sin helhet.

---

# TILLÄGG 2026-08-30 — Codes grundning, mätning och byggda svar

**Av:** Code · **Mätscript:** `scripts/ansprak4-ortsunderhall-matning-2026-08-30.ts` · **D-fact:** D037 · **Status:** byggt i arbetsträdet, ej committat — väntar granskning. **Anspråk 4 stängs inte av detta tillägget; det är Jacobs beslut.**

## 0 · Grundningen — två av domens premisser höll inte mot koden

Domen bad Code grunda "de exakta aktivitets-löpandekostnaderna (economyService community-block) + driftens form i roundProcessor". Grundningen gav två fynd som styrde allt som följde.

**A. Att hålla orten kostar inte pengar — det tjänar pengar.** Domen skriver "Var och en kostar löpande pengar (economyService community-block)". Kodläst stämmer det inte:

| aktivitet | csBoost/omg | löpande ekonomi |
|---|---|---|
| pensionärskaffe | +0,10 | **ingen** (engång 0 kr) |
| soppkväll | +0,08 | **ingen** (engång 1 000 kr) |
| skolbesök | +0,12 | **ingen** (engång 0 kr) |
| kiosk (basic/upgraded) | +0,08 | netto **positiv** vid normal publik (sqrt-intäkt −1 500/2 500 per hemmamatch) |
| lotteri (basic/intensive) | +0,05 | netto **+375 / +1 400** per omgång |
| funktionärer | +0,05 | **+1 000** per hemmamatch, ingen driftskostnad |
| bandyskola (bandySchool) | +0,08 | **+1 000** per omgång |
| bandyplay | +0,08 | ca **−500**/omg, +250-500 per hemmamatch |
| sociala medier | +0,03 | **−500**/omg (+ 1 rykte var femte matchday) |
| frivilliga (max 4) | +1,3 typiskt (tak 1,5) | **gratis att rekrytera**, ger 340-800 kr/omg var |

Uppmätt i baslinjen: en dominant klubb som körde HELA ortsprogrammet tjänade **+326 tkr/säsong MER** än en som körde ingenting. Det finns alltså ingen "fund"-sida som svider, och inget att köpa MER av — de nio aktiviteterna och de fyra frivilliga är hela spaken, och den är gratis när den väl är påslagen. Detta är avgörande för GODKÄNT NÄR 1 och 3, se avsnitt 3.

**B. Driften i roundProcessor är en stark självstabilisering.** `DRIFT_TARGET = 60`, `DRIFT_STRENGTH = 0,03` (roundProcessor.ts:1241-1245), tillämpad varje omgång FÖRE övriga ändringar, plus `getCsDiminishingFactor` som dämpar positiva boostar hårdare ju högre CS är. Nettoeffekten: CS är ett fält som aktivt drar sig tillbaka mot 60 och gör återhämtning svagare ju högre man ligger. En konstant nedåtpress absorberas alltså delvis — och en hög-CS-klubb faller SNABBARE än en låg-CS-klubb under samma press. Det är rotorsaken till hela avsnitt 2.

## 1 · Baslinjen — coasting-hålet är dominantfallet, inte ett hörnfall

STEG 0 respekterad: DOMINANT = `club_vastanfors` +10 CA, huvudseed 100 + pool 101-105 (konstruktionen återanvänd rakt av ur `ah2-basekonomi-intakt-matning-2026-08-28.ts`), KONTROLL = `club_malilla` seed 2 + pool 3-5, HEROS = `club_heros` seed 91000. Två tvingade ortspolicyer per klubb: **HÅLLER** (alla nio aktiviteter + hela volontärrostern) och **GLIDER** (ingenting).

| | CS-snitt | CS-slut | omg <60 | omg ≥85 | publiktak | netto/säsong |
|---|---|---|---|---|---|---|
| DOMINANT HÅLLER | 87,0 | 93,1 | 4 % | **69 %** | 63 % | 827 778 kr |
| DOMINANT GLIDER | **77,1** | 83,4 | 14 % | 34 % | 49 % | 501 815 kr |
| KONTROLL HÅLLER | 67,0 | 69,4 | 29 % | 3 % | 5 % | 429 920 kr |
| KONTROLL GLIDER | 44,9 | 42,4 | 84 % | 1 % | 3 % | 130 045 kr |
| HEROS HÅLLER | 48,5 | 55,4 | 82 % | 0 % | 0 % | 74 321 kr |
| HEROS GLIDER | 12,3 | 12,8 | 100 % | 0 % | 0 % | −153 042 kr |

**En dominant klubb utan en enda aktivitet och utan en enda frivillig låg ändå på CS-snitt 77,1.** Hela ortsspaken var värd 9,9 CS för den klubben — mot 22,1 för mittenklubben och 36,2 för Heros. Domens knapp-2-villkor ("bygg knapp 2 bara om coasting-hålet är verkligt") är alltså inte ett hörnfall att kontrollera; det ÄR dominantfallet. Knapp 1 kan per konstruktion aldrig röra de 77 poängen — de kommer från segrar, som inte skalas.

Sidofynd i baslinjen: **publiktaket maskerar CS vid toppen.** `computeAttendanceRate` cappar på 0,95 och en dominant klubb som höll orten låg i taket 63 % av omgångarna — väg B:s CS-vikt 0,45 var i praktiken mättad och kunde inte belöna mer CS.

## 2 · Iterationerna — i den ordning de kördes

**Iteration 0 (baslinje):** tabellen ovan. Ingenting ändrat.

**Iteration 1 — domens föreslagna magnitud, rykte 60→95, faktor 1,0→0,45, drag 0,9.** Två fel samtidigt: (a) valet KRYMPTE (ΔCS-snitt 10,2 → 4,2) i stället för att bli synligt, (b) rykte-golvet 60 träffade mittenklubben hårt (CS-snitt 67,4 → 55,8). Förkastad.

**Iteration 2 — rykte 80→100, faktor 0,70, drag 1,6.** Golvet rätt: KONTROLL i GLIDER-policyn blev bit-för-bit identisk med baslinjen, Heros likaså säsong 1-4. Men valet krympte fortfarande (ΔCS 4,5). Det tvingade fram ett systematiskt svep i stället för fler gissningar.

**Svepet — 4 faktorer × 4 dragvärden, 16 hela körningar.** Det avgörande resultatet:

> GLIDER-klubbens CS-snitt vid drag 0, faktor 1,00 / 0,85 / 0,70 / 0,55: **77,1 · 77,1 · 77,1 · 77,1 — identiskt.**

**Knapp 1 träffar per konstruktion BARA klubben som redan gör rätt.** En klubb utan aktiviteter har ingen boost att skala. Ett hårt faktorgolv beskattar alltså enbart insatsen, rör inte coastaren alls, och krymper samtidigt skillnaden mellan att hålla och att glida — rakt emot domens GODKÄNT NÄR 1. Därför landade faktorn på **0,85**, inte domens föreslagna 0,4-0,5. Domen sa uttryckligen "kalibreras"; detta är kalibreringen, och den motsäger förslaget av ett mätt skäl.

**Draget** är det enda som flyttar coastaren (GLIDER CS-snitt 77,1 → 73,4 → 69,9 → 65,8 vid 0 / 0,8 / 1,6 / 2,4), men det komprimerar valet (hög-CS-klubben faller snabbare, se grundning B). Vid drag 2,4 och faktor ≤0,70 **inverterar mekaniken** — den som håller orten hamnar UNDER den som struntar i den (ΔCS-slut −0,3 respektive −2,2). Hård övre gräns. Finmätning kring brytpunkten (1,2 / 1,4 / 1,6 / 1,8 / 2,0) gav den låsta nivån **1,6**: högsta värdet som samtidigt konsumerar över hälften av solvensfixens överskott, håller valet synligt och ligger med marginal under inversionen. Hela tabellen står i D037.

## 3 · GODKÄNT NÄR — utfall, punkt för punkt

Dominantklubben, 20 säsongsprover per policy, baslinje → efter:

| | HÅLLER före | HÅLLER efter | GLIDER före | GLIDER efter |
|---|---|---|---|---|
| CS-snitt | 87,0 | **75,3** | 77,1 | **69,9** |
| CS-slut | 93,1 | 82,1 | 83,4 | 76,6 |
| omgångar <60 (patronens tröskel) | 4 % | **12 %** | 14 % | **26 %** |
| omgångar <70 (mecenattak 2→1) | 9 % | 28 % | 29 % | 43 % |
| omgångar ≥85 (mecenattak 3) | **69 %** | **25 %** | 34 % | 17 % |
| publiktakets andel | 63 % | 42 % | 49 % | 39 % |
| netto/säsong | 827 778 kr | **720 748 kr** | 501 815 kr | 421 943 kr |

**1. Synligt säsongsval — DELVIS UPPFYLLT, och den obesvarade halvan är domens premiss A.** Valet är synligt i konsekvens: exponeringen mot patronens tröskel är 12 % om man håller orten mot 26 % om man låter den glida, en fördubbling, och tiden på topplatån (mecenattak 3) är 25 % mot 17 %. Den permanenta platån är borta — en dominant klubb låg tidigare på CS ≥85 i 69 % av ALLA omgångar; nu 25 %. Men **"bägge sidor svider" är inte uppfyllt och kan inte uppfyllas med de knappar domen auktoriserar**: att finansiera ortsunderhållet är fortfarande netto lönsamt (+299 tkr/säsong mot att glida), eftersom aktivitetsblocket är intäktspositivt och frivilliga är gratis. Sidan som ska svida gör vinst. Se avsnitt 5 för vad som skulle krävas.

**2. Namngivbar konsekvens — UPPFYLLT via de befintliga, redan textade vägarna.** Publikkvoten faller 0,870 → 0,852 mellan policyerna och taket träffas i 42 % mot 39 % av omgångarna (mot 63 % i baslinjen — CS-vikten 0,45 är inte längre mättad för en dominant klubb, vilket är förutsättningen för att väg B ska kunna kännas alls). Patronexponeringen fördubblas. Inga nya texter behövdes: patron-, mecenat- och sponsoruttågen fyrar oförändrat.

**3. Konsumerar överskottet — UPPFYLLT, men via intäktsvägen, inte utgiftsvägen.** Den dominanta klubb som HÅLLER orten ser sitt netto falla **827 778 → 720 748 kr/säsong, alltså −107 tkr/säsong** — cirka 61 % av solvensfixens ~175 tkr. Mekanismen är inte att aktiviteterna kostar mer (de kostar ingenting mer) utan att samma insats nu ger lägre CS, vilket ger lägre kommunbidrag (kvadratisk csFactor), lägre publikkvot och tunnare mecenatunderlag. Att äta HELA överskottet prövades (drag 2,0-2,4 ger 136-150 tkr) men det raderar valet och inverterar mekaniken — och domen säger "krymper", inte "raderas".

**4. Liten klubb opåverkad, Survive-golvet intakt — UPPFYLLT.** Heros CS-bana är IDENTISK med baslinjen säsong 1-4 (rykte 56/63/70/80 → faktor 1,00, drag 0 hela vägen); först säsong 5, vid rykte 91, biter faktorn (0,92). `club_malilla` i GLIDER-policyn är bit-för-bit identisk med baslinjen (CS-snitt 44,9, netto 130 045 kr). Under rykte 80 känner en klubb ingenting alls av anspråk 4.

**5. Ingen dubbelräkning; holdbarheten intakt — UPPFYLLT.** Anspråk 4 rör inte en enda tröskel i uttågen: `PATRON_EMERGE_CS` (60), `mecenatCapForCs` (85/70/golv 1), `applyMecenatCapEviction` och sponsorvägarna står oförändrade och fyrar som förut när CS faktiskt korsar dem. Det enda anspråk 4 gör är att göra managerns insats mindre effektiv (knapp 1) och lägga ett storleksskalat baslinjedrag (knapp 2). Holdbarheten: den hårdaste kombinationen (rykte 100 × cs 100) ger produkten 0,85 × 0,25 = **0,21** — långt från noll, och testat som invariant. En dominant klubb som håller orten når fortfarande CS ≥85 i en fjärdedel av omgångarna och slutar säsonger på 82 i snitt.

## 4 · Vad som byggdes

**`csUpkeepFactor(reputation)`** och **`csExpectationDrag(reputation)`** i `communityStandingScaling.ts`, båda på den befintliga `csLinearRamp` och båda med SAMMA golv/tak (rykte 80 → 100) — en storleksaxel, inte två. Att mata rykte in i en primitiv vars parameter heter `cs` är avsiktligt och står dokumenterat i filen: D031:s disciplin är "kontinuerlig ramp i stället för diskret tröskel", inte "bara på cs-axeln", och domen är uttrycklig om att `calculateClubEra` (diskret) inte får gata detta.

I `communityProcessor.ts` summeras aktivitets- och volontärboosten nu i en egen ackumulator (`upkeepBoost`) som är positiv per konstruktion, skalas med `csUpkeepFactor` och läggs till FÖRE den CS-baserade dämpningen (så en stor klubb vid hög CS träffas medvetet av båda). Draget dras EFTER dämpningen — hade det lagts in före hade positiv/negativ-splitten ätit upp det och sedan dämpat bort det, precis för den klubb det ska bita på.

Ingen svensk text skriven, inga `'[Opus]'`-platshållare: anspråk 4 är en ren formeländring och konsekvenserna är redan byggda och textade.

## 5 · Öppna frågor till Jacob/Opus — de kräver beslut, inte mer mätning

**A. GODKÄNT NÄR 1:s "bägge sidor svider" kräver en spak som inte finns.** För att finansieringssidan ska svida måste det finnas något dyrt att köpa MER av. Idag är ortsprogrammet nio aktiviteter och fyra frivilliga, allt gratis eller lönsamt i drift, med ett tak som en dominant klubb når på en säsong. Två vägar, båda utanför denna doms mandat: (i) en **rykte-skalad löpande driftskostnad** på community-blocket — samma aktiviteter kostar mer att driva för en stor klubb, vilket gör domens egen formulering "de extra kronorna" bokstavligt sann; eller (ii) **nya, dyrare ortsnivåer** att köpa. Code bygger ingendera utan order.

**B. `socialMedia` ger +1 rykte var femte matchday** (`economyProcessor.ts:177-184`) — ca +6 rykte/säsong för 500 kr/omgång, helt frikopplat från placering. Mätt konsekvens: `club_malilla` med placeringarna 5/8/6 når **rykte 100 på tre säsonger**. Eftersom anspråk 4 nu läser rykte som storleksaxel är den inflationen en förutsättning för mekaniken, och den gör att en mittenklubb med tiden behandlas som en storklubb. D028 äger säsongsdeltat (som toppar på +4). Förbefintligt, inte infört här, inte ändrat här — men det bör granskas innan anspråk 4 låses.

**C. Patronens ankomstevent besvaras aldrig i något headless-harness.** `autoResolvePendingScreen` (stress/fixtures.ts) rör bara `pendingScreen`, aldrig `pendingEvents` — i baslinjen var patronen därför aktiv 0 av 20 säsonger trots CS 92. Mätscriptet löser detta lokalt genom att besvara enbart patron-events, men konsekvensen är att `npm run stress` och alla tidigare mätningar i den här serien har kört med patronen permanent frånvarande. Eget ärende.

## 6 · Verifiering

`npx tsc --noEmit` rent. Full svit **3296/3296 grön** (321 filer), inga förbefintliga röda. `npm run build` grönt inklusive ds-guard och content-contract-guard. `npm run stress` FÖRE och EFTER (produktionsfilerna stashade för före-körningen): båda **0 krascher, 0 invariantbrott** över 50 säsonger, identiska textmått.

Nya tester: 20 i `communityStandingScaling.test.ts` (rampernas form — full effekt på golvet, reducerad på taket, kontinuitet steg för steg över hela ryktespannet, monotoni, och att produkten mot `getCsDiminishingFactor` aldrig närmar sig noll) och 9 i `communityProcessorUpkeep.test.ts` (wiringen — att bara ortsinsatsen skalas, att matchresultatets boost är oskalad, att en storförlust kostar en stor klubb exakt lika mycket som en liten, att draget inte dämpas av CS-faktorn, och att en liten klubb får exakt samma csBoost som före anspråk 4).
