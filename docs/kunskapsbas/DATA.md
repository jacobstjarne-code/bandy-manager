# Kunskapsbas: Bandygrytan-datan

**Syfte.** Beskriver vad vår data faktiskt innehåller — fält för fält, vad som är källdata och vad som är härlett, var luckorna finns. Detta är skillnaden mellan vad bandy *är* (`REGLER.md`) och vad vi kan *se* av bandy genom datan. De flesta feltolkningar uppstår i glappet mellan de två. Läs vid sessionstart för bandy-analys.

**Samägt dokument.** Strukturen och de dokumenterade lärdomarna är skrivna av Opus. Den auktoritativa fält-för-fält-verifieringen mot rå-Firebase är Code:s ansvar (data foundation audit). Punkter markerade `[CODE VERIFIERA]` är ännu inte bekräftade mot källan och ska inte litas på förrän de är det.

**Bakgrund till varför detta dokument finns:** På 48 timmar i maj 2026 hittade vi tre fall där datans struktur inte var vad vi antagit — minute-konventionen, foul-team-attributionen och foul-duration. Var och en orsakade eller hotade en felaktig slutsats. Lärdomen: vi måste veta exakt vad varje fält innehåller, inte gissa utifrån fältnamn. Detta dokument är försvaret mot den klassen av fel.

**Data foundation audit:** Utförd 2026-06-02. Alla `[CODE VERIFIERA]`-markeringar stängda — se avsnitt 6.

---

## 1. Källa och täckning

- **Källa:** bandygrytan.se via Firebase Realtime Database. Ideellt driven (Vänersborg). Öppen, scrapbar.
- **Primärfil:** `docs/data/bandygrytan_detailed.json`. Aktuell `schemaVersion: 4` (efter half-flag-berikning).
- **Separata filer:** `bandygrytan_allsvenskan.json`, `bandygrytan_kval.json`, `bandygrytan_stats.json`, `bandygrytan_calibration_targets.json`.

**Täckning — verifierad 2026-06-02:**

| Serie | Säsonger | Matcher | Anmärkning |
|---|---|---|---|
| Elitserien herr (grundserie + slutspel) | 2019-20 – 2025-26 | 1321 | 2023-24 saknas |
| Elitserien dam | 2019-20 – 2025-26 | 428 | 2023-24 saknas |
| Matcher med domardata | alla | 1745/1749 | 4 saknar (2019-20) |
| Matcher med half-flagga | alla | 1748/1749 | 1 saknar event 13 |
| Bandyallsvenskan herr | 2019-20 – 2024-25 | ~887 | separat fil |
| Kval | 2019-20 – 2022-23 | ~38 | separat fil |

Säsong **2023-24 saknas helt** — competition fixture-lista fanns inte i Bandygrytans API vid scraping. Alla tidsserieanalyser måste hantera detta gap utan att tolka det som inaktivitet.

**Inga täckningsgap per säsong utöver 23-24:** Inga matcher med mål (score > 0) men tomma goals[]-arrayer identifierades. Inga systematiska event-gap per säsong observerade i sample.

---

## 2. Händelsetyper i rå-Firebase — komplett lista

Verifierad 2026-06-02 via Firebase spotcheck (6 säsonger, 5 matcher per säsong).

