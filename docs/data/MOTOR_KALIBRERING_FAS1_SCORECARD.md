# Motor-kalibrering Fas 1 — scorecard

**Datum:** 2026-06-05  
**Metod:** 1000 simulerade matcher, varierad lagstyrka (CLUB_TEMPLATES-CA-spridning), defaulttaktik. Mätning, ingen tuning.  
**Princip:** En träff är ett bra resultat — den validerar motorn. Gap är kalibreringsmål, inte misslyckanden.  
**Data:** `docs/data/motor_kalibrering_scorecard.json`

---

## Scorecard

| Strukturmått | Prio | Verkligt | Motor | Bedömning |
|--------------|------|----------|-------|-----------|
| **Målklustring** (kluster/lag-match) | 1 | 0,80 (liga) | **0,75** | ✅ **TRÄFF** |
| Post-paus comeback (basfrekvens) | 2 | 13,3 % | 7,6 % | ❌ GAP |
| Post-paus fönster 51–55 | 2 | 27 % | 8,7 % (n=149) | ❌ GAP |
| Hörnmålsandel | 3 | 21,9 % | 17,0 % | ⚠️ GAP |
| Hemmafördel-gap | 4 | liga +12,5 pp | +6,5 pp (uniform) | ❌ GAP (nivå + uniformitet) |
| Mål/match (marginal-kontroll) | — | 9,08 | 9,04 | ✅ TRÄFF |
| Stil-kontinuum | 5 | cluster_freq 0,61–1,27 | ej mätt denna körning | — |

---

## Tolkning per mått

### PRIO 1 — Målklustring: TRÄFF (huvudnumret)

Motorn producerar 0,75 målkluster per lag-match mot verklighetens 0,80 (ligasnitt). **Motorn drar alltså INTE mål som oberoende Poisson-händelser** — den producerar skurar nära den verkliga frekvensen. Det är det enskilt viktigaste resultatet: på det mått som avgör om matcherna *känns* levande (momentum, "nu rullar det") ligger motorn redan rätt. Marginellt lågt (0,75 vs 0,80) men inom rimligt avstånd.

Detta validerar både motorn och metoden. En naiv simulator hade gett klart färre skurar.

### PRIO 2 — Post-paus-reset: STÖRSTA GAPET

Comeback-basfrekvensen är för låg (7,6 % vs 13,3 %), och fönstret 6–10 min in i andra halvlek visar ingen särskild topp (8,7 % vs verklighetens 27 %). **Motorn har ingen halvtidsåterställning.** I verkligheten skapar pausen ett fönster där det jagande laget ofta reducerar och vänder; motorn behandlar andra halvlek som en jämn fortsättning på första. Detta är det tydligaste strukturella kalibreringsmålet (Fas 2).

### PRIO 3 — Hörnmålsandel: GAP

17,0 % mot 21,9 %. Motorn underproducerar hörnmål. Delvis en känd marginaldrift sedan takhöjningen (Finding 050) — hörnmålsandelen låg på 22,3 % i v1.2.0 men har drivit ned. Bör ses tillsammans med marginalkalibreringen, inte bara som strukturfråga.

### PRIO 4 — Lagspecifik hemmafördel: GAP (två delar)

Motorns hemmafördel är dels **för svag** (+6,5 pp mot verklighetens liga +12,5 pp), dels **uniform** — starka lag +6,5 pp, mittlag +6,8 pp, i princip ingen skillnad. Verkligheten visar lagspecifik variation (Villa +0,2 pp, snittlag mer). Motorn modellerar en konstant hemmaboost, inte en lagberoende. Två gap i ett.

### PRIO 5 — Stil-kontinuum: EJ MÄTT

Denna körning använde defaulttaktik för alla lag, så stil-spridningen (cluster_freq 0,61–1,27 beroende på stil i Finding 054) gick inte att mäta. Kräver en körning med varierad taktik per lag. Noteras som ogjord — fabricerar ingen siffra.

### Marginal-kontroll — Mål/match: TRÄFF

9,04 mot 9,08. De kalibrerade marginalerna (047–050) hålls i denna mätning.

---

## Sammanfattning

