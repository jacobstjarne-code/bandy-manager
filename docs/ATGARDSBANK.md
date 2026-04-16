# BANDY MANAGER — ÅTGÄRDSBANK

**Uppdaterad:** 16 april 2026 (efter Sprint 13)  
**Syfte:** Levande förteckning över alla identifierade problem, svagheter, luckor, idéer och drömmar.

---

## WORKFLOW

1. Ny analys → lägg till rader, inte ersätt
2. Peka Code direkt till ID
3. Klar → ✅, flytta INTE
4. Prioriteringsbeslut: Jacob

---

## 🐛 BUGGAR

| ID | Titel | Status |
|----|-------|--------|
| BUG-001 | Trainer arc grind | ✅ Sprint 3 |
| BUG-002 | secondHalfShare | ✅ Sprint 2 |
| BUG-003 | Cup self-pairing | ✅ Sprint 2 |
| BUG-004 | Press community-frågor | ✅ Sprint 2 |
| BUG-005 | Hard-coded hex SVG | ✅ Sprint 1 |
| BUG-006 | PenaltyInteraction gradient | ✅ Sprint 1 |
| BUG-007 | GoldConfetti färger | ✅ Sprint 1 |
| BUG-008 | Negativ kassa | ✅ Sprint 4 |
| BUG-009 | Arc resolving cleanup | ✅ Sprint 3 |
| BUG-010 | Lånespelares matcher | ✅ Sprint 13 — stats mergas vid retur |
| BUG-011 | Determinism matchprofil-seed | ✅ Sprint 13 — löst via ARCH-007 fixtureSeed() |
| BUG-012 | Klubb-ID ärvt | ✅ Sprint 8 |
| BUG-013 | Forsbacka mecenater | ✅ Sprint 8 |
| BUG-014 | Transfer blockerar utan UI | 🔴 Bugfix-sprint · 1h |
| BUG-015 | Stress-events Math.random | ❌ **Ej fixad i Sprint 13** — eventFactories.ts:556 har kvar Math.random() · 1 rad |
| BUG-016 | Opponent quote ej renderad | ✅ Orphan-cleanup |
| BUG-017 | getWelcomeSong ej anropad | ✅ Orphan-cleanup |

---

## ⚠️ SVAGA PUNKTER

| ID | Titel | Status |
|----|-------|--------|
| WEAK-001 | Grind feedback | ✅ Sprint 3 |
| WEAK-002 | Press avskärmad | ✅ Sprint 5 |
| WEAK-003 | budgetPriority osynlig | ✅ Sprint 4 |
| WEAK-004 | playerConversations | ✅ Sprint 7 |
| WEAK-005 | cornerRecovery | ✅ Sprint 7 |
| WEAK-006 | Kapten underutnyttjad | ✅ Sprint 7 |
| WEAK-007 | Nemesis kallt slut | ✅ Sprint 7 |
| WEAK-008 | Journalist minne | ✅ Sprint 5 |
| WEAK-009 | Klack favorit statisk | ✅ Sprint 6 |
| WEAK-010 | Pension sista-säsong | ✅ Sprint 7 |
| WEAK-011 | Arenanamn narrativ | ✅ Sprint 6 |
| WEAK-012 | Reputation osynlig | ✅ Sprint 10 |
| WEAK-013 | State of Club | ✅ Sprint 10 |
| WEAK-014 | Segrarens silence | ✅ Sprint 12 |
| WEAK-015 | Transfers tyst | ✅ Sprint 4 |
| WEAK-016 | Opponent manager | ✅ Sprint 5 |
| WEAK-017 | Akademin tyst | ✅ Sprint 10 |
| WEAK-018 | Säsongsstart kontext | ✅ Sprint 10 |
| WEAK-019 | Bortamatcher matt | ✅ Sprint 9 |
| WEAK-020 | Slutspel oddsarc | ✅ Sprint 10 |
| WEAK-021 | Omklädningsrum | ✅ Sprint 10 |
| WEAK-022 | Ekonomi enkelriktad | 🔴 Post-beta |

---

## 💀 DÖD KOD

| ID | Titel | Status |
|----|-------|--------|
| DEAD-001 | narrativeService | ✅ Sprint 13 — aktivt använd i narrativeProcessor |
| DEAD-002 | rivalryHistory | ✅ Sprint 13 — skrivs+läses i narrativeProcessor+roundProcessor, migrering tillagd |
| DEAD-003 | resolvedEventIds | ⚠️ Sprint 13 — migreras men eventService.generateEvents filtrerar inte mot det |

---

## 🎭 NARRATIVA LUCKOR

| ID | Titel | Status |
|----|-------|--------|
| NARR-001 | Mecenat pension | ✅ Sprint 8 |
| NARR-002 | Ishallens årstider | ✅ Sprint 9 |
| NARR-003 | Visuell matchrytm | ✅ Sprint 11 |
| NARR-004 | Motståndarspecifik taktik | ✅ Sprint 11 |
| NARR-005 | Truppledarskap | ✅ Sprint 11 |
| NARR-006 | Spelarens röst | ✅ Sprint 7 |
| NARR-007 | Arc exit per typ | ✅ Orphan-cleanup |

---

## 🏗️ ARKITEKTUR

