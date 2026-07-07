# A7 — Publik × hemmafördel (dam-gåtan)

**Analys:** ANALYSSPEC A7. **Utförare:** Code. Fable skriver finding.

## Grind-utfall: EJ PASSERAD — stannar vid täckningsrapport

Spec-grinden kräver dam-täckning ≥ 50% för att köra kvartilanalysen (steg 2). **Dam-täckningen är 20.3%** → steg 2 körs **inte**. Denna rapport är steg-1-täckningsredovisningen, som spec:en föreskriver som stopppunkt.

## Täckning per serie

| Serie | Täckning | Publik median | Publik spann |
|---|---|---|---|
| Herr | 456/1321 = 34.5% | 942 | 134–12648 |
| Dam | 87/428 = 20.3% | 184 | 101–4735 |

## Täckning per säsong

| Säsong | Herr | Dam |
|---|---|---|
| 2019-20 | 64% (139/216) | 33% (22/67) |
| 2020-21 | 0% (1/214) | 0% (0/77) |
| 2021-22 | 60% (174/291) | 40% (32/81) |
| 2022-23 | 68% (142/208) | 36% (33/91) |
| 2024-25 | 0% (0/182) | 0% (0/56) |
| 2025-26 | 0% (0/210) | 0% (0/56) |

Huvudsakliga hål: COVID-säsongen 2020-21 (tomma arenor) och de två senaste säsongerna (2024-25, 2025-26) där scrapern inte fångade publiksiffror.

## Varför dam-gåtan inte kan mekanismtestas här

Finding 056: damserien saknar nästan hemmafördel. A7 skulle testa publik som mekanism. Men dam har bara 87 matcher med publikdata (20.3%), och 0% för de två senaste säsongerna — för glest för en kvartilbaserad hemmavinst-jämförelse dam vs herr.

**Deskriptiv observation (ej test):** dam-medianpublik **184** mot herr **942** — dampublik är ungefär en femtedel av herr. Det är *förenligt* med hypotesen att liten publik ger svag hemmafördel (Finding 056), men det är en samvariation på gruppnivå, inte ett mekanismtest. Att göra det till ett test kräver publikdata på matchnivå för fler dammatcher än datan har.

## Vad som skulle krävas för steg 2

- Dam-publik på matchnivå med ≥50% täckning (helst jämnt över säsonger).
- Då: hemmavinst% per publikkvartil, dam vs herr, som direkt mekanismtest av Finding 056:s hemmafördels-gap.

## Begränsningar

- Herr-täckning (34,5%) skulle räcka för en herr-INTERN publik→hemmafördel-titt, men A7:s fråga är dam-gåtan (jämförelsen), som grinden stoppar. En herr-only-körning är en separat fråga — kan beställas, men är inte A7.
- 2023-24 saknas helt i datan (utöver publik-hålen ovan).
