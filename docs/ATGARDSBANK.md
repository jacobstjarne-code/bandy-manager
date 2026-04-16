# BANDY MANAGER — ÅTGÄRDSBANK

**Uppdaterad:** 16 april 2026 (efter Sprint 8)  
**Syfte:** En levande förteckning över ALLA identifierade problem, svagheter, luckor, idéer och drömmar. Ingenting sammanfattas bort. Varje punkt har eget ID, egen status, egen källa.

---

## HUR DEN HÄR FILEN ANVÄNDS

1. När ny analys görs — lägg till nya rader, inte ersätt befintliga
2. Peka Code direkt till ID:t
3. Klar → markera ✅ i Status, flytta INTE
4. Prioriteringsbeslut tas av Jacob

---

## 🐛 BUGGAR

### BUG-001 — Trainer arc fastnar i "grind"
- **Status:** ✅ Sprint 3 — tre exit-vägar: pos≤4&md≥12, pos≤2&md≥15, 5/8 senaste vinster&md≥18

### BUG-002 — secondHalfShare 0.488 (mål 0.543)
- **Status:** ✅ Sprint 2 — SECOND_HALF_BOOST = 1.25, secondHalfShare 0.535

### BUG-003 — Cup self-pairing guard saknas
- **Status:** ✅ Sprint 2 — defensiv guard i generateCupFixtures

### BUG-004 — Presskonferens community-frågor saknas
- **Status:** ✅ Sprint 2 — 4 community-frågor + override-filtrering

### BUG-005 — Hard-coded hex i interaktions-SVG
- **Status:** ✅ Sprint 1 — alla hex ersatta med CSS-variabler

### BUG-006 — PenaltyInteraction.tsx:168 blandad gradient
- **Status:** ✅ Sprint 1 — --danger-dark definierad

### BUG-007 — GoldConfetti.tsx hårdkodade färger
- **Status:** ✅ Sprint 1 — var(--match-gold), var(--text-light)

### BUG-008 — Negativ klubbkassa stoppas inte
- **Status:** ✅ Sprint 4 — block i executeTransfer under -100k, inbox-varning -50k till -100k
- **Beroende:** Se BUG-014

### BUG-009 — Arc resolving-fas tar aldrig bort arcs
- **Status:** ✅ Sprint 3 — cleanup efter expiresMatchday + 2

### BUG-010 — Lånespelares matcher räknas inte
- **Status:** 🔴 (Sprint 13) · 4h

### BUG-011 — Determinism-risk i matchprofil-seed
- **Status:** 🔴 (Sprint 13) · 2h

### BUG-012 — Klubb-ID ärvt från verkliga klubbar
- **Status:** ✅ Sprint 8 — 11 klubb-ID:n döpta om (club_sandviken→club_forsbacka etc) i worldGenerator, rivalries, ClubBadge, NewGameScreen, alla tester

### BUG-013 — Forsbacka får Sandviken-mecenater
- **Status:** ✅ Sprint 8 — migreringsblock i saveGameMigration.ts mappar gamla ID:n i managedClubId, clubs, players, fixtures, standings. Körs bara vid träff.

### BUG-014 — executeTransfer blockerar utan UI-feedback
- **Status:** 🔴 (Sprint 12 eller bugfix-sprint) · 1h
- **Plats:** `executeTransfer` + TransferScreen
- **Beskrivning:** BUG-008 löstes tyst. Tryck "köp" → inget händer → förvirring.
- **Fix:** Disable köp-knapp preventativt (alt B) eller returnera blockedReason (alt A).

### BUG-015 — Economic stress-events använder Math.random
- **Status:** 🔴 (Sprint 13 — med ARCH-007) · 15 min
- **Plats:** `economicStressService.ts`

### BUG-016 — Post-match opponent quote implementerad men ej renderad
- **Status:** 🔴 (bugfix-sprint) · 30 min
- **Plats:** `opponentManagerService.ts` + `GranskaScreen.tsx`
- **Beskrivning:** Sprint 5 skapade funktionen. Ej inkopplad i GranskaScreen. Ej adresserad i Sprint 6/7/8.

