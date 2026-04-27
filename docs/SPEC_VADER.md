# SPEC: Realistisk väderfeature

**Skapad:** 2026-04-27
**Författare:** Opus
**Status:** UTKAST V2 — efter Bandy-Brain-granskning, blockerare fixade
**Beroenden:** `docs/KLUBBFAKTA.md` (intern referens-data), `docs/SPEC_MATCHDAGAR.md` (datum-pipeline)

---

## 1. Syfte

Lägga in **riktig svensk vintervädersdata** i Bandy Manager för att ge:

1. **Geografisk specificitet** — Karlsborg är inte Rögle är inte Lesjöfors. Klubbarnas spelpositioner i Sverige ska *kännas* via vädret
2. **Mekanisk koppling** — vädret påverkar matchformat (3×30 vid kyla), om match spelas (dimma/extremkyla), iskvalitet
3. **Narrativt djup** — match-commentary, daily briefings, och 123-matchvyns första steg får verklighetsförankrad atmosfär
4. **Outliers som feature** — extrema vintrar händer i den riktiga datan; spelet ska *inte* normalisera bort dem ("det ÄR ju också så")

Klubbarna är fiktiva, men de står på en bädd av verkliga svenska orter. Den verkliga ortens klimat blir vår klimatprofil.

---

## 2. Designprinciper

### Anslutning till befintliga principer
Detta arbete följer de tre etablerade designprinciperna:
- **P1 (Inbox-driven kontext):** Väder genererar inbox-events vid extremfall (DailyBriefing)
- **P2 (Pre-spec cross-check):** Specen har validerats mot KLUBBFAKTA, befintlig weatherService, matchEngine
- **P3 (Integration-completeness):** Vädret kopplar till matchEngine, klubbvy, daily briefing, match-commentary, 123-matchvyn — inte isolerat

### Ny föreslagen princip
**P4 (Research före gissning):** För specs som lutar mot research-tung domän — verkliga platser, historiska fakta, regelverk, externa data, eller terminologi från en domän vi vill respektera — söker Opus på webben innan första utkast. Tröskeln är inte "alltid" utan "när rätt-svar är värt mer än sökningen". *(Föreslås läggas till i CLAUDE.md.)*

---

## 3. Beslutade scope-frågor

| Fråga | Beslut | Konsekvens |
|---|---|---|
| Outliers-policy | Percentil **2-98** | Bevarar realistisk variation utan absurda single-save-rekord |
| Historikens längd | **10 år** (säsonger 2015/16-2024/25) | Aktuellt klimat, ~260 datapunkter/klubb/parameter |
| Inomhushallar | **(c) Vädret nämns som kontrast** | "Ute -18°, men i hallen är isen perfekt" — bandy-Sveriges luxe-DNA |
| Engångskörning eller årlig | **Engångskörning först** | Statisk JSON-fil; årlig uppdatering kan komma som cron-job senare |
| Arketyp-modifierare i koden | **Fall ut av datan** | Arketyp-fältet används för commentary-triggers, inte för att modifiera datan i sig |
| Pollnings-timing | **Hela bandysäsongens period** (1 augusti — 31 mars, ~243 dagar) | Se §3.1 nedan |
| Stöpis-detektering | **Skjuts till framtida sprint** | Bandynörd-feature, inte MVP-kritiskt; kräver weatherHistory-state-extension |

### 3.1 Pollnings-timing — reviderad efter SPEC_MATCHDAGAR-koppling

**Bakgrund:** Ursprungligen specade vi "±3 dagar runt ROUND_DATES" eftersom matchdatum var hårdkodade. Med SPEC_MATCHDAGAR blir ROUND_DATES RNG-genererade per säsong, vilket innebär att specifika kalenderdatum varierar mellan säsonger. Pollningsstrategin behöver vara robust mot framtida schedule-ändringar.

**Beslut:** Polla **hela bandysäsongens period** för varje historisk säsong:
- **Period: 1 augusti — 31 mars** (~243 dagar)
- Inkluderar både cup-period (augusti-oktober) och liga/slutspels-period (oktober-mars)
- 243 dagar × 10 säsonger = ~2430 datapunkter per klubb per parameter
- Aggregering sker vid lookup, inte vid insamling

**Aggreggations-strategi:**
Vid weatherService-anrop för en given matchday, beräkna ett **datumfönster ±5 dagar runt aktuellt matchday-datum** och samla statistik från historiska datapunkter inom det fönstret. Detta ger:
- Robust mot variabla matchdatum (RNG-genererade per säsong)
- ~110 datapunkter per matchday-position per klubb (10 år × 11 dagar/fönster)
- Statistiskt stabilt för percentilberäkning

**Påverkan på Python-skript:** Förenklar datainsamling — bara range-loop över hela bandysäsongen, inget specialkalendarium. Aggregering blir runtime-logik i weatherService istället för precomputed.

---

## 4. Klimat-arketyper

Se `docs/KLUBBFAKTA.md` för fullständig beskrivning per klubb. Översikt:

