# BANDY_KANON — så fungerar bandy, och så gör Bandy Manager bandy

**Datum:** 2026-09-03 · **Av:** Opus (syntes) + Jacob (domänkunskap) · **Status:** v1, syntes-skelett. Grundad på disk, inte minne.

## Varför den finns

Bandykunskapen i det här projektet har bott i kontext och i huvuden i stället för på disk, utspridd över minst sex filer. Det ledde till förväxlingar en agent inte borde göra: `bandyplay` (som i verkligheten är streamingtjänsten) blandades ihop med bandyskola för barn — och i koden visade det sig vara ännu mer trasslat, se §7; formationerna misstänktes för att vara fotboll fast de var utredda och rätt. Ingen av de missarna berodde på att kunskapen saknades — den fanns, men i fickor. Den här filen är samma fix som händelseliggaren gjorde för spelhändelser, en nivå upp: kunskap i kanon, inte i fickor.

Kanon är den läsbara syntesen. Den ersätter inte de auktoritativa källorna, den pekar på dem:

- **`docs/kunskapsbas/REGLER.md`** — auktoritativ regelkälla, verifierad mot SvBF-Regelbok 2025-26. Vid regelfråga: den gäller, inte den här filen.
- **`docs/kunskapsbas/DATA.md`** — vad Bandygrytan-datan faktiskt innehåller, fält för fält.
- **`docs/findings/`** (Bandy-Brain) — atomära, versionerade facts (R/S/D/W-namnrymden). Kanon är prosa; Bandy-Brain är facts med `verified_at`.

När kanon och en källa säger olika: källan vinner, och kanon ska rättas. Motsägelser som ännu inte är lösta står under "Öppna frågor och motstridiga källor" sist — utslätade, inte gömda.

## Fotbollsbias — läs detta först

Bandy är underrepresenterat i de flesta kunskapskällor. Den som resonerar om bandy — människa eller modell — lutar mot fotboll som mall och behandlar bandy som fotboll med modifikationer. Det är den enskilt största felkällan i projektet. Regel: när en fotbollsterm eller fotbollsintuition dyker upp, behandla den som en flagga att verifiera bandy-verkligheten, inte som utgångspunkt. En bandyslutsats som bekräftar en fotbollsförväntan förtjänar extra granskning; en som bryter mot den är ofta mer trovärdig.

---

## 1. Reglerna, det som ständigt förväxlas

Full behandling finns i `REGLER.md`. Här står det som återkommer som fel.

**Offside FINNS i bandy.** Ta aldrig bort offside-kommentarer. Undantagen är position-baserade (egen planhalva, eller minst två motspelare mellan spelaren och mållinjen), inte situationsbaserade — offside gäller även vid fri-, straff-, tekning och målkast. Till skillnad från fotboll finns ingen hörn- eller inkastfrihet.

**Kort finns i verkligheten — spelet väljer att inte visa dem.** Bandy HAR gult kort (= varning) och rött kort (= matchstraff) i verkligheten. Bandy Manager är ett *designval* att inte rendera kort i UI: spelet modellerar utvisningar (5/10 min) plus matchstraff i stället. Säg därför aldrig "bandy saknar kort". Reformen "våga visa rött" handlar om just röda kort. (Detta rättar en stale rad i `CLAUDE_REFERENCE.md` som påstår att bandy inte har gula/röda kort — se Öppna frågor.)

**2 poäng för vinst**, inte 3.

**Termer:** avslag (inte avspark), frislag (inte frispark, och det döms när bollen går över sidlinjen — inget inkast), brytning (inte tackling), plan (aldrig rink — rink är ishockey), vaden. Ikon 🏒, aldrig ⚽.

**Mått och tid:** plan 100–110 × 60–65 m (SvBF), straffpunkt 12 m, straffområde radie 17 m, klubba max 130 cm. Två halvlekar om 45 min; klockan stannar vid avbrott; halvtidsvila upp till 20 min. Utomhus kan spelas 3×30 av väderskäl; World Cup 2×30.

**Hörnor** är ett centralt offensivt vapen — cirka 22 % av målen i Elitserien herr. **Flygande byten** som i ishockey.

**Förlängning i slutspel:** sudden death 2×10 min, sedan straffar. Grundserieförlängning styrs av tävlingsbestämmelserna, inte spelreglerna, och kan skilja mellan säsonger.

**Dam och herr spelar efter identiska regler.** Dam-anomalin i datan är ett strukturellt fenomen, inte en regelartefakt.

---

## 2. Positionerna

