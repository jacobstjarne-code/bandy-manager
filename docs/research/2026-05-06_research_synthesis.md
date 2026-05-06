# PM — Bandy-forskning samlad: implications för Bandy Manager

**Datum:** 2026-05-06
**Föregångare:** 2026-05-06_van_den_tillaar_pm.md, 2026-05-06_petre_pm.md, 2026-05-06_johansson_pm.md, 2026-05-06_persson_junior_pm.md, 2026-05-06_sirius_uppsats_pm.md
**Companion:** bandy_research_targets.json (uppdateras enligt detta PM)

Detta är **synthesis-PM:et**. Enskilda papper har egna PM:er. Här binder jag ihop dem mot Bandy Manager-arkitekturen.

---

## 1. Vad vi nu vet (sammanfattat)

Fem källor med olika fokus:

| Källa | Fokus | n | Confidence |
|---|---|---|---|
| van den Tillaar 2023 (herr) | Sprint-skating-profil 80m | 111 | high |
| van den Tillaar 2023 (dam) | Sprint-skating-profil 80m | 74 | high |
| Petré 2022 | Fysisk profil senior-elit (10 tester) | 25 | high |
| Johansson 2021 | Match-data via GPS, trötthetsmönster | 10 | high (för match-mönster) |
| Persson 2023 | Junior-elit fysisk profil (8 tester) | 16 | medium (C-uppsats men handledd av Petré) |
| Sirius-uppsats 2023 | Match-analytics (skotttyp, hörnor, ute/inne) | 18 matcher | medium |

**Tillsammans täcker de:**
- 16.8 år (junior) → 26.7 år (senior) utvecklingskurva
- Position-skillnader (eller frånvaro därav) i fysiska kapaciteter
- Match-output över 90 min (trötthetsmönster)
- Spelanalys (skotttyper, hörnor, situations-kategorisering)
- Dam-data för framtida spelmode

**Vad som fortfarande saknas:**
- Damjuniorer (helt outforskat)
- Målvakter (exkluderade i alla papper)
- Position-progression över ungdomsår (cross-sectional, inte longitudinellt)
- Match-data med GPS från flera lag, från förlorande lag
- Skadefrekvens-data (nyare än Timpka 2007)

---

## 2. De fyra centrala fynd som påverkar Bandy Manager-modellen

### Fynd 1: Position differentierar i bandy via aerob kapacitet, inte fysisk isolation-prestation

| Attribut | Differentierar? | Källa |
|---|---|---|
| `skating` | **Nej** | van den Tillaar herr, Petré, Persson |
| `acceleration` | **Nej** för herr (svag forwards-fördel hos dam) | van den Tillaar |
| Styrka (IMTP) | **Nej** | Petré |
| Hopp (CMJ, SJ, long jump) | **Nej** | Petré, Persson |
| Sprint-tider on-ice | **Nej** | Petré + van den Tillaar + Persson |
| `stamina` / VO₂max | **JA** — endast hos seniorer | Petré (junior: nej, Persson) |
| Total distance per match | **JA** — defenders 23.2 km, offensiva 21.1 km | Persson 2021 |
| Tid >25 km/h | **JA** — offensiva > defensiva | Persson 2021 |

**Konsekvens för Bandy Manager:**
- `skating`/`acceleration` ska genereras position-neutralt (oavsett ålder)
- `stamina` differentieras hos *senior*-spelare (forwards 80, defenders 70 i rating-skala)
- Junior-spelare i akademin: position-neutral stamina också — Persson visar att differentieringen sker först senare

### Fynd 2: Junior-progression följer empirisk kurva 16.8 → 26.7 år

| Ålder | `skating` rating | `acceleration` rating | `stamina` (relativ) | Vikt (kg) | Källa |
|---|---|---|---|---|---|
| 16–17 | ~70–75 | ~70–75 | ~80 (junior har högst relativ!) | 70–75 | Persson |
| 18–20 (junior elit) | ~78–82 | ~78–82 | ~78 | 73–78 | van den Tillaar |
| 22–25 (senior debut) | ~85–88 | ~85–88 | ~75 | 80–84 | extrapolerad |
| 26–28 (senior peak) | ~88–92 | ~88–92 | ~73 (rel) / 80 (abs) | 84–86 | Petré |
| 29–32 | nedgång | nedgång | nedgång | 84–86 | extrapolerad |

**Kontroversiell konsekvens:** juniorer ska kunna ha **högre** `stamina`-rating än seniorer om vi modellerar relativ VO₂max. Idag (sannolikt) modellerar Bandy Manager juniorer som "lägre på allt". Det är **fel** enligt Persson.

**Två designval för stamina:**
- (A) Modellera relativ VO₂max: junior 80, senior 73 — kontraintuitivt men empiriskt
- (B) Modellera absolut arbetsförmåga: junior 73, senior 80 — intuitivt
- (C) Hybrid: 60% absolut + 40% relativ — kompromiss

Min rek: **(B)** för Bandy Manager-användbarhet, men dokumentera att vi medvetet avviker från relativ-data eftersom spelet handlar om absolut prestation.

### Fynd 3: Trötthetsmodellen ska vara frekvens-baserad, inte kvalitets-baserad

(Detta är pappersets viktigaste insikt för matchmotorn — se Johansson-PM för detaljer.)

**Naivt:** `chanceQuality *= (1 - fatigueFactor)` — varje sprint/skott blir sämre över tid.

