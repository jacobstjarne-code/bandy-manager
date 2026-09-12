# DOM — BASEKONOMINS INTÄKT, VÄG B (resultatresponsiv, ej ny term)

**Datum:** 2026-08-28 · **Av:** Opus · **Beslut:** Jacob (väg B)
**Ligger under:** `A-H2`, ruling A ("höj intäkterna, inte lönerna"). Rör INTE steg 1–2:s magnituder (ruling D), rör INTE lönen.
**Status:** BYGGT + MÄTT (`7d9bf8c7`, 2026-08-28). Kriterium 1 INTERIM — se slutet.

---

## Fyndet

Löner/omgång = Σ(`currentAbility` × 200 × 0.80 × repFactor) / 4 över truppen — skalar med currentAbility × truppstorlek, obegränsat. Intäkt/omgång (`calcRoundIncome`) skalar med `reputation` (trögt) och är hårt kapat (`ATTENDANCE_CAP = 0.95`, kapacitet ≈ rep×7). Axelglapp: lönebasen springer ifrån den rep-drivna, kapade intäkten — därför gick även kontrollklubben (mittenlag, ingen intervention) back, och anspåk 1 och 2 bidrog 0 kr. Väg B: låt intäkten svara på resultat/form snabbare än på det tröga ryktet, via befintliga positionslänkade knappar — inget nytt lager.

## Kalibreringsytan — två knappar

**1 · `computeAttendanceRate` (economyService.ts ~:141).** Idag:
```
Math.min(0.95,
  0.20                                              // ATTENDANCE_FLOOR
  + (fanMood/100) * 0.25 * moodWeight               // ATTENDANCE_MOOD_WEIGHT
  + (communityStanding/100) * 0.45 * moodWeight     // ATTENDANCE_STANDING_WEIGHT — SKYDDAD
  + (position <= 3 ? 0.08 * moodWeight : 0))         // ← byt DENNA
```
Ersätt den binära `position <= 3 ? 0.08 * moodWeight : 0` med en **kontinuerlig funktion av `position` över hela tabellen** (bättre placering → högre term; en tvåa och en fyra drar mer än en åtta, inte lika mycket som en etta). Kurvform/tak: kalibreras. Bunden av `ATTENDANCE_CAP = 0.95` — ingen ny explosionsrisk.

**2 · `formBonus` (economyService.ts ~:485, i matchintäkten).** Idag: `position <= 3 ? 1.15 : position <= 6 ? 1.05 : position >= 10 ? 0.88 : 1.0`. Vidga spannet (skarpare belöning i toppen, skarpare straff i botten). Spann: kalibreras.

Bägge är redan positionslänkade — därför är B en tyngdpunktsförskjutning mot resultat, inte ett nytt lager.

## SKYDDAT — rör inte

- **`ATTENDANCE_STANDING_WEIGHT = 0.45`** — Survive-kontraktets intäktsspak (Jacobs dom 2026-08-25). Förskjutningen mot resultat är ADDITIV, inte subtraktiv under den nivå som håller en hög-CS Survive-klubb flytande. Måste CS-vikten sänkas alls: minimalt, och verifiera Survive-golvet separat (då är det Opus att döma).
- **Ingen truppvärde-linjär intäktsterm.** Kandidaten redan kastad (linjär kr/huvud exploderade 27–34×, RAPPORT_ASKADAREKONOMIN_MATNING_2026-08-26). All styrkerespons går via den kapade publikvägen.
- **Steg 1–2:s magnituder (ruling D) och lönen (ruling A).**

## STEG 0 — före mätning

Dominant-simmen ger +30 CA på HELA truppen → klampar halva laget i `performanceFactor`-taket → syntetiskt extrem lönebas. Byt mot en realistisk mästartrupp (faktisk mästarklubb ur en genomspelning, eller trovärdig CA-fördelning). Annars mäts mot ett artefakttal.

## GODKÄNT NÄR (netto/omgång över en HEL säsong, en ändring åt gången, `npm run stress` före/efter)