### BUG-017 — getWelcomeSong() möjligen ej anropad
- **Källa:** Claude-granskning av Sprint 6-rapport
- **Status:** ⚠️ Obekräftad — behöver `grep -rn "getWelcomeSong" src/`
- **Kostnad:** 15 min
- **Beskrivning:** Sprint 6 la till getWelcomeSong() i supporterRituals.ts. Oklart om den anropas från någon render-kod. Om bara 1 grep-träff → samma mönster som BUG-016.

---

## ⚠️ SVAGA PUNKTER

### WEAK-001 — Grind-loopen saknar narrativ feedback
- **Status:** ✅ Sprint 3

### WEAK-002 — Presskonferens avskärmad från matchupplevelsen
- **Status:** ✅ Sprint 5

### WEAK-003 — budgetPriority osynlig under säsongen
- **Status:** ✅ Sprint 4

### WEAK-004 — playerConversations osynlig i UI
- **Status:** ✅ Sprint 7 — "Senaste samtalet: Omg X — för Y omgångar sedan" + gul varning vid ≥5 omg utan samtal

### WEAK-005 — cornerRecovery påverkar matchen men är osynligt
- **Status:** ✅ Sprint 7 — counter_after_corner_slow commentary-pool, backen med lägst cornerRecovery namnges om <50

### WEAK-006 — Kapten-rollen underutnyttjad
- **Status:** ✅ Sprint 7 — kapten-kandidater sorterade, win-fråga i press, crisis-briefing, morale-kaskad −5 vid kapten moral <40

### WEAK-007 — Nemesis-tracker har kallt slut
- **Status:** ✅ Sprint 7 — pension-inbox + tracker-rensning i seasonEndProcessor. Signerad nemesis → 3 diary-followups via pendingFollowUps.

### WEAK-008 — Journalistens minne är tyst
- **Status:** ✅ Sprint 5

### WEAK-009 — Klackens favoritspelare statisk
- **Status:** ✅ Sprint 6

### WEAK-010 — Pensionsceremoni saknar "sista säsongen"-arc
- **Status:** ✅ Sprint 7 — veteran_final_season arc i Narrative.ts + arcService.ts, dagboksnotiser var 4:e omgång, avtacknings-event vid md 22

### WEAK-011 — Arenanamnen driver inte narrativet
- **Status:** ✅ Sprint 6
- **Beroende:** Se BUG-017 — getWelcomeSong möjligen oanropad

### WEAK-012 — Klubb-reputation osynlig
- **Status:** 🔴 (Sprint 10)

### WEAK-013 — State of the Club jämförs aldrig
- **Status:** 🔴 (Sprint 10)

### WEAK-014 — Segrarens silence
- **Status:** 🔴 (Sprint 12)

### WEAK-015 — Transfers är tyst transaktionslogik
- **Status:** ✅ Sprint 4

### WEAK-016 — Motståndarens manager existerar inte
- **Status:** ✅ Sprint 5
- **Beroende:** Se BUG-016

### WEAK-017 — Akademin är tyst
- **Status:** 🔴 (Sprint 10)

### WEAK-018 — Säsongsstart saknar kontext
- **Status:** 🔴 (Sprint 10)

### WEAK-019 — Bortamatcher matt
- **Status:** 🔴 (Sprint 9)

### WEAK-020 — Slutspel saknar oddsarc
- **Status:** 🔴 (Sprint 10)

### WEAK-021 — Omklädningsrummet frånvarande
- **Status:** 🔴 (Sprint 10)

### WEAK-022 — Ekonomin är enkelriktad
- **Status:** 🔴 (post-beta)

---

## 💀 DÖD KOD / OANVÄNDA SYSTEM

### DEAD-001 — narrativeService underutnyttjad
- **Status:** 🔴 (Sprint 13)

### DEAD-002 — rivalryHistory registreras men refereras sällan
- **Status:** ⚠️ Obekräftad (Sprint 13)

