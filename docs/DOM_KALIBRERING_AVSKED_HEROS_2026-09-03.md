# DOM — KALIBRERINGSRUNDAN: AVSKED, HEROS OCH MOTORNS AVVIKELSER

**Datum:** 2026-09-03 · **Dömt av:** Jacob (målet) · **Skrivet av:** Opus · **Bygger/mäter:** Code · **Underlag:** GPT:s 10-säsongskörning (export väntas), `h5-renommetak-matning`, `bandygrytan_detailed.json`, MASTER:s kalibreringsrader.

## Domen i en rad

**Heros ska sparkas i ~60 % av sexsäsongskarriärer.** Inte 100 %. Hundra procent är inte hard mode, det är en skriptad förlust — och sex fixar har inte rubbat det, vilket betyder att felet inte ligger i någon enskild konstant utan i hur flera system staplar. Målet är ett tal att kalibrera mot, inte ett löfte om exakt sextio.

**BASLINJEN FLYTTAD 2026-09-04 kväll (systemauditen, MASTER `survive-avsked-undantag`):** `Survive`-tier hade absolut immunitet mot sportsligt avsked — avskedskontrollen kördes bara för andra tiers. Heros, Söderfors, Lesjöfors (alla Survive) kunde därför bara förlora via licensnekan eller konkurs. Konsekvens: **"100 % avsked" var 100 % licensnekan**, och H4-klippan vid CS 70/71 är sannolikt en LICENSKLIPPA (ekonomi → riskScore → denied), inte en tålamodsklippa. Codex öppnade samma dag en sportslig väg för Survive (tre raka misslyckade säsonger + patience ≤ 15; Jacob kvitterar). Rundan måste därför: (a) köra baslinjen OM med den nya gaten, (b) separera avskedsorsak i mätningen — licens / sportsligt / konkurs — och rapportera per orsak, (c) läsa A-spåret som TVÅ kedjor: licenskedjan (ackumulator, ryktesskala, ekonomi) och tålamodskedjan (den nya gaten, boardPatience, meritbuffert). GPT:s tre SVÅR-karriärer utan avsked (Heros, Slottsbron, Rögle 11–11–9) är bevis på den gamla gaten, inte på balansen.

## Varför en runda och inte fjorton domar

MASTER bar ~20 rader märkta "vänta Jacobs magnituddom" — licens-ryktesskalan, ackumulatorn, boardPatience-skalan, meritbufferten, golv-andelen, förnyelsepriset, H4-klippan, midtable-mislabelingen, Heros-frågorna, motorns targets. Ingen kan dömas isolerat: de är samma systems parametrar, och att flytta en flyttar de andra. De har stått som "Jacob" för att ingen ville äga dem. Nu ägs de av rundan.

## Omfattning

**A. Avskedskedjan (huvudspåret).** Mot målet 60 % för Heros över sex säsonger, med 10 000-seeds-mätning som redan finns som mönster:
- `RUNNING_LOSS_EXPECTATION_MULTIPLIER`-skalan (`boardpatience-skala-kalibrering`) — siffrorna var en linje genom två punkter; mät om.
- `licenseRiskScore`-ackumulatorns magnituder (`h4-ackumulator-magnituder`).
- Licenskaskadens ryktesförlust `5 + deficitDepth/50000*5` (`sluttest-licens-ryktesskala`) — förslag, blir dom i rundan.
- Meritbuffertens konstanter (`inv-4-meritbuffert-magnituder`).
- H4-klippan cs 70/71 (`sluttest-klippan-rotorsak`) — rotorsaken är okänd efter fyra fixar; rundan får hitta den eller visa att klippan är en artefakt av något annat ovan.
- Midtable-mislabelingen Söderfors/Lesjöfors 85–90 % (`midtable-mislabeling`) — samma formel, samma runda.
- Heros licensnekan (`sluttest-heros-licensnekan`) och designfrågan (`sluttest-heros-designfraga`) — den senare är nu dömd: avsiktligt svår, inte avsiktligt dödsdömd.

**B. Två unifieringar (samma sjuka, egna fixar).**
- `generateAttributes` vs `generateYouthAttributes` — två oberoende formler, ~30 % gap för Heros (`youth-vs-senior-attributformel`). Unifiera till en formel med ålderskurva. Det påverkar A direkt: en trupp som är 30 % svagare än den borde vara sparkar tränaren oavsett tålamodsformel.
- `pickArchetype`-dubbletten (`sluttest-dubblett-pickarchetype`) — världsgenererade och akademispelare får olika arketypfördelning omedvetet. Unifiera.

**C. Motorns avvikelser (små, i samma pass).**
- **Fixa:** momentum mean-reverterar (utökningsgrad 47,7 % sim mot 55,0 % verkligt) — `EQUALIZE_MOMENTUM` boostar fel lag (`c-m3-momentumriktning`). Största motoravvikelsen, och den gör spelet tråkigare än verkligheten.
- **Mjuka:** `MATCH_TOTAL_GOAL_CAP = 17` ger 3,7 % matcher på exakt 17 (`c-m2-malkap-spike`) — synligt för den som tittar. Höj eller gör mjuk.
- **Acceptera som inom tolerans:** hörnor −5,2 % (`c-m2-hornfrekvens`), HT2 −1,8 pp (`c-m2-ht2-andel`), `MATCH_GOAL_DIFFERENCE_CAP = 6` (`c-m3-capartefakt`, medvetet), utvisningar 2,61 mot 3,77 (`sluttest-utvisningar-kalibrering` — verklig skuld men inte den här rundan; egen rad kvar).

