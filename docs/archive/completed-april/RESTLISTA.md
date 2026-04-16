# RESTLISTA — Uppdaterad 2 april 2026

## ✅ KLART

### Matchday-refaktor
- matchday-fält, buildSeasonCalendar, roundProcessor, alla UI-komponenter

### Gameplay-buggar (alla fixade)
- Bytesbuggen 12→11, lönebudget varnar ej blockerar, max 3 transferbud
- Cup-text, cupmatch penaltyResult, politiker-templates, intensitet borta
- Slutspelfärger, default matchhastighet, "TOPP 8", statistik-flik
- Cup-snabbsim, slutspelsrundor, rundgång efter eliminering
- Spelarnummer, offside bevarad, terminologi

### Positioner (MV, B, YH, MF, A)
- positionShort() i formatters.ts — MV, B, YH, MF, A
- POSITION_ORDER separerade (Goalkeeper 0, Defender 1, Half 2, Midfielder 3, Forward 4)
- Fulla namn: Målvakt, Back, Ytterhalv, Mittfältare, Anfallare

### Utvisningar
- 10 min utvisning = spelaren kommer tillbaka (ingen avstängning)
- Matchstraff = ~2% chans → 1 match avstängd
- Inte längre 1-3 avstängda per match

### Flygande byten
- Bänkspelare får 30-40 min speltid och gamesPlayed +1 per match

### Ekonomi-refaktor
- applyFinanceChange på 9 ställen, EkonomiTab använder calcRoundIncome
- Transaktionshistorik i EkonomiTab
- capacity = rep×7+150, weeklyBase = rep×120

### Playtest stor runda (KRITISKT + VIKTIGT + BÖR GÖRAS)
- Klubbtexter kortade, Erik Ström → back i Forsbacka
- SM-guld år = season+1, SM-final tredje lördagen i mars
- Kontraktsförhandlingar svårare, Bygdens puls reagerar på slutspel
- Presskonferenssvar matchar frågor, taktiktermer på svenska
- Villa-referenser borta, Snittstyrka, juniorlandslag
- Anläggningsuppgradering möjlig, planvy bara nummer
- Styrelsekommentarer korrigerade
- Intro-grafik (Eriks illustration + logotyper)

---

## ❌ KVAR

### Design Sprint R2 (docs/DESIGN_SPRINT_R2.md) — 11 punkter
1. Planvy: samma utseende båda flikar (copper vs grön/orange/röd)
2. Planvy: marginBottom under planvyn
3. Daglig träning: emoji+rubrik på SAMMA rad som SegmentedControl (INTE grid)
4. Intensitet: rundade SegmentedControl-knappar
5. Akademi-knapp: inte fullbredd (maxWidth 200)
6. Inkorg: expand-on-click fungerar inte (mail försvinner)
7. Transfer-flikar: overflow (scrollbar eller kortare labels)
8. RoundSummary: fortfarande otight
9. Event-overlay timing vid snabbsim
10. Ekonomi: verifiera intäktsnivåer
11. 🔴→🏒 i MatchDoneOverlay + MatchResultScreen

### Design Sprint R1 (docs/DESIGN_BUGG_SPRINT.md) — kontrollera
Oklart vilka av punkt 1-18 som faktiskt genomfördes. Verifiera:
- Header-kontrast
- Välj klubb-header konsistens
- Taktik-skärmen tightare
- Matchsammanfattningen tightare
- MatchDoneOverlay blekning
- EventScreen → overlay
- TabellScreen/SquadScreen/TransfersScreen/InboxScreen rubrik bort
- SeasonSummaryScreen/PreSeasonScreen/HistoryScreen card-sharp

### ALL_GAME_COPY.md
Punkt E/21 i PLAYTEST_STOR_RUNDA.md — Jacob vill ha ALL genererad text i ett dokument. Inte skapat ännu.

### B2. Truppfördelning
10 halvbackar/inga mittfältare — behöver verifieras att worldGenerator ger rimlig mix nu med separerade positioner.

---

## ⚠️ BEHÖVER GAMEPLAY-TEST

| # | Vad |
|---|-----|
| T1 | Ekonomi — rimliga intäkter nu? |
| T2 | Akademi — spelare kvar till 20? |
| T3 | Kontraktsförhandlingar — avvisar spelaren ibland? |
| T4 | Utvisningar — ingen massavstängning? |
| T5 | Positioner — rätt fördelning i truppen? |
| T6 | SM-final datum — tredje lördagen i mars? |
| T7 | Bygdens puls — reagerar på slutspel? |

---

## PARKERAT

| # | Vad |
|---|-----|
| P1 | Bandydoktorn API-nyckel (deploy-config på Render) |
