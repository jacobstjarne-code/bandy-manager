# Matchmönsteranalys — Elitserien Herr 2019–2026
**Källa:** 1 124 reguljära herrmatcher, bandygrytan.se  
**Datum:** 14 april 2026

---

## 1. Comeback-frekvens

| Halvtidsunderläge | n    | Vänder | Oavgjort | Förlorar |
|-------------------|------|--------|----------|----------|
| −1                | 375  | 24.5%  | 13.9%    | 61.6%    |
| −2                | 210  | 11.0%  | 9.0%     | 80.0%    |
| −3                | 163  | 3.7%   | 3.1%     | 93.3%    |
| −4+               | 159  | 1.3%   | 0.0%     | 98.7%    |

**Motorsimplikation:**
- `getSecondHalfMode()` med `'chasing'` är realistisk vid −1 men bör ha lägre comeback-sannolikhet vid −2 och −3.
- Vid −3 i HT är chansen att vända i princip noll (3.7%). Narrativet bör spegla det — `'desperate'`-läge, inte `'chasing'`.
- `acceptResult`-alternativet i LastMinutePress känns trovärdigt: 80% av lagen som ner 2 vid HT förlorar ändå.

---

## 2. Första-mål-effekten

| Utfall för laget som gör första mål | Andel |
|--------------------------------------|-------|
| Vinner                               | 61.6% |
| Oavgjort                             | 11.6% |
| Förlorar                             | 26.9% |
| Matcher som slutar 0-0               | 0 (0%)  |

**Notera:** 0 av 1 124 matcher slutade 0-0. Bandy är ett högmålsspel — målvakter är sämre.

**Jämförelse fotboll:** Fotboll ~70% vinner som gör första mål, ~18% oavgjort, ~12% förlorar.

**Motorsimplikation:**
- Bandy är MINDRE "first goal wins" än fotboll (61.6% vs ~70%).
- Förklaras av högt målantal — det är lättare att komma ikapp i bandy.
- Motor-konstanten `homeAdvantage = 0.14` bör INTE synas i comeback-frekvensen. En 1-0-ledning är inte lika trygg som i fotboll.

---

## 3. Utvisningstidens fördelning

**Totalt:** 4 233 utvisningar, 3.77/match (bekräftar kalibrering)

| Period   | Andel | Kommentar               |
|----------|-------|-------------------------|
| 0–10'    | 4.5%  | Lugnt öppningsspel      |
| 10–20'   | 6.6%  |                         |
| 20–30'   | 8.5%  |                         |
| 30–40'   | 9.7%  |                         |
| 40–50'   | 11.8% | Halvtidsjakt ↑          |
| 50–60'   | 10.0% |                         |
| 60–70'   | 11.6% |                         |
| 70–80'   | 12.5% |                         |
| 80–90'   | 16.5% | Slutryck → fler brott ↑ |
| 90+'     | 8.3%  | Övertid/förlängning     |

**Ställnings-korrelation:**
- Utvisningar när laget **leder:** snitt minut 60.2 (sent i matchen)
- Utvisningar när laget **ligger under:** snitt minut 59.0 (sent i matchen)
- Utvisningar vid **jämnt:** snitt minut 42.2 (tidigt/halvtid)

**Motorsimplikation:**
- Motorn bör vikta utvisningssannolikheten högre i minuterna 70–90.
- Ledande lag tenderar att spela hårdare sent → bekräftar "foul to stop counter"-mönster.
- `TIMING_WEIGHTS` för suspensioner bör ha en klart högre bucket för 80–90'.

---

## 4. Hörnmål vs spelläge

| Spelläge  | Hörnmål | Totala mål | Andel hörnmål |
|-----------|---------|------------|---------------|
| Jämnt     | 541     | 2 395      | **22.6%**     |
| Leder     | 924     | 4 637      | **19.9%**     |
| Ligger under | 814  | 3 289      | **24.7%**     |

**Motorsimplikation:**
- Hörnor är farligare för det underliggande laget (+24.7% vs snitt 22.2%).
- Trolig förklaring: ledande lag spelar mer defensivt → angriper mer i kontringar, inte hörnor. Underliggande lag pressar mer → genererar fler hörnor och tar ut mer risk.
- `cornerInteractionService` kan höja chansen något vid `'trailing'`-spelläge.

---

## 5. Mål-breeding (kluster-effekten)

| Fönster | Faktisk frekvens | Baseline | Lift |
|---------|-----------------|----------|------|
| 3 min   | 23.8%           | 27.4%    | 0.87x |
| 5 min   | 37.7%           | 41.4%    | 0.91x |
| 10 min  | 60.7%           | 65.7%    | 0.93x |