**C2. Taktik-spak (tillagt 2026-09-03 efter GPT:s taktiktest, 35 matcher).** Tre samverkande fynd, samma mätning:
- **Kombinationskostnad** (`taktik-ultra-kombinationskostnad`): offensiv + högt tempo + hög press + direkt spel + smalt + aggressiva hörnor vann 4 raka 29–17 och överlevde snövarning och trötthet; bröts bara av serieettan. Verifiera om axlarna är rent additiva. Stapling ska kosta: kondition, utvisningsrisk, sena insläpp. Kanon §4: högt press är situationsbundet i bandy — att det håller en hel serie är fel mot sporten.
- **Positionsstraffet** (`taktik-positionsfarger-kosmetiska`): en 4–2–4 med få naturliga anfallare vann ändå regelbundet. Mät CA-rabatten för felplacerad spelare mot vad de offensiva axlarna ger — om staplingen överröstar straffet är positionsfärgerna kosmetik.
- **Trötthetskurvan** (`taktik-trotthet-klippa`): 24–39 % "ingen påverkan", <22 % hård spärr. Verifiera om mellanbandet påverkar något alls; gör kurvan gradvis (prestation, skaderisk, återhämtning). Samma kurva för spelarens autofyll och AI:ns (`c-ft1-fitnessfloor-tuning`). **Källstyrd form (2026-09-04, BANDYTAKTIK_KALLASNING §6):** Johansson m.fl. 2021 — sen trötthet minskar högfarts-/sprintarbete men INTE explosiva toppar; Persson m.fl. 2020 — offensiva roller byts oftare och sliter i höga farter, defensiva spelar längre och längre. Alltså: kurvan ska sänka uthållighetsdrivna bidrag (initiativ/attack-vikt över tid, press-effekt) före de explosiva (avslut, hörnkonvertering), och trötthetsackumuleringen ska skilja rollerna — mittfält/anfall snabbare vid högt tempo/press, femman bak långsamt men utan vila. Riktning ur källan, tal ur mätningen.

Godkänt för C2: ett paket av tre+ offensiva axlar ska FÖRLORA mot ett balanserat upplägg av samma trupp över 22 omgångar minst lika ofta som det vinner (ingen dominant standardtaktik i serien), samtidigt som det förblir det starkaste valet i enskilda matcher där kontexten stöder det (utvilad trupp, svagare motstånd, matchinledning). Mot topp-motstånd ska det straffas hårdare än idag. Mät med `analyze-stress`/kalibreringsskripten över 10 000 seeds, fyra motståndsnivåer, två väderlägen.

**D. Ekonomins två öppna tal.** Golv-andelen 50 % (`askadare-golvandel-generellt`) och förnyelsepriset (`fornyelse-pris-slutdom`, Opus rek: låt stå). Mäts i rundan eftersom de påverkar A för små klubbar; ändras bara om mätningen kräver det. **D2 (tillagt 2026-09-04, GPT:s akademitest):** tvåsäsongssolvens med akademi på Satsning (5 tkr/omg) + normala beslut + sponsorer + mecenat — GPT gick 340→60→−258 tkr i Hälleforsnäs. Godkänt: antingen solvent över två säsonger för en MEDEL-klubb, eller så utlöser den kritiska ekonomivägen synligt innan kassan passerar −100 tkr. Mät för LÄTT/MEDEL/SVÅR. Om Satsning är oförsvarbar för MEDEL är det priset som ska ner eller utfallet upp — inte årsbokens text.

## Metod

1. **Vänta på GPT:s export** (`docs/playtest/karriar_*_10sasonger.json`). Kör `analyze:firing-frequency` och `analyze:choice-entropy` på den. Det är den enda verkliga karriären vi har — ett ankare mot simuleringarna.
2. **Baslinje:** kör h5-/H4-mätningarna som de står, 10 000 seeds, Heros + Söderfors + Lesjöfors + en topp-klubb. Skriv ner avskedsfrekvens per säsong per klubb. Ingen ändring förrän baslinjen är dokumenterad.
3. **B först.** Unifiera attributformlerna och pickArchetype. Mät om. Det är sannolikt att en stor del av Heros-problemet försvinner här — en 30 % svagare trupp än avsedd förklarar mycket.
4. **A därefter,** en parameter i taget, mot 60 %. Stanna när Heros ligger 55–65 % och Söderfors/Lesjöfors under 50 %. Rapportera vad varje steg gjorde, inte bara slutläget.
5. **C sist.** Momentum och målkap är oberoende av A och kan gå parallellt om Code vill.
6. **Rapport:** `RAPPORT_KALIBRERING_2026-09-XX.md` med baslinje, varje steg, slutläge, och vilka MASTER-rader som därmed stängs.

## Godkänt när

Heros 55–65 % avskedad över sex säsonger (10 000 seeds). Söderfors/Lesjöfors under 50 %. En topp-klubb med WinLeague-förväntan sparkas inte för en trea. Momentum-utökningsgrad inom ±3 pp av 55 %. Ingen match-spike på målkapet. Alla tester gröna. Och — viktigast — GPT:s riktiga karriär motsäger inte simuleringen.

## Vad rundan inte får göra

Inte röra 0,0086 (sponsor). Inte röra tröghetsmekaniken från DOM_BOARDEXPEKTAN_TROGHET annat än dess tal. Inte lägga till nya system — det här är kalibrering av det som finns. Inte kalla något klart utan mätning.

## Ägarskap

**Jacob:** har dömt målet. Kvitterar rapporten.
**Opus:** äger rundan, läser rapporten, dömer om 60 % är rätt eller ska justeras efter första omkörningen.
**Code:** mäter, unifierar, kalibrerar, rapporterar. Startar med steg 1–2 så snart GPT:s export finns; steg 3 (B) kan börja redan nu utan exporten.