1. **Mittenlag (kontroll, ingen intervention): break-even i steady-state.**
2. **Inget uppgångsfönster** — en klubb som klättrar mittenlag → dominant faller inte under mittenlagets steady-state under uppgångssäsongerna enbart för att CA sprungit ifrån rykte.
3. **Dominant netto/omgång inte mer än ~3× kontrollens** — framgångens kostnad bärs av anspåk 1–4, inte upphävd av att basen spottar pengar.
4. **Survive-golvet intakt** — Heros går fortsatt back på dyraste anläggningstiern (kontraktet, inte en bugg). Kalibrera ALDRIG mot att Heros går plus.

Magnitud = utfallet av 1–4. **D-fact krävs** för de slutliga värdena innan commit.

## Ägarskap

Code: steg 0 → bygg de två knapparna → mät 1–4 → D-fact → commit. Opus: dömer om mätningen landar i gråzon (särskilt om kriterium 1 och 3 drar isär och CS-vikten måste röras — då är Survive-golvet Opus att verifiera).

---

## RESULTAT & INTERIM-DOM (2026-08-28, `7d9bf8c7`, D033)

Byggt och mätt av Code. Alla checks gröna (tsc, 313/313 testfiler, 3176/3176 tester, build, `npm run stress` 10×5 utan krasch).

| Klubb | Före | Efter |
|---|---|---|
| Kontroll (mittenlag) | −7666 kr/omg | **−4988** (−35 %) |
| Dominant | −39 | **+6371** |
| Heros (Survive-golv) | −12246 | −11413 (fortsatt back, avsett) |

Kriterium **2** (inget uppgångsfönster), **3** och **4** (Survive-golv) godkända. Kriterium **1** landade inte på noll — kontroll −4988. Att stänga gapet helt hade krävt `TOP_POSITION_BONUS_MAX ≈ 0.80`, vilket överstiger den skyddade `ATTENDANCE_STANDING_WEIGHT = 0.45` och låtit positionstermen dominera CS-spaken. Code trängde rätt genom att INTE trycka dit. Escaleras per gråzonsklausulen.

**Opus dom:**

- **Kriterium 1 var överspecificerat.** Doktrinen kräver att basen är NEUTRAL — att ett mittenlag som inte gör något förblir solvent över en karriär utan tyst spiral — inte att netto landar på exakt noll varje omgång. "≈ 0" var false precision. −4988 är därför inte automatiskt underkänt.
- **Residualen är INTE tvingad till löneaxeln.** De två positionsknapparna stängde *fönstret*, inte *nivån*. Nivåglappet har en oprövad spak inom ruling A:s mandat: ett platt `weeklyBase`-lyft (rykte-oberoende, rör ej CS-vikt, rör ej lön). Löneaxeln behöver inte öppnas.
- **Men timingen är låst av anspåk 4.** Ett platt lyft stort nog att nolla mittenlaget (+4988) höjer även dominantens förskott med samma absoluta krona: +6371 → ~+11400/omg, ~250 tkr/säsong basöverskott. Gapet vidgas inte (lyftet träffar båda lika), men dominantförskottet mer än fördubblas. Det överskottet ska ätas av anspåken — och anspåk 4 (ortsunderhåll), den största klaman på en stor klubb, är OBYGGD. Att nolla mittenlaget nu vore att kalibrera basöverskottet innan mekaniken som konsumerar det finns. Fel ordning.
- **Kriterium 3-inramningen:** 1,28× är meningsfullt bara när båda är positiva. Med kontroll negativ och dominant positiv faller kvoten — det som gäller är att dominanten inte är runaway, och +6371 är måttligt. Andan uppfylld. D033 bör notera att kriteriet mättes mot andan (dominant ej runaway), inte den bokstavliga kvoten, när kontroll är negativ.

**INTERIM-BESLUT:** `7d9bf8c7` behålls. −4988 accepteras INTERIM, villkorat av en karriär-solvensmätning: håller sig kontrollklubben solvent över 10+ säsonger (transfermarknad, cuppengar, kommunbidrag, enstaka bra säsonger absorberar −4988/omg) → basen är neutral i doktrinens mening, −4988 står. Trendar kassan mot insolvens → platt `weeklyBase`-lyft (ruling A, ej CS-vikt/lön), re-mät 1–4, D-fact.

Mittenlaget har inga anspåk som klamar (det är inte framgångsrikt), så dess residual är ren basläcka oberoende av anspåk 4 — därför avgör den enda karriärmätningen om interim-svaret håller. Slutkalibreringen av kriterium 1 sker när anspåk 4 landat. **Anspåk 4 är på kritiska vägen.**