**Johansson-trogen:** `sprintEventProbability *= (1 - fatigueFactor)` — färre sprints, samma kvalitet.

**Konkreta minsknings-faktorer (H1 → H2):**
- Total skating output: −4.5%
- Very fast skating events: −13%
- Sprint skating events: −9%
- Low-int acceleration: −3.5%
- High-int acceleration: **0%** (bevaras)
- Very high-int acceleration: **0%** (bevaras)
- All deceleration: **0%** (bevaras)

### Fynd 4: Skotttyper differentierar mål-sannolikhet drastiskt (Sirius)

(Från tidigare PM, Sirius-uppsatsen.) Skott utifrån 6%, inläggsskott 28%, friställande lägen 47%. Bandy Manager modellerar idag inte skotttyp-skillnader. Mest påverkbar förändring för realism enligt Sirius-PM.

---

## 3. Konkreta motor-implications, prioriterade

### Hög-prioritet

**1. Trötthetsmodell — strukturell omskrivning**
- Lokalisera fatigue-implementation i `matchCore.ts` eller `matchEngine.ts`
- Ändra från quality-degradation till frequency-degradation
- Stress-test mot Johansson-värden (H1→H2 −4.5% total, −13% very fast, 0% high-int acc)
- **Risk:** strukturell ändring. Måste verifieras mot calibrate_v2-targets så total mål/match håller sig.

**2. Position-baserad stamina-differentiering**
- Granska `worldGenerator.ts` / `playerGenerator.ts`
- Verifiera att `skating` och `acceleration` är position-neutrala (ska vara det)
- Verifiera att `stamina` är position-differentierad för seniors (ska vara det enligt Petré)
- Implementera junior-spelare som position-neutrala på alla attribut (Persson-fyndet)

**3. Skotttyp-modell (Sirius)**
- Implementera `shotTypeMultiplier` i `goalThresholdAttack`
- Skala värden så att totalsnitt matchar 9.12 mål/match (Bandygrytan-target)

### Medel-prioritet

**4. Junior-progression-kurva**
- Verifiera akademi-spelarprogression mot empirisk kurva (Persson → van den Tillaar → Petré)
- ~2 rating-punkter per år i `skating`/`acceleration` över ~10 år
- Inkludera selektion (många junior-elit blir aldrig senior-elit)

**5. Total match-distance-kalibrering**
- Om Bandy Manager loggar simulerad skating-distans, kalibrera mot Johansson 21.4 km cohort
- Position: defenders 23.2 km, offensiva 21.1 km (Persson 2021)
- Idag instrumenteras detta sannolikt inte → kräver instrumentering först

### Låg-prioritet (forskningstomrum)

**6. Dam-bandy som spelmode**
- Skating peak 9.52 m/s (88% av herr)
- Vikt 65 kg (82% av herr)
- Höjd 1.67 m (93% av herr)
- Separata baselines, inte samma rating-skala vid absoluta värden

**7. Hörnsida-asymmetri (Sirius)**
- Vänster 16.8% mål, höger 9.0% — inte signifikant men trend konsekvent
- Lågrisk-implementation, hög upplevelse-effekt

---

## 4. Vad jag rekommenderar göra härnäst

### Direkt (innan Code-engagement)

1. **Lokalisera fatigue-implementation** i match-pipeline. Sökord: `fatigue`, `stamina`, `chanceQuality`, `step / TOTAL_STEPS`, `tiredness`. Detta är en utredning som tar 30–60 min.

2. **Verifiera position-baserad attribut-generation** i playerGenerator. Hur stora är `skating`/`acceleration`-spread mellan positioner idag? Om stora: empiriskt obefogat.

3. **Stress-test motor-output** mot Johansson-värden. Om motorn idag inte loggar "high-int acceleration distance per spelare", instrumentera kort. Annars: kvalitativ bedömning av om sena-skott-kvalitet är empiriskt rimlig.

### Inför Niklas-möte

Frågor till elit-bandycoach Niklas som direkt drar nytta av denna forskning:

1. "Stämmer det att forwards är mer aeroba än backar i din erfarenhet? Hur stor skillnad ser du själv?"
2. "Ser du tröttheten som *frekvens-tappande* eller *kvalitets-tappande* i 80–90:e minuten? Sprintar dina spelare lika hårt sent men gör det mer sällan, eller blir varje sprint sämre?"
3. "När börjar position-specialiseringen i bandy? 16-åringar är fortfarande generaliska enligt forskning. Stämmer det?"
4. "Hörnornas vänster/höger-asymmetri — ser du själv att vänsterhörnor är farligare än högerhörnor? Sirius-data 2022 visar 17% mot 9%."

### Inför Code-engagement

Innan vi skickar något till Claude Code:
- Beslut: trötthetsmodell strukturell omskrivning eller bara kalibrering?
- Beslut: stamina absolut, relativ eller hybrid?
- Beslut: junior-spelare position-neutrala eller behåll nuvarande modell?
- Beslut: skotttyp-modell — implementera nu eller efter trötthet?

---

## 5. Vad detta INTE är

Detta PM är inte en kod-spec. Det är ett **kunskaps-PM** som binder ihop forskning till motor-implications. Konkreta diff-spec'ar skrivs när:
- Lokaliseringen av fatigue-implementation är klar
- Designval är fattade
- Stress-test-värden är etablerade

---

*Senast uppdaterad: 2026-05-06.*