| Arketyp-kod | Klubbar | Karaktär |
|---|---|---|
| `arctic_coast` | Karlsborg | Bottenviken, januarimedel ~−12°C, snödjup 50+ cm |
| `gulf_coast` | Skutskär | Bottenhavet, kustnära, måttlig kyla |
| `vanern_effect` | Slottsbron | Vänern, sen istäcke, dimma vanlig |
| `scanian_coast` | Rögle | Sydvästra Sverige, mildast (jan-medel +1) |
| `valley_coldpit` | Lesjöfors | DOKUMENTERAT köldhål, inversion |
| `valley_inland` | Gagnef | Älvdalsens sammanlöp, ingen dokumenterad köldhål |
| `bruk_lakeside` | Forsbacka, Hälleforsnäs, Heros, Västanfors | Bergslagen vid sjö, fuktigare luft |
| `bruk_river_island` | Söderfors | Ö i Dalälven |
| `sm_highland_extreme` | Målilla | "Temperaturhuvudstaden", extrema utsving |

Arketypen sparas på klubben (i `CLUB_TEMPLATES`) och används för:
1. **Commentary-triggers** — vissa fraser/anekdoter fyrar bara för vissa arketyper
2. **Inomhushallar-kontrast-text** — formuleringen anpassas (Karlsborg "ute jagar köldskaderiskerna oss" vs Rögle "ute räknar vi snöflingor")
3. **Klubbvy-flavor-text** — beskriver klubbens vädersituation i stationskortet

Den faktiska väder-genereringen drivs av **historisk data**, inte av arketyp.

---

## 5. Bandyregler — mekanisk koppling

Köldbestämmelser från Svenska Bandyförbundets spelregler (källa: Spelregler 2025/2026):

### Senior (vårt spels A-lag)
| Förhållande | Konsekvens i motorn |
|---|---|
| Temp ≥ −17°C | Normal match: 2×45 minuter |
| −17°C > temp > −22°C | **Match: 3×30 minuter med pauser max 15 min** |
| Temp ≤ −22°C | **Match ställs in** — schemaläggs om |
| Tät dimma vid matchstart | **Uppskjut 45 min**, sedan inställd om sikten inte förbättras |
| Tät dimma under match | **Avbryts** vid behov, återupptas när sikt återvänder |
| Storm/svår vind | **Matchhinder** — domarens diskretion |
| Kraftigt snöfall | **Match delas i fler perioder** för röjning |
| Regn under match | Knottrig is, **fler perioder för röjning** |

### Implementation
Dessa förhållanden måste **detekteras innan match börjar** (vid `matchTick === 0`) och påverka:
- `matchFormat`: `"2x45"` (default) eller `"3x30"` eller `"cancelled"`
- `weatherDelay`: minuter försening innan tipoff
- `roundProcessor` måste hantera `"cancelled"`-status och flytta matchen till lediga datum (eller season-end-rest om ingen plats finns)

### Ungdom-bestämmelser
För ungdomslag är gränserna **−15°C / −20°C** istället. *Spelet hanterar bara A-lag i nuvarande version, så ungdom-reglerna är inte aktuella ännu, men noteras för framtida utbyggnad till U-serier.*

### 5.4 3×30-format i matchEngine

**Verifierat genom kodläsning av `matchUtils.ts`:** matchEngine använder `GOAL_TIMING_BY_PERIOD` och `SUSP_TIMING_BY_PERIOD` med 9 perioder à 10 minuter, kalibrerade från empirisk data (1124 Bandygrytan-matcher) för 2×45-formatet.

**Konsekvens för 3×30:** Halvtidsjakt-effekten (40-50 min, period 4) ligger på fel plats relativt 3×30-pauserna (30 min, 60 min). Slutryckningseffekten (80-90 min) hamnar fortfarande i sista perioden — OK.

**Frekvens:** 3×30-format triggas vid temp −17 till −22°C. Karlsborg och Lesjöfors har detta ~5-10% av matcher. Övriga klubbar <2%. Få matcher per säsong totalt.

**Beslut:** Acceptera period-skevhet för 3×30-matcher som **kosmetisk realism**. Inga halvtidsjakt-mål 30 min in i en 3×30-match är inte en deal-breaker. Att bygga om matchEngine för variabla periodlängder är stort arbete utan motsvarande värde.

**Code-implementation:** Använd samma matchEngine-pipeline för båda format. Skicka `matchFormat`-flaggan vidare till commentary för att kunna trigga "Källa bryts efter 30 min — lagen samlas i klubbhuset för att värmas"-fraser.

### 5.5 Dimma-fördröjning (45 min)

Dimma vid matchstart kan ge 45 min uppskjutning enligt regelboken. **Hantering i spelet:**

1. Match spelas **samma dag** med fördröjt avslag (kosmetiskt)
2. `Weather.fogDelayMinutes = 45` flaggas
3. Inbox-event genereras: "Matchen mot [motståndare] startade 45 min senare än planerat på grund av dimma. Spelarna frös i kön."
4. Om dimman ligger kvar (40% chans baserat på §8.2 steg 2): `cancelReason = 'fog'`, full rescheduling enligt §6.3

Ingen schemajustering, ingen rescheduling — bara kosmetisk frostbiten-flavor.

---

## 6. Datamodell

### 6.1 Ny: ClimateProfile per klubb (inputdata)