**Motorn återger redan det viktigaste strukturdraget — målklustringen — nära verkligheten (0,75 vs 0,80).** Det är valideringen Fas 1 letade efter: matcherna är mekaniskt levande på rätt sätt.

**Två tydliga kalibreringsmål för Fas 2, i prioritetsordning:**
1. **Post-paus-reset** (störst gap, störst upplevelseeffekt) — motorn saknar halvtidsmomentum. Comeback 7,6 → mål 13,3 %, fönster 8,7 → mål 27 %.
2. **Lagspecifik hemmafördel** — för svag och uniform; bör bli starkare och lagberoende.

Hörnmålsandelen (17 vs 22 %) hanteras lämpligen i marginalkalibreringen, inte som rent strukturmål. Stil-kontinuumet behöver en egen mätkörning med varierad taktik innan det kan bedömas.

**Fas 2 körs separat** efter denna rapport — ett mål i taget, klustringen är redan nära så post-paus-reset först, med marginalverifiering (047–050) efter varje ändring.

---

# Fas 2 — kalibrering (logg)

## Steg 1: Post-paus-reset (PRIO 2) — DELVIS, mekanism-baserad

**Mekanism (ej fittad kurva):** `POST_PAUS_URGENCY = 0.45` i matchCore.ts. Det jagande laget (chasing-mode, underläge ≥1) får en transient attack-urgency som avtar linjärt över steg 30→40 (minut 45→60) — modellerar halvtidsåterställningen, inte en punktbump i minut 51–55.

**Resultat:**
| Mått | Före | Efter | Mål |
|------|------|-------|-----|
| Comeback basfrekvens | 7,6 % | 8,6 % | 13,3 % |
| Fönster 51–55 | 8,7 % | 10,3 % | 27 % |
| Målklustring (regression-test) | 0,754 | 0,754 | — (oförändrad ✅) |
| Mål/match (marginal) | 9,04 | 9,05 | 9,08 ✅ |
| 1078 enhetstester | grönt | grönt | ✅ |

**Båda metrikerna rörde sig tillsammans** (bas + fönster), vilket är rätt signatur — inte en fittad fönster-bump. Regressionsregeln klarad: klustring oförändrad, marginaler oförändrade (homeWin/draw-felen är pre-existerande v1.2.0-gap, identiska vid urgency=0), alla tester gröna.

**Varför bara delvis — diagnos:** Attack-multiplikatorn saturerar. 0,45→1,0 flyttade comeback bara 8,6→9,0 %, eftersom multiplikatorn späds av initiativ-ratiot (`homeWeight/(homeWeight+awayWeight)`). Att kranka vidare vore att fitta mot en mättad lever.

Comeback per HT-marginal (motor vs verkligt):
- +1: **15,0 % vs 24 %** ← största gapet, här sitter problemet
- +2: 6,9 % vs 11,5 %
- +3+: 1,8 % vs 2,2 % ✅

HT-marginalfördelning bidrar marginellt (motor +1=36 % vs verkligt 41 % — något för få återhämtningsbara enmålsunderlägen).

**Slutsats:** Det villkorade +1-återhämtandet (15 % vs 24 %) går inte att stänga via chasing-lagets attack-multiplikator — den är mättad. Full stängning kräver en strukturändring i 2:a-halvlek-initiativmodellen (hur ledningar konverteras till utfall), vilket är en större och riskablare ändring än en konstant. Den modesta mekanism-baserade vinsten (0,45) behålls; djupare ingrepp flaggas för beslut snarare än överfittas nu.

## Steg 2–3 (ej körda denna omgång)
- **Hemmafördel (PRIO 4):** motorns hemmavinst 39,5 % mot mål 50,2 % är det kända v1.2.0-gapet (Finding 050, kräver v1.3.0 — explicit hemmaplansvikt). Specens frekvens-shift-ansats hör hit. Ej påbörjad — egen verifieringsrunda.
- **Hörnandel (PRIO 3):** 17 % vs 22 %, ren marginal-rekalibrering, sist enligt prioritet.

## Steg 2: Hemmafördel/draws (PRIO 4) — ROTORSAK: kopplad till comeback