### DEAD-003 — resolvedEventIds finns men använder vi den?
- **Status:** ⚠️ Obekräftad (Sprint 13)

---

## 🎭 NARRATIVA LUCKOR

### NARR-001 — Mecenaten kan inte dö meningsfullt
- **Status:** ✅ Sprint 8 — ageMecenater() + checkMecenatRetirement() + 3 val (lyssna/succession/jubileumsmatch). hasAnnouncedRetirement förhindrar upprepning.

### NARR-002 — Ishallens årstider
- **Status:** 🔴 (Sprint 9)

### NARR-003 — Ingen visuell matchrytm
- **Status:** 🔴 (Sprint 11)

### NARR-004 — Motståndarspecifik taktik saknas
- **Status:** 🔴 (Sprint 11)

### NARR-005 — Truppledarskap osynligt
- **Status:** 🔴 (Sprint 11)

### NARR-006 — Spelarens egen röst
- **Status:** ✅ Sprint 7 — playerVoiceService.ts, 20% chans, 8 tillstånd, visas i PlayerCard ovanför KARRIÄRRESA

### NARR-007 — Arc exit-text per typ
- **Status:** 🔴 (ej nämnd i Sprint 7-rapport — fortfarande kvar) · 1h
- **Beskrivning:** Generisk fallback. Ska bli per arc-typ med egen text.

---

## 🏗️ ARKITEKTUR

### ARCH-001 — roundProcessor ~1200 rader
- **Status:** 🔴 (Sprint 13)

### ARCH-002 — Tre parallella arc-system
- **Status:** 🔴 (Sprint 13)

### ARCH-003 — SaveGame-flaggor överallt
- **Status:** 🔴 (Sprint 13)

### ARCH-004 — pendingEvents utan prioritet
- **Status:** 🔴 (Sprint 13)

### ARCH-005 — StripCompletedFixture fragilt
- **Status:** 🔴 (Sprint 13)

### ARCH-006 — Migrationer saknas
- **Status:** 🟡 Delvis — saveGameMigration.ts finns nu (Sprint 8 BUG-013) men bara för klubb-ID. Generell version-baserad migration saknas.

### ARCH-007 — Seeded random inkonsistent
- **Status:** 🔴 (Sprint 13)
- **Beroende:** BUG-015

### ARCH-008 — SaveGame.ts 300+ rader
- **Status:** 🔴 (Sprint 13)

---

## 🎨 VISUELLA INKONSEKVENSER

### VIS-001 — Dashboard för tät
- **Status:** 🔴 (Sprint 12)

### VIS-002 — Emoji-trötthet
- **Status:** 🔴 (Sprint 12)

### VIS-003 — Inkonsekventa överskrifter
- **Status:** ✅ Sprint 1

### VIS-004 — Knappar olika accenthierarki
- **Status:** 🟡 Delvis (Sprint 1) — Ghost + danger + global migration till Sprint 12

### VIS-005 — Röster svajar
- **Status:** 🔴 (Sprint 12)

### VIS-006 — Halvtidsmodal vs taktikändring-modal
- **Status:** 🔴 (Sprint 11)

### VIS-007 — Modals z-index odefinerat
- **Status:** 🟡 Delvis (Sprint 1) — Ceremonies + CoachMarks till Sprint 12

### VIS-008 — paddingBottom inkonsekvent
- **Status:** ✅ Sprint 1

### VIS-009 — Spelarporträtt generiska
- **Status:** ❄️ Väntar på Erik

---

## 💡 UTVECKLINGSPOTENTIAL

### DEV-001 — budgetPriority synlig
- **Status:** ✅ Sprint 4

### DEV-002 — Presskonferens direkt efter match
- **Status:** ✅ Sprint 5

### DEV-003 — Arc exit-signal
- **Status:** 🟡 Delvis (Sprint 3) — generisk text. Per-typ = NARR-007.

### DEV-004 — Transfer med historia
- **Status:** ✅ Sprint 4

