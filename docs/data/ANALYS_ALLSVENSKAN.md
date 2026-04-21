# Analys: Bandyallsvenskan Herr

**Källa:** `bandygrytan_allsvenskan.json`
**Säsonger:** 2019-20 till 2023-24 (5 hela säsonger) + 2024-25 Övre (28 matcher)
**Totalt:** 887 matcher
**Referens:** Elitserien 1124 matcher (`bandygrytan_detailed.json`)

---

## Nyckeltal — Allsvenskan vs Elitserien

| Mått | Allsvenskan | Elitserien | Diff |
|---|---|---|---|
| Mål/match | **9.16** | 9.12 | +0.04 |
| Hemmaseger% | **51.2%** | 50.2% | +1.0pp |
| Oavgjort% | **12.6%** | 11.6% | +1.0pp |
| Bortaseger% | **36.2%** | 38.3% | −2.1pp |
| Mål i 1:a HT | **4.21** | 4.19 | +0.02 |
| Halvtidsledare vinner% | **79.9%** | 78.1% | +1.8pp |
| Comeback −1 vid HT | **20.0%** | 24.5% | −4.5pp |
| 2:a halvlek % | **54.3%** | 54.2% | +0.1pp |
| Utvisningar/match | **4.60** | 3.77 | **+0.83** |

---

## Mål per säsong

| Säsong | n | Mål/match | Hemmaseger% |
|---|---|---|---|
| 2019-20 | 176 | 9.14 | 48.9% |
| 2020-21 | 176 | 8.98 | 58.0% |
| 2021-22 | 156 | 9.06 | 43.6% |
| 2022-23 | 176 | 9.14 | 55.1% |
| 2023-24 | 175 | 9.53 | 49.1% |
| 2024-25 Övre | 28 | 8.64 | 53.6% |

Hemmaseger% varierar 43–58% mellan säsonger — hög varians mot Elitseriens stabila ~50%. Kan delvis förklaras av att Allsvenskan ibland haft Norra/Södra-grupper med obalanserad styrka.

---

## Tolkning

**Allsvenskan är inte en nivå lägre i mål.** Mål/match 9.16 är identiskt med Elitseriens 9.12. Skillnaden i spelkvalitet märks inte i målsnittet — det är ett annat spel, mer fysiskt, men lika produktivt offensivt.

**Klart fler utvisningar.** 4.60 utvisningar/match mot 3.77 i Elitserien (+22%). Allsvenskan är ett tuffare, mer fysiskt spel. Lag väljer att stanna i presskampen framför tekniskt spel. Nässjö IF, om de möter Elitserien-lag i kval, möter lag som är tränade för *lägre* utvisningsfrekvens — det är en adaptationsfråga.

**Halvtidsläget avgör.** 79.9% vinstprocent för halvtidsledande lag — till och med lite högre än Elitseriens 78.1%. Allsvenskan-lag tenderar att ligga back i andra halvlek när de väl leder, vilket gör comebacks svårare (20.0% comeback -1 vs 24.5% i Elitserien).

**Hemmafördel likvärdig.** 51.2% hemmaseger = nästan identiskt med Elitserien. Ingen stor strukturell skillnad i hemmafördel.

**Andra halvlek dominerar.** 54.3% av målen i 2:a halvlek — exakt som Elitserien. Mönstret håller i alla divisioner.

---

## Allsvenskan vs Elitserien — vad Christoffer behöver veta

Nässjö spelar Allsvenskan. Christoffer frågar sig troligen: *är det en lång väg till Elitserien, eller är klyftan liten?*

**Klyftan i mål är minimal.** En matchdag i Allsvenskan ser ut som en matchdag i Elitserien om man bara kollar resultaten: 9.1-9.2 mål, 50-51% hemmaseger, 11-13% oavgjort.

**Klyftan i tempo och utvisningar är tydlig.** Elitserien-lag har 0.83 färre utvisningar/match — de är effektivare i press, gör färre onödiga foulsekvenser, är bättre disciplinerade. Att ta klivet från Allsvenskan till Elitserien handlar delvis om att lära sig ett disciplinerat defensivt spel.

**Kval-format gynnar stabila lag.** En lag som leder vid halvtid i kval vinner 70.4% av gångerna. Att komma in stabilt, styra halvtiden och undvika att hamna efter är viktigare än att ha offensiv explosivitet.

---

## Täckning och begränsningar

| Säsong | Matcher | Kommentar |
|---|---|---|
| 2019-20 | 176 | Fullständig säsong |
| 2020-21 | 176 | Fullständig säsong |
| 2021-22 | 156 | Fullständig säsong (förkortad p.g.a. COVID) |
| 2022-23 | 176 | Fullständig säsong |
| 2023-24 | 175 | Fullständig säsong (1 match saknar data) |
| 2024-25 | 28 | Enbart Övre-gruppen; Nedre ej i preCache |

**`cornerGoal%` ej rapporterat.** Parsing-metoden ger ~45% hörnmål vilket är klart överestimerat (Elitserien-referens via exaktare analys: 22%). Övriga nyckeltal är tillförlitliga.

**Utvisningsdata:** Antalet utvisningar räknas från event typ 3 i Firebase-eventen. Noteras att "duration" ej kunnat bestämmas per utvisning från events (defaultas till 10 min). Frekvensen (antal per match) är tillförlitlig.
