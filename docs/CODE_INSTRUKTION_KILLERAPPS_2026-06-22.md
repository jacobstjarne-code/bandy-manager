# CODE-INSTRUKTION — killer-apps #2 + #4 + #1-städning

**Datum:** 2026-06-22 · **Av:** Opus · **Till:** Code
**Syfte:** Körordning för resten av killer-app-serien. #1 Callback och #3 Legibel konsekvens är levererade. Detta sekvenserar #2, #4 och en utestående #1-fix. Bygg i ordning. Detaljspec per feature i `SPEC_TRANARENS_BERATTELSE_2026-06-22.md` och `SPEC_GENERATIONSLOOPEN_2026-06-22.md` — den här filen löser ordningen + korsberoenden, specarna bär detaljerna.

---

## STEG 0 — #1-städning (engångsfix, först, ~2 min)
I `src/domain/data/portalBeats.ts`, beat `callback_derby_memory`, sorteringen av förra derbyt:
```ts
// FRÅN:
.sort((a, b) => b.matchday - a.matchday)[0]
// TILL:
.sort((a, b) => (b.season - a.season) || (b.matchday - a.matchday))[0]
```
Matchday nollställs per säsong → utan säsong i sorten kan fel derby visas som "förra". Klart med det.

---

## STEG 1 — #2 Tränarens berättelse (bygg FÖRE #4)
Full spec: `SPEC_TRANARENS_BERATTELSE_2026-06-22.md`. Bygg i denna ordning:

1. **`managerNarrativeLog`** på `ManagerProfile.ts` (typ i specen). Skriv en post vid de fem befintliga ögonblicken: arrival (ny save), burnout_peak (burnoutScore passerar zon-gräns uppåt — samma trösklar som burnout-citaten), era_shift (parallellt med `era_shift`-Momentet i roundProcessor), rivalry (när nemesis etableras), milestone (karriärrekord). **Texterna lämnas TOMMA/placeholder — Opus skriver dem.** Lägg en `// OPUS_COPY`-markör där texten ska in.

2. **`spine`-komponent** — bygg som FRISTÅENDE props-driven presentationskomponent i `src/presentation/components/shared/` (noder in, ingen domänlogik). Detta är den delade komponenten #4 återanvänder — bygg den rätt en gång. Props: lista av `{ label, year/season, text, dimmed? }`.

3. **Tenure-arc i TranareTab** — byt stat-stack mot: bio-öppning (`getManagerBio`) överst + `spine` som renderar `managerNarrativeLog`. Behåll burnout-citat/persona-repliker som innehåll i arcen.

4. **Utsedd nemesis** — score-funktion över `coachRivalries` (intensity × (h2hLosses − h2hWins) × recency), högst score = nemesis. Egen sektion i fliken.

5. **`callback_nemesis`** — NY beat i `PORTAL_BEATS` (callback-bandet, efter board_failure, bland övriga callbacks). Läser härledd nemesis + `coachRivalries`, fyrar via `firesBeforeNextFixture` när nästa motståndare = nemesisens klubb. Severity 1. `// OPUS_COPY`-markör för texten. **OBS — detta är callback-glipan:** levererad `callback_streak` läser `rivalryHistory` (klubb-streak), INTE `coachRivalries`. Designen vill att nemesisen talar — den beaten finns inte, bygg den.

**RAPPORTERA:** Bär `coachRivalries` ett coach-NAMN (ej bara clubId/personality)? Om inte → flagga, nemesis-copy blir klubbankrad ("Lesjöfors-tränaren"). Verifiera mot källan, säg vad du hittade. Rapportera spine-komponentens props-signatur så #4 kan luta sig mot den.

**När strukturen står med `// OPUS_COPY`-markörer → tillbaka till Opus för texterna innan #2 stängs.**

---

## STEG 2 — #4 Generationsloopen
Full spec: `SPEC_GENERATIONSLOOPEN_2026-06-22.md`. **Dataspärren FÖRST — utan den finns ingen tråd:**

1. **`mentorshipHistory` / `MentorshipRecord`** (typ i specen) på SaveGame. Skriv en post när ett mentorskap STARTAR (i youthProcessor/mentorship-skapandet), stäng den (`endSeason`/`outcome`) när det avslutas. Idag filtreras mentorships på `isActive` → historiken tappas. Denna logg sluts aldrig, växer bara. **Bygg detta före blodslinje-vyn.**

2. **Avskeds-ceremoni** — scen som fyrar när legend/mångårig spelare pensioneras. Läser `RetirementData` (farewell, bestMoment, careerStats). Återanvänd ceremoni-chrome från slutspelsscenerna. **Föreslå mångårig-tröskel** (X säsonger i klubben) — Opus ratificerar, undvik statsceremoni för varje 34-åring.

3. **Blodslinje-vy** i HistoryScreen/Minne — ritar mentor-kedjan via `spine` (BYGGD I STEG 1 — återanvänd, bygg den INTE igen; kontrollera `components/shared/` först). Härled ur `clubLegends` + `mentorshipHistory` + `narrativeLog`. Namn länkar i båda riktningar.

4. **Legend-callbacks** — nya `PORTAL_BEATS` (callback-bandet): lärling bär bindeln, lärling debuterar, legendrekord närmar sig. Trigger läser `mentorshipHistory` + `clubLegends`/`isLegend`. Severity 0–1, nonActionable. `// OPUS_COPY`-markörer.

**RAPPORTERA:** Föreslagen pensionströskel. Bekräfta att `spine` återanvändes (ej ombyggd). När strukturen står med `// OPUS_COPY`-markörer → tillbaka till Opus för texterna.

---

## SAMMANFATTNING AV ORDNING
1. Derby-sortfix (STEG 0)
2. #2: managerNarrativeLog → spine → tenure-arc → nemesis → callback_nemesis → **Opus copy**
3. #4: mentorshipHistory (spärr) → avskeds-ceremoni → blodslinje-vy (återanvänd spine) → legend-callbacks → **Opus copy**

All svensk text är `// OPUS_COPY`-markörer — Code rör den inte, Opus fyller när strukturen står. Rapportera per killer-app mot specens verifieringssteg.
