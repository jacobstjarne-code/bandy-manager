# EVALUATION & IMPLEMENTATION PLAN — Dolda system 2026-05-14

Utvärdering och implementation av ~20 dolda/experimentella system identifierade i FLOW_AUDIT_2026-05-14.

---

## STEG 1 — INSTRUMENTERING (samla data först, inte gissa)

Innan vi tar beslut om vilka system som ska kopplas upp eller tas bort, behöver vi VETA hur ofta de triggas och vad de producerar. Spelar-magkänsla räcker inte.

### A. Bygg en in-game DEBUG-vy (engångsinvestering)

Skapa en hidden `/game/debug`-route som listar alla state-attribut + system-output över aktuell session. Visar:

- **Trigger-frekvens** per system (antal gånger triggat per säsong)
- **Aktiv state** för varje system (är det "på" just nu?)
- **Senaste output** (vad genererade det senast?)
- **UI-koppling-status** (är systemet kopplat till ett synligt element?)

Exempel:

```
─── chemistryStats ──────────────────────────────
Trigger-frekvens: varje match (~26/säsong)
Aktiv state: 145 par tracked, snitt 270 min spelat
Senaste output: Andersson↔Lindberg 540 min
UI-koppling: ❌ INGEN
Konsumeras av: match-engine? unknown
```

Detta är ett 2-3 timmars-jobb och betalar sig snabbt. Utan det gissar vi i blindo.

### B. Auto-spela 1 säsong med loggning

Med debug-vyn aktiv, kör simulator över en hel säsong (26 omgångar). Spara loggen. Resultatet: konkret frekvens-data för alla system.

Detta kan göras antingen genom existing skip-mekanik eller en separat "spela genom säsongen"-knapp i debug-läget.

---

## STEG 2 — KATEGORISERING (efter data)

När vi har data, kategoriserar vi varje system i en av fyra hinkar:

### 🟢 LEVANDE (redan synlig, ingen action)
- Resultatet av systemet syns klart för spelaren
- Triggas i rimlig frekvens
- Bidrar till gameplay-känslan

### 🔵 KOPPLA UPP (har potential, behöver UI)
- Triggas tillräckligt ofta för att vara värt
- Resultatet är meningsfullt men gömt
- Behöver UI-yta: kort, modal, anslag, scen, eller granska-flik

### 🟡 INTEGRERA (finns men passiv)
- Existerar i state men påverkar inte spelarens beslut
- Behöver kopplas till MEKANIK, inte bara visning
- Risk: bakgrundsstatistik som ingen läser

### 🔴 TA BORT (död kod)
- Triggas aldrig eller mycket sällan
- Resultatet är inte intressant
- Ren cleanup-möjlighet

---

## STEG 3 — UTVÄRDERINGSMALL (per system, 5 frågor)

För varje misstänkt system, svara på följande:

### Q1: Triggar-frekvens
Hur många gånger per säsong producerar systemet output?
- 0-1: sällsynt (acceptabelt för one-shot/special)
- 2-5: lågfrekvent (kräver "wow"-faktor för att vara värt)
- 6-15: medel (bör vara synligt i normal flöde)
- 16+: hög (om inte synligt → spam-risk)

### Q2: Gameplay-värde
Vad producerar systemet egentligen?
- A. Story/narrative (atmosfär, läsupplevelse)
- B. Beslut (spelaren får välja något)
- C. Status (mätare/state som påverkar andra system)
- D. Konsekvens (event som händer åt spelaren)

### Q3: Synlighet just nu
Var ser spelaren resultatet?
- inbox-item (lätt att missa)
- dashboard-kort (synligt men kortvarigt)
- modal/anslag (mid-flöde, läses)
- scen (high-impact)
- INGENSTANS (dolt)

### Q4: Friktion vs värde
Skulle synliggörandet kosta spelaren tid att läsa/beslut?
- Om JA + lågt värde → bättre dolt
- Om JA + högt värde → bygg det
- Om NEJ → lätt att synliggöra

### Q5: Koppling till spelarmål
Hur knyter systemet till varför spelaren spelar?
- Tävla i serien
- Bygga klubb/community
- Personlig coach-arc
- Narrativ upplevelse
- INGET (varningsklocka)

---

## STEG 4 — PER-SYSTEM PRELIMINÄR BEDÖMNING

Baserat på kod-läsning, INNAN data från debug-vyn. Måste valideras.

