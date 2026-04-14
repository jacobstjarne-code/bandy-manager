# BRIEF: Bandy Manager — Status 14 april 2026

## Vad är Bandy Manager?

Simulerings-managerspel för svensk bandy. TypeScript/React PWA med Zustand. Fiktiv liga med 12 lag, alla bruksorter. Byggs av Jacob (creative director, playtesting) + Erik (grafik, textgranskning) med Claude Opus som granskare/specskrivare och Claude Code (Sonnet) som implementatör via Bury Fen-brandet.

**Repo:** `~/Desktop/code_projects/bandy-manager`
**Tech:** React + TypeScript + Vite, PWA, Zustand, inline styles med CSS-variabler

---

## VAD SOM GJORDES DENNA SESSION (13-14 april)

### Playtesting (25+ buggar funna)
Jacob spelade 2+ säsonger, identifierade buggar via screenshots. Varje bugg root-cause-analyserad och specad med exakt fix.

### Bandygrytan-datainsamling
Code scrapade bandygrytan.se (Firebase SDK) — 420 matcher från Elitserien 2024-25 + 2025-26. Nyckelfynd:

| Mått | Verklighet | Motorn (före) | Motorn (efter kalibrering) |
|------|-----------|--------------|---------------------------|
| Mål/match | 10.0 | ~6-8 | Kalibrerad men EJ verifierad |
| Hörnmål-andel | 23.2% | ~35% | Sänkt |
| Straffmål | 5.1% | 0% | Ny feature implementerad |
| Hemmaseger | 50.7% | ~55% | homeAdvantage 0.05→0.035 |
| 2:a halvlek-mål | 54.3% | ~50% | TIMING_WEIGHTS implementerad |

Stats-fil: `docs/data/bandygrytan_stats.json`

### Implementerat av Code
- **BUG-23:** "Motståndarna var starkare" vid 4-1 vinst → fixat i matchMoodService
- **BUG-24:** Taktikjustering visuellt separerad från pep talk-knappar
- **BUG-25:** Ekonomi-kort kompaktare layout
- **Arenanamn:** Alla 12 klubbar har arenaName + supporterGroupName i CLUB_TEMPLATES. Visas i NextMatchCard, Scoreboard, GranskaScreen, StartStep, MatchReportView
- **Klacknamn:** "Bandykorpen" → "Brukskurvan". Varje klubb har unikt klacknamn
- **Matchmotor-kalibrering:** 6 steg (attack 0.72, transition 0.35, halfchance 0.38, corner 0.14, homeAdvantage 0.035, foulProb 0.62, TIMING_WEIGHTS)
- **Coach marks:** Problemet var saveGameMigration (tutorialSeen → coachMarksSeen), inte implementationen
- **Straffar under match:** penaltyInteractionService + PenaltyInteraction.tsx + yield i matchStepByStep
- **Kaptensmekanism:** captainPlayerId i SaveGame, PreSeason-val, ©-badge i SquadScreen
- **Kalibreringsskript:** scripts/calibrate.ts — 200 matcher med varierad lagstyrka (uppdaterat av Opus)
- **Kodkvalitet:** TIMING_WEIGHTS till modulnivå, arenaName/supporterGroupName required i ClubTemplate, GranskaScreen neutral plan för SM-final, .catch() på resolveWeeklyDecision, ARENA_NAMES dead code borttaget

### Handgjorda arenanamn + klacknamn

| Klubb | Arena | Klack |
|-------|-------|-------|
| Forsbacka | Slagghögen | Järnklacken |
| Söderfors | Ässjan | Hammarsmederna |
| Västanfors | Schaktvallen | Bergskurvan |
| Karlsborg | Bastionen | Norrskensklacken |
| Målilla | Hyttvallen | Glasblåsarna |
| Gagnef | Älvvallen | Dalkurvan |
| Hälleforsnäs | Gjutarvallen | Härdarna |
| Lesjöfors | Kolbottnen | Skogsklacken |
| Rögle | Planlunden | Sydkurvan |
| Slottsbron | Forsvallen | Bropelarna |
| Skutskär | Sulfatvallen | Fabrikskurvan |
| Heros | Hedvallen | Hjältarna |

---

## VAD SOM ÄR KVAR

### Kvar: Buggar (15 st) — `docs/SPRINT_ALLT_KVAR.md`

Code har fått specen men har inte börjat på dessa:

1. ~~Coach marks~~ ✅ LÖST
2. Hörn-SVG knappar krockar (y-positioner kant i kant, "H. hörna" avklippt)
3. Kontraktsförnyelse (verifiera 4 delåtgärder: useState(2), filter, saveSaveGame, nudge)
4. Mecenat spawn (generateMecenat aldrig anropat i roundProcessor)
5. cupRun board objective markeras aldrig failed
6. Troféer lösa på dash → flytta in i CareerStatsCard
7. Form-prickar .reverse() i PlayoffIntroScreen
8. DiamondDivider har flyttat
9. Styrelsemöte dubbelcitat
10. Presskonferens 4-pack (Neutral·Neutral header, alla val 😊, minRound-filter)
11. Kafferum upprepar (lastCoffeeQuoteHash — verifiera sparning)
12. ?-knapp koppar från start → ska vara dämpad
13. Transfers flikar (emojis, badges)
14. paddingBottom 7 skärmar
15. BALANS-1 CS diminishing returns
16. Cupvy saknar resa-kontext (progress-rad ✓→✓→●→○)
17. ~~Arenanamn i Granska~~ ✅ LÖST

### Kvar: Features (1 st)