| Kod | Namn | Fält av intresse | Extraherat? |
|-----|------|-----------------|------------|
| 1 | Hörna | `teamID`, `min`, `sec` | Ja (via corners-räkning) |
| 2 | Mål | `teamID`, `playerID`, `assistPlayerID`, `info`, `homeGoals`, `awayGoals` | Ja |
| 3 | Utvisning | `teamID`, `playerID`, `number` (duration 5/10), `info` (orsak), `hidden` | Delvis — duration och info EJ extraherade |
| 4 | Straff (tilldelad) | `teamID`, `homeGoals`, `awayGoals`. Ingen `playerID`. | Ja |
| 5 | Grovt matchstraff | `teamID`, `playerID`, `number` (=60), `info`, `hidden:true`. Text: "Grovt matchstraff (X)" | NEJ — inte extraherat |
| 6 | Timeout | `teamID`, `min` | NEJ |
| 7 | Lagvarning | `teamID`. Text: "Lagvarning" | NEJ |
| 8 | Tilläggstid | `number` (minuter tilläggstid). Text: "Tilläggstid: X" | NEJ |
| 9 | Redaktionell text | `text` (fritext), `comment` | NEJ |
| 10 | Frislag | `teamID`, `min` | NEJ |
| 11 | Skott på mål | `teamID`, `min` | Indirekt (via shotsHome/Away) |
| 12 | Matchstart | `min`, `text` | Ja (via halvleksgränser) |
| 13 | Halvtid | `homeGoals`, `awayGoals`, `min` (varierar 45–53) | Ja — halvtidsresultat + half-flag |
| 14 | Andra halvlek start | `min` (konstant = 45, ej verklig tidsstämpel) | Ja (ignoreras som halvleksmarkör) |
| 16 | Matchslut | `min` | Indirekt |
| 19 | Missad straff | `teamID`. Text: "Missad straff" | NEJ |
| 20 | Missad hörna | `teamID`, `min` | NEJ |
| 21 | Publiksiffra (text) | `number` (publik), text | NEJ — publik hämtas från getFixtureData.spectators |
| 23 | Målvaktsräddning | `teamID`, `playerID` | Indirekt (via savesHome/Away) |
| 24 | Info-event (GK-info, publik) | `text`, `number` | NEJ |
| 101 | Okänt (hidden) | minimal | NEJ |
| 107 | Offside | `teamID`, `min` | NEJ |

**Anmärkning typ 5:** Grovt matchstraff (`number: 60`) är en separat händelsetyp från reguljär utvisning (typ 3). Den är inte extraherad i `bandygrytan_detailed.json`. Frekvens okänd (ovanlig, syntes i 2022-23 och 2024-25 i spotcheck).

**Anmärkning typ 7:** Lagvarning är en teamvarning utan individuell spelartilldelning. Ej extraherat.

---

## 3. Fält-för-fält — källdata kontra härlett

Verifierad 2026-06-02.

| Fält i JSON | Ursprung | Härledningsregel / Kommentar | Tillförlitlighet |
|-------------|----------|------------------------------|-----------------|
| `homeScore` / `awayScore` | **Källdata** | Direkt från `getFixtureData.homeGoals/awayGoals` | Hög |
| `halfTimeHome` / `halfTimeAway` | **Källdata** | `homeGoals`/`awayGoals` på event type 13 | Hög |
| `goals[].minute` | **Källdata** | `min` på event type 2 | Hög |
| `goals[].team` | **Härlett** | `teamID` → home/away via jämförelse med `fd.homeTeamID` | Hög |
| `goals[].type` | **Härlett** | Straff: ev typ 4 ≤1 min före. Hörna: ev typ 1 ≤2 min. Annars: open. | Medel — 2-min-fönster är heuristik, inte källattribut. Kalibrerat mot ~22% och stämmer. |
| `goals[].scorerId` | **Källdata** | `playerID` på event type 2 | Hög — 99,7% täckning (15 863/15 912 mål) |
| `goals[].assistId` | **Källdata** | `assistPlayerID` på event type 2 | Hög (täckning ej räknad) |
| `goals[].half` | **Härlett** | Position relativt event 13 i tidsstämpelordning (schemaVersion 4) | Hög — 1748/1749 via event 13, 1/1749 via min>=46-fallback |
| `fouls[].minute` | **Källdata** | `min` på event type 3 | Hög |
| `fouls[].team` | **Härlett** | `teamID` (källdata) → home/away. teamID finns i 100% av event type 3 sedan 2019-20. | Hög |
| `fouls[].duration` | **SAKNAS** | `number`-fält i källan (5 eller 10 min) — vår JSON har `None` för alla. Scraper läste aldrig fältet. | — Ej extraherat |
| `fouls[].half` | **Härlett** | Position relativt event 13 (schemaVersion 4) | Hög |
| `fouls[].info` (orsak) | **SAKNAS** | `info`-fält i källan: "Våldsamt slag", "Hakning" etc. — ej extraherat. | — Ej extraherat |
| `corners.home` / `corners.away` | **Härlett** | Räknar event type 1 per teamID | Hög |
| `penalties[].team` | **Härlett** | `teamID` → home/away från event type 4 | Hög |
| `penalties[].minute` | **Källdata** | `min` på event type 4 | Hög |
| `referees.main` | **Härlett** | Person med `positionID=20` i `getFixtureData.referees` | Hög — 99,8% täckning |
| `referees.assistants` | **Härlett** | Persons med `positionID=21` i `getFixtureData.referees` | Hög |
| `shotsHome` / `shotsAway` | **Härlett** | Räknar event type 11 per teamID | Låg — kraftigt underrapporterad (10,5 vs ~28 Bandypuls) |
| `savesHome` / `savesAway` | **Härlett** | Räknar event type 23 per teamID | Låg — samma underrapporteringsproblem |
| `attendance` | **Källdata** | `getFixtureData.spectators` | Medel — saknas i många matcher |