### Hög-prio kandidater för KOPPLA UPP

#### 🔵 `clubEra` + era_shift Moments
**Q1:** ~1 era-shift per 3-5 säsonger (uppskattning baserat på villkoren)
**Q2:** C (status) — eran är manager-progressionens centrum
**Q3:** Bara via era_shift-moment vid shift. Permanent state är osynligt.
**Q4:** Lågt — bara en badge/label på dashboard
**Q5:** ✅ Tävla + coach-arc

**Förslag:** Permanent era-badge på Portal (top-left under klubbnamn), plus era-info i Granska-vyns sidopanel. Mock klar (se nedan).

#### 🔵 `mecenater` (mecenat-system)
**Q1:** Okänt — spawn-logiken är i `applyMecenatSpawn`, troligen sällsynt
**Q2:** B (beslut) + D (konsekvens) — `mecenatDinnerService` antyder val-mekanik
**Q3:** Okänt — kommer som event? Eller bara backend-state?
**Q4:** Behöver event-flöde
**Q5:** ✅ Bygga klubb + narrativ

**Förslag:** Mecenat-kort i secondary-tier på Portal när en mecenat finns aktiv. Middag-scen som high-impact event. Mock på följt.

#### 🔵 `journalistRelationship`
**Q1:** Triggar inbox vid broken_under_20 + recovered_above_75. Begränsat. State uppdateras dock kontinuerligt.
**Q2:** C (status) + A (story via mejl)
**Q3:** Endast vid extrem-shift. Mellan-läget osynligt.
**Q4:** Lågt — en relations-mätare i Pressmeddelanden/Granska
**Q5:** ✅ Narrativ + community

**Förslag:** Relations-mätare på Pressmeddelanden-fliken (om den finns) eller i Granska > Media-sektion.

#### 🔵 `nemesisTracker`
**Q1:** Triggas vid derby-vinster. ~3-5 derby per säsong.
**Q2:** A (story) — atmosfär kring rivalitet
**Q3:** Okänt — `nemesisTracker` uppdateras men användning oklar
**Q4:** Lågt — bara en label i derby-anslag
**Q5:** ✅ Narrativ + tävla

**Förslag:** Visa "Din nemesis: Forsbacka" i derby-anslag och pre-match-kortet vid derby.

#### 🔵 `recentMoments` (era_shift, derby_win, star_injury, captain_crisis)
**Q1:** 3-5 moments per säsong (uppskattning)
**Q2:** A (story)
**Q3:** Sparas i state, oklar UI-koppling
**Q4:** Medel — kräver en Moments-feed någonstans
**Q5:** ✅ Narrativ retention över säsongerna

**Förslag:** Moments-stream på Klubb-vyn (om sådan finns) eller egen Historia-flik. Read-only flode över tid.

### Mid-prio: INTEGRERA (synlig men behöver kopplas till beslut)

#### 🟡 `chemistryStats` (par-min ackumulerat)
**Q1:** Varje match, ~55 par per lineup
**Q2:** C (status) — påverkar troligen match-engine
**Q3:** ❌ INGEN visning
**Q4:** Medel — kemi-visualisering är ofta tråkig
**Q5:** Tävla (om det påverkar matchresultat)

**Förslag:** Verifiera först om chemistry används i match-engine. Om JA — visa i Lista-flikens spelarval (kemiparen som hjälper). Om NEJ — ta bort tracking.

#### 🟡 `trainerArc`
**Q1:** Uppdateras varje runda
**Q2:** C (status) + A (story)
**Q3:** Okänt — kanske via era-shift
**Q4:** Medel
**Q5:** ✅ Coach-arc — KÄRNAN i progressionen

**Förslag:** Coach-profil-vy med arc-stadie ("Andra säsongen som tränare i Forsbacka"). Hög potential, kräver mer kod-dyk.

#### 🟡 `awayTripService` (WEAK-019)
**Q1:** ~12 bortaresor per säsong
**Q2:** B (beslut) — microdecision
**Q3:** Genereras men oklar UI
**Q4:** Hög — varje match en till friktion kan bli tröttsamt
**Q5:** Coach-arc

**Förslag:** Verifiera om awaytrip-beslut faktiskt presenteras för spelaren. Om JA — bedöm friktion. Om beslutet är trivialt → automatisera. Om kännbart → bygg som modal.

