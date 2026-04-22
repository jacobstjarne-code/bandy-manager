# BANDY MANAGER — KVAR

**Datum:** 2026-04-22 (kväll, efter post-playtest session 2 — 8 fixar pushade)
**Syfte:** Allt som är parkerat, spec:at-men-ej-implementerat, eller behöver beslut. Läs vid sessionsstart efter att CLAUDE.md/LESSONS.md/DESIGN_SYSTEM.md/HANDOVER_2026-04-21.md är lästa.

---

## KLART IDAG (2026-04-22, post-playtest session 2)

| # | Fix | Rotorsak | Fil(er) |
|---|-----|----------|---------|
| 1 | HalftimeModal CTA döld på Byten-fliken | Single-scroll-flöde, CTA trycktes under viewport | `HalftimeModal.tsx` |
| 2 | GranskaScreen Spelare-flik scrollar inte | `GameGuard` hade `overflowY: auto` → `height: 100%` i child löste till contenthöjd | `GameShell.tsx` |
| 3 | Dashboard-gap CTA→nav | `paddingBottom: 120px` + GameShell 60px = 180px tomrum | `DashboardScreen.tsx`, `DiamondDivider.tsx` |
| 4 | NewGameScreen välj-klubb-layout | Spec — rubrik, text, CTA-tightning | `NewGameScreen.tsx` |
| 5 | Kapten-händelse trots att kapten valts | `characterPlayerService` kollade inte `game.captainPlayerId` | `characterPlayerService.ts`, `communityEvents.ts` |
| 6 | Shotmap — motståndarmål för långt ned, saknar straffbåge | `GOAL_Y=20` asymmetriskt; ingen `<path>`-arc | `GranskaScreen.tsx` |
| 7 | "bryter igenom" → "slår igenom" | Svengelska-fras i tre filer | `CounterInteraction.tsx`, `matchCommentary.ts`, `youthProcessor.ts` |
| 8 | "brittningen" + "Dominerar sitt område" | Stavfel/felaktig fras | `matchCommentary.ts` |

**Ny lärdom i LESSONS §2:** `overflowY: auto` på en wrapper + `height: 100%` i child bryter child-höjdsberäkningen. Wrapper som ska klippa ska ha `overflow: hidden`, inte `overflowY: auto`.

---

## KLART TIDIGARE

### Sprint 22-serien (stress-test + playtest-runda 1 + 2)

| # | Vad | Status |
|---|-----|--------|
| 22.5 | CTA-konsolidering (.btn-cta) + BottomNav HIDDEN_PATHS | ✅ (med regression — fixad i 22.11) |
| 22.6 | BUG-STRESS-01 archetype enum as-cast | ✅ |
| 22.7 | BUG-STRESS-02 squad depletion (2 rotorsaker) | ✅ |
| 22.8 | BUG-STRESS-03 AI positionCoverage | ✅ |
| 22.9 | BUG-STRESS-05 finance/konkurs-trösklar | ✅ |
| 22.10 | BUG-STRESS-04 cupBracket weather-skip | ✅ |
| 22.11 | CTA-färg + Hörnor + POTM-text | ✅ |
| 22.12 | Rögle stale på dashboard | ✅ |
| 22.13 | Kemi-vy palette-drift | ✅ |
| 22.14 Del A | FormationView + NotesView palette-drift | ✅ |
| 22.15.1 | Dashboard tomrum innan CTA (omg 1) | ✅ Opus direkt |
| 22.15.2 | BottomNav dold under `/game/match` | ✅ Opus direkt |
| 22.15.3 | Events-placering i GranskaScreen | ✅ Code |
| 22.15.4 | Commentary bold-diagnos + fix | ✅ Code |
| 22.15.5 | Anglicism "bryter igenom" → "slår igenom" | ✅ Opus direkt |
| 22.15.6 | Shotmap vit plan + hemma/borta-labels | ✅ Opus direkt |
| 23 | Taktiktavlan del B (coach-rek + tags/quote + översikt + kemi-expand) | ✅ Code |