Bandyns positioner, med spelet kod-etikett inom parentes: målvakt (MV), back (DEF), libero, halv/ytterhalv (HALF), mittfältare, anfallare, spets. Mittfältare = Half i kodens positionsmodell.

Den viktigaste strukturinsikten kommer inte ur formationsstegen utan ur hur spelarna själva beskriver laget: **femman bak, femman fram, plus målvakt.** Bakre femman — två backar, libero, två ytterhalvor — är konstant. Det enda som varierar är hur de främre fem fördelas, i praktiken två eller tre mittfältare. En bandytränare beskriver formationssiffror som "en lek med siffror" (Brodén och Liw, oberoende av varandra, samma ord).

Roller värda att ha rätt, för scouttext, matchreferat och narrativ:

- **Målvakten** motar på linjen (till skillnad från fotbollsmålvakten som plockar inlägg). Läser spelet, placeringssäker, allt mer skridskoåkning. Köldtålighet är en verklig egenskap. På frislag kan hen medvetet ställa en ihålig mur för att locka fram ett dåligt skott.
- **Backen** zonmarkerar, aldrig man-man ("det går inte att åka efter en spelare"). Snacket med libero och halvor är en uttalad arbetsuppgift.
- **Liberon** städar bakom — raka djupledsbollar är hens ansvar; frilägen från kanten är halvens eller backens. En bandylibero har **inga** offensiva uppgifter; uppspelsansvaret ligger på backarna. Utsatt position: efter en match med många insläppta är liberon lätt att skylla på, och helt fel är det inte.
- **Halven är två saker samtidigt** — ytterback i försvar, yttermittfältare i anfall. En halv som spelats som mittfältare är inte felplacerad, det är en annan sorts halv. Arketyper publiken känner igen: åkhalv och lyrhalv.
- **Anfallaren.** Viktigaste egenskapen är tålamod, inte avslut — "man åker och väntar på bollen". Huvuduppgiften är att dra isär motståndarna och öppna ytor åt mittfältarna, inte i första hand att göra mål själv. Återhämtning sker i ögonblicket laget vunnit bollen, inte i defensiven.

---

## 3. Formationerna

Spelet har sex formationer: 5-3-2, 3-3-4, 4-3-3, 3-4-3, 2-3-2-3, 4-2-4. De är byggda på bandy-anatomi — libero, halvor, forwards, ytterforwards, halvlinje — och deras coach-citat är bandy-idiomatiska. Fullständiga slots, tags och citat: `docs/textgranskning/TEXT_REVIEW_formations_2026-04-20.md`.

Två saker som är avgjorda och inte ska öppnas igen:

**Formation påverkar INTE matchmotorn.** Den är kosmetisk (hur spelarna visas), position-matchning (saknas en efterfrågad position går en annan upp med CA-rabatt) och kemi (via slots x/y). Match-effekter styrs separat av taktik-axlarna nedan.

**Tags reflekterar anatomi, inte effekter.** `4 FORWARDS`, `KRÄVER LIBERO`, `STARK MITTLINJE` är sanna (de speglar slots). `+OFFENSIV`, `+HÖRNOR` vore lögn — mentality respektive cornerStrategy gör det, inte formationen. Den tagg-buggen rättades 2026-04-20; raden `c-fm1-formationer-fotboll` är stängd som stale mot den domen (`DOM_FORMATIONER_BANDY_KANON_2026-09-02.md`).

Det som INTE är avgjort står under Öppna frågor: källäsningen argumenterar att en varierande försvarslinje (5-3-2 vs 4-3-3 vs 3-3-4) är just det fotbollslån ingen bandytränare skulle känna igen, eftersom alla lag spelar fem bak. Det är en loggad designfråga, inte en defekt.

---

## 4. Spelsätt och taktik

Matchmotorn styrs av åtta taktik-axlar (`tacticModifiers.ts`): mentality (offensiv/defensiv), tempo, press, passingRisk, width, attackingFocus, cornerStrategy, penaltyKillStyle. Det är dessa som ger match-effekt — inte formationen.

Bandyns egna spelsätts-observationer, som spelet delvis fångar och delvis inte:

