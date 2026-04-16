# BANDY MANAGER — ÅTGÄRDSBANK

**Uppdaterad:** 16 april 2026 (efter Sprint 6)  
**Syfte:** En levande förteckning över ALLA identifierade problem, svagheter, luckor, idéer och drömmar — från alla granskningsomgångar. Ingenting sammanfattas bort. Varje punkt har eget ID, egen status, egen källa.

---

## HUR DEN HÄR FILEN ANVÄNDS

**Problem vi försöker lösa:** I varje översättningssteg (analys → spec → implementation) tappas 70% av observationerna. Efter tre steg är 3% kvar. Det här är en åtgärdsbank, inte en spec. Syftet är att *behålla allt*.

**Workflow:**
1. När ny analys eller granskning görs — lägg till nya rader, inte ersätt befintliga
2. När du vill jobba med en punkt — peka Code direkt till ID:t
3. När en punkt är klar — markera `✅` i Status och flytta INTE den (vi behöver spåra vad som gjorts)
4. Prioriteringsbeslut tas av Jacob, inte av Claude. Claude föreslår men väljer inte

**Format:**
- ID: `[KATEGORI-NNN]` (t.ex. BUG-001, NARR-007)
- Titel: Kort beskrivning
- Källa: Vem hittade det (Code / Opus / Jacob / Playtest)
- Status: 🔴 Obearbetad / 🟡 Pågår-Delvis / ✅ Klar / ❄️ Parkerad / ⚠️ Obekräftad
- Kostnad: Grovuppskattning
- Beroende: ID som måste vara klart först

---

## 🐛 BUGGAR

### BUG-001 — Trainer arc fastnar i "grind"
- **Källa:** Code
- **Status:** ✅ Sprint 3 — tre oberoende exit-vägar: pos≤4&md≥12, pos≤2&md≥15, 5/8 senaste vinster&md≥18

### BUG-002 — secondHalfShare 0.488 (mål 0.543)
- **Källa:** Kalibrering + Opus
- **Status:** ✅ Sprint 2 — SECOND_HALF_BOOST = 1.25, kalibrering: secondHalfShare 0.535

### BUG-003 — Cup self-pairing guard saknas
- **Källa:** Code-verifiering
- **Status:** ✅ Sprint 2 — defensiv guard i generateCupFixtures

### BUG-004 — Presskonferens community-frågor saknas
- **Källa:** Code-verifiering
- **Status:** ✅ Sprint 2 — 4 community-frågor + override-filtrering

### BUG-005 — Hard-coded hex i interaktions-SVG
- **Källa:** Code
- **Status:** ✅ Sprint 1 — alla hex ersatta med CSS-variabler

### BUG-006 — PenaltyInteraction.tsx:168 blandad gradient
- **Källa:** Code
- **Status:** ✅ Sprint 1 — --danger-dark definierad

### BUG-007 — GoldConfetti.tsx hårdkodade färger
- **Källa:** Code
- **Status:** ✅ Sprint 1 — #FFD700 → var(--match-gold), #F5F1EB → var(--text-light)

### BUG-008 — Negativ klubbkassa stoppas inte
- **Källa:** Code
- **Status:** ✅ Sprint 4 — block i executeTransfer under -100k, inbox-varning -50k till -100k
- **Beroende:** Se BUG-014 för UI-feedback-uppföljning

### BUG-009 — Arc resolving-fas tar aldrig bort arcs
- **Källa:** Code
- **Status:** ✅ Sprint 3 — cleanup efter expiresMatchday + 2

### BUG-010 — Lånespelares matcher räknas inte
- **Källa:** Code
- **Status:** 🔴 (Sprint 13) · 4h

### BUG-011 — Determinism-risk i matchprofil-seed
- **Källa:** Code
- **Status:** 🔴 (Sprint 13) · 2h

### BUG-012 — Klubb-ID ärvt från verkliga klubbar
- **Källa:** Opus
- **Status:** 🔴 (Sprint 8) · 4h + QA

### BUG-013 — Forsbacka får Sandviken-mecenater
- **Källa:** Opus
- **Status:** 🔴 (Sprint 8) — del av BUG-012

### BUG-014 — executeTransfer blockerar utan UI-feedback
- **Källa:** Claude-granskning av Sprint 4-rapport
- **Status:** 🔴 (Sprint 12 eller bugfix-sprint) · 1h
- **Plats:** `executeTransfer` + TransferScreen
- **Beskrivning:** BUG-008 löstes genom att executeTransfer returnerar game oförändrat när köp skulle ge < -100k — men tyst. Användaren trycker "köp" → inget händer → förvirring.
- **Fix-alternativ:**
  - A) `executeTransfer` returnerar `{ game, blockedReason?: string }`. UI visar toast.
  - B) Disable köp-knappen preventativt med tooltip. (Att föredra.)