Stress-test: baseline 41% → 100/100 på 10×10 seeds.

**Processdokument uppdaterade idag:**
- LESSONS.md §10 (as-cast till enum bypassar TypeScript), §14 (asymmetriska state-transitions liga vs cup).
- DECISIONS.md etablerad som ADR-alternativ med 8+ poster.
- CLAUDE.md utökad med LÖPANDE KVALITET-§.
- TEXT_REVIEW_formations_2026-04-20.md kurerad (FORMATION_META + kemi-expand-branches).

---

## SPEC KLAR — REDO ATT IMPLEMENTERAS

### Sprint 23 — Taktiktavlan Del B (UX-omarbetning)

**Status:** LEVERERAD 2026-04-20 av Code.

**Leveransomfattning:**
- B1c `getRecommendedFormation` + grön outline + ★ COACH-badge
- B2c FORMATION_META (anatomy-tags + coach-quotes från TEXT_REVIEW)
- B3c Taktik-översikt överst med klickbar "ändras i lineup"
- B4b Interaktiv kemi med 6 branches (3 aktiva, 3 tysta)
- Inbox-notis vid rekommendationsändring mellan omgångar

**Parkerat från Sprint 23:** Frysning av rekommendation vid `lineupConfirmedThisRound`. Krävde TacticBoardCard-ändring som specen förbjöd. Ej praktiskt problem — truppen förändras inte mid-round.

### Sprint 22.14 Del A — Taktiktavlan palette-drift

**Status:** LEVERERAD i tidigare commit.

### Sprint 24 — Kalibrerings-infrastruktur

**Status:** LEVERERAD 2026-04-20 av Code. 3 commits.

**Leverans:**
- `calibrate.ts` + `calibrate_v2.ts` kompilerar och kör (enum-drift fixad)
- `npm run stress` skriver `stress/season_stats.json` (7179 matcher)
- `npm run analyze-stress` genererar full jämförelserapport mot bandygrytan
- Första mätrapporten sparad

**Första mätrapportens fem gap:**
1. `htLeadWinPct` 87.4% vs 46.6% — halvtidsledare vinner för ofta
2. `drawPct` 7.1% vs 11.6% / `awayWinPct` 45.3% vs 38.3%
3. `avgSuspensionsPerMatch` 0.45 vs 3.77 — motorn triggar utvisning för sällan
4. `cornerGoalPct` 26.0% vs 22.2%
5. `penaltyGoalPct` 0.3% vs 5.4%

### Sprint 25a — Comeback-dynamik (del 1)

**Status:** LEVERERAD 2026-04-20 av Code. 3 commits. Mer-rapport:
- `htLeadWinPct` 87.4% → 86.5% (−0.9pp)
- Comeback −1: 15.2% → 16.5% (+1.3pp)
- Comeback −2: 5.6% → 7.7% (+2.1pp)
- `goalsPerMatch` 10.10 → 10.26 (stabilt)

**Kritisk upptäckt:** `secondHalfGoalMod`/`secondHalfFoulMod` kör bara när `managedIsHome !== undefined`. Stress-testet är headless → bara `trailingBoost` (ändring 2) mättes. Ändring 1 och 3 var död kod i mätningen.

### Sprint 25a.2 — Per-lag mode, bryt ut managed-grinden

**Status:** LEVERERAD 2026-04-20 av Code. 3 commits.

**Resultat (jämfört med 25a):**
- `htLeadWinPct` 86.5% → 83.8% (−2.7pp)
- `drawPct` 7.0% → 8.4% (+1.4pp)
- `awayWinPct` 45.8% → 44.2% (−1.6pp)
- Comeback −1: 16.5% → 18.2% (+1.7pp)
- Comeback −2: 7.7% → 9.6% (+1.9pp)
- `goalsPerMatch` 10.26 → 10.13 (stabilt)