**Omdiagnos.** Med ren harness (2000 matcher) är hemmafördelens *magnitud* nästan rätt: lika-CA-gap +11,3pp mot verkligt +12,5pp. Det verkliga felet är **för många oavgjorda**: 18,7% (varierad CA) mot verkligt 10,7%. De ~8 överflödiga draw-procenten trycker ner hemvinsten (43,4% mot 50,9%). Hemvinst-gapet är alltså ett **draw-gap**, inte ett hemmafördels-gap.

**Försök (förkastat):** Eskalerande even_battle-attack sent i level-matcher (1,04 → 1,12/1,22). Effekt på draws: 18,7 → 18,1% — försumbart. Boosten är symmetrisk (båda lagen), så den adderar mål utan att bryta lika. Återställd (ingen verkningslös konstant kvar i motorn).

**Rotorsak — de två gapen är kopplade.** Draw-överskottet kommer från 2H:s lead-konverteringsdynamik: det jagande laget boostas (chasing) samtidigt som ledaren bromsas (controlling/cruise) → trailing kvitterar ofta till 0 → båda lagen hamnar i even_battle → matchen fastnar lika. Det skapar en attraktor vid jämnt resultat.

Det betyder att **comeback-gapet (PRIO 2) och draw/hemvinst-gapet (PRIO 4) drar åt motsatt håll genom samma mekanism:**
- Stärk comebacks (mer chasing-boost / mindre ledar-broms) → fler kvitteringar → FLER draws.
- Minska draws (mindre chasing-boost / mer ledar-broms) → leder håller → FÄRRE comebacks.

Constant-tuning kan därför inte stänga båda samtidigt — varje justering byter ett gap mot ett annat. Det är en strukturell egenskap hos 2H-initiativmodellen, inte en feljusterad konstant.

## Slutsats Fas 2

**Levererat:** Post-paus-urgency (mekanism-baserad, +1pp comeback, regression-säker, committad).

**Rotorsaksfynd:** Hemvinst-gapet är ett draw-gap, och draw-gapet är kopplat till comeback-gapet via en "dragning mot lika" i 2H-modellen. De kan inte stängas oberoende med konstanter.

**Rekommendation (design, ej tuning):** En 2H-modell som bryter lika-attraktorn utan att döda comebacks. Två kandidatmekanismer att designa:
1. **Asymmetrisk sluttids-varians i level-matcher** — när jämnt och sent, höj konverterings-*variansen* (inte symmetrisk attack) så att en sida drar ifrån. Bryter draws utan att röra comeback-dynamiken.
2. **Frikoppla kvittering från stall** — låt ett nyss kvitterat lag behålla momentum (fortsatt lätt boost) i stället för att direkt falla till even_battle, så att kvitteringar oftare blir vändningar i stället för draws. Stänger comeback-gapet OCH draw-gapet i samma riktning.

Kandidat 2 adresserar båda gapen samtidigt och är därför den rekommenderade designvägen. Den kräver en ny tillstånds-variabel (nyligen-kvitterat) i 2H-loopen — en modelländring, som bör specas och verifieras mot klustring + marginaler + comeback + draws i ett svep, inte krankas live.

**Hörnandel (PRIO 3):** 17% vs 22%, ren marginal-rekalibrering, orörd — lägst prioritet, hör till marginal-passet inte strukturpasset.

---

# Fas 2 steg 2 — lika-attraktorn (momentum-efter-kvittering)

## Mekanismen (tillståndsvariabel, ej konstant)
`equalizeMomentumTeam` + `equalizeMomentumTimer` i 2H-loopen. När ett lag går från underläge till lika (detekterat via `prevScoreDiff`) får det en avtagande attack-boost (`EQUALIZE_MOMENTUM=0.30`, 4 steg ≈ 6 min) i stället för att direkt falla till even_battle. Modellerar att ett nyss kvitterat lag rider på trycket. Half-flagga genomgående; ingen `minute>=46`.

## Före/efter (alla fyra metriker + marginaler + tester)