- **Styrspel** är den defensiva grundtanken: målet står mitt på kortlinjen, så försvaret håller motståndaren ut mot kanten. Anfallarens defensiva uppgift är att inleda styrspelet.
- **Vända hem** (spela bakåt) är publikens vanligaste missuppfattning — de ogillar det, tränaren vet att det ofta är rätt. Perfekt för klackreaktioner.
- **Högt press är sällsynt**, inte ett av tre likvärdiga val. I bandyn är det en situationsbunden avvikelse (matchinledning, motståndare med utvisning), inte en spelstil. Spelets taktikskärm ger Låg/Medium/Hög som jämbördiga — en känd förenkling.
- **Den verkliga stilaxeln: spela eller åk.** Den enda fundamentala skillnad tränare beskriver mellan lag — passa bollen och flytta motståndaren (Sandviken) kontra åka. Den korrelerar inte med tabellplacering, och sitter ofta i klubbens tradition och tröja. Spelet har åtta taktikdimensioner och ingen är denna. Kandidat att knyta till ort via `clubExtendedInfo` (loggad, ej beordrad).

---

## 5. Bandysvenska

Orden som gör att en text låter som bandy och inte som översatt fotboll.

**Spel:** lyra (hög lång boll, ålderdomlig — "något man spelade förr"), flipp (modern, "rakar iväg bollen"), styrspel, vända hem, uppåkning (back går fram med boll), drop, översteg, åka i tomme, gå i djupet, fiska efter bollar.

**Egenskaper:** följsam, brytsäker, bra på tennis (ta ner höga bollar), hal (svårfångad), rättvänd/felvänd, placeringssäker, köldtålig.

**Utrustning:** ryssvantar (mot skinnhandskar). Sargen är låg och flyttbar — man ser över den (detta rättar `DOM_ILLUSTRATIONERNA_2026-08-18` som felaktigt sa "ingen sarg").

Motståndaranalys på bandyspråk namnger en person med ett skäl, inte en lagegenskap: inte "de har farliga forwards" utan vem som är ditt problem den matchen och varför ("hal", "dyker upp varsomhelst"). Full källäsning: `BANDYSPRAK_KALLASNING_2026-08-19.md`.

---

## 6. Spelvärlden

Tolv fiktiva klubbar på riktiga bruksorter. Alla klubb-, arena- och klacknamn är påhittade — inga riktiga föreningar (`CLUB_TEMPLATES` i `worldGenerator.ts`). Rivaliteter mellan fake-klubbarna med intensity 1–3 (`rivalries.ts`): Upplandsderbyt, Bruksderbyt, Daladerbyt m.fl.

Matchmotorn är kalibrerad mot 1124 Elitseriematcher (bandygrytan.se, 2019–26). Nyckeltal: 9,12 mål/match, 22,2 % hörnmål, 5,4 % straffmål, 50,2 % hemmaseger, 11,6 % oavgjort, 54,2 % av målen i andra halvlek. Verifiering: `scripts/calibrate.ts`; säsongsanalys: `scripts/analyze-stress.ts`.

---

## 7. Streaming, bandyskola och akademi

Det här är den förväxling som utlöste kanon. Först de tre begreppen som de betyder (Jacobs domänmening):

- **bandyplay = streamingtjänsten.** Elitseriens streaming (StayLive-typ). Hör hemma som intäkt/sponsorexponering från streamade matcher. Har inget med barn att göra.
- **bandyskola för barn = ungdomsverksamhet.** Nybörjarverksamhet för barn. Bör mata akademin och höja communityStanding. Verklig modell: BandyKul (Uppsala) — klubbarnas gemensamma skridsko-/bandyskola för barn 5–9 år, buss-baserad (hämtar barn på ~27 skolor), sponsorfinansierad, en uttalad integrations-/samhällsinsats som föder framtida spelare.
- **akademin = elit-pipeline.** Klubbens egen fostran mot A-lag (`akademiuppflyttning` finns som liggartyp).

Så ser koden ut efter bygget (verifierat mot disk 2026-09-03; `SPEC_BANDYPLAY_STREAMING_OCH_BANDYSKOLA_2026-09-03.md` BYGGD):

- **`bandySchoolBasic`** = barn-skolan (⛸️ "Bandyskola för barn", gratis att starta). Deltagaravgifter per hemmamatch + drift per omgång — den kostar medvetet ("bygden får sin bandyskola, klubben bär kostnaden"). BandyKul-modellen inbyggd (§4b): en aktiv sponsor bär 25 % av driften (22-omgångsnettot −17 875 → −9 625 kr, aldrig positivt — det är poängen); +1 i ungdomsintag (10 000 seeds: 3 000 → 3 099 spelare); 0,12 CS/omg — mest av alla skolaktiviteter, så valet blir "kostar pengar, bygger orten".
- **`bandySchool`** = avancerad bandyskola (🏫), platt +1000/omgång, 5 tkr att starta. +2 i ungdomsintag (3 200), 0,08 CS/omg — elitnärmare, mindre ort.
- **`bandyplay`** = streaming (📡 "Bandyplay", "Starta sändning — 5 tkr", 100 kr/omgång i produktion). Val C: exponering (+0,05 CS/omg) + sponsoruppvärdering. Sponsordelen är en additiv `streamingSponsorBonus` (max 4 %, under flaggskepps-skalan ~5 %) i `sponsorMoodMultiplier`, skalad av `streamingFreshnessMultiplier` så den trappar när sändningen står still. 0.0086-koefficienten orörd. Kanonisk mätning: vid 5 tkr sponsorportfölj +100 kr/omg, +2,2 tkr per senare grundserie, −2,8 tkr första säsongen (startkostnaden). Ingen påhittad intäktsrad — tv-avtals-domen 2026-08-27 respekteras.