---

## KARRIÄRBANA-SOLVENSMÄTNING (2026-08-29) — svaret på interim-villkoret ovan

Kört: `scripts/ah2-karriarbana-solvens-matning-2026-08-29.ts`. Samma kontrollkonstruktion (`club_malilla`, orörd, huvudseed 2 + robusthetspool [3..12]), 12 säsonger (10 krävt + 2 marginal), `club.finances` läst varje omgång genom den riktiga produktionsvägen. Fotbolls-/styrelseavsked (boardPatience/consecutiveFailures — inte ekonomi) ignorerades i loopen så att den finansiella banan kunde observeras hela spannet ut (sidofynd: alla 11 körningar hade *fotbollsmässigt* avskedats inom säsong 2–5 av 12, oberoende fråga, se scriptets filhuvud).

**Svaret på "håller sig kontrollklubben solvent över 10+ säsonger": NEJ, inte enhetligt.** −4988/omgång är inte en jämn stadig nedförsbacke som cuppengar/transfers/goda säsonger absorberar — det är ett **snitt som döljer ett BIMODALT utfall**:

- **7/11 seeds (64 %):** ryktet återhämtar sig eller växer (weeklyBase/kapacitet skalar med rykte), säsong-1-dippen äts upp, klubben slutar säsong 12 klart plus (+196 tkr till +4,38 Mkr).
- **3/11 seeds (27 %) — seed 3, 6, 10:** en självförstärkande **ryktekollaps**. Upprepade bottenplaceringar (mot MidTable-förväntan) → rykte mot 0 inom 3–4 säsonger → `weeklyBase`/kapacitet låst vid golvet → nya förluster → rykte kvar på 0. Alla tre nådde **faktiskt finansiellt game-over** (< −2M, `managerFired` utlöst av `postRoundFlagsProcessor.ts`) inom säsong 8–12 — inte en projektion, ett verkligt utlöst spelslut.
- **1/11 (seed 9):** gränsfall, −901 599 (warning/värre) vid säsong 12, trendande neråt men inte game-over ännu.

Detta uppfyller villkorets andra gren rakt av: **"Trendar kassan mot insolvens → platt `weeklyBase`-lyft, re-mät 1–4, D-fact."** Mekanismen är dock inte den enkla nivåresidualen doktrinen förutsåg (jämn −4988/omg) utan en tröskeleffekt vid ryktekollaps — golvet (`3000 + rep×50` → `150+rep×7` kapacitet) är för lågt för att någonsin bryta spiralen när rep=0.

### Fixen — mätt, INTE låst

`WEEKLY_BASE_FLAT` (economyService.ts, `weeklyBase = WEEKLY_BASE_FLAT + reputation × 50`): 3000 → **8000** (+5000, flat, ryktemässigt oberoende — rör varken `ATTENDANCE_STANDING_WEIGHT` eller lönen, ruling A:s mandat intakt).

Re-mätning, alla fyra kriterier (`ah2-basekonomi-intakt-matning-2026-08-28.ts`, samma robusthetspool):

| Klubb | Innan (D033 ovan) | Efter `WEEKLY_BASE_FLAT=8000` |
|---|---|---|
| Kontroll | −4988 | **+1340** |
| Dominant | +6371 | **+11969** |
| Heros | −11413 (back, OK) | **−4916 (fortsatt back, OK)** |

**Karriärbanan efter fixen (samma 12-säsongersscript):** 0/11 game-overs (var 3/11). Seed 3/6/10 — de tre som förut kraschade — slutar nu säsong 12 på **+1,06 Mkr / +1,47 Mkr / +3,87 Mkr**, alltså inte bara räddade från game-over utan tydligt plus. Detta är den konkreta bevisbördan för att lyfta golvet.

**Kriterium 2 (uppgångsfönster):** dominant säsong 1 (klättrande, plac 5) = −5158/omg, under kontrollens nya poolade snitt (+1340) men INOM kontrollens egen observerade spridning (sämsta enskilda kontrollseed: −8240). Samma tolkning som innan fixen (D033 ovan) — brusgolv, ingen artefakt.

**Kriterium 4 (Heros-golvet):** intakt, fortsatt tydligt back.