**Slutsats:** Per-lag-mode aktiverades korrekt. Mätinfrastrukturen är nu ärlig. Men strukturellt gap på 37pp återstår i htLeadWinPct — mer parameterjustering räcker inte. Sprint 25b+ behöver ta itu med utvisningsfrekvensen.

**Kvar enligt Code:** `avgSuspensionsPerMatch` 0.45 → 0.47 — foulMod 1.20x påverkar marginellt. Basfrekvensen är problémet, inte multiplikatorn.

### Sprint 24.2 — Scoreline-data med fas-dimension

**Status:** LEVERERAD 2026-04-21 av Code. 3 commits. Rapport:

**Hypoteser testade:**
- Erik (vinstprocent-bias): **bekräftad**. Utvisningar per minut: ledning 1.04x, jämnt 0.91x, underläge 1.04x. Nästan jämnt fördelat.
- Christoffer (minut-60-brytpunkt): **ej bekräftad**. Gradvis eskalering 12 → 27/kmin utan skarp brytpunkt. Trötthet, inte domarbeteende.
- Jacob (slutspels-hemmafördel): **bekräftad**. KVF Spel 1 (högre rankat hemma): 68%. Spel 2 (lägre rankat hemma): 33%. Ranking dominerar. `homeAdvDelta` behöver inte ökas.

**Nyckelgap för 25b/c/d:**
- Utvisningar: motor 2.5/kmin vs bandygrytan 22.5/kmin (9x gap, basfrekvens-problem)
- Straff: motor 0.14/kmin vs bandygrytan 2.7/kmin (19x gap, kräver separat trigger)
- Straff-peak: minut 75-89 (1.35x baseline)

Referensfil: `docs/data/SCORELINE_REFERENCE.md`

---

## AKTIVA JOBB — HOS CODE NU

*(Inget aktivt — playtest pågår, 25e specas efter)*

---

## SENAST LEVERERAT

### Sprint 25b.2.2 + 25d.2 — mini-edits (LEVERERAT 2026-04-21)

**Ändringar gjorda av Opus direkt:**
- `matchCore.ts`: `foulThreshold` 1.25 → 1.46
- `matchUtils.ts`: KVF `homeAdvDelta` 0.03 → 0.06

**Mätutfall:**
- `avgSuspensionsPerMatch` 3.23 → **3.75** ✅ (target 3.77, gap -0.02)
- Grundserie `homeWin%` 45.9% → 46.9% (marginell, -3.3pp kvar)
- KVF `homeWin%` 50.8% → **53.4%** 🔶 (target 60.3%, gap -6.9pp kvar)
- KVF `goalsPerMatch` 9.06 → 9.01 ✅ (target 8.81)
- `htLeadWinPct` 82.8% → 83.2% (stabilt, ej adresserat)
- `cornerGoalPct` ❌ alla faser (strukturellt, hör till 25e)

**Slutsats:** Utvisnings-kalibreringen är klar. KVF hemmafördel fortfarande för låg men `homeAdvDelta` är inte rätt knapp för att sluta gapet — basmotorns hemmafördel är svag överallt (grundserie -3.3pp, KVF -6.9pp). Båda flyttas till Sprint 25e.

**Beslut:** Ingen ytterligare homeAdvDelta-justering. Playtest nu.

---

### Sprint 25b.2 — Höj utvisnings-basfrekvens

**Status:** LEVERERAD 2026-04-21 av Code. 3 commits (inkl. test-uppgradering).

**Ändringar:**
- `wFoul` 12 → 24
- `foulThreshold`-multiplikator 0.55 → 1.25
- Test `seasonSimulation.test.ts` tröskel: `< 2.0` → `< 6.0` (gamla värdet predaterade kalibreringssyftet)

**Resultat:**
- `avgSuspensionsPerMatch` 0.82 → **3.23** (target 3.77, 0.07 under nedre spec-gräns 3.3 — inom slumpvariation)
- `goalsPerMatch` 10.02 → **9.55** ✅ (närmre target 9.12)
- `penaltyGoalPct` 3.7% → 3.4% (stabilt, straff separat trigger)
- `htLeadWinPct` 83.2% → **82.8%** (marginell förbättring — oväntat lite rörelse)
- Comeback −1 18.2% → 18.0% (oförändrat)