### BUG-015 — Economic stress-events använder Math.random
- **Källa:** Claude-granskning av Sprint 4-rapport
- **Status:** 🔴 (Sprint 13 — tillsammans med ARCH-007) · 15 min
- **Plats:** `economicStressService.ts`
- **Beskrivning:** Math.random bryter determinism. Fix: byt till `mulberry32(game.seed + currentMatchday)` när ARCH-007 gjorts.

### BUG-016 — Post-match opponent quote implementerad men ej renderad
- **Källa:** Claude-granskning av Sprint 5-rapport
- **Status:** 🔴 (Sprint 7 om ej inkluderad i Sprint 6) · 30 min
- **Plats:** `opponentManagerService.ts` + `GranskaScreen.tsx`
- **Beskrivning:** Sprint 5 implementerade post-match quote-funktionen men kopplade inte in en call-site i GranskaScreen. Funktionen ligger oanvänd, spelaren ser aldrig citatet.
- **Fix:** Hook in i GranskaScreen efter "NYCKELMOMENT"-sektionen — rendera om matchen var storseger/förlust och opponentManager finns.

---

## ⚠️ SVAGA PUNKTER

### WEAK-001 — Grind-loopen saknar narrativ feedback
- **Källa:** Code
- **Status:** ✅ Sprint 3 — grind-hint som 0a-prioritet i DailyBriefing

### WEAK-002 — Presskonferens avskärmad från matchupplevelsen
- **Källa:** Code
- **Status:** ✅ Sprint 5 — inline i GranskaScreen efter nyckelmoment

### WEAK-003 — budgetPriority osynlig under säsongen
- **Källa:** Code
- **Status:** ✅ Sprint 4 — budgetPriority-kort i EkonomiTab

### WEAK-004 — playerConversations osynlig i UI
- **Källa:** Code
- **Status:** 🔴 (Sprint 7)

### WEAK-005 — cornerRecovery påverkar matchen men är osynligt
- **Källa:** Opus
- **Status:** 🔴 (Sprint 7)

### WEAK-006 — Kapten-rollen underutnyttjad
- **Källa:** Opus
- **Status:** 🔴 (Sprint 7)

### WEAK-007 — Nemesis-tracker har kallt slut
- **Källa:** Opus
- **Status:** 🔴 (Sprint 7)

### WEAK-008 — Journalistens minne är tyst
- **Källa:** Opus
- **Status:** ✅ Sprint 5 — findFollowUpQuestion 40% vid sentiment ≤-5

### WEAK-009 — Klackens favoritspelare statisk
- **Källa:** Opus
- **Status:** ✅ Sprint 6 — reevaluateFavoritePlayer + scoreFavorite, anropas var 5:e matchdag, inbox-notis vid byte

### WEAK-010 — Pensionsceremoni saknar "sista säsongen"-arc
- **Källa:** Opus
- **Status:** 🔴 (Sprint 7)

### WEAK-011 — Arenanamnen driver inte narrativet
- **Källa:** Opus
- **Status:** ✅ Sprint 6 — kickoff_home_arena-pool + arena-fråga i win-pool + getWelcomeSong()
- **Beroende:** Verifiera att getWelcomeSong() faktiskt anropas (risk för BUG-016-mönster — funktion finns men inte inkopplad)

### WEAK-012 — Klubb-reputation osynlig
- **Källa:** Opus
- **Status:** 🔴 (Sprint 10)

### WEAK-013 — State of the Club jämförs aldrig
- **Källa:** Opus
- **Status:** 🔴 (Sprint 10)

### WEAK-014 — Segrarens silence
- **Källa:** Code
- **Status:** 🔴 (Sprint 12)

### WEAK-015 — Transfers är tyst transaktionslogik
- **Källa:** Code + Opus
- **Status:** ✅ Sprint 4 — buildTransferStory för kapten/klackfavorit/legend/homegrown/aktiv arc

### WEAK-016 — Motståndarens manager existerar inte
- **Källa:** Code
- **Status:** ✅ Sprint 5 — opponentManager på alla 12 klubbar + pre-match derby-citat
- **Beroende:** Se BUG-016 — post-match quote ej renderad

### WEAK-017 — Akademin är tyst
- **Källa:** Code
- **Status:** 🔴 (Sprint 10)

### WEAK-018 — Säsongsstart saknar kontext
- **Källa:** Code
- **Status:** 🔴 (Sprint 10)

### WEAK-019 — Bortamatcher matt
- **Källa:** Opus
- **Status:** 🔴 (Sprint 9)

### WEAK-020 — Slutspel saknar oddsarc
- **Källa:** Opus
- **Status:** 🔴 (Sprint 10)

### WEAK-021 — Omklädningsrummet frånvarande
- **Källa:** Opus
- **Status:** 🔴 (Sprint 10)