---

## 4. KRITISKT: minute-konventionen

**Använd inte `minute >= 46` för att avgöra andra halvlek.** Det var länge vår regel och den är fel.

Verifierat (maj 2026): event 13 (Halvtid) inträffar vid median minut 46, men med range 45–53. Matchklockan i bandy nollställs inte vid halvtid, men tilläggstid i första halvlek loggas på ett sätt som gör att minute 46–50 kan vara antingen sen 1H-tilläggstid eller tidig 2H. 24,4 % av matcherna hade minst ett event i 46–50 som var 1H-tilläggstid felklassificerat som 2H med den gamla regeln; ~9 % hade ett felklassificerat mål.

**Konsekvens:** Alla minutbaserade analyser med skarpa gränser nära minut 45 är opålitliga om de inte använder half-flaggan. 30-minutersbuckets (0–29, 30–59, 60–89, 90+) är robusta. 10-minutersbuckets och 5-minutersbuckets nära halvtidsgränsen är inte det utan half-flagga.

---

## 5. Duration och orsak — verifierat 2026-06-02

**Duration (5/10 min):**

`fouls[].duration` i vår JSON är `None` för alla poster — scraper-logiken extraherade aldrig `number`-fältet. Källa har `number: 5` eller `number: 10`.

Distribution från Firebase-spotcheck (30 matcher, 5 per säsong):

| Säsong | 5-min % | 10-min % |
|--------|---------|---------|
| 2019-20 | 5,9% | 94,1% |
| 2020-21 | 6,7% | 93,3% |
| 2021-22 | 5,6% | 94,4% |
| 2022-23 | 8,3% | 91,7% |
| 2024-25 | 14,3% | 85,7% |
| **2025-26** | **37,5%** | **62,5%** |
| **Totalt** | **15,0%** | **85,0%** |

Ökningen av 5-minutersutvisningar 2025-26 (från ~6–14% till 37,5%) korrelerar med "Våga visa rött"-direktivet och representerar ett mer granulerat mätbart reformspår än den totala volymökningen.

**Orsaker (`info`-fältet) — unika värden i spotcheck:**
Bentackling, Fasthållning, Friläge, Hakning, Interference, Ojust tackling, Olämpligt upptr./uppträdande, Sabotage, Slag på klubban, Slag på skridskon, Våldsamt slag

**Grovt matchstraff (typ 5):** `number: 60`, text "Grovt matchstraff (X)". Ej extraherat i vår JSON. Frekvens ovanlig (2 observerade i spotcheck).

**cornerGoal-parsern:** Ingen avvikelse identifierad i 100-matchs-stickprov (stored cornerGoalsHome ≡ beräknat från goals[].type='corner'). Parsern i `bandygrytan_detailed.json` fungerar korrekt — det kända felet gäller allsvenskan/kval-scraperlogiken i `scrape-allsvenskan.mjs`, inte detailed.json.

---

## 6. Findings-revision — minute-konventionens påverkan

Verifierad 2026-06-02.

