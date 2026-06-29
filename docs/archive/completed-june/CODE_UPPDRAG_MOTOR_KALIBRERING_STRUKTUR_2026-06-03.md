# CODE-uppdrag: Motor-kalibrering mot struktur

**Skapad:** 2026-06-03
**Beställare:** Jacob (Opus)
**Beroende:** Kör KLUBBNAMNS-NORMALISERING först — tre av målen nedan (temperatur, hemmafördel, stil) bygger på 053/054-siffror som uppdateras av normaliseringen.
**Tidsbudget:** Stor. Fasa den. Fas 1 (mätning) ~4–6h. Fas 2 (kalibrering) separat.

---

## Insikt som motiverar uppdraget

Motorn är kalibrerad mot **marginaler** (mål/match, hörnmålsprocent, hemmafördel, foulfrekvens — se findings 047–050) men aldrig mot **struktur**: när målen kommer, om de klustrar, vilka matchups som hettar upp, hur hemmafördelen varierar mellan lag. Allt vi grävt fram i verklig data den här omgången är strukturellt. En naiv simulator träffar marginalerna men spricker på strukturen. Det här uppdraget mäter var.

## Princip (läs först)

Det här är **mätning före tuning**. Fas 1 mäter gapet mellan motor och verklighet. Tuning (Fas 2) sker separat och först efter att gapet är dokumenterat. Tuna inte i samma svep som du mäter.

Ett "boring" resultat — motorn återger verkligheten — är ett **bra** resultat: det validerar både motorn och metoden. Divergenser är kalibreringsmål, inte misslyckanden. Fabricera ingen divergens; rapportera träffar lika ärligt som missar. Överfitta inte mot en enskild strukturmetrik så att redan kalibrerade marginaler förstörs.

## Fas 1 — mät gapet

Kör motorn i skala (matcha det verkliga datasetets struktur — serielängd, antal lag, säsonger) och extrahera samma metriker som verklig-data-fynden. Per testfall: verkligt värde, motorvärde, gap, prioritet.

**Testfall (prioritetsordning):**

1. **Målklustring / momentum — PRIORITET.** Verkligt: ≥2 mål inom 5 min sker 0,57–1,18 ggr/match beroende på stil (Finding 054). Mät samma i simulerade matcher. En motor som drar mål som oberoende Poisson-händelser ger för få skurar. Detta är det viktigaste fyndet för hur spelet *känns* — momentum, comebacks, "nu rullar det". Om motorn saknar klustring känns matcherna mekaniska oavsett rätt totalsiffra.
2. **Post-paus-reset (Finding 051).** Verkligt: comeback-basfrekvens 13,3 %, men 27 % i rådata-minut 51–55 (6–10 min in i 2H), 39 % vid ett måls underläge. Mät comeback-frekvens per minutfönster i sim med half-flaggan. Ger motorn en halvtidsåterställning? En uniform modell gör det inte.
3. **Matchup-temperatur (Finding 053).** Verkligt: 3,8× spridning i foulfrekvens mellan matchups (7,0 vs 1,75). Producerar motorn matchup-specifik foul-variation eller ger den varje möte ligasnittet?
4. **Lagspecifik hemmafördel.** Verkligt: dominanta lag (Villa) ~ingen hemma/borta-skillnad (82,7 % / 83,9 %), snittlag (Sirius) har det (53 % / 50 %). Modellerar motorn en uniform hemmaboost eller en lagspecifik?
5. **Stil som kontinuum (Finding 054).** Får simulerade lag variera längs omställning–hörnberoende-axeln (cluster_freq 1,18 vs 0,57, hörnmålsandel 19,3 % vs 23,6 %), eller spelar alla likadant?

## Fas 2 — kalibrera (separat, efter Fas 1-rapport)

Adressera de dokumenterade gapen i prioritetsordning, ett i taget, och verifiera efter varje ändring att marginalerna (047–050) fortfarande håller. Klustringen först.

## Vad Code INTE ska göra

- Inte tuna innan gapet är mätt och rapporterat.
- Inte överfitta mot en strukturmetrik på bekostnad av kalibrerade marginaler.
- Inte använda `minute >= 46` — half-flaggan gäller även i sim-analysen.
- Inte rapportera en träff som en miss för att den vore mer intressant.

## Output

- Fas 1: kalibrerings-scorecard i `docs/data/` — per strukturmetrik: verkligt värde, motorvärde, gap, prioritet.
- Valfritt: en Bandy Brain-finding "så väl återger motorn verklig målstruktur" (ärlig, oavsett utfall).
- Fas 2: dokumenterade motorändringar med före/efter mot både struktur och marginaler.

## Rapportering

Rapportera Fas 1 som en scorecard först. Den intressanta frågan: vilka strukturella drag återger motorn redan (validering), och var är de största gapen (kalibreringsmål)? Klustringen är huvudnumret.