Detta är den **nya** datastruktur som ersätter `regionalClimate.ts` som källa.

```typescript
// src/domain/data/climateProfiles.ts (genereras från SMHI-skript, levereras som JSON)

interface ClimateProfile {
  smhiStationId: string              // primär SMHI-station för non-PTHBV-parametrar
  smhiStationName: string             // för referens i logs
  latitude: number                    // för PTHBV
  longitude: number
  geographyArchetype: ClimateArchetype
  loreReferences: string[]            // se KLUBBFAKTA, för commentary-triggers
  // Aggregerad från historik 2015-2025, indexerad per matchday i säsong (1-32)
  matchDayClimate: Record<number, MatchDayWeatherStats>
}

type ClimateArchetype =
  | 'arctic_coast'
  | 'gulf_coast'
  | 'vanern_effect'
  | 'scanian_coast'
  | 'valley_coldpit'
  | 'valley_inland'
  | 'bruk_lakeside'
  | 'bruk_river_island'
  | 'sm_highland_extreme'

interface MatchDayWeatherStats {
  // Temperatur-statistik från historik (10 år, ±3 dagar runt matchdag)
  tempMean: number                    // grader celsius
  tempStdDev: number
  tempP02: number                     // percentil 2 (kall outlier)
  tempP50: number                     // median
  tempP98: number                     // percentil 98 (varm outlier)
  // Sannolikheter från historik
  snowfallProb: number                // 0-1
  thawProb: number                    // 0-1, plusgrader
  fogProb: number                     // 0-1
  rainProb: number                    // 0-1
  // Vind
  windMean: number                    // m/s
  windP95: number                     // m/s, sannolik storm-tröskel
  // Beräknat (inte slumpat, baseline)
  iceQualityBaseline: number          // 0-100, för klimatkort i klubb-vyn
}
```

### 6.2 Befintlig: Weather + WeatherEffects (outputdata)

Befintlig kod i `weatherService.ts` returnerar `MatchWeather` med:
- `Weather` (temperature, condition, windStrength, iceQuality, snowfall, region)
- `WeatherEffects` (ballControlPenalty, speedModifier, injuryRiskModifier, goalChanceModifier, attendanceModifier, cancelled)

**Befintlig struktur behålls.** Vi lägger till följande optionella fields i `Weather`:

```typescript
interface Weather {
  // ... befintliga fields
  matchFormat?: '2x45' | '3x30' | 'cancelled'  // NY: regelbokens format
  cancelReason?: 'extreme_cold' | 'fog' | 'storm' | 'thaw'  // NY: orsak om cancelled
  fogDelayMinutes?: number            // NY: 0 eller 45 om dimma-fördröjning
  archetype?: ClimateArchetype        // NY: för commentary-triggers
}
```

**Notering:** Stöpis-flaggan är borttagen från denna version. Stöpis-detektering kräver `weatherHistory` på SaveGame som inte är specat här. Skjuts till framtida sprint (se §8.2 Steg 3-noteringen).

Detta sättet hålls befintlig integration intakt. Alla nya fields är optionella — callers som inte känner till dem fungerar som tidigare.

### 6.3 Cancellerade matcher — schemaomflyttning

När `matchFormat === 'cancelled'`:
- `roundProcessor` flaggar matchen som `postponed` med `postponeReason: cancelReason`
- Nästa lediga matchday läggs matchen tillbaka i schemat
- Om ingen ledig matchday finns innan säsongsslut: schemalägg som `season_end_makeup_round`

Detta kräver utbyggnad av `roundProcessor.ts`.

---

## 7. Datainsamling — SMHI-skript

### Källa
**SMHI Open Data API:** `https://opendata-download-metobs.smhi.se/api/version/1.0/`

**Licens:** Creative Commons Erkännande 4.0 SE (fritt även kommersiellt, kräver källaangivelse).

### Strategi: PTHBV griddat istället för punktstationer
För konsistens använder vi **PTHBV (Pthbv-griddade dygnsvärden)** — interpolerade värden för en specifik koordinat även där mätstation saknas. Detta löser problemet att Forsbacka inte har egen mätstation men att Sandviken är 10 km bort.

PTHBV finns för temperatur (parameter 1) och nederbörd (parameter 5) **från 1961**.

För andra parametrar (vind, sikt, snödjup, dimma) använder vi närmaste mätstation.

### Pollningsmönster
**Hela bandysäsongens period** (uppdaterat efter §3.1):

- **Period: 1 augusti — 31 mars** per historisk säsong
- **~243 dagar/säsong × 10 år = ~2430 dygnsvärden per klubb per parameter**
- Inkluderar cup-period (aug-okt) och liga/slutspels-period (okt-mars)
- Inga klockslag — dygnsvärden enbart

**Aggregering:** Sker vid lookup, inte vid insamling. weatherService får ett matchday-datum och samlar statistik från historiska datapunkter inom **±5 dagar** runt det datumet (dvs. ~110 datapunkter per klubb per matchday-position).

**Output:** En statisk JSON med raw dygnsvärden per klubb (alternativt aggregerade percentiler om vi vill precomputa). Beslut om format kan tas av Erik baserat på filstorleksavvägning.