| Mått | Baseline (ingen Fas 2) | Post-paus (steg 1) | + momentum (steg 2) | Verkligt |
|------|------------------------|--------------------|--------------------|----------|
| Comeback bas | 7,6 % | 8,6 % | **9,2 %** | 13,3 % |
| Fönster 51–55 | 8,7 % | 10,3 % | **11,0 %** | 27 % |
| Oavgjorda | 18,7 % | 18,5 % | **18,5 %** | 10,7 % |
| Hemvinst | 43,4 % | 44,4 % | **44,4 %** | 50,9 % |
| Målklustring | 0,754 | 0,754 | **0,758** | 0,80 |
| Mål/match | 9,04 | 9,05 | 9,05 | 9,08 |
| Marginaler 047–050 | ✅ | ✅ | ✅ (oförändrade) | — |
| Tester | 1078/1078 | 1078/1078 | **1078/1078** | — |

## Framgångssignaturen: EJ uppfylld — rapporteras som resultat

Spec:ens kvitto var: *draws faller → hemvinst självkorrigerar mot ~51 %.* **Det hände inte.** Draws står kvar på 18,5 %, hemvinst på 44,4 %. Comeback rörde sig materiellt åt rätt håll, draws rörde sig inte alls.

Per spec:ens egen anti-överfit-regel ("en momentum-parameter ska flytta BÅDE comeback och draws — det bevisar att det är rätt spak") är momentum-efter-kvittering **rätt spak för comeback men inte för draws.** Jag krankade inte vidare (0,30→0,60 gav comeback 10,0 % men draws 19,0 % — fortfarande platt; en starkare ratt köper bara mer comeback, aldrig färre draws). Landade på modesta 0,30 — fångar comeback-vinsten utan att jaga ett mål som inte rör sig.

## Dig-in: varför draws inte faller

Dekomponering av motorns draws (n=383): **71 % är "ledde vid HT men slutade lika"** — exakt populationen mekanismen riktar in sig på. Ren born-even-stall är 1 %. Så mekanismen träffar rätt population men löser inte problemet.

HT-ledningens utfall avslöjar varför:

| HT-ledning → | Motor | Verkligt |
|--------------|-------|----------|
| vinst | 74,3 % | 78,7 % |
| **oavgjort** | **17,0 %** | **~8 %** |
| förlust (comeback emot) | 8,6 % | ~13 % |

Motorns HT-ledare **slutar lika dubbelt så ofta** som i verkligheten (17 % vs 8 %) och förlorar för sällan (8,6 % vs 13 %). Momentum-efter-kvittering konverterar en del kvittering→draw till kvittering→vinst (därför stiger comeback), men post-paus + momentum hjälper samtidigt FLER underlägeslag att nå lika — inflödet till "kvitterat"-tillståndet växer i takt med utflödet till "vinst". Netto noll på draws.

**Rotorsaken ligger ett steg upp:** motorn upplöser inte jämna sena lägen decisivt nog. Verkligheten skiljer HT-ledare i vinst/förlust (mer avgörande); motorn parkerar dem på lika. Att stänga draw-gapet kräver en mekanism som gör jämna sena lägen mer avgörande (varians/decisiveness i slutskedet) — INTE mer hjälp till underlägeslag, som bara skapar fler kvitteringar.

Det är en separat mekanism från momentum-efter-kvittering och ska inte krankas in som en andra epicykel här. Hemmafördelens magnitud lämnades orörd (rätt — den är inte problemet).

## Status
- **Levererat:** post-paus (steg 1) + momentum-efter-kvittering (steg 2). Comeback 7,6 → 9,2 %, fönster 8,7 → 11,0 %, klustring 0,754 → 0,758 (mot mål 0,80). Regressionssäkert.
- **Öppet:** draw/hemvinst-gapet. Kopplingshistorien är ofullständig — draws faller inte av momentum-efter-kvittering. Nästa mekanism: decisiveness i jämna sena lägen, separat spec.

---

# Fas 2 steg 3 — decisiveness i jämna sena lägen

