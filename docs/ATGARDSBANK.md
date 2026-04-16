# BANDY MANAGER — ÅTGÄRDSBANK

**Uppdaterad:** 16 april 2026 (efter Sprint 10)  
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
| BUG-008 | Negativ kassa | ✅ Sprint 4 · Beroende: BUG-014 |
| BUG-009 | Arc resolving cleanup | ✅ Sprint 3 |
| BUG-010 | Lånespelares matcher | 🔴 Sprint 13 · 4h |
| BUG-011 | Determinism matchprofil-seed | 🔴 Sprint 13 · 2h |
| BUG-012 | Klubb-ID ärvt | ✅ Sprint 8 |
| BUG-013 | Forsbacka mecenater | ✅ Sprint 8 |
| BUG-014 | Transfer blockerar utan UI | 🔴 Bugfix-sprint · 1h |
| BUG-015 | Stress-events Math.random | 🔴 Sprint 13 · 15 min |
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
| WEAK-012 | Reputation osynlig | ✅ Sprint 10 — KlubbTab reputation-kort med bar + etikett |
| WEAK-013 | State of Club | ✅ Sprint 10 — PreSeasonScreen LÄGET I KLUBBEN |
| WEAK-014 | Segrarens silence | 🔴 Sprint 12 |
| WEAK-015 | Transfers tyst | ✅ Sprint 4 |
| WEAK-016 | Opponent manager | ✅ Sprint 5 |
| WEAK-017 | Akademin tyst | ✅ Sprint 10 — breakthrough + säsongssammanfattning |
| WEAK-018 | Säsongsstart kontext | ✅ Sprint 10 — BoardMeeting "Truppen just nu" |
| WEAK-019 | Bortamatcher matt | ✅ Sprint 9 |
| WEAK-020 | Slutspel oddsarc | ✅ Sprint 10 — playoffNarrativeService QF/SF/Final |
| WEAK-021 | Omklädningsrum | ✅ Sprint 10 — SquadScreen inre/yttre cirkel |
| WEAK-022 | Ekonomi enkelriktad | 🔴 Post-beta |

---

## 💀 DÖD KOD

| ID | Titel | Status |
|----|-------|--------|
| DEAD-001 | narrativeService | 🔴 Sprint 13 |
| DEAD-002 | rivalryHistory | ⚠️ Sprint 13 |
| DEAD-003 | resolvedEventIds | ⚠️ Sprint 13 |

---

## 🎭 NARRATIVA LUCKOR

| ID | Titel | Status |
|----|-------|--------|
| NARR-001 | Mecenat pension | ✅ Sprint 8 |
| NARR-002 | Ishallens årstider | ✅ Sprint 9 |
| NARR-003 | Visuell matchrytm | 🔴 Sprint 11 |
| NARR-004 | Motståndarspecifik taktik | 🔴 Sprint 11 |
| NARR-005 | Truppledarskap | 🔴 Sprint 11 |
| NARR-006 | Spelarens röst | ✅ Sprint 7 |
| NARR-007 | Arc exit per typ | ✅ Orphan-cleanup |

---

## 🏗️ ARKITEKTUR

| ID | Titel | Status |
|----|-------|--------|
| ARCH-001 | roundProcessor 1200 rader | 🔴 Sprint 13 |
| ARCH-002 | Tre arc-system | 🔴 Sprint 13 |
| ARCH-003 | SaveGame-flaggor | 🔴 Sprint 13 |
| ARCH-004 | pendingEvents prioritet | 🔴 Sprint 13 |
| ARCH-005 | StripCompletedFixture | 🔴 Sprint 13 |
| ARCH-006 | Migrationer | 🟡 Delvis — klubb-ID migration finns |
| ARCH-007 | Seeded random | 🔴 Sprint 13 · Beroende: BUG-015 |
| ARCH-008 | SaveGame.ts 300+ | 🔴 Sprint 13 |

---

## 🎨 VISUELLA INKONSEKVENSER

| ID | Titel | Status |
|----|-------|--------|
| VIS-001 | Dashboard tät | 🔴 Sprint 12 |
| VIS-002 | Emoji-trötthet | 🔴 Sprint 12 |
| VIS-003 | Överskrifter | ✅ Sprint 1 |
| VIS-004 | Knappar hierarki | 🟡 Sprint 1 → Sprint 12 |
| VIS-005 | Röster svajar | 🔴 Sprint 12 |
| VIS-006 | Halvtid vs taktik-modal | 🔴 Sprint 11 |
| VIS-007 | Modals z-index | 🟡 Sprint 1 → Sprint 12 |
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
| DEV-012 | Stress-events | ✅ Sprint 4 · Beroende: BUG-015 |
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

**Status efter Sprint 10:**
- ✅ Klart: **55**
- 🟡 Delvis: 3 (VIS-004, VIS-007, ARCH-006)
- ❄️ Parkerad: 2 (VIS-009, DREAM-017)
- ⚠️ Obekräftad: 2 (DEAD-002, DEAD-003)
- 🔴 Återstår: 19

| Sprint | ✅ |
|--------|---|
| 1 | 5 + 2🟡 |
| 2 | 3 |
| 3 | 5 |
| 4 | 6 |
| 5 | 7 |
| 6 | 5 |
| 7 | 10 |
| 8 | 4 |
| 9 | 6 |
| 10 | 6 |
| Orphans | 3 |
| **Summa** | **55 ✅** |

**Kvar före beta:** Sprint 11 (4 ID, ~5h) + Sprint 12 (4+2🟡 ID, ~5h) + BUG-014 (1h) ≈ **11h Code-tid**  
**Post-beta:** Sprint 13 (~12h) + Sprint 14 (~stora) = arkitektur + drömmar

**Nästa: Sprint 11 (TAKTIK)** — NARR-003, NARR-004, NARR-005, VIS-006