**Kriterium 3 — HÄR återkommer gråzonen, skarpare än innan:** kvot dominant/kontroll = 11969/1340 = **8,94×**, långt över ~3×-taket. Testade även ett svagare lyft (+3000, `WEEKLY_BASE_FLAT=6000`): kontroll −1048, dominant +9839, kvot **9,38×** — SÄMRE, inte bättre, trots mindre lyft. Det bekräftar att kvoten är en **degenererad metrik nära noll i nämnaren**, inte ett mått på faktisk dominansfördel: dominantens ABSOLUTA förskott över kontrollen (kontroll subtraherat från dominant) var 11359 kr/omg innan detta lyft och är 10629 kr/omg efter — i praktiken OFÖRÄNDRAT, till och med marginellt mindre. Ovanpå Opus tidigare undantag ("kvoten är meningsfull bara när båda är positiva") gäller nu det MOTSATTA problemet: båda ÄR positiva (kontroll +1340, dominant +11969) och kvoten är ÄNDÅ meningslös, eftersom kontroll ligger så nära noll att vilken positiv dominant-siffra som helst ger en stor kvot. Ingen `WEEKLY_BASE_FLAT`-magnitud löser detta — att hålla kvoten ≤3× kräver att kontrollen förblir meningsfullt negativ, vilket motverkar hela syftet med lyftet.

Opus varning om dominantens ABSOLUTA basöverskott (headline-nivå, inte relativt kontroll) står dock kvar och är obekräftad/oavvisad av detta: dominantens `weeklyBase`-andel av intäkten är nu påtagligt högre (+5000/omg × ~35 omg/säsong ≈ +175 tkr/säsong extra, ovanpå den redan höjda formBonus/positionsbonusen) och anspåk 4 (den mekanism som skulle äta det överskottet på en stor klubb) är fortfarande obyggd. Den oron kvarstår oavsett kvotens degenerering.

**Status: MÄTT, INTE LÅST.** Kodändringen (`WEEKLY_BASE_FLAT=8000` i `economyService.ts`) ligger i arbetsträdet, ocommittad, med grönt tsc/vitest (3185/3185)/build. Detta landar i exakt den gråzon doktrinen reserverat åt Opus ("kriterium 1 och 3 drar isär") — men på ett sätt ingen tidigare mätning förutsåg (kvoten degenererar snarare än att dominanten faktiskt drar ifrån). Rekommendation från Code: fixen bör tas — den löser ett VERIFIERAT, inte hypotetiskt, insolvensfall (3/11 seeds fick faktiskt game-over) — men kriterium 3 behöver omtolkas (absolut premie, inte kvot, när kontroll ligger nära noll) och anspåk 4-frågan (dominantens obeskattade basöverskott) kvarstår som separat öppen fråga. Opus/Jacob avgör lås.

D-fact: se `D033_basekonomi_income_curve_magnitudes.yaml`, ny notering (kandidat, ej i `value`-blocket ännu).

---

# TILLÄGG 2026-08-30 — OMMÄTNING under korrigerade mätvillkor

**Av:** Code · **Script:** `scripts/remat-ah2-basekonomi-2026-08-30.ts` (nytt; originalen orörda) · **Status:** MÄTT, ingen magnitud ändrad, inget committat.

Uppdraget: verifiera om D033/D036 står kvar efter två mätförgiftande buggfixar — `3914a5e6` (socialMedia-ryktesticken grindad på topp-3) och `06b86b29` (`autoResolvePendingEvents`, patronen kan bli aktiv headless). Detta är verifiering, **inte omkalibrering**. `TOP_POSITION_BONUS_MAX`, `formBonus` och `WEEKLY_BASE_FLAT` är orörda.

## 1 · Ryktesfixen ändrar ingenting här — och det är bevisat, inte antaget

Väg B-scriptet kör med `createNewGame`-defaults, där `socialMedia: false` (`setupManagedClub.ts:296-305`). Ticken kunde alltså aldrig fyra i den mätningen. Verifierat empiriskt genom att köra det LÅSTA originalscriptet i en worktree på `96deea39` (före fixen) och på `HEAD` (efter): **bit-identiska tal**, siffra för siffra. Ryktesfixen är ett icke-ärende för väg B. (Den biter däremot hårt i anspråk 4 — se D037:s tillägg.)

## 2 · Patronen: nu nåbar, och effekten är brus