| Finding | Minutbuckets | Använder half-flagga | Status | Anmärkning |
|---------|-------------|---------------------|--------|------------|
| 001 — HT-ledning vinner 78% | Nej (HT-baserad) | Ej relevant | **Opåverkad** | Baseras på halfTimeHome/Away |
| 004 — Mål per matchminut | 10-min buckets | Nej (gamla data) | **Tolkning caveat** | Bucket 40–50 spannar halvtidsgränsen. Siffran 54.2% H2 är robust (halvlek-baserad, ej minut-baserad) |
| 005 — Målkluster 40–50 och 80–90 | 10-min (40–50 specifikt) | Nej | **Tolkning caveat** | Klustret 40–50 är reellt men spänner över HT-gränsen. Inte en databas-felkälla, men bör kommenteras |
| 008 — 40–50 jämnt fördelat (49.6/50.4) | 5-min (40–45 vs 46–50) | Nej | **Tolkning caveat** | 46–50-bucketen kan innehålla 1H-tilläggstid. Fundar: "hälften i 46–50 är egentligen 2H" — oklart om sant |
| 017 — Comeback-andel 27% vid 96–100 min | 5-min (91–135+) | Nej | **Supersedd av Finding 051** | Gammal convention + gammalt dataset (1124 matcher). Ersätts av 051. |
| 037, 041, 043 — Comeback-tajming | 5-min (91–135+) | Nej | **Supersedd av Finding 051** | Dito |
| 051 — Comeback-fönstret 27,0% | half-flagga | **Ja** | **KORREKT** | Verifierad med clean data |
| 052 — Reformen +25% | half-flagga | **Ja** | **KORREKT** | Perioder 0–29, 30–44 etc. |

**Kräver ingen publicerad omräkning:** Findings 005 och 008 är faktamässigt korrekta som "mål per rådata-minutbucket" — de beskriver när på klockan mål faller, vilket inkluderar 1H-tilläggstid. En interpretation-not kan läggas till men är inte nödvändig för att korrektheten ska hålla.

**Supersedda findings:** 017, 037, 041, 043 är formellt korrekta baserade på den data de hade — de bygger på den gamla minutkonventionen och ett äldre dataset (1124 herr-matcher vs nuvarande 1321). Finding 051 ersätter dessa med korrekt half-flagga och komplett dataset.

---

## 7. Kända begränsningar

- **Skottdata kraftigt underrapporterad:** ~10,5 skott/match i Bandygrytan mot ~28 i Bandypuls. All skottnivåanalys är handikappad.
- **`fouls[].duration` + `fouls[].reason`/`reason_norm` extraherade (schemaVersion 5, 2026-06-03).** Källästa bakåt till 2019 (100% täckning). 7,7% 5-min, 92,1% 10-min i hela datasetet.
- **Klubbnamn normaliserade (2026-06-03).** Renderingsvarianter (Villa Lidköping BK / Villa-Lidköping BK, Sandvikens AIK / AIK/BK, Edsbyn-varianter m.fl.) slås ihop via `scripts/pipeline/club_names.py` + `docs/data/club_name_map.json`. Aldrig olika klubbar (Lidköpings AIK ≠ Villa-Lidköping). 33→23 herr, 22→14 dam kanoniska namn.
- **Grovt matchstraff (typ 5, 60 min) ej extraherat.**
- **Lagvarning (typ 7) ej extraherat.**
- **Missad straff (typ 19), Missad hörna (typ 20), Timeout (typ 6) ej extraherade.**
- **`goals[].type` är heuristisk** (2-min-fönster för hörna). Felfrekvens okänd men kalibrerad mot ~22% och stämmer på aggregat.
- **2023-24 saknas.**

## 8. Princip framåt

När ett nytt fält ska användas i en analys: kontrollera först i detta dokument om dess ursprung är verifierat. Är det inte det — verifiera mot rå-Firebase innan slutsatser dras, och dokumentera fyndet här. Gissa aldrig utifrån fältnamnet.

---

*Kunskapsbas för Bandy Manager. Strukturen av Opus, verifieringen av Code. Data foundation audit genomförd 2026-06-02.*