### Skript-struktur
```python
# scripts/collect_weather_history.py
# Engångskörning. Genererar data/climateProfiles.json

import requests
import pandas as pd
from datetime import datetime, timedelta

CLUBS = [
    {"id": "forsbacka", "lat": 60.5894, "lon": 16.7456, "smhi_proxy": "Sandviken"},
    {"id": "soderfors", "lat": 60.3933, "lon": 17.2367, "smhi_proxy": "Tierp"},
    {"id": "vastanfors", "lat": 59.9744, "lon": 15.7972, "smhi_proxy": "Fagersta"},
    {"id": "karlsborg", "lat": 65.7944, "lon": 23.2667, "smhi_proxy": "Kalix"},
    {"id": "malilla", "lat": 57.3856, "lon": 15.7956, "smhi_proxy": "Vimmerby"},
    {"id": "gagnef", "lat": 60.5739, "lon": 15.0428, "smhi_proxy": "Borlänge"},
    {"id": "halleforsnas", "lat": 59.1517, "lon": 16.5256, "smhi_proxy": "Eskilstuna"},
    {"id": "lesjofors", "lat": 59.9944, "lon": 14.1817, "smhi_proxy": "Filipstad"},
    {"id": "rogle", "lat": 56.2400, "lon": 12.8800, "smhi_proxy": "Ängelholm"},
    {"id": "slottsbron", "lat": 59.3217, "lon": 13.1136, "smhi_proxy": "Karlstad"},
    {"id": "skutskar", "lat": 60.6219, "lon": 17.4111, "smhi_proxy": "Älvkarleby"},
    {"id": "heros", "lat": 60.1392, "lon": 15.4111, "smhi_proxy": "Borlänge"},
]

# För varje klubb:
#   1. Hämta historik 2015-2025 från PTHBV (temp + nederbörd, dygnsvärden)
#   2. Hämta historik från närmaste station för vind, sikt, snödjup
#   3. Filtrera till bandysäsongens period (1 aug — 31 mars per säsong)
#   4. Spara raw dygnsvärden per klubb per datum (alternativt aggregera)
#   5. Beräkna sannolikheter (snöfall, töväder, dimma, regn) för sanity-check
#   6. Beräkna ice_quality_baseline (formel se nedan) som referens
#   7. Spara till climateProfiles.json
```

### Iskvalitet-baseline-formel

```
ice_quality_baseline = clamp(
  100
  - 10 * abs(temp - (-5))           # optimum -5°C
  - 30 * (rain_prob_recent_days)    # regn senaste 3 dagarna
  - 20 * (thaw_prob_recent_days)    # plusgrader senaste 3 dagarna
  - 5 * snow_depth_cm,              # snödjup försvårar
  0, 100
)
```

Detta är en *baseline*. Faktisk match-iskvalitet beräknas också från det aktuella matchvädret som slumpats.

### Output-fil
`data/climateProfiles.json` (inte `src/data/` — det är data, inte kod):

```json
{
  "version": "1.0",
  "generatedAt": "2026-04-27T...",
  "historyYears": [2015, 2016, ..., 2024],
  "clubs": {
    "forsbacka": {
      "smhiStationId": "107000",
      "smhiStationName": "Sandviken A",
      "latitude": 60.5894,
      "longitude": 16.7456,
      "geographyArchetype": "bruk_lakeside",
      "hasIndoorArena": false,
      "loreReferences": ["1960_storsjo_iceincident", "mariehov_naturisstruggle"],
      "matchDayClimate": {
        "1": { "tempMean": -1.2, "tempP02": -8.5, "tempP98": 7.1, "snowfallProb": 0.18, ... },
        "2": { ... },
        ...
        "26": { ... }
      }
    },
    "karlsborg": { ... },
    ...
  }
}
```

Storlek: ~50 kB per klubb × 12 klubbar ≈ 600 kB total. Trivialt.

---

## 8. weatherService update

### 8.1 Befintlig kod

Det finns redan en fungerande `weatherService.ts` med:
- `generateMatchWeather(season, roundNumber, homeClub, fixtureId, seed)` — huvudfunktion
- Klimatdata från `getClimateForRegionAndMonth(region, month)` — **region-baserad**, inte klubb-baserad
- Diskret iskvalitet via `IceQuality`-enum: `Excellent | Good | Moderate | Poor | Cancelled`
- Väderkonditioner via `WeatherCondition`-enum: `Clear | Overcast | LightSnow | HeavySnow | Fog | Thaw`
- Inomhushall-hantering: `homeClub.hasIndoorArena` ger stabil bra is, aldrig cancelled
- `WeatherEffects` med `ballControlPenalty`, `speedModifier`, `injuryRiskModifier`, `goalChanceModifier`, `attendanceModifier`, `cancelled`
- Töväder + plusgrader kan redan ge `Cancelled` (15% chans)

Denna struktur är välbyggd och behöver inte kastas. Vi **uppgraderar datakällan**, lägger till **matchformat 3×30**, och utvidgar **cancelled-orsaker**.

### 8.2 Refactoring-plan

**Steg 1: Ersätt regionalClimate med klubb-klimatprofil**