**Beslut:** Hoppa över 25b.2.2. 3.23 är brus-nära 3.3 och 25d är billigare nästa steg.

**Observation:** 4x fler utvisningar gav bara 0.4pp sänkning av htLeadWinPct. Powerplay i motorn ger inte tillräcklig fördel för underliggande lag. Misstänkt: `homePenaltyFactor`/`awayPenaltyFactor` = 0.75 är för mild. Hanteras ej i 25d — se Sprint 25e nedan.

---

### Sprint 25b.1 — Separera straff till egen trigger

**Status:** LEVERERAD 2026-04-21 av Code. 3 commits.

**Vad som gjordes:**
- Tog bort `isPenalty` ur foul-sekvensen — alla fouls → utvisningar
- Extraherade `resolvePenaltyTrigger` som nestlad funktion
- Lade till `getPenaltyPeriodMod` / `getScorelinePenaltyMod` (kalibrerade mot bandygrytan)
- Standalone penalty-trigger i attack-blocket (base 0.13, `chanceQuality > 0.40`)
- `isPenaltyGoal?: boolean` i MatchEvent-interface

**Resultat:**
- `penaltyGoalPct` 0.25% → 3.7% ✅ (target 5.4%, acceptabelt intervall 3-7%)
- `goalsPerMatch` 10.02 (stabilt)
- `avgSuspensionsPerMatch` 0.47 → 0.82 (något lägre lyft än väntat ~1.4, hanteras i 25b.2)

**Två buggar hittade under vägen** (loggade som LESSONS §19 och §20):
1. `continue` i matchCore-generatorn hoppade över `yield` → penalty-events nådde aldrig `fix.events`. Fixades med `penaltyFiredThisStep`-flagga.
2. `stats.ts` byggde på Penalty-event-lookup, men `roundProcessor` strippar Penalty-events för minnes-optimering → `penaltyMinutes` alltid tom. Fixades till `ev.isPenaltyGoal ?? false`.

**Öppen fråga för framtida arbete:** Vilka exakta event-typer strippar roundProcessor? Kommentar eller dokumentationsfil behövs.

---

## VILANDE — SPEC:AS HÄRNÄST

### Sprint 25d — Fas-konstanter vs slutspelsdata

Nästa sprint. Verifiera att `PHASE_CONSTANTS` (`goalMod`, `suspMod`, `homeAdvDelta`, `cornerTrailingMod`, `cornerLeadingMod`) matchar ANALYS_SLUTSPEL.md:
- Målsnitt 9.12 → 8.81 → 8.39 → 7.00
- Hörnmål 22.2% → 20.0% → 18.8% → 16.7%
- Hemmafördel starkare i KVF/SF, neutral i final
- Comeback brutalt i KVF (0% från −2), öppet i SF (25% från −2)
- Utvisningar stiger i final (4.08 vs 3.77)

Mest analys-arbete, begränsad kodändring. Ger bekräftelse på om fas-uppdelningen är rimlig innan vi tar nästa stora motor-beslut.

### Sprint 25e — Powerplay-effektivitet (observation från 25b.2)

Observation: 4x fler utvisningar gav bara 0.4pp lägre `htLeadWinPct`. Antyder att motorns straff-på initiativet är för milt. Bandygrytan visar powerplay är ett av de starkaste comeback-verktygen — motorn omsätter det inte.

Möjliga justeringar att utreda:
- `homePenaltyFactor` / `awayPenaltyFactor` 0.75 → 0.55-0.65
- `trailingBoost` 0.11 per måls underläge → högre
- Explicit powerplay-chansboost (mer än bara initiativ-förskjutning)

Tas efter 25d. Kan vara en av flera strukturella ändringar för att sluta htLeadWinPct-gapet.