### WEAK-022 — Ekonomin är enkelriktad
- **Källa:** Opus
- **Status:** 🔴 (post-beta)

---

## 💀 DÖD KOD / OANVÄNDA SYSTEM

### DEAD-001 — narrativeService underutnyttjad
- **Källa:** Code
- **Status:** 🔴 (Sprint 13)

### DEAD-002 — rivalryHistory registreras men refereras sällan
- **Källa:** Opus
- **Status:** ⚠️ Obekräftad (Sprint 13)

### DEAD-003 — resolvedEventIds finns men använder vi den?
- **Källa:** Opus
- **Status:** ⚠️ Obekräftad (Sprint 13)

---

## 🎭 NARRATIVA LUCKOR

### NARR-001 — Mecenaten kan inte dö meningsfullt
- **Källa:** Opus
- **Status:** 🔴 (Sprint 8)

### NARR-002 — Ishallens årstider
- **Källa:** Opus
- **Status:** 🔴 (Sprint 9)

### NARR-003 — Ingen visuell matchrytm
- **Källa:** Opus
- **Status:** 🔴 (Sprint 11)

### NARR-004 — Motståndarspecifik taktik saknas
- **Källa:** Opus
- **Status:** 🔴 (Sprint 11)

### NARR-005 — Truppledarskap osynligt
- **Källa:** Opus
- **Status:** 🔴 (Sprint 11)

### NARR-006 — Spelarens egen röst
- **Källa:** Code
- **Status:** 🔴 (Sprint 7)

### NARR-007 — Arc exit-text per typ
- **Källa:** Claude-granskning av Sprint 3-rapport
- **Status:** 🔴 (Sprint 7) · 1h
- **Beskrivning:** Sprint 3 levererade generisk fallback. Ska bli per arc-typ: hungrig_breakthrough, veteran_farewell, lokal_hero, contract_drama, derby_echo.
- **Fix:** Lägg till `resolution: string` på Arc-interfacet. Fyll i texterna i arcService init.

---

## 🏗️ ARKITEKTUR

### ARCH-001 — roundProcessor ~1200 rader
- **Källa:** Code
- **Status:** 🔴 (Sprint 13)

### ARCH-002 — Tre parallella arc-system
- **Källa:** Code
- **Status:** 🔴 (Sprint 13)

### ARCH-003 — SaveGame-flaggor överallt
- **Källa:** Opus
- **Status:** 🔴 (Sprint 13)

### ARCH-004 — pendingEvents utan prioritet
- **Källa:** Opus
- **Status:** 🔴 (Sprint 13)

### ARCH-005 — StripCompletedFixture fragilt
- **Källa:** Opus
- **Status:** 🔴 (Sprint 13)

### ARCH-006 — Migrationer saknas
- **Källa:** Opus
- **Status:** 🔴 (Sprint 13)

### ARCH-007 — Seeded random inkonsistent
- **Källa:** Opus
- **Status:** 🔴 (Sprint 13)
- **Beroende:** BUG-015 är en konkret instans.

### ARCH-008 — SaveGame.ts 300+ rader
- **Källa:** Opus
- **Status:** 🔴 (Sprint 13)

---

## 🎨 VISUELLA INKONSEKVENSER

### VIS-001 — Dashboard för tät
- **Källa:** Opus
- **Status:** 🔴 (Sprint 12)

### VIS-002 — Emoji-trötthet
- **Källa:** Opus
- **Status:** 🔴 (Sprint 12)

### VIS-003 — Inkonsekventa överskrifter
- **Källa:** Opus
- **Status:** ✅ Sprint 1 — SectionLabel utökad, 20+ labels ersatta

### VIS-004 — Knappar olika accenthierarki
- **Källa:** Opus
- **Status:** 🟡 Delvis (Sprint 1) — .btn-primary/.btn-secondary definierade. Ghost + danger + global migration till Sprint 12

### VIS-005 — Röster svajar
- **Källa:** Opus
- **Status:** 🔴 (Sprint 12)

### VIS-006 — Halvtidsmodal vs taktikändring-modal
- **Källa:** Opus
- **Status:** 🔴 (Sprint 11)

### VIS-007 — Modals z-index odefinerat
- **Källa:** Code
- **Status:** 🟡 Delvis (Sprint 1) — tokens definierade, 5 av ~8 migrerade. Ceremonies + CoachMarks till Sprint 12

### VIS-008 — paddingBottom inkonsekvent
- **Källa:** Code
- **Status:** ✅ Sprint 1 — --scroll-padding-bottom: 120px, 4 scroll-ytor migrerade

### VIS-009 — Spelarporträtt generiska
- **Källa:** Jacob + Opus
- **Status:** ❄️ Väntar på assets från Erik

---

## 💡 UTVECKLINGSPOTENTIAL (LÅGODDS)

