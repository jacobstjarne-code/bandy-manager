# PM — Sirius-uppsatsen (Viking Nilsson, Uppsala 2023)

**Källa:** Viking Nilsson, *Sporten bandy beskriven genom sportanalys hos IK Sirius Bandy*. UPTEC STS 23004, examensarbete civilingenjör 30 hp, februari 2023. Handledare: Jonas Holgersson (Sirius). Ämnesgranskare: David Sumpter (Uppsala).

**Datatyp:** Manuell datainsamling från 18 Sirius-matcher (15 grundserie + 3 cup) hösten 2022. Tidsstämplade händelser med zon-position. ~170-300 datapunkter per halvlek.

**Status av PM:** Skissar konsekvenser för Bandy Managers matchmotor och kalibreringsmodell. Inga kodändringar föreslagna än — beslutsunderlag.

---

## TL;DR

1. **Skott på mål är starkare resultat-prediktor än corsi.** Lag med flest skott på mål vann 90% av halvlekarna, lag med flest skottförsök totalt vann 76%. Vår motor modellerar inte denna skillnad explicit.

2. **Bollinnehav har inget samband med resultat alls.** r=0.020 mot målskillnad. Detta motsäger fotbollsanalys men bekräftar bandy-tränarnas misstanke. Konsekvens: **bollinnehav ska inte vara en input till matchresultat-beräkning** i motorn.

3. **Skotttyper har drastiskt olika målprocent** — från 6% (utifrån) till 56% (friställande). Vi modellerar idag inte skottyp-skillnader mot xG. Mest påverkbar förändring för realism.

4. **Hörnornas höger/vänster-asymmetri** — vänsterhörnor 16.8% mål, högerhörnor 9.0%. Inte statistiskt säkerställt (n=283), men trenden är konsekvent över både Sirius och motståndare. Lågriskimplementation, hög upplevelse-effekt.

5. **Ute/inomhus är två olika spel.** Långa passningar 30.5/match utomhus vs 14.2/match inomhus. Dueller 120 vs 82. Vid dålig is: 156 dueller. Vår klimat/säsongssignatur "köldvintern" har stöd — kan utvidgas till "vinterspel-mode" som påverkar fler parametrar än bara tröttkurva.

6. **Uppsatsens N=18 är litet.** Rapportens egna confidence-intervall är breda. Bandygrytans 1124 matcher är vår större kalibreringsbas — Sirius-uppsatsen ger *kvalitativa* fynd som Bandygrytan saknar (skotttyper, dueller, ute/inne).

---

## 1. Skotttyper — den största kalibreringsmöjligheten

Uppsatsen kategoriserar alla avslut i sju typer (definierade tillsammans med Sirius tränarstab) och rapporterar målprocent per typ:

| Skottyp | Sirius mål% | Motst mål% | Snitt | Sample (S/M) |
|---------|-------------|-------------|-------|--------------|
| Friställande | 37.5 | 55.6 | **47.1** | 16/18 |
| Retur | 24.0 | 25.9 | **25.0** | 25/27 |
| Centralt anfall | 17.9 | 26.3 | **22.7** | 56/76 |
| Inlägg | 17.9 | 40.6 | **28.2** | 39/32 |
| Dribbling | 20.0 | 17.2 | **18.1** | 10/29 |
| Fast (mest hörna) | 9.2 | 16.1 | **13.1** | 119/149 |
| Utifrån | 6.0 | 5.8 | **5.9** | 199/171 |
| **Totalt** | 11.6 | 17.7 | — | 464/502 |

**Implications:**

- **Skott utifrån är 43% av alla skott men ger 6% mål.** Spelare i verkligheten ser långskott "leda till farliga lägen" (returer/hörnor) — det är där värdet sitter, inte i direktmål. **Vår motor bör modellera långskott-rebound-chance separat** om vi inte redan gör det.
- **Friställande lägen är 50× farligare än långskott** (47% vs 6%). I Counter/FreeKickInteraction har vi `outcome.type === 'goal'`-binärt — det räcker. Men i den sömlösa simuleringen (kontringar utan player-interaction) bör chanceQuality variera kraftigt med chanstyp.
- **Inlägg/centralt anfall** är ungefär lika farliga (~25%). Dessa två är det stora gråområdet — där tränaren skiljer "lyckad inläggsattack" från "centralt passningsspel" och spelarna ofta inte gör det.

**Kalibreringsförslag:** Lägg till skotttyp-multiplicator i `goalThresholdAttack`-formeln. Idag är det `chanceQuality * 1.20`. Förslag:

```
shotTypeMultiplier = {
  freeRunning: 4.0,    // 47% baseline → relativt mest farligt
  rebound: 2.1,
  centralBuild: 1.9,
  cross: 2.4,
  dribble: 1.5,
  fixedSituation: 1.1,
  longShot: 0.5,       // 6% baseline
}
```