### Sprint 25f (kandidat) — Domarsystem med personligheter

Identifierat efter playtest-session 2026-04-21. Bandygrytans matchvy ger domare samma visuella plats som tränare — bandy är unikt genom att även assisterande domare är namngivna. Stor del av bandyns kultur som nu saknas i spelet.

**Scope V1 (efter 25e):**
- 6-8 namngivna huvuddomare med personlighet + kvirk (text kureras av Opus)
- "Domarmöte" som alternativ post-match-scen ~20-30% av matcherna
- Relations-tracking per domare (reaktion efter match → effekt på nästa möte)
- Kafferum- och inbox-integration
- refereeService.ts med vägd selektion (mindre chans för samma domare igen)

**Scope V2 (framtiden):**
- Assisterande domare som duor
- Domarnas omdömen av spelare
- "Domär har dålig match"-event

**Estimat:** V1 = 4-6 timmars implementation + kurerad text. Relations-mekaniken är liknande journalist-persona och patron-relation som redan finns.

### Sprint 25g (kandidat) — Matchskador

Identifierat efter playtest-session 2026-04-22. Vi har redan träningsskador via `injuryService.ts`. Matchmotorn har `MatchEventType.Injury` i enum men använder det inte. Matchskador är en del av bandyns karaktär och en sidoeffekt av realistiska matcher — saknas nu.

**Bakgrund:** Första studien på bandyskador sedan tidigt 2000-tal pågår nu (Sandberg/Rosell, LiU, publicerad april 2026 i Bandypuls). Lite forskning att luta sig mot. Baserat på IFK Nässjös egen skadeguide och analogi med närliggande idrotter: allvarliga matchskador 1-3 per lag per säsong, medellånga 4-8, lätta 10-15. Jacobs Stefan Krigh-referens (hälsenan, Tellus-Hammarby derby på Zinkensdamm) är exempel på den sällsynta dramatiska matchskadan — "blod på isen".

**Scope V1 (paketeras med 25f, efter 25e):**

**6 skadetyp-arketyper med frekvenser:**
1. **Skenan** (hälsena/achilles, Krigh-kategorin) — ~1 per 500 matcher, 30-45 omgångars frånvaro
2. **Fall på is** (handled/axel) — ~1 per 40 matcher, 2-4 omgångar
3. **Krock med målstolpe/iskant** — ~1 per 80 matcher, 1-3 omgångar
4. **Bollen i ansiktet** (bruten näsa/tand) — ~1 per 50 matcher, 0-1 omgångar — **ENDAST spelare ≥ 18 år** (juniorer har galler)
5. **Muskelöverbelastning** (ljumske/lår/vad) — ~1 per 25 matcher, 2-5 omgångar
6. **Hjärnskakning** — ~1 per 100 matcher, 1-2 omgångar

**Junior-skyddsregel:**
- `playerAge < 18` → `hasJuniorCage: true`
- Bollen-i-ansiktet-kategorin exkluderas
- Juniorer som debuterar i A-laget har kvar gallret — syns i portträttet, commentary: "17-åringen Andersson — galler fortfarande på hjälmen i Elitseriedebuten"

**Matchbyte-flow vid allvarlig skada:**
- Skada som tvingar spelare utgå (>1 omgångs frånvaro) → match pausas → modal dyker upp
- Liknande `SubstitutionModal` (zIndex 600), visar skärm: "Lindberg utgår. Hälsenan. Välj ersättare."
- Spelaren väljer från bänken — samma UI som halftime-byte
- Vid inaktivitet/avböjande: AI byter automatiskt (lämpligaste bänkspelare för positionen)
- Match fortsätter
- Blåmärken/lätta skador → **ingen modal, bara commentary**