Straffar ✅ och kapten ✅ är implementerade. Kvar:
- **Hörn-SVG dubbla knappar** — ta bort HTML-zonknappar under SVG (duplicerar)
- **Kalibrering verifiering** — skriptet finns och är uppdaterat med varierad lagstyrka, behöver köras och itereras tills targets nås. Nuvarande motor ger ~5 mål/match med lika lag — med varierad styrka bör det bli närmare 8-10

### Kvar: Kalibreringsstatus

Skriptet (`scripts/calibrate.ts`) uppdaterades i slutet av sessionen att använda realistisk CA-spridning (CLUB_CAS array). **Har inte körts ännu.** Första körningen visade ~5 mål/match med lika lag. Med varierad styrka bör snittet stiga. Om det fortfarande är för lågt → höj goalThreshold-konstanterna ytterligare.

### Observerade men ej specade

- **"Overcast" visas rått i match-UI** — getConditionLabel översätter men buggen kan vara i matchStepByStep commentary
- **beatRival** — parkerad event-driven feature (triggas mid-season efter derbyförlust)
- **Erik-textgranskning** — föreslaget att Erik gör ett TEXT_REVIEW-pass efter buggsprinten

---

## SPEC-DOKUMENT PÅ DISK

### Aktuella (använd dessa)

| Fil | Storlek | Innehåll |
|-----|---------|----------|
| `docs/SPRINT_ALLT_KVAR.md` | 14 KB | **HUVUDDOK** — 15 buggar + features + checklista |
| `docs/THE_BOMB.md` | 8 KB | Vision: korsreferenser, milestones, atmosfär, retention |
| `docs/SPEC_KLUBBUTVECKLING.md` | 10 KB | Ekonomisk progression, utbyggnadsträd, inomhushallen |
| `docs/FIXSPEC_PARKERAT.md` | 43 KB | Fullspecade: presskonferens-scen, transferdödline, rykte |
| `docs/FIXSPEC_KALIBRERING.md` | ~6 KB | Matchmotor-konstanter (redan implementerat) |
| `docs/FIXSPEC_NYA_FEATURES.md` | 10 KB | Arenanamn, klacknamn, straffar, kapten, hörn-SVG |
| `docs/FIXSPEC_COACHMARKS_REWRITE.md` | 10 KB | Coach marks exakt TSX-kod (löst via migrering) |
| `docs/data/bandygrytan_stats.json` | 1.9 KB | Statistik från 420 elitseriematcher |
| `docs/mockups/sprint_allt_kvar_mockups.html` | 22 KB | 5 mockups (straff, cup-progress, kapten, arena) |
| `docs/CODE_SPRINT_PLAYTEST2.md` | ~1 KB | Code-instruktioner (pekar på SPRINT_ALLT_KVAR) |

### Relation mellan visionsdokumenten

```
THE_BOMB.md                    SPEC_KLUBBUTVECKLING.md
(narrativ, atmosfär)           (ekonomi, byggen)
─────────────────              ─────────────────────
Korsreferenser                 Utbyggnadsträd (3 grenar)
Milestone-moments              Ekonomisk tillväxt
State of the Club              Sponsortriggers
Spelarlivscykel                Löneeskalering
Pension/Legend                 Beslutsrytm per säsong
Väder-polish                   Inomhushallen (slutmål)
Matchdagens känsla             Annandagsplanering
Ljud, share-images             Kiosk-dilemma
Transferdödline + rykte        Bandyskola → akademi
```

Tillsammans definierar de vad som gör spelet värt att spela i 5+ säsonger.

---

## DESIGNREGLER (alltid gällande)

**Skrivhjälp:** Undvik AI-ton. Max en "inte X, utan Y" per text. Inga deklarativa öppningar, emoji-listor, eller överdriven fetstil. Sparsamt tankstreck. Prosa före punktlistor.

**CV/brev-mall:** Gill Sans genomgående. Se userMemories för full mall.

**Bandy Manager kodgranskning:** Verifiera ALDRIG komponenter isolerat. Läs alltid PARENT-skärmens filer först. Spåra hela renderflödet. Säg aldrig "✅ exists" — verifiera "✅ renderas korrekt i kontext".

**Bandy Manager unika pelare:** väder/isförhållanden, klubben som samhällsinstitution, spelarnas dubbelliv, hörnor som kärnsystem, utvisningsdynamik, säsongens kompression okt–mars.

---

## REKOMMENDERAD ORDNING FRAMÅT

1. **Code kör buggar** — SPRINT_ALLT_KVAR.md fas 1 (15 buggar)
2. **Jacob playtester** — ny build efter buggar, identifiera nya problem
3. **Code kör kalibrering** — scripts/calibrate.ts med varierad lagstyrka, iterera konstanter
4. **Code kör hörn-SVG** — dubbla knappar + SVG-fix
5. **Sprint 3: Korsreferenser + Milestones** (THE_BOMB sektion 1-2) — mest impact per effort
6. **Sprint 4: Transferdödline + Rykte + State of the Club** (THE_BOMB sektion 3 + 6)
7. **Sprint 5: Klubbutveckling** (SPEC_KLUBBUTVECKLING) — utbyggnadsträd, ekonomi, inomhushall
8. **Erik TEXT_REVIEW** — textgranskning efter sprint 3-4

---

## KONTEXT

Jacob Stjärne, senior executive i aktiv jobbsökning. Bandy Manager byggs parallellt med Erik under Bury Fen-brandet. Projektet är både en genuin produktambition och ett kreativt utlopp. Jacob föredrar direkt, oförskönat samtal — inga diplomatiska omskrivningar.