Värdena är skalade så att totalsnittet matchar dagens måtfrekvens. Måste verifieras mot `calibrate_v2.ts` så total goals/match håller sig vid 9.12 (Bandygrytan).

---

## 2. Skott på mål är starkare prediktor än corsi (och bekräftar vår fokus)

| Metrik | Korrelation med målskillnad | Vinstprocent (>50% övertag) | Vinstprocent (>55% övertag) |
|--------|------------------------------|------------------------------|------------------------------|
| Skott på mål | r = 0.602 | 90% | 91% |
| Corsi (alla skottförsök) | r = 0.485 | 76% | 79% |
| Duellövertag | r = 0.458 | 32% | 69% |
| Bollinnehav | r = 0.020 | 44% | 45% |

p-värden för skott på mål ≪ 0.001 i båda regressionerna. Fynd robust trots litet N.

**Implication för vår motor:** Vi har idag inte skott-på-mål som separat metrik — vi modellerar `chanceQuality` direkt mot mål. Det är OK eftersom vår sluträkning är mål, inte mellansteg. Men:

- **Halvtidssammanfattningar och Granska-flöden** kunde visa "skott på mål" som meningsfull statistik. Det är den parameter spelare och tränare själva hänger upp prestation på, och uppsatsen visar att det är *den* prediktor som funkar.
- "Sirius haft 12 skott men bara 3 på mål" är en autentisk bandy-narrativ. Tränar-citat kan dra på "skotteffektiviteten" som det viktigaste. Idag pratar vi om "chanser" mer abstrakt.

---

## 3. Bollinnehav modellerar vi inte — och det är rätt

Uppsatsens nollhypotestest:

> Nollhypotesen mellan innehavsprocent och målskillnad kan inte förkastas (p = 0.903). Nollhypotesen mellan innehavsprocent och målprocent kan inte förkastas (p = 0.752).

Lag med >55% bollinnehav vann 45% av halvlekarna — exakt som lag under 50%. Fullständigt frikopplat från resultat.

**Implication:** Om någon framtida feature frestas modellera bollinnehav som spelstil-parameter ("Sirius spelar possession-bandy") så **ska det inte påverka resultat-beräkningen direkt**. Möjligen via skott-typer (en possession-spelstil kanske ger fler centrala anfall, färre långskott — då går effekten *via* shotTypeMultiplier, inte via bollinnehav direkt). Citerbart från Sirius tränare: "Sirius starka bollinnehav räddar dem inte från sjuksäsongen."

---

## 4. Hörnornas höger/vänster-asymmetri

| Sida | Sirius | Motst | Total |
|------|--------|-------|-------|
| Vänster | 13.7% (10/73) | 19.7% (15/76) | **16.8% (25/149)** |
| Höger | 5.4% (3/56) | 11.5% (9/78) | **9.0% (12/134)** |
| Båda | 10.1% | 16.2% | 13.4% |

Z-test: zSirius = 1.56, zMotst = 1.40 — under 1.96-tröskeln för 95% signifikans. Inte säkerställt med n=283.

**Men:** Trenden är konsekvent över båda lagen. Sannolik förklaring (uppsatsen spekulerar inte): högerfattade skyttar dominerar, hörnpassningen från vänster ger inkommande boll på framsidan av klubban för högerfattade — bättre skottyta. Detta är konsekvent över alla lag oavsett individ.

**Bandygrytan har inte denna data.** Vi vet bara totalt hörnmål-andel (22.2%, högre än Sirius p.g.a. snitt över hela ligan). Vi har idag ingen modell av hörnsidan.

**Implementeringsval:**

(a) **Inget** — under signifikans-tröskel, n litet, lämna.
(b) **Subtil viktning** — hörnor från vänster ger 1.2× hörnchans vs höger (mer realistiskt, lägger till variation utan att vara dramatisk).
(c) **Spelar-trait** — `leftFooted` / `rightFooted` på spelare påverkar vilken sida som är farligast för dem.

Min rek: **(b) som första steg, (c) som senare feature** om vi går mot rikare individuell modellering.

---

## 5. Ute vs inomhus — två olika spel

| Parameter | Inomhus | Utomhus (bra is) | Utomhus (dålig is) |
|-----------|---------|-------------------|---------------------|
| Långa passningar/match | 14.2 | 28.0 | 38.0 |
| Dueller/match | 82 | 109 | 156 |
| Närkamper i mittzon (4,5,6) | 48% | 45% | 50% |
| Närkamper i hörnzoner (1,3,7,9) | 22% | 28% | 19% |
| Domarbeslut | 2×45 | 2×45 | Ofta 3×30 |

**Implications för matchmotorn:**