**Blåmärken som narrativ detalj (inte mekanisk skada):**
- Ingen frånvaro, inga byten
- Commentary: "Lindberg tar emot Erikssons direktskott med låret. Haltar till hörnet men stannar kvar."
- Post-match i GranskaScreen: "3 blockerade skott av Andersson. Blåmärken att vårda inför nästa match."
- Trait-bump vid upprepade blockeringar: "tuff" eller "hårdför" byggs upp långsamt
- Supporter-reaktion: "Birger: 'Lindberg lägger kroppen i vägen. Det är sånt man minns.'"

**Integration:**
- Väder (dålig is) och derby-match ökar `injuryChance` via multiplikator
- Trötthet (spelare med morale < 40) ökar också
- **Ny taktikmodifierare: `injuryRiskModifier` i `tacticModifiers.ts`** — kopplar hög press, hög tempo och aggressiv penalty kill till ökad skaderisk. Idag finns `disciplineModifier` och `fatigueRate` men ingen explicit skaderisk-koppling. Taktikvy får då möjlighet att visa en "SKADE-RISK: HÖG"-tagg med faktisk motor-effekt.
- Allvarliga skador triggar inbox: "Lindberg — skadad i matchen mot Boltic. Hälsenan sliten. Åter: säsongsslut."
- Bandydoktorn kommenterar allvarliga skador i kafferum: "Hälsenan är en grym skada. 9 månader. Men han är ung, han kommer tillbaka."
- Presskonferens-trigger vid mittfas-skada: "Hur påverkar förlusten av Lindberg ert slutspel?"

**Scope V2 (framtiden):**
- "Krigh-event" som särskild minneshandelse (tystnad, blod på isen, is-ambulans)
- Hjärnskakningsprotokoll med consult-val (köra på eller byta ut)
- Återkomst-narrativ för långvariga skador
- Bandydoktorn spekulerar om chansen till comeback
- Skadehistorik påverkar spelares framtida transfer-värde

**Estimat V1:** 3-5 timmars implementation + kurerad commentary. Samma storleksordning som 25f (domare).

**Förslag: paketera 25f + 25g till "Sprint 25 — Matchens karaktärer"** — båda är post-match-narrativ som berikar matchen utan att röra motorkärnan. Opus skriver kurerad text för båda parallellt. Code implementerar båda services på en gång. Totalestimat: 8-10h kod + 2-3h text.

### FREDAGSJOBB — Utvidga bandygrytan-scraping med fler event-typer

**Undersökning klar 2026-04-22.** Elitserien och Allsvenskan har exakt samma event-typer i Firebase — ingen skillnad i tillgängliga fält. `bandygrytan_detailed.json` (Elitserien) har redan `shotsHome/Away` och `savesHome/Away` från en äldre scraper. Jobbet fredag gäller enbart `scrape-allsvenskan.mjs`.

**Kända event-typer:**

| Typ | Text | Notering |
|-----|------|----------|
| 11 | Skott på mål | Parat med typ-23 (save) eller typ-2 (mål) inom ~5 sek |
| 23 | Målvakten räddar | teamID = försvarande lag, playerID = målvakten |
| 10 | Frislag | Beviljade frislag |
| 20 | Missad hörna | Hörnor utan skott |
| 107 | Offside | Nytt i nyare format; saknas i Elitserien pre-2023 |

**Täckningsvariation:** Katrineholm–Borlänge 2–1: 15 t11 + 19 t23 (komplett). Bollnäs–Sandviken 6–3: 2+2 (nastan ingenting). Elitseriens gamla data visar generellt bättre konsistens — sannolikt rutinerade matchsekretariat.

**Jobb fredag — kod i `scrape-allsvenskan.mjs`:**

Lägg till i `parseEvents(eventsRaw)`:

