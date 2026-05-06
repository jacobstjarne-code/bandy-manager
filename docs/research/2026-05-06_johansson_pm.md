# PM — Johansson 2021 (Acceleration, Deceleration & High-Intensity Skating during Match)

**Datum:** 2026-05-06
**Källa:** Johansson M, Ervasti P-E, Blomqvist S (2021). *An Analysis of Acceleration, Deceleration and High-Intensity Skating during Elite Bandy Match-Play: A Case Study.* Sports 9(11):152. doi:10.3390/sports9110152.

**Status:** Fulltext läst. Detta PM ersätter `confidence: low` om Johansson i `bandy_research_targets.json`.

**Varför detta är centralt:** Detta är det viktigaste pappret av alla fem för **matchmotor-arkitekturen**. Trötthetsmodellen i Bandy Manager bygger på antaganden om hur bandy-spelare presterar över 90 minuter. Johansson är det enda pappret som mäter *under match* med GPS-tracking — och dess kärnfynd motsäger naiv trötthetsmodellering.

---

## 1. Datakvalitet och scope

n=10 elitspelare, 13 hemmamatcher säsong 2016-17. 30.0 ± 4.8 år, 82.8 ± 4.2 kg, 180.6 ± 4.4 cm. Position-fördelning: 1 libero, 2 backar, 2 halvor, 3 mittfältare, 2 forwards. Alla matcher utomhus, snittemp -3.7°C ± 7.4°C, vind 0–5 m/s. GPS Catapult OptimEye X4, 10 Hz, mellan skulderbladen. Min 5 års elit-träning. 11W-1D-1L (vinnande lag).

**Begränsningar för generalisering:**
- Bara ett lag — taktik och individuella mönster kan dra resultaten
- Bara hemmamatcher — ingen restids-effekt
- **Vinnande lag** — ledande lag tenderar minska intensitet i H2 av taktiska skäl
- GPS skiljer inte forward/backward skating
- 10 Hz GPS har osäkerhet >20 km/h

---

## 2. Variabler och definitioner

| Variabel | Definition |
|---|---|
| Total distance | Hela matchen (m) |
| Very fast skating | Distans i 25–29.99 km/h |
| Sprint skating | Distans i ≥30 km/h |
| Low-int acc/dec | 1–1.99 m/s² |
| High-int acc/dec | 2–2.99 m/s² |
| Very high-int acc/dec | ≥3 m/s² |

Acc/dec-event måste vara minst 0.5s lång för att räknas. Match delades i 2×45 min eller 6×15 min för analys.

---

## 3. H1 vs H2 (signifikanta förändringar fetstilta)

| Variabel | H1 | H2 | Δ | p | Effect size |
|---|---|---|---|---|---|
| **Total distance (m)** | **10,917 ± 1611** | **10,450 ± 1738** | **−4.5%** | **<0.001** | 0.28 |
| **Very fast skating (m)** | **1,338 ± 682** | **1,161 ± 610** | **−13%** | **<0.001** | 0.27 |
| **Sprint skating (m)** | **300 ± 205** | **272 ± 202** | **−9%** | **0.017** | 0.14 |
| **Low-int acceleration (m)** | **343 ± 52** | **333 ± 58** | **−3.5%** | **0.021** | 0.16 |
| High-int acceleration (m) | 84 ± 18 | 83 ± 18 | −0.7% | 0.639 | 0.03 |
| Very high-int acceleration (m) | 48 ± 14 | 50 ± 15 | +3% | 0.171 | 0.10 |
| Low-int deceleration (m) | 220 ± 45 | 219 ± 45 | −0.5% | 0.742 | 0.02 |
| High-int deceleration (m) | 49 ± 12 | 50 ± 12 | +1% | 0.488 | 0.06 |
| Very high-int deceleration (m) | 51 ± 14 | 51 ± 14 | +0% | 0.863 | 0.02 |

---

## 4. Kärnfynd

### A. Sprint-kvalitet bevaras genom hela matchen

High-intensity acceleration (2–3 m/s²) och very high (≥3 m/s²) visar **noll signifikant minskning** mellan H1 och H2 eller mellan I1 (0–15 min) och I6 (75–90 min). Spelare orkar lika hårda accelerationer i 89:e minuten som i 1:a.

### B. Sprint-frekvens (distans i high-intensity) sjunker

Sprint skating 300→272m (−9%), very fast skating 1338→1161m (−13%), total distance −4.5%. Spelare *gör* lika hårda sprints, bara *färre* av dem.

### C. Bandy bevarar sprint-output bättre än soccer

Soccer-litteratur (Akenhead 2013, Russell 2016) visar 7–21% reduktion i acceleration H1→H2 i samma intensitetsband. Bandy: 0% i high/very-high. Författarnas förklaringar:

- **Glide-fasen** tillåter återhämtning *medan* spelaren skater i hög velocity (soccer-spelare vilar bara när de står still)
- **Obegränsade byten** ger bättre re-cover-villkor (soccer max 5)
- Bandy-spelare undviker high-intensity deceleration genom att ta bredare svängar och *accelerera ut* ur svängen — energi-effektivare riktningsändring

---

## 5. 15-min intervall (Tabell 3)