- "Köldvintern"/"Skadekurvan" är säsongssignaturer som idag mest påverkar tröttkurva och skadefrekvens. Uppsatsen bekräftar att utomhusspel + dålig is **också** ändrar spelets karaktär: fler långbollar, fler dueller, mer mittzonsfokus. Det är inte bara "tuffare" — det är annorlunda taktiskt.
- **Möjlig utvidgning: `iceCondition`-parameter på matcher** med tre värden (`good`, `outdoor_decent`, `outdoor_poor`). Påverkar shotTypeMultiplier (mer fast/utifrån, mindre dribbling/centralt) och eventuellt matchlängd (3×30 ger annan stamina-modell).
- **Klubbprofiler:** De fyra utomhuslagen i Elitserien (varav Sirius är ett) har annan spelidé. Sirius tränare i citatet: *"i sin förberedelse skiljer man inte på hemma- och bortamatcher, utan istället inne- och utematcher."* Vi modellerar idag inte detta i klubbarnas grundparametrar.

---

## 6. Närkampsspel — paradoxal signal

Två fynd som motsäger naiv intuition:

1. **Lag som "vinner närkamper" har oftast inte bollen.** Det bollförande laget tappar bollen i 4 av 5 närkampssituationer. Att vinna många dueller ≈ man har ofta varit i underläge.
2. **Duellövertag på 50% korrelerar negativt med vinst** (Sirius 24% vinstprocent vid >50% duellseger). Först vid >55% blir samband positivt (60% vinstprocent).

Uppsatsens jämförelse med "blocked shots leads to losing in NHL"-paradoxen är välplacerad. Avancerad statistik visar ofta att till synes positiva insatser har negativa eller noll-korrelationer.

**Implication för matchmotorn:**

- Vår `winLooseDuelChance` eller motsvarande (om den finns) ska *inte* skala linjärt mot resultat. Domestically: lag som vinner massor av närkampar i defensiv zon är förmodligen lag som ofta är i defensiv zon. Det är *positionsdata* som är resultat-prediktor, inte närkampskvot.
- **Närkampsdata i offensivt straffområde** (zon 8 för anfallande lag) hade extremt låg korrelation med mål: r=0.071. Tränarna trodde det var avgörande, datan säger nej. Bra exempel på fynd som motsäger expert-intuition.
- För Bandy Manager: spelarens `tackling`-stat ska ge defensiv värde **bara där det placeras** (vilket vi förmodligen redan modellerar via positionsroller). Inte ett globalt `tackling`-bidrag till matchresultat.

---

## 7. Mål per spelform — frislag och straffar är rena ceremoni

| Spelform | Sirius | Motst | Total | Andel |
|----------|--------|-------|-------|-------|
| Spelmål | 41 | 62 | 103 | 72.0% |
| Hörnmål | 13 | 25 | 38 | **26.6%** |
| Straffmål | 0 | 2 | 2 | 1.4% |
| Frislagsmål | 0 | 0 | 0 | 0.0% |

**Bandygrytan-jämförelse:** Vår kalibreringsdata har `cornerGoalPct: 22.2%` (snitt 1124 matcher). Sirius-uppsatsen visar 26.6%. Skillnaden 4.4 pp — sannolikt sample-variation (Sirius hade hög andel hörnmål just denna säsong, ligger i högsta percentilen). Vår kalibrering på ~22% är rimlig för långtidssnitt.

**Frislagsmål är faktiskt 0/143.** Vår motor genererar förmodligen frislagsmål oftare än så. Bör verifieras: hur ofta ger `FreeKickInteraction` mål idag?

**Penalties:** 2/143 = 1.4%. Bandygrytan: `penaltyGoalPct: 5.4%` (avser straffmål-andel av totala mål). Skillnaden här kan vara att Sirius hade få straffar tilldömda denna säsong (n=18), eller att vår siffra inkluderar fler. Värt att verifiera mot rådata.

---

## 8. Konkreta kalibreringssiffror som kan importeras

För `bandygrytan_calibration_targets.json` eller motsvarande:

```json
"siriusUppsats2022": {
  "_meta": {
    "source": "Nilsson 2023, UPTEC STS 23004",
    "n": 18,
    "season": "2022-23 hösten",
    "league": "Elitserien Herr",
    "caveat": "Single-team data (Sirius), small N. Use as qualitative reference, not primary calibration."
  },
  "shotTypeGoalRates": {
    "freeRunning": 0.471,
    "rebound": 0.250,
    "cross": 0.282,
    "centralAttack": 0.227,
    "dribble": 0.181,
    "fixedSituation": 0.131,
    "longShot": 0.059
  },
  "shotsOnTargetWinPct": 0.90,
  "corsiWinPct": 0.76,
  "possessionResultCorrelation": 0.020,
  "duelOvertagThresholdForWin": 0.55,
  "cornerGoalRateLeftSide": 0.168,
  "cornerGoalRateRightSide": 0.090,
  "longPassesPerMatchIndoor": 14.2,
  "longPassesPerMatchOutdoor": 30.5,
  "longPassesPerMatchOutdoorBadIce": 38.0,
  "duelsPerMatchIndoor": 82,
  "duelsPerMatchOutdoor": 120,
  "duelsPerMatchOutdoorBadIce": 156
}
```