**Mål-par inom 3 min (n=2 537):**
- Samma lag gör nästa mål: **54.1%**
- Motståndaren gör nästa: 45.9%

**Motorsimplikation:**
- Bandy är SVAGT anti-klustrat (lift ~0.87–0.93x). Dvs "goals breed goals"-effekten finns INTE i aggregerad form.
- Förklaring: avslag + uppsamling nollställer momentum. Defensiven hinner organisera.
- Men: inom de mål-par som inträffar inom 3 min gör **samma lag** nästa mål 54.1% av fallen — momentum-effekten finns men den är svag.
- **Slutsats för motorn:** Ingen specifik "tilt"-faktor behövs efter mål. Nuvarande motor utan kluster-boost är korrekt.

---

## 6. Hemmafördelens kurva

| Period   | Hemma% av periodens mål |
|----------|------------------------|
| 0–10'    | **55.9%** ← starkast   |
| 10–20'   | 54.3%                  |
| 20–30'   | 51.7%                  |
| 30–40'   | 53.4%                  |
| 40–50'   | 54.3%                  |
| 50–60'   | 54.3%                  |
| 60–70'   | 52.4%                  |
| 70–80'   | 53.3%                  |
| 80–90'   | 52.6%                  |
| 90+'     | 53.6%                  |
| **TOTAL**| **53.6%**              |

**Motorsimplikation:**
- Hemmafördelen är STARKAST i öppningsminuterna (55.9%) och jämnar sedan ut sig.
- Det stödjer en "crowd pressure at kickoff"-effekt, inte ett generellt "hemmalaget tar mer risk i slutet".
- Nuvarande `homeAdvantage = 0.14` som konstant är en rimlig förenkling, men man kan argumentera för att sänka den mot slutet av matchen.
- Inget stöd för att hemmalaget "lyfter" av publiken i slutminuterna — hemma% 80–90' (52.6%) är lägre än 0–10' (55.9%).

---

## 7. Blowout-dynamik

**Desperationsmål (gjorda när ner 3+ mål) per period:**

| Period   | Antal |
|----------|-------|
| 0–10'    | 0     |
| 10–20'   | 12    |
| 20–30'   | 44    |
| 30–40'   | 90    |
| 40–50'   | 134   |
| 50–60'   | 127   |
| 60–70'   | 169   |
| 70–80'   | 204   |
| 80–90'   | 249   |
| 90+'     | 83    |

**Slutmarginaler vid jämn halvlek (n=213):**

| Slutmarginal | Andel |
|--------------|-------|
| 0 (oavgjort) | 25.4% |
| 1            | 28.6% |
| 2            | 18.8% |
| 3            | 13.1% |
| 4            | 8.0%  |
| 5+           | 6.1%  |

**Motorsimplikation:**
- Det förlorande laget slutar INTE kämpa — desperationsmål ökar kontinuerligt fram till slutet (249 mål i 80–90'!).
- Ingen "ligga ner och dö"-effekt. Bandy är ett spel där förloraren alltid jagar.
- Det stämmer med högt snittmål och att 0-0 aldrig inträffar.
- `lastMinutePress` med `acceptResult`-alternativet är realistisk spelmekanik — men datan säger att det faktiska beteendet i bandy är att man alltid trycker på.
- Spel-designimplikation: `acceptResult` bör inte ge for stor negativ effekt — laget pressar ändå oavsett vad man väljer.

---

## Sammanfattning: Vad saknas i motorn idag

| Finding | Nuläge | Bör läggas till |
|---------|--------|-----------------|
| Comeback -3 i HT är nästintill omöjligt (3.7%) | Ej modellerat | `getSecondHalfMode()` bör ha `'desperate'` vid −3+ |
| First goal wins 61.6%, ej 70%+ som fotboll | OK | Inga ändringar |
| Utvisningar stiger kraftigt i 80–90' (16.5%) | Okänt om motorn viktar detta | Höj `suspensionProbability` i slutfasen |
| Hörnor farligare vid undertal (+24.7% vs 19.9% vid ledning) | Ej modellerat | `trailingModifier` på cornerGoalChance |
| Ingen goals-breed-goals-effekt | Korrekt (ingen boost i motorn) | Inga ändringar |
| Hemmafördelen starkast i öppningsminuterna | Ej kurv-modellerat | Kan lämnas som konstant — förenkling OK |
| Förloraren kämpar alltid i slutet | Stämmer med desperationsmål-kurvan | Bekräftar att `lastMinutePress`-mekaniken är rätt |