`--patron`-läget besvarar patronens ankomstevent med `choices[0]` ('welcome'), samma policy som anspråk 4:s eget lokala resolver. Poolat snitt netto/omgång, HEAD:

| Klubb | utan events | med patron | skillnad |
|---|---|---|---|
| Kontroll | +6438 | +6234 | −204 |
| Dominant | +12391 | +12242 | −149 |
| Heros | −2385 | −2385 | 0 |

**Svaret på doktrinens fråga: nej, patronen ändrar inte D033:s tal materiellt.** Två skäl, båda mätta: (a) väg B-konstruktionen kör utan ortsaktiviteter, så CS pendlar kring `PATRON_EMERGE_CS` (60) och patronen flimrar in och ut — dominanten var patronbärande 1 av 30 säsonger; (b) patronens årsbidrag betalas i `seasonEndProcessor.ts:306-320`, alltså på säsongsövergången där `roundPlayed` är null — den syns per konstruktion inte i D033:s netto/omgång-mått. Scriptet mäter därför även `säsongstotal` (finances slut − start): kontroll 288 397 → 280 626 kr/säsong. Ingen ny intäktskälla av betydelse.

## 3 · VARNING — `autoResolvePendingEvents` duger INTE som ekonomiskt mätinstrument

Harnessfixen är rätt fix för sitt syfte, men dess default-policy ("noOp om det finns, annars första valet") är inte neutral. `transferBidReceived` (`eventFactories.ts:119`) har **inget `noOp`-val** — dess avslag heter `rejectTransfer` — så fallbacken blir **acceptera budet, varje gång**. Två fel följer:

- **Ekonomin blåses upp av transfersummor.** Kontroll +6438 → **+12945** kr/omgång. Heros vänder från −2385 till **+2292**, alltså ett FALSKT brott mot kriterium 4.
- **Verifierad deadlock.** Truppen dräneras utan ersättning tills den understiger 11 spelare, varpå `autoSelectLineup` bailar, den managerade matchen aldrig simuleras och säsongen aldrig tar slut. Repro: `DOMINANT seed=100` säsong 5 (trupp 12→10, matchday låst på 23, `fixture_2030_r19_club_vastanfors_vs_club_halleforsnas` evigt `scheduled`), och `DOMINANT-POOL seed=105` säsong 1. Reproducerar i anspråk 4-scriptet också (`DOM-GLIDER seed=105`).

**Körorder (Code, eget ärende):** ge `pickEventResolutionPolicy` i `scripts/stress/fixtures.ts` en explicit hållpositions-policy för `transferBidReceived` (välj `reject`-valet, inte `choices[0]`), och lägg ett vakt-villkor i `autoSelectLineup` som rapporterar i stället för att tyst bail:a under 11 spelare. Tills dess: ekonomimätningar kör patron-only, aldrig full dränering. Ingen tidigare mätning i den här serien är påverkad — ingen av dem dränerade `pendingEvents`.

## 4 · Den verkliga nyheten: D033/D036:s tal reproducerar INTE längre, och orsaken är `765fdcb7`

Det låsta originalscriptet, kört oförändrat på varje commit i kedjan:

| commit | Kontroll | Dominant | Heros | kvot |
|---|---|---|---|---|
| `af760bec` (D036:s egen commit) | **+1340** | **+11969** | **−4916** | 8,94× |
| `69259aad` / `e765efd5` / `ab7eb08d` / `a3860d4d` | +1340 | +11969 | −4916 | 8,94× |
| `765fdcb7` (konditionsspiralen) | **+6325** | **+13188** | **−2385** | 2,09× |
| `96deea39` / `HEAD` | +6438 | +12391 | −2385 | 1,92× |

`af760bec` reproducerar D036:s tabell exakt (+1340 / +11969 / −4916), vilket validerar mätuppställningen. Hela skiftet ligger i **`765fdcb7` ("audit A3/CRITICAL 3 — konditionsspiralen, autofyll tystnar aldrig under golvet")**: när autofyllen slutade tystna under konditionsgolvet blev truppurvalet bättre varje omgång, resultaten bättre, och den resultatresponsiva intäkten (som väg B just byggt) svarade — kontrollklubbens netto femdubblades och Heros underskott halverades. Ingen av de andra tolv commitarna rör talen med en krona.

