# DOM — FRAMGÅNGSEKONOMIN, UPPSIDAN: plana den kvadratiska intäktskurvan

**Datum:** 2026-08-31 · **Av:** Opus · **Utlöst av:** människoupplevelse-auditen 2026-08-31 (#4): "uppsidan blir snabbt mycket rik", 380 tkr → 1,7 mkr på två säsonger utan ett smärtsamt ekonomiskt val. Framgångsekonomin är inte bevisad.

## Diagnosen (kodläst, `economyService.ts` — avgörande)

> **⚠ FALSIFIERAD 2026-08-31 (Code mätte — se "DIAGNOS REVIDERAD" nedan).**
> Kvadratisk-i-rykte-premissen var fel: jag läste `club.arenaCapacity ?? rykte×7+150`
> och tog FALLBACKEN för det levande värdet. `arenaCapacity` fryses vid world-gen,
> så matchintäkten är PLATT i spel. Den verkliga drivaren är de två kommunbidragen
> + flat league_prize. Diagnosen nedan står kvar som historik.

Intäkten växer KVADRATISKT med rykte; lönerna LINJÄRT. Det är hela mekanismen.

**Intäkt (∝ rykte²):** `matchRevenue = kapacitet × attendanceRate × biljettpris × formBonus × ...`
- `kapacitet = rykte × 7 + 150` — linjär i rykte
- `biljettpris = 50 + rykte × 0,3` — linjär i rykte
- De två MULTIPLICERAS → matchintäkten är kvadratisk i rykte. `attendanceRate` (CS 0,45 + position/formBonus) och `formBonus` (upp till 1,35 topp-3) lägger ytterligare framgångs-multiplikatorer ovanpå.

**Lön (∝ rykte):** `weeklyWages = Σ spelarlön / 4`, varje lön = `currentAbility × 200 × 0,8 × repFactor(0,5–1,5) × performanceFactor`. Rykte skalar linjärt (repFactor), summerat över en trupp av fast storlek → linjärt totalt.

När ryktet klättrar drar intäkten alltså ifrån lönerna kvadratiskt mot linjärt. Överskottet compoundar. Det är 380 tkr → 1,7 mkr.

**Den andra dörren är redan stängd:** A-H2b (`contractDemandService.ts`) valde MEDVETET bort kronor-kostnad — "en dominant klubb tjänar snabbare än den ådrar sig lönekrav, svaret är alltid ja". Att pressa lönerna hårdare slåss mot den domen. Kostnadssidan är prövad och underkänd för en vinnare. Svaret är intäktssidan.

## Domen — avtagande avkastning på matchintäktens rykte-skalning

Plana den kvadratiska kurvan så intäkten växer ~linjärt med framgång, i takt med lönerna. **Detta är doktrinärt redan beslutat:** åskådarekonomin v2 (Jacobs dom 2026-08-27) dömde sqrt/avtagande avkastning för kioskintäkten med exakt detta argument ("fler åskådare ger mer, men inte proportionellt mer") — men KÄRNAN, `matchRevenue`, lämnades kvadratisk. Samma filosofi, applicerad på det den missade.

### Mekanik (Code)
- **Mätta avkastningen på matchintäktens rykte-skalning.** Den renaste spaken är produkten `kapacitet × biljettpris` — bägge linjära i rykte, och det är multiplikationen som gör kurvan kvadratisk. Låt EN av dem (eller produkten) mätta vid högt rykte: en avtagande funktion (sqrt eller en tak-asymptot) så ett topplag inte får obegränsat större arena OCH obegränsat högre pris samtidigt. Resultat: matchintäkten växer ~linjärt, lönerna spårar den, överskottet förblir bundet.
- **Rör inte det låga spannet.** Detta är en HÖGRYKTES-mättnad. Ett lågryktesklubb ligger i det linjära området och påverkas inte — samma skydd sqrt-fixen gav Heros. Kurvan planar toppen, inte botten.

### SKYDDAT
- **Survive/lågrykte orört.** Mättnaden slår bara vid högt rykte. Heros går fortsatt back på dyraste tiern — Survive-kontraktet ("överlever om orten kommer, inte att den blir lönsam") är intakt.
- **CS-vikten 0,45** (Survive-spaken i attendanceRate) rörs inte.
- **Lönerna/A-H2b rörs inte.** A-H2b:s trupp-kostnad står kvar som sin egen spak; den här domen fixar intäktssidan den aldrig kunde nå, inte lönesidan.
- **Sqrt-kioskintäkten** (v2) rörs inte — den är redan planad. Detta är samma filosofi på matchintäkten.

### GODKÄNT NÄR (mät en 2–3-säsongs framgångsrik karriär)
1. **Överskottet är bundet:** en framgångsrik klubb når ett bekvämt men INTE absurt saldo — **mål ~600 tkr efter två framgångsrika säsonger (Jacobs känslo-kall 2026-08-31), mot dagens 1,7 mkr.** Ett tal där en anläggning/trupp/ort-förnyelse fortfarande KOSTAR en meningsfull andel, så framgångskurvans konkurrerande fordringar biter i spel.
2. Intäkten växer ~linjärt med rykte, inte kvadratiskt (mät kurvan över rep 45→90).
3. Lågrykte/Survive opåverkat (kontroll: Heros/kontrollklubb bit-identiska).
4. Sqrt-kioskintäkten och CS-vikten orörda.
Magnitud (mättnadskurvan, var den slår in, mål-saldot för "bekvämt men knappt") via mätning. **D-fact innan commit.**

## Den ärliga forken (men grundningen pekar åt ett håll)
Alternativet är kostnadssidan — löner kvadratiska med framgång. Men A-H2b prövade den och dess doktrin säger att den inte biter en vinnare, och att göra en trupps lönetak kvadratiskt riskerar att explodera obalanserat. Intäkts-planingen är den grundade vägen: den möter den faktiska kvadratiska mekanismen, den återskapar KNAPPHET (och det är knapphet, inte kostnad, som får framgångskurvans val att svida), och den är samma sqrt-filosofi Jacob redan ratificerat. Det är din designdom, men bevisen lutar åt intäktssidan.

**BEKRÄFTAT (Jacob 2026-08-31):** intäktssidan, mål-saldo **~600 tkr** efter två framgångsrika säsonger. Ansatsen är därmed inte längre en fork — den är dömd. Kostnadssidan (löner kvadratiska) är avförd.

**Opus startförslag på spaken — SUPERSETERAD (se DIAGNOS REVIDERAD; behållet som historik):** mätta KAPACITETEN, inte biljettpriset. Kapaciteten (`rykte × 7 + 150`) är den största drivaren (den går in i både matchintäkt OCH den visade publiksiffran), och den är fysiskt rimligast att tak-sätta: en småstads bandyarena har ett verkligt max, den växer inte obegränsat med rykte. En asymptot eller sqrt över en rykte-tröskel gör kapaciteten avtagande, biljettpriset får stå linjärt kvar, och produkten blir ~linjär i stället för kvadratisk. Bonus: den visade publiken blir också realistisk (ett topplag fyller sin — verkliga — arena, inte en fantasisiffra). Exakt tröskel och kurva kalibreras mot ~600 tkr-målet, D-fact.

## DIAGNOS REVIDERAD 2026-08-31 (Code mätte — kapacitets-premissen falsifierad)

Code körde en 3-säsongs karriärsim FÖRE bygge (som domen krävde) och falsifierade diagnosen ovan.

**Kapaciteten fryses.** `club.arenaCapacity` sätts vid world-gen och re-härleds aldrig ur levande rykte (bara anläggningsinvestering höjer den). `rykte×7+150` är bara `??`-fallbacken, som sällan fyrar. Så matchintäkten är PLATT (~85–130k/match) medan ryktet klättrar 85→98. "Mätta kapaciteten" rör en gren spelet knappt kör. (Min miss: jag läste formeln men inte vilken gren som exekverar — fallbacken, inte det levande värdet. Mätning är kontrollen på kodläsning, och den fångade det.)

**Den verkliga drivaren (rätt gren nu + Code:s mätning):**
- **league_prize** — flat 200k/säsong, ingen framgångsskalning. En stor baslinje-överskottskälla.
- **TVÅ kommunbidrag, bägge taggade `'kommunbidrag'`:**
  1. `economyService.kommunBidrag` = `60000 × repFactor(0,5–1,5) × csFactor` (säsongsstart, rykte+CS-skalad).
  2. `politicianService.calculateKommunBidrag` = `30000 × generositet × communityMod(CS/50, 0–2) + lokStöd(ungdom×100) + agenda/relations-bonus` (CS + relation + ungdom-skalad).
  - Bägge växte ~2,7× över simen när rykte/CS klättrade. **Det ÄR framgång→rikedom-länken** — inte matchintäkten.
- socialMedia-ticken (+1 rykte/5:e omgång topp-3) matar rykte-skalningen.

**Reviderad spak (samma sqrt-filosofi, RÄTT mekanism):**
1. **Mätta de två kommunbidragens rykte/CS-skalning vid högt rykte/CS.** Det är framgångs-skalaren; dämpa så framgång inte compoundar kommunintäkten. Bägge mekanismerna, konsekvent.
2. **Granska flat league_prize (200k/säsong).** En platt baslinje som, mot platta kostnader, bygger ett ihållande överskott oavsett framgång. Antingen placeringsskala den (bunden framgångsbelöning) eller sänk den — Code mäter dess andel.
3. **Lös dubbel-taggningen.** Två kommunbidrag under samma reason-sträng — bekräfta att det är två avsiktliga källor, inte en dubbelbetalning, och överväg skilda etiketter så spelaren ser vad som är vad.

**Oförändrat:** mål-saldo ~600 tkr, Survive/lågrykte-skyddet (mättnaden slår bara högt), sqrt-kioskintäkten orörd. Code mäter vilken spak som bär hur mycket + kalibrerar; Opus föreslår riktning, mätning avgör magnitud. **D-fact.**

## OPUS-DOM PÅ VÄG A: ACCEPTERAT (2026-08-31)

Code byggde + kalibrerade (D042 financeLog-gap, D043 dampFactor). **ACCEPTERAT**, av tre skäl:
1. **609 760 kr, inom 2% av målet** — och kalibrerat mot D042:s KORRIGERADE baslinje (1 442 832 kr efter §6-fixarna), inte D041:s gamla tal som innehöll kommunstöd-överbetalningen. Rätt disciplin: en kalibrering mot en baslinje med en 520k-bugg i vore skräp.
2. **§6-gapet var en ÖVERBETALNINGSBUGG**, inte bara ologgat: kommunstöd re-firade upp till 3×/säsong (dedup läste ett sponsor-record expiry-svepet raderade). Fixat, 520k→−6,7k. Det förklarar en del av den skänande rikedomen i sig.
3. **Säsong 2–3 kan gå net-negativt för en dominant-men-slippande klubb** — framgångskurvan LANDAR. Auditen sa att framgångsekonomin inte var bevisad; nu måste en toppklubb betala för att hålla sig kvar, och en som slipptar kan inte ha allt. Konkurrerande fordringar biter i SPEL, inte bara i en mätning.

**Två playtest-punkter (Jacobs känslo-kall, ej blockerare):** (a) den net-negativa säsongen får inte spirala till KONKURS för en klubb som bara slipptar — dampFactorn är rep-gated så den återhämtar när resultaten gör det, men bekräfta att det är ett bett, inte en spiral; (b) floor 0,22 träffar talet, men om ~22% gate-intäkt vid topprykte KÄNNS för lågt (arenan under-monetiserad) är en känslo-kall.

**§6-arkitekturfynd (Code flaggade, EJ åtgärdat):** 8+ ställen skriver `finances` direkt förbi `applyFinanceChange` — roten till gap-klassen och de två residualerna (~32k/−39k). Egen post: routa alla finansskrivningar genom den loggade vägen så financeLog blir fullt tillförlitlig. → MASTER_OPPET-rad.

## D041 — BYGGT + MÄTT: KOMMUNBIDRAGEN DÄMPADE, MEN TARGET EJ NÅTT (Code cab2a5d8)

Code byggde kommunbidrags-dämpningen (bägge mekanismerna via D031:s `getCsDiminishingFactor`, tillväxt ~2×→platt ×0,95/×1,08), splittade reason-taggarna (`kommunbidrag` vs `kommunbidrag_politiker`, bekräftat TVÅ avsiktliga källor ej dubbelbetalning), granskade league_prize (redan placeringsskalad, 5–9 % av överskottet, ingen ändring). Löner/icke-CS-bonusar orörda.

**MEN ~600k-målet nåddes INTE: 1,66 M mot odämpade 1,72 M — bara ~3 % ner.** financeLog-uppdelningen visar varför, och den falsifierar ÄVEN den reviderade diagnosen: **`match_revenue` är bulken (~1,2–1,4 M/säsong, 8–17× bägge kommunbidragen tillsammans).** Det är dess STORLEK, inte dess tillväxt, som håller saldot uppe. Kommunbidragen var en liten spak på en liten rad.

**Tredje diagnos-lärdomen (min):** jag gissade mekanismen ur kodläsning två gånger (kapacitet-kvadratisk → falsifierad; kommunbidrag → för liten). Sanningen var financeLog-uppdelningen hela tiden — vilken RAD som är störst, inte vilken formel som ser skalande ut. Framåt: led ekonomidiagnoser med financeLog-breakdownen (Code kör simen, ger raderna), inte min formelläsning.

**Den verkliga frågan, nu grundad i data:** en dominant klubbs INKOMST (dominerad av match_revenue) överstiger dess KOSTNADER så mycket att överskottet compoundar. De två klassiska spakarna är bägge doktrinärt begränsade: match_revenue kallades "platt/utanför scope", A-H2b sa löner kan inte bita en vinnare. Att nå ~600k kräver ett DJUPARE beslut (Jacobs): antingen SÄNK match_revenue-baslinjen (är 1,3 M/säsong gate-intäkt för en småstadsklubb för generöst?) eller låt en kostnad faktiskt bita (mot A-H2b:s dom). Ingen av dem är en kalibrering — bägge är en ny doktrin-dom.

**§6-gapet (sekundärt, Code-utreder):** ~150–220k/säsong finansrörelse spåras INTE genom financeLog — pengar rör sig utan en post. En transparensbugg (spelaren ser inte vart det går), egen utredning.

## VÄG A VALD (Jacob 2026-08-31): rep-gated match_revenue-dämpning

Jacob valde (a): sänk match_revenue-baslinjen. Bulken är match_revenue, så spaken sitter där.

**Mekanik (Code):** en rep-gated dämpningsfaktor PÅ match_revenue-UTFALLET (inte på kapaciteten — den är fryst; på den räknade summan): `match_revenue × dampFactor(reputation)`, dampFactor = 1,0 vid lågt rykte, avtagande vid högt. Det träffar bulken för en dominant klubb och lämnar lågrykte orört — Survive skyddad, deras arena/match_revenue är redan liten. Återanvänd `getCsDiminishingFactor`-familjen om formen passar (som kommunbidrags-dämpningen gjorde), annars en rykte-ramp i samma anda.

**ORDNING (Opus process-ändring, viktig):** Code löser/kvantifierar §6-gapet FÖRST — de ~150–220k/säsong ospårad rörelse — så att måtterna är tillförlitliga. SEN kalibreras dampFactor mot ~600k via financeLog-breakdownen. Ingen siffra från Opus i förväg — tre diagnoser på minnet räcker; magnitud kommer ur mätningen, inte ur en formelläsning.

**SKYDDAT:** lågrykte/Survive orört (dampFactor ~1,0 vid lågt rykte), sqrt-kioskintäkten orörd, kommunbidrags-dämpningen (D041) står kvar, löner/A-H2b orörda.

**GODKÄNT NÄR:** dominant klubb ~600k efter 2 framgångsrika säsonger; lågrykte/Survive bit-identiska; match_revenue fortfarande rimlig vid full dämpning (en full arena ska ge något, bara inte finansiera dominans); §6-gapet spårbart så saldot summerar. **D-fact.**

## Ägarskap & timing
Timing: domen skrivs nu (parallellt med #3-bygget), men BYGGET sekvenseras efter Jacobs nick på ansatsen OCH efter att centralredaktören (#3) landat — auditens egen ordning (#3 före #4). Code: bygg mättnaden på de TVÅ kommunbidragen (ej matchintäkten — se DIAGNOS REVIDERAD) + granska league_prize → mät karriär-överskottet över 2–3 säsonger → D-fact → commit. Opus: föreslår mättnadskurvan + mål-saldot mot mätningen, och dömer utfallet. Jacob: bekräfta ansatsen (intäkts-planing, min rek) och "bekvämt men knappt"-saldot (en känslo-kall — hur rik ska en vinnare få bli).