```js
const T_SHOT = 11
const T_SAVE = 23
const T_FREESTROKE = 10
const T_OFFSIDE = 107

// Per match, räkna per teamID:
const shotsByTeam = {}
const savesByTeam = {}   // teamID = FÖRSVARANDE lag
let freestrokesHome = 0, freestrokesAway = 0
let offsidesHome = 0, offsidesAway = 0

for (const e of events) {
  if (e.type === T_SHOT && e.teamID) shotsByTeam[e.teamID] = (shotsByTeam[e.teamID]||0)+1
  if (e.type === T_SAVE && e.teamID) savesByTeam[e.teamID] = (savesByTeam[e.teamID]||0)+1
  if (e.type === T_FREESTROKE) {
    if (e.teamID === String(homeTeamId)) freestrokesHome++
    else freestrokesAway++
  }
  if (e.type === T_OFFSIDE) {
    if (e.teamID === String(homeTeamId)) offsidesHome++
    else offsidesAway++
  }
}

const shotsOnGoalHome = shotsByTeam[String(homeTeamId)] || null
const shotsOnGoalAway = shotsByTeam[String(awayTeamId)] || null
const savesHome = savesByTeam[String(homeTeamId)] || null  // hemmalaget räddade (bortas skott)
const savesAway = savesByTeam[String(awayTeamId)] || null

// loggingQuality: baserat på typ-11-täckning
const totalGoals = (fd.homeGoals||0) + (fd.awayGoals||0)
const totalShots = (shotsOnGoalHome||0) + (shotsOnGoalAway||0)
const loggingQuality =
  totalShots >= Math.max(3, totalGoals * 1.5) ? 'full'
  : totalShots >= 3 ? 'partial'
  : 'minimal'
```

Lägg till i return-objektet:
```js
shotsOnGoalHome, shotsOnGoalAway,
savesHome, savesAway,
freestrokesHome, freestrokesAway,
offsidesHome, offsidesAway,
loggingQuality,
```

**Rapport som ska genereras efter körning:**
- Antal matcher per `loggingQuality`-nivå
- Snitt `shotsOnGoal/match` för `full`-matcher (jämförs mot Bandypuls-siffran 28/match)
- Om `full`-snittet ~28: bekräftat, uppdatera `SCORELINE_REFERENCE.md`
- Om `full`-snittet ~20-22: bandygrytan mäter "skott på mål" striktare än Bandypuls, dokumentera skillnaden

**Varför fredag:** Inte akut för motorn — den kör mot Bandypuls-targets. Verifiering och kalibreringsstöd inför Sprint 25e.

---

## PARKERAT — ICKE-KRASCH

### Död kod i MatchEventType-ekosystemet

Sprint 25b.1-utredningen avslöjade att flera enum-värden aldrig emitteras av matchCore men har kvar filtrerings- och renderings-logik i andra filer:

- `YellowCard` — filtreras i roundProcessor, statsProcessor, matchRatings, formatters. Aldrig emitteras. Ärvd från fotbollskod.
- `Shot` — finns som enum men aldrig emitterat. Skott spelas via `fix.report.shotsHome/Away`-räknare i stället.
- `Injury`, `Suspension`, `FullTime` — finns som enum men emitteras aldrig.

Inget är trasigt. Men varje gång någon läser koden måste de räkna ut vad som är aktivt. När vi är klara med motorkalibreringen är det värt att rensa:

- Ta bort döda enum-värden (eller behåll med kommentar "reserved")
- Ta bort filter-kod som aldrig triggar
- Ta bort renderings-kod (emoji, rating-justeringar) för events som aldrig existerar

Uppskattning: 15-30 min rensning, 4-6 filer. Tas ej nu, ligger under `avgSuspensionsPerMatch`-gapet i prioritet.

---

### BUG-STRESS-06 — saveGameSize warnings

Stress-testet varnar för save-game-storlek i långa körningar. Inte krasch, ingen funktionell påverkan. Parkerat sedan 22.8.

**När tas upp:** Om save-games når localStorage 5MB-gräns i verklig spelanvändning, eller om någon säsong kraschar med quota-error.

**Diagnostik-hint vid undersökning:** Kolla `pendingFollowUps`, `playerConversations`, `financeLog`, `narrativeLog` (per spelare, slice(-20) finns men oklart om allt följer den), `storylines`, `bandyLetters`. Även `chemistryStats` växer O(n²) med startelva.

