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