---

## 9. Vad uppsatsen INTE adresserar (våra blindspots kvarstår)

- **xG-modell för bandy.** Uppsatsen skapar en *primitiv* xG från skotttyper men nämner att en riktig xG-modell behöver avstånd, vinkel, försvarspositioner. Vi har inget av detta.
- **Spelarsspecifik prestationsdata.** Uppsatsen kollar bara lag-aggregat. Hur skiljer sig spelare? Vår motor har individuella stats — uppsatsen ger ingen kalibrering där.
- **Klubbtillfredställelse / fan-engagemang.** Uppsatsen är ren spelanalys. Vår "ortens stöd"-dimension har inget stöd här.
- **Långsiktig formkurva.** 18 matcher räcker inte för att se säsongsdynamik. Bandygrytans 1124 matcher är fortfarande vår bättre referens där.

---

## 10. Förslag på handling

**Kortsiktigt (lågt arbete, hög effekt):**

1. **Skotttyp-modell** i `matchCore.ts` — implementera shotTypeMultiplier på `goalThresholdAttack`. Estimat: 4-6h plus calibrate-iteration. Stöd även narrativt — vi får "Holmqvist sätter ett klockrent friläge" vs "skottet utifrån från 25 meter går in" som skiljer sig på chans.
2. **Halvtidssammanfattning visar skott på mål** som primärt prestationsmått (om vi inte redan gör det). 1-2h.
3. **Frislagsmål-frekvens** — verifiera och eventuellt nedjustera `FreeKickInteraction` målchans. Om vår modell ger 5%+ mål från frislag är det 5×+ verkligheten. 1h verifiering.

**Medellångt:**

4. **Hörnsidor** — implementera höger/vänster-skillnad i `cornerService` om sådan finns. 3-4h.
5. **Ice-condition-parameter** — utöka säsongssignaturer eller införa per-match weather/ice-state som påverkar shotTypeDistribution. 6-8h.

**Långsiktigt:**

6. **Egen datainsamling.** Uppsatsens metod (manuell datainmatning från TV-sänd match) är replikerbar. Kodbasen finns på GitHub (länkad i uppsatsen). En person × en match × ~110 minuter = 200-300 datapunkter. **Sex matcher från olika lag/arenor skulle komplettera Bandygrytan kraftigt.** Kanske kan elit-bandycoach-mötet du har på horisonten leda till tillgång till liknande data.

---

## 11. Citerbart i Bandy Manager

För framtida tränar-/journalist-citat eller utbildande tooltips:

> "Skott på mål är resultat-indikatorn som funkar — corsi och bollinnehav säger mindre."
> 
> "Skott utifrån är 43% av alla avslut men ger 6% mål. Det är de andra skotten som avgör matcher."
> 
> "Hörnornas höger-vänster-skillnad har bandyspelare diskuterat länge. Sirius-data 2022 visar 17% mål från vänster mot 9% från höger."
> 
> "Utomhus är ett annat spel. Dubbla mängden långbollar, hälften så mycket centralpassning."

---

## 12. Caveats

- **n=18 matcher, ett lag, en säsong, en datainmataren** (uppsatsförfattaren själv). Subjektiv bedömning av närkampssituationer specifikt erkänns i rapporten.
- **Sirius hade extrem formsvacka** under datainsamlingsperioden (5V-1O-12F i 18 matcher). Det kan snedvrida vissa ratios. Uppsatsen erkänner detta och flaggar att den dåliga utdelningen kan vara orsak eller verkan.
- **Videokvalitet på TV-sändningar** var problem — vissa fall där hörnskott "täckts ut vs missat målet helt" är osäkert. Detta påverkar främst skott-på-mål-ratio mer än skott-totalt-ratio.
- **Inläggsskotten har ovanligt hög effektivitet hos motståndare (40.6%)** vilket är dramatiskt högre än andra studier. Kan vara Sirius-specifik defensiv-svaghet snarare än bandy-generellt.

---

## Bilaga: GitHub-länk

Uppsatsen länkar till en publik GitHub med all Python-kod, datainmatning, och två exempelrapporter (PowerPoint match + säsong). URL nämns i abstract men inte explicit i texten — om du vill jag fetchar den separat så kan jag försöka.

---

*Senast uppdaterad: 2026-05-06.*