---

## LÖST VIA SÄSONGSKALIBRERING (Sprint 24-serien)

### ~~Matchkalibrering — 13-14 mål/match~~ — löst via infrastruktur

Playtest-observerad siffra (13-14) var statistiskt brus på 10-match-urval. Sprint 24-mätning på 7179 matcher visar `goalsPerMatch` = 10.10-10.26 (acceptabelt intervall mot target 9.12). Inte mer att fixa här specifikt — återstående gap på ~1 mål hanteras sannolikt som sido-effekt av 25b.1/25b.2 (fler utvisningar → fler powerplay → något justering i målfrekvens).

---

---

## VÄNTAR PÅ PLAYTEST-VERIFIERING (efter Sprint 23)

- Taktiktavlan: formations-rekommendation syns med grön outline + ★ COACH
- Rekommendationen flyttar INTE tyst när spelaren valt manuellt
- Inbox-notis kommer vid ny rekommendation (t.ex. efter värvning)
- Tags + coach-quote uppdateras vid formation-byte
- "ändras i lineup" är klickbar länk
- Kemi-par expanderar vid klick, konkret förslag visas (inte generaliteter)
- Ingen expand-text vid neutral kemi eller stark+ihop (gömt)

---

## LÅNGSIKTIGT (EJ AKTIVT)

Från `docs/THE_BOMB.md` och `docs/SPEC_KLUBBUTVECKLING.md`. Listade för att inte glömma — inte nu.

- Ortens kalender (händelser mellan matchdagar)
- Mecenatens middag (interaktiv scen)
- Kommunval (var 4:e säsong, ny kontakt)
- Taktikdjup (hörnplanering som visuell spelplan, motståndaranpassning)
- Share-images (matchhighlight som delbar bild)
- Ljudeffekter (opt-in)
- Halvtidsanalys (momentumgraf, bollinnehav)

---

## DOKUMENT-STATUS

| Fil | Senast uppdaterad | Status |
|-----|-------------------|--------|
| `CLAUDE.md` | 2026-04-21 | Aktuell |
| `LESSONS.md` | 2026-04-21 (§15-18) | Aktuell |
| `DECISIONS.md` | 2026-04-21 | Aktuell |
| `DESIGN_SYSTEM.md` | 2026-04-14 | OK |
| `STATUS.md` | 2026-04-21 | Aktuell |
| `KVAR.md` | 2026-04-21 (förmiddag) | Denna fil |
| `HANDOVER_2026-04-21.md` | 2026-04-21 | Senaste handover |
| `SCORELINE_REFERENCE.md` | 2026-04-21 | Referens för 25b/c/d |
| `SPRINT_25B_1_PENALTY_SEPARATION.md` | 2026-04-21 | Aktiv spec |
| `TEXT_REVIEW_formations_2026-04-20.md` | 2026-04-20 (kväll) | GODKÄND |

---

## NÄSTA SESSION — FÖRESLAGEN ORDNING

1. Läs `CLAUDE.md`, `LESSONS.md`, `DECISIONS.md`, `KVAR.md` (denna), `HANDOVER_2026-04-21.md`.
2. Kontrollera Sprint 25b.1-leveransen (npm run build && npm test grönt, `SPRINT_25B_1_MEASUREMENT.md` finns).
3. Läs mätrapporten — lär specifikt:
   - `penaltyGoalPct` landar inom 3-7%? → ok, gå vidare till 25b.2
   - Landar utanför? → Sprint 25b.1.2 finjusterar base-värdet 0.012
   - Andra sido-effekter på htLeadWinPct, goalsPerMatch?
4. **Sprint 25b.2** (utvisnings-basfrekvens) specas baserat på hur mycket suspensions/match lyfte från 25b.1 och hur mycket som kvarstår till target 3.77.
5. Efter 25b.2 → 25d (fas-konstanter).
6. Uppdatera STATUS.md.