```typescript
// Förut:
const climate = getClimateForRegionAndMonth(homeClub.region, month)

// Nytt:
const profile = getClimateProfileForClub(homeClub.id)
const stats = profile.matchDayClimate[matchDay]  // matchDay = roundNumber
const climate = {
  avgTemp: stats.tempMean,
  tempVariance: stats.tempStdDev,
  // Möröversatta sannolikheter:
  heavySnowChance: stats.snowfallProb * 0.4,  // 40% av snöfall är kraftigt
  snowChance: stats.snowfallProb,
  fogChance: stats.fogProb,
  thawChance: stats.thawProb,
}
```

Klubbprofilen ger mätta värden per matchday, inte per region+månad. Karlsborg och Skutskär ligger i samma region (Norrland) men har vitt skilda klimat — nu skiljs de.

**Steg 2: Lägg till matchformat-detektering**

Efter att `temp` och `condition` slumpats men före `iceQuality`-uträkning:

```typescript
// Ny field i Weather:
let matchFormat: '2x45' | '3x30' | 'cancelled' = '2x45'
let cancelReason: 'extreme_cold' | 'fog' | 'storm' | 'thaw' | undefined

if (!homeClub.hasIndoorArena) {
  if (temp <= -22) {
    matchFormat = 'cancelled'
    cancelReason = 'extreme_cold'
  } else if (temp < -17) {
    matchFormat = '3x30'
  }
  if (condition === WeatherCondition.Fog && rand() < 0.4) {
    matchFormat = 'cancelled'
    cancelReason = 'fog'
  }
  if (windStrength > 22 && rand() < 0.3) {
    matchFormat = 'cancelled'
    cancelReason = 'storm'
  }
}
```

Nuvarande `cancelled` (från töväder) blir en av flera möjliga cancel-orsaker. `cancelReason` blir ny field i `MatchWeather` för att commentary ska kunna tagga rätt anledning.

**Steg 3: Bevara bakåtkompatibilitet**

Alla befintliga callers av `generateMatchWeather()` ska fortsätta fungera. Nya fields i `Weather` (matchFormat, cancelReason, fogDelayMinutes) ska vara optional eller med default-värden.

**Stöpis-detektering:** Skjuts till framtida sprint. Det kräver `weatherHistory`-state-extension på SaveGame och rolling-window-cache i roundProcessor — mer arbete än MVP-scope. Se separat framtida-feature-spec när vi tar det.

### 8.3 regionalClimate.ts

Efter klubb-klimatprofil-implementationen kan `regionalClimate.ts` deprecateras eller behållas som fallback om klubbprofil saknas. **Behålla som fallback** är att föredra — om någon lägger till en ny klubb i `worldGenerator.ts` utan att lägga till klimatprofil ska vädret ändå fungera.

---

## 9. matchEngine integration

### Match-format-koppling

```typescript
// src/domain/services/matchEngine.ts (existerande, uppdatering)

function startMatch(homeClub: Club, awayClub: Club, day: GameDay) {
  const weather = weatherService.generateMatchWeather(homeClub.id, day.matchDay, rng)

  if (homeClub.facilities.hasIndoorArena) {
    // Inomhus — vädret påverkar inte mekaniskt, men sparas för commentary-kontrast
    return runMatchNormalFormat(homeClub, awayClub, day, weather, isIndoor: true)
  }

  switch (weather.matchFormat) {
    case 'cancelled':
      return scheduleMatchPostponement(homeClub, awayClub, day, weather.cancelReason)
    case '3x30':
      return runMatch3x30Format(homeClub, awayClub, day, weather)
    case '2x45':
    default:
      return runMatchNormalFormat(homeClub, awayClub, day, weather, isIndoor: false)
  }
}
```

### Iskvalitet påverkar spel
- **Bra is (80-100):** snabbt spel, normal lågshjudd, hörnor stannar
- **Mediokra is (50-80):** lite långsammare, fler missade passningar
- **Dålig is (0-50):** kraftiga avdrag på spelarbetyg, fler vändningar i spelet, hörnor mindre effektiva

Dessa är **multiplicerande modifierare** på befintliga matchberäkningar — inte ersättningar. (Närmare detaljer behövs i implementation; lämnar utrymme för Code-experter.)

---

## 10. Match-commentary integration

Vädret skickas till `matchCommentary`-modulen som ny kontext. Existerande commentary-poolar utökas med väderkategori.

### Triggers per arketyp
| Arketyp | Triggers extra commentary |
|---|---|
| `arctic_coast` | Vid temp < −15: stoltheten över att kunna spela. Vid temp < −20: "regelboken hängde över oss innan tipoff" |
| `valley_coldpit` | Vid klart + vindstilla + temp < −10: "köldhåls"-tema (Lesjöfors-arketyp) |
| `vanern_effect` | Vid dimma: "Vänern är öppen mot inland" |
| `scanian_coast` | Vid plusgrader: "vargavinter-väntan" |
| `bruk_river_island` | Söderfors-specifik — ön i älven, dimma över vattnet |
| `sm_highland_extreme` | Målilla — termometer-temat, extrema utsving |
| `gulf_coast` | Skutskär — pappersbruksrök, havsdimma |