## Mekanism (tillståndsändring, ej konstant)
`lateFactor` rampar 0→1 över steg 44→56 (minut 66→84). I jämna/sena lägen löses tillståndet upp i stället för att vägas:
- **even_battle** öppnar upp sent (attack +0,60·lateFactor) — högvarians, någon faller ut som vinnare. Symmetriskt → comeback-neutralt.
- **controlling** (ledaren) öppnar upp sent (attack 0,88 → 1,28) — pressar för att avgöra i stället för att sitta. Comeback-neutralt (rör ledaren, ej chasern).
- **chasing** mild taper sent (1,22 → 1,10) — låter sena ledningar hålla till minimal comeback-kostnad.

Momentum-efter-kvittering (steg 2) ligger kvar och avgör *vem* som vinner upplösningen.

## Före/efter — fem mått + marginaler + tester

| Mått | Steg 2 | **Steg 3** | Verkligt |
|------|--------|-----------|----------|
| Oavgjorda (calibrate) | 0,170 ❌ | **0,125 ✅** | 0,116 |
| Oavgjorda (struktur-harness) | 18,5 % | **13,8 %** | 10,7 % |
| Hemvinst (calibrate) | 0,395 | **0,435** | 0,502 |
| Hemvinst (struktur) | 44,4 % | **46,7 %** | 50,9 % |
| Bortavinst (struktur) | 37,1 % | **39,5 %** | 38,4 % |
| HT-ledare: oavgjort | 17,0 % | **12,1 %** | ~8 % |
| HT-ledare: vinst | 74,3 % | **79,9 %** | 78,7 % |
| HT-ledare: förlust | 8,6 % | 8,0 % | ~13 % |
| Comeback bas | 9,2 % | 9,0 % | 13,3 % |
| Målklustring | 0,758 | 0,758 | 0,80 |
| Mål/match | 9,05 | 8,99 | 9,08 |
| Marginaler 047–050 | — | drawRate nu ✅, övriga oförändrade | — |
| Tester | 1078/1078 | **1078/1078** | — |

## Framgångssignaturen: UPPFYLLD (för draws/hemvinst)

**Draws föll och hemvinsten reste sig av sig själv — utan att hemmafördelens magnitud rördes.** Exakt det spec:en vaktade. drawRate gick från ❌ till ✅ på calibrate-harnessen (0,170 → 0,125). Hemvinsten självkorrigerade ~4pp (0,395 → 0,435 / 44,4 → 46,7 %). Bortavinsten landade på 39,5 % mot verkligt 38,4 %. HT-ledarens fördelning rörde sig mot verkligheten (oavgjort 17 → 12 %, vinst 74 → 80 % = verkligt 78,7 %).

## Residual (ärligt rapporterat)

Upplösningen gick mest **draw → ledarvinst**, inte draw → comeback. HT-ledarens förlustandel (comeback emot) står kvar på 8,0 % mot verkligt ~13 % — den rörde sig inte. Det är väntat: att göra sena lägen decisiva gynnar den som redan är före (oftast ledaren). Comeback-basen nickade ner ~0,2pp (9,2 → 9,0 %, inom brus men marginellt under vakt-punkten) p.g.a. den milda chasing-tapern.

**Testade alternativ (förkastade, ingen epicykel):**
- Tyngre chasing-taper (−0,34): draws 16,0 % men comeback 8,8 % — bröt vakt-punkten.
- Ingen chasing-taper: draws 15,1 %, comeback 8,8 % — sämre på båda (sena kvitteringar utan upplösning).
- −0,12 är bästa gemensamma punkten: max draw-fall till min comeback-kostnad.

## Status efter steg 3

Tre av fem mål i hamn eller nära: draws (✅ calibrate), hemvinst (självkorrigerad, närmar sig), HT-ledarfördelning (mot verkligheten). Klustring + marginaler + tester intakta. **Kvarstående residual:** comeback-basen (9,0 % vs 13,3 %) och HT-ledarens förlustandel (8 % vs 13 %) — comebacks som fullbordas är fortfarande för få. Det är den ursprungliga PRIO 2-resten; den kräver att fler kvitteringar fortsätter till vändning utan att återskapa draws, vilket är en finare avvägning än vad en enda spak når. Landar här per anti-överfit — ingen andra epicykel för att tvinga comeback exakt.