### DEV-001 — budgetPriority synlig i EkonomiTab
- **Status:** ✅ Sprint 4 (se WEAK-003)

### DEV-002 — Presskonferens direkt efter match
- **Status:** ✅ Sprint 5 (se WEAK-002)

### DEV-003 — Arc exit-signal
- **Status:** 🟡 Delvis (Sprint 3) — generisk text. Per-typ = NARR-007 i Sprint 7.

### DEV-004 — Transfer med historia
- **Status:** ✅ Sprint 4 (se WEAK-015)

### DEV-005 — Grind-exit-hint i DailyBriefing
- **Status:** ✅ Sprint 3 (se WEAK-001)

### DEV-006 — Journalistens minne biter
- **Status:** ✅ Sprint 5 (se WEAK-008)

### DEV-007 — Klackens favoritspelare dynamisk
- **Status:** ✅ Sprint 6 (se WEAK-009)

### DEV-008 — Arenanamn i matchkommentar + press
- **Status:** ✅ Sprint 6 (se WEAK-011)

### DEV-009 — Kapten-ceremoni vid säsongsstart
- **Status:** 🔴 (Sprint 7)

### DEV-010 — Sista-säsongen-arc för veteraner
- **Status:** 🔴 (Sprint 7)

### DEV-011 — Nemesis blir lagkamrat
- **Status:** 🔴 (Sprint 7)

### DEV-012 — Economic stress-events
- **Status:** ✅ Sprint 4 — 3 mikrobeslut, max 1/6 omg
- **Beroende:** Se BUG-015 — Math.random istället för seedad rand.

### DEV-013 — Presskonferens-avslag med konsekvens
- **Status:** ✅ Sprint 5 — critical article när pressRefusals ≥ 3

---

## 🌌 DRÖMMAR

### DREAM-001 — Rivalens röst (citat 1x/säsong)
- **Status:** ✅ Sprint 5 — opponentManager + derby-citat
- **Beroende:** Se BUG-016 — post-match quote ej renderad

### DREAM-002 — Ekonomisk kris som narrativ bana
- **Status:** 🔴 (Sprint 14)

### DREAM-003 — Spridningseffekter
- **Status:** 🔴 (Sprint 14)

### DREAM-004 — Årsrytm med mekanik
- **Status:** 🔴 (Sprint 9)

### DREAM-005 — Bortamatchens scen
- **Status:** 🔴 (Sprint 9)

### DREAM-006 — Omklädningsrum-karta
- **Status:** 🔴 (Sprint 10, ingår i WEAK-021)

### DREAM-007 — Ishallens årstider
- **Status:** 🔴 (Sprint 9 — se NARR-002)

### DREAM-008 — Kollektiva Sverige (leaderboard)
- **Status:** 🔴 (post-beta)
- **Beroende:** BUG-015 + ARCH-007

### DREAM-009 — Podden efter match
- **Status:** 🔴 (post-beta)

### DREAM-010 — Bandybrev till klubben
- **Status:** 🔴 (Sprint 14)

### DREAM-011 — Klubblegenden per klubb
- **Status:** 🔴 (Sprint 14)

### DREAM-012 — Skadelista som medmänsklighet
- **Status:** 🔴 (Sprint 9)

### DREAM-013 — Lagfotografiet
- **Status:** 🔴 (Sprint 14)

### DREAM-014 — Tyst mode
- **Status:** 🔴 (Sprint 14)

### DREAM-015 — Lokaltidningens insändare
- **Status:** ✅ Sprint 6 — insandareService, deterministisk per fixture-id (25%/60% efter derby), renderas i GranskaScreen

### DREAM-016 — Bandyhistorisk skoluppgift
- **Status:** 🔴 (Sprint 14)

### DREAM-017 — Mecenatens middag (interaktiv scen)
- **Status:** 🔴 (Sprint 8)

---

## 📊 STATISTIK

**Totalt antal punkter:** 80  

**Status efter Sprint 6:**
- ✅ Klart: **29 ID:n** (+5 från Sprint 6: WEAK-009/011, DEV-007/008, DREAM-015)
- 🟡 Delvis: 3 (VIS-004, VIS-007, DEV-003)
- ❄️ Parkerad: 1 (VIS-009 — väntar på Erik)
- 🔴 Återstår: 47

**Nästa sprint (Sprint 7 — SPELARLIV):**
- WEAK-004/005/006/007/010, DEV-009/010/011, NARR-006, NARR-007
- Plus ev. BUG-016 om ej gjord i Sprint 6

**Uppskattat återstående kostnad:** ~145h  

---

## SPRINT-MAPPNING

Varje ID har sprint-tillhörighet i parentesen efter Status. Se `docs/sprints/SPRINT_INDEX.md`. Sprint 13 och 14 kan skjutas till efter public beta.