### Sjöis-historik som commentary-resurs
Match-start-commentary kan trigga *sällan* (kanske 5%) en *gamla bandygubbar minns*-fras som hänvisar till klubbens historiska sjöis-spel. Pool av referenser per klubb från `loreReferences`-fältet:

| Lore-tag | Klubb(ar) | Användning |
|---|---|---|
| `coldpit_lore` | Lesjöfors | "I trakten har det alltid frusit lite extra på vintrarna" |
| `1960_iceincident` | Forsbacka, Heros, Slottsbron | "Gamla bandygubbar minns vintern då motståndarlaget gick i plurret på sjön" |
| `mariehov_naturisstruggle` | Forsbacka | "Klubben har kämpat mot vädrets makt i decennier" |
| `bodaan_first_match` | Skutskär | "Allt började på en frusen å — den första matchen, bandyspelet föddes där ute" |
| `soderfors_island` | Söderfors | "Vägen till matchen går över bron" |
| `bandydopet_smeddamm` | Lesjöfors | "Hemmaplanen har flyttats tre gånger genom historien — varje plats har sin saga" |
| `vanern_strandvallen_vm` | Slottsbron | "På den här planen har VM avgjorts" |
| `targetstaden_termometer` | Målilla | "I vår by står en 15 meter hög termometer på torget" |
| `nordligaste_pappersbruket` | Karlsborg | "Vi spelar längst norr i bandy-Sverige" |

Dessa skrivs ut i full tonalitet av Opus i en separat textinsamling (sprint efter implementation).

---

## 11. DailyBriefing väderkategori

Ny kategori i daily-briefing-systemet: **väder-händelser**.

### Triggers
- **Köldperiod:** Tre dagar i rad < −15°C → "−18° i Karlsborg sedan tre dagar. Spelarna oroar sig för bortamatchen i fredag."
- **Snöoväder:** Snödjup ökat med 20+ cm på 24h → "Plogen kämpat hela natten. Nästa hemmamatch kan bli intressant."
- **Töväder mitt i säsongen:** Plusgrader när det varit minus → "Plus 3° i Slottsbron i dag. Gamla bandygubbar skakar på huvudet."
- **Dimrisk inför match:** Hög dimprob nästa matchdag → "Vänern är öppen och fukten ligger tjock. Imorgon kan det bli problem."
- **Stormvarning:** Vind > 18 m/s prognos → "SMHI varnar för storm. Frågan är om matchen ens spelas."

### Implementation
DailyBriefing-systemet förväntas ha en `categoryRouter` som bestämmer vilka kategorier triggas på olika dagar. Lägg till `weather`-kategori med ovan triggers.

Texterna kuras i separat sprint av Opus, som hänvisar till KLUBBFAKTA för geografiska referenser.

---

## 12. THE_BOMB 4.2 — Matchstart-känsla i 123-vyns första steg

Detta är **den scenografiska kopplingen** till resten av spelet. 123-matchvyns första steg (innan tipoff) får en två-sekunders fade-in med vädret som inramning.

### Layout
```
[ARENA-NAMN]                              [DATUM, TID]
[KLUBB] mot [BORTALAG]

  [VÄDER-RAD: temperatur, conditions]
  [PUBLIK-SIFFRA om relevant]
  [SPECIALSTATUS om relevant: "Match 3×30 enligt regelboken"]

   [TIPOFF →]
```

### Exempel
**Karlsborg, kall januari-tisdag:**
> Bruksvallen, Karlsborg. −16°. Klart, stilla. 312 åskådare.
> *Match 3×30 minuter enligt regelboken. Pauser för uppvärmning.*

**Rögle, februari-helg, plusgrader:**
> Kullavallen, Rögle. +2°. Mulet, lätt regn.
> Isen är knottrig. Domaren har lovat extra röjningspauser.

**Lesjöfors, klar januarinatt:**
> Stålvallen, Lesjöfors. −14°. Klart, helt stilla.
> Köldhål är ett gammalt smeknamn för orten. Det hörs.

**Söderfors, dimma:**
> Bruksvallen, Söderfors. −3°. Tät dimma över älven.
> Tipoff försenad 45 minuter. Domaren väntar på bättre sikt.

### Format-regler för texten
- **Rad 1:** Arena, klubb, temperatur, conditions (kort)
- **Rad 2:** Antal åskådare ELLER specialstatus ELLER lokal anekdot (max 1)
- Maxlängd ~140 tecken
- Genereras från template-pool per arketyp + matchspecifik data
- Kuras av Opus i separat textinsamlingssprint

### Implementation-prompt för Code
123-matchvyns första steg behöver:
1. Ett nytt fält i match-state: `matchOpeningContext: { arenaName, weatherSummary, statusNote? }`
2. Generering av detta fält i `matchEngine.startMatch()` baserat på weather + klubbdata
3. UI-komponent som renderar texten med fade-in animation (300ms in, hålls 2s, sen "Tipoff →"-knapp)
4. Skip-knapp för spelare som vill hoppa förbi (sparas i userPreferences)

---

## 13. Klubbvy — klimatkort

Ny komponent i klubb-vyn: **Klimatkort**.

```
KLIMAT
─────────────────────────────────────────
Vinter normal: −4°C medel, snödjup ~25 cm
Säsongen 2026/27 hittills: kallare än normal

Kommande hemmamatch (omg 8, 5 dec):
  Sannolikt ~−6°, måttlig snörisk
─────────────────────────────────────────
```