#### 🟡 `pressConferenceService`
**Q1:** Triggas via events
**Q2:** B (beslut) + A (story)
**Q3:** "Visas i GranskaScreen" — verifiera
**Q4:** Medel
**Q5:** ✅ Coach-arc + community

**Förslag:** Audita befintlig press-conference-vy. Om den är klick-igenom — bygg om till tre meningsfulla svarsalternativ.

### Låg-prio: troligen TA BORT eller INTEGRERA tyst

#### 🟡/🔴 `volunteers` + `volunteerMorale`
**Q3:** Visas bara via Kafeterian-citat?
**Förslag:** Verifiera. Om bara kafé-text → låg ROI att bygga UI. Behåll som flavor.

#### 🟡/🔴 `facilityProjects` + `facilityBonusTotal`
**Förslag:** Verifiera om det finns en facility-vy. Om JA — visa pågående projekt + ETA. Om NEJ — bygg eller ta bort.

#### 🟡/🔴 `refereeRelations` + `pendingRefereeMeeting`
**Förslag:** Påverkar matcher i bakgrunden? Visa relations-mätare per domare? Eller bara silent state?

#### 🔴 Misstänkt experimentella (kräver kod-djupdyk)
- `schoolAssignmentService`
- `bandyGalaService`
- `bandyLetterService`
- `midSeasonEventService`
- `hallDebateService` + `hallDebateEvents`
- `leadershipService`
- `reputationMilestoneService`
- `playerNotesService`
- `playerVoiceService`

För var och en: hitta `import`-referenser i src/. Om de inte importeras → död kod, ta bort. Om de importeras → spåra till UI.

---

## STEG 5 — PRIO-MATRIX (för IMPLEMENTATION)

Efter data + utvärdering, prioritera enligt:

| System | Värde | Effort | Prio |
|--------|-------|--------|------|
| clubEra badge | Hög | Låg | **🥇 1** |
| nemesis-tag i derby-anslag | Mid | Låg | **🥈 2** |
| Mecenat-kort + middag-scen | Hög | Mid | **🥉 3** |
| Moments-feed | Hög | Mid | 4 |
| Journalist-relations-mätare | Mid | Låg | 5 |
| Coach-arc-profil | Hög | Hög | 6 |
| PressConference-redesign | Mid | Mid | 7 |
| AwayTrip-friktion-audit | Låg | Låg | 8 |
| Chemistry-visualisering | Låg | Mid | 9 |
| Facility-vy | Mid | Mid | 10 |
| Volunteers-flavor | Låg | Låg | (skip) |

Var och en av topp 5 är 1-3 dagars-jobb för Code givet en bra spec.

---

## STEG 6 — IMPLEMENTATIONS-ARBETSORDNING

För varje system som ska KOPPLAS UPP:

1. **Mock på disk** — visa hur det ska se ut innan kod skrivs
2. **Spec till Code** — ackurat datakontrakt, var i koden ändringen sker
3. **Implementation** — Code bygger
4. **Audit** — pixel + flöde mot mock
5. **Playtest** — Jacob verifierar att det känns rätt
6. **Iterate** — tre rundor max

---

## NÄSTA STEG — KONKRET FÖRSLAG

Tre möjliga vägar härifrån:

### Väg A: BYGG DEBUG-VYN FÖRST
Lägg en runda på `/game/debug` som loggar alla system. Auto-spela en säsong. Kom tillbaka med data. Mest grundliga vägen.

### Väg B: TA TOPP 3 PÅ INSTINKT
Mocka och bygg `clubEra-badge` + `nemesis-tag` + `mecenat-kort` baserat på kod-läsning. Hoppa över debug-vyn. Snabbaste vägen — mockar 1-2 ligger nedan.

### Väg C: CLEANUP FÖRST
Lista alla services som INTE importeras någonstans i UI-lagret. Ta bort död kod. Spara läsbarhet och bundle-size. Inget nytt content men minskar yta att hantera.

**Min rekommendation: B** — du har spel-känslan, jag har koden. Vi kan ta debug-vyn senare om vi missar något.

---

## MOCKAR — BIFOGADE

Två mockar levereras separat på disk:
- `docs/mockups/era_badge_v1.html` — permanent era-badge på Portal
- `docs/mockups/mecenat_card_v1.html` — mecenat secondary-card + dinner-scen-teaser

Granska och säg vilka som ska byggas.
