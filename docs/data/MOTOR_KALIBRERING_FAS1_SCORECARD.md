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