För klubbar med inomhushall:
```
KLIMAT
─────────────────────────────────────────
Vinter normal: −4°C medel
Spelar inomhus — vädret påverkar inte matchen mekaniskt
men kan förstöra resor till bortamatcher
─────────────────────────────────────────
```

Kortet bygger på `climateProfile.matchDayClimate` + nuvarande säsongs hittills genererade vädervärden.

---

## 14. Faseringsplan

### Sprint W1 — Datainsamling (1 dag, Python utanför game-bygget)
- [ ] Skriv `scripts/collect_weather_history.py`
- [ ] Hämta PTHBV-data + station-data för alla 12 klubbar
- [ ] Verifiera koordinater mot KLUBBFAKTA
- [ ] Generera `data/climateProfiles.json`
- [ ] Visualisera output (snabb sanity check — Karlsborg ska vara mycket kallare än Rögle)

### Sprint W2 — Datamodell + ClubTemplate-uppdatering (2-4h)
- [ ] Lägg till `climate`-field på `ClubTemplate`
- [ ] Lägg till `loreReferences[]`-array
- [ ] Importera climateProfiles.json som typad data-fil
- [ ] Skriv typescript-typer från SPEC §6
- [ ] Test: alla klubbar har klimatprofil med rätt arketyp

### Sprint W3 — weatherService refactor (4h)
- [ ] Implementera `generateMatchWeather()` enligt SPEC §8
- [ ] Implementera `sampleClippedNormal`, `calculateIceQuality`, `deriveConditions`
- [ ] Test: 1000 simulerade säsonger — verifiera att percentiler stämmer
- [ ] Test: Karlsborg har fler 3×30-matcher än Rögle (statistisk validering)

### Sprint W4 — matchEngine match-format-koppling (1 dag)
- [ ] Hantera `matchFormat: '3x30'` i matchEngine
- [ ] Hantera `matchFormat: 'cancelled'` med schemaomflyttning
- [ ] Iskvalitet → spelarbetyg-modifierare (modesta, multiplicerande)
- [ ] Test: cancelled match flyttas korrekt till nytt datum
- [ ] Test: 3×30 matcher har rätt antal perioder och pauser

### Sprint W5 — Klubbvy klimatkort + Daily briefing väderkategori (3h kod + 2h text)
- [ ] Klimatkort-komponent
- [ ] DailyBriefing väderkategori i categoryRouter
- [ ] Opus skriver väder-briefing-pool baserad på arketyp + KLUBBFAKTA

### Sprint W6 — Match-commentary integration (4h kod + 4h text)
- [ ] Vädret skickas som kontext till commentary-modulen
- [ ] Lore-referenser triggas sällan (5%) per arketyp
- [ ] Opus skriver commentary-pool för väder per arketyp

### Sprint W7 — THE_BOMB 4.2 matchstart-känsla (3h kod + 2h text)
- [ ] Matchopening-context-fält
- [ ] Generering i matchEngine.startMatch()
- [ ] UI-komponent med fade-in animation
- [ ] Skip-preference
- [ ] Opus skriver matchopening-pool per arketyp

### Total tid
- Code: ~5 dagar
- Opus (text): ~1 dag fördelat över sprints W5-W7
- Datainsamling: ~1 dag

---

## 15. Risker och öppna frågor

### Risk 1: SMHI-data-volymen är för stor
*Sannolikhet:* Låg
*Mitigering:* PTHBV är optimerat för punkt-uppslag. 12 klubbar × 10 år × 243 dagar/säsong ≈ 29 000 datapunkter per parameter. Inget problem för modern hardware. Filstorlek <2 MB.

### Risk 2: Outliers fördärvar säsong
*Sannolikhet:* Medel
*Mitigering:* Percentil 2-98 klippning. Spelare *vill* ha extremvintrar ibland — det är feature, inte bug. Men bandar bort de mest absurda.

### Risk 3: 3×30-matcher förvirrar UI
*Sannolikhet:* Hög
*Mitigering:* Tydlig kommunikation i 123-matchvyns första steg. Lägg till tooltip som förklarar regelboken: "Vid temperaturer under −17°C spelas matchen i tre perioder med uppvärmningspauser. Detta är enligt Svenska Bandyförbundets spelregler."

### Risk 4: Cancelled matcher kan stapla på säsong-ände
*Sannolikhet:* Låg-medel
*Mitigering:* RoundProcessor måste ha logik för att flytta matcher framåt först, sedan om ingen plats finns lägga in en avgörande "season-ende-rest"-omgång. Behövs designöversikt med Code.

### Öppen fråga 1: Vissa specifika datum exkluderas från matchschema?
- Nuvarande `getRoundDate()` hårdkodar datum. R10 ligger på Annandag jul (26 dec) för derbymatcher. Inga julafton/nyårsafton-krockar. **Verifierat — inget problem.**

### Öppen fråga 2: "Spela genom säsong" + cancellerade matcher
- När en match cancelleras och flyttas framåt — tas den med i auto-spela-genom-säsong-flöde? **Den ska INTE auto-spelas** — cancellation är en händelse spelaren ska se. Flagga som ny inbox-post: "Matchen [klubb A] vs [klubb B] flyttas från [datum] till [nytt datum] på grund av [orsak]."