### DEV-005 — Grind-exit-hint
- **Status:** ✅ Sprint 3

### DEV-006 — Journalistens minne biter
- **Status:** ✅ Sprint 5

### DEV-007 — Klackens favoritspelare dynamisk
- **Status:** ✅ Sprint 6

### DEV-008 — Arenanamn i matchkommentar + press
- **Status:** ✅ Sprint 6

### DEV-009 — Kapten-ceremoni vid säsongsstart
- **Status:** ✅ Sprint 7 (ingår i WEAK-006)

### DEV-010 — Sista-säsongen-arc för veteraner
- **Status:** ✅ Sprint 7 (ingår i WEAK-010)

### DEV-011 — Nemesis blir lagkamrat
- **Status:** ✅ Sprint 7 — 3 diary-followups via pendingFollowUps vid signering

### DEV-012 — Economic stress-events
- **Status:** ✅ Sprint 4
- **Beroende:** BUG-015

### DEV-013 — Presskonferens-avslag med konsekvens
- **Status:** ✅ Sprint 5

---

## 🌌 DRÖMMAR

### DREAM-001 — Rivalens röst
- **Status:** ✅ Sprint 5 · **Beroende:** BUG-016

### DREAM-002 — Ekonomisk kris som narrativ bana
- **Status:** 🔴 (Sprint 14)

### DREAM-003 — Spridningseffekter
- **Status:** 🔴 (Sprint 14)

### DREAM-004 — Årsrytm med mekanik
- **Status:** 🔴 (Sprint 9)

### DREAM-005 — Bortamatchens scen
- **Status:** 🔴 (Sprint 9)

### DREAM-006 — Omklädningsrum-karta
- **Status:** 🔴 (Sprint 10)

### DREAM-007 — Ishallens årstider
- **Status:** 🔴 (Sprint 9)

### DREAM-008 — Kollektiva Sverige (leaderboard)
- **Status:** 🔴 (post-beta) · **Beroende:** BUG-015 + ARCH-007

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
- **Status:** ✅ Sprint 6

### DREAM-016 — Bandyhistorisk skoluppgift
- **Status:** 🔴 (Sprint 14)

### DREAM-017 — Mecenatens middag (interaktiv scen)
- **Status:** ❄️ Hoppades över i Sprint 8 (markerad optional). Kvar till post-beta eller Sprint 14.

---

## 📊 STATISTIK

**Totalt antal punkter:** 81 (inkl. BUG-014/015/016/017, NARR-007)

**Status efter Sprint 8:**
- ✅ Klart: **40 ID:n**
- 🟡 Delvis: 4 (VIS-004, VIS-007, DEV-003, ARCH-006)
- ❄️ Parkerad: 2 (VIS-009, DREAM-017)
- ⚠️ Obekräftad: 3 (DEAD-002, DEAD-003, BUG-017)
- 🔴 Återstår: 32

**Klart per sprint:**
| Sprint | ID:n klara |
|--------|-----------|
| 1 | 5 ✅ + 2 🟡 |
| 2 | 3 ✅ |
| 3 | 5 ✅ |
| 4 | 6 ✅ |
| 5 | 7 ✅ |
| 6 | 5 ✅ |
| 7 | 10 ✅ |
| 8 | 4 ✅ |
| **Totalt** | **40 ✅** |

**Ej fångade i sprintar (bortglömda/uppskjutna):**
- NARR-007 (arc exit-text per typ) — ej nämnd i Sprint 7
- BUG-016 (opponent quote ej renderad) — ej inkluderad i Sprint 6/7/8
- BUG-017 (getWelcomeSong) — obekräftad

**Nästa sprint (Sprint 9 — VÄRLDEN):**
- WEAK-019, NARR-002, DREAM-004/005/007/012

**Uppskattat återstående kostnad:** ~120h

---

## SPRINT-MAPPNING

Se `docs/sprints/SPRINT_INDEX.md`. Sprint 13 och 14 kan skjutas till efter public beta.
