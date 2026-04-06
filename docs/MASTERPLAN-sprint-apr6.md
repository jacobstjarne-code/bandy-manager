# MASTERPLAN — Sprint 6–7 april 2026

## Ansvarig: Opus (granskning, direktfixar, specskrivning)
## Utförande: Code (specs som kräver build/test)

---

## OPUS DIREKTFIXAR — Session 6 april (KLART)

### Spellogik
| Fix | Fil | Status |
|-----|-----|--------|
| Cup round 3→4 (final) | MatchLiveScreen, matchActions, seasonSummaryService, roundProcessor, CeremonyCupFinal | ✅ |
| Omgångshopp — liga skippas utan lineup | roundProcessor.ts | ✅ |
| Community standing balans (förlust -2, aktiviteter halverade) | roundProcessor.ts | ✅ |
| Straffar deriveras från steps i MatchDoneOverlay/MatchResultScreen | MatchDoneOverlay, MatchResultScreen | ✅ |
| Cup bracket winnerId sätts | matchActions.ts | ✅ |
| Cup i säsongssammanfattning + historik | SeasonSummaryScreen, seasonEndProcessor, HistoryScreen | ✅ |
| Pep-talk memoiserad (useMemo) | StartStep.tsx | ✅ |
| Tabellpilar jämför mot förra omgången (inte förra säsongen) | TabellScreen.tsx | ✅ |
| Form-ordning nyast-till-vänster | TabellScreen.tsx | ✅ |

### UI/Design
| Fix | Fil | Status |
|-----|-----|--------|
| Match-badge borttagen (semantiskt bakvänd) | BottomNav.tsx | ✅ |
| Spelguide overlay (10 FAQ) | GameHeader.tsx | ✅ |
| Lineup-rader tightare (32→24px cirkel, 8→5px padding) | LineupStep.tsx | ✅ |
| Inbox tightare (prick inline, "tryck för att läsa" borttagen) | InboxScreen.tsx | ✅ |
| RoundSummaryScreen helt omskriven | RoundSummaryScreen.tsx | ✅ |
| Omgångssammanfattning visar ligaomgång (inte matchday) | gameFlowActions.ts | ✅ |
| Cup-kort "denna omgång" (jämför mot globalNextMatchday) | DashboardScreen.tsx | ✅ |
| Trainer arc visar reason | DashboardScreen.tsx | ✅ |
| SubstitutionModal: centrerad, rätt design, fitness istf sharpness | SubstitutionModal.tsx | ✅ |
| RenewContract/BidModal: centrerad (inte bottom-sheet) | TransfersScreen.tsx | ✅ |
| Utvisningar rätt sida i Nyckelmoment | MatchResultScreen.tsx | ✅ |
| Straffvinst flavor text | MatchResultScreen.tsx, RoundSummaryScreen.tsx | ✅ |
| Score-färg per lag vid straffar | MatchResultScreen.tsx | ✅ |
| Duplicerade målgörare borttagna | MatchResultScreen.tsx | ✅ |
| FormDots/FormSquares med tap-tooltip | FormDots.tsx (ny), formUtils.ts (ny) | ✅ |
| Tab-beskrivningar integrerade i kort | TabellScreen.tsx | ✅ |

### Orten/Kommun/Mecenater
| Fix | Fil | Status |
|-----|-----|--------|
| Bygdens puls som första sektion med bar + quote | KlubbTab.tsx | ✅ |
| Tabellposition borttagen från Orten | KlubbTab.tsx | ✅ |
| "Hantera sparat spel" borttagen (finns i inställningar) | KlubbTab.tsx | ✅ |
| Styrelsemål i Förväntan & profil | KlubbTab.tsx | ✅ |
| Politiker-knappar med cooldown | KlubbTab.tsx, gameStore.ts | ✅ |
| Kommun relationsbar + agenda-klartext | KlubbTab.tsx | ✅ |
| Mecenat-typografi harmoniserad med kommun + happiness-bar | KlubbTab.tsx | ✅ |
| Mecenat tom-state med förklaring | KlubbTab.tsx | ✅ |
| Dubbla parenteser ((S)) fixat | KlubbTab.tsx | ✅ |
| Faciliteter + Anläggning sammanslagen | KlubbTab.tsx | ✅ |
| Orten-beskrivning "patron" → "mecenater, kommun" | ClubScreen.tsx | ✅ |

### Navigering/Kopplingar
| Fix | Fil | Status |
|-----|-----|--------|
| PlayerLink → transfers (inte trupp) för andra lags spelare | PlayerLink.tsx | ✅ |
| TransfersScreen hanterar highlightPlayer → öppnar BidModal | TransfersScreen.tsx | ✅ |
| CupCard → cupen-flik i TabellScreen | DashboardScreen.tsx, TabellScreen.tsx | ✅ |
| PlayoffBracketCard → TabellScreen | DashboardScreen.tsx | ✅ |
| Eget lag i tabell → säsongsinfo (inte "inga möten") | TabellScreen.tsx | ✅ |

### Cleanup
| Fix | Fil | Status |
|-----|-----|--------|
| standing prop borttagen från KlubbTab | KlubbTab.tsx, ClubScreen.tsx | ✅ |
| FormResult typ-duplicering löst | FormDots.tsx | ✅ |
| Oanvända imports rensade | BottomNav, KlubbTab | ✅ |

---

## CODE SPRINT — 7 april (REDO)

**Huvudspec:** `docs/SPEC-code-sprint-apr7.md`

### Sprint 1: Synliggör dolda system
1. Event-konsekvenser (subtitle med ikoner)
2. Inbox-notiser kommun/mecenat
3. Publik i matchflödet

### Sprint 2: Visuell polish
4. Spelarkort overlay
5. Matchresultat-konsolidering
6. Storylines i kommentarer + press

### Sprint 3: Nya features
7. Anläggningsprojekt startbara
8. Spelarhistorik per säsong
9. Scouting-workflow-koppling

### Restlista
10. R1 "rink" → "plan"
11. R2 BoardMeetingScreen OnboardingShell
12. R10 Styrelsemål-text

---

## SPECS I REPO (alla i docs/)
| Spec | Typ | Status |
|------|-----|--------|
| SPEC-code-sprint-apr7.md | Konsoliderad Code-spec | Redo |
| SPEC-publik-attendance.md | Feature | Redo |
| SPEC-orten-narrativ.md | Feature | Redo |
| SPEC-cup-screen.md | Feature | ✅ Implementerad |
| SPEC-matchresultat-konsolidering.md | Design | Redo |
| FIXSPEC-orten-kommun-ui.md | Bugfix + design | Delvis |
| MASTERPLAN-sprint-apr6.md | Denna fil | Aktuell |