*Sidofynd, orelaterat men värt en rad:* `71f7ab2d` går inte att köra — dess `seasonEndProcessor.ts` importerar `fitnessRecoveryService`, en fil som skapas först i `765fdcb7`. Ett trasigt mellanliggande commit, inget som påverkar HEAD.

## 5 · Kriterierna under korrigerade villkor

- **Kriterium 1 (kontroll ≈ break-even): ÖVERSKJUTEN ÅT ANDRA HÅLLET.** −4988 → +1340 (D036) → **+6438**. Ett mittenlag som inte gör någonting tjänar nu ca +212 tkr/säsong. Doktrinen ville ha neutralitet; basen är nu nettopositiv för den som inget gör.
- **Kriterium 2 (inget uppgångsfönster): UPPFYLLT, och renare än förut.** Dominantens säsong 1 (+6790) ligger nu ÖVER kontrollens poolade steady-state (+6438). D036 fick den under och fick argumentera brusgolv; det argumentet behövs inte längre.
- **Kriterium 3 (dominant ≤ ~3× kontroll): UPPFYLLT BOKSTAVLIGT.** Kvot **1,92×**, båda positiva, absolut premie +5953 kr/omgång. D036:s gråzon ("kvoten degenererar nära noll i nämnaren", 8,94×) är borta — inte för att den löstes, utan för att nämnaren flyttat sig långt från noll. Opus omtolkning (absolut premie i stället för kvot) behöver inte längre åberopas.
- **Kriterium 4 (Survive-golvet): UPPFYLLT, men marginalen halverad.** −4916 → **−2385** kr/omgång. Heros går fortfarande back, avsett, men är påtagligt närmare noll än när golvet senast dömdes.

## 6 · FLAGGAT TILL JACOB — `WEEKLY_BASE_FLAT = 8000` vilar på ett bevis som inte längre reproducerar

D036 låste +5000 på en konkret bevisbörda: *"det löser ett VERIFIERAT, inte hypotetiskt, insolvensfall — 3/11 seeds fick faktiskt game-over."* Karriärbanescriptet (`ah2-karriarbana-solvens-matning-2026-08-29.ts`, oförändrat, 11 seeds × 12 säsonger) kört om:

| | game-over (< −2M) | sämsta säsong-12-utfall |
|---|---|---|
| `af760bec`, `WEEKLY_BASE_FLAT=3000` (D036:s bevis) | **3/11** | faktiskt spelslut |
| HEAD, `WEEKLY_BASE_FLAT=8000` (nuläget) | **0/11** | +1 525 450 |
| HEAD, `WEEKLY_BASE_FLAT=3000` (kontrafaktiskt, mätt i en engångs-worktree, produktionen orörd) | **0/11** | −1 137 986 (license-denial, 1/11) |

Ryktekollaps-spiralen — den bimodala mekanismen hela fixen skrevs mot — är borta även utan lyftet. `765fdcb7` löste den, inte `WEEKLY_BASE_FLAT`. Lyftet köper nu marginal (det vänder ett license-denial-fall till +1,5 Mkr), inte överlevnad, och priset är kriterium 1:s överskjutning i punkt 5: samtliga elva kontrollkörningar slutar säsong 12 på +1,5 till +6,6 Mkr.

**Detta är flaggat, inte ändrat.** `WEEKLY_BASE_FLAT` står kvar på 8000 i `economyService.ts`. Frågan — behåll 8000 för marginalens skull, eller sänk mot 3000 nu när spiralen är borta av andra skäl — är ett omkalibreringsbeslut och därmed Jacobs, inte Codes. Notera att ett sänkningsbeslut interagerar med anspråk 4:s kriterium 3 (överskottet som ska ätas krymper).

*Sidofynd, eget ärende:* 10/11 kontrollkörningar hade avskedats på fotbollsliga/styrelseskäl senast säsong 5 — finansiellt friska klubbar med sportsligt ohållbara banor. Samma observation som D036:s körning gjorde (11/11). Oberoende fråga, ingen ekonomi.

## 7 · Verifiering

`npx tsc --noEmit` rent. Ingen produktionsfil ändrad — jämförelsebaslinjerna kördes i en engångs-worktree som raderats efteråt. Alla tal ovan är reproducerbara med de seeds och commits som namnges.