Migreringen (`saveGameMigration.ts`) flyttar gamla saves: legacy `bandyplay: true` → `bandySchoolBasic: true`, nytt `bandyplay` startar av, `communityActivitiesSince` följer med, och köade `community_bandyplay`-eventeffekter skrivs om så en gammal händelse inte råkar slå på streaming.

Historik: fram till 2026-09-03 hette barn-skolan `bandyplay` i koden — wirat som skola, etiketterat som skola, men med streamingens namn. UI:t hade därmed två skol-aktiviteter och ingen streaming. Det var röran som utlöste kanon; full härledning i specen §1.

Allt levererat 2026-09-03 av Codex med 4 151 tester gröna (MASTER `sluttest-bandyplay-nettoforlust`; Codex dagsrapport 2026-09-03 §4, mätningar i `bandyplay-streaming-matning-2026-09-03.ts` och `bandykul-matning-2026-09-03.ts`). §4b (sponsorandel, ungdomsintag, CS-tyngd) var rekommenderad i specen och levererades i Codex-passet — dömd där, inte i specen.

Vad communityStanding driver mekaniskt: det är den dominerande publik-termen i matchintäkten (vikt 0,45 mot fanMoods 0,25 i `computeAttendanceRate`) och skalar kommunbidraget (kvadratisk csFactor × diminishing-faktor, engångsutbetalning omgång 1). Full formel i `economyService.ts`; trösklar och CS-drivare i RAPPORT_COMMUNITYSTANDING-serien.

---

## Öppna frågor och motstridiga källor

Det kanon inte ska släta över:

1. **Formationsaxeln (STÅENDE designfråga).** Ska formationsvalet göras om till bandyns egen axel — två eller tre mittfältare, och hur de fem främre fördelas — i stället för en varierande försvarslinje? Källäsningens post 1, den enda som rör byggd mekanik och `BEVARA`-listan. Tagg-frågan är stängd; strukturfrågan är ett eget beslut, inte taget.

2. **`CLAUDE_REFERENCE.md`:s stale kort-rad — RÄTTAD 2026-09-03.** Raden påstod "Inga gula kort"; nu omskriven mot `REGLER.md` §3 (bandy har gult/rött i verkligheten, spelet väljer bara att inte visa dem). Kvar som logg, inte öppen åtgärd.

3. **bandyplay/bandyskola — BYGGD 2026-09-03 av Codex**, inklusive §4b, med körd balansmätning (`SPEC_BANDYPLAY_STREAMING_OCH_BANDYSKOLA_2026-09-03.md`, MASTER `sluttest-bandyplay-nettoforlust`). Ingen öppen åtgärd. Kvar som logg: §4b dömdes i Codex-passet, inte i specen — specens §4b-text står kvar som rekommendation för spårbarhet.

4. **Djupare communityStanding-trösklar** — §7 fångar CS:s roll i publik och kommunbidrag på formelnivå; de exakta trösklarna och övriga CS-drivare ligger i RAPPORT_COMMUNITYSTANDING-serien och är inte härkopierade. Pekare, inte innehåll.

---

## Källor

`docs/kunskapsbas/REGLER.md` (auktoritativ regelkälla), `docs/kunskapsbas/DATA.md`, `docs/textgranskning/TEXT_REVIEW_formations_2026-04-20.md`, `docs/BANDYSPRAK_KALLASNING_2026-08-19.md`, `CLAUDE_REFERENCE.md`, `DOM_FORMATIONER_BANDY_KANON_2026-09-02.md`, matchmotor-kalibreringen (`bandygrytan_detailed.json`), Bandy-Brain (`docs/findings/`).

---

*v1 är syntes-skelettet: allt som gick att grunda på disk idag. Två öppna frågor kvar: formationsaxeln (Jacobs designkall) och djupare CS-trösklar (framtida syntes). Nästa revision fyller Jacobs domänkunskap där §-texten är tunn.*