### Öppen fråga 3: Hemma- och bortalagets klimat
- *Hemmaort styr.* Matcher spelas på hemmaplanen. Bortalaget får hantera resan som flavor (kan komma in som inbox-event under långresor).

### Öppen fråga 4: ~~Säsongens matchschema-mönster~~ — BEKRÄFTAT
- ~~Verifiera tisdag/torsdag/lördag/söndag~~
- **Verifierat:** `scheduleGenerator.ts` har hårdkodade datum, inte veckodagar. Datainsamlingen anpassad i §3.1

### Öppen fråga 5: Inomhushall-byggnation
- I `facilityService` finns bygg-väg för inomhushall. När en klubb bygger inomhushall mid-game — `homeClub.hasIndoorArena` blir `true` direkt. Klimatprofilen påverkas inte (det är ortens klimat, inte arenans), men matchgenereringen får `cancelled = false` och `iceQuality = Good` automatiskt via befintlig logik
- **Verifierat — inget problem.**

### Öppen fråga 6: Veckodagar i schemat — noterat
- Round 11, 12, 15, 18 hamnar på måndagar för 2026/27. Round 19 är fredag. Ovanligt för riktig bandy som typiskt har match tisdag/torsdag/lördag/söndag
- Inte vårt problem att fixa här — men noteras för framtida schedule-revision om designern vill att matcher känns mer realistiska

---

## 16. Bilaga A — Pseudokod för clipped normal sampling

```typescript
function sampleClippedNormal(mean: number, stddev: number, min: number, max: number, rng: RNG): number {
  let value: number
  let attempts = 0
  do {
    // Box-Muller transform
    const u1 = rng.next()
    const u2 = rng.next()
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    value = mean + z * stddev
    attempts++
  } while ((value < min || value > max) && attempts < 10)

  // Fallback: clamp
  return Math.max(min, Math.min(max, value))
}
```

---

## 17. Bilaga B — Exempel utskrift av climateProfiles.json (förkortad)

```json
{
  "version": "1.0",
  "generatedAt": "2026-04-27T...",
  "sourceLicense": "SMHI Open Data, CC BY 4.0 SE",
  "historyYears": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
  "clubs": {
    "karlsborg": {
      "smhiStationId": "162870",
      "smhiStationName": "Kalix",
      "latitude": 65.7944,
      "longitude": 23.2667,
      "geographyArchetype": "arctic_coast",
      "hasIndoorArena": false,
      "loreReferences": ["nordligaste_pappersbruket"],
      "matchDayClimate": {
        "1": { "tempMean": -2.1, "tempStdDev": 4.3, "tempP02": -12.0, "tempP25": -5.2, "tempP50": -2.0, "tempP75": 1.0, "tempP98": 6.5, "snowfallProb": 0.32, "thawProb": 0.28, "fogProb": 0.05, "rainProb": 0.18, "windMean": 3.2, "windP95": 11.0, "iceQualityBaseline": 65 },
        "10": { "tempMean": -10.5, "tempStdDev": 6.2, "tempP02": -25.5, "tempP25": -14.5, "tempP50": -10.0, "tempP75": -6.0, "tempP98": 1.0, "snowfallProb": 0.45, "thawProb": 0.05, "fogProb": 0.03, "rainProb": 0.02, "windMean": 2.8, "windP95": 9.5, "iceQualityBaseline": 78 },
        "20": { "tempMean": -8.0, "tempStdDev": 5.8, "tempP02": -22.0, "tempP25": -12.0, "tempP50": -8.0, "tempP75": -4.0, "tempP98": 3.5, "snowfallProb": 0.38, "thawProb": 0.10, "fogProb": 0.04, "rainProb": 0.05, "windMean": 3.0, "windP95": 10.0, "iceQualityBaseline": 75 }
      }
    },
    "rogle": {
      "smhiStationId": "62290",
      "smhiStationName": "Ängelholm",
      "latitude": 56.2400,
      "longitude": 12.8800,
      "geographyArchetype": "scanian_coast",
      "hasIndoorArena": true,
      "loreReferences": [],
      "matchDayClimate": {
        "1": { "tempMean": 6.8, "tempStdDev": 3.5, "tempP02": -2.0, "tempP25": 4.5, "tempP50": 7.0, "tempP75": 9.5, "tempP98": 13.0, "snowfallProb": 0.02, "thawProb": 0.85, "fogProb": 0.08, "rainProb": 0.45, "windMean": 5.2, "windP95": 13.5, "iceQualityBaseline": 35 },
        "10": { "tempMean": 1.2, "tempStdDev": 3.8, "tempP02": -7.5, "tempP25": -1.5, "tempP50": 1.0, "tempP75": 3.5, "tempP98": 9.0, "snowfallProb": 0.15, "thawProb": 0.50, "fogProb": 0.18, "rainProb": 0.35, "windMean": 5.5, "windP95": 14.0, "iceQualityBaseline": 48 }
      }
    }
  }
}
```

---

## Slut SPEC_VADER