I1 (0–15 min) skiljer signifikant från:
- I2, I5, I6 i total distance
- I2, I3, I4, I5, I6 i very fast skating (alla intervall — sprint-distans börjar dippa redan i I2)
- I5 i sprint skating (≥30 km/h)
- I2, I5, I6 i low-intensity acceleration

Ingen signifikant skillnad någonstans för high/very-high acc/dec.

Nedgången i sprint-distans börjar **redan i I2 (15–30 min)**, inte i sista intervallen — det är inte ren "trötthet i slutminutrarna", det är gradvis nedgång från första kvarten.

---

## 6. Aggregerade match-totaler (H1 + H2)

| Variabel | Per match (m) |
|---|---|
| Total distance | 21,367 |
| Very fast skating (25–30 km/h) | 2,499 |
| Sprint skating (≥30 km/h) | 572 |
| Low-int acceleration | 676 |
| High-int acceleration | 167 |
| Very high-int acceleration | 98 |
| Low-int deceleration | 438 |
| High-int deceleration | 99 |
| Very high-int deceleration | 102 |

**Triangulering:** Persson 2021 säger 21.1 km offensiva, 23.2 km defensiva — Johansson 21.4 km cohort-snitt ligger däremellan. Sprint skating 572m ≈ Johanssons egna citat "≈600 m sprinting". Konsistens.

---

## 7. Implications för Bandy Manager — TRÖTTHETSMODELL-OMSKRIVNING

**Detta är det viktigaste fyndet av alla fem papperna för matchmotor-arkitekturen.**

### 7.1 Naiv (felaktig) modell

```
chanceQuality = baseQuality × (1 − fatigueFactor)
// Senare i match → varje sprint/skott är sämre
```

### 7.2 Johansson-trogen modell

```
sprintEventProbability = baseProbability × (1 − fatigueFactor)
// Senare i match → färre sprint-events, men kvalitet bevaras
```

### 7.3 Konkret för Bandy Manager

Om motorn idag sänker `chanceQuality` eller motsvarande på sena skott:
- **Counter-attack i 87:e minuten** → ska ha samma `chanceQuality` som i 12:e
- **Friställande lägen** ska inte degraderas över tid
- **Hörnor** ska inte få lägre målprocent sent i match

Vad som *ska* ske med fatigue:
- Färre sprint-/transition-tillfällen → motorn genererar färre snabba motanfall i H2
- Defensiva lag har mindre utdragna stretch-perioder pga lägre total distance
- Slutminuter taktiskt påverkade (vinnande lag bromsar tempot — Johansson noterar 11W-1D-1L)

### 7.4 Konkreta minsknings-faktorer som kan kalibreras

| Variabel | H1→H2 minskning | Bandy Manager-edit |
|---|---|---|
| Total skating-output | −4.5% | total skate-distance / "tempot" sänks i H2 |
| Very fast skating | −13% | high-velocity-events sker mer sällan |
| Sprint skating | −9% | sprint-events sker mer sällan |
| Low-int acceleration | −3.5% | små accelerationer ovanligare |
| High-int acceleration | 0% | **lämnas oförändrad** |
| Very high-int acc | 0% | **lämnas oförändrad** |
| All deceleration | 0% | **lämnas oförändrad** |

### 7.5 Implementation-skiss

Behöver lokalisera den exakta funktionen som applicerar tids-baserad qualityreduktion innan exakt edit-spec kan skrivas. **Kandidat-filer:**
- `src/domain/services/matchCore.ts` (om sådan exists)
- `src/domain/services/matchEngine.ts`
- `src/domain/services/calibrate_v2.ts` (för att verifiera utfall)

**Kod-mönster att leta efter:**
```ts
// FELAKTIGT om det finns:
const fatigueFactor = step / TOTAL_STEPS  // eller liknande
chanceQuality *= (1 - fatigueFactor * 0.X)
goalThreshold *= (1 - fatigueFactor)
```

**Föreslagen ersättning:**
```ts
// Trötthet påverkar EVENT-FREKVENS, inte event-kvalitet
const fatigueFactor = computeFatigueFactor(step)
const sprintEventOddsModifier = 1 - fatigueFactor * 0.13
const counterAttackOddsModifier = 1 - fatigueFactor * 0.09
// chanceQuality och goalThreshold lämnas oförändrade av trötthet
```

**Detta är inte en spec att skicka till Code förrän:**
- Vi lokaliserat den exakta nuvarande implementationen
- Jacob bekräftat att Johansson-modellen är önskad modellering (det är ett *empiriskt grundat designval*, men fortfarande designval)
- Stress-test-payload finns för verifiering

---

## 8. Vad detta INTE löser

| Fråga | Status |
|---|---|
| Hur ofta sker very-high-acc-events per match? | 98m totalt, 0.5s minimum → ~30–40 events i 90 min |
| Skiljer sig mönstret per position? | Pappret aggregerar — ingen position-uppdelning |
| Förändras mönstret med matchresultat (vinnande vs förlorande lag)? | Ej studerat (alla 13 matcher var hemma, 11/13 vinster) |
| Vad händer i förlängning (extra time)? | Exkluderat ur analysen |
| Junior-data om match-trötthet? | Inget — Persson 2023 mätte sprint, inte match-belastning |

---

*Senast uppdaterad: 2026-05-06.*