| ID | Titel | Status |
|----|-------|--------|
| ARCH-001 | roundProcessor 1200 rader | ✅ Sprint 13 — split i narrativeProcessor, mediaProcessor, eventProcessor (1380→1054) |
| ARCH-002 | Tre arc-system | ⚠️ **Skippades Sprint 13** — alltför komplex, hög regressionsrisk. Post-beta. |
| ARCH-003 | SaveGame-flaggor | ⚠️ **Skippades Sprint 13** — pendingScreen-enum berör för många ställen. Post-beta. |
| ARCH-004 | pendingEvents prioritet | ✅ Sprint 13 — getEventPriority() i EventOverlay, högst prio visas först |
| ARCH-005 | StripCompletedFixture | ✅ Sprint 13 — playerRatings behålls för derby/slutspel/blowout (margin ≥3) |
| ARCH-006 | Migrationer | ✅ Sprint 13 — migrationer för rivalryHistory, nemesisTracker, volunteers, volunteerMorale |
| ARCH-007 | Seeded random | ✅ Sprint 13 — fixtureSeed(fixture.id) ersätter Date.now() i matchCore+matchEngine |
| ARCH-008 | SaveGame.ts 300+ | ⚠️ **Skippades Sprint 13** — kräver dedikerad session. Post-beta. |

---

## 🎨 VISUELLA INKONSEKVENSER

| ID | Titel | Status |
|----|-------|--------|
| VIS-001 | Dashboard tät | ✅ Sprint 12 |
| VIS-002 | Emoji-trötthet | ✅ Sprint 12 |
| VIS-003 | Överskrifter | ✅ Sprint 1 |
| VIS-004 | Knappar hierarki | 🔴 Ej rapporterad Sprint 12 — bugfix-sprint |
| VIS-005 | Röster svajar | ✅ Sprint 12 |
| VIS-006 | Halvtid vs taktik-modal | ✅ Sprint 11 |
| VIS-007 | Modals z-index | 🔴 Ej rapporterad Sprint 12 — bugfix-sprint |
| VIS-008 | paddingBottom | ✅ Sprint 1 |
| VIS-009 | Spelarporträtt | ❄️ Erik |

---

## 💡 UTVECKLINGSPOTENTIAL

| ID | Titel | Status |
|----|-------|--------|
| DEV-001 | budgetPriority | ✅ Sprint 4 |
| DEV-002 | Press efter match | ✅ Sprint 5 |
| DEV-003 | Arc exit-signal | ✅ Sprint 3 + orphan |
| DEV-004 | Transfer historia | ✅ Sprint 4 |
| DEV-005 | Grind-hint | ✅ Sprint 3 |
| DEV-006 | Journalist minne | ✅ Sprint 5 |
| DEV-007 | Klack favorit | ✅ Sprint 6 |
| DEV-008 | Arenanamn | ✅ Sprint 6 |
| DEV-009 | Kapten-ceremoni | ✅ Sprint 7 |
| DEV-010 | Sista-säsong-arc | ✅ Sprint 7 |
| DEV-011 | Nemesis lagkamrat | ✅ Sprint 7 |
| DEV-012 | Stress-events | ✅ Sprint 4 |
| DEV-013 | Press-avslag | ✅ Sprint 5 |

---

## 🌌 DRÖMMAR

| ID | Titel | Status |
|----|-------|--------|
| DREAM-001 | Rivalens röst | ✅ Sprint 5 |
| DREAM-002 | Ekonomisk kris-bana | 🔴 Sprint 14 |
| DREAM-003 | Spridningseffekter | 🔴 Sprint 14 |
| DREAM-004 | Årsrytm mekanik | ✅ Sprint 9 |
| DREAM-005 | Bortamatchens scen | ✅ Sprint 9 |
| DREAM-006 | Omklädningsrum-karta | 🔴 Post-beta |
| DREAM-007 | Ishallens årstider | ✅ Sprint 9 |
| DREAM-008 | Leaderboard | 🔴 Post-beta |
| DREAM-009 | Podden | 🔴 Post-beta |
| DREAM-010 | Bandybrev | 🔴 Sprint 14 |
| DREAM-011 | Klubblegend | 🔴 Sprint 14 |
| DREAM-012 | Skadelista | ✅ Sprint 9 |
| DREAM-013 | Lagfoto | 🔴 Sprint 14 |
| DREAM-014 | Tyst mode | 🔴 Sprint 14 |
| DREAM-015 | Insändare | ✅ Sprint 6 |
| DREAM-016 | Skoluppgift | 🔴 Sprint 14 |
| DREAM-017 | Mecenat-middag | ❄️ Post-beta |

---

## 📊 STATISTIK

**Totalt:** 81 punkter

**Status efter Sprint 13:**
- ✅ Klart: **71**
- ⚠️ Skippade/delvis: 4 (ARCH-002/003/008, DEAD-003)
- ❌ Ej fixat: 1 (BUG-015 — 1 rad)
- ❄️ Parkerad: 2 (VIS-009, DREAM-017)
- 🔴 Kvar: 3 pre-beta (BUG-014, VIS-004, VIS-007) + WEAK-022 + 7 drömmar

**BETA-BLOCKERS (bugfix-sprint):**
| ID | Vad | Kostnad |
|----|-----|---------|
| BUG-014 | Disable köp-knapp | 1h |
| BUG-015 | 1 rad Math.random → fixtureSeed | 1 min |
| VIS-004 | ghost/danger-knappar | 30 min |
| VIS-007 | Ceremonies/CoachMarks z-index | 30 min |
| DEAD-003 | resolvedEventIds-filtrering i generateEvents | 30 min |

**Totalt bugfix-sprint: ~3h** → sedan playtest → public beta

**Post-beta backlog:**
- ARCH-002/003/008 (stora refaktorer)
- WEAK-022 (ekonomi)
- Sprint 14 drömmar (7 ID)
- DREAM-006/008/009/017
